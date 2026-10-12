/**
 * ⚠️  MOCK / DEMO DATA — NOT REAL LEGAL ADVICE
 *
 * This file contains clearly labelled sample data for UI development only.
 * All regulatory text, clause references, and document citations shown here
 * are illustrative placeholders. They are NOT verified legal sources.
 *
 * Real data must be wired from an authoritative backend before production use.
 * See src/services/qaService.ts for the integration point.
 */

import type {
  QAAnswer,
  SuggestedQuestion,
  RegulationCategory,
  QueryHistoryEntry,
} from '../../types'

// ── Suggested questions ───────────────────────────────────────

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'sq-1',
    textEn: 'What is the minimum setback required from an agricultural land boundary?',
    textHi: 'कृषि भूमि की सीमा से न्यूनतम कितनी दूरी (सेटबैक) अनिवार्य है?',
    category: 'Setbacks & Boundaries',
    icon: '📐',
  },
  {
    id: 'sq-2',
    textEn: 'Can I build a permanent structure on land classified as "Nistar" land?',
    textHi: 'क्या "निस्तार" भूमि पर स्थायी निर्माण किया जा सकता है?',
    category: 'Land Classification',
    icon: '🏗️',
  },
  {
    id: 'sq-3',
    textEn: 'What documents are required to convert agricultural land to residential use?',
    textHi: 'कृषि भूमि को आवासीय उपयोग में परिवर्तित करने के लिए कौन से दस्तावेज चाहिए?',
    category: 'Land Conversion',
    icon: '📋',
  },
  {
    id: 'sq-4',
    textEn: 'What is the maximum floor area ratio (FAR) for residential buildings in rural MP?',
    textHi: 'ग्रामीण मध्यप्रदेश में आवासीय भवनों के लिए अधिकतम FAR क्या है?',
    category: 'Building Regulations',
    icon: '🏢',
  },
  {
    id: 'sq-5',
    textEn: 'How do I apply for a building permit (naksha pass) in a gram panchayat area?',
    textHi: 'ग्राम पंचायत क्षेत्र में भवन अनुमति (नक्शा पास) के लिए आवेदन कैसे करें?',
    category: 'Permits & Approvals',
    icon: '✅',
  },
  {
    id: 'sq-6',
    textEn: 'What compensation am I entitled to if my land is acquired by the government?',
    textHi: 'सरकार द्वारा भूमि अधिग्रहण पर मुझे कितना मुआवजा मिलेगा?',
    category: 'Land Acquisition',
    icon: '⚖️',
  },
]

// ── Regulation categories ──────────────────────────────────────

