/**
 * SANNIVESHAM AI (సన్నివేశం మేధ) & STREAM BACKEND CLOUD FUNCTIONS
 * 
 * 1. Strict CORS Whitelisting (production domains + local dev)
 * 2. Mandatory Firebase Auth ID Token Verification (cryptographic UID validation)
 * 3. Per-User and Per-IP Sliding-Window Rate Limiting
 * 4. Input Validation & Defense-in-depth Sanitization (capped history & message length)
 * 5. Safe Error Sanitization (Zero internal leakage in production responses)
 * 6. Server-side Razorpay Order Creation and HMAC-SHA256 Payment Verification
 */

const functions = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const geminiApiKeySecret = defineSecret('GEMINI_API_KEY');

const { checkUserRestriction, evaluateSafety, recordViolation } = require('./moderation');
const { detectLanguage, classifyTopicRelevance } = require('./relevance');
const { SANNIVESHAM_SYSTEM_INSTRUCTION } = require('./prompt');
const { handleCreateOrder, handleVerifyPayment } = require('./payments');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

function getGeminiApiKey() {
  try {
    if (geminiApiKeySecret && typeof geminiApiKeySecret.value === 'function') {
      const val = geminiApiKeySecret.value();
      if (val) return val;
    }
  } catch (e) {}
  return process.env.GEMINI_API_KEY || functions.config().gemini?.key || '';
}

function getAiClient() {
  const key = getGeminiApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ---------------------------------------------------------------------
// 1. CORS CONFIGURATION
// ---------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://sannivesham.in',
  'https://www.sannivesham.in',
  'https://sannivesham-b4231.web.app',
  'https://sannivesham-b4231.firebaseapp.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, desktop native apps with file:// or no origin)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
};

const corsMiddleware = cors(corsOptions);

// ---------------------------------------------------------------------
// 2. IN-MEMORY RATE LIMITER (SLIDING WINDOW)
// ---------------------------------------------------------------------
const rateLimitStore = new Map();

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || [];
  const validTimestamps = record.filter(timestamp => now - timestamp < windowMs);

  if (validTimestamps.length >= maxRequests) {
    rateLimitStore.set(key, validTimestamps);
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);

  // Periodic cleanup if map grows large
  if (rateLimitStore.size > 10000) {
    for (const [k, timestamps] of rateLimitStore.entries()) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > windowMs) {
        rateLimitStore.delete(k);
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------
// 4. MEDHA AI CHAT ENDPOINT (Configured with Secret Manager & Multi-Layer Safety)
// ---------------------------------------------------------------------
exports.medhaChat = functions.runWith({ secrets: [geminiApiKeySecret] }).https.onRequest((req, res) => {
  return corsMiddleware(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      // 4A. AUTHENTICATION: Require valid Firebase ID Token
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required. Please provide a valid Firebase ID token.'
        });
      }

      const idToken = authHeader.split('Bearer ')[1].trim();
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (authErr) {
        return res.status(401).json({
          error: 'Invalid or expired authentication token.'
        });
      }

      // Cryptographically verified user identity (never trust client-supplied userId)
      const verifiedUserId = decodedToken.uid;

      // 4B. RATE LIMITING: Per-User and Per-IP
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown_ip';

      // Limit: 20 requests per minute per user
      if (!checkRateLimit(`user:${verifiedUserId}`, 20, 60 * 1000)) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment before sending another message.'
        });
      }

      // Limit: 30 requests per minute per IP
      if (!checkRateLimit(`ip:${clientIp}`, 30, 60 * 1000)) {
        return res.status(429).json({
          error: 'Too many requests from this network. Please wait a moment.'
        });
      }

      // 4C. INPUT VALIDATION & SIZES
      const { message, conversationHistory = [] } = req.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const cleanMessage = message.trim();
      if (cleanMessage.length > 1000) {
        return res.status(400).json({
          error: 'Message exceeds maximum allowed length of 1000 characters.'
        });
      }

      // Validate conversation history structure and cap length
      if (!Array.isArray(conversationHistory)) {
        return res.status(400).json({ error: 'conversationHistory must be an array' });
      }

      const validatedHistory = [];
      const safeHistory = conversationHistory.slice(-8); // keep at most 8 previous turns
      for (const turn of safeHistory) {
        if (!turn || typeof turn !== 'object') continue;
        const role = turn.role;
        const content = turn.content;
        if ((role === 'user' || role === 'assistant' || role === 'model') &&
            typeof content === 'string' && content.trim().length > 0) {
          validatedHistory.push({
            role: role === 'assistant' ? 'model' : role,
            content: content.slice(0, 1500) // cap each turn content
          });
        }
      }

      // 4D. STEP 1: Check User Restriction Status in Firestore
      const userStatus = await checkUserRestriction(verifiedUserId, db);
      if (userStatus.isRestricted) {
        const lang = detectLanguage(cleanMessage);
        const msg = lang === 'english'
          ? `Your access to Sannivesham AI is temporarily restricted for another ${userStatus.remainingMinutes} minute(s) due to previous policy violations.`
          : `గత నిబంధనల ఉల్లంఘన కారణంగా మీ ఖాతా వినియోగం మరో ${userStatus.remainingMinutes} నిమిషం(లు) పాటు నిరోధించబడింది.`;

        return res.status(403).json({
          status: 'RESTRICTED',
          message: msg,
          remainingMinutes: userStatus.remainingMinutes
        });
      }

      // 4E. STEP 2: Language Detection
      const detectedLang = detectLanguage(cleanMessage);
      const isTelugu = detectedLang === 'telugu' || detectedLang === 'mixed';

      // 4F. STEP 3: Multi-layer Safety & Prompt-Injection Guard
      const safetyResult = evaluateSafety(cleanMessage);
      if (!safetyResult.isSafe) {
        const violationOutcome = await recordViolation(verifiedUserId, db, safetyResult, isTelugu);
        return res.status(200).json({
          status: 'SAFETY_VIOLATION',
          message: violationOutcome.message,
          restrictionStatus: violationOutcome.status
        });
      }

      // 4G. STEP 4: Topic Relevance Classifier
      const relevanceResult = classifyTopicRelevance(cleanMessage, detectedLang);
      if (relevanceResult.classification === 'OFF_TOPIC') {
        return res.status(200).json({
          status: 'OFF_TOPIC',
          message: relevanceResult.redirectionMessage
        });
      }

      if (relevanceResult.classification === 'UNCLEAR') {
        return res.status(200).json({
          status: 'UNCLEAR',
          message: relevanceResult.redirectionMessage
        });
      }

      // 4H. STEP 5: AI Generation via Gemini API
      const client = getAiClient();
      if (!client) {
        return res.status(200).json({
          status: 'SUCCESS',
          message: isTelugu
            ? 'సన్నివేశం మేధ సేవ ప్రస్తుతం అందుబాటులో ఉంది. దయచేసి నిర్వాహకులు Gemini API కీని కాన్ఫిగర్ చేయవలసి ఉంది.'
            : 'Sannivesham AI service is active. Please configure the server GEMINI_API_KEY environment variable.'
        });
      }

      // Format conversation contents for Gemini API
      const contents = [];
      for (const turn of validatedHistory) {
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.content }]
        });
      }
      contents.push({ role: 'user', parts: [{ text: cleanMessage }] });

      // Model-level safety settings (Defense in Depth)
      const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
      ];

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SANNIVESHAM_SYSTEM_INSTRUCTION,
          safetySettings,
          temperature: 0.65,
          maxOutputTokens: 1200
        }
      });

      let responseText = response.text || '';

      // Post-generation Output Check (Prevents system prompt leakage & compliance bypasses)
      const containsSystemLeak = /\b(SANNIVESHAM_SYSTEM_INSTRUCTION|developer instructions|hidden prompt|you are a culturally grounded AI guide created for the Sannivesham)\b/i.test(responseText);
      if (containsSystemLeak) {
        console.warn('System prompt leakage detected in generated response. Sanitizing output.');
        responseText = isTelugu
          ? 'సన్నివేశం మేధ తెలుగు సంస్కృతి, భాష మరియు ఆధ్యాత్మిక విషయాలపై మాత్రమే సమాధానాలు ఇస్తుంది. దయచేసి సంబంధిత ప్రశ్నలు అడగండి.'
          : 'Sannivesham AI provides guidance exclusively on Telugu culture, language, and spiritual heritage. Please ask a related question.';
      }

      return res.status(200).json({
        status: 'SUCCESS',
        message: responseText,
        language: detectedLang
      });

    } catch (err) {
      // Log full trace internally for server debugging
      console.error('Sannivesham Medha Internal Error:', err);

      // Return sanitized generic response without leaking internal errors or stack traces
      return res.status(500).json({
        error: 'An unexpected internal error occurred. Please try again later.'
      });
    }
  });
});

