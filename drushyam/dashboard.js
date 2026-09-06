import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc,
  doc, setDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// AUTH GUARD
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin.html";
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin.html";
  });
}

// TAB NAVIGATION
const navButtons = document.querySelectorAll(".dash-btn");
const sections = document.querySelectorAll(".dash-section");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active-section"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.section);
    if (target) target.classList.add("active-section");
  });
});

function showMsg(el, text, type) {
  if (!el) return;
  el.innerText = text;
  el.className = `msg ${type}`;
}

function extractYoutubeId(input) {
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

// SOURCE TYPE TOGGLE
const vidSourceType = document.getElementById("vidSourceType");
const directUrlGroup = document.getElementById("directUrlGroup");
const youtubeGroup = document.getElementById("youtubeGroup");

if (vidSourceType) {
  vidSourceType.addEventListener("change", () => {
    if (vidSourceType.value === "direct") {
      directUrlGroup.style.display = "block";
      youtubeGroup.style.display = "none";
    } else {
      directUrlGroup.style.display = "none";
      youtubeGroup.style.display = "block";
    }
  });
}

// LIVE PREVIEW MODAL
const previewBtn = document.getElementById("previewBtn");
const previewModal = document.getElementById("previewModal");
const previewClose = document.getElementById("previewClose");
const previewContainer = document.getElementById("previewContainer");

if (previewBtn && previewModal) {
  previewBtn.addEventListener("click", () => {
    const type = vidSourceType ? vidSourceType.value : "direct";
    previewContainer.innerHTML = "";

    if (type === "direct") {
      const url = document.getElementById("vidDirectUrl").value.trim();
      if (!url) {
        alert("దయచేసి డైరెక్ట్ వీడియో URL నమోదు చేయండి.");
        return;
      }
      previewContainer.innerHTML = `
        <video src="${url}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>
      `;
    } else {
      const raw = document.getElementById("vidYoutubeId").value.trim();
      const ytId = extractYoutubeId(raw);
      if (!ytId) {
        alert("దయచేసి YouTube URL లేదా ID నమోదు చేయండి.");
        return;
      }
      previewContainer.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" style="width:100%;height:100%;border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      `;
    }
    previewModal.classList.add("show");
  });

  previewClose.addEventListener("click", () => {
    previewContainer.innerHTML = "";
    previewModal.classList.remove("show");
  });

  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) {
      previewContainer.innerHTML = "";
      previewModal.classList.remove("show");
    }
  });
}

/* ══════════════ CATEGORIES ══════════════ */
const saveCatBtn = document.getElementById("saveCatBtn");
if (saveCatBtn) {
  saveCatBtn.addEventListener("click", async () => {
    const name = document.getElementById("catName").value.trim();
    const emoji = document.getElementById("catEmoji").value.trim();
    const order = Number(document.getElementById("catOrder").value) || Date.now();
    const msgEl = document.getElementById("catMsg");

    if (!name) {
      showMsg(msgEl, "దయచేసి Category పేరు నమోదు చేయండి.", "error");
      return;
    }

    saveCatBtn.disabled = true;
    saveCatBtn.innerText = "భద్రపరుస్తోంది...";

    try {
      await addDoc(collection(db, "streamCategories"), {
        name, emoji, order, createdAt: serverTimestamp()
      });

      document.getElementById("catName").value = "";
      document.getElementById("catEmoji").value = "";
      document.getElementById("catOrder").value = "";
      showMsg(msgEl, "✅ కేటగిరీ విజయవంతంగా భద్రపరచబడింది.", "success");
      loadCategories();
    } catch (e) {
      console.error(e);
      showMsg(msgEl, "❌ కేటగిరీ భద్రపరచడంలో లోపం తలెత్తింది.", "error");
    } finally {
      saveCatBtn.disabled = false;
      saveCatBtn.innerText = "కేటగిరీని భద్రపరచండి";
    }
  });
}

async function loadCategories() {
  const listEl = document.getElementById("catList");
  const vidSelect = document.getElementById("vidCategorySelect");
  if (!listEl || !vidSelect) return;

  try {
    const q = query(collection(db, "streamCategories"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    listEl.innerHTML = "";
    vidSelect.innerHTML = `<option value="">విభాగాన్ని ఎంచుకోండి</option>`;

    if (snap.empty) {
      listEl.innerHTML = `<p style="color:var(--text3);font-size:0.85rem;">ఇంకా విభాగాలు లేవు.</p>`;
      return;
    }

    snap.forEach(d => {
      const c = d.data();
      vidSelect.innerHTML += `<option value="${d.id}">${c.emoji || "🏷️"} ${c.name}</option>`;

      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <div class="item-info">
          <div class="item-title">${c.emoji || ""} ${c.name}</div>
          <div class="item-sub">క్రమ సంఖ్య: ${c.order}</div>
        </div>
        <div class="item-actions">
          <button class="btn-danger" data-id="${d.id}">తొలగించండి</button>
        </div>
      `;
      row.querySelector(".btn-danger").addEventListener("click", async () => {
        if (confirm("ఈ కేటగిరీని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?")) {
          await deleteDoc(doc(db, "streamCategories", d.id));
          loadCategories();
        }
      });
      listEl.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ══════════════ VIDEOS ══════════════ */
const saveVidBtn = document.getElementById("saveVidBtn");
if (saveVidBtn) {
  saveVidBtn.addEventListener("click", async () => {
    const title = document.getElementById("vidTitle").value.trim();
    const description = document.getElementById("vidDesc").value.trim();
    const sourceType = vidSourceType ? vidSourceType.value : "direct";
    const directUrl = document.getElementById("vidDirectUrl").value.trim();
    const rawYt = document.getElementById("vidYoutubeId").value.trim();
    const youtubeId = extractYoutubeId(rawYt);
    let thumbnail = document.getElementById("vidThumb").value.trim();
    const categorySelect = document.getElementById("vidCategorySelect");
    const categoryId = categorySelect.value;
    const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text.trim() || "";
    const access = document.getElementById("vidAccess").value;
    const duration = document.getElementById("vidDuration").value.trim();
    const year = document.getElementById("vidYear").value.trim();
    const msgEl = document.getElementById("vidMsg");

    if (!title || !categoryId) {
      showMsg(msgEl, "దయచేసి Title మరియు Category ఎంచుకోండి.", "error");
      return;
    }

    if (sourceType === "direct" && !directUrl) {
      showMsg(msgEl, "దయచేసి Direct Video URL (.mp4 / Archive.org) నమోదు చేయండి.", "error");
      return;
    }

    if (sourceType === "youtube" && !youtubeId) {
      showMsg(msgEl, "దయచేసి సరైన YouTube Video ID లేదా లింక్ నమోదు చేయండి.", "error");
      return;
    }

    // Auto thumbnail from YouTube if not provided
    if (!thumbnail && sourceType === "youtube" && youtubeId) {
      thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    saveVidBtn.disabled = true;
    saveVidBtn.innerText = "భద్రపరుస్తోంది...";

    try {
      await addDoc(collection(db, "streamVideos"), {
        title,
        description,
        sourceType,
        videoUrl: sourceType === "direct" ? directUrl : "",
        youtubeId: sourceType === "youtube" ? youtubeId : "",
        thumbnail,
        categoryId,
        category: categoryName,
        access,
        duration,
        year,
        createdAt: serverTimestamp()
      });

      document.getElementById("vidTitle").value = "";
      document.getElementById("vidDesc").value = "";
      document.getElementById("vidDirectUrl").value = "";
      document.getElementById("vidYoutubeId").value = "";
      document.getElementById("vidThumb").value = "";
      document.getElementById("vidDuration").value = "";
      document.getElementById("vidYear").value = "";
      showMsg(msgEl, "✅ వీడియో విజయవంతంగా భద్రపరచబడింది.", "success");

      loadVideos();
    } catch (e) {
      console.error(e);
      showMsg(msgEl, "❌ వీడియో భద్రపరచడంలో లోపం తలెత్తింది.", "error");
    } finally {
      saveVidBtn.disabled = false;
      saveVidBtn.innerText = "వీడియోను భద్రపరచండి";
    }
  });
}

async function loadVideos() {
  const listEl = document.getElementById("vidList");
  const heroSelect = document.getElementById("heroVideoSelect");
  if (!listEl) return;

  try {
    const q = query(collection(db, "streamVideos"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    listEl.innerHTML = "";
    if (heroSelect) heroSelect.innerHTML = `<option value="">వీడియోను ఎంచుకోండి</option>`;

    if (snap.empty) {
      listEl.innerHTML = `<p style="color:var(--text3);font-size:0.85rem;">ఇంకా వీడియోలు లేవు.</p>`;
      return;
    }

    snap.forEach(d => {
      const v = d.data();
      const accessBadge = v.access === "free"
        ? `<span class="badge badge-free">FREE</span>`
        : `<span class="badge badge-paid">PREMIUM</span>`;

      const isDirect = v.sourceType === "direct" || (v.videoUrl && !v.youtubeId);
      const sourceBadge = isDirect
        ? `<span class="badge badge-direct">DIRECT MP4</span>`
        : `<span class="badge badge-yt">YOUTUBE</span>`;

      if (heroSelect) {
        heroSelect.innerHTML += `<option value="${d.id}">${v.title}</option>`;
      }

      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <img class="item-thumb" src="${v.thumbnail || '../images/placeholder.jpg'}" alt="">
        <div class="item-info">
          <div class="item-title">
            <span>${v.title}</span>
            ${accessBadge}
            ${sourceBadge}
          </div>
          <div class="item-sub">${v.category || ""} • ${v.duration || ""} • ${v.year || ""}</div>
        </div>
        <div class="item-actions">
          <a href="watch.html?id=${d.id}" target="_blank" class="btn-outline" style="text-decoration:none;padding:6px 14px;font-size:0.75rem;">ప్లే చేయండి ▶</a>
          <button class="btn-danger" data-id="${d.id}">తొలగించండి</button>
        </div>
      `;

      row.querySelector(".btn-danger").addEventListener("click", async () => {
        if (confirm("ఈ వీడియోను తొలగించాలనుకుంటున్నారా?")) {
          await deleteDoc(doc(db, "streamVideos", d.id));
          loadVideos();
        }
      });

      listEl.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading videos:", err);
  }
}

/* ══════════════ HERO FEATURED ══════════════ */
const saveHeroBtn = document.getElementById("saveHeroBtn");
if (saveHeroBtn) {
  saveHeroBtn.addEventListener("click", async () => {
    const select = document.getElementById("heroVideoSelect");
    const videoId = select.value;
    const msgEl = document.getElementById("heroMsg");

    if (!videoId) {
      showMsg(msgEl, "దయచేసి ఒక వీడియోను ఎంచుకోండి.", "error");
      return;
    }

    try {
      await setDoc(doc(db, "streamSettings", "hero"), {
        videoId,
        updatedAt: serverTimestamp()
      });
      showMsg(msgEl, "✅ ఫీచర్డ్ హీరో వీడియో విజయవంతంగా సెట్ చేయబడింది.", "success");
    } catch (e) {
      console.error(e);
      showMsg(msgEl, "❌ సెట్ చేయడంలో లోపం తలెత్తింది.", "error");
    }
  });
}

// SUBSCRIBERS
async function loadSubscribers() {
  const subList = document.getElementById("subList");
  if (!subList) return;

  try {
    const snap = await getDocs(collection(db, "subscribers"));
    if (snap.empty) {
      subList.innerHTML = "<p style='color:var(--text3);font-size:0.85rem;'>ఇంకా చందాదారులు లేరు.</p>";
      return;
    }

    let html = `
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);color:var(--gold);text-align:left;">
            <th style="padding:10px;">User UID</th>
            <th style="padding:10px;">ప్లాన్</th>
            <th style="padding:10px;">స్టేటస్</th>
            <th style="padding:10px;">గడువు తేదీ</th>
          </tr>
        </thead>
        <tbody>
    `;

    snap.forEach(d => {
      const s = d.data();
      const active = s.active ? "<span style='color:var(--green);font-weight:700;'>Active</span>" : "<span style='color:var(--red);font-weight:700;'>Expired</span>";
      html += `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px;font-family:monospace;">${d.id}</td>
          <td style="padding:10px;">${s.plan || "Standard"}</td>
          <td style="padding:10px;">${active}</td>
          <td style="padding:10px;">${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("te-IN") : "Lifetime"}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    subList.innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

// INITIALIZE
loadCategories();
loadVideos();
loadSubscribers();
