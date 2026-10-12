/**
 * Spinner — animated loading indicator.
 * Sizes: sm | md | lg | xl
 * Colors: brand (default) | white | accent
 */

import clsx from 'clsx'

type SpinnerSize  = 'sm' | 'md' | 'lg' | 'xl'
type SpinnerColor = 'brand' | 'white' | 'accent'

interface SpinnerProps {
  size?:  SpinnerSize
  color?: SpinnerColor
  label?: string
  className?: string
}

const Spinner = ({ size = 'md', color = 'brand', label = 'Loading…', className }: SpinnerProps) => (
  <span
    role="status"
    aria-label={label}
    className={clsx(
      'spinner',
      `spinner-${size}`,
      color === 'white'  && 'spinner-white',
      color === 'accent' && 'spinner-accent',
      className,
    )}
  />
)

export default Spinner
