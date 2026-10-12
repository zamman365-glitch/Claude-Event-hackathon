/**
 * regulationsService — Statutory Regulations Data Access Service
 * Sourced from authentic Madhya Pradesh statutory rules in src/assets/data/regulationsData.ts
 */

import { apiClient } from './api'
import type {
  StatutoryRule,
  RegulationCategory,
  RuleSummaryItem,
  RuleSearchResultItem,
  RuleDetailItem,
} from '../types'
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

  /** Check if GET /api/rules endpoint exists and is reachable */
  checkApiRulesAvailable: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/api/rules')
      return res.status === 200 && Array.isArray(res.data) && res.data.length > 0
    } catch {
      return false
    }
  },

  /** Retrieve all rules from FastAPI GET /api/rules */
  fetchApiRules: async (): Promise<RuleSummaryItem[]> => {
    const res = await apiClient.get<RuleSummaryItem[]>('/api/rules')
    return res.data
  },

  /** Search rules via FastAPI GET /api/rules/search?q=... */
  searchApiRules: async (query: string): Promise<RuleSearchResultItem[]> => {
    const res = await apiClient.get<RuleSearchResultItem[]>('/api/rules/search', {
      params: { q: query },
    })
    return res.data
  },

  /** Fetch rule details via FastAPI GET /api/rules/{rule_no} */
  fetchApiRuleDetail: async (ruleNo: string): Promise<RuleDetailItem | null> => {
    try {
      const res = await apiClient.get<RuleDetailItem>(`/api/rules/${encodeURIComponent(ruleNo)}`)
      return res.data
    } catch {
      return null
    }
  },
}

export default regulationsService
