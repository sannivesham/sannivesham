import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection, addDoc, getDocs, getDoc, updateDoc,
  setDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { EKADASHI_LIST } from "../festivals/ekadashi-data.js";

onAuthStateChanged(auth, async (user) => {
  const overlay = document.getElementById("adminAuthOverlay");
  const dashBody = document.getElementById("dashboardBody") || document.body;

  if (!user) {
    window.location.replace("admin.html");
    return;
  }

  // Any authenticated user with an email is an administrator (phone/guest users from quiz do not have email)
  const isPasswordUser = Boolean(user.email) || (user.providerData && user.providerData.some(p => p.providerId === "password"));

  if (isPasswordUser) {
    if (overlay) overlay.style.display = "none";
    dashBody.style.display = "block";
    const activeBtn = document.querySelector(".dash-btn.active");
    const activeSection = activeBtn?.dataset?.section || "eventsSection";
    loadSectionData(activeSection);
    return;
  }

  // Fallback: check explicit admin email list in settings/admin
  let isExplicitAdmin = false;
  try {
    const adminSnap = await getDoc(doc(db, "settings", "admin"));
    if (adminSnap.exists()) {
      const adminData = adminSnap.data();
      if (adminData.emails && Array.isArray(adminData.emails)) {
        isExplicitAdmin = adminData.emails.includes(user.email);
      } else if (adminData.email) {
        isExplicitAdmin = (adminData.email === user.email);
      }
    }
  } catch (e) {
    // If settings/admin collection is not configured yet, proceed
  }

  // Deny regular phone/guest users who logged in for quizzes
  if (!isExplicitAdmin) {
    alert("అనుమతి నిరాకరించబడింది: నిర్వాహకులు (Admin) మాత్రమే ఈ పేజీని యాక్సెస్ చేయగలరు.");
    window.location.replace("admin.html");
    return;
  }

  if (overlay) overlay.style.display = "none";
  dashBody.style.display = "block";
  const activeBtn = document.querySelector(".dash-btn.active");
  const activeSection = activeBtn?.dataset?.section || "eventsSection";
  loadSectionData(activeSection);
});

const CLOUD_NAME = "du5em76za";
const UPLOAD_PRESET = "sannivesham_upload";

/* ══════════════════════════════════════
   IMAGE UPLOAD
══════════════════════════════════════ */

function uploadImage() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return resolve(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      resolve(data.secure_url);
    };
    input.click();
  });
}

function uploadAudioFile(boxOrId = null) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return resolve(null);

      const box = typeof boxOrId === "string" ? document.getElementById(boxOrId) : boxOrId;
      const statusText = document.createElement("span");
      statusText.innerText = "⏳ ఆడియో అప్‌లోడ్ అవుతోంది...";
      statusText.style.color = "#ffd166";
      statusText.style.display = "block";
      statusText.style.fontWeight = "bold";
      statusText.style.padding = "6px 0";
      if (box) box.appendChild(statusText);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "Audio upload failed");
        resolve(data.secure_url);
      } catch (error) {
        alert("Audio upload failed: " + error.message);
        resolve(null);
      } finally {
        statusText.remove();
      }
    };

    input.click();
  });
}

/* ══════════════════════════════════════
   LINE-WISE AUDIO SYNC EDITOR SYSTEM
══════════════════════════════════════ */
const _activeSyncAudios = {};

function formatSecondsToTimestamp(secs) {
  if (isNaN(secs) || secs === Infinity || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function parseTimestampToSeconds(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[\[\]]/g, "").trim();
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}

function createLineSyncEditorHtml(uid) {
  return `
    <div class="line-sync-panel" id="lineSyncPanel-${uid}" style="display:none;background:#180e07;border:1px solid #ffd166;box-shadow:0 8px 30px rgba(0,0,0,0.7);border-radius:14px;padding:16px;margin:12px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;border-bottom:1px solid rgba(255,209,102,0.2);padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.3rem;">🎙️</span>
          <div>
            <strong style="color:#ffd166;font-size:1rem;display:block;">లైన్ వారీగా ఆడియో టైమింగ్స్ సెట్ చేయండి (Line-by-Line Audio Sync)</strong>
            <span style="color:rgba(255,255,255,0.7);font-size:0.8rem;">ఆడియో వింటూ ప్రతి లైన్ వద్ద కరెక్ట్ సెకన్లను సులభంగా సెట్ చేయండి</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="sync-auto-distribute-btn" data-target="${uid}" style="padding:6px 12px;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-size:0.82rem;font-weight:700;">
            ⚡ సమానంగా విభజించు (Auto Distribute)
          </button>
          <button type="button" class="sync-close-btn" data-target="${uid}" style="padding:6px 12px;border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;border:none;cursor:pointer;font-size:0.82rem;">
            ✕ మూసివేయి
          </button>
        </div>
      </div>

      <!-- AUDIO CONTROLLER BAR -->
      <div style="background:rgba(0,0,0,0.4);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;border:1px solid rgba(255,209,102,0.15);">
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="sync-play-btn" data-target="${uid}" style="width:38px;height:38px;border-radius:50%;background:#ffd166;color:#120703;border:none;font-size:1rem;cursor:pointer;font-weight:bold;display:flex;align-items:center;justify-content:center;">
            ▶
          </button>
          <div>
            <div style="color:#ffd166;font-family:monospace;font-size:1.1rem;font-weight:bold;">
              <span class="sync-current-time">0:00</span> <span style="color:rgba(255,255,255,0.4);font-size:0.85rem;">/ <span class="sync-duration">0:00</span></span>
            </div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">ఆడియో ప్లేయర్</div>
          </div>
        </div>
        <div style="flex:1;min-width:180px;">
          <input type="range" class="sync-seek-slider" data-target="${uid}" min="0" max="100" value="0" style="width:100%;accent-color:#ffd166;cursor:pointer;">
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-size:0.78rem;color:rgba(255,255,255,0.6);">వేగం:</span>
          <button type="button" class="sync-speed-btn" data-target="${uid}" data-speed="0.75" style="padding:4px 8px;font-size:0.78rem;border-radius:6px;background:rgba(255,255,255,0.1);color:#fff;border:none;cursor:pointer;">0.75x</button>
          <button type="button" class="sync-speed-btn active" data-target="${uid}" data-speed="1.0" style="padding:4px 8px;font-size:0.78rem;border-radius:6px;background:#ffd166;color:#120703;border:none;cursor:pointer;font-weight:bold;">1.0x</button>
          <button type="button" class="sync-speed-btn" data-target="${uid}" data-speed="1.25" style="padding:4px 8px;font-size:0.78rem;border-radius:6px;background:rgba(255,255,255,0.1);color:#fff;border:none;cursor:pointer;">1.25x</button>
        </div>
      </div>

      <div style="background:rgba(255,209,102,0.06);border-left:3px solid #ffd166;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:0.82rem;color:#ffd166;line-height:1.4;">
        💡 <strong>ఎలా ఉపయోగించాలి:</strong> పైన <strong>▶ Play</strong> నొక్కండి. ఆడియోలో ఏ శ్లోకం/లైన్ చదువుతున్నారో వింటూ, ఆ లైన్ పక్కన ఉన్న <strong>"⏱️ సమయం తీసుకో"</strong> బటన్ నొక్కండి! లేదా సెకన్లను (ఉదా: <code>0:15</code> లేదా <code>15</code>) నేరుగా టైప్ చేయవచ్చు. పూర్తయ్యాక కింద <strong>"Apply Timings to Text"</strong> క్లిక్ చేయండి.
      </div>

      <!-- LINES TABLE CONTAINER -->
      <div class="sync-lines-container" id="syncLinesContainer-${uid}" style="max-height:360px;overflow-y:auto;padding-right:6px;display:flex;flex-direction:column;gap:8px;">
      </div>

      <!-- APPLY BUTTON -->
      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px;border-top:1px solid rgba(255,209,102,0.2);padding-top:12px;">
        <button type="button" class="sync-apply-btn" data-target="${uid}" style="padding:10px 22px;border-radius:10px;background:#2ec4b6;color:#042b26;font-weight:bold;border:none;font-size:0.95rem;cursor:pointer;">
          ✅ ఈ టైమింగ్స్‌ను టెక్స్ట్‌కు జతచేయి (Apply Timings to Text)
        </button>
      </div>
    </div>
  `;
}

function attachLineSyncEvents(uid, getTextareaFn, getAudioUrlFn, onAppliedCallback = null) {
  const panel = document.getElementById(`lineSyncPanel-${uid}`);
  if (!panel) return;

  const playBtn = panel.querySelector(".sync-play-btn");
  const slider = panel.querySelector(".sync-seek-slider");
  const curTimeEl = panel.querySelector(".sync-current-time");
  const durTimeEl = panel.querySelector(".sync-duration");
  const speedBtns = panel.querySelectorAll(".sync-speed-btn");
  const autoDistBtn = panel.querySelector(".sync-auto-distribute-btn");
  const closeBtn = panel.querySelector(".sync-close-btn");
  const applyBtn = panel.querySelector(".sync-apply-btn");
  const linesContainer = document.getElementById(`syncLinesContainer-${uid}`);

  function getOrInitAudio() {
    const rawAudioUrl = getAudioUrlFn();
    if (!rawAudioUrl) return null;
    let audio = _activeSyncAudios[uid];
    if (!audio || audio.src !== rawAudioUrl) {
      if (audio) { audio.pause(); }
      audio = new Audio(rawAudioUrl);
      _activeSyncAudios[uid] = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          slider.value = (audio.currentTime / audio.duration) * 100;
          curTimeEl.innerText = formatSecondsToTimestamp(audio.currentTime);
          durTimeEl.innerText = formatSecondsToTimestamp(audio.duration);
        }
      };

      audio.onended = () => {
        if (playBtn) playBtn.innerText = "▶";
      };

      audio.onloadedmetadata = () => {
        durTimeEl.innerText = formatSecondsToTimestamp(audio.duration);
      };
    }
    return audio;
  }

  function togglePlay() {
    const audio = getOrInitAudio();
    if (!audio) {
      alert("దయచేసి ముందుగా ఆడియో ఫైల్ అప్‌లోడ్ చేయండి లేదా ఆడియో URL ఇవ్వండి.");
      return;
    }
    if (audio.paused) {
      audio.play().then(() => {
        if (playBtn) playBtn.innerText = "⏸";
      }).catch(err => alert("ఆడియో ప్లే చేయలేకపోయాము: " + err.message));
    } else {
      audio.pause();
      if (playBtn) playBtn.innerText = "▶";
    }
  }

  if (playBtn) playBtn.onclick = togglePlay;

  if (slider) {
    slider.oninput = () => {
      const audio = getOrInitAudio();
      if (audio && audio.duration) {
        audio.currentTime = (slider.value / 100) * audio.duration;
      }
    };
  }

  speedBtns.forEach(btn => {
    btn.onclick = () => {
      const speed = parseFloat(btn.dataset.speed);
      const audio = getOrInitAudio();
      if (audio) audio.playbackRate = speed;
      speedBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "rgba(255,255,255,0.1)";
        b.style.color = "#fff";
        b.style.fontWeight = "normal";
      });
      btn.classList.add("active");
      btn.style.background = "#ffd166";
      btn.style.color = "#120703";
      btn.style.fontWeight = "bold";
    };
  });

  if (closeBtn) {
    closeBtn.onclick = () => {
      const audio = _activeSyncAudios[uid];
      if (audio) audio.pause();
      if (playBtn) playBtn.innerText = "▶";
      panel.style.display = "none";
    };
  }

  if (autoDistBtn) {
    autoDistBtn.onclick = () => {
      const audio = getOrInitAudio();
      const dur = (audio && audio.duration && !isNaN(audio.duration)) ? audio.duration : 60;
      const rows = linesContainer.querySelectorAll(".sync-line-row");
      if (!rows.length) return;
      rows.forEach((row, i) => {
        const input = row.querySelector(".sync-time-input");
        if (input) {
          const sec = dur * (i / rows.length);
          input.value = formatSecondsToTimestamp(sec);
        }
      });
      alert(`⚡ ${rows.length} లైన్లకు ఆడియో సమయం సమానంగా విభజించబడింది!`);
    };
  }

  if (applyBtn) {
    applyBtn.onclick = () => {
      const textarea = getTextareaFn();
      if (!textarea) return;
      const rows = linesContainer.querySelectorAll(".sync-line-row");
      const updatedLines = [];
      rows.forEach(r => {
        const timeInput = r.querySelector(".sync-time-input");
        const time = timeInput ? timeInput.value.trim() : "";
        const text = r.dataset.lineText || "";
        if (time) {
          updatedLines.push(`[${time}] ${text}`);
        } else {
          updatedLines.push(text);
        }
      });
      textarea.value = updatedLines.join("\n\n");
      const audio = _activeSyncAudios[uid];
      if (audio) audio.pause();
      if (playBtn) playBtn.innerText = "▶";
      panel.style.display = "none";
      if (onAppliedCallback) onAppliedCallback(textarea.value);
      alert("✅ టైమింగ్స్ టెక్స్ట్‌కు విజయవంతంగా జతచేయబడ్డాయి! సేవ్ చేయడానికి 'Save Changes' క్లిక్ చేయండి.");
    };
  }

  // Populate lines whenever opening
  panel.populateLines = function() {
    const textarea = getTextareaFn();
    const rawText = textarea ? textarea.value.trim() : "";
    if (!rawText) {
      alert("దయచేసి ముందుగా సాహిత్యం / శ్లోకాలు నమోదు చేయండి.");
      panel.style.display = "none";
      return false;
    }
    const audioUrl = getAudioUrlFn();
    if (!audioUrl) {
      alert("దయచేసి ముందుగా ఆడియో ఫైల్ అప్‌లోడ్ చేయండి లేదా ఆడియో URL ఇవ్వండి.");
      panel.style.display = "none";
      return false;
    }

    const audio = getOrInitAudio();
    if (audio) {
      curTimeEl.innerText = formatSecondsToTimestamp(audio.currentTime);
      durTimeEl.innerText = formatSecondsToTimestamp(audio.duration || 0);
    }

    const rawLines = rawText.split("\n");
    const parsedLines = [];
    rawLines.forEach(l => {
      const trimmed = l.trim();
      if (!trimmed) return;
      const m = trimmed.match(/^\[(\d{1,2}:\d{2}(?:\.\d{1,2})?|\d+(?:\.\d+)?)\]\s*(.*)$/);
      if (m) {
        parsedLines.push({ time: m[1], text: m[2] });
      } else {
        parsedLines.push({ time: "", text: trimmed });
      }
    });

    linesContainer.innerHTML = "";
    parsedLines.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "sync-line-row";
      row.dataset.lineIndex = idx;
      row.dataset.lineText = item.text;
      row.innerHTML = `
        <span style="color:#ffd166;font-weight:bold;font-size:0.85rem;min-width:28px;">#${idx + 1}</span>
        <div style="flex:1;color:#fff;font-size:0.95rem;line-height:1.4;word-break:break-word;">
          ${escapeHtml(item.text)}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <input type="text" class="sync-time-input" value="${item.time || ''}" placeholder="0:00" title="సెకన్లు లేదా M:SS టైప్ చేయండి">
          <button type="button" class="sync-stamp-btn" title="ప్రస్తుత సమయాన్ని తీసుకోండి">⏱️ సమయం తీసుకో</button>
          <button type="button" class="sync-test-play-btn" title="ఈ సమయం నుండి వినండి">▶️ విను</button>
        </div>
      `;

      const stampBtn = row.querySelector(".sync-stamp-btn");
      const timeInput = row.querySelector(".sync-time-input");
      const testPlayBtn = row.querySelector(".sync-test-play-btn");

      stampBtn.onclick = () => {
        const curAudio = getOrInitAudio();
        const cur = curAudio ? curAudio.currentTime : 0;
        timeInput.value = formatSecondsToTimestamp(cur);
        row.classList.add("stamped-flash");
        setTimeout(() => row.classList.remove("stamped-flash"), 400);

        // Auto-focus next row's stamp button
        const nextRow = linesContainer.children[idx + 1];
        if (nextRow) {
          const nextBtn = nextRow.querySelector(".sync-stamp-btn");
          if (nextBtn) {
            nextRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
            nextBtn.focus();
          }
        }
      };

      testPlayBtn.onclick = () => {
        const val = timeInput.value.trim();
        const sec = parseTimestampToSeconds(val);
        const curAudio = getOrInitAudio();
        if (curAudio) {
          curAudio.currentTime = sec;
          curAudio.play().then(() => {
            if (playBtn) playBtn.innerText = "⏸";
          }).catch(() => {});
        }
      };

      linesContainer.appendChild(row);
    });

    return true;
  };
}

// Global click handler to toggle line sync panels
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".open-line-sync-btn");
  if (!btn) return;
  const targetId = btn.dataset.target;
  const panel = document.getElementById(`lineSyncPanel-${targetId}`);
  if (!panel) return;
  if (panel.style.display === "none" || !panel.style.display) {
    if (panel.populateLines && panel.populateLines()) {
      panel.style.display = "block";
    }
  } else {
    panel.style.display = "none";
  }
});

/* ══════════════════════════════════════
   IMAGE GRID (Events)
══════════════════════════════════════ */

const titleInput = document.getElementById("eventTitle");
const descInput = document.getElementById("eventDescription");
const saveBtn = document.getElementById("saveEventBtn");
const eventMessage = document.getElementById("eventMessage");
const newGrid = document.getElementById("newEventImageGrid");
const locationInput = document.getElementById("eventLocation");
const timeInput = document.getElementById("eventTime");
let newImages = [];

function renderImageGrid(container, images, onChange) {
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "cms-img-slot";
    slot.draggable = !!images[i];
    slot.dataset.index = i;
    if (images[i]) {
      slot.innerHTML = `<img src="${images[i]}"><button class="remove-img">✕</button>`;
      slot.querySelector(".remove-img").onclick = () => { images.splice(i, 1); onChange(images); };
      slot.addEventListener("dragstart", e => e.dataTransfer.setData("from", i));
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("from"));
        const moved = images.splice(from, 1)[0];
        images.splice(i, 0, moved);
        onChange(images.slice(0, 6));
      });
    } else {
      slot.innerHTML = `<span>＋</span>`;
      slot.onclick = async () => {
        const url = await uploadImage();
        if (url) { images.push(url); onChange(images.slice(0, 6)); }
      };
    }
    container.appendChild(slot);
  }
}

function refreshNewEventGrid() {
  renderImageGrid(newGrid, newImages, (imgs) => { newImages = imgs; refreshNewEventGrid(); });
}
refreshNewEventGrid();

/* ══════════════════════════════════════
   EVENTS CMS
══════════════════════════════════════ */

saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const location = locationInput.value.trim();
  const time = timeInput.value.trim();
  const description = descInput.value.trim();
  if (!title || !description || newImages.length === 0) {
    eventMessage.innerText = "దయచేసి టైటిల్, వివరాలు మరియు కనీసం ఒక చిత్రం జోడించండి";
    return;
  }
  await addDoc(collection(db, "events"), { title, location, time, description, images: newImages, createdAt: serverTimestamp() });
  titleInput.value = ""; descInput.value = "";
  newImages = [];
  renderImageGrid(newGrid, newImages, (imgs) => { newImages = imgs; });
  eventMessage.innerText = "✅ ఈవెంట్ సేవ్ అయింది";
  loadAdminEvents();
});

async function loadAdminEvents() {
  const list = document.getElementById("adminEventsList");
  if (!list) return;
  try {
    list.innerHTML = "<p style='color:#ffd166;padding:12px;'>ఈవెంట్‌లు లోడ్ అవుతున్నాయి...</p>";
    let snapshot;
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (e) {
      console.warn("Falling back to unordered events:", e);
      snapshot = await getDocs(collection(db, "events"));
    }
    const docs = [];
    snapshot.forEach((item) => docs.push(item));
    docs.sort((a, b) => (b.data()?.createdAt?.seconds || 0) - (a.data()?.createdAt?.seconds || 0));

    list.innerHTML = "";
    if (docs.length === 0) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6);padding:12px;'>ఈవెంట్‌లు ఏవీ లేవు. పైన ఫారమ్ ద్వారా కొత్త ఈవెంట్ జోడించండి.</p>";
      return;
    }
    docs.forEach((item) => {
      const data = item.data();
      const images = data.images || (data.image ? [data.image] : []);
      const card = document.createElement("div");
      card.className = "admin-event-card editable-event";
      card.innerHTML = `
        <input class="edit-title" value="${data.title || ""}" placeholder="ఈవెంట్ పేరు">
        <input class="edit-location" value="${data.location || ""}" placeholder="కార్యక్రమ స్థలం">
        <input class="edit-time" value="${data.time || ""}" placeholder="తేదీ & సమయం">
        <textarea class="edit-desc" placeholder="ఈవెంట్ వివరాలు">${data.description || ""}</textarea>
        <div class="cms-image-grid"></div>
        <div class="admin-actions">
          <button class="save-edit">Save</button>
          <button class="delete-event">Delete</button>
        </div>
      `;
      let editImages = [...images];
      const grid = card.querySelector(".cms-image-grid");
      function refreshEditGrid() {
        renderImageGrid(grid, editImages, (imgs) => { editImages = imgs; refreshEditGrid(); });
      }
      refreshEditGrid();
      card.querySelector(".save-edit").onclick = async () => {
        await updateDoc(doc(db, "events", item.id), {
          title: card.querySelector(".edit-title").value.trim(),
          location: card.querySelector(".edit-location").value.trim(),
          time: card.querySelector(".edit-time").value.trim(),
          description: card.querySelector(".edit-desc").value.trim(),
          images: editImages, updatedAt: serverTimestamp()
        });
        alert("✅ అప్డేట్ అయింది"); loadAdminEvents();
      };
      card.querySelector(".delete-event").onclick = async () => {
        if (!confirm("ఈ ఈవెంట్ డిలీట్ చేయాలా?")) return;
        await deleteDoc(doc(db, "events", item.id)); loadAdminEvents();
      };
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading events:", err);
    list.innerHTML = `<p style="color:#ff6b6b;padding:12px;">ఈవెంట్‌లు లోడ్ చేయడంలో లోపం: ${err.message}</p>`;
  }
}
loadAdminEvents();

/* ══════════════════════════════════════
   DASHBOARD NAVIGATION & SECTION LOADER
══════════════════════════════════════ */

function loadSectionData(sectionId) {
  if (!sectionId) return;
  try {
    switch (sectionId) {
      case "eventsSection":
        if (typeof loadAdminEvents === "function") loadAdminEvents();
        break;
      case "festivalsSection":
        if (typeof loadAdminFestivals === "function") loadAdminFestivals();
        break;
      case "ekadashiSection":
        if (typeof loadAdminEkadashis === "function") loadAdminEkadashis();
        break;
      case "templesSection":
        if (typeof loadTempleCategories === "function") loadTempleCategories();
        if (typeof loadAdminTemples === "function") loadAdminTemples();
        break;
      case "librarySection":
        if (typeof loadLibCategoriesAdmin === "function") loadLibCategoriesAdmin();
        if (typeof loadLibCategoryOptions === "function") loadLibCategoryOptions();
        if (typeof loadLibSubcategoriesAdmin === "function") loadLibSubcategoriesAdmin();
        if (typeof loadLibSubcategoryOptions === "function") loadLibSubcategoryOptions();
        if (typeof loadLibContentAdmin === "function") loadLibContentAdmin();
        break;
      case "slokasSection":
        if (typeof loadSlokaCategoriesAdmin === "function") loadSlokaCategoriesAdmin();
        if (typeof loadSlokaDirectCategories === "function") loadSlokaDirectCategories();
        if (typeof loadSlokasAdmin === "function") loadSlokasAdmin();
        break;
      case "videosSection":
        if (typeof loadAdminVideos === "function") loadAdminVideos();
        break;
      case "ithihasaluSection":
        if (typeof loadIthiCategories === "function") loadIthiCategories();
        if (typeof loadIthiSubCategories === "function") loadIthiSubCategories();
        if (typeof loadIthiShlokas === "function") loadIthiShlokas();
        break;
      case "poojaMandirSection":
        if (typeof loadPoojaGods === "function") loadPoojaGods();
        if (typeof loadPoojaRituals === "function") loadPoojaRituals();
        break;
      case "streamSection":
        if (typeof loadStreamCats === "function") loadStreamCats();
        if (typeof loadStreamVideos === "function") loadStreamVideos();
        if (typeof loadSubscribers === "function") loadSubscribers();
        break;
      case "storeSection":
        if (typeof loadStoreCategories === "function") loadStoreCategories();
        if (typeof loadStoreProducts === "function") loadStoreProducts();
        break;
      case "backgroundsSection":
        if (typeof loadThemeBackgroundsAdmin === "function") loadThemeBackgroundsAdmin();
        break;
      case "socialSection":
        if (typeof loadSocialLinksAdmin === "function") loadSocialLinksAdmin();
        break;
      case "homeCardsSection":
        if (typeof loadHomeCardsAdmin === "function") loadHomeCardsAdmin();
        break;
      case "sponsorSection":
        if (typeof loadSponsorAdmin === "function") loadSponsorAdmin();
        break;
      case "qotdSection":
        if (typeof loadQotdList === "function") loadQotdList();
        break;
      case "wordOfDaySection":
        if (typeof loadWordList === "function") loadWordList();
        break;
    }
  } catch (err) {
    console.error("Error in loadSectionData:", sectionId, err);
  }
}
window.loadSectionData = loadSectionData;

const navButtons = document.querySelectorAll(".dash-btn");
const sections = document.querySelectorAll(".dash-section");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach(btn => btn.classList.remove("active"));
    sections.forEach(section => section.classList.remove("active-section"));
    button.classList.add("active");
    const targetSection = document.getElementById(button.dataset.section);
    if (targetSection) targetSection.classList.add("active-section");
    loadSectionData(button.dataset.section);
  });
});

/* ══════════════════════════════════════
   UNIFIED THEME-WISE BACKGROUND MANAGER
══════════════════════════════════════ */

const themeSelector = document.getElementById("themeSelectorDashboard");
const bgThemeActiveLabel = document.getElementById("bgThemeActiveLabel");

async function loadThemeBackgroundsAdmin() {
  if (!themeSelector) return;
  const currentTheme = themeSelector.value;
  const themeName = themeSelector.options[themeSelector.selectedIndex].text;

  if (bgThemeActiveLabel) {
    bgThemeActiveLabel.innerText = `Editing: ${themeName}`;
  }

  try {
    const snap = await getDoc(doc(db, "settings", "backgrounds"));
    const data = snap.exists() ? snap.data() : {};
    const themeConfig = (data.themes && data.themes[currentTheme]) || data[currentTheme] || {};

    document.querySelectorAll(".bg-upload-btn").forEach((btn) => {
      const key = btn.dataset.key;
      const statusEl = document.getElementById(`status_${key}`);
      if (!statusEl) return;

      let customUrl = "";
      if (currentTheme !== "global") {
        customUrl = themeConfig[key] || "";
        // Support legacy home background keys
        if (!customUrl && key === "homePc") customUrl = themeConfig.pc || "";
        if (!customUrl && key === "homeMobile") customUrl = themeConfig.mobile || "";
      }

      const globalUrl = data[key] || "";

      if (currentTheme === "global") {
        if (globalUrl) {
          statusEl.innerHTML = `<span style="color:#2ec4b6;font-size:0.85rem;font-weight:bold;">✅ Global Set</span> <a href="${globalUrl}" target="_blank" style="color:#ffd166;margin-left:6px;text-decoration:underline;">View</a>`;
        } else {
          statusEl.innerHTML = `<span style="opacity:0.6;font-size:0.85rem;">Not set</span>`;
        }
      } else {
        if (customUrl) {
          statusEl.innerHTML = `<span style="color:#2ec4b6;font-size:0.85rem;font-weight:bold;">✅ Custom (${currentTheme})</span> <a href="${customUrl}" target="_blank" style="color:#ffd166;margin-left:6px;text-decoration:underline;">View</a>`;
        } else if (globalUrl) {
          statusEl.innerHTML = `<span style="color:#ffb703;font-size:0.85rem;">🌐 Using Global</span> <a href="${globalUrl}" target="_blank" style="color:#ffd166;margin-left:6px;text-decoration:underline;">View</a>`;
        } else {
          statusEl.innerHTML = `<span style="opacity:0.6;font-size:0.85rem;">Default / Not set</span>`;
        }
      }
    });
  } catch (e) {
    console.error("Error loading theme backgrounds:", e);
  }
}

if (themeSelector) {
  themeSelector.addEventListener("change", loadThemeBackgroundsAdmin);
  loadThemeBackgroundsAdmin();
}

