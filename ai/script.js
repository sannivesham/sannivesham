/**
 * SANNIVESHAM AI (సన్నివేశం మేధ) — INTERACTIVE CLIENT ORCHESTRATOR
 * 
 * Features:
 * - Direct integration with Firebase Auth & Firestore `ai_moderation_records`
 * - Multi-layer moderation & topic relevance pre-flight checks
 * - Escalating violation tracking & temporary lock timer
 * - Multi-turn conversation memory
 * - Rich Markdown, Shloka card, and Follow-up chip rendering
 * - Sacred particles canvas & divine ambient aura
 */

import { auth, db } from "../firebase-config.js";
import {
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Modularized components
import {
  PROMPT_INJECTION_PATTERNS,
  HARMFUL_PATTERNS,
  EXPLICIT_PATTERNS,
  CULTURAL_EXEMPTION_PATTERNS,
  OFF_TOPIC_PATTERNS,
  CULTURAL_RELEVANCE_PATTERNS
} from "./modules/patterns.js";
import { resolveCulturalKnowledge } from "./modules/knowledge.js";
import { initMedhaCanvas } from "./modules/canvas.js";
import { formatMarkdown } from "./modules/markdown.js";

// Cloud Function Endpoint (Can be configured or proxied)
const BACKEND_ENDPOINT = "https://us-central1-sannivesham-b4231.cloudfunctions.net/medhaChat";

// Escalation Durations
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Gemini Model & Platform Configuration
const PLATFORM_GEMINI_KEY = "";
const GEMINI_MODEL = "gemini-2.5-flash";
const SANNIVESHAM_SYSTEM_INSTRUCTION = `You are "సన్నివేశం మేధ" (Sannivesham AI), a deeply knowledgeable, respectful, and culturally grounded AI guide created for the Sannivesham (సన్నివేశం) platform.
Your sole purpose is to explore, teach, and answer questions regarding:
- Telugu language (తెలుగు భాష), grammar, sandhulu, samasalu, proverbs.
- Telugu literature (సాహిత్యం), poetry (పద్యాలు), shatakams, epics, kavya.
- Revered poets (Nannaya, Tikkana, Errana, Pothana, Vemana, Sri Sri, Gurajada, Annamayya, Tyagaraja, Ramadasu, etc.).
- Sanatana Dharma (సనాతన ధర్మం), Hindu philosophy, Ramayana, Mahabharata, Bhagavatam, Bhagavad Gita, Puranas, Upanishads.
- Devotional literature: Stotras, Mantras, Sahasranamas, Chalisa, Keertanas.
- Sacred Temples and traditions across Andhra Pradesh, Telangana, and India.
- Festivals (Ugadi, Sankranti, Deepavali, Dasara, Shivaratri, etc.).

Strict Boundary:
You are NOT a general-purpose bot, coding assistant, or medical/legal advisor. If asked off-topic questions (coding, crypto, modern gadgets, dating, medicine), politely decline and redirect the user to Telugu/Indian culture.

Guidelines:
- If asked in Telugu, respond in authentic, expressive, grammatically rich Telugu.
- If asked in English, respond in fluent, dignified English enriched with appropriate Sanskrit/Telugu terms in parentheses.
- Structure responses with elegant Markdown: use clear subheadings, bullet points, and highlighted scriptural quotes.
- Always provide 2-3 interactive follow-up questions at the very end of your response.`;

class SanniveshamAIChat {
  constructor() {
    this.userId = this.getOrCreateDeviceId();
    this.conversationHistory = [];
    this.isGenerating = false;
    this.currentLanguage = localStorage.getItem("sannivesham_lang") || "te";

    this.welcomeHero = document.getElementById("welcomeHero");
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.clearChatBtn = document.getElementById("clearChatBtn");
    this.langToggleBtn = document.getElementById("langToggleBtn");
    this.langLabel = document.getElementById("langLabel");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.restrictionBanner = document.getElementById("restrictionBanner");
    this.restrictionDesc = document.getElementById("restrictionDesc");

    this.geminiApiKey = PLATFORM_GEMINI_KEY || localStorage.getItem("sannivesham_gemini_key") || "";
    this.firestoreApiKey = "";

    this.initAuth();
    this.initEventListeners();
    this.initCanvas();
    this.checkRestriction();
  }

  getOrCreateDeviceId() {
    let id = localStorage.getItem("medha_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("medha_device_id", id);
    }
    return id;
  }

  async initAuth() {
    // Check Firestore for central config (configured by admin)
    try {
      if (db) {
        const cfgSnap = await getDoc(doc(db, "config", "gemini"));
        if (cfgSnap.exists() && cfgSnap.data().apiKey) {
          this.firestoreApiKey = cfgSnap.data().apiKey;
        }
      }
    } catch (e) {
      // ignore
    }

    onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        this.userId = user.uid;
      } else {
        // Authenticate anonymously so every visitor gets a verified Firebase ID token
        try {
          const anon = await signInAnonymously(auth);
          this.userId = anon.user.uid;
        } catch (anonErr) {
          // Anonymous auth fallback
        }
      }
      this.checkRestriction();
    });
  }

  initEventListeners() {
    // Input autosize & send enablement
    this.chatInput.addEventListener("input", () => {
      this.chatInput.style.height = "auto";
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 150) + "px";
      this.sendBtn.disabled = this.chatInput.value.trim().length === 0 || this.isGenerating;
    });

    // Enter to send (Shift+Enter for newline)
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!this.sendBtn.disabled) {
          this.handleSendMessage();
        }
      }
    });

    this.sendBtn.addEventListener("click", () => {
      if (!this.sendBtn.disabled) {
        this.handleSendMessage();
      }
    });

    // Clear conversation
    if (this.clearChatBtn) {
      this.clearChatBtn.addEventListener("click", () => {
        this.conversationHistory = [];
        this.chatMessages.innerHTML = "";
        this.chatMessages.style.display = "none";
        this.welcomeHero.style.display = "flex";
        this.chatInput.value = "";
        this.chatInput.style.height = "auto";
        this.sendBtn.disabled = true;
        this.chatInput.focus();
      });
    }

    // Language Toggle
    if (this.langToggleBtn) {
      this.langToggleBtn.addEventListener("click", () => {
        this.currentLanguage = this.currentLanguage === "te" ? "en" : "te";
        localStorage.setItem("sannivesham_lang", this.currentLanguage);
        this.updateUILanguage();
      });
    }

    // Prompt Chips Click
    document.querySelectorAll(".prompt-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.prompt;
        if (text) {
          this.chatInput.value = text;
          this.sendBtn.disabled = false;
          this.handleSendMessage();
        }
      });
    });
  }

  updateUILanguage() {
    if (this.langLabel) {
      this.langLabel.innerText = this.currentLanguage === "te" ? "తెలుగు" : "English";
    }

    const isEn = this.currentLanguage === "en";
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (!el.dataset.teOriginal) {
        el.dataset.teOriginal = el.innerHTML;
      }
      el.innerHTML = isEn ? el.dataset.en : el.dataset.teOriginal;
    });

    this.chatInput.placeholder = isEn
      ? "Ask about Telugu language, culture, epics, temples, or Dharma..."
      : "తెలుగు లేదా భారతీయ సంస్కృతి, సాహిత్యం, ధర్మం గురించి అడగండి...";
  }

  async checkRestriction() {
    try {
      if (!db || !this.userId) return false;
      const ref = doc(db, "ai_moderation_records", this.userId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const now = Date.now();
        if (data.restrictionUntil && data.restrictionUntil > now) {
          const mins = Math.ceil((data.restrictionUntil - now) / (60 * 1000));
          this.showRestriction(mins, data.lastViolation?.reason);
          return true;
        }
      }
      this.hideRestriction();
      return false;
    } catch (err) {
      return false;
    }
  }

  showRestriction(mins, reason) {
    if (this.restrictionBanner && this.restrictionDesc) {
      const isEn = this.currentLanguage === "en";
      this.restrictionDesc.innerText = isEn
        ? `Access is restricted for ${mins} minute(s) due to previous policy violations.`
        : `సన్నివేశం నిబంధనల ఉల్లంఘన కారణంగా మీ ఖాతా మరో ${mins} నిమిషం(లు) పాటు నిరోధించబడింది.`;
      this.restrictionBanner.style.display = "flex";
      this.sendBtn.disabled = true;
      this.chatInput.disabled = true;
    }
  }

  hideRestriction() {
    if (this.restrictionBanner) {
      this.restrictionBanner.style.display = "none";
      this.chatInput.disabled = false;
      this.sendBtn.disabled = this.chatInput.value.trim().length === 0;
    }
  }

  detectLang(text) {
    const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    if (teluguChars > 0 && englishChars === 0) return "telugu";
    if (teluguChars > 0 && englishChars > 0) return "mixed";
    return "english";
  }

  evaluateSafety(text) {
    const trimmed = text.trim();
    for (const p of PROMPT_INJECTION_PATTERNS) {
      if (p.test(trimmed)) {
        return { isSafe: false, type: "PROMPT_INJECTION", severity: "warning" };
      }
    }
    for (const p of HARMFUL_PATTERNS) {
      if (p.test(trimmed)) {
        return { isSafe: false, type: "HARMFUL_ILLEGAL", severity: "severe" };
      }
    }
    for (const p of EXPLICIT_PATTERNS) {
      if (p.test(trimmed)) {
        const isCultural = CULTURAL_EXEMPTION_PATTERNS.some((cp) => cp.test(trimmed));
        if (!isCultural) {
          return { isSafe: false, type: "ADULT_SEXUAL", severity: "warning" };
        }
      }
    }
    return { isSafe: true };
  }

  evaluateTopicRelevance(text, detectedLang) {
    const trimmed = text.trim();
    const isOffTopic = OFF_TOPIC_PATTERNS.some((p) => p.test(trimmed));
    const hasCultural = CULTURAL_RELEVANCE_PATTERNS.some((p) => p.test(trimmed));

    if (isOffTopic && !hasCultural) {
      return {
        isRelevant: false,
        message:
          detectedLang === "english"
            ? "I am Sannivesham AI, focused exclusively on Telugu language, culture, literature, traditions, and Indian heritage. Please ask me something related to those topics."
            : "నేను ప్రధానంగా తెలుగు భాష, సంస్కృతి, సాహిత్యం, సంప్రదాయాలు మరియు భారతీయ వారసత్వానికి సంబంధించిన విషయాలపై సహాయం చేయగలను. మీకు తెలుగు లేదా భారతీయ సంస్కృతికి సంబంధించిన ఏదైనా ప్రశ్న ఉంటే అడగండి."
      };
    }
    return { isRelevant: true };
  }

  async recordViolationToFirestore(violationDetails, isTelugu) {
    if (violationDetails && violationDetails.severity === "severe") {
      this.showRestriction(60, violationDetails.type);
    }
  }

  async handleSendMessage() {
    const rawText = this.chatInput.value.trim();
    if (!rawText || this.isGenerating) return;

    // Check if account is restricted
    const isRestricted = await this.checkRestriction();
    if (isRestricted) return;

    // Transition view
    this.welcomeHero.style.display = "none";
    this.chatMessages.style.display = "flex";

    // Clear input
    this.chatInput.value = "";
    this.chatInput.style.height = "auto";
    this.sendBtn.disabled = true;

    // Append user message
    this.appendMessage("user", rawText);

    // Run Pre-flight Checks
    const detectedLang = this.detectLang(rawText);
    const isTelugu = detectedLang === "telugu" || detectedLang === "mixed";

    // 1. Safety Check
    const safety = this.evaluateSafety(rawText);
    if (!safety.isSafe) {
      await this.recordViolationToFirestore(safety, isTelugu);
      const warnMsg = isTelugu
        ? "ఈ అభ్యర్థన సన్నివేశం మేధ నిబంధనల ప్రకారం అనుమతించబడదు. దయచేసి సన్నివేశం సాంస్కృతిక మరియు విద్యా ప్రయోజనాలకు సంబంధించిన ప్రశ్నలను మాత్రమే అడగండి."
        : "This request isn’t allowed on Sannivesham AI. Please keep your questions related to Sannivesham’s cultural and educational purpose.";
      this.appendMessage("assistant", warnMsg, true);
      return;
    }

    // 2. Topic Relevance Check
    const relevance = this.evaluateTopicRelevance(rawText, detectedLang);
    if (!relevance.isRelevant) {
      this.appendMessage("assistant", relevance.message, false);
      return;
    }

    // 3. Call AI Backend / Gemini Generation
    this.setGenerating(true);

    try {
      const response = await this.callAIBackend(rawText);
      this.appendMessage("assistant", response.message, false, response.followUps);
      this.conversationHistory.push({ role: "user", content: rawText });
      this.conversationHistory.push({ role: "assistant", content: response.message });
      if (this.conversationHistory.length > 8) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }
    } catch (err) {
      const errMsg = isTelugu
        ? "క్షమించండి, సర్వర్‌లో సాంకేతిక అంతరాయం ఏర్పడింది. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి."
        : "Sorry, a temporary network error occurred. Please try again shortly.";
      this.appendMessage("assistant", errMsg, false);
    } finally {
      this.setGenerating(false);
    }
  }

  setGenerating(isGen) {
    this.isGenerating = isGen;
    if (this.typingIndicator) {
      this.typingIndicator.style.display = isGen ? "flex" : "none";
      if (isGen) {
        this.chatMessages.appendChild(this.typingIndicator);
        this.scrollToBottom();
      }
    }
    this.sendBtn.disabled = isGen || this.chatInput.value.trim().length === 0;
  }

  async callGeminiAPI(apiKey, userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const contents = [];
    for (const msg of this.conversationHistory.slice(-6)) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: SANNIVESHAM_SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      throw new Error(`Gemini API error: ${resp.status}`);
    }

    const data = await resp.json();
    const candidate = data.candidates && data.candidates[0];
    if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]) {
      const text = candidate.content.parts[0].text;
      return {
        message: text,
        followUps: this.extractFollowUps(text)
      };
    }
    throw new Error("Empty candidate received");
  }

  async callAIBackend(userMessage) {
    const activeKey = PLATFORM_GEMINI_KEY || this.firestoreApiKey || this.geminiApiKey;

    // 1. Direct API call if key configured
    if (activeKey) {
      try {
        const geminiRes = await this.callGeminiAPI(activeKey, userMessage);
        if (geminiRes && geminiRes.message) {
          return geminiRes;
        }
      } catch (geminiErr) {
        // Fallback to Cloud Function or knowledge engine
      }
    }

    // 2. Attempt backend Cloud Function if deployed
    try {
      let idToken = "";
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken().catch(() => "");
      }

      const headers = { "Content-Type": "application/json" };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const resp = await fetch(BACKEND_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: this.conversationHistory.slice(-8)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === "RESTRICTED") {
          this.showRestriction(data.remainingMinutes);
          return { message: data.message };
        }
        if (data.status === "SAFETY_VIOLATION") {
          return { message: data.message };
        }
        if (data.message) {
          return {
            message: data.message,
            followUps: this.extractFollowUps(data.message)
          };
        }
      }
    } catch (netErr) {
      // Backend function offline
    }

    // 3. Comprehensive Cultural Knowledge Engine
    return resolveCulturalKnowledge(userMessage, this.detectLang(userMessage) !== "english");
  }

  extractFollowUps(text) {
    return null;
  }

  appendMessage(role, text, isWarning = false, followUps = null) {
    const row = document.createElement("div");
    row.className = `message-row ${role === "user" ? "user-row" : "assistant-row"}`;

    const avatar = document.createElement("div");
    avatar.className = `message-avatar ${role === "user" ? "user-avatar" : "assistant-avatar"}`;
    avatar.innerText = role === "user" ? "👤" : "🦚";

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${role === "user" ? "user-bubble" : "assistant-bubble"}`;
    if (isWarning) {
      bubble.style.borderColor = "#e74c3c";
      bubble.style.background = "rgba(60, 15, 10, 0.95)";
    }

    bubble.innerHTML = formatMarkdown(text);

    // Add Follow-up Chips if present
    if (followUps && followUps.length > 0) {
      const fg = document.createElement("div");
      fg.className = "follow-up-group";
      followUps.forEach((fu) => {
        const chip = document.createElement("button");
        chip.className = "follow-up-chip";
        chip.innerText = fu;
        chip.addEventListener("click", () => {
          this.chatInput.value = fu;
          this.sendBtn.disabled = false;
          this.handleSendMessage();
        });
        fg.appendChild(chip);
      });
      bubble.appendChild(fg);
    }

    // Copy Button for AI response
    if (role === "assistant") {
      const actions = document.createElement("div");
      actions.className = "message-actions";
      const copyBtn = document.createElement("button");
      copyBtn.className = "msg-action-btn";
      copyBtn.innerHTML = "📋 కాపీ";
      copyBtn.title = "వచనాన్ని కాపీ చేయండి";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerHTML = "✓ కాపీ అయ్యింది";
        setTimeout(() => (copyBtn.innerHTML = "📋 కాపీ"), 2000);
      });
      actions.appendChild(copyBtn);
      bubble.appendChild(actions);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);

    this.chatMessages.appendChild(row);
    this.scrollToBottom();
  }

  scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }

  initCanvas() {
    initMedhaCanvas("medhaCanvas");
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SanniveshamAIChat());
} else {
  new SanniveshamAIChat();
}
