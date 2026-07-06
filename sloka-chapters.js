import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const categoryId = params.get("category");

const titleBox = document.getElementById("slokaCategoryTitle");
const chaptersGrid = document.getElementById("slokaChaptersGrid");

async function loadSlokaChapters() {
  if (!categoryId) {
    titleBox.innerText = "Category Not Found";
    return;
  }

  const categorySnap = await getDoc(
    doc(db, "slokaCategories", categoryId)
  );

  if (categorySnap.exists()) {
    titleBox.innerText = categorySnap.data().title;
  }

  const snapshot = await getDocs(
    collection(db, "slokaChapters")
  );

  const docs = snapshot.docs
    .filter((docItem) => docItem.data().categoryId === categoryId)
    .sort((a, b) => {
      const aTime = a.data().createdAt?.seconds || 0;
      const bTime = b.data().createdAt?.seconds || 0;
      return aTime - bTime;
    });

  chaptersGrid.innerHTML = "";

  docs.forEach((docItem) => {
    const chapter = docItem.data();

    chaptersGrid.innerHTML += `
      <a href="sloka-detail.html?chapter=${docItem.id}"
         class="sloka-card">

        <div class="sloka-name">
          ${chapter.title}
        </div>

      </a>
    `;
  });
}

loadSlokaChapters();