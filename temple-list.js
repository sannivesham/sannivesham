import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const catId = params.get("cat");

const categoryTitle = document.getElementById("categoryTitle");
const templeListGrid = document.getElementById("templeListGrid");

async function loadTemples() {
  if (!catId) {
    categoryTitle.innerText = "Category Not Found";
    return;
  }

  const catSnap = await getDoc(doc(db, "templeCategories", catId));
  if (catSnap.exists()) {
    categoryTitle.innerText = catSnap.data().title;
  }

  try {
    const q = query(
      collection(db, "temples"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    templeListGrid.innerHTML = "";

    const items = [];

    snapshot.forEach((docItem) => {
      const temple = docItem.data();
      if (temple.categoryId === catId) {
        items.push({ id: docItem.id, ...temple });
      }
    });

    if (items.length === 0) {
      templeListGrid.innerHTML =
        "<p style='color:white;text-align:center;'>ఈ విభాగంలో ఇంకా దేవాలయాలు జోడించలేదు.</p>";
      return;
    }

    items.forEach((temple) => {
      if (!temple.title || !temple.cardImage) {
        console.log("Skipped broken temple:", temple);
        return;
      }

      templeListGrid.innerHTML += `
        <a href="temple-detail.html?id=${temple.id}&cat=${catId}" class="temple-card">
          <img src="${temple.cardImage}" alt="${temple.title}">
          <div class="temple-name">${temple.title}</div>
        </a>
      `;
    });

  } catch (error) {
    console.log("Temple loading error:", error);
    templeListGrid.innerHTML =
      "<p style='color:white;text-align:center;'>దేవాలయాలను లోడ్ చేయలేకపోయాము.</p>";
  }
}

loadTemples();
