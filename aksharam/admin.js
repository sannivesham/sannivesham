// Sannivesham Aksharam — admin.js
// Admin Creator Studio: Full CRUD for Milestones, Sections, and Content Items
// Real-time synchronization with Firebase Firestore backend

import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  checkIsAdmin,
  subscribeToRoadmap,
  saveRoadmapToCloud
} from "./firebase.js";

import { defaultMilestones, getInitialMilestones } from "./roadmap-data.js";
import { showToast } from "./main.js";

let adminMilestones = getInitialMilestones();
let isUserAuthorizedAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initAdminEventListeners();
});

// ----------------------------------------------------
// ADMIN AUTHENTICATION
// ----------------------------------------------------
function initAdminAuth() {
  const lockoutScreen = document.getElementById('adminLockoutScreen');
  const mainContainer = document.getElementById('adminMainContainer');
  const btnSubmitLogin = document.getElementById('btnAdminSubmitLogin');
  const authError = document.getElementById('adminAuthError');
  const btnLogout = document.getElementById('btnAdminLogout');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkIsAdmin(user);
      if (isAdmin) {
        unlockAdminView();
        return;
      }
    }

    // Check if session passcode flag is active
    if (sessionStorage.getItem('aksharam_admin_session') === 'true') {
      unlockAdminView();
      return;
    }

    // Lock screen
    if (lockoutScreen) lockoutScreen.style.display = 'block';
    if (mainContainer) mainContainer.style.display = 'none';
  });

  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', async () => {
      const email = document.getElementById('adminAuthEmail').value.trim();
      const password = document.getElementById('adminAuthPassword').value.trim();
      authError.textContent = "";

      if (!password) {
        authError.textContent = "Please enter password or Admin Passcode.";
        return;
      }

      // Check Master Passcode bypass
      if (password === 'aksharam2026' || password === 'sannivesham2026') {
        sessionStorage.setItem('aksharam_admin_session', 'true');
        unlockAdminView();
        showToast("Signed in via Admin Key", "success");
        return;
      }

      if (!email) {
        authError.textContent = "Please enter admin email.";
        return;
      }

      try {
        btnSubmitLogin.disabled = true;
        btnSubmitLogin.textContent = "Authenticating...";
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const isAdmin = await checkIsAdmin(userCred.user);
        if (isAdmin) {
          sessionStorage.setItem('aksharam_admin_session', 'true');
          unlockAdminView();
          showToast("Welcome to Admin Studio!", "success");
        } else {
          authError.textContent = "Access denied: This user does not have administrator privileges.";
        }
      } catch (err) {
        authError.textContent = err.message || "Failed to sign in.";
      } finally {
        btnSubmitLogin.disabled = false;
        btnSubmitLogin.textContent = "Sign In as Administrator →";
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      sessionStorage.removeItem('aksharam_admin_session');
      await signOut(auth);
      window.location.reload();
    });
  }
}

function unlockAdminView() {
  isUserAuthorizedAdmin = true;
  const lockoutScreen = document.getElementById('adminLockoutScreen');
  const mainContainer = document.getElementById('adminMainContainer');
  if (lockoutScreen) lockoutScreen.style.display = 'none';
  if (mainContainer) mainContainer.style.display = 'block';

  // Listen to Firestore updates
  subscribeToRoadmap((milestones) => {
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      adminMilestones = milestones;
    } else {
      adminMilestones = getInitialMilestones();
    }
    renderMilestonesTree();
  });
}

