// Sannivesham Aksharam — roadmap-data.js
// Default rich curriculum for Telugu learning with multi-format modular sections:
// Matter, Video, Photos, Match the Following, and Quiz.

export const defaultMilestones = [
  {
    id: "milestone-1",
    order: 1,
    title: "వర్ణమాల — అచ్చులు",
    titleEn: "Alphabet — Vowels (Achulu)",
    description: "Master all 16 Telugu vowels, pronunciation nuances, mouth-shaping, and foundational word associations.",
    icon: "🔤",
    badge: "Level 1 • Foundations",
    color: "#7A2048",
    sections: [
      {
        id: "sec-1-1",
        title: "అ నుండి ఋ వరకు — First 7 Vowels",
        subtitle: "Letters అ, ఆ, ఇ, ఈ, ఉ, ఊ, ఋ",
        duration: "10 mins",
        summary: "Learn the primary short and long vowel pairs with native audio, vocabulary associations, and interactive matching.",
        items: [
          {
            type: "matter",
            title: "అచ్చుల పరిచయం • Introduction to Vowels",
            content: `Telugu vowels are called **అచ్చులు (Achulu)**. They represent the foundational life-breath (**ప్రాణములు**) of the Telugu alphabet. Every vowel can stand independently as an initial sound or attach as a vowel symbol (గుణింతం) to consonants.

### మొదటి ఏడు అచ్చులు (First 7 Vowels):
* **అ (a)** — short 'a' as in *about* | ఉదాహరణ: **అమ్మ** (Amma - Mother)
* **ఆ (aa)** — long 'aa' as in *father* | ఉదాహరణ: **ఆవు** (Aavu - Cow)
* **ఇ (i)** — short 'i' as in *bit* | ఉదాహరణ: **ఇల్లు** (Illu - Home)
* **ఈ (ee)** — long 'ee' as in *feet* | ఉదాహరణ: **ఈగ** (Eega - Housefly)
* **ఉ (u)** — short 'u' as in *put* | ఉదాహరణ: **ఉడుత** (Uduta - Squirrel)
* **ఊ (oo)** — long 'oo' as in *boot* | ఉదాహరణ: **ఊయల** (Ooyala - Cradle/Swing)
* **ఋ (ru)** — vocalic 'ri/ru' as in *rishi* | ఉదాహరణ: **ఋషి** (Rishi - Sage)

> **ఉచ్చారణ సూత్రం (Pronunciation Tip):** 
> Notice how Telugu pairs short (**హ్రస్వ**) vowels with long (**దీర్ఘ**) vowels: **అ ↔ ఆ**, **ఇ ↔ ఈ**, **ఉ ↔ ఊ**. Lengthening the sound shifts the meaning of words completely! Click any word below or on vocabulary cards to hear authentic pronunciation.`
          },
          {
            type: "video",
            title: "వీడియో పాఠం • Telugu Vowels Pronunciation Masterclass",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Observe the mouth position and tongue movement for short and long Telugu vowels."
          },
          {
            type: "photos",
            title: "చిత్ర పదజాలం • Illustrated Vocabulary Gallery",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop",
                label: "అ — అమ్మ (Amma)",
                caption: "Mother — the most revered word in Telugu culture."
              },
              {
                url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&auto=format&fit=crop",
                label: "ఆ — ఆవు (Aavu)",
                caption: "Cow — symbol of serenity, motherly warmth and abundance."
              },
              {
                url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop",
                label: "ఇ — ఇల్లు (Illu)",
                caption: "Home — where family and timeless Telugu heritage flourish."
              },
              {
                url: "https://images.unsplash.com/photo-1507666405895-422eee7d517f?w=600&auto=format&fit=crop",
                label: "ఉ — ఉడుత (Uduta)",
                caption: "Squirrel — celebrated in the Ramayana for humble devotion."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Letters with Words & Meanings",
            instructions: "Tap a Telugu letter on the left, then tap its matching English translation or word on the right!",
            pairs: [
              { left: "అ (a)", right: "అమ్మ (Mother)" },
              { left: "ఆ (aa)", right: "ఆవు (Cow)" },
              { left: "ఇ (i)", right: "ఇల్లు (Home)" },
              { left: "ఈ (ee)", right: "ఈగ (Housefly)" },
              { left: "ఉ (u)", right: "ఉడుత (Squirrel)" },
              { left: "ఊ (oo)", right: "ఊయల (Swing / Cradle)" }
            ]
          },
          {
            type: "quiz",
            title: "అక్షర పరీక్ష • Knowledge Check Quiz",
            questions: [
              {
                question: "Which vowel produces the prolonged 'aa' sound as in 'father'?",
                options: ["అ", "ఆ", "ఇ", "ఉ"],
                answerIndex: 1,
                explanation: "'ఆ' is the long vowel (దీర్ఘం) corresponding to 'aa'."
              },
              {
                question: "What does the Telugu word 'ఇల్లు' (Illu) mean?",
                options: ["Squirrel", "Home / House", "Mother", "Swing"],
                answerIndex: 1,
                explanation: "'ఇల్లు' means Home or House in Telugu."
              },
              {
                question: "Which letter is the starting vowel for 'అమ్మ' (Amma)?",
                options: ["అ", "ఈ", "ఊ", "ఋ"],
                answerIndex: 0,
                explanation: "'అ' is the very first letter of the Telugu alphabet and starts 'అమ్మ'."
              },
              {
                question: "What is the meaning of 'ఊయల' (Ooyala)?",
                options: ["Housefly", "Cradle / Swing", "Cow", "Sage"],
                answerIndex: 1,
                explanation: "'ఊయల' means cradle or swing in Telugu."
              }
            ]
          }
        ]
      },
      {
        id: "sec-1-2",
        title: "ఎ నుండి అః వరకు — Diphthongs & Special Vowels",
        subtitle: "Letters ఎ, ఏ, ఐ, ఒ, ఓ, ఔ, అం, అః",
        duration: "12 mins",
        summary: "Understand short and long E, O sounds, diphthongs (Ai, Au), Anusvara (అం) and Visarga (అః).",
        items: [
          {
            type: "matter",
            title: "మిగిలిన అచ్చులు • Compound and Terminal Vowels",
            content: `Now let us explore the remaining vowels and vocalic modifications:

* **ఎ (e)** — short 'e' as in *bet* | ఉదాహరణ: **ఎలుక** (Eluka - Mouse)
* **ఏ (ee/ay)** — long 'ay' as in *may* | ఉదాహరణ: **ఏనుగు** (Eenugu - Elephant)
* **ఐ (ai)** — diphthong as in *aisle* | ఉదాహరణ: **ఐదు** (Aidu - Five)
* **ఒ (o)** — short 'o' as in *pot* | ఉదాహరణ: **ఒంటె** (Onte - Camel)
* **ఓ (oo)** — long 'o' as in *boat* | ఉదాహరణ: **ఓడ** (Ooda - Ship)
* **ఔ (au)** — diphthong as in *cow/out* | ఉదాహరణ: **ఔషధము** (Aushadhamu - Medicine)
* **అం (am)** — anusvara (nasal sound 'm') | ఉదాహరణ: **అంబరం** (Ambaram - Sky)
* **అః (aha)** — visarga (aspirated breathing 'h') | ఉదాహరణ: **నమః** (Namaha - Salutations)

### తెలుగు ప్రత్యేకత (Unique Telugu Feature):
Unlike Hindi and Sanskrit which only have long 'E' and 'O', Dravidian languages like Telugu have distinct **short** and **long** forms:
* Short **ఎ** (e) vs Long **ఏ** (ay)
* Short **ఒ** (o) vs Long **ఓ** (oo)`
          },
          {
            type: "video",
            title: "వీడియో పాఠం • Telugu Vowels Part 2 (ఎ నుండి అః)",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Deep dive into distinguishing short 'e' vs long 'ay' and short 'o' vs long 'oo'."
          },
          {
            type: "photos",
            title: "చిత్ర పదజాలం • Visual Flashcards",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop",
                label: "ఏ — ఏనుగు (Eenugu)",
                caption: "Elephant — majestic animal revered in temple festivals."
              },
              {
                url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop",
                label: "ఓ — ఓడ (Ooda)",
                caption: "Ship — symbol of ancient coastal trade in Andhra."
              },
              {
                url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop",
                label: "ఔ — ఔషధము (Aushadhamu)",
                caption: "Medicine / Healing herbs in traditional Ayurveda."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Letters & Words",
            instructions: "Connect the Telugu word to its meaning or starting letter!",
            pairs: [
              { left: "ఏనుగు", right: "Elephant (ఏ)" },
              { left: "ఎలుక", right: "Mouse (ఎ)" },
              { left: "ఐదు", right: "Number 5 (ఐ)" },
              { left: "ఓడ", right: "Ship (ఓ)" },
              { left: "ఔషధము", right: "Medicine (ఔ)" }
            ]
          },
          {
            type: "quiz",
            title: "పరీక్ష • Vowel Part 2 Mastery",
            questions: [
              {
                question: "What does 'ఏనుగు' (Eenugu) mean in Telugu?",
                options: ["Camel", "Elephant", "Ship", "Medicine"],
                answerIndex: 1,
                explanation: "'ఏనుగు' means Elephant."
              },
              {
                question: "Which vowel represents the 'ow' sound as in 'cow'?",
                options: ["ఓ", "ఒ", "ఔ", "ఏ"],
                answerIndex: 2,
                explanation: "'ఔ' (au) makes the 'ow' sound, as in ఔషధము (Aushadhamu)."
              },
              {
                question: "Which sound does 'అం' (Anusvara) represent?",
                options: ["Aspirated 'ha'", "Nasal 'am/um'", "Long 'ee'", "Diphthong 'ai'"],
                answerIndex: 1,
                explanation: "'అం' represents the nasal humming anusvara sound."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "milestone-2",
    order: 2,
    title: "హల్లులు — Consonants",
    titleEn: "Consonants (Hallulu) & Sound Families",
    description: "Explore the 36+ Telugu consonants categorized systematically by place of articulation (Guttural, Palatal, Dental, Labial).",
    icon: "🗣️",
    badge: "Level 2 • Consonants",
    color: "#1F6F5C",
    sections: [
      {
        id: "sec-2-1",
        title: "క-వర్గము & చ-వర్గము (Ka & Cha Families)",
        subtitle: "Letters క, ఖ, గ, ఘ, ఙ & చ, ఛ, జ, ఝ, ఞ",
        duration: "14 mins",
        summary: "Learn unvoiced, aspirated, and voiced consonant pairs with throat and palate articulation.",
        items: [
          {
            type: "matter",
            title: "కంట్య మరియు తాలవ్య హల్లులు • Guttural & Palatal Sounds",
            content: `Consonants in Telugu are called **హల్లులు (Hallulu)**. They cannot be pronounced without the aid of a vowel (by default, every consonant carries the implicit vowel sound **'a'**).

### క-వర్గము (Guttural — Throat Sounds):
* **క (ka)** — unvoiced, unaspirated | **కలం** (Kalam - Pen)
* **ఖ (kha)** — unvoiced, aspirated | **ఖడ్గం** (Khadgam - Sword)
* **గ (ga)** — voiced, unaspirated | **గంట** (Ganta - Bell)
* **ఘ (gha)** — voiced, aspirated | **ఘటం** (Ghatam - Pot)

### చ-వర్గము (Palatal — Roof of Mouth):
* **చ (cha)** — **చక్రం** (Chakram - Wheel)
* **ఛ (chha)** — **ఛత్రం** (Chhatram - Umbrella)
* **జ (ja)** — **జలము** (Jalamu - Water)
* **ఝ (jha)** — **ఝరి** (Jhari - Mountain Stream / Waterfall)`
          },
          {
            type: "video",
            title: "వీడియో • Telugu Consonants Pronunciation",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Listen to the sharp difference between normal and aspirated consonants (క vs ఖ, గ vs ఘ)."
          },
          {
            type: "photos",
            title: "చిత్ర పదజాలం • Consonant Vocabulary Cards",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop",
                label: "క — కలం (Kalam)",
                caption: "Pen — instrument of knowledge and wisdom."
              },
              {
                url: "https://images.unsplash.com/photo-1514897575457-c4db467cf78e?w=600&auto=format&fit=crop",
                label: "గ — గంట (Ganta)",
                caption: "Temple Bell — divine sound resonating through shrines."
              },
              {
                url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop",
                label: "జ — జలము (Jalamu)",
                caption: "Water — essence of life and sacred rivers."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Consonants to Words",
            instructions: "Match each consonant or word to its English translation!",
            pairs: [
              { left: "కలం (Kalam)", right: "Pen" },
              { left: "గంట (Ganta)", right: "Bell" },
              { left: "జలము (Jalamu)", right: "Water" },
              { left: "చక్రం (Chakram)", right: "Wheel" },
              { left: "ఛత్రం (Chhatram)", right: "Umbrella" }
            ]
          },
          {
            type: "quiz",
            title: "హల్లుల క్విజ్ • Ka & Cha Groups",
            questions: [
              {
                question: "What does 'గంట' (Ganta) mean in Telugu?",
                options: ["Pen", "Bell / Hour", "Water", "Umbrella"],
                answerIndex: 1,
                explanation: "'గంట' means Bell, and is also used for Hour or O'clock."
              },
              {
                question: "Which of these consonants is aspirated (heavy breath)?",
                options: ["క", "ఖ", "గ", "చ"],
                answerIndex: 1,
                explanation: "'ఖ' (kha) is aspirated with a burst of air from the throat."
              },
              {
                question: "What is the Telugu word for Water starting with 'జ'?",
                options: ["జలము (Jalamu)", "కలం (Kalam)", "గంట (Ganta)", "చక్రం (Chakram)"],
                answerIndex: 0,
                explanation: "'జలము' means Water."
              }
            ]
          }
        ]
      },
      {
        id: "sec-2-2",
        title: "ట, త, ప వర్గాలు & అంతస్థాలు (Ta, Tha, Pa Groups)",
        subtitle: "Letters ట, ఠ, డ, ఢ, ణ | త, థ, ద, ధ, న | ప, ఫ, బ, భ, మ | య, ర, ల, వ, స, హ",
        duration: "15 mins",
        summary: "Master tongue-curling retroflex sounds, teeth-touching dentals, and gentle labials.",
        items: [
          {
            type: "matter",
            title: "జిహ్వామూలీయ మరియు దంత్య హల్లులు • Articulation Groups",
            content: `The remaining consonants span three crucial zones:

### 1. ట-వర్గము (Retroflex — Tongue Curled Back):
* **ట (Ta)** — **టపాకాయ** (Tapakaya - Firecracker)
* **డ (Da)** — **డమరుకం** (Damarukam - Lord Shiva's Drum)
* **ణ (Na)** — **వీణ** (Veena - Musical Instrument)

### 2. త-వర్గము (Dental — Tongue Touches Front Teeth):
* **త (ta)** — **తల** (Tala - Head)
* **ద (da)** — **దండ** (Danda - Garland)
* **న (na)** — **నది** (Nadi - River)

### 3. ప-వర్గము (Labial — Lips Together):
* **ప (pa)** — **పలక** (Palaka - Slate)
* **బ (ba)** — **బంతి** (Banti - Ball)
* **మ (ma)** — **మల్లె** (Malle - Jasmine Flower)

### 4. అంతస్థములు & ఊష్మములు (Semivowels & Sibilants):
* **య (ya)**, **ర (ra)**, **ల (la)**, **వ (va)**
* **శ (sha)**, **ష (Sha)**, **స (sa)**, **హ (ha)**, **ళ (La)**, **ఱ (bandira)**`
          },
          {
            type: "video",
            title: "వీడియో • Retroflex vs Dental Consonants",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "How to curl your tongue for 'ట' (Ta) vs touch your front teeth for 'త' (ta)."
          },
          {
            type: "photos",
            title: "చిత్ర పదజాలం • Consonants Gallery",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop",
                label: "న — నది (Nadi)",
                caption: "River — Krishna and Godavari bless Telugu soil."
              },
              {
                url: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format&fit=crop",
                label: "మ — మల్లె (Malle)",
                caption: "Jasmine — fragrant flower adorning hair and garlands."
              },
              {
                url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop",
                label: "ద — దండ (Danda)",
                caption: "Garland — offered with reverence in worship."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Dental & Labial Words",
            instructions: "Pair the Telugu word with its correct English meaning!",
            pairs: [
              { left: "నది (Nadi)", right: "River" },
              { left: "తల (Tala)", right: "Head" },
              { left: "మల్లె (Malle)", right: "Jasmine" },
              { left: "బంతి (Banti)", right: "Ball" },
              { left: "పలక (Palaka)", right: "Slate" }
            ]
          },
          {
            type: "quiz",
            title: "క్విజ్ • Consonants Finale",
            questions: [
              {
                question: "What is 'నది' (Nadi) in English?",
                options: ["Head", "River", "Ball", "Garland"],
                answerIndex: 1,
                explanation: "'నది' means River."
              },
              {
                question: "Which of these consonants is pronounced by curling your tongue back (Retroflex)?",
                options: ["త", "ట", "ప", "మ"],
                answerIndex: 1,
                explanation: "'ట' (Ta) is retroflex with the tongue curled against the roof of the mouth."
              },
              {
                question: "What is the meaning of 'మల్లె' (Malle)?",
                options: ["Jasmine flower", "River", "Slate", "Drum"],
                answerIndex: 0,
                explanation: "'మల్లె' is Jasmine, the beloved fragrant blossom."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "milestone-3",
    order: 3,
    title: "గుణింతాలు & పదజాలం",
    titleEn: "Compound Syllables & Essential Vocabulary",
    description: "Learn how consonants unite with vowel symbols (గుణింతపు గుర్తులు), count numbers 1-20, and name family members.",
    icon: "📖",
    badge: "Level 3 • Syllables & Words",
    color: "#C9A227",
    sections: [
      {
        id: "sec-3-1",
        title: "గుణింతపు గుర్తులు — Vowel Marks & Syllables",
        subtitle: "తలకట్టు, దీర్ఘం, గుడి, కొమ్ము, ఎత్వము, ఓత్వము",
        duration: "16 mins",
        summary: "Understand how attaching vowel symbols transforms a single consonant into 16 melodious syllables (క, కా, కి, కీ...).",
        items: [
          {
            type: "matter",
            title: "గుణింతం ఎలా ఏర్పడుతుంది? • The Art of Gunintalu",
            content: `When a consonant attaches to a vowel, it uses a **గుణింతపు గుర్తు (Gunintamu Mark)**. This gives Telugu its famous circular, melodious calligraphy:

### క-గుణింతం (Example with letter 'క'):
* **క** (ka) — తలకట్టు (talakattu)
* **కా** (kaa) — దీర్ఘం (deergham)
* **కి** (ki) — గుడి (gudi)
* **కీ** (kee) — గుడిదీర్ఘం (gudi deergham)
* **కు** (ku) — కొమ్ము (kommu)
* **కూ** (koo) — కొమ్ముదీర్ఘం (kommu deergham)
* **కె** (ke) — ఎత్వము (etwamu)
* **కే** (kay) — ఏత్వము (aytwamu)
* **కై** (kai) — ఐత్వము (aitwamu)
* **కొ** (ko) — ఒత్వము (otwamu)
* **కో** (koo) — ఓత్వము (ootwamu)
* **కౌ** (kau) — ఔత్వము (autwamu)
* **కం** (kam) — సున్నా (sunna)
* **కః** (kaha) — విసర్గ (visarga)

Once you know the marks for 'క', you can read and write syllables for **ALL consonants** across the Telugu language!`
          },
          {
            type: "video",
            title: "వీడియో పాఠం • Mastering Gunintalu Easily",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Step-by-step visual guide on drawing each vowel sign attached to Telugu consonants."
          },
          {
            type: "photos",
            title: "చిత్రాలు • Gunintalu Visual Chart",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop",
                label: "గుణింతాల చార్ట్ (Gunintalu Matrix)",
                caption: "The structured geometric logic of Telugu compound writing."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Vowel Marks with Sounds",
            instructions: "Match the modified syllable with its pronunciation!",
            pairs: [
              { left: "కా (kaa)", right: "Long 'aa' mark (దీర్ఘం)" },
              { left: "కి (ki)", right: "Short 'i' mark (గుడి)" },
              { left: "కు (ku)", right: "Short 'u' mark (కొమ్ము)" },
              { left: "కే (kay)", right: "Long 'ay' mark (ఏత్వము)" },
              { left: "కం (kam)", right: "Zero / Anusvara (సున్నా)" }
            ]
          },
          {
            type: "quiz",
            title: "గుణింతాల క్విజ్ • Syllable Knowledge Check",
            questions: [
              {
                question: "Which sign transforms 'క' (ka) into 'కా' (kaa)?",
                options: ["తలకట్టు (Talakattu)", "దీర్ఘం (Deergham)", "గుడి (Gudi)", "కొమ్ము (Kommu)"],
                answerIndex: 1,
                explanation: "'దీర్ఘం' lengthens the vowel to 'kaa'."
              },
              {
                question: "What is the vowel mark used in 'కి' (ki)?",
                options: ["గుడి (Gudi)", "ఎత్వము", "సున్నా", "కొమ్ము"],
                answerIndex: 0,
                explanation: "'గుడి' attaches the short 'i' sound to the consonant."
              },
              {
                question: "How is 'కం' (kam) formed?",
                options: ["Adding a circle (సున్నా / Anusvara)", "Adding deergham", "Adding visarga", "Adding kommu"],
                answerIndex: 0,
                explanation: "A circle (సున్నా) adds the nasal 'm' sound."
              }
            ]
          }
        ]
      },
      {
        id: "sec-3-2",
        title: "సంఖ్యలు & బంధుత్వాలు — Numbers & Family",
        subtitle: "Numbers 1-10 & Family relations (అమ్మ, నాన్న, అన్నయ్య, తమ్ముడు)",
        duration: "15 mins",
        summary: "Count fluently from 1 to 10 in Telugu and address parents, siblings, grandparents with cultural warmth.",
        items: [
          {
            type: "matter",
            title: "సంఖ్యలు & కుటుంబం • Everyday Telugu Foundations",
            content: `Let us learn two essential parts of daily conversation:

### సంఖ్యలు (Numbers 1 to 10):
* **౧. ఒకటి (OkaTi)** — 1
* **౨. రెండు (RenDu)** — 2
* **౩. మూడు (MooDu)** — 3
* **౪. నాలుగు (Naalugu)** — 4
* **౫. ఐదు (Aidu)** — 5
* **౬. ఆరు (Aaru)** — 6
* **౭. ఏడు (Eedu)** — 7
* **౮. ఎనిమిది (Enimidi)** — 8
* **౯. తొమ్మిది (Tommidi)** — 9
* **౧౦. పది (Padi)** — 10

### కుటుంబ బంధుత్వాలు (Family Relationships):
* **అమ్మ (Amma)** — Mother
* **నాన్న (Naanna)** — Father
* **అన్నయ్య (Annayya)** — Elder Brother
* **తమ్ముడు (Thammudu)** — Younger Brother
* **అక్క (Akka)** — Elder Sister
* **చెల్లెలు (Chellelu)** — Younger Sister
* **తాతయ్య (Taathayya)** — Grandfather
* **నానమ్మ / అమ్మమ్మ (Naanamma / Ammamma)** — Grandmother`
          },
          {
            type: "video",
            title: "వీడియో • Counting in Telugu with Native Audio",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Count effortlessly from ఒకటి to పది and practice rhythmic pronunciation."
          },
          {
            type: "photos",
            title: "చిత్రాలు • Family & Number Cards",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop",
                label: "కుటుంబం (Kutumbam)",
                caption: "Family unity is the heart of Indian and Telugu social life."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Numbers & Family Words",
            instructions: "Pair the Telugu term with its number or meaning!",
            pairs: [
              { left: "ఒకటి (OkaTi)", right: "One (1)" },
              { left: "రెండు (RenDu)", right: "Two (2)" },
              { left: "ఐదు (Aidu)", right: "Five (5)" },
              { left: "నాన్న (Naanna)", right: "Father" },
              { left: "అన్నయ్య (Annayya)", right: "Elder Brother" },
              { left: "అక్క (Akka)", right: "Elder Sister" }
            ]
          },
          {
            type: "quiz",
            title: "సంఖ్యలు & బంధుత్వాల పరీక్ష • Quick Quiz",
            questions: [
              {
                question: "What is the number '5' in Telugu?",
                options: ["ఒకటి", "మూడు", "ఐదు", "పది"],
                answerIndex: 2,
                explanation: "'ఐదు' (Aidu) means Five."
              },
              {
                question: "What does 'నాన్న' (Naanna) mean?",
                options: ["Father", "Mother", "Elder Brother", "Grandfather"],
                answerIndex: 0,
                explanation: "'నాన్న' means Father."
              },
              {
                question: "How do you say 'Elder Sister' in Telugu?",
                options: ["చెల్లెలు", "అక్క (Akka)", "అమ్మ", "తమ్ముడు"],
                answerIndex: 1,
                explanation: "'అక్క' (Akka) is Elder Sister, while 'చెల్లెలు' is Younger Sister."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "milestone-4",
    order: 4,
    title: "సంభాషణ & సంస్కృతి",
    titleEn: "Conversations, Greetings & Cultural Fluency",
    description: "Start conversing with confidence: polite greetings, day-to-day questions, and classic Telugu moral verses (సుమతీ శతకం).",
    icon: "🌺",
    badge: "Level 4 • Real-World Telugu",
    color: "#591636",
    sections: [
      {
        id: "sec-4-1",
        title: "నిత్య జీవిత సంభాషణలు — Daily Greetings & Phrases",
        subtitle: "నమస్కారం, ధన్యవాదాలు, మీ పేరు ఏమిటి?, ఎలా ఉన్నారు?",
        duration: "18 mins",
        summary: "Engage in everyday pleasantries, ask names, inquire how someone is doing, and show courtesy.",
        items: [
          {
            type: "matter",
            title: "మర్యాదపూర్వక సంభాషణ • Polite Everyday Conversation",
            content: `The beauty of Telugu conversation lies in its respect and melody (**తెలుగు తేనె వంటిది** - Telugu is sweet like honey).

### ముఖ్యమైన పలకరింపులు (Essential Greetings):
* **నమస్కారం (Namaskaram)** — Hello / Greetings (respectful)
* **మీ పేరు ఏమిటి? (Mee peru emiTi?)** — What is your name?
* **నా పేరు ... (Naa peru ...)** — My name is ...
* **ఎలా ఉన్నారు? (Elaa unnaru?)** — How are you? (polite/formal)
* **బాగున్నాను (Baagunnaanu)** — I am doing well
* **ధన్యవాదాలు (Dhanyavaadaalu)** — Thank you
* **క్షమించండి (Kshaminchandi)** — Excuse me / Pardon me
* **శుభోదయం (Shubhodayam)** — Good morning
* **శుభరాత్రి (Shubharaatri)** — Good night
* **మళ్ళీ కలుద్దాం (Mallee kaluddam)** — See you again!`
          },
          {
            type: "video",
            title: "వీడియో • Real Telugu Daily Dialogues",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Listen to natural tone, inflection, and cadence in everyday Telugu dialogues."
          },
          {
            type: "photos",
            title: "చిత్రాలు • Cultural Expressions",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop",
                label: "నమస్కారం (Namaskaram)",
                caption: "Traditional greeting with folded hands honoring the divinity in another."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Conversational Phrases",
            instructions: "Pair the Telugu greeting with its English meaning!",
            pairs: [
              { left: "నమస్కారం (Namaskaram)", right: "Greetings / Hello" },
              { left: "ఎలా ఉన్నారు? (Elaa unnaru?)", right: "How are you?" },
              { left: "బాగున్నాను (Baagunnaanu)", right: "I am fine / well" },
              { left: "ధన్యవాదాలు (Dhanyavaadaalu)", right: "Thank you" },
              { left: "మళ్ళీ కలుద్దాం (Mallee kaluddam)", right: "See you again" }
            ]
          },
          {
            type: "quiz",
            title: "సంభాషణ పరీక్ష • Conversation Fluency",
            questions: [
              {
                question: "How do you ask 'What is your name?' respectfully in Telugu?",
                options: ["ఎలా ఉన్నారు?", "మీ పేరు ఏమిటి? (Mee peru emiti?)", "బాగున్నాను", "ధన్యవాదాలు"],
                answerIndex: 1,
                explanation: "'మీ పేరు ఏమిటి?' means 'What is your name?'."
              },
              {
                question: "If someone asks 'ఎలా ఉన్నారు?', what is the natural positive reply?",
                options: ["ధన్యవాదాలు", "నమస్కారం", "బాగున్నాను (Baagunnaanu)", "క్షమించండి"],
                answerIndex: 2,
                explanation: "'బాగున్నాను' means 'I am doing well'."
              },
              {
                question: "What does 'మళ్ళీ కలుద్దాం' (Mallee kaluddam) mean?",
                options: ["Good morning", "Excuse me", "See you again", "Thank you"],
                answerIndex: 2,
                explanation: "'మళ్ళీ కలుద్దాం' translates to 'We will meet again / See you again'."
              }
            ]
          }
        ]
      },
      {
        id: "sec-4-2",
        title: "తెలుగు పద్యాలు — Sumathi Satakam Pearls",
        subtitle: "Classic 4-line verses packed with timeless ethical wisdom",
        duration: "15 mins",
        summary: "Recite your first classical Telugu poem with musical cadence and understand its universal moral.",
        items: [
          {
            type: "matter",
            title: "సుమతీ శతక రత్నం • Jewel of Sumathi Satakam",
            content: `Telugu literature is renowned for **శతకాలు (Centuries of Verses)**. Baddena's *Sumathi Satakam* teaches timeless morals in musical, easy-to-recite 4-line meters (**కందం**):

### పద్యం (The Verse):
> **వినదగు నెవ్వరు చెప్పిన**  
> **వినినంతనె వేగపడక వివరింపదగున్**  
> **కని కల్ల నిజము తెలిసిన**  
> **మనుజుడెపో నీతిపరుడు మహిలో సుమతీ!**

### భావము (The Universal Meaning):
Listen patiently no matter who speaks. But upon hearing, do not rush into hasty action or emotional judgment. Analyze deeply, investigate, and discern the true fact from falsehood. The one who thus acts with discernment is truly a person of wisdom and upright character on this earth!

### ముఖ్య పదాలు (Key Words):
* **వినదగు (Vinadagu)** — one should listen
* **వేగపడక (Vegapadaka)** — without hastiness
* **నిజము (Nijamu)** — truth
* **సుమతీ (Sumathi)** — O person of good intellect!`
          },
          {
            type: "video",
            title: "వీడియో • Sumathi Satakam Chanting",
            videoUrl: "https://www.youtube-nocookie.com/embed/5qap5aO4i9A",
            caption: "Listen to the traditional musical meter and rhythm of Telugu ethical poetry."
          },
          {
            type: "photos",
            title: "చిత్రాలు • Telugu Literary Heritage",
            photos: [
              {
                url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600&auto=format&fit=crop",
                label: "తాళపత్ర గ్రంథాలు (Palm Leaf Manuscripts)",
                caption: "Centuries of Telugu poetic gems preserved for posterity."
              }
            ]
          },
          {
            type: "match",
            title: "జతపరచండి • Match Poetic Terms to Meanings",
            instructions: "Pair the classical Telugu words with their modern meanings!",
            pairs: [
              { left: "నిజము (Nijamu)", right: "Truth" },
              { left: "కల్ల (Kalla)", right: "Falsehood / Lie" },
              { left: "సుమతీ (Sumathi)", right: "Wise person" },
              { left: "వేగపడక (Vegapadaka)", right: "Without rushing" }
            ]
          },
          {
            type: "quiz",
            title: "సాహిత్య క్విజ్ • Literary Knowledge Check",
            questions: [
              {
                question: "According to the Sumathi Satakam verse, what should a wise person do after hearing something?",
                options: [
                  "React immediately with anger",
                  "Believe whatever is heard without thinking",
                  "Investigate calmly and discern truth from falsehood",
                  "Ignore everything completely"
                ],
                answerIndex: 2,
                explanation: "The verse teaches: 'వినినంతనె వేగపడక వివరింపదగున్' — investigate and understand truth before acting."
              },
              {
                question: "What does 'నిజము' (Nijamu) mean?",
                options: ["Truth", "Falsehood", "Haste", "Poem"],
                answerIndex: 0,
                explanation: "'నిజము' means Truth in Telugu."
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Returns active milestones: from localStorage cache or fallback to defaultMilestones
 */
export function getInitialMilestones() {
  try {
    const cached = localStorage.getItem("aksharam_roadmap_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return defaultMilestones;
}
