import {
  db, ref, set, get, update, remove, push, onValue,
  onDisconnect, serverTimestamp, runTransaction
} from "./firebase-config.js";
import { initCanvas } from "./canvas.js";
import { getWordChoices } from "./words.js";
import { sfx } from "./sfx.js";
import { pickBotWord, getDoodleStrokes, botGuessPlan, maybeWrongGuessDelay, randomFillerGuess, isBotPlayer } from "./bots.js";

const AVATAR_COLORS = ["#ff6b6b","#ffa94d","#ffd43b","#69db7c","#4ecdc4","#4dabf7","#845ef7","#f06595"];
const AVATAR_EMOJIS = ["😀","😎","🤖","🐱","🐶","🦊","🐼","👽","🧙","🦄","🐸","🦖"];

let roomId, myUid, myName, isHost = false;
let roomMetaCache = {}, playersCache = {};
let canvasApi = null;
let localGuessedTimer = null;
let hostTickInterval = null;
let onGameEndCb = null;
let botTimeouts = [];
let lastBotPhaseKey = null;
let clientTickInterval = null;
let currentEls = null;

export function avatarFor(index) {
  return { emoji: AVATAR_EMOJIS[index % AVATAR_EMOJIS.length], color: AVATAR_COLORS[index % AVATAR_COLORS.length] };
}
export const AVATAR_COUNT = AVATAR_EMOJIS.length;

export function initGame({ roomIdArg, uid, name, canvasEl, els, onGameEnd }) {
  roomId = roomIdArg; myUid = uid; myName = name; onGameEndCb = onGameEnd; currentEls = els;

  canvasApi = initCanvas({ canvasEl, roomId, uid, isDrawer: () => roomMetaCache.currentDrawerId === myUid });
  setupToolbar(els);

  // Ticks locally on every client (not just the host) so the countdown
  // visibly moves every second instead of only updating when a Firebase
  // write happens to arrive.
  clearInterval(clientTickInterval);
  clientTickInterval = setInterval(() => renderTopbar(currentEls), 250);

  const metaRef = ref(db, `rooms/${roomId}/meta`);
  const playersRef = ref(db, `rooms/${roomId}/players`);
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  const reactionsRef = ref(db, `rooms/${roomId}/reactions`);

  onValue(metaRef, (snap) => {
    const prevStatus = roomMetaCache.status;
    roomMetaCache = snap.val() || {};
    isHost = roomMetaCache.hostId === myUid;
    renderTopbar(els);
    handleStatusChange(prevStatus, roomMetaCache.status, els);
    if (isHost) driveHostLogic(metaRef, playersRef);
    if (isHost) handleBotOrchestration(metaRef, playersRef);
  });

  onValue(playersRef, (snap) => {
    playersCache = snap.val() || {};
    renderPlayers(els);
  });

  onValue(chatRef, (snap) => renderChat(els, snap.val() || {}));

  onValue(reactionsRef, (snap) => {
    const val = snap.val() || {};
    Object.entries(val).forEach(([key, r]) => {
      if (r._shown) return;
      showFloatingEmoji(els, r.emoji);
    });
  });

  els.chatSendBtn.onclick = () => sendGuess(els, chatRef, playersRef, metaRef);
  els.chatInput.onkeydown = (e) => { if (e.key === "Enter") sendGuess(els, chatRef, playersRef, metaRef); };
  els.emojiButtons.forEach(b => b.onclick = () => {
    push(reactionsRef, { uid: myUid, emoji: b.dataset.emoji, t: Date.now() });
    sfx.reaction();
  });
}

// ---------- Host-driven state machine ----------
function driveHostLogic(metaRef, playersRef) {
  clearInterval(hostTickInterval);
  hostTickInterval = setInterval(() => hostTick(metaRef, playersRef), 300);
  hostTick(metaRef, playersRef);
}

// Called right after a guess is scored so the round can end the instant
// everyone has guessed, instead of waiting for the next tick.
function checkRoundEndNow(metaRef, playersRef) {
  if (!isHost) return;
  const m = roomMetaCache;
  if (m.status === "drawing" && everyoneGuessed()) {
    endTurn(metaRef, playersRef);
  }
}

