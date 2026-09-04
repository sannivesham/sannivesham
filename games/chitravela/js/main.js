import {
  db, auth, ref, set, get, update, remove, push, onValue,
  onDisconnect, serverTimestamp, runTransaction,
  signInAnonymously, onAuthStateChanged
} from "./firebase-config.js";
import { initGame, hostStartGame, avatarFor, AVATAR_COUNT } from "./game.js";
import { sfx } from "./sfx.js";
import { ensureBots } from "./bots.js";

const screens = {
  home: document.getElementById("screen-home"),
  lobby: document.getElementById("screen-lobby"),
  game: document.getElementById("screen-game"),
  results: document.getElementById("screen-results"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");

  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.style.display = (name === "game") ? "none" : "block";
  }
  window.scrollTo(0, 0);
  updateVisualViewport();
}

// ---------- Mobile Viewport Lock (prevents page scrolling when keyboard opens) ----------
function updateVisualViewport() {
  if (window.visualViewport) {
    const h = window.visualViewport.height;
    document.documentElement.style.setProperty("--vvh", `${h}px`);
    const isKeyboardOpen = h < window.innerHeight * 0.78;
    document.body.classList.toggle("keyboard-open", isKeyboardOpen);
    window.scrollTo(0, 0);
  } else {
    document.documentElement.style.setProperty("--vvh", `${window.innerHeight}px`);
    document.body.classList.remove("keyboard-open");
  }
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateVisualViewport);
  window.visualViewport.addEventListener("scroll", () => window.scrollTo(0, 0));
}
window.addEventListener("resize", updateVisualViewport);
window.addEventListener("orientationchange", () => setTimeout(updateVisualViewport, 150));
updateVisualViewport();

const chatInputEl = document.getElementById("chatInput");
if (chatInputEl) {
  chatInputEl.addEventListener("focus", () => {
    document.body.classList.add("keyboard-open");
    setTimeout(updateVisualViewport, 60);
    setTimeout(updateVisualViewport, 200);
  });
  chatInputEl.addEventListener("blur", () => {
    setTimeout(() => {
      document.body.classList.remove("keyboard-open");
      updateVisualViewport();
    }, 120);
  });
}

// ---------- Theme ----------
const themeBtn = document.getElementById("themeBtn");
let theme = localStorage.getItem("chitravela_theme") || "dark";
applyTheme();
themeBtn.onclick = () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("chitravela_theme", theme);
  applyTheme();
};
function applyTheme() {
  document.body.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "\u2600\uFE0F" : "\u{1F319}";
}

// ---------- Avatar + name ----------
let avatarIndex = Number(localStorage.getItem("chitravela_avatar") || 0);
const avatarCircle = document.getElementById("avatarCircle");
const nameInput = document.getElementById("nameInput");
nameInput.value = localStorage.getItem("chitravela_name") || "";
renderAvatar();
document.getElementById("avatarPrev").onclick = () => {
  avatarIndex = (avatarIndex - 1 + AVATAR_COUNT) % AVATAR_COUNT;
  renderAvatar();
};
document.getElementById("avatarNext").onclick = () => {
  avatarIndex = (avatarIndex + 1) % AVATAR_COUNT;
  renderAvatar();
};
function renderAvatar() {
  const av = avatarFor(avatarIndex);
  avatarCircle.textContent = av.emoji;
  avatarCircle.style.background = av.color;
  localStorage.setItem("chitravela_avatar", avatarIndex);
}

function getName() {
  const n = nameInput.value.trim() || "Player" + Math.floor(Math.random() * 1000);
  localStorage.setItem("chitravela_name", n);
  return n;
}

// ---------- Auth ----------
let uid = null;
const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) { uid = user.uid; resolve(uid); }
    else signInAnonymously(auth).catch(err => showHomeError("Sign-in failed: " + err.message));
  });
});

