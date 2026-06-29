import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const eventsList = document.querySelector(".events-list");

async function loadEvents() {
  try {
    const q = query(
      collection(db, "events"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    eventsList.innerHTML = "";

    snapshot.forEach((doc) => {
      const event = doc.data();

      const images = event.images || (event.image ? [event.image] : []);

      const galleryHTML = images.map((img) => `
        <img src="${img}" alt="${event.title}">
      `).join("");

      eventsList.innerHTML += `
        <div class="event-box">

          <div class="event-text">

            <h2>${event.title}</h2>

            <div class="event-meta">
              ${event.location ? `<p>📍 ${event.location}</p>` : ""}
              ${event.time ? `<p>🕒 ${event.time}</p>` : ""}
            </div>

            <p>${event.description.replace(/\n/g, "<br>")}</p>

          </div>

          <div class="event-gallery">
            ${galleryHTML}
          </div>

        </div>
      `;
    });

  } catch (error) {
    console.log(error);
    eventsList.innerHTML = "<p style='color:white;'>Events loading error</p>";
  }
}

loadEvents();