document.querySelectorAll(".bg-upload-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.key;
    const currentTheme = themeSelector ? themeSelector.value : "global";
    const originalText = btn.innerText;

    const url = await uploadImage();
    if (!url) return;

    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
      if (currentTheme === "global") {
        await setDoc(
          doc(db, "settings", "backgrounds"),
          {
            [key]: url,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
        try { localStorage.removeItem("sannivesham_theme_bg_cache"); } catch (e) {}
        alert(`✅ Global ${key} background saved successfully!`);
      } else {
        const updates = {
          [`themes.${currentTheme}.${key}`]: url,
          updatedAt: serverTimestamp()
        };
        if (key === "homePc") updates[`themes.${currentTheme}.pc`] = url;
        if (key === "homeMobile") updates[`themes.${currentTheme}.mobile`] = url;

        try {
          await updateDoc(doc(db, "settings", "backgrounds"), updates);
        } catch (updateErr) {
          await setDoc(
            doc(db, "settings", "backgrounds"),
            {
              themes: {
                [currentTheme]: {
                  [key]: url,
                  ...(key === "homePc" ? { pc: url } : {}),
                  ...(key === "homeMobile" ? { mobile: url } : {})
                }
              },
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        }
        try { localStorage.removeItem("sannivesham_theme_bg_cache"); } catch (e) {}
        alert(`✅ ${currentTheme.toUpperCase()} - ${key} background saved successfully!`);
      }

      await loadThemeBackgroundsAdmin();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  });
});

/* ══════════════════════════════════════
   FESTIVALS CMS
══════════════════════════════════════ */

/* ══════════════════════════════════════
   FESTIVALS CMS
══════════════════════════════════════ */

const addFestivalSectionBtn = document.getElementById("addFestivalSectionBtn");
const festivalSectionsContainer = document.getElementById("festivalSectionsContainer");

// Creates one section box (title + content + image slot + remove button) —
// used by both the manual "+ Section Add" button and the bulk-paste parser,
// so parsed sections behave identically to hand-added ones (image can still
// be attached to each one afterward, same as today).
function createFestivalSectionBox(container, prefillTitle = "", prefillContent = "") {
  const box = document.createElement("div");
  box.className = "festival-section-box";
  box.innerHTML = `
    <h4>Festival Section</h4>
    <input type="text" placeholder="Section Title" class="festival-section-title" value="${prefillTitle.replace(/"/g, "&quot;")}">
    <textarea placeholder="Section Content" class="festival-section-content">${prefillContent}</textarea>
    <div class="section-image-slot"><span>＋ Add Section Image</span></div>
    <button class="remove-section-btn" type="button">Remove Section</button>
  `;
  container.appendChild(box);
  const imageSlot = box.querySelector(".section-image-slot");
  imageSlot.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    imageSlot.innerHTML = `<img src="${url}">`;
    imageSlot.dataset.image = url;
  });
  box.querySelector(".remove-section-btn").addEventListener("click", () => box.remove());
  return box;
}

if (addFestivalSectionBtn && festivalSectionsContainer) {
  addFestivalSectionBtn.addEventListener("click", () => {
    createFestivalSectionBox(festivalSectionsContainer);
  });
}

// Splits pasted text on lines starting with "##" into { title, content }
// pairs. Everything between one "##" line and the next belongs to that
// section's content, with blank lines preserved as authored.
function parseBulkFestivalText(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const parsed = [];
  let current = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^\s*##\s*(.*)$/);
    if (headingMatch) {
      if (current) parsed.push(current);
      current = { title: headingMatch[1].trim(), contentLines: [] };
    } else if (current) {
      current.contentLines.push(line);
    } else if (line.trim()) {
      // Text appears before the first "##" heading — keep it instead of
      // silently dropping it, just with no title.
      current = { title: "", contentLines: [line] };
    }
  });
  if (current) parsed.push(current);

  return parsed
    .map(s => ({ title: s.title, content: s.contentLines.join("\n").trim() }))
    .filter(s => s.title || s.content);
}

const parseFestivalBulkBtn = document.getElementById("parseFestivalBulkBtn");
const festivalBulkPaste = document.getElementById("festivalBulkPaste");
if (parseFestivalBulkBtn && festivalBulkPaste) {
  parseFestivalBulkBtn.addEventListener("click", () => {
    const raw = festivalBulkPaste.value;
    const sections = parseBulkFestivalText(raw);
    const msgEl = document.getElementById("festivalMessage");
    if (sections.length === 0) {
      msgEl.innerText = "పార్స్ చేయడానికి ఏమీ దొరకలేదు — ## తో heading పెట్టారో చూడండి";
      return;
    }
    sections.forEach(s => createFestivalSectionBox(festivalSectionsContainer, s.title, s.content));
    festivalBulkPaste.value = "";
    msgEl.innerText = `✅ ${sections.length} sections జోడించబడ్డాయి — ఇప్పుడు కావాలంటే ప్రతి section కి image పెట్టండి, తర్వాత Festival Save నొక్కండి`;
  });
}

const festivalCardBox = document.getElementById("festivalCardImageGrid");
if (festivalCardBox) {
  festivalCardBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    festivalCardBox.innerHTML = `<img src="${url}">`;
    festivalCardBox.dataset.image = url;
  });
}

// ══════════════════════════════════════
// SMART SLUG & CLEAN URL UTILITIES
// ══════════════════════════════════════

function slugify(text) {
  if (!text) return "";
  let str = text.trim();

  // If text already has English letters with no non-ASCII, clean directly
  const englishParts = str.match(/[a-zA-Z0-9]+/g);
  if (englishParts && englishParts.join("-").length >= 3 && !/[^\x00-\x7F]/.test(str)) {
    return englishParts.join("-").toLowerCase();
  }

  // Common Devotional Dictionary (Telugu -> Latin)
  const devotionalMap = [
    ["హనుమాన్", "hanuman"], ["ఆంజనేయ", "anjaneya"], ["మారుతి", "maruthi"],
    ["చాలీసా", "chalisa"], ["చాలీసాలు", "chalisas"], ["దండకం", "dandakam"],
    ["స్తోత్రం", "stotram"], ["స్తోత్రాలు", "stotras"], ["స్తోత్రరాజం", "stotrarajam"],
    ["సహస్రనామ", "sahasranama"], ["సహస్రనామావళి", "sahasranamavali"],
    ["అష్టోత్తర", "ashtottara"], ["శతనామావళి", "shatanamavali"],
    ["కవచం", "kavacham"], ["సూక్తం", "suktam"], ["హృదయం", "hrudayam"],
    ["సుప్రభాతం", "suprabhatam"], ["ఆర్తి", "aarti"], ["మహిమ్న", "mahimna"],
    ["అమృతవాణి", "amruthavani"], ["తాండవ", "tandava"],
    ["గణపతి", "ganapathi"], ["వినాయక", "vinayaka"], ["గణేశ", "ganesha"],
    ["శివ", "shiva"], ["శంకర", "shankara"], ["రుద్ర", "rudra"], ["ఈశ్వర", "eshwara"],
    ["విష్ణు", "vishnu"], ["నారాయణ", "narayana"], ["కృష్ణ", "krishna"], ["రామ", "rama"],
    ["వెంకటేశ్వర", "venkateswara"], ["గోవింద", "govinda"], ["శ్రీనివాస", "srinivasa"],
    ["బాలాజీ", "balaji"], ["నరసింహ", "narasimha"], ["హయగ్రీవ", "hayagriva"],
    ["లక్ష్మీ", "lakshmi"], ["దుర్గ", "durga"], ["సరస్వతి", "saraswati"],
    ["గాయత్రి", "gayatri"], ["లలిత", "lalitha"], ["కాళి", "kali"],
    ["అన్నపూర్ణ", "annapurna"], ["మహిషాసుర", "mahishasura"], ["మర్దిని", "mardini"],
    ["సుబ్రహ్మణ్య", "subrahmanya"], ["షణ్ముఖ", "shanmukha"], ["కార్తికేయ", "karthikeya"],
    ["సూర్య", "surya"], ["ఆదిత్య", "aditya"], ["నవగ్రహ", "navagraha"],
    ["తిరుమల", "tirumala"], ["తిరుపతి", "tirupati"], ["శ్రీశైలం", "srisailam"],
    ["మల్లికార్జున", "mallikarjuna"], ["వారణాసి", "varanasi"], ["కాశీ", "kashi"],
    ["విశ్వనాథ", "vishwanatha"], ["యాదాద్రి", "yadadri"], ["సింహాచలం", "simhachalam"],
    ["విజయవాడ", "vijayawada"], ["కనకదుర్గ", "kanakadurga"], ["శబరిమల", "sabarimala"],
    ["అయ్యప్ప", "ayyappa"], ["చవితి", "chavithi"], ["దసరా", "dasara"],
    ["దీపావళి", "diwali"], ["సంక్రాంతి", "sankranti"], ["శివరాత్రి", "shivaratri"],
    ["ఉగాది", "ugadi"], ["నవరాత్రి", "navaratri"], ["శ్రీరామనవమి", "sri-rama-navami"],
    ["శ్రీ", "sri"], ["మహా", "maha"]
  ];

  for (const [te, en] of devotionalMap) {
    str = str.split(te).join(" " + en + " ");
  }

  // Phonetic fallback for remaining Telugu glyphs
  const teCharMap = {
    'అ':'a','ఆ':'aa','ఇ':'i','ఈ':'ee','ఉ':'u','ఊ':'oo','ఋ':'ru','ఎ':'e','ఏ':'e','ఐ':'ai','ఒ':'o','ఓ':'o','ఔ':'au','అం':'am',
    'క':'k','ఖ':'kh','గ':'g','ఘ':'gh','ఙ':'ng',
    'చ':'ch','ఛ':'chh','జ':'j','ఝ':'jh','ఞ':'ny',
    'ట':'t','ఠ':'th','డ':'d','ఢ':'dh','ణ':'n',
    'త':'t','థ':'th','ద':'d','ధ':'dh','న':'n',
    'ప':'p','ఫ':'ph','బ':'b','భ':'bh','మ':'m',
    'య':'y','ర':'r','ల':'l','వ':'v','శ':'sh','ష':'sh','స':'s','హ':'h','ళ':'l','క్ష':'ksh','ఱ':'r',
    'ా':'aa','ి':'i','ీ':'ee','ు':'u','ూ':'oo','ృ':'ru','ె':'e','ే':'e','ై':'ai','ొ':'o','ో':'o','ఔ':'au','ం':'m','ః':'h','్':''
  };

  let romanized = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    romanized += (teCharMap[ch] !== undefined ? teCharMap[ch] : ch);
  }

  let slug = romanized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 2) {
    slug = "item-" + Math.abs(text.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 100000);
  }

  return slug;
}

function attachAutoSlug(titleInputId, slugInputId) {
  const titleEl = document.getElementById(titleInputId);
  const slugEl = document.getElementById(slugInputId);
  if (titleEl && slugEl) {
    titleEl.addEventListener("input", () => {
      if (!slugEl.dataset.manuallyEdited) {
        slugEl.value = slugify(titleEl.value);
      }
    });
    slugEl.addEventListener("input", () => {
      slugEl.dataset.manuallyEdited = "true";
    });
  }
}

function renderSlugLinkHtml(sectionName, slug, id) {
  const cleanSlug = slug || id;
  const url = `https://sannivesham.com/${sectionName}/${cleanSlug}`;
  return `
    <div style="margin:6px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <a href="/${sectionName}/${cleanSlug}" target="_blank" style="color:#ffd166;font-size:0.88rem;text-decoration:underline;font-weight:600;">🔗 /${sectionName}/${cleanSlug}</a>
      <button type="button" class="copy-link-btn" data-url="${url}" style="background:rgba(255,209,102,0.15);color:#ffd166;border:1px solid rgba(255,209,102,0.3);padding:2px 8px;border-radius:6px;font-size:0.8rem;cursor:pointer;">📋 Copy Link</button>
    </div>
  `;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("copy-link-btn")) {
    const url = e.target.dataset.url;
    navigator.clipboard.writeText(url).then(() => {
      const orig = e.target.innerText;
      e.target.innerText = "✓ Copied!";
      setTimeout(() => { e.target.innerText = orig; }, 1800);
    });
  }
});

const saveFestivalBtn = document.getElementById("saveFestivalBtn");
if (saveFestivalBtn) {
  attachAutoSlug("festivalTitle", "festivalSlug");
  saveFestivalBtn.addEventListener("click", async () => {
    const title = document.getElementById("festivalTitle").value.trim();
    const slugInput = document.getElementById("festivalSlug");
    const slug = (slugInput ? slugInput.value.trim() : "") || slugify(title);
    const footerQuote = document.getElementById("festivalFooterQuote").value.trim();
    const cardBox = document.getElementById("festivalCardImageGrid");
    const cardImage = cardBox.dataset.image || "";
    const sectionBoxes = document.querySelectorAll(".festival-section-box");
    const sections = [];
    sectionBoxes.forEach((box) => {
      const sectionTitle = box.querySelector(".festival-section-title").value.trim();
      const sectionContent = box.querySelector(".festival-section-content").value.trim();
      const sectionImage = box.querySelector(".section-image-slot").dataset.image || "";
      if (sectionTitle || sectionContent || sectionImage) {
        sections.push({ title: sectionTitle, content: sectionContent, image: sectionImage });
      }
    });
    if (!title || !cardImage || sections.length === 0) {
      document.getElementById("festivalMessage").innerText = "దయచేసి పండుగ పేరు, కార్డ్ ఇమేజ్ మరియు కనీసం ఒక section జోడించండి";
      return;
    }
    saveFestivalBtn.disabled = true;
    await addDoc(collection(db, "festivals"), { title, slug, cardImage, footerQuote, sections, createdAt: serverTimestamp() });
    document.getElementById("festivalMessage").innerText = "✅ పండుగ సేవ్ అయింది";
    if (slugInput) { slugInput.value = ""; delete slugInput.dataset.manuallyEdited; }
    document.getElementById("festivalTitle").value = "";
    saveFestivalBtn.disabled = false;
    loadAdminFestivals();
  });
}

async function loadAdminFestivals() {
  const list = document.getElementById("adminFestivalsList");
  if (!list) return;
  try {
    list.innerHTML = "<p style='color:#ffd166;padding:12px;'>పండుగల జాబితా లోడ్ అవుతోంది...</p>";
    let snapshot;
    try {
      const q = query(collection(db, "festivals"), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (e) {
      console.warn("Falling back to unordered festivals:", e);
      snapshot = await getDocs(collection(db, "festivals"));
    }
    const docs = [];
    snapshot.forEach(item => docs.push(item));
    docs.sort((a, b) => (b.data()?.createdAt?.seconds || 0) - (a.data()?.createdAt?.seconds || 0));

    list.innerHTML = "";
    if (docs.length === 0) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6);padding:12px;'>పండుగలు ఏవీ లేవు. పైన ఫారమ్ ద్వారా కొత్త పండుగను జోడించండి.</p>";
      return;
    }
    docs.forEach((item) => {
      const festival = item.data();
      list.innerHTML += `
        <div class="admin-event-card editable-festival-card">
          <img src="${festival.cardImage || ""}" alt="${festival.title || ""}">
          <div>
            <h3>${festival.title || "Untitled"}</h3>
            ${renderSlugLinkHtml("festivals", festival.slug, item.id)}
            <p>Sections: ${festival.sections ? festival.sections.length : 0}</p>
            <button class="open-festival-edit-btn" data-id="${item.id}">Edit</button>
            <button class="delete-festival-btn" data-id="${item.id}">Delete</button>
            <div class="festival-inline-editor" id="festivalEdit-${item.id}"></div>
          </div>
        </div>
      `;
    });
    list.querySelectorAll(".open-festival-edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => openFestivalInlineEditor(btn.dataset.id));
    });
    list.querySelectorAll(".delete-festival-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("ఈ పండుగ డిలీట్ చేయాలా?")) return;
        await deleteDoc(doc(db, "festivals", btn.dataset.id)); loadAdminFestivals();
      });
    });
  } catch (err) {
    console.error("Error loading festivals:", err);
    list.innerHTML = `<p style="color:#ff6b6b;padding:12px;">పండుగలు లోడ్ చేయడంలో లోపం: ${err.message}</p>`;
  }
}

async function openFestivalInlineEditor(id) {
  const editor = document.getElementById(`festivalEdit-${id}`);
  if (!editor) return;
  if (editor.innerHTML.trim() !== "") {
    editor.innerHTML = "";
    return;
  }
  const snap = await getDoc(doc(db, "festivals", id));
  if (!snap.exists()) return;
  const festival = snap.data();

  function sectionHTML(section = {}, index = "New") {
    return `
      <div class="festival-section-box inline-section-edit">
        <h4>Section ${index}</h4>
        <input class="inline-section-title" value="${section.title || ""}" placeholder="Section Title">
        <textarea class="inline-section-content" placeholder="Section Content">${section.content || ""}</textarea>
        <div class="section-image-slot inline-section-image" data-image="${section.image || ""}">
          ${section.image ? `<img src="${section.image}">` : `<span>＋ Section Image</span>`}
        </div>
        <div class="image-control-box">
          <label>Width %</label><input type="number" class="img-width-input" value="${section.imgWidth || 75}">
          <label>Height px</label><input type="number" class="img-height-input" value="${section.imgHeight || 420}">
          <label>Brightness %</label><input type="number" class="img-brightness-input" value="${section.imgBrightness || 100}">
          <label>Alignment</label>
          <select class="img-position-input">
            <option value="left" ${section.imgPosition === "left" ? "selected" : ""}>Left</option>
            <option value="center" ${section.imgPosition === "center" ? "selected" : ""}>Center</option>
            <option value="right" ${section.imgPosition === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
        <button class="remove-inline-section-btn">Delete Section</button>
      </div>
    `;
  }

  let sectionsHTML = "";
  (festival.sections || []).forEach((section, index) => { sectionsHTML += sectionHTML(section, index + 1); });

  editor.innerHTML = `
    <div class="festival-edit-panel">
      <input class="inline-festival-title" value="${festival.title || ""}" placeholder="Festival Title">
      <input class="inline-festival-slug" value="${festival.slug || slugify(festival.title) || ""}" placeholder="Slug / Clean URL (e.g. vinayaka-chavithi)">
      <div class="festival-card-upload-box inline-card-image" data-image="${festival.cardImage || ""}">
        ${festival.cardImage ? `<img src="${festival.cardImage}">` : `<span>＋ Festival Card Image</span>`}
      </div>
      <input class="inline-footer-quote" value="${festival.footerQuote || ""}" placeholder="Footer Quote">

      <h3>మొత్తం Matter పేస్ట్ చేయండి</h3>
      <p class="bulk-paste-hint">ప్రతి heading ముందు <code>##</code> పెట్టండి.</p>
      <textarea class="inline-bulk-paste" placeholder="## Heading&#10;matter...&#10;&#10;## Heading 2&#10;matter..." rows="8"></textarea>
      <button class="parse-inline-bulk-btn" type="button">Sections గా మార్చండి ⬇</button>

      <h3>Sections</h3>
      <div class="inline-sections-list">${sectionsHTML}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button class="add-inline-section-btn" type="button">+ Add Section</button>
        <button class="save-inline-festival-btn" type="button">Save Changes</button>
        <button class="cancel-inline-festival-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
      </div>
    </div>
  `;

  function attachEditorEvents() {
    editor.querySelector(".inline-card-image").onclick = async (e) => {
      const url = await uploadImage(); if (!url) return;
      e.currentTarget.dataset.image = url; e.currentTarget.innerHTML = `<img src="${url}">`;
    };
    editor.querySelectorAll(".inline-section-image").forEach(slot => {
      slot.onclick = async () => {
        const url = await uploadImage(); if (!url) return;
        slot.dataset.image = url; slot.innerHTML = `<img src="${url}">`;
      };
    });
    editor.querySelectorAll(".remove-inline-section-btn").forEach(btn => {
      btn.onclick = () => btn.closest(".inline-section-edit").remove();
    });
  }
  attachEditorEvents();

  editor.querySelector(".add-inline-section-btn").addEventListener("click", () => {
    editor.querySelector(".inline-sections-list").insertAdjacentHTML("beforeend", sectionHTML({}, "New"));
    attachEditorEvents();
  });

  editor.querySelector(".cancel-inline-festival-btn").addEventListener("click", () => {
    editor.innerHTML = "";
  });

  editor.querySelector(".parse-inline-bulk-btn").addEventListener("click", () => {
    const raw = editor.querySelector(".inline-bulk-paste").value;
    const sections = parseBulkFestivalText(raw);
    if (sections.length === 0) {
      alert("పార్స్ చేయడానికి ఏమీ దొరకలేదు — ## తో heading పెట్టారో చూడండి");
      return;
    }
    const list = editor.querySelector(".inline-sections-list");
    sections.forEach(s => {
      list.insertAdjacentHTML("beforeend", sectionHTML({ title: s.title, content: s.content }, "New"));
    });
    attachEditorEvents();
    editor.querySelector(".inline-bulk-paste").value = "";
  });

  editor.querySelector(".save-inline-festival-btn").addEventListener("click", async () => {
    const sectionBoxes = editor.querySelectorAll(".inline-section-edit");
    const sections = [];
    sectionBoxes.forEach(box => {
      sections.push({
        title: box.querySelector(".inline-section-title").value.trim(),
        content: box.querySelector(".inline-section-content").value.trim(),
        image: box.querySelector(".inline-section-image").dataset.image || "",
        imgWidth: Number(box.querySelector(".img-width-input").value) || 75,
        imgHeight: Number(box.querySelector(".img-height-input").value) || 420,
        imgBrightness: Number(box.querySelector(".img-brightness-input").value) || 100,
        imgPosition: box.querySelector(".img-position-input").value || "center"
      });
    });
    const updatedTitle = editor.querySelector(".inline-festival-title").value.trim();
    const updatedSlug = editor.querySelector(".inline-festival-slug")?.value.trim() || slugify(updatedTitle);
    await updateDoc(doc(db, "festivals", id), {
      title: updatedTitle,
      slug: updatedSlug,
      cardImage: editor.querySelector(".inline-card-image").dataset.image || "",
      footerQuote: editor.querySelector(".inline-footer-quote").value.trim(),
      sections, updatedAt: serverTimestamp()
    });
    alert("✅ Festival updated"); loadAdminFestivals();
  });
}
loadAdminFestivals();

/* ══════════════════════════════════════
   🪷 EKADASHI CMS
══════════════════════════════════════ */

const seedEkadashisBtn = document.getElementById("seedEkadashisBtn");
const seedEkadashisMsg = document.getElementById("seedEkadashisMsg");
const saveEkadashiBtn = document.getElementById("saveEkadashiBtn");
const cancelEkadashiEditBtn = document.getElementById("cancelEkadashiEditBtn");
const ekadashiMsg = document.getElementById("ekadashiMsg");
const ekadashiFormTitle = document.getElementById("ekadashiFormTitle");
const editingEkadashiId = document.getElementById("editingEkadashiId");

const ekadashiTitleInput = document.getElementById("ekadashiTitle");
const ekadashiTitleEnInput = document.getElementById("ekadashiTitleEn");
const ekadashiSlugInput = document.getElementById("ekadashiSlug");
const ekadashiMasamSelect = document.getElementById("ekadashiMasam");
const ekadashiPakshamSelect = document.getElementById("ekadashiPaksham");
const ekadashiDeityInput = document.getElementById("ekadashiDeity");
const ekadashiIsMajorCheckbox = document.getElementById("ekadashiIsMajor");
const ekadashiCardImageInput = document.getElementById("ekadashiCardImage");
const ekadashiImageUploadBox = document.getElementById("ekadashiImageUploadBox");
const ekadashiSummaryInput = document.getElementById("ekadashiSummary");
const ekadashiStoryInput = document.getElementById("ekadashiStory");
const ekadashiVidhanamInput = document.getElementById("ekadashiVidhanam");
const ekadashiPhalamInput = document.getElementById("ekadashiPhalam");

const adminEkadashiCount = document.getElementById("adminEkadashiCount");
const adminEkadashisList = document.getElementById("adminEkadashisList");
const adminEkadashiSearch = document.getElementById("adminEkadashiSearch");
const adminEkadashiFilterPaksha = document.getElementById("adminEkadashiFilterPaksha");

let adminEkadashiCache = [];

// Image upload for Ekadashi
if (ekadashiImageUploadBox) {
  ekadashiImageUploadBox.addEventListener("click", async () => {
    try {
      const url = await uploadImage();
      if (url) {
        ekadashiCardImageInput.value = url;
        ekadashiImageUploadBox.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
      }
    } catch (e) {
      console.warn("Upload error:", e);
    }
  });
}

// Auto-generate slug from English title or Telugu title
ekadashiTitleEnInput?.addEventListener("input", () => {
  if (!editingEkadashiId.value && ekadashiTitleEnInput.value) {
    ekadashiSlugInput.value = slugify(ekadashiTitleEnInput.value);
  }
});

// Load Ekadashis in Admin
async function loadAdminEkadashis() {
  if (!adminEkadashisList) return;

  try {
    const snap = await getDocs(collection(db, "ekadashis"));
    let items = [];

    if (!snap.empty) {
      snap.forEach((d) => {
        items.push({ docId: d.id, ...d.data() });
      });
    } else {
      // If Firestore collection is empty, display canonical pre-seeded data as ready-to-sync
      items = EKADASHI_LIST.map((item) => ({ docId: item.slug, ...item, isLocalDefault: true }));
    }

    adminEkadashiCache = items;
    renderAdminEkadashis();
  } catch (err) {
    console.error("Error loading admin ekadashis:", err);
    // Fallback to built-in list
    adminEkadashiCache = EKADASHI_LIST.map((item) => ({ docId: item.slug, ...item, isLocalDefault: true }));
    renderAdminEkadashis();
  }
}

function renderAdminEkadashis() {
  if (!adminEkadashisList) return;

  const searchTerm = (adminEkadashiSearch?.value || "").toLowerCase().trim();
  const selectedPaksha = adminEkadashiFilterPaksha?.value || "";

  const filtered = adminEkadashiCache.filter((item) => {
    if (selectedPaksha && !item.paksham?.includes(selectedPaksha)) return false;
    if (searchTerm) {
      const t = (item.title || "").toLowerCase();
      const te = (item.titleEn || "").toLowerCase();
      const m = (item.masam || "").toLowerCase();
      const d = (item.deity || "").toLowerCase();
      if (!t.includes(searchTerm) && !te.includes(searchTerm) && !m.includes(searchTerm) && !d.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  if (adminEkadashiCount) {
    adminEkadashiCount.innerText = filtered.length;
  }

  adminEkadashisList.innerHTML = "";

  if (filtered.length === 0) {
    adminEkadashisList.innerHTML = `<p style="padding:20px;text-align:center;color:rgba(255,255,255,0.6);">ఎటువంటి ఏకాదశి వివరాలు లభించలేదు.</p>`;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "admin-event-card";
    card.style.position = "relative";

    const isShukla = item.paksham?.includes("శుక్ల");
    const pakshaColor = isShukla ? "#ffd166" : "#a8dadc";

    card.innerHTML = `
      <div style="width:72px;min-width:72px;height:72px;border-radius:14px;background:linear-gradient(135deg, rgba(255,209,102,0.18), rgba(255,183,3,0.06));border:1.5px solid rgba(255,209,102,0.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;box-shadow:inset 0 0 10px rgba(255,209,102,0.08);">
        <span style="font-size:1.6rem;line-height:1;">🪷</span>
        <span style="font-size:0.68rem;color:#ffd166;font-weight:700;text-align:center;line-height:1.1;padding:0 3px;">${item.masam?.replace(' మాసం','') || 'ఏకాదశి'}</span>
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
          <h3 style="margin:0;color:#ffd166;">${item.title}</h3>
          ${item.isMajor ? `<span style="background:#e63946;color:#fff;font-size:0.75rem;padding:2px 8px;border-radius:10px;font-weight:bold;">⭐ ముఖ్యమైనది</span>` : ""}
          ${item.isLocalDefault ? `<span style="background:rgba(255,209,102,0.15);color:#ffd166;font-size:0.75rem;padding:2px 8px;border-radius:10px;">⚡ ప్రీ-సీడెడ్</span>` : `<span style="background:rgba(76,175,80,0.2);color:#81c784;font-size:0.75rem;padding:2px 8px;border-radius:10px;">✓ ఫైర్‌స్టోర్</span>`}
        </div>
        <p style="margin:2px 0 6px;color:rgba(255,255,255,0.7);font-size:0.9rem;">
          <strong>${item.titleEn || ""}</strong> | 📅 ${item.masam} • <span style="color:${pakshaColor};font-weight:bold;">${item.paksham}</span>
        </p>
        <p style="margin:2px 0 8px;color:#ffe484;font-size:0.86rem;">
          🙏 అధిష్టాన దైవం: <strong>${item.deity || "శ్రీ మహావిష్ణువు"}</strong>
        </p>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.8);font-size:0.88rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${item.summary || item.story?.slice(0, 120) || ""}...
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="edit-ekadashi-btn" data-id="${item.docId}" style="background:#ffd166;color:#1a0c02;border:none;padding:6px 16px;border-radius:12px;font-weight:700;cursor:pointer;">
            ✏️ సవరించండి (Edit)
          </button>
          <button class="delete-ekadashi-btn" data-id="${item.docId}" data-name="${item.title}" style="background:rgba(230,57,70,0.85);color:#fff;border:none;padding:6px 14px;border-radius:12px;font-weight:700;cursor:pointer;">
            🗑️ డిలీట్
          </button>
          <a href="../festivals/?category=ekadashi&ekadashi=${item.slug}" target="_blank" style="color:#ffd166;text-decoration:none;font-size:0.88rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:rgba(255,255,255,0.06);border-radius:10px;">
            🔗 వెబ్‌సైట్‌లో చూడండి ↗
          </a>
        </div>
      </div>
    `;

    adminEkadashisList.appendChild(card);
  });

  // Attach Edit and Delete Handlers
  document.querySelectorAll(".edit-ekadashi-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = adminEkadashiCache.find((e) => e.docId === btn.dataset.id);
      if (item) openEkadashiEdit(item);
    });
  });

  document.querySelectorAll(".delete-ekadashi-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const docId = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`మీరు ఖచ్చితంగా "${name}" ఏకాదశిని తొలగించాలనుకుంటున్నారా?`)) return;

      try {
        await deleteDoc(doc(db, "ekadashis", docId));
        alert(`"${name}" విజయవంతంగా తొలగించబడింది.`);
        loadAdminEkadashis();
      } catch (err) {
        alert("తొలగించడంలో సమస్య: " + err.message);
      }
    });
  });
}

adminEkadashiSearch?.addEventListener("input", renderAdminEkadashis);
adminEkadashiFilterPaksha?.addEventListener("change", renderAdminEkadashis);

