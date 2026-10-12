/**
 * QuestionInput — Prominent natural-language question input.
 * Responsive search & chat box with keyboard submit (Enter),
 * clear button, loading state indicator, and quick actions.
 */

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, CornerDownLeft, X, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import Spinner from '../common/Spinner'

interface QuestionInputProps {
  onSubmit: (question: string) => void
  isLoading?: boolean
  initialValue?: string
  placeholder?: string
  className?: string
}

export const QuestionInput = ({
  onSubmit,
  isLoading = false,
  initialValue = '',
  placeholder,
  className = '',
}: QuestionInputProps) => {
  const { t, lang } = useLanguage()
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
  }

  const defaultPlaceholder = placeholder || t('askInputPlaceholder')

  return (
    <form onSubmit={handleSubmit} className={`nl-input-container ${className}`}>
      <div className="nl-input-card">
        {/* Top Input Bar */}
        <div className="nl-input-main-row">
          <div className="nl-input-icon-wrapper" aria-hidden>
            <Sparkles size={20} className="nl-sparkle-icon" />
          </div>

          <textarea
            ref={inputRef}
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={defaultPlaceholder}
            className="nl-textarea"
            disabled={isLoading}
            aria-label={t('askQuestion')}
            lang={lang === 'hi' ? 'hi' : 'en'}
          />

          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="nl-clear-btn"
              aria-label={t('clear')}
              title={t('clear')}
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="nl-submit-btn"
            aria-label={isLoading ? t('searching') : t('askButton')}
          >
            {isLoading ? (
              <Spinner size="sm" color="white" label={t('searching')} />
            ) : (
              <>
                <span className="nl-btn-label">{t('askButton')}</span>
                <ArrowRight size={16} className="nl-btn-icon" aria-hidden />
              </>
            )}
          </button>
        </div>

        {/* Bottom Utility Bar */}
        <div className="nl-input-footer-row">
          <div className="nl-input-hints">
            <span className="nl-hint-pill">
              <CornerDownLeft size={11} aria-hidden /> Press <kbd>Enter</kbd> to search
            </span>
            <span className="nl-hint-separator">•</span>
            <span className="nl-lang-indicator">
              Supports English & हिन्दी (म.प्र. भूलेख व भवन नियम)
            </span>
          </div>

          <div className="nl-char-counter">
            {value.length > 0 && <span>{value.length} characters</span>}
          </div>
        </div>
      </div>
    </form>
  )
}

export default QuestionInput
