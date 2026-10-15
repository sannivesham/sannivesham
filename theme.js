// Sannivesham Multi-Theme Engine
// Supported Themes: 'default' (Golden), 'ramayanam', 'mahabharatam', 'light', 'dark'

(function () {
  const STORAGE_KEY = "sannivesham_theme";
  const EXPLICIT_FLAG = "sannivesham_theme_explicit";
  const THEME_BG_STORAGE_KEY = "sannivesham_theme_bg_cache";
  const DEFAULT_THEME = "default";

  const THEMES_CONFIG = [
    {
      id: "default",
      icon: "🪔",
      nameTe: "సహజ స్వర్ణ శైలి (Default)",
      nameEn: "Default (Golden)",
      descTe: "దివ్య సువర్ణ దేవాలయం & ప్రశాంత కాంతి",
      descEn: "Sacred Golden Temple & Amber Glow",
      dots: ["#ffd166", "#241408", "#ff9f1c"],
      overlay: "linear-gradient(rgba(10,5,0,0.60),rgba(10,5,0,0.78))",
      desktop: "images/quiz-bg-desktop.jpg",
      mobile: "images/quiz-bg-mobile.jpg"
    },
    {
      id: "ramayanam",
      icon: "🏹",
      nameTe: "రామాయణం",
      nameEn: "Ramayanam",
      descTe: "అయోధ్య కాషాయం & రాజ సువర్ణం",
      descEn: "Ayodhya Saffron & Royal Gold",
      dots: ["#FF9E2C", "#240b03", "#FDE8CF"],
      overlay: "linear-gradient(rgba(38,14,4,0.65),rgba(22,7,2,0.72))",
      desktop: "images/ramayanam-bg.jpg",
      mobile: "images/ramayanam-mobile.jpg"
    },
    {
      id: "mahabharatam",
      icon: "🦚",
      nameTe: "మహాభారతం",
      nameEn: "Mahabharatam",
      descTe: "కృష్ణ మయూర నీలం & స్వర్ణం",
      descEn: "Krishna Peacock Blue & Gold",
      dots: ["#5AC8FA", "#040e1f", "#D4E4FF"],
      overlay: "linear-gradient(rgba(4,14,32,0.68),rgba(2,8,20,0.75))",
      desktop: "images/homebg.jpg",
      mobile: "images/homebg-mobile.jpg"
    },
    {
      id: "light",
      icon: "☀️",
      nameTe: "సాత్విక / వెలుగు",
      nameEn: "Light Theme",
      descTe: "చందనం & దేవాలయ ప్రకాశం",
      descEn: "Sandalwood & Temple Parchment",
      dots: ["#F8EFE0", "#B87310", "#2C1810"],
      overlay: "linear-gradient(rgba(255,250,242,0.85),rgba(255,248,235,0.88))",
      desktop: "images/homebg.jpg",
      mobile: "images/homebg-mobile.jpg"
    },
    {
      id: "dark",
      icon: "🌙",
      nameTe: "సాంప్రదాయ / చీకటి",
      nameEn: "Dark Theme",
      descTe: "రాత్రి అంబర్ & స్వర్ణ కాంతి",
      descEn: "Midnight Obsidian & Amber Glow",
      dots: ["#120603", "#ffd166", "#EDE3C8"],
      overlay: "linear-gradient(rgba(10,5,0,0.70),rgba(10,5,0,0.78))",
      desktop: "images/homebg.jpg",
      mobile: "images/homebg-mobile.jpg"
    }
  ];

  const THEME_OVERLAYS = {
    default: "linear-gradient(rgba(10,5,0,0.60),rgba(10,5,0,0.78))",
    ramayanam: "linear-gradient(rgba(38,14,4,0.65),rgba(22,7,2,0.72))",
    mahabharatam: "linear-gradient(rgba(4,14,32,0.68),rgba(2,8,20,0.75))",
    light: "linear-gradient(rgba(255,250,242,0.85),rgba(255,248,235,0.88))",
    dark: "linear-gradient(rgba(10,5,0,0.70),rgba(10,5,0,0.78))"
  };

  function getTheme() {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "ramayanam" && !localStorage.getItem(EXPLICIT_FLAG)) {
      return DEFAULT_THEME;
    }
    return val || DEFAULT_THEME;
  }

  function hasUserChosenTheme() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function getCachedThemeBgUrl(theme) {
    try {
      const cachedStr = localStorage.getItem(THEME_BG_STORAGE_KEY);
      if (!cachedStr) return "";
      const cached = JSON.parse(cachedStr);
      const themeConfig = cached && (cached[theme] || (cached.themes && cached.themes[theme]));
      if (!themeConfig) return "";
      const isMobile = window.innerWidth <= 700;
      return isMobile
        ? (themeConfig.homeMobile || themeConfig.mobile || themeConfig.homePc || themeConfig.pc || "")
        : (themeConfig.homePc || themeConfig.pc || themeConfig.homeMobile || themeConfig.mobile || "");
    } catch (e) {
      return "";
    }
  }

  function applyThemeBackground(theme, customUrl) {
    const validThemes = ["default", "ramayanam", "mahabharatam", "light", "dark"];
    if (!validThemes.includes(theme)) theme = DEFAULT_THEME;

    const url = customUrl !== undefined ? customUrl : getCachedThemeBgUrl(theme);
    const overlay = THEME_OVERLAYS[theme] || THEME_OVERLAYS.default;

    let styleEl = document.getElementById("sanniveshamThemeBgStyle");
    if (!styleEl && document.head) {
      styleEl = document.createElement("style");
      styleEl.id = "sanniveshamThemeBgStyle";
      document.head.appendChild(styleEl);
    }

    if (!url) {
      if (styleEl) styleEl.textContent = "";
      const bg = document.querySelector(".home-bg");
      if (bg) bg.style.backgroundImage = "";
      return;
    }

    if (styleEl) {
      styleEl.textContent = `
        html[data-theme="${theme}"] .home-bg,
        body[data-theme="${theme}"] .home-bg {
          background-image: ${overlay}, url("${url}") !important;
        }
      `;
    }

    const bg = document.querySelector(".home-bg");
    if (bg) {
      bg.style.backgroundImage = `${overlay}, url("${url}")`;
    }
  }

  function setTheme(theme) {
    const validThemes = ["default", "ramayanam", "mahabharatam", "light", "dark"];
    if (!validThemes.includes(theme)) theme = DEFAULT_THEME;

    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(EXPLICIT_FLAG, "true");
    document.documentElement.setAttribute("data-theme", theme);
    if (document.body) document.body.setAttribute("data-theme", theme);

    updateThemeActiveCards(theme);
    applyThemeBackground(theme);

    window.dispatchEvent(new CustomEvent("sannivesham_theme_changed", { detail: { theme } }));
  }

  function resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPLICIT_FLAG);
    setTheme(DEFAULT_THEME);
  }

  function updateThemeActiveCards(currentTheme) {
    document.querySelectorAll(".theme-card-option").forEach((card) => {
      if (card.dataset.themeChoice === currentTheme) {
        card.classList.add("active-theme");
      } else {
        card.classList.remove("active-theme");
      }
    });
  }

  function renderThemeList() {
    const listEl = document.getElementById("themeList");
    if (!listEl) return;

    const current = getTheme();
    listEl.innerHTML = THEMES_CONFIG.map((t) => `
      <div class="theme-card-option ${t.id === current ? "active-theme" : ""}" data-theme-choice="${t.id}">
        <div class="theme-card-icon">${t.icon}</div>
        <div class="theme-card-name" data-en="${t.nameEn}">${t.nameTe}</div>
        <div class="theme-card-desc" data-en="${t.descEn}">${t.descTe}</div>
        <div class="theme-preview-dots">
          ${t.dots.map((d) => `<span class="theme-dot" style="background:${d};"></span>`).join("")}
        </div>
      </div>
    `).join("") + `
      <div style="grid-column: 1 / -1; margin-top: 10px;">
        <button type="button" class="theme-reset-default-btn" id="themeResetDefaultBtn" data-en="Keep Default Theme">
          🪔 సహజ శైలిని ఉంచుకోండి (Keep Default Theme)
        </button>
      </div>
    `;

    listEl.querySelectorAll(".theme-card-option").forEach((card) => {
      card.addEventListener("click", () => {
        const choice = card.dataset.themeChoice;
        if (choice) {
          setTheme(choice);
          setTimeout(closeThemeModal, 250);
        }
      });
    });

    const resetBtn = listEl.querySelector("#themeResetDefaultBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        resetToDefault();
        setTimeout(closeThemeModal, 250);
      });
    }
  }

  function openThemeModal() {
    const modal = document.getElementById("themeModal");
    if (modal) {
      modal.style.display = "flex";
      renderThemeList();
      updateThemeActiveCards(getTheme());
    }
  }

  function closeThemeModal() {
    const modal = document.getElementById("themeModal");
    if (modal) modal.style.display = "none";
  }

  // Immediate execution to prevent Flash of Unstyled Content (FOUC)
  const initialTheme = getTheme();
  document.documentElement.setAttribute("data-theme", initialTheme);
  applyThemeBackground(initialTheme);

  function init() {
    if (document.body) document.body.setAttribute("data-theme", getTheme());
    applyThemeBackground(getTheme());

    // Theme toggle button in navbar
    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openThemeModal();
      });
    }

    // Modal close button
    const closeBtn = document.getElementById("themeCloseBtn") || document.getElementById("themeModalClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeThemeModal);
    }

    // Modal backdrop click
    const modal = document.getElementById("themeModal");
    const backdrop = document.getElementById("themeModalBackdrop");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target === backdrop) closeThemeModal();
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", closeThemeModal);
    }

    // Theme selection cards in static HTML
    document.querySelectorAll(".theme-card-option").forEach((card) => {
      card.addEventListener("click", () => {
        const chosen = card.dataset.themeChoice;
        if (chosen) {
          setTheme(chosen);
          setTimeout(closeThemeModal, 250);
        }
      });
    });

    // Reset default button if present in static HTML
    const pageResetBtn = document.getElementById("themeResetDefaultBtn");
    if (pageResetBtn) {
      pageResetBtn.addEventListener("click", () => {
        resetToDefault();
        setTimeout(closeThemeModal, 250);
      });
    }

    // Themes are strictly OPTIONAL - No auto-open modal popup on landing
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", () => {
    applyThemeBackground(getTheme());
  });

  // Auto-dismiss creative preloader gracefully
  function dismissLoader() {
    const loader = document.getElementById("loader") || document.querySelector(".creative-loader");
    if (loader && !loader.classList.contains("loader-hidden")) {
      loader.classList.add("loader-hidden");
      setTimeout(() => {
        loader.style.display = "none";
      }, 650);
    }
  }

  if (document.readyState === "complete") {
    setTimeout(dismissLoader, 350);
  } else {
    window.addEventListener("load", () => {
      setTimeout(dismissLoader, 350);
    });
  }
  setTimeout(dismissLoader, 1200);

  function resolveBackground(data, sectionKey) {
    if (!data) return { pc: "", mobile: "", chosen: "" };
    const theme = getTheme();
    const isMobile = window.innerWidth <= 700;

    const themeObj = (data.themes && data.themes[theme]) || data[theme] || {};

    let pcUrl = themeObj[sectionKey + "Pc"] || "";
    let mobileUrl = themeObj[sectionKey + "Mobile"] || "";

    if (sectionKey === "home") {
      if (!pcUrl) pcUrl = themeObj.pc || "";
      if (!mobileUrl) mobileUrl = themeObj.mobile || "";
    }

    if (sectionKey !== "home") {
      if (!pcUrl) pcUrl = data[sectionKey + "Pc"] || "";
      if (!mobileUrl) mobileUrl = data[sectionKey + "Mobile"] || "";
    }

    const chosen = (isMobile && mobileUrl) ? mobileUrl : (pcUrl || mobileUrl || "");

    return { pc: pcUrl, mobile: mobileUrl, chosen };
  }

  function resolveHomeCard(data, cardKey) {
    if (!data) return "";
    const theme = getTheme();
    const themeCards = (data.themes && data.themes[theme]) || {};
    return themeCards[cardKey] || data[cardKey] || "";
  }

  window.SanniveshamTheme = {
    getTheme,
    setTheme,
    resetToDefault,
    renderThemeList,
    hasUserChosenTheme,
    openThemeModal,
    closeThemeModal,
    applyThemeBackground,
    resolveBackground,
    resolveHomeCard
  };
})();
