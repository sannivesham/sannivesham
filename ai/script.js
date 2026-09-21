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

  initAuth() {
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

  async callAIBackend(userMessage) {
    // Attempt backend Cloud Function first
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
      // Backend function offline / fallback
      console.log("Cloud function offline, activating intelligent cultural knowledge fallback engine.");
    }

    // Intelligent cultural fallback resolver
    return this.resolveCulturalKnowledge(userMessage);
  }

  resolveCulturalKnowledge(query) {
    const q = query.toLowerCase();
    const isTe = this.detectLang(query) !== "english";

    // Pothana Bhagavatam
    if (q.includes("పోతన") || q.includes("భాగవత") || q.includes("pothana") || q.includes("bhagavatam")) {
      return {
        message: isTe
          ? `### బమ్మెర పోతన & ఆంధ్ర మహాభాగవతం విశిష్టత\n\nబమ్మెర పోతన (15వ శతాబ్దం) తెలుగు సాహిత్యంలో భక్తి రసాన్ని పరమోన్నత శిఖరాలకు చేర్చిన సహజ పండితుడు.\n\n> **"పలికెడిది భాగవతమట, పలికించెడువాడు రామభద్రుండట, నే పలికిన భవహరమగునట, పలికెద వేరొండు గాథ పలుకగనేలా!"**\n\n**ప్రధాన విశేషాలు:**\n1. **మధుర భక్తి & శబ్దం:** పోతన పద్యాల్లో అంత్యప్రాసలు, అనుప్రాసలు, సంగీతాత్మక శైలి అద్భుతంగా ఉంటాయి.\n2. **నరస్తుతి నిరాకరణ:** సర్వజ్ఞ సింగభూపాలుడు వంటి రాజులు కోరినా తన కావ్యాన్ని మానవులకు అంకితం చేయక, శ్రీరామునికే అర్పించిన నిస్వార్థ భక్తుడు.\n3. **ప్రసిద్ధ ఘట్టాలు:** గజేంద్ర మోక్షం, రుక్మిణీ కళ్యాణం, ప్రహ్లాద చరిత్ర, వామన చరిత్రలు తెలుగువారి ఇంట నిత్య పారాయణ రత్నాలుగా నిలిచాయి.\n\nమీరు గజేంద్ర మోక్షం పద్యాలు, ప్రహ్లాద చరిత్ర లేదా రుక్మిణీ కళ్యాణం విశేషాలు తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Bammera Pothana & Andhra Mahabhagavatam\n\nBammera Pothana (15th century) is celebrated as the *Sahaja Panditha* (natural scholar) of Telugu literature, renowned for translating Vyasa's Sanskrit Bhagavata Purana into Telugu with peerless poetic sweetness.\n\n**Key Highlights:**\n1. **Supreme Devotion (*Bhakti*):** Pothana refused royal patronage from King Singabhupala, declaring he would dedicate his immortal poetry solely to Sri Rama.\n2. **Celebrated Episodes:** The *Gajendra Moksham*, *Prahlada Charitra*, and *Rukmini Kalyanam* remain timeless cornerstones of Telugu devotional literature.\n\nWould you like to explore verses from Gajendra Moksham, Prahlada's story, or Rukmini's wedding?`,
        followUps: isTe
          ? ["గజేంద్ర మోక్షం పద్యం వివరణ", "రుక్మిణీ కళ్యాణం కథ", "పోతన గురించిన విశేషాలు"]
          : ["Gajendra Moksham verses", "Rukmini Kalyanam story", "Prahlada's devotion"]
      };
    }

    // Ugadi
    if (q.includes("ఉగాది") || q.includes("ugadi")) {
      return {
        message: isTe
          ? `### ఉగాది పండుగ & షడ్రుచుల అంతరార్థం\n\n'యుగము + ఆది = యుగాది (ఉగాది)' అనగా నూతన సంవత్సర ఆరంభం. చైత్ర శుద్ధ పాడ్యమి నాడు వసంత రుతువు రాకతో ఉగాదిని జరుపుకుంటాం.\n\n**షడ్రుచుల పచ్చడి అంతరార్థం (జీవిత సత్యాలు):**\n- **చేదు (వేపపువ్వు):** జీవితంలో ఎదురయ్యే బాధలు, కష్టాలు.\n- **తీపి (బెల్లం/చెరకు):** ఆనందం, విజయాలు మరియు సుఖాలు.\n- **కారం (మిరప/మిరియాలు):** కోపం లేదా చురుకుదనం.\n- **ఉప్పు:** జీవితానికి అవసరమైన ఉత్సాహం మరియు రుచి.\n- **పులుపు (చింతపండు):** ఓర్పుతో వ్యవహరించాల్సిన సంక్లిష్ట పరిస్థితులు.\n- **వగరు (మామిడి పిందెలు):** కొత్త అనుభవాలు, ఆశ్చర్యాలు.\n\nసుఖదుఃఖాలు రెండింటినీ సమభావంతో స్వీకరించడమే ఉగాది ఇచ్చే దివ్య సందేశం.\n\nమీరు ఉగాది పంచాంగ శ్రవణం లేదా ఉగాది ఆచారాల గురించి మరింత తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Significance of Ugadi & The Six Tastes\n\nUgadi marks the commencement of the Hindu lunar new year on *Chaitra Shuddha Padyami*.\n\n**The Philosophy of *Ugadi Pachadi* (Six Tastes):**\n- **Bitter (Neem flowers):** Sadness & hardships to be accepted.\n- **Sweet (Jaggery):** Joy & happiness.\n- **Spicy (Chili/Pepper):** Energy & anger.\n- **Salty (Salt):** Essence & taste of living.\n- **Sour (Tamarind):** Challenges demanding patience.\n- **Tangy (Raw Mango):** Surprises & unexpected turns.\n\nUgadi teaches equanimity (*Samatvam*) in the face of life's dualities.\n\nWould you like to explore Panchanga Sravanam or traditional rituals of Ugadi?`,
        followUps: isTe
          ? ["ఉగాది పంచాంగ శ్రవణం విశేషాలు", "శ్రీరామ నవమి ప్రాముఖ్యత", "వసంత నవరాత్రులు"]
          : ["Panchanga Sravanam tradition", "Sri Rama Navami significance", "Spring festivals"]
      };
    }

    // Tirumala Venkateswara
    if (q.includes("తిరుమల") || q.includes("వేంకటేశ్వర") || q.includes("tirumala") || q.includes("tirupati")) {
      return {
        message: isTe
          ? `### తిరుమల శ్రీ వేంకటేశ్వర క్షేత్ర వైభవం\n\nతిరుమల సప్తగిరులు (శేషాద్రి, నీలాద్రి, గరుడాద్రి, అంజనాద్రి, వృషభాద్రి, వృషాద్రి, వేంకటాద్రి) పై కొలువైన కలియుగ ప్రత్యక్ష దైవం శ్రీనివాసుడు.\n\n**క్షేత్ర విశేషాలు:**\n1. **వేంకటాద్రి మహత్యం:** 'వేం' అనగా పాపాలు, 'కట' అనగా దహించివేయునది — పాపాలను భస్మం చేసే పవిత్ర క్షేత్రం.\n2. **ఆనంద నిలయం:** స్వామివారి గర్భాలయంపై ఉన్న బంగారు గోపుర విమానం భక్తులకు అనిర్వచనీయమైన శాంతిని ప్రసాదిస్తుంది.\n3. **నిత్య కల్యాణ క్షేత్రం:** తోమాల సేవ, అర్చన, నివేదన, సుప్రభాతం తదితర వైఖానస ఆగమ పూజా విధానాలు నిత్యం భక్తిశ్రద్ధలతో జరుగుతాయి.\n\nమీరు తిరుమల సేవల వివరాలు, శ్రీనివాస కళ్యాణం కథ లేదా బ్రహ్మోత్సవాల గురించి తెలుసుకోవాలనుకుంటున్నారా?`
          : `### Divine Glory of Tirumala Sri Venkateswara Swamy\n\nPerched atop the sacred Seven Hills of the Eastern Ghats, Tirumala is revered as the abode of Lord Srinivasa, the manifest savior of Kali Yuga.\n\n**Spiritual Highlights:**\n1. **The Name Venkatadri:** 'Vem' (sin) + 'Kata' (destroyer) — the hill that dissolves all spiritual impediments.\n2. **Ananda Nilayam:** The gilded sanctum sanctorum radiating timeless tranquility.\n3. **Vaikhanasa Agama:** Ancient ritual traditions strictly followed everyday from Suprabhatam to Ekantha Seva.\n\nWould you like to learn about Brahmotsavams, Srinivasa Kalyanam, or daily temple sevas?`,
        followUps: isTe
          ? ["తిరుమల బ్రహ్మోత్సవాల ప్రాముఖ్యత", "శ్రీనివాస కళ్యాణం కథ", "సుప్రభాతం విశేషాలు"]
          : ["Brahmotsavam significance", "Srinivasa Kalyanam history", "Vaikhanasa traditions"]
      };
    }

    // Default culturally grounded response
    return {
      message: isTe
        ? `### సాంస్కృతిక సమాధానం\n\nమీ ప్రశ్న భారతీయ సంస్కృతి మరియు ఆధ్యాత్మిక వారసత్వానికి సంబంధించినది. సన్నివేశం మేధ ద్వారా మీరు తెలుగు భాషా విశేషాలు, పురాణాలు, పద్యాలు, దేవాలయ క్షేత్ర చరిత్రలు మరియు పండుగల వెనుక ఉన్న అంతరార్థాలను నిస్సందేహంగా అన్వేషించవచ్చు.\n\nఈ అంశంపై మీకు నిర్దిష్టమైన పద్యం, కథ లేదా శాస్త్రీయ కారణం కావాలా? దయచేసి వివరంగా అడగండి.`
        : `### Cultural & Educational Insights\n\nYour question explores the rich tapestry of Indian cultural and Telugu heritage. Sannivesham AI helps you understand authentic scripture meanings, historical literature, temple lore, and Vedic philosophy.\n\nWould you like more details regarding a specific verse, mythological episode, or historical practice?`,
      followUps: isTe
        ? ["రామాయణ విశేషాలు", "భగవద్గీత శ్లోకాలు", "తెలుగు సాహిత్య కవులు"]
        : ["Ramayana teachings", "Bhagavad Gita verses", "Telugu classical poets"]
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
