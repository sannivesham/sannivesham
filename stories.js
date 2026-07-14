import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const storiesGrid = document.getElementById("storiesGrid");

async function loadLibraryCategories() {
  const snapshot = await getDocs(collection(db, "libraryCategories"));

  let categories = [];
  snapshot.forEach((docItem) => {
    categories.push({ id: docItem.id, ...docItem.data() });
  });

  categories.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
    const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
    return aOrder - bOrder;
  });

  storiesGrid.innerHTML = "";

  categories.forEach((category) => {
    storiesGrid.innerHTML += `
      <a href="story-parts.html?category=${category.id}"
         class="story-card">
        <img src="${category.image}"
             alt="${category.title}">
        <div class="story-name">
          ${category.emoji ? category.emoji + " " : ""}${category.title}
        </div>
      </a>
    `;
  });
}

loadLibraryCategories();
