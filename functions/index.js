/**
 * SANNIVESHAM AI (సన్నివేశం మేధ) — BACKEND CLOUD FUNCTION
 * 
 * Secure, server-side cultural AI endpoint:
 * 1. User Identity & Restriction Verification
 * 2. Language Detection (Telugu / English / Mixed)
 * 3. Multi-layer Safety & Prompt-Injection Guard
 * 4. Topic Relevance Filter (Zero general-purpose answering)
 * 5. Gemini 2.5 Flash API Execution with Cultural System Instructions
 * 6. Escalating User Violation Tracking in Firestore
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { GoogleGenAI } = require('@google/genai');

const { checkUserRestriction, evaluateSafety, recordViolation } = require('./moderation');
const { detectLanguage, classifyTopicRelevance } = require('./relevance');
const { SANNIVESHAM_SYSTEM_INSTRUCTION } = require('./prompt');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Gemini Client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key || '';
let aiClient = null;
if (GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Main Cloud Function Handler for Medha Chat
 */
exports.medhaChat = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { message, conversationHistory = [], userId = 'guest_user' } = req.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const cleanMessage = message.trim();

      // STEP 1: Check User Restriction Status in Firestore
      const userStatus = await checkUserRestriction(userId, db);
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

      // STEP 2: Language Detection
      const detectedLang = detectLanguage(cleanMessage);
      const isTelugu = detectedLang === 'telugu' || detectedLang === 'mixed';

      // STEP 3: Multi-layer Safety & Prompt-Injection Guard
      const safetyResult = evaluateSafety(cleanMessage);
      if (!safetyResult.isSafe) {
        const violationOutcome = await recordViolation(userId, db, safetyResult, isTelugu);
        return res.status(200).json({
          status: 'SAFETY_VIOLATION',
          message: violationOutcome.message,
          restrictionStatus: violationOutcome.status
        });
      }

      // STEP 4: Topic Relevance Classifier
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

      // STEP 5: AI Generation via Gemini API
      if (!aiClient) {
        // Fallback response if API key is not yet configured in functions env
        return res.status(200).json({
          status: 'SUCCESS',
          message: isTelugu
            ? 'సన్నివేశం మేధ సేవ ప్రస్తుతం అందుబాటులో ఉంది. దయచేసి నిర్వాహకులు Gemini API కీని కాన్ఫిగర్ చేయవలసి ఉంది.'
            : 'Sannivesham AI service is active. Please configure the server GEMINI_API_KEY environment variable.'
        });
      }

      // Format conversation history for Gemini multi-turn chat
      const contents = [];
      for (const turn of conversationHistory.slice(-6)) { // keep last 6 turns for tight memory
        if (turn.role === 'user' && turn.content) {
          contents.push({ role: 'user', parts: [{ text: turn.content }] });
        } else if (turn.role === 'assistant' && turn.content) {
          contents.push({ role: 'model', parts: [{ text: turn.content }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: cleanMessage }] });

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SANNIVESHAM_SYSTEM_INSTRUCTION,
          temperature: 0.65,
          maxOutputTokens: 1200
        }
      });

      const responseText = response.text || '';

      return res.status(200).json({
        status: 'SUCCESS',
        message: responseText,
        language: detectedLang
      });

    } catch (err) {
      console.error('Sannivesham Medha Error:', err);
      return res.status(500).json({
        error: 'Internal processing error',
        details: err.message
      });
    }
  });
});
