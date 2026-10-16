// Sannivesham Aksharam — lesson.js
// Multi-content Interactive Section Player: Matter, Video, Photos, Match Game, Quiz
// Real-time synchronization with Firebase Firestore & localStorage

import {
  auth,
  onAuthStateChanged,
  subscribeToRoadmap,
  subscribeToUserProgress,
  saveUserProgress,
  getUserProgressLocal
} from "./firebase.js";

import { getInitialMilestones } from "./roadmap-data.js";
import { speakTelugu, showToast } from "./main.js";

let currentMilestones = getInitialMilestones();
let currentUserProgress = getUserProgressLocal();
let currentUserId = null;

let activeMilestone = null;
let activeSection = null;
let activeTabId = null;

// Sequential navigation list
let allSectionsFlat = [];
let currentSectionIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  initLessonPage();
});

function initLessonPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetMilestoneId = urlParams.get('milestone') || 'milestone-1';
  const targetSectionId = urlParams.get('section') || 'sec-1-1';

  // Load Roadmap & locate section
  subscribeToRoadmap((milestones) => {
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      currentMilestones = milestones;
    } else {
      currentMilestones = getInitialMilestones();
    }
    setupSectionData(targetMilestoneId, targetSectionId);
  });

  // Track User Progress
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      subscribeToUserProgress(user.uid, (progress) => {
        currentUserProgress = progress || getUserProgressLocal();
        updateCompletionStatusUI();
      });
    } else {
      currentUserId = null;
      currentUserProgress = getUserProgressLocal();
      updateCompletionStatusUI();
    }
  });

  // Bottom Navigation Buttons
  const btnPrev = document.getElementById('btnPrevSection');
  const btnNext = document.getElementById('btnNextSection');
  const btnComplete = document.getElementById('btnCompleteSection');

  if (btnPrev) {
    btnPrev.onclick = () => {
      if (currentSectionIndex > 0) {
        const prev = allSectionsFlat[currentSectionIndex - 1];
        window.location.href = `lesson.html?milestone=${encodeURIComponent(prev.milestoneId)}&section=${encodeURIComponent(prev.section.id)}`;
      }
    };
  }

  if (btnNext) {
    btnNext.onclick = () => {
      if (currentSectionIndex < allSectionsFlat.length - 1) {
        const next = allSectionsFlat[currentSectionIndex + 1];
        window.location.href = `lesson.html?milestone=${encodeURIComponent(next.milestoneId)}&section=${encodeURIComponent(next.section.id)}`;
      } else {
        window.location.href = `dashboard.html`;
      }
    };
  }

  if (btnComplete) {
    btnComplete.onclick = markCurrentSectionCompleted;
  }
}

function setupSectionData(mId, sId) {
  // Flatten all sections for easy prev/next navigation
  allSectionsFlat = [];
  currentMilestones.forEach(m => {
    (m.sections || []).forEach(s => {
      allSectionsFlat.push({ milestoneId: m.id, milestoneTitle: m.title, section: s });
    });
  });

  // Find active milestone and section
  activeMilestone = currentMilestones.find(m => m.id === mId) || currentMilestones[0];
  if (activeMilestone) {
    activeSection = (activeMilestone.sections || []).find(s => s.id === sId) || (activeMilestone.sections ? activeMilestone.sections[0] : null);
  }

  if (!activeSection && allSectionsFlat.length > 0) {
    activeMilestone = currentMilestones[0];
    activeSection = allSectionsFlat[0].section;
  }

  currentSectionIndex = allSectionsFlat.findIndex(item => item.section.id === activeSection?.id);

  // Update Top Bar Headings
  const headerMilestoneCrumb = document.getElementById('headerMilestoneCrumb');
  const headerSectionTitle = document.getElementById('headerSectionTitle');

  if (headerMilestoneCrumb && activeMilestone) {
    headerMilestoneCrumb.textContent = `${activeMilestone.badge || 'Level'} • ${activeMilestone.title}`;
  }
  if (headerSectionTitle && activeSection) {
    headerSectionTitle.textContent = activeSection.title;
    document.title = `${activeSection.title} — Sannivesham Aksharam`;
  }

  updateCompletionStatusUI();
  renderTabsAndPanels();
  updatePrevNextButtons();
}

