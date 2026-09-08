// Sannivesham Aksharam — Main Application Orchestrator
// Duolingo-style gamified learning path, XP, Hearts, Streak, Practice, Dictionary & Translator

import { UNITS, DICTIONARY_WORDS } from './lessons-data.js';
import { LessonRunner } from './lesson-engine.js';
import { Sound, speakTelugu } from './audio.js';

class AksharamApp {
  constructor() {
    this.xp = parseInt(localStorage.getItem('aksharam_xp') || '0', 10);
    this.streak = parseInt(localStorage.getItem('aksharam_streak') || '0', 10);
    this.hearts = parseInt(localStorage.getItem('aksharam_hearts') || '5', 10);
    this.gems = parseInt(localStorage.getItem('aksharam_gems') || '10', 10);
    this.completedLessons = this.loadCompletedLessons();
    this.currentTab = 'learn';

    this.runner = new LessonRunner({
      container: document.getElementById('lessonModal'),
      getHearts: () => this.hearts,
      setHearts: (val) => {
        this.hearts = val;
        localStorage.setItem('aksharam_hearts', this.hearts.toString());
        this.updateTopBar();
      },
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
    const heartsEl = document.getElementById('topHearts');
    const xpEl = document.getElementById('topXP');
    const gemsEl = document.getElementById('topGems');

    if (streakEl) streakEl.textContent = this.streak;
    if (heartsEl) heartsEl.textContent = this.hearts;
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
          <h2 class="unit-title">విభాగం ${unit.unitNumber}: ${unit.title}</h2>
          <p class="unit-sub">${unit.titleEn} — ${unit.desc}</p>
        </div>
      `;
      unitEl.appendChild(header);

      // Stepping Stone Path Nodes
      const pathWrap = document.createElement('div');
      pathWrap.className = 'unit-path-nodes';

      // Winding curve offsets for Duolingo serpentine path look
      const offsets = [0, 28, -28, 40, -40, 18, -18];

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
        node.setAttribute('aria-label', `${lesson.title} - ${lesson.titleEn}`);

        node.innerHTML = `
          <div class="node-inner">
            <span class="node-icon">${isCompleted ? '✓' : isLocked ? '🔒' : lesson.icon}</span>
          </div>
          ${isCurrent ? '<div class="node-pulse-ring"></div><div class="node-tooltip">ప్రారంభించండి (Start)</div>' : ''}
        `;

        node.addEventListener('click', () => {
          Sound.playClick();
          if (isLocked) {
            alert('🔒 ఈ పాఠాన్ని తెరవడానికి మునుపటి పాఠాలను పూర్తి చేయండి (Finish previous lessons to unlock this one).');
          } else {
            this.runner.start(lesson);
          }
        });

        const label = document.createElement('div');
        label.className = 'node-label';
        label.innerHTML = `
          <strong class="node-te-name">${lesson.title}</strong>
          <span class="node-en-name">${lesson.titleEn}</span>
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
          alert(`🎉 అభినందనలు! విభాగం ${unit.unitNumber} పూర్తయింది. +50 బోనస్ రత్నాలు లభించాయి!`);
        } else {
          alert(`📦 విభాగం ${unit.unitNumber} లోని అన్ని పాఠాలు పూర్తయిన తర్వాత ఈ బహుమతి పెట్టె తెరుచుకుంటుంది!`);
        }
      });

      const chestLabel = document.createElement('div');
      chestLabel.className = 'node-label';
      chestLabel.innerHTML = `<strong>విభాగ ముగింపు బహుమతి</strong><span>Unit Bonus Chest</span>`;

      chestWrap.appendChild(chest);
      chestWrap.appendChild(chestLabel);
      pathWrap.appendChild(chestWrap);

