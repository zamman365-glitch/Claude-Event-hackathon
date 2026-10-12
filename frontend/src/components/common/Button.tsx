/**
 * Button — primary interactive element.
 *
 * Variants: primary | secondary | ghost | accent | danger
 * Sizes:    xs | sm | md (default) | lg | xl
 * Extras:   loading state, icon-only, full-width, as="a" polymorphism
 */

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:    ButtonVariant
  size?:       ButtonSize
  loading?:    boolean
  leftIcon?:   ReactNode
  rightIcon?:  ReactNode
  fullWidth?:  boolean
  iconOnly?:   boolean
  children?:   ReactNode
}

const sizeClass: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  xl: 'btn-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant    = 'primary',
      size       = 'md',
      loading    = false,
      leftIcon,
      rightIcon,
      fullWidth  = false,
      iconOnly   = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'btn',
          `btn-${variant}`,
          sizeClass[size],
          fullWidth  && 'btn-full',
          iconOnly   && 'btn-icon',
          loading    && 'btn-loading',
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        style={{ position: 'relative' }}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'xl' || size === 'lg' ? 18 : 14} className="btn-spinner" aria-hidden />
        ) : (
          leftIcon
        )}
        {!iconOnly && children && (
          <span className="btn-label">{children}</span>
        )}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'

export default Button
