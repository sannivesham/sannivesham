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

async function loadStoryParts() {
  if (!categoryId) {
    titleBox.innerText = "Category Not Found";
    return;
  }

  const categorySnap = await getDoc(
    doc(db, "storyCategories", categoryId)
  );

  if (categorySnap.exists()) {
    titleBox.innerText = categorySnap.data().title;
  }

  const snapshot = await getDocs(collection(db, "storyParts"));

  const docs = snapshot.docs
    .filter((docItem) => docItem.data().categoryId === categoryId)
    .sort((a, b) => {
      const aTime = a.data().createdAt?.seconds || 0;
      const bTime = b.data().createdAt?.seconds || 0;
      return aTime - bTime;
    });

  partsGrid.innerHTML = "";

  docs.forEach((docItem) => {
    const part = docItem.data();

    partsGrid.innerHTML += `
      <a href="story-detail.html?id=${docItem.id}" class="story-card">
        <img src="${part.cardImage}" alt="${part.title}">
        <div class="story-name">${part.title}</div>
      </a>
    `;
  });
}

loadStoryParts();