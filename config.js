/* =========================================================
   CAMPUS CLASH — BUSINESS CONFIG
   Edit this file to change prices, payment keys, ads and sponsors.
   No other file needs to change for normal business tweaks.
   ========================================================= */
window.CC_CONFIG = {
  appName: "Campus Clash",
  version: "2.0.0",
  currency: "₦",

  /* ---------- PAYMENTS (Paystack) ----------
     1. Put your PUBLIC key here (pk_test_... or pk_live_...).
     2. Put your SECRET key ONLY on the server (env PAYSTACK_SECRET_KEY) — never here.
     3. Run `npm start` so /api/paystack/verify exists.
     Leave the key empty to run in DEMO mode (simulated checkout, no money moves). */
  paystackPublicKey: "",
  verifyUrl: "/api/paystack/verify",

  /* Client-side PIN for the Admin Studio demo. Replace with real server roles before launch. */
  adminPin: "2468",

  partnersEmail: "partners@campusclash.ng",
  supportEmail: "support@campusclash.ng",
  shareUrl: "", // e.g. "https://campusclash.ng" — falls back to the current page address

  /* ---------- ENERGY (free players) ---------- */
  energy: { max: 5, regenMinutes: 20, refillCoins: 80, refillGems: 10 },

  /* ---------- ADS ---------- */
  ads: {
    interstitialEvery: 4,  // show a sponsor break after every N games (free players only)
    rewardedPerDay: 3,     // "watch a sponsor clip" rewards per day
    rewardedSeconds: 6
  },

  /* ---------- CAMPUS PRO (subscription) ---------- */
  proPlans: [
    { id: "pro_week",     name: "Pro Weekly",   price: 500,  days: 7,   note: "Try it out" },
    { id: "pro_month",    name: "Pro Monthly",  price: 1500, days: 30,  note: "Most popular", best: true },
    { id: "pro_semester", name: "Pro Semester", price: 4000, days: 120, note: "Save 33%" }
  ],
  proPerks: [
    "Unlimited energy — play as much as you want",
    "2× coins from every game",
    "No sponsor breaks between games",
    "2 free Lucky Spins every day",
    "Exclusive Pro frame, theme and badge"
  ],

  /* ---------- GEM PACKS (premium currency — cosmetics & refills only) ---------- */
  gemPacks: [
    { id: "gems_80",   gems: 80,   price: 300 },
    { id: "gems_300",  gems: 300,  price: 1000, tag: "+12% BONUS" },
    { id: "gems_700",  gems: 700,  price: 2000, tag: "+31% BONUS" },
    { id: "gems_1600", gems: 1600, price: 4000, tag: "BEST VALUE · +50%", best: true }
  ],

  /* ---------- SPONSORS / HOUSE ADS ----------
     These rotate in banners, sponsor breaks and rewarded clips. Replace with paying partners. */
  sponsors: [
    { name: "Your Brand Here", tagline: "Reach thousands of students every single day.", cta: "ADVERTISE WITH US", page: "partners", color: "#8b5cf6", emoji: "📣" },
    { name: "Campus Data Deals", tagline: "Students: cheaper data bundles for exam season.", cta: "LEARN MORE", page: "partners", color: "#43d9e8", emoji: "📶" },
    { name: "Study Hub Café", tagline: "Free Wi-Fi + 10% off for Campus Clash players.", cta: "SEE OFFER", page: "partners", color: "#ffc968", emoji: "☕" }
  ],

  /* ---------- PARTNER PACKAGES (shown on the Partners page) ---------- */
  sponsorPackages: [
    { name: "Banner Week", price: 15000, unit: "per week", icon: "🪧", items: ["Rotating banner on Home + Game Arena", "Sponsor break placement", "Weekly impression report"] },
    { name: "Sponsored Daily Challenge", price: 40000, unit: "per week", icon: "☀️", items: ["\"Today's challenge sponsored by…\" on 7 daily challenges", "Branded question in each set", "Logo on result screen"], best: true },
    { name: "Brand Tournament", price: 120000, unit: "per event", icon: "🏆", items: ["Named tournament (e.g. \"YourBrand Brain Cup\")", "You provide prizes — we run it", "Winners announcement + social posts"] },
    { name: "Department / Club Event", price: 25000, unit: "per event", icon: "🎓", items: ["Private quiz event for your department or club", "Custom questions & leaderboard", "Certificate-ready results export"] }
  ]
};
