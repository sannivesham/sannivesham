import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const slokasGrid = document.querySelector(".slokas-grid");

async function loadSlokaCategories() {
  const q = query(
    collection(db, "slokaCategories"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  slokasGrid.innerHTML = "";

  snapshot.forEach((docItem) => {
    const category = docItem.data();

    slokasGrid.innerHTML += `
      <a href="sloka-detail.html?category=${docItem.id}" class="sloka-card">
        <img src="${category.cardImage}" alt="${category.title}">
        <div class="sloka-name">${category.title}</div>
      </a>
    `;
  });
}

loadSlokaCategories();