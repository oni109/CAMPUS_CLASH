/* =========================================================
   CAMPUS CLASH v2 — game engine, retention loop and monetisation
   ========================================================= */
"use strict";
const CFG = window.CC_CONFIG;
const D = window.CC_DATA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = "campusClash_v2", OLD_KEY = "campusClash_v1";
const DAY = 86400000;

/* ---------------- utilities ---------------- */
const pad = n => String(n).padStart(2, "0");
function todayStr(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function dateFrom(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((dateFrom(b) - dateFrom(a)) / DAY); }
function weekKey(d = new Date()) { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return todayStr(t); }
function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
function rng(seed) { let a = typeof seed === "number" ? seed : hash(String(seed)); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(arr, r = Math.random) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(arr, r = Math.random) { return arr[Math.floor(r() * arr.length)]; }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function fmt(n) { return Math.round(n || 0).toLocaleString(); }
function naira(n) { return CFG.currency + fmt(n); }
function initials(s) { return (s || "S").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "S"; }
function makeRef() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "CC"; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function firstName() { return (state.user.name || "Player").split(" ")[0]; }
function mmss(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
function norm(s) { return String(s || "").toLowerCase().replace(/[\s₦,:.'’\-]/g, ""); }

/* ---------------- state ---------------- */
function freshState() {
  return {
    v: 2, createdAt: Date.now(), onboarded: false,
    user: { name: "", email: "", university: "", faculty: "", department: "", level: "100 Level", avatar: "⚡", frame: "none", theme: "violet", refCode: makeRef() },
    points: 0, xp: 0, coins: 100, gems: 0, energy: CFG.energy.max, energyTs: Date.now(), proUntil: 0,
    streak: 0, lastPlayDate: "", bestStreak: 0, freezes: 0,
    login: { last: "", day: 0 }, spin: { date: "", used: 0, rot: 0 },
    missions: { date: "", ids: [], progress: {}, claimed: [], bonus: false },
    daily: { date: "", done: false, score: 0 },
    week: { key: weekKey(), points: 0 },
    gamesPlayed: 0, wins: 0, answers: 0, correct: 0, bestCombo: 0, duelWins: 0,
    high: {}, history: [], badges: [], played: {},
    powerups: { fifty: 2, time: 2, skip: 1 },
    owned: ["avatar:⚡", "frame:none", "theme:violet"],
    joined: [], tourneyBest: {}, adminQuestions: [], customTournaments: [],
    purchases: [], ads: { date: "", rewarded: 0 }, adImpressions: 0, gamesSinceAd: 0,
    referredBy: "", settings: { sound: true }
  };
}
function loadState() {
  const base = freshState();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { }
  if (!saved) {
    // migrate v1 starter data
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      if (old) {
        saved = {
          user: { ...old.user }, points: old.points || 0, xp: old.xp || 0, gamesPlayed: old.gamesPlayed || 0,
          wins: old.wins || 0, answers: old.answers || 0, correct: old.correct || 0,
          onboarded: !!(old.user && old.user.name && old.user.name !== "Student Player"),
          adminQuestions: (old.adminQuestions || []).map(q => ({ type: "text", q: q.q, a: q.answer, cat: q.category, hint: "" }))
        };
      }
    } catch { }
  }
  if (!saved) return base;
  const s = { ...base, ...saved };
  for (const k of ["user", "login", "spin", "missions", "daily", "week", "powerups", "ads", "settings", "high", "tourneyBest", "played"]) s[k] = { ...base[k], ...(saved[k] || {}) };
  if (!s.user.refCode) s.user.refCode = makeRef();
  return s;
}
let state = loadState();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { } updateHeader(); }

const isPro = () => state.proUntil > Date.now();
const level = xp => Math.floor(Math.sqrt((xp || 0) / 40)) + 1;
const xpFor = l => 40 * (l - 1) * (l - 1);
function tierOf(p) { let t = D.tiers[0]; for (const x of D.tiers) if (p >= x.min) t = x; return t; }
function nextTier(p) { return D.tiers.find(x => x.min > p); }

/* ---------------- daily housekeeping ---------------- */
function housekeeping() {
  const today = todayStr();
  // streak protection / reset
  if (state.lastPlayDate) {
    const gap = daysBetween(state.lastPlayDate, today);
    if (gap === 2 && state.freezes > 0 && state.streak > 0) {
      state.freezes--; const y = new Date(); y.setDate(y.getDate() - 1); state.lastPlayDate = todayStr(y);
      setTimeout(() => toast("🧊 Streak Freeze used — your streak is safe!"), 800);
    } else if (gap >= 2) state.streak = 0;
  }
  if (state.week.key !== weekKey()) state.week = { key: weekKey(), points: 0 };
  if (state.daily.date !== today) state.daily = { date: today, done: false, score: 0 };
  if (state.ads.date !== today) state.ads = { date: today, rewarded: 0 };
  ensureMissions();
}
function ensureMissions() {
  const today = todayStr();
  if (state.missions.date === today) return;
  const r = rng(today + state.user.refCode);
  state.missions = { date: today, ids: shuffle(D.missions, r).slice(0, 3).map(m => m.id), progress: {}, claimed: [], bonus: false };
}
function missionEvent(type, val) {
  for (const id of state.missions.ids) {
    const m = D.missions.find(x => x.id === id);
    if (!m || m.type !== type) continue;
    const cur = state.missions.progress[id] || 0;
    state.missions.progress[id] = m.max ? Math.max(cur, val) : cur + val;
  }
}

/* ---------------- energy ---------------- */
const regenMs = () => CFG.energy.regenMinutes * 60000;
function syncEnergy() {
  const max = CFG.energy.max, now = Date.now();
  if (state.energy >= max) { state.energyTs = now; return; }
  const gained = Math.floor((now - state.energyTs) / regenMs());
  if (gained > 0) {
    state.energy = Math.min(max, state.energy + gained);
    state.energyTs = state.energy >= max ? now : state.energyTs + gained * regenMs();
  }
}
function spendEnergy() {
  if (isPro()) return true;
  syncEnergy();
  if (state.energy <= 0) { outOfEnergy(); return false; }
  if (state.energy >= CFG.energy.max) state.energyTs = Date.now();
  state.energy--; save(); return true;
}
function addEnergy(n) { syncEnergy(); state.energy = Math.min(CFG.energy.max + 5, state.energy + n); }

/* ---------------- sound & fx ---------------- */
let actx = null;
function beep(freq = 600, dur = 0.08, type = "sine", vol = 0.06) {
  if (!state.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(actx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur); o.stop(actx.currentTime + dur + 0.02);
  } catch { }
}
const sfx = {
  good: () => { beep(660, .07, "triangle"); setTimeout(() => beep(880, .09, "triangle"), 70); },
  bad: () => beep(180, .18, "sawtooth", .04),
  tap: () => beep(520, .04, "square", .03),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .12, "triangle"), i * 110)),
  coin: () => { beep(988, .05, "square", .03); setTimeout(() => beep(1319, .1, "square", .03), 60); }
};
function confetti() {
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.append(c);
  const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  const cols = ["#8b5cf6", "#e65ab5", "#43d9e8", "#b9ef72", "#ffc968"];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, s: 4 + Math.random() * 6, r: Math.random() * 6, c: pick(cols) }));
  let f = 0; (function loop() { ctx.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.r += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }); if (++f < 180) requestAnimationFrame(loop); else c.remove(); })();
}
let toastT;
function toast(msg) { const t = $("#toast"); t.innerHTML = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800); }

/* ---------------- theme & header ---------------- */
function applyTheme() {
  const th = D.cosmetics.theme.find(t => t.id === state.user.theme) || D.cosmetics.theme[0];
  document.documentElement.style.setProperty("--purple", th.a);
  document.documentElement.style.setProperty("--pink", th.b);
}
function avatarHTML(cls = "avatar", u = state.user) { return `<div class="${cls} frame-${esc(u.frame || "none")}">${esc(u.avatar || initials(u.name))}</div>`; }
function updateHeader() {
  syncEnergy();
  $("#streakTop").textContent = state.streak;
  $("#coinTop").textContent = fmt(state.coins);
  $("#gemTop").textContent = fmt(state.gems);
  $("#energyTop").textContent = isPro() ? "∞" : `${state.energy}/${CFG.energy.max}`;
  $("#energyTimer").textContent = isPro() ? "PRO" : state.energy >= CFG.energy.max ? "FULL" : mmss(regenMs() - (Date.now() - state.energyTs));
  $("#sideName").textContent = state.user.name || "New Player";
  $("#sideDept").textContent = `${tierOf(state.points).icon} ${tierOf(state.points).name} · Lv ${level(state.xp)}`;
  $("#sideAvatarWrap").innerHTML = avatarHTML("avatar");
  $("#proTop").classList.toggle("hidden", isPro());
  $("#proBadgeTop").classList.toggle("hidden", !isPro());
  const missionsReady = state.missions.ids.filter(id => { const m = D.missions.find(x => x.id === id); return m && (state.missions.progress[id] || 0) >= m.goal && !state.missions.claimed.includes(id); }).length;
  const dailyDot = missionsReady || state.login.last !== todayStr() || state.spin.date !== todayStr() || !state.daily.done;
  $("#dailyDot").classList.toggle("hidden", !dailyDot);
}
setInterval(() => { if (!document.hidden) updateHeader(); }, 1000);

/* ---------------- routing ---------------- */
const labels = { home: "Overview", games: "Game Arena", daily: "Daily Hub", tournaments: "Tournaments", leaderboard: "Leaderboard", profile: "My Profile", store: "Store", partners: "Partners", admin: "Admin Studio" };
let current = "home", gameFilter = "all", lbTab = "overall", storeTab = "featured", adminTab = "questions";
function go(name) { if (!labels[name]) name = "home"; if (location.hash.slice(1) === name) render(); else location.hash = name; }
function render() {
  const name = labels[location.hash.slice(1)] ? location.hash.slice(1) : "home";
  current = name;
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.arg === name));
  $("#pageName").textContent = labels[name]; $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("show");
  const pages = { home: homePage, games: gamesPage, daily: dailyPage, tournaments: tournamentsPage, leaderboard: leaderboardPage, profile: profilePage, store: storePage, partners: partnersPage, admin: adminPage };
  $("#content").innerHTML = pages[name]();
  afterRender(name);
  updateHeader();
}
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
function refresh() { render(); }

/* ---------------- shared UI pieces ---------------- */
function adBanner() {
  if (isPro()) return "";
  const s = CFG.sponsors[(Math.floor(Date.now() / 20000)) % CFG.sponsors.length];
  state.adImpressions++;
  return `<aside class="ad-banner" style="--ad:${s.color}"><span class="ad-emoji">${s.emoji}</span><div><small>SPONSORED</small><b>${esc(s.name)}</b><p>${esc(s.tagline)}</p></div><button class="btn btn-secondary btn-small" data-action="go" data-arg="${s.page}">${esc(s.cta)}</button><button class="ad-x" data-action="go" data-arg="store" title="Remove ads with Pro">Remove ads</button></aside>`;
}
function levelBar() {
  const l = level(state.xp), a = xpFor(l), b = xpFor(l + 1), pct = Math.min(100, (state.xp - a) / (b - a) * 100);
  return `<div class="level-bar"><div class="split"><b>Level ${l}</b><small>${fmt(state.xp - a)} / ${fmt(b - a)} XP</small></div><div class="progress"><span style="width:${pct}%"></span></div></div>`;
}
function gameCard(g, large = true) {
  const hs = state.high[g.id];
  return `<article class="game-card ${large ? "large" : ""}" data-action="play" data-arg="${g.id}"><div class="split"><div class="game-icon">${g.icon}</div><span class="tag">${g.type}</span></div><h3>${g.name}</h3><p>${g.desc}</p><div class="game-meta"><span>◷ ${g.time}</span><span>${hs ? "🏅 Best " + fmt(hs) : g.reward}</span></div><button class="btn btn-primary btn-small mt full-btn" data-action="play" data-arg="${g.id}">PLAY ${isPro() ? "" : "· ⚡1"}</button></article>`;
}
function missionRows() {
  ensureMissions();
  return state.missions.ids.map(id => {
    const m = D.missions.find(x => x.id === id); if (!m) return "";
    const p = Math.min(m.goal, state.missions.progress[id] || 0), done = p >= m.goal, claimed = state.missions.claimed.includes(id);
    return `<div class="mission ${claimed ? "claimed" : ""}"><div class="rank-info"><b>${esc(m.text)}</b><div class="progress thin"><span style="width:${p / m.goal * 100}%"></span></div><small>${fmt(p)} / ${fmt(m.goal)}</small></div>${claimed ? `<span class="tag green">CLAIMED</span>` : done ? `<button class="btn btn-primary btn-small pulse" data-action="claimMission" data-arg="${id}">CLAIM ${m.reward}🪙</button>` : `<span class="reward-chip">${m.reward}🪙</span>`}</div>`;
  }).join("") + `<p class="small-note">Finish all 3 for a bonus <b>3 💎</b>. New missions every midnight.</p>`;
}
function botPoints(p) {
  const days = Math.max(0, (Date.now() - state.createdAt) / DAY);
  return Math.round(p.base + days * p.rate + (hash(p.name + todayStr()) % 40));
}
function botWeekly(p) {
  const dow = ((new Date().getDay() + 6) % 7) + 1, hrs = new Date().getHours() / 24;
  return Math.round(p.rate * (dow - 1 + hrs) * 0.9 + (hash(p.name + weekKey()) % 60));
}
function people(mode = "overall") {
  const me = { name: state.user.name || "You", faculty: state.user.faculty, dept: state.user.department, avatar: state.user.avatar, frame: state.user.frame, me: true, pts: mode === "weekly" ? state.week.points : state.points };
  let list = D.players.map(p => ({ ...p, avatar: null, pts: mode === "weekly" ? botWeekly(p) : botPoints(p) }));
  list.push(me);
  if (mode === "faculty") list = list.filter(p => p.me || norm(p.faculty) === norm(state.user.faculty));
  if (mode === "department") list = list.filter(p => p.me || norm(p.dept) === norm(state.user.department));
  return list.sort((a, b) => b.pts - a.pts);
}
function leaderRows(n = 5, mode = "overall") {
  return people(mode).slice(0, n).map((p, i) => `<div class="rank-row ${p.me ? "me" : ""}"><div class="rank-num">${["🥇", "🥈", "🥉"][i] || pad(i + 1)}</div>${p.me ? avatarHTML("rank-avatar") : `<div class="rank-avatar">${initials(p.name)}</div>`}<div class="rank-info"><b>${esc(p.name)} ${p.me ? '<span class="tag">YOU</span>' : ""}</b><small>${esc(p.dept || p.faculty || "")}</small></div><div class="rank-score">${fmt(p.pts)} pts</div></div>`).join("");
}
function myRank(mode = "overall") { return people(mode).findIndex(p => p.me) + 1; }
function facultyWars() {
  const tot = {};
  D.players.forEach(p => tot[p.faculty] = (tot[p.faculty] || 0) + botPoints(p));
  if (state.user.faculty) tot[state.user.faculty] = (tot[state.user.faculty] || 0) + state.points;
  const rows = Object.entries(tot).sort((a, b) => b[1] - a[1]); const max = rows[0]?.[1] || 1;
  return rows.map(([f, v], i) => `<div class="fw-row ${norm(f) === norm(state.user.faculty) ? "me" : ""}"><span class="rank-num">${i + 1}</span><div class="rank-info"><div class="split"><b>${esc(f)}</b><small>${fmt(v)}</small></div><div class="progress thin"><span style="width:${v / max * 100}%"></span></div></div></div>`).join("");
}

