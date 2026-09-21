/**
 * SANNIVESHAM AI — SERVER-SIDE USER MODERATION & RESTRICTION SYSTEM
 * 
 * Escalating Enforcement Policy:
 * 1. Warning: On first clear safety violation, request is blocked with an educational warning.
 * 2. Temporary Restriction: On repeated violations within 24h, account is locked for 1 hour.
 * 3. Escalated Restriction: Continued deliberate abuse locks the account for 24 hours.
 * 
 * NOTE: Cultural Context Safeguard:
 * Legitimate cultural topics (marriage rites, ancient literature, mythological narratives,
 * childbirth/samskaras, temple sculptures) are strictly protected from false-positive flagging.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// High-confidence prompt injection indicators
const PROMPT_INJECTION_PATTERNS = [
  /(ignore|disregard|forget|bypass)\s+.*(instructions|rules|prompt|identity|filters|guardrails|moderation)/i,
  /\b(you\s+are\s+now\s+(in\s+)?dan|jailbreak|pretend\s+you\s+are\s+(an\s+)?(unrestricted|ai\s+with\s+no\s+safety)|act\s+as\s+an\s+unrestricted)\b/i,
  /\b(reveal|print|show|output|tell\s+me|share|display)\s+.*(system\s+prompt|developer\s+instructions|system\s+instruction|backend\s+rules|moderation\s+logic|internal\s+instructions)/i,
  /\bwhat\s+(were|are)\s+you\s+(instructed|told)\s+to\s+(hide|keep\s+secret)/i,
  /\bwhat\s+(is|are)\s+your\s+.*(system\s+prompt|hidden\s+prompt|instructions)\b/i,
  /\b(secret\s+admin\s+credentials|firebase\s+admin|service\s+account\s+key|api\s+secret|db\s+password)\b/i,
  /\bhow\s+your\s+moderation\s+logic\s+works\b/i
];

// Severe illegal / dangerous activity patterns
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

// Explicit sexual / erotic intent patterns
const EXPLICIT_PATTERNS = [
  /\b(write|generate|tell\s+me)\s+.*(erotic|sexual|adult|sex|pornographic|dirty\s+talk|nsfw)\b/i,
  /\b(dirty\s+talk|sexual\s+roleplay|nsfw|nude\s+descriptions|erotic\s+scene|sexual\s+fantasy|adult\s+scene)\b/i,
  /\b(describe\s+having\s+sex|explicit\s+sexual)\b/i
];

// Protected Cultural Terms (Safe exceptions to prevent false positives)
const CULTURAL_EXEMPTION_PATTERNS = [
  /వివాహం|కళ్యాణం|సప్తపది|గర్భాధారణ|సంస్కారాలు|కామదేవుడు|రతీదేవి|మోహిని|శృంగార\s+రసం|కావ్యాలు/i,
  /marriage|wedding|saptapadi|garbhadhana|samskara|kama\s*deva|rati|mohini|shringara|sculpture|khajuraho|temple\s+art/i
];

/**
 * Check if the user is currently restricted in Firestore
 */
async function checkUserRestriction(userId, db) {
  if (!userId || !db) return { isRestricted: false };

  try {
    const userDocRef = db.collection('ai_moderation_records').doc(userId);
    const docSnap = await userDocRef.get();

    if (!docSnap.exists) {
      return { isRestricted: false, warningCount: 0, violationCount: 0 };
    }

    const data = docSnap.data();
    const now = Date.now();

    if (data.restrictionUntil && data.restrictionUntil > now) {
      const remainingMinutes = Math.ceil((data.restrictionUntil - now) / (60 * 1000));
      return {
        isRestricted: true,
        remainingMinutes,
        reason: data.lastViolation?.reason || 'Policy violation',
        restrictionStatus: data.restrictionStatus
      };
    }

    return {
      isRestricted: false,
      warningCount: data.warningCount || 0,
      violationCount: data.violationCount || 0,
      restrictionStatus: 'active'
    };
  } catch (err) {
    console.error('Error checking user restriction:', err);
    return { isRestricted: false };
  }
}

/**
 * Evaluate safety of a user message
 */
