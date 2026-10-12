/**
 * retrievalEngine — Deterministic statutory rule retrieval and relevance scoring engine
 * for Bhumi Vikas Sahayak.
 *
 * Implements:
 * 1. Multi-lingual tokenization & normalization (English & Hindi Devanagari script).
 * 2. Synonym expansion for Madhya Pradesh land, revenue, and municipal terminology.
 * 3. Weighted multi-field scoring (BM25-style frequency + field boosts).
 * 4. Distinct scoring tiers:
 *    - Score >= 0.70: 'verified' (Direct statutory clause match)
 *    - Score >= 0.40: 'partial' (Related statutory context)
 *    - Score >= 0.20: 'needs-verification' (Tenuous topic correlation)
 *    - Score < 0.20:  'insufficient' (Honest rejection, insufficient statutory certainty)
 * 5. Preservation of numerical values, units, conditions, and table context.
 * 6. Deterministic answer composition from authentic statutory text.
 */

import type { StatutoryRule, SourceEvidence, QAAnswer, EvidenceLevel } from '../types'
import { STATUTORY_RULES } from '../assets/data/regulationsData'

/**
 * Common English and Hindi stop words to filter out noise
 */
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'which', 'who', 'when', 'where', 'how', 'can', 'i',
  'do', 'does', 'my', 'me', 'we', 'our', 'you', 'your', 'about', 'any', 'under',
  'required', 'permissible', 'limit', 'rule', 'section', 'act', 'madhya', 'pradesh',
  // Generic action & location terms that should not trigger false positives
  'build', 'building', 'buildings', 'construct', 'construction', 'structure', 'structures',
  'make', 'city', 'bhopal', 'please', 'tell', 'give', 'want', 'need', 'apply',
  // Hindi
  'का', 'की', 'के', 'में', 'से', 'पर', 'को', 'है', 'हैं', 'था', 'थे', 'थी',
  'और', 'या', 'तो', 'भी', 'ही', 'हो', 'होता', 'होती', 'होते', 'क्या', 'कैसे',
  'कितना', 'कितनी', 'कितने', 'कहाँ', 'कब', 'कौन', 'सकता', 'सकती', 'सकते',
  'लिए', 'द्वारा', 'नियम', 'धारा', 'अधिनियम', 'मध्य', 'प्रदेश', 'मध्यप्रदेश',
  // Hindi generic terms & pronouns
  'बनाना', 'निर्माण', 'भवन', 'मकान', 'भोपाल', 'शहर', 'कृपया', 'बताएं', 'चाहिए',
  'मुझे', 'मेरा', 'मेरी', 'मेरे', 'हम', 'हमें', 'हमारा', 'हमारी', 'हमारे',
  'आप', 'आपका', 'आपकी', 'आपके', 'मिलेगा', 'मिलेगी', 'मिलेंगे'
])

