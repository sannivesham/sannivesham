// Sannivesham Aksharam — Main Application Orchestrator
// Duolingo-style gamified learning path, XP, Hearts, Streak, Practice, Dictionary & Translator

import { UNITS, DICTIONARY_WORDS } from './lessons-data.js';
import { LessonRunner } from './lesson-engine.js';
import { Sound, speakTelugu } from './audio.js';

class AksharamApp {
  constructor() {
    this.xp = parseInt(localStorage.getItem('aksharam_xp') || '0', 10);
    this.streak = parseInt(localStorage.getItem('aksharam_streak') || '0', 10);
    this.gems = parseInt(localStorage.getItem('aksharam_gems') || '10', 10);
    this.completedLessons = this.loadCompletedLessons();
    this.currentTab = 'home';

    this.runner = new LessonRunner({
      container: document.getElementById('lessonModal'),
      addXP: (pts) => {
        this.xp += pts;
        localStorage.setItem('aksharam_xp', this.xp.toString());
        this.gems += Math.ceil(pts / 5);
        localStorage.setItem('aksharam_gems', this.gems.toString());
        this.updateTopBar();
      },
      updateStreak: () => {
        this.recordActiveStreak();
      },
      onComplete: (lessonId) => {
        this.completedLessons = this.loadCompletedLessons();
        this.renderPath();
        this.updateProfileTab();
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
        if (confirm('పాఠం మధ్యలో నిష్క్రమించాలా? (Exit current lesson?)')) {
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
        // Active yesterday
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

  bindNavigation() {
    const navItems = document.querySelectorAll('.dock-tab');
    navItems.forEach(tab => {
      tab.addEventListener('click', () => {
        Sound.playClick();
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    document.querySelectorAll('.dock-tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('is-active', view.id === `tab-${tabName}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabName === 'profile') {
      this.updateProfileTab();
    }
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
      `;
      unitEl.appendChild(header);

      // Stepping Stone Path Nodes
      const pathWrap = document.createElement('div');
      pathWrap.className = 'unit-path-nodes';

      // Winding curve offsets for serpentine path look
      const offsets = [0, 26, -26, 38, -38, 16, -16];

      unit.lessons.forEach((lesson, lIdx) => {
        const isCompleted = this.completedLessons.includes(lesson.id);
        const isCurrent = !isCompleted && previousLessonUnlocked;
        const isLocked = !isCompleted && !previousLessonUnlocked;

        if (!isCompleted) {
          previousLessonUnlocked = false; // subsequent lessons stay locked
        }

        const nodeWrap = document.createElement('div');
        nodeWrap.className = 'node-wrapper';
        const shiftX = offsets[lIdx % offsets.length];
        nodeWrap.style.transform = `translateX(${shiftX}px)`;

        const node = document.createElement('button');
        node.type = 'button';
        node.className = `path-node ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''} ${isLocked ? 'is-locked' : ''}`;
        node.dataset.lessonId = lesson.id;
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
            this.runner.start(lesson);
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
    // Generate 3 dynamic revision questions
    const practiceLesson = {
      id: 'practice-' + Date.now(),
      title: 'అభ్యాస సాధన',
      titleEn: 'Practice & Revision Session',
      xp: 15,
      exercises: [
        {
          type: 'sound_match',
          promptText: 'వినండి మరియు సరైన అక్షరాన్ని ఎంచుకోండి (Listen and choose):',
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
          promptText: 'అక్షరాలను జతపరచండి (Match pairs):',
          pairs: [
            { te: 'క', en: 'ka' },
            { te: 'గ', en: 'ga' },
            { te: 'చ', en: 'cha' },
            { te: 'జ', en: 'ja' }
          ]
        }
      ]
    };

    this.runner.start(practiceLesson);
  }

  // -------------------------------------------------------------
  // 📖 DICTIONARY TAB
  // -------------------------------------------------------------
  bindDictionary() {
    const searchInput = document.getElementById('dictSearch');
    const filtersWrap = document.getElementById('dictFilters');
    const resultsGrid = document.getElementById('dictGrid');
    if (!searchInput || !resultsGrid) return;

    const categories = ['All', 'Vowels', 'Consonants', 'Numbers', 'Phrases', 'Family', 'Daily'];

    filtersWrap.innerHTML = categories.map((cat, idx) => `
      <button type="button" class="filter-chip ${idx === 0 ? 'is-active' : ''}" data-cat="${cat}">${cat}</button>
    `).join('');

    const render = () => {
      const q = searchInput.value.trim().toLowerCase();
      const activeChip = filtersWrap.querySelector('.filter-chip.is-active');
      const activeCat = activeChip ? activeChip.dataset.cat : 'All';

      const filtered = DICTIONARY_WORDS.filter(w => {
        const matchesCat = activeCat === 'All' || w.category === activeCat;
        const matchesQ = !q ||
          w.te.includes(q) ||
          w.translit.toLowerCase().includes(q) ||
          w.en.toLowerCase().includes(q);
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

      resultsGrid.innerHTML = filtered.map(item => `
        <div class="dict-card" data-word="${item.te}">
          <div class="dict-card-top">
            <span class="dict-cat-tag">${item.category}</span>
            <button type="button" class="dict-speaker-btn" aria-label="Listen">🔊</button>
          </div>
          <div class="dict-te">${item.te}</div>
          <div class="dict-translit">${item.translit}</div>
          <div class="dict-en">${item.en}</div>
          ${item.example ? `<div class="dict-example">${item.example}</div>` : ''}
        </div>
      `).join('');

      resultsGrid.querySelectorAll('.dict-card').forEach(card => {
        card.addEventListener('click', () => {
          Sound.playClick();
          speakTelugu(card.dataset.word);
        });
      });
    };

    searchInput.addEventListener('input', render);

    filtersWrap.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        Sound.playClick();
        filtersWrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        render();
      });
    });

    render();
  }

  // -------------------------------------------------------------
  // 🔄 TRANSLATOR TAB
  // -------------------------------------------------------------
  bindTranslator() {
    let fromLang = 'te';
    let toLang = 'en';

    const inputArea = document.getElementById('transInput');
    const outputArea = document.getElementById('transOutput');
    const swapBtn = document.getElementById('transSwapBtn');
    const translateBtn = document.getElementById('transActionBtn');
    const copyBtn = document.getElementById('transCopyBtn');
    const fromLabel = document.getElementById('transFromLabel');
    const toLabel = document.getElementById('transToLabel');
    const phrasesWrap = document.getElementById('transPhrases');

    if (!inputArea || !outputArea) return;

    const updateLabels = () => {
      if (fromLabel) fromLabel.textContent = fromLang === 'te' ? 'Telugu' : 'English';
      if (toLabel) toLabel.textContent = toLang === 'te' ? 'Telugu' : 'English';
      inputArea.placeholder = fromLang === 'te' ? 'Type in Telugu here...' : 'Type in English here...';
    };

    const doSwap = () => {
      Sound.playClick();
      [fromLang, toLang] = [toLang, fromLang];
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

    if (translateBtn) translateBtn.addEventListener('click', translate);

    inputArea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') translate();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const txt = outputArea.textContent;
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
  // 👤 PROFILE TAB
  // -------------------------------------------------------------
  bindProfile() {
    const soundToggle = document.getElementById('soundToggleBtn');
    if (soundToggle) {
      soundToggle.textContent = Sound.enabled ? '🔊 ఆన్ (Sound ON)' : '🔇 ఆఫ్ (Sound OFF)';
      soundToggle.addEventListener('click', () => {
        Sound.enabled = !Sound.enabled;
        soundToggle.textContent = Sound.enabled ? '🔊 ఆన్ (Sound ON)' : '🔇 ఆఫ్ (Sound OFF)';
        Sound.playClick();
      });
    }

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your learning progress?')) {
          localStorage.removeItem('aksharam_completed_lessons');
          localStorage.removeItem('aksharam_xp');
          localStorage.removeItem('aksharam_streak');
          localStorage.removeItem('aksharam_gems');
          location.reload();
        }
      });
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
