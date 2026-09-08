// Sannivesham Aksharam — Complete Telugu Curriculum & Lessons Data
// 5 Units, 20 Bite-Sized Interactive Lessons with Audio, Quizzes, & Matching

export const UNITS = [
  {
    id: "unit-1",
    unitNumber: 1,
    title: "అచ్చులు",
    titleEn: "Vowels (Achulu)",
    desc: "Master all 16 Telugu vowels from first sound to written form.",
    themeColor: "#7A2048",
    badge: "🌱 Foundations",
    lessons: [
      {
        id: "u1-l1",
        title: "హ్రస్వ అచ్చులు",
        titleEn: "Short Vowels (Hrasvalu)",
        desc: "Learn the short vowel sounds: అ, ఇ, ఉ, ఋ, ఎ, ఒ",
        icon: "🔤",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "అ",
            translit: "a",
            soundNote: "Short 'u' sound as in 'about' or 'cup'",
            exampleTe: "అమ్మ",
            exampleEn: "Amma (Mother)"
          },
          {
            type: "intro",
            te: "ఇ",
            translit: "i",
            soundNote: "Short 'i' sound as in 'bit' or 'pin'",
            exampleTe: "ఇల్లు",
            exampleEn: "Illu (House)"
          },
          {
            type: "intro",
            te: "ఉ",
            translit: "u",
            soundNote: "Short 'u' sound as in 'put' or 'book'",
            exampleTe: "ఉడత",
            exampleEn: "Udata (Squirrel)"
          },
          {
            type: "choice",
            question: "Which letter represents the short sound 'a' as in 'about'?",
            options: ["అ", "ఆ", "ఇ", "ఈ"],
            answer: "అ",
            tip: "'అ' is the very first letter of the Telugu alphabet!"
          },
          {
            type: "sound_match",
            promptText: "Listen to the sound and choose the correct letter:",
            audioTe: "ఇ",
            options: ["ఉ", "ఇ", "అ", "ఎ"],
            answer: "ఇ"
          },
          {
            type: "intro",
            te: "ఎ",
            translit: "e",
            soundNote: "Short 'e' sound as in 'bet' or 'pen'",
            exampleTe: "ఎలుక",
            exampleEn: "Eluka (Rat)"
          },
          {
            type: "intro",
            te: "ఒ",
            translit: "o",
            soundNote: "Short 'o' sound as in 'pot' or 'dot'",
            exampleTe: "ఒంటె",
            exampleEn: "Onte (Camel)"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "అ", en: "a (about)" },
              { te: "ఇ", en: "i (bit)" },
              { te: "ఉ", en: "u (put)" },
              { te: "ఎ", en: "e (bet)" }
            ]
          },
          {
            type: "choice",
            question: "What does 'ఉ' sound like?",
            options: ["u (as in put)", "ee (as in feet)", "o (as in pot)", "ay (as in say)"],
            answer: "u (as in put)"
          }
        ]
      },
      {
        id: "u1-l2",
        title: "దీర్ఘ అచ్చులు",
        titleEn: "Long Vowels (Deerghalu)",
        desc: "Elongate your sounds: ఆ, ఈ, ఊ, ఏ, ఐ, ఓ, ఔ",
        icon: "✨",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "ఆ",
            translit: "aa",
            soundNote: "Long 'aa' sound as in 'father' or 'car'",
            exampleTe: "ఆవు",
            exampleEn: "Aavu (Cow)"
          },
          {
            type: "intro",
            te: "ఈ",
            translit: "ii",
            soundNote: "Long 'ee' sound as in 'feet' or 'meet'",
            exampleTe: "ఈగ",
            exampleEn: "Eega (Housefly)"
          },
          {
            type: "intro",
            te: "ఊ",
            translit: "uu",
            soundNote: "Long 'oo' sound as in 'boot' or 'moon'",
            exampleTe: "ఊయల",
            exampleEn: "Ooyala (Cradle / Swing)"
          },
          {
            type: "choice",
            question: "Which letter makes the long 'aa' sound as in 'father'?",
            options: ["ఆ", "అ", "ఓ", "ఈ"],
            answer: "ఆ",
            tip: "Notice the curved upper loop in 'ఆ' compared to 'అ'."
          },
          {
            type: "sound_match",
            promptText: "Listen to the sound and choose the correct letter:",
            audioTe: "ఈ",
            options: ["ఇ", "ఈ", "ఉ", "ఊ"],
            answer: "ఈ"
          },
          {
            type: "intro",
            te: "ఏ",
            translit: "ee",
            soundNote: "Long 'ay' sound as in 'say' or 'day'",
            exampleTe: "ఏనుగు",
            exampleEn: "Eenugu (Elephant)"
          },
          {
            type: "intro",
            te: "ఐ",
            translit: "ai",
            soundNote: "Diphthong 'ai' as in 'aisle' or 'sky'",
            exampleTe: "ఐదు",
            exampleEn: "Aidu (Five)"
          },
          {
            type: "intro",
            te: "ఓ",
            translit: "oo",
            soundNote: "Long 'o' sound as in 'boat' or 'go'",
            exampleTe: "ఓడ",
            exampleEn: "Ooda (Ship)"
          },
          {
            type: "intro",
            te: "ఔ",
            translit: "au",
            soundNote: "Diphthong 'ow' as in 'cow' or 'cloud'",
            exampleTe: "ఔషధం",
            exampleEn: "Aushadham (Medicine)"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "ఆ", en: "aa (father)" },
              { te: "ఈ", en: "ii (feet)" },
              { te: "ఓ", en: "oo (boat)" },
              { te: "ఔ", en: "au (cow)" }
            ]
          }
        ]
      },
      {
        id: "u1-l3",
        title: "ఉభయాక్షరాలు & ఋత్వాలు",
        titleEn: "Special Vowels (Am, Aha, Ru)",
        desc: "Anusvara (అం), Visarga (అః) and Vocalic R (ఋ, ౠ)",
        icon: "🔆",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "ఋ",
            translit: "ru",
            soundNote: "Vocalic 'ri' / 'ru' as in 'Rishi'",
            exampleTe: "ఋషి",
            exampleEn: "Rishi (Sage)"
          },
          {
            type: "intro",
            te: "అం",
            translit: "am",
            soundNote: "Nasal dot (Sunna / Anusvara) sounding like 'am' or 'an'",
            exampleTe: "అంకె",
            exampleEn: "Anke (Digit / Number)"
          },
          {
            type: "intro",
            te: "అః",
            translit: "aha",
            soundNote: "Aspirated double dot (Visarga) sounding like 'aha'",
            exampleTe: "అంతఃపురం",
            exampleEn: "Antahpuram (Palace Sanctuary)"
          },
          {
            type: "choice",
            question: "Which symbol represents the nasal dot (Anusvara)?",
            options: ["అం", "అః", "ఋ", "ఔ"],
            answer: "అం",
            tip: "The circle 'ం' is called సున్న (Sunna) in Telugu."
          },
          {
            type: "sound_match",
            promptText: "Listen to the sound and choose the correct letter:",
            audioTe: "అం",
            options: ["అ", "ఆ", "అం", "అః"],
            answer: "అం"
          },
          {
            type: "pair_match",
            promptText: "Match the vowel pairs:",
            pairs: [
              { te: "ఋ", en: "ru (rishi)" },
              { te: "అం", en: "am (sunna)" },
              { te: "అః", en: "aha (visarga)" },
              { te: "ఏ", en: "ee (say)" }
            ]
          }
        ]
      },
      {
        id: "u1-l4",
        title: "అచ్చుల మహా సమీక్ష",
        titleEn: "Vowels Master Review",
        desc: "Test your complete recognition of all 16 Telugu vowels!",
        icon: "🏆",
        xp: 25,
        exercises: [
          {
            type: "choice",
            question: "How many vowels (అచ్చులు) are there in the traditional Telugu alphabet?",
            options: ["16", "12", "14", "18"],
            answer: "16",
            tip: "Traditional Telugu has 16 vowels from అ to అః."
          },
          {
            type: "sound_match",
            promptText: "Identify the spoken vowel:",
            audioTe: "ఔ",
            options: ["ఓ", "ఒ", "ఔ", "ఏ"],
            answer: "ఔ"
          },
          {
            type: "pair_match",
            promptText: "హ్రస్వ మరియు దీర్ఘ అచ్చుల జతలను కలపండి (Match short to long vowels):",
            pairs: [
              { te: "అ", en: "ఆ" },
              { te: "ఇ", en: "ఈ" },
              { te: "ఉ", en: "ఊ" },
              { te: "ఎ", en: "ఏ" }
            ]
          },
          {
            type: "choice",
            question: "What is the meaning of the word 'ఆవు' (Aavu)?",
            options: ["Cow", "Mother", "House", "Cradle"],
            answer: "Cow"
          },
          {
            type: "choice",
            question: "What is the meaning of 'అమ్మ' (Amma)?",
            options: ["Mother", "Sister", "Friend", "Teacher"],
            answer: "Mother"
          }
        ]
      }
    ]
  },
  {
    id: "unit-2",
    unitNumber: 2,
    title: "హల్లులు",
    titleEn: "Consonants (Hallulu)",
    desc: "Master the 36 consonants grouped systematically by sound origin.",
    themeColor: "#C9A227",
    badge: "🏛️ Script Mastery",
    lessons: [
      {
        id: "u2-l1",
        title: "క & చ వర్గాలు",
        titleEn: "Ka & Cha Groups",
        desc: "Velar & Palatal consonants: క, ఖ, గ, ఘ & చ, ఛ, జ, ఝ",
        icon: "🗣️",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "క",
            translit: "ka",
            soundNote: "Hard 'k' as in 'kite' or 'sky'",
            exampleTe: "కలము",
            exampleEn: "Kalamu (Pen)"
          },
          {
            type: "intro",
            te: "ఖ",
            translit: "kha",
            soundNote: "Aspirated 'kh' with a breath of air",
            exampleTe: "ఖడ్గము",
            exampleEn: "Khadgamu (Sword)"
          },
          {
            type: "intro",
            te: "గ",
            translit: "ga",
            soundNote: "Soft 'g' as in 'go' or 'game'",
            exampleTe: "గంట",
            exampleEn: "Ganta (Bell)"
          },
          {
            type: "intro",
            te: "చ",
            translit: "cha",
            soundNote: "'ch' as in 'chair' or 'chat'",
            exampleTe: "చదరంగం",
            exampleEn: "Chadarangam (Chess)"
          },
          {
            type: "intro",
            te: "జ",
            translit: "ja",
            soundNote: "'j' as in 'joy' or 'jump'",
            exampleTe: "జలము",
            exampleEn: "Jalamu (Water)"
          },
          {
            type: "choice",
            question: "Which letter represents 'k' as in 'kite'?",
            options: ["క", "గ", "చ", "జ"],
            answer: "క"
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the consonant:",
            audioTe: "గ",
            options: ["క", "గ", "జ", "ఖ"],
            answer: "గ"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "క", en: "ka (pen)" },
              { te: "గ", en: "ga (bell)" },
              { te: "చ", en: "cha (chess)" },
              { te: "జ", en: "ja (water)" }
            ]
          }
        ]
      },
      {
        id: "u2-l2",
        title: "ట & త వర్గాలు",
        titleEn: "Ta & Tha Groups",
        desc: "Retroflex & Dental consonants: ట, ఠ, డ, ఢ, ణ & త, థ, ద, ధ, న",
        icon: "🎯",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "ట",
            translit: "Ta",
            soundNote: "Hard retroflex 'T' with tongue curled back",
            exampleTe: "టమాట",
            exampleEn: "Tamaata (Tomato)"
          },
          {
            type: "intro",
            te: "డ",
            translit: "Da",
            soundNote: "Hard retroflex 'D'",
            exampleTe: "డమరుకం",
            exampleEn: "Damarukam (Shiva's Drum)"
          },
          {
            type: "intro",
            te: "త",
            translit: "ta",
            soundNote: "Soft dental 't' with tongue touching upper teeth",
            exampleTe: "తల",
            exampleEn: "Tala (Head)"
          },
          {
            type: "intro",
            te: "ద",
            translit: "da",
            soundNote: "Soft dental 'd' as in 'the'",
            exampleTe: "దండ",
            exampleEn: "Danda (Garland)"
          },
          {
            type: "intro",
            te: "న",
            translit: "na",
            soundNote: "'n' sound as in 'name'",
            exampleTe: "నమస్కారం",
            exampleEn: "Namaskaram (Greetings)"
          },
          {
            type: "choice",
            question: "Which letter is the dental 'ta' as in 'Tala' (Head)?",
            options: ["త", "ట", "ద", "న"],
            answer: "త",
            tip: "Soft 'త' touches the teeth; retroflex 'ట' curls the tongue to the roof of the mouth."
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the consonant:",
            audioTe: "న",
            options: ["మ", "న", "ణ", "ద"],
            answer: "న"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "ట", en: "Ta (retroflex)" },
              { te: "త", en: "ta (dental)" },
              { te: "ద", en: "da (garland)" },
              { te: "న", en: "na (greetings)" }
            ]
          }
        ]
      },
      {
        id: "u2-l3",
        title: "ప వర్గం",
        titleEn: "Pa Group (Labials)",
        desc: "Lips-together sounds: ప, ఫ, బ, భ, మ",
        icon: "👄",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "ప",
            translit: "pa",
            soundNote: "'p' as in 'peace' or 'pan'",
            exampleTe: "పండు",
            exampleEn: "Pandu (Fruit)"
          },
          {
            type: "intro",
            te: "బ",
            translit: "ba",
            soundNote: "'b' as in 'book' or 'boy'",
            exampleTe: "బంతి",
            exampleEn: "Banti (Ball)"
          },
          {
            type: "intro",
            te: "భ",
            translit: "bha",
            soundNote: "Aspirated 'bh' with breath",
            exampleTe: "భారతం",
            exampleEn: "Bharatam (India / Mahabharata)"
          },
          {
            type: "intro",
            te: "మ",
            translit: "ma",
            soundNote: "'m' as in 'moon' or 'mother'",
            exampleTe: "మల్లె",
            exampleEn: "Malle (Jasmine)"
          },
          {
            type: "choice",
            question: "Which letter is 'pa' as in 'Pandu' (Fruit)?",
            options: ["ప", "బ", "మ", "భ"],
            answer: "ప"
          },
          {
            type: "sound_match",
            promptText: "Listen and choose the matching letter:",
            audioTe: "మ",
            options: ["న", "మ", "ప", "బ"],
            answer: "మ"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "ప", en: "pa (fruit)" },
              { te: "బ", en: "ba (ball)" },
              { te: "భ", en: "bha (bharat)" },
              { te: "మ", en: "ma (jasmine)" }
            ]
          }
        ]
      },
      {
        id: "u2-l4",
        title: "అంతస్థాలు & ఊష్మాలు",
        titleEn: "Liquids, Semivowels & Sibilants",
        desc: "య, ర, ల, వ, శ, ష, స, హ, ళ",
        icon: "🌊",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "ర",
            translit: "ra",
            soundNote: "Tapped 'r' as in 'sunray'",
            exampleTe: "రవి",
            exampleEn: "Ravi (Sun)"
          },
          {
            type: "intro",
            te: "ల",
            translit: "la",
            soundNote: "'l' as in 'lotus'",
            exampleTe: "లత",
            exampleEn: "Lata (Creeper / Vine)"
          },
          {
            type: "intro",
            te: "వ",
            translit: "va",
            soundNote: "Soft 'v' / 'w' sound",
            exampleTe: "వనము",
            exampleEn: "Vanamu (Forest)"
          },
          {
            type: "intro",
            te: "స",
            translit: "sa",
            soundNote: "Clean 's' sound as in 'sun'",
            exampleTe: "సూర్యుడు",
            exampleEn: "Sooryudu (Sun God)"
          },
          {
            type: "intro",
            te: "హ",
            translit: "ha",
            soundNote: "'h' sound as in 'heart'",
            exampleTe: "హంస",
            exampleEn: "Hamsa (Swan)"
          },
          {
            type: "choice",
            question: "Which letter represents the sacred swan 'Hamsa'?",
            options: ["హ", "స", "ల", "ర"],
            answer: "హ",
            tip: "The swan (హంస) is the symbol of Sannivesham!"
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the consonant:",
            audioTe: "స",
            options: ["ష", "శ", "స", "హ"],
            answer: "స"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "ర", en: "ra (sun)" },
              { te: "వ", en: "va (forest)" },
              { te: "స", en: "sa (sun god)" },
              { te: "హ", en: "ha (swan)" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "unit-3",
    unitNumber: 3,
    title: "గుణింతాలు",
    titleEn: "Vowel Signs (Guninthalu)",
    desc: "Combine consonants with vowel diacritics to read full Telugu syllables.",
    themeColor: "#1F6F5C",
    badge: "📜 Syllable Builder",
    lessons: [
      {
        id: "u3-l1",
        title: "తలకట్టు & దీర్ఘం",
        titleEn: "Basic Diacritics (a & aa)",
        desc: "Understand how consonants carry the default 'a' and long 'aa' mark.",
        icon: "✍️",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "క",
            translit: "ka",
            soundNote: "Base consonant with default Talakattu (తలకట్టు)",
            exampleTe: "కథ",
            exampleEn: "Katha (Story)"
          },
          {
            type: "intro",
            te: "కా",
            translit: "kaa",
            soundNote: "With Deergham (దీర్ఘం ా) for a long 'aa' sound",
            exampleTe: "కాకి",
            exampleEn: "Kaaki (Crow)"
          },
          {
            type: "intro",
            te: "గా",
            translit: "gaa",
            soundNote: "Ga + Deergham = Gaa",
            exampleTe: "గాలి",
            exampleEn: "Gaali (Wind / Breeze)"
          },
          {
            type: "choice",
            question: "What vowel sign is added to turn 'క' (ka) into 'కా' (kaa)?",
            options: ["దీర్ఘం (Deergham ా)", "గుడి (Gudi ి)", "కొమ్ము (Kommu ు)", "తలకట్టు (Talakattu)"],
            answer: "దీర్ఘం (Deergham ా)"
          },
          {
            type: "sound_match",
            promptText: "Listen and choose the syllable with long 'aa':",
            audioTe: "కా",
            options: ["క", "కా", "కి", "కు"],
            answer: "కా"
          },
          {
            type: "pair_match",
            promptText: "Match short vs long syllable pairs:",
            pairs: [
              { te: "క", en: "ka (short)" },
              { te: "కా", en: "kaa (long)" },
              { te: "గ", en: "ga (short)" },
              { te: "గా", en: "gaa (long)" }
            ]
          }
        ]
      },
      {
        id: "u3-l2",
        title: "గుడి & గుడిదీర్ఘం",
        titleEn: "The 'i' & 'ii' Signs",
        desc: "Add top hooks for 'i' (ి) and 'ee' (ీ): కి, కీ, గి, గీ",
        icon: "🪝",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "కి",
            translit: "ki",
            soundNote: "Consonant + Gudi (ి) = 'ki'",
            exampleTe: "కిరణం",
            exampleEn: "Kiranam (Ray of Light)"
          },
          {
            type: "intro",
            te: "కీ",
            translit: "kee",
            soundNote: "Consonant + Gudi Deergham (ీ) = 'kee'",
            exampleTe: "కీర్తి",
            exampleEn: "Keerti (Fame / Honor)"
          },
          {
            type: "intro",
            te: "గి",
            translit: "gi",
            soundNote: "Ga + Gudi = Gi",
            exampleTe: "గిన్నె",
            exampleEn: "Ginne (Bowl)"
          },
          {
            type: "choice",
            question: "Which sign turns 'క' into 'కి' (ki)?",
            options: ["గుడి ( ి )", "కొమ్ము ( ు )", "దీర్ఘం ( ా )", "ఎత్వం ( ె )"],
            answer: "గుడి ( ి )"
          },
          {
            type: "sound_match",
            promptText: "Listen and choose the syllable:",
            audioTe: "కీ",
            options: ["కి", "కీ", "కు", "కూ"],
            answer: "కీ"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "కి", en: "ki (ray)" },
              { te: "కీ", en: "kee (fame)" },
              { te: "గి", en: "gi (bowl)" },
              { te: "గీ", en: "gee (geeta)" }
            ]
          }
        ]
      },
      {
        id: "u3-l3",
        title: "కొమ్ము & కొమ్ముదీర్ఘం",
        titleEn: "The 'u' & 'uu' Signs",
        desc: "Add bottom hooks for 'u' (ు) and 'oo' (ూ): కు, కూ, గు, గూ",
        icon: "🌙",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "కు",
            translit: "ku",
            soundNote: "Consonant + Kommu (ు) = 'ku'",
            exampleTe: "కుండ",
            exampleEn: "Kunda (Clay Pot)"
          },
          {
            type: "intro",
            te: "కూ",
            translit: "koo",
            soundNote: "Consonant + Kommu Deergham (ూ) = 'koo'",
            exampleTe: "కూర",
            exampleEn: "Koora (Curry / Vegetable)"
          },
          {
            type: "choice",
            question: "What is the meaning of 'కూర' (Koora)?",
            options: ["Curry / Vegetable", "Water", "House", "Song"],
            answer: "Curry / Vegetable"
          },
          {
            type: "sound_match",
            promptText: "Listen and choose the syllable:",
            audioTe: "కు",
            options: ["క", "కి", "కు", "కూ"],
            answer: "కు"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "కు", en: "ku (pot)" },
              { te: "కూ", en: "koo (curry)" },
              { te: "గు", en: "gu (temple guru)" },
              { te: "గూ", en: "goo (nest)" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "unit-4",
    unitNumber: 4,
    title: "అంకెలు & సంఖ్యలు",
    titleEn: "Telugu Numerals (Ankelu)",
    desc: "Count in Telugu with both traditional script digits and modern numbers.",
    themeColor: "#591636",
    badge: "🔢 Numbers & Math",
    lessons: [
      {
        id: "u4-l1",
        title: "అంకెలు 1 నుండి 5",
        titleEn: "Numbers 1 to 5",
        desc: "ఒకటి, రెండు, మూడు, నాలుగు, ఐదు (౧, ౨, ౩, ౪, ౫)",
        icon: "🖐️",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "ఒకటి (౧)",
            translit: "okati",
            soundNote: "The number 1",
            exampleTe: "ఒకటి",
            exampleEn: "One (1)"
          },
          {
            type: "intro",
            te: "రెండు (౨)",
            translit: "rendu",
            soundNote: "The number 2",
            exampleTe: "రెండు",
            exampleEn: "Two (2)"
          },
          {
            type: "intro",
            te: "మూడు (౩)",
            translit: "moodu",
            soundNote: "The number 3",
            exampleTe: "మూడు",
            exampleEn: "Three (3)"
          },
          {
            type: "intro",
            te: "నాలుగు (౪)",
            translit: "naalugu",
            soundNote: "The number 4",
            exampleTe: "నాలుగు",
            exampleEn: "Four (4)"
          },
          {
            type: "intro",
            te: "ఐదు (౫)",
            translit: "aidu",
            soundNote: "The number 5",
            exampleTe: "ఐదు",
            exampleEn: "Five (5)"
          },
          {
            type: "choice",
            question: "How do you say 'Three' (3) in Telugu?",
            options: ["మూడు", "రెండు", "ఒకటి", "ఐదు"],
            answer: "మూడు"
          },
          {
            type: "sound_match",
            promptText: "Listen to the spoken number and select it:",
            audioTe: "రెండు",
            options: ["ఒకటి", "రెండు", "మూడు", "నాలుగు"],
            answer: "రెండు"
          },
          {
            type: "pair_match",
            promptText: "Match the numbers:",
            pairs: [
              { te: "ఒకటి (౧)", en: "1 (One)" },
              { te: "రెండు (౨)", en: "2 (Two)" },
              { te: "మూడు (౩)", en: "3 (Three)" },
              { te: "ఐదు (౫)", en: "5 (Five)" }
            ]
          }
        ]
      },
      {
        id: "u4-l2",
        title: "అంకెలు 6 నుండి 10",
        titleEn: "Numbers 6 to 10",
        desc: "ఆరు, ఏడు, ఎనిమిది, తొమ్మిది, పది (౬, ౭, ౮, ౯, ౧౦)",
        icon: "🔟",
        xp: 15,
        exercises: [
          {
            type: "intro",
            te: "ఆరు (౬)",
            translit: "aaru",
            soundNote: "The number 6",
            exampleTe: "ఆరు",
            exampleEn: "Six (6)"
          },
          {
            type: "intro",
            te: "ఏడు (౭)",
            translit: "eedu",
            soundNote: "The number 7",
            exampleTe: "ఏడు",
            exampleEn: "Seven (7)"
          },
          {
            type: "intro",
            te: "ఎనిమిది (౮)",
            translit: "enimidi",
            soundNote: "The number 8",
            exampleTe: "ఎనిమిది",
            exampleEn: "Eight (8)"
          },
          {
            type: "intro",
            te: "తొమ్మిది (౯)",
            translit: "tommidi",
            soundNote: "The number 9",
            exampleTe: "తొమ్మిది",
            exampleEn: "Nine (9)"
          },
          {
            type: "intro",
            te: "పది (౧౦)",
            translit: "padi",
            soundNote: "The number 10",
            exampleTe: "పది",
            exampleEn: "Ten (10)"
          },
          {
            type: "choice",
            question: "How do you say 'Ten' (10) in Telugu?",
            options: ["పది", "ఆరు", "ఏడు", "తొమ్మిది"],
            answer: "పది"
          },
          {
            type: "sound_match",
            promptText: "Listen to the number and select:",
            audioTe: "పది",
            options: ["ఐదు", "ఎనిమిది", "తొమ్మిది", "పది"],
            answer: "పది"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "ఆరు (౬)", en: "6 (Six)" },
              { te: "ఏడు (౭)", en: "7 (Seven)" },
              { te: "ఎనిమిది (౮)", en: "8 (Eight)" },
              { te: "పది (౧౦)", en: "10 (Ten)" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "unit-5",
    unitNumber: 5,
    title: "నిత్య సంభాషణ",
    titleEn: "Daily Conversation & Words",
    desc: "Greetings, family relations, essential expressions, and polite conversation.",
    themeColor: "#1a0a12",
    badge: "💬 Real World Telugu",
    lessons: [
      {
        id: "u5-l1",
        title: "శుభాకాంక్షలు & పలకరింపులు",
        titleEn: "Greetings & Politeness",
        desc: "Essential phrases to start any Telugu conversation with warmth.",
        icon: "🙏",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "నమస్కారం",
            translit: "namaskaram",
            soundNote: "Traditional, respectful greeting: 'Hello' or 'Greetings'",
            exampleTe: "అందరికీ నమస్కారం",
            exampleEn: "Greetings to everyone"
          },
          {
            type: "intro",
            te: "ధన్యవాదాలు",
            translit: "dhanyavaadaalu",
            soundNote: "'Thank you' (Formal & Polite)",
            exampleTe: "చాలా ధన్యవాదాలు",
            exampleEn: "Thank you very much"
          },
          {
            type: "intro",
            te: "ఎలా ఉన్నారు?",
            translit: "elaa unnaru?",
            soundNote: "'How are you?' (Respectful form)",
            exampleTe: "బాగున్నారా?",
            exampleEn: "Are you doing well?"
          },
          {
            type: "intro",
            te: "నేను బాగున్నాను",
            translit: "nenu baagunnanu",
            soundNote: "'I am fine / doing well'",
            exampleTe: "నేను బాగున్నాను",
            exampleEn: "I am doing well"
          },
          {
            type: "choice",
            question: "How do you say 'Thank you' in Telugu?",
            options: ["ధన్యవాదాలు", "నమస్కారం", "ఎలా ఉన్నారు?", "శుభోదయం"],
            answer: "ధన్యవాదాలు"
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the phrase:",
            audioTe: "ఎలా ఉన్నారు?",
            options: ["నేను బాగున్నాను", "ఎలా ఉన్నారు?", "ధన్యవాదాలు", "నమస్కారం"],
            answer: "ఎలా ఉన్నారు?"
          },
          {
            type: "pair_match",
            promptText: "Tap matching phrase pairs:",
            pairs: [
              { te: "నమస్కారం", en: "Hello / Greetings" },
              { te: "ధన్యవాదాలు", en: "Thank you" },
              { te: "ఎలా ఉన్నారు?", en: "How are you?" },
              { te: "నేను బాగున్నాను", en: "I am fine" }
            ]
          }
        ]
      },
      {
        id: "u5-l2",
        title: "కుటుంబ బంధాలు",
        titleEn: "Family Relationships",
        desc: "Mother, Father, Brother, Sister, Grandparents in Telugu.",
        icon: "👨‍👩‍👧‍👦",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "అమ్మ",
            translit: "amma",
            soundNote: "Mother",
            exampleTe: "మా అమ్మ",
            exampleEn: "My mother"
          },
          {
            type: "intro",
            te: "నాన్న",
            translit: "naanna",
            soundNote: "Father",
            exampleTe: "మా నాన్న",
            exampleEn: "My father"
          },
          {
            type: "intro",
            te: "అన్నయ్య",
            translit: "annayya",
            soundNote: "Elder brother",
            exampleTe: "పెద్ద అన్నయ్య",
            exampleEn: "Eldest brother"
          },
          {
            type: "intro",
            te: "అక్క",
            translit: "akka",
            soundNote: "Elder sister",
            exampleTe: "మా అక్క",
            exampleEn: "My elder sister"
          },
          {
            type: "choice",
            question: "What is 'Father' in Telugu?",
            options: ["నాన్న", "అమ్మ", "అన్నయ్య", "తమ్ముడు"],
            answer: "నాన్న"
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the family member:",
            audioTe: "అక్క",
            options: ["అమ్మ", "అక్క", "చెల్లి", "నాన్న"],
            answer: "అక్క"
          },
          {
            type: "pair_match",
            promptText: "Tap matching pairs:",
            pairs: [
              { te: "అమ్మ", en: "Mother" },
              { te: "నాన్న", en: "Father" },
              { te: "అన్నయ్య", en: "Elder Brother" },
              { te: "అక్క", en: "Elder Sister" }
            ]
          }
        ]
      },
      {
        id: "u5-l3",
        title: "రోజువారీ ఉపయోగకరమైన మాటలు",
        titleEn: "Essential Daily Vocabulary",
        desc: "Water, Food, House, Book, Time, and Peace.",
        icon: "🌟",
        xp: 20,
        exercises: [
          {
            type: "intro",
            te: "నీళ్ళు",
            translit: "neellu",
            soundNote: "Water (Drinking water)",
            exampleTe: "మంచి నీళ్ళు",
            exampleEn: "Good drinking water"
          },
          {
            type: "intro",
            te: "అన్నం",
            translit: "annam",
            soundNote: "Cooked rice / Food",
            exampleTe: "వేడి అన్నం",
            exampleEn: "Hot cooked rice"
          },
          {
            type: "intro",
            te: "పుస్తకం",
            translit: "pusthakam",
            soundNote: "Book",
            exampleTe: "మంచి పుస్తకం",
            exampleEn: "A good book"
          },
          {
            type: "intro",
            te: "ప్రశాంతత",
            translit: "prashantata",
            soundNote: "Peace / Serenity",
            exampleTe: "మనఃశాంతి",
            exampleEn: "Peace of mind"
          },
          {
            type: "choice",
            question: "What does 'నీళ్ళు' (Neellu) mean?",
            options: ["Water", "Food", "Book", "House"],
            answer: "Water"
          },
          {
            type: "sound_match",
            promptText: "Listen and identify the word:",
            audioTe: "పుస్తకం",
            options: ["పుస్తకం", "కలము", "కాగితం", "బడి"],
            answer: "పుస్తకం"
          },
          {
            type: "pair_match",
            promptText: "Match words to meanings:",
            pairs: [
              { te: "నీళ్ళు", en: "Water" },
              { te: "అన్నం", en: "Food / Rice" },
              { te: "పుస్తకం", en: "Book" },
              { te: "ప్రశాంతత", en: "Peace" }
            ]
          }
        ]
      }
    ]
  }
];

