/**
 * ====================================================================
 * SANNIVESHAM — SIGNATURE INTERACTIVE FLYING PEACOCK
 * High-performance scroll-linked flight system & Sannivesham AI portal
 * ====================================================================
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__SanniveshamPeacock) return;
  window.__SanniveshamPeacock = true;

  const AI_DESTINATION = 'ai/';

  // 1. High-Detail Majestic Royal Indian Peacock SVG
  const PEACOCK_SVG = `
  <svg viewBox="0 0 160 160" class="peacock-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gradients -->
      <linearGradient id="pBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0984e3"/>
        <stop offset="40%" stop-color="#0d3b84"/>
        <stop offset="85%" stop-color="#041a4a"/>
        <stop offset="100%" stop-color="#020c24"/>
      </linearGradient>

      <linearGradient id="pNeckGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="35%" stop-color="#0984e3"/>
        <stop offset="80%" stop-color="#1e3799"/>
        <stop offset="100%" stop-color="#0c2461"/>
      </linearGradient>

      <linearGradient id="pWingCovert" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd166"/>
        <stop offset="25%" stop-color="#e17055"/>
        <stop offset="60%" stop-color="#05c46b"/>
        <stop offset="100%" stop-color="#0984e3"/>
      </linearGradient>

      <linearGradient id="pFlightFeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0fbcf9"/>
        <stop offset="50%" stop-color="#0d3b84"/>
        <stop offset="100%" stop-color="#1e272e"/>
      </linearGradient>

      <radialGradient id="pEyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffeaa7"/>
        <stop offset="70%" stop-color="#e67e22"/>
        <stop offset="100%" stop-color="#2d3436"/>
      </radialGradient>

      <radialGradient id="ocellusGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00cec9"/>
        <stop offset="35%" stop-color="#0984e3"/>
        <stop offset="65%" stop-color="#05c46b"/>
        <stop offset="85%" stop-color="#ffd166"/>
        <stop offset="100%" stop-color="#803808"/>
      </radialGradient>
    </defs>

    <!-- Divine Golden Aura / Glow -->
    <circle cx="80" cy="80" r="68" fill="rgba(255, 209, 102, 0.08)" filter="drop-shadow(0 0 12px rgba(255, 209, 102, 0.4))"/>

    <!-- FEET & CLAWS (Tucked when flying, gripping when perched) -->
    <g class="peacock-feet">
      <path d="M72 108 L72 118 M72 118 L67 122 M72 118 L72 124 M72 118 L77 122" stroke="#d49438" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M80 108 L80 118 M80 118 L75 122 M80 118 L80 124 M80 118 L85 122" stroke="#d49438" stroke-width="2.2" stroke-linecap="round"/>
    </g>

    <!-- TAIL TRAIN (Cascading peacock feathers with golden eyes) -->
    <g class="peacock-tail-group">
      <!-- Outer/under feathers -->
      <path d="M78 95 C 95 105, 125 118, 140 142 C 120 135, 95 115, 74 98 Z" fill="#04201e" opacity="0.8"/>
      <path d="M82 92 C 105 102, 138 122, 148 148 C 126 138, 102 114, 80 94 Z" fill="#05332b" opacity="0.9"/>

      <!-- Main Train Feathers -->
      <path d="M84 92 C 110 105, 142 128, 150 152 C 132 142, 106 120, 82 95 Z" fill="#055e4b"/>
      <path d="M78 92 C 96 112, 118 138, 128 158 C 112 144, 94 122, 76 95 Z" fill="#056350"/>

      <!-- Ocelli / Chandrakas (Tail Eyes) -->
      <!-- Ocellus 1 -->
      <g transform="translate(142, 144) scale(0.68)">
        <ellipse cx="0" cy="0" rx="14" ry="17" fill="url(#ocellusGrad)"/>
        <ellipse cx="0" cy="1" rx="8" ry="10" fill="#041226"/>
        <circle cx="0" cy="-1" r="5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.5" fill="#ffd166"/>
      </g>
      <!-- Ocellus 2 -->
      <g transform="translate(122, 150) scale(0.62)">
        <ellipse cx="0" cy="0" rx="14" ry="17" fill="url(#ocellusGrad)"/>
        <ellipse cx="0" cy="1" rx="8" ry="10" fill="#041226"/>
        <circle cx="0" cy="-1" r="5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.5" fill="#ffd166"/>
      </g>
      <!-- Ocellus 3 -->
      <g transform="translate(132, 126) scale(0.56)">
        <ellipse cx="0" cy="0" rx="14" ry="17" fill="url(#ocellusGrad)"/>
        <ellipse cx="0" cy="1" rx="8" ry="10" fill="#041226"/>
        <circle cx="0" cy="-1" r="5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.5" fill="#ffd166"/>
      </g>
      <!-- Ocellus 4 -->
      <g transform="translate(108, 134) scale(0.52)">
        <ellipse cx="0" cy="0" rx="14" ry="17" fill="url(#ocellusGrad)"/>
        <ellipse cx="0" cy="1" rx="8" ry="10" fill="#041226"/>
        <circle cx="0" cy="-1" r="5" fill="#00cec9"/>
        <circle cx="0" cy="-2" r="2.5" fill="#ffd166"/>
      </g>
    </g>

    <!-- PEACOCK TORSO / MAIN BODY -->
    <g class="peacock-body">
      <!-- Breast & Torso -->
      <path d="M62 72 C 60 88, 68 106, 82 106 C 96 106, 98 88, 92 76 C 88 68, 76 66, 68 68 Z" fill="url(#pBodyGrad)"/>
      
      <!-- Breast Feather Plumage Texture -->
      <path d="M68 76 Q 74 84 80 76 M72 82 Q 78 90 84 82 M66 85 Q 74 94 82 86 M72 92 Q 78 98 84 92" 
            stroke="#00cec9" stroke-width="1.2" fill="none" opacity="0.6"/>
    </g>

    <!-- FOLDED WING (Visible when perched) -->
    <g class="wing-folded">
      <path d="M72 74 C 70 82, 74 96, 86 102 C 94 98, 98 88, 94 76 C 90 68, 80 68, 72 74 Z" fill="url(#pWingCovert)"/>
      <!-- Scapular feather barbs -->
      <path d="M76 78 C 82 86, 92 88, 92 82 M78 84 C 84 92, 94 92, 90 88 M80 90 C 86 98, 92 98, 90 94" 
            stroke="#ffd166" stroke-width="1.3" fill="none" opacity="0.8"/>
    </g>

    <!-- FLIGHT WINGS (Visible during flight) -->
    <!-- Left Wing (Upper/Background Flight Stroke) -->
    <g class="wing-flight-left">
      <path d="M70 72 C 55 50, 30 32, 16 38 C 14 44, 22 56, 38 68 C 48 76, 62 76, 70 72 Z" fill="url(#pFlightFeather)"/>
      <path d="M68 72 C 54 54, 34 42, 22 46 C 24 54, 38 66, 52 74 Z" fill="#00cec9" opacity="0.7"/>
      <!-- Wing feather tips -->
      <path d="M16 38 L24 48 M22 42 L32 54 M30 48 L42 62 M40 56 L54 68" stroke="#ffd166" stroke-width="1.4" opacity="0.85"/>
    </g>

    <!-- Right Wing (Foreground Flight Stroke) -->
    <g class="wing-flight-right">
      <path d="M78 72 C 95 48, 122 30, 138 34 C 140 40, 132 54, 114 68 C 102 76, 88 76, 78 72 Z" fill="url(#pFlightFeather)"/>
      <path d="M80 72 C 96 52, 118 40, 130 44 C 128 52, 112 66, 96 74 Z" fill="#05c46b" opacity="0.7"/>
      <path d="M80 72 C 92 60, 108 52, 116 56 C 114 62, 102 72, 90 76 Z" fill="#ffd166" opacity="0.6"/>
      <!-- Wing feather tips -->
      <path d="M138 34 L128 46 M132 40 L120 52 M122 48 L110 60 M112 56 L98 68" stroke="#ffd166" stroke-width="1.4" opacity="0.85"/>
    </g>

    <!-- PEACOCK NECK, HEAD & CROWN CREST -->
    <g class="peacock-head-group">
      <!-- Elegant Royal Blue S-Curve Neck -->
      <path d="M68 72 C 65 62, 60 52, 64 42 C 66 36, 72 32, 70 26 C 68 22, 64 22, 60 25 C 56 28, 54 36, 56 46 C 58 56, 62 66, 68 72 Z" fill="url(#pNeckGrad)"/>

      <!-- Head & Beak -->
      <!-- Beak -->
      <path d="M57 24 L46 27 C 50 30, 56 31, 58 30 Z" fill="#d49438" stroke="#803808" stroke-width="0.8"/>
      
      <!-- Eye Area -->
      <ellipse cx="61" cy="26" rx="4" ry="4.5" fill="#ffffff" opacity="0.95"/>
      <ellipse cx="60.5" cy="26" rx="2.5" ry="3" fill="url(#pEyeGlow)"/>
      <circle cx="60.2" cy="25.5" r="1.4" fill="#000000"/>
      <circle cx="59.6" cy="24.8" r="0.6" fill="#ffffff"/> <!-- Specular Catchlight -->

      <!-- Head Crest / Kalangi (Crown) -->
      <g class="peacock-crest">
        <!-- Shafts -->
        <path d="M64 22 Q 62 14 56 8" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M65 21 Q 65 12 62 6" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M66 21 Q 68 12 68 6" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M67 22 Q 72 13 75 8" stroke="#ffd166" stroke-width="1.1" fill="none"/>
        <path d="M67 23 Q 75 16 80 12" stroke="#ffd166" stroke-width="1.1" fill="none"/>

        <!-- Fan plume tips -->
        <ellipse cx="56" cy="7" rx="2.5" ry="3" fill="#00cec9" stroke="#ffd166" stroke-width="0.7"/>
        <ellipse cx="62" cy="5" rx="2.5" ry="3" fill="#0984e3" stroke="#ffd166" stroke-width="0.7"/>
        <ellipse cx="68" cy="5" rx="2.5" ry="3" fill="#00cec9" stroke="#ffd166" stroke-width="0.7"/>
        <ellipse cx="75" cy="7" rx="2.5" ry="3" fill="#0984e3" stroke="#ffd166" stroke-width="0.7"/>
        <ellipse cx="80" cy="11" rx="2.5" ry="3" fill="#00cec9" stroke="#ffd166" stroke-width="0.7"/>
      </g>
    </g>
  </svg>
  `;

  class FlyingPeacock {
    constructor() {
      this.root = null;
      this.innerWrap = null;
      this.tooltip = null;
      this.clickRing = null;

      // Current physics state
      this.currX = 0;
      this.currY = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.currAngle = 0;
      this.currFacing = 1; // 1 = right, -1 = left
      this.state = 'perched'; // 'perched' | 'flying' | 'landing'

      // Scroll state
      this.lastScrollY = window.scrollY || window.pageYOffset;
      this.scrollProgress = 0;
      this.isScrolling = false;
      this.scrollStopTimer = null;
      this.lastSparkleTime = 0;

      // Waypoints configuration
      this.waypoints = [];

      this.init();
    }

    init() {
      // Check reduced motion preference
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.createDOM();
      this.updateWaypoints();
      this.bindEvents();

      // Initial position at Waypoint 0 (Hero)
      if (this.waypoints.length > 0) {
        const wp0 = this.waypoints[0];
        this.currX = this.targetX = wp0.screenX;
        this.currY = this.targetY = wp0.screenY;
        this.currFacing = wp0.facing || 1;
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
        <div class="peacock-ai-tooltip">
          <span>🦚</span>
          <span>సన్నివేశం మేధ • Sannivesham AI</span>
          <span>➜</span>
        </div>
        <div class="peacock-inner-wrap">
          ${PEACOCK_SVG}
        </div>
        <div class="peacock-click-ring"></div>
      `;

      document.body.appendChild(container);

      this.root = container;
      this.innerWrap = container.querySelector('.peacock-inner-wrap');
      this.tooltip = container.querySelector('.peacock-ai-tooltip');
      this.clickRing = container.querySelector('.peacock-click-ring');
    }

    /**
     * Finds landmarks on the Sannivesham website and establishes waypoints
     */
    updateWaypoints() {
      const w = window.innerWidth;
      const isMobile = w < 768;

      // Target landmarks in narrative order
      // 1. Hero: Top Brand Logo wrap
      const heroElem = document.querySelector('.top-brand .brand-logo-wrap') || document.querySelector('.top-brand') || document.querySelector('#home');
      // 2. Intro: Cultural Introduction section
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      // 3. Granthalayam / Stories: Library Card
      const libraryElem = document.querySelector('a[href="library/"]') || document.querySelector('#storiesCardImg');
      // 4. Temples / Festivals Card
      const templeElem = document.querySelector('a[href="temples/"]') || document.querySelector('a[href="festivals/"]');
      // 5. Wisdom: Shloka section / Daily verse
      const shlokaElem = document.querySelector('.shloka-section') || document.querySelector('#shlokaFlipCard') || document.querySelector('#about');
      // 6. Footer / Lower section
      const footerElem = document.querySelector('.home-footer') || document.querySelector('#contact');

      const landmarks = [
        { elem: heroElem, offsetX: isMobile ? 38 : 56, offsetY: isMobile ? -24 : -32, facing: -1, label: 'Hero' },
        { elem: introElem, offsetX: isMobile ? 20 : 45, offsetY: isMobile ? -15 : -25, facing: 1, label: 'Culture' },
        { elem: libraryElem, offsetX: isMobile ? 15 : 25, offsetY: isMobile ? -20 : -30, facing: -1, label: 'Library' },
        { elem: templeElem, offsetX: isMobile ? -10 : -25, offsetY: isMobile ? -20 : -30, facing: 1, label: 'Temples' },
        { elem: shlokaElem, offsetX: isMobile ? 25 : 55, offsetY: isMobile ? -18 : -26, facing: -1, label: 'Wisdom' },
        { elem: footerElem, offsetX: isMobile ? 0 : 30, offsetY: isMobile ? -20 : -35, facing: 1, label: 'Footer' }
      ];

      this.waypoints = landmarks.map((lm, idx) => {
        let pageX = w * 0.5;
        let pageY = idx * 600;

        if (lm.elem) {
          const rect = lm.elem.getBoundingClientRect();
          const docScroll = window.scrollY || window.pageYOffset;
          pageX = rect.left + rect.width * 0.5 + lm.offsetX;
          pageY = rect.top + docScroll + lm.offsetY;
        }

        const halfSize = isMobile ? 52 : 70;
        return {
          idx,
          label: lm.label,
          pageX,
          pageY,
          facing: lm.facing,
          // Will be dynamically projected to viewport coords each frame
          screenX: pageX - halfSize,
          screenY: pageY - (window.scrollY || 0) - halfSize
        };
      });
    }

    bindEvents() {
      // 1. Click Interaction -> ALWAYS opens Sannivesham AI
      const navigateToAI = (e) => {
        if (e) e.preventDefault();

        // Trigger click burst animation
        if (this.clickRing) {
          this.clickRing.classList.remove('active');
          void this.clickRing.offsetWidth; // Reflow
          this.clickRing.classList.add('active');
        }

        // Animate peacock flourish
        if (this.innerWrap) {
          this.innerWrap.style.transform = 'scale(1.28) rotate(-8deg)';
        }

        // Emit golden stardust burst
        for (let i = 0; i < 18; i++) {
          this.emitSparkle(this.currX + 60, this.currY + 60, true);
        }

        // Smooth transition to AI page
        setTimeout(() => {
          window.location.href = AI_DESTINATION;
        }, 320);
      };

      this.root.addEventListener('click', navigateToAI);
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigateToAI(e);
        }
      });

      // 2. Scroll tracking
      window.addEventListener('scroll', () => {
        this.onScroll();
      }, { passive: true });

      // 3. Resize handling (recalculate landmarks)
      window.addEventListener('resize', () => {
        this.updateWaypoints();
      });

      // Periodic check in case images loaded and shifted layout
      setTimeout(() => this.updateWaypoints(), 1000);
      setTimeout(() => this.updateWaypoints(), 3000);
    }

    onScroll() {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

      this.isScrolling = true;

      // If scrolling resumes, transition into flight
      if (this.state === 'perched') {
        this.setState('flying');
      }

      // Clear scroll stop timer
      if (this.scrollStopTimer) clearTimeout(this.scrollStopTimer);

      // Settle/land when user stops scrolling
      this.scrollStopTimer = setTimeout(() => {
        this.isScrolling = false;
        this.setState('landing');
        setTimeout(() => {
          if (!this.isScrolling) {
            this.setState('perched');
          }
        }, 260);
      }, 240);

      this.lastScrollY = scrollY;
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState}`;
    }

    /**
     * Evaluates continuous Bézier spline trajectory across waypoints
     */
    evaluatePath(t) {
      const n = this.waypoints.length;
      if (n === 0) return { x: 100, y: 100, facing: 1, angle: 0 };
      if (n === 1) {
        const wp = this.waypoints[0];
        return { x: wp.pageX, y: wp.pageY, facing: wp.facing, angle: 0 };
      }

      // Map global progress t in [0, 1] across (n - 1) segments
      const scaledT = t * (n - 1);
      const segIndex = Math.min(Math.floor(scaledT), n - 2);
      const localU = scaledT - segIndex;

      const p0 = this.waypoints[segIndex];
      const p1 = this.waypoints[segIndex + 1];

      // Dynamic swoop curve: arching Bézier control points
      const dx = p1.pageX - p0.pageX;
      const dy = p1.pageY - p0.pageY;

      // Swoop arc: lateral and upward billowing flight curve
      const arcSweep = (segIndex % 2 === 0 ? 1 : -1) * Math.min(Math.abs(dx) * 0.4 + 90, 260);
      const cp1X = p0.pageX + dx * 0.25 + arcSweep;
      const cp1Y = p0.pageY + dy * 0.15 - 60; // Upward liftoff impulse

      const cp2X = p0.pageX + dx * 0.75 - arcSweep * 0.3;
      const cp2Y = p0.pageY + dy * 0.85;

      // Cubic Bézier calculation
      const u = localU;
      const u1 = 1 - u;

      const pageX = u1 * u1 * u1 * p0.pageX +
                    3 * u1 * u1 * u * cp1X +
                    3 * u1 * u * u * cp2X +
                    u * u * u * p1.pageX;

      const pageY = u1 * u1 * u1 * p0.pageY +
                    3 * u1 * u1 * u * cp1Y +
                    3 * u1 * u * u * cp2Y +
                    u * u * u * p1.pageY;

      // Velocity tangent for banking & angle
      const du = 0.02;
      const nextU = Math.min(u + du, 1);
      const nu1 = 1 - nextU;
      const nextX = nu1 * nu1 * nu1 * p0.pageX + 3 * nu1 * nu1 * nextU * cp1X + 3 * nu1 * nextU * nextU * cp2X + nextU * nextU * nextU * p1.pageX;
      const nextY = nu1 * nu1 * nu1 * p0.pageY + 3 * nu1 * nu1 * nextU * cp1Y + 3 * nu1 * nextU * nextU * cp2Y + nextU * nextU * nextU * p1.pageY;

      const vx = nextX - pageX;
      const vy = nextY - pageY;

      // Facing direction (flip SVG horizontally when flying left or right)
      let facing = p0.facing;
      if (Math.abs(vx) > 1.2) {
        facing = vx >= 0 ? 1 : -1;
      }

      // Banking angle (subtle aerodynamic tilt)
      let angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      // Normalize angle for facing
      if (facing === -1) {
        angle = angle - 180;
        if (angle < -180) angle += 360;
      }
      // Damp angle to prevent wild spinning
      angle = Math.max(Math.min(angle * 0.45, 25), -25);

      return { pageX, pageY, facing, angle };
    }

    emitSparkle(x, y, isBurst = false) {
      const sparkle = document.createElement('div');
      sparkle.className = 'peacock-sparkle';

      const size = Math.random() * (isBurst ? 10 : 6) + 4;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;

      document.body.appendChild(sparkle);

      // Animate drift & fade
      const angle = Math.random() * Math.PI * 2;
      const dist = isBurst ? Math.random() * 70 + 20 : Math.random() * 25 + 5;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist + (isBurst ? 0 : 15);

      requestAnimationFrame(() => {
        sparkle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        sparkle.style.opacity = '0';
      });

      setTimeout(() => {
        if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
      }, 650);
    }

    tick(time) {
      // If reduced motion is requested, keep parked at current waypoint
      if (this.reducedMotion) {
        const wp = this.waypoints[0] || { pageX: 200, pageY: 150, facing: 1 };
        const screenY = wp.pageY - (window.scrollY || 0);
        this.root.style.transform = `translate3d(${wp.pageX - 70}px, ${screenY - 70}px, 0)`;
        requestAnimationFrame(this.tick.bind(this));
        return;
      }

      // Calculate path coords based on scroll progress
      const pathPoint = this.evaluatePath(this.scrollProgress);
      const scrollY = window.scrollY || window.pageYOffset;
      const isMobile = window.innerWidth < 768;
      const halfSize = isMobile ? 52 : 70;

      // Convert page coordinates to fixed viewport coordinates
      this.targetX = pathPoint.pageX - halfSize;
      this.targetY = pathPoint.pageY - scrollY - halfSize;

      // Keep comfortably inside viewport boundaries
      const maxX = window.innerWidth - (halfSize * 2 - 10);
      const maxY = window.innerHeight - (halfSize * 2 - 10);
      this.targetX = Math.max(10, Math.min(this.targetX, maxX));
      this.targetY = Math.max(10, Math.min(this.targetY, maxY));

      // Smooth lerp for silky 60fps interpolation
      const lerpFactor = this.isScrolling ? 0.14 : 0.09;
      this.currX += (this.targetX - this.currX) * lerpFactor;
      this.currY += (this.targetY - this.currY) * lerpFactor;

      const targetAngle = this.isScrolling ? pathPoint.angle : 0;
      this.currAngle += (targetAngle - this.currAngle) * 0.12;
      this.currFacing = pathPoint.facing;

      this.renderPosition();

      // Emit subtle golden stardust trail while flying
      if (this.isScrolling && time - this.lastSparkleTime > 120) {
        this.emitSparkle(this.currX + 70, this.currY + 70);
        this.lastSparkleTime = time;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      // GPU accelerated translate3d
      this.root.style.transform = `translate3d(${this.currX}px, ${this.currY}px, 0)`;

      // Apply facing flip and banking angle on inner wrapper
      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.currFacing}) rotate(${this.currAngle}deg)`;
      }
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FlyingPeacock());
  } else {
    new FlyingPeacock();
  }
})();