/* ---------------- pages ---------------- */
function homePage() {
  syncEnergy();
  const t = tierOf(state.points), nt = nextTier(state.points);
  const featured = ["quiz", "word", "blitz", "duel"].map(id => D.games.find(g => g.id === id));
  return `
<section class="hero"><div class="hero-copy"><div class="eyebrow">⚡ THE CAMPUS ARENA IS LIVE</div><h1>${state.onboarded ? `Welcome back,<br><em>${esc(firstName())}!</em>` : `Ready to own<br>the <em>campus?</em>`}</h1><p>${state.streak ? `🔥 You're on a <b>${state.streak}-day streak</b>. Play today to keep it alive.` : "Think fast. Play smart. Challenge your friends and climb your university leaderboard."}</p><div class="hero-actions"><button class="btn btn-primary" data-action="quickPlay">⚡ QUICK PLAY</button><button class="btn btn-secondary" data-action="go" data-arg="daily">DAILY HUB ${$("#dailyDot") && !$("#dailyDot").classList.contains("hidden") ? "•" : ""}</button></div></div><div class="hero-art"><div class="orb">${esc(state.user.avatar)}</div><div class="floating float-one">${t.icon} ${t.name.toUpperCase()}</div><div class="floating float-two">LV ${level(state.xp)} · ${fmt(state.xp)} XP</div></div></section>
${!isPro() ? `<div class="energy-strip"><div><b>⚡ Energy ${state.energy}/${CFG.energy.max}</b><small>${state.energy >= CFG.energy.max ? "Full — go play!" : "+1 in " + mmss(regenMs() - (Date.now() - state.energyTs))}</small></div><div class="energy-pips">${Array.from({ length: CFG.energy.max }, (_, i) => `<i class="${i < state.energy ? "on" : ""}"></i>`).join("")}</div><button class="btn btn-pro btn-small" data-action="go" data-arg="store">GO PRO · UNLIMITED</button></div>` : ""}
<div class="stats-grid">
 <div class="stat-card"><div class="stat-top">CLASH POINTS <span class="stat-icon">✦</span></div><div class="stat-value">${fmt(state.points)}</div><div class="stat-note positive">${t.icon} ${t.name}${nt ? ` · ${fmt(nt.min - state.points)} to ${nt.name}` : ""}</div></div>
 <div class="stat-card"><div class="stat-top">CAMPUS RANK <span class="stat-icon">♛</span></div><div class="stat-value">#${myRank()}</div><div class="stat-note">of ${D.players.length + 1} players</div></div>
 <div class="stat-card"><div class="stat-top">VICTORIES <span class="stat-icon">🏆</span></div><div class="stat-value">${fmt(state.wins)}</div><div class="stat-note">${state.gamesPlayed ? Math.round(state.wins / state.gamesPlayed * 100) : 0}% win rate</div></div>
 <div class="stat-card"><div class="stat-top">DAY STREAK <span class="stat-icon">🔥</span></div><div class="stat-value">${state.streak}</div><div class="stat-note">${state.freezes ? `🧊 ${state.freezes} freeze ready` : "Best: " + state.bestStreak}</div></div>
</div>
<div class="panel mt">${levelBar()}</div>
<div class="dashboard-grid mt">
 <section class="panel"><div class="split"><div><h3>🎯 Today's missions</h3><div class="panel-sub">Complete them for coins & gems</div></div><button class="text-btn" data-action="go" data-arg="daily">DAILY HUB →</button></div>${missionRows()}</section>
 <section class="panel"><h3>☀️ Daily rewards</h3><div class="panel-sub">Come back every day — rewards grow</div>
  <div class="quick-rewards">
   <button class="qr ${state.login.last === todayStr() ? "done" : "ready"}" data-action="${state.login.last === todayStr() ? "go" : "claimLogin"}" data-arg="daily"><span>🎁</span><b>Login gift</b><small>${state.login.last === todayStr() ? "Claimed" : "Ready!"}</small></button>
   <button class="qr ${spinsLeft() ? "ready" : "done"}" data-action="go" data-arg="daily"><span>🎡</span><b>Lucky spin</b><small>${spinsLeft() ? spinsLeft() + " free" : "Tomorrow"}</small></button>
   <button class="qr ${state.daily.done ? "done" : "ready"}" data-action="play" data-arg="daily"><span>☀️</span><b>Daily quiz</b><small>${state.daily.done ? "Done ✓" : "+50🪙"}</small></button>
  </div></section>
</div>
<div class="section-head"><div><h2>Choose your challenge</h2><p>Seven ways to prove you're the sharpest on campus.</p></div><button class="text-btn" data-action="go" data-arg="games">ALL GAMES →</button></div>
<div class="game-grid four">${featured.map(g => gameCard(g, false)).join("")}</div>
${adBanner()}
<div class="dashboard-grid mt">
 <section class="panel"><div class="split"><div><h3>🏅 Top challengers</h3><div class="panel-sub">Season leaderboard</div></div><button class="text-btn" data-action="go" data-arg="leaderboard">FULL RANKINGS →</button></div>${leaderRows(5)}</section>
 <section class="panel"><h3>🏛️ Faculty Wars</h3><div class="panel-sub">Your points count for your faculty</div>${facultyWars()}</section>
</div>`;
}

function gamesPage() {
  const list = D.games.filter(g => gameFilter === "all" || g.group === gameFilter);
  const chip = (id, t) => `<button class="chip ${gameFilter === id ? "active" : ""}" data-action="filterGames" data-arg="${id}">${t}</button>`;
  return `<div class="eyebrow">PICK YOUR BATTLE</div><h1 class="page-title">Game Arena</h1><p class="subtext">Seven game modes. One leaderboard. Endless bragging rights.</p>
<div class="filter-row">${chip("all", "All games")}${chip("knowledge", "Knowledge")}${chip("puzzle", "Puzzles")}${chip("arcade", "Arcade")}${chip("versus", "Versus")}</div>
<div class="game-grid all-games">${list.map(g => gameCard(g)).join("")}</div>${adBanner()}`;
}

function spinsLeft() { const allowed = isPro() ? 2 : 1; return state.spin.date === todayStr() ? Math.max(0, allowed - state.spin.used) : allowed; }
function loginIndex() {
  const today = todayStr();
  if (state.login.last === today) return { idx: state.login.day, claimed: true };
  const gap = state.login.last ? daysBetween(state.login.last, today) : 99;
  return { idx: gap === 1 ? (state.login.day + 1) % 7 : 0, claimed: false };
}
function wheelHTML() {
  const n = D.spinPrizes.length, seg = 360 / n;
  const grad = D.spinPrizes.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(",");
  const labelsHTML = D.spinPrizes.map((p, i) => `<span style="transform:rotate(${i * seg + seg / 2}deg) translateY(-92px)">${p.label}</span>`).join("");
  return `<div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="wheel" id="wheel" style="background:conic-gradient(${grad});transform:rotate(${state.spin.rot || 0}deg)">${labelsHTML}<div class="wheel-hub">⚡</div></div></div>`;
}
function dailyPage() {
  ensureMissions();
  const li = loginIndex();
  return `<div class="eyebrow">SHOW UP. LEVEL UP.</div><h1 class="page-title">Daily Hub</h1><p class="subtext">Everything here resets at midnight. Don't break the chain.</p>
<div class="challenge-layout mt">
 <div class="challenge-card"><span class="tag green">DAILY QUEST · ${new Date().toLocaleDateString()}</span><h2>Quick Thinker Sprint</h2><p>Five mixed questions — the same set for every student today. No power-ups. Free to play (no energy).</p><div class="challenge-meta"><span>◷ 15s / question</span><span>🪙 +50 bonus</span><span>✦ +25 pts</span></div><div class="progress"><span style="width:${state.daily.done ? 100 : 0}%"></span></div><p>${state.daily.done ? `✅ Done! You scored <b>${fmt(state.daily.score)}</b>. Come back tomorrow.` : "Your daily quest is waiting."}</p><button class="btn btn-primary" ${state.daily.done ? "disabled" : ""} data-action="play" data-arg="daily">${state.daily.done ? "COMPLETED ✓" : "START DAILY QUEST →"}</button></div>
 <div class="panel"><h3>🔥 Your streak</h3><div class="stat-value">${state.streak} day${state.streak === 1 ? "" : "s"}</div><p class="subtext">Play any game each day to grow your streak. Miss a day and it resets — unless you hold a 🧊 Streak Freeze (you have ${state.freezes}).</p><button class="btn btn-secondary btn-small mt" data-action="buyPowerup" data-arg="freeze">BUY STREAK FREEZE · 150🪙</button></div>
</div>
<div class="section-head"><div><h2>🎁 7-day login rewards</h2><p>Log in on consecutive days. Day 7 pays out gems.</p></div></div>
<div class="calendar">${D.loginRewards.map((r, i) => `<div class="cal-day ${i < li.idx || (li.claimed && i === li.idx) ? "got" : ""} ${i === li.idx && !li.claimed ? "today" : ""}"><small>DAY ${i + 1}</small><b>${r.label}</b>${i < li.idx || (li.claimed && i === li.idx) ? "<i>✓</i>" : ""}</div>`).join("")}</div>
<button class="btn btn-primary mt" ${li.claimed ? "disabled" : ""} data-action="claimLogin">${li.claimed ? "CLAIMED TODAY ✓" : `CLAIM DAY ${li.idx + 1} REWARD`}</button>
<div class="dashboard-grid mt">
 <section class="panel center"><h3>🎡 Lucky Spin</h3><div class="panel-sub">${isPro() ? "Pro: 2 free spins daily" : "1 free spin every day · Pro gets 2"}</div>${wheelHTML()}<button class="btn btn-primary mt" id="spinBtn" ${spinsLeft() ? "" : "disabled"} data-action="spin">${spinsLeft() ? `SPIN (${spinsLeft()} LEFT)` : "COME BACK TOMORROW"}</button></section>
 <section class="panel"><h3>🎯 Daily missions</h3><div class="panel-sub">Three fresh missions every day</div>${missionRows()}
  <div class="section-head"><h2>📺 Sponsor rewards</h2></div><p class="subtext">Watch a short sponsor message for +2 energy and 20 coins. ${CFG.ads.rewardedPerDay - state.ads.rewarded} left today.</p><button class="btn btn-secondary mt" data-action="rewardedAd" ${state.ads.rewarded >= CFG.ads.rewardedPerDay ? "disabled" : ""}>▶ WATCH & EARN</button></section>
</div>`;
}

function tourneyKey(id) { return id + "@" + weekKey(); }
function tourneyField(t) {
  const r = rng(t.id + weekKey());
  const scale = t.game === "quiz" ? 2600 : t.game === "word" ? 1500 : 1700;
  return D.players.map(p => ({ name: p.name, s: Math.round(scale * (0.35 + r() * 0.65)) })).sort((a, b) => b.s - a.s);
}
function tournamentsPage() {
  const rank = myRank();
  const all = [...D.tournaments, ...state.customTournaments.map((t, i) => ({ id: "custom" + i, name: t.name, icon: "📣", type: t.type || "OPEN", desc: t.desc || "", schedule: t.date || "TBA", prize: t.prize || "Announced soon", custom: true }))];
  return `<div class="eyebrow">COMPETE FOR GLORY</div><h1 class="page-title">Tournaments</h1><p class="subtext">Free entry. Skill decides. Prizes come from sponsors — never from players.</p>
<div class="tournament-list mt">${all.map(t => {
    let action = "", extra = "";
    if (t.game) {
      const best = state.tourneyBest[tourneyKey(t.id)] || 0, field = tourneyField(t), pos = best ? field.filter(x => x.s > best).length + 1 : null;
      extra = `<div class="t-status">${best ? `Your best this week: <b>${fmt(best)}</b> · projected <b>#${pos}</b> of ${field.length + 1}` : `Field leader: ${esc(field[0].name)} · ${fmt(field[0].s)}`}</div>`;
      action = `<button class="btn btn-primary btn-small" data-action="tourney" data-arg="${t.id}">PLAY QUALIFIER ${isPro() ? "" : "· ⚡1"}</button>`;
    } else if (t.id === "faculty") {
      action = `<button class="btn btn-secondary btn-small" data-action="lb" data-arg="wars">VIEW STANDINGS</button>`;
    } else if (t.id === "grand") {
      extra = `<div class="t-status">${rank <= 32 && state.points > 0 ? `✅ You're currently <b>#${rank}</b> — in the qualifying zone!` : `Climb the season leaderboard to qualify.`}</div>`;
      action = `<button class="btn btn-secondary btn-small" data-action="join" data-arg="${t.id}">${state.joined.includes(t.id) ? "REMINDER SET ✓" : "REMIND ME"}</button>`;
    } else {
      action = `<button class="btn btn-secondary btn-small" data-action="join" data-arg="${t.id}">${state.joined.includes(t.id) ? "REGISTERED ✓" : "REGISTER"}</button>`;
    }
    return `<article class="tournament-card"><div class="split"><div class="trophy">${t.icon}</div><span class="tag ${t.id === "grand" ? "orange" : ""}">${esc(t.type)}</span></div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p>${extra}<div class="tournament-bottom"><span>◷ ${esc(t.schedule)}</span><span>🎁 ${esc(t.prize)}</span></div><div class="split mt">${action}</div></article>`;
  }).join("")}</div>
<div class="panel mt sponsor-cta"><div><h3>🤝 Want your brand on a tournament?</h3><p class="subtext">Sponsor a named cup, provide the prizes, and reach every student who plays.</p></div><button class="btn btn-primary btn-small" data-action="go" data-arg="partners">SPONSOR A TOURNAMENT</button></div>`;
}

function leaderboardPage() {
  const tab = (id, t) => `<button class="chip ${lbTab === id ? "active" : ""}" data-action="lb" data-arg="${id}">${t}</button>`;
  let body;
  if (lbTab === "wars") body = `<h3>🏛️ Faculty Wars</h3><div class="panel-sub">Total Clash Points by faculty — every game you play adds to yours</div>${facultyWars()}`;
  else {
    const mode = lbTab, list = people(mode);
    const empty = (mode === "faculty" && !state.user.faculty) || (mode === "department" && !state.user.department);
    body = `<div class="split"><div><h3>🏆 ${{ overall: "Season rankings", weekly: "This week", faculty: "My faculty", department: "My department" }[mode]}</h3><div class="panel-sub">${mode === "weekly" ? "Resets every Monday" : "Season points"} · You are <b>#${list.findIndex(p => p.me) + 1}</b></div></div><span class="tag green">LIVE</span></div>
${empty ? `<div class="empty">Set your ${mode} in your profile to see this board.</div>` : `<table class="table"><thead><tr><th>RANK</th><th>PLAYER</th><th class="hide-sm">DEPARTMENT</th><th>POINTS</th></tr></thead><tbody>${list.map((p, i) => `<tr class="${p.me ? "you-row" : ""}"><td>${["🥇", "🥈", "🥉"][i] || i + 1}</td><td><b>${esc(p.name)}</b> ${p.me ? '<span class="tag">YOU</span>' : ""}</td><td class="hide-sm">${esc(p.dept || "")}</td><td><b>${fmt(p.pts)}</b></td></tr>`).join("")}</tbody></table>`}`;
  }
  return `<div class="eyebrow">THE CAMPUS TOP PLAYERS</div><h1 class="page-title">Leaderboard</h1><p class="subtext">Every answer moves you closer to the top.</p>
<div class="filter-row">${tab("overall", "Season")}${tab("weekly", "This week")}${tab("faculty", "My faculty")}${tab("department", "My department")}${tab("wars", "Faculty Wars")}</div><div class="panel">${body}</div>
<p class="small-note mt">Rival players are simulated in this offline build. Connect the backend (see README) for a real shared campus leaderboard.</p>`;
}

function badgeList() {
  const pl = id => (state.played[id] || 0) > 0;
  return [
    ["first", "⚡", "First Clash", "Play your first game", state.gamesPlayed > 0],
    ["sharp", "🎯", "Sharp Shooter", "25 correct answers", state.correct >= 25],
    ["winner", "🏆", "Winner", "Win a game", state.wins > 0],
    ["fire", "🔥", "On Fire", "3-day streak", state.bestStreak >= 3],
    ["week", "📅", "Week Warrior", "7-day streak", state.bestStreak >= 7],
    ["brain", "🧩", "Brainiac", "Play Brain Test", pl("brain")],
    ["word", "🔤", "Wordsmith", "500+ in Word Rush", (state.high.word || 0) >= 500],
    ["duel", "⚔️", "Duelist", "Win a 1v1 Clash", state.duelWins > 0],
    ["calc", "🧮", "Human Calculator", "1,500+ in Math Blitz", (state.high.blitz || 0) >= 1500],
    ["memory", "🃏", "Total Recall", "Finish Memory Flip", pl("memory")],
    ["combo", "💥", "Combo King", "8× answer combo", state.bestCombo >= 8],
    ["explorer", "🧭", "Explorer", "Play all 7 games", D.games.every(g => pl(g.id))],
    ["rising", "🌟", "Rising Star", "500 Clash Points", state.points >= 500],
    ["elite", "👑", "Campus Elite", "2,000 Clash Points", state.points >= 2000],
    ["supporter", "💎", "Supporter", "Go Pro or buy gems", state.purchases.length > 0 || isPro()],
    ["level10", "🚀", "Veteran", "Reach level 10", level(state.xp) >= 10]
  ];
}
function shareLink(params = "") {
  const base = (CFG.shareUrl || location.href.split("#")[0].split("?")[0]);
  return base + (params ? "?" + params : "");
}
function profilePage() {
  const badges = badgeList(), t = tierOf(state.points), u = state.user;
  const inviteText = `Join me on Campus Clash — quiz battles, word games & 1v1s for students! Use my code ${u.refCode} for 100 free coins: ${shareLink("ref=" + u.refCode)}`;
  return `<div class="eyebrow">YOUR PLAYER CARD</div><h1 class="page-title">My Profile</h1>
<section class="profile-hero mt">${avatarHTML("profile-avatar")}<div style="flex:1"><h2>${esc(u.name || "New Player")} ${isPro() ? '<span class="tag pro">PRO</span>' : ""}</h2><p>${esc(u.department || "Department not set")} · ${esc(u.level)} · ${esc(u.university || "University not set")}</p><p class="mt"><span class="tag">${t.icon} ${t.name.toUpperCase()}</span> <span class="tag green">LEVEL ${level(state.xp)}</span></p></div><div class="col-btns"><button class="btn btn-secondary btn-small" data-action="editProfile">EDIT PROFILE</button><button class="btn btn-secondary btn-small" data-action="store" data-arg="avatar">CUSTOMISE</button></div></section>
<div class="panel mt">${levelBar()}</div>
<div class="stats-grid"><div class="stat-card"><div class="stat-top">CLASH POINTS</div><div class="stat-value">${fmt(state.points)}</div></div><div class="stat-card"><div class="stat-top">GAMES</div><div class="stat-value">${fmt(state.gamesPlayed)}</div></div><div class="stat-card"><div class="stat-top">ACCURACY</div><div class="stat-value">${state.answers ? Math.round(state.correct / state.answers * 100) : 0}%</div></div><div class="stat-card"><div class="stat-top">WIN RATE</div><div class="stat-value">${state.gamesPlayed ? Math.round(state.wins / state.gamesPlayed * 100) : 0}%</div></div></div>
<div class="section-head"><div><h2>🏅 Personal bests</h2></div></div>
<div class="best-grid">${D.games.map(g => `<div class="best"><span>${g.icon}</span><small>${g.name}</small><b>${state.high[g.id] ? fmt(state.high[g.id]) : "—"}</b></div>`).join("")}</div>
<div class="section-head"><div><h2>Achievement collection</h2><p>Each badge pays 25 coins when unlocked.</p></div><span class="tag">${badges.filter(x => x[4]).length}/${badges.length} UNLOCKED</span></div>
<div class="badge-grid">${badges.map(b => `<div class="badge-card ${b[4] ? "" : "locked"}"><span>${b[1]}</span><b>${b[2]}</b><small>${b[3]}</small></div>`).join("")}</div>
<div class="panel mt invite"><div><h3>🤝 Invite friends, earn coins</h3><p class="subtext">Your code: <b class="code">${esc(u.refCode)}</b> — friends get 100 coins when they join with it. Clashing is better with your squad.</p></div><div class="col-btns"><a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(inviteText)}">SHARE ON WHATSAPP</a><button class="btn btn-secondary btn-small" data-action="copy" data-arg="${esc(inviteText)}">COPY INVITE</button></div></div>
<div class="section-head"><h2>Recent activity</h2></div>
<div class="panel">${state.history.length ? state.history.slice(-8).reverse().map(h => `<div class="rank-row"><span>${D.games.find(g => g.id === h.id)?.icon || "☀️"}</span><div class="rank-info"><b>${esc(h.name)} ${h.win ? '<span class="tag green">WIN</span>' : ""}</b><small>${esc(h.date)} · ${h.correct}/${h.total} · score ${fmt(h.score)}</small></div><b class="rank-score">+${h.points} pts</b></div>`).join("") : '<div class="empty">No games played yet. Your first match is waiting.</div>'}</div>`;
}

function costLabel(cost) { if (cost.pro) return "PRO"; if (cost.gems) return cost.gems + " 💎"; if (cost.coins) return cost.coins + " 🪙"; return "FREE"; }
function storePage() {
  const tab = (id, t) => `<button class="chip ${storeTab === id ? "active" : ""}" data-action="store" data-arg="${id}">${t}</button>`;
  let body = "";
  if (storeTab === "featured") {
    body = `<section class="pro-card"><div class="pro-copy"><span class="tag pro">CAMPUS PRO</span><h2>${isPro() ? "You're Pro ⚡" : "Play without limits."}</h2>${isPro() ? `<p>Active until <b>${new Date(state.proUntil).toLocaleDateString()}</b>. Extend any time.</p>` : ""}<ul>${CFG.proPerks.map(p => `<li>✓ ${esc(p)}</li>`).join("")}</ul></div><div class="plan-grid">${CFG.proPlans.map(p => `<button class="plan ${p.best ? "best" : ""}" data-action="buy" data-arg="${p.id}">${p.best ? "<i>MOST POPULAR</i>" : ""}<b>${esc(p.name)}</b><span class="price">${naira(p.price)}</span><small>${esc(p.note)} · ${p.days} days</small></button>`).join("")}</div></section>
