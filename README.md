# Campus Clash v2 — Think Fast. Play Smart. Own the Campus.

A mobile-first, installable (PWA) multi-game arena for university students: 7 games, one campus leaderboard, daily rewards, and built-in ways to make money.

---

## 1. Run it

**Option A — with payments server (recommended)**
```bash
npm start                      # needs Node 18+, no installs required
# open http://localhost:8000
```
To accept real Paystack payments:
```bash
PAYSTACK_SECRET_KEY=sk_test_xxx npm start      # Windows PowerShell: $env:PAYSTACK_SECRET_KEY="sk_test_xxx"; npm start
```
…and put your **public** key (`pk_test_…`) in `config.js → paystackPublicKey`.

**Option B — quick preview**
```bash
python -m http.server 8000
```
Or double-click `index.html` (service worker/install won't work from file://).

Without a Paystack key the app runs in **DEMO MODE**: checkouts are simulated, no money moves.

**Admin Studio PIN:** `2468` (change in `config.js`).

---

## 2. The games (7 modes)

| Game | How it plays |
|---|---|
| 🧠 **Quiz Battle** | Pick a category (Mixed, General, Science, Business, Nigeria, Tech, Sports, + your custom "Campus" questions). 10 questions, 15 s each, speed bonus + combo multiplier, power-ups. |
| 🔤 **Word Rush** | 60-second arcade: unscramble as many words as possible. Tap tiles or type. Hint (½ points), skip (−3 s). |
| 🧩 **Brain Test** | 8 logic puzzles, sequences and riddles, 30 s each, typed answers, hints. |
| 👁️ **Picture Challenge** | Emoji rebus puzzles (🐝 + 🍃 = BELIEF), 10 rounds, multiple choice. |
| 🧮 **Math Blitz** *(new)* | 60-second mental maths. Right = +1 s, wrong = −3 s. Difficulty ramps up. |
| 🃏 **Memory Flip** *(new)* | Match 8 pairs in 90 s. Fewer moves + faster time = higher score. |
| ⚔️ **1v1 Clash** | Live-simulated rival answering the same questions in real time, with a score race bar. After the match, **"Challenge a friend"** sends a WhatsApp link — your friend plays the *exact same* 7 questions and tries to beat your score. |

Plus the **Daily Quest**: 5 mixed questions, identical for every student each day, always free.

---

## 3. What keeps students coming back

- **Energy** — 5 plays, +1 every 20 min (the main reason to go Pro).
- **Daily streak** 🔥 with **Streak Freeze** items.
- **7-day login calendar** (day 7 pays gems).
- **Lucky Spin** — one free spin a day (Pro: two). No paid spins.
- **3 daily missions** + bonus gems for clearing all three.
- **XP levels**, **tiers** (Bronze → Campus Legend), **16 achievements**, personal bests.
- **Leaderboards**: season, weekly, my faculty, my department, and **Faculty Wars**.
- **Tournaments** with weekly qualifiers (same question set for everyone that week).
- Score shares and referral codes on **WhatsApp** (+100 coins for invited friends).
- Combos, sound effects, confetti, new-best celebrations.

---

## 4. How it makes money

| Stream | Where | Default price |
|---|---|---|
| **Campus Pro** subscription | Store | ₦500/week · ₦1,500/month · ₦4,000/semester |
| **Gem packs** (cosmetics + refills) | Store | ₦300 – ₦4,000 |
| **Rewarded sponsor clips** | Daily Hub / out-of-energy screen | Sold to advertisers |
| **Banners + sponsor breaks** (every 4 games, free players only) | Home, Arena, between games | Sold to advertisers |
| **Sponsor packages** | Partners page | ₦15k – ₦120k per package |

All prices, packages and sponsors live in **`config.js`** — edit there, no code changes.

**Admin Studio → Revenue model** has a projection calculator (students × conversion × price) to support sponsor and investor pitches.

**Fairness rules built in (protects your reputation and the legal position):**
- Money buys **convenience and cosmetics only**: unlimited energy, 2× coins, avatars, frames, themes. It never buys points, answers or ranking.
- Power-ups are bought with earned coins only and are **disabled** in the Daily Quest, 1v1 and tournament qualifiers.
- No cash entry fees, no paid spins, no cash prizes. Tournament prizes come from sponsors.
- Before adding paid entry or cash prizes, get Nigerian legal advice. Calling it "skill-based" does not by itself make it legal.

---

## 5. Fixes made to the starter

- Daily challenge could be completed only **once ever** (`dailyDone` never reset). Now it resets every day.
- The **streak never changed**. It now goes up on consecutive days, resets after a missed day, and can be protected with a Streak Freeze.
- **Points could be farmed**: in Word Rush, Brain Test and Picture Challenge you could press Submit repeatedly on one question. Fixed.
- Questions were always in the **same order**, and Quiz Battle only ever used the first 7. Questions are now shuffled from a much larger bank.
- Admin custom questions and tournaments **were saved but never appeared** in the game. They now go into Quiz Battle/Brain Test and onto the Tournaments page.
- Game Arena and leaderboard **filter chips did nothing**. They work now.
- "Speed bonus" was advertised but never added. It is now part of scoring.
- 1v1 had **no opponent**. It now has a simulated rival and friend challenge links.
- The results screen showed a **+25 daily bonus even when it had already been claimed**. Fixed.
- The PWA had **no icons**, so it couldn't be installed. Icons added.
- The service worker served cached files forever, so **updates never reached players**. It now checks the network first.
- Fonts now fall back to system fonts when offline. Added keyboard shortcuts (1–4, Enter), a mobile bottom nav and bottom-sheet game screens.
- Data from v1 (profile, points, history, custom questions) is migrated automatically.

---

## 6. Files

```
index.html        app shell
styles.css        visual system (responsive)
config.js         ← prices, Paystack key, ads, sponsors, admin PIN
data.js           ← question banks, missions, store items, rewards
app.js            game engine, retention loop, store, payments
sw.js             offline support
manifest.json     install metadata
icons/            app icons
server/server.js  static server + secure Paystack verification
package.json      `npm start`
```

Add questions by editing `data.js` or in **Admin Studio → Question bank**.

---

## 7. Important limits of this build (read before launch)

This build runs **entirely in the browser** (localStorage). That's fine for a pilot, but:

1. **Leaderboard rivals are simulated.** Real cross-student rankings need a backend (Supabase recommended — schema below).
2. **Scores are computed on the device**, so a technical user could edit them. Before running prize tournaments, move scoring and question delivery to server functions.
3. **Paystack is verified server-side**, but the purchased item is still stored in the browser. In production, credit purchases to a user account in the database (see the `TODO` in `server/server.js`). Also keep `PRODUCTS` prices in `server.js` the same as `config.js`.
4. Admin PIN is client-side only. Use real roles (Supabase Auth + RLS) for production.
5. Swap the house ads in `config.js` for paying sponsors (or an ad network) when you have them.

### Recommended production stack
Next.js or this front end · Supabase (Auth, Postgres, Realtime for live 1v1, RLS) · Paystack (server-verified, with webhooks) · Vercel/Netlify hosting.

### Core tables
`profiles`, `universities`, `faculties`, `departments`, `questions` (answer_key never sent to clients before submission), `game_sessions`, `answers`, `point_ledger`, `wallets` (coins/gems), `purchases` (paystack_ref unique), `subscriptions`, `tournaments`, `tournament_entries`, `matches`, `achievements`, `user_achievements`, `referrals`, `sponsor_campaigns`, `ad_impressions`.

### Launch roadmap
1. Pilot with 30–50 students on one campus (this build is ready for that).
2. Add Supabase auth + shared leaderboard + server scoring.
3. Turn on Paystack live keys and webhooks.
4. Sign the first 2–3 campus sponsors using pilot engagement numbers (daily active players, streaks, games per player).
5. Add real-time 1v1 matchmaking, then inter-faculty and inter-school leagues.
