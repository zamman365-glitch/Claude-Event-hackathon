/**
 * Skeleton — placeholder loading state.
 * Use as drop-in replacement for content while data is loading.
 */

import clsx from 'clsx'

interface SkeletonProps {
  width?:     string | number
  height?:    string | number
  rounded?:   'sm' | 'md' | 'lg' | 'full'
  className?: string
  lines?:     number   // Render multiple text-skeleton lines
}

const Skeleton = ({ width, height, rounded = 'md', className, lines }: SkeletonProps) => {
  if (lines && lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={clsx('skeleton', 'skeleton-text', className)}
            style={{
              width:  i === lines - 1 ? '70%' : '100%',
              height: height ?? '0.875em',
              borderRadius: `var(--radius-${rounded})`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <span
      className={clsx('skeleton', className)}
      style={{
        display: 'block',
        width:        width  ?? '100%',
        height:       height ?? '1em',
        borderRadius: `var(--radius-${rounded})`,
      }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
