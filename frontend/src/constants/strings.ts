/**
 * UI string constants — English + Hindi.
 * All user-visible strings live here. No hardcoded strings in components.
 */

export type Lang = 'en' | 'hi'

export const STRINGS = {
  en: {
    // Nav
    home:              'Home',
    dashboard:         'Dashboard',
    askQuestion:       'Ask a Question',
    exploreRegulations:'Explore Regulations',
    queryHistory:      'Query History',
    landRecords:       'Land Records',
    schemeEligibility: 'Scheme Eligibility',
    applyScheme:       'Apply',
    help:              'Help',
    language:          'EN',
    themeSwitchLight:  'Switch to Light Mode',
    themeSwitchDark:   'Switch to Dark Mode',

    // Hero
    heroEyebrow:      'Bhopal Impact Lab 2026',
    heroCta:          'Ask Regulation Assistant',
    heroSecondaryCta: 'Explore Regulations',
    heroBadge:        'Built for Madhya Pradesh Civic-Tech',
    heroDesc:         'Transparent tools for land records, building regulations, and statutory compliance in Madhya Pradesh — with verified legal citations.',

    // Features / Services
    featureTitle:     'What can we help you with?',
    featureSubtitle:  'Three core civic services, one platform — accessible to every farmer, citizen, and municipal officer in Madhya Pradesh.',
    f1Title:          'Regulatory Q&A Assistant',
    f1Desc:           'Ask building bye-laws and land rules in plain language with direct clause citations.',
    f1Cta:            'Ask a Question',
    f2Title:          'Explore Regulations',
    f2Desc:           'Browse setbacks, FAR, land diversion, nistar rights, and permit procedures.',
    f2Cta:            'Explore Regulations',
    f3Title:          'Land Records (MP Bhulekh)',
    f3Desc:           'Look up Khasra, Khatauni, and ownership details directly from MP Bhulekh.',
    f3Cta:            'Search Records',
    f4Title:          'Scheme Eligibility',
    f4Desc:           'Find agricultural schemes and subsidies you qualify for in MP.',
    f4Cta:            'Check Eligibility',

    // Stats
    stat1Num: '52+',  stat1Lbl: 'MP Districts Covered',
    stat2Num: '100%', stat2Lbl: 'Citation Grounded',
    stat3Num: '6+',   stat3Lbl: 'Regulatory Acts Indexed',
    stat4Num: '2',    stat4Lbl: 'Bilingual Support (EN/HI)',

    // Q&A Interface Strings
    qaTitle:               'Bhumi Vikas Sahayak — Regulatory Q&A',
    qaSubtitle:            'Ask questions about Madhya Pradesh land development, building bye-laws, and revenue rules. Every answer is backed by verifiable statutory clauses.',
    askInputPlaceholder:  'Ask in Hindi or English (e.g., What is the setback for agricultural land boundary?)',
    askButton:             'Search Regulations',
    searching:             'Searching Clauses…',
    suggestedTitle:        'Suggested Questions on MP Building & Land Rules',
    suggestedCategory:     'Popular Topics',

    // Evidence Levels
    evidenceVerified:          'Statutory Evidence Verified',
    evidenceVerifiedShort:     'Verified Clause',
    evidencePartial:           'Partial Statutory Coverage',
    evidencePartialShort:      'Partial Evidence',
    evidenceNeedsVerification: 'Requires Field Verification',
    evidenceNeedsVerificationShort: 'Verify on Field',
    evidenceInsufficient:      'Insufficient Regulatory Evidence',
    evidenceInsufficientShort: 'Insufficient Evidence',

    // Answer Card Details
    explanationLabel:    'Statutory Explanation',
    legalSummaryLabel:   'Key Legal Takeaway',
    ruleClausesLabel:    'Cited Rules & Clauses',
    sourceEvidenceTitle: 'Source Documents & Verbatim Evidence',
    showEvidence:        'Expand Supporting Evidence',
    hideEvidence:        'Collapse Evidence',
    originalTextLabel:   'Original Statutory Text Excerpt',
    pdfPageLabel:        'PDF Page',
    officialDocLink:     'Official Portal',
    documentTypeLabel:   'Document Type',
    copyAnswer:          'Copy Answer',
    copied:              'Copied to Clipboard!',
    newQuestion:         'Ask Another Question',
    relevanceScore:      'Match Relevance',

    // State Views
    emptyTitle:          'Welcoming Regulatory Assistant',
    emptyDesc:           'Designed for citizens, architects, and municipal staff. Ask questions in natural English or Hindi to receive explanations directly linked to MP statutory rules.',
    loadingTitle:        'Querying Madhya Pradesh Regulatory Corpus…',
    loadingDesc:         'Searching MP Bhumi Vikas Niyam 2012, MP Land Revenue Code 1959, and Panchayat Building Rules…',
    noResultsTitle:      'No Relevant Clauses Found',
    noResultsDesc:       'We could not locate specific regulatory clauses for this question. Try using standard keywords such as "setback", "FAR", "nistar", "diversion", or "building permit".',
    insufficientTitle:   'Insufficient Statutory Evidence in Corpus',
    insufficientDesc:    'The indexed regulatory corpus does not contain a definitive rule to answer this query with legal certainty. Please consult the local Tehsildar, Sub-Divisional Officer, or municipal town planner.',
    retryQuery:          'Try a Suggested Question',

    // Disclaimers & notices
    disclaimerLabel: 'Statutory Notice',
    mockDataNotice:  'DEMO DATA — Prototype for Bhopal Impact Lab 2026. Official verification required prior to construction or land filing.',
    verifiedCorpusNotice: 'AUTHENTIC STATUTORY DATA — Sourced from MP State Acts and Building Regulations. Verification recommended prior to filing.',

    // Query History & Explore
    historyTitle:        'Query History',
    historySubtitle:     'Inspect all questions asked during this session, complete with citation verification badges.',
    historyEmpty:        'No questions asked yet. Try one of the suggested questions above.',
    historyReask:        'Re-run Query',
    exploreTitle:        'Explore Madhya Pradesh Building Regulations',
    exploreSubtitle:     'Browse core regulatory domains governing rural, peri-urban, and municipal land development in MP.',
    filterRegulations:   'Filter regulations by keyword…',
    searchRulesPlaceholder: 'Search by rule number, clause, or text (e.g. Rule 14, Section 165, setback, FAR, निस्तार)…',
    allCategories:       'All Categories',
    allTopics:           'All Topics',
    allDocuments:        'All Acts & Documents',
    filterByCategory:    'Category',
    filterByTopic:       'Topic',
    filterByDocument:    'Legislation / Act',
    openRuleDetails:     'Inspect Rule & Verbatim Text',
    inspectEvidence:     'Inspect Source Evidence',
    openPdfPage:         'Open PDF Page',
    pdfPageAnchorSupported:   'Direct PDF page jump supported',
    pdfPageAnchorUnsupported: 'Direct page anchor unsupported by host server',
    matchingRulesCount:  'Matching Statutory Rules',
    viewFullRuleInRegistry: 'Inspect Full Rule in Registry',
    quickRuleJump:       'Quick Rule Jump',
    viewQuestions:       'Ask about this topic',
    topicsCount:         'Rules & Clauses',

    // Footer
    footerTagline: 'Land & Building Regulatory Assistant',
    footerRights:  'Open Source · Bhopal Impact Lab 2026',
    privacyPolicy: 'Privacy & Disclaimers',
    accessibility: 'Accessibility (WCAG 2.1 AA)',

    // Common
    loading:  'Loading…',
    error:    'Error Encountered',
    retry:    'Try Again',
    close:    'Close',
    cancel:   'Cancel',
    confirm:  'Confirm',
    search:   'Search',
    clear:    'Clear',
    backHome: 'Back to Dashboard',
    notFoundTitle: 'Page not found',
    notFoundDesc:  'The requested regulatory page could not be located.',
  },
  hi: {
    // Nav
    home:              'होम',
    dashboard:         'डैशबोर्ड',
    askQuestion:       'सवाल पूछें',
    exploreRegulations:'विनियम देखें',
    queryHistory:      'पिछली खोजें',
    landRecords:       'भूमि अभिलेख',
    schemeEligibility: 'योजना पात्रता',
    applyScheme:       'आवेदन करें',
    help:              'सहायता',
    language:          'हि',
    themeSwitchLight:  'लाइट मोड में बदलें',
    themeSwitchDark:   'डार्क मोड में बदलें',

    // Hero
    heroEyebrow:      'भोपाल इम्पैक्ट लैब 2026',
    heroCta:          'विनियम सहायक से पूछें',
    heroSecondaryCta: 'विनियम संग्रह देखें',
    heroBadge:        'मध्य प्रदेश सिविक-टेक हेतु निर्मित',
    heroDesc:         'मध्य प्रदेश में भूमि अभिलेख, भवन निर्माण विनियम और वैधानिक अनुपालन के लिए पारदर्शी उपकरण — सत्यापित कानूनी उद्धरणों के साथ।',

    // Features / Services
    featureTitle:     'हम आपकी किस प्रकार सहायता कर सकते हैं?',
    featureSubtitle:  'तीन मुख्य नागरिक सेवाएं, एक साझा मंच — मध्य प्रदेश के प्रत्येक किसान, नागरिक और नगर पालिका अधिकारी के लिए।',
    f1Title:          'नियामक प्रश्नोत्तरी सहायक',
    f1Desc:           'सरल भाषा में भवन उप-नियम और भूमि नियम पूछें, सीधे धारावार उद्धरणों के साथ।',
    f1Cta:            'प्रश्न पूछें',
    f2Title:          'विनियम संग्रह देखें',
    f2Desc:           'सेटबैक, FAR, भूमि डायवर्सन, निस्तार अधिकार और अनुमति प्रक्रियाओं को ब्राउज़ करें।',
    f2Cta:            'विनियम देखें',
    f3Title:          'भूमि अभिलेख (MP भूलेख)',
    f3Desc:           'सीधे MP भूलेख पोर्टल से खसरा, खतौनी और स्वामित्व विवरण देखें।',
    f3Cta:            'अभिलेख खोजें',
    f4Title:          'योजना पात्रता',
    f4Desc:           'मध्य प्रदेश में कृषि योजनाओं और अनुदानों की पात्रता जांचें।',
    f4Cta:            'पात्रता जांचें',

    // Stats
    stat1Num: '52+',  stat1Lbl: 'म.प्र. के जिले शामिल',
    stat2Num: '100%', stat2Lbl: 'सत्यापित उद्धरण',
    stat3Num: '6+',   stat3Lbl: 'संबद्ध विनियामक अधिनियम',
    stat4Num: '2',    stat4Lbl: 'द्विभाषी सहायता (हिं/EN)',

    // Q&A Interface Strings
    qaTitle:               'भूमि विकास सहायक — विनियामक प्रश्नोत्तरी',
    qaSubtitle:            'मध्य प्रदेश भूमि विकास, भवन उप-विधियों और राजस्व नियमों पर प्रश्न पूछें। प्रत्येक उत्तर सत्यापित वैधानिक धाराओं पर आधारित है।',
    askInputPlaceholder:  'हिंदी या अंग्रेजी में पूछें (उदा., कृषि भूमि सीमा से न्यूनतम दूरी क्या होनी चाहिए?)',
    askButton:             'विनियम खोजें',
    searching:             'धाराएं खोजी जा रही हैं…',
    suggestedTitle:        'म.प्र. भवन एवं भूमि नियमों पर सुझाये गए प्रश्न',
    suggestedCategory:     'प्रमुख विषय',

    // Evidence Levels
    evidenceVerified:          'वैधानिक साक्ष्य सत्यापित',
    evidenceVerifiedShort:     'सत्यापित धारा',
    evidencePartial:           'आंशिक वैधानिक साक्ष्य',
    evidencePartialShort:      'आंशिक साक्ष्य',
    evidenceNeedsVerification: 'क्षेत्रीय सत्यापन आवश्यक',
    evidenceNeedsVerificationShort: 'सत्यापन आवश्यक',
    evidenceInsufficient:      'अपर्याप्त विनियामक साक्ष्य',
    evidenceInsufficientShort: 'अपर्याप्त साक्ष्य',

    // Answer Card Details
    explanationLabel:    'वैधानिक स्पष्टीकरण',
    legalSummaryLabel:   'मुख्य कानूनी निष्कर्ष',
    ruleClausesLabel:    'उद्धृत नियम एवं धाराएं',
    sourceEvidenceTitle: 'मूल स्रोत दस्तावेज एवं शब्दशः साक्ष्य',
    showEvidence:        'मूल समर्थक साक्ष्य देखें',
    hideEvidence:        'साक्ष्य छुपाएं',
    originalTextLabel:   'मूल वैधानिक पाठ का उद्धरण',
    pdfPageLabel:        'पीडीएफ पृष्ठ',
    officialDocLink:     'आधिकारिक पोर्टल',
    documentTypeLabel:   'दस्तावेज प्रकार',
    copyAnswer:          'उत्तर कॉपी करें',
    copied:              'क्लिपबोर्ड पर कॉपी किया गया!',
    newQuestion:         'नया प्रश्न पूछें',
    relevanceScore:      'प्रासंगिकता स्कोर',

    // State Views
    emptyTitle:          'स्वागत है — विनियामक सहायक',
    emptyDesc:           'नागरिकों, वास्तुकारों एवं नगर पालिका कर्मियों के लिए सुगम मंच। म.प्र. वैधानिक नियमों के सीधे उद्धरणों सहित उत्तर पाने के लिए ऊपर प्रश्न दर्ज करें।',
    loadingTitle:        'मध्य प्रदेश विनियामक संकलन की खोज जारी है…',
    loadingDesc:         'म.प्र. भूमि विकास नियम 2012, भू-राजस्व संहिता 1959 एवं पंचायत भवन नियमों से मिलान किया जा रहा है…',
    noResultsTitle:      'कोई प्रासंगिक धारा नहीं मिली',
    noResultsDesc:       'इस प्रश्न से संबंधित विशिष्ट विनियामक धाराएं नहीं मिलीं। कृपया मुख्य कानूनी शब्दों (उदा. "सेटबैक", "FAR", "निस्तार", "डायवर्सन", "नक्शा पास") के साथ पुनः प्रयास करें।',
    insufficientTitle:   'संकलन में अपर्याप्त वैधानिक साक्ष्य',
    insufficientDesc:    'सटीक कानूनी उत्तर देने हेतु संकलित नियमों में पूर्ण धाराएं उपलब्ध नहीं हैं। कृपया स्थानीय तहसीलदार, अनुविभागीय अधिकारी (राजस्व) या नगर नियोजक से संपर्क करें।',
    retryQuery:          'सुझाया गया प्रश्न चुनें',

    // Disclaimers & notices
    disclaimerLabel: 'वैधानिक सूचना',
    mockDataNotice:  'डेमो डेटा — भोपाल इम्पैक्ट लैब 2026 के लिए प्रोटोटाइप। निर्माण अथवा भूमि आवेदन से पूर्व आधिकारिक सत्यापन आवश्यक है।',
    verifiedCorpusNotice: 'प्रामाणिक वैधानिक डेटा — म.प्र. राज्य अधिनियमों एवं भूमि विकास नियमों से संकलित। आवेदन से पूर्व सक्षम प्राधिकारी से सत्यापन अनुशंसित।',

    // Query History & Explore
    historyTitle:        'पिछली खोजें',
    historySubtitle:     'इस सत्र में पूछे गए सभी प्रश्नों का साक्ष्य सत्यापन स्थिति सहित विवरण।',
    historyEmpty:        'अभी तक कोई प्रश्न नहीं पूछा गया है। ऊपर दिए गए सुझाए गए प्रश्नों में से चुनें।',
    historyReask:        'पुनः खोजें',
    exploreTitle:        'मध्य प्रदेश भवन एवं भूमि विनियम संग्रह',
    exploreSubtitle:     'म.प्र. में ग्रामीण, उपनगरीय एवं नगरीय भूमि विकास को नियंत्रित करने वाले प्रमुख विनियामक प्रक्षेत्र।',
    filterRegulations:   'कीवर्ड द्वारा विनियम खोजें…',
    searchRulesPlaceholder: 'नियम संख्या, धारा या पाठ द्वारा खोजें (उदा. Rule 14, धारा 165, सेटबैक, FAR, निस्तार)…',
    allCategories:       'सभी श्रेणियां',
    allTopics:           'सभी विषय',
    allDocuments:        'सभी अधिनियम व दस्तावेज',
    filterByCategory:    'श्रेणी',
    filterByTopic:       'विषय',
    filterByDocument:    'कानून / अधिनियम',
    openRuleDetails:     'नियम एवं मूल वैधानिक पाठ देखें',
    inspectEvidence:     'मूल स्रोत साक्ष्य देखें',
    openPdfPage:         'पीडीएफ पृष्ठ खोलें',
    pdfPageAnchorSupported:   'सीधा पीडीएफ पृष्ठ जंप समर्थित',
    pdfPageAnchorUnsupported: 'होस्ट सर्वर द्वारा सीधा पृष्ठ लिंक असमर्थित',
    matchingRulesCount:  'संबद्ध वैधानिक नियम',
    viewFullRuleInRegistry: 'रजिस्ट्री में पूर्ण नियम देखें',
    quickRuleJump:       'त्वरित नियम चयन',
    viewQuestions:       'इस विषय पर पूछें',
    topicsCount:         'नियम व धाराएं',

    // Footer
    footerTagline: 'भूमि एवं भवन विनियामक सहायक',
    footerRights:  'ओपन सोर्स · भोपाल इम्पैक्ट लैब 2026',
    privacyPolicy: 'गोपनीयता एवं अस्वीकरण',
    accessibility: 'पहुंच-योग्यता (WCAG 2.1 AA)',

    // Common
    loading:  'लोड हो रहा है…',
    error:    'त्रुटि उत्पन्न हुई',
    retry:    'पुनः प्रयास करें',
    close:    'बंद करें',
    cancel:   'रद्द करें',
    confirm:  'पुष्टि करें',
    search:   'खोजें',
    clear:    'साफ़ करें',
    backHome: 'डैशबोर्ड पर वापस जाएं',
    notFoundTitle: 'पृष्ठ नहीं मिला',
    notFoundDesc:  'अनुरोधित विनियामक पृष्ठ नहीं मिला।',
  },
} as const

export type StringKey = keyof typeof STRINGS.en
