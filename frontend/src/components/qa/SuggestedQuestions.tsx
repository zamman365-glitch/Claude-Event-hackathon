/**
 * SuggestedQuestions — Suggested questions about supported building regulations.
 * Renders interactive chips/cards in the user's active language.
 */

import { HelpCircle, ArrowUpRight } from 'lucide-react'
import { SUGGESTED_QUESTIONS } from '../../assets/data/mockQA'
import { useLanguage } from '../../context/LanguageContext'
import type { SuggestedQuestion } from '../../types'

interface SuggestedQuestionsProps {
  onSelect: (questionText: string) => void
  className?: string
}

export const SuggestedQuestions = ({ onSelect, className = '' }: SuggestedQuestionsProps) => {
  const { t, lang } = useLanguage()

  return (
    <div className={`suggested-questions-section ${className}`}>
      <div className="suggested-section-header">
        <div className="suggested-header-left">
          <HelpCircle size={16} className="suggested-header-icon" aria-hidden />
          <h3 className="suggested-section-title">{t('suggestedTitle')}</h3>
        </div>
      </div>

      <div className="suggested-questions-grid" role="list">
        {SUGGESTED_QUESTIONS.map((sq: SuggestedQuestion) => {
          const text = lang === 'hi' ? sq.textHi : sq.textEn

          return (
            <button
              key={sq.id}
              type="button"
              onClick={() => onSelect(text)}
              className="suggested-question-card"
              role="listitem"
            >
              <div className="suggested-card-top">
                <span className="suggested-icon" aria-hidden>{sq.icon}</span>
                <span className="suggested-category-badge">{sq.category}</span>
                <ArrowUpRight size={14} className="suggested-arrow-icon" aria-hidden />
              </div>

              <p
                className="suggested-card-text"
                lang={lang === 'hi' ? 'hi' : 'en'}
              >
                {text}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SuggestedQuestions
