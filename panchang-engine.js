/**
 * Sannivesham Drik Ganita Panchangam Engine (సన్నివేశం దృక్ సిద్ధాంత పంచాంగం)
 * 100% Automated, Client-Side Vedic Astronomical Calculation Engine.
 * 
 * Accurately calculates:
 * - Tithi (తిథి), Paksham (పక్షం) + Exact End Time (వరకు) & Next Tithi Transition
 * - Nakshatram (నక్షత్రం) + Exact End Time (వరకు) & Next Nakshatram Transition
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

  // Segment-of-day indices (0-based out of 8 equal day segments) for muhurthams
  // Standard Vedic rule: day = sunrise to sunset, split into 8 equal parts
  const RAHU_SEGMENT   = [7, 1, 6, 4, 5, 3, 2]; // Sun=7,Mon=1,Tue=6,Wed=4,Thu=5,Fri=3,Sat=2 (1-based→0-based below)
  const YAMA_SEGMENT   = [4, 3, 2, 1, 0, 6, 5];
  const GULIKA_SEGMENT = [6, 5, 4, 3, 2, 1, 0];

  // Durmuhurtham proportional offsets within the day (as fractions of day duration)
  // Values sourced from classical texts, expressed in muhurats (1 muhurat = 1/30 of day)
  const DURM_MUHURTAS = [
    [[17, 18]], // Sun: muhurat 17 only (~4/5 of day)
    [[6, 7], [12, 13]], // Mon: 6 & 12
    [[3, 4], [11, 12]], // Tue
    [[10, 11]], // Wed
    [[8, 9], [12, 13]], // Thu
    [[3, 4], [10, 11]], // Fri
    [[0, 1], [1, 2]]   // Sat: first two
  ];

  // Amrutha Kalam (Vedic: every day specific nakshatra period — approximated as proportional to day)
  // Stored as [muhurat_start, muhurat_end] (out of 30 muhurats in a day)
  const AMRUTHA_MUHURTAS = [4, 4.5, 5, 5.5, 7, 8, 16]; // Sun-Sat start muhurat (duration=1.5 muhurtas)
  const VARJYAM_MUHURTAS = [3, 7, 17, 22, 2.5, 14, 4.5]; // Sun-Sat start (duration=1.5 muhurtas)

  // ─── NOAA Solar Algorithm ─────────────────────────────────────────────────
  // Returns sunrise and sunset as decimal hours in LOCAL time (IST offset given)
  function noaaSunriseSunset(year, month, day, lat, lon, utcOffsetHours) {
    const jd = (function() {
      let y = year, m = month;
      if (m <= 2) { y--; m += 12; }
      const A = Math.floor(y / 100);
      const B = 2 - A + Math.floor(A / 4);
      return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
    })();

    const D = jd - 2451545.0;
    // Geometric mean longitude of the sun (degrees)
    const L0 = (280.46646 + 0.9856474 * D) % 360;
    // Geometric mean anomaly (degrees)
    const M = (357.52911 + 0.98560028 * D) % 360;
    const Mrad = M * RAD;
    // Equation of center
    const C = (1.914602 - 0.004817 * D / 36525 - 0.000014 * (D / 36525) * (D / 36525)) * Math.sin(Mrad)
            + 0.019993 * Math.sin(2 * Mrad)
            + 0.000289 * Math.sin(3 * Mrad);
    // Sun's true longitude
    const sunLon = L0 + C;
    // Apparent longitude (correcting for aberration and nutation)
    const omega = 125.04 - 0.052954 * D;
    const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    // Obliquity of ecliptic
    const epsilon0 = 23.439291 - 0.013004 * D / 36525;
    const epsilon = epsilon0 + 0.00256 * Math.cos(omega * RAD);
    // Sun's declination
    const decl = Math.asin(Math.sin(epsilon * RAD) * Math.sin(lambda * RAD)) / RAD;
    // Equation of time (minutes)
    const y2 = Math.tan((epsilon / 2) * RAD) * Math.tan((epsilon / 2) * RAD);
    const L0rad = L0 * RAD;
    const Mrad2 = M * RAD;
    const eot = (y2 * Math.sin(2 * L0rad)
               - 2 * 0.016708634 * Math.sin(Mrad2)
               + 4 * 0.016708634 * y2 * Math.sin(Mrad2) * Math.cos(2 * L0rad)
               - 0.5 * y2 * y2 * Math.sin(4 * L0rad)
               - 1.25 * 0.016708634 * 0.016708634 * Math.sin(2 * Mrad2)) * 4 / RAD; // in minutes

    // Hour angle for sunrise (solar zenith 90.833°)
    const cosHA = (Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)))
                - Math.tan(lat * RAD) * Math.tan(decl * RAD);

    // Polar day/night handling
    if (cosHA < -1) return { sunrise: 0, sunset: 24 }; // Midnight sun
    if (cosHA > 1)  return { sunrise: 12, sunset: 12 }; // Polar night

    const HA = Math.acos(cosHA) / RAD; // degrees

    // Solar noon (in UTC minutes from midnight)
    const solarNoonUTC = 720 - 4 * lon - eot;
    const sunriseUTC = solarNoonUTC - HA * 4; // minutes
    const sunsetUTC  = solarNoonUTC + HA * 4;

    const sunriseLocal = sunriseUTC / 60 + utcOffsetHours;
    const sunsetLocal  = sunsetUTC  / 60 + utcOffsetHours;

    return { sunrise: sunriseLocal, sunset: sunsetLocal };
  }

  // Format decimal hours to "HH:MM AM/PM" string
  function fmtHHMM(h) {
    let hr = Math.floor(h);
    let mn = Math.round((h - hr) * 60);
    if (mn === 60) { mn = 0; hr++; }
    const period = hr >= 12 ? "PM" : "AM";
    let displayHr = hr % 12;
    if (displayHr === 0) displayHr = 12;
    return `${String(displayHr).padStart(2, "0")}:${String(mn).padStart(2, "0")} ${period}`;
  }

  // Format a range of decimal hours to "HH:MM AM/PM - HH:MM AM/PM"
  function fmtRange(startH, endH) {
    return `${fmtHHMM(startH)} - ${fmtHHMM(endH)}`;
  }

  // Compute all muhurtham timings from actual sunrise & sunset
  function computeMuhurthams(sunriseH, sunsetH, dayOfWeek) {
    const dayDur = sunsetH - sunriseH; // hours
    const segDur = dayDur / 8;         // each of 8 equal segments
    const muhurDur = dayDur / 30;      // 1 muhurtham = 1/30 of day duration

    function seg(n) { // n = 0-based segment number
      return { s: sunriseH + n * segDur, e: sunriseH + (n + 1) * segDur };
    }

    // Rahu Kalam: segment index (1-based in table, convert to 0-based)
    const rahuSeg = RAHU_SEGMENT[dayOfWeek] - 1;
    const yamaSeg = YAMA_SEGMENT[dayOfWeek] - 1;
    const gulikaSeg = GULIKA_SEGMENT[dayOfWeek] - 1;

    const rahu   = seg(rahuSeg);
    const yama   = seg(yamaSeg);
    const gulika = seg(gulikaSeg);

    // Abhijit Muhurtham: 15th muhurtham from sunrise (midday), each muhurtham = dayDur/30
    // Abhijit = muhurta 15 → starts at sunrise + 14 × muhurtDur, ends at +15
    const abhijitStart = sunriseH + 14 * muhurDur;
    const abhijitEnd   = sunriseH + 15 * muhurDur;

    // Durmuhurtham
    const durm = DURM_MUHURTAS[dayOfWeek].map(([a, b]) =>
      fmtRange(sunriseH + a * muhurDur, sunriseH + b * muhurDur)
    ).join(" & ");

    // Amrutha Gadiyalu
    const amS = sunriseH + AMRUTHA_MUHURTAS[dayOfWeek] * muhurDur;
    const amrutha = fmtRange(amS, amS + 1.5 * muhurDur);

    // Varjyam
    const varS = sunriseH + VARJYAM_MUHURTAS[dayOfWeek] * muhurDur;
    const varjyam = fmtRange(varS, varS + 1.5 * muhurDur);

    return {
      rahuKalam:        fmtRange(rahu.s, rahu.e),
      yamagandam:       fmtRange(yama.s, yama.e),
      gulikaKalam:      fmtRange(gulika.s, gulika.e),
      abhijitMuhurtham: fmtRange(abhijitStart, abhijitEnd),
      amruthaGadiyalu:  amrutha,
      durmuhurtham:     durm,
      varjyam:          varjyam
    };
  }

  function normalize(deg) {
    let d = deg % 360.0;
    return d < 0 ? d + 360.0 : d;
  }

  function getJulianDay(year, month, day, hour = 12, minute = 0) {
    let y = year;
    let m = month;
    const utcH = hour - 5.5 + minute / 60.0;
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

  function findTithiEndTime(year, month, day, targetAngle) {
    let lowH = 6.0;
    let highH = 30.0;
    for (let iter = 0; iter < 18; iter++) {
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

  function findNakshatraEndTime(year, month, day, targetAngle) {
    let lowH = 6.0;
    let highH = 30.0;
    for (let iter = 0; iter < 18; iter++) {
      const midH = (lowH + highH) / 2.0;
      const p = calculatePositions(year, month, day, midH);
      let mLong = p.siderealMoon;
      if (targetAngle === 360 && mLong < 180) mLong += 360;
      if (mLong < targetAngle) {
        lowH = midH;
      } else {
        highH = midH;
      }
    }
    return (lowH + highH) / 2.0;
  }

  function formatPeriodTime(h) {
    const isNextDay = h >= 24.0;
    const normalizedH = h % 24.0;
    let hr = Math.floor(normalizedH);
    let min = Math.round((normalizedH - hr) * 60);
    if (min === 60) {
      min = 0;
      hr = (hr + 1) % 24;
    }

    const periodEn = hr >= 12 ? "PM" : "AM";
    let periodTe = "";
    if (hr >= 4 && hr < 12) periodTe = "ఉదయం";
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

  function getPanchang(targetDate = new Date(), options = {}) {
    const d = new Date(targetDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const dateNum = d.getDate();
    const dayOfWeek = d.getDay();

    // Location defaults to Hyderabad, IST (+5.5h)
    const lat = (options && typeof options.lat === "number") ? options.lat : 17.3850;
    const lon = (options && typeof options.lon === "number") ? options.lon : 78.4867;

    const pos = calculatePositions(year, month, dateNum, 6);

    // 1. Tithi (at Sunrise)
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
    const tithiEndHour = findTithiEndTime(year, month, dateNum, targetTithiAngle);
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

    const tithiTimingTe = `${tithiFullTe} ${tithiEndObj.timeTe} వరకు, తదుపరి ${nextTithiNameTe}`;
    const tithiTimingEn = `${tithiFullEn} up to ${tithiEndObj.timeEn}, thereafter ${nextTithiNameEn}`;

    // 2. Nakshatram (at Sunrise)
    const nakshatraIndex = Math.floor(pos.siderealMoon / (360.0 / 27.0)) % 27;
    const nakshatraTe = NAKSHATRAS_TE[nakshatraIndex];
    const nakshatraEn = NAKSHATRAS_EN[nakshatraIndex];

    // Exact Nakshatra End Time and Next Nakshatra transition
    const targetNakAngle = (nakshatraIndex + 1) * (360.0 / 27.0);
    const nakEndHour = findNakshatraEndTime(year, month, dateNum, targetNakAngle);
    const nakEndObj = formatPeriodTime(nakEndHour);
    const nextNakIdx = (nakshatraIndex + 1) % 27;
    const nextNakshatraNameTe = NAKSHATRAS_TE[nextNakIdx];
    const nextNakshatraNameEn = NAKSHATRAS_EN[nextNakIdx];

    const nakshatraTimingTe = `${nakshatraTe} ${nakEndObj.timeTe} వరకు, తదుపరి ${nextNakshatraNameTe}`;
    const nakshatraTimingEn = `${nakshatraEn} up to ${nakEndObj.timeEn}, thereafter ${nextNakshatraNameEn}`;

    // 3. Telugu Lunar Month (Amanta Chandramana)
    let lunarMonthIndex;
    if (options && typeof options.lunarMonthIndex === "number") {
      lunarMonthIndex = options.lunarMonthIndex;
    } else {
      const moonSunElong = normalize(pos.moonTrue - pos.sunTrue);
      const sunLongAtNewMoon = normalize(pos.siderealSun - moonSunElong * (0.9856 / 12.19075));
      const sunRasiAtNewMoon = Math.floor(sunLongAtNewMoon / 30.0);
      lunarMonthIndex = (sunRasiAtNewMoon + 1) % 12;
    }
    const masamTe = TELUGU_MONTHS[lunarMonthIndex];
    const masamEn = TELUGU_MONTHS_EN[lunarMonthIndex];

    // 4. Telugu Samvatsaram (60-year Jovian Cycle)
    const isPreUgadiMonth = (month <= 4) && (lunarMonthIndex >= 9);
    const teluguYear = year - (isPreUgadiMonth ? 1 : 0);
    const baseYear = 2024;
    const baseSamvatsaraIdx = 37;
    const samvatsaraIdx = ((baseSamvatsaraIdx + (teluguYear - baseYear)) % 60 + 60) % 60;
    const samvatsaramTe = `శ్రీ ${SAMVATSARAS_TE[samvatsaraIdx]} నామ సంవత్సరం`;
    const samvatsaramEn = `Sri ${SAMVATSARAS_TE[samvatsaraIdx]} Nama Samvatsaram`;

    // 5. Ayanam (Based on Sidereal Solar Ingress: Makara to Mithuna = Uttarayanam, Karkataka to Dhanu = Dakshinayanam)
    const currentSunRasi = Math.floor(pos.siderealSun / 30.0);
    const isUttarayanam = (currentSunRasi >= 9 || currentSunRasi <= 2);
    const ayanamTe = isUttarayanam ? "ఉత్తరాయణం" : "దక్షిణాయణం";
    const ayanamEn = isUttarayanam ? "Uttarayanam" : "Dakshinayanam";

    // 6. Ritu (The 6 traditional Vedic seasons tied directly to the Telugu Lunar Months)
    const rutusTe = ["వసంత ఋతువు", "గ్రీష్మ ఋతువు", "వర్ష ఋతువు", "శరత్ ఋతువు", "హేమంత ఋతువు", "శిశిర ఋతువు"];
    const rutuIndex = Math.floor(lunarMonthIndex / 2) % 6;
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

    // 9. Sunrise & Sunset (NOAA solar algorithm — location aware)
    const solar = noaaSunriseSunset(year, month, dateNum, lat, lon, 5.5);
    const sunriseH = solar.sunrise;
    const sunsetH  = solar.sunset;
    const sunrise  = fmtHHMM(sunriseH);
    const sunset   = fmtHHMM(sunsetH);

    // 10. All Muhurthams derived from actual sunrise/sunset
    const muhurthams = computeMuhurthams(sunriseH, sunsetH, dayOfWeek);

    // 11. Festivals
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
      yogaTe,
      karanaTe,
      sunrise,
      sunset,
      sunriseH,
      sunsetH,
      rahuKalam:        muhurthams.rahuKalam,
      yamagandam:       muhurthams.yamagandam,
      gulikaKalam:      muhurthams.gulikaKalam,
      abhijitMuhurtham: muhurthams.abhijitMuhurtham,
      amruthaGadiyalu:  muhurthams.amruthaGadiyalu,
      durmuhurtham:     muhurthams.durmuhurtham,
      varjyam:          muhurthams.varjyam,
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

  function getMonthPanchang(year, month, lat, lon) {
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

  function isStartOfTeluguMonth(d) {
    const pCur = calculatePositions(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
    const tCur = Math.floor(normalize(pCur.moonTrue - pCur.sunTrue) / 12.0) + 1;
    const prevD = new Date(d.getTime() - 86400000);
    const pPrev = calculatePositions(prevD.getFullYear(), prevD.getMonth() + 1, prevD.getDate(), 6);
    const tPrev = Math.floor(normalize(pPrev.moonTrue - pPrev.sunTrue) / 12.0) + 1;
    return (tCur === 1 && tPrev >= 28) || (tCur === 2 && tPrev >= 29);
  }

  function isEndOfTeluguMonth(d) {
    const pCur = calculatePositions(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
    const tCur = Math.floor(normalize(pCur.moonTrue - pCur.sunTrue) / 12.0) + 1;
    const nextD = new Date(d.getTime() + 86400000);
    const pNext = calculatePositions(nextD.getFullYear(), nextD.getMonth() + 1, nextD.getDate(), 6);
    const tNext = Math.floor(normalize(pNext.moonTrue - pNext.sunTrue) / 12.0) + 1;
    return (tCur === 30 && tNext <= 2) || (tCur === 29 && (tNext === 1 || tNext === 2));
  }

  function getTeluguMonthCalendar(refDate, lat, lon) {
    const base = refDate ? new Date(refDate) : new Date();
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 6, 0, 0);

    // 1. Walk backwards to find Shukla Padyami (start of this lunar month)
    let curD = new Date(d.getTime());
    let maxIter = 40;
    while (maxIter-- > 0) {
      if (isStartOfTeluguMonth(curD)) break;
      curD = new Date(curD.getTime() - 86400000);
    }
    const startD = new Date(curD.getTime());

    // 2. Determine the lunarMonthIndex at start of this month
    const pStart = calculatePositions(startD.getFullYear(), startD.getMonth() + 1, startD.getDate(), 6);
    const sunRasi = Math.floor(pStart.siderealSun / 30.0);
    const lunarMonthIndex = (sunRasi + 1) % 12;
    const masamTe = TELUGU_MONTHS[lunarMonthIndex];
    const masamEn = TELUGU_MONTHS_EN[lunarMonthIndex];

    // 3. Scan forwards day by day until Amavasya
    const days = [];
    let scanD = new Date(startD.getTime());
    maxIter = 35;
    while (maxIter-- > 0) {
      const dayPanchang = getPanchang(new Date(scanD.getTime()), { lunarMonthIndex, lat, lon });
      days.push(dayPanchang);
      if (days.length >= 28 && isEndOfTeluguMonth(scanD)) {
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

  return {
    getPanchang,
    getMonthPanchang,
    getTeluguMonthCalendar,
    getAdjacentTeluguMonthDate,
    TELUGU_MONTHS,
    TELUGU_MONTHS_EN,
    TITHI_NAMES_TE,
    NAKSHATRAS_TE,
    DAYS_TE,
    DAYS_SHORT_TE,
    DAYS_SHORT_EN
  };
});