function showHomeError(msg) {
  document.getElementById("homeError").textContent = msg;
  setTimeout(() => document.getElementById("homeError").textContent = "", 4000);
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

let currentRoomId = null;
let isRoomHost = false;

async function joinRoomAsPlayer(roomId, name) {
  await authReady;
  currentRoomId = roomId;
  const playerRef = ref(db, `rooms/${roomId}/players/${uid}`);
  const existing = await get(playerRef);
  if (!existing.exists()) {
    await set(playerRef, { name, avatarIndex, score: 0, connected: true, joinedAt: Date.now(), guessedThisRound: false });
  } else {
    await update(playerRef, { connected: true, name, avatarIndex });
  }
  onDisconnect(playerRef).update({ connected: false });
  localStorage.setItem("chitravela_room", roomId);
  sfx.join();
}

async function createRoom(isPublic) {
  await authReady;
  const name = getName();
  const roomId = makeRoomCode();
  await set(ref(db, `rooms/${roomId}/meta`), {
    hostId: uid, isPublic, status: "lobby",
    pack: "classic", difficulty: "mixed", rounds: 3, drawTime: 60, hints: "on",
    turnOrder: [], turnIndex: -1, currentRoundNum: 1, createdAt: Date.now()
  });
  await joinRoomAsPlayer(roomId, name);
  isRoomHost = true;
  if (isPublic) {
    await set(ref(db, `publicRooms/${roomId}`), { playerCount: 1, createdAt: Date.now() });
    onDisconnect(ref(db, `publicRooms/${roomId}`)).remove();
  }
  enterLobby(roomId);
}

async function addToTurnOrderIfMissing(roomId, playerUid) {
  const metaRef = ref(db, `rooms/${roomId}/meta`);
  await runTransaction(metaRef, (meta) => {
    if (!meta) return meta;
    const order = meta.turnOrder || [];
    if (!order.includes(playerUid)) {
      meta.turnOrder = [...order, playerUid];
    }
    return meta;
  });
}

async function joinRoomByCode(code) {
  await authReady;
  const roomId = code.trim().toUpperCase();
  const metaSnap = await get(ref(db, `rooms/${roomId}/meta`));
  if (!metaSnap.exists()) { showHomeError("Room not found. Check the code."); return; }
  const meta = metaSnap.val();
  await joinRoomAsPlayer(roomId, getName());
  isRoomHost = meta.hostId === uid;
  if (meta.status && meta.status !== "lobby") {
    await addToTurnOrderIfMissing(roomId, uid);
    currentRoomId = roomId;
    enterGame(roomId);
  } else {
    enterLobby(roomId);
  }
}

async function playPublicMatch() {
  await authReady;
  const name = getName();
  const publicSnap = await get(ref(db, "publicRooms"));
  const rooms = publicSnap.val() || {};
  const openRoomId = Object.keys(rooms).find(id => (rooms[id].playerCount || 0) < 12);
  if (openRoomId) {
    await joinRoomAsPlayer(openRoomId, name);
    await runTransaction(ref(db, `publicRooms/${openRoomId}/playerCount`), (c) => (c || 0) + 1);
    isRoomHost = false;
    const metaSnap = await get(ref(db, `rooms/${openRoomId}/meta`));
    const meta = metaSnap.val() || {};
    if (meta.status && meta.status !== "lobby") {
      await addToTurnOrderIfMissing(openRoomId, uid);
      currentRoomId = openRoomId;
      enterGame(openRoomId);
    } else {
      enterLobby(openRoomId);
    }
  } else {
    await createRoom(true);
    ensureBots(currentRoomId);
  }
}

document.getElementById("createRoomBtn").onclick = () => createRoom(false);
document.getElementById("playPublicBtn").onclick = () => playPublicMatch();
document.getElementById("joinRoomBtn").onclick = () => {
  const code = document.getElementById("joinCodeInput").value;
  if (!code.trim()) { showHomeError("Enter a room code."); return; }
  joinRoomByCode(code);
};

// ---------- Lobby ----------
const lobbyEls = {
  code: document.getElementById("lobbyCode"),
  players: document.getElementById("lobbyPlayers"),
  settingsCard: document.getElementById("lobbySettingsCard"),
};
function enterLobby(roomId) {
  currentRoomId = roomId;
  lobbyEls.code.textContent = roomId;
  showScreen("lobby");
  onValue(ref(db, `rooms/${roomId}/meta`), (snap) => {
    const m = snap.val();
    if (!m) return;
    isRoomHost = m.hostId === uid;
    lobbyEls.settingsCard.style.display = isRoomHost ? "block" : "none";
    if (m.status && m.status !== "lobby") enterGame(roomId);
  });
  onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
    const players = snap.val() || {};
    lobbyEls.players.innerHTML = Object.values(players).map(p => {
      const av = avatarFor(p.avatarIndex || 0);
      return `<div class="player-row"><div class="mini-avatar" style="background:${av.color}">${av.emoji}</div><div class="pname">${p.name}</div></div>`;
    }).join("");
  });
}

