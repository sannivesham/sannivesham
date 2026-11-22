/**
 * SANNIVESHAM – RAMAYANA FAMILY TREE & VISUAL EXPLORER ENGINE
 * Interactive Flowchart Tree, SVG Connector Lines, Calibrated Mobile Gestures, and Kinship Resolver
 */

(function (global) {
  "use strict";

  // Safeguard access to data
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
     1. ENGINE STATE & CONFIG
  ===================================================== */
  const state = {
    currentCategory: "dasharatha",
    ikshvakuMode: "milestones",
    scale: 1,
    panX: 0,
    panY: 0,
    lang: "te",
    highlightActive: true,
    selectedCharId: null
  };

  const AVATARS = {
    sri_rama: "🏹",
    sita: "🪷",
    lakshmana: "🏹",
    urmila: "🌸",
    bharata: "👑",
    mandavi: "🌺",
    shatrughna: "⚔️",
    shrutakirti: "🌼",
    dasharatha: "👑",
    kausalya: "🪷",
    sumitra: "🌿",
    kaikeyi: "✨",
    shanta: "🕊️",
    rishyashringa: "🧘",
    aja: "👑",
    indumati: "🪷",
    lava: "🏹",
    kusha: "🏹",
    angada_lakshmana: "🏹",
    chandraketu: "🏹",
    taksha: "👑",
    pushkala: "👑",
    subahu_shatrughna: "⚔️",
    shatrughati: "⚔️",
    janaka: "👑",
    kushadhvaja: "👑",
    hrasvaroman: "🏛️",
    vali: "🐒",
    sugriva: "👑",
    tara: "🌸",
    ruma: "🌺",
    angada_vali: "🏹",
    hanuman: "🙏",
    kesari: "🐒",
    anjana: "🪷",
    jambavan: "🐻",
    pulastya: "🧘",
    vishrava: "📜",
    kaikasi: "👑",
    kubera: "💰",
    ravana: "🔱",
    mandodari: "🪷",
    kumbhakarna: "🛡️",
    vajrajvala: "🔥",
    vibhishana: "🙏",
    sarama: "🌸",
    shurpanakha: "👁️",
    indrajit: "⚡",
    akshayakumara: "⚔️",
    atikaya: "🏹",
    narantaka: "🗡️",
    devantaka: "🗡️",
    trishira: "🔱",
    vasistha: "📜",
    vishwamitra: "🏹",
    valmiki: "✍️",
    agastya: "🌊",
    jabali: "🧘"
  };

  function getAvatar(id) {
    return AVATARS[id] || "👑";
  }

  /* Explicit genealogical connections for rendering flowcharts */
  const CONNECTIONS = {
    dasharatha: [
      // 1. Marriages (Pink Lines #ff7675)
      { type: "marriage", from: "aja", to: "indumati" },
      { type: "marriage", from: "dasharatha", to: "kausalya" },
      { type: "marriage", from: "dasharatha", to: "sumitra" },
      { type: "marriage", from: "dasharatha", to: "kaikeyi" },
      { type: "marriage", from: "shanta", to: "rishyashringa" },
      { type: "marriage", from: "sri_rama", to: "sita" },
      { type: "marriage", from: "lakshmana", to: "urmila" },
      { type: "marriage", from: "bharata", to: "mandavi" },
      { type: "marriage", from: "shatrughna", to: "shrutakirti" },

      // 2. Siblings (Blue Lines #74b9ff)
      { type: "siblings", members: ["sri_rama", "lakshmana", "bharata", "shatrughna"] },
      { type: "siblings", members: ["lava", "kusha"] },
      { type: "siblings", members: ["angada_lakshmana", "chandraketu"] },
      { type: "siblings", members: ["taksha", "pushkala"] },
      { type: "siblings", members: ["subahu_shatrughna", "shatrughati"] },

      // 3. Parent-Child (Yellow Lines #ffd166)
      { type: "parent_child", from: "aja", to: ["dasharatha"] },
      { type: "parent_child", from: "dasharatha", to: ["shanta"] },
      { type: "parent_child", from: "kausalya", to: ["sri_rama"] },
      { type: "parent_child", from: "sumitra", to: ["lakshmana", "shatrughna"] },
      { type: "parent_child", from: "kaikeyi", to: ["bharata"] },
      { type: "parent_child", from: "sri_rama", to: ["lava", "kusha"] },
      { type: "parent_child", from: "lakshmana", to: ["angada_lakshmana", "chandraketu"] },
      { type: "parent_child", from: "bharata", to: ["taksha", "pushkala"] },
      { type: "parent_child", from: "shatrughna", to: ["subahu_shatrughna", "shatrughati"] }
    ],

    janaka: [
      // Marriages (Pink)
      { type: "marriage", from: "sita", to: "sri_rama" },
      { type: "marriage", from: "urmila", to: "lakshmana" },
      { type: "marriage", from: "mandavi", to: "bharata" },
      { type: "marriage", from: "shrutakirti", to: "shatrughna" },

      // Siblings (Blue)
      { type: "siblings", members: ["janaka", "kushadhvaja"] },
      { type: "siblings", members: ["sita", "urmila"] },
      { type: "siblings", members: ["mandavi", "shrutakirti"] },

      // Parent-Child (Yellow)
      { type: "parent_child", from: "hrasvaroman", to: ["janaka", "kushadhvaja"] },
      { type: "parent_child", from: "janaka", to: ["sita", "urmila"] },
      { type: "parent_child", from: "kushadhvaja", to: ["mandavi", "shrutakirti"] }
    ],

    vanara: [
      // Marriages (Pink)
      { type: "marriage", from: "kesari", to: "anjana" },
      { type: "marriage", from: "vali", to: "tara" },
      { type: "marriage", from: "sugriva", to: "ruma" },

      // Siblings (Blue)
      { type: "siblings", members: ["vali", "sugriva"] },

      // Parent-Child (Yellow)
      { type: "parent_child", from: "kesari", to: ["hanuman"] },
      { type: "parent_child", from: "anjana", to: ["hanuman"] },
      { type: "parent_child", from: "vali", to: ["angada_vali"] }
    ],

    rakshasa: [
      // Marriages (Pink)
      { type: "marriage", from: "vishrava", to: "kaikasi" },
      { type: "marriage", from: "ravana", to: "mandodari" },
      { type: "marriage", from: "kumbhakarna", to: "vajrajvala" },
      { type: "marriage", from: "vibhishana", to: "sarama" },

      // Siblings (Blue)
      { type: "siblings", members: ["ravana", "kumbhakarna", "vibhishana", "shurpanakha"] },
      { type: "siblings", members: ["indrajit", "akshayakumara", "atikaya", "narantaka", "devantaka", "trishira"] },

      // Parent-Child (Yellow)
      { type: "parent_child", from: "pulastya", to: ["vishrava"] },
      { type: "parent_child", from: "vishrava", to: ["kubera"] },
      { type: "parent_child", from: "kaikasi", to: ["ravana", "kumbhakarna", "vibhishana", "shurpanakha"] },
      { type: "parent_child", from: "ravana", to: ["indrajit", "akshayakumara", "atikaya", "narantaka", "devantaka", "trishira"] }
    ],

    guru: [
      // Guru-Disciple (Purple Dashed)
      { type: "guru_disciple", from: "vasistha", to: ["dasharatha", "sri_rama", "lakshmana", "bharata", "shatrughna"] },
      { type: "guru_disciple", from: "vishwamitra", to: ["sri_rama", "lakshmana"] },
      { type: "guru_disciple", from: "valmiki", to: ["lava", "kusha"] },
      { type: "guru_disciple", from: "agastya", to: ["sri_rama"] }
    ]
  };

  /* =====================================================
     2. PAN & ZOOM CONTROLLER (CALIBRATED FOR MOBILE & DESKTOP)
  ===================================================== */
  function clampAndApplyTransform() {
    const viewport = document.getElementById("treeViewport");
    const content = document.getElementById("treeContent");
    if (!viewport || !content) return;

    const viewW = viewport.clientWidth || 800;
    const viewH = viewport.clientHeight || 600;
    const contentW = (content.scrollWidth || 1000) * state.scale;
    const contentH = (content.scrollHeight || 800) * state.scale;

    // Strict boundary clamping so tree content NEVER gets lost in black space
    const maxPanX = Math.max((contentW - viewW) / 2 + 120, 60);
    const maxPanY = Math.max((contentH - viewH) / 2 + 100, 50);

    state.panX = Math.max(-maxPanX, Math.min(maxPanX, state.panX));
    state.panY = Math.max(-maxPanY, Math.min(maxPanY, state.panY));

    content.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
  }

  function initPanZoom() {
    const viewport = document.getElementById("treeViewport");
    const content = document.getElementById("treeContent");
    if (!viewport || !content) return;

    // --- Desktop Mouse Dragging ---
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;

    viewport.addEventListener("mousedown", (e) => {
      if (e.target.closest(".rk-char-node") || e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;
      isMouseDown = true;
      mouseStartX = e.clientX - state.panX;
      mouseStartY = e.clientY - state.panY;
      viewport.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      state.panX = e.clientX - mouseStartX;
      state.panY = e.clientY - mouseStartY;
      clampAndApplyTransform();
    });

    window.addEventListener("mouseup", () => {
      isMouseDown = false;
      if (viewport) viewport.style.cursor = "grab";
    });

    // --- Mobile Touch Gestures (Calibrated Sensitivity & Native Page Scrolling) ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartPanX = 0;
    let touchStartPanY = 0;
    let touchMode = "idle"; // "idle", "scroll", "pan", "pinch"
    let pinchStartDist = 0;
    let pinchStartScale = 1;

    viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartPanX = state.panX;
        touchStartPanY = state.panY;
        touchMode = "idle";
      } else if (e.touches.length === 2) {
        touchMode = "pinch";
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartScale = state.scale;
      }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        // If intent hasn't been established yet, detect direction
        if (touchMode === "idle") {
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);

          if (absY > absX && absY > 7) {
            // Natural page scroll: Let browser scroll the page naturally!
            touchMode = "scroll";
            return;
          } else if (absX > absY && absX > 7) {
            // Horizontal tree pan
            touchMode = "pan";
          } else {
            return;
          }
        }

        if (touchMode === "scroll") {
          // Allow normal native vertical scroll; do not hijack!
          return;
        }

        if (touchMode === "pan") {
          if (e.cancelable) e.preventDefault();
          // Gentle 1:1 smooth dampened horizontal pan
          state.panX = touchStartPanX + dx * 0.95;
          state.panY = touchStartPanY + dy * 0.35;
          clampAndApplyTransform();
        }
      } else if (e.touches.length === 2 && touchMode === "pinch") {
        if (e.cancelable) e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchStartDist > 0) {
          const factor = currentDist / pinchStartDist;
          let targetScale = pinchStartScale * factor;
          // Zoom scale locked between 75% and 150% so it NEVER collapses to 45% or gets lost
          targetScale = Math.min(Math.max(targetScale, 0.75), 1.5);
          state.scale = Number(targetScale.toFixed(2));
          clampAndApplyTransform();
          updateZoomDisplay();
        }
      }
    }, { passive: false });

    viewport.addEventListener("touchend", () => {
      touchMode = "idle";
      pinchStartDist = 0;
    });

    // Mouse wheel zoom
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      zoomBy(delta);
    }, { passive: false });

    // Toolbar buttons
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnResetZoom = document.getElementById("btnResetZoom");
    const btnFit = document.getElementById("btnFit");

    if (btnZoomIn) btnZoomIn.addEventListener("click", () => zoomBy(0.1));
    if (btnZoomOut) btnZoomOut.addEventListener("click", () => zoomBy(-0.1));
    if (btnResetZoom) btnResetZoom.addEventListener("click", resetZoom);
    if (btnFit) btnFit.addEventListener("click", fitToScreen);

    // Initial centering
    resetZoom();
  }

  function zoomBy(delta) {
    const newScale = Math.min(Math.max(state.scale + delta, 0.75), 1.6);
    state.scale = Number(newScale.toFixed(2));
    clampAndApplyTransform();
    updateZoomDisplay();
  }

  function resetZoom() {
    const isMobile = window.innerWidth <= 768;
    state.scale = isMobile ? 0.85 : 1.0;
    state.panX = 0;
    state.panY = 0;
    clampAndApplyTransform();
    updateZoomDisplay();
  }

  function fitToScreen() {
    const viewport = document.getElementById("treeViewport");
    const content = document.getElementById("treeContent");
    if (!viewport || !content) return;
    const viewW = viewport.clientWidth || 800;
    const contentW = content.scrollWidth || 1000;
    if (contentW > viewW) {
      state.scale = Number(Math.max((viewW - 40) / contentW, 0.75).toFixed(2));
    } else {
      state.scale = 1.0;
    }
    state.panX = 0;
    state.panY = 0;
    clampAndApplyTransform();
    updateZoomDisplay();
  }

  function updateZoomDisplay() {
    const el = document.getElementById("zoomLevelLabel");
    if (el) el.textContent = `${Math.round(state.scale * 100)}%`;
  }

  /* =====================================================
     3. DYNAMIC SVG TREE CONNECTORS ENGINE
     (Yellow: Parent-Child, Pink: Marriage, Blue: Siblings, Purple: Guru)
  ===================================================== */
  function drawTreeConnections() {
    const content = document.getElementById("treeContent");
    if (!content) return;

    const catId = state.currentCategory;
    const conns = CONNECTIONS[catId];
    if (!conns || conns.length === 0) {
      const oldSvg = document.getElementById("treeSvgCanvas");
      if (oldSvg) oldSvg.remove();
      return;
    }

    let svg = document.getElementById("treeSvgCanvas");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "treeSvgCanvas";
      svg.setAttribute("class", "rk-tree-svg-canvas");
      content.insertBefore(svg, content.firstChild);
    }

    const cW = Math.max(content.scrollWidth, content.offsetWidth, 1200);
    const cH = Math.max(content.scrollHeight, content.offsetHeight, 800);
    svg.setAttribute("width", cW);
    svg.setAttribute("height", cH);
    svg.setAttribute("viewBox", `0 0 ${cW} ${cH}`);

    // Definitions for arrowheads, dots, and glow filters
    svg.innerHTML = `
      <defs>
        <!-- Yellow Down Arrow for Parent-to-Child -->
        <marker id="arrowYellow" markerWidth="9" markerHeight="9" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 8 3.5, 0 7" fill="#ffd166"/>
        </marker>
        <!-- Blue Dot for Siblings -->
        <marker id="dotBlue" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <circle cx="3" cy="3" r="2.5" fill="#74b9ff"/>
        </marker>
        <!-- Pink Glow Filter -->
        <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ff7675" flood-opacity="0.8"/>
        </filter>
        <!-- Yellow Glow Filter -->
        <filter id="yellowGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ffd166" flood-opacity="0.8"/>
        </filter>
      </defs>
    `;

    const contentRect = content.getBoundingClientRect();
    const scale = state.scale || 1;

    function getNodeCoords(id) {
      const el = document.getElementById(`node-${id}`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = (r.left - contentRect.left) / scale;
      const y = (r.top - contentRect.top) / scale;
      const w = r.width / scale;
      const h = r.height / scale;
      return {
        left: x,
        right: x + w,
        top: y,
        bottom: y + h,
        centerX: x + w / 2,
        centerY: y + h / 2,
        w,
        h
      };
    }

    let pathsHtml = "";

    conns.forEach(conn => {
      // 1. Marriage Line (Pink #ff7675)
      if (conn.type === "marriage") {
        const a = getNodeCoords(conn.from);
        const b = getNodeCoords(conn.to);
        if (a && b) {
          const leftNode = a.centerX <= b.centerX ? a : b;
          const rightNode = a.centerX <= b.centerX ? b : a;

          if (Math.abs(leftNode.centerY - rightNode.centerY) < 45) {
            // Horizontal side-by-side marriage connector
            const y = (leftNode.centerY + rightNode.centerY) / 2;
            const x1 = leftNode.right;
            const x2 = rightNode.left;
            const midX = (x1 + x2) / 2;

            pathsHtml += `
              <g class="rk-line-marriage">
                <line x1="${x1}" y1="${y - 2}" x2="${x2}" y2="${y - 2}" stroke="#ff7675" stroke-width="2" filter="url(#pinkGlow)"/>
                <line x1="${x1}" y1="${y + 2}" x2="${x2}" y2="${y + 2}" stroke="#ff7675" stroke-width="2" filter="url(#pinkGlow)"/>
                <circle cx="${midX}" cy="${y}" r="4" fill="#ff7675" stroke="#ffeaa7" stroke-width="1.5"/>
              </g>
            `;
          } else {
            // Stepped marriage connector across rows
            const x1 = leftNode.right;
            const y1 = leftNode.centerY;
            const x2 = rightNode.left;
            const y2 = rightNode.centerY;
            const midX = (x1 + x2) / 2;

            pathsHtml += `
              <g class="rk-line-marriage">
                <path d="M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}" stroke="#ff7675" stroke-width="2.5" fill="none" filter="url(#pinkGlow)"/>
                <circle cx="${midX}" cy="${(y1 + y2) / 2}" r="4" fill="#ff7675" stroke="#ffeaa7" stroke-width="1.5"/>
              </g>
            `;
          }
        }
      }

      // 2. Parent-to-Child (Yellow #ffd166)
      else if (conn.type === "parent_child") {
        const parent = getNodeCoords(conn.from);
        if (parent && conn.to && conn.to.length > 0) {
          const children = conn.to.map(getNodeCoords).filter(Boolean);
          if (children.length > 0) {
            const minChildTop = Math.min(...children.map(c => c.top));
            const startX = parent.centerX;
            const startY = parent.bottom;
            const railY = startY < minChildTop ? startY + (minChildTop - startY) * 0.45 : startY + 24;

            pathsHtml += `
              <g class="rk-line-parent-child">
                <!-- Drop line from parent -->
                <line x1="${startX}" y1="${startY}" x2="${startX}" y2="${railY}" stroke="#ffd166" stroke-width="2.5" filter="url(#yellowGlow)"/>
                <circle cx="${startX}" cy="${startY}" r="3.5" fill="#ffd166"/>
                <circle cx="${startX}" cy="${railY}" r="3" fill="#ffd166"/>
            `;

            if (children.length === 1) {
              const ch = children[0];
              pathsHtml += `
                <path d="M ${startX},${railY} L ${ch.centerX},${railY} L ${ch.centerX},${ch.top}" stroke="#ffd166" stroke-width="2.5" fill="none" marker-end="url(#arrowYellow)" filter="url(#yellowGlow)"/>
              `;
            } else {
              const minX = Math.min(startX, ...children.map(c => c.centerX));
              const maxX = Math.max(startX, ...children.map(c => c.centerX));

              pathsHtml += `
                <line x1="${minX}" y1="${railY}" x2="${maxX}" y2="${railY}" stroke="#ffd166" stroke-width="2.5" stroke-linecap="round" filter="url(#yellowGlow)"/>
              `;

              children.forEach(ch => {
                pathsHtml += `
                  <line x1="${ch.centerX}" y1="${railY}" x2="${ch.centerX}" y2="${ch.top}" stroke="#ffd166" stroke-width="2.5" marker-end="url(#arrowYellow)" filter="url(#yellowGlow)"/>
                  <circle cx="${ch.centerX}" cy="${railY}" r="2.5" fill="#ffd166"/>
                `;
              });
            }
            pathsHtml += `</g>`;
          }
        }
      }

      // 3. Siblings (Blue Rail #74b9ff)
      else if (conn.type === "siblings") {
        const members = conn.members.map(getNodeCoords).filter(Boolean);
        if (members.length >= 2) {
          members.sort((a, b) => a.centerX - b.centerX);
          const minX = members[0].centerX;
          const maxX = members[members.length - 1].centerX;
          const avgTop = members.reduce((sum, m) => sum + m.top, 0) / members.length;
          const railY = avgTop - 14;

          pathsHtml += `
            <g class="rk-line-sibling">
              <line x1="${minX}" y1="${railY}" x2="${maxX}" y2="${railY}" stroke="#74b9ff" stroke-width="2.5" stroke-linecap="round"/>
          `;

          members.forEach(m => {
            pathsHtml += `
              <line x1="${m.centerX}" y1="${railY}" x2="${m.centerX}" y2="${m.top}" stroke="#74b9ff" stroke-width="2.5"/>
              <circle cx="${m.centerX}" cy="${railY}" r="3" fill="#74b9ff"/>
              <circle cx="${m.centerX}" cy="${m.top}" r="2.5" fill="#74b9ff"/>
            `;
          });
          pathsHtml += `</g>`;
        }
      }

      // 4. Guru-to-Disciple (Purple Dashed #a29bfe)
      else if (conn.type === "guru_disciple") {
        const guru = getNodeCoords(conn.from);
        if (guru && conn.to) {
          const disciples = conn.to.map(getNodeCoords).filter(Boolean);
          disciples.forEach(d => {
            const startX = guru.centerX;
            const startY = guru.bottom;
            const endX = d.centerX;
            const endY = d.top;
            const midY = (startY + endY) / 2;

            pathsHtml += `
              <g class="rk-line-guru">
                <path d="M ${startX},${startY} C ${startX},${midY} ${endX},${midY} ${endX},${endY}" stroke="#a29bfe" stroke-width="2" stroke-dasharray="6,4" fill="none"/>
                <circle cx="${startX}" cy="${startY}" r="3" fill="#a29bfe"/>
                <circle cx="${endX}" cy="${endY}" r="3" fill="#a29bfe"/>
              </g>
            `;
          });
        }
      }
    });

    svg.innerHTML += pathsHtml;
  }

  /* =====================================================
     4. RENDER IKSHVAKU DYNASTY (39 GENERATIONS)
  ===================================================== */
  function renderIkshvakuDynasty(container) {
    const data = getData();
    if (!data) return;
    const lineage = data.IKSHVAKU_LINEAGE || [];

    const MILESTONES = [
      "brahma", "marichi", "kashyapa", "vivasvan", "vaivasvata_manu",
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
        return;
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

    container.querySelectorAll(".rk-lineage-row").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-char-id");
        openCharacterProfile(id);
      });
    });

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
     5. RENDER HIERARCHICAL FAMILY TREES
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

    let html = `<div class="rk-tree-flowchart-wrap">`;

    treeSpec.generations.forEach((gen) => {
      html += `
        <div class="rk-tree-level" data-level="${gen.level}">
          <div class="rk-level-title-badge">
            ${state.lang === 'te' ? gen.titleTelugu : gen.titleEnglish}
          </div>
          <div class="rk-nodes-row">
      `;

      // Custom high-fidelity cluster layouts
      if (catId === "dasharatha" && gen.level === 1) {
        html += `
          <div class="rk-couple-cluster" id="cluster-aja-indumati">
            ${renderNodeCard(charMap["aja"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["indumati"])}
          </div>
        `;
      } else if (catId === "dasharatha" && gen.level === 3) {
        const couples = [
          { c1: "shanta", c2: "rishyashringa" },
          { c1: "sri_rama", c2: "sita" },
          { c1: "lakshmana", c2: "urmila" },
          { c1: "bharata", c2: "mandavi" },
          { c1: "shatrughna", c2: "shrutakirti" }
        ];

        couples.forEach(cp => {
          if (charMap[cp.c1] && charMap[cp.c2]) {
            html += `
              <div class="rk-couple-cluster" id="cluster-${cp.c1}-${cp.c2}">
                ${renderNodeCard(charMap[cp.c1])}
                <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
                ${renderNodeCard(charMap[cp.c2])}
              </div>
            `;
          }
        });
      } else if (catId === "janaka" && gen.level === 3) {
        const couples = [
          { c1: "sita", c2: "sri_rama" },
          { c1: "urmila", c2: "lakshmana" },
          { c1: "mandavi", c2: "bharata" },
          { c1: "shrutakirti", c2: "shatrughna" }
        ];

        couples.forEach(cp => {
          if (charMap[cp.c1] && charMap[cp.c2]) {
            html += `
              <div class="rk-couple-cluster" id="cluster-${cp.c1}-${cp.c2}">
                ${renderNodeCard(charMap[cp.c1])}
                <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
                ${renderNodeCard(charMap[cp.c2])}
              </div>
            `;
          }
        });
      } else if (catId === "vanara" && gen.level === 1) {
        html += `
          <div class="rk-couple-cluster" id="cluster-kesari-anjana">
            ${renderNodeCard(charMap["kesari"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["anjana"])}
          </div>
          ${charMap["jambavan"] ? renderNodeCard(charMap["jambavan"]) : ""}
        `;
      } else if (catId === "vanara" && gen.level === 2) {
        html += `
          <div class="rk-couple-cluster" id="cluster-vali-tara">
            ${renderNodeCard(charMap["vali"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["tara"])}
          </div>
          <div class="rk-couple-cluster" id="cluster-sugriva-ruma">
            ${renderNodeCard(charMap["sugriva"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["ruma"])}
          </div>
          ${charMap["hanuman"] ? renderNodeCard(charMap["hanuman"]) : ""}
        `;
      } else if (catId === "rakshasa" && gen.level === 2) {
        html += `
          <div class="rk-couple-cluster" id="cluster-vishrava-kaikasi">
            ${renderNodeCard(charMap["vishrava"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["kaikasi"])}
          </div>
        `;
      } else if (catId === "rakshasa" && gen.level === 3) {
        html += `
          ${charMap["kubera"] ? renderNodeCard(charMap["kubera"]) : ""}
          <div class="rk-couple-cluster" id="cluster-ravana-mandodari">
            ${renderNodeCard(charMap["ravana"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["mandodari"])}
          </div>
          <div class="rk-couple-cluster" id="cluster-kumbhakarna-vajrajvala">
            ${renderNodeCard(charMap["kumbhakarna"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["vajrajvala"])}
          </div>
          <div class="rk-couple-cluster" id="cluster-vibhishana-sarama">
            ${renderNodeCard(charMap["vibhishana"])}
            <span class="rk-marriage-heart" title="వివాహ బంధం">💍</span>
            ${renderNodeCard(charMap["sarama"])}
          </div>
          ${charMap["shurpanakha"] ? renderNodeCard(charMap["shurpanakha"]) : ""}
        `;
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

      card.addEventListener("mouseenter", () => {
        if (state.highlightActive) highlightNetwork(charId);
      });
      card.addEventListener("mouseleave", () => {
        if (state.highlightActive) clearNetworkHighlight();
      });

      card.addEventListener("click", () => {
        openCharacterProfile(charId);
      });
    });

    // Draw SVG connecting lines after DOM paint
    requestAnimationFrame(() => {
      setTimeout(drawTreeConnections, 50);
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
     6. HIGHLIGHT FAMILY NETWORK
  ===================================================== */
  function highlightNetwork(charId) {
    const data = getData();
    if (!data) return;

    const charMap = {};
    (data.CHARACTERS || []).forEach(c => { charMap[c.id] = c; });
    const target = charMap[charId];
    if (!target) return;

    clearNetworkHighlight();

    const targetEl = document.getElementById(`node-${charId}`);
    if (targetEl) targetEl.classList.add("highlight-target");

    (target.fatherId ? [target.fatherId] : []).concat(target.motherId ? [target.motherId] : []).forEach(pId => {
      const el = document.getElementById(`node-${pId}`);
      if (el) el.classList.add("highlight-parent");
    });

    (target.spouseIds || []).forEach(sId => {
      const el = document.getElementById(`node-${sId}`);
      if (el) el.classList.add("highlight-spouse");
    });

    (target.childrenIds || []).forEach(cId => {
      const el = document.getElementById(`node-${cId}`);
      if (el) el.classList.add("highlight-child");
    });

    (target.siblingIds || []).forEach(sbId => {
      const el = document.getElementById(`node-${sbId}`);
      if (el) el.classList.add("highlight-sibling");
    });
  }

  function clearNetworkHighlight() {
    document.querySelectorAll(".rk-char-node").forEach(el => {
      el.classList.remove(
        "highlight-target",
        "highlight-parent",
        "highlight-spouse",
        "highlight-child",
        "highlight-sibling"
      );
    });
  }

  /* =====================================================
     7. CHARACTER PROFILE MODAL
  ===================================================== */
  function openCharacterProfile(charId) {
    const data = getData();
    if (!data) return;

    let char = (data.CHARACTERS || []).find(c => c.id === charId);
    let isKingLineage = false;

    if (!char && data.IKSHVAKU_LINEAGE) {
      const king = data.IKSHVAKU_LINEAGE.find(k => k.id === charId);
      if (king) {
        isKingLineage = true;
        char = {
          id: king.id,
          nameTelugu: king.nameTe,
          nameEnglish: king.nameEn,
          category: "ikshvaku",
          kingdom: "అయోధ్య (Ayodhya)",
          descriptionTelugu: king.roleTe,
          descriptionEnglish: `Generation #${king.gen} in the Solar Dynasty.`,
          roleInRamayana: king.titleTe,
          kandaReferences: king.sarga || "వాల్మీకి రామాయణం, బాలకాండ సర్గ 70",
          sourceTradition: "శ్రీమద్వాల్మీకి రామాయణం",
          avatar: "👑"
        };
      }
    }

    if (!char) return;

    const modal = document.getElementById("profileModal");
    const modalContent = document.getElementById("profileModalContent");
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="rk-profile-top">
        <div class="rk-profile-avatar-wrap">
          <span id="modalCharAvatar">${getAvatar(char.id)}</span>
        </div>
        <div class="rk-profile-title-block">
          <h2 id="modalCharNameTe">${char.nameTelugu}</h2>
          <div class="rk-prof-en" id="modalCharNameEn">${char.nameEnglish}</div>
          <div class="rk-prof-kingdom" id="modalCharRoleBadge">🏛️ ${char.kingdom || "శ్రీమద్రామాయణం"}</div>
        </div>
      </div>
      <div class="rk-profile-body">
        <div class="rk-profile-section-title">📜 సంక్షిప్త పరిచయం (About)</div>
        <div class="rk-profile-desc" id="modalCharBioTe">${char.descriptionTelugu || char.roleTe || ""}</div>
        ${char.descriptionEnglish ? `<div class="rk-profile-desc" style="font-family:var(--font-ui); font-size:0.88rem; color:var(--rk-text-dim);" id="modalCharBioEn">${char.descriptionEnglish}</div>` : ""}

        <div class="rk-profile-section-title">🌟 రామాయణంలో ప్రాముఖ్యత (Significance)</div>
        <div class="rk-profile-desc" id="modalRoleInRamayana">${char.roleInRamayana || "శ్రీమద్రామాయణంలో విశిష్ట పాత్ర."}</div>

        <div class="rk-res-meta-row" style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(255,209,102,0.12);">
          <span id="modalCitations">📖 ప్రమాణం: <strong>${char.kandaReferences || 'బాలకాండ 70'}</strong></span>
          <span>సనాతన ధర్మ గ్రంథాలంబన</span>
        </div>
      </div>
    `;

    modal.classList.add("active");
    state.selectedCharId = charId;
  }

  function closeCharacterProfile() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
    state.selectedCharId = null;
  }

  /* =====================================================
     8. SEARCH AUTOCOMPLETE & JUMP
  ===================================================== */
  function initSearch() {
    const input = document.getElementById("heroSearchInput");
    const resultsBox = document.getElementById("searchResultsBox");
    if (!input || !resultsBox) return;

    const data = getData();
    if (!data) return;

    const allItems = [];
    (data.CHARACTERS || []).forEach(c => {
      allItems.push({
        id: c.id,
        nameTe: c.nameTelugu,
        nameEn: c.nameEnglish,
        role: c.roleInRamayana || c.kingdom,
        category: c.category,
        avatar: getAvatar(c.id)
      });
    });

    (data.IKSHVAKU_LINEAGE || []).forEach(k => {
      if (!allItems.some(x => x.id === k.id)) {
        allItems.push({
          id: k.id,
          nameTe: k.nameTe,
          nameEn: k.nameEn,
          role: `ఇక్ష్వాకు తరం #${k.gen} - ${k.titleTe}`,
          category: "ikshvaku",
          avatar: "👑"
        });
      }
    });

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        resultsBox.innerHTML = "";
        resultsBox.classList.remove("active");
        return;
      }

      const matches = allItems.filter(item => {
        return (
          item.nameTe.toLowerCase().includes(q) ||
          item.nameEn.toLowerCase().includes(q) ||
          (item.role && item.role.toLowerCase().includes(q))
        );
      }).slice(0, 8);

      if (matches.length === 0) {
        resultsBox.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--rk-text-dim);">పాత్ర లభించలేదు</div>`;
        resultsBox.classList.add("active");
        return;
      }

      let html = "";
      matches.forEach(item => {
        html += `
          <div class="rk-search-result-item" data-id="${item.id}" data-cat="${item.category}">
            <div class="rk-search-res-left">
              <span class="rk-search-res-avatar">${item.avatar}</span>
              <div>
                <div class="rk-search-res-name-te">${item.nameTe}</div>
                <div class="rk-search-res-name-en">${item.nameEn}</div>
              </div>
            </div>
            <span class="rk-search-res-category">${item.role || ''}</span>
          </div>
        `;
      });

      resultsBox.innerHTML = html;
      resultsBox.classList.add("active");

      resultsBox.querySelectorAll(".rk-search-result-item").forEach(el => {
        el.addEventListener("click", () => {
          const id = el.getAttribute("data-id");
          const cat = el.getAttribute("data-cat");
          resultsBox.classList.remove("active");
          input.value = "";
          if (cat && cat !== state.currentCategory) {
            selectCategory(cat);
          }
          openCharacterProfile(id);
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".rk-search-wrapper")) {
        resultsBox.classList.remove("active");
      }
    });
  }

  /* =====================================================
     9. SEARCHABLE RELATIONSHIP FINDER COMPONENT
  ===================================================== */
  function initRelationshipFinderUI() {
    const input1 = document.getElementById("charInput1");
    const input2 = document.getElementById("charInput2");
    const drop1 = document.getElementById("pickerDrop1");
    const drop2 = document.getElementById("pickerDrop2");
    const arrow1 = document.getElementById("arrowBtn1");
    const arrow2 = document.getElementById("arrowBtn2");
    const avatar1 = document.getElementById("pickerAvatar1");
    const avatar2 = document.getElementById("pickerAvatar2");
    const sel1 = document.getElementById("charSelect1");
    const sel2 = document.getElementById("charSelect2");
    const btnFind = document.getElementById("btnFindRelationship");
    const btnSwap = document.getElementById("btnSwapChars");
    const resultCard = document.getElementById("relationshipResultCard");

    const data = getData();
    if (!data) return;

    const allChars = [];
    (data.CHARACTERS || []).forEach(c => {
      allChars.push({
        id: c.id,
        nameTe: c.nameTelugu,
        nameEn: c.nameEnglish,
        role: c.roleInRamayana || c.kingdom || "",
        avatar: getAvatar(c.id)
      });
    });

    (data.IKSHVAKU_LINEAGE || []).forEach(k => {
      if (!allChars.some(x => x.id === k.id)) {
        allChars.push({
          id: k.id,
          nameTe: k.nameTe,
          nameEn: k.nameEn,
          role: `ఇక్ష్వాకు #${k.gen}`,
          avatar: "👑"
        });
      }
    });

    allChars.sort((a, b) => a.nameTe.localeCompare(b.nameTe, "te"));

    if (sel1 && sel2) {
      let optsHtml = `<option value="">-- పాత్రను ఎంచుకోండి --</option>`;
      allChars.forEach(c => {
        optsHtml += `<option value="${c.id}">${c.nameTe} (${c.nameEn})</option>`;
      });
      sel1.innerHTML = optsHtml;
      sel2.innerHTML = optsHtml;
    }

    function renderDropdown(dropEl, query, onSelect) {
      if (!dropEl) return;
      const q = (query || "").trim().toLowerCase();
      const filtered = q
        ? allChars.filter(c => c.nameTe.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.role.toLowerCase().includes(q))
        : allChars;

      if (filtered.length === 0) {
        dropEl.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--rk-text-dim);">పాత్ర కనుగొనబడలేదు</div>`;
        dropEl.classList.add("active");
        return;
      }

      let html = "";
      filtered.forEach(c => {
        html += `
          <div class="rk-picker-item" data-id="${c.id}">
            <div class="rk-picker-item-left">
              <span class="rk-picker-item-avatar">${c.avatar}</span>
              <div>
                <div class="rk-picker-item-name">${c.nameTe}</div>
                <div class="rk-picker-item-en">${c.nameEn}</div>
              </div>
            </div>
            ${c.role ? `<span class="rk-picker-item-badge">${c.role}</span>` : ''}
          </div>
        `;
      });
      dropEl.innerHTML = html;
      dropEl.classList.add("active");

      // Handle pointerdown/mousedown for instant touch selection without 300ms mobile lag
      dropEl.querySelectorAll(".rk-picker-item").forEach(item => {
        const handleSelect = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const id = item.getAttribute("data-id");
          const found = allChars.find(x => x.id === id);
          if (found) onSelect(found);
          dropEl.classList.remove("active");
        };

        item.addEventListener("pointerdown", handleSelect);
        item.addEventListener("click", handleSelect);
      });
    }

    function selectChar1(c) {
      if (!input1) return;
      input1.value = `${c.nameTe} (${c.nameEn})`;
      input1.setAttribute("data-selected-id", c.id);
      if (avatar1) avatar1.textContent = c.avatar;
      if (sel1) sel1.value = c.id;
      computeAndShow();
    }

    function selectChar2(c) {
      if (!input2) return;
      input2.value = `${c.nameTe} (${c.nameEn})`;
      input2.setAttribute("data-selected-id", c.id);
      if (avatar2) avatar2.textContent = c.avatar;
      if (sel2) sel2.value = c.id;
      computeAndShow();
    }

    if (input1) {
      input1.addEventListener("focus", () => renderDropdown(drop1, "", selectChar1));
      input1.addEventListener("input", () => renderDropdown(drop1, input1.value, selectChar1));
    }
    if (arrow1) {
      arrow1.addEventListener("click", (e) => {
        e.stopPropagation();
        if (drop1.classList.contains("active")) {
          drop1.classList.remove("active");
        } else {
          renderDropdown(drop1, "", selectChar1);
        }
      });
    }

    if (input2) {
      input2.addEventListener("focus", () => renderDropdown(drop2, "", selectChar2));
      input2.addEventListener("input", () => renderDropdown(drop2, input2.value, selectChar2));
    }
    if (arrow2) {
      arrow2.addEventListener("click", (e) => {
        e.stopPropagation();
        if (drop2.classList.contains("active")) {
          drop2.classList.remove("active");
        } else {
          renderDropdown(drop2, "", selectChar2);
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#pickerWrap1") && drop1) drop1.classList.remove("active");
      if (!e.target.closest("#pickerWrap2") && drop2) drop2.classList.remove("active");
    });

    function computeAndShow() {
      const id1 = (input1 && input1.getAttribute("data-selected-id")) || (sel1 && sel1.value) || "sri_rama";
      const id2 = (input2 && input2.getAttribute("data-selected-id")) || (sel2 && sel2.value) || "bharata";

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

      if (resultCard) {
        resultCard.classList.add("active");
      }
    }

    if (btnFind) btnFind.addEventListener("click", computeAndShow);

    if (btnSwap) {
      btnSwap.addEventListener("click", () => {
        const id1 = (input1 && input1.getAttribute("data-selected-id")) || "sri_rama";
        const id2 = (input2 && input2.getAttribute("data-selected-id")) || "bharata";
        const c1 = allChars.find(x => x.id === id1);
        const c2 = allChars.find(x => x.id === id2);
        if (c1 && c2) {
          selectChar1(c2);
          selectChar2(c1);
        }
      });
    }

    document.querySelectorAll(".rk-preset-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const p1 = pill.getAttribute("data-c1");
        const p2 = pill.getAttribute("data-c2");
        const c1 = allChars.find(x => x.id === p1);
        const c2 = allChars.find(x => x.id === p2);
        if (c1 && c2) {
          selectChar1(c1);
          selectChar2(c2);
        }
      });
    });

    const defaultC1 = allChars.find(x => x.id === "sri_rama");
    const defaultC2 = allChars.find(x => x.id === "bharata");
    if (defaultC1) {
      if (input1) {
        input1.value = `${defaultC1.nameTe} (${defaultC1.nameEn})`;
        input1.setAttribute("data-selected-id", defaultC1.id);
      }
      if (avatar1) avatar1.textContent = defaultC1.avatar;
    }
    if (defaultC2) {
      if (input2) {
        input2.value = `${defaultC2.nameTe} (${defaultC2.nameEn})`;
        input2.setAttribute("data-selected-id", defaultC2.id);
      }
      if (avatar2) avatar2.textContent = defaultC2.avatar;
    }

    computeAndShow();
  }

  /* =====================================================
     10. CATEGORY SELECTOR & WORKSPACE RENDERER
  ===================================================== */
  function selectCategory(catId) {
    state.currentCategory = catId;

    document.querySelectorAll(".rk-cat-tab-btn").forEach(btn => {
      if (btn.getAttribute("data-cat") === catId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

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
     11. INITIALIZATION & RESIZE
  ===================================================== */
  function init() {
    initPanZoom();
    initSearch();
    initRelationshipFinderUI();

    document.querySelectorAll(".rk-category-card").forEach(card => {
      card.addEventListener("click", () => {
        const catId = card.getAttribute("data-category");
        if (catId) {
          selectCategory(catId);
          const ws = document.getElementById("treeWorkspace");
          if (ws) ws.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    document.querySelectorAll(".rk-cat-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const catId = btn.getAttribute("data-cat");
        if (catId) selectCategory(catId);
      });
    });

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "te" ? "en" : "te";
        langBtn.textContent = state.lang === "te" ? "English" : "తెలుగు";
        renderActiveCategory();
      });
    }

    const modalClose = document.getElementById("modalCloseBtn");
    const modal = document.getElementById("profileModal");
    if (modalClose) modalClose.addEventListener("click", closeCharacterProfile);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeCharacterProfile();
      });
    }

    // Redraw SVG on window resize
    window.addEventListener("resize", () => {
      if (state.currentCategory !== "ikshvaku") {
        drawTreeConnections();
      }
    });

    // Initial render
    selectCategory("dasharatha");
  }

  const RamayanaExplorer = {
    init,
    selectCategory,
    openCharacterProfile,
    closeCharacterProfile,
    drawTreeConnections,
    state
  };

  if (typeof window !== "undefined") {
    window.RamayanaExplorer = RamayanaExplorer;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
  if (typeof globalThis !== "undefined") {
    globalThis.RamayanaExplorer = RamayanaExplorer;
  }
})(typeof window !== "undefined" ? window : global);
