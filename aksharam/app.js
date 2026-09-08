// Sannivesham Aksharam — Main Application Orchestrator
// Duolingo-style gamified learning path, XP, Streak, Practice, Dictionary, Translator & Google Sign-In Cloud Sync

import { UNITS, DICTIONARY_WORDS } from './lessons-data.js';
import { LessonRunner } from './lesson-engine.js';
import { Sound, speakTelugu } from './audio.js';
import { auth, db } from '../firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

class AksharamApp {
  constructor() {
    this.xp = parseInt(localStorage.getItem('aksharam_xp') || '0', 10);
    this.streak = parseInt(localStorage.getItem('aksharam_streak') || '0', 10);
    this.gems = parseInt(localStorage.getItem('aksharam_gems') || '10', 10);
    this.completedLessons = this.loadCompletedLessons();
    this.currentTab = 'home';
    this.currentUser = null;

    this.runner = new LessonRunner({
      container: document.getElementById('lessonModal'),
      addXP: (pts) => {
        this.xp += pts;
        localStorage.setItem('aksharam_xp', this.xp.toString());
        this.gems += Math.ceil(pts / 5);
        localStorage.setItem('aksharam_gems', this.gems.toString());
        this.updateTopBar();
        this.syncToCloud();
      },
      updateStreak: () => {
        this.recordActiveStreak();
        this.syncToCloud();
      },
      onComplete: (lessonId) => {
        this.completedLessons = this.loadCompletedLessons();
        this.renderPath();
        this.updateProfileTab();
        this.syncToCloud();
      }
    });

    this.init();
  }