// ----------------------------------------------------
// RENDER MILESTONES & SECTIONS TREE
// ----------------------------------------------------
function renderMilestonesTree() {
  const container = document.getElementById('adminMilestonesTreeContainer');
  if (!container) return;

  if (!adminMilestones || adminMilestones.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: #FFF; border-radius: 16px; border: 1px dashed var(--border);">
        <p style="font-size: 1.1rem; color: var(--ink-soft); margin-bottom: 1rem;">No milestones configured yet.</p>
        <button type="button" class="btn-admin btn-admin-gold" id="btnSeedInitialEmpty">Seed Default Curriculum</button>
      </div>
    `;
    const btnSeed = document.getElementById('btnSeedInitialEmpty');
    if (btnSeed) btnSeed.onclick = seedDefaultCurriculum;
    return;
  }

  container.innerHTML = adminMilestones.map((milestone, mIdx) => {
    const sections = milestone.sections || [];

    return `
      <div class="admin-milestone-card" id="admin-milestone-${milestone.id}">
        <!-- Milestone Header -->
        <div class="admin-milestone-head">
          <div class="admin-milestone-info">
            <div class="admin-milestone-icon" style="background: ${milestone.color || 'var(--maroon)'};">
              ${milestone.icon || '📚'}
            </div>
            <div class="admin-milestone-titles">
              <h3>${milestone.title}</h3>
              <span>${milestone.titleEn || ''} • ${sections.length} Sections • ${milestone.badge || `Level ${mIdx + 1}`}</span>
            </div>
          </div>

          <div class="admin-card-actions">
            <button type="button" class="btn-icon-sm" title="Move Up" onclick="moveMilestone(${mIdx}, -1)">▲</button>
            <button type="button" class="btn-icon-sm" title="Move Down" onclick="moveMilestone(${mIdx}, 1)">▼</button>
            <button type="button" class="btn-icon-sm" title="Edit Milestone" onclick="openEditMilestoneModal('${milestone.id}')">✏️ Edit</button>
            <button type="button" class="btn-icon-sm btn-danger-sm" title="Delete Milestone" onclick="deleteMilestone('${milestone.id}')">🗑️</button>
            <button type="button" class="btn-admin btn-admin-teal" style="font-size: 0.8rem; padding: 0.35rem 0.8rem;" onclick="openAddSectionModal('${milestone.id}')">
              + Add Section
            </button>
          </div>
        </div>

        <!-- Sections List -->
        <div class="admin-sections-list">
          ${sections.length === 0 ? `
            <div style="padding: 1.5rem; text-align: center; color: var(--ink-soft); font-size: 0.9rem;">
              No sections in this milestone yet. Click "+ Add Section" above.
            </div>
          ` : sections.map((sec, sIdx) => {
            const items = sec.items || [];
            const matterCount = items.filter(i => i.type === 'matter').length;
            const videoCount = items.filter(i => i.type === 'video').length;
            const photoCount = items.filter(i => i.type === 'photos').length;
            const matchCount = items.filter(i => i.type === 'match').length;
            const quizCount = items.filter(i => i.type === 'quiz').length;

            return `
              <div class="admin-section-box">
                <div class="admin-section-head">
                  <div class="admin-section-title-wrap">
                    <h4>${sIdx + 1}. ${sec.title}</h4>
                    <p>${sec.subtitle || ''} ${sec.duration ? `• ⏱️ ${sec.duration}` : ''}</p>
                  </div>
                  <div class="admin-card-actions">
                    <button type="button" class="btn-icon-sm" title="Move Up" onclick="moveSection('${milestone.id}', ${sIdx}, -1)">▲</button>
                    <button type="button" class="btn-icon-sm" title="Move Down" onclick="moveSection('${milestone.id}', ${sIdx}, 1)">▼</button>
                    <button type="button" class="btn-icon-sm" onclick="openEditSectionModal('${milestone.id}', '${sec.id}')">✏️ Edit</button>
                    <button type="button" class="btn-icon-sm btn-danger-sm" onclick="deleteSection('${milestone.id}', '${sec.id}')">🗑️</button>
                  </div>
                </div>

                <!-- Items Summary Chips -->
                <div class="admin-items-summary">
                  <span class="item-chip">📖 Matter: <strong>${matterCount}</strong></span>
                  <span class="item-chip">🎥 Video: <strong>${videoCount}</strong></span>
                  <span class="item-chip">🖼️ Photos: <strong>${photoCount}</strong></span>
                  <span class="item-chip">🧩 Match Game: <strong>${matchCount}</strong></span>
                  <span class="item-chip">❓ Quiz: <strong>${quizCount}</strong></span>
                </div>

                <!-- Add Content Buttons -->
                <div class="admin-item-buttons">
                  <button type="button" class="btn-add-item" onclick="openAddItemModal('${milestone.id}', '${sec.id}', 'matter')">+ Add Matter</button>
                  <button type="button" class="btn-add-item" onclick="openAddItemModal('${milestone.id}', '${sec.id}', 'video')">+ Add Video</button>
                  <button type="button" class="btn-add-item" onclick="openAddItemModal('${milestone.id}', '${sec.id}', 'photos')">+ Add Photos</button>
                  <button type="button" class="btn-add-item" onclick="openAddItemModal('${milestone.id}', '${sec.id}', 'match')">+ Add Match Game</button>
                  <button type="button" class="btn-add-item" onclick="openAddItemModal('${milestone.id}', '${sec.id}', 'quiz')">+ Add Quiz</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// EVENT LISTENERS & MODALS
// ----------------------------------------------------
function initAdminEventListeners() {
  const btnSaveToCloud = document.getElementById('btnSaveToCloud');
  const btnSeedDefault = document.getElementById('btnSeedDefaultCurriculum');
  const btnOpenAddMilestone = document.getElementById('btnOpenAddMilestoneModal');
  const btnSaveMilestone = document.getElementById('btnSaveMilestone');
  const btnSaveSection = document.getElementById('btnSaveSection');
  const btnSaveItem = document.getElementById('btnSaveItem');
  const selectItemType = document.getElementById('selectItemType');

  // Cloud Save
  if (btnSaveToCloud) {
    btnSaveToCloud.addEventListener('click', async () => {
      try {
        btnSaveToCloud.disabled = true;
        btnSaveToCloud.textContent = "Syncing to Firebase...";
        await saveRoadmapToCloud(adminMilestones);
        showToast("✅ Realtime Roadmap synced to Firebase Firestore!", "success");
        document.getElementById('adminSyncStatus').textContent = "🟢 Live in Firestore (" + new Date().toLocaleTimeString() + ")";
      } catch (err) {
        showToast("Error saving to cloud: " + err.message, "error");
      } finally {
        btnSaveToCloud.disabled = false;
        btnSaveToCloud.textContent = "☁️ Save & Sync to Firebase";
      }
    });
  }

  // Seed Default Curriculum
  if (btnSeedDefault) {
    btnSeedDefault.addEventListener('click', seedDefaultCurriculum);
  }

  // Milestone Modal Open
  if (btnOpenAddMilestone) {
    btnOpenAddMilestone.addEventListener('click', () => {
      document.getElementById('editMilestoneId').value = "";
      document.getElementById('modalMilestoneTitle').textContent = "Add New Milestone";
      document.getElementById('inputMilestoneTitle').value = "";
      document.getElementById('inputMilestoneTitleEn').value = "";
      document.getElementById('inputMilestoneBadge').value = `Level ${adminMilestones.length + 1}`;
      document.getElementById('inputMilestoneIcon').value = "📖";
      document.getElementById('inputMilestoneColor').value = "#7A2048";
      document.getElementById('inputMilestoneDesc').value = "";
      openModal('modalMilestoneBackdrop');
    });
  }

  // Save Milestone
  if (btnSaveMilestone) {
    btnSaveMilestone.addEventListener('click', () => {
      const editId = document.getElementById('editMilestoneId').value;
      const title = document.getElementById('inputMilestoneTitle').value.trim();
      const titleEn = document.getElementById('inputMilestoneTitleEn').value.trim();
      const badge = document.getElementById('inputMilestoneBadge').value.trim();
      const icon = document.getElementById('inputMilestoneIcon').value.trim() || '📚';
      const color = document.getElementById('inputMilestoneColor').value.trim() || '#7A2048';
      const description = document.getElementById('inputMilestoneDesc').value.trim();

      if (!title) {
        alert("Please enter a Milestone Title.");
        return;
      }

      if (editId) {
        // Edit existing
        const m = adminMilestones.find(item => item.id === editId);
        if (m) {
          m.title = title;
          m.titleEn = titleEn;
          m.badge = badge;
          m.icon = icon;
          m.color = color;
          m.description = description;
        }
      } else {
        // Create new
        const newId = `milestone-${Date.now()}`;
        adminMilestones.push({
          id: newId,
          order: adminMilestones.length + 1,
          title,
          titleEn,
          badge,
          icon,
          color,
          description,
          sections: []
        });
      }

      closeAllModals();
      renderMilestonesTree();
      markUnsavedChanges();
    });
  }

  // Save Section
  if (btnSaveSection) {
    btnSaveSection.addEventListener('click', () => {
      const mId = document.getElementById('sectionParentMilestoneId').value;
      const sId = document.getElementById('editSectionId').value;
      const title = document.getElementById('inputSectionTitle').value.trim();
      const subtitle = document.getElementById('inputSectionSubtitle').value.trim();
      const duration = document.getElementById('inputSectionDuration').value.trim();
      const summary = document.getElementById('inputSectionSummary').value.trim();

      if (!title) {
        alert("Please enter a Section Title.");
        return;
      }

      const milestone = adminMilestones.find(m => m.id === mId);
      if (!milestone) return;

      if (!milestone.sections) milestone.sections = [];

      if (sId) {
        // Edit section
        const sec = milestone.sections.find(s => s.id === sId);
        if (sec) {
          sec.title = title;
          sec.subtitle = subtitle;
          sec.duration = duration;
          sec.summary = summary;
        }
      } else {
        // New section
        const newSecId = `sec-${Date.now()}`;
        milestone.sections.push({
          id: newSecId,
          title,
          subtitle,
          duration: duration || '10 mins',
          summary,
          items: []
        });
      }

      closeAllModals();
      renderMilestonesTree();
      markUnsavedChanges();
    });
  }

  // Change content item fields based on selected type
  if (selectItemType) {
    selectItemType.addEventListener('change', () => {
      const val = selectItemType.value;
      document.querySelectorAll('.item-type-fields').forEach(f => f.style.display = 'none');
      const target = document.getElementById(`fields${val.charAt(0).toUpperCase() + val.slice(1)}`);
      if (target) target.style.display = 'block';
    });
  }

  // Save Content Item
  if (btnSaveItem) {
    btnSaveItem.addEventListener('click', () => {
      const mId = document.getElementById('itemParentMilestoneId').value;
      const sId = document.getElementById('itemParentSectionId').value;
      const type = document.getElementById('selectItemType').value;

      const milestone = adminMilestones.find(m => m.id === mId);
      if (!milestone) return;
      const section = (milestone.sections || []).find(s => s.id === sId);
      if (!section) return;

      if (!section.items) section.items = [];

      let newItem = { type };

      if (type === 'matter') {
        newItem.title = document.getElementById('inputMatterTitle').value.trim() || 'వివరణ • Notes';
        newItem.content = document.getElementById('inputMatterContent').value.trim();
      } else if (type === 'video') {
        newItem.title = document.getElementById('inputVideoTitle').value.trim() || 'వీడియో పాఠం';
        newItem.videoUrl = document.getElementById('inputVideoUrl').value.trim();
        newItem.caption = document.getElementById('inputVideoCaption').value.trim();
      } else if (type === 'photos') {
        newItem.title = document.getElementById('inputPhotosTitle').value.trim() || 'చిత్ర పదజాలం';
        try {
          const raw = document.getElementById('inputPhotosJson').value.trim();
          newItem.photos = raw ? JSON.parse(raw) : [];
        } catch (_) {
          alert("Invalid JSON format for photos.");
          return;
        }
      } else if (type === 'match') {
        newItem.title = document.getElementById('inputMatchTitle').value.trim() || 'జతపరచండి • Match';
        newItem.instructions = document.getElementById('inputMatchInstructions').value.trim();
        try {
          const raw = document.getElementById('inputMatchJson').value.trim();
          newItem.pairs = raw ? JSON.parse(raw) : [];
        } catch (_) {
          alert("Invalid JSON format for matching pairs.");
          return;
        }
      } else if (type === 'quiz') {
        newItem.title = document.getElementById('inputQuizTitle').value.trim() || 'అక్షర పరీక్ష • Quiz';
        try {
          const raw = document.getElementById('inputQuizJson').value.trim();
          newItem.questions = raw ? JSON.parse(raw) : [];
        } catch (_) {
          alert("Invalid JSON format for quiz questions.");
          return;
        }
      }

      section.items.push(newItem);
      closeAllModals();
      renderMilestonesTree();
      markUnsavedChanges();
      showToast(`Added ${type} block to ${section.title}`, "info");
    });
  }
}

// ----------------------------------------------------
// CRUD HELPER FUNCTIONS (ATTACHED TO WINDOW)
// ----------------------------------------------------
window.openEditMilestoneModal = function(mId) {
  const m = adminMilestones.find(item => item.id === mId);
  if (!m) return;
  document.getElementById('editMilestoneId').value = m.id;
  document.getElementById('modalMilestoneTitle').textContent = "Edit Milestone";
  document.getElementById('inputMilestoneTitle').value = m.title || '';
  document.getElementById('inputMilestoneTitleEn').value = m.titleEn || '';
  document.getElementById('inputMilestoneBadge').value = m.badge || '';
  document.getElementById('inputMilestoneIcon').value = m.icon || '📚';
  document.getElementById('inputMilestoneColor').value = m.color || '#7A2048';
  document.getElementById('inputMilestoneDesc').value = m.description || '';
  openModal('modalMilestoneBackdrop');
};

window.deleteMilestone = function(mId) {
  if (!confirm("Are you sure you want to delete this milestone and all its sections?")) return;
  adminMilestones = adminMilestones.filter(m => m.id !== mId);
  renderMilestonesTree();
  markUnsavedChanges();
};

window.moveMilestone = function(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= adminMilestones.length) return;
  const temp = adminMilestones[index];
  adminMilestones[index] = adminMilestones[targetIndex];
  adminMilestones[targetIndex] = temp;
  renderMilestonesTree();
  markUnsavedChanges();
};

window.openAddSectionModal = function(mId) {
  document.getElementById('sectionParentMilestoneId').value = mId;
  document.getElementById('editSectionId').value = "";
  document.getElementById('modalSectionHeading').textContent = "Add Section";
  document.getElementById('inputSectionTitle').value = "";
  document.getElementById('inputSectionSubtitle').value = "";
  document.getElementById('inputSectionDuration').value = "10 mins";
  document.getElementById('inputSectionSummary').value = "";
  openModal('modalSectionBackdrop');
};

window.openEditSectionModal = function(mId, sId) {
  const milestone = adminMilestones.find(m => m.id === mId);
  if (!milestone) return;
  const sec = (milestone.sections || []).find(s => s.id === sId);
  if (!sec) return;

  document.getElementById('sectionParentMilestoneId').value = mId;
  document.getElementById('editSectionId').value = sId;
  document.getElementById('modalSectionHeading').textContent = "Edit Section";
  document.getElementById('inputSectionTitle').value = sec.title || '';
  document.getElementById('inputSectionSubtitle').value = sec.subtitle || '';
  document.getElementById('inputSectionDuration').value = sec.duration || '10 mins';
  document.getElementById('inputSectionSummary').value = sec.summary || '';
  openModal('modalSectionBackdrop');
};

window.deleteSection = function(mId, sId) {
  if (!confirm("Delete this section?")) return;
  const milestone = adminMilestones.find(m => m.id === mId);
  if (!milestone) return;
  milestone.sections = (milestone.sections || []).filter(s => s.id !== sId);
  renderMilestonesTree();
  markUnsavedChanges();
};

window.moveSection = function(mId, sIdx, direction) {
  const milestone = adminMilestones.find(m => m.id === mId);
  if (!milestone || !milestone.sections) return;
  const targetIdx = sIdx + direction;
  if (targetIdx < 0 || targetIdx >= milestone.sections.length) return;
  const temp = milestone.sections[sIdx];
  milestone.sections[sIdx] = milestone.sections[targetIdx];
  milestone.sections[targetIdx] = temp;
  renderMilestonesTree();
  markUnsavedChanges();
};

window.openAddItemModal = function(mId, sId, defaultType = 'matter') {
  document.getElementById('itemParentMilestoneId').value = mId;
  document.getElementById('itemParentSectionId').value = sId;
  document.getElementById('selectItemType').value = defaultType;
  document.getElementById('selectItemType').dispatchEvent(new Event('change'));

  // Reset fields
  document.getElementById('inputMatterTitle').value = "";
  document.getElementById('inputMatterContent').value = "";
  document.getElementById('inputVideoTitle').value = "";
  document.getElementById('inputVideoUrl').value = "";
  document.getElementById('inputVideoCaption').value = "";
  document.getElementById('inputPhotosTitle').value = "";
  document.getElementById('inputPhotosJson').value = '[{"url": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600", "label": "అ — అమ్మ (Amma)", "caption": "Mother"}]';
  document.getElementById('inputMatchTitle').value = "జతపరచండి • Match Letters & Words";
  document.getElementById('inputMatchInstructions').value = "Tap a Telugu card on the left, then tap its matching pair on the right!";
  document.getElementById('inputMatchJson').value = '[{"left": "అ (a)", "right": "అమ్మ (Mother)"}, {"left": "ఆ (aa)", "right": "ఆవు (Cow)"}]';
  document.getElementById('inputQuizTitle').value = "అక్షర పరీక్ష • Knowledge Check Quiz";
  document.getElementById('inputQuizJson').value = '[{"question": "Sample Question?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "answerIndex": 0, "explanation": "Option 1 is correct"}]';

  openModal('modalItemBackdrop');
};

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('is-open');
};

window.closeAllModals = function() {
  document.querySelectorAll('.admin-modal-backdrop').forEach(m => m.classList.remove('is-open'));
};

function markUnsavedChanges() {
  const statusEl = document.getElementById('adminSyncStatus');
  if (statusEl) {
    statusEl.textContent = "⚠️ Unsaved changes • Click Save & Sync to Firebase";
    statusEl.style.color = "#E65100";
  }
}

async function seedDefaultCurriculum() {
  if (!confirm("This will load the complete official 4-milestone curriculum (with videos, photos, matter, match games, and quizzes) and save it to Firebase Firestore. Proceed?")) return;
  adminMilestones = JSON.parse(JSON.stringify(defaultMilestones));
  renderMilestonesTree();
  try {
    await saveRoadmapToCloud(adminMilestones);
    showToast("🌱 Default Curriculum loaded and synced to Firebase!", "success");
    document.getElementById('adminSyncStatus').textContent = "🟢 Live in Firestore (" + new Date().toLocaleTimeString() + ")";
  } catch (err) {
    showToast("Saved locally. Could not sync to cloud: " + err.message, "error");
  }
}
