/**
 * Sannivesham Admin Dashboard — Smart Slugs Module
 * Translates Telugu cultural titles into clean, SEO-friendly Latin URLs.
 */

export function slugify(text) {
  if (!text) return "";
  let str = text.trim();

  // If text already has English letters with no non-ASCII, clean directly
  const englishParts = str.match(/[a-zA-Z0-9]+/g);
  if (englishParts && englishParts.join("-").length >= 3 && !/[^\x00-\x7F]/.test(str)) {
    return englishParts.join("-").toLowerCase();
  }

  // Common Devotional Dictionary (Telugu -> Latin)
  const devotionalMap = [
    ["హనుమాన్", "hanuman"], ["ఆంజనేయ", "anjaneya"], ["మారుతి", "maruthi"],
    ["చాలీసా", "chalisa"], ["చాలీసాలు", "chalisas"], ["దండకం", "dandakam"],
    ["స్తోత్రం", "stotram"], ["స్తోత్రాలు", "stotras"], ["స్తోత్రరాజం", "stotrarajam"],
    ["సహస్రనామ", "sahasranama"], ["సహస్రనామావళి", "sahasranamavali"],
    ["అష్టోత్తర", "ashtottara"], ["శతనామావళి", "shatanamavali"],
    ["కవచం", "kavacham"], ["సూక్తం", "suktam"], ["హృదయం", "hrudayam"],
    ["సుప్రభాతం", "suprabhatam"], ["ఆర్తి", "aarti"], ["మహిమ్న", "mahimna"],
    ["అమృతవాణి", "amruthavani"], ["తాండవ", "tandava"],
    ["గణపతి", "ganapathi"], ["వినాయక", "vinayaka"], ["గణేశ", "ganesha"],
    ["శివ", "shiva"], ["శంకర", "shankara"], ["రుద్ర", "rudra"], ["ఈశ్వర", "eshwara"],
    ["విష్ణు", "vishnu"], ["నారాయణ", "narayana"], ["కృష్ణ", "krishna"], ["రామ", "rama"],
    ["వెంకటేశ్వర", "venkateswara"], ["గోవింద", "govinda"], ["శ్రీనివాస", "srinivasa"],
    ["బాలాజీ", "balaji"], ["నరసింహ", "narasimha"], ["హయగ్రీవ", "hayagriva"],
    ["లక్ష్మీ", "lakshmi"], ["దుర్గ", "durga"], ["సరస్వతి", "saraswati"],
    ["గాయత్రి", "gayatri"], ["లలిత", "lalitha"], ["కాళి", "kali"],
    ["అన్నపూర్ణ", "annapurna"], ["మహిషాసుర", "mahishasura"], ["మర్దిని", "mardini"],
    ["సుబ్రహ్మణ్య", "subrahmanya"], ["షణ్ముఖ", "shanmukha"], ["కార్తికేయ", "karthikeya"],
    ["సూర్య", "surya"], ["ఆదిత్య", "aditya"], ["నవగ్రహ", "navagraha"],
    ["తిరుమల", "tirumala"], ["తిరుపతి", "tirupati"], ["శ్రీశైలం", "srisailam"],
    ["మల్లికార్జున", "mallikarjuna"], ["వారణాసి", "varanasi"], ["కాశీ", "kashi"],
    ["విశ్వనాథ", "vishwanatha"], ["యాదాద్రి", "yadadri"], ["సింహాచలం", "simhachalam"],
    ["విజయవాడ", "vijayawada"], ["కనకదుర్గ", "kanakadurga"], ["శబరిమల", "sabarimala"],
    ["అయ్యప్ప", "ayyappa"], ["చవితి", "chavithi"], ["దసరా", "dasara"],
    ["దీపావళి", "diwali"], ["సంక్రాంతి", "sankranti"], ["శివరాత్రి", "shivaratri"],
    ["ఉగాది", "ugadi"], ["నవరాత్రి", "navaratri"], ["శ్రీరామనవమి", "sri-rama-navami"],
    ["శ్రీ", "sri"], ["మహా", "maha"]
  ];

  for (const [te, en] of devotionalMap) {
    str = str.split(te).join(" " + en + " ");
  }

  // Phonetic fallback for remaining Telugu glyphs
  const teCharMap = {
    'అ':'a','ఆ':'aa','ఇ':'i','ఈ':'ee','ఉ':'u','ఊ':'oo','ఋ':'ru','ఎ':'e','ఏ':'e','ఐ':'ai','ఒ':'o','ఓ':'o','ఔ':'au','అం':'am',
    'క':'k','ఖ':'kh','గ':'g','ఘ':'gh','ఙ':'ng',
    'చ':'ch','ఛ':'chh','జ':'j','ఝ':'jh','ఞ':'ny',
    'ట':'t','ఠ':'th','డ':'d','ఢ':'dh','ణ':'n',
    'త':'t','థ':'th','ద':'d','ధ':'dh','న':'n',
    'ప':'p','ఫ':'ph','బ':'b','భ':'bh','మ':'m',
    'య':'y','ర':'r','ల':'l','వ':'v','శ':'sh','ష':'sh','స':'s','హ':'h','ళ':'l','క్ష':'ksh','ఱ':'r',
    'ా':'aa','ి':'i','ీ':'ee','ు':'u','ూ':'oo','ృ':'ru','ె':'e','ే':'e','ై':'ai','ొ':'o','ో':'o','ఔ':'au','ం':'m','ః':'h','్':''
  };

  let romanized = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    romanized += (teCharMap[ch] !== undefined ? teCharMap[ch] : ch);
  }

  let slug = romanized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 2) {
    slug = "item-" + Math.abs(text.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 100000);
  }

  return slug;
}

export function attachAutoSlug(titleInputId, slugInputId) {
  const titleEl = document.getElementById(titleInputId);
  const slugEl = document.getElementById(slugInputId);
  if (titleEl && slugEl) {
    titleEl.addEventListener("input", () => {
      if (!slugEl.dataset.manuallyEdited) {
        slugEl.value = slugify(titleEl.value);
      }
    });
    slugEl.addEventListener("input", () => {
      slugEl.dataset.manuallyEdited = "true";
    });
  }
}
