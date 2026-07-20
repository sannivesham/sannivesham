import { db, auth } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const godId = params.get("god");

const godNameEl = document.getElementById("poojaGodName");
const idolImg = document.getElementById("poojaIdolImg");
const stage = document.getElementById("poojaStage");
const mantraBox = document.getElementById("poojaMantraBox");
const buttonsBox = document.getElementById("poojaRitualButtons");
const completionMsg = document.getElementById("poojaCompletionMsg");
const bellSound = document.getElementById("poojaBell");

let rituals = [];
let doneRitualIds = new Set();
let currentAudio = null;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickAnimationClass(ritualName) {
  const name = (ritualName || "").toLowerCase();
  if (name.includes("అభిషేక")) return "anim-water";
  if (name.includes("పుష్ప") || name.includes("పూల")) return "anim-flower";
  if (name.includes("దీప")) return "anim-lamp-glow";
  if (name.includes("నైవేద్య")) return "anim-food";
  if (name.includes("ఆరతి")) return "anim-aarti";
  return "anim-generic";
}

function spawnWaterDrops() {
  for (let i = 0; i < 10; i++) {
    const drop = document.createElement("div");
    drop.className = "anim-water-drop";
    drop.style.left = 20 + Math.random() * 60 + "%";
    drop.style.animationDelay = Math.random() * 0.4 + "s";
    stage.appendChild(drop);
    setTimeout(() => drop.remove(), 1200);
  }
}

function spawnFlowers() {
  const emojis = ["🌸", "🌺", "🌼", "🪷"];
  for (let i = 0; i < 8; i++) {
    const flower = document.createElement("div");
    flower.className = "anim-flower";
    flower.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    flower.style.left = 10 + Math.random() * 80 + "%";
    flower.style.animationDelay = Math.random() * 0.5 + "s";
    stage.appendChild(flower);
    setTimeout(() => flower.remove(), 1900);
  }
}

function spawnFoodPlate() {
  const plate = document.createElement("div");
  plate.className = "anim-food-plate";
  plate.innerText = "🍛";
  plate.style.left = "42%";
  stage.appendChild(plate);
  setTimeout(() => plate.remove(), 1300);
}

function spawnAartiRing() {
  const ring = document.createElement("div");
  ring.className = "anim-aarti-ring";
  stage.appendChild(ring);
  setTimeout(() => ring.remove(), 3300);
}

function playAnimation(animClass) {
  if (animClass === "anim-water") { spawnWaterDrops(); return; }
  if (animClass === "anim-flower") { spawnFlowers(); return; }
  if (animClass === "anim-food") { spawnFoodPlate(); return; }
  if (animClass === "anim-aarti") { spawnAartiRing(); return; }

  // lamp-glow and generic apply directly to the idol image
  idolImg.classList.remove("anim-lamp-glow", "anim-generic-sparkle");
  void idolImg.offsetWidth; // restart animation
  idolImg.classList.add(animClass === "anim-lamp-glow" ? "anim-lamp-glow" : "anim-generic-sparkle");
}

async function loadGodAndRituals() {
  if (!godId) {
    godNameEl.innerText = "దేవుడు కనబడలేదు";
    return;
  }

  const godSnap = await getDoc(doc(db, "poojaGods", godId));
  if (!godSnap.exists()) {
    godNameEl.innerText = "దేవుడు కనబడలేదు";
    return;
  }

  const god = godSnap.data();
  godNameEl.innerText = god.name;
  idolImg.src = god.image;
  idolImg.alt = god.name;

  // try to play bell on load
  bellSound.play().catch(() => {});

  const allRitualsSnap = await getDocs(collection(db, "poojaRituals"));
  rituals = allRitualsSnap.docs
    .filter((d) => d.data().godId === godId)
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (rituals.length === 0) {
    buttonsBox.innerHTML = `<p style="color:white;">ఇంకా ఆచారాలు జోడించలేదు.</p>`;
    return;
  }

  buttonsBox.innerHTML = "";
  rituals.forEach((ritual) => {
    const btn = document.createElement("button");
    btn.className = "pooja-ritual-btn";
    btn.dataset.id = ritual.id;
    btn.innerText = ritual.name;
    btn.addEventListener("click", () => performRitual(ritual, btn));
    buttonsBox.appendChild(btn);
  });
}

function performRitual(ritual, btn) {
  mantraBox.innerText = ritual.mantraText || "";
  mantraBox.classList.add("show");

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (ritual.audioUrl) {
    currentAudio = new Audio(ritual.audioUrl);
    currentAudio.play().catch(() => {});
  }

  const animClass = pickAnimationClass(ritual.name);
  playAnimation(animClass);

  btn.classList.add("ritual-done");
  doneRitualIds.add(ritual.id);

  if (doneRitualIds.size === rituals.length) {
    completionMsg.classList.add("show");
    savePoojaProgress();
  }
}

async function savePoojaProgress() {
  const today = getTodayString();
  const user = auth.currentUser;

  if (user) {
    const progressId = `${user.uid}_${godId}_${today}`;
    await setDoc(doc(db, "poojaProgress", progressId), {
      uid: user.uid,
      godId,
      date: today,
      completedAt: serverTimestamp()
    });
  } else {
    let stored = JSON.parse(localStorage.getItem("poojaProgress") || "{}");
    if (stored.date !== today) {
      stored = { date: today, gods: [] };
    }
    if (!stored.gods.includes(godId)) {
      stored.gods.push(godId);
    }
    localStorage.setItem("poojaProgress", JSON.stringify(stored));
  }
}

loadGodAndRituals();