function hostTick(metaRef, playersRef) {
  const m = roomMetaCache;
  if (!m || !m.status) return;
  const now = Date.now();

  if (m.status === "choosing" && m.chooseDeadline && now > m.chooseDeadline) {
    // Auto-pick first word if drawer stalls
    beginDrawingPhase(metaRef, (m.wordChoices && m.wordChoices[0]) || "cat");
    return;
  }

  if (m.status === "drawing") {
    const allGuessed = everyoneGuessed();
    if ((m.roundEndAt && now > m.roundEndAt) || allGuessed) {
      endTurn(metaRef, playersRef);
    }
  }

  if (m.status === "roundEnd" && m.roundEndRevealUntil && now > m.roundEndRevealUntil) {
    advanceTurn(metaRef, playersRef);
  }
}

function everyoneGuessed() {
  const ids = Object.keys(playersCache).filter(id => id !== roomMetaCache.currentDrawerId && playersCache[id].connected !== false);
  if (ids.length === 0) return false;
  return ids.every(id => playersCache[id].guessedThisRound);
}

// ---------- Bot orchestration (host-only) ----------
function clearBotTimeouts() {
  botTimeouts.forEach(id => clearTimeout(id));
  botTimeouts = [];
}

function handleBotOrchestration(metaRef, playersRef) {
  const m = roomMetaCache;
  if (!m || !m.status) return;
  const key = `${m.status}|${m.currentDrawerId}|${m.turnIndex}|${m.currentRoundNum}`;
  if (key === lastBotPhaseKey) return;
  lastBotPhaseKey = key;
  clearBotTimeouts();

  const drawer = playersCache[m.currentDrawerId];
  const drawerIsBot = isBotPlayer(drawer);

  if (m.status === "choosing" && drawerIsBot) {
    const word = pickBotWord(m.wordChoices);
    const delay = 1400 + Math.random() * 2200;
    botTimeouts.push(setTimeout(() => {
      if (roomMetaCache.status === "choosing" && roomMetaCache.currentDrawerId === m.currentDrawerId) {
        beginDrawingPhase(metaRef, word);
      }
    }, delay));
    return;
  }

  if (m.status === "drawing" && m.currentWord) {
    const roundEndAt = m.roundEndAt || (Date.now() + (m.drawTime || 60) * 1000);
    const drawTimeMs = Math.max(1000, roundEndAt - Date.now());

    if (drawerIsBot) {
      const strokes = getDoodleStrokes(m.currentWord);
      const perStroke = Math.max(350, Math.min(1400, (drawTimeMs * 0.7) / strokes.length));
      strokes.forEach((pts, i) => {
        const t = 700 + i * perStroke + Math.random() * 250;
        botTimeouts.push(setTimeout(() => {
          if (roomMetaCache.status !== "drawing" || roomMetaCache.currentWord !== m.currentWord) return;
          push(ref(db, `rooms/${roomId}/strokes`), {
            tool: "pen", color: "#1c1c1c", size: 6,
            points: pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })), t: Date.now()
          });
        }, t));
      });
    }

    const botGuessers = Object.entries(playersCache).filter(
      ([id, p]) => isBotPlayer(p) && id !== m.currentDrawerId && p.connected !== false && !p.guessedThisRound
    );
    if (botGuessers.length) {
      const plan = botGuessPlan(botGuessers.length, drawTimeMs);
      botGuessers.forEach(([id, p], i) => {
        const { willGuess, delayMs } = plan[i];
        if (!willGuess) return;
        const wrongDelay = maybeWrongGuessDelay(delayMs);
        if (wrongDelay) {
          botTimeouts.push(setTimeout(() => {
            if (roomMetaCache.status !== "drawing" || roomMetaCache.currentWord !== m.currentWord) return;
            push(ref(db, `rooms/${roomId}/chat`), { uid: id, name: p.name, type: "guess", text: randomFillerGuess(m.currentWord), t: Date.now() });
          }, wrongDelay));
        }
        botTimeouts.push(setTimeout(() => botGuessCorrect(id, p, m), delayMs));
      });
    }
  }
}

async function botGuessCorrect(botId, botPlayer, m) {
  if (roomMetaCache.status !== "drawing" || roomMetaCache.currentWord !== m.currentWord) return;
  const guessResult = await runTransaction(ref(db, `rooms/${roomId}/players/${botId}/guessedThisRound`), (cur) => (cur ? undefined : true));
  if (!guessResult.committed) return;
  const timeLeftMs = Math.max(0, (roomMetaCache.roundEndAt || 0) - Date.now());
  const totalMs = (roomMetaCache.drawTime || 60) * 1000;
  const speedBonus = Math.round((timeLeftMs / totalMs) * 500);
  const points = 100 + speedBonus;
  await runTransaction(ref(db, `rooms/${roomId}/players/${botId}/score`), (cur) => (cur || 0) + points);
  await runTransaction(ref(db, `rooms/${roomId}/players/${m.currentDrawerId}/score`), (cur) => (cur || 0) + 25);
  await push(ref(db, `rooms/${roomId}/chat`), { uid: botId, name: botPlayer.name, type: "correct", text: "guessed the word!", t: Date.now() });
  checkRoundEndNow(ref(db, `rooms/${roomId}/meta`), ref(db, `rooms/${roomId}/players`));
}

