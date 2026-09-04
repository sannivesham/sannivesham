// Sannivesham Multi-Theme Engine
// Supported Themes: 'ramayanam', 'mahabharatam', 'light', 'dark'

(function () {
  const STORAGE_KEY = "sannivesham_theme";
  const DEFAULT_THEME = "ramayanam";

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }

  function hasUserChosenTheme() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function setTheme(theme) {
    const validThemes = ["ramayanam", "mahabharatam", "light", "dark"];
    if (!validThemes.includes(theme)) theme = DEFAULT_THEME;

    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (document.body) document.body.setAttribute("data-theme", theme);

    updateThemeActiveCards(theme);

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

  function init() {
    if (document.body) document.body.setAttribute("data-theme", getTheme());

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

  window.SanniveshamTheme = {
    getTheme,
    setTheme,
    hasUserChosenTheme,
    openThemeModal,
    closeThemeModal
  };
})();
