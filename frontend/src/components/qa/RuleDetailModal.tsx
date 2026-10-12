/**
 * RuleDetailModal — Modal dialog to inspect a statutory rule in complete detail.
 * Displays:
 * - Clause and subclause (handling missing metadata honestly)
 * - Source document title, enactment year, issuing authority
 * - PDF page references with direct page jump when supported
 * - Key numerical values and units
 * - Verbatim original statutory text in English and Hindi
 * - Direct action to query the Q&A assistant about this rule
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  ExternalLink,
  BookOpen,
  Calendar,
  Copy,
  Check,
  MessageSquare,
  Scale,
  Hash,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import type { StatutoryRule } from '../../types'
import { useLanguage } from '../../context/LanguageContext'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import Architectural3DViewer from '../visuals/Architectural3DViewer'
import type { SpatialScenarioKey } from '../visuals/IsometricFallback'

const SPATIAL_RULE_MAP: Record<string, SpatialScenarioKey> = {
  'rule-bvn-14-3': 'setback',
  'rule-bvn-44-tab7': 'far',
  'rule-bvn-52-1a': 'water',
  'rule-irrigation-27b': 'canal',
}

interface RuleDetailModalProps {
  rule: StatutoryRule | null
  open: boolean
  onClose: () => void
}

export const RuleDetailModal = ({ rule, open, onClose }: RuleDetailModalProps) => {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [textLang, setTextLang] = useState<'en' | 'hi'>(lang === 'hi' ? 'hi' : 'en')

  if (!rule) return null

  const spatialScenario = SPATIAL_RULE_MAP[rule.id]

  const handleCopyCitation = async () => {
    const citation = `${rule.documentTitle}, ${rule.ruleNumber} (${rule.clause}${rule.subclause ? `, ${rule.subclause}` : ''})${rule.pdfPage ? `, PDF Page ${rule.pdfPage}` : ''}.\n\nStatutory Text:\n${rule.originalTextEn}`
    try {
      await navigator.clipboard.writeText(citation)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore if clipboard access fails
    }
  }

  const handleAskAboutRule = () => {
    onClose()
    navigate(`/qa?q=${encodeURIComponent(`What does ${rule.ruleNumber} of ${rule.documentTitle} require?`)}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${rule.ruleNumber} — Statutory Rule Details`}
      size="lg"
    >
      <div className="rule-detail-container">
        {/* Top Header Tags */}
        <div className="rule-detail-tags-row">
          <Badge color="green" showDot>
            {rule.category}
          </Badge>
          <Badge color="grey">
            {rule.topic}
          </Badge>
          <Badge color={rule.status === 'active' ? 'green' : 'orange'}>
            Status: {rule.status.toUpperCase()}
          </Badge>
          <span className="rule-enactment-year">
            <Calendar size={13} aria-hidden /> Enacted: {rule.enactmentYear}
          </span>
        </div>

        {/* Rule Titles */}
        <div className="rule-detail-heading-block">
          <h3 className="rule-detail-title-en">{rule.titleEn}</h3>
          {rule.titleHi && (
            <p className="rule-detail-title-hi" lang="hi">
              {rule.titleHi}
            </p>
          )}
        </div>

        {/* Metadata Matrix Card */}
        <div className="rule-meta-grid">
          <div className="rule-meta-item">
            <span className="rule-meta-label">
              <BookOpen size={13} aria-hidden /> Source Document
            </span>
            <strong className="rule-meta-value">{rule.documentTitle}</strong>
          </div>

          <div className="rule-meta-item">
            <span className="rule-meta-label">
              <Hash size={13} aria-hidden /> Clause & Subclause
            </span>
            <div className="rule-meta-clause-group">
              <span className="rule-clause-pill">{rule.clause}</span>
              {rule.subclause ? (
                <span className="rule-subclause-pill">{rule.subclause}</span>
              ) : (
                <span className="rule-missing-metadata" title="No separate subclause designated in primary statute text">
                  Subclause: Not specified in statute
                </span>
              )}
            </div>
          </div>

          <div className="rule-meta-item">
            <span className="rule-meta-label">
              <FileCheck size={13} aria-hidden /> Document Type
            </span>
            <span className="rule-meta-value rule-doctype-badge">
              {rule.documentType.toUpperCase()}
            </span>
          </div>

          <div className="rule-meta-item">
            <span className="rule-meta-label">
              <Scale size={13} aria-hidden /> Competent Authority
            </span>
            <span className="rule-meta-value">
              {rule.authority || 'State Revenue / Local Planning Authority'}
            </span>
          </div>
        </div>

        {/* PDF Page Reference & Direct Jump */}
        <div className="rule-pdf-action-card">
          <div className="pdf-card-left">
            <div className="pdf-icon-wrap" aria-hidden>
              <FileText size={20} />
            </div>
            <div>
              <div className="pdf-page-indicator">
                {rule.pdfPage ? (
                  <>Official Gazette / Document Page: <strong>Page {rule.pdfPage}</strong></>
                ) : (
                  <span className="rule-missing-metadata">
                    <AlertCircle size={12} /> Page number not stamped in source digital index
                  </span>
                )}
              </div>
              <p className="pdf-page-note">
                {rule.pdfUrl
                  ? 'Technically supported direct browser jump to target PDF page (#page anchor).'
                  : 'Direct page anchor unsupported by host server; reference page manually in portal.'}
              </p>
            </div>
          </div>

          {rule.pdfUrl && (
            <a
              href={rule.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm pdf-open-btn"
            >
              <span>Open PDF Page {rule.pdfPage}</span>
              <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </div>

        {/* Numerical Values & Statutory Units (if applicable) */}
        {rule.keyNumericalValues && rule.keyNumericalValues.length > 0 && (
          <div className="rule-numerical-section">
            <h4 className="section-label-small">Preserved Numerical Standards & Statutory Units</h4>
            <div className="numerical-chips-grid">
              {rule.keyNumericalValues.map((num, i) => (
                <div key={i} className="numerical-chip-card">
                  <span className="num-chip-label">{num.label}</span>
                  <div className="num-chip-val-row">
                    <span className="num-chip-val">{num.value}</span>
                    {num.unit && <span className="num-chip-unit">{num.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3D Architectural Spatial Envelope Preview (Phase 6) */}
        {spatialScenario && (
          <div className="rule-spatial-3d-modal-section" style={{ marginTop: 'var(--space-4)' }}>
            <h4 className="section-label-small" style={{ marginBottom: 'var(--space-2)' }}>
              🏛️ 3D Architectural Spatial Envelope Preview
            </h4>
            <Architectural3DViewer
              initialScenario={spatialScenario}
              compact={true}
              showControls={true}
            />
          </div>
        )}

        {/* Statutory Conditions & Thresholds (if present) */}
        {rule.conditions && rule.conditions.length > 0 && (
          <div className="rule-conditions-section">
            <h4 className="section-label-small">Mandatory Statutory Conditions & Thresholds</h4>
            <ul className="rule-conditions-list">
              {rule.conditions.map((cond, idx) => (
                <li key={idx} className="rule-condition-item">
                  <span className="condition-bullet">•</span>
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Statutory Schedule / Table Context (if present) */}
        {rule.statutoryTable && (
          <div className="rule-table-section">
            <h4 className="section-label-small">{rule.statutoryTable.title}</h4>
            <div className="statutory-table-wrapper">
              <table className="statutory-table">
                <thead>
                  <tr>
                    {rule.statutoryTable.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rule.statutoryTable.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verbatim Statutory Text */}
        <div className="rule-original-text-section">
          <div className="original-text-header">
            <h4 className="section-label-small">Original Statutory Text (Verbatim Legal Excerpt)</h4>
            <div className="text-lang-toggle" role="group" aria-label="Text Language Selection">
              <button
                type="button"
                className={`text-lang-btn ${textLang === 'en' ? 'active' : ''}`}
                onClick={() => setTextLang('en')}
              >
                English
              </button>
              {rule.originalTextHi && (
                <button
                  type="button"
                  className={`text-lang-btn ${textLang === 'hi' ? 'active' : ''}`}
                  onClick={() => setTextLang('hi')}
                >
                  हिन्दी
                </button>
              )}
            </div>
          </div>

          <blockquote
            className="rule-verbatim-blockquote"
            lang={textLang}
          >
            {textLang === 'hi' && rule.originalTextHi
              ? rule.originalTextHi
              : rule.originalTextEn}
          </blockquote>
        </div>

        {/* Applicability */}
        <div className="rule-applicability-box">
          <span className="applicability-label">Scope of Statutory Applicability:</span>
          <p className="applicability-text">{rule.applicability}</p>
        </div>

        {/* Action Buttons */}
        <div className="rule-detail-footer-actions">
          <button
            type="button"
            onClick={handleCopyCitation}
            className="btn btn-secondary btn-sm"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Citation Copied!' : 'Copy Legal Citation'}</span>
          </button>

          <button
            type="button"
            onClick={handleAskAboutRule}
            className="btn btn-accent btn-sm"
          >
            <MessageSquare size={14} />
            <span>Ask Q&A Assistant About This Rule</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default RuleDetailModal
