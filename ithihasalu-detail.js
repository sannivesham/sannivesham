import { db, auth } from "./firebase-config.js";
import {
  collection, getDocs, doc, getDoc, setDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const shlokaId = params.get("shloka");
const subId = params.get("sub");
const catId = params.get("cat");

const shlokaCard = document.getElementById("shlokaCard");
const navRow = document.getElementById("navRow");
const backToList = document.getElementById("backToList");

if (subId && catId) backToList.href = `ithihasalu-list.html?sub=${subId}&cat=${catId}`;

const LOCAL_PROGRESS_KEY = "sannivesham_ithihasalu_progress";

function saveProgressLocal() {
  try {
    const p = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || "{}");
    if (catId) {
      p[catId] = { subId, shlokaId };
    }
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(p));
  } catch (e) {}
}

async function saveProgressFirestore(user) {
  if (!user || !catId) return;
  try {
    await setDoc(doc(db, "users", user.uid), {
      ithihasaluProgress: {
        [catId]: { subId, shlokaId }
      }
    }, { merge: true });
  } catch (e) {}
}

let allShlokas = [];

async function loadShloka() {
  if (!shlokaId || !subId) {
    shlokaCard.innerHTML = "<p style='color:white;text-align:center'>శ్లోకం కనుగొనబడలేదు</p>";
    return;
  }

  const snap = await getDoc(doc(db, "ithihasaluShlokas", shlokaId));
  if (!snap.exists()) {
    shlokaCard.innerHTML = "<p style='color:white;text-align:center'>శ్లోకం కనుగొనబడలేదు</p>";
    return;
  }

  const data = snap.data();

  const audioHtml = data.audioUrl
    ? `<div class="shloka-audio-box">
         <a href="${data.audioUrl}" target="_blank" class="shloka-audio-btn">
           🎵 ఆడియో వినండి
         </a>
       </div>`
    : "";

  shlokaCard.innerHTML = `
    <div class="shloka-number-label">శ్లోకం ${data.number || ""}</div>
    <div class="shloka-text-main">${(data.shloka || "").replace(/\n/g, "\n")}</div>
    <div class="shloka-explanation-label">వివరణ</div>
    <div class="shloka-explanation-text">${(data.explanation || "").replace(/\n/g, "\n")}</div>
    ${audioHtml}
  `;

  // Save progress
  saveProgressLocal();
  onAuthStateChanged(auth, (user) => { saveProgressFirestore(user); });

  // Load all shlokas for nav
  const q = query(collection(db, "ithihasaluShlokas"), orderBy("order", "asc"));
  const allSnap = await getDocs(q);
  allShlokas = [];
  allSnap.forEach(d => { if (d.data().subCategoryId === subId) allShlokas.push({ id: d.id, ...d.data() }); });

  const currentIndex = allShlokas.findIndex(s => s.id === shlokaId);
  const prev = currentIndex > 0 ? allShlokas[currentIndex - 1] : null;
  const next = currentIndex < allShlokas.length - 1 ? allShlokas[currentIndex + 1] : null;

  navRow.innerHTML = `
    ${prev
      ? `<a href="ithihasalu-detail.html?shloka=${prev.id}&sub=${subId}&cat=${catId || ""}" class="shloka-nav-btn">← ${prev.number || "Previous"}</a>`
      : `<span class="shloka-nav-btn disabled">← మొదటి శ్లోకం</span>`
    }
    <a href="ithihasalu-list.html?sub=${subId}&cat=${catId || ""}" class="shloka-nav-btn" style="text-align:center;">≡ జాబితా</a>
    ${next
      ? `<a href="ithihasalu-detail.html?shloka=${next.id}&sub=${subId}&cat=${catId || ""}" class="shloka-nav-btn" style="text-align:right;">→ ${next.number || "Next"}</a>`
      : `<span class="shloka-nav-btn disabled" style="text-align:right;">చివరి శ్లోకం →</span>`
    }
  `;
}

loadShloka();
