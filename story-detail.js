import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const subcategoryId = params.get("id");
const detailBox = document.getElementById("storyDetailBox");

async function loadLibraryContent() {
  if (!subcategoryId) {
    detailBox.innerHTML = "<h2>Content Not Found</h2>";
    return;
  }

  const subSnap = await getDoc(doc(db, "librarySubcategories", subcategoryId));
  if (!subSnap.exists()) {
    detailBox.innerHTML = "<h2>Content Not Found</h2>";
    return;
  }
  const subTitle = subSnap.data().title || "";

  const snapshot = await getDocs(collection(db, "libraryContent"));

  let items = [];
  snapshot.forEach((docItem) => {
    const data = docItem.data();
    if (data.subcategoryId === subcategoryId) {
      items.push({ id: docItem.id, ...data });
    }
  });

  items.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
    const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
    return aOrder - bOrder;
  });

  let contentHTML = "";

  items.forEach((item) => {
    contentHTML += `
      <div class="festival-section">
        <h2>${item.title || ""}</h2>
        <p>${(item.text || "").replace(/\n/g, "<br>")}</p>
        ${
          item.audioUrl
            ? `<a href="${item.audioUrl}" target="_blank" class="privacy-btn">🔊 వినండి</a>`
            : ""
        }
      </div>
    `;
  });

  detailBox.innerHTML = `
    <h1>${subTitle}</h1>
    ${contentHTML || "<p>ఇంకా వివరాలు జోడించలేదు.</p>"}
  `;
}

loadLibraryContent();
