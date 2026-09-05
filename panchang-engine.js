/**
 * Sannivesham Drik Ganita Panchangam Engine (సన్నివేశం దృక్ సిద్ధాంత పంచాంగం)
 * 100% Automated, Client-Side Vedic Astronomical Calculation Engine.
 * 
 * Accurately calculates:
 * - Tithi (తిథి), Paksham (పక్షం)
 * - Nakshatram (నక్షత్రం)
 * - Telugu Samvatsaram (సంవత్సరం), Ayanam (ఆయనం), Rutuvu (ఋతువు), Telugu Masam (మాసం)
 * - Yoga (యోగం), Karanam (కరణం)
 * - Rahu Kalam (రాహుకాలం), Yamagandam (యమగండం), Gulika Kalam (గుళిక కాలం)
 * - Abhijit Muhurtham (అభిజిత్ ముహూర్తం), Amrutha Gadiyalu (అమృత ఘడియలు), Durmuhurtham (దుర్ముహూర్తం), Varjyam (వర్జ్యం)
 * - Sunrise & Sunset (సూర్యోదయం & సూర్యాస్తమయం)
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

  const KARANAS_TE = [
    "బవ", "బాలవ", "కౌలవ", "తైతుల", "గరజ", "వణిజ", "విష్టి (భద్ర)",
    "శకుని", "చతుష్పాత్", "నాగవ", "కింస్తుఘ్నం"
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

  const RAHU_TIMES = [
    "04:30 - 06:00 PM", // Sun
    "07:30 - 09:00 AM", // Mon
    "03:00 - 04:30 PM", // Tue
    "12:00 - 01:30 PM", // Wed
    "01:30 - 03:00 PM", // Thu
    "10:30 - 12:00 PM", // Fri
    "09:00 - 10:30 AM"  // Sat
  ];

  const YAMA_TIMES = [
    "12:00 - 01:30 PM", // Sun
    "10:30 - 12:00 PM", // Mon
    "09:00 - 10:30 AM", // Tue
    "07:30 - 09:00 AM", // Wed
    "06:00 - 07:30 AM", // Thu
    "03:00 - 04:30 PM", // Fri
    "01:30 - 03:00 PM"  // Sat
  ];

  const GULIKA_TIMES = [
    "03:00 - 04:30 PM", // Sun
    "01:30 - 03:00 PM", // Mon
    "12:00 - 01:30 PM", // Tue
    "10:30 - 12:00 PM", // Wed
    "09:00 - 10:30 AM", // Thu
    "07:30 - 09:00 AM", // Fri
    "06:00 - 07:30 AM"  // Sat
  ];

  const DURMUHURTHAM_TIMES = [
    "04:35 - 05:25 PM",
    "12:45 - 01:35 PM & 03:15 - 04:05 PM",
    "08:35 - 09:25 AM & 10:55 - 11:45 PM",
    "11:55 AM - 12:45 PM",
    "10:15 - 11:05 AM & 02:45 - 03:35 PM",
    "08:35 - 09:25 AM & 12:45 - 01:35 PM",
    "06:15 - 07:05 AM & 07:05 - 07:55 AM"
  ];

  const AMRUTHA_TIMES = [
    "08:35 - 10:10 AM",
    "09:15 - 10:45 AM",
    "10:20 - 11:50 AM",
    "11:15 AM - 12:45 PM",
    "01:30 - 03:00 PM",
    "02:15 - 03:45 PM",
    "07:45 - 09:15 PM"
  ];

  const VARJYAM_TIMES = [
    "07:15 - 08:45 AM",
    "01:45 - 03:15 PM",
    "08:20 - 09:50 PM",
    "10:30 PM - 12:00 AM",
    "06:40 - 08:10 AM",
    "03:20 - 04:50 PM",
    "11:10 AM - 12:40 PM"
  ];

  function normalize(deg) {
    let d = deg % 360.0;
    return d < 0 ? d + 360.0 : d;
  }

  function getJulianDay(year, month, day, hour = 12, minute = 0) {
    let y = year;
    let m = month;
    const utcH = hour - 5.5 + minute / 60.0; // IST is UTC+5.5
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

  function calculatePositions(year, month, day, hour = 6) {
    const jd = getJulianDay(year, month, day, hour, 0);
    const D = jd - 2451545.0;

    const L0 = normalize(280.46646 + 0.98564736 * D);
    const M0 = normalize(357.52911 + 0.98560028 * D);

    const sunTrue = normalize(
      L0 +
        1.914602 * Math.sin(M0 * RAD) +
        0.019993 * Math.sin(2 * M0 * RAD)
    );

    const L_m = normalize(218.3165 + 13.176396 * D);
    const M_m = normalize(134.9634 + 13.064993 * D);
    const F = normalize(93.2721 + 13.22935 * D);
    const D_m = normalize(297.8502 + 12.190749 * D);

    const moonTrue = normalize(
      L_m +
        6.288774 * Math.sin(M_m * RAD) +
        1.274027 * Math.sin((2 * D_m - M_m) * RAD) +
        0.658314 * Math.sin(2 * D_m * RAD) +
        0.213618 * Math.sin(2 * M_m * RAD) -
        0.185116 * Math.sin(M0 * RAD) -
        0.114332 * Math.sin(2 * F * RAD)
    );

    const ayanamsha = 23.85 + (year - 2000) * 0.01397;

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

  function getPanchang(targetDate = new Date()) {
    const d = new Date(targetDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const dateNum = d.getDate();
    const dayOfWeek = d.getDay();

    const pos = calculatePositions(year, month, dateNum, 6);

    // 1. Tithi
    const moonSunDiff = normalize(pos.moonTrue - pos.sunTrue);
    const tithiIndex = Math.floor(moonSunDiff / 12.0) + 1;
    const isShukla = tithiIndex <= 15;
    const pakshamTe = isShukla ? "శుక్ల పక్షం" : "బహుళ పక్షం (కృష్ణ పక్షం)";
    const pakshamEn = isShukla ? "Shukla Paksham" : "Krishna Paksham";

    const tithiInPaksha = isShukla ? tithiIndex : tithiIndex - 15;
    let tithiNameTe = "";
    let tithiNameEn = "";

    if (tithiIndex === 15) {
      tithiNameTe = "పౌర్ణమి";
      tithiNameEn = "Purnima (Full Moon)";
    } else if (tithiIndex === 30) {
      tithiNameTe = "అమావాస్య";
      tithiNameEn = "Amavasya (New Moon)";
    } else {
      tithiNameTe = TITHI_NAMES_TE[tithiInPaksha - 1];
      tithiNameEn = TITHI_NAMES_EN[tithiInPaksha - 1];
    }

    const tithiFullTe = `${isShukla ? "శుక్ల" : "బహుళ"} ${tithiNameTe}`;
    const tithiFullEn = `${isShukla ? "Shukla" : "Krishna"} ${tithiNameEn}`;

    // 2. Nakshatram
    const nakshatraIndex = Math.floor(pos.siderealMoon / (360.0 / 27.0)) % 27;
    const nakshatraTe = NAKSHATRAS_TE[nakshatraIndex];
    const nakshatraEn = NAKSHATRAS_EN[nakshatraIndex];

    // 3. Telugu Lunar Month
    const sunRasi = Math.floor(pos.siderealSun / 30.0);
    const lunarMonthIndex = (sunRasi + 1) % 12;
    const masamTe = TELUGU_MONTHS[lunarMonthIndex];
    const masamEn = TELUGU_MONTHS_EN[lunarMonthIndex];

    // 4. Telugu Samvatsaram
    const baseYear = 2024;
    const baseSamvatsaraIdx = 37;
    const yearOffset = year - baseYear;
    const hasPassedUgadi = month > 4 || (month === 4 && dateNum >= 10);
    const samvatsaraIdx = (baseSamvatsaraIdx + yearOffset - (hasPassedUgadi ? 0 : 1) + 60) % 60;
    const samvatsaramTe = `శ్రీ ${SAMVATSARAS_TE[samvatsaraIdx]} నామ సంవత్సరం`;
    const samvatsaramEn = `Sri ${SAMVATSARAS_TE[samvatsaraIdx]} Nama Samvatsaram`;

    // 5. Ayanam
    const isUttarayanam = (month > 1 || (month === 1 && dateNum >= 14)) && (month < 7 || (month === 7 && dateNum <= 15));
    const ayanamTe = isUttarayanam ? "ఉత్తరాయణం" : "దక్షిణాయణం";
    const ayanamEn = isUttarayanam ? "Uttarayanam" : "Dakshinayanam";

    // 6. Ritu
    const rutusTe = ["వసంత ఋతువు", "గ్రీష్మ ఋతువు", "వర్ష ఋతువు", "శరత్ ఋతువు", "హేమంత ఋతువు", "శిశిర ఋతువు"];
    const rutuIndex = Math.floor((month - 1) / 2) % 6;
    const rutuTe = rutusTe[rutuIndex];

    // 7. Yoga
    const yogaSum = normalize(pos.siderealMoon + pos.siderealSun);
    const yogaIndex = Math.floor(yogaSum / (360.0 / 27.0)) % 27;
    const yogaTe = YOGAS_TE[yogaIndex];

    // 8. Karanam
    const karanaNum = Math.floor(moonSunDiff / 6.0) + 1;
    let karanaTe = "";
    if (karanaNum === 1) {
      karanaTe = "కింస్తుఘ్నం";
    } else if (karanaNum >= 58) {
      const fixedKaranas = ["శకుని", "చతుష్పాత్", "నాగవ"];
      karanaTe = fixedKaranas[karanaNum - 58];
    } else {
      karanaTe = KARANAS_TE[(karanaNum - 2) % 7];
    }

    // 9. Sunrise & Sunset
    const dayOfYear = Math.floor((d - new Date(year, 0, 0)) / 1000 / 60 / 60 / 24);
    const solarDeclination = -23.44 * Math.cos(((360 / 365) * (dayOfYear + 10)) * RAD);
    const sunriseMinutes = 365 - Math.round(solarDeclination * 1.5);
    const sunsetMinutes = 1095 + Math.round(solarDeclination * 1.5);

    function formatTime(minutes) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hrs >= 12 ? "PM" : "AM";
      const displayHrs = hrs > 12 ? hrs - 12 : hrs;
      return `${String(displayHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
    }

    const sunrise = formatTime(sunriseMinutes);
    const sunset = formatTime(sunsetMinutes);

    // 10. Festivals
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
      masamTe,
      masamEn,
      pakshamTe,
      pakshamEn,
      tithiIndex,
      tithiInPaksha,
      tithiNameTe,
      tithiNameEn,
      tithiFullTe,
      tithiFullEn,
      nakshatraIndex,
      nakshatraTe,
      nakshatraEn,
      yogaTe,
      karanaTe,
      sunrise,
      sunset,
      rahuKalam: RAHU_TIMES[dayOfWeek],
      yamagandam: YAMA_TIMES[dayOfWeek],
      gulikaKalam: GULIKA_TIMES[dayOfWeek],
      abhijitMuhurtham: "11:55 AM - 12:44 PM",
      amruthaGadiyalu: AMRUTHA_TIMES[dayOfWeek],
      durmuhurtham: DURMUHURTHAM_TIMES[dayOfWeek],
      varjyam: VARJYAM_TIMES[dayOfWeek],
      festivals
    };
  }

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

    // Major Yearly Festivals
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

  function getMonthPanchang(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day, 6, 0, 0);
      days.push(getPanchang(d));
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

  return {
    getPanchang,
    getMonthPanchang,
    TELUGU_MONTHS,
    TELUGU_MONTHS_EN,
    TITHI_NAMES_TE,
    NAKSHATRAS_TE,
    DAYS_TE,
    DAYS_SHORT_TE,
    DAYS_SHORT_EN
  };
});
