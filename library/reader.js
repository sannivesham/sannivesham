// =========================================================
// సన్నివేశం దివ్య పఠనానుభవం (Sacred Reader Engine)
// =========================================================

export class SacredReader {
  constructor(options = {}) {
    this.type = options.type || "library"; // 'library' | 'temple' | 'festival'
    this.container = options.container || document.getElementById("readerCard");
    this.title = options.title || "";
    this.audioUrl = options.audioUrl || null;
    this.availableThemes = ["theme-night", "theme-parchment", "theme-oled"];
    this.currentTheme = localStorage.getItem("sannivesham_reader_theme") || "theme-night";
    this.fontSize = parseInt(localStorage.getItem("sannivesham_reader_font_size"), 10) || 21;
    this.audioEl = null;

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.applyFontSize(this.fontSize);
    this.initProgressBar();
    this.initToolbarEvents();
    if (this.audioUrl) {
      this.initAudioBar(this.audioUrl);
    }
  }

  // Apply Theme
  applyTheme(themeName) {
    document.body.classList.remove(...this.availableThemes);
    if (!this.availableThemes.includes(themeName)) {
      themeName = "theme-night";
    }
    document.body.classList.add(themeName);
    this.currentTheme = themeName;
    localStorage.setItem("sannivesham_reader_theme", themeName);

    // Update active theme button indicator if present
    document.querySelectorAll("[data-reader-theme]").forEach(btn => {
      btn.classList.toggle("reader-btn-active", btn.dataset.readerTheme === themeName);
    });
  }

  // Cycle to next theme
  cycleTheme() {
    const currentIndex = this.availableThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    this.applyTheme(this.availableThemes[nextIndex]);
    const labels = {
      "theme-night": "రాచరిక రాత్రి (Temple Gold)",
      "theme-parchment": "తాళపత్ర గ్రంథం (Parchment)",
      "theme-oled": "ఓలెడ్ బ్లాక్ (OLED)"
    };
    this.showToast(`🎨 థీమ్: ${labels[this.availableThemes[nextIndex]]}`);
  }

  // Font Size Adjuster
  applyFontSize(size) {
    size = Math.max(16, Math.min(34, size));
    this.fontSize = size;
    document.documentElement.style.setProperty("--reader-font-size", `${size}px`);
    localStorage.setItem("sannivesham_reader_font_size", size);
    const sizeIndicator = document.getElementById("fontSizeDisplay");
    if (sizeIndicator) sizeIndicator.innerText = `${size}px`;
  }

  increaseFontSize() {
    this.applyFontSize(this.fontSize + 2);
    this.showToast(`🔤 అక్షరాల పరిమాణం: ${this.fontSize}px`);
  }

  decreaseFontSize() {
    this.applyFontSize(this.fontSize - 2);
    this.showToast(`🔤 అక్షరాల పరిమాణం: ${this.fontSize}px`);
  }

