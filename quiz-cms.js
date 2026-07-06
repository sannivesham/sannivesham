import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin.html";
  }
});

const CLOUD_NAME = "du5em76za";
const UPLOAD_PRESET = "sannivesham_upload";

const MAIN_COLLECTION = "quizQuestions";

const LEGACY_COLLECTIONS = [
  "quizGeneral",
  "quizHari",
  "quizHara",
  "quizDevi",
  "quizTelugu"
];

const categoryLabels = {
  general: "General",
  hari: "Hari",
  hara: "Hara",
  devi: "Devi",
  telugu: "Telugu"
};

const difficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

const categoryEl = document.getElementById("category");
const difficultyEl = document.getElementById("difficulty");
const questionEl = document.getElementById("question");
const option1El = document.getElementById("option1");
const option2El = document.getElementById("option2");
const option3El = document.getElementById("option3");
const option4El = document.getElementById("option4");
const answerEl = document.getElementById("answer");
const imageEl = document.getElementById("questionImage");
const saveBtn = document.getElementById("saveQuestion");
const clearBtn = document.getElementById("clearQuestion");
const searchEl = document.getElementById("searchQuestion");
const questionList = document.getElementById("questionList");

let allQuestions = [];
let editingId = null;
let editingCollection = MAIN_COLLECTION;
let editingImage = "";

function normalizeText(value) {
  return String(value || "").trim();
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAnswerText(answerKey, options) {
  const map = {
    option1: options[0],
    option2: options[1],
    option3: options[2],
    option4: options[3]
  };

  return normalizeText(map[answerKey]);
}

function getAnswerKeyFromText(answerText, options) {
  const index = options.findIndex(
    option => normalizeText(option) === normalizeText(answerText)
  );

  return index >= 0 ? `option${index + 1}` : "option1";
}

function updateDifficultyState() {
  if (categoryEl.value === "general") {
    difficultyEl.disabled = false;
  } else {
    difficultyEl.value = "easy";
    difficultyEl.disabled = true;
  }
}

function clearForm() {
  editingId = null;
  editingCollection = MAIN_COLLECTION;
  editingImage = "";

  categoryEl.value = "general";
  difficultyEl.value = "easy";
  updateDifficultyState();

  questionEl.value = "";
  option1El.value = "";
  option2El.value = "";
  option3El.value = "";
  option4El.value = "";
  answerEl.value = "option1";

  if (imageEl) imageEl.value = "";

  saveBtn.innerText = "Save Question";
}

async function uploadImage(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error("Image upload failed");
  }

  return data.secure_url;
}

function validateQuestion(data) {
  if (!data.question) {
    alert("Question enter చేయండి");
    return false;
  }

  if (data.options.some(option => !option)) {
    alert("అన్ని options fill చేయండి");
    return false;
  }

  const uniqueOptions = new Set(
    data.options.map(option => option.toLowerCase())
  );

  if (uniqueOptions.size !== 4) {
    alert("Options duplicate కాకూడదు");
    return false;
  }

  if (!data.answer) {
    alert("Correct answer select చేయండి");
    return false;
  }

  if (data.category === "general" && !data.difficulty) {
    alert("General quiz కి difficulty select చేయండి");
    return false;
  }

  return true;
}

function buildQuestionData() {
  const category = normalizeText(categoryEl.value);
  const difficulty = category === "general"
    ? normalizeText(difficultyEl.value)
    : "";

  const options = [
    normalizeText(option1El.value),
    normalizeText(option2El.value),
    normalizeText(option3El.value),
    normalizeText(option4El.value)
  ];

  const answer = getAnswerText(answerEl.value, options);

  return {
    category,
    difficulty,
    question: normalizeText(questionEl.value),
    options,
    option1: options[0],
    option2: options[1],
    option3: options[2],
    option4: options[3],
    answer,
    image: editingImage || "",
    updatedAt: serverTimestamp()
  };
}

async function saveQuestion() {
  const data = buildQuestionData();

  if (!validateQuestion(data)) return;

  saveBtn.disabled = true;
  saveBtn.innerText = editingId ? "Updating..." : "Saving...";

  try {
    if (imageEl && imageEl.files && imageEl.files[0]) {
      data.image = await uploadImage(imageEl.files[0]);
    }

    if (editingId) {
      await updateDoc(doc(db, editingCollection, editingId), data);
      alert("Question updated ✅");
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, MAIN_COLLECTION), data);
      alert("Question added ✅");
    }

    clearForm();
    await loadQuestions();
  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = editingId ? "Update Question" : "Save Question";
  }
}

async function loadMainQuestions() {
  const questions = [];

  try {
    const q = query(
      collection(db, MAIN_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(item => {
      const data = item.data();

      questions.push({
        id: item.id,
        collectionName: MAIN_COLLECTION,
        source: "new",
        ...data,
        options: Array.isArray(data.options)
          ? data.options
          : [
              data.option1 || "",
              data.option2 || "",
              data.option3 || "",
              data.option4 || ""
            ]
      });
    });
  } catch (error) {
    console.warn("Main quizQuestions load failed:", error);
  }

  return questions;
}

async function loadLegacyQuestions() {
  const questions = [];

  for (const collectionName of LEGACY_COLLECTIONS) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));

      snapshot.forEach(item => {
        const data = item.data();

        questions.push({
          id: item.id,
          collectionName,
          source: "legacy",
          ...data,
          options: [
            data.option1 || "",
            data.option2 || "",
            data.option3 || "",
            data.option4 || ""
          ]
        });
      });
    } catch (error) {
      console.warn(`${collectionName} load failed:`, error);
    }
  }

  return questions;
}

