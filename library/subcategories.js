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
let allSubcategories = [];
let activeCatFilter = "all";
let currentCategory = null;


const DEITY_IMAGES = {
  ganesha: "https://res.cloudinary.com/du5em76za/image/upload/v1784085346/bb4gi6iomegl5n2oxsfi.png",
  shiva: "https://res.cloudinary.com/du5em76za/image/upload/v1784095160/gjhwblwy0htrarocmvfa.png",
  vishnu: "https://res.cloudinary.com/du5em76za/image/upload/v1784085417/bpjze4zvpnrdsnfh43lw.png",
  venkateswara: "../images/tirumala.jpg",
  hanuman: "https://res.cloudinary.com/du5em76za/image/upload/v1784085527/lvtbrrjzu0hpc8zln10a.png",
  narasimha: "https://res.cloudinary.com/du5em76za/image/upload/v1784085578/dlwo5piw8s21nkhu8agf.png",
  devi: "../images/devi.png",
  suktam: "https://res.cloudinary.com/du5em76za/image/upload/v1784085776/y5cz11hvy2rxdxy7onfe.png",
  gita: "../images/gita.png",
  default: "https://res.cloudinary.com/du5em76za/image/upload/v1784085723/jfzdyhiuku0afwhaatgr.png"
};

function resolveItemImage(title = "", categoryTitle = "", fallbackCatImage = "") {
  const combined = (title + " " + categoryTitle).toLowerCase();
  
  if (/వినాయక|గణేశ|గణపతి|సంకట|మోదక|లంబోదర|ganesh/i.test(combined)) return DEITY_IMAGES.ganesha;
  if (/శివ|రుద్ర|లింగ|బిల్వ|చంద్రశేఖర|నటరాజ|దక్షిణామూర్తి|కాలభైరవ|shiva/i.test(combined)) return DEITY_IMAGES.shiva;
  if (/హనుమాన్|ఆంజనేయ|చాలీసా|సుందర|మారుతి|hanuman/i.test(combined)) return DEITY_IMAGES.hanuman;
  if (/నరసింహ|నృసింహ|ప్రహ్లాద|నారసింహ|కవచ/i.test(combined)) return DEITY_IMAGES.narasimha;
  if (/వేంకటేశ్వర|శ్రీనివాస|తిరుమల|గోవింద|బాలాజీ|venkateswara/i.test(combined)) return DEITY_IMAGES.venkateswara;
  if (/కృష్ణ|విష్ణు|అచ్యుత|ముకుంద|హరి|సహస్రనామ|నారాయణ/i.test(combined)) return DEITY_IMAGES.vishnu;
  if (/లలిత|లక్ష్మి|కనకధార|దుర్గ|సరస్వతి|మహిష|దేవి|అన్నపూర్ణ|గాయత్రి|శ్రీచక్ర|devi|durga|lakshmi/i.test(combined)) return DEITY_IMAGES.devi;
  if (/సూక్త|వేద|పురుష|శ్రీ సూక్త|suktam/i.test(combined)) return DEITY_IMAGES.suktam;
  if (/గీత|భగవద్గీత|gita/i.test(combined)) return DEITY_IMAGES.gita;
  
  if (fallbackCatImage) return fallbackCatImage;
  return DEITY_IMAGES.default;
}


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
    currentCategory = null;
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
        const imgUrl = sub.image || resolveItemImage(sub.title, parentCat.title, parentCat.image);
        unifiedMap.set(`sub_${sub.id}`, {
          id: sub.id,
          title: sub.title,
          slug: slug,
          categoryId: sub.categoryId || "general",
          categoryTitle: parentCat.title,
          categoryEmoji: parentCat.emoji || "📿",
          image: imgUrl,
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
        const imgUrl = con.image || parentSub?.image || resolveItemImage(con.title, catTitle, parentCat?.image);

        // If not already in unifiedMap under the same title
        let exists = false;
        for (const item of unifiedMap.values()) {
          if (item.title === con.title) {
            exists = true;
            if (con.audioUrl && !item.hasAudio) item.hasAudio = true;
            if (!item.image && imgUrl) item.image = imgUrl;
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
            image: imgUrl,
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
      <div class="divine-highlight-banner">
        <div class="divine-banner-text">
          <h3>🪔 ${currentCat.title} సంపూర్ణ గ్రంథం &amp; శ్లోకాలు</h3>
          <p>${currentCat.text ? currentCat.text.slice(0, 140) + (currentCat.text.length > 140 ? '...' : '') : 'సంపూర్ణ సాహిత్యం మరియు దివ్య ఆడియో అందుబాటులో ఉంది.'}</p>
        </div>
        <a href="read.html?slug=all" class="divine-banner-cta">
          ${currentCat.audioUrl ? '🎵 ఆడియోతో పాటు చదవండి' : '📖 చదవండి →'}
        </a>
      </div>
    `;
  }

  filtered.forEach((item, idx) => {
    const readUrl = `read.html?slug=${encodeURIComponent(item.slug)}`;
    const delay = Math.min(idx * 0.03, 0.6);
    const imgUrl = item.image || resolveItemImage(item.title, item.categoryTitle, "");

    html += `
      <a href="${readUrl}" class="divine-stotra-card" style="animation-delay: ${delay}s;">
        <div class="stotra-card-media">
          <img src="${imgUrl}" alt="${item.title}" class="stotra-card-img" loading="lazy">
          <div class="stotra-card-overlay"></div>
          <span class="stotra-badge-cat">${item.categoryEmoji || "📿"} ${item.categoryTitle || "స్తోత్రం"}</span>
          ${item.hasAudio ? `
            <span class="stotra-badge-audio" title="సంపూర్ణ ఆడియో అందుబాటులో ఉంది">
              <span class="audio-wave-bars"><span></span><span></span><span></span></span>
              <span>ఆడియో</span>
            </span>
          ` : ''}
        </div>
        <div class="stotra-card-content">
          <h3 class="stotra-card-title">${item.title}</h3>
          <div class="stotra-card-footer">
            <span class="stotra-card-type">📖 పవిత్ర సాహిత్యం</span>
            <span class="stotra-read-cta">చదవండి →</span>
          </div>
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
      <div class="divine-highlight-banner">
        <div class="divine-banner-text">
          <h3>🪔 ${currentCat.title} సంపూర్ణ గ్రంథం &amp; శ్లోకాలు</h3>
          <p>${currentCat.text ? currentCat.text.slice(0, 140) + (currentCat.text.length > 140 ? '...' : '') : 'సంపూర్ణ సాహిత్యం మరియు దివ్య ఆడియో అందుబాటులో ఉంది.'}</p>
        </div>
        <a href="read.html?slug=${encodeURIComponent(catSlug)}" class="divine-banner-cta">
          ${currentCat.audioUrl ? '🎵 ఆడియోతో పాటు చదవండి' : '📖 చదవండి →'}
        </a>
      </div>
    `;
  }

  list.forEach((sub, idx) => {
    const slug = sub.slug || slugify(sub.title) || sub.id;
    const readUrl = `read.html?slug=${encodeURIComponent(slug)}`;
    const delay = Math.min(idx * 0.03, 0.6);
    const imgUrl = sub.image || resolveItemImage(sub.title, currentCat?.title || "", currentCat?.image);

    html += `
      <a href="${readUrl}" class="divine-stotra-card" style="animation-delay: ${delay}s;">
        <div class="stotra-card-media">
          <img src="${imgUrl}" alt="${sub.title}" class="stotra-card-img" loading="lazy">
          <div class="stotra-card-overlay"></div>
          <span class="stotra-badge-cat">${currentCat?.emoji || "📿"} ${currentCat?.title || "విభాగం"}</span>
          ${sub.audioUrl ? `
            <span class="stotra-badge-audio" title="సంపూర్ణ ఆడియో అందుబాటులో ఉంది">
              <span class="audio-wave-bars"><span></span><span></span><span></span></span>
              <span>ఆడియో</span>
            </span>
          ` : ''}
        </div>
        <div class="stotra-card-content">
          <h3 class="stotra-card-title">${sub.title}</h3>
          <div class="stotra-card-footer">
            <span class="stotra-card-type">📖 పవిత్ర సాహిత్యం</span>
            <span class="stotra-read-cta">చదవండి →</span>
          </div>
        </div>
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
      renderSubcategories(allSubcategories, currentCategory);
      return;
    }
    const filtered = allSubcategories.filter(sub => 
      (sub.title && sub.title.toLowerCase().includes(queryText)) ||
      (sub.slug && sub.slug.toLowerCase().includes(queryText))
    );
    renderSubcategories(filtered, currentCategory);
  });
}

initPage();
