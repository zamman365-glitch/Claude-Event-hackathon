/**
 * Card — surface container.
 * Variants: default, flat, bordered, hoverable
 * Sub-components: Card.Header, Card.Body, Card.Footer
 */

import { type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered' | 'hoverable'
  children: ReactNode
}

const Card = ({ variant = 'default', children, className, ...props }: CardProps) => (
  <div
    className={clsx(
      'card',
      variant === 'flat'      && 'card-flat',
      variant === 'bordered'  && 'card-bordered',
      variant === 'hoverable' && 'card-hoverable',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

// ── Sub-components ───────────────────────────────────────────

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  iconBg?: string
  action?: ReactNode
  children: ReactNode
}

const CardHeader = ({ icon, iconBg = 'var(--clr-brand-50)', action, children, className, ...props }: CardHeaderProps) => (
  <div className={clsx('card-header', className)} {...props}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1 }}>
      {icon && (
        <div className="card-header-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
    {action}
  </div>
)

const CardBody = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('card-body', className)} {...props}>{children}</div>
)

const CardFooter = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('card-footer', className)} {...props}>{children}</div>
)

Card.Header = CardHeader
Card.Body   = CardBody
Card.Footer = CardFooter

export default Card
