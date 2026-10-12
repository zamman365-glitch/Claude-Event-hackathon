/**
 * SearchInput — pill-shaped search field with clear button.
 * Emits onChange (same as input) plus onClear callback.
 */

import { useRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

const SearchInput = ({ onClear, className, value, ...props }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={clsx('search-input-wrapper', className)}>
      <span className="search-icon" aria-hidden>
        <Search size={16} />
      </span>
      <input
        ref={inputRef}
        className="input"
        type="search"
        autoComplete="off"
        value={value}
        {...props}
      />
      {value && String(value).length > 0 && (
        <button
          type="button"
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default SearchInput