<div class="section-head"><div><h2>💎 Gem packs</h2><p>Gems unlock premium avatars, frames, themes and instant refills. They never buy points or answers.</p></div></div>
<div class="gem-grid">${CFG.gemPacks.map(g => `<button class="gem-pack ${g.best ? "best" : ""}" data-action="buy" data-arg="${g.id}">${g.tag ? `<i>${g.tag}</i>` : ""}<span>💎</span><b>${fmt(g.gems)} gems</b><span class="price">${naira(g.price)}</span></button>`).join("")}</div>
<div class="section-head"><div><h2>⚡ Instant energy</h2></div></div>
<div class="gem-grid"><button class="gem-pack" data-action="refill" data-arg="coins"><span>⚡</span><b>Full refill</b><span class="price">${CFG.energy.refillCoins} 🪙</span></button><button class="gem-pack" data-action="refill" data-arg="gems"><span>⚡</span><b>Full refill</b><span class="price">${CFG.energy.refillGems} 💎</span></button><button class="gem-pack" data-action="rewardedAd"><span>📺</span><b>+2 energy</b><span class="price">Watch sponsor</span></button></div>
<p class="small-note mt">${CFG.paystackPublicKey ? "Payments are processed securely by Paystack." : "DEMO MODE: no Paystack key configured — checkouts are simulated and no money is charged. Add your key in config.js to go live."}</p>`;
  } else if (storeTab === "powerups") {
    body = `<div class="gem-grid">${Object.entries(D.powerups).map(([id, p]) => `<div class="gem-pack static"><span>${p.icon}</span><b>${p.name}</b><small>${p.desc}</small><small>You own: <b>${state.powerups[id] || 0}</b></small><button class="btn btn-primary btn-small" data-action="buyPowerup" data-arg="${id}">${p.price} 🪙</button></div>`).join("")}<div class="gem-pack static"><span>🧊</span><b>Streak Freeze</b><small>Protects your streak if you miss one day</small><small>You own: <b>${state.freezes}</b></small><button class="btn btn-primary btn-small" data-action="buyPowerup" data-arg="freeze">150 🪙</button></div></div><p class="small-note mt">Power-ups are bought with coins earned by playing — they're disabled in Daily Quests, 1v1 and tournament qualifiers to keep competition fair.</p>`;
  } else {
    const kind = storeTab, items = D.cosmetics[kind];
    body = `<div class="cos-grid">${items.map(it => {
      const key = kind + ":" + it.id, owned = state.owned.includes(key) || (it.cost.pro && isPro()), equipped = state.user[kind] === it.id;
      const preview = kind === "avatar" ? `<div class="avatar big frame-${esc(state.user.frame)}">${it.id}</div>` : kind === "frame" ? `<div class="avatar big frame-${it.id}">${esc(state.user.avatar)}</div>` : `<div class="theme-swatch" style="background:linear-gradient(135deg,${it.a},${it.b})"></div>`;
      return `<div class="cos ${equipped ? "equipped" : ""}">${preview}<b>${esc(it.name || "")}</b>${equipped ? `<span class="tag green">EQUIPPED</span>` : owned ? `<button class="btn btn-secondary btn-small" data-action="equip" data-arg="${key}">EQUIP</button>` : `<button class="btn btn-primary btn-small" data-action="buyCosmetic" data-arg="${key}">${costLabel(it.cost)}</button>`}</div>`;
    }).join("")}</div>`;
  }
  return `<div class="eyebrow">LEVEL UP YOUR LOOK</div><h1 class="page-title">Store</h1><p class="subtext">You have <b>${fmt(state.coins)} 🪙</b> and <b>${fmt(state.gems)} 💎</b>. Earn coins by playing, completing missions and daily rewards.</p>
<div class="filter-row">${tab("featured", "⭐ Pro & Gems")}${tab("powerups", "Power-ups")}${tab("avatar", "Avatars")}${tab("frame", "Frames")}${tab("theme", "Themes")}</div>${body}`;
}

