import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const storiesGrid = document.getElementById("storiesGrid");

async function loadStoryCategories() {

  const q = query(
    collection(db, "storyCategories"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);

  storiesGrid.innerHTML = "";

  snapshot.forEach((docItem) => {

    const category = docItem.data();

    storiesGrid.innerHTML += `
      <a href="story-parts.html?category=${docItem.id}"
         class="story-card">

        <img src="${category.cardImage}"
             alt="${category.title}">

        <div class="story-name">
          ${category.title}
        </div>

      </a>
    `;
  });

}

loadStoryCategories();