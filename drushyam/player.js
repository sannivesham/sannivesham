/* DRUSHYAM UNIVERSAL NETFLIX-TIER PLAYER CONTROLLER */

export class DrushyamPlayer {
  constructor(options = {}) {
    this.stage = document.getElementById("playerStage");
    this.nativeVideo = document.getElementById("nativeVideo");
    this.ytContainer = document.getElementById("ytContainer");
    this.thumbEl = document.getElementById("playerThumb");
    this.spinnerEl = document.getElementById("videoSpinner");
    this.bigPlay = document.getElementById("bigPlay");
    this.bigPlayBtn = document.getElementById("bigPlayBtn");
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.skipBackBtn = document.getElementById("skipBackBtn");
    this.skipFwdBtn = document.getElementById("skipFwdBtn");
    this.progressWrap = document.getElementById("progressWrap");
    this.progressBar = document.getElementById("progressBar");
    this.progressBuffered = document.getElementById("progressBuffered");
    this.progressTooltip = document.getElementById("progressTooltip");
    this.timeDisplay = document.getElementById("timeDisplay");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.muteBtn = document.getElementById("muteBtn");
    this.speedBtn = document.getElementById("speedBtn");
    this.speedDropdown = document.getElementById("speedDropdown");
    this.pipBtn = document.getElementById("pipBtn");
    this.fullscreenBtn = document.getElementById("fullscreenBtn");
    this.skipLeftFlash = document.getElementById("skipLeft");
    this.skipRightFlash = document.getElementById("skipRight");
    this.tapLeft = document.getElementById("tapLeft");
    this.tapRight = document.getElementById("tapRight");
    this.resumeToast = document.getElementById("resumeToast");

    this.mode = null; // 'direct' | 'youtube'
    this.ytPlayer = null;
    this.ytReady = false;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.85;
    this.currentRate = 1.0;
    this.videoId = options.videoId || "";
    this.progressInterval = null;
    this.controlsTimeout = null;
    this.isScrubbing = false;

    this.initEvents();
  }

