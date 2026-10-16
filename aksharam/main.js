// Sannivesham Aksharam — main.js
// Runs on every page: mobile nav toggle, hero letter-cycle, Firebase Auth state, speech synthesis, and notifications.

import {
  auth,
  onAuthStateChanged,
  checkIsAdmin
} from "./firebase.js";

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initLetterCycle();
  initAuthStateListener();
  initTeluguVoices();
});

// ---------- MOBILE NAV ----------
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  const overlay = document.getElementById('navOverlay');
  if (!toggle || !nav || !overlay) return;

  const closeNav = () => {
    toggle.classList.remove('is-open');
    nav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  };

  const openNav = () => {
    toggle.classList.add('is-open');
    nav.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-locked');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('is-open');
    if (isOpen) closeNav();
    else openNav();
  });

  overlay.addEventListener('click', closeNav);

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) closeNav();
  });
}

// ---------- HERO LETTER CYCLE (index.html) ----------
function initLetterCycle() {
  const letterEl = document.getElementById('cycleLetter');
  const translitEl = document.getElementById('cycleTranslit');
  if (!letterEl || !translitEl) return;

  const aksharamu = [
    { te: 'అ', en: 'a' },
    { te: 'ఆ', en: 'aa' },
    { te: 'ఇ', en: 'i' },
    { te: 'ఈ', en: 'ii' },
    { te: 'ఉ', en: 'u' },
    { te: 'ఊ', en: 'uu' },
    { te: 'ఋ', en: 'ru' },
    { te: 'ఎ', en: 'e' },
    { te: 'ఏ', en: 'ee' },
    { te: 'ఐ', en: 'ai' },
    { te: 'ఒ', en: 'o' },
    { te: 'ఓ', en: 'oo' },
    { te: 'ఔ', en: 'au' },
    { te: 'క', en: 'ka' },
    { te: 'గ', en: 'ga' },
    { te: 'చ', en: 'cha' },
    { te: 'జ', en: 'ja' },
    { te: 'త', en: 'ta' },
    { te: 'ద', en: 'da' },
    { te: 'న', en: 'na' },
    { te: 'ప', en: 'pa' },
    { te: 'మ', en: 'ma' },
    { te: 'ర', en: 'ra' },
    { te: 'ల', en: 'la' },
    { te: 'వ', en: 'va' },
    { te: 'స', en: 'sa' },
    { te: 'హ', en: 'ha' }
  ];

  let currentIndex = 0;
  const cycle = () => {
    letterEl.classList.add('cycling-out');
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % aksharamu.length;
      letterEl.textContent = aksharamu[currentIndex].te;
      translitEl.textContent = aksharamu[currentIndex].en;
      letterEl.classList.remove('cycling-out');
    }, 280);
  };

  const intervalId = setInterval(cycle, 2800);

  // Click letter to play pronunciation!
  const letterBadge = document.querySelector('.letter-badge');
  if (letterBadge) {
    letterBadge.style.cursor = 'pointer';
    letterBadge.title = 'Click to hear sound!';
    letterBadge.addEventListener('click', () => {
      speakTelugu(aksharamu[currentIndex].te);
    });
  }
}

// ---------- FIREBASE AUTH STATE ----------
function initAuthStateListener() {
  const authLink = document.getElementById('authLink');
  const mainNav = document.getElementById('mainNav');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (authLink) {
        authLink.textContent = "Profile";
        authLink.href = "profile.html";
        authLink.classList.remove("nav-cta");
        authLink.classList.add("nav-user-pill");
      }

      // Check if user is admin
      const isAdmin = await checkIsAdmin(user);
      if (isAdmin && mainNav && !document.getElementById('adminNavLink')) {
        const adminA = document.createElement('a');
        adminA.id = 'adminNavLink';
        adminA.href = 'admin.html';
        adminA.textContent = 'Admin Studio ⚙️';
        adminA.style.color = 'var(--gold)';
        adminA.style.fontWeight = '600';
        mainNav.insertBefore(adminA, authLink);
      }
    } else {
      if (authLink) {
        authLink.textContent = "Sign In";
        authLink.href = "signin.html";
        authLink.classList.add("nav-cta");
        authLink.classList.remove("nav-user-pill");
      }
      const existingAdminLink = document.getElementById('adminNavLink');
      if (existingAdminLink) existingAdminLink.remove();
    }
  });
}

// ---------- SPEECH SYNTHESIS (TELUGU AUDIO) ----------
let teluguVoice = null;
function initTeluguVoices() {
  if (!('speechSynthesis' in window)) return;
  const load = () => {
    const voices = window.speechSynthesis.getVoices();
    teluguVoice = voices.find(v => v.lang === 'te-IN' || v.lang.startsWith('te')) || null;
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

export function speakTelugu(text, onStart, onEnd) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  if (teluguVoice) utter.voice = teluguVoice;
  utter.lang = 'te-IN';
  utter.rate = 0.85;

  if (onStart) utter.onstart = onStart;
  if (onEnd) {
    utter.onend = onEnd;
    utter.onerror = onEnd;
  }

  window.speechSynthesis.speak(utter);
}

// Make speakTelugu available globally
window.speakTelugu = speakTelugu;

// ---------- TOAST NOTIFICATIONS ----------
export function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('aksharamToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'aksharamToastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-pill toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
window.showToast = showToast;
