import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";

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
  if (type === "general") {
    quizTitle.innerText = `${level.toUpperCase()} Quiz`;
    return;
  }

  const titles = {
    hari: "హరి Quiz",
    hara: "హర Quiz",
    devi: "దేవి Quiz",
    telugu: "తెలుగు Quiz"
  };

  quizTitle.innerText = titles[category] || "Quiz";
}

function getOptions(q) {
  if (Array.isArray(q.options)) return q.options;

  return [
    q.option1 || "",
    q.option2 || "",
    q.option3 || "",
    q.option4 || ""
  ];
}

async function loadQuestions() {
  setTitle();

  questionEl.innerText = "Loading...";

  try {
    const snapshot = await getDocs(collection(db, "quizQuestions"));

    const categoryForQuery = type === "general" ? "general" : category;

    questions = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      if (data.category !== categoryForQuery) return;
      if (type === "general" && data.difficulty !== level) return;

      questions.push(data);
    });

    shuffle(questions);
    questions = questions.slice(0, 10);

    if (questions.length === 0) {
      questionEl.innerText = "ఇంకా ప్రశ్నలు లేవు. Admin లో add చేయండి.";
      questionCountEl.innerText = "Question 0 / 0";
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
    questionEl.innerText = "Questions load కాలేదు. Console check చేయండి.";
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

  questionCountEl.innerText = `Question ${currentQuestion + 1} / ${questions.length}`;

  progressBar.style.width =
    `${((currentQuestion + 1) / questions.length) * 100}%`;

  questionEl.innerText = q.question || "";

  optionButtons.forEach((btn, index) => {
    btn.innerText = options[index] || "";
    btn.classList.remove("option-selected", "option-correct", "option-wrong");
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

  timerInterval = setInterval(() => {
    timeLeft--;
    timer.innerText = timeLeft;

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
  const correctAnswer = q.answer || "";

  optionButtons.forEach(btn => {
    btn.disabled = true;

    if (btn.innerText === correctAnswer) {
      btn.classList.add("option-correct");
    }
  });

  if (selectedAnswer === correctAnswer) {
    score++;
  } else if (selectedAnswer) {
    optionButtons.forEach(btn => {
      if (btn.innerText === selectedAnswer) {
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
  if (confirm("Quiz వదిలేస్తారా?")) {
    clearInterval(timerInterval);
    window.location.href = "quiz.html";
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

    if (type === "category" && category) {
      const secRef = doc(db, "sectionScores", category);

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