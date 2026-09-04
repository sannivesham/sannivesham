import {
  db, ref, set, get, update, remove, push, onValue,
  onDisconnect, serverTimestamp, runTransaction
} from "./firebase-config.js";
import { initCanvas } from "./canvas.js";
import { getWordChoices } from "./words.js";
import { sfx } from "./sfx.js";
import { pickBotWord, getDoodleStrokes, botGuessPlan, maybeWrongGuessDelay, randomFillerGuess, isBotPlayer } from "./bots.js";

const AVATAR_COLORS = ["#ff6b6b","#ffa94d","#ffd43b","#69db7c","#4ecdc4","#4dabf7","#845ef7","#f06595"];
const AVATAR_EMOJIS = [
  "\u{1F600}", "\u{1F60E}", "\u{1F916}", "\u{1F431}", "\u{1F436}", "\u{1F98A}",
  "\u{1F43C}", "\u{1F47D}", "\u{1F9D9}", "\u{1F984}", "\u{1F438}", "\u{1F996}"
];
const SUPERSCRIPTS = ["\u2070","\u00B9","\u00B2","\u00B3","\u2074","\u2075","\u2076","\u2077","\u2078","\u2079"];

let roomId, myUid, myName, isHost = false;
let roomMetaCache = {}, playersCache = {};
let canvasApi = null;
let hostTickInterval = null;
let onGameEndCb = null;
let botTimeouts = [];
let lastBotPhaseKey = null;
let clientTickInterval = null;
let currentEls = null;
let endingTurn = false;

export function avatarFor(index) {
  return { emoji: AVATAR_EMOJIS[index % AVATAR_EMOJIS.length], color: AVATAR_COLORS[index % AVATAR_COLORS.length] };
}
export const AVATAR_COUNT = AVATAR_EMOJIS.length;

function toSuperscript(num) {
  return String(num).split("").map(d => SUPERSCRIPTS[Number(d)] ?? d).join("");
}

// Deterministic hint index calculation so hints NEVER re-randomize or flicker every tick!
function getHintIndices(word) {
  const indices = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== " " && word[i] !== "-") indices.push(i);
  }
  if (indices.length <= 3) return [];
  let hash = 0;
  for (let i = 0; i < word.length; i++) hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
  hash = Math.abs(hash);

  const firstIdx = indices[hash % indices.length];
  if (indices.length <= 6) return [firstIdx];

  const pool = indices.filter(idx => idx !== firstIdx && Math.abs(idx - firstIdx) > 1);
  const secondIdx = pool.length > 0 ? pool[(hash >> 2) % pool.length] : null;
  return secondIdx !== null ? [firstIdx, secondIdx] : [firstIdx];
}

function formatMaskedWord(word, ratio, hintsOn) {
  const chars = word.split("");
  const letterCount = chars.filter(c => c !== " " && c !== "-").length;
  const hintIndices = hintsOn ? getHintIndices(word) : [];

  // Progressive hints: 1st hint at <= 50% time left, 2nd hint at <= 25% time left
  const activeHints = new Set();
  if (ratio <= 0.50 && hintIndices.length >= 1) activeHints.add(hintIndices[0]);
  if (ratio <= 0.25 && hintIndices.length >= 2) activeHints.add(hintIndices[1]);

  const maskedStr = chars.map((c, i) => {
    if (c === " ") return "&nbsp;&nbsp;";
    if (c === "-") return "-";
    if (activeHints.has(i)) return c.toUpperCase();
    return "_";
  }).join(" ");

  return `${maskedStr} <span class="word-len-sup">${toSuperscript(letterCount)}</span>`;
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = [];
  for (let i = 0; i <= b.length; i++) row[i] = i;
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

export function initGame({ roomIdArg, uid, name, canvasEl, els, onGameEnd }) {
  roomId = roomIdArg;
  myUid = uid;
  myName = name;
  onGameEndCb = onGameEnd;
  currentEls = els;

  canvasApi = initCanvas({ canvasEl, roomId, uid, isDrawer: () => roomMetaCache.currentDrawerId === myUid });
  setupToolbar(els);

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
    const keys = Object.keys(val);
    if (!keys.length) return;
    const lastKey = keys[keys.length - 1];
    const r = val[lastKey];
    if (r && !r._shown && (Date.now() - r.t < 4000)) {
      r._shown = true;
      showFloatingReaction(els, r.emoji);
    }
  });

  els.chatSendBtn.onclick = () => sendGuess(els, chatRef, playersRef, metaRef);
  els.chatInput.onkeydown = (e) => {
    if (e.key === "Enter") sendGuess(els, chatRef, playersRef, metaRef);
  };

  if (els.thumbUpBtn) {
    els.thumbUpBtn.onclick = () => {
      push(reactionsRef, { uid: myUid, emoji: "\u{1F44D}", t: Date.now() });
      sfx.reaction();
    };
  }
  if (els.thumbDownBtn) {
    els.thumbDownBtn.onclick = () => {
      push(reactionsRef, { uid: myUid, emoji: "\u{1F44E}", t: Date.now() });
      sfx.reaction();
    };
  }
}