// ---------------------------------------------------------------------
// 5. SECURE SUBSCRIPTION & RAZORPAY PAYMENT ENDPOINTS
// ---------------------------------------------------------------------
exports.createSubscriptionOrder = functions.https.onRequest((req, res) => {
  return corsMiddleware(req, res, () => handleCreateOrder(req, res, db, admin));
});

exports.verifySubscriptionPayment = functions.https.onRequest((req, res) => {
  return corsMiddleware(req, res, () => handleVerifyPayment(req, res, db, admin));
});

// ---------------------------------------------------------------------
// 6. SECURE CLOUDINARY SIGNED UPLOAD ENDPOINT
// ---------------------------------------------------------------------
exports.getCloudinaryUploadSignature = functions.https.onRequest((req, res) => {
  return corsMiddleware(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const idToken = authHeader.split('Bearer ')[1].trim();
      const decoded = await admin.auth().verifyIdToken(idToken);

      // Verify admin status
      let isAdmin = decoded.admin === true;
      if (!isAdmin && decoded.email) {
        const adminDoc = await db.collection('settings').doc('admin').get();
        if (adminDoc.exists) {
          const d = adminDoc.data();
          if ((Array.isArray(d.emails) && d.emails.includes(decoded.email)) || d.email === decoded.email) {
            isAdmin = true;
          }
        }
      }

      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || functions.config().cloudinary?.cloud_name || 'du5em76za';
      const apiKey = process.env.CLOUDINARY_API_KEY || functions.config().cloudinary?.api_key || '';
      const apiSecret = process.env.CLOUDINARY_API_SECRET || functions.config().cloudinary?.api_secret || '';

      if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Cloudinary server credentials are not configured' });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'sannivesham_admin_uploads';
      const crypto = require('crypto');
      const signature = crypto
        .createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      return res.status(200).json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder
      });
    } catch (err) {
      console.error('Cloudinary signature error:', err);
      return res.status(500).json({ error: 'Failed to generate upload signature' });
    }
  });
});
