/**
 * ==============================================================================
 * SANNIVESHAM — CINEMATIC EVENTS & INTERACTIVE SWIPEABLE LIGHTBOX
 * Dynamic Gallery, Shimmer Skeleton, Touch Gestures, Keyboard Navigation & Zoom
 * ==============================================================================
 */

import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Global cache of loaded events for lightbox navigation
const eventsDataStore = {};
let activeGalleryId = null;
let activeImageIndex = 0;
let isZoomed = false;

// Touch swipe variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isTouching = false;
let lastTapTime = 0;

const eventsListContainer = document.querySelector(".events-list");
const statsCountEl = document.getElementById("eventsCountStat");

/**
 * Render Shimmer Skeleton Cards while loading
 */
function renderSkeleton() {
  if (!eventsListContainer) return;
  eventsListContainer.innerHTML = `
    <div class="event-skeleton-box">
      <div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-pill"></div>
        <div class="skeleton-shimmer skeleton-desc-line"></div>
        <div class="skeleton-shimmer skeleton-desc-line" style="width:85%;"></div>
        <div class="skeleton-shimmer skeleton-desc-line" style="width:60%;"></div>
      </div>
      <div class="skeleton-gallery">
        <div class="skeleton-shimmer skeleton-img"></div>
        <div class="skeleton-shimmer skeleton-img"></div>
      </div>
    </div>
    <div class="event-skeleton-box">
      <div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-pill"></div>
        <div class="skeleton-shimmer skeleton-desc-line"></div>
        <div class="skeleton-shimmer skeleton-desc-line" style="width:80%;"></div>
      </div>
      <div class="skeleton-gallery">
        <div class="skeleton-shimmer skeleton-img"></div>
        <div class="skeleton-shimmer skeleton-img"></div>
      </div>
    </div>
  `;
}

/**
 * Fetch and Render Events from Firestore
 */
async function loadEvents() {
  renderSkeleton();

  try {
    const q = query(
      collection(db, "events"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (statsCountEl) statsCountEl.textContent = "0";
      eventsListContainer.innerHTML = `
        <div class="events-empty-state">
          <span class="events-empty-icon">🪔</span>
          <h3>కార్యక్రమాలు త్వరలో చేర్చబడతాయి</h3>
          <p>సన్నివేశం రాబోయే సాంస్కృతిక కార్యక్రమాలు, పాఠశాలల సందర్శనలు మరియు పోటీల వివరాలు త్వరలోనే ఇక్కడ నవీకరించబడతాయి.</p>
        </div>
      `;
      return;
    }

    let count = 0;
    let html = "";

    snapshot.forEach((docSnap) => {
      count++;
      const id = docSnap.id;
      const event = docSnap.data();

      // Normalize images array
      let images = [];
      if (Array.isArray(event.images) && event.images.length > 0) {
        images = event.images.filter(url => typeof url === "string" && url.trim().length > 0);
      } else if (event.image) {
        images = [event.image];
      }

      // Store in memory for lightbox
      eventsDataStore[id] = {
        id,
        title: event.title || "సన్నివేశం కార్యక్రమం",
        location: event.location || "",
        time: event.time || "",
        description: event.description || "",
        images: images
      };

      // Determine smart gallery class
      let countClass = "gallery-count-many";
      if (images.length === 1) countClass = "gallery-count-1";
      else if (images.length === 2) countClass = "gallery-count-2";
      else if (images.length === 3) countClass = "gallery-count-3";
      else if (images.length === 4) countClass = "gallery-count-4";

      // Render gallery thumbnails
      let galleryHTML = "";
      const maxDisplay = 4;
      const displayImages = images.slice(0, maxDisplay);
      const remainingCount = images.length - maxDisplay;

      displayImages.forEach((imgUrl, idx) => {
        const isLastAndMore = idx === maxDisplay - 1 && remainingCount > 0;
        galleryHTML += `
          <div class="gallery-item" data-event-id="${id}" data-img-idx="${idx}" role="button" tabindex="0" aria-label="చిత్రం ${idx + 1} పెద్దదిగా చూడండి">
            <img src="${imgUrl}" alt="${event.title || 'Event photo'} ${idx + 1}" loading="lazy">
            <div class="gallery-item-overlay">
              <span class="gallery-overlay-badge">🔍 పెద్దదిగా చూడండి</span>
            </div>
            ${isLastAndMore ? `
              <div class="gallery-item-more-badge">
                <span class="more-num">+${remainingCount + 1}</span>
                <span class="more-text">చిత్రాలు</span>
              </div>
            ` : ""}
          </div>
        `;
      });

      html += `
        <article class="event-box" style="animation-delay: ${(count - 1) * 0.1}s;">
          <div class="event-text">
            <div class="event-title-wrap">
              <span class="event-title-icon">🪔</span>
              <h2>${event.title || 'కార్యక్రమం'}</h2>
            </div>
            <div class="event-meta">
              ${event.location ? `<span class="event-meta-pill meta-location">📍 ${event.location}</span>` : ""}
              ${event.time ? `<span class="event-meta-pill meta-time">🕒 ${event.time}</span>` : ""}
            </div>
            <p class="event-description">${(event.description || "").replace(/\n/g, "<br>")}</p>
          </div>
          <div class="event-gallery ${countClass}">
            ${galleryHTML}
          </div>
        </article>
      `;
    });

    if (statsCountEl) {
      statsCountEl.textContent = `${count} కార్యక్రమాలు`;
    }

    eventsListContainer.innerHTML = html;
    bindGalleryClicks();

  } catch (error) {
    console.error("Error loading events:", error);
    eventsListContainer.innerHTML = `
      <div class="events-empty-state">
        <span class="events-empty-icon">⚠️</span>
        <h3>కార్యక్రమాలు లోడ్ చేయడంలో లోపం</h3>
        <p>దయచేసి మీ ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.</p>
      </div>
    `;
  }
}

/**
 * Bind Click & Keydown events to all gallery items
 */
function bindGalleryClicks() {
  document.querySelectorAll(".gallery-item").forEach((item) => {
    const handleOpen = (e) => {
      e.preventDefault();
      const eventId = item.dataset.eventId;
      const idx = parseInt(item.dataset.imgIdx, 10) || 0;
      openLightbox(eventId, idx);
    };

    item.addEventListener("click", handleOpen);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handleOpen(e);
    });
  });
}

