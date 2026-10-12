import { Link } from 'react-router-dom'
import { Leaf, GitBranch } from 'lucide-react'
import { APP_NAME } from '../../constants/app'
import { useLanguage } from '../../context/LanguageContext'

const CURRENT_YEAR = new Date().getFullYear()

const Footer = () => {
  const { t } = useLanguage()

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div>
          <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Leaf size={14} color="var(--clr-brand-400)" />
            {APP_NAME}
          </div>
          <div className="footer-meta">{t('footerTagline')} · {t('footerRights')}</div>
        </div>

        <div className="footer-links">
          <Link to="/help">{t('help')}</Link>
          <Link to="/help">{t('privacyPolicy')}</Link>
          <Link to="/help">{t('accessibility')}</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <GitBranch size={13} />
            GitHub
          </a>
        </div>

        <div className="footer-meta">© {CURRENT_YEAR} Bhopal Impact Lab</div>
      </div>
    </footer>
  )
}

export default Footer
