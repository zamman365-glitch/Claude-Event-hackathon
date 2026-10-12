import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const NotFound = () => {
  const { t } = useLanguage()

  return (
    <div className="page-not-found" role="main" aria-labelledby="not-found-title">
      <div aria-hidden style={{ fontSize: '8rem', lineHeight: 1, userSelect: 'none', color: 'var(--clr-neutral-150)' }}>
        404
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--clr-brand-600)' }}>
        <Leaf size={20} aria-hidden />
      </div>

      <h1 id="not-found-title" style={{ fontSize: 'var(--text-2xl)', color: 'var(--clr-neutral-800)' }}>
        {t('notFoundTitle')}
      </h1>
      <p style={{ color: 'var(--clr-neutral-500)', maxWidth: '380px' }}>
        {t('notFoundDesc')}
      </p>

      <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-4)' }}>
        {t('backHome')}
      </Link>
    </div>
  )
}

export default NotFound
