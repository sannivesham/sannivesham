// Word Search Level Configurations attached globally for Module support
window.LEVELS = [
  {
    id: 1,
    titleTelugu: "రామాయణ పాత్రలు",
    titleEnglish: "Ramayana Heroes",
    difficulty: "సులభం (Easy)",
    gridSize: "8×8",
    bestTime: "00:40",
    wordsList: "రాముడు, సీత, లక్ష్మణుడు, భరతుడు"
  },
  {
    id: 2,
    titleTelugu: "వానర సేన",
    titleEnglish: "The Vanara Army",
    difficulty: "సులభం (Easy)",
    gridSize: "8×8",
    bestTime: "00:16",
    wordsList: "హనుమంతుడు, సుగ్రీవుడు, అంగదుడు, జాంబ..."
  },
  {
    id: 3,
    titleTelugu: "ఇతిహాస నగరాలు",
    titleEnglish: "Epic Cities",
    difficulty: "మధ్యమం (Medium)",
    gridSize: "10×10",
    bestTime: "00:19",
    wordsList: "అయోధ్య, లంక, మిథిల, కిష్కింధ"
  },
  {
    id: 4,
    titleTelugu: "మహాభారత వీరులు",
    titleEnglish: "Mahabharata Warriors",
    difficulty: "మధ్యమం (Medium)",
    gridSize: "10×10",
    bestTime: "00:39",
    wordsList: "అర్జునుడు, కర్ణుడు, భీముడు, నకులుడు"
  },
  {
    id: 5,
    titleTelugu: "రామాయణ ఋషులు",
    titleEnglish: "Sages of Ramayana",
    difficulty: "సులభం (Easy)",
    gridSize: "8×8",
    bestTime: "00:26",
    wordsList: "వాల్మీకి, వశిష్ఠుడు, విశ్వామిత్రుడు"
  },
  {
    id: 6,
    titleTelugu: "మహాభారత గురువులు",
    titleEnglish: "Gurus of Mahabharata",
    difficulty: "సులభం (Easy)",
    gridSize: "8×8",
    bestTime: "00:13",
    wordsList: "ద్రోణాచార్యుడు, కృపాచార్యుడు, భీష్ముడు"
  }
];

window.getLevel = function(id) {
  return window.LEVELS.find(l => l.id === Number(id));
};