  // Reading Progress Bar
  initProgressBar() {
    const bar = document.getElementById("readingProgressBar");
    if (!bar) return;

    window.addEventListener("scroll", () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
        bar.style.width = `${progress}%`;
      }
    }, { passive: true });
  }

  // Focus / Dhyana Mode
  toggleFocusMode() {
    const isFocus = document.body.classList.toggle("reader-focus-mode");
    const navbars = document.querySelectorAll(".glass-navbar, footer, .simple-footer, #bgMusic, #musicBtn");
    navbars.forEach(el => {
      el.style.display = isFocus ? "none" : "";
    });
    this.showToast(isFocus ? "🧘 ధ్యాన పఠనం (Focus Mode) ఆన్" : "ధ్యాన పఠనం ఆఫ్");
  }

  // Copy Verses to Clipboard
  copyContent() {
    const verseContent = document.querySelector(".reader-verses") || this.container;
    if (!verseContent) return;
    const textToCopy = verseContent.innerText.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.showToast("✓ వచనం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!");
    }).catch(() => {
      this.showToast("కాపీ చేయడం వీలుపడలేదు");
    });
  }

  // WhatsApp Share
  shareWhatsApp(title, canonicalUrl) {
    const pageTitle = title || document.title || "సన్నివేశం గ్రంథాలయం";
    const url = canonicalUrl || window.location.href;
    const shareText = `✨ *${pageTitle}* ✨\n\nభారతీయ సనాతన ధర్మ గ్రంథాలు మరియు స్తోత్రాలు ఇక్కడ చదవండి:\n🔗 ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  }

  // Toast notification
  showToast(message) {
    let toast = document.getElementById("readerToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "readerToast";
      toast.className = "reader-toast";
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add("toast-show");
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove("toast-show");
    }, 2400);
  }

  // Devotional Audio Player Bar
  initAudioBar(audioUrl) {
    if (!audioUrl) return;
    let audioBar = document.getElementById("readerAudioBar");
    if (!audioBar) {
      audioBar = document.createElement("div");
      audioBar.id = "readerAudioBar";
      audioBar.className = "reader-audio-bar";
      audioBar.innerHTML = `
        <div class="audio-track-info">
          <span>🔊</span>
          <span class="audio-track-title">${this.title || "స్తోత్ర పారాయణం"}</span>
        </div>
        <div class="audio-controls">
          <button id="readerAudioPlayBtn" class="audio-play-btn" title="ప్లే / పాజ్">▶</button>
          <div class="audio-slider-wrap">
            <span id="audioCurrentTime" class="audio-time">0:00</span>
            <input type="range" id="readerAudioSlider" class="audio-slider" min="0" max="100" value="0">
            <span id="audioDuration" class="audio-time">0:00</span>
          </div>
          <button id="readerAudioSpeedBtn" class="audio-speed-btn" title="వేగం">1.0x</button>
        </div>
      `;
      document.body.appendChild(audioBar);
    }

    this.audioEl = new Audio(audioUrl);
    const playBtn = document.getElementById("readerAudioPlayBtn");
    const slider = document.getElementById("readerAudioSlider");
    const currentTimeEl = document.getElementById("audioCurrentTime");
    const durationEl = document.getElementById("audioDuration");
    const speedBtn = document.getElementById("readerAudioSpeedBtn");

    const formatTime = (secs) => {
      if (isNaN(secs)) return "0:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    playBtn.onclick = () => {
      if (this.audioEl.paused) {
        this.audioEl.play();
        playBtn.innerText = "⏸";
      } else {
        this.audioEl.pause();
        playBtn.innerText = "▶";
      }
    };

    this.audioEl.ontimeupdate = () => {
      if (this.audioEl.duration) {
        slider.value = (this.audioEl.currentTime / this.audioEl.duration) * 100;
        currentTimeEl.innerText = formatTime(this.audioEl.currentTime);
      }
    };

    this.audioEl.onloadedmetadata = () => {
      durationEl.innerText = formatTime(this.audioEl.duration);
    };

    this.audioEl.onended = () => {
      playBtn.innerText = "▶";
      slider.value = 0;
    };

    slider.oninput = () => {
      if (this.audioEl.duration) {
        this.audioEl.currentTime = (slider.value / 100) * this.audioEl.duration;
      }
    };

    const speeds = [0.75, 1.0, 1.25, 1.5];
    let speedIndex = 1;
    speedBtn.onclick = () => {
      speedIndex = (speedIndex + 1) % speeds.length;
      const newSpeed = speeds[speedIndex];
      this.audioEl.playbackRate = newSpeed;
      speedBtn.innerText = `${newSpeed}x`;
      this.showToast(`ఆడియో వేగం: ${newSpeed}x`);
    };
  }

  // Setup button event listeners
  initToolbarEvents() {
    const fontPlusBtn = document.getElementById("fontPlusBtn");
    const fontMinusBtn = document.getElementById("fontMinusBtn");
    const themeCycleBtn = document.getElementById("themeCycleBtn");
    const focusModeBtn = document.getElementById("focusModeBtn");
    const copyContentBtn = document.getElementById("copyContentBtn");
    const shareWhatsAppBtn = document.getElementById("shareWhatsAppBtn");

    if (fontPlusBtn) fontPlusBtn.onclick = () => this.increaseFontSize();
    if (fontMinusBtn) fontMinusBtn.onclick = () => this.decreaseFontSize();
    if (themeCycleBtn) themeCycleBtn.onclick = () => this.cycleTheme();
    if (focusModeBtn) focusModeBtn.onclick = () => this.toggleFocusMode();
    if (copyContentBtn) copyContentBtn.onclick = () => this.copyContent();
    if (shareWhatsAppBtn) shareWhatsAppBtn.onclick = () => this.shareWhatsApp(this.title);
  }

  // Dynamic SEO Meta Tag Inserter
  static injectSEO({ title, description, imageUrl, canonicalUrl, type = "article" }) {
    if (title) {
      document.title = `${title} - సన్నివేశం | Sannivesham`;
    }

    const setMeta = (name, content, attr = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description || `${title} - తెలుగు సాహిత్యం, స్తోత్రాలు మరియు సమగ్ర వివరణ.`);
    setMeta("og:title", title, "property");
    setMeta("og:description", description || `${title} - తెలుగులో చదవండి.`, "property");
    setMeta("og:type", type, "property");
    if (canonicalUrl) {
      setMeta("og:url", canonicalUrl, "property");
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonicalUrl);
    }
    if (imageUrl) {
      setMeta("og:image", imageUrl, "property");
      setMeta("twitter:image", imageUrl);
      setMeta("twitter:card", "summary_large_image");
    }

    // JSON-LD Structured Data
    let scriptLd = document.getElementById("jsonLdScript");
    if (!scriptLd) {
      scriptLd = document.createElement("script");
      scriptLd.id = "jsonLdScript";
      scriptLd.type = "application/ld+json";
      document.head.appendChild(scriptLd);
    }
    const schemaData = {
      "@context": "https://schema.org",
      "@type": type === "temple" ? "HinduTemple" : type === "festival" ? "Festival" : "Article",
      "headline": title,
      "name": title,
      "description": description,
      "inLanguage": "te",
      "publisher": {
        "@type": "Organization",
        "name": "సన్నివేశం",
        "url": "https://sannivesham.com"
      }
    };
    if (imageUrl) schemaData.image = [imageUrl];
    if (canonicalUrl) schemaData.url = canonicalUrl;
    scriptLd.textContent = JSON.stringify(schemaData);
  }
}