// Populate Form for Editing
function openEkadashiEdit(item) {
  editingEkadashiId.value = item.docId;
  ekadashiFormTitle.innerText = `ఏకాదశి సవరణ: ${item.title}`;

  ekadashiTitleInput.value = item.title || "";
  ekadashiTitleEnInput.value = item.titleEn || "";
  ekadashiSlugInput.value = item.slug || item.docId || "";
  if (ekadashiMasamSelect) ekadashiMasamSelect.value = item.masam || "చైత్ర మాసం";
  if (ekadashiPakshamSelect) ekadashiPakshamSelect.value = item.paksham || "శుక్ల పక్షం";
  ekadashiDeityInput.value = item.deity || "";
  ekadashiIsMajorCheckbox.checked = !!item.isMajor;
  ekadashiCardImageInput.value = item.cardImage || "";
  ekadashiSummaryInput.value = item.summary || "";
  ekadashiStoryInput.value = item.story || "";
  ekadashiVidhanamInput.value = item.vidhanam || "";
  ekadashiPhalamInput.value = item.phalam || "";

  if (item.cardImage && ekadashiImageUploadBox) {
    ekadashiImageUploadBox.innerHTML = `<img src="${item.cardImage}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
  }

  saveEkadashiBtn.innerText = "మార్పులను భద్రపరచండి (Update Changes)";
  if (cancelEkadashiEditBtn) cancelEkadashiEditBtn.style.display = "inline-block";

  document.getElementById("ekadashiFormContainer")?.scrollIntoView({ behavior: "smooth" });
}

function resetEkadashiForm() {
  editingEkadashiId.value = "";
  ekadashiFormTitle.innerText = "కొత్త ఏకాదశి జోడించండి / సవరించండి";

  ekadashiTitleInput.value = "";
  ekadashiTitleEnInput.value = "";
  ekadashiSlugInput.value = "";
  if (ekadashiMasamSelect) ekadashiMasamSelect.selectedIndex = 0;
  if (ekadashiPakshamSelect) ekadashiPakshamSelect.selectedIndex = 0;
  ekadashiDeityInput.value = "";
  ekadashiIsMajorCheckbox.checked = false;
  ekadashiCardImageInput.value = "";
  if (ekadashiImageUploadBox) {
    ekadashiImageUploadBox.innerHTML = "<span>＋ Ekadashi Image Upload</span>";
  }
  ekadashiSummaryInput.value = "";
  ekadashiStoryInput.value = "";
  ekadashiVidhanamInput.value = "";
  ekadashiPhalamInput.value = "";

  saveEkadashiBtn.innerText = "ఏకాదశి వివరాలు సేవ్ చేయండి (Save Ekadashi)";
  if (cancelEkadashiEditBtn) cancelEkadashiEditBtn.style.display = "none";
}

cancelEkadashiEditBtn?.addEventListener("click", resetEkadashiForm);

// Save or Update Ekadashi
saveEkadashiBtn?.addEventListener("click", async () => {
  const title = ekadashiTitleInput.value.trim();
  const titleEn = ekadashiTitleEnInput.value.trim();
  let slug = ekadashiSlugInput.value.trim() || slugify(titleEn || title);
  const masam = ekadashiMasamSelect.value;
  const paksham = ekadashiPakshamSelect.value;
  const deity = ekadashiDeityInput.value.trim();
  const isMajor = ekadashiIsMajorCheckbox.checked;
  const cardImage = ekadashiCardImageInput.value.trim() || "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=700&auto=format&fit=crop&q=80";
  const summary = ekadashiSummaryInput.value.trim();
  const story = ekadashiStoryInput.value.trim();
  const vidhanam = ekadashiVidhanamInput.value.trim();
  const phalam = ekadashiPhalamInput.value.trim();

  if (!title) {
    alert("దయచేసి ఏకాదశి పేరు నమోదు చేయండి.");
    return;
  }

  saveEkadashiBtn.disabled = true;
  saveEkadashiBtn.innerText = "సేవ్ అవుతోంది...";
  ekadashiMsg.innerText = "";

  const ekadashiData = {
    title,
    titleEn,
    slug,
    masam,
    paksham,
    tithi: "ఏకాదశి",
    deity,
    isMajor,
    cardImage,
    summary,
    story,
    vidhanam,
    phalam,
    updatedAt: serverTimestamp()
  };

  try {
    const editId = editingEkadashiId.value;
    if (editId) {
      await updateDoc(doc(db, "ekadashis", editId), ekadashiData);
      ekadashiMsg.innerHTML = `<span style="color:#81c784;">✓ "${title}" విజయవంతంగా నవీకరించబడింది!</span>`;
    } else {
      ekadashiData.createdAt = serverTimestamp();
      await setDoc(doc(db, "ekadashis", slug), ekadashiData);
      ekadashiMsg.innerHTML = `<span style="color:#81c784;">✓ "${title}" కొత్త ఏకాదశిగా సేవ్ చేయబడింది!</span>`;
    }

    resetEkadashiForm();
    await loadAdminEkadashis();
  } catch (err) {
    console.error("Save error:", err);
    ekadashiMsg.innerHTML = `<span style="color:#e63946;">Error: ${err.message}</span>`;
  } finally {
    saveEkadashiBtn.disabled = false;
  }
});

// Seed All 26 Ekadashis to Firestore
seedEkadashisBtn?.addEventListener("click", async () => {
  if (!confirm("మొత్తం 26 పవిత్ర ఏకాదశుల ప్రామాణిక వివరాలను ఫైర్‌స్టోర్ డేటాబేస్‌కు సీడ్ (అప్‌లోడ్) చేయాలా?")) {
    return;
  }

  seedEkadashisBtn.disabled = true;
  seedEkadashisBtn.innerText = "⚡ సీడ్ అవుతోంది... (0 / 26)";
  seedEkadashisMsg.innerHTML = "";

  try {
    let count = 0;
    for (const item of EKADASHI_LIST) {
      await setDoc(doc(db, "ekadashis", item.slug), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      count++;
      seedEkadashisBtn.innerText = `⚡ సీడ్ అవుతోంది... (${count} / 26)`;
    }

    seedEkadashisMsg.innerHTML = `<span style="color:#81c784;">🎉 అద్భుతం! మొత్తం 26 ఏకాదశులు విజయవంతంగా ఫైర్‌స్టోర్ డేటాబేస్‌లో నిక్షిప్తమైనవి. ఇప్పుడు మీరు ప్రతి ఏకాదశిని ఇక్కడినుండే ఎడిట్ చేయవచ్చు!</span>`;
    alert("🎉 మొత్తం 26 ఏకాదశులు విజయవంతంగా ఫైర్‌స్టోర్ డేటాబేస్‌కు అప్‌లోడ్ చేయబడ్డాయి!");
    await loadAdminEkadashis();
  } catch (err) {
    console.error("Seeding error:", err);
    seedEkadashisMsg.innerHTML = `<span style="color:#e63946;">సీడింగ్ లోపం: ${err.message}</span>`;
    alert("సీడింగ్ లోపం: " + err.message);
  } finally {
    seedEkadashisBtn.disabled = false;
    seedEkadashisBtn.innerText = "⚡ Seed All 26 Ekadashis to Firestore";
  }
});

// Initialize Ekadashi CMS
loadAdminEkadashis();



/* ══════════════════════════════════════
   ITHIHASALU CMS
══════════════════════════════════════ */

// ── CATEGORY ──

const ithiCatImageBox = document.getElementById("ithiCatImageBox");
if (ithiCatImageBox) {
  ithiCatImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    ithiCatImageBox.dataset.image = url;
    ithiCatImageBox.innerHTML = `<img src="${url}">`;
  });
}

const saveIthiCatBtn = document.getElementById("saveIthiCatBtn");
if (saveIthiCatBtn) {
  saveIthiCatBtn.addEventListener("click", async () => {
    const title = document.getElementById("ithiCatTitle").value.trim();
    const order = Number(document.getElementById("ithiCatOrder").value) || 0;
    const image = ithiCatImageBox?.dataset.image || "";

    if (!title) {
      document.getElementById("ithiCatMsg").innerText = "Category title required";
      return;
    }

    await addDoc(collection(db, "ithihasaluCategories"), {
      title, order, image, createdAt: serverTimestamp()
    });

    document.getElementById("ithiCatMsg").innerText = "✅ Category saved";
    document.getElementById("ithiCatTitle").value = "";
    document.getElementById("ithiCatOrder").value = "";
    if (ithiCatImageBox) {
      ithiCatImageBox.dataset.image = "";
      ithiCatImageBox.innerHTML = `<span>＋ Category Image</span>`;
    }

    loadIthiCategories();
  });
}

async function loadIthiCategories() {
  const list = document.getElementById("ithiCatList");
  const subSelect = document.getElementById("ithiSubCatSelect");
  if (!list) return;

  const q = query(collection(db, "ithihasaluCategories"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  list.innerHTML = "";
  if (subSelect) subSelect.innerHTML = `<option value="">Select Category</option>`;

  snap.forEach(d => {
    const data = d.data();

    if (subSelect) subSelect.innerHTML += `<option value="${d.id}">${data.title}</option>`;

    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
          ${data.image ? `<img src="${data.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">` : ""}
          <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
          <span style="color:rgba(255,255,255,0.4);font-size:12px;">(Order: ${data.order || 0})</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn ithi-cat-edit-btn" data-id="${d.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${d.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="ithiCatEdit-${d.id}" style="display:none;">
        <input class="ice-title" value="${data.title || ""}" placeholder="Category Title">
        <input class="ice-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">
        <div class="festival-card-upload-box ice-image-slot" data-image="${data.image || ""}">
          ${data.image ? `<img src="${data.image}" style="max-height:120px;">` : `<span>＋ Category Image</span>`}
        </div>
        <div class="general-inline-edit-actions">
          <button class="save-ice-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-ice-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#ithiCatEdit-${d.id}`);
    const imgSlot = row.querySelector(".ice-image-slot");

    row.querySelector(".ithi-cat-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-ice-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    imgSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imgSlot.dataset.image = url;
      imgSlot.innerHTML = `<img src="${url}" style="max-height:120px;">`;
    });
    row.querySelector(".save-ice-btn").addEventListener("click", async () => {
      const title = editBox.querySelector(".ice-title").value.trim();
      const order = Number(editBox.querySelector(".ice-order").value) || 0;
      const image = imgSlot.dataset.image || "";
      if (!title) {
        alert("Title is required");
        return;
      }
      await updateDoc(doc(db, "ithihasaluCategories", d.id), {
        title, order, image, updatedAt: serverTimestamp()
      });
      alert("✅ Category updated");
      loadIthiCategories();
    });

    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "ithihasaluCategories", d.id));
      loadIthiCategories();
    });
    list.appendChild(row);
  });
}
loadIthiCategories();

// ── SUB CATEGORY ──

const saveIthiSubBtn = document.getElementById("saveIthiSubBtn");
if (saveIthiSubBtn) {
  saveIthiSubBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("ithiSubCatSelect").value;
    const title = document.getElementById("ithiSubTitle").value.trim();
    const order = Number(document.getElementById("ithiSubOrder").value) || 0;

    if (!categoryId || !title) {
      document.getElementById("ithiSubMsg").innerText = "Category and title required";
      return;
    }

    await addDoc(collection(db, "ithihasaluSubCategories"), {
      categoryId, title, order, shlokaCount: 0, createdAt: serverTimestamp()
    });

    document.getElementById("ithiSubMsg").innerText = "✅ Sub Category saved";
    document.getElementById("ithiSubTitle").value = "";
    document.getElementById("ithiSubOrder").value = "";

    loadIthiSubCategories();
  });
}

async function loadIthiSubCategories() {
  const list = document.getElementById("ithiSubList");
  const shlokaSelect = document.getElementById("ithiShlokaSubSelect");
  const filterSelect = document.getElementById("ithiShlokaFilterSub");
  if (!list) return;

  const catSnap = await getDocs(collection(db, "ithihasaluCategories"));
  const catMap = {};
  const catList = [];
  catSnap.forEach(d => {
    catMap[d.id] = d.data().title;
    catList.push({ id: d.id, ...d.data() });
  });
  catList.sort((a, b) => (a.order || 0) - (b.order || 0));

  const q = query(collection(db, "ithihasaluSubCategories"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  list.innerHTML = "";
  if (shlokaSelect) shlokaSelect.innerHTML = `<option value="">Select Sub Category</option>`;
  if (filterSelect) filterSelect.innerHTML = `<option value="">Filter by Sub Category</option>`;

  snap.forEach(d => {
    const data = d.data();
    const label = `${catMap[data.categoryId] || "?"} → ${data.title}`;

    if (shlokaSelect) shlokaSelect.innerHTML += `<option value="${d.id}">${label}</option>`;
    if (filterSelect) filterSelect.innerHTML += `<option value="${d.id}">${label}</option>`;

    let catOptions = `<option value="">Select Category</option>`;
    catList.forEach(c => {
      catOptions += `<option value="${c.id}" ${c.id === data.categoryId ? "selected" : ""}>${c.title}</option>`;
    });

    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text">
          <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
          <span style="color:rgba(255,255,255,0.5);font-size:13px;"> (${catMap[data.categoryId] || "Unknown"})</span>
          <span style="color:rgba(255,255,255,0.4);font-size:12px;">(Order: ${data.order || 0})</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn ithi-sub-edit-btn" data-id="${d.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${d.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="ithiSubEdit-${d.id}" style="display:none;">
        <select class="isce-category">${catOptions}</select>
        <input class="isce-title" value="${data.title || ""}" placeholder="Sub Category Title">
        <input class="isce-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">
        <div class="general-inline-edit-actions">
          <button class="save-isce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-isce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#ithiSubEdit-${d.id}`);
    row.querySelector(".ithi-sub-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-isce-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    row.querySelector(".save-isce-btn").addEventListener("click", async () => {
      const categoryId = editBox.querySelector(".isce-category").value;
      const title = editBox.querySelector(".isce-title").value.trim();
      const order = Number(editBox.querySelector(".isce-order").value) || 0;
      if (!categoryId || !title) {
        alert("Category and Title required");
        return;
      }
      await updateDoc(doc(db, "ithihasaluSubCategories", d.id), {
        categoryId, title, order, updatedAt: serverTimestamp()
      });
      alert("✅ Sub Category updated");
      loadIthiSubCategories();
    });

    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this sub category?")) return;
      await deleteDoc(doc(db, "ithihasaluSubCategories", d.id));
      loadIthiSubCategories();
    });
    list.appendChild(row);
  });
}
loadIthiSubCategories();

// ── SHLOKA ──

const ithiShlokaAudioBox = document.getElementById("ithiShlokaAudioBox");
if (ithiShlokaAudioBox) {
  ithiShlokaAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile("ithiShlokaAudioBox");
    if (!url) return;
    ithiShlokaAudioBox.dataset.audio = url;
    ithiShlokaAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const audioInput = document.getElementById("ithiShlokaAudioUrl");
    if (audioInput) audioInput.value = url;
  });
}

const saveIthiShlokaBtn = document.getElementById("saveIthiShlokaBtn");
if (saveIthiShlokaBtn) {
  saveIthiShlokaBtn.addEventListener("click", async () => {
    const subCategoryId = document.getElementById("ithiShlokaSubSelect").value;
    const number = document.getElementById("ithiShlokaNumber").value.trim();
    const shloka = document.getElementById("ithiShlokaText").value.trim();
    const explanation = document.getElementById("ithiShlokaExplanation").value.trim();
    const audioUrl = document.getElementById("ithiShlokaAudioUrl")?.value.trim() || ithiShlokaAudioBox?.dataset.audio || "";
    const order = Number(document.getElementById("ithiShlokaOrder").value) || 0;

    if (!subCategoryId || !number || !shloka) {
      document.getElementById("ithiShlokaMsg").innerText = "Sub category, number and shloka text required";
      return;
    }

    await addDoc(collection(db, "ithihasaluShlokas"), {
      subCategoryId, number, shloka, explanation, audioUrl, order, createdAt: serverTimestamp()
    });

    // keep shlokaCount in sync on the sub-category doc
    const subRef = doc(db, "ithihasaluSubCategories", subCategoryId);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      await updateDoc(subRef, { shlokaCount: (subSnap.data().shlokaCount || 0) + 1 });
    }

    document.getElementById("ithiShlokaMsg").innerText = "✅ శ్లోకం saved";
    document.getElementById("ithiShlokaNumber").value = "";
    document.getElementById("ithiShlokaText").value = "";
    document.getElementById("ithiShlokaExplanation").value = "";
    document.getElementById("ithiShlokaOrder").value = "";
    const urlInput = document.getElementById("ithiShlokaAudioUrl");
    if (urlInput) urlInput.value = "";
    if (ithiShlokaAudioBox) {
      ithiShlokaAudioBox.dataset.audio = "";
      ithiShlokaAudioBox.innerHTML = `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`;
    }

    loadIthiShlokas();
  });
}

const ithiShlokaFilterSub = document.getElementById("ithiShlokaFilterSub");
if (ithiShlokaFilterSub) {
  ithiShlokaFilterSub.addEventListener("change", () => loadIthiShlokas(ithiShlokaFilterSub.value));
}

async function loadIthiShlokas(filterSubId = "") {
  const list = document.getElementById("ithiShlokaList");
  if (!list) return;

  const subSnap = await getDocs(collection(db, "ithihasaluSubCategories"));
  const subMap = {};
  subSnap.forEach(d => { subMap[d.id] = d.data().title; });

  const q = query(collection(db, "ithihasaluShlokas"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  let items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));

  if (filterSubId) items = items.filter(item => item.subCategoryId === filterSubId);

  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = "<p style='color:rgba(255,255,255,0.5);text-align:center'>శ్లోకాలు లేవు</p>";
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.style.gap = "8px";

    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:8px;">
        <span><strong style="color:#ffd166;">${item.number}</strong> — ${subMap[item.subCategoryId] || "Unknown"}</span>
        <div style="display:flex;gap:8px;">
          <button class="ithi-edit-btn cms-list-edit-btn" data-id="${item.id}" type="button">✏️ Edit</button>
          <button class="ithi-delete-btn cms-list-delete-btn" data-id="${item.id}" data-sub="${item.subCategoryId}" type="button">Delete</button>
        </div>
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);">${(item.shloka || "").substring(0, 80)}...</div>

      <!-- AUDIO CONTROLS ON CARD -->
      <div class="content-audio-card-box" style="margin:4px 0 8px;">
        ${item.audioUrl ? `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:220px;">
              <span>🎵</span>
              <audio src="${item.audioUrl}" controls style="height:32px;flex:1;"></audio>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="ithi-change-audio-btn" data-id="${item.id}" type="button" style="padding:4px 10px;font-size:0.8rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;">🔄 మార్చండి</button>
              <button class="ithi-remove-audio-btn" data-id="${item.id}" data-sub="${item.subCategoryId}" type="button" style="padding:4px 8px;font-size:0.8rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌</button>
            </div>
          </div>
        ` : `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.82rem;color:rgba(255,255,255,0.5);">⚠️ ఆడియో లేదు (No audio)</span>
            <button class="ithi-quick-add-audio-btn" data-id="${item.id}" type="button" style="padding:6px 12px;font-size:0.82rem;border-radius:8px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">
              🎵 ＋ Audio File అప్‌లోడ్ చేయండి
            </button>
          </div>
        `}
      </div>

      <div class="ithi-edit-box" id="ithiEdit-${item.id}" style="display:none;width:100%;flex-direction:column;gap:10px;">
        <input class="ithi-e-number" value="${item.number || ""}" placeholder="Number" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        <textarea class="ithi-e-shloka" placeholder="Shloka" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${item.shloka || ""}</textarea>
        <textarea class="ithi-e-explanation" placeholder="Explanation" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${item.explanation || ""}</textarea>
        
        <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:10px;padding:10px;margin:2px 0;">
          <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:6px;font-size:0.88rem;">🎵 శ్లోకం ఆడియో (Audio):</label>
          <div class="cms-audio-upload-box ithi-e-audio-box" data-audio="${item.audioUrl || ""}" style="cursor:pointer;margin-bottom:6px;">
            ${item.audioUrl ? `<audio src="${item.audioUrl}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3)</span>`}
          </div>
          <input class="ithi-e-audio-url" value="${item.audioUrl || ""}" placeholder="లేదా Audio URL ఇవ్వండి" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        </div>

        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="ithi-save-edit-btn" data-id="${item.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
          <button class="ithi-cancel-edit-btn" data-id="${item.id}" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:bold;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const box = row.querySelector(`#ithiEdit-${item.id}`);
    const audioUploadBox = box.querySelector(".ithi-e-audio-box");
    const audioUrlInput = box.querySelector(".ithi-e-audio-url");

    if (audioUploadBox) {
      audioUploadBox.addEventListener("click", async () => {
        const url = await uploadAudioFile(audioUploadBox);
        if (!url) return;
        audioUploadBox.dataset.audio = url;
        audioUploadBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
        if (audioUrlInput) audioUrlInput.value = url;
      });
    }

    row.querySelector(".ithi-edit-btn").addEventListener("click", () => {
      box.style.display = box.style.display === "none" ? "flex" : "none";
    });

    row.querySelector(".ithi-cancel-edit-btn").addEventListener("click", () => {
      box.style.display = "none";
    });

    // Quick audio actions on card
    const quickAddBtn = row.querySelector(".ithi-quick-add-audio-btn");
    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", async () => {
        const url = await uploadAudioFile(quickAddBtn);
        if (!url) return;
        await updateDoc(doc(db, "ithihasaluShlokas", item.id), { audioUrl: url, updatedAt: serverTimestamp() });
        alert("✅ ఆడియో విజయవంతంగా జోడించబడింది");
        loadIthiShlokas(filterSubId);
      });
    }
    const changeBtn = row.querySelector(".ithi-change-audio-btn");
    if (changeBtn) {
      changeBtn.addEventListener("click", async () => {
        const url = await uploadAudioFile(changeBtn);
        if (!url) return;
        await updateDoc(doc(db, "ithihasaluShlokas", item.id), { audioUrl: url, updatedAt: serverTimestamp() });
        alert("✅ ఆడియో అప్‌డేట్ చేయబడింది");
        loadIthiShlokas(filterSubId);
      });
    }
    const removeBtn = row.querySelector(".ithi-remove-audio-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", async () => {
        if (!confirm("ఈ శ్లోకం నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
        await updateDoc(doc(db, "ithihasaluShlokas", item.id), { audioUrl: "", updatedAt: serverTimestamp() });
        alert("✅ ఆడియో తొలగించబడింది");
        loadIthiShlokas(filterSubId);
      });
    }

    row.querySelector(".ithi-delete-btn").addEventListener("click", async (e) => {
      if (!confirm("Delete this shloka?")) return;
      const btn = e.currentTarget;
      await deleteDoc(doc(db, "ithihasaluShlokas", btn.dataset.id));

      const subRef = doc(db, "ithihasaluSubCategories", btn.dataset.sub);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        await updateDoc(subRef, { shlokaCount: Math.max((subSnap.data().shlokaCount || 1) - 1, 0) });
      }

      loadIthiShlokas(filterSubId);
    });

    row.querySelector(".ithi-save-edit-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const finalAudio = audioUrlInput.value.trim() || audioUploadBox?.dataset.audio || "";
      await updateDoc(doc(db, "ithihasaluShlokas", btn.dataset.id), {
        number: box.querySelector(".ithi-e-number").value.trim(),
        shloka: box.querySelector(".ithi-e-shloka").value.trim(),
        explanation: box.querySelector(".ithi-e-explanation").value.trim(),
        audioUrl: finalAudio,
        updatedAt: serverTimestamp()
      });
      alert("✅ శ్లోకం updated");
      loadIthiShlokas(filterSubId);
    });

    list.appendChild(row);
  });
}
loadIthiShlokas();


/* ══════════════════════════════════════
   TEMPLE CATEGORIES CMS
══════════════════════════════════════ */
 
/* ══════════════════════════════════════
   TEMPLE CATEGORIES CMS
══════════════════════════════════════ */
 
const templeCatImageBox = document.getElementById("templeCatImageBox");
if (templeCatImageBox) {
  templeCatImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    templeCatImageBox.dataset.image = url;
    templeCatImageBox.innerHTML = `<img src="${url}">`;
  });
}
 
const saveTempleCatBtn = document.getElementById("saveTempleCatBtn");
if (saveTempleCatBtn) {
  saveTempleCatBtn.addEventListener("click", async () => {
    const title = document.getElementById("templeCatTitle").value.trim();
    const order = Number(document.getElementById("templeCatOrder").value) || 0;
    const cardImage = templeCatImageBox?.dataset.image || "";
 
    if (!title || !cardImage) {
      document.getElementById("templeCatMsg").innerText = "విభాగం పేరు మరియు image required";
      return;
    }
 
    await addDoc(collection(db, "templeCategories"), {
      title, order, cardImage, createdAt: serverTimestamp()
    });
 
    document.getElementById("templeCatMsg").innerText = "✅ Category saved";
    document.getElementById("templeCatTitle").value = "";
    document.getElementById("templeCatOrder").value = "";
    if (templeCatImageBox) {
      templeCatImageBox.dataset.image = "";
      templeCatImageBox.innerHTML = `<span>＋ Category Image</span>`;
    }
 
    loadTempleCategories();
  });
}
 
async function loadTempleCategories() {
  const list = document.getElementById("templeCatList");
  const addSelect = document.getElementById("templeCategorySelect");
  const filterSelect = document.getElementById("templeFilterCategorySelect");
  if (!list) return;
 
  const q = query(collection(db, "templeCategories"), orderBy("order", "asc"));
  const snap = await getDocs(q);
 
  list.innerHTML = "";
  if (addSelect) addSelect.innerHTML = `<option value="">విభాగం ఎంచుకోండి</option>`;
  if (filterSelect) filterSelect.innerHTML = `<option value="">Filter by Category</option>`;
 
  snap.forEach(d => {
    const data = d.data();
 
    if (addSelect) addSelect.innerHTML += `<option value="${d.id}">${data.title}</option>`;
    if (filterSelect) filterSelect.innerHTML += `<option value="${d.id}">${data.title}</option>`;
 
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
          ${data.cardImage ? `<img src="${data.cardImage}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">` : ""}
          <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
          <span style="color:rgba(255,255,255,0.4);font-size:12px;">(Order: ${data.order || 0})</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn" data-id="${d.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${d.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="templeCatEdit-${d.id}" style="display:none;">
        <input class="tce-title" value="${data.title || ""}" placeholder="Category Title">
        <input class="tce-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">
        <div class="festival-card-upload-box tce-card-image" data-image="${data.cardImage || ""}">
          ${data.cardImage ? `<img src="${data.cardImage}" style="max-height:120px;">` : `<span>＋ Category Image</span>`}
        </div>
        <div class="general-inline-edit-actions">
          <button class="save-tce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-tce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#templeCatEdit-${d.id}`);
    const imgSlot = row.querySelector(".tce-card-image");

    row.querySelector(".cms-list-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });

    row.querySelector(".cancel-tce-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });

    imgSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imgSlot.dataset.image = url;
      imgSlot.innerHTML = `<img src="${url}" style="max-height:120px;">`;
    });

    row.querySelector(".save-tce-btn").addEventListener("click", async () => {
      const updatedTitle = editBox.querySelector(".tce-title").value.trim();
      const updatedOrder = Number(editBox.querySelector(".tce-order").value) || 0;
      const updatedImage = imgSlot.dataset.image || "";
      if (!updatedTitle) {
        alert("Category title is required");
        return;
      }
      await updateDoc(doc(db, "templeCategories", d.id), {
        title: updatedTitle,
        order: updatedOrder,
        cardImage: updatedImage,
        updatedAt: serverTimestamp()
      });
      alert("✅ Category updated");
      loadTempleCategories();
    });

    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this category? Temples inside it will remain but become uncategorized.")) return;
      await deleteDoc(doc(db, "templeCategories", d.id));
      loadTempleCategories();
    });
    list.appendChild(row);
  });
}
loadTempleCategories();
 
const templeFilterCategorySelect = document.getElementById("templeFilterCategorySelect");
if (templeFilterCategorySelect) {
  templeFilterCategorySelect.addEventListener("change", () => {
    loadAdminTemples(templeFilterCategorySelect.value);
  });
}
 
/* ══════════════════════════════════════
   TEMPLES CMS
══════════════════════════════════════ */
 
const templeCardBox = document.getElementById("templeCardImageGrid");
if (templeCardBox) {
  templeCardBox.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    templeCardBox.dataset.image = url;
    templeCardBox.innerHTML = `<img src="${url}">`;
  });
}
 
const addTempleSectionBtn = document.getElementById("addTempleSectionBtn");
const templeSectionsContainer = document.getElementById("templeSectionsContainer");
 
// Mirrors createFestivalSectionBox — used by both the manual "+ Section Add"
// button and the bulk-paste parser below.
function createTempleSectionBox(container, prefillTitle = "", prefillContent = "") {
  const box = document.createElement("div");
  box.className = "festival-section-box";
  box.innerHTML = `
    <h4>Temple Section</h4>
    <input type="text" placeholder="Section Title" class="temple-section-title" value="${prefillTitle.replace(/"/g, "&quot;")}">
    <textarea placeholder="Section Content" class="temple-section-content">${prefillContent}</textarea>
    <div class="section-image-slot temple-section-image"><span>＋ Temple Image</span></div>
    <button class="remove-temple-section-btn" type="button">Delete Section</button>
  `;
  container.appendChild(box);
  const imageSlot = box.querySelector(".temple-section-image");
  imageSlot.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    imageSlot.dataset.image = url; imageSlot.innerHTML = `<img src="${url}">`;
  });
  box.querySelector(".remove-temple-section-btn").addEventListener("click", () => box.remove());
  return box;
}
 
if (addTempleSectionBtn && templeSectionsContainer) {
  addTempleSectionBtn.addEventListener("click", () => {
    createTempleSectionBox(templeSectionsContainer);
  });
}
 
// Reuses parseBulkFestivalText (defined in the Festivals CMS section above) —
// the "## heading" parsing logic is identical for both content types.
const parseTempleBulkBtn = document.getElementById("parseTempleBulkBtn");
const templeBulkPaste = document.getElementById("templeBulkPaste");
if (parseTempleBulkBtn && templeBulkPaste) {
  parseTempleBulkBtn.addEventListener("click", () => {
    const raw = templeBulkPaste.value;
    const sections = parseBulkFestivalText(raw);
    const msgEl = document.getElementById("templeMessage");
    if (sections.length === 0) {
      msgEl.innerText = "పార్స్ చేయడానికి ఏమీ దొరకలేదు — ## తో heading పెట్టారో చూడండి";
      return;
    }
    sections.forEach(s => createTempleSectionBox(templeSectionsContainer, s.title, s.content));
    templeBulkPaste.value = "";
    msgEl.innerText = `✅ ${sections.length} sections జోడించబడ్డాయి — ఇప్పుడు కావాలంటే ప్రతి section కి image పెట్టండి, తర్వాత Temple Save నొక్కండి`;
  });
}
 