export const REGULATION_CATEGORIES: RegulationCategory[] = [
  {
    id: 'rc-1',
    titleEn: 'Building Regulations',
    titleHi: 'भवन विनियम',
    descriptionEn: 'FAR, height limits, setbacks, construction standards for all building types.',
    descriptionHi: 'सभी प्रकार के भवनों के लिए FAR, ऊंचाई सीमा, सेटबैक और निर्माण मानक।',
    topicCount: 24,
    icon: '🏛️',
    color: 'var(--clr-brand-700)',
    colorBg: 'var(--clr-brand-50)',
  },
  {
    id: 'rc-2',
    titleEn: 'Land Classification',
    titleHi: 'भूमि वर्गीकरण',
    descriptionEn: 'Khasra categories, Nistar, forest, revenue, and special land types.',
    descriptionHi: 'खसरा श्रेणियां, निस्तार, वन, राजस्व और विशेष भूमि प्रकार।',
    topicCount: 18,
    icon: '🗺️',
    color: 'var(--clr-accent-500)',
    colorBg: 'var(--clr-accent-50)',
  },
  {
    id: 'rc-3',
    titleEn: 'Land Conversion',
    titleHi: 'भूमि रूपान्तरण',
    descriptionEn: 'Process and fees for changing land use from agricultural to residential, commercial.',
    descriptionHi: 'कृषि से आवासीय, वाणिज्यिक उपयोग में परिवर्तन की प्रक्रिया और शुल्क।',
    topicCount: 12,
    icon: '🔄',
    color: '#1d4ed8',
    colorBg: '#eff6ff',
  },
  {
    id: 'rc-4',
    titleEn: 'Permits & Approvals',
    titleHi: 'अनुमति और अनुमोदन',
    descriptionEn: 'Naksha pass, occupancy certificate, and clearances for construction projects.',
    descriptionHi: 'नक्शा पास, अधिभोग प्रमाण पत्र और निर्माण परियोजनाओं की मंजूरी।',
    topicCount: 31,
    icon: '📋',
    color: '#15803d',
    colorBg: '#f0fdf4',
  },
  {
    id: 'rc-5',
    titleEn: 'Land Acquisition',
    titleHi: 'भूमि अधिग्रहण',
    descriptionEn: 'Government acquisition procedures, compensation rights, and appeals.',
    descriptionHi: 'सरकारी अधिग्रहण प्रक्रिया, मुआवजे के अधिकार और अपील।',
    topicCount: 9,
    icon: '⚖️',
    color: '#b45309',
    colorBg: '#fffbeb',
  },
  {
    id: 'rc-6',
    titleEn: 'Water & Drainage',
    titleHi: 'जल और जल निकासी',
    descriptionEn: 'Well setbacks, drainage easements, flood zones, and irrigation rules.',
    descriptionHi: 'कुएं की दूरी, जल निकासी आसानी, बाढ़ क्षेत्र और सिंचाई नियम।',
    topicCount: 15,
    icon: '💧',
    color: '#0369a1',
    colorBg: '#f0f9ff',
  },
]

// ── Mock Q&A answers ──────────────────────────────────────────

