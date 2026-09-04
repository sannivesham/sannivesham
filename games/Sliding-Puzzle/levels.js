// Sliding Puzzle Level Configurations attached globally for non-module scripts to use
window.LEVELS = [
  { id: 1, title: "శ్రీరామ జననం (Birth of Rama)", difficulty: "సులభం (Easy)", gridSize: 3, image: "p1.png" },
  { id: 2, title: "బాల కృష్ణుడు (Baby Krishna Leelas)", difficulty: "సులభం (Easy)", gridSize: 3, image: "p2.png" },
  { id: 3, title: "బాల హనుమంతుడు (Young Hanuman)", difficulty: "సులభం (Easy)", gridSize: 3, image: "p3.png" },
  { id: 4, title: "సీతా కళ్యాణం (Sita Rama Kalyanam)", difficulty: "సులభం (Easy)", gridSize: 3, image: "p4.png" },
  { id: 5, title: "కాళీయ మర్దనం (Krishna & Kaliya Serpent)", difficulty: "మధ్యమం (Medium)", gridSize: 4, image: "p5.png" },
  { id: 6, title: "సంజీవని పర్వతం (Hanuman Carrying Mountain)", difficulty: "మధ్యమం (Medium)", gridSize: 4, image: "p6.png" },
  { id: 7, title: "గీతోపదేశం (Krishna Guiding Arjuna)", difficulty: "మధ్యమం (Medium)", gridSize: 4, image: "p7.png" },
  { id: 8, title: "లంకా దహనం (Hanuman's Trail in Lanka)", difficulty: "మధ్యమం (Medium)", gridSize: 4, image: "p8.png" },
  { id: 9, title: "విశ్వరూప ప్రదర్శన (Vishwaroopa Darshanam)", difficulty: "కఠినం (Hard)", gridSize: 4, image: "p9.png" },
  { id: 10, title: "సముద్ర లంఘనం (Hanuman Crossing Ocean)", difficulty: "కఠినం (Hard)", gridSize: 4, image: "p10.png" },
  { id: 11, title: "గోవర్ధన గిరిధారి (Krishna Lifting Mountain)", difficulty: "కఠినం (Hard)", gridSize: 4, image: "p11.png" },
  { id: 12, title: "శ్రీరామ పట్టాభిషేకం (The Grand Coronation)", difficulty: "కఠినం (Hard)", gridSize: 4, image: "p12.png" }
];

window.getLevel = function (id) {
  return window.LEVELS.find(l => l.id === Number(id));
};

window.getNextLevel = function (id) {
  return window.getLevel(Number(id) + 1);
};
