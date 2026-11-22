/**
 * TEST SUITE: RAMAYANA RELATIONSHIPS & GENEALOGY EXPLORER
 * Validates data fidelity, Valmiki citations, and relationship engine calculations.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== RUNNING RAMAYANA RELATIONSHIPS TEST SUITE ===\n");

// 1. Data Integrity Tests
const data = require("../ramayana-relationships/data.js");
assert.ok(data.IKSHVAKU_LINEAGE, "IKSHVAKU_LINEAGE should exist");
assert.strictEqual(data.IKSHVAKU_LINEAGE.length, 39, "Ikshvaku lineage must have exactly 39 generations per Bala Kanda 70");

console.log("✓ Ikshvaku Lineage has exactly 39 generations");

// Verify generation 1 to 39
data.IKSHVAKU_LINEAGE.forEach((k, idx) => {
  assert.strictEqual(k.gen, idx + 1, `Generation index should match gen ${idx + 1}`);
  assert.ok(k.id, `King at gen ${k.gen} must have id`);
  assert.ok(k.nameTe, `King at gen ${k.gen} must have Telugu name`);
  assert.ok(k.sarga, `King at gen ${k.gen} must have Sarga reference`);
});

assert.strictEqual(data.IKSHVAKU_LINEAGE[0].id, "brahma", "Gen 1 must be Brahma");
assert.strictEqual(data.IKSHVAKU_LINEAGE[5].id, "ikshvaku", "Gen 6 must be Ikshvaku");
assert.strictEqual(data.IKSHVAKU_LINEAGE[22].id, "bhagiratha", "Gen 23 must be Bhagiratha");
assert.strictEqual(data.IKSHVAKU_LINEAGE[24].id, "raghu", "Gen 25 must be Raghu");
assert.strictEqual(data.IKSHVAKU_LINEAGE[36].id, "aja", "Gen 37 must be Aja");
assert.strictEqual(data.IKSHVAKU_LINEAGE[37].id, "dasharatha", "Gen 38 must be Dasharatha");
assert.strictEqual(data.IKSHVAKU_LINEAGE[38].id, "sri_rama", "Gen 39 must be Sri Rama");

console.log("✓ Key ancestral milestones (Brahma, Ikshvaku, Bhagiratha, Raghu, Aja, Dasharatha, Sri Rama) verified");

// 2. Family Trees & Characters Consistency
assert.ok(data.CATEGORIES.length >= 6, "At least 6 categories must be defined");
assert.ok(data.FAMILY_TREES.dasharatha, "Dasharatha tree must be defined");
assert.ok(data.FAMILY_TREES.janaka, "Janaka tree must be defined");
assert.ok(data.FAMILY_TREES.vanara, "Vanara tree must be defined");
assert.ok(data.FAMILY_TREES.rakshasa, "Rakshasa tree must be defined");
assert.ok(data.FAMILY_TREES.guru, "Guru tree must be defined");

const charIds = new Set(data.CHARACTERS.map(c => c.id));
data.IKSHVAKU_LINEAGE.forEach(k => charIds.add(k.id));

// Verify that all members in family trees exist in character repository
Object.keys(data.FAMILY_TREES).forEach(treeKey => {
  const tree = data.FAMILY_TREES[treeKey];
  tree.generations.forEach(g => {
    g.members.forEach(mId => {
      assert.ok(charIds.has(mId), `Member ${mId} in ${treeKey} generation ${g.level} must exist in CHARACTERS or Lineage`);
    });
  });
});
console.log("✓ All members across all 5 family trees exist in character database");

// 3. Kinship Engine Tests
const relEngine = require("../ramayana-relationships/relationships.js");

// Test Rama & Bharata
const resRamaBharata = relEngine.findRelationship("sri_rama", "bharata");
assert.ok(resRamaBharata, "Rama-Bharata relationship must resolve");
assert.ok(resRamaBharata.relationTe.includes("తమ్ముడు"), "Rama to Bharata should be younger brother");
console.log(`✓ Rama-Bharata: ${resRamaBharata.relationTe} (${resRamaBharata.relationEn})`);

// Test Sita & Lakshmana
const resSitaLakshmana = relEngine.findRelationship("sita", "lakshmana");
assert.ok(resSitaLakshmana, "Sita-Lakshmana relationship must resolve");
assert.ok(resSitaLakshmana.relationTe.includes("మరిది"), "Sita to Lakshmana should be Brother-in-law (Maridi)");
console.log(`✓ Sita-Lakshmana: ${resSitaLakshmana.relationTe} (${resSitaLakshmana.relationEn})`);

// Test Dasharatha & Rishyashringa
const resDasharathaRishyashringa = relEngine.findRelationship("dasharatha", "rishyashringa");
assert.ok(resDasharathaRishyashringa, "Dasharatha-Rishyashringa relationship must resolve");
assert.ok(resDasharathaRishyashringa.relationTe.includes("అల్లుడు"), "Dasharatha to Rishyashringa should be son-in-law");
console.log(`✓ Dasharatha-Rishyashringa: ${resDasharathaRishyashringa.relationTe} (${resDasharathaRishyashringa.relationEn})`);

// Test Bhagiratha & Sri Rama (Generational Lineage difference)
const resBhagirathaRama = relEngine.findRelationship("bhagiratha", "sri_rama");
assert.ok(resBhagirathaRama, "Bhagiratha-Rama relationship must resolve");
assert.strictEqual(resBhagirathaRama.relationTe, "పూర్వ వంశీయుడు (16 తరాల క్రితం)");
console.log(`✓ Bhagiratha-Rama: ${resBhagirathaRama.relationTe} (${resBhagirathaRama.relationEn})`);

// Test Vali & Angada
const resValiAngada = relEngine.findRelationship("vali", "angada");
assert.ok(resValiAngada, "Vali-Angada relationship must resolve");
assert.ok(resValiAngada.relationTe.includes("కుమారుడు") || resValiAngada.relationTe.includes("తండ్రి"), "Vali to Angada should be Father-Son");
console.log(`✓ Vali-Angada: ${resValiAngada.relationTe} (${resValiAngada.relationEn})`);

// Test Sri Rama & Hanuman
const resRamaHanuman = relEngine.findRelationship("sri_rama", "hanuman");
assert.ok(resRamaHanuman, "Rama-Hanuman relationship must resolve");
assert.ok(resRamaHanuman.relationTe.includes("భక్తుడు") || resRamaHanuman.relationTe.includes("సేవకుడు"));
console.log(`✓ Rama-Hanuman: ${resRamaHanuman.relationTe} (${resRamaHanuman.relationEn})`);

// 4. HTML Elements & IDs check
const htmlPath = path.join(__dirname, "../ramayana-relationships/index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const requiredIds = [
  "ambientCanvas",
  "langToggleBtn",
  "characterSearchInput",
  "searchClearBtn",
  "searchResultsBox",
  "charSelect1",
  "charSelect2",
  "btnSwapChars",
  "btnFindRelationship",
  "relationshipResultCard",
  "resRelBadge",
  "resRelEn",
  "resHonorific",
  "resDetails",
  "resCitation",
  "treeWorkspace",
  "wsCatIcon",
  "wsCatTitle",
  "wsCatSubtitle",
  "btnZoomOut",
  "zoomLevelLabel",
  "btnZoomIn",
  "btnResetZoom",
  "btnFit",
  "treeViewport",
  "treeContent",
  "profileModal",
  "modalCloseBtn",
  "profileModalContent"
];

requiredIds.forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `HTML must contain element with id="${id}"`);
});
console.log("✓ All 29 required DOM element IDs verified in index.html");

// 5. Verify Hierarchy Integration (Ithihasalu -> Ramayanam -> Ramayana Bandhutvalu)
const mainHtmlPath = path.join(__dirname, "../index.html");
const mainHtml = fs.readFileSync(mainHtmlPath, "utf8");
assert.strictEqual(mainHtml.includes('href="ramayana-relationships/"'), false, "Homepage must NOT link to ramayana-relationships/ directly per user instruction");
console.log("✓ Homepage correctly does NOT contain ramayana-relationships");

const ramayanamHtmlPath = path.join(__dirname, "../ithihasalu/ramayanam.html");
const ramayanamHtml = fs.readFileSync(ramayanamHtmlPath, "utf8");
assert.ok(ramayanamHtml.includes('href="../ramayana-relationships/"'), "Ramayanam section in Ithihasalu must link to ramayana-relationships/");
console.log("✓ Ithihasalu -> Ramayanam categories section successfully links to ramayana-relationships/");

console.log("\n=======================================================");
console.log("🎉 ALL RAMAYANA RELATIONSHIPS TESTS PASSED WITH 100% SUCCESS!");
console.log("=======================================================\n");
