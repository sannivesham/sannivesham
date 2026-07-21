import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const ithihasaluGrid = document.getElementById("ithihasaluGrid");

async function loadIthihasaluCategories() {
  try {
    const q = query(
      collection(db, "ithihasaluCategories"),
      orderBy("order", "asc")
    );

    const snapshot = await getDocs(q);

    ithihasaluGrid.innerHTML = "";

    if (snapshot.empty) {
      ithihasaluGrid.innerHTML =
        "<p style='color:white;text-align:center;'>ఇంకా విభాగాలు జోడించలేదు.</p>";
      return;
    }

    snapshot.forEach((docItem) => {
      const category = docItem.data();

      ithihasaluGrid.innerHTML += `
        <a href="ithihasalu-chapters.html?cat=${docItem.id}" class="story-card">
          ${category.image ? `<img src="${category.image}" alt="${category.title}">` : ""}
          <div class="story-name">${category.title}</div>
        </a>
      `;
    });

  } catch (error) {
    console.log("Ithihasalu categories loading error:", error);
    ithihasaluGrid.innerHTML =
      "<p style='color:white;text-align:center;'>విభాగాలను లోడ్ చేయలేకపోయాము.</p>";
  }
}

loadIthihasaluCategories();
