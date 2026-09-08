// Sannivesham Aksharam — Audio & Speech Synthesis Engine
// Zero external audio file dependencies — uses Web Audio API for sound effects and Web Speech API for Telugu voice.

let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const Sound = {
  get enabled() {
    return soundEnabled;
  },
  set enabled(val) {
    soundEnabled = !!val;
    localStorage.setItem('aksharam_sound', soundEnabled ? '1' : '0');
  },
  init() {
    const saved = localStorage.getItem('aksharam_sound');
    if (saved !== null) {
      soundEnabled = saved === '1';
    }
  },

  // Cheerful ascending chime for correct answer
  playCorrect() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // E5 (659.25Hz) to B5 (987.77Hz)
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.14);

    osc2.frequency.setValueAtTime(329.63, now);
    osc2.frequency.exponentialRampToValueAtTime(493.88, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  },

  // Soft sympathetic buzzer for incorrect answer
  playWrong() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  },

  // Joyful 5-note celebratory arpeggio for finishing a lesson
  playComplete() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // C5, E5, G5, C6, E6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  },

  // Subtle tactile pop for tapping buttons
  playClick() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
};

// Initialize sound preference
Sound.init();

// ---------- ROBUST TELUGU PRONUNCIATION (TTS + Web Speech Fallback) ----------
let currentAudio = null;
let cachedTeluguVoice = null;

function findTeluguVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  cachedTeluguVoice = voices.find(v => v.lang === 'te-IN' || v.lang.startsWith('te')) || null;
  return cachedTeluguVoice;
}

if ('speechSynthesis' in window) {
  findTeluguVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    findTeluguVoice();
  };
}

function fallbackSpeechSynthesis(text, onStart, onEnd) {
  if (!('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = cachedTeluguVoice || findTeluguVoice();
    if (voice) utter.voice = voice;
    utter.lang = 'te-IN';
    utter.rate = 0.85;
    utter.pitch = 1.0;

    if (onStart) utter.onstart = onStart;
    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }
    window.speechSynthesis.speak(utter);
  } catch (e) {
    if (onEnd) onEnd();
  }
}

export function speakTelugu(text, onStart, onEnd) {
  if (!text) return;
  const clean = text.trim();
  if (!clean) return;

  // Stop any previous audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }

  // Try Google Translate TTS audio first (guaranteed native Telugu human voice on all devices)
  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=te&q=${encodeURIComponent(clean)}`;
    const audio = new Audio(ttsUrl);
    currentAudio = audio;

    let started = false;
    audio.onplay = () => {
      started = true;
      if (onStart) onStart();
    };

    audio.onended = () => {
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      // If network fails or blocked, fallback to browser SpeechSynthesis
      fallbackSpeechSynthesis(clean, onStart, onEnd);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy or error: fallback immediately
        fallbackSpeechSynthesis(clean, onStart, onEnd);
      });
    }
  } catch (err) {
    fallbackSpeechSynthesis(clean, onStart, onEnd);
  }
}