document.getElementById("startGameBtn").onclick = async () => {
  const settings = {
    pack: document.getElementById("packSelect").value,
    difficulty: document.getElementById("difficultySelect").value,
    rounds: document.getElementById("roundsSelect").value,
    drawTime: document.getElementById("drawTimeSelect").value,
    hints: document.getElementById("hintsSelect").value,
  };
  await hostStartGame(currentRoomId, uid, settings);
};

document.getElementById("copyLinkBtn").onclick = () => {
  const url = `${location.origin}${location.pathname}?room=${currentRoomId}`;
  navigator.clipboard?.writeText(url);
  const btn = document.getElementById("copyLinkBtn");
  const old = btn.textContent;
  btn.textContent = "\u2705 Copied!";
  setTimeout(() => btn.textContent = old, 1500);
};

async function leavePublicCountIfNeeded(roomId) {
  const metaSnap = await get(ref(db, `rooms/${roomId}/meta`));
  if (!metaSnap.exists() || !metaSnap.val().isPublic) return;
  const result = await runTransaction(ref(db, `publicRooms/${roomId}/playerCount`), (c) => Math.max(0, (c || 1) - 1));
  if (result.committed && (result.snapshot.val() || 0) <= 0) {
    await remove(ref(db, `publicRooms/${roomId}`));
  }
}

document.getElementById("leaveLobbyBtn").onclick = async () => {
  if (currentRoomId && uid) {
    await remove(ref(db, `rooms/${currentRoomId}/players/${uid}`));
    await leavePublicCountIfNeeded(currentRoomId);
  }
  localStorage.removeItem("chitravela_room");
  currentRoomId = null;
  showScreen("home");
};

// ---------- In-game Settings Modal & Actions ----------
const gameSettingsBtn = document.getElementById("gameSettingsBtn");
const gameSettingsModal = document.getElementById("gameSettingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const toggleSoundBtn = document.getElementById("toggleSoundBtn");
const toggleThemeGameBtn = document.getElementById("toggleThemeGameBtn");
const leaveGameMidBtn = document.getElementById("leaveGameMidBtn");

if (gameSettingsBtn) {
  gameSettingsBtn.onclick = () => gameSettingsModal.classList.toggle("hidden");
}
if (closeSettingsBtn) {
  closeSettingsBtn.onclick = () => gameSettingsModal.classList.add("hidden");
}
if (toggleSoundBtn) {
  let soundOn = true;
  toggleSoundBtn.onclick = () => {
    soundOn = !soundOn;
    toggleSoundBtn.textContent = soundOn ? "On" : "Off";
  };
}
if (toggleThemeGameBtn) {
  toggleThemeGameBtn.onclick = () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("chitravela_theme", theme);
    applyTheme();
  };
}
if (leaveGameMidBtn) {
  leaveGameMidBtn.onclick = async () => {
    gameSettingsModal.classList.add("hidden");
    if (currentRoomId && uid) {
      await remove(ref(db, `rooms/${currentRoomId}/players/${uid}`));
      await leavePublicCountIfNeeded(currentRoomId);
    }
    localStorage.removeItem("chitravela_room");
    gameStarted = false;
    showScreen("home");
  };
}

