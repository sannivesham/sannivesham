/**
 * Sannivesham Drik Ganita Panchangam Engine (సన్నివేశం దృక్ సిద్ధాంత పంచాంగం)
 * 100% Automated, Client-Side Vedic Astronomical Calculation Engine.
 * Conforms to authentic Telugu Drik Ganita tradition (Chandramana Amanta system).
 * 
 * Accurately calculates:
 * - Tithi (తిథి), Paksham (పక్షం) + Exact End Time (వరకు) & Next Tithi Transition
 * - Nakshatram (నక్షత్రం) + Exact End Time (వరకు) & Next Nakshatram Transition
 * - Telugu Samvatsaram (సంవత్సరం), Ayanam (ఆయనం), Rutuvu (ఋతువు), Telugu Masam (మాసం)
 * - Yoga (యోగం), Karanam (కరణం)
 * - Rahu Kalam (రాహుకాలం), Yamagandam (యమగండం), Gulika Kalam (గుళిక కాలం)
 * - Abhijit Muhurtham (అభిజిత్ ముహూర్తం), Amrutha Gadiyalu (అమృత ఘడియలు), Durmuhurtham (దుర్ముహూర్తం), Varjyam (వర్జ్యం)
 * - Sunrise & Sunset (సూర్యోదయం & సూర్యాస్తమయం) via NOAA solar algorithm
 * - Telugu & Indian Festivals, Vratams, Ekadashi, Sankashtahara Chaturthi, Purnima, Amavasya
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SanniveshamPanchang = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const RAD = Math.PI / 180.0;

  function normalize(deg) {
    let d = deg % 360.0;
    return d < 0 ? d + 360.0 : d;
  }

  // ─── Traditional Telugu & Vedic Data Tables ────────────────────────────────

  const TELUGU_MONTHS = [
    "చైత్రం", "వైశాఖం", "జ్యేష్ఠం", "ఆషాఢం",
    "శ్రావణం", "భాద్రపదం", "ఆశ్వయుజం", "కార్తీకం",
    "మార్గశిరం", "పుష్యం", "మాఘం", "ఫాల్గుణం"
  ];

  const TELUGU_MONTHS_EN = [
    "Chaitram", "Vaisakham", "Jyeshtham", "Ashadham",
    "Sravanam", "Bhadrapadam", "Aswayujam", "Karthikam",
    "Margasiram", "Pushyam", "Magham", "Phalgunam"
  ];

  const GREG_MONTHS_TE = [
    "జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్",
    "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"
  ];

  const GREG_MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const DAYS_TE = [
    "ఆదివారం (భానువాసరే)",
    "సోమవారం (ఇందువాసరే)",
    "మంగళవారం (భౌమవాసరే)",
    "బుధవారం (సౌమ్యవాసరే)",
    "గురువారం (బృహస్పతివాసరే)",
    "శుక్రవారం (భృగువాసరే)",
    "శనివారం (స్థిరవాసరే)"
  ];

  const DAYS_SHORT_TE = ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"];
  const DAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const TITHI_NAMES_TE = [
    "పాడ్యమి", "విదియ", "తదియ", "చవితి", "పంచమి", "షష్ఠి",
    "సప్తమి", "అష్టమి", "నవమి", "దశమి", "ఏకాదశి", "ద్వాదశి",
    "త్రయోదశి", "చతుర్దశి", "పౌర్ణమి", "అమావాస్య"
  ];

  const TITHI_NAMES_EN = [
    "Prathama / Padyami", "Vidiya", "Thadiya", "Chavithi", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dasami", "Ekadasi", "Dwadasi",
    "Trayodasi", "Chaturdasi", "Purnima", "Amavasya"
  ];

  const NAKSHATRAS_TE = [
    "అశ్విని", "భరణి", "కృత్తిక", "రోహిణి", "మృగశిర", "ఆర్ద్ర",
    "పునర్వసు", "పుష్యమి", "ఆశ్లేష", "మఖ", "పుబ్బ (పూర్వఫల్గుణి)", "ఉత్తర (ఉత్తరఫల్గుణి)",
    "హస్త", "చిత్త", "స్వాతి", "విశాఖ", "అనూరాధ", "జ్యేష్ఠ",
    "మూల", "పూర్వాషాఢ", "ఉత్తరాషాఢ", "శ్రవణం", "ధనిష్ఠ",
    "శతభిషం", "పూర్వాభాద్ర", "ఉత్తరాభాద్ర", "రేవతి"
  ];

  const NAKSHATRAS_EN = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushyami", "Ashlesha", "Magha", "Pubba (Purva Phalguni)", "Uttara (Uttara Phalguni)",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Moola", "Purvashadha", "Uttarashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purvabhadra", "Uttarabhadra", "Revati"
  ];

  const YOGAS_TE = [
    "విష్కంభం", "ప్రీతి", "ఆయుష్మాన్", "సౌభాగ్యం", "శోభనం", "అతిగండం",
    "సుకర్మ", "ధృతి", "శూలం", "గండం", "వృద్ధి", "ధ్రువం",
    "వ్యాఘాతం", "హర్షణం", "వజ్రం", "సిద్ధి", "వ్యతీపాతం", "వరీయాన్",
    "పరిఘం", "శివం", "సిద్ధం", "సాధ్యం", "శుభం", "శుభ్రం",
    "బ్రహ్మం", "ఐంద్రం", "వైధృతి"
  ];

  const YOGAS_EN = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Sobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva",
    "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shubhra",
    "Brahma", "Indra", "Vaidhriti"
  ];

  const KARANAS_TE = [
    "బవ", "బాలవ", "కౌలవ", "తైతుల", "గరజ", "వణిజ", "విష్టి (భద్ర)",
    "శకుని", "చతుష్పాత్", "నాగవ", "కింస్తుఘ్నం"
  ];

  const KARANAS_EN = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti (Bhadra)",
    "Shakuni", "Chatushpada", "Nagava", "Kinstughna"
  ];

  const SAMVATSARAS_TE = [
    "ప్రభవ", "విభవ", "శుక్ల", "ప్రమోదూత", "ప్రజోత్పత్తి", "అంగీరస", "శ్రీముఖ", "భావ",
    "యువ", "ధాత", "ఈశ్వర", "బహుధాన్య", "ప్రమాది", "విక్రమ", "వృష", "చిత్రభాను",
    "స్వభాను", "తారణ", "పార్థివ", "వ్యయ", "సర్వజిత్తు", "సర్వధారి", "విరోధి", "వికృతి",
    "ఖర", "నందన", "విజయ", "జయ", "మన్మథ", "దుర్ముఖి", "హేవళంబి", "విళంబి",
    "వికారి", "శార్వరి", "ప్లవ", "శుభకృతు", "శోభకృతు", "క్రోధి", "విశ్వావసు", "పరాభవ",
    "ప్లవంగ", "కీలక", "సౌమ్య", "సాధారణ", "విరోధికృతు", "పరీధావి", "ప్రమాదీచ", "ఆనంద",
    "రాక్షస", "నల", "పింగళ", "కాలయుక్తి", "సిద్ధార్థి", "రౌద్రి", "దుర్మతి", "దుందుభి",
    "రుధిరోద్గారి", "రక్తాక్షి", "క్రోధన", "అక్షయ"
  ];

  const SAMVATSARAS_EN = [
    "Prabhava", "Vibhava", "Shukla", "Pramodoota", "Prajotpatti", "Angirasa", "Srimukha", "Bhava",
    "Yuva", "Dhata", "Iswara", "Bahudhanya", "Pramadi", "Vikrama", "Vrisha", "Chitrabhanu",
    "Svabhanu", "Tarana", "Parthiva", "Vyaya", "Sarvajittu", "Sarvadhari", "Virodhi", "Vikriti",
    "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukhi", "Hevalambi", "Vilambi",
    "Vikari", "Sharvari", "Plava", "Subhakritu", "Sobhakritu", "Krodhi", "Viswavasu", "Parabhava",
    "Plavanga", "Keelaka", "Saumya", "Sadharana", "Virodhikritu", "Paridhavi", "Pramadicha", "Ananda",
    "Rakshasa", "Nala", "Pingala", "Kalayukti", "Siddharthi", "Raudri", "Durmati", "Dundubhi",
    "Rudhirodgari", "Raktakshi", "Krodhana", "Akshaya"
  ];

  const RUTUS_TE = [
    "వసంత ఋతువు", "గ్రీష్మ ఋతువు", "వర్ష ఋతువు", "శరత్ ఋతువు", "హేమంత ఋతువు", "శిశిర ఋతువు"
  ];

  const RUTUS_EN = [
    "Vasanta Rutuvu", "Greeshma Rutuvu", "Varsha Rutuvu", "Sharad Rutuvu", "Hemanta Rutuvu", "Shishira Rutuvu"
  ];

  // Starting ghatis for Varjyam (వర్జ్య ప్రారంభ ఘడియలు) across the 27 Nakshatras.
  // Varjyam duration is standard 4 ghatis (= NakshatraDuration / 15).
  const VARJYAM_START_GHATIS = [
    50, // 0: Ashwini
    24, // 1: Bharani
    30, // 2: Krittika
    40, // 3: Rohini
    14, // 4: Mrigashira
    21, // 5: Ardra
    30, // 6: Punarvasu
    20, // 7: Pushyami
    32, // 8: Ashlesha
    30, // 9: Magha
    20, // 10: Pubba (Purva Phalguni)
    18, // 11: Uttara (Uttara Phalguni)
    21, // 12: Hasta
    20, // 13: Chitra
    14, // 14: Swati
    14, // 15: Vishakha
    10, // 16: Anuradha
    14, // 17: Jyeshtha
    56, // 18: Moola
    24, // 19: Purvashadha
    20, // 20: Uttarashadha
    10, // 21: Shravana
    10, // 22: Dhanishta
    18, // 23: Shatabhisha
    16, // 24: Purvabhadra
    30, // 25: Uttarabhadra
    30  // 26: Revati
  ];

  // Starting ghatis for Amrutha Gadiyalu (అమృత ప్రారంభ ఘడియలు) across the 27 Nakshatras.
  // Amrutha duration is standard 4 ghatis (= NakshatraDuration / 15).
  const AMRUTHA_START_GHATIS = [
    42, // 0: Ashwini
    48, // 1: Bharani
    54, // 2: Krittika
    52, // 3: Rohini
    38, // 4: Mrigashira
    35, // 5: Ardra
    54, // 6: Punarvasu
    44, // 7: Pushyami
    56, // 8: Ashlesha
    54, // 9: Magha
    44, // 10: Pubba
    42, // 11: Uttara
    45, // 12: Hasta
    44, // 13: Chitra
    38, // 14: Swati
    38, // 15: Vishakha
    34, // 16: Anuradha
    38, // 17: Jyeshtha
    44, // 18: Moola
    48, // 19: Purvashadha
    44, // 20: Uttarashadha
    34, // 21: Shravana
    34, // 22: Dhanishta
    42, // 23: Shatabhisha
    40, // 24: Purvabhadra
    54, // 25: Uttarabhadra
    54  // 26: Revati
  ];

  // 1-based daytime segment numbers (out of 8 equal segments between sunrise and sunset)
  // Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
  const RAHU_SEGMENT   = [8, 2, 7, 5, 6, 4, 3];
  const YAMA_SEGMENT   = [5, 4, 3, 2, 1, 7, 6];
  const GULIKA_SEGMENT = [7, 6, 5, 4, 3, 2, 1];

  // 15 daytime muhurthas (1-based index) for Durmuhurtham:
  // Daytime (sunrise to sunset) is divided into 15 equal muhurthams.
  const DURM_MUHURTHAS_DAY = [
    [14],       // Sun: 14th muhurtham
    [8, 12],    // Mon: 8th & 12th muhurthams
    [4, 11],    // Tue: 4th & 11th muhurthams
    [8],        // Wed: 8th muhurtham
    [6, 7],     // Thu: 6th & 7th muhurthams
    [4, 9],     // Fri: 4th & 9th muhurthams
    [1, 2]      // Sat: 1st & 2nd muhurthams
  ];

  // ─── Astronomical Ephemeris & Julian Day ──────────────────────────────────

  function getJulianDay(year, month, day, decimalHour = 12.0, timezoneOffset = 5.5) {
    let y = year;
    let m = month;
    const utcH = decimalHour - timezoneOffset;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      day +
      utcH / 24.0 +
      B -
      1524.5
    );
  }

  // High-precision Sun & Moon coordinates using Jean Meeus / ELP-2000 periodic series
  function calculatePositions(year, month, day, decimalHour = 6.0, timezoneOffset = 5.5) {
    const jd = getJulianDay(year, month, day, decimalHour, timezoneOffset);
    const T = (jd - 2451545.0) / 36525.0; // Julian centuries since J2000.0

    // 1. Sun Longitude (Meeus Ch. 25)
    const L0 = normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    const M_sun = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    const Mrad = M_sun * RAD;
    const C_sun = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
                + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
                + 0.000289 * Math.sin(3 * Mrad);
    const sunTrue = normalize(L0 + C_sun);

    // 2. Moon Longitude (ELP-2000 30-term periodic perturbations)
    const L_moon = normalize(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841.0);
    const D = normalize(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868.0);
    const M_m = normalize(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699.0);
    const F = normalize(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000.0);
    const omega = normalize(125.04452 - 1934.136261 * T + 0.0020708 * T * T);

    let moonPerturb = 0;
    moonPerturb += 6.288774 * Math.sin(M_m * RAD);
    moonPerturb += 1.274027 * Math.sin((2 * D - M_m) * RAD);
    moonPerturb += 0.658314 * Math.sin(2 * D * RAD);
    moonPerturb += 0.213618 * Math.sin(2 * M_m * RAD);
    moonPerturb -= 0.185116 * Math.sin(M_sun * RAD);
    moonPerturb -= 0.114332 * Math.sin(2 * F * RAD);
    moonPerturb += 0.058793 * Math.sin((2 * D - 2 * M_m) * RAD);
    moonPerturb += 0.057066 * Math.sin((2 * D - M_sun - M_m) * RAD);
    moonPerturb += 0.053322 * Math.sin((2 * D + M_m) * RAD);
    moonPerturb += 0.045758 * Math.sin((2 * D - M_sun) * RAD);
    moonPerturb -= 0.040923 * Math.sin((M_sun - M_m) * RAD);
    moonPerturb -= 0.034720 * Math.sin(D * RAD);
    moonPerturb -= 0.030383 * Math.sin((M_sun + M_m) * RAD);
    moonPerturb += 0.015327 * Math.sin((2 * D - 2 * F) * RAD);
    moonPerturb -= 0.012528 * Math.sin((2 * D + M_m - M_sun) * RAD);
    moonPerturb += 0.010980 * Math.sin((M_m + 2 * F) * RAD);
    moonPerturb += 0.010675 * Math.sin((4 * D - M_m) * RAD);
    moonPerturb += 0.010034 * Math.sin(3 * M_m * RAD);
    moonPerturb += 0.008548 * Math.sin((4 * D - 2 * M_m) * RAD);
    moonPerturb -= 0.007888 * Math.sin((2 * D + M_sun - M_m) * RAD);
    moonPerturb -= 0.006766 * Math.sin((2 * D + M_sun) * RAD);
    moonPerturb -= 0.005163 * Math.sin((D - M_m) * RAD);
    moonPerturb += 0.004987 * Math.sin((D + M_sun) * RAD);
    moonPerturb += 0.004036 * Math.sin((2 * D - M_m + 2 * F) * RAD);
    moonPerturb += 0.003994 * Math.sin((2 * D - 2 * M_m - M_sun) * RAD);
    moonPerturb += 0.003861 * Math.sin((4 * D) * RAD);
    moonPerturb += 0.003665 * Math.sin((2 * D - 3 * M_m) * RAD);
    moonPerturb -= 0.002689 * Math.sin((M_m - 2 * F) * RAD);
    moonPerturb -= 0.002302 * Math.sin((2 * D - M_sun + 2 * F) * RAD);
    moonPerturb += 0.002234 * Math.sin((2 * D - M_sun - 2 * F) * RAD);

    const moonTrue = normalize(L_moon + moonPerturb);

    // 3. Chitrapaksha (Lahiri) Ayanamsha with Nutation
    const nutationInLong = -0.004778 * Math.sin(omega * RAD);
    const ayanamsha = 23.857092 + (T * 100.0) * 0.01396971 + nutationInLong;

    const siderealSun = normalize(sunTrue - ayanamsha);
    const siderealMoon = normalize(moonTrue - ayanamsha);

    return {
      jd,
      sunTrue,
      moonTrue,
      siderealSun,
      siderealMoon,
      ayanamsha
    };
  }

  // ─── NOAA Solar Algorithm (Sunrise, Sunset, Solar Noon) ────────────────────

  function noaaSunriseSunset(year, month, day, lat, lon, utcOffsetHours = 5.5) {
    const jd = (function () {
      let y = year, m = month;
      if (m <= 2) { y--; m += 12; }
      const A = Math.floor(y / 100);
      const B = 2 - A + Math.floor(A / 4);
      return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
    })();

    const D = jd - 2451545.0;
    const L0 = (280.46646 + 0.9856474 * D) % 360;
    const M = (357.52911 + 0.98560028 * D) % 360;
    const Mrad = M * RAD;
    const C = (1.914602 - 0.004817 * D / 36525 - 0.000014 * (D / 36525) * (D / 36525)) * Math.sin(Mrad)
            + 0.019993 * Math.sin(2 * Mrad)
            + 0.000289 * Math.sin(3 * Mrad);
    const sunLon = L0 + C;
    const omega = 125.04 - 0.052954 * D;
    const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const epsilon0 = 23.439291 - 0.013004 * D / 36525;
    const epsilon = epsilon0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(epsilon * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y2 = Math.tan((epsilon / 2) * RAD) * Math.tan((epsilon / 2) * RAD);
    const L0rad = L0 * RAD;
    const Mrad2 = M * RAD;
    const eot = (y2 * Math.sin(2 * L0rad)
               - 2 * 0.016708634 * Math.sin(Mrad2)
               + 4 * 0.016708634 * y2 * Math.sin(Mrad2) * Math.cos(2 * L0rad)
               - 0.5 * y2 * y2 * Math.sin(4 * L0rad)
               - 1.25 * 0.016708634 * 0.016708634 * Math.sin(2 * Mrad2)) * 4 / RAD; // minutes

    // Official zenith 90.8333° (90° 50' accounting for atmospheric refraction 34' and semi-diameter 16')
    const cosHA = (Math.cos(90.8333 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)))
                - Math.tan(lat * RAD) * Math.tan(decl * RAD);

    if (cosHA < -1) return { sunrise: 0, sunset: 24, noon: 12 };
    if (cosHA > 1)  return { sunrise: 12, sunset: 12, noon: 12 };

    const HA = Math.acos(cosHA) / RAD;
    const solarNoonUTC = 720 - 4 * lon - eot;
    const sunriseUTC = solarNoonUTC - HA * 4;
    const sunsetUTC  = solarNoonUTC + HA * 4;

    const sunriseLocal = sunriseUTC / 60 + utcOffsetHours;
    const sunsetLocal  = sunsetUTC  / 60 + utcOffsetHours;
    const noonLocal    = solarNoonUTC / 60 + utcOffsetHours;

    return { sunrise: sunriseLocal, sunset: sunsetLocal, noon: noonLocal };
  }

  // ─── Formatting Helpers ───────────────────────────────────────────────────

  function fmtHHMM(h) {
    let nh = ((h % 24.0) + 24.0) % 24.0;
    let hr = Math.floor(nh);
    let mn = Math.round((nh - hr) * 60);
    if (mn === 60) { mn = 0; hr = (hr + 1) % 24; }
    const period = hr >= 12 ? "PM" : "AM";
    let displayHr = hr % 12;
    if (displayHr === 0) displayHr = 12;
    return `${String(displayHr).padStart(2, "0")}:${String(mn).padStart(2, "0")} ${period}`;
  }

  function fmtRange(startH, endH) {
    return `${fmtHHMM(startH)} - ${fmtHHMM(endH)}`;
  }

  function formatPeriodTime(h) {
    const isNextDay = h >= 24.0;
    const normalizedH = ((h % 24.0) + 24.0) % 24.0;
    let hr = Math.floor(normalizedH);
    let min = Math.round((normalizedH - hr) * 60);
    if (min === 60) { min = 0; hr = (hr + 1) % 24; }

    const periodEn = hr >= 12 ? "PM" : "AM";
    let periodTe = "";
    if (hr >= 0 && hr < 4) periodTe = "రాత్రి";
    else if (hr >= 4 && hr < 6) periodTe = "తెల్లవారుజామున";
    else if (hr >= 6 && hr < 12) periodTe = "ఉదయం";
    else if (hr >= 12 && hr < 16) periodTe = "మధ్యాహ్నం";
    else if (hr >= 16 && hr < 20) periodTe = "సాయంత్రం";
    else periodTe = "రాత్రి";

    let dispHr = hr % 12;
    if (dispHr === 0) dispHr = 12;
    const strMin = String(min).padStart(2, "0");
    const nextDayTe = isNextDay ? " (మరుసటి రోజు)" : "";
    const nextDayEn = isNextDay ? " (next day)" : "";

    return {
      timeTe: `${periodTe} ${String(dispHr).padStart(2, "0")}:${strMin}${nextDayTe}`,
      timeEn: `${String(dispHr).padStart(2, "0")}:${strMin} ${periodEn}${nextDayEn}`
    };
  }

  function formatMuhurthamInterval(startH, endH) {
    const isNextDay = startH >= 24.0 || endH >= 24.0;
    const sStr = fmtHHMM(startH);
    const eStr = fmtHHMM(endH);
    const suffix = isNextDay ? " (మరుసటి రోజు)" : "";
    return `${sStr} - ${eStr}${suffix}`;
  }

  // ─── Exact Transition Root Finders ────────────────────────────────────────

  function findTithiEndTime(year, month, day, sunriseH, targetAngle) {
    let lowH = sunriseH;
    let highH = sunriseH + 30.0;
    for (let iter = 0; iter < 22; iter++) {
      const midH = (lowH + highH) / 2.0;
      const p = calculatePositions(year, month, day, midH);
      let diff = normalize(p.moonTrue - p.sunTrue);
      if (targetAngle === 360 && diff < 180) diff += 360;
      if (diff < targetAngle) {
        lowH = midH;
      } else {
        highH = midH;
      }
    }
    return (lowH + highH) / 2.0;
  }

  function findNakshatraCrossing(year, month, day, targetDeg, lowH, highH) {
    for (let iter = 0; iter < 22; iter++) {
      const midH = (lowH + highH) / 2.0;
      const p = calculatePositions(year, month, day, midH);
      let m = p.siderealMoon;
      let diff = m - targetDeg;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      if (diff < 0) {
        lowH = midH;
      } else {
        highH = midH;
      }
    }
    return (lowH + highH) / 2.0;
  }

  function findYogaEndTime(year, month, day, sunriseH, targetAngle) {
    let lowH = sunriseH;
    let highH = sunriseH + 30.0;
    for (let iter = 0; iter < 22; iter++) {
      const midH = (lowH + highH) / 2.0;
      const p = calculatePositions(year, month, day, midH);
      let ySum = normalize(p.siderealMoon + p.siderealSun);
      if (targetAngle === 360 && ySum < 180) ySum += 360;
      if (ySum < targetAngle) {
        lowH = midH;
      } else {
        highH = midH;
      }
    }
    return (lowH + highH) / 2.0;
  }

  // ─── Daytime Muhurtham Calculations ───────────────────────────────────────

  function computeDaytimeMuhurthams(sunriseH, sunsetH, dayOfWeek) {
    const dayDur = sunsetH - sunriseH; // total daytime hours
    const segDur = dayDur / 8.0;       // 8 equal daytime segments
    const muhurDur = dayDur / 15.0;    // 15 daytime muhurthas (Dinardha / 15 * 2)

    // Segment helper (1-based segment number)
    function getSegment(segNum) {
      const s = sunriseH + (segNum - 1) * segDur;
      const e = sunriseH + segNum * segDur;
      return { s, e, text: fmtRange(s, e) };
    }

    // 1. Rahu Kalam (రాహుకాలం)
    const rahu = getSegment(RAHU_SEGMENT[dayOfWeek]);

    // 2. Yamagandam (యమగండం)
    const yama = getSegment(YAMA_SEGMENT[dayOfWeek]);

    // 3. Gulika Kalam (గుళిక కాలం)
    const gulika = getSegment(GULIKA_SEGMENT[dayOfWeek]);

    // 4. Abhijit Muhurtham (అభిజిత్ ముహూర్తం)
    // Centered at local solar noon, spanning exactly 1 daytime muhurtha (dayDur / 15)
    // Prohibited on Wednesdays in Telugu Panchangam tradition
    const solarNoon = (sunriseH + sunsetH) / 2.0;
    const abhijitStart = solarNoon - muhurDur / 2.0;
    const abhijitEnd   = solarNoon + muhurDur / 2.0;
    const abhijitText  = (dayOfWeek === 3)
      ? "బుధవారం వర్జ్యం (ఉండదు)"
      : fmtRange(abhijitStart, abhijitEnd);

    // 5. Durmuhurtham (దుర్ముహూర్తం)
    // Sourced from traditional 15 daytime muhurthams
    const durmSegments = DURM_MUHURTHAS_DAY[dayOfWeek];
    const durmParts = [];
    if (durmSegments.length === 2 && durmSegments[1] === durmSegments[0] + 1) {
      // Contiguous muhurthas (e.g. Thu 6 & 7, Sat 1 & 2)
      const s = sunriseH + (durmSegments[0] - 1) * muhurDur;
      const e = sunriseH + durmSegments[1] * muhurDur;
      durmParts.push(fmtRange(s, e));
    } else {
      durmSegments.forEach(mIdx => {
        const s = sunriseH + (mIdx - 1) * muhurDur;
        const e = sunriseH + mIdx * muhurDur;
        durmParts.push(fmtRange(s, e));
      });
    }
    const durmuhurtham = durmParts.join(" & ");

    return {
      rahuKalam: rahu.text,
      yamagandam: yama.text,
      gulikaKalam: gulika.text,
      abhijitMuhurtham: abhijitText,
      durmuhurtham
    };
  }

  // ─── Nakshatra-based Varjyam & Amrutha Gadiyalu ───────────────────────────

  function computeNakshatraMuhurthams(year, month, day, sunriseH, nextSunriseH, nak1Idx) {
    const nakSpan = 360.0 / 27.0;

    // 1. Prevailing Nakshatra at Sunrise (Nak 1)
    const nak1Start = findNakshatraCrossing(year, month, day, nak1Idx * nakSpan, -28.0, sunriseH);
    const nak1End   = findNakshatraCrossing(year, month, day, (nak1Idx + 1) * nakSpan, sunriseH, 36.0);
    const nak1Dur   = nak1End - nak1Start;

    // 2. Subsequent Nakshatra (Nak 2)
    const nak2Idx   = (nak1Idx + 1) % 27;
    const nak2Start = nak1End;
    const nak2End   = findNakshatraCrossing(year, month, day, (nak1Idx + 2) * nakSpan, nak2Start, nak2Start + 36.0);
    const nak2Dur   = nak2End - nak2Start;

    function getInterval(nakIdx, startH, dur, ghatiTable) {
      const s = startH + (ghatiTable[nakIdx] / 60.0) * dur;
      const e = s + (4.0 / 60.0) * dur; // 4 ghatis duration
      return { s, e };
    }

    const v1 = getInterval(nak1Idx, nak1Start, nak1Dur, VARJYAM_START_GHATIS);
    const a1 = getInterval(nak1Idx, nak1Start, nak1Dur, AMRUTHA_START_GHATIS);

    const v2 = getInterval(nak2Idx, nak2Start, nak2Dur, VARJYAM_START_GHATIS);
    const a2 = getInterval(nak2Idx, nak2Start, nak2Dur, AMRUTHA_START_GHATIS);

    // Filter intervals that fall within this Panchangam day (sunrise to next sunrise)
    function collectIntervals(i1, i2) {
      const res = [];
      if (i1.e > sunriseH && i1.s < nextSunriseH) {
        res.push(formatMuhurthamInterval(i1.s, i1.e));
      }
      if (i2.e > sunriseH && i2.s < nextSunriseH) {
        res.push(formatMuhurthamInterval(i2.s, i2.e));
      }
      if (res.length === 0) {
        // Fallback to primary nakshatra interval if boundary falls outside
        res.push(formatMuhurthamInterval(i1.s, i1.e));
      }
      return res.join(" & ");
    }

    return {
      varjyam: collectIntervals(v1, v2),
      amruthaGadiyalu: collectIntervals(a1, a2),
      nak1End,
      nak1Start
    };
  }

  // ─── Main Panchang Calculation (getPanchang) ──────────────────────────────

  function getPanchang(targetDate = new Date(), options = {}) {
    const d = new Date(targetDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const dateNum = d.getDate();
    const dayOfWeek = d.getDay();

    // Default coordinates: Hyderabad, India (17.3850° N, 78.4867° E, IST +5.5h)
    const lat = (options && typeof options.lat === "number") ? options.lat : 17.3850;
    const lon = (options && typeof options.lon === "number") ? options.lon : 78.4867;
    const tzOffset = 5.5;

    // 1. Sunrise, Sunset, and Midday (Solar Noon) for today
    const solar = noaaSunriseSunset(year, month, dateNum, lat, lon, tzOffset);
    const sunriseH = solar.sunrise;
    const sunsetH  = solar.sunset;
    const solarNoonH = solar.noon;
    const sunrise  = fmtHHMM(sunriseH);
    const sunset   = fmtHHMM(sunsetH);
    const solarNoon = fmtHHMM(solarNoonH);

    // Approximate next sunrise for Ahoratra window
    const nextSolar = noaaSunriseSunset(year, month, dateNum + 1, lat, lon, tzOffset);
    const nextSunriseH = 24.0 + nextSolar.sunrise;

    // 2. Astronomical Positions at Sunrise (Udaya-Kala)
    const pos = calculatePositions(year, month, dateNum, sunriseH, tzOffset);

    // 3. Tithi (at Sunrise)
    const moonSunDiff = normalize(pos.moonTrue - pos.sunTrue);
    const tithiIndex = Math.floor(moonSunDiff / 12.0) + 1; // 1 to 30
    const isShukla = tithiIndex <= 15;
    const pakshamTe = isShukla ? "శుక్ల పక్షం" : "బహుళ పక్షం (కృష్ణ పక్షం)";
    const pakshamEn = isShukla ? "Shukla Paksham" : "Krishna Paksham";

    const tithiInPaksha = isShukla ? tithiIndex : tithiIndex - 15;
    let tithiNameTe = "";
    let tithiNameEn = "";

    if (tithiIndex === 15) {
      tithiNameTe = "పౌర్ణమి";
      tithiNameEn = "Purnima";
    } else if (tithiIndex === 30) {
      tithiNameTe = "అమావాస్య";
      tithiNameEn = "Amavasya";
    } else {
      tithiNameTe = TITHI_NAMES_TE[tithiInPaksha - 1];
      tithiNameEn = TITHI_NAMES_EN[tithiInPaksha - 1];
    }

    const tithiFullTe = `${pakshamTe} ${tithiNameTe}`;
    const tithiFullEn = `${pakshamEn} ${tithiNameEn}`;

    // Exact Tithi end time & transition
    const targetTithiAngle = tithiIndex * 12.0;
    const tithiEndHour = findTithiEndTime(year, month, dateNum, sunriseH, targetTithiAngle);
    const tithiEndObj = formatPeriodTime(tithiEndHour);

    const nextTithiIdx = (tithiIndex % 30) + 1;
    const nextIsShukla = nextTithiIdx <= 15;
    const nextTInPaksha = nextIsShukla ? nextTithiIdx : nextTithiIdx - 15;
    let nextTithiNameTe = "";
    let nextTithiNameEn = "";
    if (nextTithiIdx === 15) {
      nextTithiNameTe = "పౌర్ణమి";
      nextTithiNameEn = "Purnima";
    } else if (nextTithiIdx === 30) {
      nextTithiNameTe = "అమావాస్య";
      nextTithiNameEn = "Amavasya";
    } else {
      const pNameTe = nextIsShukla ? "శుక్ల" : "బహుళ";
      const pNameEn = nextIsShukla ? "Shukla" : "Krishna";
      nextTithiNameTe = `${pNameTe} ${TITHI_NAMES_TE[nextTInPaksha - 1]}`;
      nextTithiNameEn = `${pNameEn} ${TITHI_NAMES_EN[nextTInPaksha - 1]}`;
    }

    let tithiTimingTe = "";
    let tithiTimingEn = "";
    if (tithiEndHour >= nextSunriseH) {
      tithiTimingTe = `${tithiFullTe} పూర్తి దినము (మరుసటి రోజు వరకు)`;
      tithiTimingEn = `${tithiFullEn} throughout the day (up to next day)`;
    } else {
      tithiTimingTe = `${tithiFullTe} ${tithiEndObj.timeTe} వరకు, తదుపరి ${nextTithiNameTe}`;
      tithiTimingEn = `${tithiFullEn} up to ${tithiEndObj.timeEn}, thereafter ${nextTithiNameEn}`;
    }

    // 4. Nakshatram (at Sunrise)
    const nakSpan = 360.0 / 27.0;
    const nakshatraIndex = Math.floor(pos.siderealMoon / nakSpan) % 27;
    const nakshatraTe = NAKSHATRAS_TE[nakshatraIndex];
    const nakshatraEn = NAKSHATRAS_EN[nakshatraIndex];

    // Nakshatra End Time and Transition
    const targetNakAngle = (nakshatraIndex + 1) * nakSpan;
    const nakEndHour = findNakshatraCrossing(year, month, dateNum, targetNakAngle, sunriseH, sunriseH + 36.0);
    const nakEndObj = formatPeriodTime(nakEndHour);
    const nextNakIdx = (nakshatraIndex + 1) % 27;
    const nextNakshatraNameTe = NAKSHATRAS_TE[nextNakIdx];
    const nextNakshatraNameEn = NAKSHATRAS_EN[nextNakIdx];

    let nakshatraTimingTe = "";
    let nakshatraTimingEn = "";
    if (nakEndHour >= nextSunriseH) {
      nakshatraTimingTe = `${nakshatraTe} పూర్తి దినము (మరుసటి రోజు వరకు)`;
      nakshatraTimingEn = `${nakshatraEn} throughout the day (up to next day)`;
    } else {
      nakshatraTimingTe = `${nakshatraTe} ${nakEndObj.timeTe} వరకు, తదుపరి ${nextNakshatraNameTe}`;
      nakshatraTimingEn = `${nakshatraEn} up to ${nakEndObj.timeEn}, thereafter ${nextNakshatraNameEn}`;
    }

    // 5. Authentic Nakshatra-based Varjyam and Amrutha Gadiyalu
    const nakMuhurthams = computeNakshatraMuhurthams(year, month, dateNum, sunriseH, nextSunriseH, nakshatraIndex);

    // 6. Daytime Muhurthams (Rahu Kalam, Yamagandam, Gulika, Abhijit, Durmuhurtham)
    const dayMuhurthams = computeDaytimeMuhurthams(sunriseH, sunsetH, dayOfWeek);

    // 7. Telugu Lunar Month (Amanta Chandramana)
    let lunarMonthIndex;
    if (options && typeof options.lunarMonthIndex === "number") {
      lunarMonthIndex = options.lunarMonthIndex;
    } else {
      // Find the New Moon (Amavasya) of the current lunar cycle:
      // Walk backwards to find solar sidereal rasi at New Moon
      const daysSinceNM = moonSunDiff / (360.0 / 29.53059);
      const estJdNM = pos.jd - daysSinceNM;
      let lowJD = estJdNM - 1.5;
      let highJD = estJdNM + 1.5;
      for (let i = 0; i < 20; i++) {
        const midJD = (lowJD + highJD) / 2.0;
        const dDays = midJD - pos.jd;
        const pMid = calculatePositions(year, month, dateNum, sunriseH + dDays * 24.0, tzOffset);
        let el = normalize(pMid.moonTrue - pMid.sunTrue);
        if (el > 180) el -= 360;
        if (el < 0) lowJD = midJD;
        else highJD = midJD;
      }
      const nmHour = sunriseH + (((lowJD + highJD) / 2.0) - pos.jd) * 24.0;
      const pNM = calculatePositions(year, month, dateNum, nmHour, tzOffset);
      const sunRasiAtNM = Math.floor(pNM.siderealSun / 30.0);
      lunarMonthIndex = (sunRasiAtNM + 1) % 12;
    }
    const masamTe = TELUGU_MONTHS[lunarMonthIndex];
    const masamEn = TELUGU_MONTHS_EN[lunarMonthIndex];

    // 8. Telugu Samvatsaram (60-year Jovian Cycle, changes on Ugadi / Chaitra Shukla Padyami)
    const isPreUgadiMonth = (month <= 4) && (lunarMonthIndex >= 9);
    const teluguYear = year - (isPreUgadiMonth ? 1 : 0);
    // Reference: Ugadi 2024 (Chaitram) = Krodhi (index 37 in 0-based SAMVATSARAS)
    // 2024: Krodhi (37)
    // 2025: Viswavasu (38)
    // 2026: Parabhava (39)
    // 2027: Plavanga (40)
    const baseYear = 2024;
    const baseSamvatsaraIdx = 37;
    const samvatsaraIdx = ((baseSamvatsaraIdx + (teluguYear - baseYear)) % 60 + 60) % 60;
    const samvatsaramTe = `శ్రీ ${SAMVATSARAS_TE[samvatsaraIdx]} నామ సంవత్సరం`;
    const samvatsaramEn = `Sri ${SAMVATSARAS_EN[samvatsaraIdx]} Nama Samvatsaram`;

    // 9. Ayanam (Based on Sidereal Solar Ingress: Makara 270° to Mithuna 90° = Uttarayanam)
    const currentSunLong = pos.siderealSun;
    const isUttarayanam = (currentSunLong >= 270.0 || currentSunLong < 90.0);
    const ayanamTe = isUttarayanam ? "ఉత్తరాయణం" : "దక్షిణాయణం";
    const ayanamEn = isUttarayanam ? "Uttarayanam" : "Dakshinayanam";

    // 10. Rutuvu (The 6 traditional Vedic seasons tied to the Telugu Lunar Months)
    const rutuIndex = Math.floor(lunarMonthIndex / 2) % 6;
    const rutuTe = RUTUS_TE[rutuIndex];
    const rutuEn = RUTUS_EN[rutuIndex];

    // 11. Yoga (Nitya Yoga from Sidereal Moon + Sidereal Sun)
    const yogaSum = normalize(pos.siderealMoon + pos.siderealSun);
    const yogaIndex = Math.floor(yogaSum / nakSpan) % 27;
    const yogaTe = YOGAS_TE[yogaIndex];
    const yogaEn = YOGAS_EN[yogaIndex];

    // 12. Karanam (Half of Tithi = 6°)
    const karanaNum = Math.floor(moonSunDiff / 6.0) + 1;
    let karanaTe = "";
    let karanaEn = "";
    if (karanaNum === 1) {
      karanaTe = "కింస్తుఘ్నం";
      karanaEn = "Kinstughna";
    } else if (karanaNum >= 58) {
      const fixedTe = ["శకుని", "చతుష్పాత్", "నాగవ"];
      const fixedEn = ["Shakuni", "Chatushpada", "Nagava"];
      karanaTe = fixedTe[karanaNum - 58];
      karanaEn = fixedEn[karanaNum - 58];
    } else {
      karanaTe = KARANAS_TE[(karanaNum - 2) % 7];
      karanaEn = KARANAS_EN[(karanaNum - 2) % 7];
    }

    // 13. Telugu Festivals & Vratams
    const festivals = detectFestivals({
      year,
      month,
      dateNum,
      dayOfWeek,
      lunarMonthIndex,
      isShukla,
      tithiIndex,
      tithiInPaksha
    });

    return {
      date: d,
      year,
      month,
      dateNum,
      dayOfWeek,
      lat,
      lon,
      gregDateTe: `${dateNum} ${GREG_MONTHS_TE[month - 1]} ${year}`,
      gregDateEn: `${GREG_MONTHS_EN[month - 1]} ${dateNum}, ${year}`,
      dayNameTe: DAYS_TE[dayOfWeek],
      dayNameShortTe: DAYS_SHORT_TE[dayOfWeek],
      dayNameShortEn: DAYS_SHORT_EN[dayOfWeek],
      samvatsaramTe,
      samvatsaramEn,
      ayanamTe,
      ayanamEn,
      rutuTe,
      rutuEn,
      lunarMonthIndex,
      masamTe,
      masamEn,
      isShukla,
      pakshamTe,
      pakshamEn,
      pakshamShortTe: isShukla ? "శుక్ల" : "బహుళ",
      pakshamShortEn: isShukla ? "Shukla" : "Krishna",
      gregDateShort: `${dateNum} ${GREG_MONTHS_EN[month - 1].slice(0, 3)}`,
      tithiIndex,
      tithiInPaksha,
      tithiNameTe,
      tithiNameEn,
      tithiFullTe,
      tithiFullEn,
      tithiEndTimeTe: tithiEndObj.timeTe,
      tithiEndTimeEn: tithiEndObj.timeEn,
      nextTithiNameTe,
      nextTithiNameEn,
      tithiTimingTe,
      tithiTimingEn,
      nakshatraIndex,
      nakshatraTe,
      nakshatraEn,
      nakshatraEndTimeTe: nakEndObj.timeTe,
      nakshatraEndTimeEn: nakEndObj.timeEn,
      nextNakshatraNameTe,
      nextNakshatraNameEn,
      nakshatraTimingTe,
      nakshatraTimingEn,
      yogaIndex,
      yogaTe,
      yogaEn,
      karanaNum,
      karanaTe,
      karanaEn,
      sunrise,
      sunset,
      solarNoon,
      sunriseH,
      sunsetH,
      solarNoonH,
      rahuKalam:        dayMuhurthams.rahuKalam,
      yamagandam:       dayMuhurthams.yamagandam,
      gulikaKalam:      dayMuhurthams.gulikaKalam,
      abhijitMuhurtham: dayMuhurthams.abhijitMuhurtham,
      durmuhurtham:     dayMuhurthams.durmuhurtham,
      amruthaGadiyalu:  nakMuhurthams.amruthaGadiyalu,
      varjyam:          nakMuhurthams.varjyam,
      festivals
    };
  }

  // ─── Festival & Vratam Detection ──────────────────────────────────────────

  function detectFestivals({ year, month, dateNum, dayOfWeek, lunarMonthIndex, isShukla, tithiIndex, tithiInPaksha }) {
    const list = [];

    // Monthly Ekadashi
    if (tithiInPaksha === 11) {
      list.push({
        titleTe: isShukla ? "శుక్ల ఏకాదశి వ్రతం" : "బహుళ ఏకాదశి వ్రతం",
        titleEn: isShukla ? "Shukla Ekadasi" : "Krishna Ekadasi",
        badge: "📿 ఏకాదశి",
        type: "vratam"
      });
    }

    // Monthly Pradosham
    if (tithiInPaksha === 13) {
      list.push({
        titleTe: "ప్రదోష వ్రతం (శివారాధన)",
        titleEn: "Pradosham",
        badge: "🔱 ప్రదోషం",
        type: "vratam"
      });
    }

    // Monthly Purnima / Amavasya
    if (tithiIndex === 15) {
      list.push({
        titleTe: `${TELUGU_MONTHS[lunarMonthIndex]} పౌర్ణమి (సత్యనారాయణ వ్రతం)`,
        titleEn: "Purnima (Full Moon)",
        badge: "🌕 పౌర్ణమి",
        type: "major"
      });
    }
    if (tithiIndex === 30) {
      list.push({
        titleTe: `${TELUGU_MONTHS[lunarMonthIndex]} అమావాస్య (పితృ తర్పణం)`,
        titleEn: "Amavasya (New Moon)",
        badge: "🌑 అమావాస్య",
        type: "major"
      });
    }

    // Monthly Sankashtahara Chaturthi
    if (!isShukla && tithiInPaksha === 4) {
      list.push({
        titleTe: "సంకష్టహర చతుర్థి (గణపతి పూజ)",
        titleEn: "Sankashtahara Chaturthi",
        badge: "🐘 సంకష్టహర చతుర్థి",
        type: "vratam"
      });
    }

    // Major Solar & Lunar Festivals
    if (month === 1 && dateNum === 13) list.push({ titleTe: "భోగి పండుగ", titleEn: "Bhogi Festival", badge: "🔥 భోగి", type: "festival" });
    if (month === 1 && dateNum === 14) list.push({ titleTe: "మకర సంక్రాంతి (పొంగల్)", titleEn: "Makara Sankranti", badge: "🪁 సంక్రాంతి", type: "festival" });
    if (month === 1 && dateNum === 15) list.push({ titleTe: "కనుమ పండుగ", titleEn: "Kanuma", badge: "🌾 కనుమ", type: "festival" });

    if (lunarMonthIndex === 10 && !isShukla && tithiInPaksha === 14) {
      list.push({ titleTe: "మహా శివరాత్రి", titleEn: "Maha Shivaratri", badge: "🔱 శివరాత్రి", type: "festival" });
    }

    if (lunarMonthIndex === 11 && tithiIndex === 15) {
      list.push({ titleTe: "హోలీ పండుగ (కామదహనం)", titleEn: "Holi Festival", badge: "🎨 హోలీ", type: "festival" });
    }

    if (lunarMonthIndex === 0 && isShukla && tithiInPaksha === 1) {
      list.push({ titleTe: "ఉగాది (తెలుగు నూతన సంవత్సరాది)", titleEn: "Ugadi (Telugu New Year)", badge: "🌿 ఉగాది", type: "festival" });
    }

    if (lunarMonthIndex === 0 && isShukla && tithiInPaksha === 9) {
      list.push({ titleTe: "శ్రీరామ నవమి (సీతారామ కళ్యాణం)", titleEn: "Sri Rama Navami", badge: "🏹 శ్రీరామనవమి", type: "festival" });
    }

    if (lunarMonthIndex === 0 && tithiIndex === 15) {
      list.push({ titleTe: "హనుమాన్ జయంతి", titleEn: "Hanuman Jayanti", badge: "🙏 హనుమాన్ జయంతి", type: "festival" });
    }

    if (lunarMonthIndex === 3 && tithiIndex === 15) {
      list.push({ titleTe: "గురు పౌర్ణమి (వ్యాస పూర్ణిమ)", titleEn: "Guru Purnima", badge: "🪷 గురు పౌర్ణమి", type: "festival" });
    }

    if (lunarMonthIndex === 4 && dayOfWeek === 5 && isShukla && tithiInPaksha >= 8 && tithiInPaksha <= 14) {
      list.push({ titleTe: "వరలక్ష్మీ వ్రతం", titleEn: "Varalakshmi Vratam", badge: "🌸 వరలక్ష్మి వ్రతం", type: "festival" });
    }

    if (lunarMonthIndex === 4 && tithiIndex === 15) {
      list.push({ titleTe: "రక్షాబంధన్ (రాఖీ పౌర్ణమి)", titleEn: "Raksha Bandhan", badge: "🧵 రాఖీ పౌర్ణమి", type: "festival" });
    }

    if (lunarMonthIndex === 4 && !isShukla && tithiInPaksha === 8) {
      list.push({ titleTe: "శ్రీకృష్ణాష్టమి (గోకులాష్టమి)", titleEn: "Sri Krishna Janmashtami", badge: "🦚 కృష్ణాష్టమి", type: "festival" });
    }

    if (lunarMonthIndex === 5 && isShukla && tithiInPaksha === 4) {
      list.push({ titleTe: "వినాయక చవితి (గణేష్ చతుర్థి)", titleEn: "Vinayaka Chavithi", badge: "🪔 వినాయక చవితి", type: "festival" });
    }

    if (lunarMonthIndex === 5 && tithiIndex === 30) {
      list.push({ titleTe: "మహాలయ అమావాస్య (సర్వపితృ అమావాస్య)", titleEn: "Mahalaya Amavasya", badge: "🪔 మహాలయ అమావాస్య", type: "festival" });
    }

    if (lunarMonthIndex === 6 && isShukla && tithiInPaksha === 1) {
      list.push({ titleTe: "దేవీ శరన్నవరాత్రులు ప్రారంభం / బతుకమ్మ", titleEn: "Navaratri Begins / Bathukamma", badge: "🌺 శరన్నవరాత్రులు", type: "festival" });
    }

    if (lunarMonthIndex === 6 && isShukla && tithiInPaksha === 8) {
      list.push({ titleTe: "దుర్గాష్టమి (మహాష్టమి)", titleEn: "Durgashtami", badge: "🔱 దుర్గాష్టమి", type: "festival" });
    }

    if (lunarMonthIndex === 6 && isShukla && tithiInPaksha === 10) {
      list.push({ titleTe: "విజయదశమి (దసరా పండుగ)", titleEn: "Vijayadasami / Dussehra", badge: "🏹 విజయదశమి (దసరా)", type: "festival" });
    }

    if (lunarMonthIndex === 6 && !isShukla && tithiInPaksha === 14) {
      list.push({ titleTe: "నరక చతుర్దశి", titleEn: "Naraka Chaturdasi", badge: "🪔 నరక చతుర్దశి", type: "festival" });
    }

    if (lunarMonthIndex === 6 && tithiIndex === 30) {
      list.push({ titleTe: "దీపావళి లక్ష్మీపూజ (కేదార గౌరీ వ్రతం)", titleEn: "Deepavali (Diwali)", badge: "✨ దీపావళి", type: "festival" });
    }

    if (lunarMonthIndex === 7 && tithiIndex === 15) {
      list.push({ titleTe: "కార్తీక పౌర్ణమి (జ్వాలా తోరణం)", titleEn: "Karthika Purnima", badge: "🪔 కార్తీక పౌర్ణమి", type: "festival" });
    }

    if ((lunarMonthIndex === 8 || lunarMonthIndex === 9) && isShukla && tithiInPaksha === 11) {
      list.push({ titleTe: "ముక్కోటి ఏకాదశి (వైకుంఠ ఏకాదశి)", titleEn: "Vaikuntha Ekadasi", badge: "🛕 వైకుంఠ ఏకాదశి", type: "festival" });
    }

    return list;
  }

  // ─── Month Calendar Generator ─────────────────────────────────────────────

  function getSunriseTithi(d, lat = 17.3850, lon = 78.4867) {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    const solar = noaaSunriseSunset(y, m, day, lat, lon, 5.5);
    const p = calculatePositions(y, m, day, solar.sunrise, 5.5);
    const elong = normalize(p.moonTrue - p.sunTrue);
    return Math.floor(elong / 12.0) + 1;
  }

  function isStartOfTeluguMonth(d, lat, lon) {
    const tCur = getSunriseTithi(d, lat, lon);
    const prevD = new Date(d.getTime() - 86400000);
    const tPrev = getSunriseTithi(prevD, lat, lon);
    return (tCur === 1 && (tPrev >= 29 || tPrev <= 1)) || (tCur === 2 && tPrev >= 29);
  }

  function isEndOfTeluguMonth(d, lat, lon) {
    const tCur = getSunriseTithi(d, lat, lon);
    const nextD = new Date(d.getTime() + 86400000);
    const tNext = getSunriseTithi(nextD, lat, lon);
    return (tCur === 30 && (tNext <= 2 || tNext === 30)) || (tCur === 29 && (tNext === 1 || tNext === 2));
  }

  function getTeluguMonthCalendar(refDate, lat = 17.3850, lon = 78.4867) {
    const base = refDate ? new Date(refDate) : new Date();
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 6, 0, 0);

    // 1. Walk backwards to find Shukla Padyami of this lunar month
    let curD = new Date(d.getTime());
    let maxIter = 40;
    while (maxIter-- > 0) {
      if (isStartOfTeluguMonth(curD, lat, lon)) break;
      curD = new Date(curD.getTime() - 86400000);
    }
    const startD = new Date(curD.getTime());

    // 2. Determine lunar month at start of this lunar month
    const pStartSolar = noaaSunriseSunset(startD.getFullYear(), startD.getMonth() + 1, startD.getDate(), lat, lon, 5.5);
    const pStart = calculatePositions(startD.getFullYear(), startD.getMonth() + 1, startD.getDate(), pStartSolar.sunrise, 5.5);
    const sunRasi = Math.floor(pStart.siderealSun / 30.0);
    const lunarMonthIndex = (sunRasi + 1) % 12;
    const masamTe = TELUGU_MONTHS[lunarMonthIndex];
    const masamEn = TELUGU_MONTHS_EN[lunarMonthIndex];

    // 3. Scan forward until Amavasya
    const days = [];
    let scanD = new Date(startD.getTime());
    maxIter = 35;
    while (maxIter-- > 0) {
      const dayPanchang = getPanchang(new Date(scanD.getTime()), { lunarMonthIndex, lat, lon });
      days.push(dayPanchang);
      if (days.length >= 28 && isEndOfTeluguMonth(scanD, lat, lon)) {
        break;
      }
      scanD = new Date(scanD.getTime() + 86400000);
    }

    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    const endD = new Date(lastDay.date.getTime());

    return {
      lunarMonthIndex,
      masamTe,
      masamEn,
      samvatsaramTe: firstDay.samvatsaramTe,
      samvatsaramEn: firstDay.samvatsaramEn,
      startDate: startD,
      endDate: endD,
      startGregDateTe: `${firstDay.dateNum} ${GREG_MONTHS_TE[firstDay.month - 1]} ${firstDay.year}`,
      startGregDateEn: `${firstDay.dateNum} ${GREG_MONTHS_EN[firstDay.month - 1]} ${firstDay.year}`,
      endGregDateTe: `${lastDay.dateNum} ${GREG_MONTHS_TE[lastDay.month - 1]} ${lastDay.year}`,
      endGregDateEn: `${lastDay.dateNum} ${GREG_MONTHS_EN[lastDay.month - 1]} ${lastDay.year}`,
      startWeekday: startD.getDay(),
      dayCount: days.length,
      days
    };
  }

  function getAdjacentTeluguMonthDate(refDate, direction) {
    const curMonth = getTeluguMonthCalendar(refDate);
    if (direction > 0) {
      return new Date(curMonth.endDate.getTime() + 86400000 * 2);
    } else {
      return new Date(curMonth.startDate.getTime() - 86400000 * 2);
    }
  }

  function getMonthPanchang(year, month, lat = 17.3850, lon = 78.4867) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day, 6, 0, 0);
      days.push(getPanchang(d, { lat, lon }));
    }

    return {
      year,
      month,
      monthNameTe: GREG_MONTHS_TE[month - 1],
      monthNameEn: GREG_MONTHS_EN[month - 1],
      firstDayIndex,
      daysInMonth,
      days
    };
  }

  // ─── Module Return / Exports ──────────────────────────────────────────────

  return {
    getPanchang,
    getMonthPanchang,
    getTeluguMonthCalendar,
    getAdjacentTeluguMonthDate,
    calculatePositions,
    noaaSunriseSunset,
    TELUGU_MONTHS,
    TELUGU_MONTHS_EN,
    TITHI_NAMES_TE,
    TITHI_NAMES_EN,
    NAKSHATRAS_TE,
    NAKSHATRAS_EN,
    YOGAS_TE,
    YOGAS_EN,
    KARANAS_TE,
    KARANAS_EN,
    SAMVATSARAS_TE,
    SAMVATSARAS_EN,
    RUTUS_TE,
    RUTUS_EN,
    DAYS_TE,
    DAYS_SHORT_TE,
    DAYS_SHORT_EN
  };
});
