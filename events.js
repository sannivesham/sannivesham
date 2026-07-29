-<!DOCTYPE html>
<html lang="te">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>కార్యక్రమాలు - సన్నివేశం</title>
  <link rel="stylesheet" href="style.css">
  <style>
    /* Fix for music button - stays pinned to screen on scroll, including mobile */
    .music-btn {
      position: fixed !important;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    @media (max-width: 700px) {
      .music-btn {
        bottom: max(16px, env(safe-area-inset-bottom));
        right: 16px;
      }
    }
  </style>
</head>

<body class="events-body">
  <div class="events-bg"></div>
  <div id="loader">
    <div class="loader-content">
      <img src="images/logo.png" class="loader-logo" alt="Sannivesham Logo">
      <h1>సన్నివేశం</h1>
      <div class="loader-line"></div>
    </div>
  </div>

  <nav class="glass-navbar">
    <a href="index.html#categories">← వెనుకకు</a>
    <a href="index.html">ప్రారంభం</a>
    <a href="events.html">కార్యక్రమాలు</a>
  </nav>

  <section class="events-page">

    <h1>మా కార్యక్రమాలు</h1>

    <div class="events-list">
      <!-- Events are loaded dynamically here by events.js -->
    </div>

  </section>

  <div id="imageModal" class="image-modal">
    <span class="close-btn" onclick="closeImage()">✕</span>

    <button class="modal-arrow left-arrow" onclick="prevImage()">‹</button>

    <img id="popupImage">

    <button class="modal-arrow right-arrow" onclick="nextImage()">›</button>
  </div>

  <footer class="simple-footer">

    <script type="module" src="social-links.js"></script>

    <p>
      © 2026 సన్నివేశం • తెలుగు సంస్కృతి మరియు సంప్రదాయం
    </p>

  </footer>

  <script src="script.js"></script>
  <script type="module" src="events.js"></script>
  <script type="module">
    import { db } from "./firebase-config.js";

    import {
      doc,
      getDoc
    } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

    async function loadEventsBackground() {
      const snap = await getDoc(doc(db, "settings", "backgrounds"));
      if (!snap.exists()) return;

      const data = snap.data();
      const bg = document.querySelector(".events-bg");

      if (window.innerWidth <= 700 && data.eventsMobile) {
        bg.style.backgroundImage =
          `linear-gradient(rgba(10,5,0,0.62), rgba(10,5,0,0.68)), url("${data.eventsMobile}")`;
      } else if (data.eventsPc) {
        bg.style.backgroundImage =
          `linear-gradient(rgba(10,5,0,0.68), rgba(10,5,0,0.72)), url("${data.eventsPc}")`;
      }
    }

    loadEventsBackground();
  </script>

  <audio id="bgMusic" loop>
    <source src="music/traditional.mp3" type="audio/mpeg">
  </audio>

  <button id="musicBtn" class="music-btn">
    🔊
  </button>

  <script src="music.js"></script>
</body>

</html>
