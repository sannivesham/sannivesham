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
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Cloud Function Endpoint (Can be configured or proxied)
const BACKEND_ENDPOINT = "https://us-central1-sannivesham-b4231.cloudfunctions.net/medhaChat";

// Escalation Durations
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Gemini Model Configuration
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

Language & Style:
- If user asks in Telugu, respond in elegant Telugu with authentic verses and clear meanings.
- If user asks in English, respond in articulate English with scriptural citations.
- Always provide 2-3 interactive follow-up questions at the very end of your response.`;

// Prompt injection & safety patterns
const PROMPT_INJECTION_PATTERNS = [
  /(ignore|disregard|forget|bypass)\s+.*(instructions|rules|prompt|identity|filters|guardrails|moderation)/i,
  /\b(you\s+are\s+now\s+(in\s+)?dan|jailbreak|pretend\s+you\s+are\s+(an\s+)?(unrestricted|ai\s+with\s+no\s+safety)|act\s+as\s+an\s+unrestricted)\b/i,
  /\b(reveal|print|show|output|tell\s+me|share|display)\s+.*(system\s+prompt|developer\s+instructions|system\s+instruction|backend\s+rules|moderation\s+logic|internal\s+instructions)/i,
  /\bwhat\s+(were|are)\s+you\s+(instructed|told)\s+to\s+(hide|keep\s+secret)/i,
  /\bwhat\s+(is|are)\s+your\s+.*(system\s+prompt|hidden\s+prompt|instructions)\b/i,
  /\b(secret\s+admin\s+credentials|firebase\s+admin|service\s+account\s+key|api\s+secret|db\s+password)\b/i,
  /\bhow\s+your\s+moderation\s+logic\s+works\b/i
];

const HARMFUL_PATTERNS = [
  /\b(how\s+to\s+(make|synthesize|cook|produce)|recipe\s+to\s+(synthesize|make|cook))\s+.*(bomb|explosive|meth|crystal\s+meth|fentanyl|poison)\b/i,
  /\b(make\s+an\s+untraceable\s+poison|how\s+to\s+poison|untraceable\s+poison)\b/i,
  /\b(keylogger|ransomware|ddos\s+attack|malware|botnet|trojan)\b/i,
  /\b(how\s+to\s+hack|steal\s+credit\s+card|atm\s+skimmer|carding\s+tutorial|phishing|steal\s+bank\s+logins)\b/i,
  /\b(bypass\s+website\s+authentication|bypass\s+authentication|bypass\s+security|sql\s+injection)\b/i,
  /\b(cheat\s+on\s+.*exam|cheat\s+on\s+my\s+university\s+exams|exam\s+cheating)\b/i,
  /\b(evade\s+police|escape\s+police)\b/i,
  /\b(pick\s+a\s+(deadbolt\s+)?lock|rob\s+a\s+house|break\s+into\s+a\s+house|burglary)\b/i,
  /\b(forge\s+identity\s+documents|fake\s+passport|counterfeit\s+money)\b/i,
  /\b(child\s+porn|csam|sexualize\s+a\s+child)\b/i
];

const EXPLICIT_PATTERNS = [
  /\b(write|generate|tell\s+me)\s+.*(erotic|sexual|adult|sex|pornographic|dirty\s+talk|nsfw)\b/i,
  /\b(dirty\s+talk|sexual\s+roleplay|nsfw|nude\s+descriptions|erotic\s+scene|sexual\s+fantasy|adult\s+scene)\b/i,
  /\b(describe\s+having\s+sex|explicit\s+sexual)\b/i
];

// Cultural exemptions to prevent false-positives
const CULTURAL_EXEMPTION_PATTERNS = [
  /వివాహం|కళ్యాణం|సప్తపది|గర్భాధారణ|సంస్కారాలు|కామదేవుడు|రతీదేవి|మోహిని|శృంగార\s+రసం|కావ్యాలు/i,
  /marriage|wedding|saptapadi|garbhadhana|samskara|kama\s*deva|rati|mohini|shringara|sculpture|khajuraho|temple\s+art/i
];

// Off-topic patterns (Disallowed general chatbot tasks)
const OFF_TOPIC_PATTERNS = [
  // 1. Coding, Software Development, Web Dev
  /\b(python|javascript|typescript|react|angular|vue|nodejs|node\.js|flutter|java\b|c\+\+|c#|golang|rust\b|php\b|ruby\b|swift\b|kotlin|docker|kubernetes|aws|sql|css|html|github|npm|pip)\b/i,
  /\b(code|coding|programming|developer|script|algorithm|bug|debug|compile|compiler|function|component\s+error|pull\s+request|api\s+endpoint)\b/i,

  // 2. Financial Speculation, Crypto, Stocks & Currency
  /\b(crypto|cryptocurrency|bitcoin|btc|ethereum|eth|dogecoin|altcoin|binance|blockchain|nft|nfts|wallet)\b/i,
  /\b(stock|stocks|shares|day\s+trading|nifty|sensex|options\s+trading|share\s+price|forex|mutual\s+funds|exchange\s+rate|dollar\s+to\s+euro|usd\s+to\s+inr|invest\s+in)\b/i,

  // 3. Modern Tech Support, Gadgets, Hardware & OS
  /\b(iphone|ipad|android|samsung|smartphone|laptop|pc|windows\s*11|windows\s*10|macbook|gpu|cpu|graphics\s+card|motherboard|gaming\s+mouse|headphones|screen\s+that\s+is\s+flickering|flickering\s+screen|root\s+(an\s+)?android|blue\s+screen|bsod)\b/i,

  // 4. Pure Mathematics & General Science / Academic Homework
  /\b(differential\s+equation|calculus|derivative|integral|algebra|matrix\s+multiplication|eigenvalue|trigonometry)\b/i,
  /\b(photosynthesis|quantum\s+(computing|mechanics|physics)|qubit|superposition|organic\s+chemistry|chemical\s+reaction|periodic\s+table|global\s+warming|climate\s+change)\b/i,
  /\b(write\s+an\s+essay\s+on)\b/i,

  // 5. Medical Diagnosis, Prescriptions, Pharmaceuticals & Health
  /\b(prescribe|prescription|antibiotic|paracetamol|ibuprofen|medicine|cure.*(headache|migraine|fever|cough)|migraine|headache|diagnose|treatment\s+for\s+cancer|symptoms)\b/i,

  // 6. Dating, Romance & Relationship Advice
  /\b(dating\s+app|tinder|bumble|hinge|girlfriend|boyfriend|impress\s+a\s+(girl|boy|woman|man)|crush|breakup|romantic\s+breakup)\b/i,

  // 7. Legal Advice & Lawsuits
  /\b(legal\s+advice|lawsuit|file\s+a\s+lawsuit|court\s+case|sue\s+someone|divorce\s+lawyer)\b/i,

  // 8. General Sports, Modern Non-Indian Food, Tourism, Pop Culture & Cars
  /\b(fifa|world\s+cup|counter-strike|gaming|premier\s+league|nba|nfl|marathon(\s+running)?|running\s+shoes)\b/i,
  /\b(recipe\s+for|pizza|burger|pasta|french\s+fries)\b/i,
  /\b(itinerary|visit(ing)?\s+(paris|switzerland|france|italy|germany|london|europe))\b/i,
  /\b(tiktok|instagram\s+reels|viral\s+marketing|social\s+media\s+marketing)\b/i,
  /\b(hollywood|sci-fi\s+movie|latest\s+movie\s+plot|netflix\s+series)\b/i,
  /\b(engine\s+oil|car\s+repair|car\s+engine)\b/i
];

const CULTURAL_RELEVANCE_PATTERNS = [
  /తెలుగు|భాష|వ్యాకరణం|పద్యం|సాహిత్యం|శతకం|కవి|కవులు|సామెత|పొడుపు|అర్థం|సంధి|సమాసం|ఛందస్సు/i,
  /telugu|grammar|literature|poem|kavita|padyam|shatakam|poet|proverb|sametha|meaning|vocabulary/i,
  /పోతన|వేమన|నన్నయ|తిక్కన|ఎర్రన|శ్రీశ్రీ|గురజాడ|కృష్ణదేవరాయలు|అల్లసాని|తెనాలి|విశ్వనాథ|అన్నమయ్య|త్యాగరాజు|రామదాసు/i,
  /pothana|vemana|nannaya|tikkana|errana|sri\s*sri|gurajada|krishnadevaraya|tenali|annamayya|tyagaraja|ramadasu/i,
  /రామాయణం|మహాభారతం|భాగవతం|గీత|పురాణాలు|ఉపనిషత్తులు|వేదాలు|ధర్మం|మోక్షం|కర్మ|ఆధ్యాత్మికం/i,
  /ramayana|mahabharata|bhagavatam|gita|purana|upanishad|veda|dharma|sanatana|karma|moksha|spirituality/i,
  /శివుడు|విష్ణువు|కృష్ణుడు|రాముడు|హనుమంతుడు|వెంకటేశ్వర|లక్ష్మి|సరస్వతి|పార్వతి|దుర్గ|గణపతి/i,
  /shiva|vishnu|krishna|rama|hanuman|venkateswara|balaji|lakshmi|saraswati|parvati|durga|ganesha/i,
  /గుడి|దేవాలయం|క్షేత్రం|తీర్థం|ఉగాది|సంక్రాంతి|దీపావళి|దసరా|శివరాత్రి|వినాయక|ఏకాదశి|పంచాంగం|తిథి/i,
  /temple|kshetra|tirupati|tirumala|srisailam|warangal|ugadi|sankranti|deepavali|dasara|shivaratri|ekadashi|panchangam|tithi/i,
  /స్తోత్రం|మంత్రం|నామావళి|సహస్రనామం|చాలీసా|కవచం|పారాయణం|కీర్తన|భజన|శ్లోకం/i,
  /stotram|mantra|namavali|sahasranama|chalisa|kavacham|parayanam|keertana|bhajan|shloka/i,
  /చరిత్ర|శాతవాహన|కాకతీయ|విజయనగర|కూచిపూడి|హరికథ|బుర్రకథ|సంప్రదాయం|ఆచారం/i,
  /history|satavahana|kakatiya|vijayanagara|kuchipudi|harikatha|burrakatha|tradition|custom|cinema\s+history/i
];

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

    this.geminiApiKey = localStorage.getItem("sannivesham_gemini_key") || "";
    this.firestoreApiKey = "";

    this.initAuth();
    this.initEventListeners();
    this.initApiKeyControls();
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
    // Check Firestore for central config
    try {
      if (db) {
        const cfgSnap = await getDoc(doc(db, "config", "gemini"));
        if (cfgSnap.exists() && cfgSnap.data().apiKey) {
          this.firestoreApiKey = cfgSnap.data().apiKey;
          this.updateKeyBadge();
        }
      }
    } catch (e) {
      // ignore
    }

    onAuthStateChanged(auth, (user) => {
      if (user && user.uid) {
        this.userId = user.uid;
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
      this.updateUILanguage();
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

  initApiKeyControls() {
    this.apiKeyBtn = document.getElementById("apiKeyBtn");
    this.apiKeyModal = document.getElementById("apiKeyModal");
    this.closeApiKeyModalBtn = document.getElementById("closeApiKeyModalBtn");
    this.geminiKeyInput = document.getElementById("geminiKeyInput");
    this.toggleKeyVisibilityBtn = document.getElementById("toggleKeyVisibilityBtn");
    this.clearKeyBtn = document.getElementById("clearKeyBtn");
    this.saveKeyBtn = document.getElementById("saveKeyBtn");
    this.keyFeedback = document.getElementById("keyFeedback");
    this.keyStatusIcon = document.getElementById("keyStatusIcon");

    if (this.apiKeyBtn && this.apiKeyModal) {
      this.apiKeyBtn.addEventListener("click", () => {
        this.geminiKeyInput.value = this.geminiApiKey || "";
        this.keyFeedback.innerText = "";
        this.apiKeyModal.style.display = "flex";
      });

      this.closeApiKeyModalBtn.addEventListener("click", () => {
        this.apiKeyModal.style.display = "none";
      });

      this.apiKeyModal.addEventListener("click", (e) => {
        if (e.target === this.apiKeyModal) {
          this.apiKeyModal.style.display = "none";
        }
      });

      if (this.toggleKeyVisibilityBtn) {
        this.toggleKeyVisibilityBtn.addEventListener("click", () => {
          const isPass = this.geminiKeyInput.type === "password";
          this.geminiKeyInput.type = isPass ? "text" : "password";
          this.toggleKeyVisibilityBtn.innerText = isPass ? "🙈" : "👁️";
        });
      }

      if (this.clearKeyBtn) {
        this.clearKeyBtn.addEventListener("click", () => {
          this.geminiApiKey = "";
          localStorage.removeItem("sannivesham_gemini_key");
          this.geminiKeyInput.value = "";
          this.keyFeedback.innerText = "కీ తొలగించబడింది. డిఫాల్ట్ సాంస్కృతిక విజ్ఞాన ఇంజిన్ సక్రియంలో ఉంది.";
          this.keyFeedback.style.color = "#ffd166";
          this.updateKeyBadge();
        });
      }

      if (this.saveKeyBtn) {
        this.saveKeyBtn.addEventListener("click", async () => {
          const key = this.geminiKeyInput.value.trim();
          if (!key) {
            this.keyFeedback.innerText = "దయచేసి సరైన API కీని నమోదు చేయండి.";
            this.keyFeedback.style.color = "#e74c3c";
            return;
          }

          this.saveKeyBtn.disabled = true;
          this.keyFeedback.innerText = "కీని ధృవీకరిస్తున్నాము (Verifying)...";
          this.keyFeedback.style.color = "#ffd166";

          try {
            const ok = await this.testGeminiKey(key);
            if (ok) {
              this.geminiApiKey = key;
              localStorage.setItem("sannivesham_gemini_key", key);
              this.keyFeedback.innerText = "✅ కీ విజయవంతంగా ధృవీకరించబడింది! Gemini 2.5 Flash లైవ్ మోడ్ సక్రియం అయ్యింది.";
              this.keyFeedback.style.color = "#2ecc71";
              this.updateKeyBadge();
              setTimeout(() => {
                this.apiKeyModal.style.display = "none";
              }, 1200);
            } else {
              this.keyFeedback.innerText = "⚠️ కీ తో Gemini API కనెక్ట్ కాలేదు. దయచేసి API సక్రియంగా ఉందో లేదో సరిచూసుకోండి.";
              this.keyFeedback.style.color = "#e74c3c";
            }
          } catch (err) {
            this.keyFeedback.innerText = "ధృవీకరణ లోపం: " + (err.message || "నెట్‌వర్క్ అంతరాయం");
            this.keyFeedback.style.color = "#e74c3c";
          } finally {
            this.saveKeyBtn.disabled = false;
          }
        });
      }

      this.updateKeyBadge();
    }
  }

  updateKeyBadge() {
    const activeKey = this.geminiApiKey || this.firestoreApiKey;
    if (this.apiKeyBtn) {
      if (activeKey) {
        this.apiKeyBtn.classList.add("active");
        if (this.keyStatusIcon) this.keyStatusIcon.innerText = "🟢";
      } else {
        this.apiKeyBtn.classList.remove("active");
        if (this.keyStatusIcon) this.keyStatusIcon.innerText = "⚡";
      }
    }
  }

  async testGeminiKey(key) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });
      return resp.ok;
    } catch {
      return false;
    }
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
      console.warn("Restriction check notice:", err);
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
    try {
      if (!db || !this.userId) return;
      const ref = doc(db, "ai_moderation_records", this.userId);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : { warningCount: 0, violationCount: 0 };

      const now = Date.now();
      const newWarning = (existing.warningCount || 0) + 1;
      let newViolation = existing.violationCount || 0;
      let restrictionStatus = "warned";
      let restrictionUntil = null;

      if (violationDetails.severity === "severe" || newWarning >= 3) {
        newViolation += 1;
        restrictionStatus = newViolation >= 2 ? "escalated_restriction" : "temporary_restriction";
        const lockDuration = restrictionStatus === "escalated_restriction" ? TWENTY_FOUR_HOURS_MS : ONE_HOUR_MS;
        restrictionUntil = now + lockDuration;
      }

      await setDoc(ref, {
        userId: this.userId,
        warningCount: newWarning,
        violationCount: newViolation,
        restrictionStatus,
        restrictionUntil,
        lastViolation: {
          timestamp: new Date(now).toISOString(),
          reason: violationDetails.type || "Policy Violation",
          severity: violationDetails.severity || "warning"
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (restrictionUntil) {
        const mins = Math.ceil((restrictionUntil - now) / (60 * 1000));
        this.showRestriction(mins, violationDetails.type);
      }
    } catch (e) {
      console.warn("Moderation log notice:", e);
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
      console.error("Medha Generation Error:", err);
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
      systemInstruction: {
        parts: [{ text: SANNIVESHAM_SYSTEM_INSTRUCTION }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200
      }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const candidate = data.candidates && data.candidates[0];
    if (candidate && candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const text = candidate.content.parts[0].text;
      return {
        message: text,
        followUps: this.extractFollowUps(text)
      };
    }

    throw new Error("No response content from Gemini model.");
  }

  async callAIBackend(userMessage) {
    const activeKey = this.geminiApiKey || this.firestoreApiKey;

    // 1. Direct Gemini API if key is available
    if (activeKey) {
      try {
        const geminiRes = await this.callGeminiAPI(activeKey, userMessage);
        if (geminiRes && geminiRes.message) {
          return geminiRes;
        }
      } catch (geminiErr) {
        console.warn("Direct Gemini API error:", geminiErr);
      }
    }

    // 2. Attempt backend Cloud Function if deployed
    try {
      const resp = await fetch(BACKEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: this.conversationHistory,
          userId: this.userId
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === "RESTRICTED") {
          this.showRestriction(data.remainingMinutes);
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
    return this.resolveCulturalKnowledge(userMessage);
  }

  resolveCulturalKnowledge(query) {
    const q = query.toLowerCase();
    const isTe = this.detectLang(query) !== "english";

    // 1. Srimad Ramayana
    if (q.includes("రామాయణ") || q.includes("రాముడు") || q.includes("ramayan") || q.includes("rama") || q.includes("sita") || q.includes("సీత") || q.includes("లక్ష్మణ") || q.includes("హనుమంతు") || q.includes("సుందరకాండ") || q.includes("వాల్మీకి") || q.includes("valmiki")) {
      return {
        message: isTe
          ? `### శ్రీమద్రామాయణమ్ — ధర్మ స్వరూపం & దివ్య సారాంశం\n\nవాల్మీకి మహర్షి రచించిన **శ్రీమద్రామాయణం** సనాతన ధర్మంలో 'ఆదికావ్యం'. ఇది మానవ ధర్మం, సత్యం, కర్తవ్యం మరియు ఆదర్శ సంబంధాలకు పరమోన్నత నిదర్శనం.\n\n> **"రామో విగ్రహవాన్ ధర్మః, సాధుః సత్యపరాక్రమః | రాజా సర్వస్య లోకస్య, దేవానామివ వాసవః ||"**\n*(భావం: శ్రీరాముడు ధర్మానికే సాక్షాత్ ప్రతిరూపం; సద్గుణ సంపన్నుడు, సత్యపరాక్రముడు.)*\n\n**శ్రీమద్రామాయణంలోని 7 కాండలు:**\n1. **బాలకాండ:** శ్రీరామ జననం, తాటక వధ, విశ్వామిత్ర యాగ సంరక్షణ, సీతారామ దివ్య కళ్యాణం.\n2. **అయోధ్యకాండ:** శ్రీరామ పట్టాభిషేక సన్నాహం, కైకేయి వరాలు, పితృవాక్య పరిపాలనకై వనవాస గమనం.\n3. **అరణ్యకాండ:** దండకారణ్య ముని దర్శనాలు, శూర్పణఖ ఘట్టం, మారీచ మాయ, రావణుడు సీతాదేవిని అపహరించడం.\n4. **కిష్కింధాకాండ:** సుగ్రీవ మైత్రి, వాలి వధ, సీతాన్వేషణకై వానర సేనల పయనం.\n5. **సుందరకాండ:** హనుమంతుని సముద్ర లంఘనం, లంకా ప్రవేశం, అశోకవన సీతా దర్శనం, లంకా దహనం.\n6. **యుద్ధకాండ:** రామసేతు నిర్మాణం, విభీషణ శరణాగతి, కుంభకర్ణ-రావణ సంహారం, అయోధ్యా పట్టాభిషేకం.\n7. **ఉత్తరకాండ:** రామరాజ్య పరిపాలన, లవకుశుల గానం, సీతాదేవి భూప్రవేశం.\n\n**ముఖ్య సందేశం:** సత్యం మరియు ధర్మం ఎన్నటికీ ఓడిపోవు. కష్టాలు వచ్చినా ధర్మపథం వీడరాదన్నదే శ్రీరాముని జీవన సందేశం.\n\nమీరు సుందరకాండ విశేషాలు, శ్రీరామ నవమి ప్రాముఖ్యత లేదా రామరాజ్య భావన గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Srimad Ramayana — The Epic of Righteousness\n\nComposed by Sage Valmiki (the *Adi Kavi*), **Srimad Ramayana** consists of 24,000 verses arranged into 7 Kandas (Books). It depicts the ideal human life founded upon absolute truth (*Satya*) and righteousness (*Dharma*).\n\n> **"Ramo Vigrahavan Dharmah, Sadhu Satya-Parakramah"**\n*(Meaning: Sri Rama is the living embodiment of Dharma; virtuous and steadfast in truth.)*\n\n**The Seven Sacred Kandas:**\n1. **Bala Kanda:** The birth of Rama and his brothers, sage Vishwamitra's yagna protection, and marriage to Sita Devi in Mithila.\n2. **Ayodhya Kanda:** Preparations for coronation, Kaikeyi's boons, and Rama's departure to the forest to honor his father's word (*Pitru Vakya Paripalana*).\n3. **Aranya Kanda:** Hermitage life in Dandakaranya, Surpanakha's wrath, golden deer illusion, and Sita Devi's abduction by Ravana.\n4. **Kishkindha Kanda:** Alliance with Sugriva, liberation of Vali, and deployment of search teams.\n5. **Sundara Kanda:** Hanuman's ocean leap, finding Sita in Ashoka Vatika, Lanka Dahanam, and conveying Rama's ring.\n6. **Yuddha Kanda:** Rama Setu bridge construction, Vibhishana's surrender (*Sharanagati*), destruction of Ravana, and grand Ayodhya Pattabhishekam.\n7. **Uttara Kanda:** The righteous reign of Rama Rajya and the ascension of the divine.\n\n**Core Spiritual Lesson:** Truth and righteousness inevitably triumph over arrogance and injustice.\n\nWould you like to explore Sundara Kanda significance, Sri Rama Navami traditions, or the principles of Rama Rajya?`,
        followUps: isTe
          ? ["సుందరకాండ విశిష్టత & పారాయణ ఫలం", "శ్రీరామ పట్టాభిషేకం & రామరాజ్యం", "రామాయణంలో విభీషణ శరణాగతి తత్త్వం"]
          : ["Sundara Kanda significance", "Principles of Rama Rajya", "Vibhishana Sharanagati doctrine"]
      };
    }

    // 2. Mahabharata & Kurukshetra
    if (q.includes("మహాభారత") || q.includes("పాండవ") || q.includes("కౌరవ") || q.includes("కురుక్షేత్ర") || q.includes("mahabharat") || q.includes("pandava") || q.includes("kaurava") || q.includes("kurukshetra") || q.includes("కర్ణ") || q.includes("భీష్మ") || q.includes("ద్రౌపది")) {
      return {
        message: isTe
          ? `### శ్రీ మహాభారతం — పంచమ వేదం & ధర్మ సంగ్రామం\n\nవ్యాస మహర్షి ప్రసాదించిన **మహాభారతం** లక్ష శ్లోకాలతో కూడిన విశ్వ సాహిత్యంలో అతిపెద్ద ఇతిహాసం. దీనిని 'పంచమ వేదం' అని కూడా పిలుస్తారు.\n\n> **"యతో ధర్మస్తతో జయః"** — *ఎక్కడ ధర్మముండునో, అక్కడనే విజయం లభించును.*\n\n**ముఖ్య విశేషాలు:**\n1. **18 పర్వాలు:** ఆది, సభ, అరణ్య, విరాట, ఉద్యోగ, భీష్మ (గీతా ప్రబోధం), ద్రోణ, కర్ణ, శల్య, సౌప్తిక, స్త్రీ, శాంతి, అనుశాసనిక, అశ్వమేధిక, ఆశ్రమవాసిక, మౌసల, మహాప్రస్థానిక, స్వర్గారోహణ పర్వాలు.\n2. **కురుక్షేత్ర మహాసంగ్రామం:** 18 రోజుల పాటు సాగిన ఈ యుద్ధంలో అధర్మాన్ని నమ్ముకున్న కౌరవులు నశించగా, శ్రీకృష్ణుని ఆశ్రయించిన ధర్మపరులైన పాండవులు విజయం సాధించారు.\n3. **జీవిత సత్యాలు:** భీష్ముని ప్రతిజ్ఞ, కర్ణుని దానగుణం, ధర్మరాజు సత్యసంధత, ద్రౌపది మానసంరక్షణ, విదుర నీతి వంటి అనేక జీవిత పాఠాలు ఇందులో ఉన్నాయి.\n\nమీరు భగవద్గీత ఆవిర్భావం, భీష్ముని శాంతిపర్వం లేదా కర్ణుని పాత్ర విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Sri Mahabharata — The Epic of Duty and Destiny\n\nComposed by Sage Veda Vyasa, the **Mahabharata** is the world's longest epic poem, comprising 100,000 shlokas across 18 Parvas (Books).\n\n> **"Yato Dharmastato Jayah"** — *Where there is Dharma, there is Victory.*\n\n**Key Highlights:**\n1. **18 Sacred Parvas:** Beginning from Adi Parva to Swargarohana Parva, tracing the cosmic clash between righteousness (Pandavas) and greed/hubris (Kauravas).\n2. **The Battle of Kurukshetra:** Fought for 18 days on the plains of Kurukshetra, sanctified forever by Bhagavad Gita.\n3. **Timeless Archetypes:** Bhishma's unwavering vows, Karna's peerless generosity, Vidura's ethical counsel (*Vidura Niti*), and Krishna's divine guidance.\n\nWould you like to explore the origins of the Bhagavad Gita, the teachings of Shanti Parva, or Karna's character?`,
        followUps: isTe
          ? ["కురుక్షేత్ర యుద్ధం 18 రోజుల విశేషాలు", "భీష్ముని విష్ణు సహస్రనామ బోధ", "విదుర నీతి ముఖ్య సూత్రాలు"]
          : ["Kurukshetra battle breakdown", "Bhishma's Vishnu Sahasranama sermon", "Vidura Niti wisdom"]
      };
    }

    // 3. Srimad Bhagavad Gita
    if (q.includes("భగవద్గీత") || q.includes("గీత") || q.includes("gita") || q.includes("bhagavad") || q.includes("కర్మయోగ") || q.includes("సాంఖ్యయోగ") || q.includes("కర్మణ్యేవాధికారస్తే")) {
      return {
        message: isTe
          ? `### శ్రీమద్భగవద్గీత — జగద్గురు శ్రీకృష్ణుని దివ్యబోధ\n\nకురుక్షేత్ర యుద్ధరంగంలో కర్తవ్యవిమూఢుడైన అర్జునునికి శ్రీకృష్ణ పరమాత్మ బోధించిన 700 శ్లోకాల పరమ పవిత్ర జ్ఞానభాండాగారం **భగవద్గీత**.\n\n> **"కర్మణ్యేవాధికారస్తే మా ఫలేషు కదాచన | మా కర్మఫలహేతుర్భూర్మా తే సఙ్గోత్స్వకర్మణి ||"** (2.47)\n*(భావం: కర్మ చేయుట యందే నీకు అధికారము కలదు, ఫలితముపై ఎన్నడూ లేదు. ప్రతిఫలాపేక్షతో కర్మ చేయవద్దు, అలాగని కర్మలను విడిచిపెట్టవద్దు.)*\n\n**గీతా త్రివేణీ సంగమం:**\n1. **కర్మయోగం (1-6 అధ్యాయాలు):** నిష్కామ కర్మ ద్వారా చిత్తశుద్ధిని పొందడం.\n2. **భక్తియోగం (7-12 అధ్యాయాలు):** సమస్త కర్మలను భగవదర్పణం చేసి ప్రేమతో శరణాగతి పొందడం.\n3. **జ్ఞానయోగం (13-18 అధ్యాయాలు):** క్షేత్ర-క్షేత్రజ్ఞ వివేకం, గుణత్రయ విభాగం, ఆత్మసాక్షాత్కారం.\n\nమీరు గీతా రెండవ అధ్యాయం (సాంఖ్యయోగం), విశ్వరూప సందర్శనం లేదా నిష్కామ కర్మ సూత్రం గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Srimad Bhagavad Gita — The Divine Song of Sri Krishna\n\nDelivered by Lord Sri Krishna to Arjuna amidst the battlefield of Kurukshetra (Bhishma Parva), the **Bhagavad Gita** contains 700 verses across 18 chapters.\n\n> **"Karmanyevadhikaraste Ma Phaleshu Kadachana | Ma Karmaphalaheturbhurma Te Sango'stvakarmani"** (2.47)\n*(Meaning: You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction.)*\n\n**The Three Great Paths:**\n1. **Karma Yoga (Chapters 1-6):** Selfless action performed without clinging to outcomes.\n2. **Bhakti Yoga (Chapters 7-12):** Loving devotion and surrender to the Supreme Divine.\n3. **Jnana Yoga (Chapters 13-18):** Discriminative wisdom discerning the eternal Self (*Atman*) from the transient body (*Prakriti*).\n\nWould you like to explore Sankhya Yoga, the Cosmic Form (*Vishwaroopa Darshanam*), or meditation principles?`,
        followUps: isTe
          ? ["కర్మయోగం ముఖ్య శ్లోకాలు & వివరణ", "విశ్వరూప సందర్శన యోగం విశేషాలు", "స్థితప్రజ్ఞుని లక్షణాలు ఏమిటి?"]
          : ["Core verses of Karma Yoga", "Vishwaroopa Darshana meaning", "Qualities of a Sthitaprajna"]
      };
    }

    // 4. Lord Shiva & Shaivism
    if (q.includes("శివ") || q.includes("శివుడు") || q.includes("shiva") || q.includes("లింగ") || q.includes("నంది") || q.includes("కైలాస") || q.includes("శివరాత్రి")) {
      return {
        message: isTe
          ? `### పరమశివుడు — సచ్చిదానంద స్వరూపం & శివతత్త్వం\n\nమహాదేవుడు, బోళాశంకరుడు అయిన **పరమశివుడు** లయకారుడు మరియు జ్ఞానప్రదాత. లింగ రూపంలో ఆయన నిరాకార పరబ్రహ్మ తత్త్వాన్ని సూచిస్తాడు.\n\n> **"నమః శంభవే చ మయోభవే చ నమః శంకరాయ చ మయస్కరాయ చ నమః శివాయ చ శివతరాయ చ"**\n\n**శివతత్త్వ రహస్యాలు:**\n1. **గంగాధరుడు & చంద్రశేఖరుడు:** అహంకారాన్ని చల్లార్చే గంగ, మనఃప్రశాంతతనిచ్చే చంద్రకళ.\n2. **నీలకంఠుడు:** లోక రక్షణార్థం హాలాహలాన్ని గొంతులోనే బంధించిన త్యాగమూర్తి.\n3. **ద్వాదశ జ్యోతిర్లింగాలు:** సోమనాథ్, మల్లికార్జున (శ్రీశైలం), మహాకాళేశ్వర్, ఓంకారేశ్వర్, కేదార్‌నాథ్, భీమశంకర్, కాశీ విశ్వనాథ్, త్రయంబకేశ్వర్, వైద్యనాథ్, నాగేశ్వర్, రామేశ్వరం, ఘృష్ణేశ్వర్.\n\nమీరు మహాశివరాత్రి లింగోద్భవ కాలం, శ్రీశైల మల్లికార్జున క్షేత్రం లేదా మహా మృత్యుంజయ మంత్ర విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Shiva — The Auspicious Cosmic Consciousness\n\nRevered as Mahadeva, Lord Shiva embodies transcendence, ascetic mastery, and auspicious transformation.\n\n> **"Om Namah Shivaya"** — The Panchakshari Mantra invoking the 5 cosmic elements.\n\n**Spiritual Symbolism:**\n1. **The Shivalinga:** Represents the formless, infinite pillar of cosmic light (*Jyotirlinga*).\n2. **Neelakantha:** The compassionate savior who consumed Halahala poison during the churning of the ocean to save creation.\n3. **12 Jyotirlingas:** Sacred sanctuaries including Srisailam Mallikarjuna (Andhra Pradesh), Kashi Vishwanath, Somnath, and Rameswaram.\n\nWould you like to explore Maha Shivaratri observances, Srisailam Jyotirlinga, or the Maha Mrityunjaya Mantra?`,
        followUps: isTe
          ? ["మహా మృత్యుంజయ మంత్రం అర్థం", "ద్వాదశ జ్యోతిర్లింగాల క్షేత్రాలు", "మహాశివరాత్రి జాగరణ ఫలితం"]
          : ["Maha Mrityunjaya Mantra meaning", "12 Jyotirlinga locations", "Significance of Shivaratri vigil"]
      };
    }

    // 5. Lord Hanuman
    if (q.includes("హనుమాన్") || q.includes("hanuman") || q.includes("ఆంజనేయ") || q.includes("చాలీసా") || q.includes("chalisa")) {
      return {
        message: isTe
          ? `### శ్రీ ఆంజనేయ స్వామి & హనుమాన్ చాలీసా వైభవం\n\nస్వామి భక్తికి, బలానికి, బుద్ధికి మరియు అచంచల శరణాగతికి ప్రతీక **శ్రీ హనుమంతుడు**.\n\n> **"బుద్ధిర్బలం యశోధైర్యం నిర్భయత్వమరోగతా | అజాడ్యం వాక్పటుత్వంచ హనూమత్ స్మరణాద్భవేత్ ||"**\n*(హనుమంతుని స్మరించడం వల్ల బుద్ధి, బలం, కీర్తి, ధైర్యం, నిర్భయత్వం, ఆరోగ్యం మరియు వాక్చాతుర్యం కలుగుతాయి.)*\n\n**హనుమాన్ చాలీసా విశేషాలు:**\n- గోస్వామి తులసీదాస్ రచించిన 40 చౌపాయిల దివ్య స్తోత్రం.\n- నిత్యం చాలీసా పారాయణ చేయడం వల్ల గ్రహపీడలు, భయాలు మరియు శారీరక మానసిక రుగ్మతలు నశిస్తాయని విశ్వాసం.\n\nమీరు హనుమాన్ చాలీసా పారాయణ విధానం, సుందరకాండలో హనుమ పరాక్రమం లేదా సింధూర ధారణ కథ గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Hanuman & The Splendor of Hanuman Chalisa\n\nLord Hanuman represents the zenith of devotion (*Bhakti*), humility (*Vinaya*), and spiritual strength (*Shakti*).\n\n> **"Buddhir Balam Yasho Dhairyam Nirbhayatvam Arogata"**\n*(By meditating upon Hanuman, one is blessed with intellect, strength, fame, fearlessness, and health.)*\n\n**Hanuman Chalisa Highlights:**\n- Composed by Goswami Tulsidas, comprising 40 poetic chaupais in Awadhi.\n- Celebrated for banishing anxiety, negative energies, and fear.\n\nWould you like to explore the meaning of the Chalisa chaupais or Hanuman's leap across the ocean?`,
        followUps: isTe
          ? ["హనుమాన్ చాలీసా నిత్య పారాయణ ఫలితం", "ఆంజనేయ స్వామికి సింధూరం ఎందుకు ఇష్టం?", "సుందరకాండలో లంకా దహనం ఘట్టం"]
          : ["Benefits of Hanuman Chalisa", "Significance of Sindhooram for Hanuman", "Hanuman's feats in Sundara Kanda"]
      };
    }

    // 6. Pothana & Andhra Mahabhagavatam
    if (q.includes("పోతన") || q.includes("భాగవత") || q.includes("pothana") || q.includes("bhagavatam")) {
      return {
        message: isTe
          ? `### బమ్మెర పోతన & ఆంధ్ర మహాభాగవతం విశిష్టత\n\nబమ్మెర పోతన (15వ శతాబ్దం) తెలుగు సాహిత్యంలో భక్తి రసాన్ని పరమోన్నత శిఖరాలకు చేర్చిన సహజ పండితుడు.\n\n> **"పలికెడిది భాగవతమట, పలికించెడువాడు రామభద్రుండట, నే పలికిన భవహరమగునట, పలికెద వేరొండు గాథ పలుకగనేలా!"**\n\n**ప్రధాన విశేషాలు:**\n1. **మధుర భక్తి & శబ్దం:** పోతన పద్యాల్లో అంత్యప్రాసలు, అనుప్రాసలు, సంగీతాత్మక శైలి అద్భుతంగా ఉంటాయి.\n2. **నరస్తుతి నిరాకరణ:** సర్వజ్ఞ సింగభూపాలుడు వంటి రాజులు కోరినా తన కావ్యాన్ని మానవులకు అంకితం చేయక, శ్రీరామునికే అర్పించిన నిస్వార్థ భక్తుడు.\n3. **ప్రసిద్ధ ఘట్టాలు:** గజేంద్ర మోక్షం, రుక్మిణీ కళ్యాణం, ప్రహ్లాద చరిత్ర, వామన చరిత్రలు తెలుగువారి ఇంట నిత్య పారాయణ రత్నాలు.\n\nమీరు గజేంద్ర మోక్షం పద్యాలు, ప్రహ్లాద చరిత్ర లేదా రుక్మిణీ కళ్యాణం విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Bammera Pothana & Andhra Mahabhagavatam\n\nBammera Pothana (15th century) is celebrated as the *Sahaja Panditha* of Telugu literature for rendering Vyasa's Bhagavata Purana into immortal Telugu poetry.\n\n**Key Highlights:**\n1. **Immortal Dedication:** Rejected royal gifts and dedicated his sacred scripture solely to Lord Sri Rama.\n2. **Celebrated Episodes:** *Gajendra Moksham*, *Prahlada Charitra*, and *Rukmini Kalyanam* remain crown jewels of Telugu devotional poetry.\n\nWould you like to explore verses from Gajendra Moksham, Prahlada's story, or Rukmini's wedding?`,
        followUps: isTe
          ? ["గజేంద్ర మోక్షం పద్యం వివరణ", "రుక్మిణీ కళ్యాణం కథ", "పోతన గురించిన విశేషాలు"]
          : ["Gajendra Moksham verses", "Rukmini Kalyanam story", "Prahlada's devotion"]
      };
    }

    // 7. Vemana & Shataka Literature
    if (q.includes("వేమన") || q.includes("vemana") || q.includes("శతక") || q.includes("విశ్వదాభిరామ")) {
      return {
        message: isTe
          ? `### యోగి వేమన & ప్రజా నీతి పద్యాలు\n\nతెలుగు వారిలో సామాజిక స్పృహ, ఆధ్యాత్మిక సత్యాలు మరియు నీతి మార్గాన్ని సరళమైన ఆటవెలది పద్యాల్లో అందించిన యుగద్రష్ట **యోగి వేమన**.\n\n> **"ఉప్పు కప్పురంబు నొక్క పోలిక నుండు | చూడ చూడ రుచుల జాడ వేరు |\n> పురుషులందు పుణ్యపురుషులు వేరయా | విశ్వదాభిరామ వినుర వేమ!"**\n\n**వేమన శతక విశేషాలు:**\n- బాహ్య డాంబికాలను నిరసించి అంతఃశుద్ధిని ప్రబోధించిన యోగి.\n- సి.పి. బ్రౌన్ (C.P. Brown) వేమన పద్యాలను సేకరించి ఆంగ్లంలోకి అనువదించి ప్రపంచ ఖ్యాతి తెచ్చారు.\n\nమీరు వేమన పద్యాల నీతి సూత్రాలు లేదా సి.పి. బ్రౌన్ సేవలు గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Yogi Vemana — The People's Philosopher\n\nYogi Vemana composed accessible moral verses (*Aata Veladi* meter) emphasizing social reform, inner purity, and practical wisdom, ending with the signature refrain *Viswadabhirama Vinura Vema*.\n\n> **"Uppu Kappurambu Nokka Polika Nundu..."**\n*(Salt and camphor look alike; upon tasting, their true essence is revealed. Likewise, virtuous souls are recognized by their deeds, not appearance.)*\n\nWould you like to explore more Vemana poems, moral teachings, or C.P. Brown's English translations?`,
        followUps: isTe
          ? ["వేమన పద్యాల అంతరార్థం", "సి.పి. బ్రౌన్ తెలుగు సాహిత్య సేవ", "సుమతీ శతక పద్యాలు"]
          : ["Vemana moral principles", "C.P. Brown's literary contributions", "Sumathi Shatakam verses"]
      };
    }

    // 8. Tirumala Venkateswara Swamy
    if (q.includes("తిరుమల") || q.includes("వేంకటేశ్వర") || q.includes("tirumala") || q.includes("tirupati") || q.includes("బాలాజీ")) {
      return {
        message: isTe
          ? `### తిరుమల శ్రీ వేంకటేశ్వర క్షేత్ర వైభవం\n\nతిరుమల సప్తగిరులు (శేషాద్రి, నీలాద్రి, గరుడాద్రి, అంజనాద్రి, వృషభాద్రి, వృషాద్రి, వేంకటాద్రి) పై కొలువైన కలియుగ ప్రత్యక్ష దైవం శ్రీనివాసుడు.\n\n**క్షేత్ర విశేషాలు:**\n1. **వేంకటాద్రి మహత్యం:** 'వేం' అనగా పాపాలు, 'కట' అనగా దహించివేయునది — సర్వ పాపాలను భస్మం చేసే పవిత్ర క్షేత్రం.\n2. **ఆనంద నిలయం:** స్వామివారి గర్భాలయంపై ఉన్న స్వర్ణ విమాన గోపురం.\n3. **వైఖానస ఆగమం:** తోమాల, సుప్రభాతం, అర్చన, నివేదన వంటి నిత్య సేవలు ప్రాచీన వైఖానస సంప్రదాయంలో జరుగుతాయి.\n\nమీరు తిరుమల బ్రహ్మోత్సవాలు లేదా శ్రీనివాస కళ్యాణం కథ గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Divine Glory of Tirumala Sri Venkateswara Swamy\n\nPerched on the sacred Seven Hills of the Eastern Ghats, Tirumala is the eternal abode of Lord Srinivasa, the manifest savior of Kali Yuga.\n\n**Spiritual Highlights:**\n1. **The Name Venkatadri:** 'Vem' (sin) + 'Kata' (destroyer) — the hill that burns away all karmic blemish.\n2. **Ananda Nilayam:** The golden sanctum sanctorum radiating timeless serenity.\n3. **Vaikhanasa Agama:** Ancient rituals unbroken for centuries from morning Suprabhatam to night Ekantha Seva.\n\nWould you like to learn about Brahmotsavams, Srinivasa Kalyanam, or daily temple sevas?`,
        followUps: isTe
          ? ["తిరుమల బ్రహ్మోత్సవాల ప్రాముఖ్యత", "శ్రీనివాస కళ్యాణం కథ", "సుప్రభాతం విశేషాలు"]
          : ["Brahmotsavam significance", "Srinivasa Kalyanam history", "Vaikhanasa traditions"]
      };
    }

    // 9. Festivals (Ugadi, Sankranti, Deepavali)
    if (q.includes("ఉగాది") || q.includes("ugadi") || q.includes("సంక్రాంతి") || q.includes("sankranti") || q.includes("దీపావళి") || q.includes("deepavali") || q.includes("పండుగ")) {
      return {
        message: isTe
          ? `### భారతీయ పండుగలు & వాటి ఆధ్యాత్మిక అంతరార్థం\n\nమన పండుగలు కేవలం సంబరాలు మాత్రమే కాదు; అవి ప్రకృతితో మానవ జీవన సమన్వయాన్ని, సమాజ శ్రేయస్సును మరియు ఆత్మశుద్ధిని కలిగించే పవిత్ర సందర్భాలు.\n\n- **ఉగాది:** తెలుగు నూతన సంవత్సరం. షడ్రుచుల పచ్చడి ద్వారా జీవితంలోని సుఖదుఃఖాలను సమభావంతో స్వీకరించాలని సందేశం ఇస్తుంది.\n- **సంక్రాంతి:** పంటల పండుగ. భోగి, సంక్రాంతి, కనుమ మూడు రోజులు సూర్యుని ఉత్తరాయణ ప్రవేశాన్ని స్వాగతిస్తూ ఆనందోత్సాహాలతో జరుపుకుంటారు.\n- **దీపావళి:** చీకటిపై వెలుగు, అధర్మంపై ధర్మం సాధించిన విజయానికి ప్రతీకగా దీపాలు వెలిగిస్తారు.\n\nమీరు నిర్దిష్ట పండుగ పూజా విధానం లేదా పౌరాణిక విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Traditional Indian Festivals & Their Spiritual Philosophy\n\nEvery festival in Sanatana Dharma aligns human life with nature's cosmic rhythms and moral harmony.\n\n- **Ugadi:** Telugu Lunar New Year celebrated with *Ugadi Pachadi* (six tastes symbolizing life's diverse experiences).\n- **Makara Sankranti:** Three-day harvest festival marking the Sun's transit into Capricorn (*Uttarayana*).\n- **Deepavali:** Festival of Lights symbolizing inner awakening and the conquest of darkness by divine light.\n\nWhich festival would you like to explore in detail?`,
        followUps: isTe
          ? ["ఉగాది షడ్రుచుల అంతరార్థం", "సంక్రాంతి మూడు రోజుల విశేషాలు", "దీపావళి నరకాసుర వధ కథ"]
          : ["Ugadi six tastes philosophy", "Sankranti 3-day customs", "Deepavali spiritual roots"]
      };
    }

    // Default culturally grounded response
    return {
      message: isTe
        ? `### సన్నివేశం సాంస్కృతిక సమాధానం\n\nమీరు అడిగిన ప్రశ్న భారతీయ సంస్కృతి మరియు ఆధ్యాత్మిక వారసత్వానికి చెందినది. సన్నివేశం మేధ ద్వారా మీరు ఈ క్రింది అంశాలను మరింత లోతుగా తెలుసుకోవచ్చు:\n\n1. **ఇతిహాసాలు:** శ్రీమద్రామాయణమ్, మహాభారతం, శ్రీమద్భాగవతం, భగవద్గీత.\n2. **సాహిత్యం & కవులు:** బమ్మెర పోతన, వేమన, కవిత్రయం (నన్నయ, తిక్కన, ఎర్రన), శ్రీశ్రీ, గురజాడ, అన్నమయ్య, త్యాగరాజు.\n3. **పుణ్యక్షేత్రాలు:** తిరుమల, శ్రీశైలం, ద్రాక్షారామం, సింహాచలం, వరంగల్ వేయిస్తంభాల గుడి.\n4. **భాష & వ్యాకరణం:** సంధులు, సమాసాలు, తెలుగు సామెతలు మరియు పదాల అర్థాలు.\n\nకింది ఎంపికల్లో ఒకదాన్ని ఎంచుకోండి లేదా మీ ప్రశ్నను మరింత వివరంగా అడగండి:`
        : `### Sannivesham Cultural Guide\n\nYour question touches upon Indian culture and heritage. Through Sannivesham AI, you can explore:\n\n1. **Epics & Scriptures:** Srimad Ramayana, Mahabharata, Bhagavad Gita, and Bhagavata Purana.\n2. **Literature & Poets:** Bammera Pothana, Yogi Vemana, Kavitrayam, Sri Sri, Gurajada, and Saint Annamacharya.\n3. **Sacred Temples:** Tirumala Venkateswara, Srisailam Mallikarjuna, Warangal Thousand Pillar temple, and Draksharamam.\n4. **Telugu Language & Grammar:** Sandhi, Samasam, proverbs, and classical vocabulary.\n\nPlease choose a topic below or refine your question with specific details:`,
      followUps: isTe
        ? ["శ్రీమద్రామాయణం సంక్షిప్త కథ", "భగవద్గీత ముఖ్య సందేశం", "తిరుమల క్షేత్ర చరిత్ర", "పోతన భాగవత పద్యాలు"]
        : ["Tell about Ramayana", "Core teachings of Bhagavad Gita", "Tirumala Venkateswara lore", "Famous Telugu classical poets"]
    };
  }

  extractFollowUps(text) {
    const questions = [];
    const lines = text.split("\n");
    for (const l of lines) {
      if (l.includes("తెలుసుకోవాలనుకుంటున్నారా") || l.includes("Would you like")) {
        // extract suggested chips if present
      }
    }
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

    bubble.innerHTML = this.formatMarkdown(text);

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

  formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Unordered Lists
    html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

    // Ordered Lists
    html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

    // Line breaks to paragraphs
    html = html.replace(/\n\n+/g, "</p><p>");
    html = "<p>" + html + "</p>";
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p><h3>/g, "<h3>").replace(/<\/h3><\/p>/g, "</h3>");
    html = html.replace(/<p><blockquote>/g, "<blockquote>").replace(/<\/blockquote><\/p>/g, "</blockquote>");
    html = html.replace(/<p><ul>/g, "<ul>").replace(/<\/ul><\/p>/g, "</ul>");

    return html;
  }

  scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }

  initCanvas() {
    const canvas = document.getElementById("medhaCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const symbols = ["✧", "✦", "•", "✨", "అ", "ఆ", "శ్రీ", "ఓం"];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 14 + 10,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        alpha: Math.random() * 0.6 + 0.2,
        alphaSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha > 0.85 || p.alpha < 0.15) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.font = `${p.size}px 'Noto Serif Telugu', serif`;
        ctx.fillStyle = `rgba(255, 209, 102, ${p.alpha})`;
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SanniveshamAIChat());
} else {
  new SanniveshamAIChat();
}
