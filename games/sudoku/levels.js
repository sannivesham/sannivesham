export const LEVELS = [
  { id: 1, titleTelugu: "అయోధ్య ద్వారం", titleEnglish: "Ayodhya's Gate", size: 4, difficulty: "easy", maxHints: 3 },
  { id: 2, titleTelugu: "పంచవటి వనం", titleEnglish: "Panchavati Grove", size: 4, difficulty: "easy", maxHints: 3 },
  { id: 3, titleTelugu: "చిత్రకూట ఆశ్రమం", titleEnglish: "Chitrakoot Hermitage", size: 4, difficulty: "easy", maxHints: 3 },
  { id: 4, titleTelugu: "కిష్కింధ సభ", titleEnglish: "Kishkindha Court", size: 4, difficulty: "medium", maxHints: 3 },
  { id: 5, titleTelugu: "శబరి కుటీరం", titleEnglish: "Sabari's Cottage", size: 4, difficulty: "medium", maxHints: 2 },
  { id: 6, titleTelugu: "ఋశ్యమూక పర్వతం", titleEnglish: "Rishyamuka Hill", size: 4, difficulty: "medium", maxHints: 2 },
  { id: 7, titleTelugu: "సేతుబంధనం", titleEnglish: "The Sacred Bridge", size: 4, difficulty: "hard", maxHints: 2 },
  { id: 8, titleTelugu: "లంకా ద్వారం", titleEnglish: "Gateway of Lanka", size: 4, difficulty: "hard", maxHints: 1 },

  { id: 9, titleTelugu: "లంకా ప్రాకారం", titleEnglish: "Lanka's Ramparts", size: 6, difficulty: "easy", maxHints: 3 },
  { id: 10, titleTelugu: "అశోక వనం", titleEnglish: "Ashoka Vatika", size: 6, difficulty: "easy", maxHints: 3 },
  { id: 11, titleTelugu: "హనుమంతుని ప్రయాణం", titleEnglish: "Hanuman's Journey", size: 6, difficulty: "easy", maxHints: 3 },
  { id: 12, titleTelugu: "సంజీవని పర్వతం", titleEnglish: "Sanjeevani Mountain", size: 6, difficulty: "medium", maxHints: 2 },
  { id: 13, titleTelugu: "వానర సైన్యం", titleEnglish: "The Vanara Army", size: 6, difficulty: "medium", maxHints: 2 },
  { id: 14, titleTelugu: "విభీషణ శరణాగతి", titleEnglish: "Vibhishana's Surrender", size: 6, difficulty: "medium", maxHints: 2 },
  { id: 15, titleTelugu: "ఇంద్రజిత్తు యుద్ధం", titleEnglish: "Battle of Indrajit", size: 6, difficulty: "hard", maxHints: 1 },
  { id: 16, titleTelugu: "రావణ సంహారం", titleEnglish: "Defeat of Ravana", size: 6, difficulty: "hard", maxHints: 1 },

  { id: 17, titleTelugu: "మిథిలా నగరం", titleEnglish: "Mithila Kingdom", size: 9, difficulty: "easy", maxHints: 3 },
  { id: 18, titleTelugu: "శివధనుస్సు", titleEnglish: "The Bow of Shiva", size: 9, difficulty: "easy", maxHints: 3 },
  { id: 19, titleTelugu: "దండకారణ్యం", titleEnglish: "Dandaka Forest", size: 9, difficulty: "easy", maxHints: 3 },
  { id: 20, titleTelugu: "క్షీర సాగరం", titleEnglish: "The Cosmic Ocean", size: 9, difficulty: "medium", maxHints: 2 },
  { id: 21, titleTelugu: "ద్వారకా నగరం", titleEnglish: "The City of Dwaraka", size: 9, difficulty: "medium", maxHints: 2 },
  { id: 22, titleTelugu: "ఇంద్రప్రస్థ సభ", titleEnglish: "Hall of Indraprastha", size: 9, difficulty: "medium", maxHints: 2 },
  { id: 23, titleTelugu: "విరాట పర్వం", titleEnglish: "The Kingdom of Virata", size: 9, difficulty: "medium", maxHints: 2 },
  { id: 24, titleTelugu: "కురుక్షేత్రం", titleEnglish: "Kurukshetra", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 25, titleTelugu: "చక్రవ్యూహం", titleEnglish: "The Chakravyuha", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 26, titleTelugu: "భీష్మ ప్రతిజ్ఞ", titleEnglish: "Bhishma's Vow", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 27, titleTelugu: "అర్జునుని తపస్సు", titleEnglish: "Arjuna's Penance", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 28, titleTelugu: "గీతోపదేశం", titleEnglish: "The Teaching of the Gita", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 29, titleTelugu: "ధర్మ విజయం", titleEnglish: "Victory of Dharma", size: 9, difficulty: "hard", maxHints: 1 },
  { id: 30, titleTelugu: "శ్రీరామ సామ్రాజ్యం", titleEnglish: "Rama's Empire", size: 9, difficulty: "hard", maxHints: 1 }
];

export function getLevel(levelId) {
  const id = Number(levelId);

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return LEVELS.find(level => level.id === id) || null;
}

export function getNextLevel(levelId) {
  return getLevel(Number(levelId) + 1);
}

export function getTotalLevels() {
  return LEVELS.length;
}

export function getDifficultyLabel(difficulty) {
  const labels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard"
  };

  return labels[difficulty] || difficulty;
}