function updateCompletionStatusUI() {
  if (!activeSection) return;
  const pill = document.getElementById('sectionStatusPill');
  const btnComplete = document.getElementById('btnCompleteSection');
  const isDone = (currentUserProgress?.completedSections || []).includes(activeSection.id);

  if (pill) {
    if (isDone) {
      pill.className = "completion-status-pill status-done";
      pill.textContent = "✓ Completed";
    } else {
      pill.className = "completion-status-pill status-pending";
      pill.textContent = "In Progress";
    }
  }

  if (btnComplete) {
    if (isDone) {
      btnComplete.textContent = "✓ Section Completed";
      btnComplete.style.background = "var(--teal)";
      btnComplete.disabled = false;
    } else {
      btnComplete.textContent = "✓ Mark Section Complete (+50 XP)";
      btnComplete.style.background = "";
      btnComplete.disabled = false;
    }
  }
}

function updatePrevNextButtons() {
  const btnPrev = document.getElementById('btnPrevSection');
  const btnNext = document.getElementById('btnNextSection');

  if (btnPrev) {
    if (currentSectionIndex <= 0) {
      btnPrev.style.visibility = 'hidden';
    } else {
      btnPrev.style.visibility = 'visible';
    }
  }

  if (btnNext) {
    if (currentSectionIndex >= allSectionsFlat.length - 1) {
      btnNext.textContent = "Complete Roadmap 🎉";
    } else {
      btnNext.textContent = "Next Section →";
    }
  }
}

