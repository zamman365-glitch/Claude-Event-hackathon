/**
 * Shared TypeScript types for Bhumi Vikas Sahayak.
 * Phase 2 adds Q&A / regulatory assistant domain types.
 */

// ── App-wide ──────────────────────────────────────────────────
export type Language = 'en' | 'hi'
export type Theme = 'light' | 'dark'

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

// ── Land Record (Khasra/Khatauni) ────────────────────────────
export interface LandRecord {
  khasraNumber: string
  ownerName: string
  district: string
  tehsil: string
  village: string
  areaHectares: number
  landType: string
  lastUpdated: string
}

// ── Government Scheme ─────────────────────────────────────────
export interface GovtScheme {
  id: string
  nameEn: string
  nameHi: string
  ministry: string
  beneficiaryCategory: string[]
  maxBenefitAmount?: number
  applicationUrl?: string
  description: string
  eligibilityCriteria: string[]
}

// ── User / Farmer Profile ─────────────────────────────────────
export interface FarmerProfile {
  id: string
  name: string
  aadhaarLast4?: string
  district: string
  landHoldings: LandRecord[]
  schemes: GovtScheme[]
}

// ══════════════════════════════════════════════════════════════
//  Q&A / Regulatory Assistant Types  (added Phase 2)
// ══════════════════════════════════════════════════════════════

/** How confident we are that this answer is evidence-supported */
export type EvidenceLevel =
  | 'verified'           // Direct clause citation found
  | 'partial'            // Related clauses found; full coverage uncertain
  | 'needs-verification' // Answer generated but no authoritative clause located
  | 'insufficient'       // Not enough evidence to answer

/** A single piece of source evidence backing an answer */
export interface SourceEvidence {
  id: string
  /** Link to registry statutory rule if indexed */
  ruleId?: string
  /** e.g. "MP Land Revenue Code 1959" */
  documentTitle: string
  /** e.g. "Section 12, Sub-section 3" */
  clauseRef: string
  /** Subclause if distinct */
  subclause?: string
  /** e.g. "Rule 47(2)(b)" */
  ruleNumber?: string
  /** Short description of the document type */
  documentType: 'act' | 'rule' | 'notification' | 'circular' | 'order' | 'manual'
  /** Publication / amendment year */
  year?: number
  /** Page number in the original PDF, if known */
  pdfPage?: number
  /** URL to the official document / PDF, if available */
  officialUrl?: string
  /** URL directly targeting the PDF page if technically supported */
  pdfUrl?: string
  /** The verbatim text excerpt supporting the answer */
  originalText: string
  /** Language of the originalText */
  textLanguage: 'en' | 'hi' | 'both'
  /** Relevance score 0–1 (for display only) */
  relevanceScore: number
}

/** Comprehensive Statutory Rule in the Explore Regulations Registry */
export interface StatutoryRule {
  id: string
  ruleNumber: string
  clause: string
  subclause?: string
  titleEn: string
  titleHi: string
  category: string
  categoryId: string
  topic: string
  documentTitle: string
  documentType: 'rule' | 'act' | 'notification' | 'circular' | 'order'
  enactmentYear: number
  authority?: string
  pdfPage?: number
  pdfUrl?: string
  officialPortalUrl?: string
  originalTextEn: string
  originalTextHi?: string
  keyNumericalValues?: Array<{
    label: string
    value: string
    unit?: string
  }>
  /** Specific statutory conditions, thresholds, and caveats */
  conditions?: string[]
  /** Tabular data context if rule contains a statutory schedule or table */
  statutoryTable?: {
    title: string
    headers: string[]
    rows: string[][]
  }
  applicability: string
  status: 'active' | 'amended' | 'repealed'
  lastAmended?: string
}

// ── Calculation Details (from MP Bhumi Vikas backend) ─────────
export interface FrontOpenSpaceCalculation {
  rule: string
  page: number
  front_open_space_m: number
  street_width_m: number
  building_height_m: number
  slab_label: string
}

