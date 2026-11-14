/**
 * Sannivesham AI — Patterns Module
 * Moderation, Safety, Cultural Exemptions, and Cultural Relevance Rule Patterns
 */

export const PROMPT_INJECTION_PATTERNS = [
  /(ignore|disregard|forget|bypass)\s+.*(instructions|rules|prompt|identity|filters|guardrails|moderation)/i,
  /\b(you\s+are\s+now\s+(in\s+)?dan|jailbreak|pretend\s+you\s+are\s+(an\s+)?(unrestricted|ai\s+with\s+no\s+safety)|act\s+as\s+an\s+unrestricted)\b/i,
  /\b(reveal|print|show|output|tell\s+me|share|display)\s+.*(system\s+prompt|developer\s+instructions|system\s+instruction|backend\s+rules|moderation\s+logic|internal\s+instructions)/i,
  /\bwhat\s+(were|are)\s+you\s+(instructed|told)\s+to\s+(hide|keep\s+secret)/i,
  /\bwhat\s+(is|are)\s+your\s+.*(system\s+prompt|hidden\s+prompt|instructions)\b/i,
  /\b(secret\s+admin\s+credentials|firebase\s+admin|service\s+account\s+key|api\s+secret|db\s+password)\b/i,
  /\bhow\s+your\s+moderation\s+logic\s+works\b/i
];

export const HARMFUL_PATTERNS = [
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

export const EXPLICIT_PATTERNS = [
  /\b(write|generate|tell\s+me)\s+.*(erotic|sexual|adult|sex|pornographic|dirty\s+talk|nsfw)\b/i,
  /\b(dirty\s+talk|sexual\s+roleplay|nsfw|nude\s+descriptions|erotic\s+scene|sexual\s+fantasy|adult\s+scene)\b/i,
  /\b(describe\s+having\s+sex|explicit\s+sexual)\b/i
];

export const CULTURAL_EXEMPTION_PATTERNS = [
  /వివాహం|కళ్యాణం|సప్తపది|గర్భాధారణ|సంస్కారాలు|కామదేవుడు|రతీదేవి|మోహిని|శృంగార\s+రసం|కావ్యాలు/i,
  /marriage|wedding|saptapadi|garbhadhana|samskara|kama\s*deva|rati|mohini|shringara|sculpture|khajuraho|temple\s+art/i
];

export const OFF_TOPIC_PATTERNS = [
  /\b(python|javascript|typescript|react|angular|vue|nodejs|node\.js|flutter|java\b|c\+\+|c#|golang|rust\b|php\b|ruby\b|swift\b|kotlin|docker|kubernetes|aws|sql|css|html|github|npm|pip)\b/i,
  /\b(code|coding|programming|developer|script|algorithm|bug|debug|compile|compiler|function|component\s+error|pull\s+request|api\s+endpoint)\b/i,
  /\b(crypto|cryptocurrency|bitcoin|btc|ethereum|eth|dogecoin|altcoin|binance|blockchain|nft|nfts|wallet)\b/i,
  /\b(stock|stocks|shares|day\s+trading|nifty|sensex|options\s+trading|share\s+price|forex|mutual\s+funds|exchange\s+rate|dollar\s+to\s+euro|usd\s+to\s+inr|invest\s+in)\b/i,
  /\b(iphone|ipad|android|samsung|smartphone|laptop|pc|windows\s*11|windows\s*10|macbook|gpu|cpu|graphics\s+card|motherboard|gaming\s+mouse|headphones|screen\s+that\s+is\s+flickering|flickering\s+screen|root\s+(an\s+)?android|blue\s+screen|bsod)\b/i,
  /\b(differential\s+equation|calculus|derivative|integral|algebra|matrix\s+multiplication|eigenvalue|trigonometry)\b/i,
  /\b(photosynthesis|quantum\s+(computing|mechanics|physics)|qubit|superposition|organic\s+chemistry|chemical\s+reaction|periodic\s+table|global\s+warming|climate\s+change)\b/i,
  /\b(write\s+an\s+essay\s+on)\b/i,
  /\b(prescribe|prescription|antibiotic|paracetamol|ibuprofen|medicine|cure.*(headache|migraine|fever|cough)|migraine|headache|diagnose|treatment\s+for\s+cancer|symptoms)\b/i,
  /\b(dating\s+app|tinder|bumble|hinge|girlfriend|boyfriend|impress\s+a\s+(girl|boy|woman|man)|crush|breakup|romantic\s+breakup)\b/i,
  /\b(legal\s+advice|lawsuit|file\s+a\s+lawsuit|court\s+case|sue\s+someone|divorce\s+lawyer)\b/i,
  /\b(fifa|world\s+cup|counter-strike|gaming|premier\s+league|nba|nfl|marathon(\s+running)?|running\s+shoes)\b/i,
  /\b(recipe\s+for|pizza|burger|pasta|french\s+fries)\b/i,
  /\b(itinerary|visit(ing)?\s+(paris|switzerland|france|italy|germany|london|europe))\b/i,
  /\b(tiktok|instagram\s+reels|viral\s+marketing|social\s+media\s+marketing)\b/i,
  /\b(hollywood|sci-fi\s+movie|latest\s+movie\s+plot|netflix\s+series)\b/i,
  /\b(engine\s+oil|car\s+repair|car\s+engine)\b/i
];

export const CULTURAL_RELEVANCE_PATTERNS = [
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