function partnersPage() {
  return `<div class="eyebrow">ADVERTISE · SPONSOR · PARTNER</div><h1 class="page-title">Partner with Campus Clash</h1><p class="subtext">Put your brand in front of students every day — in a place they actually want to be.</p>
<div class="stats-grid"><div class="stat-card"><div class="stat-top">DAILY HABIT</div><div class="stat-value">Daily</div><div class="stat-note">Streaks, missions & quests bring players back</div></div><div class="stat-card"><div class="stat-top">AUDIENCE</div><div class="stat-value">16–30</div><div class="stat-note">University students</div></div><div class="stat-card"><div class="stat-top">FORMATS</div><div class="stat-value">4</div><div class="stat-note">Banners, quests, cups, events</div></div><div class="stat-card"><div class="stat-top">REPORTING</div><div class="stat-value">Weekly</div><div class="stat-note">Impressions & engagement</div></div></div>
<div class="section-head"><div><h2>Packages</h2><p>Prices in Naira. Custom bundles available.</p></div></div>
<div class="package-grid">${CFG.sponsorPackages.map(p => `<article class="package ${p.best ? "best" : ""}">${p.best ? "<i>MOST REQUESTED</i>" : ""}<span class="pk-icon">${p.icon}</span><h3>${esc(p.name)}</h3><div class="price">${naira(p.price)} <small>${esc(p.unit)}</small></div><ul>${p.items.map(x => `<li>✓ ${esc(x)}</li>`).join("")}</ul><a class="btn btn-primary btn-small" href="mailto:${CFG.partnersEmail}?subject=${encodeURIComponent("Campus Clash — " + p.name)}&body=${encodeURIComponent("Hello Campus Clash team,\n\nWe're interested in the " + p.name + " package.\n\nBrand:\nContact person:\nPhone:\nPreferred start date:\n")}">REQUEST THIS PACKAGE</a></article>`).join("")}</div>
<div class="panel mt"><h3>📋 Our promise to students & sponsors</h3><p class="subtext">Free to play. No cash entry fees. Prizes are provided by sponsors and awarded on skill. Ads never appear during active gameplay. Paid items are cosmetic or convenience only — nobody can buy points or answers.</p></div>`;
}

function adminPage() {
  if (sessionStorage.getItem("cc_admin") !== "1") {
    return `<div class="eyebrow">CONTROL ROOM</div><h1 class="page-title">Admin Studio</h1><div class="panel narrow"><h3>🔒 Enter admin PIN</h3><p class="panel-sub">Demo PIN is set in config.js (default 2468). Replace with server-side roles before launch.</p><form id="pinForm" class="form-grid"><div class="field full"><input name="pin" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off"></div><div class="field full"><button class="btn btn-primary">UNLOCK</button></div></form></div>`;
  }
  const tab = (id, t) => `<button class="chip ${adminTab === id ? "active" : ""}" data-action="adminTab" data-arg="${id}">${t}</button>`;
  const rev = state.purchases.reduce((a, p) => a + (p.amount || 0), 0);
  return `<div class="eyebrow">CONTROL ROOM</div><h1 class="page-title">Admin Studio</h1><p class="subtext">Manage content, tournaments and revenue.</p>
<div class="stats-grid"><div class="stat-card"><div class="stat-top">QUESTION BANK</div><div class="stat-value">${D.quiz.length + D.words.length + D.brains.length + D.pictures.length + state.adminQuestions.length}</div><div class="stat-note">${state.adminQuestions.length} custom</div></div><div class="stat-card"><div class="stat-top">REVENUE (THIS DEVICE)</div><div class="stat-value">${naira(rev)}</div><div class="stat-note">${state.purchases.length} purchases</div></div><div class="stat-card"><div class="stat-top">AD IMPRESSIONS</div><div class="stat-value">${fmt(state.adImpressions)}</div><div class="stat-note">House ads shown</div></div><div class="stat-card"><div class="stat-top">GAMES COMPLETED</div><div class="stat-value">${fmt(state.gamesPlayed)}</div><div class="stat-note">This device</div></div></div>
<div class="admin-tabs">${tab("questions", "Question bank")}${tab("tournaments", "Tournaments")}${tab("revenue", "Revenue model")}${tab("settings", "Settings")}</div><div class="admin-content">${adminContent()}</div>`;
}
function adminContent() {
  if (adminTab === "questions") return `<div class="split"><div><h3>Custom questions</h3><p class="panel-sub">Multiple-choice questions join Quiz Battle (category "Campus"). Typed-answer questions join Brain Test.</p></div><button class="btn btn-primary btn-small" data-action="addQuestion">+ ADD QUESTION</button></div>${state.adminQuestions.length ? state.adminQuestions.map((q, i) => `<div class="rank-row"><div class="rank-info"><b>${esc(q.q)}</b><small>${q.type === "mcq" ? "Quiz · answer: " + esc(q.a[q.c]) : "Brain Test · answer: " + esc(q.a)}</small></div><button class="text-btn" data-action="deleteQ" data-arg="${i}">DELETE</button></div>`).join("") : '<div class="empty">No custom questions yet.</div>'}`;
  if (adminTab === "tournaments") return `<h3>Create a tournament announcement</h3><form id="tournamentForm" class="form-grid mt"><div class="field full"><label>TOURNAMENT NAME</label><input name="name" required placeholder="e.g. Faculty Quiz Face-off"></div><div class="field"><label>FORMAT</label><select name="type"><option>OPEN REGISTRATION</option><option>TEAM EVENT</option><option>KNOCKOUT</option><option>SPONSORED CUP</option></select></div><div class="field"><label>DATE / SCHEDULE</label><input name="date" placeholder="e.g. Friday, 4 PM"></div><div class="field"><label>PRIZE (SPONSOR-PROVIDED)</label><input name="prize" placeholder="e.g. Branded hoodies"></div><div class="field"><label>DESCRIPTION</label><input name="desc" placeholder="What is this tournament about?"></div><div class="field full"><button class="btn btn-primary">CREATE ANNOUNCEMENT</button></div></form>${state.customTournaments.map((t, i) => `<div class="rank-row"><div class="rank-info"><b>${esc(t.name)}</b><small>${esc(t.date)} · ${esc(t.type)}</small></div><button class="text-btn" data-action="deleteT" data-arg="${i}">DELETE</button></div>`).join("")}`;
  if (adminTab === "revenue") return `<h3>Revenue projection</h3><p class="panel-sub">Adjust the assumptions to estimate monthly revenue. Defaults use prices from config.js.</p>
<form id="revForm" class="form-grid three">
 ${[["mau", "Monthly active students", 2000], ["proPct", "Pro conversion %", 3], ["proPrice", "Avg Pro price / month (₦)", CFG.proPlans.find(p => p.best)?.price || 1500], ["gemPct", "Gem buyers %", 2], ["gemSpend", "Avg gem spend (₦)", 1000], ["adViews", "Ad views / user / month", 60], ["ecpm", "Ad value per 1,000 views (₦)", 400], ["sponsors", "Sponsor deals / month", 2], ["deal", "Avg sponsor deal (₦)", 40000]].map(([n, l, v]) => `<div class="field"><label>${l}</label><input type="number" min="0" step="any" name="${n}" value="${v}"></div>`).join("")}
</form><div id="revOut" class="rev-out"></div>
<h3 class="mt">Purchases on this device</h3>${state.purchases.length ? state.purchases.slice().reverse().map(p => `<div class="rank-row"><div class="rank-info"><b>${esc(p.name)}</b><small>${new Date(p.at).toLocaleString()} · ref ${esc(p.ref)} ${p.demo ? "· DEMO" : ""}</small></div><b class="rank-score">${naira(p.amount)}</b></div>`).join("") : '<div class="empty">No purchases yet.</div>'}`;
  return `<h3>Platform settings</h3><div class="rank-row"><div class="rank-info"><b>Sound effects</b><small>Game sounds on this device</small></div><button class="btn btn-secondary btn-small" data-action="toggleSound">${state.settings.sound ? "ON" : "OFF"}</button></div><div class="rank-row"><div class="rank-info"><b>Payment gateway</b><small>${CFG.paystackPublicKey ? "Paystack key configured" : "Demo mode — add paystackPublicKey in config.js"}</small></div><span class="tag ${CFG.paystackPublicKey ? "green" : "orange"}">${CFG.paystackPublicKey ? "LIVE" : "DEMO"}</span></div><div class="rank-row"><div class="rank-info"><b>Live multiplayer & shared leaderboard</b><small>Needs the Supabase backend described in README</small></div><span class="tag orange">NEXT PHASE</span></div><button class="btn btn-secondary mt" data-action="export">EXPORT DATA</button> <button class="btn btn-secondary mt" data-action="grant">+500 🪙 TEST COINS</button> <button class="btn btn-danger mt" data-action="reset">RESET ALL DATA</button> <button class="btn btn-secondary mt" data-action="lockAdmin">LOCK ADMIN</button>`;
}
function calcRevenue() {
  const f = $("#revForm"); if (!f) return;
  const v = Object.fromEntries([...new FormData(f)].map(([k, x]) => [k, +x || 0]));
  const pro = v.mau * v.proPct / 100 * v.proPrice, gems = v.mau * v.gemPct / 100 * v.gemSpend, ads = v.mau * v.adViews / 1000 * v.ecpm, sp = v.sponsors * v.deal;
  const total = pro + gems + ads + sp;
  const row = (l, x) => `<div class="rev-row"><span>${l}</span><div class="progress thin"><span style="width:${total ? x / total * 100 : 0}%"></span></div><b>${naira(x)}</b></div>`;
  $("#revOut").innerHTML = `${row("Campus Pro", pro)}${row("Gem packs", gems)}${row("Ads", ads)}${row("Sponsors", sp)}<div class="rev-total"><span>Projected monthly revenue</span><b>${naira(total)}</b></div><small class="small-note">≈ ${naira(total * 12)} per year · ${naira(v.mau ? total / v.mau : 0)} per active student</small>`;
}

function afterRender(name) {
  if (name === "admin") {
    $("#pinForm")?.addEventListener("submit", e => { e.preventDefault(); if (new FormData(e.target).get("pin") === CFG.adminPin) { sessionStorage.setItem("cc_admin", "1"); refresh(); } else toast("Wrong PIN"); });
    $("#tournamentForm")?.addEventListener("submit", e => { e.preventDefault(); state.customTournaments.push(Object.fromEntries(new FormData(e.target))); save(); refresh(); toast("Tournament published to the Tournaments page"); });
    $("#revForm")?.addEventListener("input", calcRevenue); calcRevenue();
  }
}

