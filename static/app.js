/* Budget — single-file vanilla JS front end. No build step. */
"use strict";

/* ---------------------------------------------------------------- icons */
const P = {
  overview:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  spending:'<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2"/><path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="13.5" r="1"/>',
  income:'<polyline points="21 7 13.5 14.5 9.5 10.5 3 17"/><polyline points="15 7 21 7 21 13"/>',
  debt:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><line x1="2.5" y1="10" x2="21.5" y2="10"/><line x1="6" y1="15" x2="9" y2="15"/>',
  bills:'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/>',
  tasks:'<circle cx="12" cy="12" r="9"/><polyline points="8.5 12.2 11 14.5 15.5 9.5"/>',
  plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  check:'<polyline points="5 12.5 10 17 19 7.5"/>',
  cl:'<polyline points="15 18 9 12 15 6"/>',
  cr:'<polyline points="9 18 15 12 9 6"/>',
  arrow:'<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
  x:'<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  bulb:'<path d="M9.5 18h5"/><path d="M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.1h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  settings:'<line x1="4" y1="7" x2="14" y2="7"/><line x1="18" y1="7" x2="20" y2="7"/><circle cx="16" cy="7" r="2"/><line x1="4" y1="17" x2="6" y2="17"/><line x1="10" y1="17" x2="20" y2="17"/><circle cx="8" cy="17" r="2"/>',
  note:'<path d="M5 4h10l4 4v12H5z"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="16" x2="13" y2="16"/>',
  cal:'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/>',
  wallet:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><line x1="2.5" y1="10" x2="21.5" y2="10"/>',
  trash:'<polyline points="4 7 20 7"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>',
  download:'<path d="M12 4v11"/><polyline points="7 10 12 15 17 10"/><line x1="5" y1="20" x2="19" y2="20"/>',
  repeat:'<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/>',
};
const ic = (n, s = 18) => `<svg class="i" viewBox="0 0 24 24" style="width:${s}px;height:${s}px" aria-hidden="true">${P[n]}</svg>`;
const LOGO = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 15.5c2.5 0 3.5-7 7-7s4.5 7 7 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
const PALETTE = ["#2D7363","#C18A3D","#5A7EA5","#9479AE","#8A9590","#C47A68","#5E9C8F","#B9849E","#7D8F4E","#A86F52"];