// Flat Dictionary Word Bank compiled from all lessons
export const DICTIONARY_WORDS = [
  { te: "అ", translit: "a", en: "short 'a' sound", category: "Vowels", example: "అమ్మ (Amma - Mother)" },
  { te: "ఆ", translit: "aa", en: "long 'aa' sound", category: "Vowels", example: "ఆవు (Aavu - Cow)" },
  { te: "ఇ", translit: "i", en: "short 'i' sound", category: "Vowels", example: "ఇల్లు (Illu - House)" },
  { te: "ఈ", translit: "ii", en: "long 'ee' sound", category: "Vowels", example: "ఈగ (Eega - Housefly)" },
  { te: "ఉ", translit: "u", en: "short 'u' sound", category: "Vowels", example: "ఉడత (Udata - Squirrel)" },
  { te: "ఊ", translit: "uu", en: "long 'oo' sound", category: "Vowels", example: "ఊయల (Ooyala - Swing)" },
  { te: "ఋ", translit: "ru", en: "vocalic 'ru' sound", category: "Vowels", example: "ఋషి (Rishi - Sage)" },
  { te: "ౠ", translit: "ruu", en: "long 'ruu' sound", category: "Vowels", example: "Traditional long vowel" },
  { te: "ఎ", translit: "e", en: "short 'e' sound", category: "Vowels", example: "ఎలుక (Eluka - Rat)" },
  { te: "ఏ", translit: "ee", en: "long 'ay' sound", category: "Vowels", example: "ఏనుగు (Eenugu - Elephant)" },
  { te: "ఐ", translit: "ai", en: "diphthong 'ai' sound", category: "Vowels", example: "ఐదు (Aidu - Five)" },
  { te: "ఒ", translit: "o", en: "short 'o' sound", category: "Vowels", example: "ఒంటె (Onte - Camel)" },
  { te: "ఓ", translit: "oo", en: "long 'o' sound", category: "Vowels", example: "ఓడ (Ooda - Ship)" },
  { te: "ఔ", translit: "au", en: "diphthong 'ow' sound", category: "Vowels", example: "ఔషధం (Aushadham - Medicine)" },
  { te: "అం", translit: "am", en: "nasal anusvara dot", category: "Vowels", example: "అంకె (Anke - Digit)" },
  { te: "అః", translit: "aha", en: "aspirated visarga", category: "Vowels", example: "అంతఃపురం (Palace)" },
  { te: "కలము", translit: "kalamu", en: "Pen", category: "Consonants", example: "నా కలము (My pen)" },
  { te: "గంట", translit: "ganta", en: "Bell / Hour", category: "Consonants", example: "గుడి గంట (Temple bell)" },
  { te: "జలము", translit: "jalamu", en: "Water", category: "Consonants", example: "పరిశుద్ధ జలము (Pure water)" },
  { te: "తల", translit: "tala", en: "Head", category: "Consonants", example: "తల వంచు (Bow the head)" },
  { te: "పండు", translit: "pandu", en: "Fruit", category: "Consonants", example: "తీపి పండు (Sweet fruit)" },
  { te: "బంతి", translit: "banti", en: "Ball", category: "Consonants", example: "ఆట బంతి (Play ball)" },
  { te: "మల్లె", translit: "malle", en: "Jasmine flower", category: "Consonants", example: "మల్లె పూలు (Jasmine flowers)" },
  { te: "హంస", translit: "hamsa", en: "Swan (Sacred bird)", category: "Consonants", example: "శ్వేత హంస (White swan)" },
  { te: "ఒకటి", translit: "okati", en: "One (1 / ౧)", category: "Numbers", example: "ఒకటి" },
  { te: "రెండు", translit: "rendu", en: "Two (2 / ౨)", category: "Numbers", example: "రెండు కళ్ళు (Two eyes)" },
  { te: "మూడు", translit: "moodu", en: "Three (3 / ౩)", category: "Numbers", example: "మూడు లోకాలు (Three worlds)" },
  { te: "నాలుగు", translit: "naalugu", en: "Four (4 / ౪)", category: "Numbers", example: "నాలుగు వేదాలు (Four Vedas)" },
  { te: "ఐదు", translit: "aidu", en: "Five (5 / ౫)", category: "Numbers", example: "ఐదు వేళ్ళు (Five fingers)" },
  { te: "పది", translit: "padi", en: "Ten (10 / ౧౦)", category: "Numbers", example: "పది రూపాయిలు (Ten rupees)" },
  { te: "నమస్కారం", translit: "namaskaram", en: "Hello / Respectful greetings", category: "Phrases", example: "అందరికీ నమస్కారం" },
  { te: "ధన్యవాదాలు", translit: "dhanyavaadaalu", en: "Thank you", category: "Phrases", example: "చాలా ధన్యవాదాలు" },
  { te: "ఎలా ఉన్నారు?", translit: "elaa unnaru?", en: "How are you?", category: "Phrases", example: "మీరు ఎలా ఉన్నారు?" },
  { te: "నేను బాగున్నాను", translit: "nenu baagunnanu", en: "I am fine / well", category: "Phrases", example: "ధన్యవాదాలు, నేను బాగున్నాను" },
  { te: "అమ్మ", translit: "amma", en: "Mother", category: "Family", example: "మా అమ్మ (My mother)" },
  { te: "నాన్న", translit: "naanna", en: "Father", category: "Family", example: "మా నాన్న (My father)" },
  { te: "అన్నయ్య", translit: "annayya", en: "Elder Brother", category: "Family", example: "మా అన్నయ్య" },
  { te: "అక్క", translit: "akka", en: "Elder Sister", category: "Family", example: "మా అక్క" },
  { te: "నీళ్ళు", translit: "neellu", en: "Water", category: "Daily", example: "మంచి నీళ్ళు ఇవ్వండి" },
  { te: "అన్నం", translit: "annam", en: "Cooked rice / Meal", category: "Daily", example: "భోజనం / అన్నం" },
  { te: "పుస్తకం", translit: "pusthakam", en: "Book", category: "Daily", example: "తెలుగు పుస్తకం" },
  { te: "ప్రశాంతత", translit: "prashantata", en: "Peace / Calmness", category: "Daily", example: "ప్రశాంతమైన మనస్సు" }
];