function evaluateSafety(text) {
  if (!text || typeof text !== 'string') {
    return { isSafe: true };
  }

  const trimmed = text.trim();

  // 1. Check prompt injection
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        type: 'PROMPT_INJECTION',
        reason: 'Attempt to override or inspect internal instructions',
        severity: 'warning'
      };
    }
  }

  // 2. Check severe illegal/harmful
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        type: 'HARMFUL_ILLEGAL',
        reason: 'Illegal, dangerous or severely harmful request',
        severity: 'severe'
      };
    }
  }

  // 3. Check explicit sexual content (with Cultural Context Safeguard)
  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(trimmed)) {
      // Check if this is a legitimate cultural/historical question
      const isCultural = CULTURAL_EXEMPTION_PATTERNS.some(cp => cp.test(trimmed));
      if (!isCultural) {
        return {
          isSafe: false,
          type: 'ADULT_SEXUAL',
          reason: 'Explicit sexual or erotic content request',
          severity: 'warning'
        };
      }
    }
  }

  return { isSafe: true };
}

/**
 * Record a policy violation and apply escalating enforcement
 */
async function recordViolation(userId, db, violationDetails, isTelugu = true) {
  if (!userId || !db) {
    return {
      status: 'warned',
      message: isTelugu
        ? 'ఈ అభ్యర్థన సన్నివేశం మేధ నిబంధనల ప్రకారం అనుమతించబడదు. దయచేసి సాంస్కృతిక విషయాలపై మాత్రమే ప్రశ్నలు అడగండి.'
        : 'This request isn’t allowed on Sannivesham AI. Please keep your questions related to Sannivesham’s cultural and educational purpose.'
    };
  }

  try {
    const userDocRef = db.collection('ai_moderation_records').doc(userId);
    const docSnap = await userDocRef.get();

    const existing = docSnap.exists ? docSnap.data() : {
      userId,
      warningCount: 0,
      violationCount: 0,
      violationHistory: []
    };

    const now = Date.now();
    let newWarningCount = (existing.warningCount || 0) + 1;
    let newViolationCount = existing.violationCount || 0;
    let restrictionStatus = 'warned';
    let restrictionUntil = null;
    let responseMessage = '';

    if (violationDetails.severity === 'severe' || newWarningCount >= 3) {
      newViolationCount += 1;
      restrictionStatus = newViolationCount >= 2 ? 'escalated_restriction' : 'temporary_restriction';
      const lockDuration = restrictionStatus === 'escalated_restriction' ? TWENTY_FOUR_HOURS_MS : ONE_HOUR_MS;
      restrictionUntil = now + lockDuration;

      responseMessage = isTelugu
        ? `సన్నివేశం నిబంధనల ఉల్లంఘన కారణంగా మీ ఖాతా వినియోగం తాత్కాలికంగా (${restrictionStatus === 'escalated_restriction' ? '24 గంటలు' : '1 గంట'}) నిరోధించబడింది.`
        : `Your Sannivesham AI access has been temporarily restricted (${restrictionStatus === 'escalated_restriction' ? 'for 24 hours' : 'for 1 hour'}) due to repeated policy violations.`;
    } else {
      responseMessage = isTelugu
        ? 'ఈ అభ్యర్థన సన్నివేశం మేధ నిబంధనల ప్రకారం అనుమతించబడదు. దయచేసి సన్నివేశం సాంస్కృతిక మరియు విద్యా ప్రయోజనాలకు సంబంధించిన ప్రశ్నలను మాత్రమే అడగండి.'
        : 'This request isn’t allowed on Sannivesham AI. Please keep your questions related to Sannivesham’s cultural and educational purpose.';
    }

    const updatedHistory = existing.violationHistory || [];
    updatedHistory.push({
      timestamp: new Date(now).toISOString(),
      type: violationDetails.type || 'GENERAL_VIOLATION',
      reason: violationDetails.reason || 'Safety filter triggered',
      severity: violationDetails.severity || 'warning'
    });

    await userDocRef.set({
      userId,
      warningCount: newWarningCount,
      violationCount: newViolationCount,
      restrictionStatus,
      restrictionUntil,
      lastViolation: {
        timestamp: new Date(now).toISOString(),
        reason: violationDetails.reason || 'Safety filter triggered',
        severity: violationDetails.severity || 'warning'
      },
      violationHistory: updatedHistory.slice(-20), // keep last 20
      updatedAt: new Date(now).toISOString()
    }, { merge: true });

    return {
      status: restrictionStatus,
      restrictionUntil,
      message: responseMessage
    };
  } catch (err) {
    console.error('Error recording violation:', err);
    return {
      status: 'warned',
      message: isTelugu
        ? 'ఈ అభ్యర్థన సన్నివేశం మేధ నిబంధనల ప్రకారం అనుమతించబడదు. దయచేసి సాంస్కృతిక ప్రశ్నలను మాత్రమే అడగండి.'
        : 'This request isn’t allowed on Sannivesham AI. Please keep your questions related to Sannivesham’s cultural and educational purpose.'
    };
  }
}

module.exports = {
  checkUserRestriction,
  evaluateSafety,
  recordViolation
};