/* ---------------------------------------------------------------- utils */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => isoDate(new Date());
const parseISO = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d || 1); };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MON = MONTHS.map(m => m.slice(0,3));
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const monthLabel = m => { const [y,mm] = m.split("-").map(Number); return `${MONTHS[mm-1]} ${y}`; };
const shiftMonth = (m, d) => { const [y,mm] = m.split("-").map(Number); const t = y*12 + mm-1 + d; return `${Math.floor(t/12)}-${pad(t%12+1)}`; };
const daysIn = m => { const [y,mm] = m.split("-").map(Number); return new Date(y, mm, 0).getDate(); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
const shortDate = s => { const d = parseISO(s); return `${MON[d.getMonth()]} ${d.getDate()}`; };
function relDays(n){ return n === 0 ? "today" : n === 1 ? "tomorrow" : n < 0 ? `${-n} day${n===-1?"":"s"} ago` : `in ${n} days`; }

function money(c, opt = {}){
  const neg = c < 0, v = Math.abs(c) / 100;
  const cents = opt.cents === true || (opt.cents !== false && Math.round(v*100) % 100 !== 0);
  const s = v.toLocaleString("en-US", {minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0});
  return `${neg ? "−" : ""}${opt.sign && !neg ? "+" : ""}$${s}`;
}
function toCents(str){
  const v = parseFloat(String(str ?? "").replace(/[$,\s]/g, ""));
  return isFinite(v) ? Math.round(v * 100) : NaN;
}
const centsToInput = c => c == null ? "" : (c/100).toFixed(2).replace(/\.00$/, "");

async function api(method, path, body){
  const r = await fetch(path, {method, headers: body ? {"Content-Type":"application/json"} : {}, body: body ? JSON.stringify(body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

/* ---------------------------------------------------------------- state */
let S = null;
const UI = { view: "overview", month: todayISO().slice(0,7), filter: null, sheet: null, strategy: null };
const VIEWS = [["overview","Overview"],["spending","Spending"],["income","Income"],["debt","Debt"],["bills","Bills"],["tasks","Tasks"]];
const TABS = [["overview","Overview"],["spending","Spending"],["debt","Debt"],["bills","Bills"],["tasks","Tasks"]];

async function load(){
  try {
    S = await api("GET", `/api/state?month=${UI.month}&today=${todayISO()}`);
    if (!UI.strategy) UI.strategy = S.settings.strategy || "avalanche";
    render();
  } catch (e) {
    $("#main").innerHTML = `<div class="loading">Couldn't reach the server. ${esc(e.message)}<br><br><button class="btn ghost sm" data-action="reload">Try again</button></div>`;
  }
}
async function act(promise, reload = true){
  try { await promise; if (reload) await load(); }
  catch (e) { toast(e.message); }
}

/* ---------------------------------------------------------------- derived */
const catById = id => S.categories.find(c => c.id === id);
const cardById = id => S.cards.find(c => c.id === id);
const isCurrentMonth = () => S.month === S.today.slice(0,7);
function monthProgress(){
  const n = daysIn(S.month), cur = S.today.slice(0,7);
  const day = S.month === cur ? +S.today.slice(8) : S.month < cur ? n : 0;
  return {n, day};
}
function debtPlan(){
  const mins = S.cards.filter(c => c.balance > 0).reduce((a,c) => a + c.min_payment, 0);
  const set = parseInt(S.settings.debt_plan || "0", 10);
  return {plan: Math.max(set || mins, mins), mins, set};
}

function simulate(cards, budget, strategy){
  let list = cards.filter(c => c.balance > 0).map(c => ({id:c.id, bal:c.balance, apr:c.apr, min:c.min_payment}));
  const res = {months:0, interest:0, payoff:{}, series:[list.map(c => c.bal)], ids:list.map(c=>c.id), never:false, order:[]};
  const sortOrder = () => [...list].filter(c => c.bal > 0).sort(strategy === "snowball" ? (a,b) => a.bal - b.bal || b.apr - a.apr : (a,b) => b.apr - a.apr || a.bal - b.bal);
  res.order = sortOrder().map(c => c.id);
  if (!list.length) return res;
  while (list.some(c => c.bal > 0) && res.months < 600){
    res.months++;
    let interest = 0;
    for (const c of list) if (c.bal > 0){ const i = c.bal * c.apr / 1200; c.bal += i; interest += i; }
    res.interest += interest;
    if (res.months === 1 && budget <= interest){ res.never = true; break; }
    let rem = budget;
    for (const c of list) if (c.bal > 0){ const p = Math.min(c.min, c.bal, rem); c.bal -= p; rem -= p; }
    for (const c of sortOrder()){ if (rem <= 0) break; const p = Math.min(c.bal, rem); c.bal -= p; rem -= p; }
    for (const c of list){ if (c.bal <= 0.5 && !(c.id in res.payoff)){ c.bal = 0; res.payoff[c.id] = res.months; } }
    res.series.push(list.map(c => Math.max(0, c.bal)));
  }
  if (res.months >= 600) res.never = true;
  return res;
}
function monthsOut(n){ const d = parseISO(S.today); d.setDate(1); d.setMonth(d.getMonth() + n); return `${MON[d.getMonth()]} ${d.getFullYear()}`; }

/* ---------------------------------------------------------------- chrome */
function renderChrome(){
  $("#side").innerHTML = `
    <div class="brand"><div class="logo">${LOGO}</div><span>Budget</span></div>
    <nav>${VIEWS.map(([k,t]) => `<button class="nav${UI.view===k?" on":""}" data-action="nav" data-view="${k}">${ic(k)}<span>${t}</span></button>`).join("")}</nav>
    <div class="side-foot">
      <button class="nav${UI.view==="settings"?" on":""}" data-action="nav" data-view="settings">${ic("settings")}<span>Settings</span></button>
      <div class="host" title="${esc(location.host)}"><span class="dot" style="background:var(--accent)"></span><span class="trunc">${esc(location.hostname)}</span></div>
    </div>`;
  $("#tabbar").innerHTML = TABS.map(([k,t]) => `<button class="${UI.view===k || (k==="spending" && UI.view==="income")?"on":""}" data-action="nav" data-view="${k}">${ic(k)}<span>${t}</span></button>`).join("");
  $("#fab").innerHTML = ic("plus");
}
function topBar(title, {eyebrow, month = true, add = true, extra = ""} = {}){
  const d = parseISO(S.today);
  eyebrow = eyebrow ?? null;
  const eb = eyebrow != null ? esc(eyebrow) : `<span class="d-only">${WD[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}</span><span class="m-only">${WD[d.getDay()].slice(0,3)}, ${MON[d.getMonth()]} ${d.getDate()}</span>`;
  return `<div class="top">
    <div><div class="eyebrow">${eb}</div><h1>${esc(title)}</h1></div>
    <div class="actions">
      ${month ? `<div class="month"><button class="ib" data-action="month" data-d="-1" aria-label="Previous month">${ic("cl",16)}</button><span><span class="d-only">${monthLabel(S.month)}</span><span class="m-only">${MONTHS[+S.month.slice(5)-1]}</span></span><button class="ib" data-action="month" data-d="1" aria-label="Next month">${ic("cr",16)}</button></div>` : ""}
      ${extra}
      ${add ? `<button class="btn d-only" data-action="quick-add">${ic("plus")}Add entry<span class="kbd">N</span></button>` : ""}
      ${UI.view === "overview" ? `<button class="icon-btn m-only" data-action="nav" data-view="settings" aria-label="Settings">${ic("settings",20)}</button>` : ""}
    </div></div>`;
}

/* ---------------------------------------------------------------- overview */
function heroCard(){
  const {n, day} = monthProgress();
  const budget = S.totals.budget, spent = S.totals.spent, left = budget - spent;
  const cur = isCurrentMonth(), past = S.month < S.today.slice(0,7);
  const daysLeft = cur ? n - day + 1 : 0;
  let foot = "";
  if (budget > 0){
    if (cur){
      const per = Math.max(0, left) / daysLeft;
      const diff = budget * day / n - spent;
      const paceTxt = Math.abs(diff) < budget * 0.03 ? "On pace with your plan" : diff > 0 ? `${money(diff,{cents:false})} under pace` : `${money(-diff,{cents:false})} ahead of pace`;
      foot = `<span class="pill accent">About ${money(per,{cents:false})} a day</span><span>${paceTxt}</span>`;
    } else if (past) foot = `<span class="pill${left>=0?" accent":""}">${left>=0 ? `${money(left,{cents:false})} under budget` : `${money(-left,{cents:false})} over budget`}</span><span>Month closed</span>`;
    else foot = `<span>Month hasn't started yet</span>`;
  }
  const big = budget > 0 ? left : spent;
  const whole = money(Math.trunc(big/100)*100, {cents:false});
  const c = pad(Math.abs(big) % 100);
  const sub = budget > 0
    ? `of your <b>${money(budget,{cents:false})}</b> flexible budget${cur ? ` · ${daysLeft} day${daysLeft===1?"":"s"} left` : ""}`
    : `spent so far · <button class="link" data-action="nav" data-view="settings">set category budgets</button> to see what's left`;
  const label = budget > 0 ? (left < 0 ? `Over budget in ${MONTHS[+S.month.slice(5)-1]}` : `Left to spend in ${MONTHS[+S.month.slice(5)-1]}`) : `Spent in ${MONTHS[+S.month.slice(5)-1]}`;
  return `<section class="card hero">
    <div class="hero-l">
      <div class="eyebrow">${label}</div>
      <div class="big num${big<0?" neg":""}">${whole}<span class="c">.${c}</span></div>
      <div class="hero-sub">${sub}</div>
      <div class="hero-foot">${foot}</div>
    </div>
    ${spendChart()}
  </section>`;
}
function spendChart(){
  const {n, day} = monthProgress();
  const budget = S.totals.budget;
  const thisS = S.daily.this.slice(0, day + 1);
  const last = S.daily.last, ln = last.length - 1;
  const lastAligned = Array.from({length: n + 1}, (_, d) => last[Math.min(d, ln)]);
  const ymax = Math.max(budget, ...thisS, ...lastAligned, 100) * 1.04;
  const X = d => d / n * 1000, Y = v => 300 - v / ymax * 300;
  const line = arr => arr.map((v,d) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const lastM = MON[+shiftMonth(S.month,-1).slice(5)-1], thisM = MON[+S.month.slice(5)-1];
  const area = thisS.length > 1 ? `M0,300 L${line(thisS).replace(/ /g," L")} L${X(thisS.length-1)},300 Z` : "";
  const lastAt = lastAligned[Math.max(day,0)] || 0;
  const tail = thisS.length ? thisS[thisS.length-1] : 0;
  const labs = budget > 0 ? `<div class="lab" style="top:${Y(budget)/3}%">${money(budget,{cents:false})} budget</div><div class="lab" style="top:${Y(budget/2)/3}%">${money(budget/2,{cents:false})}</div>` : "";
  return `<div class="chart-wrap">
    <div class="row" style="justify-content:space-between"><div class="eyebrow">Spent so far</div>
      <div class="legend"><span><i></i>${thisM}</span>${last[ln] > 0 ? `<span><i class="d"></i>${lastM}</span>` : ""}</div></div>
    <div class="chart">
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D7363" stop-opacity=".18"/><stop offset="1" stop-color="#2D7363" stop-opacity="0"/></linearGradient></defs>
        <line x1="0" y1="299.5" x2="1000" y2="299.5" stroke="#E3E3DD" vector-effect="non-scaling-stroke"/>
        ${budget > 0 ? `<line x1="0" y1="${Y(budget)}" x2="1000" y2="${Y(budget)}" stroke="#EDEDE8" vector-effect="non-scaling-stroke"/>
        <line x1="0" y1="${Y(budget/2)}" x2="1000" y2="${Y(budget/2)}" stroke="#EDEDE8" vector-effect="non-scaling-stroke"/>
        <line x1="0" y1="300" x2="1000" y2="${Y(budget)}" stroke="#D6D9D6" stroke-dasharray="1 5" stroke-linecap="round" stroke-width="1.5" vector-effect="non-scaling-stroke"/>` : ""}
        <polyline points="${line(lastAligned)}" fill="none" stroke="#B9BEBB" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
        ${area ? `<path d="${area}" fill="url(#g)"/>` : ""}
        ${thisS.length > 1 ? `<polyline points="${line(thisS)}" fill="none" stroke="#2D7363" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ""}
      </svg>
      ${labs}
      ${day > 0 ? `<div class="marker" style="left:${X(thisS.length-1)/10}%;top:${Y(tail)/3}%"></div>` : ""}
    </div>
    <div class="axis"><span>${thisM} 1</span><span>${Math.round(n/2)}</span><span>${n}</span></div>
    <div class="chart-foot"><span><b class="num">${money(S.totals.spent)}</b> spent</span><span class="num">${last[ln] > 0 ? `${lastM} at this point: ${money(lastAt)}` : ""}</span></div>
  </div>`;
}
function hintCard(){
  const h = S.hint;
  if (!h || !isCurrentMonth()) return "";
  return `<div class="hint" role="note"><div class="bulb">${ic("bulb")}</div><p><b>${esc(h.title)}</b> ${esc(h.body)}</p><button class="btn ghost sm" data-action="dismiss-hint">Got it</button></div>`;
}
function categoriesCard(limit = 8){
  const cats = S.categories.filter(c => c.budget > 0 || c.spent > 0);
  const total = S.totals.spent;
  const stack = cats.filter(c => c.spent > 0).map(c => `<span style="flex:${c.spent};background:${c.color}" title="${esc(c.name)}"></span>`).join("");
  const rowsH = cats.slice(0, limit).map(catRow).join("");
  return `<section class="card">
    <div class="card-head"><div class="h-card">Spending by category</div><button class="link" data-action="nav" data-view="spending">All ${ic("arrow")}</button></div>
    ${total > 0 ? `<div class="stack">${stack}</div>` : ""}
    ${rowsH || `<div class="empty">No categories with budgets yet. <button data-action="nav" data-view="settings">Set them up</button></div>`}
    <div class="tot"><span>Total spent</span><span class="num"><b>${money(total)}</b>${S.totals.budget ? ` / ${money(S.totals.budget,{cents:false})}` : ""}</span></div>
  </section>`;
}
function catRow(c){
  const pct = c.budget > 0 ? Math.min(100, c.spent / c.budget * 100) : (c.spent > 0 ? 100 : 0);
  const over = c.budget > 0 && c.spent > c.budget;
  return `<div class="crow" data-action="filter-cat" data-id="${c.id}" role="button" tabindex="0">
    <div class="cl"><span class="dot" style="background:${c.color}"></span><span class="trunc">${esc(c.name)}</span>${over ? `<span class="pill warn">${money(c.spent-c.budget,{cents:false})} over</span>` : ""}</div>
    <div class="num cv"><b>${money(c.spent,{cents:false})}</b><span> / ${money(c.budget,{cents:false})}</span></div>
    <div class="bar"><span style="width:${pct.toFixed(1)}%;background:${c.color}"></span></div></div>`;
}
function billsCard(){
  const up = S.upcoming.slice(0, 6), paid = S.recently_paid.slice(0, 2);
  if (!up.length && !paid.length)
    return `<section class="card"><div class="card-head"><div class="h-card">Upcoming bills</div></div><div class="empty">Add rent and other regular bills so you can see what's coming. <button data-action="add-bill">Add a bill</button></div></section>`;
  const [first, ...rest] = up;
  const d = first ? parseISO(first.due_date) : null;
  const firstH = first ? `<div class="next-bill">
      <div class="datebox"><div class="m">${MON[d.getMonth()].toUpperCase()}</div><div class="d">${d.getDate()}</div></div>
      <button class="grow bn-btn" data-action="edit-bill" data-id="${first.id}"><div style="font-weight:600;font-size:15px">${esc(first.name)}</div><div class="muted" style="font-size:13px">Due ${first.days === 0 ? "<b>today</b>" : first.days < 0 ? `<b>${-first.days}d ago</b>` : `in <b>${first.days} day${first.days===1?"":"s"}</b>`}</div></button>
      <div class="num" style="font-weight:600;font-size:17px">${money(first.amount)}</div>
      <button class="chk" data-action="toggle-bill" data-id="${first.id}" data-month="${first.month}" data-paid="0" aria-label="Mark ${esc(first.name)} paid"></button></div>` : "";
  const r = b => `<div class="brow${b.paid?" paid":""}">
      <button class="chk${b.paid?" on":""}" data-action="toggle-bill" data-id="${b.id}" data-month="${b.month}" data-paid="${b.paid?1:0}" aria-label="${b.paid?"Unmark":"Mark"} ${esc(b.name)} paid">${b.paid ? ic("check") : ""}</button>
      <button class="bn bn-btn" data-action="edit-bill" data-id="${b.id}"><div class="trunc">${esc(b.name)}${b.paid ? ` · ${MONTHS[+b.month.slice(5)-1]}` : ""}</div><div class="bs">${shortDate(b.paid ? (b.paid_date||b.due_date) : b.due_date)} · ${b.paid ? "Paid" : b.estimate ? "est." : relDays(b.days)}</div></button>
      <div class="num ba">${money(b.paid ? b.paid_amount : b.amount)}</div></div>`;
  return `<section class="card">
    <div class="card-head"><div class="h-card">Upcoming bills</div><button class="link" data-action="nav" data-view="bills">All ${ic("arrow")}</button></div>
    ${firstH}<div>${rest.map(r).join("")}${paid.map(r).join("")}</div></section>`;
}
function cardsCard(){
  if (!S.cards.length)
    return `<section class="card"><div class="card-head"><div class="h-card">Credit cards</div></div><div class="empty">Track card balances and a payoff plan. <button data-action="add-card">Add a card</button></div></section>`;
  const total = S.cards.reduce((a,c) => a + Math.max(0,c.balance), 0);
  const start = S.cards.reduce((a,c) => a + c.start_balance, 0);
  const down = start - total;
  const since = S.cards.map(c => c.created).sort()[0];
  const pct = start > 0 ? Math.max(0, Math.min(100, down / start * 100)) : 0;
  const {plan} = debtPlan();
  const sim = simulate(S.cards, plan, UI.strategy);
  const free = total <= 0 ? "Debt-free" : sim.never ? "Raise plan to finish" : `Debt-free ${monthsOut(sim.months)}`;
  return `<section class="card">
    <div class="card-head" style="margin-bottom:10px"><div class="h-card">Credit cards</div><button class="link" data-action="nav" data-view="debt">Plan ${ic("arrow")}</button></div>
    <div class="cc-total num">${money(total,{cents:false})}</div>
    <div class="muted" style="font-size:13px;margin-top:2px">total balance${down > 0 ? ` · down ${money(down,{cents:false})} since ${MON[parseISO(since.slice(0,10)).getMonth()]}` : ""}</div>
    <div class="bar" style="margin:16px 0 8px"><span style="width:${pct.toFixed(1)}%"></span></div>
    <div class="row" style="justify-content:space-between;font-size:13px"><span class="muted">${Math.round(pct)}% paid off</span><b style="font-weight:600">${free}</b></div>
    <div class="divider"></div>
    ${S.cards.map(c => `<div class="cc-line"><span class="trunc">${esc(c.name)}</span><span class="muted num">${c.apr.toFixed(2)}%</span><span class="r num">${money(c.balance,{cents:false})}</span></div>`).join("")}
  </section>`;
}
function todaysTasks(){
  const t = S.today;
  return S.tasks.filter(x => (!x.done && (!x.due || x.due <= t)) || (x.done && x.done_on === t) || (x.repeat === "daily"));
}
function taskRow(x){
  const overdue = !x.done && x.due && x.due < S.today;
  const meta = x.repeat === "daily" ? `<span class="meta" title="Repeats daily">${ic("repeat",14)}</span>` : x.due && x.due !== S.today ? `<span class="meta">${overdue ? "Overdue · " : ""}${shortDate(x.due)}</span>` : "";
  return `<div class="trow${x.done?" done":""}">
    <button class="chk${x.done?" on":""}" data-action="toggle-task" data-id="${x.id}" aria-label="${x.done?"Mark not done":"Mark done"}">${x.done ? ic("check") : ""}</button>
    <span class="tt" data-action="edit-task" data-id="${x.id}">${esc(x.title)}</span>
    ${x.tag && !x.done ? `<span class="pill">${esc(x.tag)}</span>` : ""}${meta}</div>`;
}
function tasksCard(){
  const list = todaysTasks().sort((a,b) => a.done - b.done);
  const done = list.filter(x => x.done).length;
  return `<section class="card">
    <div class="card-head" style="margin-bottom:8px"><div class="h-card">Today</div><span class="muted" style="font-size:13px">${list.length ? `${done} of ${list.length} done` : ""}</span></div>
    <div>${list.slice(0, 8).map(taskRow).join("")}</div>
    <label class="add-row">${ic("plus",16)}<input data-enter="add-task" placeholder="Add a task" aria-label="Add a task" enterkeyhint="done"></label>
  </section>`;
}
function incomeCard(){
  const exp = parseInt(S.settings.expected_income || "0", 10), got = S.totals.income;
  const inc = S.entries.filter(e => e.kind === "income").slice(0, 3);
  const pct = exp > 0 ? Math.min(100, got / exp * 100) : 0;
  return `<section class="card">
    <div class="card-head" style="margin-bottom:12px"><button class="h-card" data-action="nav" data-view="income">Income</button><span class="num" style="font-weight:600">${money(got,{cents:false})}${exp ? `<span class="muted" style="font-weight:400"> / ${money(exp,{cents:false})}</span>` : ""}</span></div>
    ${exp ? `<div class="bar" style="margin-bottom:12px"><span style="width:${pct.toFixed(1)}%"></span></div>` : ""}
    ${inc.length ? inc.map(e => `<div class="row" style="justify-content:space-between;padding:5px 0;font-size:13px;cursor:pointer" data-action="edit-entry" data-id="${e.id}"><span class="trunc">${esc(e.note || "Income")} · ${shortDate(e.date)}</span><span class="pill accent">${money(e.amount,{cents:false})}</span></div>`).join("")
      : `<div class="empty" style="padding:4px 0">Nothing logged yet this month.</div>`}
  </section>`;
}
function viewOverview(){
  return `${topBar("Overview")}
  <div class="ov">
    <div class="ov-main">
      ${heroCard()}
      ${hintCard()}
      <div class="ov-pair">${categoriesCard()}${billsCard()}</div>
    </div>
    <div class="ov-side">${cardsCard()}${tasksCard()}${incomeCard()}</div>
  </div>`;
}

/* ---------------------------------------------------------------- spending / income */
function entryRow(e){
  const cat = catById(e.category_id), card = cardById(e.card_id);
  let color = "#B9BEBB", letter = "•", name = e.note, sub = [];
  if (e.kind === "expense"){ color = cat?.color || "#8A9590"; letter = (cat?.name || "?")[0]; name = e.note || cat?.name || "Expense"; sub.push(cat?.name || "Uncategorized"); }
  if (e.kind === "bill"){ color = "#6F7A75"; letter = "B"; name = e.note || "Bill"; sub.push("Bill"); }
  if (e.kind === "payment"){ color = "#5A7EA5"; letter = "↓"; name = `Payment · ${card?.name || "card"}`; sub.push(e.note || "Debt payment"); }
  if (e.kind === "income"){ color = "#2D7363"; letter = "+"; name = e.note || "Income"; sub.push("Income"); }
  if (card && e.kind !== "payment") sub.push(card.name);
  const pos = e.kind === "income";
  return `<div class="erow" data-action="edit-entry" data-id="${e.id}" role="button" tabindex="0">
    <div class="eicon" style="background:${color}">${esc(letter)}</div>
    <div class="grow"><div class="en trunc">${esc(name)}</div><div class="es trunc">${esc(sub.join(" · "))}</div></div>
    <div class="ea num${pos?" pos":""}">${pos ? "+" : "−"}${money(e.amount,{cents:true})}</div></div>`;
}
function groupedEntries(list){
  if (!list.length) return `<div class="empty">Nothing here for ${monthLabel(S.month)}. <button data-action="quick-add">Add an entry</button></div>`;
  const by = {};
  for (const e of list) (by[e.date] ||= []).push(e);
  return Object.keys(by).sort().reverse().map(d => {
    const dd = parseISO(d), diff = daysBetween(d, S.today);
    const lab = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${WD[dd.getDay()].slice(0,3)}, ${MON[dd.getMonth()]} ${dd.getDate()}`;
    const tot = by[d].filter(e => e.kind !== "income").reduce((a,e) => a + e.amount, 0);
    return `<div class="day-group"><div class="day-head"><span>${lab}</span><span class="num">${tot ? money(tot) : ""}</span></div>${by[d].map(entryRow).join("")}</div>`;
  }).join("");
}
function viewSpending(){
  const f = UI.filter;
  let list = S.entries.filter(e => e.kind !== "income");
  if (f === "bills") list = list.filter(e => e.kind === "bill");
  else if (f === "payments") list = list.filter(e => e.kind === "payment");
  else if (f) list = list.filter(e => e.kind === "expense" && e.category_id === f);
  const chip = (k, label, dot) => `<button class="chip${f===k?" on":""}" data-action="set-filter" data-k="${k ?? ""}">${dot ? `<span class="dot" style="background:${dot}"></span>` : ""}${esc(label)}</button>`;
  const used = S.categories.filter(c => c.spent > 0 || c.budget > 0);
  return `${topBar("Spending")}
  <div class="seg m-only" style="margin-bottom:16px"><button class="on">Spending</button><button data-action="nav" data-view="income">Income</button></div>
  <div class="page-grid">
    <section class="card">
      <div class="chips" style="margin-bottom:18px">${chip(null,"All")}${used.map(c => chip(c.id, c.name, c.color)).join("")}${chip("bills","Bills")}${chip("payments","Card payments")}</div>
      ${groupedEntries(list)}
    </section>
    <div style="display:flex;flex-direction:column;gap:20px">
      <section class="card">
        <div class="card-head"><div class="h-card">Budgets</div><button class="link" data-action="add-category">${ic("plus",14)}Category</button></div>
        ${S.categories.map(c => `<div class="crow" data-action="edit-category" data-id="${c.id}" role="button" tabindex="0">
          <div class="cl"><span class="dot" style="background:${c.color}"></span><span class="trunc">${esc(c.name)}</span></div>
          <div class="num cv"><b>${money(c.spent,{cents:false})}</b><span> / ${money(c.budget,{cents:false})}</span></div>
          <div class="bar"><span style="width:${c.budget ? Math.min(100,c.spent/c.budget*100).toFixed(1) : 0}%;background:${c.color}"></span></div></div>`).join("")}
        <div class="tot"><span>Flexible budget</span><span class="num"><b>${money(S.totals.spent)}</b> / ${money(S.totals.budget,{cents:false})}</span></div>
      </section>
      <section class="card"><div class="h-card" style="margin-bottom:8px">This month</div>
        <div class="cc-line"><span>Flexible spending</span><span></span><span class="r num">${money(S.totals.spent,{cents:false})}</span></div>
        <div class="cc-line"><span>Bills paid</span><span></span><span class="r num">${money(S.totals.bills,{cents:false})}</span></div>
        <div class="cc-line"><span>Card payments</span><span></span><span class="r num">${money(S.totals.payments,{cents:false})}</span></div>
        <div class="cc-line"><span>Income</span><span></span><span class="r num" style="color:var(--accent-ink)">${money(S.totals.income,{cents:false})}</span></div>
      </section>
    </div>
  </div>`;
}
function viewIncome(){
  const exp = parseInt(S.settings.expected_income || "0", 10), got = S.totals.income;
  const list = S.entries.filter(e => e.kind === "income");
  const net = got - S.totals.spent - S.totals.bills - S.totals.payments;
  return `${topBar("Income")}
  <div class="seg m-only" style="margin-bottom:16px"><button data-action="nav" data-view="spending">Spending</button><button class="on">Income</button></div>
  <div class="page-grid">
    <section class="card"><div class="card-head"><div class="h-card">Received in ${MONTHS[+S.month.slice(5)-1]}</div><button class="btn sm ghost" data-action="quick-add" data-kind="income">${ic("plus",16)}Log income</button></div>
      ${groupedEntries(list)}</section>
    <div style="display:flex;flex-direction:column;gap:20px">
      <section class="card">
        <div class="eyebrow">Received</div>
        <div class="cc-total num" style="margin:8px 0 4px">${money(got,{cents:false})}</div>
        <div class="muted" style="font-size:13px">${exp ? `of ${money(exp,{cents:false})} expected` : "No expected amount set"}</div>
        ${exp ? `<div class="bar" style="margin-top:14px"><span style="width:${Math.min(100,got/exp*100).toFixed(1)}%"></span></div>` : ""}
        <div class="divider"></div>
        <label class="field" style="margin:0"><span>Expected monthly income</span>
          <div class="pre"><b>$</b><input class="input num" inputmode="decimal" data-setting="expected_income" value="${centsToInput(exp || null)}" placeholder="0"></div></label>
      </section>
      <section class="card"><div class="h-card" style="margin-bottom:8px">Net this month</div>
        <div class="cc-line"><span>Income</span><span></span><span class="r num">${money(got,{cents:false})}</span></div>
        <div class="cc-line"><span>Everything out</span><span></span><span class="r num">−${money(S.totals.spent + S.totals.bills + S.totals.payments,{cents:false})}</span></div>
        <div class="divider" style="margin:8px 0"></div>
        <div class="cc-line"><b>Net</b><span></span><span class="r num" style="color:${net>=0?"var(--accent-ink)":"var(--warn)"}">${money(net,{cents:false,sign:true})}</span></div>
      </section>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- debt */
const CARD_COLORS = ["#2D7363","#C18A3D","#5A7EA5","#9479AE","#C47A68","#5E9C8F"];
function viewDebt(){
  const add = `<button class="btn" data-action="add-card">${ic("plus")}Add card</button>`;
  if (!S.cards.length) return `${topBar("Debt",{month:false, add:false, extra:add})}
    <section class="card"><div class="empty" style="padding:30px 0;text-align:center">No cards yet. Add a card with its balance, APR and minimum payment to get a payoff plan.</div></section>`;
  const {plan, mins, set} = debtPlan();
  const total = S.cards.reduce((a,c) => a + Math.max(0,c.balance), 0);
  const sim = simulate(S.cards, plan, UI.strategy);
  const alt = simulate(S.cards, plan, UI.strategy === "avalanche" ? "snowball" : "avalanche");
  const target = sim.order[0];
  const diff = Math.round((alt.interest - sim.interest) / 100);
  const cmp = sim.never || alt.never ? "" : diff > 0 ? `Saves about $${diff.toLocaleString()} vs ${UI.strategy === "avalanche" ? "snowball" : "avalanche"}.` : diff < 0 ? `Costs about $${(-diff).toLocaleString()} more than ${UI.strategy === "avalanche" ? "snowball" : "avalanche"}, with quicker wins.` : "Same cost either way here.";
  const strip = `<section class="card stat-strip">
    <div class="stat"><div class="eyebrow">Total balance</div><div class="v num">${money(total,{cents:false})}</div><div class="s">${S.cards.length} card${S.cards.length===1?"":"s"}</div></div>
    <div class="stat"><div class="eyebrow">Monthly plan</div><label class="plan-input num">$<input inputmode="decimal" data-setting="debt_plan" value="${centsToInput(plan)}" aria-label="Monthly debt payment"></label><div class="s">minimums ${money(mins,{cents:false})}${set && set < mins ? " · raised to minimums" : ""}</div></div>
    <div class="stat"><div class="eyebrow">Debt-free</div><div class="v">${total <= 0 ? "Done" : sim.never ? "—" : monthsOut(sim.months)}</div><div class="s">${sim.never ? "Plan doesn't cover interest" : total > 0 ? `${sim.months} month${sim.months===1?"":"s"}` : ""}</div></div>
    <div class="stat"><div class="eyebrow">Interest to go</div><div class="v num">${sim.never ? "—" : money(sim.interest,{cents:false})}</div><div class="s">at this plan</div></div>
  </section>`;
  const cardsH = S.cards.map((c, i) => {
    const pct = c.start_balance > 0 ? Math.max(0, Math.min(100, (c.start_balance - c.balance) / c.start_balance * 100)) : 0;
    const po = sim.payoff[c.id];
    const isT = c.id === target && c.balance > 0;
    const monthlyInt = Math.max(0,c.balance) * c.apr / 1200;
    return `<section class="card${isT?" target":""}">
      <div class="dc-top"><div><div class="row" style="gap:8px"><span class="dot" style="background:${CARD_COLORS[i % CARD_COLORS.length]}"></span><b style="font-weight:600;font-size:15px">${esc(c.name)}</b></div></div>
        <div class="row" style="gap:6px">${c.balance <= 0 ? `<span class="pill accent">Paid off</span>` : isT ? `<span class="pill accent">Focus<span class="d-only">&nbsp;· extra goes here</span></span>` : `<span class="pill">Minimum</span>`}
        <button class="icon-btn" data-action="edit-card" data-id="${c.id}" aria-label="Edit ${esc(c.name)}">${ic("edit",16)}</button></div></div>
      <div class="dc-bal num">${money(Math.max(0,c.balance))}</div>
      <div class="muted" style="font-size:13px">of ${money(c.start_balance,{cents:false})} · ${Math.round(pct)}% paid off</div>
      <div class="bar" style="margin-top:14px"><span style="width:${pct.toFixed(1)}%;background:${CARD_COLORS[i % CARD_COLORS.length]}"></span></div>
      <div class="dc-meta"><div><div class="k">APR</div><div class="v num">${c.apr.toFixed(2)}%</div></div><div><div class="k">Minimum</div><div class="v num">${money(c.min_payment,{cents:false})}</div></div><div><div class="k">Paid off</div><div class="v">${c.balance <= 0 ? "Done" : po ? monthsOut(po) : "—"}</div></div></div>
      <div class="dc-foot"><span class="muted" style="font-size:13px">~${money(monthlyInt,{cents:false})}/mo interest${c.paid_this_month ? ` · paid ${money(c.paid_this_month,{cents:false})} this month` : ""}</span>
        <button class="btn sm ghost" data-action="quick-add" data-kind="payment" data-card="${c.id}">Log payment</button></div>
    </section>`;
  }).join("");
  return `${topBar("Debt",{month:false, add:false, extra:add})}
  <div style="display:flex;flex-direction:column;gap:20px">
    ${strip}
    <div class="row" style="flex-wrap:wrap;gap:14px"><div class="seg"><button class="${UI.strategy==="avalanche"?"on":""}" data-action="strategy" data-s="avalanche">Avalanche</button><button class="${UI.strategy==="snowball"?"on":""}" data-action="strategy" data-s="snowball">Snowball</button></div>
      <span class="muted" style="font-size:13px">${UI.strategy === "avalanche" ? "Highest APR first." : "Smallest balance first."} ${cmp}</span></div>
    <div class="debt-cards">${cardsH}</div>
    ${timelineCard(sim)}
  </div>`;
}
function timelineCard(sim){
  if (sim.never || sim.months < 1) return sim.never ? `<div class="note">Your monthly plan doesn't cover the interest yet, so there's no payoff date. Raising it a bit above the minimums makes a big difference.</div>` : "";
  const n = sim.series.length - 1, ymax = Math.max(...sim.series.map(r => r.reduce((a,b)=>a+b,0)), 1);
  const X = i => i / n * 1000, Y = v => 260 - v / ymax * 250;
  const ids = sim.ids;
  let lower = sim.series.map(() => 0), polys = "";
  ids.forEach((id, k) => {
    const upper = sim.series.map((r,i) => lower[i] + r[k]);
    const top = upper.map((v,i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const bot = lower.map((v,i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).reverse().join(" ");
    const idx = S.cards.findIndex(c => c.id === id);
    polys += `<polygon points="${top} ${bot}" fill="${CARD_COLORS[idx % CARD_COLORS.length]}" fill-opacity=".8"/>`;
    lower = upper;
  });
  const ticks = [0, Math.round(n/3), Math.round(2*n/3), n].filter((v,i,a) => a.indexOf(v) === i);
  return `<section class="card"><div class="card-head"><div class="h-card">Payoff timeline</div><span class="muted" style="font-size:13px">${money(debtPlan().plan,{cents:false})}/mo · ${UI.strategy}</span></div>
    <div class="timeline"><svg viewBox="0 0 1000 262" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="260.5" x2="1000" y2="260.5" stroke="#E3E3DD" vector-effect="non-scaling-stroke"/>${polys}</svg></div>
    <div class="axis">${ticks.map(t => `<span>${t === 0 ? "Now" : monthsOut(t)}</span>`).join("")}</div>
    <div class="tl-legend">${ids.map(id => { const i = S.cards.findIndex(c => c.id === id); return `<span class="row" style="gap:6px"><span class="dot" style="background:${CARD_COLORS[i % CARD_COLORS.length]}"></span>${esc(S.cards[i].name)}</span>`; }).join("")}</div>
  </section>`;
}

/* ---------------------------------------------------------------- bills */
function viewBills(){
  const bills = S.bills;
  const total = bills.reduce((a,b) => a + b.amount, 0), paid = bills.filter(b => b.paid).reduce((a,b) => a + (b.paid_amount||0), 0);
  const rowsH = bills.map(b => {
    const days = daysBetween(S.today, b.due_date);
    return `<div class="brow${b.paid?" paid":""}">
      <button class="chk${b.paid?" on":""}" data-action="toggle-bill" data-id="${b.id}" data-month="${b.month}" data-paid="${b.paid?1:0}" aria-label="${b.paid?"Unmark":"Mark"} ${esc(b.name)} paid">${b.paid ? ic("check") : ""}</button>
      <button class="bn bn-btn" data-action="edit-bill" data-id="${b.id}"><div class="trunc">${esc(b.name)}</div><div class="bs">${shortDate(b.due_date)} · ${b.paid ? `Paid ${shortDate(b.paid_date)}` : isCurrentMonth() ? relDays(days) : "Due"}${b.estimate ? " · amount varies" : ""}</div></button>
      <div class="num ba">${money(b.paid ? b.paid_amount : b.amount)}</div></div>`;
  }).join("");
  return `${topBar("Bills",{add:false, extra:`<button class="btn" data-action="add-bill">${ic("plus")}Add bill</button>`})}
  <div class="page-grid">
    <section class="card"><div class="card-head"><div class="h-card">${monthLabel(S.month)}</div><span class="muted num" style="font-size:13px">${money(paid,{cents:false})} of ${money(total,{cents:false})} paid</span></div>
      ${rowsH || `<div class="empty">No bills yet. <button data-action="add-bill">Add rent or another regular bill</button></div>`}</section>
    <section class="card"><div class="h-card" style="margin-bottom:10px">How bills work</div>
      <p class="muted" style="font-size:13px;line-height:1.55">Bills repeat every month on their due day. Tap the circle when one's paid and it's logged for that month automatically. Bills sit outside your flexible budget, so rent never eats into "left to spend."</p>
      ${bills.length ? `<div class="divider"></div><div class="cc-line"><span>Monthly fixed costs</span><span></span><span class="r num">${money(total,{cents:false})}</span></div>` : ""}
    </section>
  </div>`;
}

/* ---------------------------------------------------------------- tasks */
function viewTasks(){
  const t = S.today;
  const today = S.tasks.filter(x => !x.done && (x.repeat === "daily" || !x.due || x.due <= t));
  const upcoming = S.tasks.filter(x => !x.done && x.repeat !== "daily" && x.due && x.due > t).sort((a,b) => a.due.localeCompare(b.due));
  const done = S.tasks.filter(x => x.done && (x.repeat === "daily" || x.done_on === t));
  const olderDone = S.tasks.filter(x => x.done && x.repeat !== "daily" && x.done_on !== t);
  const section = (title, list, emptyMsg) => `<div class="section-title">${title}</div>${list.length ? `<div>${list.map(taskRow).join("")}</div>` : `<div class="empty" style="padding:4px 0 8px">${emptyMsg}</div>`}`;
  return `${topBar("Tasks",{month:false, add:false, extra:`<button class="btn" data-action="add-task-full">${ic("plus")}New task</button>`})}
  <div class="page-grid">
    <section class="card">
      <label class="add-row" style="border-top:0;padding-top:0">${ic("plus",16)}<input data-enter="add-task" placeholder="Add a task for today" aria-label="Add a task" enterkeyhint="done"></label>
      ${section("Today", today, "All clear.")}
      ${upcoming.length ? section("Upcoming", upcoming, "") : ""}
      ${done.length ? section("Done today", done, "") : ""}
      ${olderDone.length ? `<div class="section-title row" style="justify-content:space-between"><span>Completed earlier (${olderDone.length})</span><button class="link" data-action="clear-done">Clear</button></div>` : ""}
    </section>
    <section class="card"><div class="h-card" style="margin-bottom:10px">Tips</div>
      <p class="muted" style="font-size:13px;line-height:1.55">Tasks without a date show up under Today until they're done. Set a task to repeat daily for routines like logging cash. It resets every morning. Tap a task to edit it.</p></section>
  </div>`;
}

/* ---------------------------------------------------------------- settings */
function viewSettings(){
  const s = S.settings;
  return `${topBar("Settings",{month:false, add:false, eyebrow:"Budget"})}
  <div class="page-grid">
    <section class="card">
      <div class="card-head"><div class="h-card">Categories &amp; budgets</div><button class="link" data-action="add-category">${ic("plus",14)}Add</button></div>
      ${S.categories.map(c => `<div class="set-row" data-action="edit-category" data-id="${c.id}" role="button" tabindex="0" style="cursor:pointer"><span class="dot" style="background:${c.color};width:10px;height:10px"></span><span class="lbl">${esc(c.name)}</span><span class="num muted">${money(c.budget,{cents:false})}/mo</span>${ic("cr",16)}</div>`).join("")}
      <div class="tot"><span>Flexible budget</span><b class="num">${money(S.totals.budget,{cents:false})}/mo</b></div>
    </section>
    <div style="display:flex;flex-direction:column;gap:20px">
      <section class="card">
        <div class="set-row"><span class="lbl">Money hints<small>At most one quiet tip at a time. Dismissing one keeps things quiet for a day.</small></span>
          <button class="switch${s.hints==="on"?" on":""}" role="switch" aria-checked="${s.hints==="on"}" data-action="toggle-hints" aria-label="Money hints"></button></div>
        <div class="set-row"><label class="lbl" for="ei">Expected monthly income</label>
          <div class="field pre" style="margin:0;width:140px"><b>$</b><input id="ei" class="input num" inputmode="decimal" data-setting="expected_income" value="${centsToInput(parseInt(s.expected_income||"0",10)||null)}" placeholder="0"></div></div>
      </section>
      <section class="card"><div class="h-card" style="margin-bottom:6px">Backup</div>
        <div class="set-row"><span class="lbl">Export everything<small>Full JSON backup</small></span><a class="btn sm ghost" href="/api/export.json">${ic("download",16)}JSON</a></div>
        <div class="set-row"><span class="lbl">Transactions<small>For spreadsheets</small></span><a class="btn sm ghost" href="/api/export.csv">${ic("download",16)}CSV</a></div>
      </section>
      <section class="card"><div class="h-card" style="margin-bottom:6px">About</div>
        <p class="muted" style="font-size:13px;line-height:1.55">Running on <b>${esc(location.host)}</b>. Single user, no login, and all your data stays in one SQLite file on this server. Press <b>N</b> anywhere to add an entry.</p></section>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- render */
function render(){
  renderChrome();
  const v = {overview:viewOverview, spending:viewSpending, income:viewIncome, debt:viewDebt, bills:viewBills, tasks:viewTasks, settings:viewSettings}[UI.view] || viewOverview;
  const main = $("#main");
  const focused = document.activeElement?.dataset?.setting;
  main.innerHTML = v();
  if (focused) main.querySelector(`[data-setting="${focused}"]`)?.focus();
  document.title = UI.view === "overview" ? "Budget" : `${UI.view[0].toUpperCase()+UI.view.slice(1)} · Budget`;
}

/* ---------------------------------------------------------------- sheet: entry */
function openSheet(html){
  const sh = $("#sheet");
  sh.innerHTML = `<div class="grabber"></div>${html}`;
  $("#scrim").classList.add("on");
  sh.classList.add("on");
  document.body.style.overflow = "hidden";
}
function closeSheet(){
  $("#sheet").classList.remove("on");
  $("#scrim").classList.remove("on");
  document.body.style.overflow = "";
  UI.sheet = null;
}

function openEntry(opts = {}){
  const e = opts.entry;
  const curMonth = S.month === S.today.slice(0,7);
  UI.sheet = {type:"entry",
    id: e?.id ?? null, kind: e?.kind ?? opts.kind ?? "expense",
    amount: e ? centsToInput(e.amount) : "",
    date: e?.date ?? (curMonth ? S.today : (S.month < S.today.slice(0,7) ? `${S.month}-${pad(daysIn(S.month))}` : `${S.month}-01`)),
    category_id: e?.category_id ?? opts.category ?? null,
    card_id: e?.card_id ?? opts.card ?? (opts.kind === "payment" ? S.cards[0]?.id ?? null : null),
    note: e?.note ?? "", err: ""};
  renderEntrySheet(true);
}
function renderEntrySheet(focus){
  const f = UI.sheet, isBill = f.kind === "bill";
  const kinds = [["expense","Expense"],["income","Income"],["payment","Debt payment"]];
  const accounts = f.kind === "payment"
    ? S.cards.map(c => `<option value="${c.id}"${f.card_id===c.id?" selected":""}>${esc(c.name)}</option>`).join("")
    : `<option value="">Cash / debit</option>` + S.cards.map(c => `<option value="${c.id}"${f.card_id===c.id?" selected":""}>${esc(c.name)}</option>`).join("");
  const acctName = f.card_id ? cardById(f.card_id)?.name : (f.kind === "payment" ? "Choose card" : "Cash / debit");
  const d = parseISO(f.date);
  const dateLabel = f.date === S.today ? `Today, ${MON[d.getMonth()]} ${d.getDate()}` : `${WD[d.getDay()].slice(0,3)}, ${MON[d.getMonth()]} ${d.getDate()}`;
  const saveLabel = {expense:"Save expense", income:"Save income", payment:"Log payment", bill:"Save bill payment"}[f.kind];
  openSheet(`<form data-submit="entry" autocomplete="off">
    <div class="sheet-head"><button type="button" class="l" data-action="close-sheet">Cancel</button><h2>${f.id ? "Edit entry" : "New entry"}</h2>
      <span class="r">${f.id ? `<button type="button" class="icon-btn" data-action="delete-entry" aria-label="Delete entry">${ic("trash")}</button>` : ""}</span></div>
    ${isBill ? `<div class="note" style="text-align:center">Bill payment · ${esc(f.note)}</div>` : `<div class="seg full">${kinds.map(([k,t]) => `<button type="button" class="${f.kind===k?"on":""}" data-action="entry-kind" data-k="${k}" ${k==="payment" && !S.cards.length ? "disabled title=\"Add a card first\" style=\"opacity:.45\"" : ""}>${t}</button>`).join("")}</div>`}
    <div class="amount"><span class="cur">$</span><input name="amount" inputmode="decimal" placeholder="0.00" value="${esc(f.amount)}" aria-label="Amount" data-sheet-input="amount" style="width:${Math.max(4, (f.amount||"0.00").length + .6)}ch"></div>
    <div class="meta-chips">
      <label class="meta-chip">${ic("cal")}<span>${dateLabel}</span><input type="date" name="date" value="${f.date}" data-sheet-input="date" aria-label="Date"></label>
      ${f.kind !== "income" && (S.cards.length || f.kind === "payment") ? `<label class="meta-chip">${ic("wallet")}<span>${esc(acctName)}</span><select name="card_id" data-sheet-input="card_id" aria-label="Account">${accounts}</select></label>` : ""}
    </div>
    ${f.kind === "expense" ? `<div class="label">Category</div><div class="chips" style="margin-bottom:18px">${S.categories.map(c => `<button type="button" class="chip${f.category_id===c.id?" on":""}" data-action="entry-cat" data-id="${c.id}">${f.category_id===c.id ? ic("check",14) : `<span class="dot" style="background:${c.color}"></span>`}${esc(c.name)}</button>`).join("")}<button type="button" class="chip add" data-action="add-category" data-return="entry">${ic("plus",14)}New</button></div>` : ""}
    ${isBill ? "" : `<div class="input-icon" style="margin-bottom:6px">${ic("note")}<input class="input" name="note" placeholder="${f.kind === "income" ? "Source, e.g. Paycheck" : "Note (optional)"}" value="${esc(f.note)}" data-sheet-input="note" aria-label="Note" maxlength="120"></div>`}
    <div class="err">${esc(f.err)}</div>
    <button class="btn save" type="submit">${saveLabel}</button>
    <div class="after" id="after">${afterLine()}</div>
  </form>`);
  if (focus && matchMedia("(hover:hover)").matches){
    const el = $(`#sheet [name="${focus === true ? "amount" : focus}"]`) || $('#sheet [name="amount"]');
    setTimeout(() => el?.focus(), 60);
  }
}
function afterLine(){
  const f = UI.sheet; const amt = toCents(f.amount) || 0;
  const orig = f.id ? S.entries.find(e => e.id === f.id) : null;
  if (f.kind === "expense" && f.category_id){
    const c = catById(f.category_id); if (!c) return "";
    const base = c.spent - (orig && orig.kind === "expense" && orig.category_id === c.id && orig.date.slice(0,7) === S.month ? orig.amount : 0);
    const inMonth = f.date.slice(0,7) === S.month;
    return `${esc(c.name)} after this: <b class="num">${money(base + (inMonth ? amt : 0))}</b>${c.budget ? ` of ${money(c.budget,{cents:false})}` : ""}`;
  }
  if (f.kind === "payment" && f.card_id){
    const c = cardById(f.card_id); if (!c) return "";
    const base = c.balance + (orig && orig.kind === "payment" && orig.card_id === c.id ? orig.amount : 0);
    return `${esc(c.name)} after this: <b class="num">${money(Math.max(0, base - amt))}</b>`;
  }
  return "";
}
async function submitEntry(){
  const f = UI.sheet, amt = toCents(f.amount);
  if (!(amt > 0)){ f.err = "Enter an amount."; return renderEntrySheet(); }
  if (f.kind === "payment" && !f.card_id){ f.err = "Choose which card you paid."; return renderEntrySheet(); }
  const body = f.kind === "bill" ? {amount: amt, date: f.date} : {kind: f.kind, amount: amt, date: f.date, note: f.note,
    category_id: f.kind === "expense" ? f.category_id : null, card_id: f.kind === "income" ? null : f.card_id};
  try {
    if (f.id) await api("PUT", `/api/entries/${f.id}`, body); else await api("POST", "/api/entries", body);
    closeSheet();
    toast(f.id ? "Saved" : `${f.kind === "income" ? "Income" : f.kind === "payment" ? "Payment" : "Expense"} added`);
    await load();
  } catch (e){ f.err = e.message; renderEntrySheet(); }
}

/* ---------------------------------------------------------------- sheet: generic forms */
const FORMS = {
  category: {title: "Category", table: "categories", fields: [
    {k:"name", label:"Name", type:"text", req:true},
    {k:"budget", label:"Monthly budget", type:"money"},
    {k:"color", label:"Color", type:"color"}]},
  card: {title: "Credit card", table: "cards", fields: [
    {k:"name", label:"Name", type:"text", req:true, ph:"e.g. Everyday Visa"},
    {k:"current_balance", label:"Current balance", type:"money", req:true},
    {k:"apr", label:"APR", type:"percent", req:true},
    {k:"min_payment", label:"Minimum payment", type:"money"},
    {k:"start_balance", label:"Starting balance (for progress)", type:"money", editOnly:true, help:"Progress is measured from this amount."}]},
  bill: {title: "Bill", table: "bills", fields: [
    {k:"name", label:"Name", type:"text", req:true, ph:"e.g. Rent"},
    {k:"amount", label:"Amount", type:"money", req:true},
    {k:"due_day", label:"Due day of month", type:"number", min:1, max:31, req:true},
    {k:"estimate", label:"Amount varies (estimate)", type:"check"}]},
  task: {title: "Task", table: "tasks", fields: [
    {k:"title", label:"Task", type:"text", req:true},
    {k:"tag", label:"Tag (optional)", type:"text", ph:"e.g. Money"},
    {k:"due", label:"Due date (optional)", type:"date"},
    {k:"repeat", label:"Repeat every day", type:"check", on:"daily", off:"none"}]},
};
function openForm(kind, rec = null, ret = null){
  const F = FORMS[kind];
  UI.sheet = {type:"form", kind, id: rec?.id ?? null, ret, color: rec?.color || PALETTE[S.categories.length % PALETTE.length]};
  const val = f => {
    if (!rec) return f.k === "due_day" ? "1" : "";
    if (f.k === "current_balance") return centsToInput(rec.balance);
    const v = rec[f.k];
    if (f.type === "money") return centsToInput(v);
    return v ?? "";
  };
  const fieldH = F.fields.filter(f => !(f.editOnly && !rec)).map(f => {
    const v = val(f);
    if (f.type === "color") return `<div class="field"><span>${f.label}</span><div class="colors">${PALETTE.map(c => `<button type="button" style="background:${c}" class="${UI.sheet.color===c?"on":""}" data-action="pick-color" data-c="${c}" aria-label="Color ${c}"></button>`).join("")}</div></div>`;
    if (f.type === "check"){ const on = f.on ? v === f.on : !!v; return `<label class="check-line"><input type="checkbox" name="${f.k}" ${on?"checked":""}> ${f.label}</label>`; }
    const input = `<input class="input${f.type==="money"||f.type==="percent"||f.type==="number"?" num":""}" name="${f.k}" value="${esc(v)}" ${f.ph?`placeholder="${esc(f.ph)}"`:""}
      ${f.type==="money"||f.type==="percent" ? 'inputmode="decimal"' : f.type==="number" ? `type="number" min="${f.min}" max="${f.max}" inputmode="numeric"` : f.type==="date" ? 'type="date"' : 'maxlength="80"'} ${f.req?"required":""}>`;
    const wrapped = f.type === "money" ? `<div class="pre"><b>$</b>${input}</div>` : f.type === "percent" ? `<div class="post">${input}<b>%</b></div>` : input;
    return `<label class="field"><span>${f.label}</span>${wrapped}${f.help ? `<small class="faint" style="font-size:12px">${f.help}</small>` : ""}</label>`;
  }).join("");
  openSheet(`<form data-submit="form" autocomplete="off">
    <div class="sheet-head"><button type="button" class="l" data-action="close-sheet">Cancel</button><h2>${rec ? "Edit" : "New"} ${F.title.toLowerCase()}</h2><span class="r"></span></div>
    ${fieldH}
    <div class="err" id="form-err"></div>
    <button class="btn save" type="submit">Save</button>
    ${rec ? `<div class="sheet-foot"><button type="button" class="btn danger" data-action="delete-rec">${ic("trash",16)}Delete ${F.title.toLowerCase()}</button></div>` : ""}
  </form>`);
  if (matchMedia("(hover:hover)").matches) setTimeout(() => $("#sheet input.input")?.focus(), 60);
}
async function submitForm(form){
  const {kind, id, ret} = UI.sheet, F = FORMS[kind];
  const body = {};
  for (const f of F.fields){
    const el = form.elements[f.k];
    if (f.type === "color"){ body.color = UI.sheet.color; continue; }
    if (!el) continue;
    if (f.type === "check"){ body[f.k] = f.on ? (el.checked ? f.on : f.off) : (el.checked ? 1 : 0); continue; }
    let v = el.value.trim();
    if (f.type === "money"){ if (v === "" && !f.req){ v = f.k === "start_balance" ? undefined : 0; } else { v = toCents(v); if (isNaN(v)) return formErr(`${f.label} isn't a number.`); } }
    else if (f.type === "percent"){ v = parseFloat(v.replace("%","")); if (isNaN(v)) return formErr(`${f.label} isn't a number.`); }
    else if (f.type === "number"){ v = parseInt(v,10); if (isNaN(v)) return formErr(`${f.label} isn't a number.`); }
    else if (f.req && !v) return formErr(`${f.label} is required.`);
    if (v !== undefined) body[f.k] = v;
  }
  try {
    let res;
    if (id) res = await api("PUT", `/api/${F.table}/${id}`, body); else res = await api("POST", `/api/${F.table}`, body);
    await load();
    if (ret === "entry" && kind === "category"){ const s = UI.prevEntry; UI.sheet = s; s.category_id = res.id || s.category_id; renderEntrySheet(); return; }
    closeSheet(); toast("Saved");
  } catch (e){ formErr(e.message); }
}
function formErr(m){ const el = $("#form-err"); if (el) el.textContent = m; }

/* ---------------------------------------------------------------- toast */
let toastT;
function toast(msg, undo){
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button data-action="undo">Undo</button>` : ""}`;
  t.classList.add("on");
  UI.undo = undo || null;
  clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove("on"); UI.undo = null; }, undo ? 6000 : 2200);
}

/* ---------------------------------------------------------------- actions */
function go(view){
  UI.view = view;
  if (location.hash !== `#/${view}`) history.pushState(null, "", `#/${view}`);
  render(); window.scrollTo(0, 0);
}
const A = {
  "reload": () => load(),
  "nav": el => go(el.dataset.view),
  "month": el => { UI.month = shiftMonth(UI.month, +el.dataset.d); load(); },
  "quick-add": el => { if (el.dataset.kind === "payment" && !S.cards.length) return toast("Add a card first"); openEntry({kind: el.dataset.kind, card: el.dataset.card ? +el.dataset.card : undefined}); },
  "close-sheet": () => { if (UI.sheet?.ret === "entry"){ UI.sheet = UI.prevEntry; renderEntrySheet(); return; } closeSheet(); },
  "entry-kind": el => { const f = UI.sheet; f.kind = el.dataset.k; f.err = "";
    if (f.kind === "payment" && !f.card_id) f.card_id = S.cards[0]?.id ?? null;
    if (f.kind === "income") f.card_id = null;
    renderEntrySheet("amount"); },
  "entry-cat": el => { const f = UI.sheet; const id = +el.dataset.id; f.category_id = f.category_id === id ? null : id; renderEntrySheet("note"); },
  "edit-entry": el => { const e = S.entries.find(x => x.id === +el.dataset.id); if (e) openEntry({entry: e}); },
  "delete-entry": async () => {
    const e = S.entries.find(x => x.id === UI.sheet.id); closeSheet();
    await act(api("DELETE", `/api/entries/${e.id}`));
    if (e.kind === "bill") toast("Bill payment removed");
    else toast("Entry deleted", async () => act(api("POST", "/api/entries", {kind:e.kind, amount:e.amount, date:e.date, category_id:e.category_id, card_id:e.card_id, note:e.note})));
  },
  "undo": async () => { const u = UI.undo; UI.undo = null; $("#toast").classList.remove("on"); if (u) await u(); },
  "dismiss-hint": async () => { const k = S.hint?.key; S.hint = null; render(); await act(api("POST", "/api/hints/dismiss", {key: k, today: S.today}), false); },
  "toggle-bill": async el => {
    const id = +el.dataset.id, month = el.dataset.month, paid = el.dataset.paid === "1";
    // paying a past month's bill backfills to its due date; otherwise it's paid today
    await act(api("POST", `/api/bills/${id}/${paid ? "unpay" : "pay"}`, {month, date: month < S.today.slice(0,7) ? undefined : S.today}));
  },
  "toggle-task": async el => act(api("POST", `/api/tasks/${el.dataset.id}/toggle`, {today: S.today})),
  "edit-task": el => openForm("task", S.tasks.find(t => t.id === +el.dataset.id)),
  "add-task-full": () => openForm("task"),
  "clear-done": async () => { for (const t of S.tasks.filter(x => x.done && x.repeat !== "daily" && x.done_on !== S.today)) await api("DELETE", `/api/tasks/${t.id}`); load(); },
  "add-bill": () => openForm("bill"),
  "edit-bill": el => { const b = S.bills.find(x => x.id === +el.dataset.id) || S.upcoming.find(x => x.id === +el.dataset.id); openForm("bill", b); },
  "add-card": () => openForm("card"),
  "edit-card": el => openForm("card", cardById(+el.dataset.id)),
  "add-category": el => { if (el.dataset.return === "entry") UI.prevEntry = UI.sheet; openForm("category", null, el.dataset.return || null); },
  "edit-category": el => openForm("category", catById(+el.dataset.id)),
  "pick-color": el => { UI.sheet.color = el.dataset.c; document.querySelectorAll(".colors button").forEach(b => b.classList.toggle("on", b === el)); },
  "delete-rec": async () => {
    const {kind, id} = UI.sheet, F = FORMS[kind];
    const msg = kind === "category" ? "Delete this category? Its entries become uncategorized." : kind === "card" ? "Delete this card? Its entries stay, unlinked." : kind === "bill" ? "Delete this bill? Past payments stay in your history." : null;
    if (msg && !confirm(msg)) return;
    closeSheet(); await act(api("DELETE", `/api/${F.table}/${id}`)); toast("Deleted");
  },
  "filter-cat": el => { UI.filter = +el.dataset.id; go("spending"); },
  "set-filter": el => { const k = el.dataset.k; UI.filter = k === "" ? null : (k === "bills" || k === "payments") ? k : +k; render(); },
  "strategy": async el => { UI.strategy = el.dataset.s; render(); await act(api("PUT", "/api/settings", {strategy: UI.strategy}), false); },
  "toggle-hints": async () => act(api("PUT", "/api/settings", {hints: S.settings.hints === "on" ? "off" : "on"})),
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const fn = A[el.dataset.action];
  if (fn){ e.preventDefault(); fn(el, e); }
});
document.addEventListener("keydown", e => {
  const tag = e.target.tagName, typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
  if (e.key === "Escape" && UI.sheet){ A["close-sheet"](); return; }
  if (!typing && !UI.sheet && !e.metaKey && !e.ctrlKey && !e.altKey && S){
    if (e.key === "n" || e.key === "N"){ e.preventDefault(); openEntry(); }
  }
  if ((e.key === "Enter" || e.key === " ") && !typing && e.target.matches("[role=button][data-action]")){ e.preventDefault(); e.target.click(); }
  if (e.key === "Enter" && e.target.dataset?.enter === "add-task"){
    const v = e.target.value.trim(); if (!v) return;
    e.target.value = "";
    act(api("POST", "/api/tasks", {title: v})).then(() => document.querySelector('[data-enter="add-task"]')?.focus());
  }
});
document.addEventListener("input", e => {
  const k = e.target.dataset?.sheetInput;
  if (k && UI.sheet?.type === "entry"){
    UI.sheet[k] = k === "card_id" ? (e.target.value ? +e.target.value : null) : e.target.value;
    if (k === "amount"){ e.target.style.width = `${Math.max(4, (e.target.value||"0.00").length + .6)}ch`; const a = $("#after"); if (a) a.innerHTML = afterLine(); }
  }
});
document.addEventListener("change", e => {
  const k = e.target.dataset?.sheetInput;
  if ((k === "date" || k === "card_id") && UI.sheet?.type === "entry"){ if (k === "date" && !e.target.value) UI.sheet.date = S.today; renderEntrySheet(); }
  const s = e.target.dataset?.setting;
  if (s){
    const c = toCents(e.target.value);
    act(api("PUT", "/api/settings", {[s]: isNaN(c) ? 0 : Math.max(0, c)}));
  }
});
document.addEventListener("submit", e => {
  e.preventDefault();
  const t = e.target.dataset.submit;
  if (t === "entry") submitEntry();
  if (t === "form") submitForm(e.target);
});
window.addEventListener("popstate", () => { UI.view = (location.hash.match(/^#\/(\w+)/) || [])[1] || "overview"; if (S) render(); });

/* refresh when coming back to the tab (new day, edits from another device) */
let lastLoad = Date.now();
document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastLoad > 30000 && !UI.sheet){ lastLoad = Date.now(); load(); } });

UI.view = (location.hash.match(/^#\/(\w+)/) || [])[1] || "overview";
load();
