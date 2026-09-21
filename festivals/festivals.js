import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { slugify } from "../library/reader.js";
import { EKADASHI_LIST } from "./ekadashi-data.js";

// DOM Elements
const festivalsGrid = document.querySelector(".festivals-grid");
const tabMainFestivals = document.getElementById("tabMainFestivals");
const tabEkadashi = document.getElementById("tabEkadashi");
const mainFestivalsView = document.getElementById("mainFestivalsView");
const ekadashiSectionView = document.getElementById("ekadashiSectionView");
const ekadashiGrid = document.getElementById("ekadashiGrid");
const ekadashiEmptyState = document.getElementById("ekadashiEmptyState");
const ekadashiSearchInput = document.getElementById("ekadashiSearchInput");
const ekadashiClearSearch = document.getElementById("ekadashiClearSearch");
const ekadashiMonthFilter = document.getElementById("ekadashiMonthFilter");
const ekadashiPills = document.querySelectorAll(".ekadashi-pill");
const resetEkadashiFilterBtn = document.getElementById("resetEkadashiFilterBtn");

// Modal Reader Elements
const readerModal = document.getElementById("ekadashiReaderModal");
const readerDialog = document.getElementById("ekadashiReaderDialog");
const readerBackdrop = document.getElementById("ekadashiReaderBackdrop");
const readerBody = document.getElementById("ekadashiModalBody");
const closeReaderBtn = document.getElementById("closeEkadashiReaderBtn");
const fontMinusBtn = document.getElementById("ekadashiFontMinusBtn");
const fontPlusBtn = document.getElementById("ekadashiFontPlusBtn");
const fontSizeDisplay = document.getElementById("ekadashiFontSizeDisplay");
const themeBtn = document.getElementById("ekadashiThemeBtn");
const copyBtn = document.getElementById("ekadashiCopyBtn");
const shareBtn = document.getElementById("ekadashiShareBtn");

// State
let allEkadashis = [...EKADASHI_LIST];
let activeFilter = "all";
let activeMonth = "";
let activeSearchQuery = "";
let currentEkadashi = null;
let currentFontSize = 20;
let currentThemeIndex = 0;
const readerThemes = ["theme-night", "theme-sepia"];

