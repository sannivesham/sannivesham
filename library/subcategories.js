import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { SacredReader, slugify } from "./reader.js";

const params = new URLSearchParams(window.location.search);
let categoryId = params.get("category") || "";
const categorySlug = params.get("slug") || "";

const titleEl = document.getElementById("subCategoryPageTitle");
const descEl = document.getElementById("subCategoryPageDesc");
const gridEl = document.getElementById("subcategoryGrid");
const searchInput = document.getElementById("subcategorySearchInput");
let allSubcategories = [];

async function initPage() {
  try {
    // If we have slug but not categoryId, find category by slug
    if (!categoryId && categorySlug) {
      const q = query(collection(db, "libraryCategories"), where("slug", "==", categorySlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        categoryId = snap.docs[0].id;
      }
    }

    if (!categoryId) {
      titleEl.innerText = "విభాగం లభించలేదు";
      gridEl.innerHTML = `<p style="text-align:center;color:#ffd166;padding:40px;"><a href="index.html" class="reader-back-btn">← గ్రంథాలయ విభాగాలకు వెళ్ళండి</a></p>`;
      return;
    }

    // Load category info
    let currentCategory = null;
    const catSnap = await getDoc(doc(db, "libraryCategories", categoryId));
    if (catSnap.exists()) {
      currentCategory = catSnap.data();
      titleEl.innerText = `${currentCategory.emoji ? currentCategory.emoji + " " : ""}${currentCategory.title}`;
      descEl.innerText = `${currentCategory.title} విభాగంలోని పవిత్ర రచనలు & స్తోత్రాలు`;
      document.title = `${currentCategory.title} - గ్రంథాలయం | సన్నివేశం`;
    }

    // Load subcategories
    const snapshot = await getDocs(collection(db, "librarySubcategories"));
    allSubcategories = [];
    snapshot.forEach((docItem) => {
      const data = docItem.data();
      if (data.categoryId === categoryId) {
        allSubcategories.push({ id: docItem.id, ...data });
      }
    });

    allSubcategories.sort((a, b) => {
      const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
      const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
      return aOrder - bOrder;
    });

    renderSubcategories(allSubcategories, currentCategory);
  } catch (err) {
    console.error("Subcategories load error:", err);
    gridEl.innerHTML = `<p style="text-align:center;color:#ff9999;padding:40px;">లోడ్ చేయడంలో సమస్య ఏర్పడింది.</p>`;
  }
}

function renderSubcategories(list, currentCat) {
  if (!list.length && (!currentCat || !currentCat.text)) {
    gridEl.innerHTML = `<p style="text-align:center;color:#ffd166;padding:40px;">ఇంకా ఎటువంటి స్తోత్రాలు లేదా రచనలు చేర్చబడలేదు.</p>`;
    return;
  }

  let html = "";
  if (currentCat && (currentCat.text || currentCat.audioUrl)) {
    const catSlug = currentCat.slug || slugify(currentCat.title) || categoryId;
    html += `
      <div style="grid-column:1/-1;background:rgba(255,209,102,0.08);border:1px solid #ffd166;border-radius:14px;padding:16px 20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
        <div style="flex:1;min-width:240px;">
          <h3 style="color:#ffd166;margin:0 0 6px;font-size:1.1rem;">📖 ${currentCat.title} సాహిత్యం / శ్లోకాలు</h3>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:0.9rem;line-height:1.4;">${currentCat.text ? currentCat.text.slice(0, 140) + (currentCat.text.length > 140 ? '...' : '') : 'సంపూర్ణ సాహిత్యం మరియు ఆడియో అందుబాటులో ఉంది.'}</p>
        </div>
        <a href="read.html?slug=${encodeURIComponent(catSlug)}" class="reader-back-btn" style="background:#ffd166;color:#120703;font-weight:700;padding:10px 20px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
          ${currentCat.audioUrl ? '🎵 ఆడియోతో పాటు చదవండి' : '📖 చదవండి'}
        </a>
      </div>
    `;
  }

  list.forEach((sub) => {
    const slug = sub.slug || slugify(sub.title) || sub.id;
    // Direct link to read.html with slug parameter
    const readUrl = `read.html?slug=${encodeURIComponent(slug)}`;

    html += `
      <a href="${readUrl}" class="subcategory-card">
        <span>📿</span>
        <span>${sub.title}</span>
      </a>
    `;
  });

  gridEl.innerHTML = html;
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const queryText = e.target.value.trim().toLowerCase();
    if (!queryText) {
      renderSubcategories(allSubcategories);
      return;
    }
    const filtered = allSubcategories.filter(sub => 
      (sub.title && sub.title.toLowerCase().includes(queryText)) ||
      (sub.slug && sub.slug.toLowerCase().includes(queryText))
    );
    renderSubcategories(filtered);
  });
}

initPage();
