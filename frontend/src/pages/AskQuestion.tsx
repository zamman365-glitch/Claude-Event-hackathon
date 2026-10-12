/**
 * AskQuestion — Main Q&A Interface for Bhumi Vikas Sahayak.
 * Features:
 * - Prominent natural-language question input
 * - Suggested questions on MP building & land regulations
 * - Responsive answer cards with rule numbers, clauses, PDF pages, and expandable evidence
 * - Clear indicators distinguishing verified vs partial vs needs-verification vs insufficient
 * - Full state handling: Idle/Empty, Loading, Error, No-results, Insufficient-evidence, Success
 * - Navigation links to Explore Regulations and Query History
 */

import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Sparkles, BookOpen, History, Shield, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAsk } from '../hooks/useAsk'
import QuestionInput from '../components/qa/QuestionInput'
import SuggestedQuestions from '../components/qa/SuggestedQuestions'
import AnswerCard from '../components/qa/AnswerCard'
import {
  LoadingStateView,
  EmptyStateView,
  NoResultsStateView,
  InsufficientEvidenceStateView,
  ErrorStateView,
} from '../components/qa/StateViews'

export const AskQuestion = () => {
  const { t } = useLanguage()
  const { state, ask, reset } = useAsk()
  const [searchParams] = useSearchParams()
  const qParam = searchParams.get('q') || ''
  const [currentQuery, setCurrentQuery] = useState(qParam)

  // Check if a query was passed via URL search parameters (e.g. from Explore or History)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      ask(q)
    }
  }, [searchParams, ask])

  const handleSearchSubmit = (questionText: string) => {
    setCurrentQuery(questionText)
    ask(questionText)
  }

  const handleSelectSuggested = (questionText: string) => {
    setCurrentQuery(questionText)
    ask(questionText)
  }

  return (
    <div className="qa-page-wrapper">
      {/* Page Header / Welcome Banner */}
      <section className="qa-hero-header">
        <div className="qa-header-top-row">
          <div className="qa-badge-civic">
            <Shield size={14} aria-hidden />
            <span>MP Building & Land Regulations Corpus</span>
          </div>

          <div className="qa-quick-nav-links">
            <Link to="/regulations" className="qa-header-link">
              <BookOpen size={14} aria-hidden />
              <span>{t('exploreRegulations')}</span>
            </Link>
            <Link to="/history" className="qa-header-link">
              <History size={14} aria-hidden />
              <span>{t('queryHistory')}</span>
            </Link>
          </div>
        </div>

        <h1 className="qa-main-heading">{t('qaTitle')}</h1>
        <p className="qa-main-subheading">{t('qaSubtitle')}</p>
      </section>

      {/* Prominent Natural Language Input */}
      <section className="qa-input-section" aria-label="Question Input Section">
        <QuestionInput
          onSubmit={handleSearchSubmit}
          isLoading={state.status === 'loading'}
          initialValue={currentQuery}
        />
      </section>

      {/* Suggested Questions Section */}
      <section className="qa-suggested-section" aria-label="Suggested Questions">
        <SuggestedQuestions onSelect={handleSelectSuggested} />
      </section>

      {/* Answer & States Display Area */}
      <section className="qa-results-container" aria-live="polite">
        {state.status === 'idle' && (
          <EmptyStateView />
        )}

        {state.status === 'loading' && (
          <LoadingStateView />
        )}

        {state.status === 'error' && (
          <ErrorStateView
            message={state.message}
            onRetry={() => currentQuery && ask(currentQuery)}
          />
        )}

        {state.status === 'no-results' && (
          <NoResultsStateView
            query={state.query}
            onReset={reset}
          />
        )}

        {state.status === 'insufficient-evidence' && (
          <InsufficientEvidenceStateView
            answer={state.answer}
            onReset={reset}
          />
        )}

        {state.status === 'success' && (
          <div className="qa-answer-wrapper">
            <AnswerCard
              answer={state.answer}
              onAskAnother={reset}
            />
          </div>
        )}
      </section>

      {/* Bottom Regulatory Cross-reference Strip */}
      <section className="qa-bottom-info-strip">
        <div className="bottom-info-left">
          <Sparkles size={18} className="bottom-info-sparkle" aria-hidden />
          <div className="bottom-info-text">
            <strong>Supported Statutory Acts: </strong>
            <span>
              MP Bhumi Vikas Niyam 2012, MP Land Revenue Code 1959, MP Panchayat Raj Adhiniyam 1993, RFCTLARR Act 2013
            </span>
          </div>
        </div>

        <Link to="/regulations" className="bottom-info-cta">
          <span>{t('exploreRegulations')}</span>
          <ArrowRight size={14} aria-hidden />
        </Link>
      </section>
    </div>
  )
}

export default AskQuestion
