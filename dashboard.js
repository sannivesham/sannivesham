import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) { window.location.href = "admin.html"; }
});

import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, getDoc, updateDoc,
  setDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach((item) => {
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
}
loadAdminEvents();




/* ══════════════════════════════════════
   DASHBOARD NAVIGATION
══════════════════════════════════════ */

const navButtons = document.querySelectorAll(".dash-btn");
const sections = document.querySelectorAll(".dash-section");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach(btn => btn.classList.remove("active"));
    sections.forEach(section => section.classList.remove("active-section"));
    button.classList.add("active");
    document.getElementById(button.dataset.section)?.classList.add("active-section");
  });
});

/* ══════════════════════════════════════
   BACKGROUND UPLOAD MANAGER
══════════════════════════════════════ */

document.querySelectorAll(".bg-upload-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.key;
    const url = await uploadImage();
    if (!url) return;
    await setDoc(doc(db, "settings", "backgrounds"), { [key]: url, updatedAt: serverTimestamp() }, { merge: true });
    alert(key + " background saved successfully");
  });
});

/* ══════════════════════════════════════
   FESTIVALS CMS
══════════════════════════════════════ */

const addFestivalSectionBtn = document.getElementById("addFestivalSectionBtn");
const festivalSectionsContainer = document.getElementById("festivalSectionsContainer");

if (addFestivalSectionBtn && festivalSectionsContainer) {
  addFestivalSectionBtn.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "festival-section-box";
    box.innerHTML = `
      <h4>Festival Section</h4>
      <input type="text" placeholder="Section Title" class="festival-section-title">
      <textarea placeholder="Section Content" class="festival-section-content"></textarea>
      <div class="section-image-slot"><span>＋ Add Section Image</span></div>
      <button class="remove-section-btn">Remove Section</button>
    `;
    festivalSectionsContainer.appendChild(box);
    const imageSlot = box.querySelector(".section-image-slot");
    imageSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imageSlot.innerHTML = `<img src="${url}">`;
      imageSlot.dataset.image = url;
    });
    box.querySelector(".remove-section-btn").addEventListener("click", () => box.remove());
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

const saveFestivalBtn = document.getElementById("saveFestivalBtn");
if (saveFestivalBtn) {
  saveFestivalBtn.addEventListener("click", async () => {
    const title = document.getElementById("festivalTitle").value.trim();
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
    await addDoc(collection(db, "festivals"), { title, cardImage, footerQuote, sections, createdAt: serverTimestamp() });
    document.getElementById("festivalMessage").innerText = "✅ పండుగ సేవ్ అయింది";
    saveFestivalBtn.disabled = false;
    loadAdminFestivals();
  });
}

async function loadAdminFestivals() {
  const list = document.getElementById("adminFestivalsList");
  if (!list) return;
  const q = query(collection(db, "festivals"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach((item) => {
    const festival = item.data();
    list.innerHTML += `
      <div class="admin-event-card editable-festival-card">
        <img src="${festival.cardImage}" alt="${festival.title}">
        <div>
          <h3>${festival.title}</h3>
          <p>Sections: ${festival.sections ? festival.sections.length : 0}</p>
          <button class="open-festival-edit-btn" data-id="${item.id}">Edit</button>
          <button class="delete-festival-btn" data-id="${item.id}">Delete</button>
          <div class="festival-inline-editor" id="festivalEdit-${item.id}"></div>
        </div>
      </div>
    `;
  });
  document.querySelectorAll(".open-festival-edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => openFestivalInlineEditor(btn.dataset.id));
  });
  document.querySelectorAll(".delete-festival-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ పండుగ డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "festivals", btn.dataset.id)); loadAdminFestivals();
    });
  });
}

async function openFestivalInlineEditor(id) {
  const snap = await getDoc(doc(db, "festivals", id));
  if (!snap.exists()) return;
  const festival = snap.data();
  const editor = document.getElementById(`festivalEdit-${id}`);

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
      <div class="festival-card-upload-box inline-card-image" data-image="${festival.cardImage || ""}">
        ${festival.cardImage ? `<img src="${festival.cardImage}">` : `<span>＋ Festival Card Image</span>`}
      </div>
      <input class="inline-footer-quote" value="${festival.footerQuote || ""}" placeholder="Footer Quote">
      <h3>Sections</h3>
      <div class="inline-sections-list">${sectionsHTML}</div>
      <button class="add-inline-section-btn">+ Add Section</button>
      <button class="save-inline-festival-btn">Save Changes</button>
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
    await updateDoc(doc(db, "festivals", id), {
      title: editor.querySelector(".inline-festival-title").value.trim(),
      cardImage: editor.querySelector(".inline-card-image").dataset.image || "",
      footerQuote: editor.querySelector(".inline-footer-quote").value.trim(),
      sections, updatedAt: serverTimestamp()
    });
    alert("✅ Festival updated"); loadAdminFestivals();
  });
}
loadAdminFestivals();


