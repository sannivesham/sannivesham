import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Global CMS Configurations
const CLOUD_NAME = "du5em76za";
const UPLOAD_PRESET = "sannivesham_upload";

// Authentication Guard
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "admin.html";
  }
});

// DOM Elements - New Event Form
const titleInput = document.getElementById("eventTitle");
const descInput = document.getElementById("eventDescription");
const saveBtn = document.getElementById("saveEventBtn");
const eventMessage = document.getElementById("eventMessage");
const newGrid = document.getElementById("newEventImageGrid");
const locationInput = document.getElementById("eventLocation");
const timeInput = document.getElementById("eventTime");
let newImages = [];

// Core Image Grid Component (Reused across sections)
function renderImageGrid(container, images, onChange) {
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "cms-img-slot";
    slot.draggable = images[i] ? true : false;
    slot.dataset.index = i;

    if (images[i]) {
      slot.innerHTML = `
        <img src="${images[i]}">
        <button class="remove-img">✕</button>
      `;

      slot.querySelector(".remove-img").onclick = () => {
        images.splice(i, 1);
        onChange(images);
      };

      slot.addEventListener("dragstart", e => {
        e.dataTransfer.setData("from", i);
      });

      slot.addEventListener("dragover", e => e.preventDefault());

      slot.addEventListener("drop", e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("from"));
        const to = i;

        const moved = images.splice(from, 1)[0];
        images.splice(to, 0, moved);

        onChange(images.slice(0, 6));
      });
    } else {
      slot.innerHTML = `<span>＋</span>`;
      slot.onclick = async () => {
        const url = await uploadImage();
        if (url) {
          images.push(url);
          onChange(images.slice(0, 6));
        }
      };
    }
    container.appendChild(slot);
  }
}

// Cloudinary Image Upload Utility
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

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData
          }
        );
        const data = await res.json();
        resolve(data.secure_url);
      } catch (err) {
        console.error("Upload failed:", err);
        resolve(null);
      }
    };
    input.click();
  });
}

// Event Refresh Layout
function refreshNewEventGrid() {
  renderImageGrid(newGrid, newImages, (imgs) => {
    newImages = imgs;
    refreshNewEventGrid();
  });
}
if (newGrid) refreshNewEventGrid();

// Save Event Event Listener
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const location = locationInput.value.trim();
    const time = timeInput.value.trim();
    const description = descInput.value.trim();

    if (!title || !description || newImages.length === 0) {
      eventMessage.innerText = "దయచేసి టైటిల్, వివరాలు మరియు కనీసం ఒక చిత్రం జోడించండి";
      return;
    }

    await addDoc(collection(db, "events"), {
      title,
      location,
      time,
      description,
      images: newImages,
      createdAt: serverTimestamp()
    });

    titleInput.value = "";
    descInput.value = "";
    if (locationInput) locationInput.value = "";
    if (timeInput) timeInput.value = "";
    newImages = [];
    renderImageGrid(newGrid, newImages, (imgs) => { newImages = imgs; });
    eventMessage.innerText = "✅ ఈవెంట్ సేవ్ అయింది";
    loadAdminEvents();
  });
}

// Load Events View
async function loadAdminEvents() {
  const list = document.getElementById("adminEventsList");
  if (!list) return;

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
      renderImageGrid(grid, editImages, (imgs) => {
        editImages = imgs;
        refreshEditGrid();
      });
    }
    refreshEditGrid();

    card.querySelector(".save-edit").onclick = async () => {
      await updateDoc(doc(db, "events", item.id), {
        title: card.querySelector(".edit-title").value.trim(),
        location: card.querySelector(".edit-location").value.trim(),
        time: card.querySelector(".edit-time").value.trim(),
        description: card.querySelector(".edit-desc").value.trim(),
        images: editImages,
        updatedAt: serverTimestamp()
      });
      alert("✅ అప్డేట్ అయింది");
      loadAdminEvents();
    };

    card.querySelector(".delete-event").onclick = async () => {
      if (!confirm("ఈ ఈవెంట్ డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "events", item.id));
      loadAdminEvents();
    };

    list.appendChild(card);
  });
}
loadAdminEvents();

// Navigation Controls
const navButtons = document.querySelectorAll(".dash-btn");
const sections = document.querySelectorAll(".dash-section");
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((btn) => btn.classList.remove("active"));
    sections.forEach((section) => section.classList.remove("active-section"));

    button.classList.add("active");
    const targetSection = document.getElementById(button.dataset.section);
    if (targetSection) targetSection.classList.add("active-section");
  });
});

// System Layout Background Settings
document.querySelectorAll(".bg-upload-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.key;
    const url = await uploadImage();
    if (!url) return;

    await setDoc(
      doc(db, "settings", "backgrounds"),
      {
        [key]: url,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    alert(key + " background saved successfully");
  });
});

// Festivals Section Builders
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
      <div class="section-image-slot">
       <span>＋ Add Section Image</span>
      </div>
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

    box.querySelector(".remove-section-btn").addEventListener("click", () => {
      box.remove();
    });
  });
}

// Initializing Custom Setup Hooks for Card Grids
const festivalCardImageGrid = document.getElementById("festivalCardImageGrid");
let festivalCardImage = "";
if (festivalCardImageGrid) {
  festivalCardImageGrid.innerHTML = `
    <div class="section-image-slot">
      <span>＋ Festival Card Image</span>
    </div>
  `;
  const slot = festivalCardImageGrid.querySelector(".section-image-slot");
  slot.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    festivalCardImage = url;
    slot.innerHTML = `<img src="${url}">`;
    festivalCardImageGrid.dataset.image = url;
  });
}

