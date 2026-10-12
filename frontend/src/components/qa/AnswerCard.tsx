/**
 * AnswerCard — Comprehensive answer card component.
 * Displays statutory explanation, legal takeaway, cited clauses,
 * evidence level badge, expandable source evidence, disclaimers,
 * rules_version, warnings[], and calculation (front_open_space, rear_open_space, far, fees).
 */

import { useState } from 'react'
import {
  Copy,
  Check,
  Info,
  Sparkles,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Calculator,
} from 'lucide-react'
import type { QAAnswer } from '../../types'
import { useLanguage } from '../../context/LanguageContext'
import EvidenceLevelBadge from './EvidenceLevelBadge'
import SourceEvidencePanel from './SourceEvidencePanel'
import Badge from '../common/Badge'

interface AnswerCardProps {
  answer: QAAnswer
  onAskAnother?: () => void
  className?: string
}

export const AnswerCard = ({ answer, onAskAnother, className = '' }: AnswerCardProps) => {
  const { t, lang } = useLanguage()
  const [copied, setCopied] = useState(false)

  // Use Hindi answer text if available and current app language is Hindi
  const displayText =
    lang === 'hi' && answer.answerTextHi ? answer.answerTextHi : answer.answerText

  const handleCopy = async () => {
    try {
      const summaryText = answer.legalSummary ? `\n\nLegal Takeaway: ${answer.legalSummary}` : ''
      const citedRules = answer.evidence.map((e) => `• ${e.documentTitle} (${e.clauseRef})`).join('\n')
      const rulesBlock = citedRules ? `\n\nCited Sources:\n${citedRules}` : ''
      const warningsBlock =
        answer.warnings && answer.warnings.length > 0
          ? `\n\nWarnings:\n${answer.warnings.map((w) => `⚠ ${w}`).join('\n')}`
          : ''
      const disclaimer = answer.disclaimer ? `\n\nNotice: ${answer.disclaimer}` : ''

      const fullCopy = `Q: ${answer.question}\n\nAnswer:\n${displayText}${summaryText}${rulesBlock}${warningsBlock}${disclaimer}`
      await navigator.clipboard.writeText(fullCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      // Fallback if clipboard API restricted
    }
  }

  // Extract all cited clauses/rules for high-level pills
  const citedRulesList = answer.evidence
    .map((e) => e.ruleNumber || e.clauseRef)
    .filter(Boolean)

  const calc = answer.calculation

  return (
    <article className={`answer-card-container ${className}`} aria-labelledby="answer-question-title">
      {/* Top Banner / Question Header */}
      <div className="answer-card-header">
        <div className="answer-header-top">
          <div className="answer-tag-group">
            <EvidenceLevelBadge level={answer.evidenceLevel} />
            {answer.rules_version && (
              <Badge color="blue">
                {answer.rules_version}
              </Badge>
            )}
            {answer.isMockData && (
              <Badge color="orange" showDot>
                DEMO / MOCK CORPUS
              </Badge>
            )}
            {answer.categories.map((cat) => (
              <Badge key={cat} color="grey">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="answer-header-actions">
            <button
              type="button"
              onClick={handleCopy}
              className="answer-action-btn"
              title={t('copyAnswer')}
              aria-label={t('copyAnswer')}
            >
              {copied ? <Check size={14} className="action-success-icon" /> : <Copy size={14} />}
              <span>{copied ? t('copied') : t('copyAnswer')}</span>
            </button>
          </div>
        </div>

        {/* User Question Asked */}
        <h2 id="answer-question-title" className="answer-question-heading">
          <span className="question-prefix">Q:</span>
          <span>{answer.question}</span>
        </h2>

        {/* Cited Rules Summary Pills */}
        {citedRulesList.length > 0 && (
          <div className="answer-rules-pills-row">
            <span className="rules-pills-label">{t('ruleClausesLabel')}:</span>
            <div className="rules-pills-list">
              {citedRulesList.map((rule, idx) => (
                <span key={`${rule}-${idx}`} className="rule-pill">
                  {rule}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Answer Body */}
      <div className="answer-card-body">
        {/* Post-Consolidation Amendment Warnings */}
        {answer.warnings && answer.warnings.length > 0 && (
          <div className="answer-warnings-box" role="alert">
            <div className="answer-warnings-header">
              <AlertTriangle size={16} className="warning-icon" aria-hidden />
              <strong>
                {lang === 'hi' ? 'संशोधन व वैधानिक चेतावनी' : 'Statutory & Amendment Warnings'} ({answer.warnings.length})
              </strong>
            </div>
            <ul className="answer-warnings-list">
              {answer.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Legal Rule Callout (if available) */}
        {answer.legalSummary && (
          <div className="legal-summary-box">
            <div className="legal-summary-header">
              <Sparkles size={16} className="legal-summary-icon" aria-hidden />
              <strong>{t('legalSummaryLabel')}</strong>
            </div>
            <p className="legal-summary-text">{answer.legalSummary}</p>
          </div>
        )}

        {/* Detailed Explanation */}
        <div className="answer-explanation-box">
          <h3 className="explanation-section-title">{t('explanationLabel')}</h3>
          <div
            className="explanation-content-text"
            style={{ whiteSpace: 'pre-wrap' }}
            lang={lang === 'hi' ? 'hi' : 'en'}
          >
            {displayText}
          </div>
        </div>

        {/* Calculations Section */}
        {calc && (calc.front_open_space || calc.rear_open_space || calc.far || calc.fees) && (
          <div className="answer-calculation-section">
            <h3 className="explanation-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={16} aria-hidden />
              <span>{lang === 'hi' ? 'वैधानिक गणना मानक' : 'Statutory Calculations & Prescribed Limits'}</span>
            </h3>

            <div className="calculation-cards-grid">
              {calc.front_open_space && (
                <div className="calculation-card">
                  <div className="calculation-card-title">
                    {lang === 'hi' ? 'सामने का खुला स्थान (Front Setback)' : 'Front Open Space (Setback)'}
                  </div>
                  <div className="calculation-primary-val">
                    {calc.front_open_space.front_open_space_m} m
                  </div>
                  <div className="calculation-meta-row">
                    <span>Road: {calc.front_open_space.street_width_m} m</span>
                    <span>Height: {calc.front_open_space.building_height_m} m</span>
                  </div>
                  <div className="calculation-subtext">
                    Slab: {calc.front_open_space.slab_label} • Rule {calc.front_open_space.rule} (p. {calc.front_open_space.page})
                  </div>
                </div>
              )}

              {calc.rear_open_space && (
                <div className="calculation-card">
                  <div className="calculation-card-title">
                    {lang === 'hi' ? 'पीछे का खुला स्थान (Rear Setback)' : 'Rear Open Space (Setback)'}
                  </div>
                  <div className="calculation-primary-val">
                    {calc.rear_open_space.rear_open_space_m} m
                  </div>
                  <div className="calculation-meta-row">
                    <span>Plot Area: {calc.rear_open_space.plot_area_sqm} m²</span>
                  </div>
                  <div className="calculation-subtext">
                    Slab: {calc.rear_open_space.slab_label} • Rule {calc.rear_open_space.rule} (p. {calc.rear_open_space.page})
                  </div>
                </div>
              )}

              {calc.far && (
                <div className="calculation-card">
                  <div className="calculation-card-title">
                    {lang === 'hi' ? 'तल क्षेत्र अनुपात (FAR)' : 'Floor Area Ratio (FAR)'}
                  </div>
                  <div className="calculation-primary-val">
                    {calc.far.far}
                  </div>
                  <div className="calculation-meta-row">
                    <span>Use: {calc.far.use_group}</span>
                    <span>Cat: {calc.far.category}</span>
                  </div>
                  {calc.far.max_builtup_area_sqm != null && (
                    <div className="calculation-subtext">
                      Max Built-up: {calc.far.max_builtup_area_sqm} m²
                    </div>
                  )}
                  <div className="calculation-subtext">
                    Rule {calc.far.rule} (p. {calc.far.page})
                  </div>
                </div>
              )}

              {calc.fees && (
                <div className="calculation-card">
                  <div className="calculation-card-title">
                    {lang === 'hi' ? 'भवन अनुज्ञा शुल्क' : 'Building Permission Fees'}
                  </div>
                  <div className="calculation-primary-val">
                    ₹{calc.fees.total_fee_rs.toLocaleString()}
                  </div>
                  <div className="calculation-meta-row">
                    <span>App: ₹{calc.fees.application_fee_rs.toLocaleString()}</span>
                    <span>Perm: ₹{calc.fees.permission_fee_rs.toLocaleString()}</span>
                    {calc.fees.commercial_surcharge_rs ? (
                      <span>Surch: ₹{calc.fees.commercial_surcharge_rs.toLocaleString()}</span>
                    ) : null}
                  </div>
                  <div className="calculation-subtext">
                    Built-up: {calc.fees.built_up_area_sqm} m² • {calc.fees.use_group} • Rule {calc.fees.rule} (p. {calc.fees.page})
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expandable Source Evidence Section */}
        <SourceEvidencePanel evidence={answer.evidence} defaultExpanded={true} />

        {/* Disclaimer / Notice Callout */}
        {answer.disclaimer && (
          <div className="answer-disclaimer-box" role="note">
            <div className="disclaimer-header">
              {answer.evidenceLevel === 'needs-verification' ? (
                <AlertCircle size={15} className="disclaimer-icon-warning" aria-hidden />
              ) : (
                <Info size={15} className="disclaimer-icon-info" aria-hidden />
              )}
              <strong>{t('disclaimerLabel')}</strong>
            </div>
            <p className="disclaimer-text">{answer.disclaimer}</p>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="answer-card-footer">
        <div className="footer-notice-text">
          <span>{answer.isMockData ? t('mockDataNotice') : t('verifiedCorpusNotice')}</span>
        </div>

        {onAskAnother && (
          <button
            type="button"
            onClick={onAskAnother}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} aria-hidden />
            <span>{t('newQuestion')}</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default AnswerCard
