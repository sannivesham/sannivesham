// WORD BANK
// -----------------------------------------------------------------
// To add more words: just add strings to the arrays below.
// To add a whole new pack: copy the "classic" object, rename the key,
// then add its name to the PACKS list at the bottom + the <option> in
// index.html's word-pack <select>.
// -----------------------------------------------------------------

export const WORD_PACKS = {
  classic: {
    label: "Classic",
    easy: [
      "cat","dog","sun","tree","car","house","ball","fish","star","moon",
      "book","cup","shoe","hat","apple","banana","chair","clock","door",
      "flower","cloud","rain","snow","fire","boat","key","bed","phone",
      "spoon","fork","egg","cake","kite","balloon","ladder","train","bus",
      "bird","frog","duck","cow","pig","bee","ant","leaf","umbrella","sock"
    ],
    medium: [
      "guitar","elephant","rainbow","castle","dragon","pirate","robot",
      "volcano","spider","penguin","rocket","waterfall","desert","jungle",
      "skeleton","mirror","compass","lighthouse","telescope","backpack",
      "helicopter","dinosaur","octopus","mountain","campfire","snowman",
      "scarecrow","windmill","fireworks","waterfall","tornado","glacier",
      "canoe","anchor","trophy","treasure","suitcase","parachute","cactus"
    ],
    hard: [
      "astronaut","chandelier","hourglass","kaleidoscope","stethoscope",
      "labyrinth","avalanche","hologram","catapult","gargoyle","mosaic",
      "silhouette","stalactite","tsunami","eclipse","hibernation",
      "camouflage","metamorphosis","gravity","echo","constellation",
      "submarine","periscope","hieroglyphics","boomerang","quicksand",
      "meteorite","centrifuge","observatory","sundial","mausoleum"
    ]
  }
};

export const PACK_NAMES = Object.keys(WORD_PACKS);

// Returns `count` unique random words from the given pack + difficulty.
// difficulty: "easy" | "medium" | "hard" | "mixed"
export function getWordChoices(packKey, difficulty, count = 3) {
  const pack = WORD_PACKS[packKey] || WORD_PACKS.classic;
  let pool;
  if (difficulty === "mixed") {
    pool = [...pack.easy, ...pack.medium, ...pack.hard];
  } else {
    pool = pack[difficulty] || pack.easy;
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
