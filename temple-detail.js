import { db } from "./firebase-config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const templeId = params.get("id");
const catId = params.get("cat");

const detailBox =
document.getElementById("templeDetailBox");

const footerQuote =
document.getElementById("templeFooterQuote");

const backToListLink =
document.getElementById("backToListLink");

if (catId) {
  backToListLink.href = `temple-list.html?cat=${catId}`;
}

async function loadTemple() {
  if (!templeId) {
    detailBox.innerHTML =
      "<h2>Temple Not Found</h2>";
    return;
  }

  const snap =
    await getDoc(
      doc(db, "temples", templeId)
    );

  if (!snap.exists()) {
    detailBox.innerHTML =
      "<h2>Temple Not Found</h2>";
    return;
  }

  const temple = snap.data();

  if (!catId && temple.categoryId) {
    backToListLink.href = `temple-list.html?cat=${temple.categoryId}`;
  }

  let sectionsHTML = "";

  (temple.sections || []).forEach(section => {
    sectionsHTML += `
      <div class="festival-section">
        <h2>
          ${section.title}
        </h2>
        ${
          section.image
          ?
          `<img
            src="${section.image}"
            class="festival-section-image"
            style="
              width:${section.imgWidth || 75}%;
              height:${section.imgHeight || 420}px;
              filter:brightness(${section.imgBrightness || 100}%);
              object-fit:cover;
              display:block;
              ${
                section.imgPosition === "left"
                  ? "margin:25px auto 25px 0;"
                  : section.imgPosition === "right"
                  ? "margin:25px 0 25px auto;"
                  : "margin:25px auto;"
              }
            ">`
          :
          ""
        }
        <p>
          ${section.content.replace(/\n/g,"<br>")}
        </p>
      </div>
    `;
  });

  detailBox.innerHTML = `
    <h1>${temple.title}</h1>
    ${sectionsHTML}
  `;

  if (temple.footerQuote) {
    footerQuote.innerText =
      temple.footerQuote;
  }
}

loadTemple();