/* ---------------- modal ---------------- */
let modalOnClose = null;
function showModal(html, opts = {}) {
  $("#modalBody").innerHTML = html;
  $("#modal .modal").className = "modal" + (opts.cls ? " " + opts.cls : "");
  $("#modalClose").classList.toggle("hidden", !!opts.noClose);
  modalOnClose = opts.onClose || null;
  $("#modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
}
function closeModal(force) {
  if (G && !G.over && !force) { abortGame(); return; }
  stopTimers();
  $("#modal").classList.add("hidden"); document.body.classList.remove("modal-open");
  const cb = modalOnClose; modalOnClose = null; if (cb) cb();
}

/* ---------------- rewards: login, spin, missions, ads ---------------- */
function grant(r, mult = 1) {
  const out = [];
  if (r.coins) { state.coins += r.coins * mult; out.push(`+${r.coins * mult} 🪙`); }
  if (r.gems) { state.gems += r.gems; out.push(`+${r.gems} 💎`); }
  if (r.energy) { addEnergy(r.energy); out.push(`+${r.energy} ⚡`); }
  if (r.powerup) { state.powerups[r.powerup] = (state.powerups[r.powerup] || 0) + (r.n || 1); out.push(`+${r.n || 1} ${D.powerups[r.powerup].name}`); }
  return out.join(" ");
}
function claimLogin() {
  const li = loginIndex(); if (li.claimed) return toast("Already claimed today — see you tomorrow!");
  const r = D.loginRewards[li.idx];
  state.login = { last: todayStr(), day: li.idx };
  const txt = grant(r); save(); sfx.coin();
  showModal(`<div class="result"><div class="big">🎁</div><div class="eyebrow">DAY ${li.idx + 1} LOGIN REWARD</div><h2>${txt}</h2><p>Come back tomorrow for Day ${(li.idx + 1) % 7 + 1}${li.idx === 5 ? " — the big gem reward!" : "."}</p><button class="btn btn-primary mt" data-action="closeModal">AWESOME</button></div>`);
  if (current === "daily" || current === "home") refresh();
}
let spinning = false;
function spin() {
  if (spinning) return; if (!spinsLeft()) return toast("No spins left today");
  const total = D.spinPrizes.reduce((a, p) => a + p.w, 0); let r = Math.random() * total, idx = 0;
  for (let i = 0; i < D.spinPrizes.length; i++) { r -= D.spinPrizes[i].w; if (r <= 0) { idx = i; break; } }
  const seg = 360 / D.spinPrizes.length, center = idx * seg + seg / 2;
  const cur = state.spin.rot || 0, base = cur - (cur % 360);
  const target = base + 360 * 6 + (360 - center);
  if (state.spin.date !== todayStr()) state.spin = { date: todayStr(), used: 0, rot: cur };
  state.spin.used++; state.spin.rot = target;
  const prize = D.spinPrizes[idx]; const txt = grant(prize); save();
  spinning = true; const w = $("#wheel"); $("#spinBtn").disabled = true;
  const ticker = setInterval(() => beep(700 + Math.random() * 200, .02, "square", .02), 120);
  w.style.transition = "transform 4s cubic-bezier(.17,.67,.12,1)"; w.style.transform = `rotate(${target}deg)`;
  setTimeout(() => { clearInterval(ticker); spinning = false; sfx.win(); confetti(); toast(`🎡 You won ${txt}!`); refresh(); }, 4100);
}
function claimMission(id) {
  const m = D.missions.find(x => x.id === id); if (!m || state.missions.claimed.includes(id)) return;
  if ((state.missions.progress[id] || 0) < m.goal) return;
  state.missions.claimed.push(id); state.coins += m.reward; sfx.coin();
  let msg = `Mission complete: +${m.reward} 🪙`;
  if (state.missions.claimed.length === state.missions.ids.length && !state.missions.bonus) { state.missions.bonus = true; state.gems += 3; msg += " · All done! +3 💎"; confetti(); }
  save(); toast(msg); refresh();
}
function sponsorBreak({ title, seconds, onDone, rewardText }) {
  const s = pick(CFG.sponsors); state.adImpressions++; save();
  let left = seconds;
  showModal(`<div class="sponsor-break" style="--ad:${s.color}"><small>${esc(title)}</small><div class="sb-emoji">${s.emoji}</div><h2>${esc(s.name)}</h2><p>${esc(s.tagline)}</p><button class="btn btn-secondary btn-small" data-action="go" data-arg="${s.page}">${esc(s.cta)}</button><div class="sb-timer"><div class="progress"><span id="sbBar" style="width:0%"></span></div><button class="btn btn-primary mt" id="sbBtn" disabled>${rewardText ? "Reward in" : "Continue in"} ${left}s</button></div>${isPro() ? "" : `<button class="text-btn mt" data-action="go" data-arg="store">Go Pro to remove sponsor breaks →</button>`}</div>`, { noClose: true, cls: "narrow" });
  const t = setInterval(() => {
    left--; const b = $("#sbBtn"), bar = $("#sbBar"); if (!b) { clearInterval(t); return; }
    bar.style.width = ((seconds - left) / seconds * 100) + "%";
    if (left <= 0) { clearInterval(t); b.disabled = false; b.textContent = rewardText || "CONTINUE →"; b.onclick = () => { closeModal(true); onDone && onDone(); }; }
    else b.textContent = `${rewardText ? "Reward in" : "Continue in"} ${left}s`;
  }, 1000);
}
function rewardedAd() {
  if (state.ads.rewarded >= CFG.ads.rewardedPerDay) return toast("You've used today's sponsor rewards");
  sponsorBreak({
    title: "SPONSOR MESSAGE", seconds: CFG.ads.rewardedSeconds, rewardText: "CLAIM +2 ⚡ & 20 🪙",
    onDone: () => { state.ads.rewarded++; addEnergy(2); state.coins += 20; save(); sfx.coin(); toast("+2 ⚡ and +20 🪙 added"); refresh(); }
  });
}
function outOfEnergy() {
  syncEnergy();
  showModal(`<div class="result"><div class="big">🪫</div><div class="eyebrow">OUT OF ENERGY</div><h2>Recharging…</h2><p>Next energy in <b>${mmss(regenMs() - (Date.now() - state.energyTs))}</b>. Or jump back in now:</p>
  <div class="option-list">
   <button class="opt" data-action="rewardedAd" ${state.ads.rewarded >= CFG.ads.rewardedPerDay ? "disabled" : ""}><span>📺</span><div><b>Watch a sponsor clip</b><small>+2 energy · free (${CFG.ads.rewardedPerDay - state.ads.rewarded} left today)</small></div></button>
   <button class="opt" data-action="refill" data-arg="coins"><span>🪙</span><div><b>Refill with coins</b><small>${CFG.energy.refillCoins} coins · you have ${fmt(state.coins)}</small></div></button>
   <button class="opt" data-action="refill" data-arg="gems"><span>💎</span><div><b>Refill with gems</b><small>${CFG.energy.refillGems} gems · you have ${fmt(state.gems)}</small></div></button>
   <button class="opt pro" data-action="go" data-arg="store"><span>⭐</span><div><b>Go Pro — never run out</b><small>From ${naira(CFG.proPlans[0].price)}</small></div></button>
   <button class="opt" data-action="play" data-arg="daily" ${state.daily.done ? "disabled" : ""}><span>☀️</span><div><b>Play the Daily Quest</b><small>Always free</small></div></button>
  </div></div>`);
}
function refill(kind) {
  syncEnergy();
  if (isPro()) return toast("Pro players have unlimited energy ⚡");
  if (kind === "coins") { if (state.coins < CFG.energy.refillCoins) return toast("Not enough coins"); state.coins -= CFG.energy.refillCoins; }
  else { if (state.gems < CFG.energy.refillGems) { toast("Not enough gems"); storeTab = "featured"; closeModal(true); return go("store"); } state.gems -= CFG.energy.refillGems; }
  state.energy = Math.max(state.energy, CFG.energy.max); state.energyTs = Date.now(); save(); sfx.coin(); toast("⚡ Energy refilled!");
  if (!$("#modal").classList.contains("hidden")) closeModal(true); refresh();
}

/* ---------------- store actions ---------------- */
function buyPowerup(id) {
  const price = id === "freeze" ? 150 : D.powerups[id].price;
  if (state.coins < price) return toast(`Need ${price} 🪙 — play games or complete missions to earn more`);
  state.coins -= price; if (id === "freeze") state.freezes++; else state.powerups[id] = (state.powerups[id] || 0) + 1;
  save(); sfx.coin(); toast(`Bought ${id === "freeze" ? "🧊 Streak Freeze" : D.powerups[id].name}`); refresh();
}
function buyCosmetic(key) {
  const [kind, id] = key.split(":"); const it = D.cosmetics[kind].find(x => x.id === id); if (!it) return;
  if (it.cost.pro) { toast("This item is included with Campus Pro"); storeTab = "featured"; return refresh(); }
  if (it.cost.coins && state.coins < it.cost.coins) return toast("Not enough coins");
  if (it.cost.gems && state.gems < it.cost.gems) { toast("Not enough gems — grab a gem pack"); storeTab = "featured"; return refresh(); }
  state.coins -= it.cost.coins || 0; state.gems -= it.cost.gems || 0; state.owned.push(key); state.user[kind] = id;
  save(); applyTheme(); sfx.coin(); toast("Unlocked & equipped!"); refresh();
}
function equip(key) { const [kind, id] = key.split(":"); state.user[kind] = id; save(); applyTheme(); toast("Equipped"); refresh(); }

/* ---------------- payments (Paystack) ---------------- */
function product(id) {
  const p = CFG.proPlans.find(x => x.id === id); if (p) return { id, name: p.name, amount: p.price, kind: "pro", days: p.days };
  const g = CFG.gemPacks.find(x => x.id === id); if (g) return { id, name: `${g.gems} Gems`, amount: g.price, kind: "gems", gems: g.gems };
  return null;
}
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); }); }
function deliver(pr, ref, demo) {
  if (pr.kind === "pro") state.proUntil = Math.max(Date.now(), state.proUntil) + pr.days * DAY;
  if (pr.kind === "gems") state.gems += pr.gems;
  state.purchases.push({ id: pr.id, name: pr.name, amount: pr.amount, ref, at: Date.now(), demo: !!demo });
  save(); applyTheme(); sfx.win(); confetti();
  showModal(`<div class="result"><div class="big">${pr.kind === "pro" ? "⭐" : "💎"}</div><div class="eyebrow">PAYMENT SUCCESSFUL</div><h2>${pr.kind === "pro" ? "Welcome to Campus Pro!" : `+${fmt(pr.gems)} gems added`}</h2><p>${pr.kind === "pro" ? `Unlimited energy, 2× coins and no sponsor breaks until ${new Date(state.proUntil).toLocaleDateString()}.` : "Spend them on premium avatars, frames and themes."}</p><small class="small-note">Ref: ${esc(ref)}${demo ? " · DEMO (no money charged)" : ""}</small><br><button class="btn btn-primary mt" data-action="closeModal">LET'S GO</button></div>`, { onClose: refresh });
}
async function buy(id) {
  const pr = product(id); if (!pr) return;
  if (!state.user.email || !/@/.test(state.user.email)) { toast("Add your email in your profile first (needed for receipts)"); return editProfile(); }
  const ref = "CC-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  if (!CFG.paystackPublicKey) {
    showModal(`<div class="eyebrow">CHECKOUT · DEMO MODE</div><h2 class="page-title">${esc(pr.name)}</h2><p class="subtext">Amount: <b>${naira(pr.amount)}</b><br>No Paystack key is configured, so this checkout is simulated and <b>no money is charged</b>. Add your public key in <code>config.js</code> to accept real payments.</p><div class="split mt"><button class="btn btn-secondary" data-action="closeModal">CANCEL</button><button class="btn btn-primary" id="demoPay">SIMULATE PAYMENT</button></div>`, { cls: "narrow" });
    $("#demoPay").onclick = () => deliver(pr, ref, true);
    return;
  }
  try { await loadScript("https://js.paystack.co/v1/inline.js"); } catch { return toast("Couldn't reach Paystack — check your connection"); }
  const handler = window.PaystackPop.setup({
    key: CFG.paystackPublicKey, email: state.user.email, amount: pr.amount * 100, currency: "NGN", ref,
    metadata: { product: pr.id, player: state.user.name, refCode: state.user.refCode },
    callback: res => {
      toast("Verifying payment…");
      fetch(CFG.verifyUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: res.reference, productId: pr.id }) })
        .then(r => r.json()).then(j => { if (j.ok) deliver(pr, res.reference, false); else showModal(`<div class="result"><div class="big">⚠️</div><h2>Payment not verified</h2><p>${esc(j.error || "Please contact support")} — ref ${esc(res.reference)}</p></div>`); })
        .catch(() => showModal(`<div class="result"><div class="big">⏳</div><h2>Verification pending</h2><p>We received your payment but couldn't confirm it yet. Email <b>${esc(CFG.supportEmail)}</b> with reference <b>${esc(res.reference)}</b>.</p></div>`));
    },
    onClose: () => toast("Payment window closed")
  });
  handler.openIframe();
}