// Festivals Persistence Manager
const saveFestivalBtn = document.getElementById("saveFestivalBtn");
if (saveFestivalBtn) {
  saveFestivalBtn.addEventListener("click", async () => {
    const title = document.getElementById("festivalTitle").value.trim();
    const footerQuote = document.getElementById("festivalFooterQuote").value.trim();
    const cardBox = document.getElementById("festivalCardImageGrid");
    const cardImage = cardBox ? (cardBox.dataset.image || "") : "";

    const sectionBoxes = document.querySelectorAll(".festival-section-box");
    const sectionsArr = [];

    sectionBoxes.forEach((box) => {
      const sectionTitle = box.querySelector(".festival-section-title").value.trim();
      const sectionContent = box.querySelector(".festival-section-content").value.trim();
      const imageSlot = box.querySelector(".section-image-slot");
      const sectionImage = imageSlot ? (imageSlot.dataset.image || "") : "";

      if (sectionTitle || sectionContent || sectionImage) {
        sectionsArr.push({
          title: sectionTitle,
          content: sectionContent,
          image: sectionImage
        });
      }
    });

    if (!title || !cardImage || sectionsArr.length === 0) {
      document.getElementById("festivalMessage").innerText =
        "దయచేసి పండుగ పేరు, కార్డ్ ఇమేజ్ మరియు కనీసం ఒక section జోడించండి";
      return;
    }
    saveFestivalBtn.disabled = true;
    await addDoc(collection(db, "festivals"), {
      title,
      cardImage,
      footerQuote,
      sections: sectionsArr,
      createdAt: serverTimestamp()
    });

    document.getElementById("festivalMessage").innerText = "✅ పండుగ సేవ్ అయింది";
    saveFestivalBtn.disabled = false;
    loadAdminFestivals();
  });
}

// Render Festivals Dash List
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

  document.querySelectorAll(".open-festival-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      openFestivalInlineEditor(btn.dataset.id);
    });
  });
  document.querySelectorAll(".delete-festival-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ పండుగ డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "festivals", btn.dataset.id));
      loadAdminFestivals();
    });
  });
}
loadAdminFestivals();

// Festival Editor Subsystem
async function openFestivalInlineEditor(id) {
  const snap = await getDoc(doc(db, "festivals", id));
  if (!snap.exists()) return;
  const festival = snap.data();
  const editor = document.getElementById(`festivalEdit-${id}`);
  if (!editor) return;

  function sectionHTML(section = {}, index = "New") {
    return `
      <div class="festival-section-box inline-section-edit">
        <h4>Section ${index}</h4>
        <input class="inline-section-title" value="${section.title || ""}" placeholder="Section Title">
        <textarea class="inline-section-content" placeholder="Section Content">${section.content || ""}</textarea>
        <div class="section-image-slot inline-section-image"
             data-image="${section.image || ""}"
             data-width="${section.imgWidth || 75}"
             data-height="${section.imgHeight || 420}"
             data-brightness="${section.imgBrightness || 100}"
             data-position="${section.imgPosition || "center"}">
          ${section.image ? `<img src="${section.image}">` : `<span>＋ Section Image</span>`}
        </div>
        <div class="image-control-box">
          <label>Width %</label>
          <input type="number" class="img-width-input" value="${section.imgWidth || 75}">
          <label>Height px</label>
          <input type="number" class="img-height-input" value="${section.imgHeight || 420}">
          <label>Brightness %</label>
          <input type="number" class="img-brightness-input" value="${section.imgBrightness || 100}">
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
  (festival.sections || []).forEach((section, index) => {
    sectionsHTML += sectionHTML(section, index + 1);
  });

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
      const url = await uploadImage();
      if (!url) return;
      e.currentTarget.dataset.image = url;
      e.currentTarget.innerHTML = `<img src="${url}">`;
    };

    editor.querySelectorAll(".inline-section-image").forEach((slot) => {
      slot.onclick = async () => {
        const url = await uploadImage();
        if (!url) return;
        slot.dataset.image = url;
        slot.innerHTML = `<img src="${url}">`;
      };
    });

    editor.querySelectorAll(".remove-inline-section-btn").forEach((btn) => {
      btn.onclick = () => {
        btn.closest(".inline-section-edit").remove();
      };
    });
  }
  attachEditorEvents();

  editor.querySelector(".add-inline-section-btn").addEventListener("click", () => {
    const list = editor.querySelector(".inline-sections-list");
    list.insertAdjacentHTML("beforeend", sectionHTML({}, "New"));
    attachEditorEvents();
  });

  editor.querySelector(".save-inline-festival-btn").addEventListener("click", async () => {
    const sectionBoxes = editor.querySelectorAll(".inline-section-edit");
    const updatedSections = [];

    sectionBoxes.forEach((box) => {
      updatedSections.push({
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
      sections: updatedSections,
      updatedAt: serverTimestamp()
    });

    alert("✅ Festival updated");
    loadAdminFestivals();
  });
}

// Temples Dynamic CMS
const templeCardBox = document.getElementById("templeCardImageGrid");
if (templeCardBox) {
  templeCardBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
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
      <div class="section-image-slot temple-section-image">
        <span>＋ Temple Image</span>
      </div>
      <button class="remove-temple-section-btn">Delete Section</button>
    `;

    templeSectionsContainer.appendChild(box);
    const imageSlot = box.querySelector(".temple-section-image");

    imageSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imageSlot.dataset.image = url;
      imageSlot.innerHTML = `<img src="${url}">`;
    });

    box.querySelector(".remove-temple-section-btn").addEventListener("click", () => box.remove());
  });
}

const saveTempleBtn = document.getElementById("saveTempleBtn");
if (saveTempleBtn) {
  saveTempleBtn.addEventListener("click", async () => {
    const title = document.getElementById("templeTitle").value.trim();
    const footerQuote = document.getElementById("templeFooterQuote").value.trim();
    const cardBox = document.getElementById("templeCardImageGrid");
    const cardImage = cardBox ? (cardBox.dataset.image || "") : "";

    const sectionBoxes = document.querySelectorAll("#templeSectionsContainer .festival-section-box");
    const sectionsArr = [];

    sectionBoxes.forEach((box) => {
      sectionsArr.push({
        title: box.querySelector(".temple-section-title").value.trim(),
        content: box.querySelector(".temple-section-content").value.trim(),
        image: box.querySelector(".temple-section-image").dataset.image || "",
        imgWidth: 75,
        imgHeight: 420,
        imgBrightness: 100,
        imgPosition: "center"
      });
    });

    if (!title || !cardImage || sectionsArr.length === 0) {
      document.getElementById("templeMessage").innerText =
        "దయచేసి దేవాలయం పేరు, కార్డ్ ఇమేజ్ మరియు కనీసం ఒక section జోడించండి";
      return;
    }

    await addDoc(collection(db, "temples"), {
      title,
      cardImage,
      footerQuote,
      sections: sectionsArr,
      createdAt: serverTimestamp()
    });

    document.getElementById("templeMessage").innerText = "✅ దేవాలయం సేవ్ అయింది";
    loadAdminTemples();
  });
}