/* ══════════════════════════════════════
   1. LOAD MAIN FESTIVALS
══════════════════════════════════════ */
async function loadFestivals() {
  try {
    const q = query(
      collection(db, "festivals"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    festivalsGrid.innerHTML = "";

    // Prominent Featured Entry Card for Ekadashis
    const featuredEkadashiCard = document.createElement("div");
    featuredEkadashiCard.className = "festival-card featured-ekadashi-card";
    featuredEkadashiCard.style.cursor = "pointer";
    featuredEkadashiCard.innerHTML = `
      <span class="featured-badge">🪷 26 వ్రతాలు</span>
      <img src="https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=700&auto=format&fit=crop&q=80" alt="ఏకాదశి వ్రతాలు">
      <div class="festival-overlay"></div>
      <div class="festival-name" style="background:rgba(26,14,6,0.85);color:#ffd166;">
        🪷 ఏకాదశి వ్రతాలు
      </div>
    `;
    featuredEkadashiCard.addEventListener("click", () => {
      switchCategoryTab("ekadashi");
      window.scrollTo({ top: 350, behavior: "smooth" });
    });
    festivalsGrid.appendChild(featuredEkadashiCard);

    snapshot.forEach((docItem) => {
      const festival = docItem.data();
      const slug = festival.slug || slugify(festival.title) || docItem.id;

      const card = document.createElement("a");
      card.href = `festival-detail.html?slug=${encodeURIComponent(slug)}`;
      card.className = "festival-card";
      card.innerHTML = `
        <img src="${festival.cardImage || 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=700&auto=format&fit=crop&q=80'}" alt="${festival.title}">
        <div class="festival-overlay"></div>
        <div class="festival-name">${festival.title}</div>
      `;
      festivalsGrid.appendChild(card);
    });
  } catch (err) {
    console.warn("Could not load Firestore festivals, fallback initialized:", err);
  }
}

/* ══════════════════════════════════════
   2. LOAD EKADASHIS (FIRESTORE SYNC & DATASET)
══════════════════════════════════════ */
async function loadEkadashis() {
  try {
    const snap = await getDocs(collection(db, "ekadashis"));
    if (!snap.empty) {
      const firestoreItems = [];
      snap.forEach(docSnap => {
        firestoreItems.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Merge Firestore entries with dataset (overriding matched slugs or appending)
      const mergedMap = new Map();
      EKADASHI_LIST.forEach(item => mergedMap.set(item.slug, item));
      firestoreItems.forEach(item => {
        const slug = item.slug || item.id;
        mergedMap.set(slug, { ...(mergedMap.get(slug) || {}), ...item });
      });
      allEkadashis = Array.from(mergedMap.values());
    }
  } catch (err) {
    console.info("Using built-in canonical Ekadashi dataset:", err.message);
  }

  renderEkadashis();
}

/* ══════════════════════════════════════
   3. RENDER EKADASHI GRID WITH FILTERS
══════════════════════════════════════ */
function renderEkadashis() {
  const queryText = activeSearchQuery.toLowerCase().trim();

  const filtered = allEkadashis.filter((item) => {
    // Filter pill check
    if (activeFilter === "major" && !item.isMajor) return false;
    if (activeFilter === "shukla" && !item.paksham.includes("శుక్ల")) return false;
    if (activeFilter === "krishna" && !item.paksham.includes("కృష్ణ")) return false;

    // Month filter check
    if (activeMonth && !item.masam.includes(activeMonth)) return false;

    // Search query check
    if (queryText) {
      const titleMatch = (item.title || "").toLowerCase().includes(queryText);
      const enMatch = (item.titleEn || "").toLowerCase().includes(queryText);
      const masamMatch = (item.masam || "").toLowerCase().includes(queryText);
      const pakshamMatch = (item.paksham || "").toLowerCase().includes(queryText);
      const deityMatch = (item.deity || "").toLowerCase().includes(queryText);
      const summaryMatch = (item.summary || "").toLowerCase().includes(queryText);
      if (!titleMatch && !enMatch && !masamMatch && !pakshamMatch && !deityMatch && !summaryMatch) {
        return false;
      }
    }

    return true;
  });

  ekadashiGrid.innerHTML = "";

  if (filtered.length === 0) {
    ekadashiEmptyState.style.display = "block";
    return;
  }

  ekadashiEmptyState.style.display = "none";

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "ekadashi-card-item";
    card.setAttribute("data-slug", item.slug);

    const isShukla = item.paksham.includes("శుక్ల");
    const pakshaBadgeClass = isShukla ? "paksha-shukla" : "paksha-krishna";
    const pakshaLabel = isShukla ? "🌕 శుక్ల పక్షం" : "🌑 కృష్ణ పక్షం";

    card.innerHTML = `
      <div class="ekadashi-card-image-wrap">
        <img src="${item.cardImage || 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=700&auto=format&fit=crop&q=80'}" alt="${item.title}" loading="lazy">
        <div class="ekadashi-card-overlay"></div>
        <span class="ekadashi-card-paksha-badge ${pakshaBadgeClass}">${pakshaLabel}</span>
        ${item.isMajor ? `<span class="ekadashi-card-major-badge">⭐ ముఖ్యమైనది</span>` : ""}
        <span class="ekadashi-card-month-tag">${item.masam}</span>
      </div>
      <div class="ekadashi-card-body">
        <h3 class="ekadashi-card-title">${item.title}</h3>
        <div class="ekadashi-card-subtitle">${item.titleEn || ""}</div>
        <div class="ekadashi-card-deity">
          <span>🙏</span> ${item.deity || "శ్రీ మహావిష్ణువు"}
        </div>
        <p class="ekadashi-card-summary">${item.summary || ""}</p>
        <div class="ekadashi-card-cta">
          <span>వివరాలు చదవండి</span>
          <span class="arrow">→</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      openEkadashiReader(item);
    });

    ekadashiGrid.appendChild(card);
  });
}

/* ══════════════════════════════════════
   4. CATEGORY TAB SWITCHING
══════════════════════════════════════ */
function switchCategoryTab(targetTab) {
  if (targetTab === "ekadashi") {
    tabMainFestivals.classList.remove("active");
    tabEkadashi.classList.add("active");
    mainFestivalsView.style.display = "none";
    ekadashiSectionView.style.display = "block";
    updateUrlParam("category", "ekadashi");
  } else {
    tabEkadashi.classList.remove("active");
    tabMainFestivals.classList.add("active");
    ekadashiSectionView.style.display = "none";
    mainFestivalsView.style.display = "block";
    updateUrlParam("category", null);
  }
}

tabMainFestivals?.addEventListener("click", () => switchCategoryTab("festivals"));
tabEkadashi?.addEventListener("click", () => switchCategoryTab("ekadashi"));

/* ══════════════════════════════════════
   5. SEARCH & FILTER EVENT LISTENERS
══════════════════════════════════════ */
ekadashiSearchInput?.addEventListener("input", (e) => {
  activeSearchQuery = e.target.value;
  ekadashiClearSearch.style.display = activeSearchQuery ? "flex" : "none";
  renderEkadashis();
});

ekadashiClearSearch?.addEventListener("click", () => {
  ekadashiSearchInput.value = "";
  activeSearchQuery = "";
  ekadashiClearSearch.style.display = "none";
  renderEkadashis();
  ekadashiSearchInput.focus();
});

ekadashiPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    ekadashiPills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter;
    renderEkadashis();
  });
});

ekadashiMonthFilter?.addEventListener("change", (e) => {
  activeMonth = e.target.value;
  renderEkadashis();
});

resetEkadashiFilterBtn?.addEventListener("click", () => {
  activeSearchQuery = "";
  if (ekadashiSearchInput) ekadashiSearchInput.value = "";
  if (ekadashiClearSearch) ekadashiClearSearch.style.display = "none";
  activeFilter = "all";
  ekadashiPills.forEach((p) => p.classList.toggle("active", p.dataset.filter === "all"));
  activeMonth = "";
  if (ekadashiMonthFilter) ekadashiMonthFilter.value = "";
  renderEkadashis();
});

/* ══════════════════════════════════════
   6. SACRED READER MODAL IMPLEMENTATION
══════════════════════════════════════ */
function openEkadashiReader(ekadashi) {
  if (!ekadashi) return;
  currentEkadashi = ekadashi;

  const isShukla = ekadashi.paksham.includes("శుక్ల");
  const pakshaPill = isShukla ? "🌕 శుక్ల పక్షం" : "🌑 కృష్ణ పక్షం";

  readerBody.innerHTML = `
    <header class="reader-detail-header">
      <span class="reader-detail-om">ॐ</span>
      <h1 class="reader-detail-h1">${ekadashi.title}</h1>
      <div class="reader-detail-en">${ekadashi.titleEn || ""}</div>
      
      <div class="reader-meta-chips">
        <span class="meta-pill">📅 ${ekadashi.masam}</span>
        <span class="meta-pill">${pakshaPill}</span>
        <span class="meta-pill">🪷 ${ekadashi.tithi || "ఏకాదశి"}</span>
        <span class="meta-pill">🙏 ${ekadashi.deity || "శ్రీ మహావిష్ణువు"}</span>
      </div>

      ${
        ekadashi.cardImage
          ? `<img src="${ekadashi.cardImage}" class="reader-hero-image" alt="${ekadashi.title}">`
          : ""
      }
    </header>

    <section class="reader-detail-section">
      <h2 class="reader-detail-h2">📖 పవిత్ర పురాణ గాథ & విశిష్టత</h2>
      <div class="reader-detail-p">${ekadashi.story}</div>
    </section>

    <section class="reader-detail-section">
      <h2 class="reader-detail-h2">🪔 ఉపవాస, జాగరణ & పూజా విధానం</h2>
      <div class="reader-detail-p">${ekadashi.vidhanam}</div>
    </section>

    <div class="reader-phalam-card">
      <h3>✨ వ్రత ఫలం & మోక్ష విశేషం</h3>
      <div class="reader-detail-p" style="margin:0;">${ekadashi.phalam}</div>
    </div>

    <div class="reader-detail-ornament">
      ✦ ఓం నమో నారాయణాయ • మంగళం దివ్య మంగళం ✦
    </div>
  `;

  // Apply current typography
  applyFontSize(currentFontSize);

  // Open modal
  readerModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // URL sync
  updateUrlParam("ekadashi", ekadashi.slug);
}

function closeEkadashiReader() {
  readerModal.style.display = "none";
  document.body.style.overflow = "";
  currentEkadashi = null;
  updateUrlParam("ekadashi", null);
}

closeReaderBtn?.addEventListener("click", closeEkadashiReader);
readerBackdrop?.addEventListener("click", closeEkadashiReader);

// Escape key to close modal
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && readerModal.style.display === "flex") {
    closeEkadashiReader();
  }
});

/* Reader Actions */
function applyFontSize(size) {
  currentFontSize = Math.min(Math.max(size, 16), 30);
  readerBody.style.fontSize = `${currentFontSize}px`;
  fontSizeDisplay.innerText = `${currentFontSize}px`;
}

fontMinusBtn?.addEventListener("click", () => applyFontSize(currentFontSize - 2));
fontPlusBtn?.addEventListener("click", () => applyFontSize(currentFontSize + 2));

themeBtn?.addEventListener("click", () => {
  currentThemeIndex = (currentThemeIndex + 1) % readerThemes.length;
  readerDialog.classList.remove("theme-night", "theme-sepia");
  readerDialog.classList.add(readerThemes[currentThemeIndex]);
});

copyBtn?.addEventListener("click", async () => {
  if (!currentEkadashi) return;
  const textToCopy = `${currentEkadashi.title} (${currentEkadashi.masam} - ${currentEkadashi.paksham})\n\nఅధిష్టాన దైవం: ${currentEkadashi.deity}\n\nవిశిష్టత:\n${currentEkadashi.summary}\n\nపురాణ గాథ:\n${currentEkadashi.story}\n\nపూజా విధానం:\n${currentEkadashi.vidhanam}\n\nవ్రత ఫలితం:\n${currentEkadashi.phalam}\n\nసన్నివేశం - https://sannivesham.com/festivals/?category=ekadashi&ekadashi=${currentEkadashi.slug}`;
  try {
    await navigator.clipboard.writeText(textToCopy);
    const originalText = copyBtn.innerText;
    copyBtn.innerText = "✓ కాపీ అయింది";
    setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
  } catch (err) {
    alert("కాపీ చేయడంలో సమస్య ఏర్పడింది.");
  }
});

shareBtn?.addEventListener("click", () => {
  if (!currentEkadashi) return;
  const shareText = `*${currentEkadashi.title}* (${currentEkadashi.masam} - ${currentEkadashi.paksham})\n\n✨ ${currentEkadashi.summary}\n\nపూర్తి పూజా విధానం, పురాణ గాథ మరియు విశేషాలు చదవండి:\nhttps://sannivesham.com/festivals/?category=ekadashi&ekadashi=${currentEkadashi.slug}`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(waUrl, "_blank");
});

/* ══════════════════════════════════════
   7. URL & ROUTING MANAGEMENT
══════════════════════════════════════ */
function updateUrlParam(key, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", url);
}

function handleInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  const ekadashiSlug = params.get("ekadashi") || window.location.hash.replace("#ekadashi-", "");

  if (cat === "ekadashi" || ekadashiSlug) {
    switchCategoryTab("ekadashi");
  }

  if (ekadashiSlug) {
    const found = allEkadashis.find(
      (e) => e.slug.toLowerCase() === ekadashiSlug.toLowerCase() || e.id.toLowerCase() === ekadashiSlug.toLowerCase()
    );
    if (found) {
      setTimeout(() => openEkadashiReader(found), 250);
    }
  }
}

// Phone back button listener for reader modal
window.addEventListener("popstate", () => {
  if (readerModal.style.display === "flex") {
    closeEkadashiReader();
  }
});

/* ══════════════════════════════════════
   8. INITIALIZATION
══════════════════════════════════════ */
// 1. Immediately render Ekadashis synchronously from memory so there is zero latency
renderEkadashis();
handleInitialRoute();

// 2. Load Firestore festivals & any custom overrides in background
loadFestivals();
loadEkadashis();