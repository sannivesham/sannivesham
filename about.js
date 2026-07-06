import { db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

async function loadAboutPage() {
  const settingsSnap = await getDoc(
    doc(db, "aboutSettings", "main")
  );

  if (settingsSnap.exists()) {
    const data = settingsSnap.data();

    document.getElementById("aboutTitle").innerText =
      data.title || "మా గురించి";

    document.getElementById("aboutDescription").innerHTML =
      (data.description || "").replace(/\n/g, "<br>");

    document.getElementById("aboutMission").innerHTML =
      (data.mission || "").replace(/\n/g, "<br>");

    document.getElementById("aboutVision").innerHTML =
      (data.vision || "").replace(/\n/g, "<br>");

    const bg = document.querySelector(".about-bg");

    if (bg) {
      if (window.innerWidth <= 700 && data.mobileBg) {
        bg.style.backgroundImage =
          `linear-gradient(rgba(10,5,0,0.62), rgba(10,5,0,0.70)), url("${data.mobileBg}")`;
      } else if (data.pcBg) {
        bg.style.backgroundImage =
          `linear-gradient(rgba(10,5,0,0.65), rgba(10,5,0,0.72)), url("${data.pcBg}")`;
      }
    }
  }

  const membersGrid = document.getElementById("aboutMembersList");

  const snapshot = await getDocs(
  collection(db, "aboutMembers")
);

let members = [];

snapshot.forEach((docItem) => {
  members.push({
    id: docItem.id,
    ...docItem.data()
  });
});

members.sort((a, b) => {
  const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
  const bOrder = b.order ?? b.createdAt?.seconds ?? 0;

  return aOrder - bOrder;
});

membersGrid.innerHTML = "";

members.forEach((member) => {

    membersGrid.innerHTML += `
      <div class="crew-member-card">

        <img src="${member.image}" alt="${member.name}">

        <div class="crew-member-content">

          <h3>${member.name}</h3>

          <h4>${member.position}</h4>

          <p>${(member.description || "").replace(/\n/g, "<br>")}</p>

        </div>

      </div>
    `;
  });
}

loadAboutPage();