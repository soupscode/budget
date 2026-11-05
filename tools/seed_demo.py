#!/usr/bin/env python3
"""Fill a running Budget server with demo data (for screenshots / trying it out).
Usage: python3 tools/seed_demo.py [http://localhost:8080]   — use a throwaway DB!"""
import json
import random
import sys
import urllib.request
from datetime import date, timedelta

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
TODAY = date.today()


def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read() or b"{}")


state = call("GET", f"/api/state?today={TODAY}")
cats = {c["name"]: c["id"] for c in state["categories"]}
budgets = {"Groceries": 550, "Dining": 300, "Transport": 250, "Shopping": 400, "Subscriptions": 100, "Fun": 400}
for n, b in budgets.items():
    call("PUT", f"/api/categories/{cats[n]}", {"budget": b * 100})
for n in ("Health", "Gifts"):
    call("PUT", f"/api/categories/{cats[n]}", {"budget": 0})

visa = call("POST", "/api/cards", {"name": "Everyday Visa", "start_balance": 380000, "apr": 24.99, "min_payment": 8500})["id"]
store = call("POST", "/api/cards", {"name": "Store card", "start_balance": 115000, "apr": 19.49, "min_payment": 2500})["id"]
call("PUT", f"/api/cards/{visa}", {"current_balance": 284000})
call("PUT", f"/api/cards/{store}", {"current_balance": 61000})
call("PUT", "/api/settings", {"debt_plan": 35000, "expected_income": 420000})

bills = {}
for n, a, d, est in [("Rent", 135000, 1, 0), ("Phone", 6500, 12, 0), ("Internet", 6000, 18, 0),
                     ("Electric", 8400, 21, 1), ("Car insurance", 11200, 24, 0)]:
    bills[n] = call("POST", "/api/bills", {"name": n, "amount": a, "due_day": d, "estimate": est})["id"]

month = TODAY.strftime("%Y-%m")
prev = (TODAY.replace(day=1) - timedelta(days=1))
pm = prev.strftime("%Y-%m")
for n in bills:
    call("POST", f"/api/bills/{bills[n]}/pay", {"month": pm})
call("POST", f"/api/bills/{bills['Rent']}/pay", {"month": month, "date": TODAY.replace(day=1).isoformat()})

random.seed(4)
spots = {"Groceries": ["Trader Joe's", "H-E-B", "Aldi"], "Dining": ["Pho Saigon", "Tacos", "Coffee", "Pizza night"],
         "Transport": ["Gas", "Parking"], "Shopping": ["Target", "Amazon"], "Subscriptions": ["Spotify", "iCloud", "Game Pass"],
         "Fun": ["Movies", "Steam sale"]}
# last month: steady spend
for d in range(1, prev.day + 1):
    for n, lo, hi, p in [("Groceries", 20, 70, .3), ("Dining", 8, 30, .35), ("Transport", 25, 45, .15), ("Shopping", 15, 60, .15), ("Fun", 10, 40, .1)]:
        if random.random() < p:
            call("POST", "/api/entries", {"kind": "expense", "amount": random.randint(lo, hi) * 100 + random.choice([0, 49, 99]),
                                          "date": prev.replace(day=d).isoformat(), "category_id": cats[n], "note": random.choice(spots[n])})
for s, a in [("Spotify", 1199), ("iCloud", 299), ("Game Pass", 1999)]:
    call("POST", "/api/entries", {"kind": "expense", "amount": a, "date": prev.replace(day=3).isoformat(), "category_id": cats["Subscriptions"], "note": s})
call("POST", "/api/entries", {"kind": "income", "amount": 210000, "date": prev.replace(day=1).isoformat(), "note": "Paycheck"})
call("POST", "/api/entries", {"kind": "income", "amount": 210000, "date": prev.replace(day=15).isoformat(), "note": "Paycheck"})

# this month so far
this = [(1, "Groceries", 6240, "H-E-B"), (1, "Dining", 2150, "Tacos"), (2, "Transport", 4230, "Gas"), (2, "Dining", 3480, "Pizza night"),
        (3, "Subscriptions", 1199, "Spotify"), (3, "Subscriptions", 1999, "Game Pass"), (3, "Shopping", 6200, "Target"),
        (4, "Groceries", 5100, "Trader Joe's"), (4, "Dining", 2120, "Coffee"), (4, "Fun", 1600, "Steam sale"),
        (5, "Groceries", 2460, "Aldi"), (5, "Dining", 1850, "Lunch with Sam"), (5, "Transport", 1170, "Parking"),
        (5, "Subscriptions", 1402, "iCloud + storage")]
for d, n, a, note in this:
    if d <= TODAY.day:
        card = visa if n in ("Shopping", "Subscriptions") else None
        call("POST", "/api/entries", {"kind": "expense", "amount": a, "date": TODAY.replace(day=d).isoformat(), "category_id": cats[n], "card_id": card, "note": note})
call("POST", "/api/entries", {"kind": "income", "amount": 210000, "date": TODAY.replace(day=1).isoformat(), "note": "Paycheck"})
call("POST", "/api/entries", {"kind": "payment", "amount": 10000, "date": TODAY.replace(day=2).isoformat(), "card_id": store, "note": ""})

for t, tag, done in [("Move $150 to savings", "Money", False), ("Pay phone bill before the 12th", "Bills", False),
                     ("Return the extra headphones", "", False), ("Cancel the unused streaming trial", "", False),
                     ("Log cash expenses", "", True), ("Check rent receipt came through", "", True)]:
    tid = call("POST", "/api/tasks", {"title": t, "tag": tag, "repeat": "daily" if t.startswith("Log") else "none"})["id"]
    if done:
        call("POST", f"/api/tasks/{tid}/toggle", {"today": TODAY.isoformat()})
call("POST", "/api/tasks", {"title": "Call about car insurance renewal", "due": (TODAY + timedelta(days=9)).isoformat()})
print("seeded")
