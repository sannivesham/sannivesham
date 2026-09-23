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
let isAllMode = false;
let allCategoriesList = [];
let allUnifiedItems = [];
let activeCatFilter = "all";

async function initPage() {
  try {
    if (categoryId === "all" || categorySlug === "all") {
      isAllMode = true;
    }

    // If we have slug but not categoryId, find category by slug
    if (!categoryId && categorySlug && !isAllMode) {
      const q = query(collection(db, "libraryCategories"), where("slug", "==", categorySlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        categoryId = snap.docs[0].id;
      }
    }

    if (!categoryId && !isAllMode) {
      titleEl.innerText = "విభాగం లభించలేదు";
      gridEl.innerHTML = `<p style="text-align:center;color:#ffd166;padding:40px;"><a href="index.html" class="reader-back-btn">← గ్రంథాలయ విభాగాలకు వెళ్ళండి</a></p>`;
      return;
    }

    // Load category info
    let currentCategory = null;
    if (isAllMode) {
      // Try to load custom all-library-category if saved in Firestore
      try {
        const catSnap = await getDoc(doc(db, "libraryCategories", "all-library-category"));
        if (catSnap.exists()) {
          currentCategory = catSnap.data();
        }
      } catch (e) {}

      titleEl.innerText = currentCategory?.title ? `${currentCategory.emoji || "🕉️"} ${currentCategory.title}` : "🕉️ సర్వ గ్రంథ సంపద (All Divine Content)";
      descEl.innerText = currentCategory?.description || "దివ్య గ్రంథాలయంలోని సమస్త స్తోత్రాలు, నామావళులు, సూక్తాలు, చాలీసాలు & పవిత్ర రచనలు";
      document.title = "సర్వ గ్రంథ సంపద - గ్రంథాలయం | సన్నివేశం";

      // In All mode: Load categories, subcategories, and content items
      const [catSnap, subSnap, conSnap] = await Promise.all([
        getDocs(collection(db, "libraryCategories")),
        getDocs(collection(db, "librarySubcategories")),
        getDocs(collection(db, "libraryContent"))
      ]);

      const catMap = {};
      allCategoriesList = [];
      catSnap.forEach(d => {
        const cData = { id: d.id, ...d.data() };
        if (cData.id !== "all-library-category" && cData.slug !== "all") {
          catMap[d.id] = cData;
          allCategoriesList.push(cData);
        }
      });
      allCategoriesList.sort((a, b) => (a.order || 0) - (b.order || 0));

      const subMap = {};
      const subsList = [];
      subSnap.forEach(d => {
        const sData = { id: d.id, ...d.data() };
        subMap[d.id] = sData;
        subsList.push(sData);
      });

      const contentsList = [];
      conSnap.forEach(d => contentsList.push({ id: d.id, ...d.data() }));

      // Build unified list of items across all sections
      const unifiedMap = new Map();

      // Add subcategories
      subsList.forEach(sub => {
        const parentCat = catMap[sub.categoryId] || { title: "ఇతర రచనలు", emoji: "📿" };
        const slug = sub.slug || slugify(sub.title) || sub.id;
        unifiedMap.set(`sub_${sub.id}`, {
          id: sub.id,
          title: sub.title,
          slug: slug,
          categoryId: sub.categoryId || "general",
          categoryTitle: parentCat.title,
          categoryEmoji: parentCat.emoji || "📿",
          hasAudio: Boolean(sub.audioUrl),
          order: sub.order ?? 0
        });
      });

      // Add content items (avoiding exact duplicate titles under the same subcategory)
      contentsList.forEach(con => {
        const parentSub = subMap[con.subcategoryId];
        const parentCat = parentSub ? catMap[parentSub.categoryId] : null;
        const catTitle = parentCat ? parentCat.title : (parentSub ? parentSub.title : "ఇతర రచనలు");
        const catEmoji = parentCat ? (parentCat.emoji || "📿") : "📖";
        const catId = parentCat ? parentCat.id : (parentSub ? parentSub.categoryId : "general");
        const slug = con.slug || slugify(con.title) || con.id;

        // If not already in unifiedMap under the same title
        let exists = false;
        for (const item of unifiedMap.values()) {
          if (item.title === con.title) {
            exists = true;
            if (con.audioUrl && !item.hasAudio) item.hasAudio = true;
            break;
          }
        }

        if (!exists) {
          unifiedMap.set(`con_${con.id}`, {
            id: con.id,
            title: con.title,
            slug: slug,
            categoryId: catId,
            categoryTitle: catTitle,
            categoryEmoji: catEmoji,
            hasAudio: Boolean(con.audioUrl),
            order: con.order ?? 0
          });
        }
      });

      allUnifiedItems = Array.from(unifiedMap.values());
      allUnifiedItems.sort((a, b) => a.title.localeCompare(b.title, "te"));

      renderAllView(allUnifiedItems, currentCategory);
      return;
    }

    // Standard Single Category View
    const catSnap = await getDoc(doc(db, "libraryCategories", categoryId));
    if (catSnap.exists()) {
      currentCategory = catSnap.data();
      titleEl.innerText = `${currentCategory.emoji ? currentCategory.emoji + " " : ""}${currentCategory.title}`;
      descEl.innerText = `${currentCategory.title} విభాగంలోని పవిత్ర రచనలు & స్తోత్రాలు`;
      document.title = `${currentCategory.title} - గ్రంథాలయం | సన్నివేశం`;
    }

    // Load subcategories for this category
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

function renderAllView(items, currentCat) {
  // Render Category Filter Tabs above grid if not already created
  let filterContainer = document.getElementById("libraryFilterTabs");
  if (!filterContainer) {
    filterContainer = document.createElement("div");
    filterContainer.id = "libraryFilterTabs";
    filterContainer.className = "library-filter-tabs";
    gridEl.parentNode.insertBefore(filterContainer, gridEl);
  }

  let filterHtml = `<button type="button" class="library-filter-pill ${activeCatFilter === 'all' ? 'active' : ''}" data-cat="all">✨ అన్నీ (All • ${items.length})</button>`;
  allCategoriesList.forEach(c => {
    const count = items.filter(it => it.categoryId === c.id).length;
    if (count > 0) {
      filterHtml += `<button type="button" class="library-filter-pill ${activeCatFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.emoji || "📿"} ${c.title} (${count})</button>`;
    }
  });
  filterContainer.innerHTML = filterHtml;

  // Filter clicks
  filterContainer.querySelectorAll(".library-filter-pill").forEach(btn => {
    btn.onclick = () => {
      activeCatFilter = btn.dataset.cat;
      filterContainer.querySelectorAll(".library-filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyAllFilters();
    };
  });

  applyAllFilters(currentCat);
}

function applyAllFilters(currentCat = null) {
  const queryText = searchInput ? searchInput.value.trim().toLowerCase() : "";
  let filtered = allUnifiedItems;

  if (activeCatFilter !== "all") {
    filtered = filtered.filter(item => item.categoryId === activeCatFilter);
  }

  if (queryText) {
    filtered = filtered.filter(item => 
      (item.title && item.title.toLowerCase().includes(queryText)) ||
      (item.categoryTitle && item.categoryTitle.toLowerCase().includes(queryText)) ||
      (item.slug && item.slug.toLowerCase().includes(queryText))
    );
  }

  if (!filtered.length) {
    gridEl.innerHTML = `<p style="text-align:center;grid-column:1/-1;color:#ffd166;padding:40px;">ఎటువంటి స్తోత్రాలు లేదా రచనలు లభించలేదు.</p>`;
    return;
  }

  let html = "";
  if (currentCat && (currentCat.text || currentCat.audioUrl) && activeCatFilter === "all" && !queryText) {
    html += `
      <div style="grid-column:1/-1;background:rgba(255,209,102,0.08);border:1px solid #ffd166;border-radius:14px;padding:16px 20px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;width:100%;">
        <div style="flex:1;min-width:240px;">
          <h3 style="color:#ffd166;margin:0 0 6px;font-size:1.1rem;">📖 ${currentCat.title} సాహిత్యం / శ్లోకాలు</h3>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:0.9rem;line-height:1.4;">${currentCat.text ? currentCat.text.slice(0, 140) + (currentCat.text.length > 140 ? '...' : '') : 'సంపూర్ణ సాహిత్యం మరియు ఆడియో అందుబాటులో ఉంది.'}</p>
        </div>
        <a href="read.html?slug=all" class="reader-back-btn" style="background:#ffd166;color:#120703;font-weight:700;padding:10px 20px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
          ${currentCat.audioUrl ? '🎵 ఆడియోతో పాటు చదవండి' : '📖 చదవండి'}
        </a>
      </div>
    `;
  }

  filtered.forEach((item) => {
    const readUrl = `read.html?slug=${encodeURIComponent(item.slug)}`;
    html += `
      <a href="${readUrl}" class="all-item-card">
        <div class="all-item-cat-tag">
          ${item.categoryEmoji || "📿"} ${item.categoryTitle || "సాహిత్యం"}
        </div>
        <div class="all-item-title">
          <span>${item.title}</span>
          ${item.hasAudio ? `<span class="all-item-badge-audio" title="ఆడియో ఉంది">🎵</span>` : ''}
        </div>
      </a>
    `;
  });

  gridEl.innerHTML = html;
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
    const readUrl = `read.html?slug=${encodeURIComponent(slug)}`;

    html += `
      <a href="${readUrl}" class="subcategory-card">
        <span>📿</span>
        <span>${sub.title}</span>
        ${sub.audioUrl ? `<span style="font-size:0.85rem;color:#ffd166;margin-left:auto;">🎵</span>` : ''}
      </a>
    `;
  });

  gridEl.innerHTML = html;
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    if (isAllMode) {
      applyAllFilters();
      return;
    }
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