const saveTempleBtn = document.getElementById("saveTempleBtn");
if (saveTempleBtn) {
  attachAutoSlug("templeTitle", "templeSlug");
  saveTempleBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("templeCategorySelect").value;
    const title = document.getElementById("templeTitle").value.trim();
    const slugInput = document.getElementById("templeSlug");
    const slug = (slugInput ? slugInput.value.trim() : "") || slugify(title);
    const footerQuote = document.getElementById("templeFooterQuote").value.trim();
    const cardBox = document.getElementById("templeCardImageGrid");
    const cardImage = cardBox.dataset.image || "";
    const sectionBoxes = document.querySelectorAll(".temple-section-box");
    const sections = [];
    sectionBoxes.forEach((box) => {
      const sectionTitle = box.querySelector(".temple-section-title").value.trim();
      const sectionContent = box.querySelector(".temple-section-content").value.trim();
      const sectionImage = box.querySelector(".section-image-slot").dataset.image || "";
      if (sectionTitle || sectionContent || sectionImage) {
        sections.push({ title: sectionTitle, content: sectionContent, image: sectionImage });
      }
    });
    if (!title || !cardImage || sections.length === 0) {
      document.getElementById("templeMessage").innerText = "దయచేసి దేవాలయం పేరు, కార్డ్ ఇమేజ్ మరియు కనీసం ఒక section జోడించండి";
      return;
    }
    saveTempleBtn.disabled = true;
    await addDoc(collection(db, "temples"), { categoryId, title, slug, cardImage, footerQuote, sections, createdAt: serverTimestamp() });
    document.getElementById("templeMessage").innerText = "✅ దేవాలయం సేవ్ అయింది";
    if (slugInput) { slugInput.value = ""; delete slugInput.dataset.manuallyEdited; }
    document.getElementById("templeTitle").value = "";
    saveTempleBtn.disabled = false;
    loadAdminTemples();
  });
}
 
async function loadAdminTemples(filterCatId = "") {
  const list = document.getElementById("adminTemplesList");
  if (!list) return;

  try {
    list.innerHTML = "<p style='color:#ffd166;padding:12px;'>దేవాలయాల జాబితా లోడ్ అవుతోంది...</p>";
    const catSnap = await getDocs(collection(db, "templeCategories"));
    const catMap = {};
    catSnap.forEach(d => { catMap[d.id] = d.data().title; });

    let snapshot;
    try {
      const q = query(collection(db, "temples"), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (e) {
      console.warn("Falling back to unordered temples:", e);
      snapshot = await getDocs(collection(db, "temples"));
    }
    const docs = [];
    snapshot.forEach(item => docs.push(item));
    docs.sort((a, b) => (b.data()?.createdAt?.seconds || 0) - (a.data()?.createdAt?.seconds || 0));

    list.innerHTML = "";
    let count = 0;
    docs.forEach((item) => {
      const temple = item.data();
      if (filterCatId && temple.categoryId !== filterCatId) return;
      count++;
      list.innerHTML += `
        <div class="admin-event-card editable-festival-card">
          <img src="${temple.cardImage || ""}" alt="${temple.title || ""}">
          <div>
            <h3>${temple.title || "Untitled"}</h3>
            ${renderSlugLinkHtml("temples", temple.slug, item.id)}
            <p>విభాగం: ${catMap[temple.categoryId] || "Uncategorized"}</p>
            <p>Sections: ${temple.sections ? temple.sections.length : 0}</p>
            <button class="edit-temple-btn" data-id="${item.id}">Edit</button>
            <button class="delete-temple-btn" data-id="${item.id}">Delete</button>
            <div class="temple-inline-editor" id="templeEdit-${item.id}"></div>
          </div>
        </div>
      `;
    });
    if (count === 0) {
      list.innerHTML = "<p style='color:rgba(255,255,255,0.6);padding:12px;'>దేవాలయాలు ఏవీ లేవు.</p>";
      return;
    }
    list.querySelectorAll(".edit-temple-btn").forEach(btn => {
      btn.addEventListener("click", async () => openTempleInlineEditor(btn.dataset.id, filterCatId));
    });
    list.querySelectorAll(".delete-temple-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("ఈ దేవాలయాన్ని డిలీట్ చేయాలా?")) return;
        await deleteDoc(doc(db, "temples", btn.dataset.id)); loadAdminTemples(filterCatId);
      });
    });
  } catch (err) {
    console.error("Error loading temples:", err);
    list.innerHTML = `<p style="color:#ff6b6b;padding:12px;">దేవాలయాలు లోడ్ చేయడంలో లోపం: ${err.message}</p>`;
  }
}
 
async function openTempleInlineEditor(id, filterCatId = "") {
  const editor = document.getElementById(`templeEdit-${id}`);
  if (!editor) return;
  if (editor.innerHTML.trim() !== "") {
    editor.innerHTML = "";
    return;
  }
  const snap = await getDoc(doc(db, "temples", id));
  if (!snap.exists()) return;
  const temple = snap.data();
 
  const catSnap = await getDocs(query(collection(db, "templeCategories"), orderBy("order", "asc")));
  let categoryOptionsHTML = `<option value="">విభాగం ఎంచుకోండి</option>`;
  catSnap.forEach(d => {
    const selected = d.id === temple.categoryId ? "selected" : "";
    categoryOptionsHTML += `<option value="${d.id}" ${selected}>${d.data().title}</option>`;
  });
 
  function sectionHTML(section = {}, index = "New") {
    return `
      <div class="festival-section-box inline-temple-section-edit">
        <h4>Section ${index}</h4>
        <input class="inline-temple-section-title" value="${section.title || ""}" placeholder="Section Title">
        <textarea class="inline-temple-section-content" placeholder="Section Content">${section.content || ""}</textarea>
        <div class="section-image-slot inline-temple-section-image" data-image="${section.image || ""}">
          ${section.image ? `<img src="${section.image}">` : `<span>＋ Temple Image</span>`}
        </div>
        <div class="image-control-box">
          <label>Width %</label><input type="number" class="temple-img-width-input" value="${section.imgWidth || 75}">
          <label>Height px</label><input type="number" class="temple-img-height-input" value="${section.imgHeight || 420}">
          <label>Brightness %</label><input type="number" class="temple-img-brightness-input" value="${section.imgBrightness || 100}">
          <label>Alignment</label>
          <select class="temple-img-position-input">
            <option value="left" ${section.imgPosition === "left" ? "selected" : ""}>Left</option>
            <option value="center" ${section.imgPosition === "center" ? "selected" : ""}>Center</option>
            <option value="right" ${section.imgPosition === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
        <button class="remove-inline-temple-section-btn">Delete Section</button>
      </div>
    `;
  }
 
  let sectionsHTML = "";
  (temple.sections || []).forEach((section, index) => { sectionsHTML += sectionHTML(section, index + 1); });
 
  editor.innerHTML = `
    <div class="festival-edit-panel">
      <select class="inline-temple-category-select">${categoryOptionsHTML}</select>
      <input class="inline-temple-title" value="${temple.title || ""}" placeholder="Temple Title">
      <input class="inline-temple-slug" value="${temple.slug || slugify(temple.title) || ""}" placeholder="Slug / Clean URL (e.g. tirumala-balaji)">
      <div class="festival-card-upload-box inline-temple-card-image" data-image="${temple.cardImage || ""}">
        ${temple.cardImage ? `<img src="${temple.cardImage}">` : `<span>＋ Temple Card Image</span>`}
      </div>
      <input class="inline-temple-footer-quote" value="${temple.footerQuote || ""}" placeholder="Footer Quote">
 
      <h3>మొత్తం Matter పేస్ట్ చేయండి</h3>
      <p class="bulk-paste-hint">ప్రతి heading ముందు <code>##</code> పెట్టండి.</p>
      <textarea class="inline-temple-bulk-paste" placeholder="## Heading&#10;matter...&#10;&#10;## Heading 2&#10;matter..." rows="8"></textarea>
      <button class="parse-inline-temple-bulk-btn" type="button">Sections గా మార్చండి ⬇</button>
 
      <h3>Sections</h3>
      <div class="inline-temple-sections-list">${sectionsHTML}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button class="add-inline-temple-section-btn" type="button">+ Add Section</button>
        <button class="save-inline-temple-btn" type="button">Save Changes</button>
        <button class="cancel-inline-temple-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
      </div>
    </div>
  `;
 
  function attachTempleEditorEvents() {
    editor.querySelector(".inline-temple-card-image").onclick = async (e) => {
      const url = await uploadImage(); if (!url) return;
      e.currentTarget.dataset.image = url; e.currentTarget.innerHTML = `<img src="${url}">`;
    };
    editor.querySelectorAll(".inline-temple-section-image").forEach(slot => {
      slot.onclick = async () => {
        const url = await uploadImage(); if (!url) return;
        slot.dataset.image = url; slot.innerHTML = `<img src="${url}">`;
      };
    });
    editor.querySelectorAll(".remove-inline-temple-section-btn").forEach(btn => {
      btn.onclick = () => btn.closest(".inline-temple-section-edit").remove();
    });
  }
  attachTempleEditorEvents();
 
  editor.querySelector(".add-inline-temple-section-btn").addEventListener("click", () => {
    editor.querySelector(".inline-temple-sections-list").insertAdjacentHTML("beforeend", sectionHTML({}, "New"));
    attachTempleEditorEvents();
  });

  editor.querySelector(".cancel-inline-temple-btn").addEventListener("click", () => {
    editor.innerHTML = "";
  });
 
  editor.querySelector(".parse-inline-temple-bulk-btn").addEventListener("click", () => {
    const raw = editor.querySelector(".inline-temple-bulk-paste").value;
    const sections = parseBulkFestivalText(raw);
    if (sections.length === 0) {
      alert("పార్స్ చేయడానికి ఏమీ దొరకలేదు — ## తో heading పెట్టారో చూడండి");
      return;
    }
    const list = editor.querySelector(".inline-temple-sections-list");
    sections.forEach(s => {
      list.insertAdjacentHTML("beforeend", sectionHTML({ title: s.title, content: s.content }, "New"));
    });
    attachTempleEditorEvents();
    editor.querySelector(".inline-temple-bulk-paste").value = "";
  });
 
  editor.querySelector(".save-inline-temple-btn").addEventListener("click", async () => {
    const sectionBoxes = editor.querySelectorAll(".inline-temple-section-edit");
    const sections = [];
    sectionBoxes.forEach(box => {
      sections.push({
        title: box.querySelector(".inline-temple-section-title").value.trim(),
        content: box.querySelector(".inline-temple-section-content").value.trim(),
        image: box.querySelector(".inline-temple-section-image").dataset.image || "",
        imgWidth: Number(box.querySelector(".temple-img-width-input").value) || 75,
        imgHeight: Number(box.querySelector(".temple-img-height-input").value) || 420,
        imgBrightness: Number(box.querySelector(".temple-img-brightness-input").value) || 100,
        imgPosition: box.querySelector(".temple-img-position-input").value || "center"
      });
    });
    const updatedTitle = editor.querySelector(".inline-temple-title").value.trim();
    const updatedSlug = editor.querySelector(".inline-temple-slug")?.value.trim() || slugify(updatedTitle);
    await updateDoc(doc(db, "temples", id), {
      categoryId: editor.querySelector(".inline-temple-category-select").value,
      title: updatedTitle,
      slug: updatedSlug,
      cardImage: editor.querySelector(".inline-temple-card-image").dataset.image || "",
      footerQuote: editor.querySelector(".inline-temple-footer-quote").value.trim(),
      sections, updatedAt: serverTimestamp()
    });
    alert("✅ Temple updated"); loadAdminTemples(filterCatId);
  });
}
loadAdminTemples();
 

/* ══════════════════════════════════════
   LIBRARY CMS
══════════════════════════════════════ */

const libCategoryImageBox = document.getElementById("libCategoryImageBox");
if (libCategoryImageBox) {
  libCategoryImageBox.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    libCategoryImageBox.dataset.image = url;
    libCategoryImageBox.innerHTML = `<img src="${url}">`;
  });
}

const libCategoryAudioBox = document.getElementById("libCategoryAudioBox");
if (libCategoryAudioBox) {
  libCategoryAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile(libCategoryAudioBox);
    if (!url) return;
    libCategoryAudioBox.dataset.audio = url;
    libCategoryAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const audioInput = document.getElementById("libCategoryAudioUrl");
    if (audioInput) audioInput.value = url;
  });
}

const saveLibCategoryBtn = document.getElementById("saveLibCategoryBtn");
if (saveLibCategoryBtn) {
  attachAutoSlug("libCategoryTitle", "libCategorySlug");
  saveLibCategoryBtn.addEventListener("click", async () => {
    const title = document.getElementById("libCategoryTitle").value.trim();
    const slugInput = document.getElementById("libCategorySlug");
    const slug = (slugInput ? slugInput.value.trim() : "") || slugify(title);
    const emoji = document.getElementById("libCategoryEmoji").value.trim();
    const orderValue = document.getElementById("libCategoryOrder").value.trim();
    const image = libCategoryImageBox.dataset.image || "";
    const text = document.getElementById("libCategoryText") ? document.getElementById("libCategoryText").value.trim() : "";
    const audioUrl = document.getElementById("libCategoryAudioUrl")?.value.trim() || libCategoryAudioBox?.dataset.audio || "";
    if (!title || !image) { document.getElementById("libCategoryMessage").innerText = "Category title and image required"; return; }
    await addDoc(collection(db, "libraryCategories"), {
      title, slug, emoji, image,
      text, audioUrl,
      order: orderValue ? Number(orderValue) : Date.now(),
      createdAt: serverTimestamp()
    });
    document.getElementById("libCategoryTitle").value = "";
    if (slugInput) { slugInput.value = ""; delete slugInput.dataset.manuallyEdited; }
    document.getElementById("libCategoryEmoji").value = "";
    document.getElementById("libCategoryOrder").value = "";
    if (document.getElementById("libCategoryText")) document.getElementById("libCategoryText").value = "";
    if (document.getElementById("libCategoryAudioUrl")) document.getElementById("libCategoryAudioUrl").value = "";
    libCategoryImageBox.dataset.image = "";
    libCategoryImageBox.innerHTML = `<span>＋ Category Image</span>`;
    if (libCategoryAudioBox) {
      libCategoryAudioBox.dataset.audio = "";
      libCategoryAudioBox.innerHTML = `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio File)</span>`;
    }
    document.getElementById("libCategoryMessage").innerText = "✅ Category saved";
    loadLibCategoriesAdmin(); loadLibCategoryOptions();
  });
}

// Attach line sync for Category Add Form
const catMount = document.getElementById("lineSyncMount-cat-new");
if (catMount) {
  catMount.innerHTML = createLineSyncEditorHtml("cat-new");
  attachLineSyncEvents(
    "cat-new",
    () => document.getElementById("libCategoryText"),
    () => document.getElementById("libCategoryAudioUrl")?.value.trim() || libCategoryAudioBox?.dataset.audio || ""
  );
}

async function loadLibCategoriesAdmin() {
  const list = document.getElementById("adminLibCategoriesList");
  if (!list) return;

  const [snapshot, subSnap, conSnap] = await Promise.all([
    getDocs(collection(db, "libraryCategories")),
    getDocs(collection(db, "librarySubcategories")),
    getDocs(collection(db, "libraryContent"))
  ]);

  const allSubs = [];
  subSnap.forEach(item => allSubs.push({ id: item.id, ...item.data() }));

  const allContents = [];
  conSnap.forEach(item => allContents.push({ id: item.id, ...item.data() }));

  let categories = [];
  snapshot.forEach(item => categories.push({ id: item.id, ...item.data() }));
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";

  categories.forEach(data => {
    const catSubs = allSubs.filter(s => s.categoryId === data.id);
    const catSubIds = catSubs.map(s => s.id);
    const catContents = allContents.filter(c => catSubIds.includes(c.subcategoryId));

    // Determine already present matter and audio
    const firstWithText = catContents.find(c => c.text && c.text.trim()) || catSubs.find(s => s.text && s.text.trim());
    const presentText = data.text || (firstWithText ? firstWithText.text : "");
    const presentAudio = data.audioUrl || (firstWithText ? firstWithText.audioUrl : "");
    const defaultActiveId = data.text ? "" : (firstWithText ? firstWithText.id : "");

    // Generate pills for existing child content if present
    let contentPillsHtml = "";
    if (catContents.length > 0) {
      contentPillsHtml = `
        <div style="background:rgba(255,209,102,0.08);border:1px solid rgba(255,209,102,0.3);border-radius:10px;padding:10px 14px;margin:8px 0 12px;">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;display:block;margin-bottom:6px;">
            📚 ఈ కేటగిరీలోని ప్రస్తుత రచనల సాహిత్యం (${catContents.length} రచనలు అందుబాటులో ఉన్నాయి):
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${catContents.map((c) => `
              <button type="button" class="lce-load-content-btn ${c.id === defaultActiveId ? 'active' : ''}" 
                      data-cat-id="${data.id}" data-content-id="${c.id}"
                      style="padding:6px 12px;border-radius:8px;font-size:0.82rem;cursor:pointer;border:1px solid #ffd166;background:${c.id === defaultActiveId ? '#ffd166' : 'rgba(255,209,102,0.15)'};color:${c.id === defaultActiveId ? '#120703' : '#ffd166'};font-weight:600;">
                📖 ${escapeHtml(c.title)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    list.innerHTML += `
      <div class="admin-event-card" style="flex-direction:column;align-items:stretch;">
        <div style="display:flex;gap:14px;align-items:center;">
          <img src="${data.image}" alt="${data.title}" style="width:60px;height:60px;object-fit:cover;border-radius:10px;">
          <div style="flex:1;">
            <h3 style="margin:0 0 4px;">${data.emoji ? data.emoji + " " : ""}${data.title}</h3>
            ${renderSlugLinkHtml("library", data.slug, data.id)}
            <div style="display:flex;gap:8px;margin-top:6px;">
              <button class="edit-lib-category-btn cms-list-edit-btn" data-id="${data.id}" type="button">✏️ Edit</button>
              <button class="delete-lib-category-btn cms-list-delete-btn" data-id="${data.id}" type="button">Delete</button>
            </div>
          </div>
        </div>

        ${presentText ? `
          <div style="margin:8px 0 4px;color:rgba(255,255,255,0.85);font-size:0.85rem;line-height:1.4;background:rgba(0,0,0,0.25);padding:8px 12px;border-radius:8px;border-left:3px solid #ffd166;">
            <strong>📝 సాహిత్యం / శ్లోకాలు ${!data.text && firstWithText ? `(రచన: ${escapeHtml(firstWithText.title)})` : ''}:</strong>
            <p style="margin:4px 0 0;white-space:pre-wrap;max-height:80px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(presentText.slice(0, 180))}${presentText.length > 180 ? '...' : ''}</p>
          </div>
        ` : ''}

        <!-- CATEGORY AUDIO STATUS & QUICK UPLOAD -->
        <div class="content-audio-card-box" style="margin:8px 0;">
          ${presentAudio ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:240px;">
                <span>🎵</span>
                <span style="font-size:0.85rem;color:#ffd166;font-weight:700;">ఆడియో:</span>
                <audio src="${presentAudio}" controls style="height:32px;flex:1;min-width:180px;"></audio>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="cat-quick-change-audio" data-id="${data.id}" type="button" style="padding:4px 10px;font-size:0.82rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;">🔄 మార్చండి</button>
                <button class="cat-quick-remove-audio" data-id="${data.id}" type="button" style="padding:4px 8px;font-size:0.82rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌</button>
              </div>
            </div>
          ` : `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span style="font-size:0.82rem;color:rgba(255,255,255,0.5);">ఆడియో జతచేయబడలేదు (Optional)</span>
              <button class="cat-quick-add-audio" data-id="${data.id}" type="button" style="padding:4px 12px;font-size:0.82rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;">
                🎵 ＋ Audio File జోడించండి
              </button>
            </div>
          `}
        </div>

        <div class="general-inline-edit-box" id="libCatEdit-${data.id}" data-active-content-id="${defaultActiveId}" style="display:none;flex-direction:column;gap:10px;">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">విభాగం పేరు (Title):</label>
          <input class="lce-title" value="${data.title || ""}" placeholder="Category Title">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">Slug (URL):</label>
          <input class="lce-slug" value="${data.slug || slugify(data.title) || ""}" placeholder="Slug">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">Emoji & Order:</label>
          <div style="display:flex;gap:10px;">
            <input class="lce-emoji" value="${data.emoji || ""}" placeholder="Emoji (e.g. 📚)" style="flex:1;">
            <input class="lce-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)" style="flex:1;">
          </div>
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">Category Banner Image:</label>
          <div class="festival-card-upload-box lce-image-slot" data-image="${data.image || ""}">
            ${data.image ? `<img src="${data.image}" style="max-height:120px;">` : `<span>＋ Category Image</span>`}
          </div>

          ${contentPillsHtml}

          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">📝 పూర్తి కంటెంట్ / శ్లోకాలు / సాహిత్యం (Matter / Telugu Text):</label>
          <textarea class="lce-text" placeholder="శ్లోకాలు లేదా పూర్తి సాహిత్యం ఇక్కడ రాయండి / పేస్ట్ చేయండి..." style="min-height:160px;width:100%;">${escapeHtml(presentText)}</textarea>

          <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:10px;padding:10px;margin:4px 0;">
            <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:6px;font-size:0.88rem;">🎵 సంపూర్ణ ఆడియో (Audio File):</label>
            <div class="cms-audio-upload-box lce-audio-box" data-audio="${presentAudio}" style="cursor:pointer;margin-bottom:6px;">
              ${presentAudio ? `<audio src="${presentAudio}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`}
            </div>
            <input class="lce-audio-url" value="${presentAudio}" placeholder="లేదా Audio URL ఇవ్వండి">
            <button type="button" class="open-line-sync-btn" data-target="cat-${data.id}" style="margin-top:8px;padding:8px 14px;border-radius:10px;background:rgba(255,209,102,0.18);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:6px;font-size:0.85rem;">
              ⏱️ లైన్ వారీగా ఆడియో సెకన్లు సెట్ చేయండి (Set Line-by-Line Audio Timings)
            </button>
            ${createLineSyncEditorHtml(`cat-${data.id}`)}
          </div>

          <div class="general-inline-edit-actions">
            <button class="save-lce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
            <button class="cancel-lce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
          </div>
        </div>
      </div>
    `;
  });

  // Attach Line Sync Events for all category editors
  categories.forEach(data => {
    const box = document.getElementById(`libCatEdit-${data.id}`);
    if (box) {
      attachLineSyncEvents(
        `cat-${data.id}`,
        () => box.querySelector(".lce-text"),
        () => box.querySelector(".lce-audio-url")?.value.trim() || box.querySelector(".lce-audio-box")?.dataset.audio || ""
      );
    }
  });

  list.querySelectorAll(".edit-lib-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`libCatEdit-${btn.dataset.id}`);
      if (box) box.style.display = box.style.display === "none" ? "flex" : "none";
    });
  });

  list.querySelectorAll(".cancel-lce-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".general-inline-edit-box");
      if (box) box.style.display = "none";
    });
  });

  list.querySelectorAll(".lce-load-content-btn").forEach(pBtn => {
    pBtn.addEventListener("click", () => {
      const box = pBtn.closest(".general-inline-edit-box");
      const targetContent = allContents.find(c => c.id === pBtn.dataset.contentId);
      if (!targetContent) return;
      box.dataset.activeContentId = targetContent.id;
      const textEl = box.querySelector(".lce-text");
      if (textEl) textEl.value = targetContent.text || "";
      const audioInput = box.querySelector(".lce-audio-url");
      if (audioInput) audioInput.value = targetContent.audioUrl || "";
      const audioBox = box.querySelector(".lce-audio-box");
      if (audioBox) {
        audioBox.dataset.audio = targetContent.audioUrl || "";
        audioBox.innerHTML = targetContent.audioUrl 
          ? `<audio src="${targetContent.audioUrl}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>`
          : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`;
      }
      box.querySelectorAll(".lce-load-content-btn").forEach(b => {
        b.style.background = "rgba(255,209,102,0.15)";
        b.style.color = "#ffd166";
      });
      pBtn.style.background = "#ffd166";
      pBtn.style.color = "#120703";
    });
  });

  list.querySelectorAll(".lce-image-slot").forEach(slot => {
    slot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      slot.dataset.image = url;
      slot.innerHTML = `<img src="${url}" style="max-height:120px;">`;
    });
  });

  list.querySelectorAll(".lce-audio-box").forEach(slot => {
    slot.addEventListener("click", async () => {
      const url = await uploadAudioFile(slot);
      if (!url) return;
      slot.dataset.audio = url;
      slot.innerHTML = `<audio src="${url}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
      const urlInput = slot.closest(".general-inline-edit-box").querySelector(".lce-audio-url");
      if (urlInput) urlInput.value = url;
    });
  });

  list.querySelectorAll(".cat-quick-add-audio, .cat-quick-change-audio").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = await uploadAudioFile(btn);
      if (!url) return;
      await updateDoc(doc(db, "libraryCategories", btn.dataset.id), { audioUrl: url, updatedAt: serverTimestamp() });
      alert("✅ ఆడియో విజయవంతంగా జోడించబడింది");
      loadLibCategoriesAdmin();
    });
  });

  list.querySelectorAll(".cat-quick-remove-audio").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ కేటగిరీ నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
      await updateDoc(doc(db, "libraryCategories", btn.dataset.id), { audioUrl: "", updatedAt: serverTimestamp() });
      alert("✅ ఆడియో తొలగించబడింది");
      loadLibCategoriesAdmin();
    });
  });

  list.querySelectorAll(".save-lce-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const box = btn.closest(".general-inline-edit-box");
      const id = box.id.replace("libCatEdit-", "");
      const title = box.querySelector(".lce-title").value.trim();
      const slug = box.querySelector(".lce-slug").value.trim() || slugify(title);
      const emoji = box.querySelector(".lce-emoji").value.trim();
      const orderVal = box.querySelector(".lce-order").value.trim();
      const image = box.querySelector(".lce-image-slot").dataset.image || "";
      const text = box.querySelector(".lce-text") ? box.querySelector(".lce-text").value.trim() : "";
      const audioUrl = box.querySelector(".lce-audio-url")?.value.trim() || box.querySelector(".lce-audio-box")?.dataset.audio || "";
      if (!title || !image) {
        alert("Title and image required");
        return;
      }
      await updateDoc(doc(db, "libraryCategories", id), {
        title, slug, emoji, image,
        text, audioUrl,
        order: orderVal ? Number(orderVal) : 0,
        updatedAt: serverTimestamp()
      });
      const activeContentId = box.dataset.activeContentId;
      if (activeContentId) {
        await updateDoc(doc(db, "libraryContent", activeContentId), {
          text, audioUrl,
          updatedAt: serverTimestamp()
        });
      }
      alert("✅ Category and content updated successfully");
      loadLibCategoriesAdmin();
      loadLibCategoryOptions();
    });
  });

  list.querySelectorAll(".delete-lib-category-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "libraryCategories", btn.dataset.id));
      loadLibCategoriesAdmin(); loadLibCategoryOptions();
    });
  });
}

async function loadLibCategoryOptions() {
  const select = document.getElementById("libSubcategoryCategorySelect");
  if (!select) return;
  const snapshot = await getDocs(collection(db, "libraryCategories"));
  let categories = [];
  snapshot.forEach(item => categories.push({ id: item.id, ...item.data() }));
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  select.innerHTML = `<option value="">Select Category</option>`;
  categories.forEach(data => {
    select.innerHTML += `<option value="${data.id}">${data.emoji ? data.emoji + " " : ""}${data.title}</option>`;
  });
}

loadLibCategoriesAdmin(); loadLibCategoryOptions();

const libSubcatAudioBox = document.getElementById("libSubcatAudioBox");
if (libSubcatAudioBox) {
  libSubcatAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile(libSubcatAudioBox);
    if (!url) return;
    libSubcatAudioBox.dataset.audio = url;
    libSubcatAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const audioInput = document.getElementById("libSubcatAudioUrl");
    if (audioInput) audioInput.value = url;
  });
}

const saveLibSubcategoryBtn = document.getElementById("saveLibSubcategoryBtn");
if (saveLibSubcategoryBtn) {
  attachAutoSlug("libSubcategoryTitle", "libSubcategorySlug");
  saveLibSubcategoryBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("libSubcategoryCategorySelect").value;
    const title = document.getElementById("libSubcategoryTitle").value.trim();
    const slugInput = document.getElementById("libSubcategorySlug");
    const slug = (slugInput ? slugInput.value.trim() : "") || slugify(title);
    const text = document.getElementById("libSubcategoryText") ? document.getElementById("libSubcategoryText").value.trim() : "";
    const audioUrl = document.getElementById("libSubcatAudioUrl")?.value.trim() || libSubcatAudioBox?.dataset.audio || "";
    const orderValue = document.getElementById("libSubcategoryOrder").value.trim();
    if (!categoryId || !title) { document.getElementById("libSubcategoryMessage").innerText = "Category and subcategory title required"; return; }
    await addDoc(collection(db, "librarySubcategories"), {
      categoryId, title, slug, text, audioUrl,
      order: orderValue ? Number(orderValue) : Date.now(),
      createdAt: serverTimestamp()
    });
    document.getElementById("libSubcategoryTitle").value = "";
    if (slugInput) { slugInput.value = ""; delete slugInput.dataset.manuallyEdited; }
    document.getElementById("libSubcategoryOrder").value = "";
    if (document.getElementById("libSubcategoryText")) document.getElementById("libSubcategoryText").value = "";
    const subAudioInput = document.getElementById("libSubcatAudioUrl");
    if (subAudioInput) subAudioInput.value = "";
    if (libSubcatAudioBox) {
      libSubcatAudioBox.dataset.audio = "";
      libSubcatAudioBox.innerHTML = `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio - Optional)</span>`;
    }
    document.getElementById("libSubcategoryMessage").innerText = "✅ Subcategory saved";
    loadLibSubcategoriesAdmin(); loadLibSubcategoryOptions();
  });
}

