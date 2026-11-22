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

async function getStaticLibraryData() {
  if (window.SANNIVESHAM_LIBRARY_DATA) {
    return window.SANNIVESHAM_LIBRARY_DATA;
  }
  try {
    const [catsRes, subRes, conRes] = await Promise.all([
      fetch("data/categories.json"),
      fetch("data/subcategories.json"),
      fetch("data/content.json")
    ]);
    return {
      categories: await catsRes.json(),
      subcategories: await subRes.json(),
      content: await conRes.json()
    };
  } catch (e) {
    console.warn("Could not load static library data", e);
    return { categories: [], subcategories: [], content: [] };
  }
}

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
    const { categories, subcategories, content } = await getStaticLibraryData();

    // 1. Search libraryContent by slug or ID
    foundItem = content.find(c => c.slug === targetSlug || c.id === targetSlug);
    if (foundItem) {
      itemsList = [foundItem];
    }

    // 2. If not found in content, search subcategories by slug or ID
    if (!foundItem) {
      subcategoryData = subcategories.find(s => s.slug === targetSlug || s.id === targetSlug);
      if (subcategoryData) {
        isSubcategoryCollection = true;
      }
    }

    // 3. Fallback: Search by slugify(title)
    if (!foundItem && !subcategoryData) {
      subcategoryData = subcategories.find(s => slugify(s.title) === targetSlug);
      if (subcategoryData) {
        isSubcategoryCollection = true;
      }
    }

    if (!foundItem && !subcategoryData) {
      foundItem = content.find(c => slugify(c.title) === targetSlug);
      if (foundItem) {
        itemsList = [foundItem];
      }
    }

    // 4. Fallback: Search categories
    let categoryData = null;
    if (!foundItem && !subcategoryData) {
      categoryData = categories.find(c => c.slug === targetSlug || c.id === targetSlug || slugify(c.title) === targetSlug);
    }

    // Fetch items for subcategory collection
    if (subcategoryData && itemsList.length === 0) {
      itemsList = content.filter(c => c.subcategoryId === subcategoryData.id);
      itemsList.sort((a, b) => (a.order || 0) - (b.order || 0));

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

    // Fetch parent category title for breadcrumb
    const parentCatId = subcategoryData?.categoryId || foundItem?.categoryId;
    if (parentCatId) {
      const parentCat = categories.find(c => c.id === parentCatId);
      if (parentCat) {
        readerBreadcrumb.innerText = `${parentCat.title} » ${displayTitle}`;
        readerBackBtn.href = `subcategories.html?category=${parentCatId}`;
      }
    } else if (categoryData) {
      readerBackBtn.href = `index.html`;
    }

    // Render Items / Verses
    let html = "";
    if (itemsList.length === 0) {
      html = `<p style="text-align:center;padding:40px 0;color:var(--reader-text-muted);">ఇంకా ఈ విభాగంలో శ్లోకాలు లేదా సాహిత్యం జోడించలేదు.</p>`;
    } else {
      let globalVerseIdx = 0;
      itemsList.forEach((item) => {
        const hasMultiple = itemsList.length > 1;
        const text = (item.text || "").trim();
        const rawStanzas = text.split(/\n\s*\n+/);

        let stanzasHtml = "";
        rawStanzas.forEach((stanza) => {
          let sText = stanza.trim();
          if (!sText) return;

          let startTime = null;
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

    // Initialize Sacred Reader Controls
    new SacredReader({
      type: "library",
      title: displayTitle,
      audioUrl: audioUrl
    });

  } catch (err) {
    console.error("Reader load error:", err);
    readerTitle.innerText = "లోడ్ చేయడంలో సమస్య ఏర్పడింది";
    readerSubtitle.innerText = "దయచేసి పేజీని రీఫ్రెష్ చేయండి.";
  }
}

// Hardware / gesture phone back button
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
