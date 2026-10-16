// Sannivesham Aksharam — dashboard.js
// Powers the interactive Roadmap & Learner Hub with Realtime Firestore sync

import {
  auth,
  onAuthStateChanged,
  subscribeToRoadmap,
  subscribeToUserProgress,
  getUserProgressLocal
} from "./firebase.js";

import { getInitialMilestones } from "./roadmap-data.js";

let currentMilestones = getInitialMilestones();
let currentUserProgress = getUserProgressLocal();
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  // 1. Initial render with available cached milestones
  renderDashboardUI(currentMilestones, currentUserProgress);

  // 2. Realtime listener for Roadmap curriculum from Firestore
  subscribeToRoadmap((milestones, source) => {
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      currentMilestones = milestones;
      const syncBadge = document.getElementById('syncStatusText');
      if (syncBadge) {
        syncBadge.textContent = source === "cloud" ? "Live Cloud Sync Active" : "Local Sync Active";
      }
      renderDashboardUI(currentMilestones, currentUserProgress);
    } else {
      // Use rich default curriculum
      currentMilestones = getInitialMilestones();
      renderDashboardUI(currentMilestones, currentUserProgress);
    }
  });

  // 3. User Authentication & Progress Realtime Sync
  let progressUnsub = null;
  onAuthStateChanged(auth, (user) => {
    if (progressUnsub) {
      progressUnsub();
      progressUnsub = null;
    }

    if (user) {
      currentUserId = user.uid;
      progressUnsub = subscribeToUserProgress(user.uid, (progress) => {
        currentUserProgress = progress || getUserProgressLocal();
        renderDashboardUI(currentMilestones, currentUserProgress);
      });
    } else {
      currentUserId = null;
      currentUserProgress = getUserProgressLocal();
      renderDashboardUI(currentMilestones, currentUserProgress);
    }
  });
}

