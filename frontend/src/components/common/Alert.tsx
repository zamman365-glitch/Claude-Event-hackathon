/**
 * Alert — informational banner with icon and optional title.
 * Types: info | success | warning | error
 */

import type { ReactNode } from 'react'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import clsx from 'clsx'

type AlertType = 'info' | 'success' | 'warning' | 'error'

const ICONS: Record<AlertType, ReactNode> = {
  info:    <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  error:   <XCircle size={16} />,
}

interface AlertProps {
  type?:     AlertType
  title?:    string
  children:  ReactNode
  className?: string
}

const Alert = ({ type = 'info', title, children, className }: AlertProps) => (
  <div
    role="alert"
    className={clsx('alert', `alert-${type}`, className)}
    aria-live="polite"
  >
    <span className="alert-icon" aria-hidden>{ICONS[type]}</span>
    <div className="alert-body">
      {title && <p className="alert-title">{title}</p>}
      <div>{children}</div>
    </div>
  </div>
)

export default Alert