// ---------- Host-driven state machine ----------
function driveHostLogic(metaRef, playersRef) {
  clearInterval(hostTickInterval);
  hostTickInterval = setInterval(() => hostTick(metaRef, playersRef), 300);
  hostTick(metaRef, playersRef);
}

function checkRoundEndNow(metaRef, playersRef) {
  if (!isHost) return;
  const m = roomMetaCache;
  if (m.status === "drawing" && everyoneGuessed()) {
    setTimeout(() => {
      if (roomMetaCache.status === "drawing" && everyoneGuessed()) {
        endTurn(metaRef, playersRef);
      }
    }, 1200);
  }
}

function hostTick(metaRef, playersRef) {
  const m = roomMetaCache;
  if (!m || !m.status) return;
  const now = Date.now();

  if (m.status === "choosing" && m.chooseDeadline && now > m.chooseDeadline) {
    beginDrawingPhase(metaRef, (m.wordChoices && m.wordChoices[0]) || "star");
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
  const guessers = Object.entries(playersCache).filter(
    ([id, p]) => id !== roomMetaCache.currentDrawerId && p.connected !== false
  );
  if (guessers.length === 0) return false;
  return guessers.every(([_, p]) => p.guessedThisRound);
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
    const delay = 1400 + Math.random() * 2000;
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
      const perStroke = Math.max(400, Math.min(1400, (drawTimeMs * 0.65) / strokes.length));
      strokes.forEach((pts, i) => {
        const t = 800 + i * perStroke + Math.random() * 200;
        botTimeouts.push(setTimeout(() => {
          if (roomMetaCache.status !== "drawing" || roomMetaCache.currentWord !== m.currentWord) return;
          push(ref(db, `rooms/${roomId}/strokes`), {
            tool: "pen", color: "#1c1c1c", size: 4,
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
            push(ref(db, `rooms/${roomId}/chat`), {
              uid: id, name: p.name, type: "guess",
              text: randomFillerGuess(m.currentWord), t: Date.now()
            });
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
  await runTransaction(ref(db, `rooms/${roomId}/players/${m.currentDrawerId}/score`), (cur) => (cur || 0) + 30);
  await push(ref(db, `rooms/${roomId}/chat`), {
    uid: botId, name: botPlayer.name, type: "correct", text: "guessed the word!", t: Date.now()
  });
  checkRoundEndNow(ref(db, `rooms/${roomId}/meta`), ref(db, `rooms/${roomId}/players`));
}

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
  const drawerName = (playersCache[m.currentDrawerId] || {}).name || "Drawer";
  await push(ref(db, `rooms/${roomId}/chat`), {
    uid: "system", name: drawerName, type: "draw",
    text: "is drawing now!", t: Date.now()
  });
}

async function endTurn(metaRef, playersRef) {
  if (endingTurn || roomMetaCache.status !== "drawing") return;
  endingTurn = true;
  await update(metaRef, { status: "roundEnd", roundEndRevealUntil: Date.now() + 4500 });
  await remove(ref(db, `rooms/${roomId}/liveStroke`));
  await push(ref(db, `rooms/${roomId}/chat`), {
    uid: "system", name: "System", type: "system",
    text: `The word was: ${roomMetaCache.currentWord}`, t: Date.now()
  });
}

// ---------- Guessing & Answer Protection ----------
function appendLocalChatNotice(els, text, className = "system") {
  const div = document.createElement("div");
  div.className = `chat-msg ${className}`;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

async function sendGuess(els, chatRef, playersRef, metaRef) {
  const text = els.chatInput.value.trim();
  if (!text) return;
  els.chatInput.value = "";

  const m = roomMetaCache;
  const isDrawing = m.status === "drawing";
  const alreadyGuessed = playersCache[myUid] && playersCache[myUid].guessedThisRound;
  const amDrawer = m.currentDrawerId === myUid;
  const targetWord = (m.currentWord || "").trim().toLowerCase();
  const guessLower = text.toLowerCase();

  // 1. Drawer typing the secret word -> suppress & warn
  if (isDrawing && amDrawer && targetWord && (guessLower === targetWord || guessLower.includes(targetWord))) {
    appendLocalChatNotice(els, "\u26A0\uFE0F You cannot write the secret word in chat!");
    return;
  }

  // 2. Already-guessed player typing the secret word -> suppress & warn
  if (isDrawing && alreadyGuessed && targetWord && (guessLower === targetWord || guessLower.includes(targetWord))) {
    appendLocalChatNotice(els, "\u26A0\uFE0F You already guessed the word! Don't spoil it.");
    return;
  }

  // 3. Active guesser guessing correctly
  if (isDrawing && !amDrawer && !alreadyGuessed && targetWord && guessLower === targetWord) {
    const guessResult = await runTransaction(ref(db, `rooms/${roomId}/players/${myUid}/guessedThisRound`), (cur) => {
      if (cur) return;
      return true;
    });
    if (guessResult.committed) {
      const timeLeftMs = Math.max(0, (m.roundEndAt || 0) - Date.now());
      const totalMs = (m.drawTime || 60) * 1000;
      const speedBonus = Math.round((timeLeftMs / totalMs) * 500);
      const points = 100 + speedBonus;
      await runTransaction(ref(db, `rooms/${roomId}/players/${myUid}/score`), (cur) => (cur || 0) + points);
      await runTransaction(ref(db, `rooms/${roomId}/players/${m.currentDrawerId}/score`), (cur) => (cur || 0) + 35);
      await push(chatRef, {
        uid: myUid, name: myName, type: "correct",
        text: "guessed the word!", t: Date.now()
      });
      sfx.correct();
      checkRoundEndNow(metaRef, playersRef);
    }
    return;
  }

  // 4. Close guess detection
  if (isDrawing && !amDrawer && !alreadyGuessed && targetWord && targetWord.length >= 3) {
    if (levenshteinDistance(guessLower, targetWord) === 1) {
      appendLocalChatNotice(els, `'${text}' is close!`, "close-alert");
    }
  }

  // 5. Broadcast normal guess
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
    b.onclick = () => {
      els.wordChoiceOverlay.classList.add("hidden");
      drawerPickWord(w);
    };
    els.wordChoiceBtns.appendChild(b);
  });
}

function renderTopbar(els) {
  const m = roomMetaCache;
  const currentRound = Math.min(m.currentRoundNum || 1, m.rounds || 1);
  const totalRounds = m.rounds || 3;
  els.roundLabel.textContent = `Round ${currentRound} of ${totalRounds}`;

  const amDrawer = m.currentDrawerId === myUid;
  const drawerName = (playersCache[m.currentDrawerId] || {}).name || "...";

  els.timerCircle.classList.remove("urgent", "time-up");

  if (m.status === "drawing" && m.currentWord) {
    const msLeft = Math.max(0, (m.roundEndAt || Date.now()) - Date.now());
    const secsLeft = Math.ceil(msLeft / 1000);
    const totalSecs = m.drawTime || 60;
    const ratio = msLeft / (totalSecs * 1000);

    els.timerNum.textContent = secsLeft;
    if (secsLeft <= 5) els.timerCircle.classList.add("urgent");

    if (amDrawer) {
      els.guessHeading.textContent = "DRAW THIS";
      els.wordHint.textContent = m.currentWord.toUpperCase();
    } else {
      els.guessHeading.textContent = "GUESS THIS";
      const hasGuessed = playersCache[myUid] && playersCache[myUid].guessedThisRound;
      if (hasGuessed) {
        els.wordHint.innerHTML = `<span style="color:#16a34a; font-weight:800;">${escapeHtml(m.currentWord.toUpperCase())}</span>`;
      } else {
        els.wordHint.innerHTML = formatMaskedWord(m.currentWord, ratio, m.hints !== "off");
      }
    }
  } else if (m.status === "roundEnd" && m.currentWord) {
    els.guessHeading.textContent = "THE WORD WAS";
    els.wordHint.innerHTML = `<span style="color:#2563eb; font-weight:800;">${escapeHtml(m.currentWord.toUpperCase())}</span>`;
    els.timerNum.textContent = "\u2713";
  } else if (m.status === "choosing") {
    const secsLeft = Math.max(0, Math.ceil(((m.chooseDeadline || Date.now()) - Date.now()) / 1000));
    els.guessHeading.textContent = amDrawer ? "PICK A WORD" : "CHOOSING";
    els.wordHint.textContent = amDrawer ? "Choose a word to draw!" : `${drawerName} is choosing...`;
    els.timerNum.textContent = secsLeft > 0 ? secsLeft : "\u23F3";
    if (els.wordChoiceTimer) {
      els.wordChoiceTimer.textContent = secsLeft;
      els.wordChoiceTimer.classList.toggle("urgent", secsLeft <= 4);
    }
  } else {
    els.guessHeading.textContent = "GUESS THIS";
    els.wordHint.textContent = "";
    els.timerNum.textContent = "-";
  }

  els.drawerToolbar.style.display = amDrawer && m.status === "drawing" ? "flex" : "none";
}

function renderPlayers(els) {
  const drawerId = roomMetaCache.currentDrawerId;
  const sorted = Object.entries(playersCache).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));

  const html = sorted.map(([id, p], i) => {
    const av = avatarFor(p.avatarIndex || 0);
    const isDrawing = id === drawerId;
    const guessed = p.guessedThisRound;
    const isMe = id === myUid;

    return `<div class="skribbl-player-card ${isDrawing ? "drawing" : ""} ${guessed ? "guessed" : ""} ${isMe ? "is-me" : ""}">
      <div class="player-rank">#${i + 1}</div>
      <div class="player-details">
        <div class="player-name">${escapeHtml(p.name || "Player")}${isMe ? " (You)" : ""}</div>
        <div class="player-score">${p.score || 0} points</div>
      </div>
      ${isDrawing ? '<span class="player-pencil" title="Drawing">\u270F\uFE0F</span>' : ''}
      <div class="player-avatar-box" style="background:${av.color}">${av.emoji}</div>
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
    if (m.type === "draw") return `<div class="chat-msg draw"><b>${escapeHtml(m.name)}</b> ${escapeHtml(m.text)}</div>`;
    if (m.type === "system") return `<div class="chat-msg system">${escapeHtml(m.text)}</div>`;
    if (m.type === "correct") return `<div class="chat-msg correct-banner"><b>${escapeHtml(m.name)}</b> guessed the word!</div>`;
    if (m.type === "close") return `<div class="chat-msg close-alert"><b>'${escapeHtml(m.text)}'</b> is close!</div>`;
    return `<div class="chat-msg guess"><span class="who">${escapeHtml(m.name)}:</span><span class="text-body">${escapeHtml(m.text)}</span></div>`;
  }).join("");
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function showFloatingReaction(els, emoji) {
  const container = document.querySelector(".skribbl-canvas-container");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "floating-reaction";
  div.textContent = emoji;
  div.style.left = (30 + Math.random() * 50) + "%";
  div.style.bottom = "20px";
  container.appendChild(div);
  setTimeout(() => div.remove(), 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// ---------- Toolbar ----------
function setupToolbar(els) {
  els.palette.innerHTML = "";
  canvasApi.COLORS.forEach((c, i) => {
    const sw = document.createElement("div");
    sw.className = "swatch" + (i === 9 ? " active" : "");
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
    if (els.toolButtons[id]) {
      els.toolButtons[id].onclick = () => {
        canvasApi.setTool(tool);
        Object.values(els.toolButtons).forEach(b => b && b.classList.remove("active"));
        els.toolButtons[id].classList.add("active");
      };
    }
  });

  if (els.toolButtons.toolUndo) els.toolButtons.toolUndo.onclick = () => canvasApi.undoLast();
  if (els.toolButtons.toolClear) els.toolButtons.toolClear.onclick = () => canvasApi.clearAll();

  document.querySelectorAll(".brush-dot-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".brush-dot-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const sz = Number(btn.dataset.size || 4);
      canvasApi.setSize(sz);
    };
  });
}

export function stopHostLoop() {
  clearInterval(hostTickInterval);
  clearInterval(clientTickInterval);
  clearBotTimeouts();
}