function renderDashboardUI(milestones, progress) {
  const container = document.getElementById('milestonesFlowContainer');
  if (!container) return;

  const completedList = progress?.completedSections || [];
  let totalSections = 0;
  let completedCount = 0;
  let firstIncompleteSection = null;
  let firstIncompleteMilestone = null;

  // Calculate totals and find next up section
  milestones.forEach((m) => {
    (m.sections || []).forEach((s) => {
      totalSections++;
      if (completedList.includes(s.id)) {
        completedCount++;
      } else if (!firstIncompleteSection) {
        firstIncompleteSection = s;
        firstIncompleteMilestone = m;
      }
    });
  });

  // Calculate percentage
  const percentage = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  // Update Stats Strip
  const userStreakVal = document.getElementById('userStreakVal');
  const userXpVal = document.getElementById('userXpVal');
  const userCompletedVal = document.getElementById('userCompletedVal');
  const userLevelVal = document.getElementById('userLevelVal');
  const progressPercentText = document.getElementById('progressPercentText');
  const progressFillBar = document.getElementById('progressFillBar');

  if (userStreakVal) userStreakVal.textContent = `${progress?.streak || 1} Day${(progress?.streak || 1) === 1 ? '' : 's'}`;
  if (userXpVal) userXpVal.textContent = `${progress?.xp || (completedCount * 50 + 20)} XP`;
  if (userCompletedVal) userCompletedVal.textContent = `${completedCount} / ${totalSections}`;
  if (progressPercentText) progressPercentText.textContent = `${percentage}%`;
  if (progressFillBar) progressFillBar.style.width = `${percentage}%`;

  // Determine Level badge
  if (userLevelVal) {
    if (completedCount >= 6) userLevelVal.textContent = "Level 4 • Real-World";
    else if (completedCount >= 4) userLevelVal.textContent = "Level 3 • Syllables";
    else if (completedCount >= 2) userLevelVal.textContent = "Level 2 • Consonants";
    else userLevelVal.textContent = "Level 1 • Foundations";
  }

  // Update Quick Resume Banner
  const resumeTitle = document.getElementById('resumeSectionTitle');
  const resumeSubtitle = document.getElementById('resumeSectionSubtitle');
  const btnResume = document.getElementById('btnResumeNext');

  if (firstIncompleteSection && firstIncompleteMilestone) {
    if (resumeTitle) resumeTitle.textContent = firstIncompleteSection.title;
    if (resumeSubtitle) resumeSubtitle.textContent = `${firstIncompleteMilestone.title} • ${firstIncompleteSection.subtitle || ''}`;
    if (btnResume) {
      btnResume.onclick = () => {
        window.location.href = `lesson.html?milestone=${encodeURIComponent(firstIncompleteMilestone.id)}&section=${encodeURIComponent(firstIncompleteSection.id)}`;
      };
    }
  } else {
    // All completed!
    if (resumeTitle) resumeTitle.textContent = "అభినందనలు! All sections completed!";
    if (resumeSubtitle) resumeSubtitle.textContent = "You have mastered all milestones in the curriculum. Practice quizzes or review any lesson anytime!";
    if (btnResume) {
      btnResume.textContent = "Review Level 1 →";
      btnResume.onclick = () => {
        window.location.href = `lesson.html?milestone=milestone-1&section=sec-1-1`;
      };
    }
  }

  // Render Milestones Flow
  container.innerHTML = milestones.map((milestone, mIndex) => {
    const sections = milestone.sections || [];
    const milestoneCompletedCount = sections.filter(s => completedList.includes(s.id)).length;
    const isMilestoneDone = sections.length > 0 && milestoneCompletedCount === sections.length;
    const isMilestoneActive = !isMilestoneDone && (mIndex === 0 || sections.some(s => !completedList.includes(s.id)));

    let statusChipClass = "chip-progress";
    let statusChipText = `${milestoneCompletedCount} / ${sections.length} Done`;
    if (isMilestoneDone) {
      statusChipClass = "chip-complete";
      statusChipText = "✓ Completed";
    }

    return `
      <div class="milestone-block ${isMilestoneActive ? 'milestone-active' : ''}" id="block-${milestone.id}">
        <div class="milestone-header">
          <div class="milestone-title-col">
            <div class="milestone-badge-row">
              <div class="milestone-icon-node" style="background: ${milestone.color || 'var(--maroon)'};">
                ${milestone.icon || '📚'}
              </div>
              <span class="milestone-level-tag">${milestone.badge || `Milestone ${mIndex + 1}`}</span>
              <span class="milestone-status-chip ${statusChipClass}">${statusChipText}</span>
            </div>
            <h2>${milestone.title}</h2>
            <div class="milestone-subtitle">${milestone.titleEn || ''}</div>
            <p class="milestone-desc">${milestone.description || ''}</p>
          </div>
        </div>

        <div class="sections-container">
          ${sections.map((sec, sIndex) => {
            const isDone = completedList.includes(sec.id);
            const items = sec.items || [];
            const hasVideo = items.some(i => i.type === 'video');
            const hasPhotos = items.some(i => i.type === 'photos');
            const hasMatter = items.some(i => i.type === 'matter');
            const hasMatch = items.some(i => i.type === 'match');
            const hasQuiz = items.some(i => i.type === 'quiz');

            return `
              <div class="section-item-card ${isDone ? 'is-completed' : ''}">
                <div class="section-meta-left">
                  <div class="section-number-badge">${sIndex + 1}</div>
                  <div class="section-text-col">
                    <h3>
                      ${sec.title}
                      ${isDone ? '<span class="completed-check-icon">✓ Completed</span>' : ''}
                    </h3>
                    <p class="section-subtitle-text">${sec.subtitle || sec.summary || ''}</p>
                    <div class="section-tags-row">
                      ${sec.duration ? `<span class="content-type-tag">⏱️ ${sec.duration}</span>` : ''}
                      ${hasMatter ? '<span class="content-type-tag tag-matter">📖 Matter</span>' : ''}
                      ${hasVideo ? '<span class="content-type-tag tag-video">🎥 Video</span>' : ''}
                      ${hasPhotos ? '<span class="content-type-tag tag-photo">🖼️ Photos</span>' : ''}
                      ${hasMatch ? '<span class="content-type-tag tag-match">🧩 Match Game</span>' : ''}
                      ${hasQuiz ? '<span class="content-type-tag tag-quiz">❓ Quiz</span>' : ''}
                    </div>
                  </div>
                </div>

                <div class="section-action-right">
                  <a href="lesson.html?milestone=${encodeURIComponent(milestone.id)}&section=${encodeURIComponent(sec.id)}" class="btn-open-section ${isDone ? 'btn-secondary' : ''}">
                    ${isDone ? 'Review Lesson' : 'Start Lesson →'}
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}