// Attach line sync for Subcategory Add Form
const subcatMount = document.getElementById("lineSyncMount-subcat-new");
if (subcatMount) {
  subcatMount.innerHTML = createLineSyncEditorHtml("subcat-new");
  attachLineSyncEvents(
    "subcat-new",
    () => document.getElementById("libSubcategoryText"),
    () => document.getElementById("libSubcatAudioUrl")?.value.trim() || libSubcatAudioBox?.dataset.audio || ""
  );
}

async function loadLibSubcategoriesAdmin() {
  const list = document.getElementById("adminLibSubcategoriesList");
  if (!list) return;

  const [catSnap, snapshot, conSnap] = await Promise.all([
    getDocs(collection(db, "libraryCategories")),
    getDocs(collection(db, "librarySubcategories")),
    getDocs(collection(db, "libraryContent"))
  ]);

  const categoryMap = {};
  const catList = [];
  catSnap.forEach(item => {
    categoryMap[item.id] = item.data().title;
    catList.push({ id: item.id, ...item.data() });
  });
  catList.sort((a, b) => (a.order || 0) - (b.order || 0));

  const allContents = [];
  conSnap.forEach(item => allContents.push({ id: item.id, ...item.data() }));

  let subcategories = [];
  snapshot.forEach(item => subcategories.push({ id: item.id, ...item.data() }));
  subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";

  subcategories.forEach(data => {
    let catOptions = `<option value="">Select Category</option>`;
    catList.forEach(c => {
      catOptions += `<option value="${c.id}" ${c.id === data.categoryId ? "selected" : ""}>${c.emoji ? c.emoji + " " : ""}${c.title}</option>`;
    });

    const subContents = allContents.filter(c => c.subcategoryId === data.id);
    const firstWithText = subContents.find(c => c.text && c.text.trim());
    const presentText = data.text || (firstWithText ? firstWithText.text : "");
    const presentAudio = data.audioUrl || (firstWithText ? firstWithText.audioUrl : "");
    const defaultActiveId = data.text ? "" : (firstWithText ? firstWithText.id : "");

    let contentPillsHtml = "";
    if (subContents.length > 0) {
      contentPillsHtml = `
        <div style="background:rgba(255,209,102,0.08);border:1px solid rgba(255,209,102,0.3);border-radius:10px;padding:10px 14px;margin:8px 0 12px;">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;display:block;margin-bottom:6px;">
            📚 ఈ ఉపవిభాగంలోని ప్రస్తుత రచనల సాహిత్యం (${subContents.length} రచనలు):
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${subContents.map((c) => `
              <button type="button" class="lsce-load-content-btn ${c.id === defaultActiveId ? 'active' : ''}" 
                      data-sub-id="${data.id}" data-content-id="${c.id}"
                      style="padding:6px 12px;border-radius:8px;font-size:0.82rem;cursor:pointer;border:1px solid #ffd166;background:${c.id === defaultActiveId ? '#ffd166' : 'rgba(255,209,102,0.15)'};color:${c.id === defaultActiveId ? '#120703' : '#ffd166'};font-weight:600;">
                📖 ${escapeHtml(c.title)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    list.innerHTML += `
      <div class="admin-event-card" style="flex-direction:column;align-items:stretch;">
        <div style="width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <h3 style="margin:0 0 4px;color:#ffd166;">${data.title}</h3>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:0.9rem;">Category: <strong>${categoryMap[data.categoryId] || "Unknown"}</strong></p>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="edit-lib-subcategory-btn cms-list-edit-btn" data-id="${data.id}" type="button">✏️ Edit</button>
              <button class="delete-lib-subcategory-btn cms-list-delete-btn" data-id="${data.id}" type="button">Delete</button>
            </div>
          </div>
          ${renderSlugLinkHtml("library", data.slug, data.id)}

          ${presentText ? `
            <div style="margin:8px 0 4px;color:rgba(255,255,255,0.85);font-size:0.85rem;line-height:1.4;background:rgba(0,0,0,0.25);padding:8px 12px;border-radius:8px;border-left:3px solid #ffd166;">
              <strong>📝 సాహిత్యం / శ్లోకాలు ${!data.text && firstWithText ? `(రచన: ${escapeHtml(firstWithText.title)})` : ''}:</strong>
              <p style="margin:4px 0 0;white-space:pre-wrap;max-height:80px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(presentText.slice(0, 180))}${presentText.length > 180 ? '...' : ''}</p>
            </div>
          ` : ''}

          <!-- SUBCATEGORY AUDIO STATUS & QUICK UPLOAD -->
          <div class="content-audio-card-box" style="margin:8px 0;">
            ${presentAudio ? `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:240px;">
                  <span>🎵</span>
                  <span style="font-size:0.85rem;color:#ffd166;font-weight:700;">ఆడియో:</span>
                  <audio src="${presentAudio}" controls style="height:32px;flex:1;min-width:180px;"></audio>
                </div>
                <div style="display:flex;gap:6px;">
                  <button class="subcat-quick-change-audio" data-id="${data.id}" type="button" style="padding:4px 10px;font-size:0.82rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;">🔄 మార్చండి</button>
                  <button class="subcat-quick-remove-audio" data-id="${data.id}" type="button" style="padding:4px 8px;font-size:0.82rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌</button>
                </div>
              </div>
            ` : `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                <span style="font-size:0.82rem;color:rgba(255,255,255,0.5);">ఆడియో జతచేయబడలేదు (Optional)</span>
                <button class="subcat-quick-add-audio" data-id="${data.id}" type="button" style="padding:4px 12px;font-size:0.82rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;">
                  🎵 ＋ Audio File జోడించండి
                </button>
              </div>
            `}
          </div>
        </div>

        <div class="general-inline-edit-box" id="libSubcatEdit-${data.id}" data-active-content-id="${defaultActiveId}" style="display:none;flex-direction:column;gap:10px;">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">ప్రధాన విభాగం (Category):</label>
          <select class="lsce-category">${catOptions}</select>
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">ఉపవిభాగం పేరు (Title):</label>
          <input class="lsce-title" value="${data.title || ""}" placeholder="Subcategory Title">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">Slug (URL):</label>
          <input class="lsce-slug" value="${data.slug || slugify(data.title) || ""}" placeholder="Slug">
          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">క్రమం (Order):</label>
          <input class="lsce-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">

          ${contentPillsHtml}

          <label style="color:#ffd166;font-weight:700;font-size:0.85rem;">📝 పూర్తి కంటెంట్ / శ్లోకాలు / సాహిత్యం (Matter / Telugu Text):</label>
          <textarea class="lsce-text" placeholder="శ్లోకాలు లేదా పూర్తి సాహిత్యం ఇక్కడ రాయండి / పేస్ట్ చేయండి..." style="min-height:150px;width:100%;">${escapeHtml(presentText)}</textarea>
          
          <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:10px;padding:10px;margin:4px 0;">
            <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:6px;font-size:0.88rem;">🎵 సంపూర్ణ స్తోత్ర ఆడియో (Optional):</label>
            <div class="cms-audio-upload-box lsce-audio-box" data-audio="${presentAudio}" style="cursor:pointer;margin-bottom:6px;">
              ${presentAudio ? `<audio src="${presentAudio}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3)</span>`}
            </div>
            <input class="lsce-audio-url" value="${presentAudio}" placeholder="లేదా Audio URL ఇవ్వండి">
            <button type="button" class="open-line-sync-btn" data-target="subcat-${data.id}" style="margin-top:8px;padding:8px 14px;border-radius:10px;background:rgba(255,209,102,0.18);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:6px;font-size:0.85rem;">
              ⏱️ లైన్ వారీగా ఆడియో సెకన్లు సెట్ చేయండి (Set Line-by-Line Audio Timings)
            </button>
            ${createLineSyncEditorHtml(`subcat-${data.id}`)}
          </div>

          <div class="general-inline-edit-actions">
            <button class="save-lsce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
            <button class="cancel-lsce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
          </div>
        </div>
      </div>
    `;
  });

  // Attach Line Sync Events for all subcategory editors
  subcategories.forEach(data => {
    const box = document.getElementById(`libSubcatEdit-${data.id}`);
    if (box) {
      attachLineSyncEvents(
        `subcat-${data.id}`,
        () => box.querySelector(".lsce-text"),
        () => box.querySelector(".lsce-audio-url")?.value.trim() || box.querySelector(".lsce-audio-box")?.dataset.audio || ""
      );
    }
  });

  list.querySelectorAll(".edit-lib-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`libSubcatEdit-${btn.dataset.id}`);
      if (box) box.style.display = box.style.display === "none" ? "flex" : "none";
    });
  });

  list.querySelectorAll(".cancel-lsce-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".general-inline-edit-box");
      if (box) box.style.display = "none";
    });
  });

  list.querySelectorAll(".lsce-load-content-btn").forEach(pBtn => {
    pBtn.addEventListener("click", () => {
      const box = pBtn.closest(".general-inline-edit-box");
      const targetContent = allContents.find(c => c.id === pBtn.dataset.contentId);
      if (!targetContent) return;
      box.dataset.activeContentId = targetContent.id;
      const textEl = box.querySelector(".lsce-text");
      if (textEl) textEl.value = targetContent.text || "";
      const audioInput = box.querySelector(".lsce-audio-url");
      if (audioInput) audioInput.value = targetContent.audioUrl || "";
      const audioBox = box.querySelector(".lsce-audio-box");
      if (audioBox) {
        audioBox.dataset.audio = targetContent.audioUrl || "";
        audioBox.innerHTML = targetContent.audioUrl 
          ? `<audio src="${targetContent.audioUrl}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>`
          : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`;
      }
      box.querySelectorAll(".lsce-load-content-btn").forEach(b => {
        b.style.background = "rgba(255,209,102,0.15)";
        b.style.color = "#ffd166";
      });
      pBtn.style.background = "#ffd166";
      pBtn.style.color = "#120703";
    });
  });

  list.querySelectorAll(".lsce-audio-box").forEach(slot => {
    slot.addEventListener("click", async () => {
      const url = await uploadAudioFile(slot);
      if (!url) return;
      slot.dataset.audio = url;
      slot.innerHTML = `<audio src="${url}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
      const urlInput = slot.closest(".general-inline-edit-box").querySelector(".lsce-audio-url");
      if (urlInput) urlInput.value = url;
    });
  });

  list.querySelectorAll(".subcat-quick-add-audio, .subcat-quick-change-audio").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = await uploadAudioFile(btn);
      if (!url) return;
      await updateDoc(doc(db, "librarySubcategories", btn.dataset.id), { audioUrl: url, updatedAt: serverTimestamp() });
      alert("✅ ఆడియో విజయవంతంగా జోడించబడింది");
      loadLibSubcategoriesAdmin();
    });
  });

  list.querySelectorAll(".subcat-quick-remove-audio").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ ఉపవిభాగం నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
      await updateDoc(doc(db, "librarySubcategories", btn.dataset.id), { audioUrl: "", updatedAt: serverTimestamp() });
      alert("✅ ఆడియో తొలగించబడింది");
      loadLibSubcategoriesAdmin();
    });
  });

  list.querySelectorAll(".save-lsce-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const box = btn.closest(".general-inline-edit-box");
      const id = box.id.replace("libSubcatEdit-", "");
      const categoryId = box.querySelector(".lsce-category").value;
      const title = box.querySelector(".lsce-title").value.trim();
      const slug = box.querySelector(".lsce-slug").value.trim() || slugify(title);
      const orderVal = box.querySelector(".lsce-order").value.trim();
      const text = box.querySelector(".lsce-text") ? box.querySelector(".lsce-text").value.trim() : "";
      const audioUrl = box.querySelector(".lsce-audio-url").value.trim() || box.querySelector(".lsce-audio-box")?.dataset.audio || "";
      if (!categoryId || !title) {
        alert("Category and Title required");
        return;
      }
      await updateDoc(doc(db, "librarySubcategories", id), {
        categoryId, title, slug, text, audioUrl,
        order: orderVal ? Number(orderVal) : 0,
        updatedAt: serverTimestamp()
      });
      const activeContentId = box.dataset.activeContentId;
      if (activeContentId) {
        await updateDoc(doc(db, "libraryContent", activeContentId), {
          text, audioUrl,
          updatedAt: serverTimestamp()
        });
      }
      alert("✅ Subcategory and content updated successfully");
      loadLibSubcategoriesAdmin();
      loadLibSubcategoryOptions();
    });
  });

  list.querySelectorAll(".delete-lib-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this subcategory?")) return;
      await deleteDoc(doc(db, "librarySubcategories", btn.dataset.id));
      loadLibSubcategoriesAdmin(); loadLibSubcategoryOptions();
    });
  });
}

async function loadLibSubcategoryOptions() {
  const select = document.getElementById("libContentSubcategorySelect");
  if (!select) return;
  const catSnap = await getDocs(collection(db, "libraryCategories"));
  const categoryMap = {};
  catSnap.forEach(item => { categoryMap[item.id] = item.data().title; });
  const snapshot = await getDocs(collection(db, "librarySubcategories"));
  let subcategories = [];
  snapshot.forEach(item => subcategories.push({ id: item.id, ...item.data() }));
  subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));
  select.innerHTML = `<option value="">Select Subcategory</option>`;
  subcategories.forEach(data => {
    select.innerHTML += `<option value="${data.id}">${categoryMap[data.categoryId] || "?"} → ${data.title}</option>`;
  });
}

loadLibSubcategoriesAdmin(); loadLibSubcategoryOptions();

const libContentAudioBox = document.getElementById("libContentAudioBox");
if (libContentAudioBox) {
  libContentAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile(libContentAudioBox);
    if (!url) return;
    libContentAudioBox.dataset.audio = url;
    libContentAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const audioInput = document.getElementById("libContentAudioUrl");
    if (audioInput) audioInput.value = url;
  });
}

const saveLibContentBtn = document.getElementById("saveLibContentBtn");
if (saveLibContentBtn) {
  attachAutoSlug("libContentTitle", "libContentSlug");
  saveLibContentBtn.addEventListener("click", async () => {
    const subcategoryId = document.getElementById("libContentSubcategorySelect").value;
    const title = document.getElementById("libContentTitle").value.trim();
    const slugInput = document.getElementById("libContentSlug");
    const slug = (slugInput ? slugInput.value.trim() : "") || slugify(title);
    const text = document.getElementById("libContentText").value.trim();
    const audioUrl = document.getElementById("libContentAudioUrl").value.trim() || libContentAudioBox?.dataset.audio || "";
    const orderValue = document.getElementById("libContentOrder").value.trim();
    if (!subcategoryId || !title || !text) { document.getElementById("libContentMessage").innerText = "Subcategory, title and text required"; return; }
    await addDoc(collection(db, "libraryContent"), {
      subcategoryId, title, slug, text, audioUrl,
      order: orderValue ? Number(orderValue) : Date.now(),
      createdAt: serverTimestamp()
    });
    document.getElementById("libContentTitle").value = "";
    if (slugInput) { slugInput.value = ""; delete slugInput.dataset.manuallyEdited; }
    document.getElementById("libContentText").value = "";
    document.getElementById("libContentAudioUrl").value = "";
    document.getElementById("libContentOrder").value = "";
    if (libContentAudioBox) {
      libContentAudioBox.dataset.audio = "";
      libContentAudioBox.innerHTML = `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio File)</span>`;
    }
    document.getElementById("libContentMessage").innerText = "✅ Content saved";
    loadLibContentAdmin();
  });
}

// Attach line sync for Content Add Form
const contentMount = document.getElementById("lineSyncMount-content-new");
if (contentMount) {
  contentMount.innerHTML = createLineSyncEditorHtml("content-new");
  attachLineSyncEvents(
    "content-new",
    () => document.getElementById("libContentText"),
    () => document.getElementById("libContentAudioUrl")?.value.trim() || libContentAudioBox?.dataset.audio || ""
  );
}

async function loadLibContentAdmin() {
  const list = document.getElementById("adminLibContentList");
  if (!list) return;
  const subSnap = await getDocs(collection(db, "librarySubcategories"));
  const subMap = {};
  const subList = [];
  subSnap.forEach(item => {
    subMap[item.id] = item.data().title;
    subList.push({ id: item.id, ...item.data() });
  });
  const snapshot = await getDocs(collection(db, "libraryContent"));
  let items = [];
  snapshot.forEach(item => items.push({ id: item.id, ...item.data() }));
  items.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";
  items.forEach(data => {
    list.innerHTML += `
      <div class="admin-event-card" style="flex-direction:column;align-items:stretch;">
        <div style="width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
            <div>
              <h3 style="margin:0 0 4px;color:#ffd166;">${data.title}</h3>
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.7);font-size:0.9rem;">Subcategory: <strong>${subMap[data.subcategoryId] || "Unknown"}</strong></p>
              ${renderSlugLinkHtml("library", data.slug, data.id)}
            </div>
            <div style="display:flex;gap:8px;">
              <button class="edit-lib-content-btn cms-list-edit-btn" data-id="${data.id}" type="button">✏️ Edit</button>
              <button class="delete-lib-content-btn cms-list-delete-btn" data-id="${data.id}" type="button">Delete</button>
            </div>
          </div>
          <p style="margin:8px 0;font-size:0.9rem;color:rgba(255,255,255,0.7);line-height:1.5;">${(data.text || "").slice(0, 100)}${data.text && data.text.length > 100 ? "..." : ""}</p>
          
          <!-- AUDIO SECTION FOR PRESENT CONTENT -->
          <div class="content-audio-card-box">
            ${data.audioUrl ? `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:260px;">
                  <span style="font-size:1.2rem;">🎵</span>
                  <div style="flex:1;">
                    <div style="color:#ffd166;font-size:0.85rem;font-weight:700;margin-bottom:4px;">ఆడియో జోడించబడింది (Audio linked):</div>
                    <audio src="${data.audioUrl}" controls style="width:100%;height:32px;"></audio>
                  </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <button class="quick-change-audio-btn" data-id="${data.id}" type="button" style="padding:6px 14px;font-size:0.85rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;">🔄 ఆడియో మార్చండి</button>
                  <button class="quick-remove-audio-btn" data-id="${data.id}" type="button" style="padding:6px 12px;font-size:0.85rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌ తీసివేయి</button>
                </div>
              </div>
            ` : `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:1.2rem;opacity:0.6;">🔇</span>
                  <span style="color:rgba(255,255,255,0.6);font-size:0.88rem;">ఈ కంటెంట్‌కు ఆడియో ఇంకా జోడించలేదు (No audio attached)</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <button class="quick-add-audio-btn" data-id="${data.id}" type="button">
                    🎵 ＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3)
                  </button>
                  <button class="quick-link-audio-btn" data-id="${data.id}" type="button" style="padding:7px 12px;font-size:0.85rem;border-radius:10px;background:rgba(255,209,102,0.15);color:#ffd166;border:1px solid rgba(255,209,102,0.4);cursor:pointer;font-weight:600;">
                    🔗 URL ఇవ్వండి
                  </button>
                </div>
              </div>
            `}
          </div>

          <div class="lib-content-inline-editor" id="libContentEdit-${data.id}"></div>
        </div>
      </div>
    `;
  });

  list.querySelectorAll(".quick-add-audio-btn, .quick-change-audio-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const docId = btn.dataset.id;
      const url = await uploadAudioFile(btn);
      if (!url) return;
      await updateDoc(doc(db, "libraryContent", docId), {
        audioUrl: url,
        updatedAt: serverTimestamp()
      });
      alert("✅ ఆడియో విజయవంతంగా జోడించబడింది!");
      loadLibContentAdmin();
    });
  });

  list.querySelectorAll(".quick-link-audio-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const docId = btn.dataset.id;
      const inputUrl = prompt("ఆడియో డైరెక్ట్ MP3 లేదా Cloudinary URL ఇవ్వండి:");
      if (!inputUrl || !inputUrl.trim()) return;
      await updateDoc(doc(db, "libraryContent", docId), {
        audioUrl: inputUrl.trim(),
        updatedAt: serverTimestamp()
      });
      alert("✅ ఆడియో లింక్ జోడించబడింది!");
      loadLibContentAdmin();
    });
  });

  list.querySelectorAll(".quick-remove-audio-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ కంటెంట్ నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
      const docId = btn.dataset.id;
      await updateDoc(doc(db, "libraryContent", docId), {
        audioUrl: "",
        updatedAt: serverTimestamp()
      });
      alert("✅ ఆడియో తొలగించబడింది.");
      loadLibContentAdmin();
    });
  });

  list.querySelectorAll(".edit-lib-content-btn").forEach(btn => {
    btn.addEventListener("click", () => openLibContentInlineEditor(btn.dataset.id, items, subList));
  });
  list.querySelectorAll(".delete-lib-content-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this content?")) return;
      await deleteDoc(doc(db, "libraryContent", btn.dataset.id)); loadLibContentAdmin();
    });
  });
}

async function openLibContentInlineEditor(id, items, subList = []) {
  const editor = document.getElementById(`libContentEdit-${id}`);
  if (!editor) return;
  if (editor.innerHTML.trim() !== "") {
    editor.innerHTML = "";
    return;
  }
  const data = items.find(item => item.id === id);
  if (!data) return;

  if (!subList.length) {
    const subSnap = await getDocs(collection(db, "librarySubcategories"));
    subSnap.forEach(item => subList.push({ id: item.id, ...item.data() }));
  }

  let subOptions = `<option value="">Select Subcategory</option>`;
  subList.forEach(s => {
    subOptions += `<option value="${s.id}" ${s.id === data.subcategoryId ? "selected" : ""}>${s.title}</option>`;
  });

  editor.innerHTML = `
    <div class="festival-edit-panel">
      <select class="edit-lib-content-subcat" style="width:100%;padding:10px;border-radius:10px;background:rgba(30,20,10,0.9);color:white;border:1px solid rgba(255,209,102,0.3);margin-bottom:8px;">${subOptions}</select>
      <input class="edit-lib-content-title" value="${data.title || ""}" placeholder="Title">
      <input class="edit-lib-content-slug" value="${data.slug || slugify(data.title) || ""}" placeholder="Slug / Clean URL (e.g. hanuman-chalisa)">
      <textarea class="edit-lib-content-text" placeholder="Telugu Text">${data.text || ""}</textarea>
      
      <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:12px;padding:12px;margin:10px 0;">
        <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:8px;font-size:0.95rem;">🎵 ఆడియో (Audio for Real-time Shloka Playback):</label>
        <div class="cms-audio-upload-box edit-lib-audio-box" data-audio="${data.audioUrl || ""}" style="cursor:pointer;margin-bottom:8px;">
          ${data.audioUrl ? `<audio src="${data.audioUrl}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి ఇక్కడ క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`}
        </div>
        <input class="edit-lib-content-audio" value="${data.audioUrl || ""}" placeholder="లేదా ఆడియో URL ఇవ్వండి (Direct MP3, Cloudinary link)">
        <button type="button" class="open-line-sync-btn" data-target="content-${data.id}" style="margin-top:8px;padding:8px 14px;border-radius:10px;background:rgba(255,209,102,0.18);color:#ffd166;border:1px solid #ffd166;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:6px;font-size:0.85rem;">
          ⏱️ లైన్ వారీగా ఆడియో సెకన్లు సెట్ చేయండి (Set Line-by-Line Audio Timings)
        </button>
        ${createLineSyncEditorHtml(`content-${data.id}`)}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
        <button class="save-lib-content-edit-btn" type="button">Save Changes</button>
        <button class="cancel-lib-content-edit-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
      </div>
    </div>
  `;

  attachLineSyncEvents(
    `content-${data.id}`,
    () => editor.querySelector(".edit-lib-content-text"),
    () => editor.querySelector(".edit-lib-content-audio")?.value.trim() || editor.querySelector(".edit-lib-audio-box")?.dataset.audio || ""
  );

  const audioBox = editor.querySelector(".edit-lib-audio-box");
  const audioInput = editor.querySelector(".edit-lib-content-audio");
  if (audioBox) {
    audioBox.addEventListener("click", async () => {
      const url = await uploadAudioFile(audioBox);
      if (!url) return;
      audioBox.dataset.audio = url;
      audioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
      if (audioInput) audioInput.value = url;
    });
  }

  editor.querySelector(".cancel-lib-content-edit-btn").addEventListener("click", () => {
    editor.innerHTML = "";
  });

  editor.querySelector(".save-lib-content-edit-btn").addEventListener("click", async () => {
    const updatedTitle = editor.querySelector(".edit-lib-content-title").value.trim();
    const updatedSlug = editor.querySelector(".edit-lib-content-slug")?.value.trim() || slugify(updatedTitle);
    const updatedSub = editor.querySelector(".edit-lib-content-subcat").value;
    const finalAudio = audioInput ? audioInput.value.trim() : (audioBox?.dataset?.audio || "");
    await updateDoc(doc(db, "libraryContent", id), {
      title: updatedTitle,
      slug: updatedSlug,
      subcategoryId: updatedSub || data.subcategoryId,
      text: editor.querySelector(".edit-lib-content-text").value.trim(),
      audioUrl: finalAudio,
      updatedAt: serverTimestamp()
    });
    alert("✅ Content updated"); loadLibContentAdmin();
  });
}
loadLibContentAdmin();

// ══════════════════════════════════════
// BATCH SLUG GENERATOR & SITEMAP EXPORTER
// ══════════════════════════════════════

const batchGenerateSlugsBtn = document.getElementById("batchGenerateSlugsBtn");
if (batchGenerateSlugsBtn) {
  batchGenerateSlugsBtn.addEventListener("click", async () => {
    const msgEl = document.getElementById("slugBatchMsg");
    msgEl.innerText = "⏳ పాత రికార్డులను పరిశీలిస్తోంది, దయచేసి వేచి ఉండండి...";
    batchGenerateSlugsBtn.disabled = true;

    try {
      let updatedCount = 0;
      const collectionsToCheck = [
        "festivals",
        "temples",
        "libraryCategories",
        "librarySubcategories",
        "libraryContent"
      ];

      for (const colName of collectionsToCheck) {
        const snap = await getDocs(collection(db, colName));
        for (const docItem of snap.docs) {
          const data = docItem.data();
          if (!data.slug) {
            const newSlug = slugify(data.title || "") || docItem.id;
            await updateDoc(doc(db, colName, docItem.id), {
              slug: newSlug,
              updatedAt: serverTimestamp()
            });
            updatedCount++;
          }
        }
      }

      msgEl.innerText = `✅ పూర్తి! మొత్తం ${updatedCount} రికార్డులకు విజయవంతంగా స్లగ్స్ జోడించబడ్డాయి.`;
      loadAdminFestivals();
      loadAdminTemples();
      loadLibCategoriesAdmin();
      loadLibSubcategoriesAdmin();
      loadLibContentAdmin();
    } catch (err) {
      console.error("Batch slug error:", err);
      msgEl.innerText = "స్లగ్స్ క్రియేట్ చేయడంలో లోపం ఏర్పడింది: " + err.message;
    } finally {
      batchGenerateSlugsBtn.disabled = false;
    }
  });
}

const exportSitemapBtn = document.getElementById("exportSitemapBtn");
if (exportSitemapBtn) {
  exportSitemapBtn.addEventListener("click", async () => {
    const box = document.getElementById("sitemapOutputBox");
    box.style.display = "block";
    box.value = "⏳ సైట్‌మ్యాప్ లింకులు సేకరిస్తోంది...";

    try {
      let xml = `  <!-- Live Library & Detail URLs for Google Search -->\n`;

      // Festivals
      const fSnap = await getDocs(collection(db, "festivals"));
      fSnap.forEach(d => {
        const slug = d.data().slug || d.id;
        xml += `  <url>\n    <loc>https://sannivesham.com/festivals/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
      });

      // Temples
      const tSnap = await getDocs(collection(db, "temples"));
      tSnap.forEach(d => {
        const slug = d.data().slug || d.id;
        xml += `  <url>\n    <loc>https://sannivesham.com/temples/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
      });

      // Library Subcategories & Content
      const sSnap = await getDocs(collection(db, "librarySubcategories"));
      sSnap.forEach(d => {
        const slug = d.data().slug || d.id;
        xml += `  <url>\n    <loc>https://sannivesham.com/library/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
      });

      const cSnap = await getDocs(collection(db, "libraryContent"));
      cSnap.forEach(d => {
        const slug = d.data().slug;
        if (slug) {
          xml += `  <url>\n    <loc>https://sannivesham.com/library/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>\n  </url>\n`;
        }
      });

      box.value = xml;
      box.select();
      alert("✅ Sitemap URLs సిద్ధమయ్యాయి! కింద ఉన్న బాక్స్ నుండి కాపీ చేసుకోండి.");
    } catch (err) {
      console.error("Sitemap export error:", err);
      box.value = "Error: " + err.message;
    }
  });
}

/* ══════════════════════════════════════
   SLOKAS CMS
══════════════════════════════════════ */

const slokaCategoryImageBox = document.getElementById("slokaCategoryImageBox");
if (slokaCategoryImageBox) {
  slokaCategoryImageBox.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    slokaCategoryImageBox.dataset.image = url;
    slokaCategoryImageBox.innerHTML = `<img src="${url}">`;
  });
}

const saveSlokaCategoryBtn = document.getElementById("saveSlokaCategoryBtn");
if (saveSlokaCategoryBtn) {
  saveSlokaCategoryBtn.addEventListener("click", async () => {
    const title = document.getElementById("slokaCategoryTitle").value.trim();
    const cardImage = slokaCategoryImageBox.dataset.image || "";
    if (!title || !cardImage) { document.getElementById("slokaCategoryMessage").innerText = "Category name and image required"; return; }
    await addDoc(collection(db, "slokaCategories"), { title, cardImage, createdAt: serverTimestamp() });
    document.getElementById("slokaCategoryMessage").innerText = "✅ Sloka Category saved";
    loadSlokaCategoriesAdmin();
  });
}

