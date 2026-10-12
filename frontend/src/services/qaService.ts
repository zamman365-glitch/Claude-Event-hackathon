/**
 * qaService — Statutory Q&A Service for Bhumi Vikas Sahayak.
 *
 * Sourced directly from authentic Madhya Pradesh statutory rules via `retrievalEngine.ts`.
 * Replaces hardcoded mock answer selection with dynamic, deterministic rule retrieval
 * across English & Hindi queries, preserving measurements, units, conditions, and table context.
 *
 * Demonstrations or mock fallback remain isolated in `mockQA.ts` and are explicitly tagged.
 */

import type { QAAnswer, QueryHistoryEntry } from '../types'
import {
  retrieveRules,
  buildAnswerFromEvidence,
  buildInsufficientAnswer,
} from './retrievalEngine'
import { MOCK_QUERY_HISTORY } from '../assets/data/mockQA'

/** Simulated network delay (ms) for responsive civic UI experience */
const SIMULATED_DELAY_MS = 300

export const qaService = {
  /**
   * Ask a question and return a verifiable, evidence-backed QAAnswer.
   * Matches natural-language queries against real statutory provisions in regulationsData.ts.
   */
  askQuestion: async (question: string): Promise<QAAnswer> => {
    // Quick latency simulation
    await new Promise((r) => setTimeout(r, SIMULATED_DELAY_MS))

    const cleanQuestion = question.trim()
    if (!cleanQuestion) {
      throw new Error('Question cannot be empty')
    }

    // Special trigger for error state testing
    if (cleanQuestion.toLowerCase() === '__trigger_error__') {
      throw new Error('Network error: Regulatory knowledge-base service unreachable (HTTP 503).')
    }

    const isHindi = /[\u0900-\u097F]/.test(cleanQuestion)

    // Run deterministic multi-field retrieval over authentic statutory corpus
    const matches = retrieveRules(cleanQuestion)

    // Check if we have a top match with sufficient relevance (score >= 0.20)
    if (matches.length > 0 && matches[0].score >= 0.20) {
      const topMatch = matches[0]
      return buildAnswerFromEvidence(cleanQuestion, topMatch, matches, isHindi)
    }

    // No reliable match found -> return honest insufficient-evidence answer
    return buildInsufficientAnswer(cleanQuestion, isHindi)
  },

  /**
   * Fetch query history.
   * Sourced from session log or realistic prototype audit trail.
   */
  getHistory: async (): Promise<QueryHistoryEntry[]> => {
    await new Promise((r) => setTimeout(r, 100))
    return MOCK_QUERY_HISTORY
  },
}

export default qaService