async function loadAdminTemples() {
  const list = document.getElementById("adminTemplesList");
  if (!list) return;
  const q = query(collection(db, "temples"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach((item) => {
    const temple = item.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${temple.cardImage}" alt="${temple.title}">
        <div>
          <h3>${temple.title}</h3>
          <p>Sections: ${temple.sections ? temple.sections.length : 0}</p>
          <button class="edit-temple-btn" data-id="${item.id}">Edit</button>
          <button class="delete-temple-btn" data-id="${item.id}">Delete</button>
          <div class="temple-inline-editor" id="templeEdit-${item.id}"></div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".edit-temple-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      openTempleInlineEditor(btn.dataset.id);
    });
  });
  document.querySelectorAll(".delete-temple-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("ఈ దేవాలయం డిలీట్ చేయాలా?")) return;
      await deleteDoc(doc(db, "temples", btn.dataset.id));
      loadAdminTemples();
    });
  });
}
loadAdminTemples();

async function openTempleInlineEditor(id) {
  const snap = await getDoc(doc(db, "temples", id));
  if (!snap.exists()) return;
  const temple = snap.data();
  const editor = document.getElementById(`templeEdit-${id}`);
  if (!editor) return;

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
          <label>Width %</label>
          <input type="number" class="temple-img-width-input" value="${section.imgWidth || 75}">
          <label>Height px</label>
          <input type="number" class="temple-img-height-input" value="${section.imgHeight || 420}">
          <label>Brightness %</label>
          <input type="number" class="temple-img-brightness-input" value="${section.imgBrightness || 100}">
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
  (temple.sections || []).forEach((section, index) => {
    sectionsHTML += sectionHTML(section, index + 1);
  });

  editor.innerHTML = `
    <div class="festival-edit-panel">
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
      const url = await uploadImage();
      if (!url) return;
      e.currentTarget.dataset.image = url;
      e.currentTarget.innerHTML = `<img src="${url}">`;
    };

    editor.querySelectorAll(".inline-temple-section-image").forEach((slot) => {
      slot.onclick = async () => {
        const url = await uploadImage();
        if (!url) return;
        slot.dataset.image = url;
        slot.innerHTML = `<img src="${url}">`;
      };
    });

    editor.querySelectorAll(".remove-inline-temple-section-btn").forEach((btn) => {
      btn.onclick = () => {
        btn.closest(".inline-temple-section-edit").remove();
      };
    });
  }
  attachTempleEditorEvents();

  editor.querySelector(".add-inline-temple-section-btn").addEventListener("click", () => {
    const list = editor.querySelector(".inline-temple-sections-list");
    list.insertAdjacentHTML("beforeend", sectionHTML({}, "New"));
    attachTempleEditorEvents();
  });

  editor.querySelector(".save-inline-temple-btn").addEventListener("click", async () => {
    const sectionBoxes = editor.querySelectorAll(".inline-temple-section-edit");
    const updatedSections = [];

    sectionBoxes.forEach((box) => {
      updatedSections.push({
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
      title: editor.querySelector(".inline-temple-title").value.trim(),
      cardImage: editor.querySelector(".inline-temple-card-image").dataset.image || "",
      footerQuote: editor.querySelector(".inline-temple-footer-quote").value.trim(),
      sections: updatedSections,
      updatedAt: serverTimestamp()
    });

    alert("✅ Temple updated");
    loadAdminTemples();
  });
}

// Stories Section Core CMS
const storyCardBox = document.getElementById("storyCardImageGrid");
if (storyCardBox) {
  storyCardBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    storyCardBox.dataset.image = url;
    storyCardBox.innerHTML = `<img src="${url}">`;
  });
}

const addStorySectionBtn = document.getElementById("addStorySectionBtn");
const storySectionsContainer = document.getElementById("storySectionsContainer");
if (addStorySectionBtn && storySectionsContainer) {
  addStorySectionBtn.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "festival-section-box";
    box.innerHTML = `
      <h4>Story Section</h4>
      <input type="text" placeholder="Section Title" class="story-section-title">
      <textarea placeholder="Section Content" class="story-section-content"></textarea>
      <div class="section-image-slot story-section-image">
        <span>＋ Story Image</span>
      </div>
      <button class="remove-story-section-btn">Delete Section</button>
    `;

    storySectionsContainer.appendChild(box);
    const imageSlot = box.querySelector(".story-section-image");

    imageSlot.addEventListener("click", async () => {
      const url = await uploadImage();
      if (!url) return;
      imageSlot.dataset.image = url;
      imageSlot.innerHTML = `<img src="${url}">`;
    });

    box.querySelector(".remove-story-section-btn").addEventListener("click", () => box.remove());
  });
}

// Story Category Management
const storyCategoryImageBox = document.getElementById("storyCategoryImageBox");
if (storyCategoryImageBox) {
  storyCategoryImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    storyCategoryImageBox.dataset.image = url;
    storyCategoryImageBox.innerHTML = `<img src="${url}">`;
  });
}

const saveStoryCategoryBtn = document.getElementById("saveStoryCategoryBtn");
if (saveStoryCategoryBtn) {
  saveStoryCategoryBtn.addEventListener("click", async () => {
    const title = document.getElementById("storyCategoryTitle").value.trim();
    const cardImage = storyCategoryImageBox ? (storyCategoryImageBox.dataset.image || "") : "";
    if (!title || !cardImage) {
      document.getElementById("storyCategoryMessage").innerText = "Category name and image required";
      return;
    }

    await addDoc(collection(db, "storyCategories"), {
      title,
      cardImage,
      createdAt: serverTimestamp()
    });

    document.getElementById("storyCategoryMessage").innerText = "✅ Category saved";
    loadStoryCategoriesAdmin();
  });
}

async function loadStoryCategoriesAdmin() {
  const list = document.getElementById("adminStoryCategoriesList");
  if (!list) return;
  const q = query(collection(db, "storyCategories"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach((item) => {
    const data = item.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${data.cardImage}" alt="${data.title}">
        <div>
          <h3>${data.title}</h3>
          <button class="delete-story-category-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".delete-story-category-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "storyCategories", btn.dataset.id));
      loadStoryCategoriesAdmin();
    });
  });
}
loadStoryCategoriesAdmin();

// Story Parts Processing
const storyPartImageBox = document.getElementById("storyPartImageBox");
if (storyPartImageBox) {
  storyPartImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    storyPartImageBox.dataset.image = url;
    storyPartImageBox.innerHTML = `<img src="${url}">`;
  });
}

async function loadStoryCategoryOptions() {
  const select = document.getElementById("storyCategorySelect");
  if (!select) return;
  const q = query(collection(db, "storyCategories"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  select.innerHTML = `<option value="">Select Category</option>`;
  snapshot.forEach((item) => {
    const data = item.data();
    select.innerHTML += `<option value="${item.id}">${data.title}</option>`;
  });
}

const saveStoryPartBtn = document.getElementById("saveStoryPartBtn");
if (saveStoryPartBtn) {
  saveStoryPartBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("storyCategorySelect").value;
    const title = document.getElementById("storyPartTitle").value.trim();
    const cardImage = storyPartImageBox ? (storyPartImageBox.dataset.image || "") : "";
    if (!categoryId || !title || !cardImage) {
      document.getElementById("storyPartMessage").innerText = "Category, Part name and image required";
      return;
    }

    await addDoc(collection(db, "storyParts"), {
      categoryId,
      title,
      cardImage,
      sections: [],
      createdAt: serverTimestamp()
    });

    document.getElementById("storyPartMessage").innerText = "✅ Part saved";
    loadStoryPartsAdmin();
  });
}

async function loadStoryPartsAdmin() {
  const list = document.getElementById("adminStoryPartsList");
  if (!list) return;
  const q = query(collection(db, "storyParts"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  list.innerHTML = "";
  snapshot.forEach((item) => {
    const data = item.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${data.cardImage}" alt="${data.title}">
        <div>
          <h3>${data.title}</h3>
          <p>Category ID: ${data.categoryId}</p>
          <button class="edit-story-part-btn" data-id="${item.id}">Edit</button>
          <button class="delete-story-part-btn" data-id="${item.id}">Delete</button>
          <div class="story-inline-editor" id="storyEdit-${item.id}"></div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".edit-story-part-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openStoryInlineEditor(btn.dataset.id);
    });
  });
  document.querySelectorAll(".delete-story-part-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this part?")) return;
      await deleteDoc(doc(db, "storyParts", btn.dataset.id));
      loadStoryPartsAdmin();
    });
  });
}
loadStoryCategoryOptions();
loadStoryPartsAdmin();

async function openStoryInlineEditor(id) {
  const snap = await getDoc(doc(db, "storyParts", id));
  if (!snap.exists()) return;
  const story = snap.data();
  const editor = document.getElementById(`storyEdit-${id}`);
  if (!editor) return;

  function sectionHTML(section = {}, index = "New") {
    return `
      <div class="festival-section-box inline-story-section-edit">
        <h4>Section ${index}</h4>
        <input class="inline-story-section-title" value="${section.title || ""}" placeholder="Section Title">
        <textarea class="inline-story-section-content" placeholder="Section Content">${section.content || ""}</textarea>
        <div class="section-image-slot inline-story-section-image" data-image="${section.image || ""}">
          ${section.image ? `<img src="${section.image}">` : `<span>＋ Story Image</span>`}
        </div>
        <div class="image-control-box">
          <label>Width %</label>
          <input type="number" class="story-img-width-input" value="${section.imgWidth || 75}">
          <label>Height px</label>
          <input type="number" class="story-img-height-input" value="${section.imgHeight || 420}">
          <label>Brightness %</label>
          <input type="number" class="story-img-brightness-input" value="${section.imgBrightness || 100}">
          <label>Alignment</label>
          <select class="story-img-position-input">
            <option value="left" ${section.imgPosition === "left" ? "selected" : ""}>Left</option>
            <option value="center" ${section.imgPosition === "center" ? "selected" : ""}>Center</option>
            <option value="right" ${section.imgPosition === "right" ? "selected" : ""}>Right</option>
          </select>
        </div>
        <button class="remove-inline-story-section-btn">Delete Section</button>
      </div>
    `;
  }

  let sectionsHTML = "";
  (story.sections || []).forEach((section, index) => {
    sectionsHTML += sectionHTML(section, index + 1);
  });

  editor.innerHTML = `
    <div class="festival-edit-panel">
      <input class="inline-story-title" value="${story.title || ""}" placeholder="Story Part Title">
      <div class="festival-card-upload-box inline-story-card-image" data-image="${story.cardImage || ""}">
        ${story.cardImage ? `<img src="${story.cardImage}">` : `<span>＋ Story Part Image</span>`}
      </div>
      <h3>Sections</h3>
      <div class="inline-story-sections-list">${sectionsHTML}</div>
      <button class="add-inline-story-section-btn">+ Add Section</button>
      <button class="save-inline-story-btn">Save Changes</button>
    </div>
  `;

  function attachStoryEditorEvents() {
    editor.querySelector(".inline-story-card-image").onclick = async (e) => {
      const url = await uploadImage();
      if (!url) return;
      e.currentTarget.dataset.image = url;
      e.currentTarget.innerHTML = `<img src="${url}">`;
    };

    editor.querySelectorAll(".inline-story-section-image").forEach((slot) => {
      slot.onclick = async () => {
        const url = await uploadImage();
        if (!url) return;
        slot.dataset.image = url;
        slot.innerHTML = `<img src="${url}">`;
      };
    });

    editor.querySelectorAll(".remove-inline-story-section-btn").forEach((btn) => {
      btn.onclick = () => {
        btn.closest(".inline-story-section-edit").remove();
      };
    });
  }
  attachStoryEditorEvents();

  editor.querySelector(".add-inline-story-section-btn").addEventListener("click", () => {
    const list = editor.querySelector(".inline-story-sections-list");
    list.insertAdjacentHTML("beforeend", sectionHTML({}, "New"));
    attachStoryEditorEvents();
  });

  editor.querySelector(".save-inline-story-btn").addEventListener("click", async () => {
    const sectionBoxes = editor.querySelectorAll(".inline-story-section-edit");
    const updatedSections = [];

    sectionBoxes.forEach((box) => {
      updatedSections.push({
        title: box.querySelector(".inline-story-section-title").value.trim(),
        content: box.querySelector(".inline-story-section-content").value.trim(),
        image: box.querySelector(".inline-story-section-image").dataset.image || "",
        imgWidth: Number(box.querySelector(".story-img-width-input").value) || 75,
        imgHeight: Number(box.querySelector(".story-img-height-input").value) || 420,
        imgBrightness: Number(box.querySelector(".story-img-brightness-input").value) || 100,
        imgPosition: box.querySelector(".story-img-position-input").value || "center"
      });
    });

    await updateDoc(doc(db, "storyParts", id), {
      title: editor.querySelector(".inline-story-title").value.trim(),
      cardImage: editor.querySelector(".inline-story-card-image").dataset.image || "",
      sections: updatedSections,
      updatedAt: serverTimestamp()
    });

    alert("✅ Story updated");
    loadStoryPartsAdmin();
  });
}

// Sloka Category Handling
const slokaCategoryImageBox = document.getElementById("slokaCategoryImageBox");
if (slokaCategoryImageBox) {
  slokaCategoryImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    slokaCategoryImageBox.dataset.image = url;
    slokaCategoryImageBox.innerHTML = `<img src="${url}">`;
  });
}

const saveSlokaCategoryBtn = document.getElementById("saveSlokaCategoryBtn");
if (saveSlokaCategoryBtn) {
  saveSlokaCategoryBtn.addEventListener("click", async () => {
    const title = document.getElementById("slokaCategoryTitle").value.trim();
    const cardImage = slokaCategoryImageBox ? (slokaCategoryImageBox.dataset.image || "") : "";

    if (!title || !cardImage) {
      document.getElementById("slokaCategoryMessage").innerText = "Category name and image required";
      return;
    }

    await addDoc(collection(db, "slokaCategories"), {
      title,
      cardImage,
      createdAt: serverTimestamp()
    });

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
  snapshot.forEach((item) => {
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

  document.querySelectorAll(".delete-sloka-category-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this category?")) return;
      await deleteDoc(doc(db, "slokaCategories", btn.dataset.id));
      loadSlokaCategoriesAdmin();
    });
  });
}
loadSlokaCategoriesAdmin();

// Direct Category Slokas CMS
async function loadSlokaDirectCategories() {
  const select = document.getElementById("slokaDirectCategorySelect");
  if (!select) return;
  const q = query(collection(db, "slokaCategories"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  select.innerHTML = `<option value="">Select Category</option>`;
  snapshot.forEach((item) => {
    const data = item.data();
    select.innerHTML += `<option value="${item.id}">${data.title}</option>`;
  });
}

const saveSlokaBtn = document.getElementById("saveSlokaBtn");
if (saveSlokaBtn) {
  saveSlokaBtn.addEventListener("click", async () => {
    const categoryId = document.getElementById("slokaDirectCategorySelect").value;
    const number = document.getElementById("slokaNumber").value.trim();
    const sloka = document.getElementById("slokaText").value.trim();
    const telugu = document.getElementById("slokaTeluguMeaning").value.trim();

    if (!categoryId || !number || !sloka || !telugu) {
      document.getElementById("slokaMessage").innerText = "Category, number, sloka and Telugu meaning required";
      return;
    }

    await addDoc(collection(db, "slokas"), {
      categoryId,
      number,
      sloka,
      telugu,
      createdAt: serverTimestamp()
    });

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
  const chapterSnap = await getDocs(collection(db, "slokaChapters"));

  const categories = [];
  const chapters = [];
  const slokas = [];

  categorySnap.forEach((catDoc) => { categories.push({ id: catDoc.id, ...catDoc.data() }); });
  chapterSnap.forEach((chapterDoc) => { chapters.push({ id: chapterDoc.id, ...chapterDoc.data() }); });
  slokaSnap.forEach((slokaDoc) => { slokas.push({ id: slokaDoc.id, ...slokaDoc.data() }); });

  list.innerHTML = "";
  categories.forEach((category) => {
    const categoryChapterIds = chapters
      .filter((chapter) => chapter.categoryId === category.id)
      .map((chapter) => chapter.id);
    const categorySlokas = slokas
      .filter((s) => s.categoryId === category.id || categoryChapterIds.includes(s.chapterId))
      .sort((a, b) => getSlokaNumberAdmin(a.number) - getSlokaNumberAdmin(b.number));

    list.innerHTML += `
      <div class="admin-event-card sloka-category-admin-card">
        <img src="${category.cardImage || ""}" alt="${category.title || ""}">
        <div>
          <h3>${category.title || ""}</h3>
          <p>Total Slokas: ${categorySlokas.length}</p>
          <button class="toggle-sloka-category-btn" data-id="${category.id}">Open Slokas</button>
          <div class="sloka-category-list hide" id="slokaList-${category.id}">
            ${
              categorySlokas.length === 0
                ? `<p>No slokas added yet</p>`
                : categorySlokas.map((s) => `
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
                  `).join("")
            }
          </div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".toggle-sloka-category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`slokaList-${btn.dataset.id}`);
      if (box) {
        box.classList.toggle("hide");
        btn.innerText = box.classList.contains("hide") ? "Open Slokas" : "Collapse Slokas";
      }
    });
  });

  document.querySelectorAll(".edit-sloka-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`slokaEdit-${btn.dataset.id}`);
      if (box) box.classList.toggle("hide");
    });
  });

  document.querySelectorAll(".save-sloka-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const box = document.getElementById(`slokaEdit-${btn.dataset.id}`);
      if (!box) return;
      await updateDoc(doc(db, "slokas", btn.dataset.id), {
        number: box.querySelector(".edit-sloka-number").value.trim(),
        sloka: box.querySelector(".edit-sloka-text").value.trim(),
        telugu: box.querySelector(".edit-sloka-telugu").value.trim(),
        updatedAt: serverTimestamp()
      });
      alert("✅ Sloka updated");
      loadSlokasAdmin();
    });
  });

  document.querySelectorAll(".delete-sloka-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this sloka?")) return;
      await deleteDoc(doc(db, "slokas", btn.dataset.id));
      loadSlokasAdmin();
    });
  });
}
loadSlokaDirectCategories();
loadSlokasAdmin();