async function loadSlokaCategoriesAdmin() {
  const list = document.getElementById("adminSlokaCategoriesList");
  if (!list) return;
  const q = query(collection(db, "slokaCategories"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach(item => {
    const data = item.data();
    list.innerHTML += `
      <div class="admin-event-card" style="flex-direction:column;align-items:stretch;">
        <div style="display:flex;gap:14px;align-items:center;">
          <img src="${data.cardImage}" alt="${data.title}" style="width:60px;height:60px;object-fit:cover;border-radius:10px;">
          <div style="flex:1;">
            <h3 style="margin:0 0 6px;">${data.title}</h3>
            <div style="display:flex;gap:8px;">
              <button class="edit-sloka-category-btn" data-id="${item.id}" type="button">✏️ Edit</button>
              <button class="delete-sloka-category-btn" data-id="${item.id}" type="button">Delete</button>
            </div>
          </div>
        </div>
        <div class="general-inline-edit-box" id="slokaCatEdit-${item.id}" style="display:none;">
          <input class="sce-title" value="${data.title || ""}" placeholder="Category Title">
          <div class="festival-card-upload-box sce-card-image" data-image="${data.cardImage || ""}">
            ${data.cardImage ? `<img src="${data.cardImage}" style="max-height:120px;">` : `<span>＋ Category Image</span>`}
          </div>
          <div class="general-inline-edit-actions">
            <button class="save-sce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
            <button class="cancel-sce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
          </div>
        </div>
      </div>
    `;
  });

  list.querySelectorAll(".edit-sloka-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`slokaCatEdit-${btn.dataset.id}`);
      if (box) box.style.display = box.style.display === "none" ? "flex" : "none";
    });
  });

  list.querySelectorAll(".cancel-sce-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".general-inline-edit-box");
      if (box) box.style.display = "none";
    });
  });

  list.querySelectorAll(".sce-card-image").forEach(slot => {
    slot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      slot.dataset.image = url;
      slot.innerHTML = `<img src="${url}" style="max-height:120px;">`;
    });
  });

  list.querySelectorAll(".save-sce-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const box = btn.closest(".general-inline-edit-box");
      const id = box.id.replace("slokaCatEdit-", "");
      const title = box.querySelector(".sce-title").value.trim();
      const cardImage = box.querySelector(".sce-card-image").dataset.image || "";
      if (!title || !cardImage) {
        alert("Title and image required");
        return;
      }
      await updateDoc(doc(db, "slokaCategories", id), {
        title, cardImage, updatedAt: serverTimestamp()
      });
      alert("✅ Sloka category updated");
      loadSlokaCategoriesAdmin();
      loadSlokaDirectCategories();
      loadSlokasAdmin();
    });
  });

  list.querySelectorAll(".delete-sloka-category-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "slokaCategories", btn.dataset.id));
      loadSlokaCategoriesAdmin();
      loadSlokaDirectCategories();
      loadSlokasAdmin();
    });
  });
}
loadSlokaCategoriesAdmin();

async function loadSlokaDirectCategories() {
  const select = document.getElementById("slokaDirectCategorySelect");
  if (!select) return;
  const q = query(collection(db, "slokaCategories"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  select.innerHTML = `<option value="">Select Category</option>`;
  snapshot.forEach(item => {
    select.innerHTML += `<option value="${item.id}">${item.data().title}</option>`;
  });
}

const slokaAudioBox = document.getElementById("slokaAudioBox");
if (slokaAudioBox) {
  slokaAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile(slokaAudioBox);
    if (!url) return;
    slokaAudioBox.dataset.audio = url;
    slokaAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const audioInput = document.getElementById("slokaAudioUrl");
    if (audioInput) audioInput.value = url;
  });
}

const saveSlokaBtn = document.getElementById("saveSlokaBtn");
if (saveSlokaBtn) {
  saveSlokaBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("slokaDirectCategorySelect").value;
    const number = document.getElementById("slokaNumber").value.trim();
    const sloka = document.getElementById("slokaText").value.trim();
    const telugu = document.getElementById("slokaTeluguMeaning").value.trim();
    const audioUrl = document.getElementById("slokaAudioUrl")?.value.trim() || slokaAudioBox?.dataset.audio || "";
    if (!categoryId || !number || !sloka || !telugu) { document.getElementById("slokaMessage").innerText = "Category, number, sloka and Telugu meaning required"; return; }
    await addDoc(collection(db, "slokas"), {
      categoryId, number, sloka, telugu, audioUrl, createdAt: serverTimestamp()
    });
    document.getElementById("slokaMessage").innerText = "✅ Sloka Saved";
    document.getElementById("slokaNumber").value = "";
    document.getElementById("slokaText").value = "";
    document.getElementById("slokaTeluguMeaning").value = "";
    const audioInput = document.getElementById("slokaAudioUrl");
    if (audioInput) audioInput.value = "";
    if (slokaAudioBox) {
      slokaAudioBox.dataset.audio = "";
      slokaAudioBox.innerHTML = `<span>＋ Sloka Audio File అప్‌లోడ్ చేయండి (Upload MP3 / Audio)</span>`;
    }
    loadSlokasAdmin();
  });
}

function getSlokaNumberAdmin(value) {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 9999 : n;
}

async function loadSlokasAdmin() {
  const list = document.getElementById("adminSlokasList");
  if (!list) return;
  const slokaSnap = await getDocs(collection(db, "slokas"));
  const categorySnap = await getDocs(collection(db, "slokaCategories"));
  const categories = []; const slokas = [];
  categorySnap.forEach(d => categories.push({ id: d.id, ...d.data() }));
  slokaSnap.forEach(d => slokas.push({ id: d.id, ...d.data() }));
  list.innerHTML = "";
  categories.forEach(category => {
    const categorySlokas = slokas.filter(s => s.categoryId === category.id).sort((a, b) => getSlokaNumberAdmin(a.number) - getSlokaNumberAdmin(b.number));
    list.innerHTML += `
      <div class="admin-event-card sloka-category-admin-card" style="flex-direction:column;align-items:stretch;">
        <div style="display:flex;gap:14px;align-items:center;">
          <img src="${category.cardImage || ""}" alt="${category.title || ""}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;">
          <div>
            <h3 style="margin:0 0 6px;">${category.title || ""}</h3>
            <p style="margin:0 0 8px;font-size:0.9rem;color:rgba(255,255,255,0.7);">Total Slokas: ${categorySlokas.length}</p>
            <button class="toggle-sloka-category-btn" data-id="${category.id}">Open Slokas</button>
          </div>
        </div>
        <div class="sloka-category-list hide" id="slokaList-${category.id}" style="width:100%;margin-top:14px;">
          ${categorySlokas.length === 0 ? `<p style="padding:10px;color:rgba(255,255,255,0.5);">No slokas added yet</p>` : categorySlokas.map(s => `
            <div class="admin-event-card single-sloka-admin-card" style="flex-direction:column;align-items:stretch;margin-bottom:12px;">
              <div style="width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                  <h3 style="margin:0;color:#ffd166;">${s.number || ""}</h3>
                  <div style="display:flex;gap:8px;">
                    <button class="edit-sloka-btn cms-list-edit-btn" data-id="${s.id}" type="button">✏️ Edit</button>
                    <button class="delete-sloka-btn cms-list-delete-btn" data-id="${s.id}" type="button">Delete</button>
                  </div>
                </div>
                <p style="margin:8px 0;line-height:1.6;">${s.sloka || ""}</p>
                <p style="margin:4px 0;font-size:0.85rem;color:rgba(255,255,255,0.7);"><strong>భావం:</strong> ${s.telugu || ""}</p>

                <!-- SLOKA AUDIO CARD CONTROLS -->
                <div class="content-audio-card-box" style="margin:8px 0;">
                  ${s.audioUrl ? `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:220px;">
                        <span>🎵</span>
                        <audio src="${s.audioUrl}" controls style="height:32px;flex:1;"></audio>
                      </div>
                      <div style="display:flex;gap:6px;">
                        <button class="sloka-change-audio-btn" data-id="${s.id}" type="button" style="padding:4px 10px;font-size:0.8rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;">🔄 మార్చండి</button>
                        <button class="sloka-remove-audio-btn" data-id="${s.id}" type="button" style="padding:4px 8px;font-size:0.8rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌</button>
                      </div>
                    </div>
                  ` : `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                      <span style="font-size:0.82rem;color:rgba(255,255,255,0.5);">ఆడియో జతచేయబడలేదు (No audio attached)</span>
                      <button class="sloka-quick-add-audio-btn" data-id="${s.id}" type="button" style="padding:5px 12px;font-size:0.82rem;border-radius:8px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">
                        🎵 ＋ Audio File జోడించండి
                      </button>
                    </div>
                  `}
                </div>

                <div class="sloka-edit-box hide" id="slokaEdit-${s.id}">
                  <input type="text" class="edit-sloka-number" value="${s.number || ""}" placeholder="Sloka Number">
                  <textarea class="edit-sloka-text" placeholder="Sloka Text">${s.sloka || ""}</textarea>
                  <textarea class="edit-sloka-telugu" placeholder="Telugu Meaning">${s.telugu || ""}</textarea>
                  
                  <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:10px;padding:10px;margin:6px 0;">
                    <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:6px;font-size:0.88rem;">🎵 శ్లోకం ఆడియో (Sloka Audio):</label>
                    <div class="cms-audio-upload-box edit-sloka-audio-box" data-audio="${s.audioUrl || ""}" style="cursor:pointer;margin-bottom:6px;">
                      ${s.audioUrl ? `<audio src="${s.audioUrl}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3)</span>`}
                    </div>
                    <input type="text" class="edit-sloka-audio-url" value="${s.audioUrl || ""}" placeholder="లేదా Audio URL ఇవ్వండి" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
                  </div>

                  <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="save-sloka-edit-btn" data-id="${s.id}" type="button">Save Changes</button>
                    <button class="cancel-sloka-edit-btn" data-id="${s.id}" type="button" style="padding:10px 16px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  });

  list.querySelectorAll(".edit-sloka-audio-box").forEach(slot => {
    slot.addEventListener("click", async () => {
      const url = await uploadAudioFile(slot);
      if (!url) return;
      slot.dataset.audio = url;
      slot.innerHTML = `<audio src="${url}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
      const urlInput = slot.closest(".sloka-edit-box").querySelector(".edit-sloka-audio-url");
      if (urlInput) urlInput.value = url;
    });
  });

  list.querySelectorAll(".sloka-quick-add-audio-btn, .sloka-change-audio-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = await uploadAudioFile(btn);
      if (!url) return;
      await updateDoc(doc(db, "slokas", btn.dataset.id), { audioUrl: url, updatedAt: serverTimestamp() });
      alert("✅ ఆడియో విజయవంతంగా జోడించబడింది");
      loadSlokasAdmin();
    });
  });

  list.querySelectorAll(".sloka-remove-audio-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ శ్లోకం నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
      await updateDoc(doc(db, "slokas", btn.dataset.id), { audioUrl: "", updatedAt: serverTimestamp() });
      alert("✅ ఆడియో తొలగించబడింది");
      loadSlokasAdmin();
    });
  });

  document.querySelectorAll(".toggle-sloka-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`slokaList-${btn.dataset.id}`);
      box.classList.toggle("hide");
      btn.innerText = box.classList.contains("hide") ? "Open Slokas" : "Collapse Slokas";
    });
  });
  document.querySelectorAll(".edit-sloka-btn").forEach(btn => {
    btn.addEventListener("click", () => document.getElementById(`slokaEdit-${btn.dataset.id}`).classList.toggle("hide"));
  });
  document.querySelectorAll(".cancel-sloka-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => document.getElementById(`slokaEdit-${btn.dataset.id}`).classList.add("hide"));
  });
  document.querySelectorAll(".save-sloka-edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const box = document.getElementById(`slokaEdit-${btn.dataset.id}`);
      const audioUrl = box.querySelector(".edit-sloka-audio-url")?.value.trim() || box.querySelector(".edit-sloka-audio-box")?.dataset.audio || "";
      await updateDoc(doc(db, "slokas", btn.dataset.id), {
        number: box.querySelector(".edit-sloka-number").value.trim(),
        sloka: box.querySelector(".edit-sloka-text").value.trim(),
        telugu: box.querySelector(".edit-sloka-telugu").value.trim(),
        audioUrl: audioUrl,
        updatedAt: serverTimestamp()
      });
      alert("✅ Sloka updated"); loadSlokasAdmin();
    });
  });
  document.querySelectorAll(".delete-sloka-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this sloka?")) return;
      await deleteDoc(doc(db, "slokas", btn.dataset.id)); loadSlokasAdmin();
    });
  });
}
loadSlokaDirectCategories(); loadSlokasAdmin();

/* ══════════════════════════════════════
   VIDEOS CMS
══════════════════════════════════════ */

function uploadVideoFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files[0]; if (!file) return resolve(null);
      const statusText = document.createElement("span");
      statusText.innerText = "అప్‌లోడ్ అవుతోంది... దయచేసి వేచి ఉండండి";
      statusText.style.color = "#ffd166"; statusText.style.display = "block";
      const vfb = document.getElementById("videoFileBox");
      if (vfb) vfb.appendChild(statusText);
      const formData = new FormData();
      formData.append("file", file); formData.append("upload_preset", UPLOAD_PRESET);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data.secure_url) throw new Error("Video upload failed");
        resolve(data.secure_url);
      } catch (error) { alert("Video upload failed: " + error.message); resolve(null); }
      finally { statusText.remove(); }
    };
    input.click();
  });
}

const videoCardImageGrid = document.getElementById("videoCardImageGrid");
if (videoCardImageGrid) {
  videoCardImageGrid.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    videoCardImageGrid.dataset.image = url;
    videoCardImageGrid.innerHTML = `<img src="${url}">`;
  });
}

const videoFileBox = document.getElementById("videoFileBox");
if (videoFileBox) {
  videoFileBox.addEventListener("click", async () => {
    const url = await uploadVideoFile(); if (!url) return;
    videoFileBox.dataset.video = url;
    videoFileBox.innerHTML = `<video src="${url}" style="width:100%;max-height:180px;" controls></video>`;
  });
}

const saveVideoBtn = document.getElementById("saveVideoBtn");
if (saveVideoBtn) {
  saveVideoBtn.addEventListener("click", async () => {
    const title = document.getElementById("videoTitle").value.trim();
    const cardImage = videoCardImageGrid.dataset.image || "";
    const videoUrl = videoFileBox.dataset.video || "";
    if (!title || !cardImage || !videoUrl) { document.getElementById("videoMessage").innerText = "దయచేసి పేరు, కార్డ్ ఇమేజ్ మరియు వీడియో ఫైల్ జోడించండి"; return; }
    saveVideoBtn.disabled = true; saveVideoBtn.innerText = "Saving...";
    try {
      await addDoc(collection(db, "videos"), { title, cardImage, videoUrl, createdAt: serverTimestamp() });
      document.getElementById("videoTitle").value = "";
      videoCardImageGrid.dataset.image = ""; videoCardImageGrid.innerHTML = `<span>＋ Video Card Image</span>`;
      videoFileBox.dataset.video = ""; videoFileBox.innerHTML = `<span>＋ Select Video File</span>`;
      document.getElementById("videoMessage").innerText = "✅ వీడియో సేవ్ అయింది";
      loadAdminVideos();
    } catch (error) { document.getElementById("videoMessage").innerText = "❌ Error: " + error.message; }
    finally { saveVideoBtn.disabled = false; saveVideoBtn.innerText = "వీడియో సేవ్ చేయండి"; }
  });
}

async function loadAdminVideos() {
  const list = document.getElementById("adminVideosList");
  if (!list) return;
  const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach(item => {
    const data = item.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${data.cardImage}" alt="${data.title}">
        <div>
          <h3>${data.title}</h3>
          <p>${data.videoUrl ? "🎬 Video attached" : "⚠️ No video file"}</p>
          <button class="edit-video-btn" data-id="${item.id}">Edit</button>
          <button class="delete-video-btn" data-id="${item.id}">Delete</button>
          <div class="video-inline-editor" id="videoEdit-${item.id}"></div>
        </div>
      </div>
    `;
  });
  document.querySelectorAll(".edit-video-btn").forEach(btn => {
    btn.addEventListener("click", () => openVideoInlineEditor(btn.dataset.id));
  });
  document.querySelectorAll(".delete-video-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ వీడియో డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "videos", btn.dataset.id)); loadAdminVideos();
    });
  });
}

async function openVideoInlineEditor(id) {
  const editor = document.getElementById(`videoEdit-${id}`);
  if (!editor) return;
  if (editor.innerHTML.trim() !== "") {
    editor.innerHTML = "";
    return;
  }
  const snap = await getDoc(doc(db, "videos", id));
  if (!snap.exists()) return;
  const data = snap.data();
  editor.innerHTML = `
    <div class="festival-edit-panel">
      <input class="inline-video-title" value="${data.title || ""}" placeholder="Video Title">
      <div class="festival-card-upload-box inline-video-card-image" data-image="${data.cardImage || ""}">
        ${data.cardImage ? `<img src="${data.cardImage}">` : `<span>＋ Video Card Image</span>`}
      </div>
      <div class="festival-card-upload-box inline-video-file" data-video="${data.videoUrl || ""}">
        ${data.videoUrl ? `<video src="${data.videoUrl}" style="width:100%;max-height:180px;" controls></video>` : `<span>＋ Select Video File</span>`}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
        <button class="save-inline-video-btn" type="button">Save Changes</button>
        <button class="cancel-inline-video-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
      </div>
    </div>
  `;
  editor.querySelector(".cancel-inline-video-btn").addEventListener("click", () => {
    editor.innerHTML = "";
  });
  editor.querySelector(".inline-video-card-image").addEventListener("click", async (e) => {
    const url = await uploadImage(); if (!url) return;
    e.currentTarget.dataset.image = url; e.currentTarget.innerHTML = `<img src="${url}">`;
  });
  editor.querySelector(".inline-video-file").addEventListener("click", async (e) => {
    const url = await uploadVideoFile(); if (!url) return;
    e.currentTarget.dataset.video = url;
    e.currentTarget.innerHTML = `<video src="${url}" style="width:100%;max-height:180px;" controls></video>`;
  });
  editor.querySelector(".save-inline-video-btn").addEventListener("click", async () => {
    await updateDoc(doc(db, "videos", id), {
      title: editor.querySelector(".inline-video-title").value.trim(),
      cardImage: editor.querySelector(".inline-video-card-image").dataset.image || "",
      videoUrl: editor.querySelector(".inline-video-file").dataset.video || "",
      updatedAt: serverTimestamp()
    });
    alert("✅ Video updated"); loadAdminVideos();
  });
}
loadAdminVideos();

const saveAboutSettingsBtn = document.getElementById("saveAboutSettingsBtn");
if (saveAboutSettingsBtn) {
  saveAboutSettingsBtn.addEventListener("click", async () => {
    const msg = document.getElementById("aboutSettingsMessage");

    saveAboutSettingsBtn.disabled = true;
    saveAboutSettingsBtn.innerText = "Saving...";
    msg.innerText = "";

    try {
      await setDoc(doc(db, "aboutSettings", "main"), {
        title: document.getElementById("aboutTitle").value.trim(),
        description: document.getElementById("aboutDescription").value.trim(),
        mission: document.getElementById("aboutMission").value.trim(),
        vision: document.getElementById("aboutVision").value.trim(),
        pcBg: document.getElementById("aboutPcBgBox").dataset.image || "",
        mobileBg: document.getElementById("aboutMobileBgBox").dataset.image || "",
        updatedAt: serverTimestamp()
      }, { merge: true });

      msg.innerText = "✅ About settings saved";
    } catch (error) {
      console.error("About settings save failed:", error);
      msg.innerText = "❌ Error: " + error.message;
    } finally {
      saveAboutSettingsBtn.disabled = false;
      saveAboutSettingsBtn.innerText = "Save About Settings";
    }
  });
}

/* ══════════════════════════════════════
   SOCIAL LINKS CMS
══════════════════════════════════════ */

async function loadSocialLinksAdmin() {
  const snap = await getDoc(doc(db, "settings", "socialLinks"));
  if (!snap.exists()) return;
  const data = snap.data();
  document.getElementById("instagramLink").value = data.instagram || "";
  document.getElementById("youtubeLink").value = data.youtube || "";
  document.getElementById("whatsappLink").value = data.whatsapp || "";
  document.getElementById("facebookLink").value = data.facebook || "";
  document.getElementById("phoneNumber").value = data.phone || "";
  document.getElementById("emailLink").value = data.email || "";
  document.getElementById("whatsappChannelLink").value = data.whatsappChannel || "";
}

const saveSocialLinksBtn = document.getElementById("saveSocialLinksBtn");
if (saveSocialLinksBtn) {
  saveSocialLinksBtn.addEventListener("click", async () => {
    await setDoc(doc(db, "settings", "socialLinks"), {
      instagram: document.getElementById("instagramLink").value.trim(),
      youtube: document.getElementById("youtubeLink").value.trim(),
      whatsapp: document.getElementById("whatsappLink").value.trim(),
      facebook: document.getElementById("facebookLink").value.trim(),
      phone: document.getElementById("phoneNumber").value.trim(),
      email: document.getElementById("emailLink").value.trim(),
      whatsappChannel: document.getElementById("whatsappChannelLink").value.trim(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    document.getElementById("socialLinksMessage").innerText = "✅ Social Links Updated";
  });
}
loadSocialLinksAdmin();

/* ══════════════════════════════════════
   HOME CARDS CMS
══════════════════════════════════════ */

const homeCardBoxes = {
  eventsCard: document.getElementById("eventsCardBox"),
  festivalsCard: document.getElementById("festivalsCardBox"),
  templesCard: document.getElementById("templesCardBox"),
  storiesCard: document.getElementById("storiesCardBox"),
  slokasCard: document.getElementById("slokasCardBox"),
  quizCard: document.getElementById("quizCardBox"),
  itihasaluCard: document.getElementById("itihasaluCardBox"),
  videosCard: document.getElementById("videosCardBox"),
  calendarCard: document.getElementById("calendarCardBox"),
  chantCounterCard: document.getElementById("chantCounterCardBox"),
  poojaRoomCard: document.getElementById("poojaRoomCardBox"),
  storeCard: document.getElementById("storeCardBox")
};

const homeCardsThemeSelector = document.getElementById("homeCardsThemeSelector");
const homeCardsThemeStatus = document.getElementById("homeCardsThemeStatus");

const defaultHomeCardLabels = {
  eventsCard: "＋ Events Card",
  festivalsCard: "＋ Festivals Card",
  templesCard: "＋ Temples Card",
  storiesCard: "＋ Library Card",
  slokasCard: "＋ Games Card",
  quizCard: "＋ Quiz Card",
  itihasaluCard: "＋ Ithihasalu Card",
  videosCard: "＋ Videos Card",
  calendarCard: "＋ Calendar Card",
  chantCounterCard: "＋ Chant Counter Card",
  poojaRoomCard: "＋ 🪔 Festival Counter (పండుగల గణకం)",
  storeCard: "＋ Store Card"
};

Object.keys(homeCardBoxes).forEach(key => {
  const box = homeCardBoxes[key];
  if (!box) return;
  box.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    box.dataset.image = url;
    box.innerHTML = `<img src="${url}"><span style="display:block;font-size:10.5px;color:#2ec4b6;margin-top:4px;">Ready to save</span>`;
  });
});

async function loadHomeCardsAdmin() {
  const currentTheme = homeCardsThemeSelector ? homeCardsThemeSelector.value : "ramayanam";
  if (homeCardsThemeStatus && homeCardsThemeSelector) {
    const text = homeCardsThemeSelector.options[homeCardsThemeSelector.selectedIndex].text;
    homeCardsThemeStatus.innerText = `Active: ${text}`;
  }

  // Reset boxes to default placeholders first
  Object.keys(homeCardBoxes).forEach(key => {
    const box = homeCardBoxes[key];
    if (!box) return;
    box.dataset.image = "";
    box.innerHTML = `<span>${defaultHomeCardLabels[key] || "＋ Upload Card"}</span>`;
  });

  try {
    const snap = await getDoc(doc(db, "settings", "homeCards"));
    if (!snap.exists()) return;
    const data = snap.data();

    let cardSource = {};
    if (currentTheme === "global") {
      cardSource = data;
    } else {
      const themeCards = (data.themes && data.themes[currentTheme]) || {};
      Object.keys(homeCardBoxes).forEach(key => {
        cardSource[key] = themeCards[key] || data[key] || "";
      });
    }

    Object.keys(homeCardBoxes).forEach(key => {
      const box = homeCardBoxes[key];
      const imgUrl = cardSource[key];
      if (!box || !imgUrl) return;
      box.dataset.image = imgUrl;

      const isCustom = (currentTheme !== "global" && data.themes && data.themes[currentTheme] && data.themes[currentTheme][key]);
      const badge = currentTheme !== "global"
        ? (isCustom ? `<span style="display:block;font-size:10px;color:#2ec4b6;font-weight:bold;margin-top:4px;">Custom (${currentTheme})</span>` : `<span style="display:block;font-size:10px;color:#ffb703;margin-top:4px;">Global Fallback</span>`)
        : "";

      box.innerHTML = `<img src="${imgUrl}">${badge}`;
    });
  } catch (e) {
    console.error("Error loading home cards admin:", e);
  }
}

if (homeCardsThemeSelector) {
  homeCardsThemeSelector.addEventListener("change", loadHomeCardsAdmin);
}
loadHomeCardsAdmin();

const saveHomeCardsBtn = document.getElementById("saveHomeCardsBtn");
if (saveHomeCardsBtn) {
  saveHomeCardsBtn.addEventListener("click", async () => {
    const currentTheme = homeCardsThemeSelector ? homeCardsThemeSelector.value : "ramayanam";
    const cardData = {};
    Object.keys(homeCardBoxes).forEach(key => {
      const box = homeCardBoxes[key];
      cardData[key] = box?.dataset.image || "";
    });

    saveHomeCardsBtn.disabled = true;
    saveHomeCardsBtn.innerText = "Saving...";
    document.getElementById("homeCardsMessage").innerText = "Saving cards to Firestore...";

    try {
      if (currentTheme === "global") {
        await setDoc(
          doc(db, "settings", "homeCards"),
          { ...cardData, updatedAt: serverTimestamp() },
          { merge: true }
        );
        document.getElementById("homeCardsMessage").innerText = "✅ Global fallback cards saved successfully!";
      } else {
        await setDoc(
          doc(db, "settings", "homeCards"),
          {
            themes: {
              [currentTheme]: cardData
            },
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
        document.getElementById("homeCardsMessage").innerText = `✅ Home cards saved for ${currentTheme.toUpperCase()} theme!`;
      }
      await loadHomeCardsAdmin();
    } catch (err) {
      console.error(err);
      document.getElementById("homeCardsMessage").innerText = `❌ Error: ${err.message}`;
    } finally {
      saveHomeCardsBtn.disabled = false;
      saveHomeCardsBtn.innerText = "Save Home Cards";
    }
  });
}

/* ══════════════════════════════════════
   SPONSOR CMS
══════════════════════════════════════ */

const sponsorImageBox = document.getElementById("sponsorImageBox");
if (sponsorImageBox) {
  sponsorImageBox.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    sponsorImageBox.dataset.image = url; sponsorImageBox.innerHTML = `<img src="${url}">`;
  });
}

async function loadSponsorAdmin() {
  const snap = await getDoc(doc(db, "settings", "sponsor"));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.image && sponsorImageBox) { sponsorImageBox.dataset.image = data.image; sponsorImageBox.innerHTML = `<img src="${data.image}">`; }
  document.getElementById("sponsorLinkInput").value = data.link || "";
}
loadSponsorAdmin();

const saveSponsorBtn = document.getElementById("saveSponsorBtn");
if (saveSponsorBtn) {
  saveSponsorBtn.addEventListener("click", async () => {
    await setDoc(doc(db, "settings", "sponsor"), { image: sponsorImageBox?.dataset.image || "", link: document.getElementById("sponsorLinkInput").value.trim(), updatedAt: serverTimestamp() }, { merge: true });
    document.getElementById("sponsorMessage").innerText = "✅ Sponsor saved";
  });
}

/* ══════════════════════════════════════
   QOTD CMS
══════════════════════════════════════ */

const saveQotdBtn = document.getElementById("saveQotdBtn");
if (saveQotdBtn) {
  saveQotdBtn.addEventListener("click", async () => {
    const dateValue = document.getElementById("qotdDate").value;
    if (!dateValue) { document.getElementById("qotdMessage").innerText = "⚠️ Please select a date"; return; }
    const question = document.getElementById("qotdQuestionInput").value.trim();
    const options = [
      document.getElementById("qotdOption0").value.trim(),
      document.getElementById("qotdOption1").value.trim(),
      document.getElementById("qotdOption2").value.trim(),
      document.getElementById("qotdOption3").value.trim()
    ];
    const correct = parseInt(document.getElementById("qotdCorrectSelect").value);
    if (!question || options.some(o => !o)) { document.getElementById("qotdMessage").innerText = "⚠️ Please fill question and all 4 options"; return; }
    await setDoc(doc(db, "qotd", dateValue), { question, options, correct, updatedAt: serverTimestamp() });
    document.getElementById("qotdMessage").innerText = "✅ Question saved for " + dateValue;
    document.getElementById("qotdQuestionInput").value = "";
    ["qotdOption0","qotdOption1","qotdOption2","qotdOption3"].forEach(id => document.getElementById(id).value = "");
    loadQotdList();
  });
}

async function loadQotdList() {
  const listBox = document.getElementById("qotdList");
  if (!listBox) return;
  const snap = await getDocs(collection(db, "qotd"));
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  items.sort((a, b) => a.id < b.id ? -1 : 1);
  listBox.innerHTML = "";
  items.forEach(item => {
    const opts = item.options || [];
    const correctIdx = item.correct ?? 0;
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text">
          <span class="cms-list-item-date" style="color:#ffd166;font-weight:bold;">${item.id}</span>: ${item.question || ""}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn qotd-edit-btn" data-id="${item.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${item.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="qotdEdit-${item.id}" style="display:none;">
        <input class="q-edit-question" value="${item.question || ""}" placeholder="ప్రశ్న (Question)">
        <input class="q-edit-opt0" value="${opts[0] || ""}" placeholder="Option 1">
        <input class="q-edit-opt1" value="${opts[1] || ""}" placeholder="Option 2">
        <input class="q-edit-opt2" value="${opts[2] || ""}" placeholder="Option 3">
        <input class="q-edit-opt3" value="${opts[3] || ""}" placeholder="Option 4">
        <label style="font-size:0.85rem;color:#ffd166;">సరైన సమాధానం (Correct Option):</label>
        <select class="q-edit-correct" style="padding:10px;border-radius:10px;background:rgba(30,20,10,0.9);color:white;border:1px solid rgba(255,209,102,0.3);">
          <option value="0" ${correctIdx === 0 ? "selected" : ""}>Option 1</option>
          <option value="1" ${correctIdx === 1 ? "selected" : ""}>Option 2</option>
          <option value="2" ${correctIdx === 2 ? "selected" : ""}>Option 3</option>
          <option value="3" ${correctIdx === 3 ? "selected" : ""}>Option 4</option>
        </select>
        <div class="general-inline-edit-actions">
          <button class="save-qotd-edit-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-qotd-edit-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#qotdEdit-${item.id}`);
    row.querySelector(".qotd-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-qotd-edit-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    row.querySelector(".save-qotd-edit-btn").addEventListener("click", async () => {
      const question = editBox.querySelector(".q-edit-question").value.trim();
      const options = [
        editBox.querySelector(".q-edit-opt0").value.trim(),
        editBox.querySelector(".q-edit-opt1").value.trim(),
        editBox.querySelector(".q-edit-opt2").value.trim(),
        editBox.querySelector(".q-edit-opt3").value.trim()
      ];
      const correct = parseInt(editBox.querySelector(".q-edit-correct").value);
      if (!question || options.some(o => !o)) {
        alert("Please fill question and all 4 options");
        return;
      }
      await setDoc(doc(db, "qotd", item.id), {
        question, options, correct, updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ Question updated for " + item.id);
      loadQotdList();
    });

    listBox.appendChild(row);
  });
  listBox.querySelectorAll(".cms-list-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ ప్రశ్న డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "qotd", btn.dataset.id)); loadQotdList();
    });
  });
}
loadQotdList();

/* ══════════════════════════════════════
   WORD OF DAY CMS
══════════════════════════════════════ */

const saveWordBtn = document.getElementById("saveWordBtn");
if (saveWordBtn) {
  saveWordBtn.addEventListener("click", async () => {
    const dateValue = document.getElementById("wordDate").value;
    if (!dateValue) { document.getElementById("wordMessage").innerText = "⚠️ Please select a date"; return; }
    const text = document.getElementById("wordTextInput").value.trim();
    if (!text) { document.getElementById("wordMessage").innerText = "⚠️ Please enter a word/sentence"; return; }
    await setDoc(doc(db, "wordOfDay", dateValue), { text, updatedAt: serverTimestamp() });
    document.getElementById("wordMessage").innerText = "✅ Word saved for " + dateValue;
    document.getElementById("wordTextInput").value = "";
    loadWordList();
  });
}

async function loadWordList() {
  const listBox = document.getElementById("wordList");
  if (!listBox) return;
  const snap = await getDocs(collection(db, "wordOfDay"));
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  items.sort((a, b) => a.id < b.id ? -1 : 1);
  listBox.innerHTML = "";
  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text">
          <span class="cms-list-item-date" style="color:#ffd166;font-weight:bold;">${item.id}</span>: ${item.text || ""}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn word-edit-btn" data-id="${item.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${item.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="wordEdit-${item.id}" style="display:none;">
        <textarea class="w-edit-text" placeholder="Word & Meaning" style="min-height:70px;">${item.text || ""}</textarea>
        <div class="general-inline-edit-actions">
          <button class="save-word-edit-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-word-edit-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#wordEdit-${item.id}`);
    row.querySelector(".word-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-word-edit-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    row.querySelector(".save-word-edit-btn").addEventListener("click", async () => {
      const text = editBox.querySelector(".w-edit-text").value.trim();
      if (!text) {
        alert("Please enter a word/sentence");
        return;
      }
      await setDoc(doc(db, "wordOfDay", item.id), {
        text, updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ Word updated for " + item.id);
      loadWordList();
    });

    listBox.appendChild(row);
  });
  listBox.querySelectorAll(".cms-list-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ పదం డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "wordOfDay", btn.dataset.id)); loadWordList();
    });
  });
}
loadWordList();