/* ---------------- profile & onboarding ---------------- */
function profileFields(u) {
  return `<div class="field full"><label>FULL NAME</label><input name="name" required maxlength="40" value="${esc(u.name)}" placeholder="e.g. Chiamaka Obi"></div>
<div class="field"><label>EMAIL (for receipts & recovery)</label><input name="email" type="email" value="${esc(u.email)}" placeholder="you@email.com"></div>
<div class="field"><label>UNIVERSITY</label><input name="university" list="uniList" value="${esc(u.university)}" placeholder="Your university"><datalist id="uniList">${D.universities.map(x => `<option value="${esc(x)}">`).join("")}</datalist></div>
<div class="field"><label>FACULTY</label><select name="faculty"><option value="">Select faculty</option>${D.faculties.map(f => `<option ${u.faculty === f ? "selected" : ""}>${esc(f)}</option>`).join("")}</select></div>
<div class="field"><label>DEPARTMENT</label><input name="department" maxlength="40" value="${esc(u.department)}" placeholder="e.g. Accounting"></div>
<div class="field full"><label>LEVEL</label><select name="level">${["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "Staff / Alumni"].map(x => `<option ${u.level === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>`;
}
function editProfile() {
  showModal(`<div class="eyebrow">PLAYER SETTINGS</div><h2 class="page-title">Edit your profile</h2><form id="profileForm" class="form-grid">${profileFields(state.user)}<div class="field full"><button class="btn btn-primary">SAVE PROFILE</button></div></form>`);
  $("#profileForm").onsubmit = e => { e.preventDefault(); Object.assign(state.user, Object.fromEntries(new FormData(e.target))); save(); closeModal(true); refresh(); toast("Profile updated"); };
}
function onboarding() {
  const ref = new URLSearchParams(location.search).get("ref") || "";
  showModal(`<div class="onb-head"><div class="brand-mark big">⚡</div><div><div class="eyebrow">WELCOME TO THE ARENA</div><h2 class="page-title">Create your player card</h2></div></div><p class="subtext">Seven games. One campus leaderboard. Set up in 20 seconds and get <b>100 free coins</b>.</p>
<form id="onbForm" class="form-grid mt">${profileFields(state.user)}<div class="field full"><label>INVITE CODE (optional)</label><input name="ref" value="${esc(ref)}" placeholder="e.g. CCAB12CD" maxlength="10"></div><div class="field full"><button class="btn btn-primary big-btn">START PLAYING →</button></div></form>`, { noClose: true });
  $("#onbForm").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const code = (d.ref || "").trim().toUpperCase(); delete d.ref;
    Object.assign(state.user, d); state.onboarded = true;
    let bonus = 100;
    if (code && code !== state.user.refCode) { state.referredBy = code; bonus += 100; }
    state.coins = Math.max(state.coins, 0) + (state.gamesPlayed ? 0 : bonus - 100);
    save(); closeModal(true); history.replaceState(null, "", location.pathname + location.hash);
    applyTheme(); refresh(); sfx.win(); confetti();
    toast(`Welcome, ${esc(firstName())}! ${code ? "Invite bonus: +100 🪙" : "You've got coins to spend 🪙"}`);
    setTimeout(() => { if (checkChallengeLink()) return; claimLogin(); }, 1200);
  };
}
function howToPlay() {
  showModal(`<div class="eyebrow">WELCOME TO THE ARENA</div><h2 class="page-title">How to play</h2><p class="subtext">Play games to earn <b>Clash Points</b> (your ranking), <b>XP</b> (your level) and <b>coins</b> (spend them in the Store). Answer fast and keep combos going for big scores.</p>
${D.games.map(g => `<div class="rank-row"><span>${g.icon}</span><div class="rank-info"><b>${g.name}</b><small>${g.desc}</small></div></div>`).join("")}
<div class="rank-row"><span>⚡</span><div class="rank-info"><b>Energy</b><small>Each game uses 1 energy (${CFG.energy.max} max, +1 every ${CFG.energy.regenMinutes} min). Daily Quest is always free. Pro = unlimited.</small></div></div>
<div class="rank-row"><span>🔥</span><div class="rank-info"><b>Streaks, missions & daily rewards</b><small>Play every day to grow your streak and claim rewards in the Daily Hub.</small></div></div>
<div class="rank-row"><span>⌨️</span><div class="rank-info"><b>Shortcuts</b><small>Press 1–4 to answer multiple choice; Enter submits typed answers.</small></div></div>`);
}

/* =========================================================
   GAME ENGINE
   ========================================================= */
let G = null, timers = [];
function stopTimers() { timers.forEach(t => { clearInterval(t); clearTimeout(t); }); timers = []; }
const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

function quizPool() {
  const custom = state.adminQuestions.filter(q => q.type === "mcq").map(q => ({ cat: "Campus", q: q.q, a: q.a, c: +q.c, why: q.why || "" }));
  return [...D.quiz, ...custom];
}
function brainPool() { return [...D.brains, ...state.adminQuestions.filter(q => q.type === "text").map(q => ({ q: q.q, a: q.a, hint: q.hint || "Think carefully." }))]; }
function pictureItems(n, r = Math.random) {
  return shuffle(D.pictures, r).slice(0, n).map(([emoji, ans]) => {
    const wrong = shuffle(D.pictures.filter(p => p[1] !== ans), r).slice(0, 3).map(p => p[1]);
    const a = shuffle([ans, ...wrong], r); return { emoji, q: "What do these clues make?", a, c: a.indexOf(ans), why: `${emoji} → ${ans}` };
  });
}
function shuffleOptions(item, r = Math.random) {
  const order = shuffle(item.a.map((_, i) => i), r);
  return { ...item, a: order.map(i => item.a[i]), c: order.indexOf(item.c) };
}

function startGame(id, opts = {}) {
  if (!state.onboarded) return onboarding();
  if (id === "daily" && state.daily.done) return toast("Daily Quest done — come back tomorrow!");
  if (id === "quiz" && !opts.category && !opts.tourney) return chooseCategory();
  const free = id === "daily";
  if (!free && !spendEnergy()) return;
  stopTimers();
  G = { id, opts, score: 0, correct: 0, total: 0, combo: 0, maxCombo: 0, over: false, started: Date.now() };
  sfx.tap();
  ({ quiz: initQuiz, daily: initDaily, picture: initPicture, duel: initDuel, word: initWord, brain: initBrain, blitz: initBlitz, memory: initMemory }[id] || initQuiz)();
}
function abortGame() {
  if (!G) return closeModal(true);
  const g = G; G.over = true; stopTimers();
  showModal(`<div class="result"><div class="big">🏳️</div><h2>Game abandoned</h2><p>No points this time — energy isn't refunded.</p><button class="btn btn-primary mt" data-action="play" data-arg="${g.id === "daily" ? "quiz" : g.id}">PLAY AGAIN</button> <button class="btn btn-secondary mt" data-action="closeModal">CLOSE</button></div>`);
  G = null;
}
function chooseCategory() {
  const pool = quizPool();
  showModal(`<div class="eyebrow">QUIZ BATTLE</div><h2 class="page-title">Pick a category</h2><p class="subtext">10 questions · 15 seconds each · combos multiply your score.</p><div class="cat-grid">${[...D.quizCategories, ...(pool.some(q => q.cat === "Campus") ? ["Campus"] : [])].map(c => `<button class="cat" data-action="quizCat" data-arg="${c}"><b>${{ Mixed: "🎲", General: "🌍", Science: "🔬", Business: "📈", Nigeria: "🇳🇬", Tech: "💻", Sports: "⚽", Campus: "🎓" }[c] || "❓"}</b>${c}<small>${c === "Mixed" ? pool.length : pool.filter(q => q.cat === c).length} questions</small></button>`).join("")}</div>`, { cls: "game" });
}
function gameHeader(extra = "") {
  const g = D.games.find(x => x.id === G.id) || { name: "Daily Quest", icon: "☀️" };
  return `<div class="g-head"><div class="g-title">${g.icon} ${G.opts.tourney ? "QUALIFIER · " : ""}${g.name.toUpperCase()}</div><div class="g-stats"><span>SCORE <b id="gScore">${fmt(G.score)}</b></span><span class="combo ${G.combo >= 2 ? "hot" : ""}" id="gCombo">${G.combo >= 2 ? `🔥 ${G.combo}×` : ""}</span></div></div>${extra}`;
}
function mult() { return 1 + Math.min(G.combo, 10) * 0.1; }
function bumpScore(pts) {
  G.score += Math.round(pts);
  const el = $("#gScore"); if (el) { el.textContent = fmt(G.score); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  const c = $("#gCombo"); if (c) { c.textContent = G.combo >= 2 ? `🔥 ${G.combo}×` : ""; c.classList.toggle("hot", G.combo >= 2); }
}
function floatText(txt, good = true) {
  const box = $("#modalBody"); if (!box) return;
  const f = document.createElement("div"); f.className = "float-pts " + (good ? "good" : "bad"); f.textContent = txt; box.append(f); setTimeout(() => f.remove(), 900);
}

/* ---- Multiple-choice engine (Quiz, Daily, Picture, Duel) ---- */
function initQuiz() {
  let pool = quizPool(), r = Math.random;
  if (G.opts.tourney) { r = rng("weekly" + weekKey()); }
  else if (G.opts.category && G.opts.category !== "Mixed") pool = pool.filter(q => q.cat === G.opts.category);
  G.items = shuffle(pool, r).slice(0, 10).map(it => shuffleOptions(it, r));
  G.timePer = 15; G.powerups = !G.opts.tourney; runMCQ();
}
function initDaily() {
  const r = rng("daily" + todayStr());
  G.items = [...shuffle(D.quiz, r).slice(0, 3).map(it => shuffleOptions(it, r)), ...pictureItems(2, r)];
  G.timePer = 15; G.powerups = false; runMCQ();
}
function initPicture() { G.items = pictureItems(10); G.timePer = 15; G.powerups = true; runMCQ(); }
function initDuel() {
  const ch = G.opts.challenge;
  const seed = ch ? ch.s : Math.floor(Math.random() * 1e9);
  const r = rng(seed);
  G.seed = seed;
  G.items = shuffle(D.quiz, r).slice(0, 7).map(it => shuffleOptions(it, r));
  G.timePer = 12; G.powerups = false;
  if (ch) G.opp = { name: ch.n, ghost: true, target: ch.p, score: 0 };
  else {
    const near = D.players.slice().sort((a, b) => Math.abs(botPoints(a) - state.points) - Math.abs(botPoints(b) - state.points)).slice(0, 6);
    const p = pick(near); G.opp = { name: p.name, dept: p.dept, skill: 0.5 + (hash(p.name) % 30) / 100 + Math.min(0.1, state.wins / 500), score: 0 };
  }
  // matchmaking moment
  showModal(`<div class="matchmaking"><div class="eyebrow">1V1 CLASH</div><div class="vs-row"><div>${avatarHTML("profile-avatar")}<b>${esc(firstName())}</b></div><div class="vs">VS</div><div><div class="profile-avatar opp">${initials(G.opp.name)}</div><b>${esc(G.opp.name.split(" ")[0])}</b></div></div><p class="subtext">${G.opp.ghost ? `Beat their score of <b>${fmt(G.opp.target)}</b> on the same 7 questions!` : "Finding a worthy rival… same 7 questions, fastest correct answers win."}</p><div class="loader"></div></div>`, { cls: "game" });
  later(runMCQ, 1800);
}
function runMCQ() {
  if (!G || G.over) return;
  const it = G.items[G.idx = G.idx || 0];
  if (!it) return finishGame();
  G.locked = false; G.left = G.timePer;
  const vs = G.opp ? `<div class="vs-bar"><div class="vs-side me"><small>${esc(firstName())}</small><b id="meScore">${fmt(G.score)}</b></div><div class="vs-mid">${G.idx + 1}/${G.items.length}</div><div class="vs-side opp"><small>${esc(G.opp.name.split(" ")[0])}${G.opp.ghost ? " (target)" : ""}</small><b id="oppScore">${fmt(G.opp.ghost ? G.opp.target : G.opp.score)}</b></div></div>` : "";
  const pu = G.powerups ? `<div class="powerups">${Object.entries(D.powerups).map(([k, p]) => `<button class="pu" data-action="powerup" data-arg="${k}" ${state.powerups[k] ? "" : "disabled"} title="${p.desc}">${p.icon} ${p.name} <i>${state.powerups[k] || 0}</i></button>`).join("")}</div>` : "";
  showModal(`${gameHeader(vs)}<div class="question-box"><div class="question-top"><span>QUESTION ${G.idx + 1} OF ${G.items.length}${it.cat ? " · " + esc(it.cat).toUpperCase() : ""}</span><span class="timer" id="timer">${G.timePer}s</span></div><div class="time-bar"><span id="timeBar"></span></div>${it.emoji ? `<div class="emoji-clue">${it.emoji}</div>` : ""}<div class="question-text">${esc(it.q)}</div><div class="answers">${it.a.map((a, i) => `<button class="answer" data-action="answer" data-arg="${i}"><i>${i + 1}</i>${esc(a)}</button>`).join("")}</div>${pu}<div id="feedback"></div></div>`, { cls: "game" });
  if (G.opp && !G.opp.ghost) { const r = Math.random(); G.bot = { t: 2 + r * (G.timePer - 4), ok: Math.random() < G.opp.skill, done: false }; }
  const start = Date.now(); let lastTick = start;
  every(() => {
    if (G.locked) return;
    const now = Date.now(); G.left -= (now - lastTick) / 1000; lastTick = now;
    const tb = $("#timeBar"), tm = $("#timer");
    if (tb) tb.style.width = Math.max(0, G.left / G.timePer * 100) + "%";
    if (tm) { tm.textContent = Math.max(0, Math.ceil(G.left)) + "s"; tm.classList.toggle("danger", G.left <= 5); }
    if (G.bot && !G.bot.done && (now - start) / 1000 >= G.bot.t) botAnswer();
    if (G.left <= 0) answerMCQ(-1);
  }, 100);
}
function botAnswer() {
  if (!G.bot || G.bot.done) return; G.bot.done = true;
  if (G.bot.ok) { G.opp.score += Math.round(100 + (G.timePer - G.bot.t) * 10); }
  const o = $("#oppScore"); if (o) { o.textContent = fmt(G.opp.score); o.parentElement.classList.add(G.bot.ok ? "flash-good" : "flash-bad"); }
}
function answerMCQ(choice) {
  if (!G || G.locked || G.over) return; G.locked = true; stopTimers();
  const it = G.items[G.idx], ok = choice === it.c;
  if (G.bot && !G.bot.done) botAnswer();
  G.total++; state.answers++;
  $$("[data-action=answer]").forEach(b => { b.disabled = true; const i = +b.dataset.arg; if (i === it.c) b.classList.add("correct"); else if (i === choice) b.classList.add("wrong"); });
  if (ok) {
    G.correct++; state.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const pts = (100 + Math.max(0, G.left) * 10) * mult(); bumpScore(pts); floatText("+" + Math.round(pts)); sfx.good();
  } else { G.combo = 0; bumpScore(0); sfx.bad(); if (choice === -1) floatText("Time's up!", false); }
  const ms = $("#meScore"); if (ms) ms.textContent = fmt(G.score);
  const fb = $("#feedback");
  if (fb) fb.innerHTML = `<p class="explain ${ok ? "good" : "bad"}">${ok ? "✓ Correct!" : choice === -1 ? "⏱ Out of time." : "✕ Not quite."} ${esc(it.why || "")}</p><button class="btn btn-primary mt" data-action="nextQ">${G.idx === G.items.length - 1 ? "SEE RESULTS" : "NEXT →"}</button>`;
  later(nextQ, ok ? 1500 : 2600);
}
function nextQ() { if (!G || G.over || !G.locked) return; stopTimers(); G.idx++; runMCQ(); }
function usePowerup(k) {
  if (!G || G.locked || !state.powerups[k]) return;
  const it = G.items[G.idx];
  if (k === "fifty") {
    const btns = $$("[data-action=answer]").filter(b => +b.dataset.arg !== it.c && !b.disabled);
    if (btns.length < 2) return; shuffle(btns).slice(0, 2).forEach(b => { b.disabled = true; b.classList.add("removed"); });
  } else if (k === "time") { G.left += 10; }
  else if (k === "skip") { state.powerups[k]--; save(); G.locked = true; stopTimers(); G.idx++; G.total++; return runMCQ(); }
  state.powerups[k]--; save(); sfx.tap();
  const b = $(`[data-action=powerup][data-arg=${k}]`); if (b) { b.querySelector("i").textContent = state.powerups[k]; b.disabled = true; }
}

/* ---- Word Rush ---- */
function initWord() {
  G.words = shuffle(D.words); G.wi = 0; G.left = 60; G.timePer = 60; G.solved = [];
  showModal(`${gameHeader()}<div class="question-box"><div class="question-top"><span>WORDS SOLVED <b id="wCount">0</b></span><span class="timer" id="timer">60s</span></div><div class="time-bar"><span id="timeBar"></span></div><div id="wordArea"></div></div>`, { cls: "game" });
  nextWord();
  let last = Date.now();
  every(() => {
    const now = Date.now(); G.left -= (now - last) / 1000; last = now;
    $("#timeBar").style.width = Math.max(0, G.left / 60 * 100) + "%";
    const tm = $("#timer"); tm.textContent = Math.max(0, Math.ceil(G.left)) + "s"; tm.classList.toggle("danger", G.left <= 10);
    if (G.left <= 0) finishGame();
  }, 100);
}
function nextWord() {
  if (G.wi >= G.words.length) { G.words = shuffle(D.words); G.wi = 0; }
  const [word, clue] = G.words[G.wi]; G.word = word; G.hinted = false;
  let sc = word; for (let i = 0; i < 6 && sc === word; i++) sc = shuffle(word.split("")).join("");
  G.tiles = sc.split("").map((ch, i) => ({ ch, i, used: false }));
  $("#wordArea").innerHTML = `<p class="clue">💡 ${esc(clue)} · <b>${word.length} letters</b></p><div class="tiles" id="tiles">${G.tiles.map(t => `<button class="tile" data-action="tile" data-arg="${t.i}">${t.ch}</button>`).join("")}</div><div class="word-input"><input id="wordAnswer" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Tap tiles or type…" maxlength="${word.length + 2}"><button class="btn btn-secondary btn-small" data-action="wordClear">⌫</button></div><div class="split mt word-btns"><button class="btn btn-secondary btn-small" data-action="wordHint">💡 HINT (½ pts)</button><button class="btn btn-secondary btn-small" data-action="wordSkip">⏭ SKIP (−3s)</button><button class="btn btn-primary" data-action="wordSubmit">SUBMIT ↵</button></div><p id="wordFb" class="small-note"></p>`;
  const inp = $("#wordAnswer"); inp.focus({ preventScroll: true });
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); wordSubmit(); } };
}
function tileTap(i) { const t = G.tiles[i]; if (!t || t.used) return; t.used = true; $(`.tile[data-arg="${i}"]`).classList.add("used"); $("#wordAnswer").value += t.ch; sfx.tap(); if ($("#wordAnswer").value.length === G.word.length) wordSubmit(); }
function wordClear() { $("#wordAnswer").value = ""; G.tiles.forEach(t => t.used = false); $$(".tile").forEach(b => b.classList.remove("used")); }
function wordSubmit() {
  if (!G || G.over) return;
  const ans = $("#wordAnswer").value.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!ans) return;
  if (ans === G.word) {
    G.correct++; G.total++; state.correct++; state.answers++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const pts = (40 + 15 * G.word.length) * mult() * (G.hinted ? 0.5 : 1); bumpScore(pts); floatText("+" + Math.round(pts)); sfx.good();
    $("#wCount").textContent = G.correct; G.wi++; nextWord();
  } else {
    G.combo = 0; bumpScore(0); sfx.bad(); state.answers++;
    $("#wordFb").textContent = "✕ Not it — try again!"; const inp = $("#wordAnswer"); inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake"); wordClear();
  }
}
function wordHint() { if (G.hinted) return; G.hinted = true; $("#wordFb").textContent = `Starts with "${G.word.slice(0, 2)}" and ends with "${G.word.slice(-1)}"`; }
function wordSkip() { G.left -= 3; G.combo = 0; G.total++; floatText("−3s", false); $("#wordFb").textContent = ""; toast(`It was ${G.word}`); G.wi++; nextWord(); bumpScore(0); }