// Quiz Management CMS
const saveQuizQuestionBtn = document.getElementById("saveQuizQuestionBtn");
if (saveQuizQuestionBtn) {
  saveQuizQuestionBtn.addEventListener("click", async () => {
    const question = document.getElementById("quizQuestion").value.trim();
    const optionA = document.getElementById("quizOptionA").value.trim();
    const optionB = document.getElementById("quizOptionB").value.trim();
    const optionC = document.getElementById("quizOptionC").value.trim();
    const optionD = document.getElementById("quizOptionD").value.trim();
    const correctAnswer = document.getElementById("quizCorrectAnswer").value;

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      document.getElementById("quizQuestionMessage").innerText = "Please fill all fields";
      return;
    }

    await addDoc(collection(db, "quizQuestions"), {
      question,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correctAnswer,
      createdAt: serverTimestamp()
    });

    document.getElementById("quizQuestionMessage").innerText = "✅ Question saved";
    loadQuizQuestionsAdmin();
  });
}

async function loadQuizQuestionsAdmin() {
  const list = document.getElementById("adminQuizQuestionsList");
  if (!list) return;
  const snapshot = await getDocs(collection(db, "quizQuestions"));
  list.innerHTML = "";
  snapshot.forEach((item) => {
    const q = item.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <div>
          <h3>${q.question}</h3>
          <p>A: ${q.options.A}</p>
          <p>B: ${q.options.B}</p>
          <p>C: ${q.options.C}</p>
          <p>D: ${q.options.D}</p>
          <p>Correct: ${q.correctAnswer}</p>
          <button class="delete-quiz-question-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".delete-quiz-question-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this question?")) return;
      await deleteDoc(doc(db, "quizQuestions", btn.dataset.id));
      loadQuizQuestionsAdmin();
    });
  });
}
loadQuizQuestionsAdmin();