export const MOCK_ANSWERS: Record<string, QAAnswer> = {
  'sq-1': {
    id: 'ans-sq-1',
    question: 'What is the minimum setback required from an agricultural land boundary?',
    questionLang: 'en',
    answerText:
      'Under the Madhya Pradesh Bhumi Vikas Niyam 2012, a minimum setback of 3 metres is required from any agricultural land boundary for all permanent constructions. This increases to 6 metres when the construction abuts a classified road, and to 4.5 metres along irrigation channels. Temporary agricultural structures such as open sheds or pump houses may be exempted with written permission from the Sub-Divisional Officer.',
    answerTextHi:
      'मध्यप्रदेश भूमि विकास नियम 2012 के अनुसार, सभी स्थायी निर्माणों के लिए कृषि भूमि की सीमा से न्यूनतम 3 मीटर की दूरी अनिवार्य है। जब निर्माण किसी वर्गीकृत सड़क से लगा हो तो यह 6 मीटर हो जाती है, और सिंचाई नहरों के किनारे 4.5 मीटर। खुले शेड या पंप हाउस जैसी अस्थायी कृषि संरचनाओं को उपखंड अधिकारी की लिखित अनुमति से छूट मिल सकती है।',
    evidenceLevel: 'verified',
    legalSummary: 'Min. 3m setback from agri. boundary; 6m from roads; 4.5m from canals',
    disclaimer:
      'This is illustrative mock data for UI demonstration only. Verify with the actual MP Bhumi Vikas Niyam text and your local SDO before making decisions.',
    categories: ['Setbacks & Boundaries', 'Building Regulations'],
    evidence: [
      {
        id: 'ev-1',
        documentTitle: '[DEMO] MP Bhumi Vikas Niyam 2012',
        clauseRef: 'Rule 14, Sub-rule (3)',
        ruleNumber: 'Rule 14(3)',
        documentType: 'rule',
        year: 2012,
        pdfPage: 47,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "No permanent construction shall be erected within three metres of any agricultural land boundary unless expressly permitted by the Sub-Divisional Officer in writing. Where such land abuts a district or state highway, the minimum setback shall be six metres measured from the edge of the carriage-way."',
        textLanguage: 'en',
        relevanceScore: 0.96,
      },
      {
        id: 'ev-2',
        documentTitle: '[DEMO] MP Irrigation Act 1931 — Amended Rules',
        clauseRef: 'Section 27, Clause (b)',
        ruleNumber: 'S.27(b)',
        documentType: 'act',
        year: 1931,
        pdfPage: 112,
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "कोई भी स्थायी संरचना सिंचाई नहर की सीमा से 4.5 मीटर से कम दूरी पर नहीं बनाई जाएगी।"',
        textLanguage: 'hi',
        relevanceScore: 0.81,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  'sq-3': {
    id: 'ans-sq-3',
    question: 'What documents are required to convert agricultural land to residential use?',
    questionLang: 'en',
    answerText:
      'To convert agricultural land (diversion) to residential use in Madhya Pradesh, you must apply to the Collector under Section 165 of the MP Land Revenue Code 1959. The standard document checklist includes: (1) Application on prescribed Form "A", (2) Certified copy of Khasra / Khatauni (B-1), (3) Site map and layout plan (four copies), (4) Aadhaar card / identity proof, (5) NOC from Gram Panchayat (rural) or Town & Country Planning (urban), (6) Proof of purpose and proposed use, (7) Payment receipt of diversion premium.',
    evidenceLevel: 'partial',
    legalSummary: 'Apply to Collector under S.165 MPLRC 1959; 7 core documents required',
    disclaimer:
      'DEMO DATA ONLY — document requirements may vary by district, land size, and proposed use. Always confirm with the local Tehsildar or Collector\'s office before filing.',
    categories: ['Land Conversion', 'Permits & Approvals'],
    evidence: [
      {
        id: 'ev-3',
        documentTitle: '[DEMO] MP Land Revenue Code 1959',
        clauseRef: 'Section 165',
        ruleNumber: 'S.165',
        documentType: 'act',
        year: 1959,
        pdfPage: 203,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "Any holder of land who wishes to divert such land for a purpose other than agriculture shall apply to the Collector in the prescribed form along with the prescribed fee and documents as specified in Schedule IV."',
        textLanguage: 'en',
        relevanceScore: 0.89,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  'sq-5': {
    id: 'ans-sq-5',
    question: 'How do I apply for a building permit (naksha pass) in a gram panchayat area?',
    questionLang: 'en',
    answerText:
      'In a Gram Panchayat area, building permits (commonly called "Naksha Pass") are governed by the Madhya Pradesh Panchayat Raj Avam Gram Swaraj Adhiniyam 1993 and the MP Gram Panchayat (Building Permit) Rules. Submit your application to the Gram Panchayat Sachiv with: a site plan, structural drawings, land ownership documents, and the applicable fees. The Gram Panchayat must respond within 30 days; non-response is treated as deemed approval.',
    evidenceLevel: 'verified',
    legalSummary: 'Submit to Gram Panchayat Sachiv; 30-day response window; deemed approval if no reply',
    disclaimer:
      'DEMO DATA ONLY — procedures and timelines vary. Contact your Gram Panchayat directly.',
    categories: ['Permits & Approvals', 'Building Regulations'],
    evidence: [
      {
        id: 'ev-4',
        documentTitle: '[DEMO] MP Panchayat Raj Avam Gram Swaraj Adhiniyam 1993',
        clauseRef: 'Section 58, Sub-section (4)',
        ruleNumber: 'S.58(4)',
        documentType: 'act',
        year: 1993,
        pdfPage: 78,
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "Every Gram Panchayat shall dispose of applications for building permits within a period of thirty days from the date of receipt. Failure to communicate the decision within this period shall be construed as deemed sanction."',
        textLanguage: 'en',
        relevanceScore: 0.93,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  'sq-2': {
    id: 'ans-sq-2',
    question: 'Can I build a permanent structure on land classified as "Nistar" land?',
    questionLang: 'en',
    answerText:
      'Under Section 237 of the Madhya Pradesh Land Revenue Code 1959, Nistar land is reserved for common village purposes (grazing, threshing, timber, pathways) and private permanent construction is strictly restricted. However, limited community or public-utility structures may be sanctioned by the Collector after formal reclassification through Gram Sabha resolution. Individual private construction without diversion is liable to summary eviction under Section 248.',
    answerTextHi:
      'मध्यप्रदेश भू-राजस्व संहिता 1959 की धारा 237 के अंतर्गत निस्तार भूमि ग्राम के सामूहिक उपयोग (चराई, खलिहान, निस्तार) हेतु आरक्षित होती है और इस पर निजी स्थायी निर्माण वर्जित है। ग्राम सभा प्रस्ताव व कलेक्टर की अनुमति से केवल सार्वजनिक उपयोगिता निर्माण संभव है। अनधिकृत निर्माण पर धारा 248 के तहत बेदखली की जा सकती है।',
    evidenceLevel: 'needs-verification',
    legalSummary: 'Restricted community land under S.237 MPLRC; requires Gram Sabha + Collector sanction; verification required for specific parcel rights',
    disclaimer:
      'EVIDENCE LEVEL: REQUIRES VERIFICATION — While general restriction exists under S.237, local Nistar Patrak records must be inspected at the Tehsil office to determine specific rights assigned to this parcel.',
    categories: ['Land Classification', 'Building Regulations'],
    evidence: [
      {
        id: 'ev-nistar-1',
        documentTitle: '[DEMO] MP Land Revenue Code 1959',
        clauseRef: 'Section 237 (Collector to set apart land for exercise of Nistar rights)',
        ruleNumber: 'S.237(1)(b)',
        documentType: 'act',
        year: 1959,
        pdfPage: 284,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "Subject to the rules made under this Code, the Collector may set apart unoccupied land for the following purposes: (a) for timber or fuel reserve; (b) for pastures, grass reserves or fodder reserves; (c) for burial grounds and cremation grounds... and land so set apart shall not be diverted without Collector approval."',
        textLanguage: 'en',
        relevanceScore: 0.88,
      },
      {
        id: 'ev-nistar-2',
        documentTitle: '[DEMO] MP Land Revenue Code 1959',
        clauseRef: 'Section 248 (Penalty for unauthorisedly taking possession of land)',
        ruleNumber: 'S.248',
        documentType: 'act',
        year: 1959,
        pdfPage: 295,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "Any person who unauthorizedly encroaches upon or constructs over unoccupied land set apart for special purposes shall be liable to summary eviction by the Tehsildar."',
        textLanguage: 'en',
        relevanceScore: 0.76,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  'sq-4': {
    id: 'ans-sq-4',
    question: 'What is the maximum floor area ratio (FAR) for residential buildings in rural MP?',
    questionLang: 'en',
    answerText:
      'Under Rule 44 read with Table 7 of the Madhya Pradesh Bhumi Vikas Niyam 2012, residential plots in Gram Panchayat development planning zones have a baseline Floor Area Ratio (FAR) between 1.25 and 1.50, subject to abutting road width (minimum 9m road required for 1.5 FAR). Additional FAR up to 0.25 may be purchased via compounding / premium charges if approved by the planning authority.',
    answerTextHi:
      'मध्यप्रदेश भूमि विकास नियम 2012 के नियम 44 सहपठित सारणी 7 के अनुसार, ग्रामीण योजना क्षेत्रों में आवासीय भूखंडों के लिए मूल FAR 1.25 से 1.50 तक निर्धारित है, जो सामने की सड़क की चौड़ाई (1.5 FAR हेतु न्यूनतम 9 मीटर मार्ग) पर निर्भर करता है।',
    evidenceLevel: 'partial',
    legalSummary: 'Base FAR 1.25–1.50 depending on road width; Table 7 MP Bhumi Vikas Niyam 2012',
    disclaimer:
      'DEMO DATA ONLY — FAR limits vary based on whether the village falls inside an Investment Region or Master Plan planning fringe.',
    categories: ['Building Regulations'],
    evidence: [
      {
        id: 'ev-far-1',
        documentTitle: '[DEMO] MP Bhumi Vikas Niyam 2012',
        clauseRef: 'Rule 44, Table 7 (Floor Area Ratio for Residential Use)',
        ruleNumber: 'Rule 44 (Table 7)',
        documentType: 'rule',
        year: 2012,
        pdfPage: 63,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "The maximum permissible Floor Area Ratio (FAR) for residential plots having road width of not less than 9.0 metres shall be 1.50. For roads between 6.0m and 9.0m, the permissible FAR shall not exceed 1.25."',
        textLanguage: 'en',
        relevanceScore: 0.91,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  'sq-6': {
    id: 'ans-sq-6',
    question: 'What compensation am I entitled to if my land is acquired by the government?',
    questionLang: 'en',
    answerText:
      'Compensation for compulsory acquisition in Madhya Pradesh is computed in accordance with the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (RFCTLARR) Act 2013 and MP State Rules. In rural areas, the base market rate determined by the Collector is multiplied by a rural factor (typically 1.5x to 2.0x), plus 100% Solatium (equal to 100% of the computed land value) and 12% annual interest from notification date.',
    answerTextHi:
      'भूमि अधिग्रहण अधिनियम (RFCTLARR) 2013 एवं म.प्र. नियमों के तहत ग्रामीण क्षेत्रों में बाजार मूल्य पर 1.5x से 2.0x गुणक लागू होता है, साथ ही 100% सांत्वना राशि (Solatium) तथा अधिसूचना की तिथि से 12% वार्षिक ब्याज देय होता है।',
    evidenceLevel: 'verified',
    legalSummary: 'Market value x rural multiplier (up to 2.0) + 100% Solatium + 12% annual interest',
    disclaimer:
      'DEMO DATA ONLY — Actual awards are passed by the Land Acquisition Officer (SDO/Collector). Inspect specific preliminary notification under Section 11.',
    categories: ['Land Acquisition'],
    evidence: [
      {
        id: 'ev-acq-1',
        documentTitle: '[DEMO] RFCTLARR Act 2013 & MP Rules 2015',
        clauseRef: 'Section 26 to 30 (Determination of Market Value and Solatium)',
        ruleNumber: 'S.26-30 / First Schedule',
        documentType: 'act',
        year: 2013,
        pdfPage: 18,
        officialUrl: 'https://mpbhulekh.gov.in',
        originalText:
          '[SAMPLE TEXT — NOT VERIFIED] "The Collector shall determine the market value of the land with a multiplying factor for rural areas, and add an amount calculated at the rate of twelve per cent per annum. In addition, the Collector shall impose a solatium amount equivalent to one hundred per cent over the total compensation."',
        textLanguage: 'en',
        relevanceScore: 0.98,
      },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },

  '__insufficient': {
    id: 'ans-insufficient',
    question: '',
    questionLang: 'en',
    answerText: '',
    evidenceLevel: 'insufficient',
    evidence: [],
    categories: [],
    disclaimer:
      'The question could not be answered from the currently indexed Madhya Pradesh land & building regulatory corpus. Please consult the local Tehsildar, Sub-Divisional Officer (Revenue), or a qualified legal professional.',
    generatedAt: new Date().toISOString(),
    isMockData: true,
  },
}

// ── Mock query history ─────────────────────────────────────────

export const MOCK_QUERY_HISTORY: QueryHistoryEntry[] = [
  {
    id: 'qh-1',
    question: 'What is the minimum setback required from an agricultural land boundary?',
    questionLang: 'en',
    evidenceLevel: 'verified',
    askedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    categories: ['Setbacks & Boundaries'],
  },
  {
    id: 'qh-2',
    question: 'Can I build a permanent structure on land classified as "Nistar" land?',
    questionLang: 'en',
    evidenceLevel: 'partial',
    askedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    categories: ['Land Classification'],
  },
  {
    id: 'qh-3',
    question: 'What documents are required to convert agricultural land to residential use?',
    questionLang: 'en',
    evidenceLevel: 'verified',
    askedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    categories: ['Land Conversion'],
  },
  {
    id: 'qh-4',
    question: 'भवन अनुमति के लिए आवेदन कैसे करें?',
    questionLang: 'hi',
    evidenceLevel: 'needs-verification',
    askedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    categories: ['Permits & Approvals'],
  },
]
