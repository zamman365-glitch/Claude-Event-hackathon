/**
 * Badge — compact status/category label.
 *
 * Colours: green | orange | grey | blue | red | gold
 * showDot: prepends a coloured dot
 * outline: border-only variant
 */

import { type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeColor   = 'green' | 'orange' | 'grey' | 'blue' | 'red' | 'gold'
export type BadgeVariant = 'filled' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?:   BadgeColor
  variant?: BadgeVariant
  showDot?: boolean
  children: ReactNode
}

const Badge = ({
  color   = 'green',
  variant = 'filled',
  showDot = false,
  children,
  className,
  ...props
}: BadgeProps) => (
  <span
    className={clsx(
      'badge',
      variant === 'filled'  && `badge-${color}`,
      variant === 'outline' && `badge-outline-${color}`,
      className,
    )}
    {...props}
  >
    {showDot && <span className="badge-dot" aria-hidden />}
    {children}
  </span>
)

export default Badge