function renderTabsAndPanels() {
  const tabsStrip = document.getElementById('contentTabsStrip');
  const panelsContainer = document.getElementById('tabPanelsContainer');
  if (!tabsStrip || !panelsContainer || !activeSection) return;

  const items = activeSection.items || [];
  const matterItems = items.filter(i => i.type === 'matter');
  const videoItems = items.filter(i => i.type === 'video');
  const photoItems = items.filter(i => i.type === 'photos');
  const matchItems = items.filter(i => i.type === 'match');
  const quizItems = items.filter(i => i.type === 'quiz');

  // Define Available Tabs
  const tabs = [];
  if (matterItems.length > 0 || items.length === 0) tabs.push({ id: 'tab-matter', label: '📖 Matter', count: matterItems.length });
  if (videoItems.length > 0) tabs.push({ id: 'tab-video', label: '🎥 Video', count: videoItems.length });
  if (photoItems.length > 0) tabs.push({ id: 'tab-photos', label: '🖼️ Photos', count: photoItems.length });
  if (matchItems.length > 0) tabs.push({ id: 'tab-match', label: '🧩 Match Game', count: matchItems.length });
  if (quizItems.length > 0) tabs.push({ id: 'tab-quiz', label: '❓ Quiz', count: quizItems.length });

  if (tabs.length === 0) {
    tabs.push({ id: 'tab-matter', label: '📖 Matter', count: 1 });
  }

  // Set default active tab
  if (!activeTabId || !tabs.some(t => t.id === activeTabId)) {
    activeTabId = tabs[0].id;
  }

  // Render Tab Buttons
  tabsStrip.innerHTML = tabs.map(t => `
    <button type="button" class="content-tab-btn ${t.id === activeTabId ? 'is-active' : ''}" data-tab="${t.id}">
      ${t.label}
    </button>
  `).join('');

  // Tab click handler
  tabsStrip.querySelectorAll('.content-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      activeTabId = tabId;
      tabsStrip.querySelectorAll('.content-tab-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      panelsContainer.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('is-active'));
      const activePanel = document.getElementById(tabId);
      if (activePanel) activePanel.classList.add('is-active');
    });
  });

  // Render Panels
  panelsContainer.innerHTML = `
    <!-- 1. MATTER TAB -->
    <div class="tab-content-panel ${activeTabId === 'tab-matter' ? 'is-active' : ''}" id="tab-matter">
      <div class="panel-card matter-article">
        ${matterItems.length > 0 ? matterItems.map(m => `
          <h2>${m.title || 'వివరణ • Explanation'}</h2>
          <div class="matter-body">${formatMatterContent(m.content || '')}</div>
        `).join('<hr style="margin: 2rem 0; border: none; border-top: 1px dashed var(--border-light);">') : `
          <h2>${activeSection.title}</h2>
          <div class="matter-body">
            <p>${activeSection.summary || 'Detailed lesson matter is being synced from the cloud.'}</p>
          </div>
        `}
      </div>
    </div>

    <!-- 2. VIDEO TAB -->
    <div class="tab-content-panel ${activeTabId === 'tab-video' ? 'is-active' : ''}" id="tab-video">
      <div class="panel-card video-panel-wrapper">
        ${videoItems.map(v => `
          <div class="video-player-container">
            <iframe src="${formatVideoUrl(v.videoUrl)}" title="${v.title || 'Telugu Lesson Video'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
          <div class="video-caption-box">
            <h3>${v.title || 'వీడియో పాఠం'}</h3>
            <p>${v.caption || 'Watch closely to master exact pronunciation and intonation.'}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. PHOTOS TAB -->
    <div class="tab-content-panel ${activeTabId === 'tab-photos' ? 'is-active' : ''}" id="tab-photos">
      <div class="panel-card">
        <h2 style="font-family: var(--font-telugu); font-size: 1.6rem; color: var(--maroon-dark); margin-bottom: 1.5rem;">చిత్ర పదజాలం • Illustrated Cards</h2>
        <div class="photos-grid-wrapper">
          ${photoItems.flatMap(p => p.photos || []).map(photo => `
            <div class="photo-card">
              <div class="photo-img-wrap">
                <img src="${photo.url}" alt="${photo.label || 'Card'}" loading="lazy">
              </div>
              <div class="photo-caption-info">
                <div class="photo-telugu-label">
                  <span>${photo.label}</span>
                  <button type="button" class="btn-photo-speak" title="Pronounce" onclick="speakTelugu('${escapeForSpeak(photo.label)}')">🔊</button>
                </div>
                ${photo.caption ? `<p class="photo-desc">${photo.caption}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 4. MATCH THE FOLLOWING TAB -->
    <div class="tab-content-panel ${activeTabId === 'tab-match' ? 'is-active' : ''}" id="tab-match">
      <div class="panel-card match-arena-wrapper" id="matchArenaCard">
        <!-- Rendered by initMatchGame() -->
      </div>
    </div>

    <!-- 5. QUIZ TAB -->
    <div class="tab-content-panel ${activeTabId === 'tab-quiz' ? 'is-active' : ''}" id="tab-quiz">
      <div class="panel-card quiz-panel-wrapper" id="quizArenaCard">
        <!-- Rendered by initQuizGame() -->
      </div>
    </div>
  `;

  // Attach click-to-speak on any Telugu words in Matter
  attachPronunciationListeners();

  // Initialize Match Game if available
  if (matchItems.length > 0) {
    initMatchGame(matchItems[0]);
  }

  // Initialize Quiz Game if available
  if (quizItems.length > 0) {
    initQuizGame(quizItems[0]);
  }
}

// Format simple markdown into styled HTML with audio buttons
function formatMatterContent(markdown) {
  if (!markdown) return '';
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n\* (.*$)/gim, '<li>$1</li>');

  html = `<p>${html}</p>`;
  html = html.replace(/<li>(.*?)<\/li>/gim, (match) => {
    return `<ul>${match}</ul>`;
  }).replace(/<\/ul>\s*<ul>/gim, '');

  return html;
}

function formatVideoUrl(url) {
  if (!url) return "https://www.youtube-nocookie.com/embed/5qap5aO4i9A";
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  return url;
}

function escapeForSpeak(text) {
  if (!text) return '';
  return text.replace(/[—\-\(\)\/\d]/g, '').trim();
}

function attachPronunciationListeners() {
  document.querySelectorAll('.matter-body strong').forEach(el => {
    const text = el.textContent.trim();
    // If text contains Telugu letters
    if (/[\u0C00-\u0C7F]/.test(text) && text.length < 15) {
      el.style.cursor = 'pointer';
      el.title = 'Click to listen to pronunciation 🔊';
      el.classList.add('vocab-audio-pill');
      el.addEventListener('click', () => {
        speakTelugu(text);
      });
    }
  });
}

// ----------------------------------------------------
// 🧩 MATCH THE FOLLOWING INTERACTIVE ENGINE
// ----------------------------------------------------
function initMatchGame(matchData) {
  const container = document.getElementById('matchArenaCard');
  if (!container || !matchData || !matchData.pairs) return;

  const pairs = matchData.pairs;
  let selectedLeft = null;
  let selectedRight = null;
  let matchedIndices = new Set();

  // Create shuffled right column
  const shuffledRight = pairs.map((p, idx) => ({ text: p.right, origIndex: idx }))
                             .sort(() => Math.random() - 0.5);

  const renderArena = () => {
    const isAllMatched = matchedIndices.size === pairs.length;

    container.innerHTML = `
      <div class="match-instructions-bar">
        <p class="match-instruction-text">
          ${matchData.instructions || 'Tap a Telugu card on the left, then tap its matching pair on the right!'}
        </p>
        <span class="match-score-badge">Matched: ${matchedIndices.size} / ${pairs.length}</span>
      </div>

      ${isAllMatched ? `
        <div class="match-celebration-card">
          <div style="font-size: 3rem;">🎉</div>
          <h3>చాలా బాగుంది! Perfect Matching!</h3>
          <p>You matched all ${pairs.length} pairs flawlessly and earned <strong>+20 XP</strong>!</p>
          <button type="button" class="btn btn-primary" id="btnRestartMatch">Play Again 🔁</button>
        </div>
      ` : `
        <div class="match-columns-grid">
          <div class="match-column">
            <span class="match-column-title">Telugu Item (తెలుగు)</span>
            ${pairs.map((p, i) => {
              const isMatched = matchedIndices.has(i);
              const isSelected = selectedLeft === i;
              return `
                <button type="button" class="match-tile-btn ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''}" data-left-idx="${i}" ${isMatched ? 'disabled' : ''}>
                  <span>${p.left}</span>
                  <span style="font-size: 0.9rem; opacity: 0.7;">🔊</span>
                </button>
              `;
            }).join('')}
          </div>

          <div class="match-column">
            <span class="match-column-title">Meaning / Match (అర్థం)</span>
            ${shuffledRight.map((r, rIdx) => {
              const isMatched = matchedIndices.has(r.origIndex);
              const isSelected = selectedRight === r.origIndex;
              return `
                <button type="button" class="match-tile-btn ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''}" data-right-orig-idx="${r.origIndex}" ${isMatched ? 'disabled' : ''}>
                  <span>${r.text}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `}
    `;

    if (isAllMatched) {
      const btnRestart = document.getElementById('btnRestartMatch');
      if (btnRestart) {
        btnRestart.onclick = () => initMatchGame(matchData);
      }
      awardXP(20, "Matching Game Complete!");
      return;
    }

    // Attach click events on left column
    container.querySelectorAll('[data-left-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.leftIdx, 10);
        selectedLeft = idx;
        speakTelugu(pairs[idx].left);
        checkMatchAttempt();
      });
    });

    // Attach click events on right column
    container.querySelectorAll('[data-right-orig-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.rightOrigIdx, 10);
        selectedRight = idx;
        checkMatchAttempt();
      });
    });
  };

  const checkMatchAttempt = () => {
    renderArena();
    if (selectedLeft === null || selectedRight === null) return;

    if (selectedLeft === selectedRight) {
      // MATCH SUCCESS!
      matchedIndices.add(selectedLeft);
      selectedLeft = null;
      selectedRight = null;
      renderArena();
    } else {
      // MISMATCH!
      const leftBtn = container.querySelector(`[data-left-idx="${selectedLeft}"]`);
      const rightBtn = container.querySelector(`[data-right-orig-idx="${selectedRight}"]`);
      if (leftBtn) leftBtn.classList.add('is-error-shake');
      if (rightBtn) rightBtn.classList.add('is-error-shake');

      setTimeout(() => {
        selectedLeft = null;
        selectedRight = null;
        renderArena();
      }, 500);
    }
  };

  renderArena();
}