/**
 * ==============================================================================
 * CINEMATIC LIGHTBOX CONTROLLER
 * ==============================================================================
 */
const lightbox = document.getElementById("eventLightboxModal");
const lightboxImg = document.getElementById("lightboxMainImg");
const lightboxTitle = document.getElementById("lightboxEventTitle");
const lightboxCounter = document.getElementById("lightboxCounter");
const lightboxThumbsContainer = document.getElementById("lightboxThumbsList");
const lightboxImgWrap = document.getElementById("lightboxImgWrap");
const btnPrev = document.getElementById("lightboxPrevBtn");
const btnNext = document.getElementById("lightboxNextBtn");
const btnClose = document.getElementById("lightboxCloseBtn");
const btnZoom = document.getElementById("lightboxZoomBtn");

function openLightbox(eventId, index = 0) {
  const event = eventsDataStore[eventId];
  if (!event || !event.images || event.images.length === 0) return;

  activeGalleryId = eventId;
  activeImageIndex = Math.max(0, Math.min(index, event.images.length - 1));
  isZoomed = false;

  if (lightbox) {
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  updateLightboxView();
  renderThumbnails();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  document.body.style.overflow = "";
  if (lightboxImgWrap) {
    lightboxImgWrap.style.transform = "scale(1)";
  }
  isZoomed = false;
  activeGalleryId = null;
}

function updateLightboxView(direction = 0) {
  const event = eventsDataStore[activeGalleryId];
  if (!event) return;

  const currentUrl = event.images[activeImageIndex];
  const total = event.images.length;

  if (lightboxTitle) lightboxTitle.textContent = event.title;
  if (lightboxCounter) lightboxCounter.textContent = `${activeImageIndex + 1} / ${total}`;

  if (lightboxImg) {
    // Smooth fade/slide animation on image switch
    lightboxImg.style.opacity = "0";
    lightboxImg.style.transform = direction === 1 
      ? "translateX(30px) scale(0.96)" 
      : direction === -1 
      ? "translateX(-30px) scale(0.96)" 
      : "scale(0.96)";

    const tempImg = new Image();
    tempImg.onload = () => {
      lightboxImg.src = currentUrl;
      lightboxImg.style.transition = "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      lightboxImg.style.opacity = "1";
      lightboxImg.style.transform = "translateX(0) scale(1)";
    };
    tempImg.src = currentUrl;
  }

  // Reset zoom state
  isZoomed = false;
  if (lightboxImgWrap) {
    lightboxImgWrap.style.transform = "scale(1)";
  }

  // Hide arrows if only 1 image
  if (btnPrev) btnPrev.style.display = total > 1 ? "flex" : "none";
  if (btnNext) btnNext.style.display = total > 1 ? "flex" : "none";

  // Highlight active thumbnail
  updateActiveThumbnail();
}

function nextImage() {
  const event = eventsDataStore[activeGalleryId];
  if (!event || event.images.length <= 1) return;
  activeImageIndex = (activeImageIndex + 1) % event.images.length;
  updateLightboxView(1);
}

function prevImage() {
  const event = eventsDataStore[activeGalleryId];
  if (!event || event.images.length <= 1) return;
  activeImageIndex = (activeImageIndex - 1 + event.images.length) % event.images.length;
  updateLightboxView(-1);
}

function renderThumbnails() {
  if (!lightboxThumbsContainer) return;
  const event = eventsDataStore[activeGalleryId];
  if (!event || event.images.length <= 1) {
    lightboxThumbsContainer.innerHTML = "";
    return;
  }

  lightboxThumbsContainer.innerHTML = event.images.map((img, i) => `
    <div class="lightbox-thumb ${i === activeImageIndex ? 'is-active' : ''}" data-thumb-idx="${i}" role="button" tabindex="0">
      <img src="${img}" alt="Thumbnail ${i + 1}">
    </div>
  `).join("");

  lightboxThumbsContainer.querySelectorAll(".lightbox-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const idx = parseInt(thumb.dataset.thumbIdx, 10);
      if (idx !== activeImageIndex) {
        const dir = idx > activeImageIndex ? 1 : -1;
        activeImageIndex = idx;
        updateLightboxView(dir);
      }
    });
  });
}

