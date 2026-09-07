import { db } from "../firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const libraryGrid = document.getElementById("libraryGrid");
const searchInput = document.getElementById("librarySearchInput");
let allCategories = [];

async function loadLibraryCategories() {
  try {
    const snapshot = await getDocs(collection(db, "libraryCategories"));
    allCategories = [];

    snapshot.forEach((docItem) => {
      allCategories.push({ id: docItem.id, ...docItem.data() });
    });

    allCategories.sort((a, b) => {
      const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
      const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
      return aOrder - bOrder;
    });

    renderCategories(allCategories);
  } catch (err) {
    console.error("Error loading categories:", err);
    libraryGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;color:#ff9999;padding:40px;">విభాగాలను లోడ్ చేయడంలో లోపం ఏర్పడింది. దయచేసి రీఫ్రెష్ చేయండి.</p>`;
  }
}

function renderCategories(list) {
  if (!list.length) {
    libraryGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;color:#ffd166;padding:40px;">ఎటువంటి విభాగాలు కనుగొనబడలేదు.</p>`;
    return;
  }

  let html = "";
  list.forEach((category) => {
    const targetLink = category.slug 
      ? `subcategories.html?slug=${category.slug}&category=${category.id}` 
      : `subcategories.html?category=${category.id}`;

    html += `
      <a href="${targetLink}" class="library-cat-card">
        ${category.image ? `<img src="${category.image}" alt="${category.title}" class="library-cat-thumb" loading="lazy">` : ""}
        <div class="library-cat-body">
          <div class="library-cat-title">
            <span>${category.emoji || "📿"}</span>
            <span>${category.title}</span>
          </div>
          <span class="library-cat-arrow">→</span>
        </div>
      </a>
    `;
  });

  libraryGrid.innerHTML = html;
}

// Live Search Filter
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const queryText = e.target.value.trim().toLowerCase();
    if (!queryText) {
      renderCategories(allCategories);
      return;
    }
    const filtered = allCategories.filter(cat => 
      (cat.title && cat.title.toLowerCase().includes(queryText)) ||
      (cat.slug && cat.slug.toLowerCase().includes(queryText))
    );
    renderCategories(filtered);
  });
}

loadLibraryCategories();