/* ---- Brain Test ---- */
function initBrain() { G.items = shuffle(brainPool()).slice(0, 8); G.idx = 0; G.timePer = 30; runBrain(); }
function runBrain() {
  if (!G || G.over) return; const it = G.items[G.idx]; if (!it) return finishGame();
  G.locked = false; G.left = G.timePer; G.hinted = false;
  showModal(`${gameHeader()}<div class="question-box"><div class="question-top"><span>PUZZLE ${G.idx + 1} OF ${G.items.length}</span><span class="timer" id="timer">${G.timePer}s</span></div><div class="time-bar"><span id="timeBar"></span></div><div class="question-text">${esc(it.q)}</div><div class="word-input"><input id="brainAnswer" autocomplete="off" placeholder="Your answer"><button class="btn btn-primary" data-action="brainSubmit">CHECK ↵</button></div><button class="btn btn-secondary btn-small mt" data-action="brainHint">💡 HINT (½ pts)</button><div id="feedback"></div></div>`, { cls: "game" });
  const inp = $("#brainAnswer"); inp.focus({ preventScroll: true }); inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); brainSubmit(); } };
  let last = Date.now();
  every(() => { if (G.locked) return; const now = Date.now(); G.left -= (now - last) / 1000; last = now; $("#timeBar").style.width = Math.max(0, G.left / G.timePer * 100) + "%"; const tm = $("#timer"); tm.textContent = Math.max(0, Math.ceil(G.left)) + "s"; tm.classList.toggle("danger", G.left <= 5); if (G.left <= 0) brainSubmit(true); }, 100);
}
function brainSubmit(timeout) {
  if (!G || G.locked || G.over) return;
  const it = G.items[G.idx], raw = timeout === true ? "" : $("#brainAnswer").value;
  if (!raw.trim() && timeout !== true) return toast("Type an answer first");
  G.locked = true; stopTimers(); G.total++; state.answers++;
  const ans = norm(raw), ok = !!ans && [it.a, ...(it.alt || [])].some(x => norm(x) === ans);
  if (ok) { G.correct++; state.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); const pts = (100 + G.left * 5) * mult() * (G.hinted ? .5 : 1); bumpScore(pts); floatText("+" + Math.round(pts)); sfx.good(); }
  else { G.combo = 0; bumpScore(0); sfx.bad(); }
  $("#brainAnswer").disabled = true;
  $("#feedback").innerHTML = `<p class="explain ${ok ? "good" : "bad"}">${ok ? "✓ Correct!" : timeout === true ? `⏱ Time! Answer: <b>${esc(it.a)}</b>` : `✕ Answer: <b>${esc(it.a)}</b>`} <span class="muted">${esc(it.hint)}</span></p><button class="btn btn-primary mt" data-action="brainNext">${G.idx === G.items.length - 1 ? "SEE RESULTS" : "NEXT →"}</button>`;
  later(brainNext, ok ? 1500 : 3000);
}
function brainNext() { if (!G || !G.locked || G.over) return; stopTimers(); G.idx++; runBrain(); }
function brainHint() { if (G.hinted || G.locked) return; G.hinted = true; const f = $("#feedback"); f.innerHTML = `<p class="explain">💡 ${esc(G.items[G.idx].hint)}</p>`; }

/* ---- Math Blitz ---- */
function initBlitz() {
  G.left = 60; G.timePer = 60;
  showModal(`${gameHeader()}<div class="question-box"><div class="question-top"><span>SOLVED <b id="bCount">0</b></span><span class="timer" id="timer">60s</span></div><div class="time-bar"><span id="timeBar"></span></div><div class="blitz-q" id="blitzQ"></div><div class="answers blitz" id="blitzA"></div><p class="small-note center">Correct +1s · Wrong −3s</p></div>`, { cls: "game" });
  nextBlitz();
  let last = Date.now();
  every(() => { const now = Date.now(); G.left -= (now - last) / 1000; last = now; $("#timeBar").style.width = Math.max(0, Math.min(100, G.left / 60 * 100)) + "%"; const tm = $("#timer"); tm.textContent = Math.max(0, Math.ceil(G.left)) + "s"; tm.classList.toggle("danger", G.left <= 10); if (G.left <= 0) finishGame(); }, 100);
}
function nextBlitz() {
  const lv = Math.floor(G.correct / 5), R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const ops = lv < 1 ? ["+", "−"] : lv < 2 ? ["+", "−", "×"] : ["+", "−", "×", "÷"];
  const op = pick(ops), hi = 10 + lv * 8; let a, b, ans;
  if (op === "+") { a = R(2, hi); b = R(2, hi); ans = a + b; }
  else if (op === "−") { a = R(5, hi + 5); b = R(1, a); ans = a - b; }
  else if (op === "×") { a = R(2, 5 + lv * 2); b = R(2, 9 + lv); ans = a * b; }
  else { b = R(2, 9 + lv); ans = R(2, 9 + lv); a = b * ans; }
  const opts = new Set([ans]); while (opts.size < 4) { const d = ans + R(-Math.max(3, Math.ceil(ans * .2)), Math.max(3, Math.ceil(ans * .2))); if (d >= 0 && d !== ans) opts.add(d); }
  G.blitzAns = ans;
  $("#blitzQ").textContent = `${a} ${op} ${b} = ?`;
  $("#blitzA").innerHTML = shuffle([...opts]).map((o, i) => `<button class="answer" data-action="blitz" data-arg="${o}"><i>${i + 1}</i>${o}</button>`).join("");
}
function blitzAnswer(v) {
  if (!G || G.over) return; G.total++; state.answers++;
  if (+v === G.blitzAns) { G.correct++; state.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.left = Math.min(60, G.left + 1); const pts = 50 * mult(); bumpScore(pts); floatText("+" + Math.round(pts)); sfx.good(); $("#bCount").textContent = G.correct; }
  else { G.combo = 0; G.left -= 3; bumpScore(0); floatText("−3s", false); sfx.bad(); const q = $("#blitzQ"); q.classList.remove("shake"); void q.offsetWidth; q.classList.add("shake"); }
  nextBlitz();
}

/* ---- Memory Flip ---- */
function initMemory() {
  const icons = shuffle(D.memoryIcons).slice(0, 8);
  G.cards = shuffle([...icons, ...icons]).map((ic, i) => ({ ic, i, up: false, done: false }));
  G.flipped = []; G.moves = 0; G.pairs = 0; G.left = 90; G.timePer = 90; G.total = 8;
  showModal(`${gameHeader()}<div class="question-box"><div class="question-top"><span>PAIRS <b id="mPairs">0</b>/8 · MOVES <b id="mMoves">0</b></span><span class="timer" id="timer">90s</span></div><div class="time-bar"><span id="timeBar"></span></div><div class="mem-grid">${G.cards.map(c => `<button class="mem" data-action="flip" data-arg="${c.i}"><span class="mem-inner"><span class="mem-front">⚡</span><span class="mem-back">${c.ic}</span></span></button>`).join("")}</div></div>`, { cls: "game" });
  let last = Date.now();
  every(() => { const now = Date.now(); G.left -= (now - last) / 1000; last = now; $("#timeBar").style.width = Math.max(0, G.left / 90 * 100) + "%"; const tm = $("#timer"); tm.textContent = Math.max(0, Math.ceil(G.left)) + "s"; tm.classList.toggle("danger", G.left <= 15); if (G.left <= 0) { G.win = false; finishGame(); } }, 100);
}
function flip(i) {
  if (!G || G.over || G.busy) return; const c = G.cards[i]; if (!c || c.up || c.done) return;
  c.up = true; $(`.mem[data-arg="${i}"]`).classList.add("up"); G.flipped.push(c); sfx.tap();
  if (G.flipped.length < 2) return;
  G.moves++; $("#mMoves").textContent = G.moves;
  const [a, b] = G.flipped; G.flipped = [];
  if (a.ic === b.ic) {
    a.done = b.done = true; G.pairs++; G.correct++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); state.correct++; state.answers++;
    const pts = 60 * mult(); bumpScore(pts); floatText("+" + Math.round(pts)); sfx.good();
    later(() => { $$(`.mem[data-arg="${a.i}"],.mem[data-arg="${b.i}"]`).forEach(x => x.classList.add("matched")); }, 250);
    $("#mPairs").textContent = G.pairs;
    if (G.pairs === 8) { const bonus = Math.max(0, Math.round(G.left * 6 - G.moves * 4)); G.score += Math.max(0, bonus); G.win = true; later(finishGame, 700); }
  } else {
    G.combo = 0; G.busy = true; state.answers++;
    later(() => { a.up = b.up = false; $$(`.mem[data-arg="${a.i}"],.mem[data-arg="${b.i}"]`).forEach(x => x.classList.remove("up")); G.busy = false; bumpScore(0); }, 750);
  }
}

