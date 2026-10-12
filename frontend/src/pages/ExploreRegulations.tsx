/**
 * ExploreRegulations — Explore Madhya Pradesh Building & Land Regulations
 *
 * Sourced from FastAPI GET /api/rules and GET /api/rules/search.
 * Browses by Part and rule number only.
 * Hides the page if the endpoints do not exist.
 */

import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  ExternalLink,
  Shield,
  Search,
  Scale,
  X,
  Layers,
} from 'lucide-react'
import { regulationsService } from '../services/regulationsService'
import { useLanguage } from '../context/LanguageContext'
import type { RuleSummaryItem, RuleSearchResultItem, RuleDetailItem } from '../types'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'

export const ExploreRegulations = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') || ''

  // State
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rules, setRules] = useState<RuleSummaryItem[]>([])
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<RuleSearchResultItem[] | null>(null)
  const [selectedPart, setSelectedPart] = useState<string>('all')
  const [ruleNumberFilter, setRuleNumberFilter] = useState<string>('')

  // Modal inspection
  const [inspectingRule, setInspectingRule] = useState<RuleDetailItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Verify endpoint availability and load rules
  useEffect(() => {
    let mounted = true

    regulationsService
      .fetchApiRules()
      .then((data) => {
        if (!mounted) return
        if (Array.isArray(data) && data.length > 0) {
          setRules(data)
          setIsAvailable(true)
        } else {
          setIsAvailable(false)
        }
      })
      .catch(() => {
        if (!mounted) return
        setIsAvailable(false)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Execute search when searchQuery is provided
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!isAvailable || !trimmed) {
      return
    }

    let active = true
    const timer = setTimeout(() => {
      setIsSearching(true)
      regulationsService
        .searchApiRules(trimmed)
        .then((res) => {
          if (active) setSearchResults(res)
        })
        .catch(() => {
          if (active) setSearchResults([])
        })
        .finally(() => {
          if (active) setIsSearching(false)
        })
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, isAvailable])

  // Extract distinct Parts from rules
  const distinctParts = useMemo(() => {
    const parts = Array.from(new Set(rules.map((r) => r.part))).filter(Boolean)
    return parts.sort()
  }, [rules])

  // Filter rules by Part and rule number
  const displayedRules = useMemo(() => {
    if (searchResults !== null) {
      // User performed full-text search
      return searchResults.filter((r) => {
        if (ruleNumberFilter && !r.rule_no.toLowerCase().includes(ruleNumberFilter.toLowerCase())) {
          return false
        }
        return true
      })
    }

    return rules.filter((r) => {
      if (selectedPart !== 'all' && r.part !== selectedPart) {
        return false
      }
      if (ruleNumberFilter && !r.rule_no.toLowerCase().includes(ruleNumberFilter.toLowerCase())) {
        return false
      }
      return true
    })
  }, [rules, searchResults, selectedPart, ruleNumberFilter])

  // Open modal with authoritative text
  const handleInspectRule = async (ruleNo: string) => {
    setIsLoadingDetail(true)
    setIsModalOpen(true)
    try {
      const detail = await regulationsService.fetchApiRuleDetail(ruleNo)
      setInspectingRule(detail)
    } catch {
      setInspectingRule(null)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  // If endpoint check failed, hide the page
  if (isAvailable === false) {
    return (
      <div className="explore-page-wrapper" style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
        <p style={{ color: 'var(--clr-neutral-500)' }}>Regulations directory is currently unavailable.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 'var(--space-4)' }}
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  if (isLoading || isAvailable === null) {
    return (
      <div className="explore-page-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="explore-page-wrapper">
      {/* ── Page Header ── */}
      <section className="explore-hero-header">
        <div className="explore-header-top-row">
          <div className="explore-badge-civic">
            <Shield size={14} aria-hidden />
            <span>MP Bhumi Vikas Rules (Consolidated to 6 Mar 2025)</span>
          </div>
          <span className="explore-count-tag">
            <Layers size={13} aria-hidden />
            {rules.length} Statutory Rules
          </span>
        </div>

        <h1 className="explore-main-heading">{t('exploreTitle')}</h1>
        <p className="explore-main-subheading">
          Browse authoritative rules by Part and Rule Number, with exact official Gazette PDF citations.
        </p>

        {/* ── Search Input (GET /api/rules/search) ── */}
        <form onSubmit={handleSearchSubmit} className="explore-search-box-wrap" role="search">
          <div className="explore-search-input-inner">
            <Search size={18} className="explore-search-icon" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MP Bhumi Vikas Rules by keyword or topic..."
              className="explore-main-search-input"
              aria-label="Search regulations"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="explore-search-clear"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── Browse by Part and Rule Number Controls ── */}
      <section className="explore-filters-bar" aria-label="Browse by Part and Rule Number">
        <div className="explore-filter-group">
          <label htmlFor="part-select" className="filter-label">
            Part:
          </label>
          <select
            id="part-select"
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value)}
            className="select"
            disabled={searchResults !== null}
          >
            <option value="all">All Parts ({distinctParts.length})</option>
            {distinctParts.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
        </div>

        <div className="explore-filter-group">
          <label htmlFor="rule-no-filter" className="filter-label">
            Rule Number:
          </label>
          <input
            id="rule-no-filter"
            type="text"
            value={ruleNumberFilter}
            onChange={(e) => setRuleNumberFilter(e.target.value)}
            placeholder="e.g. 56, 14, 21..."
            className="input"
            style={{ width: '140px' }}
          />
        </div>

        {(selectedPart !== 'all' || ruleNumberFilter || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedPart('all')
              setRuleNumberFilter('')
              setSearchQuery('')
              setSearchResults(null)
            }}
            className="btn btn-secondary btn-xs"
            style={{ alignSelf: 'flex-end', height: '36px' }}
          >
            <X size={13} aria-hidden />
            <span>Reset</span>
          </button>
        )}
      </section>

      {/* ── Rules Grid ── */}
      <main className="explore-results-section" aria-label="Statutory Rules List">
        <div className="results-header-row">
          <h2 className="results-count-heading">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>
                Showing <strong>{displayedRules.length}</strong> rules
                {searchResults !== null && ` for "${searchQuery}"`}
              </span>
            )}
          </h2>
        </div>

        {displayedRules.length === 0 ? (
          <div className="no-rules-found" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>No statutory rules match the selected Part or Rule number.</p>
          </div>
        ) : (
          <div className="statutory-rules-grid">
            {displayedRules.map((r) => {
              const ruleNo = r.rule_no
              const pageStart = r.page_start
              const pageEnd = r.page_end
              const pdfUrl = `/pdf/MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_EN.pdf#page=${pageStart}`
              const snippet = 'snippet' in r ? (r as RuleSearchResultItem).snippet : null
              const part = 'part' in r ? (r as RuleSummaryItem).part : null

              return (
                <div key={ruleNo} className="statutory-rule-card">
                  <div className="rule-card-header">
                    <div className="rule-card-badge-row">
                      <span className="rule-card-number-badge">Rule {ruleNo}</span>
                      {part && <span className="rule-card-part-badge">{part}</span>}
                    </div>
                  </div>

                  <h3 className="rule-card-title">{r.title}</h3>

                  {snippet && (
                    <p className="rule-card-snippet" style={{ fontStyle: 'italic', color: 'var(--clr-neutral-600)', fontSize: '13px' }}>
                      {snippet}
                    </p>
                  )}

                  <div className="rule-card-footer">
                    <div className="rule-card-pages">
                      <FileText size={13} aria-hidden />
                      <span>
                        PDF Pages {pageStart}{pageEnd !== pageStart ? `–${pageEnd}` : ''}
                      </span>
                    </div>

                    <div className="rule-card-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleInspectRule(ruleNo)}
                        className="btn btn-secondary btn-xs"
                      >
                        <Scale size={13} aria-hidden />
                        <span>Inspect Text</span>
                      </button>

                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-xs"
                        title={`Open PDF at page ${pageStart}`}
                      >
                        <span>PDF</span>
                        <ExternalLink size={12} aria-hidden />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Rule Detail Inspection Modal ── */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={inspectingRule ? `Rule ${inspectingRule.rule}: ${inspectingRule.title}` : 'Rule Details'}
          size="lg"
        >
          {isLoadingDetail ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : inspectingRule ? (
            <div className="rule-detail-modal-content">
              <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <span className="badge badge-blue">{inspectingRule.part}</span>
                <span className="badge badge-grey">Pages {inspectingRule.page_start}–{inspectingRule.page_end}</span>
              </div>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>{inspectingRule.title}</h3>
              <div
                className="rule-detail-text"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  background: 'var(--clr-surface-alt, #f8fafc)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {inspectingRule.text}
              </div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <a
                  href={`/pdf/MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_EN.pdf#page=${inspectingRule.page_start}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <FileText size={14} aria-hidden />
                  <span>Open Official PDF (Page {inspectingRule.page_start})</span>
                  <ExternalLink size={12} aria-hidden />
                </a>
              </div>
            </div>
          ) : (
            <p>Could not load rule text from server.</p>
          )}
        </Modal>
      )}
    </div>
  )
}

export default ExploreRegulations