/* ══════════════════════════════════════
   STREAM CMS
══════════════════════════════════════ */

// Hero
const saveHeroBtn = document.getElementById("saveHeroBtn");
if (saveHeroBtn) {
  saveHeroBtn.addEventListener("click", async () => {
    const videoId = document.getElementById("heroVideoId").value.trim();
    if (!videoId) return;
    await setDoc(doc(db, "streamSettings", "hero"), { videoId, updatedAt: serverTimestamp() });
    document.getElementById("heroMsg").innerText = "✅ Featured video set";
  });
}

// Stream Categories
const saveStreamCatBtn = document.getElementById("saveStreamCatBtn");
if (saveStreamCatBtn) {
  saveStreamCatBtn.addEventListener("click", async () => {
    const name = document.getElementById("streamCatName").value.trim();
    const emoji = document.getElementById("streamCatEmoji").value.trim();
    const order = Number(document.getElementById("streamCatOrder").value) || 0;
    if (!name) return;
    await addDoc(collection(db, "streamCategories"), { name, emoji, order, createdAt: serverTimestamp() });
    document.getElementById("streamCatMsg").innerText = "✅ Category saved";
    document.getElementById("streamCatName").value = "";
    document.getElementById("streamCatEmoji").value = "";
    loadStreamCats();
  });
}

async function loadStreamCats() {
  const list = document.getElementById("streamCatList");
  const select = document.getElementById("streamVideoCatSelect");
  const filter = document.getElementById("streamVideoFilter");
  if (!list) return;

  const snap = await getDocs(query(collection(db, "streamCategories"), orderBy("order", "asc")));
  list.innerHTML = "";
  if (select) select.innerHTML = `<option value="">Category ఎంచుకోండి</option>`;
  if (filter) filter.innerHTML = `<option value="">All Videos</option>`;

  snap.forEach(d => {
    const data = d.data();
    if (select) select.innerHTML += `<option value="${d.id}">${data.emoji || ""} ${data.name}</option>`;
    if (filter) filter.innerHTML += `<option value="${d.id}">${data.emoji || ""} ${data.name}</option>`;

    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text">
          <span style="font-size:1.2rem;margin-right:6px;">${data.emoji || "🎬"}</span>
          <strong style="color:#ffd166;">${data.name}</strong>
          <span style="font-size:12px;color:rgba(255,255,255,0.4);margin-left:8px;">(Order: ${data.order || 0})</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn stream-cat-edit-btn" data-id="${d.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${d.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="streamCatEdit-${d.id}" style="display:none;">
        <input class="stce-name" value="${data.name || ""}" placeholder="Category Name">
        <input class="stce-emoji" value="${data.emoji || ""}" placeholder="Emoji (e.g. 🙏)">
        <input class="stce-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">
        <div class="general-inline-edit-actions">
          <button class="save-stce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-stce-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#streamCatEdit-${d.id}`);
    row.querySelector(".stream-cat-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-stce-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    row.querySelector(".save-stce-btn").addEventListener("click", async () => {
      const name = editBox.querySelector(".stce-name").value.trim();
      const emoji = editBox.querySelector(".stce-emoji").value.trim();
      const order = Number(editBox.querySelector(".stce-order").value) || 0;
      if (!name) {
        alert("Category name required");
        return;
      }
      await updateDoc(doc(db, "streamCategories", d.id), {
        name, emoji, order, updatedAt: serverTimestamp()
      });
      alert("✅ Category updated");
      loadStreamCats();
    });

    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete?")) return;
      await deleteDoc(doc(db, "streamCategories", d.id));
      loadStreamCats();
    });
    list.appendChild(row);
  });
}

// Stream Videos
const streamVideoThumbBox = document.getElementById("streamVideoThumbBox");
if (streamVideoThumbBox) {
  streamVideoThumbBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    streamVideoThumbBox.dataset.image = url;
    streamVideoThumbBox.innerHTML = `<img src="${url}">`;
    document.getElementById("streamVideoThumb").value = url;
  });
}

const saveStreamVideoBtn = document.getElementById("saveStreamVideoBtn");
if (saveStreamVideoBtn) {
  saveStreamVideoBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("streamVideoCatSelect").value;
    const title = document.getElementById("streamVideoTitle").value.trim();
    const description = document.getElementById("streamVideoDesc").value.trim();
    const youtubeId = document.getElementById("streamVideoYtId").value.trim();
    const thumbnail = document.getElementById("streamVideoThumb").value.trim() ||
      (streamVideoThumbBox?.dataset.image || "");
    const duration = document.getElementById("streamVideoDuration").value.trim();
    const year = document.getElementById("streamVideoYear").value.trim();
    const access = document.getElementById("streamVideoAccess").value;

    if (!title || !youtubeId || !categoryId) {
      document.getElementById("streamVideoMsg").innerText = "Title, YouTube ID and Category required";
      return;
    }

    // Get category name
    const catSnap = await getDoc(doc(db, "streamCategories", categoryId));
    const category = catSnap.exists() ? catSnap.data().name : "";

    await addDoc(collection(db, "streamVideos"), {
      categoryId, category, title, description, youtubeId,
      thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      duration, year, access, createdAt: serverTimestamp()
    });

    document.getElementById("streamVideoMsg").innerText = "✅ Video saved";
    document.getElementById("streamVideoTitle").value = "";
    document.getElementById("streamVideoDesc").value = "";
    document.getElementById("streamVideoYtId").value = "";
    document.getElementById("streamVideoThumb").value = "";
    document.getElementById("streamVideoDuration").value = "";
    document.getElementById("streamVideoYear").value = "";
    if (streamVideoThumbBox) {
      streamVideoThumbBox.dataset.image = "";
      streamVideoThumbBox.innerHTML = "<span>＋ Thumbnail Upload</span>";
    }
    loadStreamVideos();
  });
}

const streamVideoFilter = document.getElementById("streamVideoFilter");
if (streamVideoFilter) {
  streamVideoFilter.addEventListener("change", () => loadStreamVideos(streamVideoFilter.value));
}

async function loadStreamVideos(filterCatId = "") {
  const list = document.getElementById("streamVideoList");
  if (!list) return;
  list.innerHTML = "<p style='color:rgba(255,255,255,0.4)'>లోడ్ అవుతోంది...</p>";

  const snap = await getDocs(collection(db, "streamVideos"));
  list.innerHTML = "";
  const items = [];
  snap.forEach(d => {
    const data = d.data();
    if (!filterCatId || data.categoryId === filterCatId) {
      items.push({ id: d.id, ...data });
    }
  });

  if (items.length === 0) {
    list.innerHTML = "<p style='color:rgba(255,255,255,0.4);text-align:center'>Videos లేవు</p>";
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "flex-start";
    row.style.gap = "12px";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;gap:12px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <img src="${item.thumbnail}" style="width:80px;height:45px;object-fit:cover;border-radius:6px;">
          <div>
            <div style="font-weight:bold;color:#ffd166;">${item.title}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">${item.category || ""} • ${item.access === "free" ? "🟢 Free" : "⭐ Premium"} • ${item.duration || ""}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button class="stream-edit-btn cms-list-delete-btn" data-id="${item.id}" style="background:rgba(255,209,102,0.2);color:#ffd166;">Edit</button>
          <button class="stream-delete-btn cms-list-delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
      <div class="stream-edit-box" id="streamEdit-${item.id}" style="display:none;width:100%;flex-direction:column;gap:10px;">
        <input class="se-title" value="${item.title || ""}" placeholder="Title" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        <textarea class="se-desc" placeholder="Description" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${item.description || ""}</textarea>
        <input class="se-ytid" value="${item.youtubeId || ""}" placeholder="YouTube ID" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        <input class="se-thumb" value="${item.thumbnail || ""}" placeholder="Thumbnail URL" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        <select class="se-access" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(30,20,10,0.9);color:white;">
          <option value="free" ${item.access === "free" ? "selected" : ""}>Free</option>
          <option value="paid" ${item.access === "paid" ? "selected" : ""}>Paid (Premium)</option>
        </select>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="stream-save-edit-btn" data-id="${item.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
          <button class="stream-cancel-edit-btn" data-id="${item.id}" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:bold;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    row.querySelector(".stream-edit-btn").addEventListener("click", () => {
      const box = document.getElementById(`streamEdit-${item.id}`);
      box.style.display = box.style.display === "none" ? "flex" : "none";
    });

    row.querySelector(".stream-cancel-edit-btn").addEventListener("click", () => {
      document.getElementById(`streamEdit-${item.id}`).style.display = "none";
    });

    row.querySelector(".stream-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this video?")) return;
      await deleteDoc(doc(db, "streamVideos", item.id));
      loadStreamVideos(filterCatId);
    });

    row.querySelector(".stream-save-edit-btn").addEventListener("click", async () => {
      const box = document.getElementById(`streamEdit-${item.id}`);
      await updateDoc(doc(db, "streamVideos", item.id), {
        title: box.querySelector(".se-title").value.trim(),
        description: box.querySelector(".se-desc").value.trim(),
        youtubeId: box.querySelector(".se-ytid").value.trim(),
        thumbnail: box.querySelector(".se-thumb").value.trim(),
        access: box.querySelector(".se-access").value,
        updatedAt: serverTimestamp()
      });
      alert("✅ Updated");
      loadStreamVideos(filterCatId);
    });

    list.appendChild(row);
  });
}

// Subscribers list
async function loadSubscribers() {
  const list = document.getElementById("subscribersList");
  if (!list) return;

  const snap = await getDocs(collection(db, "subscribers"));
  list.innerHTML = "";

  if (snap.empty) {
    list.innerHTML = "<p style='color:rgba(255,255,255,0.4);text-align:center'>ఇంకా Subscribers లేరు</p>";
    return;
  }

  snap.forEach(d => {
    const data = d.data();
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.innerHTML = `
      <div class="cms-list-item-text">
        <div style="font-weight:bold;">${data.name || "Unknown"}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);">${data.email || ""} • ${data.plan || ""} • ₹${data.amount || 0}</div>
        <div style="font-size:12px;color:${data.active ? "#2ed573" : "#ff6b6b"};">${data.active ? "✅ Active" : "❌ Inactive"}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="sub-toggle-btn cms-list-delete-btn" data-id="${d.id}" data-active="${data.active}" style="background:rgba(255,209,102,0.2);color:#ffd166;">
          ${data.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    `;

    row.querySelector(".sub-toggle-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const isActive = btn.dataset.active === "true";
      await updateDoc(doc(db, "subscribers", btn.dataset.id), {
        active: !isActive, updatedAt: serverTimestamp()
      });
      loadSubscribers();
    });

    list.appendChild(row);
  });
}

// Init
loadStreamCats();
loadStreamVideos();
loadSubscribers();





/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => { await signOut(auth); window.location.href = "admin.html"; });
}

/* ══════════════════════════════════════
   POOJA MANDIR CMS
══════════════════════════════════════ */

const poojaGodImageBox = document.getElementById("poojaGodImageBox");
if (poojaGodImageBox) {
  poojaGodImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    poojaGodImageBox.dataset.image = url;
    poojaGodImageBox.innerHTML = `<img src="${url}">`;
  });
}

const savePoojaGodBtn = document.getElementById("savePoojaGodBtn");
if (savePoojaGodBtn) {
  savePoojaGodBtn.addEventListener("click", async () => {
    const name = document.getElementById("poojaGodName").value.trim();
    const emoji = document.getElementById("poojaGodEmoji").value.trim();
    const order = Number(document.getElementById("poojaGodOrder").value) || 0;
    const image = poojaGodImageBox?.dataset.image || "";
    if (!name) { document.getElementById("poojaGodMsg").innerText = "దేవుడి పేరు required"; return; }
    await addDoc(collection(db, "poojaGods"), { name, emoji, image, order, createdAt: serverTimestamp() });
    document.getElementById("poojaGodMsg").innerText = "✅ దేవుడు saved";
    document.getElementById("poojaGodName").value = "";
    document.getElementById("poojaGodEmoji").value = "";
    document.getElementById("poojaGodOrder").value = "";
    if (poojaGodImageBox) { poojaGodImageBox.dataset.image = ""; poojaGodImageBox.innerHTML = "<span>＋ దేవుడి ఫోటో</span>"; }
    loadPoojaGods();
  });
}

async function loadPoojaGods() {
  const list = document.getElementById("poojaGodsList");
  const ritualSelect = document.getElementById("poojaRitualGodSelect");
  const filterSelect = document.getElementById("poojaRitualFilterGod");
  if (!list) return;

  const snap = await getDocs(query(collection(db, "poojaGods"), orderBy("order", "asc")));
  list.innerHTML = "";
  if (ritualSelect) ritualSelect.innerHTML = `<option value="">దేవుడిని ఎంచుకోండి</option>`;
  if (filterSelect) filterSelect.innerHTML = `<option value="">Filter by God</option>`;

  snap.forEach(d => {
    const data = d.data();
    if (ritualSelect) ritualSelect.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    if (filterSelect) filterSelect.innerHTML += `<option value="${d.id}">${data.name}</option>`;

    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
        <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
          ${data.image ? `<img src="${data.image}" style="width:50px;height:50px;object-fit:cover;border-radius:50%;border:1px solid rgba(255,209,102,0.4);">` : `<span style="font-size:2rem;">${data.emoji || "🛕"}</span>`}
          <span style="color:#ffd166;font-weight:bold;">${data.name}</span>
          <span style="font-size:12px;color:rgba(255,255,255,0.4);margin-left:8px;">(Order: ${data.order || 0})</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="cms-list-edit-btn pooja-god-edit-btn" data-id="${d.id}" type="button">✏️ Edit</button>
          <button class="cms-list-delete-btn" data-id="${d.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="general-inline-edit-box" id="poojaGodEdit-${d.id}" style="display:none;">
        <input class="pge-name" value="${data.name || ""}" placeholder="దేవుడి పేరు (Name)">
        <input class="pge-emoji" value="${data.emoji || ""}" placeholder="Emoji (e.g. 🐘)">
        <input class="pge-order" type="number" value="${data.order ?? ""}" placeholder="Order (1, 2, 3...)">
        <div class="festival-card-upload-box pge-image-slot" data-image="${data.image || ""}">
          ${data.image ? `<img src="${data.image}" style="max-height:120px;">` : `<span>＋ దేవుడి ఫోటో</span>`}
        </div>
        <div class="general-inline-edit-actions">
          <button class="save-pge-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
          <button class="cancel-pge-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
        </div>
      </div>
    `;

    const editBox = row.querySelector(`#poojaGodEdit-${d.id}`);
    const imgSlot = row.querySelector(".pge-image-slot");

    row.querySelector(".pooja-god-edit-btn").addEventListener("click", () => {
      editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
    });
    row.querySelector(".cancel-pge-btn").addEventListener("click", () => {
      editBox.style.display = "none";
    });
    imgSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imgSlot.dataset.image = url;
      imgSlot.innerHTML = `<img src="${url}" style="max-height:120px;">`;
    });
    row.querySelector(".save-pge-btn").addEventListener("click", async () => {
      const name = editBox.querySelector(".pge-name").value.trim();
      const emoji = editBox.querySelector(".pge-emoji").value.trim();
      const order = Number(editBox.querySelector(".pge-order").value) || 0;
      const image = imgSlot.dataset.image || "";
      if (!name) {
        alert("Name is required");
        return;
      }
      await updateDoc(doc(db, "poojaGods", d.id), {
        name, emoji, order, image, updatedAt: serverTimestamp()
      });
      alert("✅ దేవుడు updated");
      loadPoojaGods();
    });

    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this god?")) return;
      await deleteDoc(doc(db, "poojaGods", d.id));
      loadPoojaGods();
    });
    list.appendChild(row);
  });
}

const poojaRitualAudioBox = document.getElementById("poojaRitualAudioBox");
if (poojaRitualAudioBox) {
  poojaRitualAudioBox.addEventListener("click", async () => {
    const url = await uploadAudioFile(poojaRitualAudioBox);
    if (!url) return;
    poojaRitualAudioBox.dataset.audio = url;
    poojaRitualAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:36px;"></audio><div style="font-size:12px;color:#ffd166;margin-top:4px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
    const input = document.getElementById("poojaRitualAudio");
    if (input) input.value = url;
  });
}

const savePoojaRitualBtn = document.getElementById("savePoojaRitualBtn");
if (savePoojaRitualBtn) {
  savePoojaRitualBtn.addEventListener("click", async () => {
    const godId = document.getElementById("poojaRitualGodSelect").value;
    const name = document.getElementById("poojaRitualName").value.trim();
    const emoji = document.getElementById("poojaRitualEmoji").value.trim();
    const mantraText = document.getElementById("poojaRitualMantra").value.trim();
    const audioUrl = document.getElementById("poojaRitualAudio")?.value.trim() || poojaRitualAudioBox?.dataset.audio || "";
    const animationType = document.getElementById("poojaRitualAnimation").value;
    const order = Number(document.getElementById("poojaRitualOrder").value) || 0;

    if (!godId || !name) {
      document.getElementById("poojaRitualMsg").innerText = "God and ritual name required";
      return;
    }

    await addDoc(collection(db, "poojaGods", godId, "rituals"), {
      name, emoji, mantraText, audioUrl, animationType, order, createdAt: serverTimestamp()
    });

    document.getElementById("poojaRitualMsg").innerText = "✅ విధి saved";
    document.getElementById("poojaRitualName").value = "";
    document.getElementById("poojaRitualEmoji").value = "";
    document.getElementById("poojaRitualMantra").value = "";
    const audioInput = document.getElementById("poojaRitualAudio");
    if (audioInput) audioInput.value = "";
    if (poojaRitualAudioBox) {
      poojaRitualAudioBox.dataset.audio = "";
      poojaRitualAudioBox.innerHTML = `<span>＋ Pooja Mantra Audio అప్‌లోడ్ చేయండి (Upload MP3)</span>`;
    }
    document.getElementById("poojaRitualOrder").value = "";
    loadPoojaRituals();
  });
}

const poojaRitualFilterGod = document.getElementById("poojaRitualFilterGod");
if (poojaRitualFilterGod) {
  poojaRitualFilterGod.addEventListener("change", () => loadPoojaRituals(poojaRitualFilterGod.value));
}

async function loadPoojaRituals(filterGodId = "") {
  const list = document.getElementById("poojaRitualsList");
  if (!list) return;

  list.innerHTML = "<p style='color:rgba(255,255,255,0.5)'>లోడ్ అవుతోంది...</p>";

  const godSnap = await getDocs(query(collection(db, "poojaGods"), orderBy("order", "asc")));
  const gods = [];
  godSnap.forEach(d => gods.push({ id: d.id, ...d.data() }));

  const filtered = filterGodId ? gods.filter(g => g.id === filterGodId) : gods;

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = "<p style='color:rgba(255,255,255,0.5);text-align:center'>విధులు లేవు</p>";
    return;
  }

  for (const god of filtered) {
    const ritualSnap = await getDocs(
      query(collection(db, "poojaGods", god.id, "rituals"), orderBy("order", "asc"))
    );

    const rituals = [];
    ritualSnap.forEach(d => rituals.push({ id: d.id, ...d.data() }));

    if (rituals.length === 0 && filterGodId) {
      list.innerHTML += `<p style='color:rgba(255,255,255,0.5);text-align:center'>${god.name} కు విధులు లేవు</p>`;
      continue;
    }

    if (rituals.length === 0) continue;

    const section = document.createElement("div");
    section.style.marginBottom = "20px";
    section.innerHTML = `<h3 style="color:#ffd166;margin-bottom:12px;">${god.emoji || "🛕"} ${god.name}</h3>`;

    rituals.forEach(ritual => {
      const row = document.createElement("div");
      row.className = "cms-list-item";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";
      row.style.gap = "10px";

      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:8px;">
          <span>${ritual.emoji || "🙏"} <strong style="color:#ffd166;">${ritual.name}</strong></span>
          <div style="display:flex;gap:8px;">
            <button class="pooja-edit-btn cms-list-edit-btn" data-godid="${god.id}" data-id="${ritual.id}" type="button">✏️ Edit</button>
            <button class="pooja-delete-btn cms-list-delete-btn" data-godid="${god.id}" data-id="${ritual.id}" type="button">Delete</button>
          </div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);">${ritual.mantraText ? ritual.mantraText.substring(0, 70) + "..." : "No mantra"}</div>

        <!-- RITUAL AUDIO CONTROLS -->
        <div class="content-audio-card-box" style="margin:4px 0 6px;">
          ${ritual.audioUrl ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:220px;">
                <span>🎵</span>
                <audio src="${ritual.audioUrl}" controls style="height:32px;flex:1;"></audio>
              </div>
              <div style="display:flex;gap:6px;">
                <button class="pooja-quick-change-audio" data-godid="${god.id}" data-id="${ritual.id}" type="button" style="padding:4px 10px;font-size:0.8rem;border-radius:8px;background:rgba(255,209,102,0.2);color:#ffd166;border:1px solid #ffd166;cursor:pointer;">🔄 మార్చండి</button>
                <button class="pooja-quick-remove-audio" data-godid="${god.id}" data-id="${ritual.id}" type="button" style="padding:4px 8px;font-size:0.8rem;border-radius:8px;background:rgba(255,100,100,0.15);color:#ff6b6b;border:1px solid rgba(255,100,100,0.3);cursor:pointer;">❌</button>
              </div>
            </div>
          ` : `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <span style="font-size:0.82rem;color:rgba(255,255,255,0.5);">ఆడియో జతచేయబడలేదు</span>
              <button class="pooja-quick-add-audio" data-godid="${god.id}" data-id="${ritual.id}" type="button" style="padding:5px 12px;font-size:0.82rem;border-radius:8px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">
                🎵 ＋ Audio జోడించండి
              </button>
            </div>
          `}
        </div>

        <div class="pooja-edit-box" id="poojaEdit-${ritual.id}" style="display:none;width:100%;flex-direction:column;gap:10px;">
          <input class="p-edit-name" value="${ritual.name || ""}" placeholder="Name" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <input class="p-edit-emoji" value="${ritual.emoji || ""}" placeholder="Emoji" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <textarea class="p-edit-mantra" placeholder="Mantra Text" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${ritual.mantraText || ""}</textarea>
          
          <div style="background:rgba(255,209,102,0.06);border:1px solid rgba(255,209,102,0.25);border-radius:10px;padding:10px;margin:2px 0;">
            <label style="color:#ffd166;font-weight:700;display:block;margin-bottom:6px;font-size:0.88rem;">🎵 మంత్రం ఆడియో (Audio):</label>
            <div class="cms-audio-upload-box p-edit-audio-box" data-audio="${ritual.audioUrl || ""}" style="cursor:pointer;margin-bottom:6px;">
              ${ritual.audioUrl ? `<audio src="${ritual.audioUrl}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">🔄 వేరొక ఆడియో ఫైల్ మార్చడానికి క్లిక్ చేయండి</div>` : `<span>＋ Audio File అప్‌లోడ్ చేయండి (Upload MP3)</span>`}
            </div>
            <input class="p-edit-audio" value="${ritual.audioUrl || ""}" placeholder="లేదా Audio URL ఇవ్వండి" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          </div>

          <div style="display:flex;gap:8px;margin-top:6px;">
            <button class="pooja-save-edit-btn" data-godid="${god.id}" data-id="${ritual.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
            <button class="pooja-cancel-edit-btn" data-id="${ritual.id}" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:bold;cursor:pointer;">రద్దు (Cancel)</button>
          </div>
        </div>
      `;

      const editBox = row.querySelector(`#poojaEdit-${ritual.id}`);
      const audioBox = editBox.querySelector(".p-edit-audio-box");
      const audioInput = editBox.querySelector(".p-edit-audio");

      if (audioBox) {
        audioBox.addEventListener("click", async () => {
          const url = await uploadAudioFile(audioBox);
          if (!url) return;
          audioBox.dataset.audio = url;
          audioBox.innerHTML = `<audio src="${url}" controls style="width:100%;height:32px;"></audio><div style="font-size:11px;color:#ffd166;margin-top:2px;">✅ Audio uploaded! మార్చడానికి మళ్లీ క్లిక్ చేయండి</div>`;
          if (audioInput) audioInput.value = url;
        });
      }

      row.querySelector(".pooja-edit-btn").addEventListener("click", () => {
        editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
      });

      row.querySelector(".pooja-cancel-edit-btn").addEventListener("click", () => {
        editBox.style.display = "none";
      });

      const quickAddBtn = row.querySelector(".pooja-quick-add-audio");
      if (quickAddBtn) {
        quickAddBtn.addEventListener("click", async () => {
          const url = await uploadAudioFile(quickAddBtn);
          if (!url) return;
          await updateDoc(doc(db, "poojaGods", god.id, "rituals", ritual.id), { audioUrl: url, updatedAt: serverTimestamp() });
          alert("✅ ఆడియో విజయవంతంగా జోడించబడింది");
          loadPoojaRituals(filterGodId);
        });
      }

      const quickChangeBtn = row.querySelector(".pooja-quick-change-audio");
      if (quickChangeBtn) {
        quickChangeBtn.addEventListener("click", async () => {
          const url = await uploadAudioFile(quickChangeBtn);
          if (!url) return;
          await updateDoc(doc(db, "poojaGods", god.id, "rituals", ritual.id), { audioUrl: url, updatedAt: serverTimestamp() });
          alert("✅ ఆడియో అప్‌డేట్ చేయబడింది");
          loadPoojaRituals(filterGodId);
        });
      }

      const quickRemoveBtn = row.querySelector(".pooja-quick-remove-audio");
      if (quickRemoveBtn) {
        quickRemoveBtn.addEventListener("click", async () => {
          if (!confirm("ఈ విధి నుండి ఆడియోను తొలగించాలనుకుంటున్నారా?")) return;
          await updateDoc(doc(db, "poojaGods", god.id, "rituals", ritual.id), { audioUrl: "", updatedAt: serverTimestamp() });
          alert("✅ ఆడియో తొలగించబడింది");
          loadPoojaRituals(filterGodId);
        });
      }

      row.querySelector(".pooja-delete-btn").addEventListener("click", async (e) => {
        if (!confirm("Delete this ritual?")) return;
        const btn = e.currentTarget;
        await deleteDoc(doc(db, "poojaGods", btn.dataset.godid, "rituals", btn.dataset.id));
        loadPoojaRituals(filterGodId);
      });

      row.querySelector(".pooja-save-edit-btn").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const finalAudio = audioInput ? audioInput.value.trim() : (audioBox?.dataset?.audio || "");
        await updateDoc(doc(db, "poojaGods", btn.dataset.godid, "rituals", btn.dataset.id), {
          name: editBox.querySelector(".p-edit-name").value.trim(),
          emoji: editBox.querySelector(".p-edit-emoji").value.trim(),
          mantraText: editBox.querySelector(".p-edit-mantra").value.trim(),
          audioUrl: finalAudio,
          updatedAt: serverTimestamp()
        });
        alert("✅ Updated");
        loadPoojaRituals(filterGodId);
      });

      section.appendChild(row);
    });

    list.appendChild(section);
  }
}

