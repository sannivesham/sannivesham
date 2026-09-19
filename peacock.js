/**
 * ==============================================================================
 * SANNIVESHAM — CINEMATIC REALISTIC FLYING PEACOCK
 * Lateral (Left & Right) Document-Space Travelling Engine & Photorealistic Rig
 * ==============================================================================
 */

(function () {
  'use strict';

  if (window.__SanniveshamCinematicPeacock) return;
  window.__SanniveshamCinematicPeacock = true;

  const AI_DESTINATION = 'ai/';

  // --------------------------------------------------------------------------
  // Ultra-Detailed Photorealistic Indian Peacock (*Pavo cristatus*) Vector Rig
  // Layered 3D Iridescence, Micro-Texture Plumage, Articulated Wings & Ocelli
  // --------------------------------------------------------------------------
  const CINEMATIC_PEACOCK_SVG = `
  <svg viewBox="0 0 160 160" class="peacock-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Iridescent Royal Blue & Cyan S-Neck Gradient -->
      <linearGradient id="pvoNeckGrad" x1="12%" y1="0%" x2="88%" y2="100%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="18%" stop-color="#0984e3"/>
        <stop offset="48%" stop-color="#1e3799"/>
        <stop offset="78%" stop-color="#0c2461"/>
        <stop offset="100%" stop-color="#041238"/>
      </linearGradient>

      <!-- Volumetric 3D Breast Shading -->
      <radialGradient id="pvoBreastGrad" cx="44%" cy="42%" r="56%">
        <stop offset="0%" stop-color="#0984e3"/>
        <stop offset="38%" stop-color="#0d3b84"/>
        <stop offset="72%" stop-color="#082252"/>
        <stop offset="100%" stop-color="#02091c"/>
      </radialGradient>

      <!-- Folded Wing Scapulars & Greater Coverts (Copper, Bronze, Emerald) -->
      <linearGradient id="pvoCovertsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffeaa7"/>
        <stop offset="18%" stop-color="#ffd166"/>
        <stop offset="38%" stop-color="#d35400"/>
        <stop offset="65%" stop-color="#10ac84"/>
        <stop offset="88%" stop-color="#0652dd"/>
        <stop offset="100%" stop-color="#0c2461"/>
      </linearGradient>

      <!-- Primary & Secondary Flight Feathers (Remiges) -->
      <linearGradient id="pvoFlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0fbcf9"/>
        <stop offset="28%" stop-color="#006266"/>
        <stop offset="65%" stop-color="#0a3d62"/>
        <stop offset="90%" stop-color="#1e272e"/>
        <stop offset="100%" stop-color="#0c0e10"/>
      </linearGradient>

      <!-- Authentic Ocellus (Chandrika) Radiant Eye Pattern -->
      <radialGradient id="pvoOcellusRings" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="26%" stop-color="#0984e3"/>
        <stop offset="52%" stop-color="#05c46b"/>
        <stop offset="76%" stop-color="#ffd166"/>
        <stop offset="90%" stop-color="#d35400"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </radialGradient>

      <!-- Piercing Realistic Amber Eye with Depth -->
      <radialGradient id="pvoEyeRealistic" cx="42%" cy="38%" r="58%">
        <stop offset="0%" stop-color="#ffeaa7"/>
        <stop offset="42%" stop-color="#f39c12"/>
        <stop offset="78%" stop-color="#962d00"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </radialGradient>

      <!-- Plumage Micro-Texture -->
      <pattern id="pvoPlumageTex" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4 Q4 0 8 4 Q4 8 0 4" fill="none" stroke="rgba(0, 206, 201, 0.22)" stroke-width="0.75"/>
      </pattern>
    </defs>

    <!-- Ambient Divine Aura Glow -->
    <circle cx="80" cy="80" r="72" fill="rgba(255, 209, 102, 0.08)" filter="drop-shadow(0 0 16px rgba(255, 209, 102, 0.4))"/>

    <!-- ANATOMICAL LEGS & TALONS (Grip Surface When Perched) -->
    <g class="peacock-talons-rig">
      <!-- Left Leg -->
      <path d="M72 105 L72 118 M72 118 L65 124 M72 118 L72 126 M72 118 L79 124 M72 118 L74 113" 
            stroke="#a67c38" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Right Leg -->
      <path d="M80 105 L80 118 L73 124 M80 118 L80 126 M80 118 L87 124 M80 118 L82 113" 
            stroke="#ba8c42" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Claws -->
      <circle cx="65" cy="124" r="1.2" fill="#3d2d12"/>
      <circle cx="72" cy="126" r="1.2" fill="#3d2d12"/>
      <circle cx="79" cy="124" r="1.2" fill="#3d2d12"/>
      <circle cx="73" cy="124" r="1.2" fill="#3d2d12"/>
      <circle cx="80" cy="126" r="1.2" fill="#3d2d12"/>
      <circle cx="87" cy="124" r="1.2" fill="#3d2d12"/>
    </g>

    <!-- ELONGATED FLOWING TAIL TRAIN (With 6 Radiant Ocelli) -->
    <g class="peacock-tail-rig">
      <!-- Outer Base Plumage -->
      <path d="M78 94 C 98 104, 132 118, 146 145 C 124 137, 96 114, 74 97 Z" fill="#031a17" opacity="0.88"/>
      <path d="M82 92 C 110 102, 142 125, 152 152 C 130 141, 104 114, 80 94 Z" fill="#05362e" opacity="0.92"/>

      <!-- Shimmering Layered Train Feathers -->
      <path d="M84 92 C 114 106, 148 132, 155 156 C 136 145, 108 120, 82 95 Z" fill="#055e4b"/>
      <path d="M78 92 C 98 114, 122 142, 132 162 C 115 147, 96 122, 76 95 Z" fill="#066a55"/>
      <path d="M86 94 C 116 112, 138 138, 145 165 C 128 150, 108 126, 84 96 Z" fill="#077a63"/>

      <!-- Radiant Chandrakas (Ocelli Eyes) Staggered Along Train -->
      <!-- Ocellus 1: Far Outer Top -->
      <g transform="translate(146, 147) scale(0.74)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
        <path d="M-12 0 Q0 -6 12 0 M-10 6 Q0 12 10 6" stroke="#d35400" stroke-width="0.8" fill="none" opacity="0.75"/>
      </g>

      <!-- Ocellus 2: Central Flowing -->
      <g transform="translate(126, 154) scale(0.68)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
      </g>

      <!-- Ocellus 3: Mid Lateral -->
      <g transform="translate(136, 130) scale(0.60)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
      </g>

      <!-- Ocellus 4: Mid Lower -->
      <g transform="translate(140, 160) scale(0.62)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
      </g>

      <!-- Ocellus 5: Inner Lower -->
      <g transform="translate(112, 138) scale(0.55)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
      </g>

      <!-- Ocellus 6: Proximal Base -->
      <g transform="translate(98, 122) scale(0.48)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#pvoOcellusRings)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#020e20"/>
        <circle cx="0" cy="-1" r="5.6" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.9" fill="#ffd166"/>
      </g>
    </g>

    <!-- VOLUMETRIC TORSO & SCAPULAR BACK -->
    <g class="peacock-body-rig">
      <!-- Breast & Abdomen -->
      <path d="M62 70 C 60 88, 68 106, 82 106 C 96 106, 98 88, 92 74 C 88 66, 76 64, 68 66 Z" fill="url(#pvoBreastGrad)"/>
      <path d="M62 70 C 60 88, 68 106, 82 106 C 96 106, 98 88, 92 74 C 88 66, 76 64, 68 66 Z" fill="url(#pvoPlumageTex)" opacity="0.5"/>
      
      <!-- Breast Feather Plumage Scale Lines -->
      <path d="M68 76 Q 74 84 80 76 M72 82 Q 78 90 84 82 M66 85 Q 74 94 82 86 M72 92 Q 78 98 84 92" 
            stroke="#00cec9" stroke-width="1.3" fill="none" opacity="0.75"/>
    </g>

    <!-- FOLDED WING COVERTS (Visible when perched on cards) -->
    <g class="wing-folded-rig">
      <path d="M72 72 C 70 82, 74 96, 86 102 C 94 98, 98 88, 94 74 C 90 66, 80 66, 72 72 Z" fill="url(#pvoCovertsGrad)"/>
      <!-- Detailed Rachis & Golden Feather Strands -->
      <path d="M76 76 C 82 84, 92 86, 92 80 M78 82 C 84 90, 94 90, 90 86 M80 88 C 86 96, 92 96, 90 92" 
            stroke="#ffd166" stroke-width="1.4" fill="none" opacity="0.9"/>
      <path d="M74 74 L88 88 M78 78 L92 92 M82 82 L90 98" stroke="rgba(255, 209, 102, 0.45)" stroke-width="1"/>
    </g>

    <!-- FLIGHT WINGS (Articulated Left & Right Remiges) -->
    <!-- Left Wing (Background Flight Stroke) -->
    <g class="wing-flight-left-rig">
      <path d="M70 70 C 54 48, 28 30, 14 36 C 12 42, 20 54, 36 66 C 46 74, 60 74, 70 70 Z" fill="url(#pvoFlightGrad)"/>
      <path d="M68 70 C 53 52, 32 40, 20 44 C 22 52, 36 64, 50 72 Z" fill="#00cec9" opacity="0.78"/>
      <!-- Primaries Quill Lines -->
      <path d="M14 36 L22 46 M20 40 L30 52 M28 46 L40 60 M38 54 L52 66" stroke="#ffd166" stroke-width="1.6" opacity="0.95"/>
    </g>

    <!-- Right Wing (Foreground Full Flight Stroke) -->
    <g class="wing-flight-right-rig">
      <path d="M78 70 C 96 46, 124 28, 140 32 C 142 38, 134 52, 116 66 C 104 74, 90 74, 78 70 Z" fill="url(#pvoFlightGrad)"/>
      <path d="M80 70 C 97 50, 120 38, 132 42 C 130 50, 114 64, 98 72 Z" fill="#05c46b" opacity="0.78"/>
      <path d="M80 70 C 93 58, 110 50, 118 54 C 116 60, 104 70, 92 74 Z" fill="#ffd166" opacity="0.7"/>
      <!-- Primaries Quill Lines -->
      <path d="M140 32 L130 44 M134 38 L122 50 M124 46 L112 58 M114 54 L100 66" stroke="#ffd166" stroke-width="1.6" opacity="0.95"/>
    </g>

    <!-- SLENDER ROYAL BLUE S-NECK, HEAD & CROWN CREST -->
    <g class="peacock-neck-head-rig">
      <!-- S-Curved Neck with Volumetric Shading -->
      <path d="M68 70 C 65 60, 59 50, 64 40 C 66 34, 72 30, 70 24 C 68 20, 64 20, 60 23 C 55 26, 53 34, 55 44 C 57 54, 61 64, 68 70 Z" fill="url(#pvoNeckGrad)"/>

      <!-- Facial Skin & Beak -->
      <path d="M57 22 L45 25 C 49 28, 55 29, 58 28 Z" fill="#d49438" stroke="#70360a" stroke-width="1"/>
      <!-- White Cheek / Orbital Contour -->
      <path d="M57 23 C 58 20, 64 21, 64 25 C 64 28, 59 27, 57 23 Z" fill="#ffffff" opacity="0.94"/>
      
      <!-- Realistic Eye: Amber-Gold Iris + Dual Catchlights -->
      <ellipse cx="61" cy="24" rx="3.9" ry="4.3" fill="#1e272e"/>
      <ellipse cx="60.6" cy="24" rx="2.5" ry="2.9" fill="url(#pvoEyeRealistic)"/>
      <circle cx="60.3" cy="23.6" r="1.35" fill="#000000"/>
      <circle cx="59.7" cy="22.8" r="0.7" fill="#ffffff"/> <!-- Primary Highlight -->
      <circle cx="61.3" cy="24.8" r="0.38" fill="#ffffff" opacity="0.8"/> <!-- Secondary Glow -->

      <!-- Ornate Fan Crest / Kalangi (Aigrette) -->
      <g class="peacock-crest-rig">
        <!-- Slender Gold Quills -->
        <path d="M64 20 Q 61 12 55 6" stroke="#ffd166" stroke-width="1.2" fill="none"/>
        <path d="M65 19 Q 64 10 61 4" stroke="#ffd166" stroke-width="1.2" fill="none"/>
        <path d="M66 19 Q 67 10 67 4" stroke="#ffd166" stroke-width="1.2" fill="none"/>
        <path d="M67 20 Q 71 11 74 6" stroke="#ffd166" stroke-width="1.2" fill="none"/>
        <path d="M67 21 Q 74 14 79 10" stroke="#ffd166" stroke-width="1.2" fill="none"/>

        <!-- Glowing Fan Tips -->
        <ellipse cx="55" cy="5" rx="2.5" ry="3.3" fill="#00cec9" stroke="#ffd166" stroke-width="0.85"/>
        <ellipse cx="61" cy="3" rx="2.5" ry="3.3" fill="#0984e3" stroke="#ffd166" stroke-width="0.85"/>
        <ellipse cx="67" cy="3" rx="2.5" ry="3.3" fill="#00cec9" stroke="#ffd166" stroke-width="0.85"/>
        <ellipse cx="74" cy="5" rx="2.5" ry="3.3" fill="#0984e3" stroke="#ffd166" stroke-width="0.85"/>
        <ellipse cx="79" cy="9" rx="2.5" ry="3.3" fill="#00cec9" stroke="#ffd166" stroke-width="0.85"/>
      </g>
    </g>
  </svg>
  `;

  class CinematicTravellingPeacock {
    constructor() {
      this.root = null;
      this.innerWrap = null;
      this.groundShadow = null;
      this.clickAura = null;
      this.tooltip = null;

      // Position in document coordinates
      this.docX = 0;
      this.docY = 0;
      this.targetDocX = 0;
      this.targetDocY = 0;
      this.angle = 0;
      this.facing = 1; // 1 = right, -1 = left

      // State machine
      this.state = 'perched'; // 'perched' | 'takeoff' | 'flying' | 'landing'

      // Scroll & Physics Tracking
      this.smoothedScrollY = window.scrollY || 0;
      this.lastScrollY = window.scrollY || 0;
      this.scrollVelocity = 0;
      this.scrollStopTimer = null;
      this.lastEmberTime = 0;

      // Performance Monitoring
      this.isLowPerformance = false;
      this.frameCount = 0;
      this.lastFpsCheck = performance.now();

      // Alternating Left-and-Right Waypoints
      this.landmarks = [];

      this.init();
    }

    init() {
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.createDOM();
      this.updateLandmarks();
      this.bindEvents();

      // Initial placement at Landmark 0 (Hero Right)
      if (this.landmarks.length > 0) {
        const lm0 = this.landmarks[0];
        this.docX = this.targetDocX = lm0.docX;
        this.docY = this.targetDocY = lm0.docY;
        this.facing = lm0.facing || 1;
        this.renderPosition();
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    createDOM() {
      const container = document.createElement('div');
      container.id = 'flyingPeacockRoot';
      container.className = 'is-perched';
      container.setAttribute('role', 'button');
      container.setAttribute('aria-label', 'సన్నివేశం మేధ — Sannivesham AI తెరవండి');
      container.setAttribute('tabindex', '0');

      container.innerHTML = `
        <div class="peacock-ground-shadow"></div>
        <div class="peacock-ai-tooltip">
          <span>🦚</span>
          <span>సన్నివేశం మేధ • Sannivesham AI</span>
          <span>➜</span>
        </div>
        <div class="peacock-inner-wrap">
          ${CINEMATIC_PEACOCK_SVG}
        </div>
        <div class="peacock-click-aura"></div>
      `;

      document.body.appendChild(container);

      this.root = container;
      this.innerWrap = container.querySelector('.peacock-inner-wrap');
      this.groundShadow = container.querySelector('.peacock-ground-shadow');
      this.clickAura = container.querySelector('.peacock-click-aura');
      this.tooltip = container.querySelector('.peacock-ai-tooltip');
    }

    /**
     * Alternating Left-and-Right Landing Positions Across Real Cards
     */
    updateLandmarks() {
      const isMobile = window.innerWidth < 768;
      const scrollY = window.scrollY || window.pageYOffset;
      const winW = window.innerWidth;

      // 1. Hero: Logo Halo (RIGHT SIDE)
      const heroElem = document.querySelector('.top-brand .brand-logo-wrap') || document.querySelector('.top-brand');
      // 2. Culture: Intro Box (FAR LEFT SIDE)
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      // 3. Categories Right: Temples/Festivals Card (FAR RIGHT SIDE)
      const rightCardElem = document.querySelector('a[href="festivals/"]') || document.querySelector('a[href="temples/"]');
      // 4. Categories Left: Library/Quiz Card (FAR LEFT SIDE)
      const leftCardElem = document.querySelector('a[href="library/"]') || document.querySelector('a[href="quiz/"]');
      // 5. Daily Wisdom: Shloka 3D Card (FAR RIGHT SIDE)
      const shlokaElem = document.querySelector('.shloka-section') || document.querySelector('#shlokaFlipCard');
      // 6. Footer Realm: Golden Quote (FAR LEFT-CENTER)
      const footerElem = document.querySelector('.home-footer') || document.querySelector('#contact');

      // Alternating sequence: RIGHT -> LEFT -> RIGHT -> LEFT -> RIGHT -> LEFT
      const config = [
        {
          elem: heroElem,
          label: 'Hero (Right)',
          side: 'right',
          pctX: isMobile ? 0.74 : 0.72,
          offsetY: isMobile ? -55 : -70,
          facing: -1
        },
        {
          elem: introElem,
          label: 'Culture (Far Left)',
          side: 'left',
          pctX: isMobile ? 0.18 : 0.22,
          offsetY: isMobile ? -54 : -68,
          facing: 1
        },
        {
          elem: rightCardElem,
          label: 'Temples (Far Right)',
          side: 'right',
          pctX: isMobile ? 0.78 : 0.76,
          offsetY: isMobile ? -54 : -68,
          facing: -1
        },
        {
          elem: leftCardElem,
          label: 'Library (Far Left)',
          side: 'left',
          pctX: isMobile ? 0.18 : 0.24,
          offsetY: isMobile ? -54 : -68,
          facing: 1
        },
        {
          elem: shlokaElem,
          label: 'Wisdom (Far Right)',
          side: 'right',
          pctX: isMobile ? 0.78 : 0.75,
          offsetY: isMobile ? -54 : -70,
          facing: -1
        },
        {
          elem: footerElem,
          label: 'Footer (Left-Center)',
          side: 'left',
          pctX: isMobile ? 0.28 : 0.32,
          offsetY: isMobile ? -50 : -66,
          facing: 1
        }
      ];

      this.landmarks = config.map((c, i) => {
        let docX = winW * c.pctX;
        let docY = i * 720;

        if (c.elem) {
          const rect = c.elem.getBoundingClientRect();
          docY = rect.top + scrollY + c.offsetY;

          // If element has real bounds, align nicely with its left or right ledge
          if (c.side === 'left') {
            docX = Math.max(22, Math.min(rect.left + window.scrollX + (isMobile ? 28 : 55), winW * 0.35));
          } else {
            docX = Math.min(winW - (isMobile ? 115 : 155), Math.max(rect.right + window.scrollX - (isMobile ? 45 : 75), winW * 0.65));
          }
        }

        const triggerScroll = Math.max(0, docY - window.innerHeight * 0.44);

        return {
          index: i,
          label: c.label,
          side: c.side,
          docX,
          docY,
          triggerScroll,
          facing: c.facing
        };
      });

      this.landmarks.sort((a, b) => a.docY - b.docY);
    }

    bindEvents() {
      // Single Interactive Destination: Sannivesham AI
      const handlePeacockClick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        if (this.clickAura) {
          this.clickAura.classList.remove('active');
          void this.clickAura.offsetWidth;
          this.clickAura.classList.add('active');
        }

        if (this.innerWrap) {
          this.innerWrap.style.transform = `scale(1.26) scaleX(${this.facing}) rotate(-8deg)`;
        }

        for (let i = 0; i < 22; i++) {
          this.emitEmber(this.docX + 60, this.docY + 60, true);
        }

        setTimeout(() => {
          window.location.href = AI_DESTINATION;
        }, 320);
      };

      this.root.addEventListener('click', handlePeacockClick);
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handlePeacockClick(e);
      });

      window.addEventListener('scroll', () => {
        this.onScroll();
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.updateLandmarks();
      });

      setTimeout(() => this.updateLandmarks(), 1000);
      setTimeout(() => this.updateLandmarks(), 3000);
    }

    onScroll() {
      const currentScrollY = window.scrollY || window.pageYOffset;
      this.scrollVelocity = Math.abs(currentScrollY - this.lastScrollY);
      this.lastScrollY = currentScrollY;

      if (this.scrollStopTimer) clearTimeout(this.scrollStopTimer);

      this.scrollStopTimer = setTimeout(() => {
        if (this.state === 'flying' || this.state === 'takeoff') {
          this.setState('landing');
          setTimeout(() => {
            this.setState('perched');
          }, 320);
        }
      }, 240);
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState}`;
    }

    /**
     * Compute Dynamic Lateral (Left-to-Right) Flight Trajectory
     */
    evaluateTrajectory(currentScrollY) {
      const n = this.landmarks.length;
      if (n === 0) return { docX: 100, docY: 100, facing: 1, angle: 0, state: 'perched' };
      if (n === 1) {
        const lm = this.landmarks[0];
        return { docX: lm.docX, docY: lm.docY, facing: lm.facing, angle: 0, state: 'perched' };
      }

      // Identify active flight segment
      let seg = 0;
      for (let i = 0; i < n - 1; i++) {
        if (currentScrollY >= this.landmarks[i].triggerScroll) {
          seg = i;
        }
      }

      const p0 = this.landmarks[seg];
      const p1 = this.landmarks[seg + 1];

      const scrollSpan = Math.max(p1.triggerScroll - p0.triggerScroll, 160);
      const rawU = (currentScrollY - p0.triggerScroll) / scrollSpan;
      const u = Math.max(0, Math.min(rawU, 1));

      // Flight State
      let calculatedState = 'flying';
      if (u <= 0.05) {
        calculatedState = 'perched';
      } else if (u < 0.16) {
        calculatedState = 'takeoff';
      } else if (u > 0.86 && u < 0.96) {
        calculatedState = 'landing';
      } else if (u >= 0.96) {
        calculatedState = 'perched';
      }

      // Strong Lateral Traversal (Left <-> Right)
      const dx = p1.docX - p0.docX;
      const dy = p1.docY - p0.docY;

      // Parabolic flight arc that sweeps widely across the screen
      const winW = window.innerWidth;
      const isMobile = winW < 768;

      // Outward billowing lateral arch:
      // If moving from Right to Left (dx < 0), swoop down-left with an upward liftoff
      // If moving from Left to Right (dx > 0), swoop down-right with an upward liftoff
      const lateralBulge = (dx >= 0 ? 1 : -1) * (isMobile ? 45 : 90);
      const cp1X = p0.docX + dx * 0.20 + lateralBulge;
      const cp1Y = p0.docY + dy * 0.12 - (isMobile ? 55 : 85); // Liftoff upwards

      const cp2X = p0.docX + dx * 0.80 - lateralBulge * 0.3;
      const cp2Y = p0.docY + dy * 0.88;

      const u1 = 1 - u;

      // Cubic Bézier
      let docX = u1 * u1 * u1 * p0.docX +
                 3 * u1 * u1 * u * cp1X +
                 3 * u1 * u * u * cp2X +
                 u * u * u * p1.docX;

      let docY = u1 * u1 * u1 * p0.docY +
                 3 * u1 * u1 * u * cp1Y +
                 3 * u1 * u * u * cp2Y +
                 u * u * u * p1.docY;

      // Secondary smooth horizontal S-curve oscillation for lively bird flight
      const sideSwing = Math.sin(u * Math.PI) * (isMobile ? 30 : 65) * (seg % 2 === 0 ? -1 : 1);
      docX += sideSwing;

      // Tangent vector for banking angle
      const du = 0.02;
      const nextU = Math.min(u + du, 1);
      const nu1 = 1 - nextU;
      const nextX = nu1 * nu1 * nu1 * p0.docX + 3 * nu1 * nu1 * nextU * cp1X + 3 * nu1 * nextU * nextU * cp2X + nextU * nextU * nextU * p1.docX + Math.sin(nextU * Math.PI) * (isMobile ? 30 : 65) * (seg % 2 === 0 ? -1 : 1);
      const nextY = nu1 * nu1 * nu1 * p0.docY + 3 * nu1 * nu1 * nextU * cp1Y + 3 * nu1 * nextU * nextU * cp2Y + nextU * nextU * nextU * p1.docY;

      const vx = nextX - docX;
      const vy = nextY - docY;

      // Automatic Facing: 1 = Right, -1 = Left
      let facing = p0.facing;
      if (Math.abs(vx) > 0.8) {
        facing = vx >= 0 ? 1 : -1;
      } else if (u > 0.82) {
        facing = p1.facing;
      }

      // Aerodynamic Banking Angle
      let angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      if (facing === -1) {
        angle = angle - 180;
        if (angle < -180) angle += 360;
      }
      angle = Math.max(Math.min(angle * 0.48, 28), -28);

      if (calculatedState === 'perched') {
        angle = 0;
      }

      return { docX, docY, facing, angle, state: calculatedState };
    }

    emitEmber(x, y, isBurst = false) {
      if (this.isLowPerformance) return;

      const ember = document.createElement('div');
      ember.className = 'peacock-particle-ember';

      const size = Math.random() * (isBurst ? 10 : 5) + 3.5;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      ember.style.left = `${x}px`;
      ember.style.top = `${y}px`;

      document.body.appendChild(ember);

      const angle = Math.random() * Math.PI * 2;
      const dist = isBurst ? Math.random() * 70 + 20 : Math.random() * 24 + 6;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist + (isBurst ? 0 : 12);

      requestAnimationFrame(() => {
        ember.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        ember.style.opacity = '0';
      });

      setTimeout(() => {
        if (ember.parentNode) ember.parentNode.removeChild(ember);
      }, 650);
    }

    checkPerformance(time) {
      this.frameCount++;
      if (time - this.lastFpsCheck > 1000) {
        const fps = (this.frameCount * 1000) / (time - this.lastFpsCheck);
        if (fps < 28 && !this.isLowPerformance) {
          this.isLowPerformance = true;
          document.body.classList.add('peacock-lightweight-mode');
        }
        this.frameCount = 0;
        this.lastFpsCheck = time;
      }
    }

    tick(time) {
      this.checkPerformance(time);

      if (this.reducedMotion) {
        const lm = this.landmarks[0] || { docX: 200, docY: 200, facing: 1 };
        this.root.style.transform = `translate3d(${lm.docX - 70}px, ${lm.docY - 70}px, 0)`;
        requestAnimationFrame(this.tick.bind(this));
        return;
      }

      const currentScrollY = window.scrollY || window.pageYOffset;
      this.smoothedScrollY += (currentScrollY - this.smoothedScrollY) * 0.14;

      const trajectory = this.evaluateTrajectory(this.smoothedScrollY);

      const isMobile = window.innerWidth < 768;
      const halfSize = isMobile ? 54 : 72;

      this.targetDocX = trajectory.docX - halfSize;
      this.targetDocY = trajectory.docY - halfSize;

      // Horizontal boundary clamp with safe margins
      const maxX = document.documentElement.clientWidth - (halfSize * 2 - 8);
      this.targetDocX = Math.max(6, Math.min(this.targetDocX, maxX));

      // 60fps smoothing
      const lerpFactor = this.state === 'flying' ? 0.16 : 0.10;
      this.docX += (this.targetDocX - this.docX) * lerpFactor;
      this.docY += (this.targetDocY - this.docY) * lerpFactor;

      this.angle += (trajectory.angle - this.angle) * 0.14;
      this.facing = trajectory.facing;

      if (trajectory.state) {
        this.setState(trajectory.state);
      }

      this.renderPosition();

      // Emit stardust trail during flight
      if (this.state === 'flying' && time - this.lastEmberTime > 130) {
        this.emitEmber(this.docX + halfSize, this.docY + halfSize);
        this.lastEmberTime = time;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      this.root.style.transform = `translate3d(${this.docX}px, ${this.docY}px, 0)`;

      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.facing}) rotate(${this.angle}deg)`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CinematicTravellingPeacock());
  } else {
    new CinematicTravellingPeacock();
  }
})();