export interface RearOpenSpaceCalculation {
  rule: string
  page: number
  rear_open_space_m: number
  plot_area_sqm: number
  slab_label: string
}

export interface FarCalculation {
  rule: string
  page: number
  use_group: string
  category: string
  far: number
  plot_area_sqm?: number | null
  max_builtup_area_sqm?: number | null
}

export interface FeesCalculation {
  rule: string
  page: number
  built_up_area_sqm: number
  use_group: string
  application_fee_rs: number
  permission_fee_rs: number
  commercial_surcharge_rs?: number | null
  total_fee_rs: number
}

export interface CalculationDetails {
  front_open_space?: FrontOpenSpaceCalculation | null
  rear_open_space?: RearOpenSpaceCalculation | null
  far?: FarCalculation | null
  fees?: FeesCalculation | null
}

export interface BackendCitation {
  rule: string
  page: number
  quote: string
}

export interface BhumiVikasQueryResponse {
  status: 'answered' | 'not_found' | 'needs_info'
  answer: string
  clarifying_question?: string | null
  rule_no?: string | null
  citations: BackendCitation[]
  rules_version: string
  warnings: string[]
  calculation?: CalculationDetails | null
  disclaimer: string
}

export interface RuleSummaryItem {
  rule_no: string
  sub_rule?: string | null
  title: string
  part: string
  page_start: number
  page_end: number
}

export interface RuleSearchResultItem {
  rule_no: string
  title: string
  page_start: number
  page_end: number
  snippet: string
}

export interface RuleDetailItem {
  rule: string
  title: string
  part: string
  page_start: number
  page_end: number
  text: string
  text_norm: string
}

/** The structured answer returned by the Q&A engine */
export interface QAAnswer {
  id: string
  /** The question as the user asked it */
  question: string
  /** Language the question was asked in */
  questionLang: 'en' | 'hi'
  /** Human-readable answer text */
  answerText: string
  answerTextHi?: string   // Hindi version when available
  evidenceLevel: EvidenceLevel
  /** Supporting evidence, ordered by relevance */
  evidence: SourceEvidence[]
  /** Concise legal summary (max ~80 chars) */
  legalSummary?: string
  /** Caveats, disclaimers, or verification notes */
  disclaimer?: string
  /** Tags for categorisation */
  categories: string[]
  /** ISO timestamp of when this answer was generated */
  generatedAt: string
  /** Whether this came from mock/demo data */
  isMockData: boolean
  /** Raw backend status */
  status?: 'answered' | 'not_found' | 'needs_info'
  /** Clarifying question when status is needs_info */
  clarifying_question?: string | null
  /** Primary rule number */
  rule_no?: string | null
  /** Rules version returned by backend */
  rules_version?: string
  /** Post-consolidation amendment warnings or conditions */
  warnings?: string[]
  /** Structured calculations (setbacks, FAR, fees) */
  calculation?: CalculationDetails | null
}

/** A query history entry */
export interface QueryHistoryEntry {
  id: string
  question: string
  questionLang: 'en' | 'hi'
  evidenceLevel: EvidenceLevel
  askedAt: string
  categories: string[]
}

/** State for the ask-question feature */
export type AskState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; answer: QAAnswer }
  | {
      status: 'needs_info'
      answer: QAAnswer
      clarifying_question: string
      original_question: string
    }
  | { status: 'no-results'; query: string }
  | { status: 'insufficient-evidence'; answer: QAAnswer }
  | { status: 'error'; message: string }

/** A suggested question shown to the user */
export interface SuggestedQuestion {
  id: string
  textEn: string
  textHi: string
  category: string
  icon: string
}

/** A regulation category for the Explore page */
export interface RegulationCategory {
  id: string
  titleEn: string
  titleHi: string
  descriptionEn: string
  descriptionHi: string
  topicCount: number
  icon: string
  color: string
  colorBg: string
}