async function loadQuizScoresAdmin() {
  const list = document.getElementById("adminQuizScoresList");
  if (!list) return;
  const snapshot = await getDocs(collection(db, "quizScores"));
  list.innerHTML = "";
  snapshot.forEach((docItem) => {
    const data = docItem.data();
    list.innerHTML += `
      <div class="admin-event-card">
        <div>
          <h3>${data.name}</h3>
          <p>Score: ${data.score}/10</p>
          <button class="delete-score-btn" data-id="${docItem.id}">Delete Score</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".delete-score-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this score?")) return;
      await deleteDoc(doc(db, "quizScores", btn.dataset.id));
      loadQuizScoresAdmin();
    });
  });
}
loadQuizScoresAdmin();

// About Settings Framework
const aboutPcBgBox = document.getElementById("aboutPcBgBox");
const aboutMobileBgBox = document.getElementById("aboutMobileBgBox");
const memberImageBox = document.getElementById("memberImageBox");

if (aboutPcBgBox) {
  aboutPcBgBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    aboutPcBgBox.dataset.image = url;
    aboutPcBgBox.innerHTML = `<img src="${url}">`;
  });
}
if (aboutMobileBgBox) {
  aboutMobileBgBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    aboutMobileBgBox.dataset.image = url;
    aboutMobileBgBox.innerHTML = `<img src="${url}">`;
  });
}
if (memberImageBox) {
  memberImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    memberImageBox.dataset.image = url;
    memberImageBox.innerHTML = `<img src="${url}">`;
  });
}

const saveAboutSettingsBtn = document.getElementById("saveAboutSettingsBtn");
if (saveAboutSettingsBtn) {
  saveAboutSettingsBtn.addEventListener("click", async () => {
    const title = document.getElementById("aboutTitle").value.trim();
    const description = document.getElementById("aboutDescription").value.trim();
    const mission = document.getElementById("aboutMission").value.trim();
    const vision = document.getElementById("aboutVision").value.trim();
    const pcBg = document.getElementById("aboutPcBgBox").dataset.image || "";
    const mobileBg = document.getElementById("aboutMobileBgBox").dataset.image || "";

    await setDoc(
      doc(db, "aboutSettings", "main"),
      { title, description, mission, vision, pcBg, mobileBg, updatedAt: serverTimestamp() },
      { merge: true }
    );
    document.getElementById("aboutSettingsMessage").innerText = "✅ About settings saved";
  });
}

// About Page Team Module
const saveMemberBtn = document.getElementById("saveMemberBtn");
if (saveMemberBtn) {
  saveMemberBtn.addEventListener("click", async () => {
    const name = document.getElementById("memberName").value.trim();
    const position = document.getElementById("memberPosition").value.trim();
    const description = document.getElementById("memberDescription").value.trim();
    const image = document.getElementById("memberImageBox").dataset.image || "";

    if (!name || !position || !description || !image) {
      document.getElementById("memberMessage").innerText = "Please fill all member details";
      return;
    }

    await addDoc(collection(db, "aboutMembers"), {
      name,
      position,
      description,
      image,
      createdAt: serverTimestamp()
    });

    document.getElementById("memberMessage").innerText = "✅ Member saved";
    loadAboutMembersAdmin();
  });
}

async function loadAboutMembersAdmin() {
  const list = document.getElementById("adminMembersList");
  if (!list) return;
  const snapshot = await getDocs(collection(db, "aboutMembers"));
  let members = [];
  snapshot.forEach((item) => { members.push({ id: item.id, ...item.data() }); });
  
  members.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt?.seconds ?? 0;
    const bOrder = b.order ?? b.createdAt?.seconds ?? 0;
    return aOrder - bOrder;
  });

  list.innerHTML = "";
  members.forEach((member, index) => {
    list.innerHTML += `
      <div class="admin-event-card">
        <img src="${member.image}" alt="${member.name}">
        <div>
          <h3>${member.name}</h3>
          <h4>${member.position}</h4>
          <p>${member.description}</p>
          <button class="edit-about-member-btn" data-id="${member.id}">Edit</button>
          <button class="move-member-up-btn" data-index="${index}">↑ Up</button>
          <button class="move-member-down-btn" data-index="${index}">↓ Down</button>
          <button class="delete-about-member-btn" data-id="${member.id}">Delete</button>
          <div id="memberEdit-${member.id}" class="member-inline-editor"></div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".edit-about-member-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const member = members.find(m => m.id === btn.dataset.id);
      const editor = document.getElementById(`memberEdit-${btn.dataset.id}`);
      if (!editor) return;

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
      imgBox.addEventListener("click", async () => {
        const url = await uploadImage();
        if (!url) return;
        imgBox.dataset.image = url;
        imgBox.innerHTML = `<img src="${url}">`;
      });

      editor.querySelector(".save-member-edit-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "aboutMembers", member.id), {
          name: editor.querySelector(".edit-member-name").value.trim(),
          position: editor.querySelector(".edit-member-position").value.trim(),
          description: editor.querySelector(".edit-member-description").value.trim(),
          image: imgBox.dataset.image || "",
          updatedAt: serverTimestamp()
        });
        alert("✅ Member updated");
        loadAboutMembersAdmin();
      });
    });
  });

  document.querySelectorAll(".move-member-up-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const index = Number(btn.dataset.index);
      if (index === 0) return;
      const current = members[index];
      const previous = members[index - 1];

      await updateDoc(doc(db, "aboutMembers", current.id), { order: index - 1 });
      await updateDoc(doc(db, "aboutMembers", previous.id), { order: index });
      loadAboutMembersAdmin();
    });
  });

  document.querySelectorAll(".move-member-down-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const index = Number(btn.dataset.index);
      if (index === members.length - 1) return;
      const current = members[index];
      const next = members[index + 1];

      await updateDoc(doc(db, "aboutMembers", current.id), { order: index + 1 });
      await updateDoc(doc(db, "aboutMembers", next.id), { order: index });
      loadAboutMembersAdmin();
    });
  });

  document.querySelectorAll(".delete-about-member-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this member?")) return;
      await deleteDoc(doc(db, "aboutMembers", btn.dataset.id));
      loadAboutMembersAdmin();
    });
  });
}
loadAboutMembersAdmin();

