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
    const catSnap = await getDoc(doc(db, "libraryCategories", categoryId));
    if (catSnap.exists()) {
      const cat = catSnap.data();
      titleEl.innerText = `${cat.emoji ? cat.emoji + " " : ""}${cat.title}`;
      descEl.innerText = `${cat.title} విభాగంలోని పవిత్ర రచనలు & స్తోత్రాలు`;
      document.title = `${cat.title} - గ్రంథాలయం | సన్నివేశం`;
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

    renderSubcategories(allSubcategories);
  } catch (err) {
    console.error("Subcategories load error:", err);
    gridEl.innerHTML = `<p style="text-align:center;color:#ff9999;padding:40px;">లోడ్ చేయడంలో సమస్య ఏర్పడింది.</p>`;
  }
}

function renderSubcategories(list) {
  if (!list.length) {
    gridEl.innerHTML = `<p style="text-align:center;color:#ffd166;padding:40px;">ఇంకా ఎటువంటి స్తోత్రాలు లేదా రచనలు చేర్చబడలేదు.</p>`;
    return;
  }

  let html = "";
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
