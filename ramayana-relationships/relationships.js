/**
 * SANNIVESHAM - RAMAYANA KINSHIP & RELATIONSHIP RESOLVER ENGINE
 * (ఎవరు ఎవరికీ ఏమవుతారు? - సంబంధ నిరూపణ వ్యవస్థ)
 * Authenticated against Srimad Valmiki Ramayana
 */

(function (global) {
  "use strict";

  // Data accessor
  function getData() {
    if (typeof window !== "undefined" && window.RAMAYANA_DATA) {
      return window.RAMAYANA_DATA;
    }
    if (typeof globalThis !== "undefined" && globalThis.RAMAYANA_DATA) {
      return globalThis.RAMAYANA_DATA;
    }
    try {
      return require("./data.js");
    } catch (e) {
      return null;
    }
  }

  /* =====================================================
     1. CURATED SPECIAL HISTORICAL RELATIONSHIPS
  ===================================================== */
  const SPECIAL_RELATIONS = {
    "sri_rama|bharata": {
      relationTe: "తమ్ముడు (సవతి సోదరుడు)",
      relationEn: "Younger Brother (Step-brother)",
      honorificTe: "శ్రీరామునికి భరతుడు ప్రాణసమానుడైన తమ్ముడు",
      detailsTe: "దశరథ-కైకేయిల కుమారుడు. శ్రీరాముని పాదుకలను సింహాసనంపై ఉంచి 14 ఏళ్లు నందిగ్రామం నుండి ధర్మపాలన చేసిన పరమ భ్రాతృభక్తుడు.",
      kanda: "అయోధ్య కాండ & యుద్ధ కాండ",
      connectionType: "sibling"
    },
    "bharata|sri_rama": {
      relationTe: "అన్నయ్య (జ్యేష్ఠ సోదరుడు)",
      relationEn: "Elder Brother",
      honorificTe: "భరతునికి శ్రీరాముడు దైవసమానుడైన అన్నయ్య",
      detailsTe: "దశరథ-కౌసల్యల జ్యేష్ఠపుత్రుడు. భరతుడు రాముని పాదుకలను పూజిస్తూ అయోధ్యను ధర్మబద్ధంగా పాలించాడు.",
      kanda: "అయోధ్య కాండ & యుద్ధ కాండ",
      connectionType: "sibling"
    },
    "sri_rama|lakshmana": {
      relationTe: "తమ్ముడు (నిత్య అనుచరుడు)",
      relationEn: "Younger Brother & Constant Companion",
      honorificTe: "శ్రీరామునికి లక్ష్మణుడు బహిఃప్రాణం (శరీరానికి ప్రాణం వంటివాడు)",
      detailsTe: "దశరథ-సుమిత్రల కుమారుడు. శ్రీరాముని అడుగుజాడల్లో 14 ఏళ్ల అరణ్యవాసంలో నిద్రాహారాలు మాని సేవ చేసిన పవిత్ర సోదరుడు.",
      kanda: "బాలకాండ నుండి ఉత్తరకాండ వరకు",
      connectionType: "sibling"
    },
    "lakshmana|sri_rama": {
      relationTe: "అన్నయ్య & పూజ్య దైవం",
      relationEn: "Elder Brother & Lord",
      honorificTe: "లక్ష్మణునికి శ్రీరాముడు సమస్తమూ",
      detailsTe: "శ్రీరాముని ఆజ్ఞే వేదంగా భావించి సేవలందించిన మహావీరుడు లక్ష్మణుడు.",
      kanda: "బాలకాండ నుండి ఉత్తరకాండ వరకు",
      connectionType: "sibling"
    },
    "sri_rama|shatrughna": {
      relationTe: "కనిష్ఠ సోదరుడు (చివరి తమ్ముడు)",
      relationEn: "Youngest Brother",
      honorificTe: "శ్రీరామునికి శత్రుఘ్నుడు కనిష్ఠ అనుజుడు",
      detailsTe: "దశరథ-సుమిత్రల చిన్న కుమారుడు. లవణాసురుని వధించి మధురా నగర స్థాపన చేసిన పరాక్రమశీలి.",
      kanda: "బాలకాండ & ఉత్తరకాండ",
      connectionType: "sibling"
    },
    "sri_rama|sita": {
      relationTe: "ధర్మపత్ని (సహధర్మచారిణి)",
      relationEn: "Wife & Divine Consort",
      honorificTe: "శ్రీరాముని ఏకపత్నీ వ్రత ధర్మపత్ని",
      detailsTe: "జనక మహారాజు అయోనిజ పుత్రిక, సాక్షాత్తు శ్రీమహాలక్ష్మి అవతార స్వరూపిణి. సీతాకళ్యాణంలో శివధనుర్భంగం చేసి రాముడు వివాహం చేసుకున్నాడు.",
      kanda: "బాలకాండ 73వ సర్గ",
      connectionType: "spouse"
    },
    "sita|sri_rama": {
      relationTe: "ప్రాణనాథుడు (భర్త)",
      relationEn: "Husband & Lord",
      honorificTe: "సీతాదేవికి శ్రీరాముడు ప్రాణేశ్వరుడు",
      detailsTe: "సూర్యవంశపు ప్రభువు, ధర్మమూర్తి, శ్రీరామచంద్రుడు.",
      kanda: "బాలకాండ నుండి యుద్ధకాండ వరకు",
      connectionType: "spouse"
    },
    "sita|lakshmana": {
      relationTe: "మరిది (భర్త తమ్ముడు)",
      relationEn: "Brother-in-law (Husband's Younger Brother)",
      honorificTe: "సీతాదేవికి లక్ష్మణుడు మాతృసమాన భక్తితో సేవించిన మరిది",
      detailsTe: "సీతాదేవి పాదాలను మాత్రమే చూస్తూ 14 ఏళ్లు వనవాసంలో రక్షణ కల్పించిన నిష్కళంక వీరుడు లక్ష్మణుడు.",
      kanda: "కిష్కింధ కాండ 6వ సర్గ",
      connectionType: "inlaw"
    },
    "lakshmana|sita": {
      relationTe: "వదినగారు (మాతృసమానురాలు)",
      relationEn: "Sister-in-law (Mother figure)",
      honorificTe: "లక్ష్మణునికి సీతాదేవి తల్లితో సమానం",
      detailsTe: "కిష్కింధలో సుగ్రీవుడు సీతాదేవి ఆభరణాలు చూపినప్పుడు 'నేను ఆమె నూపురాలను (కాలి అందెలను) మాత్రమే గుర్తుపట్టగలను, రోజూ పాదాభివందనం చేయడం వల్ల' అని లక్ష్మణుడు చెప్పాడు.",
      kanda: "కిష్కింధ కాండ 6.22",
      connectionType: "inlaw"
    },
    "sita|urmila": {
      relationTe: "సొంత చెల్లెలు",
      relationEn: "Younger Sister",
      honorificTe: "జనక మహారాజు పుత్రికలు",
      detailsTe: "జనక మహారాజు మరియు సునయనల కుమార్తె. లక్ష్మణుని ధర్మపత్ని. 14 ఏళ్లు లక్ష్మణుని కోసం తీవ్ర తపస్సు ఆచరించింది.",
      kanda: "బాలకాండ 71వ సర్గ",
      connectionType: "sibling"
    },
    "sita|mandavi": {
      relationTe: "పినతండ్రి కుమార్తె (చెల్లెలి వరుస)",
      relationEn: "First Cousin (Father's Brother's Daughter)",
      honorificTe: "సాంకాశ్య నగర రాజపుత్రి",
      detailsTe: "జనకుని తమ్ముడైన కుశధ్వజుని జ్యేష్ఠ కుమార్తె. భరతుని ధర్మపత్ని.",
      kanda: "బాలకాండ 71వ సర్గ",
      connectionType: "cousin"
    },
    "sita|shrutakirti": {
      relationTe: "పినతండ్రి కుమార్తె (చెల్లెలి వరుస)",
      relationEn: "First Cousin (Father's Brother's Daughter)",
      honorificTe: "సాంకాశ్య నగర రాజపుత్రి",
      detailsTe: "కుశధ్వజ మహారాజు కనిష్ఠ కుమార్తె. శత్రుఘ్నుని ధర్మపత్ని.",
      kanda: "బాలకాండ 71వ సర్గ",
      connectionType: "cousin"
    },
    "dasharatha|shanta": {
      relationTe: "పుత్రిక (జ్యేష్ఠ సంతానం)",
      relationEn: "Daughter (Eldest Child)",
      honorificTe: "దశరథుని ప్రథమ పుత్రిక",
      detailsTe: "దశరథ మహారాజు కుమార్తె. అంగరాజైన రోమపాదునికి సంతానం లేకపోవడంతో దత్తత ఇవ్వబడింది. ఋష్యశృంగ మహర్షి ధర్మపత్ని.",
      kanda: "బాలకాండ 9వ సర్గ",
      connectionType: "child"
    },
    "dasharatha|rishyashringa": {
      relationTe: "అల్లుడు (పుత్రిక శాంతాదేవి భర్త)",
      relationEn: "Son-in-law",
      honorificTe: "పుత్రకామేష్టి యజ్ఞాచార్యుడు",
      detailsTe: "విభాండక మహర్షి కుమారుడు, దశరథుని కుమార్తె శాంతాదేవి భర్త. దశరథునికి పుత్రులు కలగడానికి పుత్రకామేష్టి యజ్ఞం నడిపించిన పరమ తపస్వి.",
      kanda: "బాలకాండ 9, 10, 11 సర్గలు",
      connectionType: "inlaw"
    },
    "sri_rama|lava": {
      relationTe: "తండ్రి - జ్యేష్ఠ పుత్రుడు",
      relationEn: "Father & Elder Son",
      honorificTe: "శ్రీరామ-సీతల జ్యేష్ఠ పుత్రుడు",
      detailsTe: "వాల్మీకి ఆశ్రమంలో జన్మించిన వీరుడు. శ్రావస్తి నగరానికి రాజుగా పట్టాభిషిక్తుడయ్యాడు.",
      kanda: "ఉత్తరకాండ 66 & 107 సర్గలు",
      connectionType: "child"
    },
    "sri_rama|kusha": {
      relationTe: "తండ్రి - కనిష్ఠ పుత్రుడు",
      relationEn: "Father & Younger Son",
      honorificTe: "శ్రీరామ-సీతల కుమారుడు",
      detailsTe: "వాల్మీకి మహర్షి వద్ద వేదాలు, రామాయణ కావ్యం నేర్చుకున్న తపోవీరుడు. కుశావతి నగరానికి రాజుగా పట్టాభిషిక్తుడయ్యాడు.",
      kanda: "ఉత్తరకాండ 66 & 108 సర్గలు",
      connectionType: "child"
    },
    "vali|sugriva": {
      relationTe: "సహోదరులు (అన్న - తమ్ముడు)",
      relationEn: "Brothers (Elder & Younger)",
      honorificTe: "కిష్కింధ వానర సోదరులు",
      detailsTe: "ఇంద్రుని అంశతో వాలి, సూర్యుని అంశతో సుగ్రీవుడు జన్మించారు. తొలుత గాఢమైన ప్రేమ ఉన్నప్పటికీ మాయావి రాక్షసునితో యుద్ధం తర్వాత అపార్థాలతో వైరం ఏర్పడింది.",
      kanda: "కిష్కింధ కాండ",
      connectionType: "sibling"
    },
    "sugriva|vali": {
      relationTe: "అన్నయ్య (జ్యేష్ఠ సోదరుడు)",
      relationEn: "Elder Brother",
      honorificTe: "వాలి సుగ్రీవునికి అగ్రజుడు",
      detailsTe: "కిష్కింధ ప్రభువు, అపార బలసంపన్నుడైన వాలి.",
      kanda: "కిష్కింధ కాండ",
      connectionType: "sibling"
    },
    "vali|angada": {
      relationTe: "తండ్రి - కుమారుడు",
      relationEn: "Father & Son",
      honorificTe: "వాలి-తారల పుత్రుడు",
      detailsTe: "వాలి కుమారుడు. వాలి మరణశయ్యపై అంగదుని శ్రీరాముడు మరియు సుగ్రీవుని చేతుల్లో అప్పగించాడు.",
      kanda: "కిష్కింధ కాండ 22వ సర్గ",
      connectionType: "child"
    },
    "sugriva|angada": {
      relationTe: "పినతండ్రి - కుమారుని వరుస",
      relationEn: "Paternal Uncle & Nephew",
      honorificTe: "సుగ్రీవునికి అంగదుడు అన్న కుమారుడు (యువరాజు)",
      detailsTe: "సుగ్రీవుడు కిష్కింధ సింహాసనాన్ని అధిష్ఠించినప్పుడు అంగదుని కిష్కింధ యువరాజుగా నియమించాడు.",
      kanda: "కిష్కింధ కాండ 26వ సర్గ",
      connectionType: "uncle_nephew"
    },
    "sri_rama|hanuman": {
      relationTe: "స్వామి - పరమ భక్తుడు / సేవకుడు",
      relationEn: "Lord & Supreme Devotee / Servant",
      honorificTe: "రామ భక్త శిఖామణి హనుమంతుడు",
      detailsTe: "రుద్రాంశ సంభూతుడు. శ్రీరామునికి జీవితాంతం అంకితమైన పరమ భక్తుడు. లంకా దహనం, సంజీవిని పర్వతాన్ని తేవడం ద్వారా లక్ష్మణుని, రామ సైన్యాన్ని కాపాడాడు.",
      kanda: "కిష్కింధ కాండ నుండి యుద్ధకాండ వరకు",
      connectionType: "guru_disciple"
    },
    "hanuman|sri_rama": {
      relationTe: "ఆరాధ్య దైవం - పరమ ప్రభువు",
      relationEn: "Adored Deity & Supreme Master",
      honorificTe: "హనుమంతునికి శ్రీరాముడు సమస్త ప్రాణం",
      detailsTe: "'ఎక్కడ రఘునాథ కీర్తన జరుగుతుందో అక్కడ ఆనందబాష్పాలతో చేతులు జోడించి నిలిచి ఉండేవాడు' హనుమంతుడు.",
      kanda: "ఉత్తరకాండ",
      connectionType: "guru_disciple"
    },
    "ravana|vibhishana": {
      relationTe: "సహోదరులు (అన్న - కనిష్ఠ తమ్ముడు)",
      relationEn: "Brothers (Elder & Righteous Younger)",
      honorificTe: "విశ్రవసుడు-కైకసిల పుత్రులు",
      detailsTe: "రావణుడు అధర్మానికి పాల్పడినప్పుడు విభీషణుడు సీతను రామునికి అప్పగించమని హితవు పలికాడు. రావణుడు తిరస్కరించడంతో శ్రీరాముని శరణు వేడి లంకాధిపతి అయ్యాడు.",
      kanda: "యుద్ధ కాండ",
      connectionType: "sibling"
    },
    "ravana|indrajit": {
      relationTe: "తండ్రి - జ్యేష్ఠ పుత్రుడు",
      relationEn: "Father & Eldest Son (Meghanada)",
      honorificTe: "రావణ-మండోదరుల జ్యేష్ఠ పుత్రుడు",
      detailsTe: "మేఘనాథుడు (ఇంద్రజిత్తు) దేవతల ప్రభువైన ఇంద్రుడినే బంధించి లంకకు తెచ్చిన మహా పరాక్రమశాలి. లక్ష్మణుని చేతిలో మరణించాడు.",
      kanda: "యుద్ధ కాండ",
      connectionType: "child"
    },
    "ravana|kumbhakarna": {
      relationTe: "సహోదరులు (అన్న - తమ్ముడు)",
      relationEn: "Brothers (Elder & Giant Younger)",
      honorificTe: "విశ్రవసుని పుత్రులు",
      detailsTe: "మహా పర్వత సమానుడైన రాక్షస వీరుడు. ఆరు నెలలు నిద్రించే వరం పొంది, యుద్ధంలో రాముని చేతిలో వీరస్వర్గం పొందాడు.",
      kanda: "యుద్ధ కాండ",
      connectionType: "sibling"
    },
    "ravana|kubera": {
      relationTe: "సవతి సోదరులు (అన్న - తమ్ముడు)",
      relationEn: "Half-Brothers (Father Vishrava)",
      honorificTe: "విశ్రవస మహర్షి పుత్రులు",
      detailsTe: "కుబేరుడు విశ్రవసుడు-ఇళబిడల కుమారుడు, ఉత్తర దిక్పాలకుడు. రావణుడు విశ్రవసుడు-కైకసిల కుమారుడు. రావణుడు కుబేరుని లంక నుండి తరిమి పుష్పక విమానాన్ని లాక్కున్నాడు.",
      kanda: "ఉత్తరకాండ 9-11 సర్గలు",
      connectionType: "sibling"
    },
    "vasistha|sri_rama": {
      relationTe: "కులగురువు - శిష్యుడు",
      relationEn: "Royal Preceptor (Kula Guru) & Disciple",
      honorificTe: "ఇక్ష్వాకు వంశ పురోహితుడు వశిష్ఠ మహర్షి",
      detailsTe: "బ్రహ్మమానస పుత్రుడైన వశిష్ఠుడు ఇక్ష్వాకు వంశానికి తరతరాలుగా కులగురువు. శ్రీరామునికి సమస్త విద్యలు, ధర్మరహస్యాలను బోధించాడు.",
      kanda: "బాలకాండ & అయోధ్య కాండ",
      connectionType: "guru_disciple"
    },
    "vishwamitra|sri_rama": {
      relationTe: "దీక్షా గురువు - ప్రియ శిష్యుడు",
      relationEn: "Initiating Guru & Beloved Disciple",
      honorificTe: "రామునికి దివ్యాస్త్రాలను ప్రసాదించిన బ్రహ్మర్షి",
      detailsTe: "సిద్ధాశ్రమ యాగ రక్షణ కోసం రాముడిని తీసుకెళ్లి తాటక, సుబాహులను వధింపజేశాడు. రామలక్ష్మణులకు బల, అతిబల విద్యలు, దివ్య అస్త్రాలను ఉపదేశించాడు.",
      kanda: "బాలకాండ 22-30 సర్గలు",
      connectionType: "guru_disciple"
    },
    "valmiki|sri_rama": {
      relationTe: "ఆది కవి / ఋషి - కావ్యాధిపతి (రామకథానాయకుడు)",
      relationEn: "Adi Kavi & Hero of the Epic",
      honorificTe: "శ్రీమద్రామాయణ గ్రంథకర్త",
      detailsTe: "నారద మహర్షి ఉపదేశంతో శ్రీరాముని సద్గుణాలను గానం చేస్తూ ప్రపంచపు తొలి కావ్యమైన శ్రీమద్రామాయణాన్ని రచించిన మహర్షి.",
      kanda: "బాలకాండ 1-4 సర్గలు",
      connectionType: "guru_disciple"
    },
    "valmiki|lava": {
      relationTe: "గురువు & సంరక్షకుడు",
      relationEn: "Guru, Protector & Foster Father",
      honorificTe: "లవకుశుల విద్యా గురువు",
      detailsTe: "సీతాదేవిని తన ఆశ్రమంలో రక్షించి, లవునికి సమస్త వేదాలు, శస్త్రవిద్యలు మరియు రామాయణ గానాన్ని స్వయంగా నేర్పించిన గురువు.",
      kanda: "ఉత్తరకాండ",
      connectionType: "guru_disciple"
    },
    "agastya|sri_rama": {
      relationTe: "మార్గదర్శక మహర్షి - శిష్యుడు",
      relationEn: "Guiding Sage & Disciple",
      honorificTe: "ఆదిత్య హృదయ స్తోత్రోపదేశ గురువు",
      detailsTe: "దండకారణ్యంలో శ్రీరామునికి వైష్ణవ ధనుస్సు, అక్షయ తూణీరాలను ఇచ్చాడు. లంకా యుద్ధంలో అలసిన రామునికి పరమ పవిత్రమైన 'ఆదిత్య హృదయ స్తోత్రం' ఉపదేశించాడు.",
      kanda: "అరణ్య కాండ & యుద్ధ కాండ 105వ సర్గ",
      connectionType: "guru_disciple"
    }
  };

  /* =====================================================
     2. RESOLVER FUNCTION
  ===================================================== */
  function findRelationship(id1, id2) {
    if (!id1 || !id2) return null;
    if (id1 === id2) {
      return {
        same: true,
        relationTe: "స్వయం (అదే వ్యక్తి)",
        relationEn: "Self",
        detailsTe: "రెండు ఎంపికలూ ఒకే పాత్రను సూచిస్తున్నాయి.",
        path: []
      };
    }

    const data = getData();
    if (!data) return null;

    const charMap = {};
    (data.CHARACTERS || []).forEach(c => { charMap[c.id] = c; });

    const c1 = charMap[id1];
    const c2 = charMap[id2];

    // 1. Check curated special relationship table first
    const keyForward = `${id1}|${id2}`;
    if (SPECIAL_RELATIONS[keyForward]) {
      const spec = SPECIAL_RELATIONS[keyForward];
      return {
        char1: c1 || { id: id1, nameTelugu: id1 },
        char2: c2 || { id: id2, nameTelugu: id2 },
        relationTe: spec.relationTe,
        relationEn: spec.relationEn,
        honorificTe: spec.honorificTe,
        detailsTe: spec.detailsTe,
        kanda: spec.kanda || "శ్రీమద్వాల్మీకి రామాయణం",
        path: [id1, id2]
      };
    }

    // 2. Check Ikshvaku Dynasty ancestral lineage
    const ikshvakuList = data.IKSHVAKU_LINEAGE || [];
    const idx1 = ikshvakuList.findIndex(k => k.id === id1);
    const idx2 = ikshvakuList.findIndex(k => k.id === id2);

    if (idx1 !== -1 && idx2 !== -1) {
      const k1 = ikshvakuList[idx1];
      const k2 = ikshvakuList[idx2];
      const diff = idx2 - idx1;

      if (diff === 1) {
        return {
          char1: c1 || { id: id1, nameTelugu: k1.nameTe },
          char2: c2 || { id: id2, nameTelugu: k2.nameTe },
          relationTe: "తండ్రి - పుత్రుడు",
          relationEn: "Father & Son",
          honorificTe: `${k1.nameTe} మరియు ${k2.nameTe} తండ్రీకొడుకులు`,
          detailsTe: `${k1.nameTe} ఇక్ష్వాకు వంశంలో ${k1.gen}వ తరం చక్రవర్తి. ఆయన పుత్రుడు ${k2.nameTe} (${k2.gen}వ తరం).`,
          kanda: `${k1.sarga || ""} • ${k2.sarga || ""}`,
          path: [id1, id2]
        };
      } else if (diff === -1) {
        return {
          char1: c1 || { id: id1, nameTelugu: k1.nameTe },
          char2: c2 || { id: id2, nameTelugu: k2.nameTe },
          relationTe: "పుత్రుడు - తండ్రి",
          relationEn: "Son & Father",
          honorificTe: `${k1.nameTe} ${k2.nameTe} గారి పుత్రుడు`,
          detailsTe: `${k2.nameTe} ఇక్ష్వాకు వంశంలో ${k2.gen}వ తరం ప్రభువు. ఆయన కుమారుడు ${k1.nameTe}.`,
          kanda: `${k1.sarga || ""} • ${k2.sarga || ""}`,
          path: [id1, id2]
        };
      } else if (diff > 1) {
        return {
          char1: c1 || { id: id1, nameTelugu: k1.nameTe },
          char2: c2 || { id: id2, nameTelugu: k2.nameTe },
          relationTe: `పూర్వ వంశీయుడు (${diff} తరాల క్రితం)`,
          relationEn: `Direct Ancestor (${diff} Generations Prior)`,
          honorificTe: `${k1.nameTe} ${k2.nameTe} గారికి ${diff} తరాల పూర్వీకుడు`,
          detailsTe: `సూర్యవంశ (ఇక్ష్వాకు) రాజవంశానుక్రమంలో ${k1.nameTe} (${k1.gen}వ తరం) పాలించారు. ఆయన తర్వాత ${diff} తరాలకు ${k2.nameTe} (${k2.gen}వ తరం) అవతరించారు.`,
          kanda: "బాలకాండ 70వ సర్గ (వంశానుక్రమణిక)",
          path: [id1, "...", id2]
        };
      } else {
        const absDiff = Math.abs(diff);
        return {
          char1: c1 || { id: id1, nameTelugu: k1.nameTe },
          char2: c2 || { id: id2, nameTelugu: k2.nameTe },
          relationTe: `వంశోద్ధారకుడు (${absDiff} తరాల తరువాతి సంతతి)`,
          relationEn: `Direct Descendant (${absDiff} Generations Later)`,
          honorificTe: `${k1.nameTe} ${k2.nameTe} గారికి ${absDiff} తరాల తరువాతి వంశీయుడు`,
          detailsTe: `సూర్యవంశ ప్రభువు ${k2.nameTe} (${k2.gen}వ తరం) తరువాతి ${absDiff}వ తరంలో ${k1.nameTe} (${k1.gen}వ తరం) జన్మించారు.`,
          kanda: "బాలకాండ 70వ సర్గ",
          path: [id1, "...", id2]
        };
      }
    }

    // 3. Dynamic Graph BFS Kinship Resolver
    if (c1 && c2) {
      // Direct Parent / Child
      if (c1.childrenIds && c1.childrenIds.includes(id2)) {
        const isSon = c2.gender === "male";
        return {
          char1: c1,
          char2: c2,
          relationTe: isSon ? "కుమారుడు" : "కుమార్తె",
          relationEn: isSon ? "Son" : "Daughter",
          honorificTe: `${c2.nameTelugu} ${c1.nameTelugu} గారి ${isSon ? "కుమారుడు" : "కుమార్తె"}`,
          detailsTe: `${c1.nameTelugu} మరియు ${c2.nameTelugu} తండ్రి/తల్లి మరియు సంతానం సంబంధం.`,
          kanda: c2.citation || c1.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }

      if ((c2.childrenIds && c2.childrenIds.includes(id1)) || c1.fatherId === id2 || c1.motherId === id2) {
        const isFather = c2.gender === "male";
        return {
          char1: c1,
          char2: c2,
          relationTe: isFather ? "తండ్రి" : "తల్లి",
          relationEn: isFather ? "Father" : "Mother",
          honorificTe: `${c2.nameTelugu} ${c1.nameTelugu} గారి ${isFather ? "తండ్రి" : "తల్లి"}`,
          detailsTe: `${c2.nameTelugu} ${c1.nameTelugu} గారికి జన్మనిచ్చిన పూజ్య ${isFather ? "పితృపాదులు" : "మాతృమూర్తి"}.`,
          kanda: c1.citation || c2.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }

      // Direct Spouse
      if (c1.spouseIds && c1.spouseIds.includes(id2)) {
        const isHusband = c2.gender === "male";
        return {
          char1: c1,
          char2: c2,
          relationTe: isHusband ? "భర్త (ప్రాణేశ్వరుడు)" : "భార్య (ధర్మపత్ని)",
          relationEn: isHusband ? "Husband" : "Wife",
          honorificTe: `${c1.nameTelugu} మరియు ${c2.nameTelugu} దంపతులు`,
          detailsTe: `శ్రీమద్రామాయణంలో పవిత్ర దాంపత్య బంధం కలిగిన దంపతులు.`,
          kanda: c1.citation || c2.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }

      // Direct Siblings
      const shareFather = c1.fatherId && c2.fatherId && c1.fatherId === c2.fatherId;
      const shareMother = c1.motherId && c2.motherId && c1.motherId === c2.motherId;
      const explicitSiblings = (c1.siblingIds && c1.siblingIds.includes(id2)) || (c2.siblingIds && c2.siblingIds.includes(id1));

      if (shareFather || shareMother || explicitSiblings) {
        const isMale = c2.gender === "male";
        const relTe = isMale ? "సోదరుడు (సహోదరుడు)" : "సోదరి (సహోదరి)";
        const relEn = isMale ? "Brother" : "Sister";
        return {
          char1: c1,
          char2: c2,
          relationTe: relTe,
          relationEn: relEn,
          honorificTe: `${c1.nameTelugu} మరియు ${c2.nameTelugu} సోదరులు`,
          detailsTe: shareFather && shareMother ? "ఒకే తల్లిదండ్రులకు జన్మించిన పవిత్ర సహోదరులు." : "ఒకే వంశానికి చెందిన ఆత్మీయ సోదరులు.",
          kanda: c1.citation || c2.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }

      // In-laws: Spouse's Brother / Sister
      if (c1.spouseIds && c1.spouseIds.length > 0) {
        for (const spId of c1.spouseIds) {
          const sp = charMap[spId];
          if (sp && sp.siblingIds && sp.siblingIds.includes(id2)) {
            const isMale = c2.gender === "male";
            return {
              char1: c1,
              char2: c2,
              relationTe: isMale ? "బావ / మరిది (భార్య/భర్త సోదరుడు)" : "వదిన / మరదలు (భార్య/భర్త సోదరి)",
              relationEn: isMale ? "Brother-in-law" : "Sister-in-law",
              honorificTe: `${c2.nameTelugu} ${c1.nameTelugu} గారికి వివాహ బంధుత్వంలో ${isMale ? "బావమరిది/మరిది" : "వదిన/మరదలు"} వరుస`,
              detailsTe: `${c1.nameTelugu} గారి జీవితభాగస్వామి ${sp.nameTelugu} గారి సోదరుడు/సోదరి ${c2.nameTelugu}.`,
              kanda: c1.citation || "శ్రీమద్వాల్మీకి రామాయణం",
              path: [id1, spId, id2]
            };
          }
        }
      }

      // Guru / Disciple
      if (c1.guruIds && c1.guruIds.includes(id2)) {
        return {
          char1: c1,
          char2: c2,
          relationTe: "గురువు (విద్యా & దీక్షా ప్రదాత)",
          relationEn: "Spiritual Guru & Mentor",
          honorificTe: `${c2.nameTelugu} ${c1.nameTelugu} గారి పూజ్య గురుదేవులు`,
          detailsTe: `${c2.nameTelugu} మహర్షి వద్ద ${c1.nameTelugu} విద్యలు, దివ్య అస్త్రాలు లేదా ధర్మోపదేశం పొందారు.`,
          kanda: c1.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }

      if (c1.discipleIds && c1.discipleIds.includes(id2)) {
        return {
          char1: c1,
          char2: c2,
          relationTe: "శిష్యుడు",
          relationEn: "Disciple & Student",
          honorificTe: `${c2.nameTelugu} ${c1.nameTelugu} మహర్షి వద్ద ఉపదేశం పొందిన ప్రియ శిష్యుడు`,
          detailsTe: `${c1.nameTelugu} మహర్షి ద్వారా మార్గదర్శకత్వం పొందిన శిష్యుడు ${c2.nameTelugu}.`,
          kanda: c1.citation || "శ్రీమద్వాల్మీకి రామాయణం",
          path: [id1, id2]
        };
      }
    }

    // Fallback: Broad Epic Kinship / Ally
    return {
      char1: c1 || { id: id1, nameTelugu: id1 },
      char2: c2 || { id: id2, nameTelugu: id2 },
      relationTe: "రామాయణ సమకాలీన మహనీయులు",
      relationEn: "Contemporary Epic Figures",
      honorificTe: `${(c1 && c1.nameTelugu) || id1} మరియు ${(c2 && c2.nameTelugu) || id2}`,
      detailsTe: `ఈ ఇద్దరు మహనీయులూ శ్రీమద్రామాయణంలో ధర్మస్థాపన మరియు సత్య పరిరక్షణలో విశిష్ట పాత్రలు పోషించారు.`,
      kanda: "శ్రీమద్వాల్మీకి రామాయణం",
      path: [id1, id2]
    };
  }

  // Export
  const KinshipEngine = {
    findRelationship,
    SPECIAL_RELATIONS
  };

  if (typeof window !== "undefined") {
    window.KinshipEngine = KinshipEngine;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.KinshipEngine = KinshipEngine;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = KinshipEngine;
  }
})(typeof window !== "undefined" ? window : global);
