import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const templeCategoriesGrid = document.getElementById("templeCategoriesGrid");

async function loadTempleCategories() {
  try {
    const q = query(
      collection(db, "templeCategories"),
      orderBy("order", "asc")
    );

    const snapshot = await getDocs(q);

    templeCategoriesGrid.innerHTML = "";

    if (snapshot.empty) {
      templeCategoriesGrid.innerHTML =
        "<p style='color:white;text-align:center;'>ఇంకా విభాగాలు జోడించలేదు.</p>";
      return;
    }

    snapshot.forEach((docItem) => {
      const category = docItem.data();

      if (!category.title || !category.cardImage) {
        console.log("Skipped broken category:", category);
        return;
      }

      templeCategoriesGrid.innerHTML += `
        <a href="temple-list.html?cat=${docItem.id}" class="temple-card">
          <img src="${category.cardImage}" alt="${category.title}">
          <div class="temple-name">${category.title}</div>
        </a>
      `;
    });

  } catch (error) {
    console.log("Temple categories loading error:", error);
    templeCategoriesGrid.innerHTML =
      "<p style='color:white;text-align:center;'>విభాగాలను లోడ్ చేయలేకపోయాము.</p>";
  }
}

loadTempleCategories();
