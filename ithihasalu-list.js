import { db } from "./firebase-config.js";
import {
  collection, getDocs, doc, getDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const subId = params.get("sub");
const catId = params.get("cat");

const subTitle = document.getElementById("subTitle");
const shlokaList = document.getElementById("shlokaList");
const backLink = document.getElementById("backLink");

if (catId) backLink.href = `ithihasalu-chapters.html?cat=${catId}`;

async function loadShlokas() {
  if (!subId) { subTitle.innerText = "Not Found"; return; }

  const subSnap = await getDoc(doc(db, "ithihasaluSubCategories", subId));
  if (subSnap.exists()) subTitle.innerText = subSnap.data().title;

  const q = query(collection(db, "ithihasaluShlokas"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  shlokaList.innerHTML = "";
  const items = [];
  snap.forEach(d => { if (d.data().subCategoryId === subId) items.push({ id: d.id, ...d.data() }); });

  if (items.length === 0) {
    shlokaList.innerHTML = "<p style='color:rgba(255,255,255,0.6);text-align:center'>ఇంకా శ్లోకాలు జోడించలేదు</p>";
    return;
  }

  items.forEach(item => {
    shlokaList.innerHTML += `
      <a href="ithihasalu-detail.html?shloka=${item.id}&sub=${subId}&cat=${catId || ""}"
         class="shloka-index-card">
        <span class="shloka-number-badge">${item.number || "—"}</span>
        <span class="shloka-preview">${item.shloka || ""}</span>
        <span class="shloka-arrow">›</span>
      </a>
    `;
  });
}

loadShlokas();
