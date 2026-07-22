window.addEventListener("load", () => {

  // Show loader ONLY on the Home page
  const isHome =
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "";

  const loader = document.getElementById("loader");

  // If not Home page, don't show loader
  if (!isHome) {
    if (loader) loader.style.display = "none";
    return;
  }

  // Show only once
  if (sessionStorage.getItem("loaderShown")) {
    if (loader) loader.style.display = "none";
    return;
  }

  sessionStorage.setItem("loaderShown", "true");

  setTimeout(() => {
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 700);
    }
  }, 1000);

});
const galleryImages = [
  "images/school1.jpg",
  "images/school2.jpg",
  "images/school3.jpg",
  "images/school4.jpg",
  "images/school5.jpg",
  "images/school6.jpg"
];

let currentImageIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

function openImage(index) {
  currentImageIndex = index;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
  document.getElementById("imageModal").style.display = "flex";
}

function closeImage() {
  document.getElementById("imageModal").style.display = "none";
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
}

function prevImage() {
  currentImageIndex =
    (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
}

window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imageModal");

  if (!modal) return;

  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  modal.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffY) > 80 && diffY < 0) {
      closeImage();
    }

    if (Math.abs(diffX) > 60) {
      diffX > 0 ? nextImage() : prevImage();
    }
  });
});
