/**
 * ==============================================================================
 * SANNIVESHAM — PHOTOREALISTIC DUAL-FRAME WINGBEAT PEACOCK
 * Ultra-Responsive Viewport-Pinned Flight Engine (Zero Lag, 100% On-Screen)
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

      // Viewport Coordinates (Fixed Positioning)
      this.screenX = 0;
      this.screenY = 0;
      this.targetScreenX = 0;
      this.targetScreenY = 0;
      this.angle = 0;
      this.facing = -1; // 1 = right, -1 = left

      // Hero starting coordinates
      this.heroScreenX = 0;
      this.heroScreenY = 160;

      // Scrolling & Animation State
      this.isScrolling = false;
      this.state = 'perched'; // 'perched' | 'flying' | 'takeoff' | 'landing'
      this.lastScrollTime = 0;
      this.lastScrollY = window.scrollY || window.pageYOffset || 0;
      this.scrollDirection = 1; // 1 = down, -1 = up
      this.isTicking = false;
      this.lastEmberTime = 0;

      // Dimensions & Gutters
      this.winW = window.innerWidth;
      this.winH = window.innerHeight;
      this.maxScroll = 1;
      this.isMobile = window.innerWidth < 768;
      this.peacockSize = this.isMobile ? 68 : 104;

      // 7 Natural Alternating Journey Waypoints from Top to Footer
      this.waypoints = [
        { p: 0.00, side: 'right', label: 'Hero' },
        { p: 0.18, side: 'left',  label: 'Intro' },
        { p: 0.36, side: 'right', label: 'Categories' },
        { p: 0.54, side: 'left',  label: 'Festivals' },
        { p: 0.72, side: 'right', label: 'About' },
        { p: 0.88, side: 'left',  label: 'Contact' },
        { p: 1.00, side: 'right', label: 'Footer' }
      ];

      this.init();
    }

    init() {
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.createDOM();
      this.updateDimensions();
      this.bindEvents();

      // Initial placement at Hero (Right gutter, safely below greeting badge and navbar)
      this.screenX = this.targetScreenX = this.heroScreenX;
      this.screenY = this.targetScreenY = this.heroScreenY;
      this.facing = -1; // Face inward toward Sannivesham logo
      this.renderPosition();

      // Start initial settle loop
      this.startLoop();
    }

    createDOM() {
      const container = document.createElement('div');
      container.id = 'flyingPeacockRoot';
      container.className = 'is-perched on-right';
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

    updateDimensions() {
      this.winW = window.innerWidth;
      this.winH = window.innerHeight;
      this.isMobile = this.winW < 768;
      this.peacockSize = this.isMobile ? 68 : 104;

      const docEl = document.documentElement;
      const body = document.body;
      const fullHeight = Math.max(docEl.scrollHeight, body.scrollHeight, 1200);
      this.maxScroll = Math.max(1, fullHeight - this.winH);

      // Safe lateral gutters
      this.leftGutterX = this.isMobile ? 8 : Math.max(16, Math.min(this.winW * 0.05, 70));
      this.rightGutterX = this.isMobile ? (this.winW - this.peacockSize - 8) : (this.winW - this.peacockSize - Math.max(16, Math.min(this.winW * 0.05, 70)));

      // Hero starting Y: below greeting badge and navbar
      const heroElem = document.querySelector('.top-brand .brand-logo-wrap') || document.querySelector('.top-brand');
      let heroY = this.isMobile ? 152 : 200;
      if (heroElem) {
        const hr = heroElem.getBoundingClientRect();
        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const elemDocTop = hr.top + currentScrollY;
        heroY = Math.max(this.isMobile ? 142 : 180, elemDocTop + (this.isMobile ? 20 : 35));
      }
      this.heroScreenX = this.rightGutterX;
      this.heroScreenY = heroY;
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

        if (!this.isMobile) {
          for (let i = 0; i < 16; i++) {
            this.emitEmber(this.screenX + 50, this.screenY + 50, true);
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

      // Passive scroll listener (0 timers, 0 reflows)
      window.addEventListener('scroll', () => {
        this.onScroll();
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.updateDimensions();
        this.startLoop();
      }, { passive: true });

      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.updateDimensions();
          this.startLoop();
        }, 200);
      }, { passive: true });

      // Refresh measurements when layout finishes rendering
      setTimeout(() => {
        this.updateDimensions();
        this.startLoop();
      }, 700);
    }

    onScroll() {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const delta = currentScrollY - this.lastScrollY;

      if (Math.abs(delta) > 0.4) {
        this.scrollDirection = delta > 0 ? 1 : -1;
      }
      this.lastScrollY = currentScrollY;
      this.lastScrollTime = performance.now();

      if (!this.isScrolling) {
        this.isScrolling = true;
        this.setState('flying');
      }

      this.startLoop();
    }

    startLoop() {
      if (!this.isTicking) {
        this.isTicking = true;
        requestAnimationFrame(this.tick.bind(this));
      }
    }

    setState(newState) {
      if (this.state === newState) return;
      this.state = newState;
      this.root.className = `is-${newState} ${this.screenX < this.winW / 2 ? 'on-left' : 'on-right'}`;
    }

    /**
     * Compute Dynamic Flight Coordinates in Viewport Space (Always 100% on Screen)
     */
    evaluateFlight(currentScrollY) {
      const progress = Math.max(0, Math.min(1, currentScrollY / this.maxScroll));

      // Find current flight segment
      let seg = 0;
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        if (progress >= this.waypoints[i].p && progress <= this.waypoints[i + 1].p) {
          seg = i;
          break;
        }
      }
      if (progress >= 1) seg = this.waypoints.length - 2;

      const w0 = this.waypoints[seg];
      const w1 = this.waypoints[seg + 1];
      const segRange = Math.max(0.0001, w1.p - w0.p);
      const u = Math.max(0, Math.min(1, (progress - w0.p) / segRange));

      // Smooth Hermite easing across segment
      const easeU = u * u * (3 - 2 * u);

      const startX = (w0.side === 'left') ? this.leftGutterX : this.rightGutterX;
      const endX = (w1.side === 'left') ? this.leftGutterX : this.rightGutterX;

      // Lateral banking arc across the screen
      const arcDir = (w0.side === 'right') ? -1 : 1;
      const arcAmp = (this.isMobile ? 18 : 32);
      const arcX = Math.sin(u * Math.PI) * arcAmp * arcDir;

      let targetX = startX + (endX - startX) * easeU + arcX;

      // Natural cruising altitude in viewport
      const downCruiseY = this.winH * (this.isMobile ? 0.36 : 0.40);
      const upCruiseY = this.winH * (this.isMobile ? 0.46 : 0.48);
      const cruiseY = this.scrollDirection === 1 ? downCruiseY : upCruiseY;

      let targetY;
      if (progress < 0.12) {
        // Blending smoothly out of Hero starting perch
        const blend = progress / 0.12;
        targetY = this.heroScreenY + (cruiseY - this.heroScreenY) * (blend * blend);
      } else if (progress > 0.90) {
        // Blending smoothly into Footer bottom perch
        const footerPerchY = this.winH - this.peacockSize - (this.isMobile ? 22 : 36);
        const blend = (progress - 0.90) / 0.10;
        targetY = cruiseY + (footerPerchY - cruiseY) * (blend * blend);
      } else {
        // Gentle soaring undulation during middle flight
        const wave = Math.sin(u * Math.PI * 2) * (this.isMobile ? 12 : 20);
        targetY = cruiseY + wave;
      }

      // Determine facing strictly according to flight travel direction
      let targetFacing = this.facing;
      let targetAngle = 0;

      if (this.isScrolling) {
        // When actively flying:
        if (this.scrollDirection === 1) {
          // Scrolling down: travelling from w0 to w1
          const movingRight = endX > startX;
          targetFacing = movingRight ? 1 : -1;
          targetAngle = movingRight ? 8 : -8;
        } else {
          // Scrolling up: travelling from w1 back to w0
          const movingRight = startX > endX;
          targetFacing = movingRight ? 1 : -1;
          targetAngle = movingRight ? -6 : 6;
        }
      } else {
        // When perched (stopped), face inward toward content:
        targetFacing = (targetX < this.winW / 2) ? 1 : -1;
        targetAngle = 0;
      }

      return { targetX, targetY, targetFacing, targetAngle };
    }

    emitEmber(clientX, clientY, isBurst = false) {
      if (this.isMobile || !this.emberLayer) return;

      const ember = document.createElement('div');
      ember.className = 'peacock-particle-ember';

      const size = Math.random() * (isBurst ? 8 : 4.5) + 2.5;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;

      ember.style.left = `${clientX}px`;
      ember.style.top = `${clientY}px`;

      this.emberLayer.appendChild(ember);

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

    tick(time) {
      if (this.reducedMotion) {
        this.root.style.transform = `translate3d(${this.heroScreenX}px, ${this.heroScreenY}px, 0)`;
        this.isTicking = false;
        return;
      }

      // Check if scrolling has paused
      if (this.isScrolling && time - this.lastScrollTime > 110) {
        this.isScrolling = false;
        this.setState('perched');
      }

      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const { targetX, targetY, targetFacing, targetAngle } = this.evaluateFlight(currentScrollY);

      this.facing = targetFacing;

      // Snappy and responsive lerp in viewport space
      const lerpFactor = this.isScrolling ? 0.32 : 0.20;
      this.screenX += (targetX - this.screenX) * lerpFactor;
      this.screenY += (targetY - this.screenY) * lerpFactor;
      this.angle += (targetAngle - this.angle) * 0.22;

      this.renderPosition();

      // Emit stardust trail only on desktop while actively flying
      if (!this.isMobile && this.isScrolling && time - this.lastEmberTime > 130) {
        this.emitEmber(this.screenX + this.peacockSize / 2, this.screenY + this.peacockSize / 2);
        this.lastEmberTime = time;
      }

      // Sleep RAF when perched and settled within 0.25px to save 100% mobile CPU
      const dx = Math.abs(targetX - this.screenX);
      const dy = Math.abs(targetY - this.screenY);
      const da = Math.abs(targetAngle - this.angle);

      if (!this.isScrolling && dx < 0.25 && dy < 0.25 && da < 0.2) {
        this.screenX = targetX;
        this.screenY = targetY;
        this.angle = 0;
        this.renderPosition();
        this.isTicking = false;
        return;
      }

      requestAnimationFrame(this.tick.bind(this));
    }

    renderPosition() {
      this.root.style.transform = `translate3d(${this.screenX}px, ${this.screenY}px, 0)`;

      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.facing}) rotate(${this.angle}deg)`;
      }

      // Update tooltip alignment class
      const sideClass = this.screenX < this.winW / 2 ? 'on-left' : 'on-right';
      if (!this.root.classList.contains(sideClass)) {
        this.root.classList.remove('on-left', 'on-right');
        this.root.classList.add(sideClass);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DualWingTravellingPeacock());
  } else {
    new DualWingTravellingPeacock();
  }
})();