async function loadQuestions() {
  questionList.innerHTML =
    "<p style='color:white;text-align:center'>Loading...</p>";

  const mainQuestions = await loadMainQuestions();
  const legacyQuestions = await loadLegacyQuestions();

  allQuestions = [...mainQuestions, ...legacyQuestions];

  renderQuestions(allQuestions);
}

function renderQuestions(list) {
  questionList.innerHTML = "";

  if (!list.length) {
    questionList.innerHTML =
      "<p style='color:white;text-align:center'>ప్రశ్నలు లేవు</p>";
    return;
  }

  list.forEach(item => {
    const options = Array.isArray(item.options)
      ? item.options
      : [
          item.option1 || "",
          item.option2 || "",
          item.option3 || "",
          item.option4 || ""
        ];

    const card = document.createElement("div");
    card.className = "question-card";

    const categoryText =
      categoryLabels[item.category] || item.category || "General";

    const difficultyText =
      item.category === "general"
        ? ` — ${difficultyLabels[item.difficulty] || item.difficulty || "Easy"}`
        : "";

    const sourceBadge =
      item.source === "legacy"
        ? `<span style="color:#ffb703;font-size:13px;">Legacy</span>`
        : `<span style="color:#90ee90;font-size:13px;">New</span>`;

    card.innerHTML = `
      <h3>
        ${escapeHTML(categoryText)}${escapeHTML(difficultyText)}
        ${sourceBadge}
      </h3>

      ${item.image ? `
        <img
          src="${escapeHTML(item.image)}"
          alt="Question Image"
          style="width:100%;max-height:220px;object-fit:contain;border-radius:16px;margin:12px 0;background:rgba(0,0,0,.25);"
        >
      ` : ""}

      <p><b>Q:</b> ${escapeHTML(item.question)}</p>

      <p>
        <b>A:</b> ${escapeHTML(options[0])}<br>
        <b>B:</b> ${escapeHTML(options[1])}<br>
        <b>C:</b> ${escapeHTML(options[2])}<br>
        <b>D:</b> ${escapeHTML(options[3])}
      </p>

      <p style="color:#ffd166;">
        <b>Answer:</b> ${escapeHTML(item.answer)}
      </p>

      <div class="question-actions">
        <button class="edit-btn" data-id="${escapeHTML(item.id)}" data-collection="${escapeHTML(item.collectionName)}">
          Edit
        </button>

        <button class="delete-btn" data-id="${escapeHTML(item.id)}" data-collection="${escapeHTML(item.collectionName)}">
          Delete
        </button>
      </div>
    `;

    questionList.appendChild(card);
  });

  bindQuestionActions();
}

function bindQuestionActions() {
  questionList.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const collectionName = button.dataset.collection;

      const item = allQuestions.find(
        q => q.id === id && q.collectionName === collectionName
      );

      if (!item) return;

      const options = Array.isArray(item.options)
        ? item.options
        : [
            item.option1 || "",
            item.option2 || "",
            item.option3 || "",
            item.option4 || ""
          ];

      editingId = item.id;
      editingCollection = item.collectionName || MAIN_COLLECTION;
      editingImage = item.image || "";

      categoryEl.value = item.category || "general";
      difficultyEl.value = item.difficulty || "easy";
      updateDifficultyState();

      questionEl.value = item.question || "";
      option1El.value = options[0] || "";
      option2El.value = options[1] || "";
      option3El.value = options[2] || "";
      option4El.value = options[3] || "";
      answerEl.value = getAnswerKeyFromText(item.answer, options);

      if (imageEl) imageEl.value = "";

      saveBtn.innerText = "Update Question";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  });

  questionList.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const collectionName = button.dataset.collection;

      if (!confirm("ఈ question delete చేయాలా?")) return;

      try {
        await deleteDoc(doc(db, collectionName, id));
        await loadQuestions();
        alert("Deleted ✅");
      } catch (error) {
        console.error(error);
        alert("Delete failed: " + error.message);
      }
    });
  });
}

function searchQuestions() {
  const searchValue = normalizeText(searchEl.value).toLowerCase();

  if (!searchValue) {
    renderQuestions(allQuestions);
    return;
  }

  const filtered = allQuestions.filter(item => {
    const options = Array.isArray(item.options)
      ? item.options
      : [
          item.option1 || "",
          item.option2 || "",
          item.option3 || "",
          item.option4 || ""
        ];

    const searchableText = [
      item.category,
      item.difficulty,
      item.question,
      item.answer,
      ...options
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchValue);
  });

  renderQuestions(filtered);
}

categoryEl.addEventListener("change", updateDifficultyState);
saveBtn.addEventListener("click", saveQuestion);
clearBtn.addEventListener("click", clearForm);
searchEl.addEventListener("input", searchQuestions);

updateDifficultyState();
loadQuestions();