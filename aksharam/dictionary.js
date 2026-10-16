// Sannivesham Aksharam — dictionary.js
// Comprehensive searchable word bank spanning all curriculum milestones and lessons

const wordBank = [
  // MILESTONE 1: VOWELS (అచ్చులు)
  { te: 'అ', translit: 'a', en: "a (as in 'about')", lesson: 'Vowels' },
  { te: 'ఆ', translit: 'aa', en: "aa (as in 'father')", lesson: 'Vowels' },
  { te: 'ఇ', translit: 'i', en: "i (as in 'bit')", lesson: 'Vowels' },
  { te: 'ఈ', translit: 'ii', en: "ee (as in 'feet')", lesson: 'Vowels' },
  { te: 'ఉ', translit: 'u', en: "u (as in 'put')", lesson: 'Vowels' },
  { te: 'ఊ', translit: 'uu', en: "oo (as in 'boot')", lesson: 'Vowels' },
  { te: 'ఋ', translit: 'ru', en: "ri / ru (as in 'rishi')", lesson: 'Vowels' },
  { te: 'ఎ', translit: 'e', en: "e (as in 'bet')", lesson: 'Vowels' },
  { te: 'ఏ', translit: 'ee', en: "ay (as in 'may')", lesson: 'Vowels' },
  { te: 'ఐ', translit: 'ai', en: "ai (as in 'aisle')", lesson: 'Vowels' },
  { te: 'ఒ', translit: 'o', en: "o (as in 'pot')", lesson: 'Vowels' },
  { te: 'ఓ', translit: 'oo', en: "o (as in 'go')", lesson: 'Vowels' },
  { te: 'ఔ', translit: 'au', en: "ow (as in 'cow')", lesson: 'Vowels' },
  { te: 'అం', translit: 'am', en: "am (nasal anusvara)", lesson: 'Vowels' },
  { te: 'అః', translit: 'aha', en: "aha (aspirated visarga)", lesson: 'Vowels' },

  // VOWEL WORDS
  { te: 'అమ్మ', translit: 'Amma', en: "Mother", lesson: 'Vocabulary' },
  { te: 'ఆవు', translit: 'Aavu', en: "Cow", lesson: 'Vocabulary' },
  { te: 'ఇల్లు', translit: 'Illu', en: "Home / House", lesson: 'Vocabulary' },
  { te: 'ఈగ', translit: 'Eega', en: "Housefly", lesson: 'Vocabulary' },
  { te: 'ఉడుత', translit: 'Uduta', en: "Squirrel", lesson: 'Vocabulary' },
  { te: 'ఊయల', translit: 'Ooyala', en: "Swing / Cradle", lesson: 'Vocabulary' },
  { te: 'ఋషి', translit: 'Rishi', en: "Sage / Seer", lesson: 'Vocabulary' },
  { te: 'ఎలుక', translit: 'Eluka', en: "Mouse / Rat", lesson: 'Vocabulary' },
  { te: 'ఏనుగు', translit: 'Eenugu', en: "Elephant", lesson: 'Vocabulary' },
  { te: 'ఐదు', translit: 'Aidu', en: "Number Five (5)", lesson: 'Numbers' },
  { te: 'ఒంటె', translit: 'Onte', en: "Camel", lesson: 'Vocabulary' },
  { te: 'ఓడ', translit: 'Ooda', en: "Ship / Vessel", lesson: 'Vocabulary' },
  { te: 'ఔషధము', translit: 'Aushadhamu', en: "Medicine / Healing Herb", lesson: 'Vocabulary' },

  // MILESTONE 2: CONSONANTS (హల్లులు)
  { te: 'కలం', translit: 'Kalam', en: "Pen", lesson: 'Consonants' },
  { te: 'ఖడ్గం', translit: 'Khadgam', en: "Sword", lesson: 'Consonants' },
  { te: 'గంట', translit: 'Ganta', en: "Temple Bell / Hour", lesson: 'Consonants' },
  { te: 'ఘటం', translit: 'Ghatam', en: "Clay Pot", lesson: 'Consonants' },
  { te: 'చక్రం', translit: 'Chakram', en: "Wheel / Discus", lesson: 'Consonants' },
  { te: 'ఛత్రం', translit: 'Chhatram', en: "Umbrella", lesson: 'Consonants' },
  { te: 'జలము', translit: 'Jalamu', en: "Water", lesson: 'Consonants' },
  { te: 'డమరుకం', translit: 'Damarukam', en: "Lord Shiva's Drum", lesson: 'Consonants' },
  { te: 'నది', translit: 'Nadi', en: "River", lesson: 'Consonants' },
  { te: 'మల్లె', translit: 'Malle', en: "Jasmine Flower", lesson: 'Consonants' },
  { te: 'బంతి', translit: 'Banti', en: "Ball", lesson: 'Consonants' },
  { te: 'పలక', translit: 'Palaka', en: "Slate", lesson: 'Consonants' },
  { te: 'దండ', translit: 'Danda', en: "Garland", lesson: 'Consonants' },

  // MILESTONE 3: NUMBERS (సంఖ్యలు)
  { te: 'ఒకటి', translit: 'OkaTi', en: "One (1)", lesson: 'Numbers' },
  { te: 'రెండు', translit: 'RenDu', en: "Two (2)", lesson: 'Numbers' },
  { te: 'మూడు', translit: 'MooDu', en: "Three (3)", lesson: 'Numbers' },
  { te: 'నాలుగు', translit: 'Naalugu', en: "Four (4)", lesson: 'Numbers' },
  { te: 'ఆరు', translit: 'Aaru', en: "Six (6)", lesson: 'Numbers' },
  { te: 'ఏడు', translit: 'Eedu', en: "Seven (7)", lesson: 'Numbers' },
  { te: 'ఎనిమిది', translit: 'Enimidi', en: "Eight (8)", lesson: 'Numbers' },
  { te: 'తొమ్మిది', translit: 'Tommidi', en: "Nine (9)", lesson: 'Numbers' },
  { te: 'పది', translit: 'Padi', en: "Ten (10)", lesson: 'Numbers' },

  // FAMILY (కుటుంబం)
  { te: 'నాన్న', translit: 'Naanna', en: "Father", lesson: 'Family' },
  { te: 'అన్నయ్య', translit: 'Annayya', en: "Elder Brother", lesson: 'Family' },
  { te: 'తమ్ముడు', translit: 'Thammudu', en: "Younger Brother", lesson: 'Family' },
  { te: 'అక్క', translit: 'Akka', en: "Elder Sister", lesson: 'Family' },
  { te: 'చెల్లెలు', translit: 'Chellelu', en: "Younger Sister", lesson: 'Family' },
  { te: 'తాతయ్య', translit: 'Taathayya', en: "Grandfather", lesson: 'Family' },
  { te: 'అమ్మమ్మ', translit: 'Ammamma', en: "Maternal Grandmother", lesson: 'Family' },
  { te: 'నానమ్మ', translit: 'Naanamma', en: "Paternal Grandmother", lesson: 'Family' },

  // CONVERSATION & GREETINGS (సంభాషణ)
  { te: 'నమస్కారం', translit: 'Namaskaram', en: "Hello / Reverent Greetings", lesson: 'Conversation' },
  { te: 'మీ పేరు ఏమిటి?', translit: 'Mee peru emiti?', en: "What is your name?", lesson: 'Conversation' },
  { te: 'నా పేరు', translit: 'Naa peru', en: "My name is", lesson: 'Conversation' },
  { te: 'ఎలా ఉన్నారు?', translit: 'Elaa unnaru?', en: "How are you? (polite)", lesson: 'Conversation' },
  { te: 'బాగున్నాను', translit: 'Baagunnaanu', en: "I am fine / well", lesson: 'Conversation' },
  { te: 'ధన్యవాదాలు', translit: 'Dhanyavaadaalu', en: "Thank you", lesson: 'Conversation' },
  { te: 'క్షమించండి', translit: 'Kshaminchandi', en: "Excuse me / Forgive me", lesson: 'Conversation' },
  { te: 'శుభోదయం', translit: 'Shubhodayam', en: "Good morning", lesson: 'Conversation' },
  { te: 'శుభరాత్రి', translit: 'Shubharaatri', en: "Good night", lesson: 'Conversation' },
  { te: 'మళ్ళీ కలుద్దాం', translit: 'Mallee kaluddam', en: "See you again", lesson: 'Conversation' },

  // LITERATURE & VALUES (సాహిత్యం)
  { te: 'నిజము', translit: 'Nijamu', en: "Truth / Fact", lesson: 'Literature' },
  { te: 'కల్ల', translit: 'Kalla', en: "Falsehood / Lie", lesson: 'Literature' },
  { te: 'సుమతీ', translit: 'Sumathi', en: "Person of good intellect / wisdom", lesson: 'Literature' },
  { te: 'నీతి', translit: 'Neeti', en: "Ethics / Moral virtue", lesson: 'Literature' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderResults(wordBank);
  buildLessonFilters();

  const searchInput = document.getElementById('dictSearch');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  const filtersWrap = document.getElementById('dictFilters');
  if (filtersWrap) {
    filtersWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
      chip.classList.add('filter-chip--active');
      applyFilters();
    });
  }
});

