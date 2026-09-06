import { db } from "../firebase-config.js";
import { auth } from "../firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const type = params.get("type") || "general";
const level = params.get("level") || "";
const category = params.get("category") || "";

const quizTitle = document.getElementById("quizTypeTitle");
const questionCountEl = document.getElementById("questionCount");
const questionEl = document.getElementById("quizQuestion");
const optionButtons = document.querySelectorAll(".option-btn");
const progressBar = document.getElementById("progressBar");
const timer = document.getElementById("timer");
const nextBtn = document.getElementById("nextQuestionBtn");
const quitBtn = document.getElementById("quitQuizBtn");

let questions = [];
let currentQuestion = 0;
let score = 0;
let selectedAnswer = "";
let timeLeft = 30;
let timerInterval = null;
let currentUser = null;
let isChecking = false;
let quizFinished = false;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getQuizKey() {
  if (type === "general") {
    return `general_${level}`;
  }
  return category;
}

function setTitle() {
  const levelNames = {
    easy: "సులభం",
    medium: "మధ్యమం",
    hard: "కష్టం"
  };

  if (type === "general") {
    const lvlText = levelNames[level] || level;
    quizTitle.innerText = `సాధారణ ప్రశ్నావళి (${lvlText})`;
    return;
  }

  const titles = {
    hari: "హరి విభాగ ప్రశ్నావళి",
    hara: "హర విభాగ ప్రశ్నావళి",
    devi: "దేవి విభాగ ప్రశ్నావళి",
    telugu: "తెలుగు విభాగ ప్రశ్నావళి"
  };

  quizTitle.innerText = titles[category] || "ప్రశ్నావళి";
}

function normalizeQuestion(item, defaultCategory = "") {
  let opts = [];
  if (Array.isArray(item.options) && item.options.length > 0) {
    opts = item.options.map(o => String(o || "").trim());
  } else {
    opts = [
      String(item.option1 || "").trim(),
      String(item.option2 || "").trim(),
      String(item.option3 || "").trim(),
      String(item.option4 || "").trim()
    ];
  }

  let rawAns = String(item.answer || "").trim();
  let correctText = rawAns;
  const optMap = {
    option1: opts[0],
    option2: opts[1],
    option3: opts[2],
    option4: opts[3],
    opt1: opts[0],
    opt2: opts[1],
    opt3: opts[2],
    opt4: opts[3],
    "1": opts[0],
    "2": opts[1],
    "3": opts[2],
    "4": opts[3],
    "0": opts[0]
  };

  if (optMap[rawAns.toLowerCase()] !== undefined) {
    correctText = optMap[rawAns.toLowerCase()];
  }

  return {
    ...item,
    category: (item.category || defaultCategory || "").toLowerCase().trim(),
    difficulty: (item.difficulty || "").toLowerCase().trim(),
    question: item.question || item.q || "",
    options: opts,
    answer: correctText
  };
}

function getOptions(q) {
  if (Array.isArray(q.options) && q.options.length > 0) return q.options;

  return [
    q.option1 || "",
    q.option2 || "",
    q.option3 || "",
    q.option4 || ""
  ];
}

