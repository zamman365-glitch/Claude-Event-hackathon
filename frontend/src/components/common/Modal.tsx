/**
 * Modal — accessible dialog overlay.
 * Traps focus, closes on Escape key and backdrop click.
 * Sizes: sm | md (default) | lg
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  size?:        'sm' | 'md' | 'lg'
  children:     ReactNode
  footer?:      ReactNode
  /** Don't close when clicking the backdrop */
  persistent?:  boolean
}

const Modal = ({ open, onClose, title, size = 'md', children, footer, persistent = false }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Trap focus inside modal
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    const trap  = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus() } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus() } }
    }
    document.addEventListener('keydown', trap)
    first?.focus()
    return () => document.removeEventListener('keydown', trap)
  }, [open])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={persistent ? undefined : onClose}
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className={clsx('modal', size === 'sm' && 'modal-sm', size === 'lg' && 'modal-lg')}
        role="dialog"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