/* ---- Finish & rewards ---- */
function finishGame() {
  if (!G || G.over) return; G.over = true; stopTimers();
  const g = G, today = todayStr();
  let win;
  if (g.id === "duel") win = g.score > (g.opp.ghost ? g.opp.target : g.opp.score);
  else if (g.id === "memory") win = !!g.win;
  else if (g.id === "word") win = g.correct >= 6;
  else if (g.id === "blitz") win = g.correct >= 15;
  else win = g.total > 0 && g.correct / g.total >= 0.6;

  const perfect = ["quiz", "daily", "picture", "duel", "brain"].includes(g.id) && g.total > 0 && g.correct === g.total;
  let pts = Math.round(g.score / 10) + (win ? 10 : 0);
  let coins = Math.round(g.score / 25) + (win ? 15 : 0) + (perfect ? 20 : 0);
  const extras = [];
  if (g.id === "daily") { pts += 25; coins += 50; state.daily = { date: today, done: true, score: g.score }; extras.push("☀️ Daily Quest +50🪙 +25 pts"); }
  if (perfect) extras.push("🎯 Perfect round +20🪙");
  if (isPro()) { coins *= 2; extras.push("⭐ Pro 2× coins"); }
  const oldLevel = level(state.xp), oldHigh = state.high[g.id] || 0;
  state.points += pts; state.xp += pts; state.week.points += pts; state.coins += coins;
  state.gamesPlayed++; if (win) state.wins++; state.bestCombo = Math.max(state.bestCombo, g.maxCombo);
  state.played[g.id] = (state.played[g.id] || 0) + 1;
  if (g.id === "duel" && win) state.duelWins++;
  const newHigh = g.score > oldHigh && g.id !== "daily"; if (newHigh) state.high[g.id] = g.score;
  if (g.opts.tourney) { const k = tourneyKey(g.opts.tourney); state.tourneyBest[k] = Math.max(state.tourneyBest[k] || 0, g.score); }
  // streak
  if (state.lastPlayDate !== today) { const gap = state.lastPlayDate ? daysBetween(state.lastPlayDate, today) : 99; state.streak = gap === 1 ? state.streak + 1 : 1; state.lastPlayDate = today; state.bestStreak = Math.max(state.bestStreak, state.streak); if (state.streak > 1) extras.push(`🔥 Streak: ${state.streak} days!`); }
  // missions
  ensureMissions();
  missionEvent("game", 1); missionEvent("game:" + g.id, 1); missionEvent("correct", g.correct); missionEvent("correct:" + g.id, g.correct);
  missionEvent("combo", g.maxCombo); missionEvent("score:" + g.id, g.score); if (win) { missionEvent("win", 1); missionEvent("win:" + g.id, 1); }
  // history
  state.history.push({ id: g.id, name: (D.games.find(x => x.id === g.id)?.name || "Daily Quest") + (g.opts.tourney ? " (qualifier)" : ""), date: new Date().toLocaleDateString(), correct: g.correct, total: g.total, score: g.score, points: pts, win });
  if (state.history.length > 60) state.history = state.history.slice(-60);
  // level up
  const newLevel = level(state.xp); let lvMsg = "";
  if (newLevel > oldLevel) { const bonus = 50 * (newLevel - oldLevel), gems = Math.floor(newLevel / 5) - Math.floor(oldLevel / 5); state.coins += bonus; state.gems += gems * 5; lvMsg = `⬆️ LEVEL ${newLevel}! +${bonus}🪙${gems ? ` +${gems * 5}💎` : ""}`; }
  // badges
  const newly = badgeList().filter(b => b[4] && !state.badges.includes(b[0]));
  newly.forEach(b => { state.badges.push(b[0]); state.coins += 25; });
  state.gamesSinceAd++;
  save();

  if (win || newHigh) { sfx.win(); confetti(); } else sfx.bad();
  const gm = D.games.find(x => x.id === g.id) || { name: "Daily Quest", icon: "☀️" };
  let headline = win ? pick(["Great performance!", "You're on fire!", "Campus legend in the making!", "Too sharp! 🔥"]) : pick(["Good effort — run it back!", "So close! One more?", "Warm-up done. Now for real."]);
  let duelBlock = "";
  if (g.id === "duel") {
    const os = g.opp.ghost ? g.opp.target : g.opp.score;
    headline = win ? `You beat ${esc(g.opp.name.split(" ")[0])}! ⚔️` : g.score === os ? "It's a draw!" : `${esc(g.opp.name.split(" ")[0])} wins this round`;
    duelBlock = `<div class="vs-bar result-vs"><div class="vs-side me"><small>YOU</small><b>${fmt(g.score)}</b></div><div class="vs-mid">VS</div><div class="vs-side opp"><small>${esc(g.opp.name.split(" ")[0])}</small><b>${fmt(os)}</b></div></div>`;
  }
  const challengeCode = g.id === "duel" ? encodeChallenge({ s: g.seed, n: state.user.name || "A friend", p: g.score }) : "";
  const shareText = g.id === "duel" ? `⚔️ I scored ${fmt(g.score)} in a Campus Clash 1v1. Same 7 questions — think you can beat me? ${shareLink("c=" + challengeCode)}`
    : `${gm.icon} I just scored ${fmt(g.score)} in ${gm.name} on Campus Clash! Can you beat me? ${shareLink("ref=" + state.user.refCode)}`;
  showModal(`<div class="result"><div class="big">${g.id === "duel" ? (win ? "🏆" : "⚔️") : win ? "🏆" : "⚡"}</div><div class="eyebrow">${gm.name.toUpperCase()} · COMPLETE</div><h2>${headline}</h2>${duelBlock}
${newHigh && oldHigh ? `<div class="new-high">🏅 NEW PERSONAL BEST! (was ${fmt(oldHigh)})</div>` : newHigh ? `<div class="new-high">🏅 FIRST SCORE SET!</div>` : ""}
<div class="stats-grid result-grid"><div class="stat-card"><div class="stat-top">SCORE</div><div class="stat-value">${fmt(g.score)}</div></div><div class="stat-card"><div class="stat-top">CORRECT</div><div class="stat-value">${g.correct}${g.total ? "/" + g.total : ""}</div></div><div class="stat-card"><div class="stat-top">BEST COMBO</div><div class="stat-value">${g.maxCombo}×</div></div><div class="stat-card"><div class="stat-top">EARNED</div><div class="stat-value gold">+${pts} ✦<br><small>+${coins} 🪙</small></div></div></div>
${[...extras, lvMsg, ...newly.map(b => `${b[1]} Badge unlocked: ${b[2]} (+25🪙)`)].filter(Boolean).map(x => `<div class="extra-line">${x}</div>`).join("")}
${g.opts.tourney ? `<div class="extra-line">🏆 Qualifier best this week: <b>${fmt(state.tourneyBest[tourneyKey(g.opts.tourney)])}</b></div>` : ""}
${g.opts.challenge ? `<div class="extra-line">${win ? "You beat your friend's challenge! Send it back 😎" : "Challenge failed — ask for a rematch!"}</div>` : ""}
<div class="result-actions"><button class="btn btn-primary" data-action="again">${g.id === "daily" ? "PLAY QUIZ BATTLE" : "PLAY AGAIN"} ${isPro() ? "" : "· ⚡1"}</button><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(shareText)}">${g.id === "duel" ? "CHALLENGE A FRIEND" : "SHARE SCORE"}</a><button class="btn btn-secondary" data-action="backToArena">BACK</button></div></div>`, { cls: "game", onClose: () => { G = null; refresh(); } });
}
function afterGame(next) {
  const g = G; G = null;
  const go2 = () => { closeModal(true); next && next(g); };
  if (!isPro() && state.gamesSinceAd >= CFG.ads.interstitialEvery) {
    state.gamesSinceAd = 0; save();
    sponsorBreak({ title: "A WORD FROM OUR SPONSOR", seconds: 5, onDone: () => next && next(g) });
  } else go2();
}

/* ---- friend challenges ---- */
function encodeChallenge(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decodeChallenge(s) { try { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const o = JSON.parse(decodeURIComponent(escape(atob(s)))); if (typeof o.s === "number" && typeof o.p === "number") return { s: o.s, p: Math.max(0, Math.min(99999, o.p)), n: String(o.n || "A friend").slice(0, 40) }; } catch { } return null; }
function checkChallengeLink() {
  const c = new URLSearchParams(location.search).get("c"); if (!c) return false;
  const ch = decodeChallenge(c); history.replaceState(null, "", location.pathname + location.hash);
  if (!ch) return false;
  showModal(`<div class="result"><div class="big">⚔️</div><div class="eyebrow">YOU'VE BEEN CHALLENGED</div><h2>${esc(ch.n)} scored ${fmt(ch.p)}</h2><p>Same 7 questions. Can you beat them?</p><button class="btn btn-primary mt" data-action="acceptChallenge" data-arg="${esc(c)}">ACCEPT CHALLENGE ${isPro() ? "" : "· ⚡1"}</button> <button class="btn btn-secondary mt" data-action="closeModal">LATER</button></div>`);
  return true;
}

/* =========================================================
   ACTIONS (event delegation)
   ========================================================= */
const actions = {
  go: a => { if (!$("#modal").classList.contains("hidden")) { if (G && !G.over) return; closeModal(true); } go(a); },
  closeModal: () => closeModal(),
  play: a => { if (!$("#modal").classList.contains("hidden")) closeModal(true); startGame(a); },
  quickPlay: () => startGame(pick(["word", "picture", "blitz", "brain", "memory", "duel"])),
  quizCat: a => { closeModal(true); startGame("quiz", { category: a }); },
  tourney: a => { const t = D.tournaments.find(x => x.id === a); if (t) startGame(t.game, { tourney: a, category: "Mixed" }); },
  acceptChallenge: a => { const ch = decodeChallenge(a); closeModal(true); if (ch) startGame("duel", { challenge: ch }); },
  answer: a => answerMCQ(+a), nextQ: () => nextQ(), powerup: a => usePowerup(a),
  tile: a => tileTap(+a), wordClear, wordSubmit, wordHint, wordSkip,
  brainSubmit: () => brainSubmit(), brainNext, brainHint,
  blitz: a => blitzAnswer(a), flip: a => flip(+a),
  again: () => afterGame(g => startGame(g.id === "daily" ? "quiz" : g.id, g.id === "quiz" || g.opts.tourney ? g.opts : {})),
  backToArena: () => afterGame(() => refresh()),
  filterGames: a => { gameFilter = a; refresh(); },
  lb: a => { lbTab = a; go("leaderboard"); if (current === "leaderboard") refresh(); },
  store: a => { storeTab = a; if (!$("#modal").classList.contains("hidden")) closeModal(true); go("store"); if (current === "store") refresh(); },
  adminTab: a => { adminTab = a; refresh(); },
  claimLogin, spin, claimMission, rewardedAd: () => { if (!$("#modal").classList.contains("hidden")) closeModal(true); rewardedAd(); },
  refill, buy, buyPowerup, buyCosmetic, equip,
  join: a => { if (state.joined.includes(a)) return toast("You're already registered"); state.joined.push(a); save(); refresh(); toast("Registered! We'll remind you."); },
  editProfile, howToPlay,
  energyInfo: () => isPro() ? toast("⭐ Pro: unlimited energy") : outOfEnergy(),
  copy: a => { navigator.clipboard?.writeText(a).then(() => toast("Copied! Paste it anywhere"), () => toast("Copy failed")); },
  addQuestion: () => questionModal(),
  deleteQ: a => { state.adminQuestions.splice(+a, 1); save(); refresh(); },
  deleteT: a => { state.customTournaments.splice(+a, 1); save(); refresh(); },
  toggleSound: () => { state.settings.sound = !state.settings.sound; save(); refresh(); },
  export: () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })); a.download = "campus-clash-data.json"; a.click(); },
  grant: () => { state.coins += 500; save(); refresh(); toast("+500 test coins"); },
  reset: () => { if (confirm("Reset ALL Campus Clash data on this device?")) { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); state = loadState(); housekeeping(); save(); applyTheme(); go("home"); onboarding(); } },
  lockAdmin: () => { sessionStorage.removeItem("cc_admin"); refresh(); },
  menu: () => { $("#sidebar").classList.toggle("open"); $("#scrim").classList.toggle("show"); }
};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-action]"); if (!el || el.disabled) return;
  const fn = actions[el.dataset.action]; if (!fn) return;
  if (el.tagName === "A" && el.getAttribute("href")) return; // real links
  e.preventDefault(); fn(el.dataset.arg, el, e);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#modal").classList.contains("hidden") && !$("#modalClose").classList.contains("hidden")) return closeModal();
  if (!G || G.over || e.target.tagName === "INPUT") return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 4) { const btn = $$("#modalBody .answer")[n - 1]; if (btn && !btn.disabled) btn.click(); }
});
function questionModal() {
  showModal(`<div class="eyebrow">ADMIN STUDIO</div><h2 class="page-title">Add a question</h2><form id="questionForm" class="form-grid"><div class="field full"><label>TYPE</label><select name="type" id="qType"><option value="mcq">Multiple choice → Quiz Battle</option><option value="text">Typed answer → Brain Test</option></select></div><div class="field full"><label>QUESTION</label><input name="q" required maxlength="200"></div>
<div id="mcqFields" class="form-grid full-span">${["A", "B", "C", "D"].map((l, i) => `<div class="field"><label>OPTION ${l}</label><input name="o${i}" maxlength="80"></div>`).join("")}<div class="field"><label>CORRECT OPTION</label><select name="c">${["A", "B", "C", "D"].map((l, i) => `<option value="${i}">${l}</option>`).join("")}</select></div><div class="field"><label>EXPLANATION (optional)</label><input name="why" maxlength="160"></div></div>
<div id="textFields" class="form-grid full-span hidden"><div class="field"><label>CORRECT ANSWER</label><input name="answer" maxlength="60"></div><div class="field"><label>HINT</label><input name="hint" maxlength="120"></div></div>
<div class="field full"><button class="btn btn-primary">SAVE QUESTION</button></div></form>`);
  $("#qType").onchange = e => { $("#mcqFields").classList.toggle("hidden", e.target.value !== "mcq"); $("#textFields").classList.toggle("hidden", e.target.value === "mcq"); };
  $("#questionForm").onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    if (d.type === "mcq") { const opts = [d.o0, d.o1, d.o2, d.o3].map(x => (x || "").trim()); if (opts.some(x => !x)) return toast("Fill in all four options"); state.adminQuestions.push({ type: "mcq", q: d.q, a: opts, c: +d.c, why: d.why, cat: "Campus" }); }
    else { if (!d.answer?.trim()) return toast("Enter the correct answer"); state.adminQuestions.push({ type: "text", q: d.q, a: d.answer.trim(), hint: d.hint }); }
    save(); closeModal(true); refresh(); toast("Question added to the game");
  };
}

/* ---------------- boot ---------------- */
$("#modalClose").onclick = () => closeModal();
$("#modal").addEventListener("click", e => { if (e.target.id === "modal" && !$("#modalClose").classList.contains("hidden") && !(G && !G.over)) closeModal(); });
$("#scrim").onclick = () => actions.menu();
housekeeping(); syncEnergy(); applyTheme(); save(); render();
if (!state.onboarded) onboarding();
else if (!checkChallengeLink() && state.login.last !== todayStr()) setTimeout(claimLogin, 600);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
window.CampusClash = { get state() { return state; }, actions, startGame, finishGame };