// Add pooja backgrounds to background manager in dashboard.html too
// Keys: poojaMandir Pc, poojaMandir Mobile, poojaRoomPc, poojaRoomMobile

loadPoojaGods();
loadPoojaRituals();

/* ══════════════════════════════════════
   🛍️ STORE CMS (విక్రయశాల)
══════════════════════════════════════ */

// 1. STORE CATEGORIES
const saveStoreCatBtn = document.getElementById("saveStoreCatBtn");
if (saveStoreCatBtn) {
  saveStoreCatBtn.addEventListener("click", async () => {
    const name = document.getElementById("storeCatName").value.trim();
    const emoji = document.getElementById("storeCatEmoji").value.trim();
    const order = Number(document.getElementById("storeCatOrder").value) || 0;
    const msg = document.getElementById("storeCatMsg");

    if (!name) {
      if (msg) { msg.style.color = "#ff6b6b"; msg.innerText = "⚠️ దయచేసి విభాగం పేరును నమోదు చేయండి."; }
      return;
    }

    try {
      if (msg) { msg.style.color = "#ffd166"; msg.innerText = "సేవ్ అవుతోంది..."; }
      await addDoc(collection(db, "storeCategories"), {
        name,
        emoji: emoji || "🛍️",
        order,
        createdAt: serverTimestamp()
      });
      if (msg) { msg.style.color = "#2ed573"; msg.innerText = "✅ విభాగం విజయవంతంగా సేవ్ చేయబడింది!"; }
      document.getElementById("storeCatName").value = "";
      document.getElementById("storeCatEmoji").value = "";
      document.getElementById("storeCatOrder").value = "";
      await loadStoreCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      if (msg) { msg.style.color = "#ff6b6b"; msg.innerText = "❌ ఎర్రర్: " + err.message; }
    }
  });
}

let cachedCategories = [];

async function loadStoreCategories() {
  const list = document.getElementById("storeCatList");
  const prodCatSelect = document.getElementById("storeProductCatSelect");
  const filterSelect = document.getElementById("storeProductFilter");

  if (!list && !prodCatSelect) return;

  try {
    const snap = await getDocs(query(collection(db, "storeCategories"), orderBy("order", "asc")));
    cachedCategories = [];
    snap.forEach(d => cachedCategories.push({ id: d.id, ...d.data() }));

    // Update Product Form Select
    if (prodCatSelect) {
      const curVal = prodCatSelect.value;
      prodCatSelect.innerHTML = `<option value="">విభాగం ఎంచుకోండి (Select Category)</option>`;
      cachedCategories.forEach(cat => {
        prodCatSelect.innerHTML += `<option value="${cat.id}">${cat.emoji || ""} ${cat.name}</option>`;
      });
      if (curVal) prodCatSelect.value = curVal;
    }

    // Update Filter Select
    if (filterSelect) {
      const curFilter = filterSelect.value;
      filterSelect.innerHTML = `<option value="">అన్ని విభాగాలు (All Products)</option>`;
      cachedCategories.forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat.id}">${cat.emoji || ""} ${cat.name}</option>`;
      });
      if (curFilter) filterSelect.value = curFilter;
    }

    // Update Categories List in Admin
    if (list) {
      if (cachedCategories.length === 0) {
        list.innerHTML = `<p style="color:rgba(255,255,255,0.5);text-align:center;padding:12px;">ఇంకా విభాగాలు జోడించబడలేదు.</p>`;
      } else {
        list.innerHTML = "";
        cachedCategories.forEach(cat => {
          const row = document.createElement("div");
          row.className = "cms-list-item";
          row.style.flexDirection = "column";
          row.style.alignItems = "stretch";
          row.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
              <div class="cms-list-item-text">
                <span style="font-size:1.2rem;margin-right:6px;">${cat.emoji || "🛍️"}</span>
                <strong style="color:#ffd166;">${cat.name}</strong>
                <span style="font-size:12px;color:rgba(255,255,255,0.4);margin-left:8px;">(క్రమం: ${cat.order || 0})</span>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="cms-list-edit-btn store-cat-edit-btn" data-id="${cat.id}" type="button">✏️ Edit</button>
                <button class="cms-list-delete-btn" data-id="${cat.id}" type="button">Delete</button>
              </div>
            </div>
            <div class="general-inline-edit-box" id="storeCatEdit-${cat.id}" style="display:none;">
              <input class="stc-name" value="${cat.name || ""}" placeholder="Category Name">
              <input class="stc-emoji" value="${cat.emoji || ""}" placeholder="Emoji (e.g. 🛍️)">
              <input class="stc-order" type="number" value="${cat.order ?? ""}" placeholder="Order (1, 2, 3...)">
              <div class="general-inline-edit-actions">
                <button class="save-stc-btn" type="button" style="padding:10px 18px;border-radius:12px;background:#ffd166;color:#1a0c02;border:none;font-weight:700;cursor:pointer;">Save Changes</button>
                <button class="cancel-stc-btn" type="button" style="padding:10px 18px;border-radius:12px;background:rgba(255,255,255,0.15);color:#fff;border:none;font-weight:700;cursor:pointer;">రద్దు (Cancel)</button>
              </div>
            </div>
          `;

          const editBox = row.querySelector(`#storeCatEdit-${cat.id}`);
          row.querySelector(".store-cat-edit-btn").addEventListener("click", () => {
            editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
          });
          row.querySelector(".cancel-stc-btn").addEventListener("click", () => {
            editBox.style.display = "none";
          });
          row.querySelector(".save-stc-btn").addEventListener("click", async () => {
            const name = editBox.querySelector(".stc-name").value.trim();
            const emoji = editBox.querySelector(".stc-emoji").value.trim();
            const order = Number(editBox.querySelector(".stc-order").value) || 0;
            if (!name) {
              alert("Category name required");
              return;
            }
            await updateDoc(doc(db, "storeCategories", cat.id), {
              name, emoji: emoji || "🛍️", order, updatedAt: serverTimestamp()
            });
            alert("✅ Category updated");
            await loadStoreCategories();
            await loadStoreProducts();
          });

          row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
            if (!confirm(`'${cat.name}' విభాగాన్ని తొలగించాలనుకుంటున్నారా?`)) return;
            try {
              await deleteDoc(doc(db, "storeCategories", cat.id));
              await loadStoreCategories();
              await loadStoreProducts();
            } catch (e) {
              alert("Error deleting category: " + e.message);
            }
          });
          list.appendChild(row);
        });
      }
    }
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

// 2. PRODUCT IMAGE UPLOAD
const storeProductImageBox = document.getElementById("storeProductImageBox");
if (storeProductImageBox) {
  storeProductImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    storeProductImageBox.dataset.image = url;
    storeProductImageBox.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
    const urlInput = document.getElementById("storeProductImageUrl");
    if (urlInput) urlInput.value = url;
  });
}

// 3. PRODUCT SAVE
const saveStoreProductBtn = document.getElementById("saveStoreProductBtn");
if (saveStoreProductBtn) {
  saveStoreProductBtn.addEventListener("click", async () => {
    const catSelect = document.getElementById("storeProductCatSelect");
    const categoryId = catSelect ? catSelect.value : "";
    const name = document.getElementById("storeProductName").value.trim();
    const price = Number(document.getElementById("storeProductPrice").value) || 0;
    const origPriceVal = document.getElementById("storeProductOriginalPrice").value.trim();
    const originalPrice = origPriceVal ? Number(origPriceVal) : null;
    const badge = document.getElementById("storeProductBadge").value.trim();
    const description = document.getElementById("storeProductDesc").value.trim();
    const imgUrlInput = document.getElementById("storeProductImageUrl");
    const imageUrl = imgUrlInput?.value.trim() || storeProductImageBox?.dataset.image || "";
    const inStock = document.getElementById("storeProductInStock")?.checked ?? true;
    const isFeatured = document.getElementById("storeProductIsFeatured")?.checked ?? false;
    const whatsapp = document.getElementById("storeProductWhatsapp")?.value.trim() || "919493226037";
    const msg = document.getElementById("storeProductMsg");

    if (!name || price <= 0) {
      if (msg) {
        msg.style.color = "#ff6b6b";
        msg.innerText = "⚠️ దయచేసి ఉత్పత్తి పేరు మరియు సరైన ధరను నమోదు చేయండి.";
      }
      return;
    }

    const matchedCat = cachedCategories.find(c => c.id === categoryId);
    const categoryName = matchedCat ? matchedCat.name : "సాధారణం";

    try {
      if (msg) { msg.style.color = "#ffd166"; msg.innerText = "ఉత్పత్తి సేవ్ అవుతోంది..."; }

      const newDocRef = await addDoc(collection(db, "storeProducts"), {
        name,
        categoryId: categoryId || "general",
        categoryName,
        price,
        originalPrice: originalPrice || null,
        badge: badge || "",
        description: description || "",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=500&auto=format&fit=crop&q=60",
        inStock: !!inStock,
        isFeatured: !!isFeatured,
        whatsappNumber: whatsapp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // If featured, set as the main featured item
      if (isFeatured) {
        await setDoc(doc(db, "storeSettings", "main"), {
          featuredProductId: newDocRef.id,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      if (msg) { msg.style.color = "#2ed573"; msg.innerText = "✅ ఉత్పత్తి విజయవంతంగా సేవ్ చేయబడింది!"; }

      // Reset form
      document.getElementById("storeProductName").value = "";
      document.getElementById("storeProductPrice").value = "";
      document.getElementById("storeProductOriginalPrice").value = "";
      document.getElementById("storeProductBadge").value = "";
      document.getElementById("storeProductDesc").value = "";
      if (imgUrlInput) imgUrlInput.value = "";
      if (storeProductImageBox) {
        storeProductImageBox.dataset.image = "";
        storeProductImageBox.innerHTML = `<span>＋ ఉత్పత్తి ఫోటో అప్‌లోడ్ (Upload Product Photo)</span>`;
      }
      if (document.getElementById("storeProductIsFeatured")) {
        document.getElementById("storeProductIsFeatured").checked = false;
      }

      await loadStoreProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      if (msg) { msg.style.color = "#ff6b6b"; msg.innerText = "❌ ఎర్రర్: " + err.message; }
    }
  });
}

// 4. FEATURED PRODUCT SELECTOR BUTTON
const setFeaturedBtn = document.getElementById("setFeaturedBtn");
if (setFeaturedBtn) {
  setFeaturedBtn.addEventListener("click", async () => {
    const select = document.getElementById("storeFeaturedSelect");
    const productId = select ? select.value : "";
    const msg = document.getElementById("storeFeaturedMsg");

    if (!productId) {
      if (msg) { msg.style.color = "#ff6b6b"; msg.innerText = "⚠️ దయచేసి ఒక ఉత్పత్తిని ఎంచుకోండి."; }
      return;
    }

    try {
      if (msg) { msg.style.color = "#ffd166"; msg.innerText = "సెట్ అవుతోంది..."; }
      await setFeaturedProduct(productId);
      if (msg) { msg.style.color = "#2ed573"; msg.innerText = "✅ ప్రధాన ఉత్పత్తిగా సెట్ చేయబడింది!"; }
      await loadStoreProducts();
    } catch (err) {
      console.error("Error setting featured:", err);
      if (msg) { msg.style.color = "#ff6b6b"; msg.innerText = "❌ ఎర్రర్: " + err.message; }
    }
  });
}

async function setFeaturedProduct(productId) {
  await setDoc(doc(db, "storeSettings", "main"), {
    featuredProductId: productId,
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Update products collection so that isFeatured is synchronized
  try {
    const snap = await getDocs(collection(db, "storeProducts"));
    const updates = [];
    snap.forEach(d => {
      const isThis = (d.id === productId);
      if (d.data().isFeatured !== isThis) {
        updates.push(updateDoc(doc(db, "storeProducts", d.id), { isFeatured: isThis }));
      }
    });
    await Promise.all(updates);
  } catch (e) {
    console.warn("Could not sync isFeatured flags across products:", e);
  }
}

// 5. FILTER PRODUCTS
const storeProductFilter = document.getElementById("storeProductFilter");
if (storeProductFilter) {
  storeProductFilter.addEventListener("change", () => {
    loadStoreProducts(storeProductFilter.value);
  });
}

// 6. LOAD PRODUCTS & POPULATE INVENTORY
async function loadStoreProducts(filterCatId = "") {
  const list = document.getElementById("storeProductList");
  const featuredSelect = document.getElementById("storeFeaturedSelect");
  const currentFeaturedBox = document.getElementById("currentFeaturedBox");
  const currentFeaturedText = document.getElementById("currentFeaturedText");
  const currentFeaturedThumb = document.getElementById("currentFeaturedThumb");

  if (!list) return;
  list.innerHTML = `<p style="color:rgba(255,255,255,0.4);text-align:center;padding:12px;">ఉత్పత్తులు లోడ్ అవుతున్నాయి...</p>`;

  try {
    // Get currently featured ID from settings
    let featuredId = null;
    try {
      const settingsSnap = await getDoc(doc(db, "storeSettings", "main"));
      if (settingsSnap.exists()) {
        featuredId = settingsSnap.data().featuredProductId;
      }
    } catch (e) {
      console.warn("Could not fetch storeSettings:", e);
    }

    const snap = await getDocs(collection(db, "storeProducts"));
    const allProducts = [];
    snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));

    // Fallback featured if not explicitly set
    if (!featuredId && allProducts.length > 0) {
      const explicitlyFeatured = allProducts.find(p => p.isFeatured);
      featuredId = explicitlyFeatured ? explicitlyFeatured.id : allProducts[0].id;
    }

    // Populate Featured Select dropdown
    if (featuredSelect) {
      featuredSelect.innerHTML = `<option value="">ఉత్పత్తిని ఎంచుకోండి...</option>`;
      allProducts.forEach(p => {
        const isCur = (p.id === featuredId);
        featuredSelect.innerHTML += `<option value="${p.id}" ${isCur ? "selected" : ""}>${p.name} (₹${p.price}) ${isCur ? "★ [Current Featured]" : ""}</option>`;
      });
    }

    // Update Featured Hero preview in admin
    const featuredProduct = allProducts.find(p => p.id === featuredId);
    if (featuredProduct && currentFeaturedText) {
      currentFeaturedText.innerHTML = `
        <strong style="font-size:1.1rem;color:#ffd166;">${featuredProduct.name}</strong>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.8);margin-top:2px;">
          విభాగం: ${featuredProduct.categoryName || "సాధారణం"} • ధర: ₹${featuredProduct.price} • ${featuredProduct.inStock ? "🟢 In Stock" : "🔴 Out of Stock"}
        </div>
      `;
      if (currentFeaturedThumb) {
        currentFeaturedThumb.innerHTML = `<img src="${featuredProduct.imageUrl}" style="width:100%;height:100%;object-fit:cover;">`;
      }
    } else if (currentFeaturedText) {
      currentFeaturedText.innerText = "ప్రస్తుతం ప్రధాన ఉత్పత్తి సెట్ చేయబడలేదు. క్రింది డ్రాప్‌డౌన్ నుండి ఎంచుకోండి.";
      if (currentFeaturedThumb) currentFeaturedThumb.innerHTML = "★";
    }

    // Filter products for the list
    const filteredProducts = filterCatId
      ? allProducts.filter(p => p.categoryId === filterCatId)
      : allProducts;

    list.innerHTML = "";
    if (filteredProducts.length === 0) {
      list.innerHTML = `<p style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">ఈ విభాగంలో ఉత్పత్తులు లేవు.</p>`;
      return;
    }

    filteredProducts.forEach(item => {
      const isCurFeatured = (item.id === featuredId || item.isFeatured);
      const row = document.createElement("div");
      row.className = "cms-list-item";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";
      row.style.gap = "12px";
      row.style.border = isCurFeatured ? "1px solid rgba(255,209,102,0.6)" : "1px solid rgba(255,209,102,0.15)";
      row.style.background = isCurFeatured ? "rgba(255,209,102,0.06)" : "rgba(255,255,255,0.03)";

      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
          <div style="display:flex;gap:14px;align-items:center;min-width:240px;flex:1;">
            <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=500&auto=format&fit=crop&q=60'}" 
                 style="width:70px;height:70px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,209,102,0.3);flex-shrink:0;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <strong style="color:#ffd166;font-size:1.05rem;">${item.name}</strong>
                ${isCurFeatured ? '<span style="background:#ffd166;color:#120703;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:bold;">★ FEATURED</span>' : ''}
                ${item.badge ? `<span style="background:rgba(255,209,102,0.2);color:#ffd166;padding:2px 8px;border-radius:12px;font-size:0.75rem;">${item.badge}</span>` : ''}
              </div>
              <div style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin-top:4px;">
                విభాగం: <span style="color:#EDE3C8;">${item.categoryName || 'సాధారణం'}</span> • 
                ధర: <strong style="color:#ffd166;">₹${item.price}</strong> ${item.originalPrice ? `<span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:0.8rem;">₹${item.originalPrice}</span>` : ''} • 
                <span style="color:${item.inStock ? '#2ed573' : '#ff6b6b'};font-weight:600;">${item.inStock ? '🟢 In Stock' : '🔴 Out of Stock'}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            ${!isCurFeatured ? `<button class="store-make-featured-btn cms-list-delete-btn" data-id="${item.id}" style="background:rgba(255,209,102,0.25);color:#ffd166;border:1px solid #ffd166;">★ Make Featured</button>` : `<span style="color:#ffd166;font-size:0.85rem;padding:6px 10px;background:rgba(255,209,102,0.15);border-radius:8px;">★ Currently Featured</span>`}
            <button class="store-edit-btn cms-list-delete-btn" data-id="${item.id}" style="background:rgba(255,255,255,0.1);color:#fff;">Edit</button>
            <button class="store-delete-btn cms-list-delete-btn" data-id="${item.id}" style="background:rgba(255,107,107,0.2);color:#ff6b6b;">Delete</button>
          </div>
        </div>

        <!-- Inline Edit Box -->
        <div class="store-edit-box" id="storeEditBox-${item.id}" style="display:none;width:100%;flex-direction:column;gap:10px;padding-top:10px;border-top:1px dashed rgba(255,209,102,0.2);">
          <input class="se-name" value="${item.name || ''}" placeholder="Product Title" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <div style="display:flex;gap:10px;">
            <input class="se-price" type="number" value="${item.price || ''}" placeholder="Price (₹)" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
            <input class="se-origprice" type="number" value="${item.originalPrice || ''}" placeholder="Original Price (₹)" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          </div>
          <input class="se-badge" value="${item.badge || ''}" placeholder="Badge (ఉదా: బెస్ట్ సెల్లర్)" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <textarea class="se-desc" placeholder="Description" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:70px;">${item.description || ''}</textarea>
          <input class="se-image" value="${item.imageUrl || ''}" placeholder="Image URL" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <label style="display:flex;align-items:center;gap:8px;color:#EDE3C8;cursor:pointer;">
            <input class="se-instock" type="checkbox" ${item.inStock ? 'checked' : ''} style="width:18px;height:18px;">
            అందుబాటులో ఉంది (In Stock)
          </label>
          <div style="display:flex;gap:10px;">
            <button class="store-save-edit-btn" data-id="${item.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
            <button class="store-cancel-edit-btn" data-id="${item.id}" style="padding:10px 16px;border-radius:12px;background:rgba(255,255,255,0.1);color:#fff;border:none;cursor:pointer;">Cancel</button>
          </div>
        </div>
      `;

      // Event Listeners for Row Actions
      const makeFeatBtn = row.querySelector(".store-make-featured-btn");
      if (makeFeatBtn) {
        makeFeatBtn.addEventListener("click", async () => {
          await setFeaturedProduct(item.id);
          alert(`✅ '${item.name}' ప్రధాన విశిష్ట ఉత్పత్తిగా సెట్ చేయబడింది!`);
          await loadStoreProducts(filterCatId);
        });
      }

      const editBtn = row.querySelector(".store-edit-btn");
      const editBox = row.querySelector(`#storeEditBox-${item.id}`);
      const cancelBtn = row.querySelector(".store-cancel-edit-btn");
      if (editBtn && editBox) {
        editBtn.addEventListener("click", () => {
          editBox.style.display = editBox.style.display === "none" ? "flex" : "none";
        });
      }
      if (cancelBtn && editBox) {
        cancelBtn.addEventListener("click", () => {
          editBox.style.display = "none";
        });
      }

      const saveEditBtn = row.querySelector(".store-save-edit-btn");
      if (saveEditBtn && editBox) {
        saveEditBtn.addEventListener("click", async () => {
          const newName = editBox.querySelector(".se-name").value.trim();
          const newPrice = Number(editBox.querySelector(".se-price").value) || 0;
          const newOrigPrice = Number(editBox.querySelector(".se-origprice").value) || null;
          const newBadge = editBox.querySelector(".se-badge").value.trim();
          const newDesc = editBox.querySelector(".se-desc").value.trim();
          const newImage = editBox.querySelector(".se-image").value.trim();
          const newInStock = editBox.querySelector(".se-instock").checked;

          if (!newName || newPrice <= 0) {
            alert("దయచేసి పేరు మరియు సరైన ధరను నమోదు చేయండి.");
            return;
          }

          try {
            saveEditBtn.innerText = "Updating...";
            await updateDoc(doc(db, "storeProducts", item.id), {
              name: newName,
              price: newPrice,
              originalPrice: newOrigPrice,
              badge: newBadge,
              description: newDesc,
              imageUrl: newImage,
              inStock: newInStock,
              updatedAt: serverTimestamp()
            });
            alert("✅ ఉత్పత్తి వివరాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!");
            await loadStoreProducts(filterCatId);
          } catch (err) {
            alert("Error updating product: " + err.message);
            saveEditBtn.innerText = "Save Changes";
          }
        });
      }

      const delBtn = row.querySelector(".store-delete-btn");
      if (delBtn) {
        delBtn.addEventListener("click", async () => {
          if (!confirm(`'${item.name}' ఉత్పత్తిని నిజంగా తొలగించాలనుకుంటున్నారా?`)) return;
          try {
            await deleteDoc(doc(db, "storeProducts", item.id));
            await loadStoreProducts(filterCatId);
          } catch (err) {
            alert("Error deleting: " + err.message);
          }
        });
      }

      list.appendChild(row);
    });

  } catch (err) {
    console.error("Error loading products:", err);
    list.innerHTML = `<p style="color:#ff6b6b;text-align:center;padding:12px;">ఎర్రర్: ${err.message}</p>`;
  }
}

// 7. SAMPLE STORE DATA SEEDER
const seedSampleStoreBtn = document.getElementById("seedSampleStoreBtn");
if (seedSampleStoreBtn) {
  seedSampleStoreBtn.addEventListener("click", async () => {
    if (!confirm("నమూనా ఆధ్యాత్మిక ఉత్పత్తులు మరియు విభాగాలను లోడ్ చేయాలనుకుంటున్నారా?")) return;

    try {
      seedSampleStoreBtn.innerText = "లోడ్ అవుతోంది...";
      seedSampleStoreBtn.disabled = true;

      const sampleCategories = [
        { name: "ఆధ్యాత్మిక గ్రంథాలు", emoji: "📖", order: 1 },
        { name: "పూజా సామగ్రి", emoji: "🪔", order: 2 },
        { name: "జపమాలలు & రుద్రాక్షలు", emoji: "📿", order: 3 },
        { name: "దైవిక చిత్రపటాలు", emoji: "🖼️", order: 4 },
        { name: "సుగంధ ద్రవ్యాలు", emoji: "🌺", order: 5 }
      ];

      const catDocIds = {};
      for (const cat of sampleCategories) {
        const catRef = await addDoc(collection(db, "storeCategories"), {
          ...cat,
          createdAt: serverTimestamp()
        });
        catDocIds[cat.name] = catRef.id;
      }

      const sampleProducts = [
        {
          name: "శ్రీమద్భగవద్గీత యథాతథం (తెలుగు తాత్పర్య సహితం)",
          categoryName: "ఆధ్యాత్మిక గ్రంథాలు",
          categoryId: catDocIds["ఆధ్యాత్మిక గ్రంథాలు"] || "cat_books",
          price: 350,
          originalPrice: 450,
          badge: "బెస్ట్ సెల్లర్",
          description: "పూర్తి శ్లోకాలు, సరళమైన తాత్పర్యం మరియు అనువాదంతో కూడిన అత్యద్భుత పవిత్ర గ్రంథం. ఆధ్యాత్మిక సాధకులకు నిత్య మార్గదర్శి.",
          imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
          inStock: true,
          isFeatured: true,
          whatsappNumber: "919493226037"
        },
        {
          name: "ఇత్తడి పంచముఖ హారతి దీపం (Five-Face Brass Diya)",
          categoryName: "పూజా సామగ్రి",
          categoryId: catDocIds["పూజా సామగ్రి"] || "cat_pooja",
          price: 599,
          originalPrice: 799,
          badge: "ప్రత్యేక ఎంపిక",
          description: "స్వచ్ఛమైన ఇత్తడితో తయారుచేసిన సాంప్రదాయ పంచముఖ దీపం. పూజలు, సంధ్యా హారతులకు అత్యంత శుభప్రదమైనది.",
          imageUrl: "https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=600&auto=format&fit=crop&q=80",
          inStock: true,
          isFeatured: false,
          whatsappNumber: "919493226037"
        },
        {
          name: "స్వచ్ఛమైన తులసి జపమాల (108 పూసలు + గురు పూస)",
          categoryName: "జపమాలలు & రుద్రాక్షలు",
          categoryId: catDocIds["జపమాలలు & రుద్రాక్షలు"] || "cat_malas",
          price: 249,
          originalPrice: 349,
          badge: "పవిత్రమైనది",
          description: "పవిత్ర బృందావన తులసి కొయ్యలతో తయారుచేసిన 108 పూసల సహజ జపమాల. నిత్య మంత్ర జపానికి మరియు ధారణకు ప్రశస్తమైనది.",
          imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&auto=format&fit=crop&q=80",
          inStock: true,
          isFeatured: false,
          whatsappNumber: "919493226037"
        },
        {
          name: "శ్రీ వేంకటేశ్వర స్వామి గోల్డ్ ఫాయిల్ దేవతా ఫ్రేమ్",
          categoryName: "దైవిక చిత్రపటాలు",
          categoryId: catDocIds["దైవిక చిత్రపటాలు"] || "cat_frames",
          price: 899,
          originalPrice: 1200,
          badge: "గోల్డ్ ఫినిష్",
          description: "తిరుమల శ్రీ వేంకటేశ్వర స్వామి దివ్య స్వరూపం కలిగిన హై-క్వాలిటీ గోల్డ్ ఫాయిల్ ఫోటో ఫ్రేమ్. పూజా గదికి శోభస్కరం.",
          imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80",
          inStock: true,
          isFeatured: false,
          whatsappNumber: "919493226037"
        },
        {
          name: "ప్రీమియం గంధం & సాంబ్రాణి కప్పులు (Dhoop Cups)",
          categoryName: "సుగంధ ద్రవ్యాలు",
          categoryId: catDocIds["సుగంధ ద్రవ్యాలు"] || "cat_dhoop",
          price: 180,
          originalPrice: 240,
          badge: "100% సహజం",
          description: "స్వచ్ఛమైన ఆవు నెయ్యి, గుగ్గిలం మరియు సహజ సుగంధ ద్రవ్యాల సమ్మేళనం. ఇల్లంతా సాత్విక ఆధ్యాత్మిక పరిమళాన్ని నింపుతుంది.",
          imageUrl: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&auto=format&fit=crop&q=80",
          inStock: true,
          isFeatured: false,
          whatsappNumber: "919493226037"
        }
      ];

      let firstProdId = null;
      for (const prod of sampleProducts) {
        const pRef = await addDoc(collection(db, "storeProducts"), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        if (prod.isFeatured && !firstProdId) {
          firstProdId = pRef.id;
        }
      }

      if (firstProdId) {
        await setDoc(doc(db, "storeSettings", "main"), {
          featuredProductId: firstProdId,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      alert("🎉 నమూనా ఉత్పత్తులు విజయవంతంగా లోడ్ చేయబడ్డాయి!");
      await loadStoreCategories();
      await loadStoreProducts();
    } catch (err) {
      console.error("Error seeding store:", err);
      alert("Error seeding: " + err.message);
    } finally {
      seedSampleStoreBtn.innerText = "✨ నమూనా ఉత్పత్తులు లోడ్ చేయండి (Load Samples)";
      seedSampleStoreBtn.disabled = false;
    }
  });
}

// Initialize Store CMS
loadStoreCategories();
loadStoreProducts();

