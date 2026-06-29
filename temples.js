import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const templesGrid = document.querySelector(".temples-grid");

async function loadTemples() {
  try {
    const q = query(
      collection(db, "temples"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    templesGrid.innerHTML = "";

    snapshot.forEach((docItem) => {
      const temple = docItem.data();

      if (!temple.title || !temple.cardImage) {
        console.log("Skipped broken temple:", temple);
        return;
      }

      templesGrid.innerHTML += `
        <a href="temple-detail.html?id=${docItem.id}" class="temple-card">
          <img src="${temple.cardImage}" alt="${temple.title}">
          <div class="temple-name">${temple.title}</div>
        </a>
      `;
    });

  } catch (error) {
    console.log("Temple loading error:", error);
  }
}

loadTemples();