// Social Links Integration
const saveSocialLinksBtn = document.getElementById("saveSocialLinksBtn");
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

if (saveSocialLinksBtn) {
  saveSocialLinksBtn.addEventListener("click", async () => {
    await setDoc(
      doc(db, "settings", "socialLinks"),
      {
        instagram: document.getElementById("instagramLink").value.trim(),
        youtube: document.getElementById("youtubeLink").value.trim(),
        whatsapp: document.getElementById("whatsappLink").value.trim(),
        facebook: document.getElementById("facebookLink").value.trim(),
        phone: document.getElementById("phoneNumber").value.trim(),
        email: document.getElementById("emailLink").value.trim(),
        whatsappChannel: document.getElementById("whatsappChannelLink").value.trim(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    document.getElementById("socialLinksMessage").innerText = "✅ Social Links Updated";
  });
}
loadSocialLinksAdmin();

// Home Display Custom Categories Cards
const homeCardBoxes = {
  eventsCard: document.getElementById("eventsCardBox"),
  festivalsCard: document.getElementById("festivalsCardBox"),
  templesCard: document.getElementById("templesCardBox"),
  storiesCard: document.getElementById("storiesCardBox"),
  slokasCard: document.getElementById("slokasCardBox"),
  quizCard: document.getElementById("quizCardBox")
};

Object.keys(homeCardBoxes).forEach((key) => {
  const box = homeCardBoxes[key];
  if (!box) return;
  box.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    box.dataset.image = url;
    box.innerHTML = `<img src="${url}">`;
  });
});

const saveHomeCardsBtn = document.getElementById("saveHomeCardsBtn");
if (saveHomeCardsBtn) {
  saveHomeCardsBtn.addEventListener("click", async () => {
    await setDoc(
      doc(db, "settings", "homeCards"),
      {
        eventsCard: homeCardBoxes.eventsCard?.dataset.image || "",
        festivalsCard: homeCardBoxes.festivalsCard?.dataset.image || "",
        templesCard: homeCardBoxes.templesCard?.dataset.image || "",
        storiesCard: homeCardBoxes.storiesCard?.dataset.image || "",
        slokasCard: homeCardBoxes.slokasCard?.dataset.image || "",
        quizCard: homeCardBoxes.quizCard?.dataset.image || "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    document.getElementById("homeCardsMessage").innerText = "✅ Home cards saved";
  });
}

// Sponsor Modal Operations
const sponsorImageBox = document.getElementById("sponsorImageBox");
if (sponsorImageBox) {
  sponsorImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;
    sponsorImageBox.dataset.image = url;
    sponsorImageBox.innerHTML = `<img src="${url}">`;
  });
}

async function loadSponsorAdmin() {
  const snap = await getDoc(doc(db, "settings", "sponsor"));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.image && sponsorImageBox) {
    sponsorImageBox.dataset.image = data.image;
    sponsorImageBox.innerHTML = `<img src="${data.image}">`;
  }
  const linkInput = document.getElementById("sponsorLinkInput");
  if (linkInput) linkInput.value = data.link || "";
}
loadSponsorAdmin();

