/**
 * SANNIVESHAM AI — TOPIC RELEVANCE CLASSIFIER & LANGUAGE DETECTOR
 * 
 * Strict boundary enforcement:
 * Sannivesham AI is NOT a general-purpose chatbot.
 * It answers only queries related to Telugu language, literature, culture,
 * Indian traditions, Sanatana Dharma, temples, festivals, epics, history, and arts.
 */

// Explicitly disallowed off-topic categories (unless tied to cultural context)
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

// Cultural relevance indicators (Strong positive signals)
const CULTURAL_RELEVANCE_PATTERNS = [
  // Telugu Language & Literature
  /తెలుగు|భాష|వ్యాకరణం|పద్యం|సాహిత్యం|శతకం|కవి|కవులు|సామెత|పొడుపు|అర్థం|సంధి|సమాసం|ఛందస్సు/i,
  /telugu|grammar|literature|poem|kavita|padyam|shatakam|poet|proverb|sametha|meaning|vocabulary/i,

  // Famous Authors & Figures
  /పోతన|వేమన|నన్నయ|తిక్కన|ఎర్రన|శ్రీశ్రీ|గురజాడ|కృష్ణదేవరాయలు|అల్లసాని|తెనాలి|విశ్వనాథ|అన్నమయ్య|త్యాగరాజు|రామదాసు/i,
  /pothana|vemana|nannaya|tikkana|errana|sri\s*sri|gurajada|krishnadevaraya|tenali|annamayya|tyagaraja|ramadasu/i,

  // Epics & Sanatana Dharma
  /రామాయణం|మహాభారతం|భాగవతం|గీత|పురాణాలు|ఉపనిషత్తులు|వేదాలు|ధర్మం|మోక్షం|కర్మ|ఆధ్యాత్మికం/i,
  /ramayana|mahabharata|bhagavatam|gita|purana|upanishad|veda|dharma|sanatana|karma|moksha|spirituality/i,

  // Deities & Sacred Figures
  /శివుడు|విష్ణువు|కృష్ణుడు|రాముడు|హనుమంతుడు|వెంకటేశ్వర|లక్ష్మి|సరస్వతి|పార్వతి|దుర్గ|గణపతి/i,
  /shiva|vishnu|krishna|rama|hanuman|venkateswara|balaji|lakshmi|saraswati|parvati|durga|ganesha/i,

  // Temples & Festivals
  /గుడి|దేవాలయం|క్షేత్రం|తీర్థం|ఉగాది|సంక్రాంతి|దీపావళి|దసరా|శివరాత్రి|వినాయక|ఏకాదశి|పంచాంగం|తిథి/i,
  /temple|kshetra|tirupati|tirumala|srisailam|warangal|ugadi|sankranti|deepavali|dasara|shivaratri|ekadashi|panchangam|tithi/i,

  // Devotional & Chants
  /స్తోత్రం|మంత్రం|నామావళి|సహస్రనామం|చాలీసా|కవచం|పారాయణం|కీర్తన|భజన|శ్లోకం/i,
  /stotram|mantra|namavali|sahasranama|chalisa|kavacham|parayanam|keertana|bhajan|shloka/i,

  // History & Traditional Arts
  /చరిత్ర|శాతవాహన|కాకతీయ|విజయనగర|కూచిపూడి|హరికథ|బుర్రకథ|సంప్రదాయం|ఆచారం/i,
  /history|satavahana|kakatiya|vijayanagara|kuchipudi|harikatha|burrakatha|tradition|custom|cinema\s+history/i
];

/**
 * Detect language of prompt
 * Returns: 'telugu' | 'english' | 'mixed'
 */
function detectLanguage(text) {
  if (!text) return 'telugu';

  // Count Telugu unicode characters (0x0C00 to 0x0C7F)
  const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

  if (teluguChars > 0 && englishChars === 0) return 'telugu';
  if (teluguChars > 0 && englishChars > 0) return 'mixed';
  if (englishChars > 0 && teluguChars === 0) return 'english';

  return 'telugu';
}

/**
 * Classify relevance of the query
 * Returns: { classification: 'RELEVANT' | 'OFF_TOPIC' | 'UNCLEAR', redirectionMessage: string | null }
 */
function classifyTopicRelevance(text, detectedLang = 'telugu') {
  if (!text || text.trim().length < 2) {
    return {
      classification: 'UNCLEAR',
      redirectionMessage: (detectedLang === 'english')
        ? 'Please enter a question related to Telugu language, literature, culture, or Indian traditions.'
        : 'దయచేసి తెలుగు భాష, సాహిత్యం, సంస్కృతి లేదా భారతీయ సంప్రదాయాలకు సంబంధించిన ప్రశ్నను అడగండి.'
    };
  }

  const trimmed = text.trim();

  // 1. Check if explicitly off-topic
  const isOffTopic = OFF_TOPIC_PATTERNS.some(pattern => pattern.test(trimmed));
  const hasStrongCulturalIndicator = CULTURAL_RELEVANCE_PATTERNS.some(pattern => pattern.test(trimmed));

  // If matches off-topic and has NO cultural anchor (e.g. "How do I learn Python?" or "Write code for my website")
  if (isOffTopic && !hasStrongCulturalIndicator) {
    return {
      classification: 'OFF_TOPIC',
      redirectionMessage: (detectedLang === 'english')
        ? 'I am Sannivesham AI, dedicated exclusively to Telugu language, literature, traditions, Indian culture, and Sanatana Dharma. I cannot assist with general programming, finance, or unrelated topics. Please ask me a question related to Telugu or Indian cultural heritage.'
        : 'నేను ప్రధానంగా తెలుగు భాష, సంస్కృతి, సాహిత్యం, సంప్రదాయాలు మరియు భారతీయ వారసత్వానికి సంబంధించిన విషయాలపై సహాయం చేయగలను. ప్రోగ్రామింగ్ లేదా ఇతర సాధారణ విషయాలకు సమాధానం ఇవ్వలేను. మీకు తెలుగు లేదా భారతీయ సంస్కృతికి సంబంధించిన ఏదైనా ప్రశ్న ఉంటే అడగండి.'
    };
  }

  // 2. Short / vague check
  if (trimmed.length < 4 && !hasStrongCulturalIndicator) {
    return {
      classification: 'UNCLEAR',
      redirectionMessage: (detectedLang === 'english')
        ? 'Could you please clarify your cultural question in a little more detail?'
        : 'దయచేసి మీ ప్రశ్నను కొద్దిగా వివరంగా తెలియజేయగలరా?'
    };
  }

  return {
    classification: 'RELEVANT',
    redirectionMessage: null
  };
}

module.exports = {
  detectLanguage,
  classifyTopicRelevance
};
