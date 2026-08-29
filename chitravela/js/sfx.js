// Tiny synth sound effects - no audio files to host/manage.
let ctx;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep(freq, duration, type = "sine", gainVal = 0.15, delay = 0) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.connect(gain).connect(c.destination);
    const start = c.currentTime + delay;
    osc.start(start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.stop(start + duration + 0.02);
  } catch (e) { /* audio not available, ignore */ }
}

export const sfx = {
  correct: () => { beep(660, 0.12, "sine", 0.18); beep(880, 0.15, "sine", 0.18, 0.1); },
  wrong: () => beep(180, 0.15, "sawtooth", 0.1),
  tick: () => beep(1000, 0.05, "square", 0.05),
  roundStart: () => { beep(440, 0.1, "triangle", 0.15); beep(660, 0.15, "triangle", 0.15, 0.1); },
  join: () => beep(520, 0.08, "sine", 0.1),
  reaction: () => beep(750, 0.08, "sine", 0.08),
};