// Self-contained on purpose: this runs from the lobby, BEFORE initGame()
// has been called for this room, so it must not depend on the module-level
// roomId / myUid / roomMetaCache (they're only set once the game screen
// loads). Takes everything it needs as arguments instead.
export async function hostStartGame(roomIdArg, hostUid, settings) {
  const metaRef = ref(db, `rooms/${roomIdArg}/meta`);
  const playersRef = ref(db, `rooms/${roomIdArg}/players`);

  const [metaSnap, playersSnap] = await Promise.all([get(metaRef), get(playersRef)]);
  const prevMeta = metaSnap.val() || {};
  const players = playersSnap.val() || {};
  const order = Object.keys(players);
  if (order.length === 0) return;

  const resets = {};
  order.forEach(id => resets[`${id}/guessedThisRound`] = false);
  await update(playersRef, resets);
  await remove(ref(db, `rooms/${roomIdArg}/strokes`));
  await remove(ref(db, `rooms/${roomIdArg}/liveStroke`));

  const choices = getWordChoices(settings.pack, settings.difficulty, 3);
  await update(metaRef, {
    hostId: hostUid, isPublic: prevMeta.isPublic || false,
    pack: settings.pack, difficulty: settings.difficulty, rounds: Number(settings.rounds),
    drawTime: Number(settings.drawTime), hints: settings.hints,
    turnOrder: order, turnIndex: 0, currentRoundNum: 1,
    status: "choosing", currentDrawerId: order[0], wordChoices: choices,
    currentWord: null, chooseDeadline: Date.now() + 10000
  });
}

async function advanceTurn(metaRef, playersRef) {
  const m = roomMetaCache;
  let nextIndex = (m.turnIndex ?? -1) + 1;
  let roundNum = m.currentRoundNum || 1;
  const order = (m.turnOrder || []).filter(id => playersCache[id] && playersCache[id].connected !== false);
  if (order.length === 0) return;

  if (nextIndex >= order.length) {
    nextIndex = 0;
    roundNum += 1;
  }
  if (roundNum > (m.rounds || 3)) {
    await update(metaRef, { status: "gameEnd" });
    if (onGameEndCb) onGameEndCb();
    return;
  }

  const drawerId = order[nextIndex];
  // reset guessed flags
  const resets = {};
  Object.keys(playersCache).forEach(id => resets[`${id}/guessedThisRound`] = false);
  if (Object.keys(resets).length) await update(playersRef, resets);
  await remove(ref(db, `rooms/${roomId}/strokes`));
  await remove(ref(db, `rooms/${roomId}/liveStroke`));

  const choices = getWordChoices(m.pack || "classic", m.difficulty || "mixed", 3);
  await update(metaRef, {
    status: "choosing", turnIndex: nextIndex, currentRoundNum: roundNum,
    currentDrawerId: drawerId, wordChoices: choices, currentWord: null,
    chooseDeadline: Date.now() + 10000, turnOrder: order
  });
}

export async function drawerPickWord(word) {
  const metaRef = ref(db, `rooms/${roomId}/meta`);
  await beginDrawingPhase(metaRef, word);
}

async function beginDrawingPhase(metaRef, word) {
  endingTurn = false;
  const m = roomMetaCache;
  await update(metaRef, {
    status: "drawing", currentWord: word,
    roundEndAt: Date.now() + (m.drawTime || 60) * 1000
  });
}

let endingTurn = false;
async function endTurn(metaRef, playersRef) {
  if (endingTurn || roomMetaCache.status !== "drawing") return;
  endingTurn = true;
  await update(metaRef, { status: "roundEnd", roundEndRevealUntil: Date.now() + 4000 });
  await remove(ref(db, `rooms/${roomId}/liveStroke`));
  await push(ref(db, `rooms/${roomId}/chat`), {
    uid: "system", name: "System", type: "system",
    text: `The word was: ${roomMetaCache.currentWord}`, t: Date.now()
  });
}

