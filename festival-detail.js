import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const festivalId = params.get("id");

const detailBox =
    document.getElementById("festivalDetailBox");

const footerQuote =
    document.getElementById("festivalFooterQuote");

async function loadFestival() {

    if (!festivalId) {
        detailBox.innerHTML =
            "<h2>Festival Not Found</h2>";
        return;
    }

    const snap =
        await getDoc(
            doc(db, "festivals", festivalId)
        );

    if (!snap.exists()) {
        detailBox.innerHTML =
            "<h2>Festival Not Found</h2>";
        return;
    }

    const festival = snap.data();

    let sectionsHTML = "";

    festival.sections.forEach(section => {

        sectionsHTML += `

      <div class="festival-section">

        <h2>
          ${section.title}
        </h2>

        ${section.image
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
          ${section.content
                .replace(/\n/g, "<br>")}
        </p>

      </div>

    `;

    });

    detailBox.innerHTML = `

    <h1>
      ${festival.title}
    </h1>

    ${sectionsHTML}

  `;

    if (festival.footerQuote) {
        footerQuote.innerText =
            festival.footerQuote;
    }

}

loadFestival();