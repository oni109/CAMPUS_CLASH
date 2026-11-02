/* =========================================================
   CAMPUS CLASH — CONTENT
   Question banks, games, store items, missions, rewards.
   ========================================================= */
window.CC_DATA = (() => {
  const games = [
    { id: "quiz",    name: "Quiz Battle",       icon: "🧠", type: "KNOWLEDGE",    group: "knowledge", desc: "10 rapid multiple-choice questions. Pick a category, build combos, use power-ups.", time: "3 min", reward: "Up to 300 pts" },
    { id: "word",    name: "Word Rush",         icon: "🔤", type: "WORD PUZZLE",  group: "puzzle",    desc: "60 seconds. Unscramble as many words as you can. Every streak multiplies your score.", time: "60 sec", reward: "Unlimited" },
    { id: "brain",   name: "Brain Test",        icon: "🧩", type: "LOGIC",        group: "puzzle",    desc: "Number sequences, riddles and trick questions that separate the sharp from the rest.", time: "4 min", reward: "Up to 200 pts" },
    { id: "picture", name: "Picture Challenge", icon: "👁️", type: "VISUAL",       group: "puzzle",    desc: "Decode emoji clues into words before the clock runs out.", time: "2 min", reward: "Up to 250 pts" },
    { id: "blitz",   name: "Math Blitz",        icon: "🧮", type: "ARCADE",       group: "arcade",    desc: "60-second mental-maths frenzy. Right answers add time, wrong ones cost you.", time: "60 sec", reward: "Unlimited" },
    { id: "memory",  name: "Memory Flip",       icon: "🃏", type: "ARCADE",       group: "arcade",    desc: "Match all 8 pairs. Fewer moves and faster time means a bigger score.", time: "90 sec", reward: "Up to 240 pts" },
    { id: "duel",    name: "1v1 Clash",         icon: "⚔️", type: "HEAD-TO-HEAD", group: "versus",    desc: "Battle a live-simulated rival on the same questions — or send the set to a friend.", time: "2 min", reward: "Win bonus" }
  ];

  // c = index of correct answer
  const quiz = [
    // General
    { cat: "General", q: "Which is the largest ocean on Earth?", a: ["Atlantic", "Indian", "Arctic", "Pacific"], c: 3, why: "The Pacific is the largest and deepest ocean." },
    { cat: "General", q: "Which planet is known as the Red Planet?", a: ["Venus", "Jupiter", "Mars", "Mercury"], c: 2, why: "Iron oxide dust gives Mars its reddish colour." },
    { cat: "General", q: "How many sides does a hexagon have?", a: ["Five", "Six", "Seven", "Eight"], c: 1, why: "Hexa- means six." },
    { cat: "General", q: "What is the primary language of Brazil?", a: ["Spanish", "Portuguese", "French", "English"], c: 1, why: "Brazil was colonised by Portugal." },
    { cat: "General", q: "How many continents are there?", a: ["5", "6", "7", "8"], c: 2, why: "Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, South America." },
    { cat: "General", q: "What is the longest river in Africa?", a: ["Congo", "Niger", "Zambezi", "Nile"], c: 3, why: "The Nile runs about 6,650 km." },
    { cat: "General", q: "Who painted the Mona Lisa?", a: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Michelangelo"], c: 0, why: "Leonardo painted it in the early 1500s." },
    { cat: "General", q: "How many minutes are in a day?", a: ["1,240", "1,440", "1,640", "1,400"], c: 1, why: "24 × 60 = 1,440." },
    { cat: "General", q: "What is the capital of Ghana?", a: ["Kumasi", "Lomé", "Accra", "Tamale"], c: 2, why: "Accra is Ghana's capital and largest city." },
    { cat: "General", q: "What is the smallest prime number?", a: ["0", "1", "2", "3"], c: 2, why: "2 is the only even prime and the smallest." },
    { cat: "General", q: "What is 15% of 200?", a: ["20", "25", "30", "35"], c: 2, why: "0.15 × 200 = 30." },
    // Science
    { cat: "Science", q: "Which organ pumps blood around the human body?", a: ["Lungs", "Heart", "Kidney", "Liver"], c: 1, why: "The heart drives the circulatory system." },
    { cat: "Science", q: "What is the chemical symbol for gold?", a: ["Ag", "Gd", "Au", "Go"], c: 2, why: "Au comes from the Latin 'aurum'." },
    { cat: "Science", q: "Which gas do plants absorb for photosynthesis?", a: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], c: 2, why: "Plants take in CO₂ and release O₂." },
    { cat: "Science", q: "Which part of the cell is called the 'powerhouse'?", a: ["Nucleus", "Mitochondria", "Ribosome", "Cell wall"], c: 1, why: "Mitochondria produce ATP, the cell's energy." },
    { cat: "Science", q: "At sea level, water boils at…", a: ["90°C", "100°C", "110°C", "120°C"], c: 1, why: "100°C (212°F) at standard pressure." },
    { cat: "Science", q: "Which is the largest planet in our solar system?", a: ["Saturn", "Neptune", "Jupiter", "Earth"], c: 2, why: "Jupiter is over 11 times Earth's diameter." },
    { cat: "Science", q: "What is the hardest natural substance?", a: ["Gold", "Iron", "Quartz", "Diamond"], c: 3, why: "Diamond scores 10 on the Mohs scale." },
    { cat: "Science", q: "What is the pH of pure water?", a: ["0", "5", "7", "14"], c: 2, why: "Pure water is neutral, pH 7." },
    { cat: "Science", q: "What is the SI unit of force?", a: ["Joule", "Newton", "Watt", "Pascal"], c: 1, why: "Named after Isaac Newton." },
    { cat: "Science", q: "Sunlight helps your body make which vitamin?", a: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], c: 2, why: "UVB light triggers vitamin D production in skin." },
    { cat: "Science", q: "H₂O is the chemical formula for…", a: ["Salt", "Water", "Hydrogen peroxide", "Oxygen"], c: 1, why: "Two hydrogen atoms + one oxygen atom." },
    // Business
    { cat: "Business", q: "What does GDP stand for?", a: ["Gross Domestic Product", "General Development Plan", "Global Data Process", "Gross Distribution Price"], c: 0, why: "GDP measures the value of goods and services an economy produces." },
    { cat: "Business", q: "What does ROI stand for?", a: ["Rate of Interest", "Return on Investment", "Revenue of Industry", "Risk of Inflation"], c: 1, why: "ROI = gain from investment ÷ cost of investment." },
    { cat: "Business", q: "Which statement shows assets, liabilities and equity?", a: ["Income statement", "Cash flow statement", "Balance sheet", "Budget"], c: 2, why: "Assets = Liabilities + Equity." },
    { cat: "Business", q: "A general rise in prices over time is called…", a: ["Deflation", "Inflation", "Recession", "Devaluation"], c: 1, why: "Inflation reduces purchasing power." },
    { cat: "Business", q: "In a SWOT analysis, what does the 'S' stand for?", a: ["Sales", "Strategy", "Strengths", "Stakeholders"], c: 2, why: "Strengths, Weaknesses, Opportunities, Threats." },
    { cat: "Business", q: "Profit is calculated as…", a: ["Revenue + Costs", "Revenue − Costs", "Costs − Revenue", "Revenue × Costs"], c: 1, why: "What's left after costs are taken from revenue." },
    { cat: "Business", q: "When price rises, quantity demanded usually…", a: ["Rises", "Falls", "Stays the same", "Doubles"], c: 1, why: "The law of demand." },
    { cat: "Business", q: "What does CEO stand for?", a: ["Chief Executive Officer", "Central Economic Officer", "Chief Engineering Officer", "Company Expense Owner"], c: 0, why: "The top executive of a company." },
    { cat: "Business", q: "Which body regulates banks in Nigeria?", a: ["NNPC", "CBN", "NCC", "SEC"], c: 1, why: "The Central Bank of Nigeria." },
    // Nigeria
    { cat: "Nigeria", q: "Who wrote 'Things Fall Apart'?", a: ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Buchi Emecheta"], c: 1, why: "Chinua Achebe published it in 1958." },
    { cat: "Nigeria", q: "What is the capital of Nigeria?", a: ["Lagos", "Kano", "Abuja", "Ibadan"], c: 2, why: "Abuja became the capital in 1991." },
    { cat: "Nigeria", q: "In what year did Nigeria gain independence?", a: ["1957", "1960", "1963", "1967"], c: 1, why: "1 October 1960." },
    { cat: "Nigeria", q: "How many states does Nigeria have?", a: ["30", "34", "36", "37"], c: 2, why: "36 states plus the FCT." },
    { cat: "Nigeria", q: "Who was Nigeria's first Nobel Prize winner in Literature?", a: ["Chinua Achebe", "Ben Okri", "Wole Soyinka", "Chimamanda Adichie"], c: 2, why: "Wole Soyinka won in 1986." },
    { cat: "Nigeria", q: "The Rivers Niger and Benue meet at…", a: ["Lokoja", "Onitsha", "Makurdi", "Jebba"], c: 0, why: "Their confluence is at Lokoja, Kogi State." },
    { cat: "Nigeria", q: "What are the colours of the Nigerian flag?", a: ["Green-White-Green", "Green-Yellow-Red", "Red-White-Green", "Blue-White-Green"], c: 0, why: "Green for agriculture, white for peace." },
    { cat: "Nigeria", q: "Nigeria's film industry is popularly called…", a: ["Bollywood", "Nollywood", "Hollywood", "Ghallywood"], c: 1, why: "Nollywood is one of the largest film industries in the world." },
    { cat: "Nigeria", q: "What is the nickname of Nigeria's men's national football team?", a: ["Black Stars", "Super Eagles", "Indomitable Lions", "Flying Eagles"], c: 1, why: "The Super Eagles." },
    // Tech
    { cat: "Tech", q: "In computing, what does CPU stand for?", a: ["Central Processing Unit", "Computer Personal Utility", "Core Program Upload", "Central Power User"], c: 0, why: "The CPU executes a computer's instructions." },
    { cat: "Tech", q: "What does HTML stand for?", a: ["HyperText Markup Language", "High Transfer Machine Language", "Home Tool Markup Language", "Hyperlink Text Mode Logic"], c: 0, why: "HTML structures web pages." },
    { cat: "Tech", q: "How many bits are in one byte?", a: ["4", "8", "16", "32"], c: 1, why: "1 byte = 8 bits." },
    { cat: "Tech", q: "What does RAM stand for?", a: ["Read Access Memory", "Random Access Memory", "Rapid Action Module", "Run All Memory"], c: 1, why: "RAM is a computer's short-term working memory." },
    { cat: "Tech", q: "Which of these is a programming language?", a: ["Python", "Photoshop", "Chrome", "Excel"], c: 0, why: "Python is a popular general-purpose language." },
    { cat: "Tech", q: "What does URL stand for?", a: ["Universal Routing Link", "Uniform Resource Locator", "User Registered Login", "Unified Remote Language"], c: 1, why: "A URL is a web address." },
    { cat: "Tech", q: "Which company makes the iPhone?", a: ["Samsung", "Google", "Apple", "Tecno"], c: 2, why: "Apple launched the iPhone in 2007." },
    { cat: "Tech", q: "What does 'AI' stand for?", a: ["Automated Internet", "Artificial Intelligence", "Advanced Interface", "Applied Information"], c: 1, why: "Artificial Intelligence." },
    // Sports
    { cat: "Sports", q: "How many players does a football team have on the pitch?", a: ["9", "10", "11", "12"], c: 2, why: "Eleven players including the goalkeeper." },
    { cat: "Sports", q: "How often is the FIFA World Cup held?", a: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], c: 2, why: "Every four years." },
    { cat: "Sports", q: "How many rings are on the Olympic flag?", a: ["4", "5", "6", "7"], c: 1, why: "Five interlocking rings." },
    { cat: "Sports", q: "In chess, which piece moves only diagonally?", a: ["Rook", "Knight", "Bishop", "King"], c: 2, why: "Bishops always stay on their starting colour." },
    { cat: "Sports", q: "How many points is a basketball shot from beyond the arc?", a: ["1", "2", "3", "4"], c: 2, why: "A three-pointer." }
  ];
  const quizCategories = ["Mixed", "General", "Science", "Business", "Nigeria", "Tech", "Sports"];

  const words = [
    ["CAMPUS", "A university's grounds"], ["LECTURE", "A talk given to students"], ["SCHOLAR", "A person who studies deeply"],
    ["LIBRARY", "Where books are borrowed"], ["SEMESTER", "Half of an academic year"], ["PROFESSOR", "A senior university teacher"],
    ["HOSTEL", "Student accommodation"], ["GRADUATE", "Complete your degree"], ["TUTORIAL", "A small teaching session"],
    ["DEGREE", "What you earn at graduation"], ["FACULTY", "A group of related departments"], ["STUDENT", "You, right now"],
    ["VICTORY", "The act of winning"], ["PUZZLE", "A problem that tests ingenuity"], ["LOGIC", "Reasoning based on sound principles"],
    ["BRIGHT", "Giving out light; clever"], ["FRIEND", "Someone you know and trust"], ["NIGERIA", "Giant of Africa"],
    ["LAGOS", "Nigeria's busiest city"], ["JOLLOF", "The party rice debate"], ["NAIRA", "Nigeria's currency"],
    ["ENERGY", "The ability to do work"], ["PLANET", "Earth is one"], ["OXYGEN", "The gas we breathe in"],
    ["MARKET", "Where buyers meet sellers"], ["PROFIT", "Revenue minus costs"], ["BUDGET", "A spending plan"],
    ["LAPTOP", "A portable computer"], ["KEYBOARD", "You type on it"], ["NETWORK", "Connected computers or people"],
    ["CHAMPION", "The overall winner"], ["RHYTHM", "A regular beat in music"], ["GALAXY", "A huge system of stars"],
    ["JOURNEY", "A long trip"], ["KNOWLEDGE", "What you gain by learning"], ["PROJECT", "Final-year headache"],
    ["RESEARCH", "Careful study to find facts"], ["CAMERA", "Takes photos"], ["TRAFFIC", "Lagos rush hour"],
    ["EXAMS", "Test season"], ["ASSIGNMENT", "Homework, university edition"], ["CERTIFICATE", "Proof you finished"]
  ];

  // a = main answer, alt = other accepted answers. Answers compared lower-case with spaces/₦/commas/colons/dots removed.
  const brains = [
    { q: "What number comes next? 2, 4, 8, 16, __", a: "32", hint: "Each number doubles." },
    { q: "If 3 notebooks cost ₦900, what does one cost (in ₦)?", a: "300", hint: "Divide 900 by 3." },
    { q: "What number is missing? 5, 10, 15, __, 25", a: "20", hint: "Add five each time." },
    { q: "A farmer has 12 eggs. All but 4 break. How many are unbroken?", a: "4", hint: "'All but 4' means four survived." },
    { q: "What is 9 × 7?", a: "63", hint: "Nine groups of seven." },
    { q: "What is half of 2, plus 2?", a: "3", hint: "Half of 2 is 1." },
    { q: "Next in the sequence: 1, 1, 2, 3, 5, 8, __", a: "13", hint: "Add the previous two numbers." },
    { q: "Next in the sequence: 100, 90, 81, 73, __", a: "66", hint: "Subtract 10, then 9, then 8…" },
    { q: "If yesterday was Monday, what day is tomorrow?", a: "wednesday", hint: "Today is Tuesday." },
    { q: "How many months have 28 days?", a: "12", hint: "Every month has at least 28 days." },
    { q: "Next in the sequence: 3, 6, 12, 24, __", a: "48", hint: "Doubling again." },
    { q: "Next in the sequence: 1, 4, 9, 16, 25, __", a: "36", hint: "Square numbers." },
    { q: "A bat and a ball cost ₦1,100. The bat costs ₦1,000 more than the ball. How much is the ball (in ₦)?", a: "50", hint: "Ball = x, bat = x + 1000." },
    { q: "5 machines make 5 widgets in 5 minutes. How many minutes do 100 machines need for 100 widgets?", a: "5", hint: "Each machine makes one widget in 5 minutes." },
    { q: "What is 25% of 80?", a: "20", hint: "A quarter of 80." },
    { q: "Tolu is taller than Ada. Ada is taller than Bayo. Who is the shortest?", a: "bayo", hint: "Line them up." },
    { q: "Next prime number: 2, 3, 5, 7, 11, __", a: "13", hint: "Only divisible by 1 and itself." },
    { q: "What is 12 squared?", a: "144", hint: "12 × 12." },
    { q: "At exactly 3:00, what angle (in degrees) is between the clock hands?", a: "90", hint: "A quarter of the circle." },
    { q: "What has keys but can't open locks?", a: "piano", alt: ["keyboard", "apiano", "akeyboard"], hint: "You play it." },
    { q: "Rearrange the letters of LISTEN to make a word meaning 'quiet'.", a: "silent", hint: "Starts with S." },
    { q: "How many sides do 3 triangles and 2 squares have in total?", a: "17", hint: "3×3 + 2×4." },
    { q: "Next in the sequence: 7, 14, 28, 56, __", a: "112", hint: "Doubling." },
    { q: "A bus leaves at 9:45 and the trip takes 2 hours 30 minutes. What time does it arrive? (hh:mm)", a: "12:15", alt: ["1215", "1215pm"], hint: "9:45 + 2:30." },
    { q: "Odd one out: 2, 4, 6, 9, 10", a: "9", hint: "Look for the odd number." },
    { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: "m", alt: ["letterm", "theletterm"], hint: "Look at the spelling." },
    { q: "If you have ₦500 and spend 40%, how much is left (in ₦)?", a: "300", hint: "40% of 500 is 200." },
    { q: "A clock strikes 6 times at 6 o'clock. How many times does it strike at 9 o'clock?", a: "9", hint: "Once per hour number." }
  ];

  // [emoji clue, answer]
  const pictures = [
    ["🐝 + 🍃", "BELIEF"], ["🌧️ + 🎀", "RAINBOW"], ["⭐ + 🐟", "STARFISH"], ["☀️ + 👓", "SUNGLASSES"],
    ["🦶 + ⚽", "FOOTBALL"], ["🌙 + 💡", "MOONLIGHT"], ["🐴 + 👞", "HORSESHOE"], ["🔑 + 🕳️", "KEYHOLE"],
    ["☀️ + 🌼", "SUNFLOWER"], ["✈️ + 🚪", "AIRPORT"], ["🐍 + 🪜", "SNAKES AND LADDERS"], ["🍚 + 🍅 + 🌶️", "JOLLOF RICE"],
    ["❄️ + 👨", "SNOWMAN"], ["💧 + 🍉", "WATERMELON"], ["🏠 + 📝", "HOMEWORK"], ["📚 + 🐛", "BOOKWORM"],
    ["🧈 + 🪰", "BUTTERFLY"], ["🚪 + 🔔", "DOORBELL"], ["🌍 + 🔥", "GLOBAL WARMING"], ["⏰ + 🔔", "ALARM CLOCK"],
    ["🦷 + 🪥", "TOOTHBRUSH"], ["🌊 + 🏄", "SURFING"], ["🎂 + 🎉", "BIRTHDAY PARTY"], ["👁️ + 🍫", "EYE CANDY"],
    ["🔥 + 🪵", "FIREWOOD"], ["🥜 + 🧈", "PEANUT BUTTER"], ["🌧️ + 🧥", "RAINCOAT"], ["🎓 + 📜", "GRADUATION"]
  ];

  const memoryIcons = ["📚", "🎓", "⚡", "🏆", "🧠", "🔥", "🎯", "💡", "🎮", "🚀", "⭐", "🎵", "🍕", "⚽", "💎", "🦅"];

  const faculties = ["Sciences", "Management Sciences", "Engineering", "Arts & Humanities", "Social Sciences", "Law", "Education", "Health Sciences", "Agriculture", "Environmental Sciences"];
  const universities = ["Kingsley Ozumba Mbadiwe University", "University of Lagos", "University of Nigeria, Nsukka", "Obafemi Awolowo University", "University of Ibadan", "Ahmadu Bello University", "Covenant University", "Imo State University", "Federal University of Technology, Owerri", "Nnamdi Azikiwe University", "University of Benin", "Lagos State University"];

  // Simulated rival players — gives the leaderboard life until a real backend exists.
  const players = [
    ["Ada Okafor", "Sciences", "Computer Science", 1240, 140], ["Daniel Musa", "Management Sciences", "Accounting", 1110, 120],
    ["Ifeoma James", "Social Sciences", "Mass Communication", 980, 155], ["Tobi Adeyemi", "Engineering", "Mechanical Eng.", 870, 110],
    ["Mary Eze", "Management Sciences", "Business Admin", 760, 95], ["Samuel Peter", "Social Sciences", "Economics", 650, 130],
    ["Zainab Bello", "Law", "Law", 540, 170], ["Chuka Obi", "Education", "Science Education", 420, 80],
    ["Grace David", "Sciences", "Biochemistry", 310, 100], ["Emeka Nwosu", "Engineering", "Electrical Eng.", 1420, 90],
    ["Halima Sani", "Health Sciences", "Nursing", 690, 145], ["Kelechi Uzo", "Arts & Humanities", "English", 380, 75],
    ["Bisi Ola", "Management Sciences", "Marketing", 1020, 105], ["Yusuf Abdullahi", "Agriculture", "Agric Economics", 260, 60],
    ["Ngozi Ike", "Sciences", "Microbiology", 840, 125], ["Femi Johnson", "Environmental Sciences", "Architecture", 590, 115],
    ["Amaka Chukwu", "Law", "Law", 930, 135], ["Seun Bakare", "Engineering", "Computer Eng.", 1310, 160],
    ["Joy Udo", "Arts & Humanities", "Theatre Arts", 470, 85], ["Ibrahim Lawal", "Social Sciences", "Political Science", 720, 100]
  ].map(([name, faculty, dept, base, rate]) => ({ name, faculty, dept, base, rate }));

  const loginRewards = [
    { coins: 20, label: "20 🪙" }, { coins: 30, label: "30 🪙" }, { powerup: "fifty", n: 1, label: "50/50" },
    { coins: 50, label: "50 🪙" }, { energy: 5, label: "Full ⚡" }, { coins: 75, label: "75 🪙" },
    { coins: 100, gems: 5, label: "100🪙 + 5💎" }
  ];

  // Lucky spin — free daily only (no paid spins, keeps it fair and away from gambling mechanics)
  const spinPrizes = [
    { label: "20 🪙", coins: 20, w: 22, color: "#3a2a60" }, { label: "50 🪙", coins: 50, w: 16, color: "#5b3a96" },
    { label: "+2 ⚡", energy: 2, w: 14, color: "#2a4a60" }, { label: "50/50", powerup: "fifty", w: 12, color: "#603a5a" },
    { label: "100 🪙", coins: 100, w: 8, color: "#7a4fc0" }, { label: "+10s", powerup: "time", w: 12, color: "#2f5a4a" },
    { label: "5 💎", gems: 5, w: 4, color: "#a0457f" }, { label: "30 🪙", coins: 30, w: 12, color: "#45387a" }
  ];

  const missions = [
    { id: "play3", text: "Play 3 games", type: "game", goal: 3, reward: 40 },
    { id: "correct15", text: "Answer 15 questions correctly", type: "correct", goal: 15, reward: 50 },
    { id: "combo5", text: "Hit a 5× answer combo", type: "combo", goal: 5, reward: 40, max: true },
    { id: "win2", text: "Win 2 games", type: "win", goal: 2, reward: 50 },
    { id: "duel1", text: "Win a 1v1 Clash", type: "win:duel", goal: 1, reward: 60 },
    { id: "word", text: "Solve 6 words in Word Rush", type: "correct:word", goal: 6, reward: 45 },
    { id: "blitz", text: "Score 1,000+ in Math Blitz", type: "score:blitz", goal: 1000, reward: 60, max: true },
    { id: "memory", text: "Complete Memory Flip", type: "win:memory", goal: 1, reward: 35 },
    { id: "brain", text: "Solve 4 Brain Test puzzles", type: "correct:brain", goal: 4, reward: 45 },
    { id: "picture", text: "Get 6 Picture Challenge clues right", type: "correct:picture", goal: 6, reward: 40 },
    { id: "quiz", text: "Play a Quiz Battle", type: "game:quiz", goal: 1, reward: 30 }
  ];

  const powerups = {
    fifty: { name: "50/50", icon: "✂️", desc: "Remove two wrong answers", price: 60 },
    time:  { name: "+10 Seconds", icon: "⏱️", desc: "Add 10 seconds to the clock", price: 40 },
    skip:  { name: "Skip", icon: "⏭️", desc: "Skip a question without breaking your combo", price: 50 }
  };

  // cost: { coins } or { gems } or { pro: true }
  const cosmetics = {
    avatar: [
      { id: "⚡", cost: {} }, { id: "🦁", cost: { coins: 250 } }, { id: "🦅", cost: { coins: 250 } }, { id: "🦊", cost: { coins: 300 } },
      { id: "🐼", cost: { coins: 300 } }, { id: "🤖", cost: { coins: 400 } }, { id: "🎓", cost: { coins: 400 } }, { id: "🚀", cost: { gems: 40 } },
      { id: "🐉", cost: { gems: 60 } }, { id: "👑", cost: { gems: 90 } }, { id: "💎", cost: { gems: 120 } }, { id: "🔥", cost: { pro: true } }
    ],
    frame: [
      { id: "none", name: "No frame", cost: {} }, { id: "silver", name: "Silver", cost: { coins: 500 } },
      { id: "gold", name: "Gold", cost: { coins: 1200 } }, { id: "neon", name: "Neon", cost: { gems: 70 } },
      { id: "fire", name: "Inferno", cost: { gems: 120 } }, { id: "pro", name: "Pro Crown", cost: { pro: true } }
    ],
    theme: [
      { id: "violet", name: "Violet Night", a: "#8b5cf6", b: "#e65ab5", cost: {} },
      { id: "emerald", name: "Emerald", a: "#10b981", b: "#43d9e8", cost: { coins: 600 } },
      { id: "ocean", name: "Ocean", a: "#3b82f6", b: "#43d9e8", cost: { coins: 600 } },
      { id: "sunset", name: "Sunset", a: "#f97316", b: "#e65ab5", cost: { gems: 80 } },
      { id: "crimson", name: "Crimson", a: "#ef4444", b: "#f59e0b", cost: { gems: 80 } },
      { id: "gold", name: "Pro Gold", a: "#eab308", b: "#f97316", cost: { pro: true } }
    ]
  };

  const tiers = [
    { name: "Bronze", min: 0, icon: "🥉" }, { name: "Silver", min: 300, icon: "🥈" }, { name: "Gold", min: 1000, icon: "🥇" },
    { name: "Platinum", min: 2500, icon: "💠" }, { name: "Diamond", min: 5000, icon: "💎" }, { name: "Campus Legend", min: 10000, icon: "👑" }
  ];

  const tournaments = [
    { id: "weekly", name: "Weekly Brain Championship", icon: "🧠", type: "WEEKLY QUALIFIER", game: "quiz", desc: "Same 10 questions for everyone this week. Your best score counts. Top 10 earn the Champion badge and sponsor rewards.", schedule: "Resets every Monday", prize: "Champion badge + sponsor rewards" },
    { id: "wordko", name: "Word Rush Knockout", icon: "🔤", type: "KNOCKOUT", game: "word", desc: "Post your best 60-second Word Rush score. Top 16 advance to the live knockout rounds.", schedule: "Weekly qualifier", prize: "Elite Wordsmith title" },
    { id: "blitzcup", name: "Math Blitz Showdown", icon: "🧮", type: "ARCADE CUP", game: "blitz", desc: "Fastest mental-maths minds on campus. Best Math Blitz score this week wins.", schedule: "Weekly qualifier", prize: "Human Calculator crown" },
    { id: "faculty", name: "Faculty vs Faculty", icon: "🏛️", type: "TEAM EVENT", desc: "Every point you earn in any game counts toward your faculty's total. Carry your faculty to the top.", schedule: "All semester", prize: "Faculty champion title" },
    { id: "grand", name: "Campus Clash Grand Final", icon: "🏆", type: "FEATURED", desc: "The semester's signature event. The top 32 players on the season leaderboard are invited.", schedule: "End of semester", prize: "Grand Champion title + sponsor prizes" }
  ];

  return { games, quiz, quizCategories, words, brains, pictures, memoryIcons, faculties, universities, players, loginRewards, spinPrizes, missions, powerups, cosmetics, tiers, tournaments };
})();