function updateActiveThumbnail() {
  if (!lightboxThumbsContainer) return;
  lightboxThumbsContainer.querySelectorAll(".lightbox-thumb").forEach((thumb, idx) => {
    if (idx === activeImageIndex) {
      thumb.classList.add("is-active");
      thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } else {
      thumb.classList.remove("is-active");
    }
  });
}

function toggleZoom() {
  if (!lightboxImgWrap) return;
  isZoomed = !isZoomed;
  if (isZoomed) {
    lightboxImgWrap.style.transform = "scale(1.85)";
    lightboxImgWrap.style.cursor = "zoom-out";
  } else {
    lightboxImgWrap.style.transform = "scale(1)";
    lightboxImgWrap.style.cursor = "grab";
  }
}

/**
 * ==============================================================================
 * TOUCH GESTURES (SWIPE TO NAVIGATE & SWIPE DOWN TO DISMISS)
 * ==============================================================================
 */
function initTouchGestures() {
  if (!lightbox) return;

  lightbox.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;

      if (lightboxImgWrap && !isZoomed) {
        lightboxImgWrap.classList.add("is-dragging");
      }
    }
  }, { passive: true });

  lightbox.addEventListener("touchmove", (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Interactive drag feel when not zoomed
    if (lightboxImgWrap && !isZoomed) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        lightboxImgWrap.style.transform = `translateX(${diffX * 0.75}px) scale(0.98)`;
      } else if (diffY > 0) {
        // Dragging down to dismiss
        lightboxImgWrap.style.transform = `translateY(${diffY * 0.75}px) scale(${Math.max(0.7, 1 - diffY / 800)})`;
      }
    }
  }, { passive: true });

  lightbox.addEventListener("touchend", () => {
    if (!isTouching) return;
    isTouching = false;

    if (lightboxImgWrap) {
      lightboxImgWrap.classList.remove("is-dragging");
    }

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (!isZoomed) {
      // Horizontal Swipe: Next / Prev
      if (Math.abs(diffX) > 55 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          nextImage(); // Swipe Left -> Next
        } else {
          prevImage(); // Swipe Right -> Prev
        }
        return;
      }

      // Vertical Swipe: Swipe Down to Dismiss
      if (diffY > 90 && Math.abs(diffY) > Math.abs(diffX)) {
        closeLightbox();
        return;
      }
    }

    // Reset position if swipe threshold not met
    if (lightboxImgWrap) {
      lightboxImgWrap.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      lightboxImgWrap.style.transform = isZoomed ? "scale(1.85)" : "scale(1)";
    }
  }, { passive: true });

  // Double tap to zoom on mobile
  if (lightboxImg) {
    lightboxImg.addEventListener("click", () => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      if (tapLength < 320 && tapLength > 0) {
        toggleZoom();
      }
      lastTapTime = currentTime;
    });
  }
}

/**
 * Event Listeners for Controls & Keyboard
 */
function bindLightboxEvents() {
  if (btnClose) btnClose.addEventListener("click", closeLightbox);
  if (btnNext) btnNext.addEventListener("click", nextImage);
  if (btnPrev) btnPrev.addEventListener("click", prevImage);
  if (btnZoom) btnZoom.addEventListener("click", toggleZoom);

  // Close when tapping backdrop outside the image
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("lightbox-stage")) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      nextImage();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevImage();
    }
  });

  initTouchGestures();
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
    bindLightboxEvents();
  });
} else {
  loadEvents();
  bindLightboxEvents();
}