  init() {
    this.checkDayStreak();
    this.bindNavigation();
    this.updateTopBar();
    this.renderPath();
    this.bindDictionary();
    this.bindTranslator();
    this.bindPractice();
    this.bindProfile();
    this.initLetterCycle();
    this.initAuth();

    // Hero buttons to navigate
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playClick();
        this.switchTab(btn.dataset.goto);
      });
    });

    // Close lesson modal button
    const closeBtn = document.getElementById('closeLessonBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (confirm('Exit current lesson?')) {
          this.runner.close();
        }
      });
    }
  }

  loadCompletedLessons() {
    try {
      return JSON.parse(localStorage.getItem('aksharam_completed_lessons') || '[]');
    } catch (e) {
      return [];
    }
  }

  checkDayStreak() {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('aksharam_last_active');

    if (!lastActive) {
      this.streak = 1;
      localStorage.setItem('aksharam_streak', '1');
      localStorage.setItem('aksharam_last_active', today);
    } else if (lastActive !== today) {
      const diffDays = Math.floor((new Date(today) - new Date(lastActive)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Active yesterday, streak intact
      } else if (diffDays > 1) {
        // Streak broken
        this.streak = 1;
        localStorage.setItem('aksharam_streak', '1');
      }
    }
  }

  recordActiveStreak() {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('aksharam_last_active');

    if (lastActive !== today) {
      this.streak += 1;
      localStorage.setItem('aksharam_streak', this.streak.toString());
      localStorage.setItem('aksharam_last_active', today);
    }
    this.updateTopBar();
  }

  updateTopBar() {
    const streakEl = document.getElementById('topStreak');
    const xpEl = document.getElementById('topXP');
    const gemsEl = document.getElementById('topGems');

    if (streakEl) streakEl.textContent = this.streak;
    if (xpEl) xpEl.textContent = this.xp;
    if (gemsEl) gemsEl.textContent = this.gems;
  }

  // -------------------------------------------------------------
  // 🧭 BROWSER HISTORY ROUTING & NAVIGATION
  // -------------------------------------------------------------
  bindNavigation() {
    // Brand click: treat Aksharam as its own website and navigate to Aksharam Home!
    const brandHomeBtn = document.getElementById('brandHomeBtn');
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playClick();
        this.switchTab('home');
      });
    }

    // Dock and desktop navigation tabs
    const navItems = document.querySelectorAll('.dock-tab');
    navItems.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        Sound.playClick();
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    // Browser / Device Back Button handling
    window.addEventListener('popstate', (e) => {
      // 1. If lesson modal is open, back button safely closes the lesson first!
      if (this.runner && this.runner.isOpen) {
        this.runner.close(false);
        return;
      }

      // 2. Otherwise navigate to the previous tab or back to 'home'
      let targetTab = (e.state && e.state.tab) || window.location.hash.replace('#', '');
      const validTabs = ['home', 'roadmap', 'practice', 'dictionary', 'translator', 'profile'];
      if (!validTabs.includes(targetTab)) {
        targetTab = 'home';
      }

      this.switchTab(targetTab, false);
    });

    // Initial load route handling
    const initialHash = window.location.hash.replace('#', '');
    const validTabs = ['home', 'roadmap', 'practice', 'dictionary', 'translator', 'profile'];
    const initialTab = validTabs.includes(initialHash) ? initialHash : 'home';
    this.switchTab(initialTab, false);
    history.replaceState({ tab: initialTab }, '', '#' + initialTab);
  }

  switchTab(tabName, pushState = true) {
    const validTabs = ['home', 'roadmap', 'practice', 'dictionary', 'translator', 'profile'];
    if (!validTabs.includes(tabName)) tabName = 'home';

    this.currentTab = tabName;

    document.querySelectorAll('.dock-tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('is-active', view.id === `tab-${tabName}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pushState) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== tabName) {
        history.pushState({ tab: tabName }, '', '#' + tabName);
      }
    }

    if (tabName === 'profile') {
      this.updateProfileTab();
    }
  }

  openLesson(lesson) {
    history.pushState({ modal: 'lesson', lessonId: lesson.id }, '', '#lesson');
    this.runner.start(lesson);
  }

  // -------------------------------------------------------------
  // 🗺️ DUOLINGO-STYLE LEARNING PATH RENDERER
  // -------------------------------------------------------------
  renderPath() {
    const container = document.getElementById('unitsContainer');
    if (!container) return;

    container.innerHTML = '';
    let previousLessonUnlocked = true;

    UNITS.forEach((unit, unitIdx) => {
      const unitEl = document.createElement('section');
      unitEl.className = 'path-unit';
      unitEl.style.setProperty('--unit-color', unit.themeColor);

      // Unit Header Banner
      const header = document.createElement('div');
      header.className = 'unit-banner';
      header.innerHTML = `
        <div class="unit-banner-left">
          <span class="unit-badge">${unit.badge}</span>
          <h2 class="unit-title">Unit ${unit.unitNumber}: ${unit.titleEn}</h2>
          <p class="unit-sub">${unit.title} — ${unit.desc}</p>
        </div>
        <div class="unit-banner-right">
          <span class="unit-progress-count">${unit.lessons.filter(l => this.completedLessons.includes(l.id)).length} / ${unit.lessons.length}</span>
        </div>
      `;
      unitEl.appendChild(header);

      // Serpentine Lesson Path
      const pathWrap = document.createElement('div');
      pathWrap.className = 'unit-path-nodes';

      unit.lessons.forEach((lesson, lessonIdx) => {
        const isCompleted = this.completedLessons.includes(lesson.id);
        const isUnlocked = previousLessonUnlocked;
        const isCurrent = isUnlocked && !isCompleted;
        const isLocked = !isUnlocked;

        if (!isCompleted) {
          previousLessonUnlocked = false;
        }

        const nodeWrap = document.createElement('div');
        nodeWrap.className = `node-wrapper node-offset-${(lessonIdx % 5) + 1}`;

        const node = document.createElement('button');
        node.type = 'button';
        node.className = `path-node ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''} ${isLocked ? 'is-locked' : ''}`;
        node.setAttribute('aria-label', `${lesson.titleEn} - ${lesson.title}`);

        node.innerHTML = `
          <div class="node-inner">
            <span class="node-icon">${isCompleted ? '✓' : isLocked ? '🔒' : lesson.icon}</span>
          </div>
          ${isCurrent ? '<div class="node-pulse-ring"></div><div class="node-tooltip">Start Lesson</div>' : ''}
        `;

        node.addEventListener('click', () => {
          Sound.playClick();
          if (isLocked) {
            alert('🔒 Please complete earlier lessons to unlock this one.');
          } else {
            this.openLesson(lesson);
          }
        });

        const label = document.createElement('div');
        label.className = 'node-label';
        label.innerHTML = `
          <strong class="node-en-name">${lesson.titleEn}</strong>
          <span class="node-te-name">${lesson.title}</span>
        `;

        nodeWrap.appendChild(node);
        nodeWrap.appendChild(label);
        pathWrap.appendChild(nodeWrap);
      });

      // Unit Milestone Treasure Chest
      const chestWrap = document.createElement('div');
      chestWrap.className = 'node-wrapper chest-node-wrapper';
      const allUnitDone = unit.lessons.every(l => this.completedLessons.includes(l.id));

      const chest = document.createElement('button');
      chest.type = 'button';
      chest.className = `path-node chest-node ${allUnitDone ? 'is-unlocked-chest' : 'is-locked-chest'}`;
      chest.innerHTML = `
        <div class="node-inner">
          <span class="node-icon">${allUnitDone ? '🎁' : '📦'}</span>
        </div>
      `;

      chest.addEventListener('click', () => {
        Sound.playClick();
        if (allUnitDone) {
          Sound.playComplete();
          alert(`🎉 Congratulations! Unit ${unit.unitNumber} completed. +50 bonus gems earned!`);
        } else {
          alert(`📦 Complete all lessons in Unit ${unit.unitNumber} to open this milestone chest!`);
        }
      });

      const chestLabel = document.createElement('div');
      chestLabel.className = 'node-label';
      chestLabel.innerHTML = `<strong>Milestone Chest</strong><span>Unit Bonus</span>`;

      chestWrap.appendChild(chest);
      chestWrap.appendChild(chestLabel);
      pathWrap.appendChild(chestWrap);

      unitEl.appendChild(pathWrap);
      container.appendChild(unitEl);
    });
  }

  // -------------------------------------------------------------
  // 🎯 PRACTICE MODE (Free Revision & Bonus XP)
  // -------------------------------------------------------------
  bindPractice() {
    const startBtn = document.getElementById('startPracticeBtn');
    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
      Sound.playClick();
      this.runPracticeSession();
    });
  }

  runPracticeSession() {
    const practiceLesson = {
      id: 'practice-' + Date.now(),
      title: 'అభ్యాస సాధన',
      titleEn: 'Practice & Revision Session',
      xp: 15,
      exercises: [
        {
          type: 'sound_match',
          promptText: 'Listen and choose the matching letter (వినండి):',
          audioTe: 'అ',
          options: ['అ', 'ఆ', 'ఇ', 'ఈ'],
          answer: 'అ'
        },
        {
          type: 'choice',
          question: "Which of these is the long vowel 'ii' (ఈ)?",
          options: ['ఇ', 'ఈ', 'ఉ', 'ఎ'],
          answer: 'ఈ'
        },
        {
          type: 'pair_match',
          promptText: 'Match each character with its sound (జతపరచండి):',
          pairs: [
            { te: 'క', en: 'ka' },
            { te: 'గ', en: 'ga' },
            { te: 'చ', en: 'cha' },
            { te: 'జ', en: 'ja' }
          ]
        }
      ]
    };

    this.openLesson(practiceLesson);
  }

  // -------------------------------------------------------------
  // 📖 DICTIONARY TAB
  // -------------------------------------------------------------
  bindDictionary() {
    const searchInput = document.getElementById('dictSearch');
    const filtersWrap = document.getElementById('dictFilters');
    const resultsGrid = document.getElementById('dictGrid');

    if (!searchInput || !filtersWrap || !resultsGrid) return;

    const categories = [
      { id: 'all', label: 'All Words' },
      { id: 'vowel', label: 'Vowels' },
      { id: 'consonant', label: 'Consonants' },
      { id: 'number', label: 'Numbers' },
      { id: 'phrase', label: 'Phrases' },
      { id: 'relation', label: 'Family' }
    ];

    let activeCat = 'all';

    filtersWrap.innerHTML = categories.map(cat => `
      <button type="button" class="filter-chip ${cat.id === 'all' ? 'is-active' : ''}" data-cat="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    filtersWrap.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        Sound.playClick();
        filtersWrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeCat = chip.dataset.cat;
        renderWords();
      });
    });

    const renderWords = () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = DICTIONARY_WORDS.filter(item => {
        const matchesCat = activeCat === 'all' || item.cat === activeCat;
        const matchesQ = !q ||
          item.te.toLowerCase().includes(q) ||
          item.en.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q);
        return matchesCat && matchesQ;
      });

      document.getElementById('dictCount').textContent = `${filtered.length} words`;

      if (filtered.length === 0) {
        resultsGrid.innerHTML = `
          <div class="dict-empty-state">
            <span class="empty-icon">🔍</span>
            <p>No matching words found</p>
          </div>
        `;
        return;
      }

      resultsGrid.innerHTML = filtered.map(w => `
        <div class="dict-card" data-te="${w.te}">
          <div class="dict-card-top">
            <span class="dict-glyph">${w.te}</span>
            <button type="button" class="dict-audio-btn" aria-label="Listen to ${w.en}">🔊</button>
          </div>
          <div class="dict-translit">${w.en}</div>
          <div class="dict-meaning">${w.meaning}</div>
          ${w.example ? `<div class="dict-example">“${w.example}”</div>` : ''}
        </div>
      `).join('');

      resultsGrid.querySelectorAll('.dict-card').forEach(card => {
        const te = card.dataset.te;
        card.addEventListener('click', () => {
          speakTelugu(te);
        });
      });
    };

    searchInput.addEventListener('input', renderWords);
    renderWords();
  }

  // -------------------------------------------------------------
  // 🔄 TRANSLATOR TAB
  // -------------------------------------------------------------
  bindTranslator() {
    const fromLabel = document.getElementById('transFromLabel');
    const toLabel = document.getElementById('transToLabel');
    const swapBtn = document.getElementById('transSwapBtn');
    const inputArea = document.getElementById('transInput');
    const outputArea = document.getElementById('transOutput');
    const translateBtn = document.getElementById('transActionBtn');
    const copyBtn = document.getElementById('transCopyBtn');
    const phrasesWrap = document.getElementById('transPhrases');

    if (!inputArea || !outputArea) return;

    let fromLang = 'te';
    let toLang = 'en';

    const updateLabels = () => {
      if (fromLabel) fromLabel.textContent = fromLang === 'te' ? 'Telugu' : 'English';
      if (toLabel) toLabel.textContent = toLang === 'te' ? 'Telugu' : 'English';
      inputArea.placeholder = fromLang === 'te' ? 'Type in Telugu here...' : 'Type in English here...';
    };

    const doSwap = () => {
      Sound.playClick();
      const temp = fromLang;
      fromLang = toLang;
      toLang = temp;
      const prevOut = outputArea.textContent.trim();
      if (prevOut && !outputArea.classList.contains('is-placeholder')) {
        inputArea.value = prevOut;
      }
      outputArea.textContent = 'Translation will appear here...';
      outputArea.classList.add('is-placeholder');
      updateLabels();
    };

    if (swapBtn) swapBtn.addEventListener('click', doSwap);

    const translate = async () => {
      const text = inputArea.value.trim();
      if (!text) return;

      translateBtn.disabled = true;
      outputArea.textContent = 'Translating...';
      outputArea.classList.remove('is-placeholder');

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        let result = '';
        if (data && data[0]) {
          data[0].forEach(p => { if (p[0]) result += p[0]; });
        }
        outputArea.textContent = result || 'Translation unavailable.';
      } catch (err) {
        outputArea.textContent = 'Translation failed. Please check network connection.';
      } finally {
        translateBtn.disabled = false;
      }
    };

    if (translateBtn) {
      translateBtn.addEventListener('click', () => {
        Sound.playClick();
        translate();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const txt = outputArea.textContent.trim();
        if (txt && !outputArea.classList.contains('is-placeholder')) {
          await navigator.clipboard.writeText(txt).catch(() => {});
          Sound.playClick();
          copyBtn.textContent = '✓ Copied';
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
          }, 2000);
        }
      });
    }

    // Quick phrases
    const quick = [
      'నమస్కారం (Hello)', 'ధన్యవాదాలు (Thank you)', 'ఎలా ఉన్నారు? (How are you?)',
      'శుభోదయం (Good morning)', 'శుభ రాత్రి (Good night)', 'నేను బాగున్నాను (I am fine)'
    ];
    if (phrasesWrap) {
      phrasesWrap.innerHTML = quick.map(p => `
        <button type="button" class="quick-phrase-btn">${p}</button>
      `).join('');

      phrasesWrap.querySelectorAll('.quick-phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Sound.playClick();
          inputArea.value = btn.textContent;
          fromLang = 'te';
          toLang = 'en';
          updateLabels();
          translate();
        });
      });
    }

    updateLabels();
  }

  // -------------------------------------------------------------
  // 👤 PROFILE TAB & SETTINGS
  // -------------------------------------------------------------
  bindProfile() {
    const soundToggle = document.getElementById('soundToggleBtn');
    if (soundToggle) {
      soundToggle.textContent = Sound.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      soundToggle.addEventListener('click', () => {
        Sound.enabled = !Sound.enabled;
        soundToggle.textContent = Sound.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        Sound.playClick();
      });
    }

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all your learning progress?')) {
          localStorage.removeItem('aksharam_completed_lessons');
          localStorage.removeItem('aksharam_xp');
          localStorage.removeItem('aksharam_streak');
          localStorage.removeItem('aksharam_gems');

          if (this.currentUser) {
            try {
              const userRef = doc(db, 'users', this.currentUser.uid);
              await setDoc(userRef, {
                aksharamProgress: {
                  xp: 0,
                  streak: 1,
                  gems: 10,
                  completedLessons: [],
                  lastActive: new Date().toDateString(),
                  updatedAt: new Date().toISOString()
                }
              }, { merge: true });
            } catch (e) {}
          }

          location.reload();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // ☁️ GOOGLE AUTH & FIRESTORE CLOUD SYNC
  // -------------------------------------------------------------
  initAuth() {
    // Top bar Sign In button
    const headerSignInBtn = document.getElementById('headerGoogleSignInBtn');
    if (headerSignInBtn) {
      headerSignInBtn.addEventListener('click', () => {
        Sound.playClick();
        this.signInWithGoogle();
      });
    }

    // Listen to Firebase Auth state change globally
    try {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          await this.syncFromCloud(user);
        } else {
          this.updateAuthUI(null);
        }
      });
    } catch (err) {
      console.warn('Firebase Auth note:', err);
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Google Sign-In could not be completed: ' + (err.message || err.code));
      }
    }
  }

  async signOutGoogle() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.updateAuthUI(null);
      this.updateProfileTab();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }

  async syncFromCloud(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const cloud = snap.data().aksharamProgress;
        if (cloud) {
          // Merge local and cloud progress
          const localCompleted = this.loadCompletedLessons();
          const cloudCompleted = Array.isArray(cloud.completedLessons) ? cloud.completedLessons : [];
          this.completedLessons = Array.from(new Set([...localCompleted, ...cloudCompleted]));
          localStorage.setItem('aksharam_completed_lessons', JSON.stringify(this.completedLessons));

          this.xp = Math.max(this.xp, Number(cloud.xp || 0));
          localStorage.setItem('aksharam_xp', this.xp.toString());

          this.streak = Math.max(this.streak, Number(cloud.streak || 0));
          localStorage.setItem('aksharam_streak', this.streak.toString());

          this.gems = Math.max(this.gems, Number(cloud.gems || 0));
          localStorage.setItem('aksharam_gems', this.gems.toString());

          this.updateTopBar();
          this.renderPath();
        }
      }

      // Sync merged state back to cloud immediately
      await this.syncToCloud();
    } catch (e) {
      console.error('Failed syncing from cloud:', e);
    } finally {
      this.updateAuthUI(user);
      this.updateProfileTab();
    }
  }

  async syncToCloud() {
    if (!this.currentUser) return;
    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await setDoc(userRef, {
        aksharamProgress: {
          xp: this.xp,
          streak: this.streak,
          gems: this.gems,
          completedLessons: this.completedLessons,
          lastActive: localStorage.getItem('aksharam_last_active') || new Date().toDateString(),
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
    } catch (e) {
      console.error('Failed syncing to cloud:', e);
    }
  }

  updateAuthUI(user) {
    const headerAuthSlot = document.getElementById('headerAuthSlot');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatarIcon = document.getElementById('profileAvatarIcon');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const profileSyncStatus = document.getElementById('profileSyncStatus');
    const profileAuthBox = document.getElementById('profileAuthBox');

    if (user) {
      // Header: show user avatar pill
      if (headerAuthSlot) {
        headerAuthSlot.innerHTML = `
          <button type="button" class="header-user-pill" id="headerProfilePill" title="${user.displayName || 'Learner'} (Go to Profile)">
            ${user.photoURL
              ? `<img src="${user.photoURL}" alt="${user.displayName || ''}" class="header-user-avatar" referrerpolicy="no-referrer">`
              : `<span class="header-user-avatar" style="background:#7A2048; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${(user.displayName || 'U')[0].toUpperCase()}</span>`
            }
            <span class="header-user-name">${(user.displayName || 'Profile').split(' ')[0]}</span>
          </button>
        `;
        document.getElementById('headerProfilePill')?.addEventListener('click', () => {
          Sound.playClick();
          this.switchTab('profile');
        });
      }

      // Profile Card
      if (profileName) profileName.textContent = user.displayName || 'Telugu Learner';
      if (profileEmail) {
        profileEmail.textContent = user.email || '';
        profileEmail.style.display = 'block';
      }
      if (profileAvatarImg && user.photoURL) {
        profileAvatarImg.src = user.photoURL;
        profileAvatarImg.referrerPolicy = 'no-referrer';
        profileAvatarImg.style.display = 'block';
        if (profileAvatarIcon) profileAvatarIcon.style.display = 'none';
      }
      if (profileSyncStatus) {
        profileSyncStatus.textContent = '☁️ Synced to Google Account';
        profileSyncStatus.classList.add('is-synced');
      }

      // Profile Auth Box
      if (profileAuthBox) {
        profileAuthBox.innerHTML = `
          <div class="auth-signed-in-inner">
            <div class="auth-user-info">
              <strong>Signed in as ${user.displayName || 'Learner'}</strong>
              <span>Your streak, XP, and lessons sync automatically with this Google account.</span>
            </div>
            <button type="button" class="btn-sign-out" id="signOutBtn">
              Sign Out
            </button>
          </div>
        `;
        document.getElementById('signOutBtn')?.addEventListener('click', () => {
          Sound.playClick();
          this.signOutGoogle();
        });
      }

    } else {
      // Guest / Signed Out State
      if (headerAuthSlot) {
        headerAuthSlot.innerHTML = `
          <button type="button" class="btn-google-header" id="headerGoogleSignInBtn" title="Sign in with Google to sync progress">
            <svg class="google-icon-svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span class="btn-google-text">Sign In</span>
          </button>
        `;
        document.getElementById('headerGoogleSignInBtn')?.addEventListener('click', () => {
          Sound.playClick();
          this.signInWithGoogle();
        });
      }

      if (profileName) profileName.textContent = 'Telugu Learner';
      if (profileEmail) profileEmail.style.display = 'none';
      if (profileAvatarImg) profileAvatarImg.style.display = 'none';
      if (profileAvatarIcon) profileAvatarIcon.style.display = 'flex';
      if (profileSyncStatus) {
        profileSyncStatus.textContent = '💾 Local Guest';
        profileSyncStatus.classList.remove('is-synced');
      }

      if (profileAuthBox) {
        profileAuthBox.innerHTML = `
          <div class="auth-prompt-inner">
            <h3 class="auth-prompt-title">Save & Sync Your Progress</h3>
            <p class="auth-prompt-desc">
              Sign in with your Google account to automatically preserve your streak, XP, gems, and unlocked lessons across all your devices.
            </p>
            <button type="button" class="btn-google-sign-in" id="profileGoogleSignInBtn">
              <svg class="google-icon-svg" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        `;
        document.getElementById('profileGoogleSignInBtn')?.addEventListener('click', () => {
          Sound.playClick();
          this.signInWithGoogle();
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 🔤 HERO ROTATING LETTER CYCLE (Home Page)
  // -------------------------------------------------------------
  initLetterCycle() {
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
      { te: 'ఖ', en: 'kha' },
      { te: 'గ', en: 'ga' },
      { te: 'ఘ', en: 'gha' },
      { te: 'చ', en: 'cha' },
      { te: 'జ', en: 'ja' },
      { te: 'ట', en: 'Ta' },
      { te: 'డ', en: 'Da' },
      { te: 'ణ', en: 'Na' },
      { te: 'త', en: 'ta' },
      { te: 'ద', en: 'da' },
      { te: 'న', en: 'na' },
      { te: 'ప', en: 'pa' },
      { te: 'బ', en: 'ba' },
      { te: 'మ', en: 'ma' },
      { te: 'య', en: 'ya' },
      { te: 'ర', en: 'ra' },
      { te: 'ల', en: 'la' },
      { te: 'వ', en: 'va' },
      { te: 'శ', en: 'sha' },
      { te: 'స', en: 'sa' },
      { te: 'హ', en: 'ha' },
      { te: 'ళ', en: 'La' },
      { te: 'ఱ', en: 'Ra' }
    ];

    let i = 0;
    setInterval(() => {
      i = (i + 1) % aksharamu.length;
      letterEl.classList.add('letter-swap');
      translitEl.classList.add('letter-swap');

      setTimeout(() => {
        letterEl.textContent = aksharamu[i].te;
        translitEl.textContent = aksharamu[i].en;
        letterEl.classList.remove('letter-swap');
        translitEl.classList.remove('letter-swap');
      }, 350);
    }, 1400);
  }

  updateProfileTab() {
    const totalLessons = UNITS.reduce((acc, u) => acc + u.lessons.length, 0);
    const completedCount = this.completedLessons.length;
    const level = Math.floor(this.xp / 50) + 1;

    const profLevel = document.getElementById('profLevel');
    const profXP = document.getElementById('profXP');
    const profStreak = document.getElementById('profStreak');
    const profLessons = document.getElementById('profLessons');
    const profGems = document.getElementById('profGems');

    if (profLevel) profLevel.textContent = `Level ${level}`;
    if (profXP) profXP.textContent = `${this.xp} XP`;
    if (profStreak) profStreak.textContent = `${this.streak} Days`;
    if (profLessons) profLessons.textContent = `${completedCount} / ${totalLessons}`;
    if (profGems) profGems.textContent = this.gems;

    // Badges unlocked
    const badge1 = document.getElementById('badge-first');
    const badge2 = document.getElementById('badge-vowels');
    const badge3 = document.getElementById('badge-streak');

    if (badge1) badge1.classList.toggle('is-unlocked-badge', completedCount >= 1);
    if (badge2) badge2.classList.toggle('is-unlocked-badge', completedCount >= 4);
    if (badge3) badge3.classList.toggle('is-unlocked-badge', this.streak >= 3);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.aksharamApp = new AksharamApp();
});