// ---------- Guessing ----------
async function sendGuess(els, chatRef, playersRef, metaRef) {
  const text = els.chatInput.value.trim();
  if (!text) return;
  els.chatInput.value = "";
  const m = roomMetaCache;
  const isDrawing = m.status === "drawing";
  const alreadyGuessed = playersCache[myUid] && playersCache[myUid].guessedThisRound;
  const amDrawer = m.currentDrawerId === myUid;

  if (isDrawing && !amDrawer && !alreadyGuessed && m.currentWord &&
      text.toLowerCase() === String(m.currentWord).toLowerCase()) {
    const guessResult = await runTransaction(ref(db, `rooms/${roomId}/players/${myUid}/guessedThisRound`), (cur) => {
      if (cur) return; // already guessed, abort
      return true;
    });
    if (guessResult.committed) {
      const timeLeftMs = Math.max(0, (m.roundEndAt || 0) - Date.now());
      const totalMs = (m.drawTime || 60) * 1000;
      const speedBonus = Math.round((timeLeftMs / totalMs) * 500);
      const points = 100 + speedBonus;
      await runTransaction(ref(db, `rooms/${roomId}/players/${myUid}/score`), (cur) => (cur || 0) + points);
      await runTransaction(ref(db, `rooms/${roomId}/players/${m.currentDrawerId}/score`), (cur) => (cur || 0) + 25);
      await push(chatRef, { uid: myUid, name: myName, type: "correct", text: "guessed the word!", t: Date.now() });
      sfx.correct();
      checkRoundEndNow(metaRef, playersRef);
    }
    return;
  }
  await push(chatRef, { uid: myUid, name: myName, type: "guess", text, t: Date.now() });
}

// ---------- Rendering ----------
function handleStatusChange(prev, cur, els) {
  if (prev === cur) return;
  if (cur === "choosing") {
    sfx.roundStart();
    els.chatLog.innerHTML = "";
    canvasApi.resetLocalCanvas();
    if (roomMetaCache.currentDrawerId === myUid) {
      showWordChoice(els);
    } else {
      els.wordChoiceOverlay.classList.add("hidden");
    }
  }
  if (cur === "drawing") {
    els.wordChoiceOverlay.classList.add("hidden");
  }
  if (cur === "gameEnd" && onGameEndCb) {
    onGameEndCb();
  }
}

function showWordChoice(els) {
  els.wordChoiceOverlay.classList.remove("hidden");
  els.wordChoiceBtns.innerHTML = "";
  (roomMetaCache.wordChoices || []).forEach(w => {
    const b = document.createElement("button");
    b.className = "btn-accent";
    b.textContent = w;
    b.onclick = () => { els.wordChoiceOverlay.classList.add("hidden"); drawerPickWord(w); };
    els.wordChoiceBtns.appendChild(b);
  });
}

function renderTopbar(els) {
  const m = roomMetaCache;
  els.roundLabel.textContent = `Round ${Math.min(m.currentRoundNum || 1, m.rounds || 1)}/${m.rounds || "-"}`;
  const amDrawer = m.currentDrawerId === myUid;
  const drawerName = (playersCache[m.currentDrawerId] || {}).name || "...";

  els.timerCircle.classList.remove("urgent", "time-up");

  if (m.status === "drawing" && m.currentWord) {
    if (amDrawer) {
      els.wordHint.textContent = m.currentWord;
    } else {
      const revealCount = m.hints === "on" ? Math.max(1, Math.floor(m.currentWord.length / 4)) : 0;
      els.wordHint.textContent = maskWord(m.currentWord, revealCount);
    }
    const msLeft = (m.roundEndAt || Date.now()) - Date.now();
    const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));
    if (msLeft <= 0) {
      els.timerCircle.textContent = "0";
      els.timerCircle.classList.add("time-up");
      els.wordHint.textContent = amDrawer ? `Time's up! (${m.currentWord})` : "⏰ Time's up!";
    } else {
      els.timerCircle.textContent = secsLeft;
      if (secsLeft <= 5) els.timerCircle.classList.add("urgent");
    }
  } else if (m.status === "roundEnd" && m.currentWord) {
    els.wordHint.textContent = `${drawerName} was drawing: ${m.currentWord}`;
    els.timerCircle.textContent = "✓";
  } else if (m.status === "choosing") {
    const secsLeft = Math.max(0, Math.ceil(((m.chooseDeadline || Date.now()) - Date.now()) / 1000));
    els.wordHint.textContent = amDrawer ? "Pick a word to draw!" : `${drawerName} is choosing a word...`;
    els.timerCircle.textContent = secsLeft > 0 ? secsLeft : "⏳";
    if (els.wordChoiceTimer) {
      els.wordChoiceTimer.textContent = secsLeft;
      els.wordChoiceTimer.classList.toggle("urgent", secsLeft <= 4);
    }
  } else {
    els.wordHint.textContent = "";
    els.timerCircle.textContent = "-";
  }

  els.drawerToolbar.style.display = amDrawer && m.status === "drawing" ? "flex" : "none";
  els.sizeRow.style.display = amDrawer && m.status === "drawing" ? "flex" : "none";
}