/**
 * Domain-specific bilingual synonym & alternate phrasing map
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Setbacks & Boundaries
  setback: ['setback', 'boundary', 'distance', 'front', 'rear', 'carriage-way', 'offset', 'margin', 'दूरी', 'सीमा', 'सेटबैक'],
  boundary: ['boundary', 'setback', 'distance', 'abutting', 'adjacent', 'margin', 'सीमा', 'दूरी', 'हद'],
  distance: ['distance', 'setback', 'boundary', 'metres', 'दूरी', 'मीटर', 'सीमा'],
  highway: ['highway', 'road', 'classified', 'carriage-way', 'मार्ग', 'राजमार्ग', 'सड़क'],

  // FAR & Height
  far: ['far', 'floor area ratio', 'fsi', 'purchasable', 'compounding', 'एफएआर', 'क्षेत्रफल', 'अनुपात'],
  fsi: ['far', 'floor area ratio', 'fsi', 'एफएआर'],
  height: ['height', 'metres', 'floor', 'ऊंचाई', 'मंजिल'],

  // Nistar & Commons
  nistar: ['nistar', 'charnoi', 'pasture', 'grazing', 'khalihan', 'threshing', 'unoccupied', 'village', 'commons', 'निस्तार', 'चरनोई', 'खलिहान', 'चरागाह'],
  charnoi: ['charnoi', 'nistar', 'pasture', 'grazing', 'fodder', 'चरनोई', 'घास', 'चारा'],
  encroachment: ['encroachment', 'unauthorised', 'eviction', 'penalty', 'fine', 'बेदखली', 'कब्जा', 'अर्थदंड', 'अनधिकृत'],

  // Land Diversion & Conversion
  diversion: ['diversion', 'convert', 'conversion', 'bhumiswami', 'form a', 'residential', 'commercial', 'premium', 'डायवर्सन', 'व्यपवर्तन', 'रूपान्तरण', 'परिवर्तित'],
  conversion: ['diversion', 'convert', 'conversion', 'bhumiswami', 'form a', 'व्यपवर्तन', 'डायवर्सन', 'परिवर्तन'],
  convert: ['diversion', 'convert', 'conversion', 'form a', 'व्यपवर्तन', 'डायवर्सन'],
  tribal: ['tribal', 'scheduled tribe', 'adivasi', 'collector', 'sanction', 'जनजाति', 'आदिवासी', 'कलेक्टर'],
  mplrc: ['mplrc', 'revenue code', 'भू-राजस्व संहिता', 'भू राजस्व'],

  // Rainwater harvesting
  rainwater: ['rain water', 'rainwater', 'harvesting', 'recharge pit', 'ground-water', 'पर्यावरण', 'वर्षा', 'जल', 'संचयन', 'रीचार्ज'],
  harvesting: ['harvesting', 'rainwater', 'rain water', 'recharge', 'संचयन', 'वर्षा जल'],

  // Naksha Pass & Panchayat
  naksha: ['naksha', 'permit', 'building permit', 'panchayat', 'deemed', 'sanction', 'sachiv', '30 days', 'नक्शा', 'अनुमति', 'स्वीकृति', 'पंचायत'],
  permit: ['permit', 'naksha', 'permission', 'sanction', 'deemed', 'अनुमति', 'मंजूरी', 'स्वीकृति'],
  panchayat: ['panchayat', 'gram panchayat', 'sachiv', 'deemed sanction', 'पंचायत', 'ग्राम पंचायत'],

  // Compensation & Acquisition
  compensation: ['compensation', 'acquisition', 'acquired', 'solatium', 'multiplier', 'market value', 'मुआवजा', 'अधिग्रहण', 'सांत्वना', 'सोलेशियम'],
  acquisition: ['acquisition', 'compensation', 'solatium', 'acquired', 'rfctlarr', 'अधिग्रहण', 'मुआवजा'],
  solatium: ['solatium', 'compensation', 'multiplier', 'सांत्वना', 'सोलेशियम'],
  rfctlarr: ['rfctlarr', 'land acquisition', 'compensation', 'solatium', 'अधिग्रहण', 'मुआवजा'],

  // Irrigation & Canals
  canal: ['canal', 'irrigation', 'water resources', 'drainage', 'distributary', 'नहर', 'सिंचाई', 'जल संसाधन'],
  irrigation: ['irrigation', 'canal', 'drainage', 'water resources', 'सिंचाई', 'नहर'],
  drainage: ['drainage', 'canal', 'irrigation', 'water resources', 'distributary', 'जल निकासी', 'नाला'],
  buffer: ['buffer', 'water body', 'hfl', 'lake', 'river', 'tank', 'बफर', 'जल निकाय', 'बाढ़ स्तर', 'नदी', 'तालाब'],
  waterbody: ['water body', 'buffer', 'hfl', 'lake', 'river', 'flood', 'जल निकाय', 'झील', 'तालाब'],

  // Bilingual Hindi reverse keys (guarantees symmetrical Hindi-to-English retrieval)
  मुआवजा: ['मुआवजा', 'अधिग्रहण', 'compensation', 'acquisition', 'solatium', 'सांत्वना', 'सोलेशियम', 'multiplier'],
  अधिग्रहण: ['अधिग्रहण', 'मुआवजा', 'acquisition', 'compensation', 'solatium', 'rfctlarr'],
  सांत्वना: ['सांत्वना', 'सोलेशियम', 'solatium', 'मुआवजा'],
  सोलेशियम: ['सोलेशियम', 'सांत्वना', 'solatium', 'मुआवजा'],
  व्यपवर्तन: ['व्यपवर्तन', 'डायवर्सन', 'diversion', 'convert', 'conversion', 'bhumiswami', 'form a', 'परिवर्तित'],
  डायवर्सन: ['डायवर्सन', 'व्यपवर्तन', 'diversion', 'convert', 'conversion', 'परिवर्तित'],
  परिवर्तित: ['परिवर्तित', 'व्यपवर्तन', 'डायवर्सन', 'diversion', 'convert', 'conversion', 'residential'],
  निस्तार: ['निस्तार', 'चरनोई', 'nistar', 'charnoi', 'pasture', 'grazing', 'khalihan'],
  चरनोई: ['चरनोई', 'निस्तार', 'charnoi', 'nistar', 'pasture', 'grazing', 'fodder'],
  नक्शा: ['नक्शा', 'अनुमति', 'naksha', 'permit', 'building permit', 'panchayat'],
  पंचायत: ['पंचायत', 'ग्राम पंचायत', 'panchayat', 'gram panchayat', 'sachiv'],
  नहर: ['नहर', 'सिंचाई', 'canal', 'irrigation', 'water resources', 'drainage'],
  सिंचाई: ['सिंचाई', 'नहर', 'irrigation', 'canal', 'drainage', 'water resources'],
  सेटबैक: ['सेटबैक', 'दूरी', 'सीमा', 'setback', 'boundary', 'distance'],
  दूरी: ['दूरी', 'सेटबैक', 'सीमा', 'distance', 'setback', 'boundary', 'मीटर'],
  सीमा: ['सीमा', 'दूरी', 'सेटबैक', 'boundary', 'setback', 'distance'],
  एफएआर: ['एफएआर', 'far', 'floor area ratio', 'fsi', 'क्षेत्रफल']
}

/**
 * Result of rule scoring in retrieval engine
 */
