/**
 * LandRecords — Placeholder page for Land Records (MP Bhulekh)
 * Prepared for subsequent phase, clearly informing user of status.
 */

import { Link } from 'react-router-dom'
import { Map, MessageSquare, ArrowRight, Shield } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export const LandRecords = () => {
  const { t } = useLanguage()

  return (
    <div className="page-land-records-placeholder">
      <div className="placeholder-card">
        <div className="placeholder-icon-circle">
          <Map size={36} />
        </div>

        <div className="placeholder-badge">
          <Shield size={14} />
          <span>Scheduled for Phase 3</span>
        </div>

        <h1>{t('landRecords')}</h1>
        <p className="placeholder-desc">
          MP Bhulekh integration for digital Khasra, Khatauni (B-1), and parcel geometry
          is queued for the upcoming phase per the hackathon architecture roadmap.
        </p>

        <div className="placeholder-actions">
          <Link to="/qa" className="btn btn-primary btn-md">
            <MessageSquare size={16} />
            <span>{t('askQuestion')}</span>
          </Link>

          <Link to="/regulations" className="btn btn-secondary btn-md">
            <span>{t('exploreRegulations')}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LandRecords