// ----------------------------------------------------
// ❓ QUIZ INTERACTIVE ENGINE
// ----------------------------------------------------
function initQuizGame(quizData) {
  const container = document.getElementById('quizArenaCard');
  if (!container || !quizData || !quizData.questions) return;

  const questions = quizData.questions;
  let currentQIndex = 0;
  let userScore = 0;
  let answersRecord = [];
  let isAnswered = false;

  const renderQuestion = () => {
    if (currentQIndex >= questions.length) {
      renderSummary();
      return;
    }

    const q = questions[currentQIndex];
    isAnswered = false;

    container.innerHTML = `
      <div class="quiz-progress-row">
        <span>Question ${currentQIndex + 1} of ${questions.length}</span>
        <span>Score: ${userScore} / ${questions.length}</span>
      </div>

      <div class="quiz-question-card">
        <h3 class="quiz-question-text">${q.question}</h3>
        <div class="quiz-options-list">
          ${q.options.map((opt, oIdx) => `
            <button type="button" class="quiz-option-btn" data-opt-idx="${oIdx}">
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--maroon);">${String.fromCharCode(65 + oIdx)}.</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>

        <div id="quizFeedbackBox" style="display: none;"></div>

        <div class="quiz-next-action-row" id="quizNextRow" style="display: none;">
          <button type="button" class="btn btn-primary" id="btnNextQuizQ">
            ${currentQIndex === questions.length - 1 ? 'See Results →' : 'Next Question →'}
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isAnswered) return;
        isAnswered = true;
        const selectedIdx = parseInt(btn.dataset.optIdx, 10);
        const isCorrect = selectedIdx === q.answerIndex;

        answersRecord.push({ question: q.question, isCorrect });
        if (isCorrect) userScore++;

        // Highlight options
        container.querySelectorAll('.quiz-option-btn').forEach(b => {
          const bIdx = parseInt(b.dataset.optIdx, 10);
          b.disabled = true;
          if (bIdx === q.answerIndex) {
            b.classList.add('opt-correct');
          } else if (bIdx === selectedIdx) {
            b.classList.add('opt-wrong');
          }
        });

        // Show explanation
        const feedbackBox = document.getElementById('quizFeedbackBox');
        if (feedbackBox) {
          feedbackBox.className = "quiz-explanation-box";
          feedbackBox.innerHTML = `
            <strong>${isCorrect ? '✅ సరిగ్గా సమాధానం ఇచ్చారు! (Correct!)' : '❌ సరికాని సమాధానం (Incorrect)'}</strong>
            <p style="margin: 0.4rem 0 0;">${q.explanation || ''}</p>
          `;
          feedbackBox.style.display = 'block';
        }

        const nextRow = document.getElementById('quizNextRow');
        if (nextRow) nextRow.style.display = 'flex';
      });
    });

    const btnNext = document.getElementById('btnNextQuizQ');
    if (btnNext) {
      btnNext.onclick = () => {
        currentQIndex++;
        renderQuestion();
      };
    }
  };

  const renderSummary = () => {
    const percentage = Math.round((userScore / questions.length) * 100);
    const passed = percentage >= 60;

    container.innerHTML = `
      <div class="quiz-summary-card">
        <div class="quiz-trophy-icon">${passed ? '🏆' : '🎯'}</div>
        <h2>${passed ? 'అభినందనలు! Quiz Passed!' : 'బాగా ప్రయత్నించారు! Keep Practicing!'}</h2>
        <div class="quiz-score-circle">${userScore} / ${questions.length} (${percentage}%)</div>
        <p style="color: var(--ink-soft); max-width: 26rem; margin: 0 auto;">
          ${passed 
            ? 'Excellent work! You have proven strong mastery of this section.' 
            : 'Review the lesson matter or matching game once more to score 100%!'}
        </p>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem;">
          <button type="button" class="btn btn-ghost" id="btnRetryQuiz">Retake Quiz 🔁</button>
          ${passed ? `
            <button type="button" class="btn btn-primary" id="btnQuizCompleteSection">Mark Section Complete ✓</button>
          ` : ''}
        </div>
      </div>
    `;

    if (passed) {
      awardXP(30, "Quiz Passed!");
    }

    const btnRetry = document.getElementById('btnRetryQuiz');
    if (btnRetry) btnRetry.onclick = () => initQuizGame(quizData);

    const btnComplete = document.getElementById('btnQuizCompleteSection');
    if (btnComplete) btnComplete.onclick = markCurrentSectionCompleted;
  };

  renderQuestion();
}

// ----------------------------------------------------
// COMPLETE SECTION & XP SYNC
// ----------------------------------------------------
async function markCurrentSectionCompleted() {
  if (!activeSection) return;

  const currentList = new Set(currentUserProgress.completedSections || []);
  const wasAlreadyCompleted = currentList.has(activeSection.id);
  currentList.add(activeSection.id);

  const updatedSections = Array.from(currentList);
  const additionalXP = wasAlreadyCompleted ? 10 : 50;
  const newXP = (currentUserProgress.xp || 50) + additionalXP;

  currentUserProgress = {
    ...currentUserProgress,
    completedSections: updatedSections,
    xp: newXP,
    lastActiveDate: new Date().toISOString().split('T')[0]
  };

  updateCompletionStatusUI();

  // Save to Firestore and local
  await saveUserProgress(currentUserId, currentUserProgress);
  showToast(`🎉 Section Completed! +${additionalXP} XP earned!`, 'success');
}

function awardXP(points, reason) {
  const newXP = (currentUserProgress.xp || 50) + points;
  currentUserProgress = {
    ...currentUserProgress,
    xp: newXP
  };
  saveUserProgress(currentUserId, currentUserProgress);
  showToast(`⭐ +${points} XP: ${reason}`, 'info');
}
