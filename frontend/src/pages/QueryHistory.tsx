/**
 * QueryHistory — History of queries asked during the session.
 * Displays questions, timestamps, evidence level indicators,
 * categories, and allows one-click re-running of queries.
 */

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { History, MessageSquare, BookOpen, Clock, ArrowRight, RefreshCw, Trash2 } from 'lucide-react'
import { qaService } from '../services/qaService'
import { useLanguage } from '../context/LanguageContext'
import type { QueryHistoryEntry } from '../types'
import EvidenceLevelBadge from '../components/qa/EvidenceLevelBadge'
import Badge from '../components/common/Badge'

export const QueryHistory = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [historyItems, setHistoryItems] = useState<QueryHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    qaService.getHistory().then((items) => {
      if (mounted) {
        setHistoryItems(items)
        setIsLoading(false)
      }
    }).catch(() => {
      if (mounted) setIsLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [])

  const handleReask = (question: string) => {
    navigate(`/qa?q=${encodeURIComponent(question)}`)
  }

  const handleClearHistory = () => {
    setHistoryItems([])
  }

  return (
    <div className="history-page-wrapper">
      {/* Header */}
      <section className="history-hero-header">
        <div className="history-header-top-row">
          <div className="history-badge-civic">
            <History size={14} aria-hidden />
            <span>Session Audit Trail</span>
          </div>

          <div className="history-nav-links">
            <Link to="/qa" className="history-header-link">
              <MessageSquare size={14} aria-hidden />
              <span>{t('askQuestion')}</span>
            </Link>
            <Link to="/regulations" className="history-header-link">
              <BookOpen size={14} aria-hidden />
              <span>{t('exploreRegulations')}</span>
            </Link>
          </div>
        </div>

        <div className="history-title-row">
          <div>
            <h1 className="history-main-heading">{t('historyTitle')}</h1>
            <p className="history-main-subheading">{t('historySubtitle')}</p>
          </div>

          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn btn-secondary btn-sm history-clear-btn"
              title="Clear Session History"
            >
              <Trash2 size={13} aria-hidden />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </section>

      {/* History Items List */}
      <section className="history-list-section" aria-label="Query History Log">
        {isLoading ? (
          <div className="history-loading-box">
            <RefreshCw size={24} className="spinner" aria-hidden />
            <p>{t('loading')}</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="history-empty-box">
            <History size={40} className="history-empty-icon" aria-hidden />
            <h3>No Queries Recorded Yet</h3>
            <p>{t('historyEmpty')}</p>
            <Link to="/qa" className="btn btn-primary btn-md" style={{ marginTop: 'var(--space-4)' }}>
              <span>{t('askQuestion')}</span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="history-items-grid" role="list">
            {historyItems.map((item) => {
              const formattedTime = new Date(item.askedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={item.id} className="history-card" role="listitem">
                  <div className="history-card-header">
                    <div className="history-card-meta">
                      <EvidenceLevelBadge level={item.evidenceLevel} short={true} />
                      <span className="history-time-stamp">
                        <Clock size={12} aria-hidden />
                        {formattedTime}
                      </span>
                    </div>

                    <div className="history-category-tags">
                      {item.categories.map((cat) => (
                        <Badge key={cat} color="grey">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="history-card-body">
                    <p className="history-question-text" lang={item.questionLang}>
                      &ldquo;{item.question}&rdquo;
                    </p>
                  </div>

                  <div className="history-card-footer">
                    <button
                      type="button"
                      onClick={() => handleReask(item.question)}
                      className="history-reask-btn"
                    >
                      <span>{t('historyReask')}</span>
                      <ArrowRight size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default QueryHistory
