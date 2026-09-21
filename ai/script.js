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

// Gemini Model & Platform Configuration
// Admin can embed Gemini API key here or configure in Firestore config/gemini doc
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
    const activeKey = PLATFORM_GEMINI_KEY || this.firestoreApiKey || this.geminiApiKey;

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

    // 1. Specific Character: Sri Rama
    if ((q.includes("rama") || q.includes("రాము") || q.includes("శ్రీరామ")) && !q.includes("రామాయణ") && !q.includes("ramayan") && !q.includes("రామదాసు") && !q.includes("ramadasu") && !q.includes("రామనవమి") && !q.includes("rama navami")) {
      return {
        message: isTe
          ? `### శ్రీరామచంద్రమూర్తి — మర్యాదా పురుషోత్తముడు & ధర్మస్వరూపం\n\nసనాతన ధర్మంలో శ్రీరాముడు విష్ణుమూర్తి ఏడవ అవతారం, 'మర్యాదా పురుషోత్తముడు'గా కొలవబడే ఆదర్శ పురుషుడు. అయోధ్య చక్రవర్తి దశరథుడు మరియు కౌసల్యాదేవిల జ్యేష్ఠ పుత్రుడు.\n\n> **"రామో విగ్రహవాన్ ధర్మః, సాధుః సత్యపరాక్రమః | రాజా సర్వస్య లోకస్య, దేవానామివ వాసవః ||"**\n*(భావం: శ్రీరాముడు ధర్మానికే సాక్షాత్ ప్రత్యక్ష రూపం. ఆయన సద్గుణ సంపన్నుడు, సత్యపరాక్రముడు.)*\n\n**శ్రీరాముని ఆదర్శ గుణాలు:**\n- **పితృవాక్య పరిపాలన:** తండ్రి ఇచ్చిన మాటను నిలబెట్టడానికి రాజభోగాలను త్యజించి 14 సంవత్సరాలు వనవాసానికి వెళ్ళిన ఆదర్శ కుమారుడు.\n- **ఏకపత్నీ వ్రతం:** సీతాదేవి పట్ల అచంచలమైన ప్రేమ, అంకితభావం కలిగిన ఏకపత్నీవ్రతుడు.\n- **రామరాజ్య భావన:** ప్రజల సుఖసంతోషాలే పరమావధిగా పాలించిన ఆదర్శ చక్రవర్తి.\n- **శరణాగత రక్షణ:** ఆశ్రయించి వచ్చిన విభీషణుడు, సుగ్రీవుడు వంటి వారిని కులమత విచక్షణ లేకుండా రక్షించిన కరుణామయుడు.\n\nశ్రీరాముని కోదండం, రామసేతు నిర్మాణం లేదా శ్రీరామ నవమి విశేషాల గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Sri Rama — The Embodiment of Righteousness\n\nIn Sanatana Dharma, **Lord Sri Rama** is the seventh avatar of Lord Vishnu and is revered as the *Maryada Purushottama* (the supreme ideal of human conduct). Born to King Dasharatha and Queen Kausalya in Ayodhya, his life is an eternal beacon of truth (*Satya*) and virtue (*Dharma*).\n\n> **"Ramo Vigrahavan Dharmah, Sadhu Satya-Parakramah"**\n*(Meaning: Sri Rama is Dharma personified; steadfast in virtue, truth, and valor.)*\n\n**Defining Ideals:**\n- **Filial Devotion (*Pitru Vakya Paripalana*):** Renounced the golden throne of Ayodhya without a moment's hesitation to honor his father's vow, embracing 14 years of exile.\n- **Unwavering Fidelity:** Celebrated for *Eka-Patni Vrata* (undying devotion to Mata Sita).\n- **Protector of the Surrendered (*Sharanagata Rakshana*):** Welcomed Vibhishana and Sugriva into his refuge unconditionally, honoring humility over heritage.\n- **Rama Rajya:** The gold standard of governance where justice, prosperity, and compassion prevailed without fear or oppression.\n\nWould you like to explore Sri Rama's archery (*Kodanda*), the construction of Rama Setu, or Rama Navami celebrations?`,
        followUps: isTe
          ? ["శ్రీరామ నవమి విశిష్టత & పూజా విధానం", "రామరాజ్య ముఖ్య లక్షణాలు ఏమిటి?", "రామాయణంలో విభీషణ శరణాగతి ఘట్టం"]
          : ["Sri Rama Navami significance", "Principles of Rama Rajya", "Vibhishana Sharanagati story"]
      };
    }

    // 2. Specific Character: Mata Sita
    if (q.includes("sita") || q.includes("సీత") || q.includes("జానకి") || q.includes("వైదేహి") || q.includes("మైథిలి")) {
      return {
        message: isTe
          ? `### సీతాదేవి — సహనశీలత & పవిత్రతకు దివ్య నిదర్శనం\n\nశ్రీరాముని సహధర్మచారిణి అయిన **సీతాదేవి** సాక్షాత్ మహాలక్ష్మి స్వరూపం. మిథిలా నగర చక్రవర్తి జనక మహారాజు భూమిని దున్నుతుండగా నాగటి చాలున జన్మించినందున ఆమెను 'అయోనిజ' అని, భూదేవి పుత్రిక అని పిలుస్తారు.\n\n> **"ఇయం సీతా మమ సుతా సహధర్మచరీ తవ | ప్రతీచ్ఛ చైనాం భద్రం తే పాణిం గృహ్ణీష్వ పాణినా ||"**\n*(జనక మహారాజు రామునికి సీతాదేవిని కన్యాదానం చేస్తూ పలికిన అమృత వాక్కు.)*\n\n**సీతాదేవి విశిష్టతలు:**\n- **త్యాగం & పతివ్రతా ధర్మం:** రాజభవన సుఖాలను తృణప్రాయంగా ఎంచి, భర్త వెన్నంటి 14 ఏళ్ళు దండకారణ్య కష్టాలను భరించింది.\n- **ధైర్యం & నిశ్చలత:** అశోకవనంలో రావణుని ప్రలోభాలకు, రాక్షసుల బెదిరింపులకు చలించక గడ్డిపోచను అడ్డుపెట్టి రావణునికి ధర్మబోధ చేసిన మహా సాధ్వి.\n- **క్షమాగుణం:** లంకా విజయానంతరం తన్ను వేధించిన రాక్షస స్త్రీలను సైతం హనుమంతుని ఆగ్రహం నుంచి కాపాడిన కరుణామయి.\n\nమీరు సీతా కళ్యాణం విశేషాలు లేదా అశోకవనంలో సీతాదేవి మానసిక స్థైర్యం గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Mata Sita — The Supreme Incarnation of Grace & Endurance\n\n**Mata Sita** is revered as the earthly incarnation of Goddess Lakshmi and the divine consort of Lord Sri Rama. Discovered in a furrow of consecrated soil by King Janaka of Mithila, she is known as *Ayonija* (not born of a womb) and the daughter of Mother Earth (*Bhudevi*).\n\n**Timeless Qualities:**\n- **Devotion & Solidarity:** Willingly chose the perils of 14-year forest exile over royal luxury to stand beside her husband.\n- **Spiritual Dignity (*Sati Tejas*):** In Ravana's Ashoka Vatika, she cast aside all mortal fear, holding a simple blade of grass between herself and the tyrant while reminding him of inescapable karmic retribution.\n- **Compassion & Forgiveness:** Forbade Hanuman from harming the demonesses who had tormented her in captivity, declaring that none in this world is entirely without fault (*Na Kaschid Na Aparadhyati*).\n\nWould you like to explore Sita Kalyanam, her dialogues with Sage Anasuya, or the symbolism of her return to Mother Earth?`,
        followUps: isTe
          ? ["సీతా రామ కళ్యాణ ఘట్టం", "అశోకవనంలో సీతాదేవి సంభాషణలు", "సీతాదేవి భూప్రవేశ అంతరార్థం"]
          : ["Sita Rama Kalyanam details", "Sita's dialogue in Ashoka Vatika", "Significance of Sita returning to Bhudevi"]
      };
    }

    // 3. Specific Character: Lakshmana
    if (q.includes("lakshman") || q.includes("లక్ష్మణ") || q.includes("సౌమిత్రి")) {
      return {
        message: isTe
          ? `### లక్ష్మణ స్వామి — నిస్వార్థ భ్రాతృభక్తి శిఖరం\n\nదశరథ మహారాజు, సుమిత్రా దేవిల పుత్రుడు, ఆదిశేషుని అవతారమైన **లక్ష్మణుడు** భ్రాతృభక్తికి మరియు నిరంతర స్వామి సేవకు ప్రతీక.\n\n**లక్ష్మణుని మహోన్నత త్యాగాలు:**\n- **నిద్రాత్యాగం (14 ఏళ్ళు):** అరణ్యవాసంలో సీతారాములకు నిరంతరం కాపలా ఉండేందుకు నిద్రాదేవిని ప్రార్థించి 14 ఏళ్ళు కంటిమీద కునుకు లేకుండా గడిపిన తపశ్శాలి.\n- **ఇంద్రజిత్ వధ:** పరమ వీరుడైన రావణ పుత్రుడు ఇంద్రజిత్తు (మేఘనాథుడు)ని సంహరించగల శక్తి 14 ఏళ్ళు నిద్ర, స్త్రీ ముఖం చూడని నిర్మల బ్రహ్మచారికే సాధ్యమని బ్రహ్మదేవుని వరం. లక్ష్మణుడు తన తపశ్శక్తితో ఇంద్రజిత్తును సంహరించాడు.\n- **ఊర్మిళా త్యాగం:** లక్ష్మణుని భార్య ఊర్మిళ అయోధ్యలో నిద్రావస్థలో ఉంటూ భర్త సంకల్పానికి అండగా నిలిచింది.\n\nలక్ష్మణ రేఖ ఉదంతం లేదా లక్ష్మణ మూర్ఛ - సంజీవని ఘట్టం గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lakshmana — The Paragon of Brotherly Devotion\n\nAn incarnation of Adisesha (the cosmic serpent), **Lakshmana** (Saumitri) is the younger brother of Sri Rama and the absolute embodiment of selfless service (*Kainkarya*).\n\n**Key Feats & Sacrifices:**\n- **14 Years Without Sleep (*Nidra Tyaga*):** Surrendered sleep to guard Rama and Sita day and night across forests, while his devoted wife Urmila bore his slumber in Ayodhya.\n- **Slaying Indrajit (Meghanada):** Brahma had ordained that only an austere soul who had not slept for 14 years and preserved unbroken celibacy could vanquish Indrajit. Lakshmana fulfilled this impossible destiny.\n- **Unflinching Loyalty:** Saw Sri Rama not merely as an elder brother, but as divinity incarnate.\n\nWould you like to explore the Sanjeevani hill episode, Lakshmana Rekha traditions, or Urmila's penance?`,
        followUps: isTe
          ? ["సంజీవని మూలిక & లక్ష్మణ మూర్ఛ", "లక్ష్మణుని ఇంద్రజిత్ వధ రహస్యం", "ఊర్మిళా దేవి త్యాగం విశేషాలు"]
          : ["Sanjeevani herbal revival story", "How Lakshmana defeated Indrajit", "Sacrifice of Urmila in Ayodhya"]
      };
    }

    // 4. Specific Character: Lord Hanuman
    if (q.includes("hanuman") || q.includes("హనుమంతు") || q.includes("ఆంజనేయ") || q.includes("మారుతి") || q.includes("బజరంగబలి") || q.includes("చాలీసా") || q.includes("chalisa")) {
      return {
        message: isTe
          ? `### శ్రీ ఆంజనేయ స్వామి & హనుమాన్ చాలీసా వైభవం\n\nరుద్రావతారుడు, వాయుపుత్రుడు అయిన **శ్రీ హనుమంతుడు** భక్తి, బలం, బుద్ధి, వినయం మరియు నిస్వార్థ సేవకు పరమోన్నత నిదర్శనం. సప్త చిరంజీవులలో ఒకరు.\n\n> **"బుద్ధిర్బలం యశోధైర్యం నిర్భయత్వమరోగతా | అజాడ్యం వాక్పటుత్వంచ హనూమత్ స్మరణాద్భవేత్ ||"**\n*(హనుమంతుని స్మరించడం వల్ల బుద్ధి, బలం, కీర్తి, ధైర్యం, నిర్భయత్వం, ఆరోగ్యం మరియు వాక్చాతుర్యం లభిస్తాయి.)*\n\n**హనుమంతుని దివ్య లీలలు:**\n- **సముద్ర లంఘనం:** 100 యోజనాల మహా సముద్రాన్ని ఒక్క గంతుతో దాటి లంకను చేరిన అద్భుత పరాక్రమం.\n- **లంకా దహనం:** సీతాన్వేషణానంతరం రావణుని అహంకారాన్ని అణచడానికి తన తోకతో లంకానగరాన్ని భస్మం చేశాడు.\n- **సంజీవని పర్వతం:** లక్ష్మణుని ప్రాణరక్షణార్థం ద్రోణగిరి పర్వతాన్నే తన చేతిపై మోసుకువచ్చిన ప్రాణదాత.\n- **హనుమాన్ చాలీసా:** గోస్వామి తులసీదాస్ రచించిన 40 చౌపాయిల పారాయణ సర్వ భయాలను, రోగాలను పోగొడుతుందని భక్తుల విశ్వాసం.\n\nహనుమాన్ చాలీసా శ్లోకాల అర్థాలు లేదా సుందరకాండ పారాయణ ప్రాముఖ్యత గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Hanuman — The Epitome of Devotion, Courage & Wisdom\n\nRevered as an incarnation of Lord Shiva and the son of Vayu and Anjana Devi, **Lord Hanuman** is one of the seven *Chiranjeevis* (immortal beings). He represents the supreme synthesis of limitless physical strength with boundless humility and devotion (*Bhakti*).\n\n> **"Buddhir Balam Yasho Dhairyam Nirbhayatvam Arogata"**\n*(Remembering Hanuman bestows sharp intellect, spiritual strength, fame, courage, fearlessness, and vibrant health.)*\n\n**Legendary Feats:**\n- **The Ocean Leap:** Leapt across the 800-mile ocean to reach Lanka in quest of Mata Sita (*Sundara Kanda*).\n- **Lanka Dahanam:** When Ravana set his tail ablaze, Hanuman used the fire to reduce the golden citadels of pride into ashes.\n- **Lifting the Dronagiri Mountain:** Flew to the Himalayas and carried the entire Sanjeevani mountain on his palm to revive Lakshmana.\n- **Hanuman Chalisa:** 40 divine couplets penned by Goswami Tulsidas that eradicate fear, negativity, and karmic afflictions.\n\nWould you like to explore verses from Hanuman Chalisa, the secrets of Sundara Kanda, or why sindoor is offered to Hanuman?`,
        followUps: isTe
          ? ["హనుమాన్ చాలీసా నిత్య పారాయణ ఫలం", "ఆంజనేయునికి సింధూరం ఎందుకు సమర్పిస్తారు?", "సుందరకాండ పారాయణ విధానం"]
          : ["Hanuman Chalisa line-by-line meaning", "Why sindoor is offered to Hanuman", "Significance of Sundara Kanda Parayanam"]
      };
    }

    // 5. Specific Character: Ravana
    if (q.includes("ravana") || q.includes("రావణ") || q.includes("లంకేశ్వర") || q.includes("దశకంఠ")) {
      return {
        message: isTe
          ? `### లంకేశ్వరుడు రావణుడు — విజ్ఞానం, అహంకారం & పతన పాఠం\n\nరామాయణంలో రావణాసురుడు అత్యంత శక్తిమంతుడైన లంకాధిపతి. విశ్రవస మహర్షి మరియు కైకసిల పుత్రుడు. ఆయన చతుర్వేద పారంగతుడు, గొప్ప శివభక్తుడు మరియు వీణా వాదన విశారదుడు.\n\n**రావణుని వ్యక్తిత్వ విశ్లేషణ:**\n- **శివ తాండవ స్తోత్రం:** పరమశివుని ప్రసన్నం చేసుకోవడానికి రావణుడు స్వయంగా రచించిన అద్భుత స్తోత్రం.\n- **జ్ఞాన సంపద:** జ్యోతిష్యం, సంగీతం, యుద్ధ శాస్త్రాల్లో సాటిలేని పాండిత్యం సంపాదించినా, ధర్మ విహీనుడై ప్రవర్తించాడు.\n- **పతనానికి కారణం:** పరస్త్రీ వ్యామోహం, అమితమైన అహంకారం (అహం-మమకారాలు), సద్గుణవంతులైన విభీషణుని మాటలను పెడచెవిన పెట్టడం ఆయన నాశనానికి దారితీసింది.\n\nరావణుడు రచించిన శివ తాండవ స్తోత్ర విశేషాలు లేదా రావణ పతన నేర్పే నైతిక పాఠాల గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Ravana — The Tragic Convergence of Genius and Hubris\n\nIn the Ramayana, **Ravana** was the king of Lanka, born to Sage Vishrava and Princess Kaikasi. He was a master of the four Vedas, a peerless veena musician, and an ardent devotee of Lord Shiva.\n\n**Key Cultural Dimensions:**\n- **Composer of Shiva Tandava Stotram:** Penned this breathless, thunderous hymn to praise Lord Shiva after trying to lift Mount Kailash.\n- **Vedic Erudition:** Blessed with profound intellect, mastery over celestial weapons, and astronomical knowledge (*Ravana Samhita*).\n- **The Root of Ruin:** Despite vast erudition, uncontrolled desire (*Kama*) and monumental pride (*Ahankara*) led him to kidnap Mata Sita and reject righteous counsel, proving that brilliance without Dharma inevitably perishes.\n\nWould you like to explore Shiva Tandava Stotram verses, Mandodari's counsel, or the final teachings Ravana gave to Lakshmana?`,
        followUps: isTe
          ? ["శివ తాండవ స్తోత్రం విశిష్టత", "మరణశయ్యపై రావణుడు లక్ష్మణునికి చేసిన బోధ", "రావణుని జ్యోతిష గ్రంథం రావణ సంహిత"]
          : ["Shiva Tandava Stotram breakdown", "What Ravana taught Lakshmana before dying", "Lessons of Dharma from Ravana's fall"]
      };
    }

    // 6. Epic Overview: Srimad Ramayana
    if (q.includes("రామాయణ") || q.includes("ramayan") || q.includes("వాల్మీకి") || q.includes("valmiki") || q.includes("సుందరకాండ")) {
      return {
        message: isTe
          ? `### శ్రీమద్రామాయణమ్ — ఆదికావ్యం & 7 కాండల దివ్య ప్రయాణం\n\nవాల్మీకి మహర్షి రచించిన **శ్రీమద్రామాయణం** సనాతన ధర్మంలో 'ఆదికావ్యం'. 24,000 శ్లోకాలతో 7 కాండలుగా విస్తరించిన ఈ ఇతిహాసం సత్యం, ధర్మం మరియు మానవ సంబంధాల ఉత్కృష్టతను చాటుతుంది.\n\n**సప్త కాండలు:**\n1. **బాలకాండ:** శ్రీరామ జననం, విశ్వామిత్ర యాగ రక్షణ, సీతారామ దివ్య కళ్యాణం.\n2. **అయోధ్యకాండ:** పట్టాభిషేక సన్నాహం, కైకేయి వరాలు, పితృవాక్య పరిపాలనకై వనవాస గమనం.\n3. **అరణ్యకాండ:** దండకారణ్య ముని దర్శనాలు, శూర్పణఖ ఘట్టం, మారీచ మాయ, సీతాపహరణం.\n4. **కిష్కింధాకాండ:** సుగ్రీవ మైత్రి, వాలి వధ, సీతాన్వేషణ సేనల పయనం.\n5. **సుందరకాండ:** హనుమ సముద్ర లంఘనం, అశోకవన సీతా దర్శనం, లంకా దహనం.\n6. **యుద్ధకాండ:** రామసేతు నిర్మాణం, విభీషణ శరణాగతి, రావణ సంహారం, పట్టాభిషేకం.\n7. **ఉత్తరకాండ:** రామరాజ్య పాలన, లవకుశుల గానం, సీతాదేవి భూప్రవేశం.\n\nమీరు నిర్దిష్ట కాండ విశేషాలు లేదా రామాయణ నీతి సూత్రాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Srimad Ramayana — The Adi Kavya (First Epic)\n\nComposed by Sage Valmiki, **Srimad Ramayana** comprises 24,000 verses structured into 7 Kandas (Books), chronicling the victory of truth (*Satya*) and Dharma over falsehood.\n\n**The Seven Sacred Kandas:**\n1. **Bala Kanda:** Birth of Rama, Vishwamitra's sacrifice protection, Sita Rama Kalyanam.\n2. **Ayodhya Kanda:** Coronation preparations, Kaikeyi's boons, departure into forest exile.\n3. **Aranya Kanda:** Dandakaranya life, golden deer illusion, Sita's abduction by Ravana.\n4. **Kishkindha Kanda:** Alliance with Sugriva, liberation of Vali, mobilization of search parties.\n5. **Sundara Kanda:** Hanuman's ocean leap, locating Sita in Ashoka Vatika, Lanka Dahanam.\n6. **Yuddha Kanda:** Rama Setu bridge, Vibhishana's surrender, defeat of Ravana, grand Pattabhishekam.\n7. **Uttara Kanda:** The reign of Rama Rajya and eternal spiritual return.\n\nWould you like to explore Sundara Kanda parayanam, the story of Rama Setu, or the teachings of Valmiki?`,
        followUps: isTe
          ? ["సుందరకాండ విశిష్టత & పారాయణ ఫలం", "శ్రీరామ పట్టాభిషేకం & రామరాజ్యం", "రామాయణంలో విభీషణ శరణాగతి తత్త్వం"]
          : ["Sundara Kanda parayanam benefits", "Principles of Rama Rajya", "Vibhishana Sharanagati doctrine"]
      };
    }

    // 7. Specific Character: Lord Krishna
    if (q.includes("krishna") || q.includes("కృష్ణ") || q.includes("శ్రీకృష్ణ") || q.includes("గోపాల") || q.includes("వాసుదేవ") || q.includes("మురళి") || q.includes("గోవర్ధన")) {
      return {
        message: isTe
          ? `### జగద్గురు శ్రీకృష్ణ పరమాత్మ — పూర్ణావతారం & లీలావైభవం\n\nసనాతన ధర్మంలో శ్రీకృష్ణుడు భగవాన్ విష్ణువు యొక్క షోడశ కళా పూర్ణావతారం. ద్వాపర యుగంలో అధర్మాన్ని రూపుమాపి, ధర్మసంస్థాపన చేయడానికి మథురా చెరసాలలో దేవకీ వసుదేవులకు జన్మించాడు.\n\n> **"కృష్ణాయ వాసుదేవాయ దేవకీనందనాయ చ | నందగోపకుమారాయ గోవిందాయ నమో నమః ||"**\n\n**శ్రీకృష్ణుని ముఖ్య ఘట్టాలు:**\n- **బాల్య లీలలు (గోకులం & బృందావనం):** యశోదా వాత్సల్యం, వెన్నదొంగతనం, కాళీయ మర్దనం, గోవర్ధన గిరిధారణ.\n- **కౌరవ సభలో ద్రౌపది రక్షణ:** అక్షయ వస్త్రాలతో ద్రౌపది మానాన్ని కాపాడిన ఆపద్బాంధవుడు.\n- **గీతోపదేశం (కురుక్షేత్రం):** కర్తవ్యవిమూఢుడైన అర్జునునికి విశ్వరూప దర్శనమిచ్చి, భగవద్గీత రూపంలో అమృతజ్ఞానాన్ని అందించిన జగద్గురువు.\n\nశ్రీకృష్ణుని గోవర్ధన పూజ, భగవద్గీత ముఖ్య సందేశం లేదా కృష్ణ లీలల ఆధ్యాత్మిక అంతరార్థం గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Sri Krishna — The Jagadguru and Purna Avatara\n\nRevered as the *Purna Avatara* (complete manifestation) of Lord Vishnu, **Lord Sri Krishna** incarnated in the Dvapara Yuga to destroy tyrannical regimes and establish cosmic righteousness.\n\n> **"Krishnam Vande Jagadgurum"** — *Salutations to Sri Krishna, the spiritual teacher of the entire universe.*\n\n**Key Divine Episodes:**\n- **Gokula & Vrindavana Leelas:** Captivating childhood sports with mother Yashoda, subjugating the serpent Kaliya, and lifting the Govardhana Hill.\n- **Draupadi Vastraharan:** Provided infinite raiment (*Akshaya Vastra*) to protect Draupadi's honor in the assembly of the Kauravas.\n- **Bhagavad Gita on Kurukshetra:** Guided Arjuna through moral paralysis, unveiling the Cosmic Vision (*Vishwaroopa Darshanam*) and eternal paths of Karma, Bhakti, and Jnana.\n\nWould you like to explore Krishna's Govardhana pastime, the core counsel of the Gita, or his teachings on Nishkama Karma?`,
        followUps: isTe
          ? ["గోవర్ధన గిరిధారణ కథ & అంతరార్థం", "భగవద్గీత విశ్వరూప సందర్శన యోగం", "శ్రీకృష్ణ జన్మాష్టమి విశిష్టత"]
          : ["Lifting of Mount Govardhana", "Vishwaroopa Darshana meaning", "Significance of Krishna Janmashtami"]
      };
    }

    // 8. Specific Character: Arjuna
    if (q.includes("arjuna") || q.includes("అర్జున") || q.includes("పార్థ") || q.includes("గాండీవి") || q.includes("ధనంజయ")) {
      return {
        message: isTe
          ? `### గాండీవధారి అర్జునుడు — మధ్యమ పాండవుడు & గీతా శ్రోత\n\nకుంతీదేవి, ఇంద్రుని వరప్రసాదంతో జన్మించిన **అర్జునుడు** ద్వాపరయుగంలో అద్వితీయ ధనుర్ధారి. ద్రోణాచార్యుని ప్రియ శిష్యుడు, పాండవుల విజయానికి మూలస్తంభం.\n\n**అర్జునుని ప్రత్యేకతలు:**\n- **ఏకాగ్రత & సాధన:** ద్రోణుని పరీక్షలో పక్షి కంటిని మాత్రమే చూడగలిగిన ఏకాగ్రతా సాధకుడు. నిద్రను జయించిన 'గుడాకేశుడు'.\n- **పాశుపతాస్త్ర సంపాదన:** కైలాసపతి అయిన పరమశివునితో కిరాత రూపంలో పోరాడి, మెప్పించి అజేయమైన పాశుపతాస్త్రాన్ని పొందిన మహావీరుడు.\n- **గీతోపదేశం:** కురుక్షేత్ర రణరంగంలో శ్రీకృష్ణునికి శరణాగతుడై విశ్వమానవాళికి ఉపయోగపడే భగవద్గీతను లోకానికి ఇప్పించిన కారణజన్ముడు.\n\nఅర్జునుని గాండీవ విల్లు చరిత్ర లేదా శ్రీకృష్ణార్జునుల సఖ్య భక్తి గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Arjuna — The Incomparable Archer & Disciple of Krishna\n\nThe third of the Pandavas, born to Queen Kunti by the grace of Indra, **Arjuna** (Dhananjaya, Partha) is the archetype of disciplined mastery and sincere spiritual inquiry.\n\n**Defining Milestones:**\n- **Singular Focus (*Ekaagrata*):** Renowned during Guru Dronacharya's archery tests for perceiving solely the eye of the target bird, mastering weapons in total darkness (*Gudakesha*).\n- **Pashupatastra Penance:** Waged a mystical duel with Lord Shiva in the guise of a hunter (*Kirata*) on Mount Indrakeeladri (Vijayawada), winning the supreme celestial weapon.\n- **The Recipient of the Gita:** In moral despair on the Kurukshetra battlefield, his humble surrender transformed him from a conflicted warrior into the instrument of cosmic Dharma.\n\nWould you like to explore Arjuna's Gandiva bow lore, the Kiratarjuniya episode at Vijayawada, or Krishna-Arjuna camaraderie?`,
        followUps: isTe
          ? ["ఇంద్రకీలాద్రిపై అర్జునుని తపస్సు (విజయవాడ)", "గాండీవ ధనుస్సు ఆవిర్భావ కథ", "శ్రీకృష్ణార్జునుల సఖ్య భక్తి విశేషాలు"]
          : ["Arjuna's penance at Indrakeeladri", "Origins of the Gandiva Bow", "Krishna and Arjuna friendship"]
      };
    }

    // 9. Specific Character: Karna
    if (q.includes("karna") || q.includes("కర్ణ") || q.includes("దానవీర") || q.includes("రాధేయ")) {
      return {
        message: isTe
          ? `### దానవీర కర్ణుడు — అంగరాజ్యం & అసమాన త్యాగశీలి\n\nసూర్యభగవానుని అనుగ్రహంతో కుంతీదేవికి జన్మించిన జ్యేష్ఠ పాండవుడు **కర్ణుడు**. సూతపుత్రుడైన అధిరథుడు, రాధల వద్ద పెరిగినందున 'రాధేయుడు' అని పిలవబడ్డాడు.\n\n**కర్ణుని ప్రసిద్ధ గుణాలు:**\n- **సాటిలేని దానగుణం:** తన ప్రాణరక్షకమైన సహజ కవచ కుండలాలను సైతం బ్రాహ్మణ రూపంలో వచ్చిన దేవేంద్రుడు అడిగిన వెంటనే సంతోషంగా దానం చేసిన మహా త్యాగి.\n- **స్నేహ ధర్మం:** తనను అవమానాల నుంచి కాపాడి అంగరాజ్యానికి పట్టాభిషేకం చేసిన దుర్యోధనుని కోసం ధర్మరాజును ఎదిరించి ప్రాణాలర్పించిన నిష్కళంక మిత్రుడు.\n- **విధి వంచిత జీవితం:** పరశురాముని శాపం, తల్లి కుంతి రహస్యం, కవచ కుండలాల దానం వంటి పరిస్థితుల వల్ల కురుక్షేత్రంలో వీరమరణం పొందాడు.\n\nకర్ణుని కవచ కుండలాల దాన ఘట్టం లేదా కుంతి-కర్ణుల సంభాషణ గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Karna — The Noble Prince of Unmatched Generosity\n\nThe eldest son of Kunti, blessed by Surya Deva and raised by Adhiratha and Radha, **Karna** (Radheya, Vaikartana) is one of Indian literature's most profound and tragic figures.\n\n**Heroic Dimensions:**\n- **Incomparable Generosity (*Dana Veera*):** Bound by his vow never to turn away any suppliant, he sliced away his celestial golden armor (*Kavacha*) and earrings (*Kundala*) to give to Indra.\n- **Unwavering Friendship:** When Duryodhana stood by him in the tournament of Hastinapura, Karna pledged his lifelong loyalty, remaining true to his friend even upon discovering his divine Pandava royal birth.\n- **Destiny & Nobility:** Despite curses and insurmountable odds, he fought with immense dignity until his final breath on the battlefield.\n\nWould you like to explore Karna's dialogue with Kunti, his final moments, or his archery contest with Arjuna?`,
        followUps: isTe
          ? ["కర్ణుని కవచ కుండలాల దాన ఘట్టం", "కుంతీదేవి కర్ణుని రహస్యం వెల్లడించిన సందర్భం", "కురుక్షేత్రంలో కర్ణుని వీరమరణం"]
          : ["Karna parting with his divine armor", "Kunti's emotional meeting with Karna", "Karna's duel with Arjuna"]
      };
    }

    // 10. Specific Character: Draupadi
    if (q.includes("draupadi") || q.includes("ద్రౌపది") || q.includes("పాంచాలి") || q.includes("యాజ్ఞసేని")) {
      return {
        message: isTe
          ? `### ద్రౌపదీ దేవి — యాజ్ఞసేని & సతీధర్మ స్వరూపిణి\n\nపాంచాల రాజైన దృపద మహారాజు చేసిన పుత్రకామేష్టి యజ్ఞగుండం నుండి ఉద్భవించిన అగ్నిపుత్రిక **ద్రౌపది**. పాండవుల ధర్మపత్ని, నిరంతర ఆత్మగౌరవ ప్రతీక.\n\n**ద్రౌపది విశిష్టతలు:**\n- **యాజ్ఞసేని & ఆత్మగౌరవం:** అగ్ని నుండి జన్మించిన తేజస్విని. కౌరవ సభలో నిండు సభను నిలదీసి ధర్మం గురించి ప్రశ్నించిన అద్భుత మేధావి.\n- **అచంచల శ్రీకృష్ణ భక్తి:** ద్యూత సభలో దుశ్శాసనుడు వస్త్రాపహరణం చేయబోగా, సర్వ మానవ ప్రయత్నాలు వీడి చేతులెత్తి కృష్ణునికి శరణాగతి వేడిన భక్తాగ్రేసరి. శ్రీకృష్ణుడు అక్షయ వస్త్రాలు ప్రసాదించి ఆమె మానాన్ని కాపాడాడు.\n- **ధర్మ సహచరి:** పాండవులు అరణ్య, అజ్ఞాతవాసాల్లో పడిన సమస్త కష్టాలను చిరునవ్వుతో పంచుకున్న ఆదర్శ సహధర్మచారిణి.\n\nద్రౌపది మాన సంరక్షణ కథ లేదా ద్రౌపది ప్రశ్నించిన ధర్మ సూత్రాల గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Draupadi — The Fiery Daughter of the Sacrificial Fire\n\nBorn from the sacred sacrificial altar (*Yajna*) of King Drupada of Panchala, **Draupadi** (Yajnaseni, Panchali) is a titan of moral courage, intellect, and steadfast faith in the Mahabharata.\n\n**Defining Moments:**\n- **The Query in the Kuru Court:** When dragged into the gambling hall, she fearlessly challenged Bhishma, Drona, and Dhritarashtra on the ethical validity of mortgaging human dignity.\n- **Absolute Surrender (*Sharanagati*):** In her hour of utmost trial during the attempted disrobing (*Vastraharan*), letting go of mortal hope and calling upon Sri Krishna with upraised hands brought forth endless yards of divine silk.\n- **Resilience:** Walked through 12 years of wild forest exile and a year in disguise beside the Pandavas with unbroken regal poise.\n\nWould you like to explore the spiritual meaning of Vastraharan, Draupadi's Akshaya Patra, or her dialogues with Krishna?`,
        followUps: isTe
          ? ["ద్రౌపది వస్త్రాపహరణం & అక్షయ వస్త్ర రక్షణ", "సూర్యభగవానుడు ఇచ్చిన అక్షయపాత్ర కథ", "కురుసభలో ద్రౌపది సంధించిన ధర్మ ప్రశ్నలు"]
          : ["The miracle of Draupadi's divine protection", "The legend of the Akshaya Patra", "Draupadi's ethical debate in the Kuru court"]
      };
    }

    // 11. Epic Overview: Mahabharata & Kurukshetra
    if (q.includes("మహాభారత") || q.includes("పాండవ") || q.includes("కౌరవ") || q.includes("కురుక్షేత్ర") || q.includes("mahabharat") || q.includes("pandava") || q.includes("kaurava") || q.includes("kurukshetra") || q.includes("భీష్మ") || q.includes("విదుర")) {
      return {
        message: isTe
          ? `### శ్రీ మహాభారతం — పంచమ వేదం & ధర్మ సంగ్రామం\n\nవ్యాస మహర్షి ప్రసాదించిన **మహాభారతం** లక్ష శ్లోకాలతో కూడిన విశ్వ సాహిత్యంలో అతిపెద్ద ఇతిహాసం. దీనిని 'పంచమ వేదం' అని కూడా పిలుస్తారు.\n\n> **"యతో ధర్మస్తతో జయః"** — *ఎక్కడ ధర్మముండునో, అక్కడనే విజయం లభించును.*\n\n**ముఖ్య విశేషాలు:**\n1. **18 పర్వాలు:** ఆది, సభ, అరణ్య, విరాట, ఉద్యోగ, భీష్మ (గీతా ప్రబోధం), ద్రోణ, కర్ణ, శల్య, సౌప్తిక, స్త్రీ, శాంతి, అనుశాసనిక, అశ్వమేధిక, ఆశ్రమవాసిక, మౌసల, మహాప్రస్థానిక, స్వర్గారోహణ పర్వాలు.\n2. **కురుక్షేత్ర మహాసంగ్రామం:** 18 రోజుల పాటు సాగిన ఈ యుద్ధంలో అధర్మాన్ని నమ్ముకున్న కౌరవులు నశించగా, శ్రీకృష్ణుని ఆశ్రయించిన ధర్మపరులైన పాండవులు విజయం సాధించారు.\n3. **జీవిత సత్యాలు:** భీష్ముని ప్రతిజ్ఞ, కర్ణుని దానగుణం, ధర్మరాజు సత్యసంధత, ద్రౌపది మానసంరక్షణ, విదుర నీతి వంటి అనేక జీవిత పాఠాలు ఇందులో ఉన్నాయి.\n\nమీరు భగవద్గీత ఆవిర్భావం, భీష్ముని శాంతిపర్వం లేదా కురుక్షేత్ర యుద్ధ 18 రోజుల విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Sri Mahabharata — The Great Epic of Righteousness\n\nAuthored by Sage Veda Vyasa, the **Mahabharata** is the world's grandest epic poem, comprising 100,000 verses across 18 Parvas (Books). Often hailed as the *Fifth Veda*, it maps every shade of human motive, duty, and destiny.\n\n> **"Yato Dharmastato Jayah"** — *Where there is Dharma, there is Victory.*\n\n**Key Highlights:**\n1. **18 Sacred Parvas:** Ranging from Adi Parva to Swargarohana Parva, chronicling the generational rise and struggle between the Pandavas and Kauravas.\n2. **The 18-Day Kurukshetra War:** A cosmic cleansing where tyrannical adharma was eradicated under the divine wheel of Sri Krishna.\n3. **Treasury of Wisdom:** Includes the Bhagavad Gita, the Vishnu Sahasranama, the Vidura Niti, and the timeless discourses of Bhishma in Shanti Parva.\n\nWould you like to explore the 18 days of Kurukshetra, the sermon of the Bhagavad Gita, or Vidura Niti ethics?`,
        followUps: isTe
          ? ["కురుక్షేత్ర యుద్ధం 18 రోజుల విశేషాలు", "భీష్ముని విష్ణు సహస్రనామ బోధ", "విదుర నీతి ముఖ్య సూత్రాలు"]
          : ["Kurukshetra 18-day timeline", "Bhishma's revelation of Vishnu Sahasranama", "Vidura Niti principles"]
      };
    }

    // 12. Scripture: Srimad Bhagavad Gita
    if (q.includes("భగవద్గీత") || q.includes("గీత") || q.includes("gita") || q.includes("bhagavad") || q.includes("కర్మయోగ") || q.includes("కర్మణ్యేవాధికారస్తే")) {
      return {
        message: isTe
          ? `### శ్రీమద్భగవద్గీత — జగద్గురు శ్రీకృష్ణుని దివ్యబోధ\n\nకురుక్షేత్ర యుద్ధరంగంలో కర్తవ్యవిమూఢుడైన అర్జునునికి శ్రీకృష్ణ పరమాత్మ బోధించిన 700 శ్లోకాల పరమ పవిత్ర జ్ఞానభాండాగారం **భగవద్గీత**.\n\n> **"కర్మణ్యేవాధికారస్తే మా ఫలేషు కదాచన | మా కర్మఫలహేతుర్భూర్మా తే సఙ్గోత్స్వకర్మణి ||"** (2.47)\n*(భావం: కర్మ చేయుట యందే నీకు అధికారము కలదు, ఫలితముపై ఎన్నడూ లేదు. ప్రతిఫలాపేక్షతో కర్మ చేయవద్దు, అలాగని కర్మలను విడిచిపెట్టవద్దు.)*\n\n**గీతా త్రివేణీ సంగమం:**\n1. **కర్మయోగం (1-6 అధ్యాయాలు):** నిష్కామ కర్మ ద్వారా చిత్తశుద్ధిని పొందడం.\n2. **భక్తియోగం (7-12 అధ్యాయాలు):** సమస్త కర్మలను భగవదర్పణం చేసి ప్రేమతో శరణాగతి పొందడం.\n3. **జ్ఞానయోగం (13-18 అధ్యాయాలు):** క్షేత్ర-క్షేత్రజ్ఞ వివేకం, గుణత్రయ విభాగం, ఆత్మసాక్షాత్కారం.\n\nమీరు గీతా రెండవ అధ్యాయం (సాంఖ్యయోగం), విశ్వరూప సందర్శనం లేదా నిష్కామ కర్మ సూత్రం గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Srimad Bhagavad Gita — The Divine Song of Sri Krishna\n\nSpoken by Lord Sri Krishna to Arjuna amidst the battlefield of Kurukshetra, the **Bhagavad Gita** contains 700 verses across 18 chapters.\n\n> **"Karmanyevadhikaraste Ma Phaleshu Kadachana | Ma Karmaphalaheturbhurma Te Sango'stvakarmani"** (2.47)\n*(Meaning: You have a right to your duty, but not to the fruits thereof. Let not the fruit of action be your motive, nor let your attachment be to inaction.)*\n\n**The Three Great Paths:**\n1. **Karma Yoga (Chapters 1-6):** Selfless action dedicated to the universal good without clinging to outcomes.\n2. **Bhakti Yoga (Chapters 7-12):** Surrender and loving communion with the Supreme.\n3. **Jnana Yoga (Chapters 13-18):** Discerning eternal Consciousness (*Atman*) from transient nature (*Prakriti*).\n\nWould you like to explore Sankhya Yoga, the Cosmic Form (*Vishwaroopa Darshanam*), or the marks of an enlightened being (*Sthitaprajna*)?`,
        followUps: isTe
          ? ["కర్మయోగం ముఖ్య శ్లోకాలు & వివరణ", "విశ్వరూప సందర్శన యోగం విశేషాలు", "స్థితప్రజ్ఞుని లక్షణాలు ఏమిటి?"]
          : ["Core verses of Karma Yoga", "Vishwaroopa Darshanam meaning", "Qualities of a Sthitaprajna"]
      };
    }

    // 13. Lord Shiva & Shaivism
    if (q.includes("శివ") || q.includes("శివుడు") || q.includes("shiva") || q.includes("లింగ") || q.includes("నంది") || q.includes("కైలాస") || q.includes("జ్యోతిర్లింగ")) {
      return {
        message: isTe
          ? `### పరమశివుడు — సచ్చిదానంద స్వరూపం & శివతత్త్వం\n\nమహాదేవుడు, భోళాశంకరుడు అయిన **పరమశివుడు** లయకారుడు మరియు జ్ఞానప్రదాత. లింగ రూపంలో ఆయన నిరాకార పరబ్రహ్మ తత్త్వాన్ని సూచిస్తాడు.\n\n> **"నమః శంభవే చ మయోభవే చ నమః శంకరాయ చ మయస్కరాయ చ నమః శివాయ చ శివతరాయ చ"**\n\n**శివతత్త్వ రహస్యాలు:**\n1. **గంగాధరుడు & చంద్రశేఖరుడు:** అహంకారాన్ని చల్లార్చే గంగ, మనఃప్రశాంతతనిచ్చే చంద్రకళ.\n2. **నీలకంఠుడు:** లోక రక్షణార్థం హాలాహలాన్ని గొంతులోనే బంధించిన త్యాగమూర్తి.\n3. **ద్వాదశ జ్యోతిర్లింగాలు:** సోమనాథ్, మల్లికార్జున (శ్రీశైలం), మహాకాళేశ్వర్, ఓంకారేశ్వర్, కేదార్‌నాథ్, భీమశంకర్, కాశీ విశ్వనాథ్, త్రయంబకేశ్వర్, వైద్యనాథ్, నాగేశ్వర్, రామేశ్వరం, ఘృష్ణేశ్వర్.\n\nమీరు మహాశివరాత్రి లింగోద్భవ కాలం, శ్రీశైల మల్లికార్జున క్షేత్రం లేదా మహా మృత్యుంజయ మంత్ర విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Shiva — The Auspicious Supreme Consciousness\n\nRevered as Mahadeva, Lord Shiva personifies ascetic grandeur, cosmic destruction of ignorance, and transcendent peace. The Shivalinga represents the formless, infinite pillar of cosmic light (*Jyotirlinga*).\n\n> **"Om Namah Shivaya"** — The sacred Panchakshari Mantra invoking the 5 elements.\n\n**Spiritual Symbolism:**\n1. **Neelakantha:** Held the deadly Halahala poison in his throat to preserve the universe during the churning of the cosmic ocean.\n2. **Nataraja:** The cosmic dance of creation, sustenance, dissolution, concealment, and grace.\n3. **12 Jyotirlingas:** Holy sanctuaries across India, anchored in Andhra Pradesh by Srisailam Mallikarjuna Swamy.\n\nWould you like to explore Maha Shivaratri observances, Srisailam Jyotirlinga lore, or the Maha Mrityunjaya Mantra?`,
        followUps: isTe
          ? ["మహా మృత్యుంజయ మంత్రం అర్థం", "ద్వాదశ జ్యోతిర్లింగాల క్షేత్రాలు", "మహాశివరాత్రి జాగరణ ఫలితం"]
          : ["Maha Mrityunjaya Mantra meaning", "12 Jyotirlinga locations", "Significance of Shivaratri vigil"]
      };
    }

    // 14. Lord Vishnu & Dashavatara
    if (q.includes("విష్ణు") || q.includes("vishnu") || q.includes("నారాయణ") || q.includes("దశావతార") || q.includes("dashavatara")) {
      return {
        message: isTe
          ? `### శ్రీమహావిష్ణువు & దశావతారాల దివ్య వైభవం\n\nసృష్టి స్థితి లయకారులలో స్థితికారకుడు, లోకసంరక్షకుడు **శ్రీమహావిష్ణువు**. క్షీరసాగరంలో శేషతల్పంపై శయనించే నారాయణుడు ధర్మసంరక్షణార్థం యుగయుగాల్లో అవతరిస్తాడు.\n\n> **"పరిత్రాణాయ సాధూనాం వినాశాయ చ దుష్కృతామ్ | ధర్మసంస్థాపనార్థాయ సంభవామి యుగే యుగే ||"**\n\n**శ్రీమహావిష్ణువు దశావతారాలు:**\n1. **మత్స్యావతారం:** వేదాల సంరక్షణ.\n2. **కూర్మావతారం:** క్షీరసాగర మథనంలో మందర పర్వతానికి ఆధారంగా.\n3. **వరాహావతారం:** హిరణ్యాక్షుని వధించి భూదేవిని ఉద్ధరించడం.\n4. **నరసింహావతారం:** భక్త ప్రహ్లాదుని రక్షణకై హిరణ్యకశిపుని సంహారం.\n5. **వామనావతారం:** బలి చక్రవర్తి అహంకారాన్ని అణచి ముల్లోకాలను కొలవడం.\n6. **పరశురామావతారం:** అధర్మ క్షత్రియుల నిర్మూలన.\n7. **శ్రీరామావతారం:** పితృవాక్య పరిపాలన, ధర్మ సంస్థాపన.\n8. **శ్రీకృష్ణావతారం:** గీతోపదేశం, లీలా మాధుర్యం.\n9. **బుద్ధావతారం / బలరామావతారం:** అహింసా మార్గం.\n10. **కల్కి అవతారం:** కలియుగాంతంలో అధర్మ నిర్మూలన.\n\nమీరు నరసింహావతార ప్రాముఖ్యత లేదా విష్ణు సహస్రనామ వైభవం గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Sri Maha Vishnu & The Ten Divine Avatars (Dashavatara)\n\nIn Sanatana Dharma, **Lord Vishnu** is the Preserver of creation who rests on the cosmic serpent Adisesha in the Ocean of Milk (*Kshirasagara*). Whenever cosmic order falters, he descends as an avatar.\n\n**The Ten Canonical Avatars:**\n1. **Matsya (Fish):** Rescued the Vedas and Manu during the great deluge.\n2. **Kurma (Tortoise):** Supported Mount Mandara during the churning of the ocean.\n3. **Varaha (Boar):** Slew Hiranyaksha and lifted Mother Earth from the cosmic abyss.\n4. **Narasimha (Man-Lion):** Emerged from a pillar to protect child devotee Prahlada and destroy Hiranyakashipu.\n5. **Vamana (Dwarf Brahmin):** Measured the three worlds in three strides to redeem King Bali.\n6. **Parashurama (Warrior Sage):** Rid the earth of tyrannical warlords 21 times.\n7. **Sri Rama:** Perfect human ideal (*Maryada Purushottama*) who vanquished Ravana.\n8. **Sri Krishna:** Cosmic teacher (*Jagadguru*) and speaker of the Bhagavad Gita.\n9. **Buddha / Balarama:** Harbinger of compassion and non-violence.\n10. **Kalki:** The prophesied future rider on the white horse who cleanses Kali Yuga.\n\nWould you like to explore Narasimha Swamy's manifestation, the Vishnu Sahasranama, or Vamana Avatara?`,
        followUps: isTe
          ? ["నరసింహావతార వైభవం & ప్రహ్లాద భక్తి", "విష్ణు సహస్రనామ స్తోత్ర విశేషాలు", "వామనావతారం & బలి చక్రవర్తి కథ"]
          : ["Narasimha Avatara details", "Vishnu Sahasranama benefits", "Vamana Avatara and Bali's surrender"]
      };
    }

    // 15. Lord Ganesha
    if (q.includes("ganesha") || q.includes("వినాయక") || q.includes("గణపతి") || q.includes("విఘ్నేశ్వర") || q.includes("లంబోదర")) {
      return {
        message: isTe
          ? `### విఘ్నేశ్వరుడు — ప్రథమ పూజితుడు & బుద్ధి ప్రదాత\n\nపరమశివుడు, పార్వతీదేవిల జ్యేష్ఠ పుత్రుడైన **శ్రీ గణపతి** సర్వ కార్యాల ప్రారంభంలో తొలి పూజలందుకునే ప్రథమ పూజ్యుడు. విఘ్నాలను తొలగించే విఘ్నహర్త.\n\n> **"శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజమ్ | ప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ||"**\n\n**గణపతి దివ్య ప్రతీకలు:**\n- **ఏకదంతం:** మహాభారత లేఖనం కోసం తన దంతాన్ని సైతం విరిచి కలంగా మార్చిన విద్యా త్యాగి.\n- **మోదకం:** జ్ఞానానందానికి ప్రతీక.\n- **మూషిక వాహనం:** కోరికలు, కామక్రోధాలనే ఎలుకను తన అదుపులో ఉంచుకునే ఆత్మనిగ్రహ ప్రతీక.\n- **వినాయక చవితి:** భాద్రపద శుద్ధ చతుర్థి నాడు మట్టి విగ్రహాలను ప్రతిష్టించి, 21 రకాల పత్రులతో (ఏకవింశతి పత్ర పూజ) పూజించి గంగా నిమజ్జనం చేయడం తెలుగువారి ప్రసిద్ధ సంప్రదాయం.\n\nఏకవింశతి పత్ర పూజ ప్రాముఖ్యత లేదా వినాయక చవితి వ్రత కథ గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Lord Sri Ganesha — The Lord of Beginnings & Wisdom\n\nThe elder son of Lord Shiva and Goddess Parvati, **Lord Ganesha** (Vinayaka, Ganapati) is the first worshipped deity (*Prathama Pujya*) in any sacred rite. He removes obstacles (*Vighnaharta*) and bestows discriminative intellect (*Buddhi*).\n\n**Sacred Symbolism:**\n- **Ekadanta (Single Tusk):** Sacrificed his own tusk to write down the Mahabharata as Sage Vyasa dictated without pause.\n- **Modaka Sweet:** Symbolizes the ultimate inner bliss of self-realization.\n- **Mushika (Mouse):** Riding a mouse symbolizes mastery over restless worldly desires and ego.\n- **Vinayaka Chaturthi:** Celebrated on Bhadrapada Shukla Chaturthi with unbaked clay murtis, worship using 21 sacred medicinal leaves (*Ekavimshati Patra Puja*), and joyful immersion.\n\nWould you like to explore the 21 medicinal leaves of Ganesha Puja, the story of Syamantaka Mani, or Ganapati Atharvashirsha?`,
        followUps: isTe
          ? ["వినాయక చవితి 21 రకాల పత్రుల విశిష్టత", "శమంతకమణి కథ & వినాయక వ్రత కథ", "గణపతి అధర్వశీర్ష స్తోత్రం"]
          : ["The 21 medicinal leaves of Ganesha Puja", "Story of Syamantaka Mani", "Ganapati Atharvashirsha meaning"]
      };
    }

    // 16. Tirumala Venkateswara Swamy
    if (q.includes("తిరుమల") || q.includes("వేంకటేశ్వర") || q.includes("tirumala") || q.includes("tirupati") || q.includes("బాలాజీ") || q.includes("శ్రీనివాస")) {
      return {
        message: isTe
          ? `### తిరుమల శ్రీ వేంకటేశ్వర క్షేత్ర వైభవం\n\nతిరుమల సప్తగిరులు (శేషాద్రి, నీలాద్రి, గరుడాద్రి, అంజనాద్రి, వృషభాద్రి, వృషాద్రి, వేంకటాద్రి) పై కొలువైన కలియుగ ప్రత్యక్ష దైవం శ్రీనివాసుడు.\n\n**క్షేత్ర విశేషాలు:**\n1. **వేంకటాద్రి మహత్యం:** 'వేం' అనగా పాపాలు, 'కట' అనగా దహించివేయునది — సర్వ పాపాలను భస్మం చేసే పవిత్ర క్షేత్రం.\n2. **ఆనంద నిలయం:** స్వామివారి గర్భాలయంపై ఉన్న స్వర్ణ విమాన గోపురం.\n3. **వైఖానస ఆగమం:** తోమాల, సుప్రభాతం, అర్చన, నివేదన వంటి నిత్య సేవలు ప్రాచీన వైఖానస సంప్రదాయంలో జరుగుతాయి.\n\nమీరు తిరుమల బ్రహ్మోత్సవాలు లేదా శ్రీనివాస కళ్యాణం కథ గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Divine Glory of Tirumala Sri Venkateswara Swamy\n\nPerched on the sacred Seven Hills of the Eastern Ghats, Tirumala is the eternal abode of Lord Srinivasa, the manifest savior of Kali Yuga.\n\n**Spiritual Highlights:**\n1. **The Name Venkatadri:** 'Vem' (sin) + 'Kata' (destroyer) — the hill that burns away all karmic blemish.\n2. **Ananda Nilayam:** The golden sanctum sanctorum radiating timeless serenity.\n3. **Vaikhanasa Agama:** Ancient rituals unbroken for centuries from morning Suprabhatam to night Ekantha Seva.\n\nWould you like to learn about Brahmotsavams, Srinivasa Kalyanam, or daily temple sevas?`,
        followUps: isTe
          ? ["తిరుమల బ్రహ్మోత్సవాల ప్రాముఖ్యత", "శ్రీనివాస కళ్యాణం కథ", "సుప్రభాతం విశేషాలు"]
          : ["Brahmotsavam significance", "Srinivasa Kalyanam history", "Vaikhanasa traditions"]
      };
    }

    // 17. Srisailam & Jyotirlinga
    if (q.includes("శ్రీశైలం") || q.includes("srisailam") || q.includes("మల్లికార్జున") || q.includes("భ్రమరాంబ")) {
      return {
        message: isTe
          ? `### శ్రీశైల క్షేత్ర వైభవం — మల్లికార్జున జ్యోతిర్లింగం & భ్రమరాంబికా శక్తిపీఠం\n\nకృష్ణా తీరంలో నల్లమల అటవీ పర్వత శ్రేణులలో వెలసిన **శ్రీశైలం** ద్వాదశ జ్యోతిర్లింగాలలో రెండవది, అష్టాదశ శక్తిపీఠాలలో ఒకటైన దివ్య క్షేత్రం.\n\n**శ్రీశైల దివ్య విశేషాలు:**\n- **మల్లికార్జున స్వామి:** పార్వతీదేవి మల్లెపూలతో పూజించినందున మల్లికార్జునుడని ప్రసిద్ధి.\n- **భ్రమరాంబా దేవి:** అష్టాదశ శక్తిపీఠాలలో ఒకటైన అమ్మవారు భ్రమరాల (తుమ్మెదల) రూపంలో అరుణాసురుని సంహరించిన రక్షణమూర్తి.\n- **భక్తులు స్వయంగా అభిషేకం:** కులమత భేదం లేకుండా భక్తులే స్వయంగా గర్భాలయంలోని శివలింగాన్ని తాకి పూజించే అరుదైన సంప్రదాయం ఇక్కడ కలదు.\n\nపాతాళగంగ విశేషాలు లేదా శివరాత్రి బ్రహ్మోత్సవాల గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Srisailam — The Sacred Union of Jyotirlinga & Shakti Peetham\n\nNestled in the lush Nallamala forests along the Krishna River in Andhra Pradesh, **Srisailam** is one of India's most sanctified pilgrimage sites. It holds the rare distinction of being both a Dvadasa Jyotirlinga (Mallikarjuna) and an Ashtadasa Maha Shakti Peetham (Bhramaramba Devi).\n\n**Unique Attributes:**\n- **Direct Sparsha Darshanam:** Unlike many ancient temples, devotees of all backgrounds are historically permitted to directly touch and perform Abhishekam upon the sacred Shivalinga.\n- **Bhramaramba Devi:** Goddess Parvati assumed the form of a swarm of divine bees (*Bhramara*) to liberate creation from the demon Arunasura.\n- **Pathalaganga:** Devotees bathe in the sacred Krishna waters before ascending to the sanctum.\n\nWould you like to explore Srisailam's tribal Chenchu traditions, the Shiva-Shakti philosophy, or Mahashivaratri celebrations?`,
        followUps: isTe
          ? ["శ్రీశైల భ్రమరాంబా దేవి శక్తిపీఠ కథ", "పాతాళగంగ స్నాన విశిష్టత", "శ్రీశైల క్షేత్రంలో ఆదిశంకరాచార్యుల తపస్సు"]
          : ["Legend of Bhramaramba Devi", "Significance of Pathalaganga holy dip", "Adi Shankaracharya's visit to Srisailam"]
      };
    }

    // 18. Bammera Pothana & Bhagavatam
    if (q.includes("పోతన") || q.includes("భాగవత") || q.includes("pothana") || q.includes("bhagavatam") || q.includes("గజేంద్ర")) {
      return {
        message: isTe
          ? `### బమ్మెర పోతన & ఆంధ్ర మహాభాగవతం విశిష్టత\n\nబమ్మెర పోతన (15వ శతాబ్దం) తెలుగు సాహిత్యంలో భక్తి రసాన్ని పరమోన్నత శిఖరాలకు చేర్చిన సహజ పండితుడు.\n\n> **"పలికెడిది భాగవతమట, పలికించెడువాడు రామభద్రుండట, నే పలికిన భవహరమగునట, పలికెద వేరొండు గాథ పలుకగనేలా!"**\n\n**ప్రధాన విశేషాలు:**\n1. **మధుర భక్తి & శబ్దం:** పోతన పద్యాల్లో అంత్యప్రాసలు, అనుప్రాసలు, సంగీతాత్మక శైలి అద్భుతంగా ఉంటాయి.\n2. **నరస్తుతి నిరాకరణ:** సర్వజ్ఞ సింగభూపాలుడు వంటి రాజులు కోరినా తన కావ్యాన్ని మానవులకు అంకితం చేయక, శ్రీరామునికే అర్పించిన నిస్వార్థ భక్తుడు.\n3. **ప్రసిద్ధ ఘట్టాలు:** గజేంద్ర మోక్షం, రుక్మిణీ కళ్యాణం, ప్రహ్లాద చరిత్ర, వామన చరిత్రలు తెలుగువారి ఇంట నిత్య పారాయణ రత్నాలు.\n\nమీరు గజేంద్ర మోక్షం పద్యాలు, ప్రహ్లాద చరిత్ర లేదా రుక్మిణీ కళ్యాణం విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Bammera Pothana & Andhra Mahabhagavatam\n\nBammera Pothana (15th century) is celebrated as the *Sahaja Panditha* of Telugu literature for rendering Vyasa's Bhagavata Purana into immortal Telugu poetry.\n\n**Key Highlights:**\n1. **Immortal Dedication:** Rejected royal gifts and dedicated his sacred scripture solely to Lord Sri Rama.\n2. **Celebrated Episodes:** *Gajendra Moksham*, *Prahlada Charitra*, and *Rukmini Kalyanam* remain crown jewels of Telugu devotional poetry.\n\nWould you like to explore verses from Gajendra Moksham, Prahlada's story, or Rukmini's wedding?`,
        followUps: isTe
          ? ["గజేంద్ర మోక్షం పద్యం వివరణ", "రుక్మిణీ కళ్యాణం కథ", "పోతన గురించిన విశేషాలు"]
          : ["Gajendra Moksham verses", "Rukmini Kalyanam story", "Prahlada's devotion"]
      };
    }

    // 19. Yogi Vemana
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

    // 20. Saint Annamacharya
    if (q.includes("అన్నమయ్య") || q.includes("annamacharya") || q.includes("సంకీర్తన")) {
      return {
        message: isTe
          ? `### తాళ్ళపాక అన్నమాచార్యులు — పదకవితా పితామహుడు\n\nతిరుమల శ్రీ వేంకటేశ్వర స్వామిని తన కీర్తనలతో అర్చించిన పదకవితా పితామహుడు **తాళ్ళపాక అన్నమాచార్యులు** (15వ శతాబ్దం). ఆయన సుమారు 32,000 సంకీర్తనలను రచించి రాగిరేకులపై నిక్షిప్తం చేశారు.\n\n> **"బ్రహ్మమొక్కటే పరబ్రహ్మమొక్కటే | పరబ్రహ్మమొక్కటే పరబ్రహ్మమొక్కటే ||\n> నిండార రాజు నిద్రించు నిద్రయు నొకటే | అండనే బంటు నిద్ర అదియు నొకటే ||"**\n\n**అన్నమయ్య వైభవం:**\n- మానవులందరూ భగవంతుని ఎదుట సమానులే అని కులభేదాలను నిరసిస్తూ పాడిన మహనీయుడు.\n- శృంగార, ఆధ్యాత్మిక సంకీర్తనల ద్వారా తెలుగు సంస్కృతికి అపురూప కానుకను అందించారు.\n\nఅన్నమయ్య సంకీర్తనల రాగిరేకుల చరిత్ర లేదా ప్రసిద్ధ కీర్తనల అర్థాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Tallapaka Annamacharya — The Supreme Devotional Bard of Tirupati\n\nRevered as the *Pada Kavita Pitamaha* (Grandfather of Telugu Song Poetry), **Annamacharya** (1408–1503) composed 32,000 devotional hymns (*Sankeertanas*) solely dedicated to Lord Venkateswara of Tirumala.\n\n> **"Brahmam Okkate Para Brahmam Okkate"**\n*(The Supreme Divine is One; the sleep of a king and the sleep of a servant are one and the same; all souls are equal in the presence of God.)*\n\n**Significance:**\n- Inscribed his songs onto bronze copper plates, hidden for centuries in the Tirumala temple vault (*Sankeertana Bhandagaram*).\n- Pioneered egalitarian social vision rejecting caste discrimination through divine love.\n\nWould you like to explore popular Annamayya kritis, the copper plates preservation, or his spiritual philosophy?`,
        followUps: isTe
          ? ["బ్రహ్మమొక్కటే కీర్తన భావం", "తిరుమల రాగిరేకుల భాండాగారం కథ", "అన్నమయ్య లాలిపాటలు & శృంగార సంకీర్తనలు"]
          : ["Brahmam Okkate hymn meaning", "The discovery of Tirumala copper plates", "Annamayya lullabies and devotional songs"]
      };
    }

    // 21. Saint Tyagaraja
    if (q.includes("త్యాగరాజు") || q.includes("tyagaraja") || q.includes("పంచరత్న")) {
      return {
        message: isTe
          ? `### సద్గురు త్యాగరాజ స్వామి — కర్ణాటక సంగీత త్రిమూర్తులు\n\nకర్ణాటక సంగీతంలో అత్యున్నత శిఖరమైన కర్ణాటక సంగీత త్రిమూర్తులలో (త్యాగరాజు, ముత్తుస్వామి దీక్షితార్, శ్యామశాస్త్రి) అగ్రగణ్యులు **త్యాగరాజ స్వామి** (1767–1847). ఆయన కీర్తనలన్నీ శ్రీరామునికి అంకితం చేసిన నిష్కామ భక్తుడు.\n\n**త్యాగరాజ వైభవం:**\n- **నాదోపాసన:** సంగీతాన్ని పరబ్రహ్మ సాక్షాత్కార సాధనంగా మలచిన మహనీయుడు.\n- **పంచరత్న కృతులు:** నాట, గౌళ, ఆరభి, వరాళి, శ్రీరాగాలలో రచించిన పంచరత్న కృతులు కర్ణాటక సంగీత విద్వాంసులకు ప్రాణం.\n- **నిధి చాల సుఖమా:** తంజావూరు రాజు రాజాస్థాన ఆహ్వానాన్ని, బంగారు నిధులను తిరస్కరించి, శ్రీరాముని సన్నిధియే నిజమైన సంపద అని చాటిన వైరాగ్యమూర్తి.\n\nత్యాగరాజ పంచరత్న కృతులు లేదా 'నిధి చాల సుఖమా' కీర్తన విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Saint Tyagaraja — The Celestial Maestro of Carnatic Music\n\nOne of the supreme Carnatic Music Trinity, **Kakarla Tyagabrahmam** (Saint Tyagaraja, 1767–1847) elevated music into a sacred vehicle of devotion (*Nadopasana*) centered entirely on Lord Sri Rama.\n\n**Immortal Highlights:**\n- **Pancharatna Kritis:** The Five Gems composed in ghana ragas (Nata, Gaula, Arabhi, Varali, Sri) celebrated globally at the annual Tiruvaiyaru Aradhana festival.\n- **"Nidhi Chala Sukhama":** Boldly rejected the Tanjore royal invitation and heaps of gold, singing that true bliss lies not in worldly wealth, but in Rama's divine embrace.\n- **Telugu Lyricism:** Composed hundreds of immortal songs in sweet, expressive Telugu.\n\nWould you like to explore the Pancharatna Kritis, Tyagaraja's Rama Bhakti, or the Tiruvaiyaru Aradhana?`,
        followUps: isTe
          ? ["పంచరత్న కృతుల వివరాలు", "నిధి చాల సుఖమా కీర్తన కథ", "తిరువయ్యారు త్యాగరాజ ఆరాధనోత్సవాలు"]
          : ["Pancharatna Kritis overview", "The story behind Nidhi Chala Sukhama", "Tiruvaiyaru Aradhana festival traditions"]
      };
    }

    // 22. Sri Krishna Devaraya & Telugu Literature Golden Age
    if (q.includes("కృష్ణదేవరాయ") || q.includes("రాయలు") || q.includes("అష్టదిగ్గజ") || q.includes("దేశభాషలందు") || q.includes("krishnadevaraya")) {
      return {
        message: isTe
          ? `### శ్రీకృష్ణదేవరాయలు & అష్టదిగ్గజాల స్వర్ణయుగం\n\nవిజయనగర సామ్రాజ్యాన్ని పాలించిన చక్రవర్తులలో అగ్రగణ్యుడు **శ్రీకృష్ణదేవరాయలు** (1509–1529). ఆయన పాలనాకాలం తెలుగు సాహిత్య చరిత్రలో 'ప్రబంధ స్వర్ణయుగం'.\n\n> **"దేశభాషలందు తెలుగు లెస్స"**\n*(భారతదేశంలోని భాషలన్నింటిలో తెలుగు అత్యంత శ్రేష్ఠమైనదని రాయలు తన ఆముక్తమాల్యద గ్రంథంలో కొనియాడారు.)*\n\n**భువనవిజయం & అష్టదిగ్గజ కవులు:**\nరాయల ఆస్థానమైన 'భువనవిజయం'లో ఎనిమిది మంది ప్రసిద్ధ కవులు వెలిగారు: అల్లసాని పెద్దన (మనుచరిత్ర), నంది తిమ్మన (పారిజాతాపహరణం), ధూర్జటి (కాళహస్తీశ్వర శతకం), మాదయ్యగారి మల్లన, అయ్యలరాజు రామభద్రుడు, పింగళి సూరన, రామరాజభూషణుడు మరియు తెనాలి రామకృష్ణుడు.\n\nరాయల ఆముక్తమాల్యద లేదా తెనాలి రామకృష్ణుని చాటువులు గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Sri Krishna Devaraya & The Golden Age of Telugu Literature\n\nRuler of the Vijayanagara Empire (1509–1529), **Sri Krishna Devaraya** ushered in the zenith of Telugu classical literature (the *Prabandha Yuga*).\n\n> **"Desa Bhashalandu Telugu Lessa"** — *Among all regional languages, Telugu is the most sublime.*\n\n**Bhuvanavijayam & The Ashtadiggajas:**\nHis royal court hosted eight master poets known as the Ashtadiggajas, led by Andhra Kavita Pitamaha Allasani Peddana (*Manu Charitra*), Nandi Timmana (*Parijatapaharanam*), Dhurjati (*Kalahasteeswara Satakam*), and the witty Tenali Ramakrishna (*Panduranga Mahatmyam*).\n\nWould you like to explore Rayalu's masterpiece *Amuktamalyada*, Peddana's poetry, or Tenali Ramakrishna's wit?`,
        followUps: isTe
          ? ["రాయల ఆముక్తమాల్యద గ్రంథ విశేషాలు", "అల్లసాని పెద్దన మనుచరిత్ర పద్యాలు", "తెనాలి రామకృష్ణుని విద్వత్తు & హాస్యం"]
          : ["Amuktamalyada epic analysis", "Allasani Peddana's Manu Charitra", "Tenali Ramakrishna's wit and literature"]
      };
    }

    // 23. Telugu Language Sweetness & Heritage
    if (q.includes("తెలుగు భాష") || q.includes("telugu language") || q.includes("ఇటాలియన్") || q.includes("italian of the east") || q.includes("అజంత")) {
      return {
        message: isTe
          ? `### తెలుగు భాషా వైభవం — అజంత భాష & ఇటాలియన్ ఆఫ్ ది ఈస్ట్\n\n**తెలుగు భాష** భారతదేశంలో ద్రావిడ భాషా కుటుంబానికి చెందిన అత్యంత ప్రాచీన, మధురమైన భాష. దీనికి భారత ప్రభుత్వం ప్రాచీన భాష (Classical Language) హోదాను కల్పించింది.\n\n**తెలుగు భాషా విశిష్టతలు:**\n1. **అజంత భాష:** తెలుగులోని ప్రతి పదం అచ్చుతో (అ, ఆ, ఇ...) ముగుస్తుంది. అందువల్ల ఈ భాష సహజంగానే సంగీతానికి, పాటకు అత్యంత అనుకూలమైనది.\n2. **ఇటాలియన్ ఆఫ్ ది ఈస్ట్ (Italian of the East):** 16వ శతాబ్దంలో ఇటాలియన్ యాత్రికుడు నికోలో డి కాంటి తెలుగు భాషలోని సంగీతాత్మక శైలిని చూసి దీనిని 'ఇటాలియన్ ఆఫ్ ది ఈస్ట్' అని ప్రశంసించారు.\n3. **శాసనాలు & ప్రాచీనత:** క్రీ.పూ. నాటి భట్టిప్రోలు శాసనాలు, రేనాటి చోళుల ఎర్రగుడిపాడు శాసనం (క్రీ.శ. 575) తెలుగు ప్రాచీనతకు నిదర్శనాలు.\n\nతెలుగు అక్షరమాల, సంధులు-సమాసాలు లేదా ప్రసిద్ధ తెలుగు కవుల గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Glory of the Telugu Language — The Italian of the East\n\n**Telugu** is a classical language of India with over two millennia of documented heritage, renowned for its fluid euphony, musical vowel endings, and metric brilliance.\n\n**Distinguishing Characteristics:**\n1. **Ajanta Bhasha (Vocalic Ending):** Every native Telugu word concludes in a vowel sound, making it naturally rhythmic and the premier vehicle for Carnatic music compositions.\n2. **Italian of the East:** 16th-century Venetian explorer Niccolò de' Conti dubbed Telugu "The Italian of the East" due to its smooth cadence and melodic resonance.\n3. **Antiquity:** Validated by ancient inscriptions such as the Bhattiprolu casket inscriptions and the Erragudipadu stone inscription (575 CE).\n\nWould you like to learn about Telugu script evolution, classical Chandassu meters, or literary grammar?`,
        followUps: isTe
          ? ["తెలుగు వర్ణమాల (అచ్చులు, హల్లులు) ప్రాముఖ్యత", "తెలుగు భాష ప్రాచీన శాసనాల చరిత్ర", "తెలుగు వ్యాకరణంలో సంధులు-సమాసాలు"]
          : ["Evolution of the Telugu script", "Ancient Telugu inscriptions", "Basics of Telugu Sandhi and Samasam"]
      };
    }

    // 24. Traditional Festivals (Ugadi, Sankranti, Deepavali, Shivaratri)
    if (q.includes("ఉగాది") || q.includes("ugadi")) {
      return {
        message: isTe
          ? `### ఉగాది పండుగ — తెలుగు నూతన సంవత్సర వైభవం\n\nచైత్ర శుద్ధ పాడ్యమి నాడు జరుపుకునే **ఉగాది** తెలుగువారికి నూతన సంవత్సరాది. బ్రహ్మదేవుడు సృష్టిని ప్రారంభించిన దివ్య దినంగా పురాణాలు చెబుతున్నాయి.\n\n**ఉగాది ఆచారాలు & అంతరార్థం:**\n- **ఉగాది పచ్చడి (షడ్రుచులు):** తీపి (బెల్లం), పులుపు (చింతపండు), ఉప్పు, కారం, చేదు (వేపపువ్వు), వగరు (మామిడి పిందెలు). జీవితంలో ఎదురయ్యే ఆనందం, విచారం, భయం, కోపం, ఆశ్చర్యం, ఉత్సాహాలను సమభావంతో స్వీకరించాలని ఈ పచ్చడి ప్రబోధిస్తుంది.\n- **పంచాంగ శ్రవణం:** నూతన సంవత్సరంలో వర్షాలు, పంటలు, దేశ కాలమాన పరిస్థితులు మరియు రాశిఫలాలను ఆలయాల్లో పెద్దల సమక్షంలో తెలుసుకోవడం.\n- **కవి సమ్మేళనం:** ఉగాది నాడు తెలుగు సాహిత్యాన్ని గౌరవిస్తూ కవి సమ్మేళనాలు నిర్వహించడం ఆనవాయితీ.\n\nఉగాది షడ్రుచుల ఆరోగ్య ప్రయోజనాలు లేదా పంచాంగ విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Ugadi — The Telugu Lunar New Year\n\nCelebrated on the first day of the bright half of Chaitra (*Chaitra Shukla Padyami*), **Ugadi** marks the dawn of the new astronomical cycle in the Shalivahana Shaka calendar.\n\n**Core Customs & Symbolism:**\n- **Ugadi Pachadi (Six Tastes):** A sacred culinary blend of Sweet (jaggery), Sour (tamarind), Salty, Pungent (chili), Bitter (neem flowers), and Astringent (raw mango). It teaches equanimity (*Samatvam*)—accepting life's joys, sorrows, anger, fear, and surprises with grace.\n- **Panchanga Sravanam:** Community gatherings in temples where priests read the astronomical almanac, forecasting seasonal rainfall, agriculture, and societal harmony.\n\nWould you like to explore the philosophy behind the six tastes, Panchanga reading, or Ugadi Kavi Sammelanam poetry?`,
        followUps: isTe
          ? ["ఉగాది పచ్చడి ఆరు రుచుల తత్వబోధ", "పంచాంగంలోని తిథి, వారం, నక్షత్రాల ప్రాముఖ్యత", "ఉగాది నాడు తెలుగు కవి సమ్మేళనాల చరిత్ర"]
          : ["Philosophy of Ugadi Pachadi tastes", "How to read the Panchanga almanac", "Ugadi poetic gatherings tradition"]
      };
    }

    if (q.includes("సంక్రాంతి") || q.includes("sankranti") || q.includes("భోగి") || q.includes("కనుమ")) {
      return {
        message: isTe
          ? `### మకర సంక్రాంతి — పంటల పండుగ & సూర్యారాధన\n\nసూర్యుడు ధనుస్సు రాశి నుండి మకర రాశిలోకి ప్రవేశించే పుణ్యకాలాన్ని **మకర సంక్రాంతి** అంటారు. ఇది మూడు రోజుల పాటు ఘనంగా జరిగే తెలుగు లోగిళ్ళ అతిపెద్ద పండుగ.\n\n1. **భోగి (మొదటి రోజు):** పాత వస్తువులను, దుష్ట ఆలోచనలను భోగి మంటల్లో ఆహుతి చేసి నూతనత్వాన్ని ఆహ్వానించడం. పిల్లలకు భోగిపళ్ళు పోయడం.\n2. **మకర సంక్రాంతి (రెండవ రోజు):** సూర్య భగవానునికి కొత్త బియ్యం, బెల్లంతో చేసిన పొంగలిని నివేదించడం. రంగురంగుల ముగ్గులు, గొబ్బెమ్మలు, హరిదాసుల కీర్తనలు.\n3. **కనుమ (మూడవ రోజు):** మానవ జీవనానికి సహకరించే గోవులను, పశువులను పూజించి గౌరవించే పశువుల పండుగ.\n\nహరిదాసు సంప్రదాయం లేదా గొబ్బెమ్మల విశిష్టత గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Makara Sankranti — The Three-Day Harvest & Solar Festival\n\nMarking the Sun's transit into Capricorn (*Makara Rashi*) and the commencement of the auspicious northward solar movement (*Uttarayana*), **Sankranti** is the centerpiece festival of rural Andhra and Telangana.\n\n**The Three Sacred Days:**\n1. **Bhogi:** Cleansing the old via dawn bonfires (*Bhogi Manta*), symbolizing burning past karmic detritus, accompanied by *Bhogi Pallu* blessings for children.\n2. **Makara Sankranti:** Dedicated to Surya Deva; homes are adorned with intricate *Rangoli (Muggulu)*, cow-dung floral balls (*Gobbemmalu*), and visited by wandering bards (*Haridasu*).\n3. **Kanuma:** Reverence to cattle and agricultural animals who partner with humanity in tilling the soil.\n\nWould you like to explore the spiritual symbolism of Haridasu, Gobbemmalu songs, or Sankranti delicacies?`,
        followUps: isTe
          ? ["సంక్రాంతి హరిదాసుల విశేషాలు", "గొబ్బెమ్మల పూజ అంతరార్థం", "భోగి మంటల శాస్త్రీయ నేపథ్యం"]
          : ["The tradition of Haridasu singers", "Symbolism of Gobbemmalu", "Significance of Uttarayana solar transit"]
      };
    }

    // Default culturally grounded response with dynamic keyword synthesis
    const matchedSubject = query.replace(/[?.,!]/g, "").trim();
    return {
      message: isTe
        ? `### సన్నివేశం సాంస్కృతిక సమాధానం: "${matchedSubject}"\n\nమీరు అడిగిన ప్రశ్న భారతీయ ఆధ్యాత్మిక, చారిత్రక మరియు తెలుగు సాంస్కృతిక వారసత్వానికి సంబంధించినది.\n\nసనాతన ధర్మం మరియు తెలుగు సాహిత్యంలో ప్రతి భావన కూడా ధర్మం, జ్ఞానం మరియు అంతఃశుద్ధితో అనుసంధానించబడి ఉంటుంది. సన్నివేశం మేధ ద్వారా మీరు ఈ క్రింది ప్రధాన విభాగాలను లోతుగా అన్వేషించవచ్చు:\n\n- **ఇతిహాసాలు & పురాణాలు:** రామాయణ, మహాభారత ఘట్టాలు, భగవద్గీత శ్లోకాలు, భాగవత లీలలు.\n- **సాహిత్యం & కవులు:** పోతన, వేమన, అన్నమయ్య, త్యాగరాజు, రాయల స్వర్ణయుగ వైభవం.\n- **పుణ్యక్షేత్రాలు:** తిరుమల, శ్రీశైలం, భద్రాచలం, సింహాచలం మరియు ప్రాచీన ఆలయ ఆగమ శాస్త్రాలు.\n- **భాష & వ్యాకరణం:** అజంత భాషా మాధుర్యం, సంధులు, సమాసాలు, తెలుగు సామెతలు.\n\nదయచేసి ఈ క్రింది సూచనలలో ఒకదాన్ని ఎంచుకోండి లేదా మీ ప్రశ్నను మరింత వివరంగా అడగండి:`
        : `### Sannivesham Cultural Insight: "${matchedSubject}"\n\nYour inquiry explores the profound tapestry of Indian spiritual heritage and Telugu cultural traditions.\n\nIn Sanatana Dharma and classical literature, every entity connects deeply to ethical living (*Dharma*), knowledge (*Jnana*), and selfless action (*Seva*). Through Sannivesham AI, you can delve into:\n\n- **Epics & Scriptures:** Character arcs from Ramayana, Mahabharata, and verses of the Bhagavad Gita.\n- **Literary Maestros:** Masterpieces of Bammera Pothana, Yogi Vemana, Saint Annamacharya, and Saint Tyagaraja.\n- **Sacred Sanctuaries:** Spiritual traditions of Tirumala, Srisailam, Bhadrachalam, and ancient temple architecture.\n- **Language & Philosophy:** Vocalic beauty of the Telugu tongue, classical poetics, and philosophical tenets.\n\nPlease select one of the exploration paths below or refine your query with specific details:`,
      followUps: isTe
        ? ["శ్రీరామచంద్రుని ఆదర్శ గుణాలు", "భగవద్గీత ముఖ్య సందేశం", "తిరుమల క్షేత్ర వైభవం", "పోతన భాగవత పద్యాలు"]
        : ["Ideals of Lord Sri Rama", "Core teachings of Bhagavad Gita", "Tirumala Venkateswara lore", "Bammera Pothana verses"]
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
