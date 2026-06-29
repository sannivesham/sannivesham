import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let questions = [];
let currentQuestion = 0;
let score = 0;
let player = "";

/* LOAD RANDOM 10 QUESTIONS */
async function loadQuestionsFromFirebase() {
  const snapshot = await getDocs(collection(db, "quizQuestions"));

  questions = [];

  snapshot.forEach((docItem) => {
    const data = docItem.data();

    questions.push({
      q: data.question,
      options: [
        data.options.A,
        data.options.B,
        data.options.C,
        data.options.D
      ],
      answer: data.options[data.correctAnswer]
    });
  });

  questions = questions
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);
}

/* START QUIZ */
window.startQuiz = async function () {
  player = document.getElementById("playerName").value.trim();

  if (player === "") {
    alert("దయచేసి మీ పేరు నమోదు చేయండి");
    return;
  }

  await loadQuestionsFromFirebase();

  if (questions.length === 0) {
    alert("Nik em telusu ani bro Quiz adutunnav 😅");
    return;
  }

  document.getElementById("startBox").classList.add("hide");
  document.getElementById("quizBox").classList.remove("hide");

  currentQuestion = 0;
  score = 0;

  const liveScoreCard = document.getElementById("liveScoreCard");

  if (liveScoreCard) {
    liveScoreCard.innerText = "స్కోర్: 0";
  }

  showQuestion();
};

/* SHOW QUESTION */
function showQuestion() {
  const q = questions[currentQuestion];

  document.getElementById("questionCount").innerText =
    `ప్రశ్న ${currentQuestion + 1} / ${questions.length}`;

  document.getElementById("questionText").innerText = q.q;

  const optionsBox = document.getElementById("optionsBox");
  optionsBox.innerHTML = "";

  q.options.forEach((option) => {
    const btn = document.createElement("button");

    btn.className = "option-btn";
    btn.innerText = option;

    btn.onclick = () => checkAnswer(btn, option);

    optionsBox.appendChild(btn);
  });
}

/* CHECK ANSWER */
function checkAnswer(button, selected) {
  const correct = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach((btn) => {
    btn.disabled = true;

    if (btn.innerText === correct) {
      btn.classList.add("correct");
    }
  });

  if (selected === correct) {
    score++;
    button.classList.add("correct");
  } else {
    button.classList.add("wrong");
  }

  const liveScoreCard = document.getElementById("liveScoreCard");

  if (liveScoreCard) {
    liveScoreCard.innerText = `స్కోర్: ${score}`;
  }

  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

/* NEXT QUESTION */
function nextQuestion() {
  currentQuestion++;

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

/* RESULT */
async function showResult() {
  document.getElementById("quizBox").classList.add("hide");
  document.getElementById("resultBox").classList.remove("hide");

  let msg = "";

  if (score >= 9) {
    msg = "🏆 అద్భుతం!";
  } else if (score >= 7) {
    msg = "🎉 చాలా బాగుంది!";
  } else if (score >= 5) {
    msg = "👍 మంచి ప్రయత్నం!";
  } else {
    msg = "📚 మరింత నేర్చుకోండి!";
  }

  document.getElementById("scoreText").innerHTML =
    `${player}<br><br>
     మీ స్కోర్ ${score}/${questions.length}<br><br>
     ${msg}`;

  await saveScore();
  await showLeaderboard();
}

/* SAVE SCORE TO FIREBASE */
async function saveScore() {
  const normalizedName = player.trim().toLowerCase();

  const snapshot = await getDocs(collection(db, "quizScores"));

  let existingId = null;
  let existingBestScore = -1;
  let existingDisplayName = player.trim();

  snapshot.forEach((docItem) => {
    const data = docItem.data();

    if ((data.name || "").trim().toLowerCase() === normalizedName) {
      existingId = docItem.id;
      existingBestScore = Number(data.score) || 0;
      existingDisplayName = data.name || player.trim();
    }
  });

  if (existingId) {
    if (score > existingBestScore) {
      await addDoc(collection(db, "quizScores"), {
        name: existingDisplayName,
        score,
        createdAt: serverTimestamp()
      });
    }
  } else {
    await addDoc(collection(db, "quizScores"), {
      name: player.trim(),
      score,
      createdAt: serverTimestamp()
    });
  }
}

/* SHOW GLOBAL LEADERBOARD */
async function showLeaderboard() {
  const board = document.getElementById("leaderboard");

  if (!board) return;

  const q = query(
    collection(db, "quizScores"),
    orderBy("score", "desc")
  );

  const snapshot = await getDocs(q);

  const bestScores = {};

  snapshot.forEach((docItem) => {
    const data = docItem.data();

    const key = (data.name || "").trim().toLowerCase();

    if (!key) return;

    if (
      !bestScores[key] ||
      Number(data.score) > Number(bestScores[key].score)
    ) {
      bestScores[key] = {
        name: data.name,
        score: Number(data.score) || 0
      };
    }
  });

  const scores = Object.values(bestScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (scores.length === 0) {
    board.innerHTML = "<p>ఇంకా స్కోర్లు లేవు</p>";
    return;
  }

  board.innerHTML = scores.map((s, i) =>
    `<p>🏅 ${i + 1}. ${s.name} - ${s.score}/10</p>`
  ).join("");
}

showLeaderboard();