/* ══════════════════════════════════════
   ITHIHASALU CMS
══════════════════════════════════════ */

function uploadAudioFile(boxId) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return resolve(null);

      const box = document.getElementById(boxId);
      const statusText = document.createElement("span");
      statusText.innerText = "అప్‌లోడ్ అవుతోంది...";
      statusText.style.color = "#ffd166";
      statusText.style.display = "block";
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
        if (!res.ok || !data.secure_url) throw new Error("Audio upload failed");
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
    row.innerHTML = `
      <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
        ${data.image ? `<img src="${data.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">` : ""}
        <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
      </div>
      <button class="cms-list-delete-btn" data-id="${d.id}">Delete</button>
    `;
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
  catSnap.forEach(d => { catMap[d.id] = d.data().title; });

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

    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.innerHTML = `
      <div class="cms-list-item-text">
        <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
        <span style="color:rgba(255,255,255,0.5);font-size:13px;"> (${catMap[data.categoryId] || "Unknown"})</span>
      </div>
      <button class="cms-list-delete-btn" data-id="${d.id}">Delete</button>
    `;
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
    ithiShlokaAudioBox.innerHTML = `<audio src="${url}" controls style="width:100%;"></audio>`;
  });
}

const saveIthiShlokaBtn = document.getElementById("saveIthiShlokaBtn");
if (saveIthiShlokaBtn) {
  saveIthiShlokaBtn.addEventListener("click", async () => {
    const subCategoryId = document.getElementById("ithiShlokaSubSelect").value;
    const number = document.getElementById("ithiShlokaNumber").value.trim();
    const shloka = document.getElementById("ithiShlokaText").value.trim();
    const explanation = document.getElementById("ithiShlokaExplanation").value.trim();
    const audioUrl = ithiShlokaAudioBox?.dataset.audio || "";
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
    if (ithiShlokaAudioBox) {
      ithiShlokaAudioBox.dataset.audio = "";
      ithiShlokaAudioBox.innerHTML = `<span>＋ Audio File ఎంచుకోండి</span>`;
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
    row.style.alignItems = "flex-start";
    row.style.gap = "8px";

    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
        <span><strong style="color:#ffd166;">${item.number}</strong> — ${subMap[item.subCategoryId] || "Unknown"}</span>
        <div style="display:flex;gap:8px;">
          <button class="ithi-edit-btn cms-list-delete-btn" data-id="${item.id}" style="background:rgba(255,209,102,0.2);color:#ffd166;">Edit</button>
          <button class="ithi-delete-btn cms-list-delete-btn" data-id="${item.id}" data-sub="${item.subCategoryId}">Delete</button>
        </div>
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);">${(item.shloka || "").substring(0, 70)}...</div>
      ${item.audioUrl ? `<audio src="${item.audioUrl}" controls style="width:100%;height:32px;"></audio>` : ""}

      <div class="ithi-edit-box" id="ithiEdit-${item.id}" style="display:none;width:100%;flex-direction:column;gap:10px;">
        <input class="ithi-e-number" value="${item.number || ""}" placeholder="Number" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
        <textarea class="ithi-e-shloka" placeholder="Shloka" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${item.shloka || ""}</textarea>
        <textarea class="ithi-e-explanation" placeholder="Explanation" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${item.explanation || ""}</textarea>
        <button class="ithi-save-edit-btn" data-id="${item.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
      </div>
    `;

    row.querySelector(".ithi-edit-btn").addEventListener("click", () => {
      const box = document.getElementById(`ithiEdit-${item.id}`);
      box.style.display = box.style.display === "none" ? "flex" : "none";
    });

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
      const box = document.getElementById(`ithiEdit-${btn.dataset.id}`);
      await updateDoc(doc(db, "ithihasaluShlokas", btn.dataset.id), {
        number: box.querySelector(".ithi-e-number").value.trim(),
        shloka: box.querySelector(".ithi-e-shloka").value.trim(),
        explanation: box.querySelector(".ithi-e-explanation").value.trim(),
        updatedAt: serverTimestamp()
      });
      alert("✅ Updated");
      loadIthiShlokas(filterSubId);
    });

    list.appendChild(row);
  });
}
loadIthiShlokas();


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
    row.innerHTML = `
      <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
        ${data.cardImage ? `<img src="${data.cardImage}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">` : ""}
        <span style="color:#ffd166;font-weight:bold;">${data.title}</span>
      </div>
      <button class="cms-list-delete-btn" data-id="${d.id}">Delete</button>
    `;
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

if (addTempleSectionBtn && templeSectionsContainer) {
  addTempleSectionBtn.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "festival-section-box";
    box.innerHTML = `
      <h4>Temple Section</h4>
      <input type="text" placeholder="Section Title" class="temple-section-title">
      <textarea placeholder="Section Content" class="temple-section-content"></textarea>
      <div class="section-image-slot temple-section-image"><span>＋ Temple Image</span></div>
      <button class="remove-temple-section-btn">Delete Section</button>
    `;
    templeSectionsContainer.appendChild(box);
    const imageSlot = box.querySelector(".temple-section-image");
    imageSlot.addEventListener("click", async () => {
      const url = await uploadImage(); if (!url) return;
      imageSlot.dataset.image = url; imageSlot.innerHTML = `<img src="${url}">`;
    });
    box.querySelector(".remove-temple-section-btn").addEventListener("click", () => box.remove());
  });
}

const saveTempleBtn = document.getElementById("saveTempleBtn");
if (saveTempleBtn) {
  saveTempleBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("templeCategorySelect").value;
    const title = document.getElementById("templeTitle").value.trim();
    const footerQuote = document.getElementById("templeFooterQuote").value.trim();
    const cardBox = document.getElementById("templeCardImageGrid");
    const cardImage = cardBox.dataset.image || "";
    const sectionBoxes = document.querySelectorAll("#templeSectionsContainer .festival-section-box");
    const sections = [];
    sectionBoxes.forEach(box => {
      sections.push({
        title: box.querySelector(".temple-section-title").value.trim(),
        content: box.querySelector(".temple-section-content").value.trim(),
        image: box.querySelector(".temple-section-image").dataset.image || "",
        imgWidth: 75, imgHeight: 420, imgBrightness: 100, imgPosition: "center"
      });
    });

    if (!categoryId) {
      document.getElementById("templeMessage").innerText = "దయచేసి విభాగం ఎంచుకోండి";
      return;
    }
    if (!title || !cardImage || sections.length === 0) {
      document.getElementById("templeMessage").innerText = "దయచేసి దేవాలయం పేరు, కార్డ్ ఇమేజ్ మరియు కనీసం ఒక section జోడించండి";
      return;
    }
    await addDoc(collection(db, "temples"), { categoryId, title, cardImage, footerQuote, sections, createdAt: serverTimestamp() });
    document.getElementById("templeMessage").innerText = "✅ దేవాలయం సేవ్ అయింది";

    document.getElementById("templeTitle").value = "";
    document.getElementById("templeFooterQuote").value = "";
    templeSectionsContainer.innerHTML = "";
    cardBox.dataset.image = "";
    cardBox.innerHTML = `<span>＋ Temple Card Image</span>`;

    loadAdminTemples();
  });
}

async function loadAdminTemples(filterCatId = "") {
  const list = document.getElementById("adminTemplesList");
  if (!list) return;

  const catSnap = await getDocs(collection(db, "templeCategories"));
  const catMap = {};
  catSnap.forEach(d => { catMap[d.id] = d.data().title; });

  const q = query(collection(db, "temples"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";

  snapshot.forEach((item) => {
    const temple = item.data();

    if (filterCatId && temple.categoryId !== filterCatId) return;

    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${temple.cardImage}" alt="${temple.title}">
        <div>
          <h3>${temple.title}</h3>
          <p>విభాగం: ${catMap[temple.categoryId] || "Uncategorized"}</p>
          <p>Sections: ${temple.sections ? temple.sections.length : 0}</p>
          <button class="edit-temple-btn" data-id="${item.id}">Edit</button>
          <button class="delete-temple-btn" data-id="${item.id}">Delete</button>
          <div class="temple-inline-editor" id="templeEdit-${item.id}"></div>
        </div>
      </div>
    `;
  });
  document.querySelectorAll(".edit-temple-btn").forEach(btn => {
    btn.addEventListener("click", async () => openTempleInlineEditor(btn.dataset.id, filterCatId));
  });
  document.querySelectorAll(".delete-temple-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ దేవాలయం డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "temples", btn.dataset.id)); loadAdminTemples(filterCatId);
    });
  });
}

