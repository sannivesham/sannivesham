# Sannivesham (సన్నివేశం)

> **సంస్కృతి • సంప్రదాయం • సంభాషణ**  
> *A comprehensive digital ecosystem celebrating Telugu language, literature, Sanatana Dharma, classical arts, temple heritage, and cultural gaming.*

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Electron%20%7C%20Android-gold)](https://sannivesham.com)
[![Firebase](https://img.shields.io/badge/Firebase-v12.14.0-orange)](https://firebase.google.com/)
[![Node](https://img.shields.io/badge/Node-v20%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-blue)](#)

---

## 📖 Overview

**Sannivesham** is an end-to-end Telugu cultural, spiritual, and literary digital platform. It brings ancient wisdom and regional traditions to modern platforms through interactive storytelling, audio synchronization, high-precision astronomical calculations, secure media streaming, and educational gaming.

### Core Ecosystem Pillars:
1. **సాహిత్యం & ఇతిహాసాలు (Literature & Epics):** Line-by-line synchronized audio recitations of the Bhagavad Gita, Puranas, Shatakas, and classical Telugu works.
2. **దృశ్యం (Drushyam):** Curated cultural video streaming and devotional discourse platform with subscriber-tier access control.
3. **సన్నివేశం మేధ (Medha AI):** A fine-tuned cultural AI guide providing authentic Telugu explanations, scriptural insights, and conversational wisdom within strict ethical boundaries.
4. **పంచాంగం (High-Precision Panchangam):** Drik Ganitha planetary engine calculating Tithi, Nakshatram, Rahu Kalam, and festival alerts.
5. **ఆటల విభాగం (Cultural Games):** Six educational logic and memory games designed to immerse younger audiences in temple art, epics, and vocabulary.
6. **సందర్శన (Sandarshana Browser & Desktop):** Dedicated, ad-shielded desktop and mobile applications preserving privacy and clean reading environments.

---

## 🏛️ Project Structure

```
sannivesham/
├── about/                 # Organization bio, mission, and privacy policy
├── admin/                 # CMS Dashboard, content authoring, audio line-sync
│   └── modules/           # Modularized admin utilities & smart URL transliteration
├── ai/                    # Sannivesham Medha AI client interface
│   └── modules/           # Knowledge engine, safety patterns, canvas & markdown
├── aksharam/              # Telugu learning suite & dictionary tools
├── calendar/              # Interactive Drik Panchangam calendar
├── chant-counter/         # Digital Japa Mala and mantra counter
├── chitram/               # Cultural photography & GPS camera utilities
├── desktop-app/           # Cross-platform Electron desktop app
├── drushyam/              # Video streaming portal & subscription billing
├── events/                # Temple events and spiritual gathering manager
├── festivals/             # Comprehensive Telugu festival guide & counters
├── functions/             # Firebase Cloud Functions (v2 + Node 20 runtime)
│   ├── index.js           # Medha AI endpoint with token verification & rate limits
│   ├── payments.js        # Server-side Razorpay order creation & HMAC verification
│   ├── moderation.js      # Multi-tier safety & prompt-injection filters
│   └── relevance.js       # Cultural domain relevance classification
├── games/                 # Cultural educational games
│   ├── common/            # Shared offline-first progress & level selection engine
│   ├── connect-dots/      # Character-attribute matching game
│   ├── fisheye/           # Matsya Yantra concentration puzzle
│   ├── maze/              # Cultural labyrinth exploration
│   ├── Sliding-Puzzle/    # Devotional art tile puzzle (12 chapters)
│   ├── sudoku/            # Telugu numeral & standard logic sudoku
│   └── word-search/       # Classical Telugu vocabulary puzzles
├── ithihasalu/            # Ramayana, Mahabharata, and Gita chapter readers
├── library/               # Stotra, Sahasranama, and Kavya reader with sync audio
├── music/                 # Devotional ambient audio tracks
├── profile/               # User profile, synced game progress & subscriptions
├── quiz/                  # Question of the Day & cultural leaderboard
├── sandarshana/           # Sandarshana privacy browser portal & policies
├── scripts/               # Administrative tools (e.g. set-admin-claim.js)
├── stories/               # Illustrated moral stories & folktales
├── temples/               # Ancient temple history, timings, and sthala purana
├── tests/                 # Automated security and AI verification test suites
├── videos/                # Video discourses and devotional player
├── firebase-config.js     # Centralized, production Firebase SDK initialization
├── firestore.rules        # Deny-by-default, claim-enforced Firestore rules
├── storage.rules          # Strict Cloud Storage access rules
└── firebase.json          # Hosting headers (CSP, HSTS) & runtime configuration
```

---

## 🔒 Security Architecture

The platform employs a defense-in-depth security model:

1. **Strict Content-Security-Policy (CSP):**
   - Enforced via both HTML meta tags and production `firebase.json` response headers.
   - Restricts script execution to `'self'`, Google Firebase SDKs, and Razorpay checkout origins.
   - Enforces `X-Frame-Options: SAMEORIGIN` and `X-Content-Type-Options: nosniff`.

2. **Server-Enforced Role-Based Access Control (RBAC):**
   - Admin accounts are verified server-side using Firebase Custom Claims (`request.auth.token.admin == true`).
   - Fallback protection against a restricted Firestore `settings/admin` allowlist.
   - Client interfaces are strictly presentation layers; Firestore and Cloud Storage rules reject all unauthorized write attempts.

3. **Tamper-Proof Subscription Verification:**
   - Order creation and plan pricing are calculated exclusively server-side in Cloud Functions.
   - Payment signatures are validated using cryptographic HMAC-SHA256 (`crypto.createHmac`) before any subscriber record is written.
   - The `subscribers` collection is configured as client read-only in `firestore.rules`.

4. **Hardened Medha AI Endpoint:**
   - Mandatory Firebase ID token verification via `admin.auth().verifyIdToken()`.
   - Sliding-window per-user and per-IP rate limiting (maximum 15 queries per 10-minute window).
   - Strict input length capping, array history bounds, and detailed error masking.
   - Secret Manager integration for Gemini API credentials via Firebase `defineSecret`.

5. **XSS Protection & Sanitization:**
   - All dynamic text, usernames, and CMS fields are rendered via `textContent` or filtered through `escapeHtml()` prior to insertion.

---

## 🎮 Cultural Games Architecture

All six educational games share an offline-first progress architecture located in `games/common/`:
- **`progress.js`:** Manages instant `localStorage` updates while transparently synchronizing completed levels and best completion metrics to Firestore (`users/{uid}/gameProgress`) upon authentication.
- **`level-select.js`:** Unified responsive level grid builder rendering lock/unlock states, chapter thumbnails, and gold completion ribbons.

To register a new game:
```javascript
import { createGameProgress } from "../common/progress.js";
const Progress = createGameProgress("myNewGameKey");
export default Progress;
```

---

## 🧪 Testing & Quality Assurance

Automated test suites reside in `tests/` and can be executed with Node.js:

```bash
# 1. Run security verification suite (Admin claims, HMAC verification, rate limits)
node tests/test_security_fixes.js

# 2. Run Medha AI verification suite (119+ cultural, safety, and injection tests)
node tests/test_medha_ai.js
```

---

## 🛠️ Administrative Operations

### Granting or Revoking Admin Privileges:
Administrators must be provisioned via the secure CLI script using a Firebase Service Account:

```bash
# Set admin custom claim and update allowlist:
node scripts/set-admin-claim.js user@example.com

# Revoke admin privileges:
node scripts/set-admin-claim.js user@example.com --revoke
```

---

## 🚀 Deployment

1. **Deploy Firebase Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```

2. **Deploy Security Rules:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

3. **Deploy Web Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

---

## 📜 Copyright & Heritage

© 2026 **Sannivesham**. All rights reserved. Dedicated to the preservation, promotion, and celebration of Telugu culture, Sanatana Dharma, and classical Indian arts.