  initEvents() {
    // Big Center Play
    if (this.bigPlayBtn) {
      this.bigPlayBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    // Play/Pause Button
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    // 10s Skip Buttons
    if (this.skipBackBtn) {
      this.skipBackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.skip(-10);
      });
    }
    if (this.skipFwdBtn) {
      this.skipFwdBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.skip(10);
      });
    }

    // Double-tap zones
    let lastTapLeft = 0;
    if (this.tapLeft) {
      this.tapLeft.addEventListener("click", (e) => {
        const now = Date.now();
        if (now - lastTapLeft < 320) {
          this.skip(-10);
          lastTapLeft = 0;
        } else {
          lastTapLeft = now;
        }
      });
    }

    let lastTapRight = 0;
    if (this.tapRight) {
      this.tapRight.addEventListener("click", (e) => {
        const now = Date.now();
        if (now - lastTapRight < 320) {
          this.skip(10);
          lastTapRight = 0;
        } else {
          lastTapRight = now;
        }
      });
    }

    // Timeline Scrubber & Tooltip
    if (this.progressWrap) {
      this.progressWrap.addEventListener("click", (e) => {
        e.stopPropagation();
        const rect = this.progressWrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = this.getDuration();
        if (dur > 0) {
          this.seekTo(pct * dur);
        }
      });

      this.progressWrap.addEventListener("mousemove", (e) => {
        if (!this.progressTooltip) return;
        const rect = this.progressWrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const dur = this.getDuration();
        if (dur > 0) {
          const hoverSec = pct * dur;
          this.progressTooltip.style.display = "block";
          this.progressTooltip.style.left = `${pct * 100}%`;
          this.progressTooltip.innerText = this.formatTime(hoverSec);
        }
      });

      this.progressWrap.addEventListener("mouseleave", () => {
        if (this.progressTooltip) this.progressTooltip.style.display = "none";
      });
    }

    // Volume Slider & Mute
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        this.setVolume(Number(e.target.value) / 100);
      });
    }

    if (this.muteBtn) {
      this.muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleMute();
      });
    }

    // Speed Selector
    if (this.speedBtn && this.speedDropdown) {
      this.speedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.speedDropdown.classList.toggle("show");
      });

      document.addEventListener("click", () => {
        this.speedDropdown.classList.remove("show");
      });

      this.speedDropdown.querySelectorAll(".speed-opt").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const rate = parseFloat(btn.dataset.rate) || 1.0;
          this.setPlaybackRate(rate);
          this.speedDropdown.classList.remove("show");
        });
      });
    }

    // Picture-in-Picture
    if (this.pipBtn) {
      this.pipBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (this.nativeVideo && this.mode === "direct") {
            await this.nativeVideo.requestPictureInPicture();
          }
        } catch (err) {
          console.warn("PiP not supported or error:", err);
        }
      });
    }

    // Fullscreen
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    // Mouse movement: auto-hide controls
    if (this.stage) {
      this.stage.addEventListener("mousemove", () => this.handleUserActivity());
      this.stage.addEventListener("touchstart", () => this.handleUserActivity(), { passive: true });
    }

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          this.togglePlay();
          break;
        case "ArrowLeft":
        case "KeyJ":
          e.preventDefault();
          this.skip(-10);
          break;
        case "ArrowRight":
        case "KeyL":
          e.preventDefault();
          this.skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.setVolume(Math.min(1, this.volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          this.setVolume(Math.max(0, this.volume - 0.1));
          break;
        case "KeyF":
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          this.toggleMute();
          break;
      }
    });

    // Native Video Engine Events
    if (this.nativeVideo) {
      this.nativeVideo.addEventListener("waiting", () => this.showSpinner(true));
      this.nativeVideo.addEventListener("canplay", () => this.showSpinner(false));
      this.nativeVideo.addEventListener("playing", () => {
        this.showSpinner(false);
        this.onStatePlaying();
      });
      this.nativeVideo.addEventListener("pause", () => this.onStatePaused());
      this.nativeVideo.addEventListener("ended", () => this.onStateEnded());
      this.nativeVideo.addEventListener("timeupdate", () => this.updateProgress());
      this.nativeVideo.addEventListener("progress", () => this.updateBuffered());
    }
  }

  loadSource(videoData) {
    this.videoData = videoData;
    const directUrl = videoData.videoUrl || videoData.streamUrl || "";
    const ytIdOrUrl = videoData.youtubeId || "";

    // Determine engine mode:
    // If explicit sourceType === 'direct' OR if videoUrl has mp4/m3u8/webm/archive.org
    const isDirect = (videoData.sourceType === "direct" && directUrl) ||
      (/\.(mp4|webm|m3u8|mov)(\?.*)?$/i.test(directUrl)) ||
      (directUrl && directUrl.includes("archive.org/download"));

    if (isDirect) {
      this.mode = "direct";
      this.setupDirectEngine(directUrl);
    } else {
      this.mode = "youtube";
      const cleanYtId = this.extractYoutubeId(ytIdOrUrl || directUrl);
      this.setupYouTubeEngine(cleanYtId);
    }
  }

  setupDirectEngine(url) {
    if (this.ytContainer) this.ytContainer.style.display = "none";
    if (this.nativeVideo) {
      this.nativeVideo.style.display = "block";
      this.nativeVideo.src = url;
      this.nativeVideo.volume = this.volume;
      this.nativeVideo.playbackRate = this.currentRate;
      this.showSpinner(false);
      this.checkResumePlayback();
    }
  }

  setupYouTubeEngine(ytId) {
    if (this.nativeVideo) {
      this.nativeVideo.pause();
      this.nativeVideo.style.display = "none";
    }
    if (this.ytContainer) this.ytContainer.style.display = "block";

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => this.initYouTubePlayer(ytId);
    } else {
      this.initYouTubePlayer(ytId);
    }
  }

  initYouTubePlayer(ytId) {
    if (this.ytPlayer) {
      this.ytPlayer.cueVideoById(ytId);
      this.ytReady = true;
      this.checkResumePlayback();
      return;
    }

    this.ytPlayer = new YT.Player("ytPlayer", {
      videoId: ytId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1,
        autoplay: 0
      },
      events: {
        onReady: (e) => {
          this.ytReady = true;
          e.target.setVolume(Math.round(this.volume * 100));
          this.showSpinner(false);
          this.checkResumePlayback();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.BUFFERING) {
            this.showSpinner(true);
          } else {
            this.showSpinner(false);
          }

          if (e.data === YT.PlayerState.PLAYING) {
            this.onStatePlaying();
          } else if (e.data === YT.PlayerState.PAUSED) {
            this.onStatePaused();
          } else if (e.data === YT.PlayerState.ENDED) {
            this.onStateEnded();
          }
        },
        onError: () => {
          this.showSpinner(false);
          alert("ఈ వీడియోను ప్లే చేయడంలో సమస్య తలెత్తింది (YouTube restrictions).");
        }
      }
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.mode === "direct" && this.nativeVideo) {
      this.nativeVideo.play().catch(e => console.warn(e));
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      this.ytPlayer.playVideo();
    }
  }

  pause() {
    if (this.mode === "direct" && this.nativeVideo) {
      this.nativeVideo.pause();
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      this.ytPlayer.pauseVideo();
    }
  }

  onStatePlaying() {
    this.isPlaying = true;
    if (this.playPauseBtn) this.playPauseBtn.innerText = "⏸";
    if (this.bigPlay) this.bigPlay.classList.add("hide");
    if (this.thumbEl) this.thumbEl.classList.add("hide");
    this.startProgressPolling();
    this.handleUserActivity();
  }

  onStatePaused() {
    this.isPlaying = false;
    if (this.playPauseBtn) this.playPauseBtn.innerText = "▶";
    if (this.bigPlay) this.bigPlay.classList.remove("hide");
    this.stopProgressPolling();
    this.handleUserActivity(true);
  }

  onStateEnded() {
    this.isPlaying = false;
    if (this.playPauseBtn) this.playPauseBtn.innerText = "↺";
    if (this.bigPlay) this.bigPlay.classList.remove("hide");
    if (this.bigPlayBtn) this.bigPlayBtn.innerText = "↺";
    this.stopProgressPolling();
    this.handleUserActivity(true);

    if (this.videoId) {
      localStorage.removeItem(`drushyam_pos_${this.videoId}`);
    }
  }

  skip(secs) {
    const cur = this.getCurrentTime();
    const dur = this.getDuration();
    const target = Math.max(0, Math.min(dur || 999999, cur + secs));
    this.seekTo(target);

    // Visual Flash Feedback
    const el = secs > 0 ? this.skipRightFlash : this.skipLeftFlash;
    if (el) {
      el.innerText = secs > 0 ? `${secs}s ⏩` : `⏪ ${Math.abs(secs)}s`;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 700);
    }
  }

  seekTo(seconds) {
    if (this.mode === "direct" && this.nativeVideo) {
      this.nativeVideo.currentTime = seconds;
      this.updateProgress();
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      this.ytPlayer.seekTo(seconds, true);
      this.updateProgress();
    }
  }

  getCurrentTime() {
    if (this.mode === "direct" && this.nativeVideo) {
      return this.nativeVideo.currentTime || 0;
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      return this.ytPlayer.getCurrentTime() || 0;
    }
    return 0;
  }

  getDuration() {
    if (this.mode === "direct" && this.nativeVideo) {
      return this.nativeVideo.duration || 0;
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      return this.ytPlayer.getDuration() || 0;
    }
    return 0;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.volumeSlider) this.volumeSlider.value = Math.round(this.volume * 100);

    if (this.volume === 0) {
      this.isMuted = true;
      if (this.muteBtn) this.muteBtn.innerText = "🔇";
    } else {
      this.isMuted = false;
      if (this.muteBtn) this.muteBtn.innerText = "🔊";
    }

    if (this.mode === "direct" && this.nativeVideo) {
      this.nativeVideo.volume = this.volume;
      this.nativeVideo.muted = this.isMuted;
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      this.ytPlayer.setVolume(Math.round(this.volume * 100));
      if (this.isMuted) this.ytPlayer.mute(); else this.ytPlayer.unMute();
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.volume || 0.85);
    } else {
      this.isMuted = true;
      if (this.muteBtn) this.muteBtn.innerText = "🔇";
      if (this.mode === "direct" && this.nativeVideo) {
        this.nativeVideo.muted = true;
      } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
        this.ytPlayer.mute();
      }
    }
  }

  setPlaybackRate(rate) {
    this.currentRate = rate;
    if (this.speedBtn) {
      this.speedBtn.innerText = `${rate}x ⚙️`;
    }
    if (this.speedDropdown) {
      this.speedDropdown.querySelectorAll(".speed-opt").forEach(btn => {
        btn.classList.toggle("active", parseFloat(btn.dataset.rate) === rate);
      });
    }

    if (this.mode === "direct" && this.nativeVideo) {
      this.nativeVideo.playbackRate = rate;
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      this.ytPlayer.setPlaybackRate(rate);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (this.stage.requestFullscreen) {
        this.stage.requestFullscreen();
      } else if (this.stage.webkitRequestFullscreen) {
        this.stage.webkitRequestFullscreen();
      }
      if (this.fullscreenBtn) this.fullscreenBtn.innerText = "⊡";
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      if (this.fullscreenBtn) this.fullscreenBtn.innerText = "⛶";
    }
  }

  startProgressPolling() {
    this.stopProgressPolling();
    this.progressInterval = setInterval(() => {
      this.updateProgress();
      this.updateBuffered();

      // Save watch position every 3 seconds
      const cur = this.getCurrentTime();
      if (this.videoId && cur > 5) {
        localStorage.setItem(`drushyam_pos_${this.videoId}`, Math.floor(cur));
      }
    }, 400);
  }

  stopProgressPolling() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  updateProgress() {
    const cur = this.getCurrentTime();
    const dur = this.getDuration();
    if (dur > 0 && this.progressBar) {
      const pct = (cur / dur) * 100;
      this.progressBar.style.width = `${pct}%`;
    }
    if (this.timeDisplay) {
      this.timeDisplay.innerHTML = `<span class="time-current">${this.formatTime(cur)}</span> / ${this.formatTime(dur)}`;
    }
  }

  updateBuffered() {
    if (!this.progressBuffered) return;
    const dur = this.getDuration();
    if (dur <= 0) return;

    if (this.mode === "direct" && this.nativeVideo && this.nativeVideo.buffered.length > 0) {
      const bufferedEnd = this.nativeVideo.buffered.end(this.nativeVideo.buffered.length - 1);
      this.progressBuffered.style.width = `${(bufferedEnd / dur) * 100}%`;
    } else if (this.mode === "youtube" && this.ytPlayer && this.ytReady) {
      const frac = this.ytPlayer.getVideoLoadedFraction() || 0;
      this.progressBuffered.style.width = `${frac * 100}%`;
    }
  }

  checkResumePlayback() {
    if (!this.videoId) return;
    const saved = localStorage.getItem(`drushyam_pos_${this.videoId}`);
    if (saved) {
      const sec = parseInt(saved, 10);
      if (sec > 10) {
        setTimeout(() => {
          this.seekTo(sec);
          if (this.resumeToast) {
            this.resumeToast.innerText = `⏱️ గతంలో ఆపిన చోటు నుండి (${this.formatTime(sec)}) పునఃప్రారంభించబడింది`;
            this.resumeToast.classList.add("show");
            setTimeout(() => this.resumeToast.classList.remove("show"), 3500);
          }
        }, 600);
      }
    }
  }

  handleUserActivity(forceKeep = false) {
    if (!this.stage) return;
    this.stage.classList.remove("hide-controls");
    clearTimeout(this.controlsTimeout);

    if (this.isPlaying && !forceKeep) {
      this.controlsTimeout = setTimeout(() => {
        if (this.isPlaying) {
          this.stage.classList.add("hide-controls");
        }
      }, 3000);
    }
  }

  showSpinner(show) {
    if (this.spinnerEl) {
      this.spinnerEl.classList.toggle("show", show);
    }
  }

  formatTime(secs) {
    if (isNaN(secs) || secs < 0) secs = 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n) => String(n).padStart(2, "0");

    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${m}:${pad(s)}`;
  }

  extractYoutubeId(input) {
    if (!input) return "";
    input = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
      const m = input.match(p);
      if (m) return m[1];
    }
    try {
      const url = new URL(input);
      const v = url.searchParams.get("v");
      if (v) return v;
    } catch (e) {}
    const bare = input.split(/[?&#\s]/)[0];
    if (/^[a-zA-Z0-9_-]{11}$/.test(bare)) return bare;
    return input;
  }
}
