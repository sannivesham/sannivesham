// Sannivesham Multi-Theme Engine
// Supported Themes: 'ramayanam', 'mahabharatam', 'light', 'dark'

(function () {
  const STORAGE_KEY = "sannivesham_theme";
  const THEME_BG_STORAGE_KEY = "sannivesham_theme_bg_cache";
  const DEFAULT_THEME = "ramayanam";

  const THEME_OVERLAYS = {
    ramayanam: "linear-gradient(rgba(38,14,4,0.65),rgba(22,7,2,0.72))",
    mahabharatam: "linear-gradient(rgba(4,14,32,0.68),rgba(2,8,20,0.75))",
    light: "linear-gradient(rgba(255,250,242,0.85),rgba(255,248,235,0.88))",
    dark: "linear-gradient(rgba(10,5,0,0.70),rgba(10,5,0,0.78))"
  };

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
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
    const validThemes = ["ramayanam", "mahabharatam", "light", "dark"];
    if (!validThemes.includes(theme)) theme = DEFAULT_THEME;

    const url = customUrl !== undefined ? customUrl : getCachedThemeBgUrl(theme);
    const overlay = THEME_OVERLAYS[theme] || THEME_OVERLAYS.ramayanam;

    let styleEl = document.getElementById("sanniveshamThemeBgStyle");
    if (!styleEl && document.head) {
      styleEl = document.createElement("style");
      styleEl.id = "sanniveshamThemeBgStyle";
      document.head.appendChild(styleEl);
    }

    if (!url) {
      // No custom image uploaded for this theme -> clear custom style so theme's default in style.css takes over cleanly
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
    const validThemes = ["ramayanam", "mahabharatam", "light", "dark"];
    if (!validThemes.includes(theme)) theme = DEFAULT_THEME;

    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (document.body) document.body.setAttribute("data-theme", theme);

    updateThemeActiveCards(theme);
    applyThemeBackground(theme);

    // Dispatch event so other components (e.g. background loader) can react
    window.dispatchEvent(new CustomEvent("sannivesham_theme_changed", { detail: { theme } }));
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

  function openThemeModal() {
    const modal = document.getElementById("themeModal");
    if (modal) {
      modal.style.display = "flex";
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
    const closeBtn = document.getElementById("themeCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeThemeModal);
    }

    // Modal backdrop click
    const modal = document.getElementById("themeModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeThemeModal();
      });
    }

    // Theme selection cards
    document.querySelectorAll(".theme-card-option").forEach((card) => {
      card.addEventListener("click", () => {
        const chosen = card.dataset.themeChoice;
        if (chosen) {
          setTheme(chosen);
          setTimeout(closeThemeModal, 250);
        }
      });
    });

    // If first visit on home page, prompt theme selector modal
    const isHome =
      window.location.pathname.endsWith("/") ||
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "";

    if (isHome && !hasUserChosenTheme()) {
      setTimeout(() => {
        openThemeModal();
      }, 700);
    }
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
  // Safety timeout: never trap the visitor longer than 1200ms
  setTimeout(dismissLoader, 1200);

  function resolveBackground(data, sectionKey) {
    if (!data) return { pc: "", mobile: "", chosen: "" };
    const theme = getTheme();
    const isMobile = window.innerWidth <= 700;

    const themeObj = (data.themes && data.themes[theme]) || data[theme] || {};

    let pcUrl = themeObj[sectionKey + "Pc"] || "";
    let mobileUrl = themeObj[sectionKey + "Mobile"] || "";

    // Support home section legacy keys
    if (sectionKey === "home") {
      if (!pcUrl) pcUrl = themeObj.pc || "";
      if (!mobileUrl) mobileUrl = themeObj.mobile || "";
    }

    // Fall back to global document level only for non-home sections
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
    hasUserChosenTheme,
    openThemeModal,
    closeThemeModal,
    applyThemeBackground,
    resolveBackground,
    resolveHomeCard
  };
})();
