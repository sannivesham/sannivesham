/**
 * ==========================================================================
 * SANNIVESHAM — REALISTIC SCROLL-TRAVELLING PEACOCK (DOCUMENT SPACE ENGINE)
 * Multi-state realistic Indian peacock travelling through the entire webpage
 * ==========================================================================
 */

(function () {
  'use strict';

  if (window.__SanniveshamRealisticPeacock) return;
  window.__SanniveshamRealisticPeacock = true;

  const AI_DESTINATION = 'ai/';

  // ------------------------------------------------------------------------
  // High-Fidelity Semi-Realistic Indian Peacock (*Pavo cristatus*) SVG Model
  // Detailed plumage, micro-feather texturing, realistic eyes, articulated wings
  // ------------------------------------------------------------------------
  const REALISTIC_PEACOCK_SVG = `
  <svg viewBox="0 0 160 160" class="peacock-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Iridescent Royal Blue Neck & Breast Shading -->
      <linearGradient id="rpNeckGrad" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="22%" stop-color="#0984e3"/>
        <stop offset="60%" stop-color="#0c2461"/>
        <stop offset="90%" stop-color="#061230"/>
        <stop offset="100%" stop-color="#020817"/>
      </linearGradient>

      <!-- Volumetric 3D Torso Gradient -->
      <radialGradient id="rpBodyGrad" cx="45%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#0d3b84"/>
        <stop offset="45%" stop-color="#082252"/>
        <stop offset="85%" stop-color="#04122e"/>
        <stop offset="100%" stop-color="#010714"/>
      </radialGradient>

      <!-- Folded Wing Coverts: Bronze, Copper, Emerald Plumage -->
      <linearGradient id="rpCovertsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd166"/>
        <stop offset="28%" stop-color="#d35400"/>
        <stop offset="55%" stop-color="#218c74"/>
        <stop offset="82%" stop-color="#0652dd"/>
        <stop offset="100%" stop-color="#0c2461"/>
      </linearGradient>

      <!-- Primary & Secondary Flight Feathers -->
      <linearGradient id="rpFlightFeathers" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0fbcf9"/>
        <stop offset="35%" stop-color="#006266"/>
        <stop offset="70%" stop-color="#0a3d62"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </linearGradient>

      <!-- Ocellus (Tail Eye / Chandrika) Concentric Iridescence -->
      <radialGradient id="rpOcellusOuter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="30%" stop-color="#0984e3"/>
        <stop offset="60%" stop-color="#05c46b"/>
        <stop offset="80%" stop-color="#e67e22"/>
        <stop offset="95%" stop-color="#d35400"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </radialGradient>

      <!-- Piercing Realistic Eye with Dark Iris & Specular Highlight -->
      <radialGradient id="rpEyeGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#ffeaa7"/>
        <stop offset="45%" stop-color="#e67e22"/>
        <stop offset="85%" stop-color="#803808"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </radialGradient>

      <!-- Soft Plumage Texture Pattern -->
      <pattern id="rpPlumagePattern" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 Q5 0 10 5 Q5 10 0 5" fill="none" stroke="rgba(0, 206, 201, 0.28)" stroke-width="0.8"/>
      </pattern>
    </defs>

    <!-- Divine Golden Aura Glow Filter -->
    <circle cx="80" cy="80" r="70" fill="rgba(255, 209, 102, 0.06)" filter="drop-shadow(0 0 14px rgba(255, 209, 102, 0.35))"/>

    <!-- ANATOMICAL LEGS & TALONS (Gripping Card Surface When Perched) -->
    <g class="peacock-feet-group">
      <!-- Left Leg -->
      <path d="M72 106 L72 118 M72 118 L66 123 M72 118 L72 125 M72 118 L78 123 M72 118 L74 114" 
            stroke="#a67c38" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Right Leg -->
      <path d="M80 106 L80 118 M80 118 L74 123 M80 118 L80 125 M80 118 L86 123 M80 118 L82 114" 
            stroke="#b88b42" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Claws -->
      <circle cx="66" cy="123" r="1.1" fill="#4a3717"/>
      <circle cx="72" cy="125" r="1.1" fill="#4a3717"/>
      <circle cx="78" cy="123" r="1.1" fill="#4a3717"/>
      <circle cx="74" cy="123" r="1.1" fill="#4a3717"/>
      <circle cx="80" cy="125" r="1.1" fill="#4a3717"/>
      <circle cx="86" cy="123" r="1.1" fill="#4a3717"/>
    </g>

    <!-- ELONGATED TAIL TRAIN (Cascading Retrices with Detailed Ocelli) -->
    <g class="peacock-tail-train">
      <!-- Under-Tail Coverts & Dark Base -->
      <path d="M78 94 C 98 104, 130 118, 144 144 C 122 136, 96 114, 74 97 Z" fill="#041f1c" opacity="0.85"/>
      <path d="M82 92 C 108 102, 140 124, 150 150 C 128 140, 104 114, 80 94 Z" fill="#05362e" opacity="0.9"/>

      <!-- Main Shimmering Train Plumage -->
      <path d="M84 92 C 112 106, 145 130, 152 154 C 134 144, 108 120, 82 95 Z" fill="#065f4c"/>
      <path d="M78 92 C 98 114, 120 140, 130 160 C 114 146, 96 122, 76 95 Z" fill="#066955"/>

      <!-- Realistic Ocelli (Chandrakas) with Concentric Eye Rings -->
      <!-- Ocellus 1: Far Outer Top -->
      <g transform="translate(144, 146) scale(0.72)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#rpOcellusOuter)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#031024"/>
        <circle cx="0" cy="-1" r="5.5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.8" fill="#ffd166"/>
        <path d="M-12 0 Q0 -6 12 0 M-10 6 Q0 12 10 6" stroke="#d35400" stroke-width="0.8" fill="none" opacity="0.7"/>
      </g>

      <!-- Ocellus 2: Central Flowing -->
      <g transform="translate(124, 152) scale(0.66)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#rpOcellusOuter)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#031024"/>
        <circle cx="0" cy="-1" r="5.5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.8" fill="#ffd166"/>
      </g>

      <!-- Ocellus 3: Mid Lateral -->
      <g transform="translate(134, 128) scale(0.58)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#rpOcellusOuter)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#031024"/>
        <circle cx="0" cy="-1" r="5.5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.8" fill="#ffd166"/>
      </g>

      <!-- Ocellus 4: Inner Lower -->
      <g transform="translate(110, 136) scale(0.54)">
        <ellipse cx="0" cy="0" rx="15" ry="18" fill="url(#rpOcellusOuter)"/>
        <ellipse cx="0" cy="1" rx="9" ry="11" fill="#031024"/>
        <circle cx="0" cy="-1" r="5.5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.8" fill="#ffd166"/>
      </g>
    </g>

    <!-- VOLUMETRIC BODY & SCAPULAR BACK -->
    <g class="peacock-body-group">
      <!-- Breast & Abdomen -->
      <path d="M62 70 C 60 88, 68 106, 82 106 C 96 106, 98 88, 92 74 C 88 66, 76 64, 68 66 Z" fill="url(#rpBodyGrad)"/>
      <path d="M62 70 C 60 88, 68 106, 82 106 C 96 106, 98 88, 92 74 C 88 66, 76 64, 68 66 Z" fill="url(#rpPlumagePattern)" opacity="0.45"/>
      
      <!-- Breast Scale Striations -->
      <path d="M68 76 Q 74 84 80 76 M72 82 Q 78 90 84 82 M66 85 Q 74 94 82 86 M72 92 Q 78 98 84 92" 
            stroke="#00cec9" stroke-width="1.2" fill="none" opacity="0.7"/>
    </g>

    <!-- FOLDED WING COVERTS (Visible when perched on cards) -->
    <g class="wing-folded-layer">
      <!-- Scapulars & Greater Coverts -->
      <path d="M72 72 C 70 82, 74 96, 86 102 C 94 98, 98 88, 94 74 C 90 66, 80 66, 72 72 Z" fill="url(#rpCovertsGrad)"/>
      <!-- Detailed Rachis & Feather Strands -->
      <path d="M76 76 C 82 84, 92 86, 92 80 M78 82 C 84 90, 94 90, 90 86 M80 88 C 86 96, 92 96, 90 92" 
            stroke="#ffd166" stroke-width="1.3" fill="none" opacity="0.85"/>
      <path d="M74 74 L88 88 M78 78 L92 92 M82 82 L90 98" stroke="rgba(255, 209, 102, 0.4)" stroke-width="0.9"/>
    </g>

    <!-- ARTICULATED FLIGHT WINGS (Visible during flight & takeoff) -->
    <!-- Left Wing (Background Stroke) -->
    <g class="wing-flight-primary-left">
      <path d="M70 70 C 54 48, 28 30, 14 36 C 12 42, 20 54, 36 66 C 46 74, 60 74, 70 70 Z" fill="url(#rpFlightFeathers)"/>
      <path d="M68 70 C 53 52, 32 40, 20 44 C 22 52, 36 64, 50 72 Z" fill="#00cec9" opacity="0.75"/>
      <!-- Flight Feathers Rachis -->
      <path d="M14 36 L22 46 M20 40 L30 52 M28 46 L40 60 M38 54 L52 66" stroke="#ffd166" stroke-width="1.5" opacity="0.9"/>
    </g>

    <!-- Right Wing (Foreground Stroke with Full Feather Span) -->
    <g class="wing-flight-primary-right">
      <path d="M78 70 C 96 46, 124 28, 140 32 C 142 38, 134 52, 116 66 C 104 74, 90 74, 78 70 Z" fill="url(#rpFlightFeathers)"/>
      <path d="M80 70 C 97 50, 120 38, 132 42 C 130 50, 114 64, 98 72 Z" fill="#05c46b" opacity="0.75"/>
      <path d="M80 70 C 93 58, 110 50, 118 54 C 116 60, 104 70, 92 74 Z" fill="#ffd166" opacity="0.65"/>
      <!-- Flight Feathers Rachis -->
      <path d="M140 32 L130 44 M134 38 L122 50 M124 46 L112 58 M114 54 L100 66" stroke="#ffd166" stroke-width="1.5" opacity="0.9"/>
    </g>

    <!-- SLENDER ROYAL BLUE S-NECK, HEAD & CROWN CREST -->
    <g class="peacock-neck-head">
      <!-- S-Curved Neck with Volumetric 3D Shading -->
      <path d="M68 70 C 65 60, 59 50, 64 40 C 66 34, 72 30, 70 24 C 68 20, 64 20, 60 23 C 55 26, 53 34, 55 44 C 57 54, 61 64, 68 70 Z" fill="url(#rpNeckGrad)"/>

      <!-- Facial Skin & Beak -->
      <path d="M57 22 L45 25 C 49 28, 55 29, 58 28 Z" fill="#d49438" stroke="#70360a" stroke-width="0.9"/>
      <!-- White Cheek / Orbital Patch -->
      <path d="M57 23 C 58 20, 64 21, 64 25 C 64 28, 59 27, 57 23 Z" fill="#ffffff" opacity="0.92"/>
      
      <!-- Realistic Eye: Amber Iris + Specular Reflection -->
      <ellipse cx="61" cy="24" rx="3.8" ry="4.2" fill="#1e272e"/>
      <ellipse cx="60.6" cy="24" rx="2.4" ry="2.8" fill="url(#rpEyeGrad)"/>
      <circle cx="60.3" cy="23.6" r="1.3" fill="#000000"/>
      <circle cx="59.7" cy="22.9" r="0.65" fill="#ffffff"/> <!-- Primary Specular Glint -->
      <circle cx="61.2" cy="24.8" r="0.35" fill="#ffffff" opacity="0.7"/> <!-- Secondary Bounce Light -->

      <!-- Ornate Crown Crest / Kalangi (Aigrette) -->
      <g class="peacock-crest-group">
        <!-- Wire Shafts -->
        <path d="M64 20 Q 61 12 55 6" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M65 19 Q 64 10 61 4" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M66 19 Q 67 10 67 4" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M67 20 Q 71 11 74 6" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M67 21 Q 74 14 79 10" stroke="#ffd166" stroke-width="1.1" fill="none"/>

        <!-- Fan Plume Tips with Glowing Emerald & Turquoise Eyes -->
        <ellipse cx="55" cy="5" rx="2.4" ry="3.2" fill="#00cec9" stroke="#ffd166" stroke-width="0.8"/>
        <ellipse cx="61" cy="3" rx="2.4" ry="3.2" fill="#0984e3" stroke="#ffd166" stroke-width="0.8"/>
        <ellipse cx="67" cy="3" rx="2.4" ry="3.2" fill="#00cec9" stroke="#ffd166" stroke-width="0.8"/>
        <ellipse cx="74" cy="5" rx="2.4" ry="3.2" fill="#0984e3" stroke="#ffd166" stroke-width="0.8"/>
        <ellipse cx="79" cy="9" rx="2.4" ry="3.2" fill="#00cec9" stroke="#ffd166" stroke-width="0.8"/>
      </g>
    </g>
  </svg>
  `;

  class RealisticTravellingPeacock {
    constructor() {
      this.root = null;
      this.innerWrap = null;
      this.groundShadow = null;
      this.clickAura = null;
      this.tooltip = null;

      // Document coordinates (where peacock actually lives in page space)
      this.docX = 0;
      this.docY = 0;
      this.targetDocX = 0;
      this.targetDocY = 0;
      this.angle = 0;
      this.facing = 1; // 1 = right, -1 = left

      // State machine: 'perched' | 'takeoff' | 'flying' | 'landing'
      this.state = 'perched';
      this.activeLandmarkIndex = 0;

      // Scroll & Physics Tracking
      this.smoothedScrollY = window.scrollY || 0;
      this.lastScrollY = window.scrollY || 0;
      this.scrollVelocity = 0;
      this.scrollStopTimer = null;
      this.lastEmberTime = 0;

      // Slow Device / Performance monitoring
      this.isLowPerformance = false;
      this.frameCount = 0;
      this.lastFpsCheck = performance.now();

      // Landmarks spanning the entire homepage
      this.landmarks = [];

      this.init();
    }

    init() {
      // Reduced motion check
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.createDOM();
      this.updateLandmarks();
      this.bindEvents();

      // Initial placement at Landmark 0 (Hero)
      if (this.landmarks.length > 0) {
        const lm0 = this.landmarks[0];
        this.docX = this.targetDocX = lm0.docX;
        this.docY = this.targetDocY = lm0.docY;
        this.facing = lm0.facing || 1;
        this.renderPosition();
      }

      // Start animation loop
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
          ${REALISTIC_PEACOCK_SVG}
        </div>
        <div class="peacock-click-aura"></div>
      `;

      // Mount into document body so it physically exists in the webpage space
      document.body.appendChild(container);

      this.root = container;
      this.innerWrap = container.querySelector('.peacock-inner-wrap');
      this.groundShadow = container.querySelector('.peacock-ground-shadow');
      this.clickAura = container.querySelector('.peacock-click-aura');
      this.tooltip = container.querySelector('.peacock-ai-tooltip');
    }

    /**
     * Map real physical surfaces on the Sannivesham homepage
     */
    updateLandmarks() {
      const isMobile = window.innerWidth < 768;
      const scrollY = window.scrollY || window.pageYOffset;

      // 1. Hero: Logo Halo / Diya mount
      const heroElem = document.querySelector('.top-brand .brand-logo-wrap') || document.querySelector('.top-brand');
      // 2. Culture: Intro Box top ledge
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      // 3. Literature: Granthalayam / Library Card top border
      const libraryElem = document.querySelector('a[href="library/"]');
      // 4. Temples / Festivals: Temples Card top border
      const templeElem = document.querySelector('a[href="temples/"]') || document.querySelector('a[href="festivals/"]');
      // 5. Daily Wisdom: Shloka 3D card top ledge
      const shlokaElem = document.querySelector('.shloka-section') || document.querySelector('#shlokaFlipCard');
      // 6. Footer Realm: Home Footer top golden quote frame
      const footerElem = document.querySelector('.home-footer') || document.querySelector('#contact');

      const config = [
        {
          elem: heroElem,
          label: 'Hero',
          offsetX: isMobile ? 32 : 55,
          offsetY: isMobile ? -58 : -72,
          facing: -1
        },
        {
          elem: introElem,
          label: 'Culture',
          offsetX: isMobile ? 35 : 85,
          offsetY: isMobile ? -56 : -70,
          facing: 1
        },
        {
          elem: libraryElem,
          label: 'Library',
          offsetX: isMobile ? 12 : 28,
          offsetY: isMobile ? -55 : -70,
          facing: -1
        },
        {
          elem: templeElem,
          label: 'Temples',
          offsetX: isMobile ? -14 : -30,
          offsetY: isMobile ? -55 : -70,
          facing: 1
        },
        {
          elem: shlokaElem,
          label: 'Wisdom',
          offsetX: isMobile ? 30 : 65,
          offsetY: isMobile ? -55 : -72,
          facing: -1
        },
        {
          elem: footerElem,
          label: 'Footer',
          offsetX: isMobile ? 0 : 40,
          offsetY: isMobile ? -50 : -68,
          facing: 1
        }
      ];

      this.landmarks = config.map((c, i) => {
        let docX = window.innerWidth * 0.5;
        let docY = i * 700;

        if (c.elem) {
          const rect = c.elem.getBoundingClientRect();
          docX = rect.left + window.scrollX + rect.width * 0.5 + c.offsetX;
          docY = rect.top + scrollY + c.offsetY;
        }

        // Trigger scroll position: when this landmark enters mid-viewport
        const triggerScroll = Math.max(0, docY - window.innerHeight * 0.42);

        return {
          index: i,
          label: c.label,
          docX,
          docY,
          triggerScroll,
          facing: c.facing
        };
      });

      // Sort landmarks by docY to ensure monotonic scroll progression
      this.landmarks.sort((a, b) => a.docY - b.docY);
    }

    bindEvents() {
      // 1. Single interactive destination: Sannivesham AI
      const handlePeacockClick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        // Click aura burst
        if (this.clickAura) {
          this.clickAura.classList.remove('active');
          void this.clickAura.offsetWidth; // Force reflow
          this.clickAura.classList.add('active');
        }

        // Proud peacock flourish
        if (this.innerWrap) {
          this.innerWrap.style.transform = `scale(1.24) scaleX(${this.facing}) rotate(-6deg)`;
        }

        // Stardust burst
        for (let i = 0; i < 20; i++) {
          this.emitEmber(this.docX + 60, this.docY + 60, true);
        }

        // Seamless navigation to Sannivesham AI
        setTimeout(() => {
          window.location.href = AI_DESTINATION;
        }, 320);
      };

      this.root.addEventListener('click', handlePeacockClick);
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handlePeacockClick(e);
      });

      // 2. Scroll listener
      window.addEventListener('scroll', () => {
        this.onScroll();
      }, { passive: true });

      // 3. Resize listener (re-compute real physical card surfaces)
      window.addEventListener('resize', () => {
        this.updateLandmarks();
      });

      // Delayed updates to account for late font/image rendering
      setTimeout(() => this.updateLandmarks(), 1000);
      setTimeout(() => this.updateLandmarks(), 3000);
    }

    onScroll() {
      const currentScrollY = window.scrollY || window.pageYOffset;
      this.scrollVelocity = Math.abs(currentScrollY - this.lastScrollY);
      this.lastScrollY = currentScrollY;

      // Cancel resting timer
      if (this.scrollStopTimer) clearTimeout(this.scrollStopTimer);

      // When user stops scrolling, settle smoothly onto current landmark/surface
      this.scrollStopTimer = setTimeout(() => {
        if (this.state === 'flying' || this.state === 'takeoff') {
          this.setState('landing');
          setTimeout(() => {
            this.setState('perched');
          }, 320);
        }
      }, 250);
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState}`;
    }

    /**
     * Compute current flight trajectory through the page based on scroll progress
     */
    evaluateTrajectory(currentScrollY) {
      const n = this.landmarks.length;
      if (n === 0) return { docX: 100, docY: 100, facing: 1, angle: 0, state: 'perched' };
      if (n === 1) {
        const lm = this.landmarks[0];
        return { docX: lm.docX, docY: lm.docY, facing: lm.facing, angle: 0, state: 'perched' };
      }

      // Find current active segment between landmarks
      let seg = 0;
      for (let i = 0; i < n - 1; i++) {
        if (currentScrollY >= this.landmarks[i].triggerScroll) {
          seg = i;
        }
      }

      const p0 = this.landmarks[seg];
      const p1 = this.landmarks[seg + 1];

      const scrollSpan = Math.max(p1.triggerScroll - p0.triggerScroll, 150);
      const rawU = (currentScrollY - p0.triggerScroll) / scrollSpan;
      const u = Math.max(0, Math.min(rawU, 1));

      // Determine state along segment
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

      // Smooth Bézier Arc through document space
      const dx = p1.docX - p0.docX;
      const dy = p1.docY - p0.docY;

      // Lateral and vertical flight curve
      const lateralSwoop = (seg % 2 === 0 ? 1 : -1) * Math.min(Math.abs(dx) * 0.45 + 110, 280);
      const cp1X = p0.docX + dx * 0.22 + lateralSwoop;
      const cp1Y = p0.docY + dy * 0.12 - 70; // Liftoff upwards

      const cp2X = p0.docX + dx * 0.78 - lateralSwoop * 0.25;
      const cp2Y = p0.docY + dy * 0.88;

      const u1 = 1 - u;

      const docX = u1 * u1 * u1 * p0.docX +
                   3 * u1 * u1 * u * cp1X +
                   3 * u1 * u * u * cp2X +
                   u * u * u * p1.docX;

      const docY = u1 * u1 * u1 * p0.docY +
                   3 * u1 * u1 * u * cp1Y +
                   3 * u1 * u * u * cp2Y +
                   u * u * u * p1.docY;

      // Tangent direction for banking
      const du = 0.02;
      const nextU = Math.min(u + du, 1);
      const nu1 = 1 - nextU;
      const nextX = nu1 * nu1 * nu1 * p0.docX + 3 * nu1 * nu1 * nextU * cp1X + 3 * nu1 * nextU * nextU * cp2X + nextU * nextU * nextU * p1.docX;
      const nextY = nu1 * nu1 * nu1 * p0.docY + 3 * nu1 * nu1 * nextU * cp1Y + 3 * nu1 * nextU * nextU * cp2Y + nextU * nextU * nextU * p1.docY;

      const vx = nextX - docX;
      const vy = nextY - docY;

      let facing = p0.facing;
      if (Math.abs(vx) > 1.2) {
        facing = vx >= 0 ? 1 : -1;
      } else if (u > 0.8) {
        facing = p1.facing;
      }

      let angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      if (facing === -1) {
        angle = angle - 180;
        if (angle < -180) angle += 360;
      }
      angle = Math.max(Math.min(angle * 0.45, 26), -26);

      // Settle angle to 0 when perched
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
      const dist = isBurst ? Math.random() * 65 + 20 : Math.random() * 22 + 5;
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

      // Reduced motion: park gently at current landmark
      if (this.reducedMotion) {
        const lm = this.landmarks[0] || { docX: 200, docY: 200, facing: 1 };
        this.root.style.transform = `translate3d(${lm.docX - 70}px, ${lm.docY - 70}px, 0)`;
        requestAnimationFrame(this.tick.bind(this));
        return;
      }

      const currentScrollY = window.scrollY || window.pageYOffset;
      // Smooth exponential scroll tracker
      this.smoothedScrollY += (currentScrollY - this.smoothedScrollY) * 0.14;

      const trajectory = this.evaluateTrajectory(this.smoothedScrollY);

      const isMobile = window.innerWidth < 768;
      const halfSize = isMobile ? 49 : 70;

      this.targetDocX = trajectory.docX - halfSize;
      this.targetDocY = trajectory.docY - halfSize;

      // Keep within page horizontal bounds safely
      const maxX = document.documentElement.clientWidth - (halfSize * 2 - 8);
      this.targetDocX = Math.max(8, Math.min(this.targetDocX, maxX));

      // Silky 60fps damping
      const lerpFactor = this.state === 'flying' ? 0.16 : 0.10;
      this.docX += (this.targetDocX - this.docX) * lerpFactor;
      this.docY += (this.targetDocY - this.docY) * lerpFactor;

      this.angle += (trajectory.angle - this.angle) * 0.14;
      this.facing = trajectory.facing;

      if (trajectory.state) {
        this.setState(trajectory.state);
      }

      this.renderPosition();

      // Emit stardust trail while flying
      if (this.state === 'flying' && time - this.lastEmberTime > 140) {
        this.emitEmber(this.docX + halfSize, this.docY + halfSize);
        this.lastEmberTime = time;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      // Direct document-space 3D transform (travels with the page!)
      this.root.style.transform = `translate3d(${this.docX}px, ${this.docY}px, 0)`;

      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.facing}) rotate(${this.angle}deg)`;
      }
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new RealisticTravellingPeacock());
  } else {
    new RealisticTravellingPeacock();
  }
})();
