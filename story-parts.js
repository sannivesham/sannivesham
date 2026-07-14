import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const categoryId = params.get("category");
const titleBox = document.getElementById("storyCategoryTitle");
const partsGrid = document.getElementById("storyPartsGrid");

async function loadLibrarySubcategories() {
  if (!categoryId) {
    titleBox.innerText = "Category Not Found";
    return;
  }

  const categorySnap = await getDoc(doc(db, "libraryCategories", categoryId));
  if (categorySnap.exists()) {
    const cat = categorySnap.data();
    titleBox.innerText = (cat.emoji ? cat.emoji + " " : "") + cat.title;
  }

  const snapshot = await getDocs(collection(db, "librarySubcategories"));

  let subcategories = [];
  snapshot.forEach((docItem) => {
    const data = docItem.data();
    if (data.categoryId === categoryId) {
      subcategories.push({ id: docItem.id, ...data });
    }
  });

  subcategories.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
    const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
    return aOrder - bOrder;
  });

  partsGrid.innerHTML = "";

  subcategories.forEach((sub) => {
    partsGrid.innerHTML += `
      <a href="story-detail.html?id=${sub.id}" class="story-card">
        <div class="story-name">${sub.title}</div>
      </a>
    `;
  });
}

loadLibrarySubcategories();
