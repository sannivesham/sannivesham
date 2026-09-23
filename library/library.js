import { db } from "../firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const libraryGrid = document.getElementById("libraryGrid");
const searchInput = document.getElementById("librarySearchInput");
let allCategories = [];

const defaultAllCategory = {
  id: "all-library-category",
  slug: "all",
  title: "సర్వ గ్రంథ సంపద",
  emoji: "🕉️",
  image: "https://res.cloudinary.com/du5em76za/image/upload/v1784085723/jfzdyhiuku0afwhaatgr.png",
  description: "అన్ని విభాగాలలోని స్తోత్రాలు, నామావళులు, సూక్తాలు, చాలీసాలు మరియు సమస్త పవిత్ర రచనల సంపూర్ణ సమాహారం — అన్నీ ఒక్కచోట!",
  order: -999999,
  isAllBox: true
};

async function loadLibraryCategories() {
  try {
    const snapshot = await getDocs(collection(db, "libraryCategories"));
    allCategories = [];

    let hasAllCategory = false;
    snapshot.forEach((docItem) => {
      const data = { id: docItem.id, ...docItem.data() };
      if (data.isAllBox || data.slug === "all" || data.id === "all-library-category") {
        data.isAllBox = true;
        data.order = -999999;
        hasAllCategory = true;
      }
      allCategories.push(data);
    });

    if (!hasAllCategory) {
      allCategories.unshift(defaultAllCategory);
    }

    allCategories.sort((a, b) => {
      if (a.isAllBox) return -1;
      if (b.isAllBox) return 1;
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
    if (category.isAllBox || category.slug === "all" || category.id === "all-library-category") {
      html += `
        <a href="subcategories.html?category=all" class="library-cat-card library-featured-card">
          <div class="library-featured-badge">
            <span>✨</span> <span>సమగ్ర నిధి • All-in-One</span>
          </div>
          <div class="library-featured-thumb-wrap">
            <img src="${category.image || 'https://res.cloudinary.com/du5em76za/image/upload/v1784085723/jfzdyhiuku0afwhaatgr.png'}" alt="${category.title}" class="library-featured-thumb" loading="lazy">
          </div>
          <div class="library-featured-body">
            <div class="library-featured-header">
              <div class="library-featured-title">
                <span>${category.emoji || "🕉️"}</span>
                <span>${category.title}</span>
              </div>
            </div>
            <p class="library-featured-desc">${category.description || "అన్ని విభాగాలలోని స్తోత్రాలు, నామావళులు, సూక్తాలు, చాలీసాలు మరియు సమస్త పవిత్ర రచనల సంపూర్ణ సమాహారం — అన్నీ ఒక్కచోట!"}</p>
            <div class="library-featured-footer">
              <span class="library-featured-counter">📚 అన్ని విభాగాలు &amp; రచనలు</span>
              <span class="library-featured-cta">అన్నీ చూడండి (View All) →</span>
            </div>
          </div>
        </a>
      `;
      return;
    }

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
      cat.isAllBox ||
      (cat.title && cat.title.toLowerCase().includes(queryText)) ||
      (cat.slug && cat.slug.toLowerCase().includes(queryText))
    );
    renderCategories(filtered);
  });
}

loadLibraryCategories();
