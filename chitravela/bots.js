// ---------------------------------------------------------------------------
// Bots: when a player is alone in a public match, 2-3 "bot" players quietly
// join the room like normal players (staggered, like real people trickling
// in). They're stored with an `isBot: true` flag that is NEVER surfaced in
// any UI string — same name/avatar/score rendering as everyone else — so
// from the human player's side they're indistinguishable from real people.
//
// All bot behavior (word picking, "drawing", guessing) is driven entirely
// from the room HOST's browser tab, reusing the exact same Firebase paths
// (players/strokes/chat) real clients already listen to. No server needed.
// ---------------------------------------------------------------------------

import { db, ref, set } from "./firebase-config.js";

export const BOT_NAMES = [
  "Maya", "Kiran", "Alexei", "Priya", "Jordan", "Nina", "Samir", "Aditya",
  "Zoe", "Leo", "Tanvi", "Chris", "Ishaan", "Riya", "Noah", "Wren"
];

// ---------- tiny doodle-path helpers ----------
function circle(cx, cy, r, steps = 26) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}
function ellipse(cx, cy, rx, ry, steps = 26) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
  }
  return pts;
}
function arc(cx, cy, r, startDeg, endDeg, steps = 16) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + ((endDeg - startDeg) * i) / steps;
    const t = (deg * Math.PI) / 180;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}
function poly(...coords) {
  const pts = coords.map(([x, y]) => ({ x, y }));
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first.x !== last.x || first.y !== last.y) pts.push(first);
  return pts;
}
function line(x1, y1, x2, y2) {
  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
}
function star(cx, cy, outerR, innerR, spikes = 5) {
  const pts = [];
  const rot = -Math.PI / 2;
  for (let i = 0; i <= spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const t = rot + (i * Math.PI) / spikes;
    pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}

// ---------- word -> stroke-list doodle library ----------
export const DOODLES = {
  sun: [
    circle(400, 300, 55),
    line(400, 220, 400, 180), line(400, 380, 400, 420),
    line(320, 300, 280, 300), line(480, 300, 520, 300),
    line(345, 245, 315, 215), line(455, 245, 485, 215),
    line(345, 355, 315, 385), line(455, 355, 485, 385),
  ],
  cat: [
    circle(400, 330, 70),
    poly([330, 275], [300, 185], [365, 260]),
    poly([470, 275], [500, 185], [435, 260]),
    circle(372, 320, 8), circle(428, 320, 8),
    poly([390, 345], [410, 345], [400, 360]),
    line(330, 348, 260, 335), line(330, 358, 260, 358),
    line(470, 348, 540, 335), line(470, 358, 540, 358),
  ],
  house: [
    poly([320, 320], [480, 320], [480, 450], [320, 450]),
    poly([300, 322], [400, 220], [500, 322]),
    poly([378, 380], [422, 380], [422, 450], [378, 450]),
    poly([338, 340], [365, 340], [365, 366], [338, 366]),
  ],
  tree: [
    poly([385, 380], [415, 380], [415, 480], [385, 480]),
    circle(400, 310, 90),
  ],
  star: [star(400, 300, 90, 38)],
  fish: [
    ellipse(400, 300, 90, 55),
    poly([310, 300], [255, 260], [255, 340]),
    circle(455, 285, 7),
  ],
  car: [
    poly([280, 320], [520, 320], [520, 380], [280, 380]),
    poly([330, 320], [368, 268], [432, 268], [470, 320]),
    circle(340, 388, 26), circle(460, 388, 26),
  ],
  cloud: [
    circle(340, 320, 48), circle(400, 288, 58), circle(462, 320, 48),
    line(300, 340, 500, 340),
  ],
  umbrella: [
    arc(400, 300, 90, 180, 360),
    line(310, 300, 340, 320), line(370, 300, 390, 320),
    line(430, 300, 410, 320), line(490, 300, 460, 320),
    poly([400, 300], [400, 420], [378, 442]),
  ],
  flower: [
    circle(400, 320, 20),
    circle(400, 265, 26), circle(447, 296, 26),
    circle(430, 350, 26), circle(370, 350, 26), circle(353, 296, 26),
    line(400, 340, 400, 460),
    poly([400, 420], [442, 408], [412, 440]),
  ],
  boat: [
    poly([300, 380], [500, 380], [460, 432], [340, 432]),
    line(400, 380, 400, 258),
    poly([400, 265], [462, 340], [400, 340]),
  ],
  balloon: [
    circle(400, 290, 60),
    poly([378, 348], [422, 348], [400, 368]),
    line(400, 368, 400, 470),
  ],
};

const DOODLE_WORDS = Object.keys(DOODLES);

/** Pick a word the bot can actually "draw" — prefer one from the offered
 *  choices, otherwise fall back to any word in the doodle library. */
export function pickBotWord(wordChoices) {
  const lower = (wordChoices || []).map((w) => String(w).toLowerCase());
  const match = DOODLE_WORDS.find((w) => lower.includes(w));
  if (match) return match;
  return DOODLE_WORDS[Math.floor(Math.random() * DOODLE_WORDS.length)];
}

export function getDoodleStrokes(word) {
  return DOODLES[String(word).toLowerCase()] || DOODLES.star;
}

/** For each bot guesser, decide if/when it "types" the correct guess. */
export function botGuessPlan(botCount, drawTimeMs) {
  const plan = [];
  for (let i = 0; i < botCount; i++) {
    const willGuess = Math.random() < 0.88;
    const minDelay = drawTimeMs * 0.22;
    const maxDelay = drawTimeMs * 0.82;
    plan.push({ willGuess, delayMs: minDelay + Math.random() * (maxDelay - minDelay) });
  }
  return plan;
}

/** Occasionally a bot fires off a wrong guess a few seconds before the
 *  correct one, just like a real player narrowing it down. */
export function maybeWrongGuessDelay(correctDelayMs) {
  if (Math.random() < 0.32) {
    return Math.max(1200, correctDelayMs - (2000 + Math.random() * 4500));
  }
  return null;
}

const FILLER_GUESSES = ["hmm", "cat", "house", "tree", "car", "ball", "sun", "dog", "fish", "star", "boat"];
export function randomFillerGuess(excludeWord) {
  const pool = FILLER_GUESSES.filter((w) => w !== String(excludeWord).toLowerCase());
  return pool[Math.floor(Math.random() * pool.length)];
}

export function isBotPlayer(p) {
  return !!(p && p.isBot);
}

/** Silently trickle 2-3 bot "players" into a room, staggered like real
 *  people joining a lobby. Only call this when the human is alone. */
export function ensureBots(roomId) {
  const count = Math.random() < 0.5 ? 2 : 3;
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, count);
  shuffled.forEach((name, i) => {
    const botId = "bot_" + Math.random().toString(36).slice(2, 10);
    const delay = 1100 + i * (1000 + Math.random() * 1100) + Math.random() * 600;
    setTimeout(() => {
      set(ref(db, `rooms/${roomId}/players/${botId}`), {
        name,
        avatarIndex: Math.floor(Math.random() * 12),
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        guessedThisRound: false,
        isBot: true,
      }).catch(() => {});
    }, delay);
  });
}
