/**
 * Input — styled text field with optional leading icon and suffix.
 * Integrates with form-group, form-label, form-error-msg classes.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?:  ReactNode
  suffix?:    ReactNode
  error?:     boolean
  inputSize?: 'md' | 'lg'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, suffix, error = false, inputSize = 'md', className, ...props }, ref) => {
    if (leftIcon || suffix) {
      return (
        <div className="input-wrapper">
          {leftIcon && <span className="input-icon" aria-hidden>{leftIcon}</span>}
          <input
            ref={ref}
            className={clsx(
              'input',
              error        && 'input-error',
              inputSize === 'lg' && 'input-lg',
              className,
            )}
            {...props}
          />
          {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        className={clsx(
          'input',
          error        && 'input-error',
          inputSize === 'lg' && 'input-lg',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export default Input
