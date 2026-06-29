import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const categoryId = params.get("category");

const chapterTitle = document.getElementById("chapterTitle");
const slokasList = document.getElementById("slokasList");

function getSlokaNumber(value) {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 9999 : n;
}

async function loadSlokas() {
  if (!categoryId) {
    chapterTitle.innerText = "Category Not Found";
    return;
  }

  const categorySnap = await getDoc(
    doc(db, "slokaCategories", categoryId)
  );

  if (categorySnap.exists()) {
    chapterTitle.innerText = categorySnap.data().title;
  }

  const chaptersSnapshot = await getDocs(
    collection(db, "slokaChapters")
  );

  const chapterIds = [];

  chaptersSnapshot.forEach((chapterDoc) => {
    const chapter = chapterDoc.data();

    if (chapter.categoryId === categoryId) {
      chapterIds.push(chapterDoc.id);
    }
  });

  const slokasSnapshot = await getDocs(
    collection(db, "slokas")
  );

  const docs = slokasSnapshot.docs
    .filter((docItem) => {
      const sloka = docItem.data();
      return chapterIds.includes(sloka.chapterId);
    })
    .sort((a, b) => {
      return getSlokaNumber(a.data().number) -
             getSlokaNumber(b.data().number);
    });

  slokasList.innerHTML = "";

  if (docs.length === 0) {
    slokasList.innerHTML =
      `<p class="empty-message">ఇంకా శ్లోకాలు జోడించలేదు.</p>`;
    return;
  }

  docs.forEach((docItem) => {
    const data = docItem.data();

    slokasList.innerHTML += `
      <div class="gita-sloka-card">

        <h2>${data.number || ""}</h2>

        <p class="sloka-text">
          ${(data.sloka || "").replace(/\n/g, "<br>")}
        </p>

        <h3>తెలుగు అర్థం</h3>

        <p class="meaning-text">
          ${(data.telugu || "").replace(/\n/g, "<br>")}
        </p>

        <button class="speak-btn" onclick="toggleSpeech(this)">
          ▶️ వినండి
        </button>

      </div>
    `;
  });
}

loadSlokas();

window.toggleSpeech = function(button) {
  window.speechSynthesis.cancel();

  const card = button.closest(".gita-sloka-card");

  const sloka = card.querySelector(".sloka-text").innerText;
  const meaning = card.querySelector(".meaning-text").innerText;

  const text =
    sloka.replace(/\n/g, ". ") +
    ". తెలుగు అర్థం. " +
    meaning.replace(/\n/g, ". ");

  const speech = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

  speech.voice =
    voices.find(v => v.lang === "hi-IN") ||
    voices.find(v => v.lang === "te-IN") ||
    voices[0];

  speech.rate = 0.7;
  speech.pitch = 1;

  button.innerHTML = "⏹ ఆపండి";

  speech.onend = () => {
    button.innerHTML = "▶️ వినండి";
  };

  speech.onerror = (e) => {
    console.log("Speech error:", e);
    button.innerHTML = "▶️ వినండి";
  };

  window.speechSynthesis.speak(speech);
};