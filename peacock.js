/**
 * ==============================================================================
 * SANNIVESHAM — PHOTOREALISTIC SCROLL-TRAVELLING PEACOCK
 * True Photorealistic Assets, Instant Perch on Scroll Stop & Wide Lateral Travel
 * ==============================================================================
 */

(function () {
  'use strict';

  if (window.__SanniveshamPhotorealPeacock) return;
  window.__SanniveshamPhotorealPeacock = true;

  const AI_DESTINATION = 'ai/';
  const IMG_PERCHED = 'images/peacock-perched.png';
  const IMG_FLYING = 'images/peacock-flying.png';

  class PhotorealTravellingPeacock {
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

      // Initial placement at Landmark 0 (Hero Right)
      if (this.landmarks.length > 0) {
        const lm0 = this.landmarks[0];
        this.docX = this.targetDocX = lm0.docX;
        this.docY = this.targetDocY = lm0.docY;
        this.facing = lm0.facing || -1;
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
          <!-- Photorealistic Sitting Peacock (Wings folded against body) -->
          <img src="${IMG_PERCHED}" alt="Sannivesham Peacock Perched" class="peacock-img-layer peacock-img-perched" loading="eager" decoding="async">
          <!-- Photorealistic Flying Peacock (Wings spread in full flight) -->
          <img src="${IMG_FLYING}" alt="Sannivesham Peacock Flying" class="peacock-img-layer peacock-img-flying" loading="eager" decoding="async">
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

      // Real physical surfaces on the Sannivesham website
      const heroElem = document.querySelector('.top-brand .brand-logo-wrap') || document.querySelector('.top-brand');
      const introElem = document.querySelector('#intro') || document.querySelector('.intro-box');
      const rightCardElem = document.querySelector('a[href="festivals/"]') || document.querySelector('a[href="temples/"]');
      const leftCardElem = document.querySelector('a[href="library/"]') || document.querySelector('a[href="quiz/"]');
      const shlokaElem = document.querySelector('.shloka-section') || document.querySelector('#shlokaFlipCard');
      const footerElem = document.querySelector('.home-footer') || document.querySelector('#contact');

      // Alternating sequence: RIGHT -> LEFT -> RIGHT -> LEFT -> RIGHT -> LEFT
      const config = [
        {
          elem: heroElem,
          label: 'Hero (Right)',
          side: 'right',
          pctX: isMobile ? 0.74 : 0.72,
          offsetY: isMobile ? -62 : -78,
          facing: -1
        },
        {
          elem: introElem,
          label: 'Culture (Far Left)',
          side: 'left',
          pctX: isMobile ? 0.16 : 0.20,
          offsetY: isMobile ? -60 : -76,
          facing: 1
        },
        {
          elem: rightCardElem,
          label: 'Temples (Far Right)',
          side: 'right',
          pctX: isMobile ? 0.78 : 0.76,
          offsetY: isMobile ? -60 : -76,
          facing: -1
        },
        {
          elem: leftCardElem,
          label: 'Library (Far Left)',
          side: 'left',
          pctX: isMobile ? 0.16 : 0.22,
          offsetY: isMobile ? -60 : -76,
          facing: 1
        },
        {
          elem: shlokaElem,
          label: 'Wisdom (Far Right)',
          side: 'right',
          pctX: isMobile ? 0.78 : 0.75,
          offsetY: isMobile ? -60 : -78,
          facing: -1
        },
        {
          elem: footerElem,
          label: 'Footer (Left-Center)',
          side: 'left',
          pctX: isMobile ? 0.26 : 0.30,
          offsetY: isMobile ? -55 : -72,
          facing: 1
        }
      ];

      this.landmarks = config.map((c, i) => {
        let docX = winW * c.pctX;
        let docY = i * 720;

        if (c.elem) {
          const rect = c.elem.getBoundingClientRect();
          docY = rect.top + scrollY + c.offsetY;

          if (c.side === 'left') {
            docX = Math.max(18, Math.min(rect.left + window.scrollX + (isMobile ? 24 : 50), winW * 0.35));
          } else {
            docX = Math.min(winW - (isMobile ? 120 : 160), Math.max(rect.right + window.scrollX - (isMobile ? 50 : 80), winW * 0.65));
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

      // User is actively scrolling -> Wake up and take flight
      if (scrollDelta > 0.5) {
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
        }, 120);
      }, 90);
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
      if (n === 0) return { docX: 100, docY: 100, facing: 1, angle: 0 };
      if (n === 1) {
        const lm = this.landmarks[0];
        return { docX: lm.docX, docY: lm.docY, facing: lm.facing, angle: 0 };
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

      // Strong Lateral Traversal (Left <-> Right)
      const dx = p1.docX - p0.docX;
      const dy = p1.docY - p0.docY;

      const winW = window.innerWidth;
      const isMobile = winW < 768;

      const lateralBulge = (dx >= 0 ? 1 : -1) * (isMobile ? 42 : 85);
      const cp1X = p0.docX + dx * 0.20 + lateralBulge;
      const cp1Y = p0.docY + dy * 0.12 - (isMobile ? 55 : 85);

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
      const sideSwing = Math.sin(u * Math.PI) * (isMobile ? 28 : 60) * (seg % 2 === 0 ? -1 : 1);
      docX += sideSwing;

      // Velocity tangent for banking angle
      const du = 0.02;
      const nextU = Math.min(u + du, 1);
      const nu1 = 1 - nextU;
      const nextX = nu1 * nu1 * nu1 * p0.docX + 3 * nu1 * nu1 * nextU * cp1X + 3 * nu1 * nextU * nextU * cp2X + nextU * nextU * nextU * p1.docX + Math.sin(nextU * Math.PI) * (isMobile ? 28 : 60) * (seg % 2 === 0 ? -1 : 1);
      const nextY = nu1 * nu1 * nu1 * p0.docY + 3 * nu1 * nu1 * nextU * cp1Y + 3 * nu1 * nextU * nextU * cp2Y + nextU * nextU * nextU * p1.docY;

      const vx = nextX - docX;
      const vy = nextY - docY;

      let facing = p0.facing;
      if (Math.abs(vx) > 0.8) {
        facing = vx >= 0 ? 1 : -1;
      } else if (u > 0.82) {
        facing = p1.facing;
      }

      let angle = (Math.atan2(vy, vx) * 180) / Math.PI;
      if (facing === -1) {
        angle = angle - 180;
        if (angle < -180) angle += 360;
      }
      angle = Math.max(Math.min(angle * 0.45, 26), -26);

      // When resting/sitting, angle must be perfectly 0
      if (!this.isScrolling) {
        angle = 0;
      }

      return { docX, docY, facing, angle };
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
      const halfSize = isMobile ? 58 : 77;

      this.targetDocX = trajectory.docX - halfSize;
      this.targetDocY = trajectory.docY - halfSize;

      const maxX = document.documentElement.clientWidth - (halfSize * 2 - 8);
      this.targetDocX = Math.max(6, Math.min(this.targetDocX, maxX));

      // Damping
      const lerpFactor = this.isScrolling ? 0.16 : 0.10;
      this.docX += (this.targetDocX - this.docX) * lerpFactor;
      this.docY += (this.targetDocY - this.docY) * lerpFactor;

      const targetAngle = this.isScrolling ? trajectory.angle : 0;
      this.angle += (targetAngle - this.angle) * 0.16;
      this.facing = trajectory.facing;

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

      if (this.innerWrap) {
        this.innerWrap.style.transform = `scaleX(${this.facing}) rotate(${this.angle}deg)`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PhotorealTravellingPeacock());
  } else {
    new PhotorealTravellingPeacock();
  }
})();
