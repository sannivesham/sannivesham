// Sannivesham Aksharam — Duolingo-style Interactive Lesson Engine
import { Sound, speakTelugu } from './audio.js';

export class LessonRunner {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('lessonModal');
    this.onComplete = options.onComplete || (() => {});
    this.onClose = options.onClose || (() => {});
    this.addXP = options.addXP || (() => {});
    this.updateStreak = options.updateStreak || (() => {});

    this.lesson = null;
    this.currentIndex = 0;
    this.score = 0;
    this.selectedOption = null;
    this.isAnswerChecked = false;
    this.pairSelected = null;
    this.pairsMatched = 0;
    this.totalPairs = 0;
    this.isOpen = false;
  }

  start(lesson) {
    this.lesson = lesson;
    this.currentIndex = 0;
    this.score = 0;
    this.selectedOption = null;
    this.isAnswerChecked = false;
    this.isOpen = true;

    // Show modal
    this.container.classList.add('is-active');
    document.body.classList.add('modal-open');

    this.renderExercise();
  }

  close(triggerHistoryBack = true) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove('is-active');
    document.body.classList.remove('modal-open');
    this.onClose();

    if (triggerHistoryBack && window.location.hash === '#lesson') {
      history.back();
    }
  }

  updateHeader() {
    const progressFill = this.container.querySelector('.lesson-progress-fill');
    const total = this.lesson.exercises.length;
    const pct = Math.round((this.currentIndex / total) * 100);
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  renderExercise() {
    this.updateHeader();
    this.selectedOption = null;
    this.isAnswerChecked = false;

    const sheet = this.container.querySelector('.lesson-bottom-sheet');
    if (sheet) {
      sheet.className = 'lesson-bottom-sheet';
      sheet.innerHTML = '';
    }

    const ex = this.lesson.exercises[this.currentIndex];
    const stage = this.container.querySelector('.lesson-stage');
    stage.innerHTML = '';

    if (ex.type === 'intro') {
      this.renderIntro(stage, ex);
    } else if (ex.type === 'choice') {
      this.renderChoice(stage, ex);
    } else if (ex.type === 'sound_match') {
      this.renderSoundMatch(stage, ex);
    } else if (ex.type === 'pair_match') {
      this.renderPairMatch(stage, ex);
    }
  }

  // 1. INTRO / DISCOVERY CARD
  renderIntro(stage, ex) {
    const card = document.createElement('div');
    card.className = 'exercise-intro-card';
    card.innerHTML = `
      <div class="intro-tag">✨ కొత్త అక్షరం (New Letter)</div>
      <div class="intro-glyph-box" id="introSpeakerBtn" title="వినండి (Listen)">
        <span class="intro-glyph">${ex.te}</span>
        <button class="intro-sound-btn" type="button" aria-label="Listen">🔊</button>
      </div>
      <div class="intro-translit">${ex.translit}</div>
      <p class="intro-note">${ex.soundNote}</p>
      ${ex.exampleTe ? `
        <div class="intro-example">
          <span class="ex-label">ఉదాహరణ (Example):</span>
          <button type="button" class="ex-word-btn" id="exWordSpeaker">
            🔊 <strong class="ex-te">${ex.exampleTe}</strong> <span class="ex-en">${ex.exampleEn}</span>
          </button>
        </div>
      ` : ''}
    `;

    stage.appendChild(card);

    // Auto speak
    setTimeout(() => {
      speakTelugu(ex.te);
    }, 250);

    card.querySelector('#introSpeakerBtn').addEventListener('click', () => {
      Sound.playClick();
      speakTelugu(ex.te);
    });

    const exWord = card.querySelector('#exWordSpeaker');
    if (exWord && ex.exampleTe) {
      exWord.addEventListener('click', () => {
        Sound.playClick();
        speakTelugu(ex.exampleTe);
      });
    }

    this.renderBottomBar({
      btnText: 'కొనసాగించండి (Continue)',
      btnClass: 'btn-action-primary',
      onAction: () => {
        Sound.playClick();
        this.nextExercise();
      }
    });
  }

  // 2. MULTIPLE CHOICE
  renderChoice(stage, ex) {
    const wrap = document.createElement('div');
    wrap.className = 'exercise-choice-wrap';

    wrap.innerHTML = `
      <h2 class="exercise-question">${ex.question}</h2>
      ${ex.tip ? `<p class="exercise-tip">💡 ${ex.tip}</p>` : ''}
      <div class="options-grid">
        ${ex.options.map((opt, i) => `
          <button type="button" class="option-card" data-val="${opt}">
            <span class="option-num">${i + 1}</span>
            <span class="option-text">${opt}</span>
          </button>
        `).join('')}
      </div>
    `;

    stage.appendChild(wrap);

    const cards = wrap.querySelectorAll('.option-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (this.isAnswerChecked) return;
        Sound.playClick();
        cards.forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        this.selectedOption = card.dataset.val;
        this.enableCheckButton();
      });
    });

    this.renderBottomBar({
      btnText: 'సరిచూసుకోండి (Check)',
      btnClass: 'btn-action-check',
      disabled: true,
      onAction: () => {
        this.evaluateAnswer(this.selectedOption === ex.answer, ex.answer);
      }
    });
  }

  // 3. SOUND MATCH
  renderSoundMatch(stage, ex) {
    const wrap = document.createElement('div');
    wrap.className = 'exercise-sound-wrap';

    wrap.innerHTML = `
      <h2 class="exercise-question">${ex.promptText || 'విని సరైన అక్షరాన్ని ఎంచుకోండి:'}</h2>
      <div class="sound-speaker-banner">
        <button type="button" class="speaker-large-btn" id="soundReplayBtn" aria-label="Play sound">
          <span class="speaker-icon">🔊</span>
          <span class="speaker-label">వినడానికి నొక్కండి</span>
        </button>
      </div>
      <div class="options-grid sound-options-grid">
        ${ex.options.map(opt => `
          <button type="button" class="option-card glyph-option-card" data-val="${opt}">
            <span class="option-glyph">${opt}</span>
          </button>
        `).join('')}
      </div>
    `;

    stage.appendChild(wrap);

    // Auto play audio
    setTimeout(() => {
      speakTelugu(ex.audioTe);
    }, 300);

    wrap.querySelector('#soundReplayBtn').addEventListener('click', () => {
      Sound.playClick();
      speakTelugu(ex.audioTe);
    });

    const cards = wrap.querySelectorAll('.option-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (this.isAnswerChecked) return;
        Sound.playClick();
        cards.forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        this.selectedOption = card.dataset.val;
        this.enableCheckButton();
      });
    });

    this.renderBottomBar({
      btnText: 'సరిచూసుకోండి (Check)',
      btnClass: 'btn-action-check',
      disabled: true,
      onAction: () => {
        this.evaluateAnswer(this.selectedOption === ex.answer, ex.answer);
      }
    });
  }

  // 4. PAIR MATCH
  renderPairMatch(stage, ex) {
    this.pairsMatched = 0;
    this.totalPairs = ex.pairs.length;
    this.pairSelected = null;

    const wrap = document.createElement('div');
    wrap.className = 'exercise-pairs-wrap';

    wrap.innerHTML = `
      <h2 class="exercise-question">${ex.promptText || 'సరైన జతలను కలపండి (Tap matching pairs):'}</h2>
      <div class="pairs-grid" id="pairsGrid"></div>
    `;

    stage.appendChild(wrap);

    const grid = wrap.querySelector('#pairsGrid');

    // Flatten tiles and shuffle
    const tiles = [];
    ex.pairs.forEach((p, idx) => {
      tiles.push({ text: p.te, pairId: idx, side: 'te' });
      tiles.push({ text: p.en, pairId: idx, side: 'en' });
    });
    tiles.sort(() => Math.random() - 0.5);

    tiles.forEach(tile => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pair-tile ${tile.side === 'te' ? 'pair-tile-te' : 'pair-tile-en'}`;
      btn.textContent = tile.text;
      btn.dataset.pairId = tile.pairId;
      btn.dataset.side = tile.side;

      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-matched')) return;

        Sound.playClick();

        if (tile.side === 'te') {
          speakTelugu(tile.text);
        }

        if (!this.pairSelected) {
          btn.classList.add('is-active-tile');
          this.pairSelected = btn;
          return;
        }

        if (this.pairSelected === btn) {
          btn.classList.remove('is-active-tile');
          this.pairSelected = null;
          return;
        }

        // Two tiles tapped: check match
        const first = this.pairSelected;
        const second = btn;

        if (first.dataset.pairId === second.dataset.pairId && first.dataset.side !== second.dataset.side) {
          // MATCH!
          Sound.playCorrect();
          first.className = 'pair-tile is-matched';
          second.className = 'pair-tile is-matched';
          this.pairSelected = null;
          this.pairsMatched++;

          if (this.pairsMatched === this.totalPairs) {
            setTimeout(() => {
              this.showSuccessSheet('అన్ని జతలు సరిగ్గా కలిసాయి! (All pairs matched!)');
            }, 300);
          }
        } else {
          // WRONG!
          Sound.playWrong();
          first.classList.add('is-wrong-shake');
          second.classList.add('is-wrong-shake');
          setTimeout(() => {
            first.className = 'pair-tile';
            second.className = 'pair-tile';
            this.pairSelected = null;
          }, 600);
        }
      });

      grid.appendChild(btn);
    });

    this.renderBottomBar({
      btnText: 'కొనసాగించండి (Continue)',
      btnClass: 'btn-action-primary',
      disabled: true,
      onAction: () => {
        Sound.playClick();
        this.nextExercise();
      }
    });
  }

  enableCheckButton() {
    const btn = this.container.querySelector('.lesson-bottom-sheet .btn-action-check');
    if (btn) btn.removeAttribute('disabled');
  }

  evaluateAnswer(isCorrect, correctAnswer) {
    this.isAnswerChecked = true;

    if (isCorrect) {
      this.score++;
      Sound.playCorrect();
      this.showSuccessSheet('అద్భుతం! సరిగ్గా చెప్పారు (Excellent! Correct answer)');
    } else {
      Sound.playWrong();
      this.showErrorSheet(`సరైన సమాధానం: ${correctAnswer}`);
    }
  }

  showSuccessSheet(praiseText) {
    const sheet = this.container.querySelector('.lesson-bottom-sheet');
    sheet.className = 'lesson-bottom-sheet sheet-correct is-open';
    sheet.innerHTML = `
      <div class="sheet-content">
        <div class="sheet-feedback">
          <span class="sheet-icon">🎉</span>
          <div>
            <h3 class="sheet-title">${praiseText}</h3>
            <p class="sheet-sub">+5 XP పాయింట్లు లభించాయి</p>
          </div>
        </div>
        <button type="button" class="btn-sheet btn-sheet-correct" id="sheetContinueBtn">
          కొనసాగించండి (Continue) →
        </button>
      </div>
    `;

    sheet.querySelector('#sheetContinueBtn').addEventListener('click', () => {
      Sound.playClick();
      this.nextExercise();
    });
  }

  showErrorSheet(correctAnswerText) {
    const sheet = this.container.querySelector('.lesson-bottom-sheet');
    sheet.className = 'lesson-bottom-sheet sheet-wrong is-open';
    sheet.innerHTML = `
      <div class="sheet-content">
        <div class="sheet-feedback">
          <span class="sheet-icon">💡</span>
          <div>
            <h3 class="sheet-title">సరిచూసుకోండి (Review Answer)</h3>
            <p class="sheet-sub">${correctAnswerText}</p>
          </div>
        </div>
        <button type="button" class="btn-sheet btn-sheet-wrong" id="sheetContinueBtn">
          సరే, ముందుకు సాగండి (Continue) →
        </button>
      </div>
    `;

    sheet.querySelector('#sheetContinueBtn').addEventListener('click', () => {
      Sound.playClick();
      this.nextExercise();
    });
  }

  nextExercise() {
    this.currentIndex++;
    if (this.currentIndex < this.lesson.exercises.length) {
      this.renderExercise();
    } else {
      this.finishLesson();
    }
  }

  finishLesson() {
    Sound.playComplete();

    // Award XP and complete
    const earnedXP = this.lesson.xp || 15;
    this.addXP(earnedXP);
    this.updateStreak();

    // Save lesson completion ID
    let completed = [];
    try {
      completed = JSON.parse(localStorage.getItem('aksharam_completed_lessons') || '[]');
    } catch (e) {}

    if (!completed.includes(this.lesson.id)) {
      completed.push(this.lesson.id);
      localStorage.setItem('aksharam_completed_lessons', JSON.stringify(completed));
    }

    const total = this.lesson.exercises.length;
    const accuracy = Math.round((this.score / Math.max(1, total - 1)) * 100);

    const stage = this.container.querySelector('.lesson-stage');
    stage.innerHTML = `
      <div class="lesson-celebration-card">
        <div class="celebration-icon">🏆</div>
        <h2 class="celebration-title">Lesson Completed!</h2>
        <p class="celebration-subtitle">${this.lesson.titleEn} (${this.lesson.title})</p>

        <div class="celebration-stats-grid">
          <div class="stat-pill">
            <span class="stat-label">Total XP</span>
            <span class="stat-val">+${earnedXP} ⚡</span>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Accuracy</span>
            <span class="stat-val">${Math.min(100, accuracy)}% 🎯</span>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Status</span>
            <span class="stat-val">Completed ✓</span>
          </div>
        </div>

        <button type="button" class="btn-action-primary celebration-btn" id="finishCelebrationBtn">
          Finish Lesson →
        </button>
      </div>
    `;

    // Confetti effect
    this.triggerConfetti();

    stage.querySelector('#finishCelebrationBtn').addEventListener('click', () => {
      Sound.playClick();
      this.close();
      this.onComplete(this.lesson.id);
    });

    const sheet = this.container.querySelector('.lesson-bottom-sheet');
    if (sheet) sheet.className = 'lesson-bottom-sheet';
  }

  triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'celebration-confetti-canvas';
    this.container.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const particles = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 50,
      r: 4 + Math.random() * 6,
      d: Math.random() * 90,
      color: ['#ffd166', '#7A2048', '#1F6F5C', '#C9A227', '#ffffff'][Math.floor(Math.random() * 5)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
    }));

    let animationFrame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 1.5;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle - (particles.indexOf(p) / 3)) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (particles.some(p => p.y < canvas.height)) {
        animationFrame = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationFrame);
        canvas.remove();
      }
    };

    draw();
    setTimeout(() => {
      if (canvas.parentNode) canvas.remove();
    }, 4500);
  }

  renderBottomBar({ btnText, btnClass, disabled, onAction }) {
    const sheet = this.container.querySelector('.lesson-bottom-sheet');
    sheet.className = 'lesson-bottom-sheet is-idle';
    sheet.innerHTML = `
      <div class="sheet-idle-wrap">
        <button type="button" class="btn-action ${btnClass}" ${disabled ? 'disabled' : ''} id="sheetActionBtn">
          ${btnText}
        </button>
      </div>
    `;

    sheet.querySelector('#sheetActionBtn').addEventListener('click', onAction);
  }
}
