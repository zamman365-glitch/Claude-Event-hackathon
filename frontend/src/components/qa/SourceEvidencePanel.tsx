/**
 * SourceEvidencePanel — Expandable source evidence component.
 * Displays rule numbers, clauses, source documents, PDF pages,
 * external official links, and verbatim original supporting text.
 * Allows one-click transition to inspect full rule in the Explore Regulations registry
 * or open corresponding PDF page when technically supported.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  BookOpen,
  Quote,
  Scale,
} from 'lucide-react'
import type { SourceEvidence } from '../../types'
import { useLanguage } from '../../context/LanguageContext'

interface SourceEvidencePanelProps {
  evidence: SourceEvidence[]
  defaultExpanded?: boolean
  className?: string
}

export const SourceEvidencePanel = ({
  evidence,
  defaultExpanded = true,
  className = '',
}: SourceEvidencePanelProps) => {
  const { t } = useLanguage()
  const [isPanelOpen, setIsPanelOpen] = useState(defaultExpanded)
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>(() => {
    // Open the highest relevance item by default
    const initial: Record<string, boolean> = {}
    if (evidence.length > 0) {
      initial[evidence[0].id] = true
    }
    return initial
  })

  if (!evidence || evidence.length === 0) {
    return null
  }

  const toggleItem = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleAll = () => {
    if (isPanelOpen) {
      setIsPanelOpen(false)
    } else {
      setIsPanelOpen(true)
      const all: Record<string, boolean> = {}
      evidence.forEach((ev) => {
        all[ev.id] = true
      })
      setExpandedItemIds(all)
    }
  }

  return (
    <div className={`evidence-panel-container ${className}`}>
      {/* Panel Header */}
      <div className="evidence-panel-header">
        <div className="evidence-header-title">
          <BookOpen size={18} className="evidence-header-icon" aria-hidden />
          <span className="evidence-header-text">{t('sourceEvidenceTitle')}</span>
          <span className="evidence-count-pill">{evidence.length}</span>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="evidence-toggle-btn"
          aria-expanded={isPanelOpen}
          aria-controls="evidence-list-content"
        >
          <span>{isPanelOpen ? t('hideEvidence') : t('showEvidence')}</span>
          {isPanelOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </button>
      </div>

      {/* Panel Body */}
      {isPanelOpen && (
        <div id="evidence-list-content" className="evidence-list" role="region" aria-label={t('sourceEvidenceTitle')}>
          {evidence.map((item, index) => {
            const isItemExpanded = !!expandedItemIds[item.id]
            const targetPdfLink = item.pdfUrl || (item.pdfPage && item.officialUrl ? `${item.officialUrl}#page=${item.pdfPage}` : item.officialUrl)
            const registrySearchParam = encodeURIComponent(item.ruleNumber || item.clauseRef)

            return (
              <div key={item.id} className="evidence-item-card">
                {/* Evidence Item Header */}
                <div
                  className="evidence-item-header"
                  onClick={() => toggleItem(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleItem(item.id)
                    }
                  }}
                  aria-expanded={isItemExpanded}
                >
                  <div className="evidence-item-meta">
                    <span className="evidence-index">#{index + 1}</span>

                    <div className="evidence-titles">
                      <div className="evidence-doc-title">
                        <FileText size={14} aria-hidden />
                        <strong>{item.documentTitle}</strong>
                        {item.year && <span className="evidence-year">({item.year})</span>}
                      </div>

                      <div className="evidence-clause-row">
                        <span className="evidence-clause-tag">
                          {item.clauseRef}
                        </span>

                        {item.subclause && (
                          <span className="evidence-subclause-tag">
                            {item.subclause}
                          </span>
                        )}

                        {item.ruleNumber && (
                          <span className="evidence-rule-tag">
                            {item.ruleNumber}
                          </span>
                        )}

                        {item.pdfPage ? (
                          <span className="evidence-page-tag" title={t('pdfPageAnchorSupported')}>
                            {t('pdfPageLabel')} {item.pdfPage}
                          </span>
                        ) : (
                          <span className="evidence-missing-page-tag" title="Page number not stamped in digital gazette">
                            Page: Unstamped
                          </span>
                        )}

                        <span className="evidence-type-tag">
                          {item.documentType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="evidence-item-actions">
                    <button
                      type="button"
                      className="evidence-item-toggle"
                      aria-label={isItemExpanded ? 'Collapse item' : 'Expand item'}
                      tabIndex={-1}
                    >
                      {isItemExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Verbatim Content */}
                {isItemExpanded && (
                  <div className="evidence-item-content">
                    <div className="evidence-original-box">
                      <div className="evidence-original-label">
                        <Quote size={13} aria-hidden />
                        <span>{t('originalTextLabel')}</span>
                      </div>

                      <blockquote
                        className="evidence-quote"
                        lang={item.textLanguage === 'hi' ? 'hi' : 'en'}
                      >
                        {item.originalText}
                      </blockquote>
                    </div>

                    <div className="evidence-footer-row">
                      <div className="evidence-relevance">
                        <span>{t('relevanceScore')}:</span>
                        <div className="evidence-relevance-bar" title={`${Math.round(item.relevanceScore * 100)}% Match`}>
                          <div
                            className="evidence-relevance-fill"
                            style={{ width: `${Math.round(item.relevanceScore * 100)}%` }}
                          />
                        </div>
                        <span className="evidence-relevance-num">
                          {Math.round(item.relevanceScore * 100)}%
                        </span>
                      </div>

                      <div className="evidence-action-links">
                        {/* Transition directly to explore regulations registry */}
                        <Link
                          to={`/regulations?q=${registrySearchParam}`}
                          className="evidence-registry-link"
                          onClick={(e) => e.stopPropagation()}
                          title="Inspect rule metadata, numerical standards, and verbatim text in registry"
                        >
                          <Scale size={13} aria-hidden />
                          <span>{t('viewFullRuleInRegistry')}</span>
                        </Link>

                        {/* Open PDF page when technically supported */}
                        {targetPdfLink && (
                          <a
                            href={targetPdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-portal-link"
                            onClick={(e) => e.stopPropagation()}
                            title={item.pdfPage ? `Open PDF at page ${item.pdfPage}` : 'Open official document portal'}
                          >
                            <span>
                              {item.pdfPage ? `${t('openPdfPage')} ${item.pdfPage}` : t('officialDocLink')}
                            </span>
                            <ExternalLink size={12} aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SourceEvidencePanel
