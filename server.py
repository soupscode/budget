#!/usr/bin/env python3
"""Budget — single-user, self-hosted budget app.

Zero dependencies: Python 3.9+ stdlib (http.server + sqlite3).
Env:
  BUDGET_HOST  bind address   (default 0.0.0.0)
  BUDGET_PORT  port           (default 8080)
  BUDGET_DB    sqlite path    (default ./data/budget.db)
Money is stored as integer cents.
"""
import calendar
import json
import mimetypes
import os
import re
import sqlite3
import sys
import threading
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")
DB_PATH = os.environ.get("BUDGET_DB", os.path.join(ROOT, "data", "budget.db"))
HOST = os.environ.get("BUDGET_HOST", "0.0.0.0")
PORT = int(os.environ.get("BUDGET_PORT", "8080"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#8A9590',
  budget INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, apr REAL NOT NULL DEFAULT 0,
  min_payment INTEGER NOT NULL DEFAULT 0, start_balance INTEGER NOT NULL DEFAULT 0,
  adjust INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 1, estimate INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('expense','income','payment','bill')),
  amount INTEGER NOT NULL, date TEXT NOT NULL, category_id INTEGER, card_id INTEGER,
  bill_id INTEGER, bill_month TEXT, note TEXT NOT NULL DEFAULT '', created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS entries_date ON entries(date);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, tag TEXT NOT NULL DEFAULT '',
  due TEXT, repeat TEXT NOT NULL DEFAULT 'none', done_on TEXT, created TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS hint_snooze (key TEXT PRIMARY KEY, until TEXT NOT NULL);
"""

DEFAULT_SETTINGS = {
    "expected_income": "0",
    "debt_plan": "0",
    "strategy": "avalanche",
    "hints": "on",
    "hints_quiet_until": "",
}

DEFAULT_CATEGORIES = [
    ("Groceries", "#2D7363", 40000), ("Dining", "#C18A3D", 20000),
    ("Transport", "#5A7EA5", 15000), ("Shopping", "#9479AE", 15000),
    ("Subscriptions", "#8A9590", 5000), ("Fun", "#C47A68", 10000),
    ("Health", "#5E9C8F", 5000), ("Gifts", "#B9849E", 0),
]

_lock = threading.Lock()


def db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = db()
    conn.executescript(SCHEMA)
    for k, v in DEFAULT_SETTINGS.items():
        conn.execute("INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)", (k, v))
    if conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0] == 0:
        for i, (n, c, b) in enumerate(DEFAULT_CATEGORIES):
            conn.execute("INSERT INTO categories(name,color,budget,sort) VALUES(?,?,?,?)", (n, c, b, i))
    conn.commit()
    return conn


CONN = None

# ---------------------------------------------------------------- helpers

def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def parse_month(s):
    y, m = map(int, s.split("-"))
    return y, m


def month_str(y, m):
    return f"{y:04d}-{m:02d}"


def shift_month(y, m, d):
    t = y * 12 + (m - 1) + d
    return t // 12, t % 12 + 1


def days_in(y, m):
    return calendar.monthrange(y, m)[1]


def due_date(y, m, day):
    return date(y, m, min(max(1, day), days_in(y, m)))


def rows(sql, args=()):
    return [dict(r) for r in CONN.execute(sql, args).fetchall()]


def settings():
    return {r["key"]: r["value"] for r in CONN.execute("SELECT key,value FROM settings")}


def card_balances():
    out = {}
    for c in rows("SELECT * FROM cards"):
        net = CONN.execute(
            "SELECT COALESCE(SUM(CASE WHEN kind IN ('expense','bill') THEN amount "
            "WHEN kind='payment' THEN -amount ELSE 0 END),0) FROM entries WHERE card_id=?",
            (c["id"],)).fetchone()[0]
        out[c["id"]] = c["start_balance"] + c["adjust"] + net
    return out


def cat_spend(month):
    r = rows("SELECT category_id, SUM(amount) s FROM entries WHERE kind='expense' "
             "AND substr(date,1,7)=? GROUP BY category_id", (month,))
    return {x["category_id"]: x["s"] for x in r}


def cat_spend_through(month, day):
    r = rows("SELECT category_id, SUM(amount) s FROM entries WHERE kind='expense' "
             "AND substr(date,1,7)=? AND CAST(substr(date,9,2) AS INTEGER)<=? GROUP BY category_id",
             (month, day))
    return {x["category_id"]: x["s"] for x in r}


def daily_cumulative(y, m):
    month = month_str(y, m)
    n = days_in(y, m)
    per = [0] * (n + 1)
    for r in rows("SELECT CAST(substr(date,9,2) AS INTEGER) d, SUM(amount) s FROM entries "
                  "WHERE kind='expense' AND substr(date,1,7)=? GROUP BY d", (month,)):
        if 1 <= r["d"] <= n:
            per[r["d"]] += r["s"]
    out, run = [0], 0
    for d in range(1, n + 1):
        run += per[d]
        out.append(run)
    return out


def bill_status(y, m):
    month = month_str(y, m)
    paid = {r["bill_id"]: r for r in rows(
        "SELECT id, bill_id, amount, date FROM entries WHERE kind='bill' AND bill_month=?", (month,))}
    out = []
    for b in rows("SELECT * FROM bills WHERE active=1 ORDER BY due_day, sort, id"):
        p = paid.get(b["id"])
        out.append({**b, "month": month, "due_date": due_date(y, m, b["due_day"]).isoformat(),
                    "paid": bool(p), "paid_entry_id": p["id"] if p else None,
                    "paid_amount": p["amount"] if p else None, "paid_date": p["date"] if p else None})
    return out


def task_list(today):
    out = []
    for t in rows("SELECT * FROM tasks ORDER BY sort, id"):
        if t["repeat"] == "daily":
            t["done"] = t["done_on"] == today
        else:
            t["done"] = bool(t["done_on"])
        out.append(t)
    return out


def money(c):
    v = abs(c) / 100
    return f"${v:,.0f}" if v >= 100 or v == int(v) else f"${v:,.2f}"


# ---------------------------------------------------------------- hints

def compute_hint(today_d):
    """Return at most one gentle hint, or None. Never more than one; snoozable."""
    s = settings()
    if s.get("hints") != "on":
        return None
    t_iso = today_d.isoformat()
    if s.get("hints_quiet_until") and s["hints_quiet_until"] > now_iso():
        return None
    snoozed = {r["key"] for r in rows("SELECT key FROM hint_snooze WHERE until>?", (t_iso,))}
    y, m = today_d.year, today_d.month
    month = month_str(y, m)
    ly, lm = shift_month(y, m, -1)
    lmonth = month_str(ly, lm)
    day = today_d.day
    ndays = days_in(y, m)
    cats = rows("SELECT * FROM categories WHERE archived=0 ORDER BY sort,id")
    spent = cat_spend(month)
    candidates = []

    # 1. Bill coming up soon and not yet marked paid
    for yy, mm in ((y, m), shift_month(y, m, 1)):
        for b in bill_status(yy, mm):
            dd = date.fromisoformat(b["due_date"])
            delta = (dd - today_d).days
            if not b["paid"] and 0 <= delta <= 3:
                when = "today" if delta == 0 else ("tomorrow" if delta == 1 else f"in {delta} days")
                candidates.append((10, {
                    "key": f"bill:{b['id']}:{b['month']}",
                    "title": f"{b['name']} is due {when}.",
                    "body": f"{money(b['amount'])} — tap the circle in Bills once it's paid.",
                }))

    # 2. A category went over budget — suggest where there's room
    roomy = sorted([(c["budget"] - spent.get(c["id"], 0), c) for c in cats if c["budget"] > 0],
                   key=lambda x: -x[0])
    for c in cats:
        sp = spent.get(c["id"], 0)
        if c["budget"] > 0 and sp > c["budget"]:
            over = sp - c["budget"]
            donor = next((r for r in roomy if r[1]["id"] != c["id"] and r[0] >= over * 2), None)
            body = (f"{donor[1]['name']} still has {money(donor[0])} left if you want to shift some over."
                    if donor else "No big deal — worth a glance before the month wraps.")
            candidates.append((8, {"key": f"over:{c['id']}:{month}",
                                   "title": f"{c['name']} is {money(over)} over budget.", "body": body}))

    # 3. Running ahead of last month at the same point
    if day >= 5:
        last_thru = cat_spend_through(lmonth, day)
        for c in cats:
            sp, lp = spent.get(c["id"], 0), last_thru.get(c["id"], 0)
            if c["budget"] <= 0 or lp <= 0 or sp > c["budget"]:
                continue
            ahead = sp - lp
            if ahead >= max(2500, c["budget"] * 0.12):
                left = c["budget"] - sp
                body = (f"Plenty of room still — just a heads-up." if left > c["budget"] * 0.4
                        else f"{money(left)} left for the rest of the month.")
                candidates.append((6, {"key": f"pace:{c['id']}:{month}",
                                       "title": f"{c['name']} is running ~{money(round(ahead / 100) * 100)} ahead of last month.",
                                       "body": body}))

    # 4. Comfortably under pace late in the month — nudge extra to highest-APR card
    budget = sum(c["budget"] for c in cats)
    total_spent = sum(spent.get(c["id"], 0) for c in cats) + spent.get(None, 0)
    bal = card_balances()
    live_cards = [c for c in rows("SELECT * FROM cards WHERE archived=0") if bal.get(c["id"], 0) > 0]
    if budget > 0 and day >= 20 and live_cards:
        expected = budget * day / ndays
        cushion = expected - total_spent
        if cushion > budget * 0.15:
            top = max(live_cards, key=lambda c: c["apr"])
            extra = int(min(cushion * 0.5, bal[top["id"]]) // 2500 * 2500)
            if extra >= 2500:
                saved = extra * top["apr"] / 100
                candidates.append((4, {"key": f"surplus:{month}",
                                       "title": f"You're {money(cushion)} under pace this month.",
                                       "body": f"If it holds, an extra {money(extra)} to {top['name']} "
                                               f"({top['apr']:g}% APR) saves roughly {money(saved)} a year in interest."}))

    # 5. Logging gap (only if the app is clearly in use)
    last = CONN.execute("SELECT MAX(date) FROM entries WHERE kind IN ('expense','income')").fetchone()[0]
    count = CONN.execute("SELECT COUNT(*) FROM entries").fetchone()[0]
    if last and count >= 10:
        gap = (today_d - date.fromisoformat(last)).days
        if gap >= 4:
            candidates.append((2, {"key": f"gap:{last}", "title": f"Nothing logged since {date.fromisoformat(last):%a %b %-d}.",
                                   "body": "Any cash spending to catch up on? No worries if not."}))

    candidates = [c for c in candidates if c[1]["key"] not in snoozed]
    if not candidates:
        return None
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]


# ---------------------------------------------------------------- state

def state(month, today):
    y, m = parse_month(month)
    today_d = date.fromisoformat(today)
    ly, lm = shift_month(y, m, -1)
    s = settings()
    spent = cat_spend(month)
    spent_last = cat_spend(month_str(ly, lm))
    cats = rows("SELECT * FROM categories WHERE archived=0 ORDER BY sort,id")
    for c in cats:
        c["spent"] = spent.get(c["id"], 0)
        c["spent_last"] = spent_last.get(c["id"], 0)
    uncategorized = spent.get(None, 0)

    bal = card_balances()
    cards = rows("SELECT * FROM cards WHERE archived=0 ORDER BY id")
    for c in cards:
        c["balance"] = bal.get(c["id"], 0)
        c["paid_this_month"] = CONN.execute(
            "SELECT COALESCE(SUM(amount),0) FROM entries WHERE kind='payment' AND card_id=? AND substr(date,1,7)=?",
            (c["id"], month)).fetchone()[0]

    entries = rows("SELECT * FROM entries WHERE substr(date,1,7)=? ORDER BY date DESC, id DESC", (month,))
    income = sum(e["amount"] for e in entries if e["kind"] == "income")
    bills_paid = sum(e["amount"] for e in entries if e["kind"] == "bill")
    payments = sum(e["amount"] for e in entries if e["kind"] == "payment")

    # upcoming bills: next unpaid occurrence of each bill relative to today
    cy, cm = today_d.year, today_d.month
    this_b, next_b = bill_status(cy, cm), {b["id"]: b for b in bill_status(*shift_month(cy, cm, 1))}
    upcoming = []
    for b in this_b:
        nb = b if not b["paid"] else next_b.get(b["id"])
        if nb:
            upcoming.append({**nb, "days": (date.fromisoformat(nb["due_date"]) - today_d).days})
    upcoming.sort(key=lambda b: b["due_date"])
    recently_paid = [b for b in this_b if b["paid"]]

    return {
        "today": today, "month": month, "settings": s,
        "categories": cats, "uncategorized": uncategorized,
        "cards": cards, "entries": entries,
        "bills": bill_status(y, m), "upcoming": upcoming, "recently_paid": recently_paid,
        "tasks": task_list(today),
        "totals": {"income": income, "bills": bills_paid, "payments": payments,
                   "spent": sum(spent.values()), "budget": sum(c["budget"] for c in cats)},
        "daily": {"this": daily_cumulative(y, m), "last": daily_cumulative(ly, lm)},
        "hint": compute_hint(today_d),
    }


# ---------------------------------------------------------------- CRUD

FIELDS = {
    "categories": {"name": str, "color": str, "budget": int, "sort": int, "archived": int},
    "cards": {"name": str, "apr": float, "min_payment": int, "start_balance": int, "archived": int},
    "bills": {"name": str, "amount": int, "due_day": int, "estimate": int, "active": int, "sort": int},
    "entries": {"kind": str, "amount": int, "date": str, "category_id": "id", "card_id": "id",
                "note": str},
    "tasks": {"title": str, "tag": str, "due": "optstr", "repeat": str, "sort": int},
}
REQUIRED = {"categories": ["name"], "cards": ["name"], "bills": ["name"],
            "entries": ["kind", "amount", "date"], "tasks": ["title"]}


class BadRequest(Exception):
    pass


def clean(table, body, partial):
    spec = FIELDS[table]
    out = {}
    for k, typ in spec.items():
        if k not in body:
            continue
        v = body[k]
        try:
            if typ == "id":
                v = int(v) if v not in (None, "", 0, "0") else None
            elif typ == "optstr":
                v = str(v).strip() or None if v is not None else None
            elif typ is int:
                v = int(round(float(v)))
            elif typ is float:
                v = float(v)
            else:
                v = str(v).strip()
        except (TypeError, ValueError):
            raise BadRequest(f"bad value for {k}")
        out[k] = v
    if not partial:
        for k in REQUIRED[table]:
            if out.get(k) in (None, ""):
                raise BadRequest(f"{k} is required")
    if table == "entries":
        if "kind" in out and out["kind"] not in ("expense", "income", "payment"):
            raise BadRequest("kind must be expense, income or payment")
        if "amount" in out and out["amount"] <= 0:
            raise BadRequest("amount must be positive")
        if "date" in out:
            try:
                date.fromisoformat(out["date"])
            except ValueError:
                raise BadRequest("bad date")
    if table == "bills" and "due_day" in out and not 1 <= out["due_day"] <= 31:
        raise BadRequest("due_day must be 1–31")
    if table == "tasks" and "repeat" in out and out["repeat"] not in ("none", "daily"):
        raise BadRequest("repeat must be none or daily")
    return out


def create(table, body):
    data = clean(table, body, partial=False)
    if table == "cards":
        data["created"] = now_iso()
        if "current_balance" in body and "start_balance" not in body:
            data["start_balance"] = int(round(float(body["current_balance"])))
    if table in ("entries", "tasks"):
        data["created"] = now_iso()
    if table in ("categories", "bills", "tasks") and "sort" not in data:
        data["sort"] = CONN.execute(f"SELECT COALESCE(MAX(sort),-1)+1 FROM {table}").fetchone()[0]
    cols = ",".join(data)
    q = ",".join("?" * len(data))
    cur = CONN.execute(f"INSERT INTO {table}({cols}) VALUES({q})", list(data.values()))
    CONN.commit()
    return {"id": cur.lastrowid}


def update(table, rid, body):
    data = clean(table, body, partial=True)
    if table == "cards" and "current_balance" in body:
        target = int(round(float(body["current_balance"])))
        cur_bal = card_balances().get(rid, 0)
        row = CONN.execute("SELECT adjust FROM cards WHERE id=?", (rid,)).fetchone()
        if row is None:
            raise BadRequest("not found")
        data["adjust"] = row["adjust"] + (target - cur_bal)
    if not data:
        return {"ok": True}
    sets = ",".join(f"{k}=?" for k in data)
    CONN.execute(f"UPDATE {table} SET {sets} WHERE id=?", [*data.values(), rid])
    CONN.commit()
    return {"ok": True}


def delete(table, rid):
    if table == "categories":
        CONN.execute("UPDATE entries SET category_id=NULL WHERE category_id=?", (rid,))
    if table == "cards":
        CONN.execute("UPDATE entries SET card_id=NULL WHERE card_id=?", (rid,))
    if table == "bills":
        CONN.execute("UPDATE entries SET bill_id=NULL WHERE bill_id=?", (rid,))
    CONN.execute(f"DELETE FROM {table} WHERE id=?", (rid,))
    CONN.commit()
    return {"ok": True}


def pay_bill(bid, body):
    b = CONN.execute("SELECT * FROM bills WHERE id=?", (bid,)).fetchone()
    if not b:
        raise BadRequest("not found")
    month = body.get("month")
    y, m = parse_month(month)
    if CONN.execute("SELECT 1 FROM entries WHERE kind='bill' AND bill_id=? AND bill_month=?",
                    (bid, month)).fetchone():
        return {"ok": True}
    amount = int(body.get("amount") or b["amount"])
    d = body.get("date") or min(date.today(), due_date(y, m, b["due_day"])).isoformat()
    card = body.get("card_id") or None
    CONN.execute("INSERT INTO entries(kind,amount,date,card_id,bill_id,bill_month,note,created) "
                 "VALUES('bill',?,?,?,?,?,?,?)", (amount, d, card, bid, month, b["name"], now_iso()))
    CONN.commit()
    return {"ok": True}


def unpay_bill(bid, body):
    CONN.execute("DELETE FROM entries WHERE kind='bill' AND bill_id=? AND bill_month=?",
                 (bid, body.get("month")))
    CONN.commit()
    return {"ok": True}


def toggle_task(tid, body):
    t = CONN.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
    if not t:
        raise BadRequest("not found")
    today = body.get("today") or date.today().isoformat()
    done_now = (t["done_on"] == today) if t["repeat"] == "daily" else bool(t["done_on"])
    CONN.execute("UPDATE tasks SET done_on=? WHERE id=?", (None if done_now else today, tid))
    CONN.commit()
    return {"ok": True}


def dismiss_hint(body):
    key = str(body.get("key", ""))
    today = date.fromisoformat(body.get("today") or date.today().isoformat())
    days = 30 if key.startswith(("pace:", "over:", "surplus:")) else 7
    CONN.execute("INSERT OR REPLACE INTO hint_snooze(key,until) VALUES(?,?)",
                 (key, (today + timedelta(days=days)).isoformat()))
    # after any dismissal, stay quiet for a day
    CONN.execute("UPDATE settings SET value=? WHERE key='hints_quiet_until'",
                 ((datetime.now() + timedelta(hours=24)).isoformat(timespec="seconds"),))
    CONN.commit()
    return {"ok": True}


def save_settings(body):
    allowed = {"expected_income", "debt_plan", "strategy", "hints"}
    for k, v in body.items():
        if k in allowed:
            CONN.execute("INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)", (k, str(v)))
    CONN.commit()
    return {"ok": True}


def export_all():
    return {t: rows(f"SELECT * FROM {t}") for t in
            ("settings", "categories", "cards", "bills", "entries", "tasks")}


def export_csv():
    cats = {c["id"]: c["name"] for c in rows("SELECT id,name FROM categories")}
    cards = {c["id"]: c["name"] for c in rows("SELECT id,name FROM cards")}
    lines = ["date,kind,amount,category,card,note"]
    for e in rows("SELECT * FROM entries ORDER BY date, id"):
        note = (e["note"] or "").replace('"', '""')
        lines.append(f'{e["date"]},{e["kind"]},{e["amount"]/100:.2f},'
                     f'"{cats.get(e["category_id"], "")}","{cards.get(e["card_id"], "")}","{note}"')
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- HTTP

ROUTES = [
    ("POST", r"^/api/bills/(\d+)/pay$", lambda m, b: pay_bill(int(m[1]), b)),
    ("POST", r"^/api/bills/(\d+)/unpay$", lambda m, b: unpay_bill(int(m[1]), b)),
    ("POST", r"^/api/tasks/(\d+)/toggle$", lambda m, b: toggle_task(int(m[1]), b)),
    ("POST", r"^/api/hints/dismiss$", lambda m, b: dismiss_hint(b)),
    ("PUT", r"^/api/settings$", lambda m, b: save_settings(b)),
    ("POST", r"^/api/(categories|cards|bills|entries|tasks)$", lambda m, b: create(m[1], b)),
    ("PUT", r"^/api/(categories|cards|bills|entries|tasks)/(\d+)$", lambda m, b: update(m[1], int(m[2]), b)),
    ("DELETE", r"^/api/(categories|cards|bills|entries|tasks)/(\d+)$", lambda m, b: delete(m[1], int(m[2]))),
]


class Handler(BaseHTTPRequestHandler):
    server_version = "Budget/1.0"

    def log_message(self, fmt, *args):
        if os.environ.get("BUDGET_LOG"):
            super().log_message(fmt, *args)

    def send(self, code, payload, ctype="application/json", extra=None):
        data = payload if isinstance(payload, bytes) else (
            payload.encode() if isinstance(payload, str) else json.dumps(payload).encode())
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store" if ctype.startswith("application/json") else "no-cache")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if not n:
            return {}
        try:
            return json.loads(self.rfile.read(n))
        except json.JSONDecodeError:
            raise BadRequest("invalid JSON")

    def api(self, method):
        u = urlparse(self.path)
        try:
            with _lock:
                if method == "GET":
                    q = {k: v[0] for k, v in parse_qs(u.query).items()}
                    if u.path == "/api/state":
                        today = q.get("today") or date.today().isoformat()
                        month = q.get("month") or today[:7]
                        if not re.fullmatch(r"\d{4}-\d{2}", month):
                            raise BadRequest("bad month")
                        date.fromisoformat(today)
                        return self.send(200, state(month, today))
                    if u.path == "/api/export.json":
                        return self.send(200, json.dumps(export_all(), indent=1), extra={
                            "Content-Disposition": f'attachment; filename="budget-{date.today()}.json"'})
                    if u.path == "/api/export.csv":
                        return self.send(200, export_csv(), "text/csv", extra={
                            "Content-Disposition": f'attachment; filename="budget-{date.today()}.csv"'})
                    if u.path == "/api/health":
                        return self.send(200, {"ok": True})
                    return self.send(404, {"error": "not found"})
                body = self.body()
                for meth, pat, fn in ROUTES:
                    mt = re.match(pat, u.path)
                    if meth == method and mt:
                        return self.send(200, fn(mt, body))
                return self.send(404, {"error": "not found"})
        except (BadRequest, ValueError) as e:
            return self.send(400, {"error": str(e)})
        except Exception as e:  # noqa
            print("error:", repr(e), file=sys.stderr)
            return self.send(500, {"error": "server error"})

    def static(self):
        path = urlparse(self.path).path
        if path in ("/", "") or not os.path.splitext(path)[1]:
            path = "/index.html"
        full = os.path.normpath(os.path.join(STATIC, path.lstrip("/")))
        if not full.startswith(STATIC) or not os.path.isfile(full):
            return self.send(404, "not found", "text/plain")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if path.endswith(".webmanifest"):
            ctype = "application/manifest+json"
        with open(full, "rb") as f:
            self.send(200, f.read(), ctype + ("; charset=utf-8" if ctype.startswith("text/") or "javascript" in ctype else ""))

    def do_GET(self):
        return self.api("GET") if self.path.startswith("/api/") else self.static()

    do_HEAD = do_GET

    def do_POST(self):
        self.api("POST")

    def do_PUT(self):
        self.api("PUT")

    def do_DELETE(self):
        self.api("DELETE")


def main():
    global CONN
    CONN = init_db()
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Budget running on http://{HOST}:{PORT}  (db: {DB_PATH})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
