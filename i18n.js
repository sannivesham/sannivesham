// Shared site-wide language switcher (Telugu <-> English).
//
// How to use on any page:
// 1. Include this script: <script src="i18n.js"></script>
// 2. Mark any element to translate with data-en="English text here" —
//    its existing HTML content is treated as the Telugu version
//    automatically, no data-te needed. Works for text with simple inline
//    markup too (e.g. a <br> inside), since it swaps innerHTML.
// 3. Add a circular toggle button anywhere with id="langToggleBtn" — this
//    script wires it up automatically, no extra JS needed per page.
// 4. For JS-generated text (leaderboard rows, dynamic labels, etc.) that
//    isn't in the initial HTML, call Sannivesham18n.t("తెలుగు", "English")
//    from your own script wherever you build that string.
//
// Language choice is saved in localStorage, so it persists across pages
// as long as every page includes this same script.

(function () {
  const STORAGE_KEY = "sannivesham_lang";

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || "te";
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslation();
    updateToggleButton();
  }

  // For JS-generated strings: Sannivesham18n.t("తెలుగు టెక్స్ట్", "English text")
  function t(teText, enText) {
    return getLang() === "en" ? enText : teText;
  }

  function applyTranslation() {
    const lang = getLang();

    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.teOriginal === undefined) {
        el.dataset.teOriginal = el.innerHTML;
      }
      el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.teOriginal;
    });

    // Optional: elements needing an attribute translated instead of
    // innerHTML (e.g. alt text) — data-en-attr="alt" data-en="English alt"
    document.querySelectorAll("[data-en-attr]").forEach((el) => {
      const attr = el.dataset.enAttr;
      const cacheKey = "teOriginal_" + attr;
      if (el.dataset[cacheKey] === undefined) {
        el.dataset[cacheKey] = el.getAttribute(attr) || "";
      }
      el.setAttribute(attr, lang === "en" ? el.dataset.en : el.dataset[cacheKey]);
    });

    // Optional: <body data-en-title="English page title"> to translate
    // document.title too.
    const body = document.body;
    if (body && body.dataset.enTitle) {
      if (body.dataset.teOriginalTitle === undefined) {
        body.dataset.teOriginalTitle = document.title;
      }
      document.title = lang === "en" ? body.dataset.enTitle : body.dataset.teOriginalTitle;
    }

    document.documentElement.lang = lang;
  }

  function updateToggleButton() {
    const btn = document.getElementById("langToggleBtn");
    if (!btn) return;
    btn.textContent = getLang() === "en" ? "తె" : "EN";
    btn.title = getLang() === "en" ? "తెలుగులో చూడండి" : "View in English";
  }

  function init() {
    applyTranslation();
    updateToggleButton();
    const btn = document.getElementById("langToggleBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        setLang(getLang() === "en" ? "te" : "en");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.Sannivesham18n = { getLang, setLang, t, applyTranslation };
})();