function maskWord(word, revealCount) {
  const chars = word.split("");
  const revealIdx = new Set();
  while (revealIdx.size < revealCount && revealIdx.size < chars.length - 1) {
    revealIdx.add(Math.floor(Math.random() * chars.length));
  }
  return chars.map((c, i) => (c === " " ? "  " : (revealIdx.has(i) ? c : "_") + " ")).join("").trim();
}

function renderPlayers(els) {
  const drawerId = roomMetaCache.currentDrawerId;
  const sorted = Object.entries(playersCache).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
  const html = sorted.map(([id, p]) => {
    const av = avatarFor(p.avatarIndex || 0);
    const isDrawing = id === drawerId;
    const guessed = p.guessedThisRound;
    return `<div class="player-row ${isDrawing ? "drawing" : ""} ${guessed ? "correct" : ""}">
      <div class="mini-avatar" style="background:${av.color}">${av.emoji}</div>
      <div class="pname">${escapeHtml(p.name || "Player")}${isDrawing ? " ✏️" : ""}${guessed ? " ✅" : ""}</div>
      <div class="pscore">${p.score || 0}</div>
    </div>`;
  }).join("");
  els.gamePlayers.innerHTML = html;
  els.lobbyPlayers.innerHTML = sorted.map(([id, p]) => {
    const av = avatarFor(p.avatarIndex || 0);
    return `<div class="player-row"><div class="mini-avatar" style="background:${av.color}">${av.emoji}</div><div class="pname">${escapeHtml(p.name || "Player")}</div></div>`;
  }).join("");
}

function renderChat(els, chat) {
  const entries = Object.values(chat).sort((a, b) => a.t - b.t).slice(-60);
  els.chatLog.innerHTML = entries.map(m => {
    if (m.type === "system") return `<div class="chat-msg system">${escapeHtml(m.text)}</div>`;
    if (m.type === "correct") return `<div class="chat-msg correct">${escapeHtml(m.name)} ${escapeHtml(m.text)}</div>`;
    return `<div class="chat-msg"><span class="who">${escapeHtml(m.name)}:</span> ${escapeHtml(m.text)}</div>`;
  }).join("");
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function showFloatingEmoji(els, emoji) {
  const wrap = els.canvasPanel;
  const div = document.createElement("div");
  div.className = "floating-emoji";
  div.textContent = emoji;
  div.style.left = (30 + Math.random() * 60) + "%";
  div.style.bottom = "10px";
  wrap.style.position = "relative";
  wrap.appendChild(div);
  setTimeout(() => div.remove(), 1600);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// ---------- Toolbar ----------
function setupToolbar(els) {
  canvasApi.COLORS.forEach((c, i) => {
    const sw = document.createElement("div");
    sw.className = "swatch" + (i === 0 ? " active" : "");
    sw.style.background = c;
    sw.onclick = () => {
      canvasApi.setColor(c);
      els.palette.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
      sw.classList.add("active");
    };
    els.palette.appendChild(sw);
  });
  const tools = { toolPen: "pen", toolFill: "fill", toolEraser: "eraser" };
  Object.entries(tools).forEach(([id, tool]) => {
    els.toolButtons[id].onclick = () => {
      canvasApi.setTool(tool);
      Object.values(els.toolButtons).forEach(b => b.classList.remove("active"));
      els.toolButtons[id].classList.add("active");
    };
  });
  els.toolButtons.toolUndo.onclick = () => canvasApi.undoLast();
  els.toolButtons.toolClear.onclick = () => canvasApi.clearAll();
  els.brushSize.oninput = (e) => canvasApi.setSize(Number(e.target.value));
}

export function stopHostLoop() { clearInterval(hostTickInterval); clearInterval(clientTickInterval); clearBotTimeouts(); }
