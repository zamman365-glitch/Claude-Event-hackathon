/**
 * AnswerCard — Comprehensive answer card component.
 * Displays statutory explanation, legal takeaway, cited clauses,
 * evidence level badge, expandable source evidence, and disclaimers.
 */

import { useState } from 'react'
import { Copy, Check, Info, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
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
      const disclaimer = answer.disclaimer ? `\n\nNotice: ${answer.disclaimer}` : ''

      const fullCopy = `Q: ${answer.question}\n\nAnswer:\n${displayText}${summaryText}${rulesBlock}${disclaimer}`
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

  return (
    <article className={`answer-card-container ${className}`} aria-labelledby="answer-question-title">
      {/* Top Banner / Question Header */}
      <div className="answer-card-header">
        <div className="answer-header-top">
          <div className="answer-tag-group">
            <EvidenceLevelBadge level={answer.evidenceLevel} />
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
            lang={lang === 'hi' ? 'hi' : 'en'}
          >
            {displayText}
          </div>
        </div>

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
