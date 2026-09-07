import { db } from "../firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { SacredReader, slugify } from "../library/reader.js";

const params = new URLSearchParams(window.location.search);
let templeId = params.get("id");
let templeSlug = params.get("slug");
const catId = params.get("cat");

// Check if redirected from 404 router
const redirectedSlug = sessionStorage.getItem("sannivesham_temple_slug");
if (redirectedSlug) {
  templeSlug = redirectedSlug;
  sessionStorage.removeItem("sannivesham_temple_slug");
}

// Check path segment for clean URL (e.g. /temples/tirumala-balaji)
if (!templeSlug && !templeId) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const tIndex = pathParts.indexOf("temples");
  if (tIndex !== -1 && pathParts[tIndex + 1] && !pathParts[tIndex + 1].includes(".html")) {
    templeSlug = pathParts[tIndex + 1];
  }
}

const templeTitle = document.getElementById("templeTitle");
const templeSubtitle = document.getElementById("templeSubtitle");
const detailBox = document.getElementById("templeDetailBox");
const footerQuote = document.getElementById("templeFooterQuote");
const backToListLink = document.getElementById("backToListLink");
const templeBreadcrumb = document.getElementById("templeBreadcrumb");
const templeOrnament = document.getElementById("templeOrnament");

if (catId) {
  backToListLink.href = `temple-list.html?cat=${catId}`;
}

async function loadTemple() {
  const queryParam = templeSlug || templeId;
  if (!queryParam) {
    templeTitle.innerText = "దేవాలయం లభించలేదు";
    templeSubtitle.innerText = "దయచేసి దేవాలయాల జాబితాకు వెళ్ళండి.";
    detailBox.innerHTML = `<p style="text-align:center;"><a href="temples.html" class="reader-back-btn">← దేవాలయాల జాబితా</a></p>`;
    return;
  }

  let temple = null;
  let currentDocId = null;

  try {
    // 1. Try slug search in temples collection
    if (templeSlug) {
      const q = query(collection(db, "temples"), where("slug", "==", templeSlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docItem = snap.docs[0];
        temple = docItem.data();
        currentDocId = docItem.id;
      }
    }

    // 2. Fallback to direct document ID
    if (!temple && queryParam) {
      try {
        const directSnap = await getDoc(doc(db, "temples", queryParam));
        if (directSnap.exists()) {
          temple = directSnap.data();
          currentDocId = directSnap.id;
        }
      } catch (e) {}
    }

    // 3. Fallback: Search temples by slugify(title) for legacy items missing slug field
    if (!temple && queryParam) {
      const allTemplesSnap = await getDocs(collection(db, "temples"));
      for (const d of allTemplesSnap.docs) {
        const data = d.data();
        const candidateSlug = data.slug || slugify(data.title);
        if (candidateSlug === queryParam) {
          temple = data;
          currentDocId = d.id;
          if (!data.slug) {
            updateDoc(doc(db, "temples", d.id), { slug: queryParam }).catch(() => {});
          }
          break;
        }
      }
    }

    if (!temple) {
      templeTitle.innerText = "దేవాలయం లభించలేదు";
      templeSubtitle.innerText = `"${queryParam}" కు సంబంధించిన వివరాలు కనుగొనబడలేదు.`;
      detailBox.innerHTML = `<p style="text-align:center;"><a href="temples.html" class="reader-back-btn">← దేవాలయాల జాబితా</a></p>`;
      return;
    }

    if (!catId && temple.categoryId) {
      backToListLink.href = `temple-list.html?cat=${temple.categoryId}`;
    }

    // Render Title & Subtitle
    templeTitle.innerText = temple.title || "దేవాలయ విశేషాలు";
    templeSubtitle.innerText = temple.footerQuote || "భారతీయ సనాతన ధర్మ పుణ్యక్షేత్రం";
    if (templeBreadcrumb) templeBreadcrumb.innerText = temple.title;

    let sectionsHTML = "";
    (temple.sections || []).forEach(section => {
      sectionsHTML += `
        <div class="reader-section">
          ${section.title ? `<h2 class="reader-section-title">${section.title}</h2>` : ""}
          ${
            section.image
              ? `<img
                  src="${section.image}"
                  class="reader-section-image"
                  alt="${section.title || temple.title}"
                  style="
                    width:${section.imgWidth || 80}%;
                    max-height:${section.imgHeight || 460}px;
                    filter:brightness(${section.imgBrightness || 100}%);
                    object-fit:cover;
                    ${
                      section.imgPosition === "left"
                        ? "margin:20px auto 20px 0;"
                        : section.imgPosition === "right"
                        ? "margin:20px 0 20px auto;"
                        : "margin:20px auto;"
                    }
                  ">`
              : ""
          }
          <div class="reader-text-content" style="text-align:left;line-height:2.1;">
            ${(section.content || "").replace(/\n/g, "<br>")}
          </div>
        </div>
      `;
    });

    detailBox.innerHTML = sectionsHTML || "<p style='text-align:center;'>వివరాలు త్వరలో జోడించబడతాయి.</p>";
    if (templeOrnament) templeOrnament.style.display = "block";

    if (temple.footerQuote && footerQuote) {
      footerQuote.innerText = `✨ ${temple.footerQuote} ✨`;
    }

    // Set clean URL in address bar with canonical slug
    const canonicalSlug = temple.slug || slugify(temple.title) || currentDocId;
    const cleanUrl = `https://sannivesham.com/temples/${canonicalSlug}`;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, `/temples/${canonicalSlug}`);
    }

    // Auto-heal missing slug in Firestore
    if (!temple.slug && canonicalSlug) {
      updateDoc(doc(db, "temples", currentDocId), { slug: canonicalSlug }).catch(() => {});
    }

    // Initialize Sacred Reader Controls
    new SacredReader({
      type: "temple",
      title: temple.title
    });

    // Dynamic SEO Meta Tags
    const firstSectionText = temple.sections?.[0]?.content?.slice(0, 160) || "";
    SacredReader.injectSEO({
      title: `${temple.title} - దర్శనం, చరిత్ర, విశేషాలు`,
      description: `${temple.title} గురించి సమగ్ర సమాచారం. ${firstSectionText}`,
      imageUrl: temple.cardImage || temple.sections?.[0]?.image || "",
      canonicalUrl: cleanUrl,
      type: "temple"
    });

  } catch (err) {
    console.error("Temple load error:", err);
    templeTitle.innerText = "లోడ్ చేయడంలో సమస్య ఏర్పడింది";
  }
}

loadTemple();