      unitEl.appendChild(pathWrap);
      container.appendChild(unitEl);
    });
  }

  // -------------------------------------------------------------
  // 🎯 PRACTICE MODE (Heart Refiller)
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
    // Generate 3 dynamic questions from completed or foundation letters
    const practiceLesson = {
      id: 'practice-' + Date.now(),
      title: 'అభ్యాస సాధన',
      titleEn: 'Practice Session',
      xp: 10,
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

    // Temporarily grant an infinite heart for practice
    const prevHearts = this.hearts;
    this.runner.getHearts = () => Math.max(1, this.hearts);

    this.runner.start(practiceLesson);

    const origOnComplete = this.runner.onComplete;
    this.runner.onComplete = () => {
      // Restore +2 hearts
      this.hearts = Math.min(5, prevHearts + 2);
      localStorage.setItem('aksharam_hearts', this.hearts.toString());
      this.updateTopBar();
      this.runner.onComplete = origOnComplete;
      alert(`❤️ అభ్యాసం పూర్తయింది! గుండెలు పెరిగాయి (${this.hearts}/5).`);
    };
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

      document.getElementById('dictCount').textContent = `${filtered.length} పదాలు (words)`;

      if (filtered.length === 0) {
        resultsGrid.innerHTML = `
          <div class="dict-empty-state">
            <span class="empty-icon">🔍</span>
            <p>ఏ ఫలితాలు కనుగొనబడలేదు (No words found)</p>
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
      if (fromLabel) fromLabel.textContent = fromLang === 'te' ? 'తెలుగు (Telugu)' : 'English';
      if (toLabel) toLabel.textContent = toLang === 'te' ? 'తెలుగు (Telugu)' : 'English';
      inputArea.placeholder = fromLang === 'te' ? 'తెలుగులో ఇక్కడ టైప్ చేయండి...' : 'Type English text here...';
    };

    const doSwap = () => {
      Sound.playClick();
      [fromLang, toLang] = [toLang, fromLang];
      const prevOut = outputArea.textContent.trim();
      if (prevOut && !outputArea.classList.contains('is-placeholder')) {
        inputArea.value = prevOut;
      }
      outputArea.textContent = fromLang === 'te' ? 'అనువాదం ఇక్కడ కనిపిస్తుంది...' : 'Translation will appear here...';
      outputArea.classList.add('is-placeholder');
      updateLabels();
    };

    if (swapBtn) swapBtn.addEventListener('click', doSwap);

    const translate = async () => {
      const text = inputArea.value.trim();
      if (!text) return;

      translateBtn.disabled = true;
      outputArea.textContent = 'అనువదిస్తోంది (Translating)...';
      outputArea.classList.remove('is-placeholder');

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        let result = '';
        if (data && data[0]) {
          data[0].forEach(p => { if (p[0]) result += p[0]; });
        }
        outputArea.textContent = result || 'అనువాదం విఫలమైంది (Translation failed)';
      } catch (err) {
        outputArea.textContent = 'అనువాదం విఫలమైంది. దయచేసి నెట్‌వర్క్ కనెక్షన్ తనిఖీ చేయండి.';
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
          copyBtn.textContent = '✓ కాపీ అయింది (Copied)';
          setTimeout(() => {
            copyBtn.textContent = '📋 కాపీ చేయండి (Copy)';
          }, 2000);
        }
      });
    }

    // Quick phrases
    const quick = [
      'నమస్కారం', 'ధన్యవాదాలు', 'ఎలా ఉన్నారు?',
      'శుభోదయం', 'శుభ రాత్రి', 'నేను బాగున్నాను'
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
        if (confirm('ఖచ్చితంగా మొత్తం ప్రగతిని రీసెట్ చేయాలనుకుంటున్నారా? (Reset all learning progress?)')) {
          localStorage.removeItem('aksharam_completed_lessons');
          localStorage.removeItem('aksharam_xp');
          localStorage.removeItem('aksharam_streak');
          localStorage.removeItem('aksharam_hearts');
          location.reload();
        }
      });
    }
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

    if (profLevel) profLevel.textContent = `స్థాయి ${level} (Level ${level})`;
    if (profXP) profXP.textContent = `${this.xp} XP`;
    if (profStreak) profStreak.textContent = `${this.streak} రోజులు (Days)`;
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