async function openTempleInlineEditor(id, filterCatId = "") {
  const snap = await getDoc(doc(db, "temples", id));
  if (!snap.exists()) return;
  const temple = snap.data();
  const editor = document.getElementById(`templeEdit-${id}`);

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
      <div class="festival-card-upload-box inline-temple-card-image" data-image="${temple.cardImage || ""}">
        ${temple.cardImage ? `<img src="${temple.cardImage}">` : `<span>＋ Temple Card Image</span>`}
      </div>
      <input class="inline-temple-footer-quote" value="${temple.footerQuote || ""}" placeholder="Footer Quote">
      <h3>Sections</h3>
      <div class="inline-temple-sections-list">${sectionsHTML}</div>
      <button class="add-inline-temple-section-btn">+ Add Section</button>
      <button class="save-inline-temple-btn">Save Changes</button>
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
    await updateDoc(doc(db, "temples", id), {
      categoryId: editor.querySelector(".inline-temple-category-select").value,
      title: editor.querySelector(".inline-temple-title").value.trim(),
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

const saveLibCategoryBtn = document.getElementById("saveLibCategoryBtn");
if (saveLibCategoryBtn) {
  saveLibCategoryBtn.addEventListener("click", async () => {
    const title = document.getElementById("libCategoryTitle").value.trim();
    const emoji = document.getElementById("libCategoryEmoji").value.trim();
    const orderValue = document.getElementById("libCategoryOrder").value.trim();
    const image = libCategoryImageBox.dataset.image || "";
    if (!title || !image) { document.getElementById("libCategoryMessage").innerText = "Category title and image required"; return; }
    await addDoc(collection(db, "libraryCategories"), { title, emoji, image, order: orderValue ? Number(orderValue) : Date.now(), createdAt: serverTimestamp() });
    document.getElementById("libCategoryTitle").value = "";
    document.getElementById("libCategoryEmoji").value = "";
    document.getElementById("libCategoryOrder").value = "";
    libCategoryImageBox.dataset.image = "";
    libCategoryImageBox.innerHTML = `<span>＋ Category Image</span>`;
    document.getElementById("libCategoryMessage").innerText = "✅ Category saved";
    loadLibCategoriesAdmin(); loadLibCategoryOptions();
  });
}

async function loadLibCategoriesAdmin() {
  const list = document.getElementById("adminLibCategoriesList");
  if (!list) return;
  const snapshot = await getDocs(collection(db, "libraryCategories"));
  let categories = [];
  snapshot.forEach(item => categories.push({ id: item.id, ...item.data() }));
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";
  categories.forEach(data => {
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${data.image}" alt="${data.title}">
        <div>
          <h3>${data.emoji ? data.emoji + " " : ""}${data.title}</h3>
          <button class="delete-lib-category-btn" data-id="${data.id}">Delete</button>
        </div>
      </div>
    `;
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

const saveLibSubcategoryBtn = document.getElementById("saveLibSubcategoryBtn");
if (saveLibSubcategoryBtn) {
  saveLibSubcategoryBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("libSubcategoryCategorySelect").value;
    const title = document.getElementById("libSubcategoryTitle").value.trim();
    const orderValue = document.getElementById("libSubcategoryOrder").value.trim();
    if (!categoryId || !title) { document.getElementById("libSubcategoryMessage").innerText = "Category and subcategory title required"; return; }
    await addDoc(collection(db, "librarySubcategories"), { categoryId, title, order: orderValue ? Number(orderValue) : Date.now(), createdAt: serverTimestamp() });
    document.getElementById("libSubcategoryTitle").value = "";
    document.getElementById("libSubcategoryOrder").value = "";
    document.getElementById("libSubcategoryMessage").innerText = "✅ Subcategory saved";
    loadLibSubcategoriesAdmin(); loadLibSubcategoryOptions();
  });
}

async function loadLibSubcategoriesAdmin() {
  const list = document.getElementById("adminLibSubcategoriesList");
  if (!list) return;
  const catSnap = await getDocs(collection(db, "libraryCategories"));
  const categoryMap = {};
  catSnap.forEach(item => { categoryMap[item.id] = item.data().title; });
  const snapshot = await getDocs(collection(db, "librarySubcategories"));
  let subcategories = [];
  snapshot.forEach(item => subcategories.push({ id: item.id, ...item.data() }));
  subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";
  subcategories.forEach(data => {
    list.innerHTML += `
      <div class="admin-event-card">
        <div>
          <h3>${data.title}</h3>
          <p>Category: ${categoryMap[data.categoryId] || "Unknown"}</p>
          <button class="delete-lib-subcategory-btn" data-id="${data.id}">Delete</button>
        </div>
      </div>
    `;
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

const saveLibContentBtn = document.getElementById("saveLibContentBtn");
if (saveLibContentBtn) {
  saveLibContentBtn.addEventListener("click", async () => {
    const subcategoryId = document.getElementById("libContentSubcategorySelect").value;
    const title = document.getElementById("libContentTitle").value.trim();
    const text = document.getElementById("libContentText").value.trim();
    const audioUrl = document.getElementById("libContentAudioUrl").value.trim();
    const orderValue = document.getElementById("libContentOrder").value.trim();
    if (!subcategoryId || !title || !text) { document.getElementById("libContentMessage").innerText = "Subcategory, title and text required"; return; }
    await addDoc(collection(db, "libraryContent"), { subcategoryId, title, text, audioUrl, order: orderValue ? Number(orderValue) : Date.now(), createdAt: serverTimestamp() });
    document.getElementById("libContentTitle").value = "";
    document.getElementById("libContentText").value = "";
    document.getElementById("libContentAudioUrl").value = "";
    document.getElementById("libContentOrder").value = "";
    document.getElementById("libContentMessage").innerText = "✅ Content saved";
    loadLibContentAdmin();
  });
}

async function loadLibContentAdmin() {
  const list = document.getElementById("adminLibContentList");
  if (!list) return;
  const subSnap = await getDocs(collection(db, "librarySubcategories"));
  const subMap = {};
  subSnap.forEach(item => { subMap[item.id] = item.data().title; });
  const snapshot = await getDocs(collection(db, "libraryContent"));
  let items = [];
  snapshot.forEach(item => items.push({ id: item.id, ...item.data() }));
  items.sort((a, b) => (a.order || 0) - (b.order || 0));
  list.innerHTML = "";
  items.forEach(data => {
    list.innerHTML += `
      <div class="admin-event-card">
        <div>
          <h3>${data.title}</h3>
          <p>Subcategory: ${subMap[data.subcategoryId] || "Unknown"}</p>
          <p>${(data.text || "").slice(0, 80)}${data.text && data.text.length > 80 ? "..." : ""}</p>
          ${data.audioUrl ? `<p>🔊 Audio linked</p>` : ""}
          <button class="edit-lib-content-btn" data-id="${data.id}">Edit</button>
          <button class="delete-lib-content-btn" data-id="${data.id}">Delete</button>
          <div class="lib-content-inline-editor" id="libContentEdit-${data.id}"></div>
        </div>
      </div>
    `;
  });
  list.querySelectorAll(".edit-lib-content-btn").forEach(btn => {
    btn.addEventListener("click", () => openLibContentInlineEditor(btn.dataset.id, items));
  });
  list.querySelectorAll(".delete-lib-content-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this content?")) return;
      await deleteDoc(doc(db, "libraryContent", btn.dataset.id)); loadLibContentAdmin();
    });
  });
}

function openLibContentInlineEditor(id, items) {
  const data = items.find(item => item.id === id);
  if (!data) return;
  const editor = document.getElementById(`libContentEdit-${id}`);
  editor.innerHTML = `
    <div class="festival-edit-panel">
      <input class="edit-lib-content-title" value="${data.title || ""}" placeholder="Title">
      <textarea class="edit-lib-content-text" placeholder="Telugu Text">${data.text || ""}</textarea>
      <input class="edit-lib-content-audio" value="${data.audioUrl || ""}" placeholder="Audio URL">
      <button class="save-lib-content-edit-btn">Save Changes</button>
    </div>
  `;
  editor.querySelector(".save-lib-content-edit-btn").addEventListener("click", async () => {
    await updateDoc(doc(db, "libraryContent", id), {
      title: editor.querySelector(".edit-lib-content-title").value.trim(),
      text: editor.querySelector(".edit-lib-content-text").value.trim(),
      audioUrl: editor.querySelector(".edit-lib-content-audio").value.trim(),
      updatedAt: serverTimestamp()
    });
    alert("✅ Content updated"); loadLibContentAdmin();
  });
}
loadLibContentAdmin();

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
      <div class="admin-event-card">
        <img src="${data.cardImage}" alt="${data.title}">
        <div>
          <h3>${data.title}</h3>
          <button class="delete-sloka-category-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;
  });
  document.querySelectorAll(".delete-sloka-category-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "slokaCategories", btn.dataset.id)); loadSlokaCategoriesAdmin();
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

const saveSlokaBtn = document.getElementById("saveSlokaBtn");
if (saveSlokaBtn) {
  saveSlokaBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("slokaDirectCategorySelect").value;
    const number = document.getElementById("slokaNumber").value.trim();
    const sloka = document.getElementById("slokaText").value.trim();
    const telugu = document.getElementById("slokaTeluguMeaning").value.trim();
    if (!categoryId || !number || !sloka || !telugu) { document.getElementById("slokaMessage").innerText = "Category, number, sloka and Telugu meaning required"; return; }
    await addDoc(collection(db, "slokas"), { categoryId, number, sloka, telugu, createdAt: serverTimestamp() });
    document.getElementById("slokaMessage").innerText = "✅ Sloka Saved";
    document.getElementById("slokaNumber").value = "";
    document.getElementById("slokaText").value = "";
    document.getElementById("slokaTeluguMeaning").value = "";
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
      <div class="admin-event-card sloka-category-admin-card">
        <img src="${category.cardImage || ""}" alt="${category.title || ""}">
        <div>
          <h3>${category.title || ""}</h3>
          <p>Total Slokas: ${categorySlokas.length}</p>
          <button class="toggle-sloka-category-btn" data-id="${category.id}">Open Slokas</button>
          <div class="sloka-category-list hide" id="slokaList-${category.id}">
            ${categorySlokas.length === 0 ? `<p>No slokas added yet</p>` : categorySlokas.map(s => `
              <div class="admin-event-card single-sloka-admin-card">
                <div>
                  <h3>${s.number || ""}</h3>
                  <p>${s.sloka || ""}</p>
                  <button class="edit-sloka-btn" data-id="${s.id}">Edit</button>
                  <button class="delete-sloka-btn" data-id="${s.id}">Delete</button>
                  <div class="sloka-edit-box hide" id="slokaEdit-${s.id}">
                    <input type="text" class="edit-sloka-number" value="${s.number || ""}" placeholder="Sloka Number">
                    <textarea class="edit-sloka-text" placeholder="Sloka Text">${s.sloka || ""}</textarea>
                    <textarea class="edit-sloka-telugu" placeholder="Telugu Meaning">${s.telugu || ""}</textarea>
                    <button class="save-sloka-edit-btn" data-id="${s.id}">Save Changes</button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
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
  document.querySelectorAll(".save-sloka-edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const box = document.getElementById(`slokaEdit-${btn.dataset.id}`);
      await updateDoc(doc(db, "slokas", btn.dataset.id), {
        number: box.querySelector(".edit-sloka-number").value.trim(),
        sloka: box.querySelector(".edit-sloka-text").value.trim(),
        telugu: box.querySelector(".edit-sloka-telugu").value.trim(),
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
  const snap = await getDoc(doc(db, "videos", id));
  if (!snap.exists()) return;
  const data = snap.data();
  const editor = document.getElementById(`videoEdit-${id}`);
  editor.innerHTML = `
    <div class="festival-edit-panel">
      <input class="inline-video-title" value="${data.title || ""}" placeholder="Video Title">
      <div class="festival-card-upload-box inline-video-card-image" data-image="${data.cardImage || ""}">
        ${data.cardImage ? `<img src="${data.cardImage}">` : `<span>＋ Video Card Image</span>`}
      </div>
      <div class="festival-card-upload-box inline-video-file" data-video="${data.videoUrl || ""}">
        ${data.videoUrl ? `<video src="${data.videoUrl}" style="width:100%;max-height:180px;" controls></video>` : `<span>＋ Select Video File</span>`}
      </div>
      <button class="save-inline-video-btn">Save Changes</button>
    </div>
  `;
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

/* ══════════════════════════════════════
   ABOUT CMS
══════════════════════════════════════ */

const aboutPcBgBox = document.getElementById("aboutPcBgBox");
const aboutMobileBgBox = document.getElementById("aboutMobileBgBox");
const memberImageBox = document.getElementById("memberImageBox");

if (aboutPcBgBox) aboutPcBgBox.addEventListener("click", async () => { const url = await uploadImage(); if (!url) return; aboutPcBgBox.dataset.image = url; aboutPcBgBox.innerHTML = `<img src="${url}">`; });
if (aboutMobileBgBox) aboutMobileBgBox.addEventListener("click", async () => { const url = await uploadImage(); if (!url) return; aboutMobileBgBox.dataset.image = url; aboutMobileBgBox.innerHTML = `<img src="${url}">`; });
if (memberImageBox) memberImageBox.addEventListener("click", async () => { const url = await uploadImage(); if (!url) return; memberImageBox.dataset.image = url; memberImageBox.innerHTML = `<img src="${url}">`; });

const saveAboutSettingsBtn = document.getElementById("saveAboutSettingsBtn");
if (saveAboutSettingsBtn) {
 saveAboutSettingsBtn.addEventListener("click", async () => {

  alert("Button Clicked");

  await setDoc(doc(db, "aboutSettings", "main"), {
    title: document.getElementById("aboutTitle").value.trim(),
    description: document.getElementById("aboutDescription").value.trim(),
    mission: document.getElementById("aboutMission").value.trim(),
    vision: document.getElementById("aboutVision").value.trim(),
    pcBg: document.getElementById("aboutPcBgBox").dataset.image || "",
    mobileBg: document.getElementById("aboutMobileBgBox").dataset.image || "",
    updatedAt: serverTimestamp()
  }, { merge: true });

  alert("Saved");

});
}

const saveMemberBtn = document.getElementById("saveMemberBtn");
if (saveMemberBtn) {
  saveMemberBtn.addEventListener("click", async () => {
    const name = document.getElementById("memberName").value.trim();
    const position = document.getElementById("memberPosition").value.trim();
    const description = document.getElementById("memberDescription").value.trim();
    const image = document.getElementById("memberImageBox").dataset.image || "";
    if (!name || !position || !description || !image) { document.getElementById("memberMessage").innerText = "Please fill all member details"; return; }
    await addDoc(collection(db, "aboutMembers"), { name, position, description, image, createdAt: serverTimestamp() });
    document.getElementById("memberMessage").innerText = "✅ Member saved";
    loadAboutMembersAdmin();
  });
}

async function loadAboutMembersAdmin() {
  const list = document.getElementById("adminMembersList");
  if (!list) return;
  const snapshot = await getDocs(collection(db, "aboutMembers"));
  let members = [];
  snapshot.forEach(item => members.push({ id: item.id, ...item.data() }));
  members.sort((a, b) => { const aO = a.order ?? a.createdAt?.seconds ?? 0; const bO = b.order ?? b.createdAt?.seconds ?? 0; return aO - bO; });
  list.innerHTML = "";
  members.forEach((member, index) => {
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${member.image}" alt="${member.name}">
        <div>
          <h3>${member.name}</h3><h4>${member.position}</h4><p>${member.description}</p>
          <button class="edit-about-member-btn" data-id="${member.id}">Edit</button>
          <button class="move-member-up-btn" data-index="${index}">↑ Up</button>
          <button class="move-member-down-btn" data-index="${index}">↓ Down</button>
          <button class="delete-about-member-btn" data-id="${member.id}">Delete</button>
          <div id="memberEdit-${member.id}" class="member-inline-editor"></div>
        </div>
      </div>
    `;
  });
  document.querySelectorAll(".edit-about-member-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const member = members.find(m => m.id === btn.dataset.id);
      const editor = document.getElementById(`memberEdit-${btn.dataset.id}`);
      editor.innerHTML = `
        <div class="festival-edit-panel">
          <input class="edit-member-name" value="${member.name || ""}" placeholder="Name">
          <input class="edit-member-position" value="${member.position || ""}" placeholder="Position">
          <textarea class="edit-member-description" placeholder="Description">${member.description || ""}</textarea>
          <div class="festival-card-upload-box edit-member-image" data-image="${member.image || ""}">
            ${member.image ? `<img src="${member.image}">` : `<span>＋ Member Image</span>`}
          </div>
          <button class="save-member-edit-btn">Save Changes</button>
        </div>
      `;
      const imgBox = editor.querySelector(".edit-member-image");
      imgBox.addEventListener("click", async () => { const url = await uploadImage(); if (!url) return; imgBox.dataset.image = url; imgBox.innerHTML = `<img src="${url}">`; });
      editor.querySelector(".save-member-edit-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "aboutMembers", member.id), { name: editor.querySelector(".edit-member-name").value.trim(), position: editor.querySelector(".edit-member-position").value.trim(), description: editor.querySelector(".edit-member-description").value.trim(), image: imgBox.dataset.image || "", updatedAt: serverTimestamp() });
        alert("✅ Member updated"); loadAboutMembersAdmin();
      });
    });
  });
  document.querySelectorAll(".move-member-up-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const index = Number(btn.dataset.index); if (index === 0) return;
      await updateDoc(doc(db, "aboutMembers", members[index].id), { order: index - 1 });
      await updateDoc(doc(db, "aboutMembers", members[index - 1].id), { order: index });
      loadAboutMembersAdmin();
    });
  });
  document.querySelectorAll(".move-member-down-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const index = Number(btn.dataset.index); if (index === members.length - 1) return;
      await updateDoc(doc(db, "aboutMembers", members[index].id), { order: index + 1 });
      await updateDoc(doc(db, "aboutMembers", members[index + 1].id), { order: index });
      loadAboutMembersAdmin();
    });
  });
  document.querySelectorAll(".delete-about-member-btn").forEach(btn => {
    btn.addEventListener("click", async () => { if (!confirm("Delete this member?")) return; await deleteDoc(doc(db, "aboutMembers", btn.dataset.id)); loadAboutMembersAdmin(); });
  });
}
loadAboutMembersAdmin();

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

Object.keys(homeCardBoxes).forEach(key => {
  const box = homeCardBoxes[key];
  if (!box) return;
  box.addEventListener("click", async () => {
    const url = await uploadImage(); if (!url) return;
    box.dataset.image = url; box.innerHTML = `<img src="${url}">`;
  });
});

async function loadHomeCardsAdmin() {
  const snap = await getDoc(doc(db, "settings", "homeCards"));
  if (!snap.exists()) return;
  const data = snap.data();
  Object.keys(homeCardBoxes).forEach(key => {
    const box = homeCardBoxes[key];
    if (!box || !data[key]) return;
    box.dataset.image = data[key]; box.innerHTML = `<img src="${data[key]}">`;
  });
}
loadHomeCardsAdmin();

const saveHomeCardsBtn = document.getElementById("saveHomeCardsBtn");
if (saveHomeCardsBtn) {
  saveHomeCardsBtn.addEventListener("click", async () => {
    const cardData = {};
    Object.keys(homeCardBoxes).forEach(key => {
      const box = homeCardBoxes[key];
      cardData[key] = box?.dataset.image || "";
    });
    await setDoc(doc(db, "settings", "homeCards"), { ...cardData, updatedAt: serverTimestamp() }, { merge: true });
    document.getElementById("homeCardsMessage").innerText = "✅ Home cards saved";
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
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.innerHTML = `
      <div class="cms-list-item-text">
        <span class="cms-list-item-date">${item.id}</span> ${item.question || ""}
      </div>
      <button class="cms-list-delete-btn" data-id="${item.id}">Delete</button>
    `;
    listBox.appendChild(row);
  });
  listBox.querySelectorAll(".cms-list-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => { await deleteDoc(doc(db, "qotd", btn.dataset.id)); loadQotdList(); });
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
    row.innerHTML = `
      <div class="cms-list-item-text">
        <span class="cms-list-item-date">${item.id}</span> ${item.text || ""}
      </div>
      <button class="cms-list-delete-btn" data-id="${item.id}">Delete</button>
    `;
    listBox.appendChild(row);
  });
  listBox.querySelectorAll(".cms-list-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => { await deleteDoc(doc(db, "wordOfDay", btn.dataset.id)); loadWordList(); });
  });
}
loadWordList();

/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */

import { signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
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
    row.innerHTML = `
      <div class="cms-list-item-text" style="display:flex;align-items:center;gap:12px;">
        ${data.image ? `<img src="${data.image}" style="width:50px;height:50px;object-fit:cover;border-radius:50%;border:1px solid rgba(255,209,102,0.4);">` : `<span style="font-size:2rem;">${data.emoji || "🛕"}</span>`}
        <span style="color:#ffd166;font-weight:bold;">${data.name}</span>
      </div>
      <button class="cms-list-delete-btn" data-id="${d.id}">Delete</button>
    `;
    row.querySelector(".cms-list-delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete this god?")) return;
      await deleteDoc(doc(db, "poojaGods", d.id));
      loadPoojaGods();
    });
    list.appendChild(row);
  });
}

const savePoojaRitualBtn = document.getElementById("savePoojaRitualBtn");
if (savePoojaRitualBtn) {
  savePoojaRitualBtn.addEventListener("click", async () => {
    const godId = document.getElementById("poojaRitualGodSelect").value;
    const name = document.getElementById("poojaRitualName").value.trim();
    const emoji = document.getElementById("poojaRitualEmoji").value.trim();
    const mantraText = document.getElementById("poojaRitualMantra").value.trim();
    const audioUrl = document.getElementById("poojaRitualAudio").value.trim();
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
    document.getElementById("poojaRitualAudio").value = "";
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
      row.style.alignItems = "flex-start";
      row.style.gap = "10px";

      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
          <span>${ritual.emoji || "🙏"} <strong style="color:#ffd166;">${ritual.name}</strong></span>
          <div style="display:flex;gap:8px;">
            <button class="pooja-edit-btn cms-list-delete-btn" data-godid="${god.id}" data-id="${ritual.id}" style="background:rgba(255,209,102,0.2);color:#ffd166;">Edit</button>
            <button class="pooja-delete-btn cms-list-delete-btn" data-godid="${god.id}" data-id="${ritual.id}">Delete</button>
          </div>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);">${ritual.mantraText ? ritual.mantraText.substring(0, 60) + "..." : "No mantra"}</div>

        <div class="pooja-edit-box" id="poojaEdit-${ritual.id}" style="display:none;width:100%;flex-direction:column;gap:10px;">
          <input class="p-edit-name" value="${ritual.name || ""}" placeholder="Name" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <input class="p-edit-emoji" value="${ritual.emoji || ""}" placeholder="Emoji" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <textarea class="p-edit-mantra" placeholder="Mantra Text" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;min-height:80px;">${ritual.mantraText || ""}</textarea>
          <input class="p-edit-audio" value="${ritual.audioUrl || ""}" placeholder="Audio URL" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,209,102,0.3);background:rgba(255,255,255,0.07);color:white;">
          <button class="pooja-save-edit-btn" data-godid="${god.id}" data-id="${ritual.id}" style="padding:10px 20px;border-radius:12px;background:#ffd166;color:#1a1a1a;border:none;font-weight:bold;cursor:pointer;">Save Changes</button>
        </div>
      `;

      row.querySelector(".pooja-edit-btn").addEventListener("click", () => {
        const box = document.getElementById(`poojaEdit-${ritual.id}`);
        box.style.display = box.style.display === "none" ? "flex" : "none";
      });

      row.querySelector(".pooja-delete-btn").addEventListener("click", async (e) => {
        if (!confirm("Delete this ritual?")) return;
        const btn = e.currentTarget;
        await deleteDoc(doc(db, "poojaGods", btn.dataset.godid, "rituals", btn.dataset.id));
        loadPoojaRituals(filterGodId);
      });

      row.querySelector(".pooja-save-edit-btn").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const box = document.getElementById(`poojaEdit-${btn.dataset.id}`);
        await updateDoc(doc(db, "poojaGods", btn.dataset.godid, "rituals", btn.dataset.id), {
          name: box.querySelector(".p-edit-name").value.trim(),
          emoji: box.querySelector(".p-edit-emoji").value.trim(),
          mantraText: box.querySelector(".p-edit-mantra").value.trim(),
          audioUrl: box.querySelector(".p-edit-audio").value.trim(),
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
