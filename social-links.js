import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

async function loadSocialLinks() {
  try {
    const snap = await getDoc(doc(db, "settings", "socialLinks"));
    if (!snap.exists()) return;

    const data = snap.data();

    const instagram = data.instagram || "";
    const facebook = data.facebook || "";
    const youtube = data.youtube || "";
    const whatsapp = data.whatsapp || "";
    const whatsappChannel = data.whatsappChannel || "";
    const phone = data.phone || "";
    const email = data.email || "";

    setLink("homeInstagram", instagram, "Sannivesham");
    setLink("homeFacebook", facebook, "Sannivesham");
    setLink("homeYoutube", youtube, "Sannivesham");
    setLink("homeWhatsapp", whatsapp, phone || "WhatsApp");
    setLink("homeWhatsappChannel", whatsappChannel, "");
    setLink("homePhone", phone ? `tel:${phone}` : "", phone || "Phone");
    setLink("homeEmail", email ? `mailto:${email}` : "", email || "Email");

    document.querySelectorAll(".simple-footer, .home-footer").forEach((footer) => {
      if (footer.querySelector(".footer-links")) return;

      const box = document.createElement("div");
      box.className = "footer-links";

      box.innerHTML = `
        ${instagram ? `<a href="${instagram}" target="_blank">Instagram</a>` : ""}
        ${facebook ? `<a href="${facebook}" target="_blank">Facebook</a>` : ""}
        ${phone ? `<a href="tel:${phone}">Phone</a>` : ""}
      `;

      footer.insertBefore(box, footer.firstChild);
    });

  } catch (error) {
    console.log("Social links error:", error);
  }
}

function setLink(id, url, text) {
  const el = document.getElementById(id);
  if (!el) return;

  if (url) {
    el.href = url;
  } else {
    el.href = "javascript:void(0)";
  }

  if (url && id !== "homePhone" && id !== "homeEmail") {
    el.target = "_blank";
  }

  if (text) {
    const span = el.querySelector("span");
    if (span) span.innerText = text;
  }
}

loadSocialLinks();