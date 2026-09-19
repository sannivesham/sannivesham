/**
 * ==============================================================================
 * SANNIVESHAM — PHOTOREALISTIC DUAL-FRAME WINGBEAT PEACOCK
 * Ultra-Responsive, Zero-Lag, Full-Page Downward Travel to Footer
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
      this.emberLayer = null;

      // Position in document coordinates
      this.docX = 0;
      this.docY = 0;
      this.targetDocX = 0;
      this.targetDocY = 0;
      this.angle = 0;
      this.facing = 1; // 1 = right, -1 = left

      // Scrolling and State
      this.isScrolling = false;
      this.state = 'perched'; // 'perched' | 'takeoff' | 'flying' | 'landing'
      this.lastScrollTime = 0;
      this.lastScrollY = window.scrollY || window.pageYOffset || 0;
      this.lastEmberTime = 0;

      // Cached Clearance Floor
      this.safeTopFloorY = 120;

      // Performance
      this.isLowPerformance = false;
      this.frameCount = 0;
      this.lastFpsCheck = performance.now();

      // 7 Alternating Left-and-Right Waypoints from Hero to Footer
      this.landmarks = [];

      this.init();
    }

    init() {
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.createDOM();
      this.updateLandmarks();
      this.bindEvents();

      // Initial placement at Landmark 0 (Hero Right, beside Swan Mandala)
      if (this.landmarks.length > 0) {
        const isMobile = window.innerWidth < 768;
        const peacockSize = isMobile ? 68 : 104;
        const halfSize = peacockSize / 2;

        const lm0 = this.landmarks[0];
        this.docX = this.targetDocX = lm0.docX - halfSize;
        this.docY = this.targetDocY = lm0.docY - halfSize;
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

      // Dedicated zero-overflow layer for embers
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
     * Pre-calculate and Cache 7 Natural Waypoints down the ENTIRE document
     */
    updateLandmarks() {
      const isMobile = window.innerWidth < 768;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const winW = window.innerWidth;
      const peacockSize = isMobile ? 68 : 104;
      const halfSize = peacockSize / 2;
      const minClearanceY = isMobile ? 96 : 120;

      const heroElem = document.querySelector('.top-brand');
      const greetingElem = document.getElementById('timeGreetingBadge');
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      const catElem = document.querySelector('#categories') || document.querySelector('.category-section');
      const ganakamElem = document.querySelector('.ganakam-card') || document.querySelector('[href*="festival-counter"]');
      const aboutElem = document.querySelector('#about') || document.querySelector('.about-card');
      const contactElem = document.querySelector('#contact') || document.querySelector('.contact-section');
      const footerElem = document.querySelector('.home-footer');

      const leftX = isMobile ? (halfSize + 8) : Math.max(halfSize + 16, Math.min(winW * 0.07, 120));
      const rightX = isMobile ? (winW - halfSize - 10) : Math.min(winW - halfSize - 16, Math.max(winW * 0.93, winW - 120));

      let greetingBottom = 0;
      if (greetingElem) {
        const gr = greetingElem.getBoundingClientRect();
        greetingBottom = gr.bottom + scrollY;
        this.safeTopFloorY = greetingBottom + halfSize + 14;
      } else {
        this.safeTopFloorY = minClearanceY + halfSize + 14;
      }

      // 1. Hero (Right side, beside Swan Mandala, strictly below greeting badge)
      let heroY;
      if (heroElem) {
        const r = heroElem.getBoundingClientRect();
        heroY = Math.max(this.safeTopFloorY, r.top + scrollY + (isMobile ? 80 : 92));
      } else {
        heroY = this.safeTopFloorY;
      }

      // 2. Intro Section (Left side gutter)
      let introY;
      if (introElem) {
        const r = introElem.getBoundingClientRect();
        introY = r.top + scrollY + (isMobile ? 26 : 38);
      } else {
        introY = heroY + 650;
      }

      // 3. Categories Upper (Right side gutter)
      let catY;
      if (catElem) {
        const r = catElem.getBoundingClientRect();
        catY = r.top + scrollY + (isMobile ? 32 : 48);
      } else {
        catY = introY + 650;
      }

      // 4. Ganakam / Festivals Counter Lower Categories (Left side gutter)
      let ganakamY;
      if (ganakamElem) {
        const r = ganakamElem.getBoundingClientRect();
        ganakamY = r.top + scrollY + (isMobile ? 24 : 32);
      } else {
        ganakamY = catY + 600;
      }

      // 5. About Us (Right side gutter)
      let aboutY;
      if (aboutElem) {
        const r = aboutElem.getBoundingClientRect();
        aboutY = r.top + scrollY + (isMobile ? 28 : 36);
      } else {
        aboutY = ganakamY + 550;
      }

      // 6. Contact Section (Left side gutter)
      let contactY;
      if (contactElem) {
        const r = contactElem.getBoundingClientRect();
        contactY = r.top + scrollY + (isMobile ? 30 : 40);
      } else {
        contactY = aboutY + 550;
      }

      // 7. Footer (Right side gutter, near bottom of the document)
      let footerY;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 4000;
      if (footerElem) {
        const r = footerElem.getBoundingClientRect();
        footerY = Math.min(scrollHeight - halfSize - (isMobile ? 24 : 36), r.top + scrollY + (isMobile ? 18 : 24));
      } else {
        footerY = scrollHeight - halfSize - (isMobile ? 50 : 70);
      }

      this.landmarks = [
        { label: 'Hero (Right)', side: 'right', docX: rightX, docY: heroY },
        { label: 'Intro (Left)', side: 'left', docX: leftX, docY: introY },
        { label: 'Categories (Right)', side: 'right', docX: rightX, docY: catY },
        { label: 'Ganakam (Left)', side: 'left', docX: leftX, docY: ganakamY },
        { label: 'About (Right)', side: 'right', docX: rightX, docY: aboutY },
        { label: 'Contact (Left)', side: 'left', docX: leftX, docY: contactY },
        { label: 'Footer (Right)', side: 'right', docX: rightX, docY: footerY }
      ];
    }

    bindEvents() {
      // Interactive Click to Sannivesham AI
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
          this.innerWrap.style.transform = `scale(1.2) scaleX(${this.facing}) rotate(-6deg)`;
        }

        if (window.innerWidth >= 768) {
          for (let i = 0; i < 18; i++) {
            this.emitEmber(this.docX + 50, this.docY + 50, true);
          }
        }

        setTimeout(() => {
          window.location.href = AI_DESTINATION;
        }, 280);
      };

      this.root.addEventListener('click', handlePeacockClick);
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handlePeacockClick(e);
      });

      // Ultra-lightweight scroll listener: 0 timers, 0 layout reflows
      window.addEventListener('scroll', () => {
        this.onScroll();
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.updateLandmarks();
      }, { passive: true });

      // Refresh landmark measurements once images and fonts settle
      setTimeout(() => this.updateLandmarks(), 800);
      setTimeout(() => this.updateLandmarks(), 2500);
    }

    onScroll() {
      this.lastScrollTime = performance.now();
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.setState('flying');
      }
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState}`;
    }

    /**
     * Compute Dynamic Flight Trajectory with 100% Page Coverage from Top to Bottom
     */
    evaluateTrajectory(currentScrollY) {
      const n = this.landmarks.length;
      if (n === 0) return { docX: 100, docY: 100, angle: 0, currentSide: 'right' };
      if (n === 1) {
        return { docX: this.landmarks[0].docX, docY: this.landmarks[0].docY, angle: 0, currentSide: 'right' };
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, currentScrollY / maxScroll));

      const totalSegments = n - 1;
      const scaled = progress * totalSegments;
      const seg = Math.min(Math.floor(scaled), totalSegments - 1);
      const u = Math.max(0, Math.min(1, scaled - seg));

      const p0 = this.landmarks[seg];
      const p1 = this.landmarks[seg + 1];

      const currentSide = (u < 0.5) ? p0.side : p1.side;

      // Smooth hermite ease for organic natural travel
      const easeU = u * u * (3 - 2 * u);

      const dx = p1.docX - p0.docX;
      const dy = p1.docY - p0.docY;

      // Natural lateral arc during flight across the screen
      const isMobile = window.innerWidth < 768;
      const arc = Math.sin(u * Math.PI) * (isMobile ? 14 : 26) * (p0.side === 'right' ? -1 : 1);

      const docX = p0.docX + dx * easeU + arc;
      const docY = p0.docY + dy * easeU;

      // Banking angle
      let angle = 0;
      if (this.isScrolling) {
        const velX = dx * (6 * u * (1 - u)) + Math.cos(u * Math.PI) * (isMobile ? 14 : 26) * (p0.side === 'right' ? -1 : 1) * Math.PI;
        const velY = dy;
        angle = (Math.atan2(velY * 0.16, velX) * 180) / Math.PI;
        if (this.facing === -1) {
          angle = angle - 180;
          if (angle < -180) angle += 360;
        }
        angle = Math.max(-18, Math.min(18, angle * 0.32));
      }

      // Update facing based on travel direction
      if (Math.abs(dx) > 10) {
        this.facing = dx > 0 ? 1 : -1;
      }

      return { docX, docY, angle, currentSide };
    }

    emitEmber(x, y, isBurst = false) {
      if (this.isLowPerformance || window.innerWidth < 768) return;

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
      const dist = isBurst ? Math.random() * 40 + 10 : Math.random() * 16 + 4;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist + (isBurst ? 0 : 6);

      requestAnimationFrame(() => {
        ember.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        ember.style.opacity = '0';
      });

      setTimeout(() => {
        if (ember.parentNode) ember.parentNode.removeChild(ember);
      }, 550);
    }

    checkPerformance(time) {
      this.frameCount++;
      if (time - this.lastFpsCheck > 1200) {
        const fps = (this.frameCount * 1000) / (time - this.lastFpsCheck);
        if (fps < 26 && !this.isLowPerformance) {
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

      // Check if scrolling stopped: instantly sit down
      if (this.isScrolling && time - this.lastScrollTime > 95) {
        this.isScrolling = false;
        this.setState('perched');
      }

      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const trajectory = this.evaluateTrajectory(currentScrollY);

      const isMobile = window.innerWidth < 768;
      const peacockSize = isMobile ? 68 : 104;
      const halfSize = peacockSize / 2;
      const winW = window.innerWidth;

      if (this.isScrolling) {
        this.targetDocX = trajectory.docX - halfSize;
        this.targetDocY = trajectory.docY - halfSize;
      } else {
        // When perched, settle to the safe lateral margin facing inward toward content
        let safeX;
        if (trajectory.currentSide === 'left') {
          safeX = isMobile ? (halfSize + 8) : Math.max(halfSize + 16, Math.min(winW * 0.07, 120));
          this.facing = 1;
        } else {
          safeX = isMobile ? (winW - halfSize - 10) : Math.min(winW - halfSize - 16, Math.max(winW * 0.93, winW - 120));
          this.facing = -1;
        }
        this.targetDocX = safeX - halfSize;
        this.targetDocY = trajectory.docY - halfSize;
      }

      // Enforce safe clearance floor at top using CACHED safeTopFloorY (zero reflow)
      if (currentScrollY < 140 && this.safeTopFloorY) {
        this.targetDocY = Math.max(this.safeTopFloorY - halfSize, this.targetDocY);
      }

      const maxX = document.documentElement.clientWidth - (peacockSize + 6);
      this.targetDocX = Math.max(4, Math.min(this.targetDocX, maxX));

      // Snappy, real-time vertical response (ZERO lag) + graceful lateral banking
      const lerpY = this.isScrolling ? 0.44 : 0.22;
      const lerpX = this.isScrolling ? 0.26 : 0.16;
      this.docY += (this.targetDocY - this.docY) * lerpY;
      this.docX += (this.targetDocX - this.docX) * lerpX;

      const targetAngle = this.isScrolling ? trajectory.angle : 0;
      this.angle += (targetAngle - this.angle) * 0.22;

      this.renderPosition();

      // Emit stardust trail only on desktop while actively flying
      if (!isMobile && this.isScrolling && time - this.lastEmberTime > 140) {
        this.emitEmber(this.docX + halfSize, this.docY + halfSize);
        this.lastEmberTime = time;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      this.root.style.transform = `translate3d(${this.docX}px, ${this.docY}px, 0)`;

      // Both images have identical natural orientation (+1 = right, -1 = left)
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