export interface ScoredRule {
  rule: StatutoryRule
  score: number
  matchedTerms: string[]
  evidenceLevel: EvidenceLevel
}

/**
 * Clean and tokenize a query into lowercase tokens
 */
export const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

/**
 * Expand query tokens with synonyms from our statutory domain dictionary.
 * Uses exact key matching to prevent runaway substring expansion.
 */
export const expandQueryTokens = (tokens: string[]): string[] => {
  const expanded = new Set<string>(tokens)

  for (const token of tokens) {
    if (SYNONYM_MAP[token]) {
      SYNONYM_MAP[token].forEach((s) => expanded.add(s.toLowerCase()))
    }
  }

  return Array.from(expanded)
}

/**
 * Calculate multi-field deterministic relevance score for a statutory rule.
 * Weights:
 * - Rule Number / Clause exact match: 0.50
 * - Document Title match: 0.20
 * - Title (EN & HI) match: up to 0.45 (direct tokens weighted higher than synonyms)
 * - Topic / Category match: up to 0.20
 * - Original Text (EN & HI) keyword matches: up to 0.30
 * - Numerical standard keywords: 0.10 (once)
 * - Scaled by query token coverage ratio to reject out-of-scope queries honestly.
 */
export const scoreRule = (rule: StatutoryRule, queryTokens: string[], expandedTokens: string[]): ScoredRule => {
  if (queryTokens.length === 0) {
    return { rule, score: 0, matchedTerms: [], evidenceLevel: 'insufficient' }
  }

  const matchedTerms = new Set<string>()
  const directMatchedQueryTokens = new Set<string>()
  let score = 0

  const ruleNumLower = rule.ruleNumber.toLowerCase()
  const clauseLower = rule.clause.toLowerCase()
  const subclauseLower = (rule.subclause || '').toLowerCase()
  const docTitleLower = rule.documentTitle.toLowerCase()
  const titleEnLower = rule.titleEn.toLowerCase()
  const titleHiLower = rule.titleHi.toLowerCase()
  const topicLower = rule.topic.toLowerCase()
  const categoryLower = rule.category.toLowerCase()
  const textEnLower = rule.originalTextEn.toLowerCase()
  const textHiLower = (rule.originalTextHi || '').toLowerCase()
  const conditionsText = (rule.conditions || []).join(' ').toLowerCase()

  // 1. Direct Rule Number or Clause match (high precision boost)
  for (const token of queryTokens) {
    if (ruleNumLower.includes(token) || clauseLower.includes(token) || (subclauseLower && subclauseLower.includes(token))) {
      score += 0.50
      matchedTerms.add(token)
      directMatchedQueryTokens.add(token)
    }
  }

  // 2. Document Title match (e.g. "mplrc", "panchayat", "irrigation", "rfctlarr")
  for (const token of expandedTokens) {
    if (docTitleLower.includes(token)) {
      score += 0.20
      matchedTerms.add(token)
      if (queryTokens.includes(token)) {
        directMatchedQueryTokens.add(token)
      }
      break
    }
  }

  // 3. Title matching (EN and HI)
  for (const token of queryTokens) {
    if (titleEnLower.includes(token) || titleHiLower.includes(token)) {
      score += 0.15
      matchedTerms.add(token)
      directMatchedQueryTokens.add(token)
    }
  }
  for (const token of expandedTokens) {
    if (!queryTokens.includes(token) && (titleEnLower.includes(token) || titleHiLower.includes(token))) {
      score += 0.05
      matchedTerms.add(token)
    }
  }

  // 4. Topic & Category matching
  for (const token of queryTokens) {
    if (topicLower.includes(token) || categoryLower.includes(token)) {
      score += 0.15
      matchedTerms.add(token)
      directMatchedQueryTokens.add(token)
      break
    }
  }

  // 5. Verbatim Statutory Text & Conditions matching
  for (const token of queryTokens) {
    if (textEnLower.includes(token) || textHiLower.includes(token) || conditionsText.includes(token)) {
      score += 0.08
      matchedTerms.add(token)
      directMatchedQueryTokens.add(token)
    }
  }
  for (const token of expandedTokens) {
    if (!queryTokens.includes(token) && (textEnLower.includes(token) || textHiLower.includes(token) || conditionsText.includes(token))) {
      score += 0.03
      matchedTerms.add(token)
    }
  }

  // 6. Numerical keywords match (e.g. '3m', 'meter', 'ratio', 'sqm') - max once
  if (rule.keyNumericalValues) {
    let numMatched = false
    for (const numVal of rule.keyNumericalValues) {
      const numStr = `${numVal.label} ${numVal.value} ${numVal.unit || ''}`.toLowerCase()
      for (const token of queryTokens) {
        if (numStr.includes(token)) {
          numMatched = true
          matchedTerms.add(token)
          directMatchedQueryTokens.add(token)
          break
        }
      }
      if (numMatched) break
    }
    if (numMatched) {
      score += 0.10
    }
  }

  // Calculate query token coverage ratio
  const coverageRatio = directMatchedQueryTokens.size / queryTokens.length

  // Modulate score by coverage: queries with 0 direct matches drop to <= 0.15
  let finalScore = score * (0.35 + 0.65 * coverageRatio)
  finalScore = Math.min(1.0, Math.max(0.0, Number(finalScore.toFixed(2))))

  if (directMatchedQueryTokens.size === 0) {
    finalScore = Math.min(finalScore, 0.15)
  }

  // Classify evidence level based on calibrated statutory threshold
  let evidenceLevel: EvidenceLevel = 'insufficient'
  if (finalScore >= 0.65) {
    evidenceLevel = 'verified'
  } else if (finalScore >= 0.40) {
    evidenceLevel = 'partial'
  } else if (finalScore >= 0.20) {
    evidenceLevel = 'needs-verification'
  } else {
    evidenceLevel = 'insufficient'
  }

  return {
    rule,
    score: finalScore,
    matchedTerms: Array.from(matchedTerms),
    evidenceLevel,
  }
}

