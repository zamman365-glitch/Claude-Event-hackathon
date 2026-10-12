/**
 * regulationsService — Statutory Regulations Data Access Service
 * Sourced from authentic Madhya Pradesh statutory rules in src/assets/data/regulationsData.ts
 */

import type { StatutoryRule, RegulationCategory } from '../types'
import { STATUTORY_RULES } from '../assets/data/regulationsData'
import { REGULATION_CATEGORIES } from '../assets/data/mockQA'

export interface RuleSearchParams {
  query?: string
  categoryId?: string
  topic?: string
  documentType?: string
}

export const regulationsService = {
  /** Retrieve all indexed statutory rules */
  getAllRules: async (): Promise<StatutoryRule[]> => {
    return STATUTORY_RULES
  },

  /** Retrieve a specific rule by its unique identifier */
  getRuleById: async (id: string): Promise<StatutoryRule | undefined> => {
    return STATUTORY_RULES.find((r) => r.id === id)
  },

  /** Retrieve a rule by its rule number, e.g. "Rule 14(3)", "Section 165" */
  getRuleByNumber: async (ruleNumber: string): Promise<StatutoryRule | undefined> => {
    const clean = ruleNumber.trim().toLowerCase()
    return STATUTORY_RULES.find(
      (r) =>
        r.ruleNumber.toLowerCase() === clean ||
        r.clause.toLowerCase() === clean ||
        clean.includes(r.ruleNumber.toLowerCase()),
    )
  },

  /** Retrieve all categories with dynamic count of rules */
  getCategories: async (): Promise<RegulationCategory[]> => {
    return REGULATION_CATEGORIES.map((cat) => {
      const matchCount = STATUTORY_RULES.filter((r) => r.categoryId === cat.id).length
      return {
        ...cat,
        topicCount: matchCount > 0 ? matchCount : cat.topicCount,
      }
    })
  },

  /**
   * Search rules by text query across:
   * - Rule number & clause & subclause
   * - Titles (EN/HI)
   * - Original statutory text (EN/HI)
   * - Document title
   * Filterable by categoryId, topic, documentType
   */
  searchRules: async (params: RuleSearchParams): Promise<StatutoryRule[]> => {
    const { query, categoryId, topic, documentType } = params
    const term = query?.trim().toLowerCase() || ''

    return STATUTORY_RULES.filter((rule) => {
      // Category filter
      if (categoryId && categoryId !== 'all' && rule.categoryId !== categoryId) {
        return false
      }

      // Topic filter
      if (topic && topic !== 'all' && rule.topic.toLowerCase() !== topic.toLowerCase()) {
        return false
      }

      // Document type filter
      if (documentType && documentType !== 'all' && rule.documentType !== documentType) {
        return false
      }

      // Query text search
      if (!term) return true

      const matchesRuleNumber = rule.ruleNumber.toLowerCase().includes(term)
      const matchesClause = rule.clause.toLowerCase().includes(term)
      const matchesSubclause = rule.subclause ? rule.subclause.toLowerCase().includes(term) : false
      const matchesTitleEn = rule.titleEn.toLowerCase().includes(term)
      const matchesTitleHi = rule.titleHi.toLowerCase().includes(term)
      const matchesTextEn = rule.originalTextEn.toLowerCase().includes(term)
      const matchesTextHi = rule.originalTextHi ? rule.originalTextHi.toLowerCase().includes(term) : false
      const matchesDoc = rule.documentTitle.toLowerCase().includes(term)
      const matchesTopic = rule.topic.toLowerCase().includes(term)

      return (
        matchesRuleNumber ||
        matchesClause ||
        matchesSubclause ||
        matchesTitleEn ||
        matchesTitleHi ||
        matchesTextEn ||
        matchesTextHi ||
        matchesDoc ||
        matchesTopic
      )
    })
  },
}

export default regulationsService
