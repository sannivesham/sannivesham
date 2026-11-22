/**
 * SANNIVESHAM – RAMAYANA FAMILY TREE & VISUAL EXPLORER ENGINE
 * Interactive Pan/Zoom, Canvas Rendering, Node Network Highlighting, and Modal System
 */

(function (global) {
  "use strict";

  function getData() {
    if (typeof window !== "undefined" && window.RAMAYANA_DATA) {
      return window.RAMAYANA_DATA;
    }
    if (typeof globalThis !== "undefined" && globalThis.RAMAYANA_DATA) {
      return globalThis.RAMAYANA_DATA;
    }
    try {
      return require("./data.js");
    } catch (e) {
      return null;
    }
  }

  /* =====================================================
     1. ENGINE STATE
  ===================================================== */
  const state = {
    currentCategory: "dasharatha", // ikshvaku, dasharatha, janaka, vanara, rakshasa, guru
    ikshvakuMode: "milestones", // "milestones" or "full"
    scale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lang: "te", // "te" or "en"
    highlightActive: true,
    selectedCharId: null
  };

  /* Avatar icons mapped by character role/identity */
  const AVATARS = {
    sri_rama: "🏹",
    sita: "🪷",
    lakshmana: "🗡️",
    bharata: "👑",
    shatrughna: "⚔️",
    dasharatha: "👑",
    kausalya: "👸",
    sumitra: "👸",
    kaikeyi: "👸",
    shanta: "✨",
    rishyashringa: "🧘",
    urmila: "🪷",
    mandavi: "🪷",
    shrutakirti: "🪷",
    lava: "🏹",
    kusha: "🏹",
    janaka: "👑",
    kushadhvaja: "👑",
    hrasvaroman: "👑",
    vali: "🐒",
    sugriva: "🐒",
    hanuman: "🚩",
    tara: "🌸",
    ruma: "🌸",
    angada: "🐒",
    kesari: "🐒",
    anjana: "🌸",
    jambavan: "🐻",
    ravana: "🔱",
    kumbhakarna: "⛰️",
    vibhishana: "🕊️",
    indrajit: "⚡",
    shurpanakha: "👁️",
    mandodari: "👸",
    sarama: "🌸",
    trijata: "🌸",
    akshayakumara: "⚔️",
    atikaya: "⚔️",
    vasistha: "📜",
    vishwamitra: "☀️",
    valmiki: "🪶",
    agastya: "🌊",
    jabali: "📜"
  };

  function getAvatar(id) {
    return AVATARS[id] || "👑";
  }

  /* =====================================================
     2. PAN & ZOOM CONTROLLER
  ===================================================== */
  function initPanZoom() {
    const viewport = document.getElementById("treeViewport");
    const content = document.getElementById("treeContent");
    if (!viewport || !content) return;

    function applyTransform() {
      content.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    }

    // Mouse drag
    viewport.addEventListener("mousedown", (e) => {
      if (e.target.closest(".rk-char-node") || e.target.closest("button") || e.target.closest("a")) return;
      state.isDragging = true;
      state.dragStartX = e.clientX - state.panX;
      state.dragStartY = e.clientY - state.panY;
      viewport.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!state.isDragging) return;
      state.panX = e.clientX - state.dragStartX;
      state.panY = e.clientY - state.dragStartY;
      applyTransform();
    });

    window.addEventListener("mouseup", () => {
      state.isDragging = false;
      if (viewport) viewport.style.cursor = "grab";
    });

    // Touch drag & mobile support
    let touchStartDist = 0;
    viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        state.isDragging = true;
        state.dragStartX = e.touches[0].clientX - state.panX;
        state.dragStartY = e.touches[0].clientY - state.panY;
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && state.isDragging) {
        state.panX = e.touches[0].clientX - state.dragStartX;
        state.panY = e.touches[0].clientY - state.dragStartY;
        applyTransform();
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDist;
        zoomBy(factor > 1 ? 0.05 : -0.05);
        touchStartDist = dist;
      }
    }, { passive: true });

    viewport.addEventListener("touchend", () => {
      state.isDragging = false;
      touchStartDist = 0;
    });

    // Mouse wheel zoom with Ctrl or normal wheel
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomBy(delta);
    }, { passive: false });

    // Toolbar button listeners
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnResetZoom = document.getElementById("btnResetZoom");
    const btnFit = document.getElementById("btnFit");

    if (btnZoomIn) btnZoomIn.addEventListener("click", () => zoomBy(0.15));
    if (btnZoomOut) btnZoomOut.addEventListener("click", () => zoomBy(-0.15));
    if (btnResetZoom) btnResetZoom.addEventListener("click", resetZoom);
    if (btnFit) btnFit.addEventListener("click", fitToScreen);

    // Initial centering
    resetZoom();
  }

  function zoomBy(delta) {
    const newScale = Math.min(Math.max(state.scale + delta, 0.45), 2.2);
    state.scale = Number(newScale.toFixed(2));
    const content = document.getElementById("treeContent");
    if (content) {
      content.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    }
    updateZoomDisplay();
  }

  function resetZoom() {
    state.scale = 1;
    state.panX = 0;
    state.panY = 0;
    const content = document.getElementById("treeContent");
    if (content) {
      content.style.transform = `translate(0px, 0px) scale(1)`;
    }
    updateZoomDisplay();
  }

  function fitToScreen() {
    const viewport = document.getElementById("treeViewport");
    const content = document.getElementById("treeContent");
    if (!viewport || !content) return;
    const viewW = viewport.clientWidth;
    const contentW = content.scrollWidth;
    if (contentW > viewW) {
      state.scale = Number(Math.max((viewW - 40) / contentW, 0.5).toFixed(2));
    } else {
      state.scale = 1;
    }
    state.panX = 0;
    state.panY = 0;
    content.style.transform = `translate(0px, 0px) scale(${state.scale})`;
    updateZoomDisplay();
  }

  function updateZoomDisplay() {
    const el = document.getElementById("zoomLevelLabel");
    if (el) el.textContent = `${Math.round(state.scale * 100)}%`;
  }

  /* =====================================================
     3. RENDER IKSHVAKU DYNASTY (39 GENERATIONS)
  ===================================================== */
  function renderIkshvakuDynasty(container) {
    const data = getData();
    if (!data) return;
    const lineage = data.IKSHVAKU_LINEAGE || [];

    // Milestone ids
    const MILESTONES = [
      "brahma", "marichi", "kashyapa", "surya", "vaivasvata_manu",
      "ikshvaku", "trishanku", "mandhata", "sagara", "bhagiratha",
      "kakutstha", "raghu", "ambarisha", "aja", "dasharatha", "sri_rama"
    ];

    let html = `
      <div class="rk-ikshvaku-view-controls">
        <button class="rk-view-btn ${state.ikshvakuMode === 'milestones' ? 'active' : ''}" id="btnIkMilestones">
          🌟 ముఖ్య యుగ పురుషులు (Milestone Kings)
        </button>
        <button class="rk-view-btn ${state.ikshvakuMode === 'full' ? 'active' : ''}" id="btnIkFull">
          📜 పూర్తి 39 తరాల అనుక్రమణిక (Complete 39 Lineage)
        </button>
      </div>
      <div class="rk-lineage-timeline">
    `;

    lineage.forEach((king) => {
      const isMilestone = MILESTONES.includes(king.id);
      if (state.ikshvakuMode === "milestones" && !isMilestone) {
        return; // Filter out non-milestone in simplified view
      }

      html += `
        <div class="rk-lineage-row" data-char-id="${king.id}">
          <div class="rk-gen-badge ${isMilestone ? 'milestone' : ''}">
            ${king.gen}
          </div>
          <div class="rk-lineage-info-card">
            <div class="rk-lineage-header">
              <span class="rk-lineage-name-te">${king.nameTe}</span>
              <span class="rk-lineage-name-en">${king.nameEn}</span>
            </div>
            <div class="rk-lineage-title-te">${king.titleTe || ''}</div>
            <div class="rk-lineage-desc">${king.roleTe || ''}</div>
            <div class="rk-lineage-sarga">
              <span>📖 వాల్మీకి రామాయణం: ${king.sarga || 'బాలకాండ సర్గ 70'}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Attach click listeners to cards
    container.querySelectorAll(".rk-lineage-row").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-char-id");
        openCharacterProfile(id);
      });
    });

    // Milestone / Full buttons
    const bMilestones = document.getElementById("btnIkMilestones");
    const bFull = document.getElementById("btnIkFull");
    if (bMilestones) {
      bMilestones.addEventListener("click", () => {
        state.ikshvakuMode = "milestones";
        renderActiveCategory();
      });
    }
    if (bFull) {
      bFull.addEventListener("click", () => {
        state.ikshvakuMode = "full";
        renderActiveCategory();
      });
    }
  }

  /* =====================================================
     4. RENDER HIERARCHICAL FAMILY TREES
  ===================================================== */
  function renderHierarchicalTree(catId, container) {
    const data = getData();
    if (!data) return;

    const charMap = {};
    (data.CHARACTERS || []).forEach(c => { charMap[c.id] = c; });

    const treeSpec = data.FAMILY_TREES ? data.FAMILY_TREES[catId] : null;
    if (!treeSpec || !treeSpec.generations) {
      container.innerHTML = `<p style="text-align:center; padding: 2rem;">వంశవృక్ష సమాచారం లోడ్ అవుతోంది...</p>`;
      return;
    }

    let html = `<div style="display:flex; flex-direction:column; align-items:center; width:100%; gap:2.5rem;">`;

    treeSpec.generations.forEach((gen) => {
      html += `
        <div class="rk-tree-level">
          <div class="rk-level-title-badge">
            ${state.lang === 'te' ? gen.titleTelugu : gen.titleEnglish}
          </div>
          <div class="rk-nodes-row">
      `;

      if (catId === "dasharatha" && gen.level === 3) {
        // Render 4 brothers with their married wives in couple clusters!
        const couples = [
          { husband: "sri_rama", wife: "sita" },
          { husband: "lakshmana", wife: "urmila" },
          { husband: "bharata", wife: "mandavi" },
          { husband: "shatrughna", wife: "shrutakirti" }
        ];

        couples.forEach(cp => {
          html += `
            <div class="rk-couple-cluster">
              ${renderNodeCard(charMap[cp.husband])}
              <span class="rk-marriage-heart">💍</span>
              ${renderNodeCard(charMap[cp.wife])}
            </div>
          `;
        });
      } else {
        gen.members.forEach(mId => {
          const charObj = charMap[mId];
          if (charObj) {
            html += renderNodeCard(charObj);
          }
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Attach card event listeners
    container.querySelectorAll(".rk-char-node").forEach(card => {
      const charId = card.getAttribute("data-char-id");

      // Hover network highlight
      card.addEventListener("mouseenter", () => {
        if (state.highlightActive) highlightNetwork(charId);
      });
      card.addEventListener("mouseleave", () => {
        if (state.highlightActive) clearNetworkHighlight();
      });

      // Click to open profile
      card.addEventListener("click", () => {
        openCharacterProfile(charId);
      });
    });
  }

  function renderNodeCard(char) {
    if (!char) return "";
    const avatar = getAvatar(char.id);
    const name = state.lang === "te" ? char.nameTelugu : char.nameEnglish;
    const subName = state.lang === "te" ? char.nameEnglish : char.nameTelugu;
    const kingdom = char.kingdom || "";

    return `
      <div class="rk-char-node" data-char-id="${char.id}" id="node-${char.id}">
        <span class="rk-node-avatar">${avatar}</span>
        <div class="rk-node-name-te" title="${char.nameTelugu}">${name}</div>
        <div class="rk-node-name-en">${subName}</div>
        ${kingdom ? `<span class="rk-node-role-pill">${kingdom}</span>` : ''}
      </div>
    `;
  }

  /* =====================================================
     5. HIGHLIGHT FAMILY NETWORK
  ===================================================== */
  function highlightNetwork(charId) {
    const data = getData();
    if (!data) return;

    const charMap = {};
    (data.CHARACTERS || []).forEach(c => { charMap[c.id] = c; });
    const target = charMap[charId];
    if (!target) return;

    // Remove old highlights
    clearNetworkHighlight();

    const targetNode = document.getElementById(`node-${charId}`);
    if (targetNode) targetNode.classList.add("highlight-target");

    // Highlight parents
    [target.fatherId, target.motherId].forEach(pId => {
      if (pId) {
        const el = document.getElementById(`node-${pId}`);
        if (el) el.classList.add("highlight-parent");
      }
    });

    // Highlight spouses
    (target.spouseIds || []).forEach(sId => {
      const el = document.getElementById(`node-${sId}`);
      if (el) el.classList.add("highlight-spouse");
    });

    // Highlight children
    (target.childrenIds || []).forEach(cId => {
      const el = document.getElementById(`node-${cId}`);
      if (el) el.classList.add("highlight-child");
    });

    // Highlight siblings
    (target.siblingIds || []).forEach(sId => {
      const el = document.getElementById(`node-${sId}`);
      if (el) el.classList.add("highlight-sibling");
    });
  }

  function clearNetworkHighlight() {
    document.querySelectorAll(".rk-char-node").forEach(node => {
      node.classList.remove(
        "highlight-target",
        "highlight-parent",
        "highlight-spouse",
        "highlight-child",
        "highlight-sibling"
      );
    });
  }

  /* =====================================================
     6. CHARACTER PROFILE MODAL
  ===================================================== */
  function openCharacterProfile(charId) {
    const data = getData();
    if (!data) return;

    const charMap = {};
    (data.CHARACTERS || []).forEach(c => { charMap[c.id] = c; });

    let char = charMap[charId];
    // If not in CHARACTERS, check IKSHVAKU_LINEAGE
    if (!char && data.IKSHVAKU_LINEAGE) {
      const k = data.IKSHVAKU_LINEAGE.find(x => x.id === charId);
      if (k) {
        char = {
          id: k.id,
          nameTelugu: k.nameTe,
          nameEnglish: k.nameEn,
          kingdom: "ఇక్ష్వాకు రాజవంశం (సూర్యవంశం)",
          descriptionTelugu: k.roleTe,
          descriptionEnglish: `${k.nameEn} is the ${k.gen}th king in the Ikshvaku Dynasty according to Valmiki Ramayana Bala Kanda Sarga 70.`,
          citation: k.sarga || "బాలకాండ 70వ సర్గ",
          roleInRamayana: k.titleTe || "ఇక్ష్వాకు చక్రవర్తి",
          fatherId: null,
          spouseIds: [],
          childrenIds: [],
          siblingIds: []
        };
      }
    }

    if (!char) return;

    const modal = document.getElementById("profileModal");
    const container = document.getElementById("profileModalContent");
    if (!modal || !container) return;

    const avatar = getAvatar(char.id);

    // Build relations chips
    function makeChip(id, prefix) {
      if (!id) return "";
      const other = charMap[id];
      const name = other ? other.nameTelugu : id;
      return `
        <span class="rk-prof-chip" onclick="window.RamayanaExplorer.openCharacterProfile('${id}')">
          ${prefix}: ${name}
        </span>
      `;
    }

    let relationsHtml = "";
    if (char.fatherId) relationsHtml += makeChip(char.fatherId, "తండ్రి");
    if (char.motherId) relationsHtml += makeChip(char.motherId, "తల్లి");
    (char.spouseIds || []).forEach(s => { relationsHtml += makeChip(s, "భార్య/భర్త"); });
    (char.siblingIds || []).forEach(s => { relationsHtml += makeChip(s, "సోదరుడు/సోదరి"); });
    (char.childrenIds || []).forEach(c => { relationsHtml += makeChip(c, "సంతానం"); });
    (char.guruIds || []).forEach(g => { relationsHtml += makeChip(g, "గురువు"); });

    container.innerHTML = `
      <div class="rk-profile-top">
        <div class="rk-profile-avatar-wrap">${avatar}</div>
        <div class="rk-profile-title-block">
          <h2>${char.nameTelugu}</h2>
          <div class="rk-prof-en">${char.nameEnglish}</div>
          ${char.kingdom ? `<div class="rk-prof-kingdom">🏛️ ${char.kingdom}</div>` : ''}
          ${char.roleInRamayana ? `<div style="font-size:0.86rem; color:var(--rk-gold-main); margin-top:4px;">${char.roleInRamayana}</div>` : ''}
        </div>
      </div>

      <div class="rk-profile-section-title">📜 పరిచయం & విశేషాలు</div>
      <p class="rk-profile-desc">${char.descriptionTelugu || ''}</p>
      ${char.descriptionEnglish ? `<p class="rk-profile-desc" style="font-family:var(--font-ui); font-size:0.88rem; color:var(--rk-text-dim);">${char.descriptionEnglish}</p>` : ''}

      ${relationsHtml ? `
        <div class="rk-profile-section-title">🔗 కుటుంబ & బంధుత్వ సంబంధాలు</div>
        <div class="rk-profile-chips-grid">
          ${relationsHtml}
        </div>
      ` : ''}

      <div class="rk-prof-citation-box">
        <strong>📖 వాల్మీకి రామాయణ ప్రస్తావన:</strong> ${char.citation || char.kandaReferences || 'శ్రీమద్వాల్మీకి రామాయణం'}
      </div>
    `;

    modal.classList.add("active");
  }

  function closeCharacterProfile() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
  }

  /* =====================================================
     7. SEARCH AUTOCOMPLETE & LIVE FILTER
  ===================================================== */
  function initSearch() {
    const input = document.getElementById("characterSearchInput");
    const resultsBox = document.getElementById("searchResultsBox");
    const clearBtn = document.getElementById("searchClearBtn");
    if (!input || !resultsBox) return;

    const data = getData();
    if (!data) return;

    const allChars = [];
    (data.CHARACTERS || []).forEach(c => {
      allChars.push({
        id: c.id,
        nameTe: c.nameTelugu,
        nameEn: c.nameEnglish,
        role: c.kingdom || "",
        category: c.category || ""
      });
    });

    (data.IKSHVAKU_LINEAGE || []).forEach(k => {
      if (!allChars.some(x => x.id === k.id)) {
        allChars.push({
          id: k.id,
          nameTe: k.nameTe,
          nameEn: k.nameEn,
          role: `ఇక్ష్వాకు ${k.gen}వ తరం`,
          category: "ikshvaku"
        });
      }
    });

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";

      if (!q) {
        resultsBox.classList.remove("active");
        resultsBox.innerHTML = "";
        return;
      }

      const matches = allChars.filter(c =>
        c.nameTe.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      ).slice(0, 8);

      if (matches.length === 0) {
        resultsBox.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--rk-text-dim);">పాత్ర కనుగొనబడలేదు</div>`;
        resultsBox.classList.add("active");
        return;
      }

      let html = "";
      matches.forEach(m => {
        html += `
          <div class="rk-search-item" data-char-id="${m.id}" data-cat="${m.category}">
            <div class="rk-search-item-left">
              <span class="rk-search-item-avatar">${getAvatar(m.id)}</span>
              <div>
                <div class="rk-search-item-name">${m.nameTe}</div>
                <div class="rk-search-item-en">${m.nameEn}</div>
              </div>
            </div>
            <span class="rk-search-item-badge">${m.role}</span>
          </div>
        `;
      });

      resultsBox.innerHTML = html;
      resultsBox.classList.add("active");

      resultsBox.querySelectorAll(".rk-search-item").forEach(item => {
        item.addEventListener("click", () => {
          const charId = item.getAttribute("data-char-id");
          const cat = item.getAttribute("data-cat");
          resultsBox.classList.remove("active");
          input.value = "";
          if (clearBtn) clearBtn.style.display = "none";

          // Switch category if needed
          if (cat && cat !== state.currentCategory) {
            selectCategory(cat);
          }

          // Open profile modal
          openCharacterProfile(charId);
        });
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        clearBtn.style.display = "none";
        resultsBox.classList.remove("active");
      });
    }

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".rk-search-box-wrap")) {
        resultsBox.classList.remove("active");
      }
    });
  }

  /* =====================================================
     8. CATEGORY SELECTOR & WORKSPACE RENDERER
  ===================================================== */
  function selectCategory(catId) {
    state.currentCategory = catId;

    // Update Category Tab buttons
    document.querySelectorAll(".rk-cat-tab-btn").forEach(btn => {
      if (btn.getAttribute("data-cat") === catId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update Toolbar Title & Subtitle
    const data = getData();
    if (data && data.CATEGORIES) {
      const catMeta = data.CATEGORIES.find(c => c.id === catId);
      if (catMeta) {
        const iconEl = document.getElementById("wsCatIcon");
        const titleEl = document.getElementById("wsCatTitle");
        const subEl = document.getElementById("wsCatSubtitle");
        if (iconEl) iconEl.textContent = catMeta.icon;
        if (titleEl) titleEl.textContent = catMeta.titleTelugu;
        if (subEl) subEl.textContent = catMeta.titleEnglish;
      }
    }

    renderActiveCategory();
    resetZoom();

    // Smooth scroll to workspace
    const ws = document.getElementById("treeWorkspace");
    if (ws) {
      ws.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderActiveCategory() {
    const content = document.getElementById("treeContent");
    if (!content) return;

    if (state.currentCategory === "ikshvaku") {
      renderIkshvakuDynasty(content);
    } else {
      renderHierarchicalTree(state.currentCategory, content);
    }
  }

  /* =====================================================
     9. RELATIONSHIP FINDER UI HANDLER
  ===================================================== */
  function initRelationshipFinderUI() {
    const sel1 = document.getElementById("charSelect1");
    const sel2 = document.getElementById("charSelect2");
    const btnFind = document.getElementById("btnFindRelationship");
    const btnSwap = document.getElementById("btnSwapChars");
    const resultCard = document.getElementById("relationshipResultCard");

    if (!sel1 || !sel2 || !btnFind) return;

    const data = getData();
    if (!data) return;

    // Populate dropdown options
    const options = [];
    (data.CHARACTERS || []).forEach(c => {
      options.push({ id: c.id, name: `${c.nameTelugu} (${c.nameEnglish})` });
    });

    (data.IKSHVAKU_LINEAGE || []).forEach(k => {
      if (!options.some(o => o.id === k.id)) {
        options.push({ id: k.id, name: `${k.nameTe} (${k.nameEn})` });
      }
    });

    options.sort((a, b) => a.name.localeCompare(b.name, "te"));

    let optsHtml = `<option value="">-- పాత్రను ఎంచుకోండి (Select Character) --</option>`;
    options.forEach(o => {
      optsHtml += `<option value="${o.id}">${o.name}</option>`;
    });

    sel1.innerHTML = optsHtml;
    sel2.innerHTML = optsHtml;

    // Set defaults: Sri Rama and Bharata
    sel1.value = "sri_rama";
    sel2.value = "bharata";

    function computeAndShow() {
      const id1 = sel1.value;
      const id2 = sel2.value;
      if (!id1 || !id2) return;

      const engine = (typeof window !== "undefined" && window.KinshipEngine) || null;
      if (!engine || !engine.findRelationship) return;

      const res = engine.findRelationship(id1, id2);
      if (!res) return;

      const badgeEl = document.getElementById("resRelBadge");
      const enEl = document.getElementById("resRelEn");
      const honorificEl = document.getElementById("resHonorific");
      const detailsEl = document.getElementById("resDetails");
      const citationEl = document.getElementById("resCitation");

      if (badgeEl) badgeEl.textContent = res.relationTe;
      if (enEl) enEl.textContent = res.relationEn;
      if (honorificEl) honorificEl.textContent = res.honorificTe || "";
      if (detailsEl) detailsEl.textContent = res.detailsTe || "";
      if (citationEl) citationEl.textContent = `📖 వాల్మీకి రామాయణ ప్రమాణం: ${res.kanda || 'శ్రీమద్వాల్మీకి రామాయణం'}`;

      if (resultCard) resultCard.classList.add("active");
    }

    btnFind.addEventListener("click", computeAndShow);

    if (btnSwap) {
      btnSwap.addEventListener("click", () => {
        const tmp = sel1.value;
        sel1.value = sel2.value;
        sel2.value = tmp;
        computeAndShow();
      });
    }

    // Quick preset buttons
    document.querySelectorAll(".rk-preset-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const p1 = pill.getAttribute("data-c1");
        const p2 = pill.getAttribute("data-c2");
        if (p1 && p2) {
          sel1.value = p1;
          sel2.value = p2;
          computeAndShow();
        }
      });
    });

    // Auto compute initial preset
    computeAndShow();
  }

  /* =====================================================
     10. INITIALIZATION
  ===================================================== */
  function init() {
    initPanZoom();
    initSearch();
    initRelationshipFinderUI();

    // Category card clicks
    document.querySelectorAll(".rk-category-card").forEach(card => {
      card.addEventListener("click", () => {
        const catId = card.getAttribute("data-category");
        if (catId) selectCategory(catId);
      });
    });

    // Category Tab button clicks
    document.querySelectorAll(".rk-cat-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const catId = btn.getAttribute("data-cat");
        if (catId) selectCategory(catId);
      });
    });

    // Language toggle
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "te" ? "en" : "te";
        langBtn.textContent = state.lang === "te" ? "English" : "తెలుగు";
        renderActiveCategory();
      });
    }

    // Modal close handlers
    const modalClose = document.getElementById("modalCloseBtn");
    const modal = document.getElementById("profileModal");
    if (modalClose) modalClose.addEventListener("click", closeCharacterProfile);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeCharacterProfile();
      });
    }

    // Initial render
    selectCategory("dasharatha");
  }

  // Global namespace export
  const RamayanaExplorer = {
    init,
    selectCategory,
    openCharacterProfile,
    closeCharacterProfile,
    state
  };

  if (typeof window !== "undefined") {
    window.RamayanaExplorer = RamayanaExplorer;
    document.addEventListener("DOMContentLoaded", init);
  }
  if (typeof globalThis !== "undefined") {
    globalThis.RamayanaExplorer = RamayanaExplorer;
  }
})(typeof window !== "undefined" ? window : global);
