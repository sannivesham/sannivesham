import { db } from "../firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { SacredReader, slugify } from "./reader.js";

const params = new URLSearchParams(window.location.search);
let targetSlug = params.get("slug") || params.get("id") || "";

// Check if redirected from 404 router
const redirectedSlug = sessionStorage.getItem("sannivesham_lib_slug");
if (redirectedSlug) {
  targetSlug = redirectedSlug;
  sessionStorage.removeItem("sannivesham_lib_slug");
}

// Extract slug from path if direct /library/:slug was routed
if (!targetSlug) {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const libIndex = pathParts.indexOf("library");
  if (libIndex !== -1 && pathParts[libIndex + 1] && !pathParts[libIndex + 1].includes(".html")) {
    targetSlug = pathParts[libIndex + 1];
  }
}

const readerTitle = document.getElementById("readerTitle");
const readerSubtitle = document.getElementById("readerSubtitle");
const readerVerses = document.getElementById("readerVerses");
const readerBreadcrumb = document.getElementById("readerBreadcrumb");
const readerBackBtn = document.getElementById("readerBackBtn");
const readerOrnament = document.getElementById("readerOrnament");

async function loadContent() {
  if (!targetSlug) {
    readerTitle.innerText = "గ్రంథం లభించలేదు";
    readerSubtitle.innerText = "మీరు చూస్తున్న లింక్ అందుబాటులో లేదు.";
    readerVerses.innerHTML = `<p style="text-align:center;margin:30px 0;"><a href="index.html" class="reader-back-btn">← గ్రంథాలయానికి తిరిగి వెళ్ళండి</a></p>`;
    return;
  }

  let foundItem = null;
  let isSubcategoryCollection = false;
  let subcategoryData = null;
  let itemsList = [];

  try {
    // 1. First, search libraryContent by slug
    const contentQ = query(collection(db, "libraryContent"), where("slug", "==", targetSlug));
    const contentSnap = await getDocs(contentQ);

    if (!contentSnap.empty) {
      const docItem = contentSnap.docs[0];
      foundItem = { id: docItem.id, ...docItem.data() };
      itemsList = [foundItem];
    } else {
      // Check direct document ID in libraryContent
      try {
        const directDoc = await getDoc(doc(db, "libraryContent", targetSlug));
        if (directDoc.exists()) {
          foundItem = { id: directDoc.id, ...directDoc.data() };
          itemsList = [foundItem];
        }
      } catch (e) {}
    }

    // 2. If not found in libraryContent, search librarySubcategories by slug or ID
    if (!foundItem) {
      const subQ = query(collection(db, "librarySubcategories"), where("slug", "==", targetSlug));
      const subSnap = await getDocs(subQ);

      if (!subSnap.empty) {
        const subDoc = subSnap.docs[0];
        subcategoryData = { id: subDoc.id, ...subDoc.data() };
        isSubcategoryCollection = true;
      } else {
        try {
          const directSub = await getDoc(doc(db, "librarySubcategories", targetSlug));
          if (directSub.exists()) {
            subcategoryData = { id: directSub.id, ...directSub.data() };
            isSubcategoryCollection = true;
          }
        } catch (e) {}
      }
    }

    // 3. Fallback: Search existing items by slugify(title)
    // This instantly resolves any previously uploaded items that don't have a 'slug' field in Firestore yet!
    if (!foundItem && !subcategoryData) {
      const allSubSnap = await getDocs(collection(db, "librarySubcategories"));
      for (const d of allSubSnap.docs) {
        const data = d.data();
        const candidateSlug = data.slug || slugify(data.title);
        if (candidateSlug === targetSlug) {
          subcategoryData = { id: d.id, ...data };
          isSubcategoryCollection = true;
          if (!data.slug) {
            updateDoc(doc(db, "librarySubcategories", d.id), { slug: targetSlug }).catch(() => {});
          }
          break;
        }
      }
    }

    if (!foundItem && !subcategoryData) {
      const allContentSnap = await getDocs(collection(db, "libraryContent"));
      for (const d of allContentSnap.docs) {
        const data = d.data();
        const candidateSlug = data.slug || slugify(data.title);
        if (candidateSlug === targetSlug) {
          foundItem = { id: d.id, ...data };
          itemsList = [foundItem];
          if (!data.slug) {
            updateDoc(doc(db, "libraryContent", d.id), { slug: targetSlug }).catch(() => {});
          }
          break;
        }
      }
    }

    // 4. Fallback: Search libraryCategories by slug or ID
    let categoryData = null;
    if (!foundItem && !subcategoryData) {
      const catQ = query(collection(db, "libraryCategories"), where("slug", "==", targetSlug));
      const catSnap = await getDocs(catQ);
      if (!catSnap.empty) {
        const catDoc = catSnap.docs[0];
        categoryData = { id: catDoc.id, ...catDoc.data() };
      } else {
        try {
          const directCat = await getDoc(doc(db, "libraryCategories", targetSlug));
          if (directCat.exists()) {
            categoryData = { id: directCat.id, ...directCat.data() };
          }
        } catch (e) {}
      }

      if (!categoryData) {
        const allCatSnap = await getDocs(collection(db, "libraryCategories"));
        for (const d of allCatSnap.docs) {
          const data = d.data();
          const candidateSlug = data.slug || slugify(data.title);
          if (candidateSlug === targetSlug) {
            categoryData = { id: d.id, ...data };
            if (!data.slug) {
              updateDoc(doc(db, "libraryCategories", d.id), { slug: targetSlug }).catch(() => {});
            }
            break;
          }
        }
      }
    }

    // Fetch items for subcategory collection
    if (subcategoryData && itemsList.length === 0) {
      const allItemsQ = query(collection(db, "libraryContent"), where("subcategoryId", "==", subcategoryData.id));
      const allItemsSnap = await getDocs(allItemsQ);
      allItemsSnap.forEach(d => {
        itemsList.push({ id: d.id, ...d.data() });
      });
      itemsList.sort((a, b) => (a.order || 0) - (b.order || 0));

      // If no separate content items exist but subcategory itself has text
      if (itemsList.length === 0 && subcategoryData.text) {
        itemsList = [subcategoryData];
      }
    }

    // Fetch items for category
    if (categoryData && itemsList.length === 0) {
      if (categoryData.text) {
        itemsList = [categoryData];
      }
    }

    // If still not found
    if (!foundItem && !subcategoryData && !categoryData) {
      readerTitle.innerText = "రచన కనుగొనబడలేదు";
      readerSubtitle.innerText = `"${targetSlug}" తో సరిపోలే స్తోత్రం లేదా గ్రంథం లేదు.`;
      readerVerses.innerHTML = `<p style="text-align:center;margin:30px 0;"><a href="index.html" class="reader-back-btn">← గ్రంథాలయ విభాగాలను చూడండి</a></p>`;
      return;
    }

    // Determine Main Title and Category Info
    const displayTitle = isSubcategoryCollection ? subcategoryData.title : (categoryData ? categoryData.title : foundItem.title);
    const audioUrl = itemsList.find(i => i.audioUrl)?.audioUrl || subcategoryData?.audioUrl || categoryData?.audioUrl || null;

    readerTitle.innerText = displayTitle;
    readerSubtitle.innerText = isSubcategoryCollection 
      ? `దివ్య శ్లోకాలు మరియు సంపూర్ణ సాహిత్యం` 
      : (categoryData ? `పవిత్ర పారాయణ సాహిత్యం` : `పవిత్ర పారాయణ గ్రంథం`);
    readerBreadcrumb.innerText = displayTitle;

    // Fetch parent category title for breadcrumb if available
    const parentCatId = subcategoryData?.categoryId || foundItem?.categoryId;
    if (parentCatId) {
      try {
        const catSnap = await getDoc(doc(db, "libraryCategories", parentCatId));
        if (catSnap.exists()) {
          const catTitle = catSnap.data().title;
          readerBreadcrumb.innerText = `${catTitle} » ${displayTitle}`;
          readerBackBtn.href = `subcategories.html?category=${parentCatId}`;
        }
      } catch (e) {}
    } else if (categoryData) {
      readerBackBtn.href = `index.html`;
    }

    // Render Items / Verses with Real-Time Shloka Sync Support
    let html = "";
    if (itemsList.length === 0) {
      html = `<p style="text-align:center;padding:40px 0;color:var(--reader-text-muted);">ఇంకా ఈ విభాగంలో శ్లోకాలు లేదా సాహిత్యం జోడించలేదు.</p>`;
    } else {
      let globalVerseIdx = 0;
      itemsList.forEach((item, idx) => {
        const hasMultiple = itemsList.length > 1;

        // Parse individual stanzas from item.text
        const text = (item.text || "").trim();
        const rawStanzas = text.split(/\n\s*\n+/);

        let stanzasHtml = "";
        rawStanzas.forEach((stanza) => {
          let sText = stanza.trim();
          if (!sText) return;

          let startTime = null;
          // Check for timestamp like [0:15] or [00:15] or [1:25.5]
          const m = sText.match(/\[(\d{1,2}):(\d{2}(?:\.\d{1,2})?)\]/);
          if (m) {
            startTime = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
            sText = sText.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,2})?\]\s*/g, "").trim();
          }

          const cleanLines = sText.replace(/\n/g, "<br>");
          const hasStart = startTime !== null;

          stanzasHtml += `
            <div class="reader-verse-block ${audioUrl ? 'syncable' : ''}" 
                 data-verse-idx="${globalVerseIdx}" 
                 ${hasStart ? `data-start="${startTime}"` : ''}>
              ${audioUrl ? `<div class="verse-play-badge" title="ఈ శ్లోకం నుండి వినండి">▶ #${globalVerseIdx + 1}</div>` : ''}
              <div class="verse-lines">${cleanLines}</div>
            </div>
          `;
          globalVerseIdx++;
        });

        html += `
          <section class="reader-section">
            ${hasMultiple && item.title ? `<h2 class="reader-section-title">${item.title}</h2>` : ""}
            <div class="reader-text-content">
              <div class="reader-verses-container">
                ${stanzasHtml || `<div class="reader-verse-block"><div class="verse-lines">${(item.text || "").trim().replace(/\n/g, "<br>")}</div></div>`}
              </div>
            </div>
            ${item.audioUrl && !audioUrl ? `
              <div style="text-align:center;margin-top:16px;">
                <a href="${item.audioUrl}" target="_blank" class="reader-btn">🔊 ఆడియో వినండి</a>
              </div>
            ` : ""}
          </section>
        `;
      });
    }

    readerVerses.innerHTML = html;
    if (readerOrnament) readerOrnament.style.display = "block";

    // Set clean address bar URL using smart canonical slug
    const existingSlug = isSubcategoryCollection ? subcategoryData.slug : foundItem.slug;
    const canonicalSlug = existingSlug || slugify(displayTitle) || (isSubcategoryCollection ? subcategoryData.id : foundItem.id);
    const cleanUrl = `https://sannivesham.com/library/${canonicalSlug}`;

    // Initialize Sacred Reader Controls
    new SacredReader({
      type: "library",
      title: displayTitle,
      audioUrl: audioUrl
    });

    // Dynamic SEO Injection
    const snippet = itemsList[0]?.text?.slice(0, 150) || "";
    SacredReader.injectSEO({
      title: displayTitle,
      description: `${displayTitle} - సంపూర్ణ సాహిత్యం, శ్లోకాలు మరియు అర్థం. ${snippet}`,
      canonicalUrl: cleanUrl,
      type: "article"
    });

  } catch (err) {
    console.error("Reader load error:", err);
    readerTitle.innerText = "లోడ్ చేయడంలో సమస్య ఏర్పడింది";
    readerSubtitle.innerText = "దయచేసి పేజీని రీఫ్రెష్ చేయండి.";
  }
}

// Hardware / gesture phone back button: ensure pressing phone back ALWAYS takes user to library page
if (window.history && window.history.pushState) {
  window.history.pushState({ page: "library-read" }, "", window.location.href);
  window.addEventListener("popstate", () => {
    window.location.replace("/library/");
  });
}

// In-page toolbar back button handler
if (readerBackBtn) {
  readerBackBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/library/";
  });
}

loadContent();
