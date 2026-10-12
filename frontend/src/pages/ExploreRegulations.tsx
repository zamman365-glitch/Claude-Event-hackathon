/**
 * ExploreRegulations — Explore Madhya Pradesh Building & Land Regulations
 * Features:
 * - Browse rules by topic, category, rule number, or legislation
 * - Search clauses and verbatim original statutory text
 * - View matching rules with metadata (clause, subclause, PDF page, numerical standards)
 * - Open a rule in RuleDetailModal to inspect verbatim text, units, and citation
 * - Open corresponding PDF page when technically supported
 * - Quick rule jump chips and deep-linking via ?q= or ?rule=
 */

import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Filter,
  FileText,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Search,
  Scale,
  RefreshCw,
} from 'lucide-react'
import { STATUTORY_RULES } from '../assets/data/regulationsData'
import { REGULATION_CATEGORIES } from '../assets/data/mockQA'
import { useLanguage } from '../context/LanguageContext'
import type { StatutoryRule } from '../types'
import RuleDetailModal from '../components/qa/RuleDetailModal'
import Badge from '../components/common/Badge'

export const ExploreRegulations = () => {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialParam = searchParams.get('q') || searchParams.get('rule') || ''
  const initialExactMatch = initialParam
    ? STATUTORY_RULES.find(
        (r) =>
          r.ruleNumber.toLowerCase() === initialParam.toLowerCase() ||
          r.clause.toLowerCase() === initialParam.toLowerCase() ||
          r.id.toLowerCase() === initialParam.toLowerCase(),
      ) || null
    : null

  // State
  const [searchQuery, setSearchQuery] = useState(initialParam)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedDoc, setSelectedDoc] = useState<string>('all')
  const [inspectingRule, setInspectingRule] = useState<StatutoryRule | null>(initialExactMatch)
  const [isModalOpen, setIsModalOpen] = useState(initialExactMatch !== null)

  // Extract distinct topics and document titles
  const allTopics = useMemo(() => {
    return Array.from(new Set(STATUTORY_RULES.map((r) => r.topic))).sort()
  }, [])

  const allDocuments = useMemo(() => {
    return Array.from(new Set(STATUTORY_RULES.map((r) => r.documentTitle))).sort()
  }, [])

  // Filtered rules
  const filteredRules = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return STATUTORY_RULES.filter((rule) => {
      // Category filter
      if (selectedCategory !== 'all' && rule.categoryId !== selectedCategory) {
        return false
      }

      // Topic filter
      if (selectedTopic !== 'all' && rule.topic.toLowerCase() !== selectedTopic.toLowerCase()) {
        return false
      }

      // Document filter
      if (selectedDoc !== 'all' && rule.documentTitle.toLowerCase() !== selectedDoc.toLowerCase()) {
        return false
      }

      // Query text search across ruleNumber, clause, subclause, titles, and original statutory text
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
  }, [searchQuery, selectedCategory, selectedTopic, selectedDoc])

  const handleOpenRule = (rule: StatutoryRule) => {
    setInspectingRule(rule)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleQuickJump = (ruleNumber: string) => {
    setSearchQuery(ruleNumber)
    setSelectedCategory('all')
    setSelectedTopic('all')
    setSelectedDoc('all')
    const match = STATUTORY_RULES.find((r) => r.ruleNumber === ruleNumber)
    if (match) {
      setInspectingRule(match)
      setIsModalOpen(true)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedTopic('all')
    setSelectedDoc('all')
    setSearchParams({})
  }

  return (
    <div className="explore-page-wrapper">
      {/* ── Page Header ── */}
      <section className="explore-hero-header">
        <div className="explore-header-top-row">
          <div className="explore-badge-civic">
            <Shield size={14} aria-hidden />
            <span>Madhya Pradesh Statutory Registry</span>
          </div>
          <span className="explore-count-tag">
            <Layers size={13} aria-hidden />
            {STATUTORY_RULES.length} Statutory Rules Indexed
          </span>
        </div>

        <h1 className="explore-main-heading">{t('exploreTitle')}</h1>
        <p className="explore-main-subheading">{t('exploreSubtitle')}</p>

        {/* ── Scope Disclosure Notice ── */}
        <div className="explore-scope-notice-banner" role="note">
          <span className="scope-notice-pill">Curated Prototype Corpus</span>
          <p className="scope-notice-text">
            Currently displaying <strong>{STATUTORY_RULES.length} authoritative statutory clauses</strong> curated from MP Bhumi Vikas Niyam 2012, MP Land Revenue Code 1959, MP Panchayat Raj Act 1993, and RFCTLARR 2013 with verified Gazette PDF citations. Full multi-chapter gazette indexing is scheduled for Phase 4.
          </p>
        </div>

        {/* ── Search Input ── */}
        <div className="explore-search-box-wrap">
          <div className="explore-search-input-inner">
            <Search size={18} className="explore-search-icon" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchRulesPlaceholder')}
              className="explore-main-search-input"
              aria-label={t('searchRulesPlaceholder')}
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
        </div>

        {/* ── Quick Rule Jump Chips ── */}
        <div className="quick-jump-strip">
          <span className="quick-jump-label">
            <Sparkles size={12} aria-hidden /> {t('quickRuleJump')}:
          </span>
          <div className="quick-jump-chips">
            {STATUTORY_RULES.slice(0, 7).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickJump(r.ruleNumber)}
                className="quick-jump-btn"
                title={`Inspect ${r.ruleNumber} (${r.topic})`}
              >
                <span>{r.ruleNumber}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter Controls Row ── */}
      <section className="explore-filters-container" aria-label="Filters">
        <div className="filters-grid">
          {/* Category Dropdown */}
          <div className="filter-group">
            <label htmlFor="category-select" className="filter-label">
              <Filter size={12} aria-hidden /> {t('filterByCategory')}
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allCategories')}</option>
              {REGULATION_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'hi' ? c.titleHi : c.titleEn}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="filter-group">
            <label htmlFor="topic-select" className="filter-label">
              <Layers size={12} aria-hidden /> {t('filterByTopic')}
            </label>
            <select
              id="topic-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allTopics')}</option>
              {allTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Document / Act Dropdown */}
          <div className="filter-group">
            <label htmlFor="doc-select" className="filter-label">
              <BookOpen size={12} aria-hidden /> {t('filterByDocument')}
            </label>
            <select
              id="doc-select"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('allDocuments')}</option>
              {allDocuments.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter & Reset */}
        <div className="filters-status-bar">
          <span className="results-count-text">
            <strong>{filteredRules.length}</strong> {t('matchingRulesCount')}
            {(selectedCategory !== 'all' || selectedTopic !== 'all' || selectedDoc !== 'all' || searchQuery) && (
              <span className="filtered-indicator"> (Filtered)</span>
            )}
          </span>

          {(selectedCategory !== 'all' || selectedTopic !== 'all' || selectedDoc !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-ghost btn-xs reset-filters-btn"
            >
              <RefreshCw size={12} aria-hidden />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Statutory Rules List & Cards ── */}
      <section className="explore-rules-section" aria-label="Statutory Rules List">
        {filteredRules.length === 0 ? (
          <div className="explore-no-match-card">
            <BookOpen size={48} className="no-match-icon" aria-hidden />
            <h3>No Statutory Rules Matched</h3>
            <p>
              We could not find rules matching your filter criteria. Try clearing search terms or selecting &ldquo;All Categories&rdquo;.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--space-4)' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="explore-rules-grid" role="list">
            {filteredRules.map((rule) => {
              const ruleTitle = lang === 'hi' && rule.titleHi ? rule.titleHi : rule.titleEn
              const excerpt = lang === 'hi' && rule.originalTextHi ? rule.originalTextHi : rule.originalTextEn

              return (
                <article
                  key={rule.id}
                  className="statutory-rule-card"
                  role="listitem"
                  onClick={() => handleOpenRule(rule)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleOpenRule(rule)
                    }
                  }}
                  aria-label={`Inspect ${rule.ruleNumber}: ${ruleTitle}`}
                >
                  {/* Card Header */}
                  <div className="rule-card-top">
                    <div className="rule-card-badges">
                      <span className="rule-number-badge">
                        {rule.ruleNumber}
                      </span>
                      <span className="rule-type-badge">
                        {rule.documentType.toUpperCase()}
                      </span>
                      <Badge color="green">
                        {rule.category}
                      </Badge>
                      <Badge color="grey">
                        {rule.topic}
                      </Badge>
                    </div>

                    <div className="rule-card-year">
                      {rule.enactmentYear}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="rule-card-title" lang={lang === 'hi' ? 'hi' : 'en'}>
                    {ruleTitle}
                  </h3>

                  {/* Metadata Row: Document Title, Clause & PDF Page */}
                  <div className="rule-card-meta-row">
                    <span className="rule-source-doc">
                      <BookOpen size={12} aria-hidden />
                      {rule.documentTitle}
                    </span>

                    <span className="rule-clause-indicator">
                      {rule.clause}
                      {rule.subclause ? ` (${rule.subclause})` : ''}
                    </span>

                    {rule.pdfPage ? (
                      <span className="rule-pdf-indicator" title={t('pdfPageAnchorSupported')}>
                        <FileText size={12} aria-hidden />
                        {t('pdfPageLabel')} {rule.pdfPage}
                      </span>
                    ) : (
                      <span className="rule-unstamped-indicator">
                        PDF Page: Unstamped
                      </span>
                    )}
                  </div>

                  {/* Preserved Numerical Standards Chips (if applicable) */}
                  {rule.keyNumericalValues && rule.keyNumericalValues.length > 0 && (
                    <div className="rule-card-numerical-strip">
                      {rule.keyNumericalValues.map((nv, idx) => (
                        <span key={idx} className="numerical-mini-pill">
                          <strong>{nv.label}:</strong> {nv.value} {nv.unit || ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Excerpt of Original Legal Text */}
                  <p className="rule-card-excerpt" lang={lang === 'hi' ? 'hi' : 'en'}>
                    &ldquo;{excerpt.length > 170 ? `${excerpt.slice(0, 170)}…` : excerpt}&rdquo;
                  </p>

                  {/* Card Footer Actions */}
                  <div className="rule-card-footer">
                    <button
                      type="button"
                      className="rule-inspect-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenRule(rule)
                      }}
                    >
                      <Scale size={13} aria-hidden />
                      <span>{t('openRuleDetails')}</span>
                    </button>

                    {rule.pdfUrl && (
                      <a
                        href={rule.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rule-pdf-external-link"
                        onClick={(e) => e.stopPropagation()}
                        title={`Open PDF at page ${rule.pdfPage}`}
                      >
                        <span>PDF P.{rule.pdfPage}</span>
                        <ExternalLink size={12} aria-hidden />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Statutory Rule Detail Inspector Modal ── */}
      <RuleDetailModal
        rule={inspectingRule}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default ExploreRegulations