const saveSponsorBtn = document.getElementById("saveSponsorBtn");
if (saveSponsorBtn) {
  saveSponsorBtn.addEventListener("click", async () => {
    await setDoc(
      doc(db, "settings", "sponsor"),
      {
        image: (sponsorImageBox && sponsorImageBox.dataset.image) || "",
        link: document.getElementById("sponsorLinkInput").value.trim(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    document.getElementById("sponsorMessage").innerText = "✅ Sponsor saved";
  });
}

// Question of the Day CMS
const saveQotdBtn = document.getElementById("saveQotdBtn");
if (saveQotdBtn) {
  saveQotdBtn.addEventListener("click", async () => {
    const dateValue = document.getElementById("qotdDate").value;
    if (!dateValue) {
      document.getElementById("qotdMessage").innerText = "⚠️ Please select a date";
      return;
    }

    const question = document.getElementById("qotdQuestionInput").value.trim();
    const options = [
      document.getElementById("qotdOption0").value.trim(),
      document.getElementById("qotdOption1").value.trim(),
      document.getElementById("qotdOption2").value.trim(),
      document.getElementById("qotdOption3").value.trim()
    ];
    const correct = parseInt(document.getElementById("qotdCorrectSelect").value);

    if (!question || options.some((o) => !o)) {
      document.getElementById("qotdMessage").innerText = "⚠️ Please fill question and all 4 options";
      return;
    }

    await setDoc(doc(db, "qotd", dateValue), { question, options, correct, updatedAt: serverTimestamp() });
    document.getElementById("qotdMessage").innerText = "✅ Question saved for " + dateValue;

    document.getElementById("qotdQuestionInput").value = "";
    document.getElementById("qotdOption0").value = "";
    document.getElementById("qotdOption1").value = "";
    document.getElementById("qotdOption2").value = "";
    document.getElementById("qotdOption3").value = "";
    loadQotdList();
  });
}

async function loadQotdList() {
  const listBox = document.getElementById("qotdList");
  if (!listBox) return;
  const snap = await getDocs(collection(db, "qotd"));
  const items = [];
  snap.forEach((docSnap) => { items.push({ id: docSnap.id, ...docSnap.data() }); });
  items.sort((a, b) => (a.id < b.id ? -1 : 1));
  listBox.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.innerHTML = `
      <div class="cms-list-item-text">
        <span class="cms-list-item-date">${item.id}</span>
        ${item.question || ""}
      </div>
      <button class="cms-list-delete-btn" data-id="${item.id}">Delete</button>
    `;
    listBox.appendChild(row);
  });

  listBox.querySelectorAll(".cms-list-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "qotd", btn.dataset.id));
      loadQotdList();
    });
  });
}
loadQotdList();

