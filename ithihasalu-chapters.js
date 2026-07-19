import { db, auth } from "./firebase-config.js";
import {
  collection, getDocs, doc, getDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const catId = params.get("cat");

const catTitle = document.getElementById("catTitle");
const chapterList = document.getElementById("chapterList");
const continueBanner = document.getElementById("continueBanner");

const LOCAL_PROGRESS_KEY = "sannivesham_ithihasalu_progress";

function getLocalProgress() {
  try { return JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || "{}"); }
  catch (e) { return {}; }
}

async function loadChapters() {
  if (!catId) { catTitle.innerText = "Not Found"; return; }

  const catSnap = await getDoc(doc(db, "ithihasaluCategories", catId));
  if (catSnap.exists()) catTitle.innerText = catSnap.data().title;

  const q = query(collection(db, "ithihasaluSubCategories"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  chapterList.innerHTML = "";
  const items = [];
  snap.forEach(d => { if (d.data().categoryId === catId) items.push({ id: d.id, ...d.data() }); });

  if (items.length === 0) {
    chapterList.innerHTML = "<p style='color:rgba(255,255,255,0.6);text-align:center'>ఇంకా అధ్యాయాలు జోడించలేదు</p>";
    return;
  }

  // Check local progress for continue banner
  const progress = getLocalProgress();
  const catProgress = progress[catId];
  if (catProgress && catProgress.subId && catProgress.shlokaId) {
    continueBanner.style.display = "block";
    continueBanner.innerHTML = `
      <div class="continue-banner">
        <p>▶ మీరు చివరిసారి చదివిన చోటు నుండి కొనసాగించండి</p>
        <a href="ithihasalu-detail.html?shloka=${catProgress.shlokaId}&sub=${catProgress.subId}&cat=${catId}"
           class="continue-btn">కొనసాగించు</a>
      </div>
    `;
  }

  items.forEach(item => {
    chapterList.innerHTML += `
      <a href="ithihasalu-list.html?sub=${item.id}&cat=${catId}" class="chapter-card">
        <div class="chapter-card-left">
          <h3>${item.title}</h3>
          <p>${item.shlokaCount ? item.shlokaCount + " శ్లోకాలు" : ""}</p>
        </div>
        <span class="chapter-card-arrow">›</span>
      </a>
    `;
  });
}

loadChapters();

// Also load from Firestore if logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const fp = data.ithihasaluProgress?.[catId];
    if (fp && fp.subId && fp.shlokaId) {
      continueBanner.style.display = "block";
      continueBanner.innerHTML = `
        <div class="continue-banner">
          <p>▶ మీరు చివరిసారి చదివిన చోటు నుండి కొనసాగించండి</p>
          <a href="ithihasalu-detail.html?shloka=${fp.shlokaId}&sub=${fp.subId}&cat=${catId}"
             class="continue-btn">కొనసాగించు</a>
        </div>
      `;
    }
  } catch (e) {}
});
