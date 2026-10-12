/**
 * StateViews — Reusable views for Loading, Empty, No-results,
 * Insufficient-evidence, and Error states in the Q&A interface.
 */

import { useState } from 'react'
import { BookOpen, SearchX, AlertOctagon, RefreshCw, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react'
import type { QAAnswer } from '../../types'
import { useLanguage } from '../../context/LanguageContext'
import Skeleton from '../common/Skeleton'
import EvidenceLevelBadge from './EvidenceLevelBadge'
import Alert from '../common/Alert'

// ── 1. Loading State View ──────────────────────────────────────
export const LoadingStateView = () => {
  const { t } = useLanguage()

  return (
    <div className="qa-loading-view" role="status" aria-live="polite">
      <div className="qa-loading-banner">
        <div className="qa-loading-spinner-ring" />
        <div className="qa-loading-text-group">
          <h3 className="qa-loading-title">{t('loadingTitle')}</h3>
          <p className="qa-loading-desc">{t('loadingDesc')}</p>
        </div>
      </div>

      <div className="skeleton-answer-card">
        <div className="skeleton-card-header">
          <Skeleton width="180px" height="24px" rounded="full" />
          <Skeleton width="120px" height="20px" rounded="md" />
        </div>
        <div className="skeleton-card-body">
          <Skeleton width="80%" height="28px" rounded="md" />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Skeleton lines={4} />
          </div>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Skeleton width="100%" height="90px" rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const EmptyStateView = () => {
  const { t } = useLanguage()

  return (
    <div className="qa-empty-view">
      <div className="qa-empty-hero-card">
        <div className="qa-empty-icon-wrap" aria-hidden>
          <BookOpen size={36} className="qa-empty-main-icon" />
        </div>

        <h3 className="qa-empty-title">{t('emptyTitle')}</h3>
        <p className="qa-empty-desc">{t('emptyDesc')}</p>

        <div className="qa-empty-features-row">
          <div className="qa-feature-pill">
            <ShieldCheck size={16} className="qa-pill-icon-green" aria-hidden />
            <span>Direct Statutory Citations</span>
          </div>
          <div className="qa-feature-pill">
            <Sparkles size={16} className="qa-pill-icon-orange" aria-hidden />
            <span>Verbatim Legal Evidence Excerpts</span>
          </div>
          <div className="qa-feature-pill">
            <AlertTriangle size={16} className="qa-pill-icon-blue" aria-hidden />
            <span>Clear Verification Indicators</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 3. No Results State View ───────────────────────────────────
interface NoResultsStateViewProps {
  query?: string
  onReset?: () => void
}

export const NoResultsStateView = ({ query, onReset }: NoResultsStateViewProps) => {
  const { t } = useLanguage()

  return (
    <div className="qa-state-view qa-state-no-results" role="alert">
      <div className="qa-state-icon-box">
        <SearchX size={36} className="qa-icon-amber" />
      </div>

      <div className="qa-state-content">
        <h3 className="qa-state-title">{t('noResultsTitle')}</h3>
        {query && (
          <p className="qa-state-query-echo">
            Query: &ldquo;{query}&rdquo;
          </p>
        )}
        <p className="qa-state-desc">{t('noResultsDesc')}</p>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn btn-secondary btn-sm qa-state-btn"
          >
            <RefreshCw size={14} aria-hidden />
            <span>{t('retryQuery')}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── 4. Insufficient Evidence State View ────────────────────────
interface InsufficientEvidenceStateViewProps {
  answer: QAAnswer
  onReset?: () => void
}

export const InsufficientEvidenceStateView = ({
  answer,
  onReset,
}: InsufficientEvidenceStateViewProps) => {
  const { t } = useLanguage()

  return (
    <div className="qa-state-view qa-state-insufficient" role="alert">
      <div className="qa-state-header-band">
        <EvidenceLevelBadge level="insufficient" />
        <span className="qa-state-timestamp">
          {new Date(answer.generatedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="qa-insufficient-body">
        <div className="qa-insufficient-icon-circle" aria-hidden>
          <AlertOctagon size={32} />
        </div>

        <div className="qa-insufficient-text-block">
          <h3 className="qa-state-title">{t('insufficientTitle')}</h3>
          <p className="qa-state-query-echo">
            Question: &ldquo;{answer.question}&rdquo;
          </p>
          <p className="qa-state-desc">{t('insufficientDesc')}</p>

          {answer.disclaimer && (
            <div className="qa-advisory-note">
              <strong>Advisory: </strong>
              <span>{answer.disclaimer}</span>
            </div>
          )}
        </div>
      </div>

      <div className="qa-insufficient-footer">
        <span className="qa-insufficient-guidance">
          Tip: Try searching for broader terms like &ldquo;setback&rdquo;, &ldquo;FAR&rdquo;, or &ldquo;building permit&rdquo;.
        </span>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} aria-hidden />
            <span>{t('retryQuery')}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── 5. Error State View ────────────────────────────────────────
interface ErrorStateViewProps {
  message: string
  onRetry?: () => void
}

export const ErrorStateView = ({ message, onRetry }: ErrorStateViewProps) => {
  const { t } = useLanguage()

  return (
    <div className="qa-state-error-wrapper">
      <Alert type="error" title={t('error')}>
        <p>{message}</p>
        {onRetry && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-secondary btn-xs"
            >
              <RefreshCw size={12} aria-hidden />
              <span>{t('retry')}</span>
            </button>
          </div>
        )}
      </Alert>
    </div>
  )
}

// ── 6. Needs Info State View ───────────────────────────────────
interface NeedsInfoStateViewProps {
  originalQuestion: string
  clarifyingQuestion: string
  onSubmitFollowUp: (followUp: string) => void
  onReset?: () => void
  isLoading?: boolean
}

export const NeedsInfoStateView = ({
  originalQuestion,
  clarifyingQuestion,
  onSubmitFollowUp,
  onReset,
  isLoading = false,
}: NeedsInfoStateViewProps) => {
  const { t, lang } = useLanguage()
  const [followUpText, setFollowUpText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (followUpText.trim()) {
      onSubmitFollowUp(followUpText.trim())
    }
  }

  return (
    <div className="qa-state-view qa-state-needs-info" role="region" aria-label="Clarification needed">
      <div className="qa-state-header-band">
        <EvidenceLevelBadge level="needs-verification" />
        <span className="qa-state-timestamp">
          {lang === 'hi' ? 'अतिरिक्त विवरण आवश्यक' : 'Clarification Required'}
        </span>
      </div>

      <div className="qa-needs-info-body">
        <div className="qa-needs-info-icon-circle" aria-hidden>
          <HelpCircle size={32} />
        </div>

        <div className="qa-needs-info-text-block">
          <h3 className="qa-state-title">
            {lang === 'hi' ? 'विनियम निर्धारण हेतु अतिरिक्त जानकारी आवश्यक' : 'Additional Information Required'}
          </h3>

          <p className="qa-state-query-echo">
            <strong>Question:</strong> &ldquo;{originalQuestion}&rdquo;
          </p>

          <div className="qa-clarifying-question-card">
            <div className="qa-clarifying-label">
              <Sparkles size={16} />
              <strong>{lang === 'hi' ? 'स्पष्टीकरण प्रश्न:' : 'Clarifying Question:'}</strong>
            </div>
            <p className="qa-clarifying-question-text">{clarifyingQuestion}</p>
          </div>

          <form onSubmit={handleSubmit} className="qa-follow-up-form">
            <label htmlFor="follow-up-input" className="qa-follow-up-label">
              {lang === 'hi'
                ? 'लागू नियम व गणना हेतु छूटा हुआ विवरण दर्ज करें:'
                : 'Enter missing parameters to compute exact statutory rule & setbacks:'}
            </label>
            <div className="qa-follow-up-input-row">
              <input
                id="follow-up-input"
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder={
                  lang === 'hi'
                    ? 'उदा. सड़क की चौड़ाई 12 मी, प्लॉट क्षेत्रफल 200 वर्गमीटर...'
                    : 'e.g., Road width is 12m, plot area 200 sqm, residential...'
                }
                className="qa-follow-up-input"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm qa-follow-up-submit-btn"
                disabled={!followUpText.trim() || isLoading}
              >
                <span>{lang === 'hi' ? 'विवरण सबमिट करें' : 'Submit & Re-verify'}</span>
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </form>
        </div>
      </div>

      {onReset && (
        <div className="qa-needs-info-footer">
          <button
            type="button"
            onClick={onReset}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} aria-hidden />
            <span>{t('retryQuery')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