/**
 * Retrieve top scoring statutory rules matching a query
 */
export const retrieveRules = (query: string, corpus: StatutoryRule[] = STATUTORY_RULES): ScoredRule[] => {
  const queryTokens = tokenize(query)
  const expandedTokens = expandQueryTokens(queryTokens)

  const scored = corpus.map((rule) => scoreRule(rule, queryTokens, expandedTokens))

  // Sort descending by score
  return scored
    .filter((item) => item.score > 0.15)
    .sort((a, b) => b.score - a.score)
}

/**
 * Convert a ScoredRule into standard SourceEvidence
 */
export const toSourceEvidence = (scored: ScoredRule, isHindiQuery: boolean): SourceEvidence => {
  const { rule, score } = scored
  const originalText = isHindiQuery && rule.originalTextHi ? rule.originalTextHi : rule.originalTextEn
  const textLanguage = isHindiQuery && rule.originalTextHi ? 'hi' : 'en'

  return {
    id: `ev-${rule.id}`,
    ruleId: rule.id,
    documentTitle: rule.documentTitle,
    clauseRef: rule.clause,
    subclause: rule.subclause,
    ruleNumber: rule.ruleNumber,
    documentType: rule.documentType,
    year: rule.enactmentYear,
    pdfPage: rule.pdfPage,
    officialUrl: rule.officialPortalUrl,
    pdfUrl: rule.pdfUrl,
    originalText,
    textLanguage,
    relevanceScore: score,
  }
}

/**
 * Deterministically assemble a verifiable QAAnswer from retrieved statutory rules.
 * Never fabricates legal rules, fees, measurements, citations, or source pages.
 */
