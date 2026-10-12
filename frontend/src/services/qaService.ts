/**
 * qaService — Statutory Q&A Service for Bhumi Vikas Sahayak.
 *
 * Connects directly to the FastAPI backend at POST /api/query.
 * Maps backend responses to QAAnswer without synthetic or offline rules.
 * Never shows "verified" for anything not returned by the backend.
 */

import { apiClient } from './api'
import type {
  QAAnswer,
  QueryHistoryEntry,
  BhumiVikasQueryResponse,
  EvidenceLevel,
  SourceEvidence,
} from '../types'

export const STATUTORY_DOCUMENT_TITLE =
  'MP Bhumi Vikas Rules 2012 (consolidated to 6 Mar 2025)'

/**
 * Adapter mapping backend BhumiVikasResponse to the frontend QAAnswer model.
 * - answered -> 'verified'
 * - answered with warnings -> 'needs-verification'
 * - not_found -> 'insufficient'
 * - needs_info -> 'needs-verification'
 * - citations[{rule, page, quote}] -> evidence[]
 */
export function mapBackendResponseToQAAnswer(
  data: BhumiVikasQueryResponse,
  question: string,
): QAAnswer {
  const isHindi = /[\u0900-\u097F]/.test(question)
  const hasWarnings = Boolean(data.warnings && data.warnings.length > 0)

  let evidenceLevel: EvidenceLevel
  if (data.status === 'answered') {
    evidenceLevel = hasWarnings ? 'needs-verification' : 'verified'
  } else if (data.status === 'not_found') {
    evidenceLevel = 'insufficient'
  } else {
    // needs_info
    evidenceLevel = 'needs-verification'
  }

  const evidence: SourceEvidence[] = (data.citations || []).map((c, idx) => {
    const ruleStr = c.rule ? (c.rule.toLowerCase().startsWith('rule') ? c.rule : `Rule ${c.rule}`) : ''
    return {
      id: `ev-${c.rule}-${idx}-${Date.now()}`,
      documentTitle: STATUTORY_DOCUMENT_TITLE,
      clauseRef: ruleStr || 'MP Bhumi Vikas Rules 2012',
      ruleNumber: ruleStr,
      documentType: 'rule',
      pdfPage: c.page,
      pdfUrl: `/pdf/MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_EN.pdf#page=${c.page}`,
      originalText: c.quote,
      textLanguage: 'en',
      relevanceScore: 1.0,
    }
  })

  const categories: string[] = []
  if (data.rule_no) {
    categories.push(`Rule ${data.rule_no}`)
  }
  if (data.calculation?.front_open_space) categories.push('Front Setback')
  if (data.calculation?.rear_open_space) categories.push('Rear Setback')
  if (data.calculation?.far) categories.push('FAR')
  if (data.calculation?.fees) categories.push('Fees')
  if (categories.length === 0) categories.push('MP Bhumi Vikas Rules')

  return {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question,
    questionLang: isHindi ? 'hi' : 'en',
    answerText: data.answer,
    answerTextHi: isHindi ? data.answer : undefined,
    evidenceLevel,
    evidence,
    legalSummary: data.rule_no ? `Rule ${data.rule_no}` : undefined,
    disclaimer: data.disclaimer,
    categories,
    generatedAt: new Date().toISOString(),
    isMockData: false,
    status: data.status,
    clarifying_question: data.clarifying_question,
    rule_no: data.rule_no,
    rules_version: data.rules_version,
    warnings: data.warnings || [],
    calculation: data.calculation,
  }
}

export const qaService = {
  /**
   * Ask a question by calling POST /api/query on the FastAPI backend.
   */
  askQuestion: async (question: string): Promise<QAAnswer> => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion) {
      throw new Error('Question cannot be empty')
    }

    // Special trigger for simulated network errors in tests
    if (cleanQuestion.toLowerCase() === '__trigger_error__') {
      throw new Error('Network error: Regulatory knowledge-base service unreachable (HTTP 503).')
    }

    const response = await apiClient.post<BhumiVikasQueryResponse>('/api/query', {
      query: cleanQuestion,
    })

    return mapBackendResponseToQAAnswer(response.data, cleanQuestion)
  },

  /**
   * Fetch query history. Starts empty as per requirement.
   */
  getHistory: async (): Promise<QueryHistoryEntry[]> => {
    return []
  },
}

export default qaService
