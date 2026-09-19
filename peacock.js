/**
 * ==============================================================================
 * SANNIVESHAM — PHOTOREALISTIC DUAL-FRAME WINGBEAT PEACOCK
 * Realistic Flapping Wings, Consistent Facing & Immediate Perch on Scroll Stop
 * ==============================================================================
 */

(function () {
  'use strict';

  if (window.__SanniveshamDualWingPeacock) return;
  window.__SanniveshamDualWingPeacock = true;

  const AI_DESTINATION = 'ai/';
  const IMG_PERCHED = 'images/peacock-perched.png';
  const IMG_WING_UP = 'images/peacock-wing-up.png';
  const IMG_WING_DOWN = 'images/peacock-wing-down.png';

  class DualWingTravellingPeacock {
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
      this.facing = 1; // 1 = right, -1 = left (Consistent across perched & flying)

      // Scrolling and State
      this.isScrolling = false;
      this.state = 'perched'; // 'perched' | 'takeoff' | 'flying' | 'landing'
      this.smoothedScrollY = window.scrollY || 0;
      this.lastScrollY = window.scrollY || 0;
      this.scrollStopTimer = null;
      this.lastEmberTime = 0;

      // Performance
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

      // Initial placement at Landmark 0 (Hero Right, safe below navbar)
      if (this.landmarks.length > 0) {
        const isMobile = window.innerWidth < 768;
        const peacockSize = isMobile ? 70 : 108;
        const halfSize = peacockSize / 2;
        const minClearanceY = isMobile ? 100 : 124;

        const lm0 = this.landmarks[0];
        this.docX = this.targetDocX = lm0.docX - halfSize;
        this.docY = this.targetDocY = Math.max(minClearanceY, lm0.docY - halfSize);
        this.facing = -1; // Initial perch facing inward toward hero content
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
          <!-- 1. Photorealistic Sitting Peacock (Wings completely folded against body) -->
          <img src="${IMG_PERCHED}" alt="Sannivesham Peacock Perched" class="peacock-img-layer peacock-img-perched" loading="eager" decoding="async">
          
          <!-- 2. Photorealistic Wing Up Stroke (Active only while flying) -->
          <img src="${IMG_WING_UP}" alt="Sannivesham Peacock Wing Up" class="peacock-img-layer peacock-img-wing-up" loading="eager" decoding="async">
          
          <!-- 3. Photorealistic Wing Down Stroke (Alternating flight stroke) -->
          <img src="${IMG_WING_DOWN}" alt="Sannivesham Peacock Wing Down" class="peacock-img-layer peacock-img-wing-down" loading="eager" decoding="async">
        </div>
        <div class="peacock-click-aura"></div>
      `;

      document.body.appendChild(container);

      const emberLayer = document.createElement('div');
      emberLayer.id = 'peacockEmberLayer';
      emberLayer.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:925;max-width:100vw;';
      document.body.appendChild(emberLayer);
      this.emberLayer = emberLayer;

      this.root = container;
      this.innerWrap = container.querySelector('.peacock-inner-wrap');
      this.groundShadow = container.querySelector('.peacock-ground-shadow');
      this.clickAura = container.querySelector('.peacock-click-aura');
      this.tooltip = container.querySelector('.peacock-ai-tooltip');
    }

    /**
     * Safe Lateral Landing Positions Outside Text Content
     */
    updateLandmarks() {
      const isMobile = window.innerWidth < 768;
      const scrollY = window.scrollY || window.pageYOffset;
      const winW = window.innerWidth;
      const peacockSize = isMobile ? 70 : 108;
      const halfSize = peacockSize / 2;
      const minClearanceY = isMobile ? 100 : 124;

      const heroElem = document.querySelector('.top-brand');
      const greetingElem = document.getElementById('timeGreetingBadge');
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      const catElem = document.querySelector('#categories') || document.querySelector('.category-section');
      const aboutElem = document.querySelector('#about') || document.querySelector('.about-card');
      const footerElem = document.querySelector('#contact') || document.querySelector('.home-footer');

      // 1. Hero (Right side, comfortably BELOW navbar and greeting badge, beside the Swan Mandala)
      let heroX, heroY;
      let greetingBottom = 0;
      if (greetingElem) {
        const gr = greetingElem.getBoundingClientRect();
        greetingBottom = gr.bottom + scrollY;
      }
      if (heroElem) {
        const r = heroElem.getBoundingClientRect();
        const baseHeroY = r.top + scrollY + (isMobile ? 85 : 95);
        heroY = Math.max(greetingBottom + halfSize + 16, minClearanceY + halfSize, baseHeroY);
      } else {
        heroY = Math.max(greetingBottom + halfSize + 16, minClearanceY + halfSize + 20);
      }
      heroX = isMobile ? (winW - halfSize - 12) : Math.min(winW - halfSize - 20, Math.max(winW * 0.88, winW - 130));

      // 2. Intro Section (Left side gutter / outer shoulder, clear of paragraphs)
      let introX, introY;
      if (introElem) {
        const r = introElem.getBoundingClientRect();
        introY = r.top + scrollY + (isMobile ? 22 : 30);
      } else {
        introY = heroY + 680;
      }
      introX = isMobile ? (halfSize + 6) : Math.max(halfSize + 16, Math.min(winW * 0.07, 120));

      // 3. Categories (Right side gutter, clear of cards and headings)
      let catX, catY;
      if (catElem) {
        const r = catElem.getBoundingClientRect();
        catY = r.top + scrollY + (isMobile ? 34 : 48);
      } else {
        catY = introY + 700;
      }
      catX = isMobile ? (winW - halfSize - 6) : Math.min(winW - halfSize - 16, Math.max(winW * 0.93, winW - 120));

      // 4. About Section (Left side gutter, clear of about card)
      let aboutX, aboutY;
      if (aboutElem) {
        const r = aboutElem.getBoundingClientRect();
        aboutY = r.top + scrollY + (isMobile ? 24 : 32);
      } else {
        aboutY = catY + 650;
      }
      aboutX = isMobile ? (halfSize + 6) : Math.max(halfSize + 16, Math.min(winW * 0.07, 120));

      // 5. Footer (Right side gutter, clear of links)
      let footerX, footerY;
      if (footerElem) {
        const r = footerElem.getBoundingClientRect();
        footerY = r.top + scrollY + (isMobile ? 24 : 30);
      } else {
        footerY = aboutY + 600;
      }
      footerX = isMobile ? (winW - halfSize - 6) : Math.min(winW - halfSize - 16, Math.max(winW * 0.93, winW - 120));

      const rawLandmarks = [
        { label: 'Hero (Right)', side: 'right', docX: heroX, docY: heroY },
        { label: 'Intro (Left)', side: 'left', docX: introX, docY: introY },
        { label: 'Categories (Right)', side: 'right', docX: catX, docY: catY },
        { label: 'About (Left)', side: 'left', docX: aboutX, docY: aboutY },
        { label: 'Footer (Right)', side: 'right', docX: footerX, docY: footerY }
      ];

      this.landmarks = rawLandmarks.map((lm, i) => {
        const triggerScroll = Math.max(0, lm.docY - window.innerHeight * 0.45);
        return {
          index: i,
          label: lm.label,
          side: lm.side,
          docX: lm.docX,
          docY: lm.docY,
          triggerScroll
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
          this.innerWrap.style.transform = `scale(1.25) scaleX(${this.facing}) rotate(-6deg)`;
        }

        for (let i = 0; i < 22; i++) {
          this.emitEmber(this.docX + 60, this.docY + 60, true);
        }

        setTimeout(() => {
          window.location.href = AI_DESTINATION;
        }, 300);
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
      const scrollDelta = Math.abs(currentScrollY - this.lastScrollY);
      this.lastScrollY = currentScrollY;

      // User is actively moving page -> Wake up and start flapping wings
      if (scrollDelta > 0.4) {
        this.isScrolling = true;
        if (this.state === 'perched') {
          this.setState('takeoff');
        }
      }

      if (this.scrollStopTimer) clearTimeout(this.scrollStopTimer);

      // IMMEDIATELY FOLD WINGS AND SIT DOWN WHEN SCROLLING STOPS
      this.scrollStopTimer = setTimeout(() => {
        this.isScrolling = false;
        this.setState('landing');
        setTimeout(() => {
          if (!this.isScrolling) {
            this.setState('perched');
          }
        }, 110);
      }, 85);
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState}`;
    }

    /**
     * Compute Dynamic Lateral (Left-to-Right) Flight Trajectory & Direction
     */
    evaluateTrajectory(currentScrollY) {
      const n = this.landmarks.length;
      if (n === 0) return { docX: 100, docY: 100, angle: 0, currentSide: 'right' };
      if (n === 1) {
        const lm = this.landmarks[0];
        return { docX: lm.docX, docY: lm.docY, angle: 0, currentSide: lm.side || 'right' };
      }

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
      const currentSide = (u < 0.5) ? p0.side : p1.side;

      // Lateral Traversal (Left <-> Right)
      const dx = p1.docX - p0.docX;
      const dy = p1.docY - p0.docY;

      const winW = window.innerWidth;
      const isMobile = winW < 768;

      const lateralBulge = (dx >= 0 ? 1 : -1) * (isMobile ? 22 : 48);
      const cp1X = p0.docX + dx * 0.20 + lateralBulge;
      const cp1Y = p0.docY + dy * 0.12 - (isMobile ? 32 : 52);

      const cp2X = p0.docX + dx * 0.80 - lateralBulge * 0.3;
      const cp2Y = p0.docY + dy * 0.88;

      const u1 = 1 - u;

      // Cubic Bézier calculation
      let docX = u1 * u1 * u1 * p0.docX +
                 3 * u1 * u1 * u * cp1X +
                 3 * u1 * u * u * cp2X +
                 u * u * u * p1.docX;

      let docY = u1 * u1 * u1 * p0.docY +
                 3 * u1 * u1 * u * cp1Y +
                 3 * u1 * u * u * cp2Y +
                 u * u * u * p1.docY;

      // Harmonious horizontal S-curve swing
      const sideSwing = Math.sin(u * Math.PI) * (isMobile ? 18 : 36) * (seg % 2 === 0 ? -1 : 1);
      docX += sideSwing;

      // Velocity tangent for banking angle and direction
      const du = 0.02;
      const nextU = Math.min(u + du, 1);
      const nu1 = 1 - nextU;
      const nextX = nu1 * nu1 * nu1 * p0.docX + 3 * nu1 * nu1 * nextU * cp1X + 3 * nu1 * nextU * nextU * cp2X + nextU * nextU * nextU * p1.docX + Math.sin(nextU * Math.PI) * (isMobile ? 18 : 36) * (seg % 2 === 0 ? -1 : 1);
      const nextY = nu1 * nu1 * nu1 * p0.docY + 3 * nu1 * nu1 * nextU * cp1Y + 3 * nu1 * nextU * nextU * cp2Y + nextU * nextU * nextU * p1.docY;

      const vx = nextX - docX;
      const vy = nextY - docY;

      // Update facing strictly according to travel direction (1 = right, -1 = left)
      if (Math.abs(vx) > 0.4) {
        this.facing = (vx >= 0) ? 1 : -1;
      }

      let angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      if (this.facing === -1) {
        angle = angle - 180;
        if (angle < -180) angle += 360;
      }
      angle = Math.max(Math.min(angle * 0.42, 24), -24);

      // When resting/sitting, angle must be perfectly level (0)
      if (!this.isScrolling) {
        angle = 0;
      }

      return { docX, docY, angle, currentSide };
    }

    emitEmber(x, y, isBurst = false) {
      if (this.isLowPerformance) return;

      const ember = document.createElement('div');
      ember.className = 'peacock-particle-ember';

      const size = Math.random() * (isBurst ? 8 : 4.5) + 2.5;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;

      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const clientX = Math.max(12, Math.min(x - scrollX, window.innerWidth - 12));
      const clientY = y - scrollY;

      ember.style.left = `${clientX}px`;
      ember.style.top = `${clientY}px`;

      if (this.emberLayer) {
        this.emberLayer.appendChild(ember);
      } else {
        document.body.appendChild(ember);
      }

      const angle = Math.random() * Math.PI * 2;
      const dist = isBurst ? Math.random() * 45 + 12 : Math.random() * 18 + 5;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist + (isBurst ? 0 : 8);

      requestAnimationFrame(() => {
        ember.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        ember.style.opacity = '0';
      });

      setTimeout(() => {
        if (ember.parentNode) ember.parentNode.removeChild(ember);
      }, 600);
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
        const lm = this.landmarks[0] || { docX: 200, docY: 200 };
        this.root.style.transform = `translate3d(${lm.docX - 35}px, ${lm.docY - 35}px, 0)`;
        requestAnimationFrame(this.tick.bind(this));
        return;
      }

      const currentScrollY = window.scrollY || window.pageYOffset;
      this.smoothedScrollY += (currentScrollY - this.smoothedScrollY) * 0.14;

      const trajectory = this.evaluateTrajectory(this.smoothedScrollY);

      const isMobile = window.innerWidth < 768;
      const peacockSize = isMobile ? 70 : 108;
      const halfSize = peacockSize / 2;
      const winW = window.innerWidth;
      const minClearanceY = isMobile ? 100 : 124;

      if (this.isScrolling) {
        this.targetDocX = trajectory.docX - halfSize;
        this.targetDocY = trajectory.docY - halfSize;
      } else {
        // When perched, smoothly settle to safe lateral margin to ensure ZERO text blocking
        let safeX;
        if (trajectory.currentSide === 'left') {
          safeX = isMobile ? (halfSize + 10) : Math.max(halfSize + 16, Math.min(winW * 0.07, 120));
          this.facing = 1; // Face inward toward content
        } else {
          safeX = isMobile ? (winW - halfSize - 12) : Math.min(winW - halfSize - 16, Math.max(winW * 0.93, winW - 120));
          this.facing = -1; // Face inward toward content
        }
        this.targetDocX = safeX - halfSize;
        this.targetDocY = trajectory.docY - halfSize;
      }

      // Ensure peacock never sits behind the navbar or over the greeting badge at the top
      if (currentScrollY < 140) {
        const greetingElem = document.getElementById('timeGreetingBadge');
        let safeTopY = minClearanceY;
        if (greetingElem) {
          const gr = greetingElem.getBoundingClientRect();
          safeTopY = Math.max(safeTopY, gr.bottom + currentScrollY + 16);
        }
        this.targetDocY = Math.max(safeTopY, this.targetDocY);
      }

      const maxX = document.documentElement.clientWidth - (peacockSize + 8);
      this.targetDocX = Math.max(6, Math.min(this.targetDocX, maxX));

      // Damping
      const lerpFactor = this.isScrolling ? 0.16 : 0.11;
      this.docX += (this.targetDocX - this.docX) * lerpFactor;
      this.docY += (this.targetDocY - this.docY) * lerpFactor;

      const targetAngle = this.isScrolling ? trajectory.angle : 0;
      this.angle += (targetAngle - this.angle) * 0.16;

      // CRITICAL: WINGS FLAP ONLY WHILE SCROLLING; SIT IMMEDIATELY WHEN STOPPED
      if (this.isScrolling) {
        if (this.state !== 'takeoff' && this.state !== 'flying') {
          this.setState('flying');
        }
      } else {
        if (this.state !== 'perched' && this.state !== 'landing') {
          this.setState('perched');
        }
      }

      this.renderPosition();

      // Emit stardust trail only while actively flying
      if (this.isScrolling && time - this.lastEmberTime > 130) {
        this.emitEmber(this.docX + halfSize, this.docY + halfSize);
        this.lastEmberTime = time;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      this.root.style.transform = `translate3d(${this.docX}px, ${this.docY}px, 0)`;

      // Both images have identical natural orientation (+1 = right, -1 = left)
      // Facing never flips unexpectedly upon landing!
      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.facing}) rotate(${this.angle}deg)`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DualWingTravellingPeacock());
  } else {
    new DualWingTravellingPeacock();
  }
})();