export const buildAnswerFromEvidence = (
  question: string,
  topMatch: ScoredRule,
  allMatches: ScoredRule[],
  isHindiQuery: boolean,
): QAAnswer => {
  const { rule, evidenceLevel } = topMatch

  // Compile evidence items for all relevant matches (up to top 3)
  const evidenceList: SourceEvidence[] = allMatches.slice(0, 3).map((item) => toSourceEvidence(item, isHindiQuery))

  // Compose English Explanation using authentic statutory text and metadata
  const enNumericalParts = (rule.keyNumericalValues || [])
    .map((nv) => `• ${nv.label}: ${nv.value} ${nv.unit || ''}`)
    .join('\n')

  const enConditionsParts = (rule.conditions && rule.conditions.length > 0)
    ? `\n\nMandatory Conditions & Thresholds:\n${rule.conditions.map((c) => `• ${c}`).join('\n')}`
    : ''

  const enTableNotice = rule.statutoryTable
    ? `\n\n[Statutory Table Available: ${rule.statutoryTable.title} — inspect via Explore Regulations]`
    : ''

  const answerTextEn =
    `According to ${rule.documentTitle} (${rule.ruleNumber}, ${rule.clause}${rule.subclause ? `, ${rule.subclause}` : ''}):\n\n` +
    `"${rule.originalTextEn}"\n\n` +
    `Key Statutory Standards:\n${enNumericalParts || '• Refer to verbatim clause for detailed applicability.'}` +
    `${enConditionsParts}${enTableNotice}\n\n` +
    `Applicability: ${rule.applicability}.`

  // Compose Hindi Explanation using authentic statutory Hindi text
  const hiNumericalParts = (rule.keyNumericalValues || [])
    .map((nv) => `• ${nv.label}: ${nv.value} ${nv.unit || ''}`)
    .join('\n')

  const hiConditionsParts = (rule.conditions && rule.conditions.length > 0)
    ? `\n\nअनिवार्य शर्तें एवं सीमाएं:\n${rule.conditions.map((c) => `• ${c}`).join('\n')}`
    : ''

  const answerTextHi = rule.originalTextHi
    ? `${rule.documentTitle} (${rule.ruleNumber}, ${rule.clause}${rule.subclause ? `, ${rule.subclause}` : ''}) के अनुसार:\n\n` +
      `"${rule.originalTextHi}"\n\n` +
      `प्रमुख वैधानिक मानक:\n${hiNumericalParts || '• विस्तृत विवरण हेतु मूल धारा देखें।'}` +
      `${hiConditionsParts}\n\n` +
      `लागू क्षेत्र: ${rule.applicability}।`
    : answerTextEn

  // Concise Legal Summary
  const legalSummary = `${rule.ruleNumber} (${rule.clause}): ${rule.titleEn}`

  // Statutory Disclaimer
  const disclaimer =
    'Sourced directly from official Madhya Pradesh Gazettes and Acts. Official field verification from the competent authority (SDO / Municipal Planner) is recommended before construction or land filing.'

  return {
    id: `ans-retrieved-${Date.now()}`,
    question,
    questionLang: isHindiQuery ? 'hi' : 'en',
    answerText: answerTextEn,
    answerTextHi: answerTextHi,
    evidenceLevel,
    evidence: evidenceList,
    legalSummary,
    disclaimer,
    categories: [rule.category, rule.topic],
    generatedAt: new Date().toISOString(),
    isMockData: false, // Authentic retrieved data
  }
}

/**
 * Return a deterministic insufficient-evidence answer when no rule passes the confidence threshold
 */
export const buildInsufficientAnswer = (question: string, isHindiQuery: boolean): QAAnswer => {
  return {
    id: `ans-insufficient-${Date.now()}`,
    question,
    questionLang: isHindiQuery ? 'hi' : 'en',
    answerText:
      'No conclusive statutory rule matching your question was found within the indexed Madhya Pradesh regulatory corpus. To avoid unauthorized construction or revenue penalties, please consult the local Sub-Divisional Officer (Revenue), Tehsildar, or Municipal Town Planning Office.',
    answerTextHi:
      'संकलित मध्य प्रदेश विनियामक संग्रह में आपके प्रश्न से मेल खाती कोई निर्णायक वैधानिक धारा नहीं मिली। किसी भी अनधिकृत निर्माण अथवा राजस्व अर्थदंड से बचने के लिए कृपया स्थानीय अनुविभागीय अधिकारी (राजस्व), तहसीलदार अथवा नगर पालिका/नगर निगम कार्यालय से संपर्क करें।',
    evidenceLevel: 'insufficient',
    evidence: [],
    legalSummary: 'No conclusive statutory match in prototype corpus',
    disclaimer:
      'The current prototype indexes a curated corpus of 11 authentic statutory rules from MP Bhumi Vikas Niyam, MPLRC, and Panchayat Raj Act. Questions outside these provisions require physical rulebook review or departmental verification.',
    categories: ['Unresolved Query'],
    generatedAt: new Date().toISOString(),
    isMockData: false,
  }
}