// Word of the Day CMS
const saveWordBtn = document.getElementById("saveWordBtn");
if (saveWordBtn) {
  saveWordBtn.addEventListener("click", async () => {
    const dateValue = document.getElementById("wordDate").value;
    if (!dateValue) {
      document.getElementById("wordMessage").innerText = "⚠️ Please select a date";
      return;
    }

    const text = document.getElementById("wordTextInput").value.trim();
    if (!text) {
      document.getElementById("wordMessage").innerText = "⚠️ Please enter a word/sentence";
      return;
    }

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
  snap.forEach((docSnap) => { items.push({ id: docSnap.id, ...docSnap.data() }); });
  items.sort((a, b) => (a.id < b.id ? -1 : 1));
  listBox.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cms-list-item";
    row.innerHTML = `
      <div class="cms-list-item-text">
        <span class="cms-list-item-date">${item.id}</span>
        ${item.text || ""}
      </div>
      <button class="cms-list-delete-btn" data-id="${item.id}">Delete</button>
    `;
    listBox.appendChild(row);
  });

  listBox.querySelectorAll(".cms-list-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "wordOfDay", btn.dataset.id));
      loadWordList();
    });
  });
}
loadWordList();

// Logout Handler
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin.html";
  });
}

// Advanced Custom Quiz CMS Module Extensions
const saveQuizBtn = document.getElementById("saveNewQuizQuestionBtn");
if (saveQuizBtn) {
  saveQuizBtn.addEventListener("click", async () => {
    const type = document.getElementById("quizTypeSelect").value;
    const question = document.getElementById("newQuizQuestion").value.trim();
    const option1 = document.getElementById("newQuizOption1").value.trim();
    const option2 = document.getElementById("newQuizOption2").value.trim();
    const option3 = document.getElementById("newQuizOption3").value.trim();
    const option4 = document.getElementById("newQuizOption4").value.trim();
    const answer = document.getElementById("newQuizAnswer").value;

    if (!type || !question || !option1 || !option2 || !option3 || !option4 || !answer) {
      alert("Fill all fields");
      return;
    }

    let collectionName = "";
    let difficulty = "";

    if (type.startsWith("general")) {
      collectionName = "quizGeneral";
      difficulty = type.replace("general_", "");
    } else {
      switch (type) {
        case "hari": collectionName = "quizHari"; break;
        case "hara": collectionName = "quizHara"; break;
        case "devi": collectionName = "quizDevi"; break;
        case "telugu": collectionName = "quizTelugu"; break;
      }
    }

    await addDoc(collection(db, collectionName), {
      difficulty,
      question,
      option1,
      option2,
      option3,
      option4,
      answer,
      image: "",
      createdAt: serverTimestamp()
    });

    document.getElementById("newQuizMessage").innerHTML = "✅ Question Saved";
    document.getElementById("newQuizQuestion").value = "";
    document.getElementById("newQuizOption1").value = "";
    document.getElementById("newQuizOption2").value = "";
    document.getElementById("newQuizOption3").value = "";
    document.getElementById("newQuizOption4").value = "";
    document.getElementById("newQuizAnswer").selectedIndex = 0;
  });
}

/* =================================
   LIBRARY CATEGORIES CMS SUBSYSTEM
==================================== */
const libCategoryImageBox = document.getElementById("libraryCategoryImageBox") || document.getElementById("categoryImageBox");
const saveLibCategoryBtn = document.getElementById("saveLibraryCategoryBtn") || document.getElementById("saveCategoryBtn");

// Handles interactive selection & image ingestion via Cloudinary
if (libCategoryImageBox) {
  libCategoryImageBox.addEventListener("click", async () => {
    const url = await uploadImage();
    if (!url) return;

    libCategoryImageBox.dataset.image = url;
    libCategoryImageBox.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:4px;">`;
  });
}

// Fires state mutations back up to Firestore database instance
if (saveLibCategoryBtn) {
  saveLibCategoryBtn.addEventListener("click", async () => {
    const titleInput = document.getElementById("libraryCategoryTitle") || document.getElementById("categoryTitle") || document.querySelector('input[placeholder*="Title"]');
    const emojiInput = document.getElementById("libraryCategoryEmoji") || document.getElementById("categoryEmoji") || document.querySelector('input[placeholder*="Emoji"]');
    const orderInput = document.getElementById("libraryCategoryOrder") || document.getElementById("categoryOrder") || document.querySelector('input[placeholder*="order"]');
    
    const title = titleInput ? titleInput.value.trim() : "";
    const emoji = emojiInput ? emojiInput.value.trim() : "";
    const order = orderInput ? parseInt(orderInput.value.trim()) : 0;
    const cardImage = libCategoryImageBox ? (libCategoryImageBox.dataset.image || "") : "";

    if (!cardImage) {
      alert("⚠️ దయచేసి ఒక చిత్రాన్ని అప్‌లోడ్ చేయండి (Please upload a category image first)");
      return;
    }

    try {
      await addDoc(collection(db, "libraryCategories"), {
        title: title || "Untitled Category",
        emoji: emoji || "",
        order: isNaN(order) ? 999 : order,
        cardImage,
        createdAt: serverTimestamp()
      });

      alert("✅ వర్గం విజయవంతంగా సేవ్ అయింది! (Library Category Saved)");
      
      // Cleanup DOM Element States on Successful Add
      if (titleInput) titleInput.value = "";
      if (emojiInput) emojiInput.value = "";
      if (orderInput) orderInput.value = "";
      if (libCategoryImageBox) {
        delete libCategoryImageBox.dataset.image;
        libCategoryImageBox.innerHTML = `+ Category Image`;
      }
      
      if (typeof loadLibraryCategoriesAdmin === "function") {
        loadLibraryCategoriesAdmin();
      }

    } catch (error) {
      console.error("Error saving library category:", error);
      alert("❌ సేవ్ చేయడం విఫలమైంది: " + error.message);
    }
  });
}