function buildLessonFilters() {
  const lessons = ['All', ...new Set(wordBank.map(w => w.lesson))];
  const wrap = document.getElementById('dictFilters');
  if (!wrap) return;
  wrap.innerHTML = lessons.map((l, i) =>
    `<button type="button" class="filter-chip${i === 0 ? ' filter-chip--active' : ''}" data-lesson="${l}">${l}</button>`
  ).join('');
}

function applyFilters() {
  const searchInput = document.getElementById('dictSearch');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const activeChip = document.querySelector('.filter-chip--active');
  const lessonFilter = activeChip ? activeChip.dataset.lesson : 'All';

  const filtered = wordBank.filter(w => {
    const matchesLesson = lessonFilter === 'All' || w.lesson === lessonFilter;
    const matchesQuery = !query ||
      w.te.toLowerCase().includes(query) ||
      w.translit.toLowerCase().includes(query) ||
      w.en.toLowerCase().includes(query);
    return matchesLesson && matchesQuery;
  });

  renderResults(filtered);
}

function renderResults(list) {
  const grid = document.getElementById('dictGrid');
  const emptyState = document.getElementById('dictEmpty');
  const countEl = document.getElementById('dictCount');
  if (!grid) return;

  if (countEl) {
    countEl.textContent = `${list.length} word${list.length === 1 ? '' : 's'}`;
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  grid.innerHTML = list.map(w => `
    <button type="button" class="dict-card" data-te="${w.te}" aria-label="Play pronunciation of ${w.te}">
      <span class="dict-lesson-tag">${w.lesson}</span>
      <span class="dict-play">🔊</span>
      <span class="dict-te">${w.te}</span>
      <span class="mono-tag">${w.translit}</span>
      <span class="dict-en">${w.en}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.dict-card').forEach(card => {
    card.addEventListener('click', () => speakTelugu(card.dataset.te, card));
  });
}

let teluguVoice = null;
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  teluguVoice = voices.find(v => v.lang === 'te-IN' || v.lang.startsWith('te')) || null;
}
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakTelugu(text, cardEl) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (teluguVoice) utter.voice = teluguVoice;
  utter.lang = 'te-IN';
  utter.rate = 0.85;
  if (cardEl) cardEl.classList.add('dict-playing');
  utter.onend = () => { if (cardEl) cardEl.classList.remove('dict-playing'); };
  utter.onerror = () => { if (cardEl) cardEl.classList.remove('dict-playing'); };
  window.speechSynthesis.speak(utter);
}
