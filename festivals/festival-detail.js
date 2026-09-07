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
let festivalId = params.get("id");
let festivalSlug = params.get("slug");

// Check if redirected from 404 router
const redirectedSlug = sessionStorage.getItem("sannivesham_festival_slug");
if (redirectedSlug) {
  festivalSlug = redirectedSlug;
  sessionStorage.removeItem("sannivesham_festival_slug");
}

// Check path segment for clean URL (e.g. /festivals/vinayaka-chavithi)
if (!festivalSlug && !festivalId) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const fIndex = pathParts.indexOf("festivals");
  if (fIndex !== -1 && pathParts[fIndex + 1] && !pathParts[fIndex + 1].includes(".html")) {
    festivalSlug = pathParts[fIndex + 1];
  }
}

const festivalTitle = document.getElementById("festivalTitle");
const festivalSubtitle = document.getElementById("festivalSubtitle");
const detailBox = document.getElementById("festivalDetailBox");
const footerQuote = document.getElementById("festivalFooterQuote");
const festivalBreadcrumb = document.getElementById("festivalBreadcrumb");
const festivalOrnament = document.getElementById("festivalOrnament");

async function loadFestival() {
  const queryParam = festivalSlug || festivalId;
  if (!queryParam) {
    festivalTitle.innerText = "పండుగ లభించలేదు";
    festivalSubtitle.innerText = "దయచేసి పండుగల జాబితాకు వెళ్ళండి.";
    detailBox.innerHTML = `<p style="text-align:center;"><a href="festivals.html" class="reader-back-btn">← పండుగల జాబితా</a></p>`;
    return;
  }

  let festival = null;
  let currentDocId = null;

  try {
    // 1. Try slug search in festivals collection
    if (festivalSlug) {
      const q = query(collection(db, "festivals"), where("slug", "==", festivalSlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docItem = snap.docs[0];
        festival = docItem.data();
        currentDocId = docItem.id;
      }
    }

    // 2. Fallback to direct document ID
    if (!festival && queryParam) {
      try {
        const directSnap = await getDoc(doc(db, "festivals", queryParam));
        if (directSnap.exists()) {
          festival = directSnap.data();
          currentDocId = directSnap.id;
        }
      } catch (e) {}
    }

    // 3. Fallback: Search festivals by slugify(title) for legacy items missing slug field
    if (!festival && queryParam) {
      const allFestivalsSnap = await getDocs(collection(db, "festivals"));
      for (const d of allFestivalsSnap.docs) {
        const data = d.data();
        const candidateSlug = data.slug || slugify(data.title);
        if (candidateSlug === queryParam) {
          festival = data;
          currentDocId = d.id;
          if (!data.slug) {
            updateDoc(doc(db, "festivals", d.id), { slug: queryParam }).catch(() => {});
          }
          break;
        }
      }
    }

    if (!festival) {
      festivalTitle.innerText = "పండుగ లభించలేదు";
      festivalSubtitle.innerText = `"${queryParam}" కు సంబంధించిన వివరాలు కనుగొనబడలేదు.`;
      detailBox.innerHTML = `<p style="text-align:center;"><a href="festivals.html" class="reader-back-btn">← పండుగల జాబితా</a></p>`;
      return;
    }

    // Render Title & Subtitle
    festivalTitle.innerText = festival.title || "పండుగ విశేషాలు";
    festivalSubtitle.innerText = festival.footerQuote || "భారతీయ సనాతన ధర్మ పండుగ విశిష్టత";
    if (festivalBreadcrumb) festivalBreadcrumb.innerText = festival.title;

    let sectionsHTML = "";
    (festival.sections || []).forEach(section => {
      sectionsHTML += `
        <div class="reader-section">
          ${section.title ? `<h2 class="reader-section-title">${section.title}</h2>` : ""}
          ${
            section.image
              ? `<img
                  src="${section.image}"
                  class="reader-section-image"
                  alt="${section.title || festival.title}"
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
    if (festivalOrnament) festivalOrnament.style.display = "block";

    if (festival.footerQuote && footerQuote) {
      footerQuote.innerText = `✨ ${festival.footerQuote} ✨`;
    }

    // Set clean URL in address bar with canonical slug
    const canonicalSlug = festival.slug || slugify(festival.title) || currentDocId;
    const cleanUrl = `https://sannivesham.com/festivals/${canonicalSlug}`;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, `/festivals/${canonicalSlug}`);
    }

    // Auto-heal missing slug in Firestore
    if (!festival.slug && canonicalSlug) {
      updateDoc(doc(db, "festivals", currentDocId), { slug: canonicalSlug }).catch(() => {});
    }

    // Initialize Sacred Reader Controls
    new SacredReader({
      type: "festival",
      title: festival.title
    });

    // Dynamic SEO Meta Tags
    const firstSectionText = festival.sections?.[0]?.content?.slice(0, 160) || "";
    SacredReader.injectSEO({
      title: `${festival.title} - పూజా విధానం, విశిష్టత, కథ`,
      description: `${festival.title} పండుగ విశిష్టత మరియు సంపూర్ణ సమాచారం. ${firstSectionText}`,
      imageUrl: festival.cardImage || festival.sections?.[0]?.image || "",
      canonicalUrl: cleanUrl,
      type: "festival"
    });

  } catch (err) {
    console.error("Festival load error:", err);
    festivalTitle.innerText = "లోడ్ చేయడంలో సమస్య ఏర్పడింది";
  }
}

loadFestival();