// ---------- Game screen wiring ----------
let gameStarted = false;
function enterGame(roomId) {
  showScreen("game");
  if (gameStarted) return;
  gameStarted = true;
  const els = {
    wordHint: document.getElementById("wordHint"),
    guessHeading: document.getElementById("guessHeading"),
    timerCircle: document.getElementById("timerCircle"),
    timerNum: document.getElementById("timerNum"),
    roundLabel: document.getElementById("roundLabel"),
    drawerToolbar: document.getElementById("drawerToolbar"),
    gamePlayers: document.getElementById("gamePlayers"),
    lobbyPlayers: document.getElementById("lobbyPlayers"),
    chatLog: document.getElementById("chatLog"),
    chatInput: document.getElementById("chatInput"),
    chatSendBtn: document.getElementById("chatSendBtn"),
    palette: document.getElementById("palette"),
    wordChoiceOverlay: document.getElementById("wordChoiceOverlay"),
    wordChoiceBtns: document.getElementById("wordChoiceBtns"),
    wordChoiceTimer: document.getElementById("wordChoiceTimer"),
    brushSize: document.getElementById("brushSize"),
    thumbUpBtn: document.getElementById("thumbUpBtn"),
    thumbDownBtn: document.getElementById("thumbDownBtn"),
    toolButtons: {
      toolPen: document.getElementById("toolPen"),
      toolFill: document.getElementById("toolFill"),
      toolEraser: document.getElementById("toolEraser"),
      toolUndo: document.getElementById("toolUndo"),
      toolClear: document.getElementById("toolClear"),
    },
  };
  initGame({
    roomIdArg: roomId, uid, name: getName(),
    canvasEl: document.getElementById("drawCanvas"), els,
    onGameEnd: () => showResults(roomId),
  });
}

// ---------- Results ----------
async function showResults(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  const players = Object.values(snap.val() || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  const podium = document.getElementById("podium");
  const medalClass = ["gold", "silver", "bronze"];
  podium.innerHTML = players.slice(0, 3).map((p, i) => {
    const av = avatarFor(p.avatarIndex || 0);
    return `<div class="podium-spot ${medalClass[i]}"><div style="font-size:1.6rem;">${av.emoji}</div><div>${p.name}</div><div>${p.score || 0}</div></div>`;
  }).join("");
  document.getElementById("finalScores").innerHTML = players.map((p, i) =>
    `<div class="player-row"><div class="pname">${i + 1}. ${p.name}</div><div class="pscore">${p.score || 0} pts</div></div>`
  ).join("");
  showScreen("results");
}

document.getElementById("backHomeBtn").onclick = async () => {
  if (currentRoomId && uid) {
    await remove(ref(db, `rooms/${currentRoomId}/players/${uid}`));
    await leavePublicCountIfNeeded(currentRoomId);
  }
  localStorage.removeItem("chitravela_room");
  gameStarted = false;
  showScreen("home");
};
document.getElementById("playAgainBtn").onclick = async () => {
  if (!currentRoomId) return;
  if (isRoomHost) {
    await update(ref(db, `rooms/${currentRoomId}/meta`), { status: "lobby", currentRoundNum: 1, turnIndex: -1 });
  }
  gameStarted = false;
  enterLobby(currentRoomId);
};

// ---------- Reconnect on load ----------
(async function tryReconnect() {
  await authReady;
  const params = new URLSearchParams(location.search);
  const linkRoom = params.get("room");
  const savedRoom = localStorage.getItem("chitravela_room");

  if (linkRoom) {
    const metaSnap = await get(ref(db, `rooms/${linkRoom}/meta`));
    if (metaSnap.exists()) {
      document.getElementById("joinCodeInput").value = linkRoom;
    }
    return;
  }
  if (savedRoom) {
    const metaSnap = await get(ref(db, `rooms/${savedRoom}/meta`));
    const playerSnap = await get(ref(db, `rooms/${savedRoom}/players/${uid}`));
    if (metaSnap.exists() && playerSnap.exists()) {
      offerReconnect(savedRoom, metaSnap.val());
    } else {
      localStorage.removeItem("chitravela_room");
    }
  }
})();

function offerReconnect(roomId, meta) {
  const banner = document.getElementById("reconnectBanner");
  const text = document.getElementById("reconnectText");
  text.textContent = meta.status === "lobby"
    ? `Rejoin your lobby (${roomId})?`
    : `Rejoin your game in progress (${roomId})?`;
  banner.classList.remove("hidden");

  document.getElementById("reconnectYesBtn").onclick = async () => {
    banner.classList.add("hidden");
    await update(ref(db, `rooms/${roomId}/players/${uid}`), { connected: true });
    isRoomHost = meta.hostId === uid;
    currentRoomId = roomId;
    if (meta.status === "lobby") enterLobby(roomId);
    else enterGame(roomId);
  };
  document.getElementById("reconnectNoBtn").onclick = async () => {
    banner.classList.add("hidden");
    localStorage.removeItem("chitravela_room");
    if (uid) {
      await remove(ref(db, `rooms/${roomId}/players/${uid}`));
      await leavePublicCountIfNeeded(roomId);
    }
  };
}