async function loadQuestions() {
  setTitle();

  questionEl.innerText = "ప్రశ్నలు లోడ్ అవుతున్నాయి...";

  try {
    const normCategory = (category || "").toLowerCase().trim();
    const normLevel = (level || "").toLowerCase().trim();
    const targetCategory = type === "general" ? "general" : normCategory;

    let candidatePool = [];

    // 1. Fetch from MAIN_COLLECTION: quizQuestions
    try {
      const snapMain = await getDocs(collection(db, "quizQuestions"));
      snapMain.forEach(docSnap => {
        const d = docSnap.data();
        const normDoc = normalizeQuestion(d, "");
        if (!normDoc.question) return;

        // Category check (case-insensitive)
        const docCat = normDoc.category;
        if (type === "general") {
          if (docCat === "general" || !docCat) {
            candidatePool.push(normDoc);
          }
        } else {
          if (docCat === targetCategory) {
            candidatePool.push(normDoc);
          }
        }
      });
    } catch (e) {
      console.warn("quizQuestions fetch error:", e);
    }

    // 2. Fetch from corresponding legacy collections
    const legacyCollectionsToQuery = [];
    if (type === "general") {
      legacyCollectionsToQuery.push({ name: "quizGeneral", cat: "general" });
    } else {
      if (normCategory === "hari") legacyCollectionsToQuery.push({ name: "quizHari", cat: "hari" });
      else if (normCategory === "hara") legacyCollectionsToQuery.push({ name: "quizHara", cat: "hara" });
      else if (normCategory === "devi") legacyCollectionsToQuery.push({ name: "quizDevi", cat: "devi" });
      else if (normCategory === "telugu") legacyCollectionsToQuery.push({ name: "quizTelugu", cat: "telugu" });
      else if (normCategory) {
        // dynamic capitalization fallback
        legacyCollectionsToQuery.push({
          name: `quiz${normCategory.charAt(0).toUpperCase() + normCategory.slice(1)}`,
          cat: normCategory
        });
      }
    }

    for (const leg of legacyCollectionsToQuery) {
      try {
        const snapLeg = await getDocs(collection(db, leg.name));
        snapLeg.forEach(docSnap => {
          const d = docSnap.data();
          const normDoc = normalizeQuestion(d, leg.cat);
          if (!normDoc.question) return;
          candidatePool.push(normDoc);
        });
      } catch (e) {
        console.warn(`${leg.name} fetch error:`, e);
      }
    }

    // 3. Filter by difficulty if in General quiz mode
    if (type === "general" && normLevel) {
      const levelMatches = candidatePool.filter(q => q.difficulty === normLevel);
      if (levelMatches.length >= 5) {
        questions = levelMatches;
      } else {
        // Gracefully combine matching questions with remaining pool so player is never blocked
        questions = candidatePool;
      }
    } else {
      questions = candidatePool;
    }

    // De-duplicate by question text
    const seen = new Set();
    questions = questions.filter(q => {
      const key = (q.question || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    shuffle(questions);
    questions = questions.slice(0, 10);

    if (questions.length === 0) {
      questionEl.innerText = "ఇంకా ప్రశ్నలు లేవు. అడ్మిన్ లో జోడించండి.";
      questionCountEl.innerText = "ప్రశ్న 0 / 0";
      timer.innerText = "0";
      nextBtn.disabled = true;
      optionButtons.forEach(btn => {
        btn.innerText = "";
        btn.disabled = true;
      });
      return;
    }

    showQuestion();

  } catch (error) {
    console.error(error);
    questionEl.innerText = "ప్రశ్నలు లోడ్ కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.";
  }
}

function showQuestion() {
  if (quizFinished) return;

  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[currentQuestion];

  if (!q) {
    finishQuiz();
    return;
  }

  const options = getOptions(q);

  selectedAnswer = "";
  isChecking = false;
  nextBtn.disabled = false;

  questionCountEl.innerText = `ప్రశ్న ${currentQuestion + 1} / ${questions.length}`;

  progressBar.style.width =
    `${((currentQuestion + 1) / questions.length) * 100}%`;

  // Fade the question in for a smoother transition between questions
  questionEl.classList.remove("quiz-fade-in");
  void questionEl.offsetWidth; // restart animation
  questionEl.innerText = q.question || "";
  questionEl.classList.add("quiz-fade-in");

  optionButtons.forEach((btn, index) => {
    btn.innerText = options[index] || "";
    btn.classList.remove("option-selected", "option-correct", "option-wrong");
    btn.classList.remove("quiz-fade-in");
    void btn.offsetWidth;
    btn.classList.add("quiz-fade-in");
    btn.disabled = false;
  });

  startTimer();
}

optionButtons.forEach(btn => {
  btn.onclick = () => {
    if (isChecking || quizFinished) return;

    optionButtons.forEach(b => b.classList.remove("option-selected"));
    btn.classList.add("option-selected");
    selectedAnswer = btn.innerText;
  };
});

function startTimer() {
  clearInterval(timerInterval);

  timeLeft = 30;
  timer.innerText = timeLeft;
  timer.classList.remove("timer-warning");

  timerInterval = setInterval(() => {
    timeLeft--;
    timer.innerText = timeLeft;

    if (timeLeft <= 10) {
      timer.classList.add("timer-warning");
    }

    if (timeLeft <= 0) {
      checkAnswer();
    }
  }, 1000);
}

function checkAnswer() {
  if (isChecking || quizFinished) return;

  clearInterval(timerInterval);

  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[currentQuestion];

  if (!q) {
    finishQuiz();
    return;
  }

  isChecking = true;
  nextBtn.disabled = true;

  const options = getOptions(q);
  const correctAnswer = String(q.answer || "").trim();
  const normalizedCorrect = correctAnswer.toLowerCase();
  const normalizedSelected = String(selectedAnswer || "").trim().toLowerCase();

  optionButtons.forEach(btn => {
    btn.disabled = true;

    if (String(btn.innerText || "").trim().toLowerCase() === normalizedCorrect) {
      btn.classList.add("option-correct");
    }
  });

  if (normalizedSelected && normalizedSelected === normalizedCorrect) {
    score++;
  } else if (normalizedSelected) {
    optionButtons.forEach(btn => {
      if (String(btn.innerText || "").trim().toLowerCase() === normalizedSelected) {
        btn.classList.add("option-wrong");
      }
    });
  }

  currentQuestion++;

  setTimeout(() => {
    if (currentQuestion >= questions.length) {
      finishQuiz();
    } else {
      showQuestion();
    }
  }, 1200);
}

nextBtn.onclick = () => {
  checkAnswer();
};

quitBtn.onclick = () => {
  if (confirm("ప్రశ్నావళిని వదిలేసి వెనుకకు వెళ్లాలనుకుంటున్నారా?")) {
    clearInterval(timerInterval);
    window.location.href = "index.html";
  }
};

async function finishQuiz() {
  if (quizFinished) return;

  quizFinished = true;
  clearInterval(timerInterval);

  nextBtn.disabled = true;

  optionButtons.forEach(btn => {
    btn.disabled = true;
  });

  const quizKey = getQuizKey();

  localStorage.setItem("quizScore", score);
  localStorage.setItem("quizTotal", questions.length);
  localStorage.setItem("quizType", type);
  localStorage.setItem("quizLevel", level || category);
  localStorage.setItem("quizCategory", category);
  localStorage.setItem("quizKey", quizKey);

  if (currentUser) {
    const userRef = doc(db, "users", currentUser.uid);

    const scoreKey = type === "general"
      ? `quizScore_general_${level}`
      : `quizScore_${category}`;

    try {
      await setDoc(
        userRef,
        {
          [scoreKey]: increment(score),
          updatedAt: new Date()
        },
        { merge: true }
      );
    } catch (error) {
      console.error("User score save failed:", error);
    }

    // NOTE: this block previously ran twice (a duplicate copy existed here),
    // which double-counted every category quiz's score in sectionScores.
    // Now it runs exactly once.
    if (type === "category" && category) {
      const secRef = doc(db, "sectionScores", category);

      try {
        const secSnap = await getDoc(secRef);

        if (secSnap.exists()) {
          await updateDoc(secRef, {
            total: increment(score)
          });
        } else {
          await setDoc(secRef, {
            total: score
          });
        }
      } catch (error) {
        console.error("Community score save failed:", error);
      }
    }
  }

  window.location.href = "quiz-result.html";
}

loadQuestions();
