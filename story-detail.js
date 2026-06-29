import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const storyId = params.get("id");

const detailBox = document.getElementById("storyDetailBox");

async function loadStoryDetail() {
  if (!storyId) {
    detailBox.innerHTML = "<h2>Story Not Found</h2>";
    return;
  }

  const snap = await getDoc(doc(db, "storyParts", storyId));

  if (!snap.exists()) {
    detailBox.innerHTML = "<h2>Story Not Found</h2>";
    return;
  }

  const story = snap.data();

  let sectionsHTML = "";

  (story.sections || []).forEach((section) => {
    sectionsHTML += `
      <div class="festival-section">
        <h2>${section.title || ""}</h2>

        ${
          section.image
            ? `<img src="${section.image}" class="festival-section-image">`
            : ""
        }

        <p>${(section.content || "").replace(/\n/g, "<br>")}</p>
      </div>
    `;
  });

  detailBox.innerHTML = `
    <h1>${story.title}</h1>
    ${sectionsHTML || "<p>ఇంకా కథ వివరాలు జోడించలేదు.</p>"}
  `;
}

loadStoryDetail();