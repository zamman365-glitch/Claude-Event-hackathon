/**
 * EvidenceLevelBadge — Visual badge clearly distinguishing evidence-supported
 * answers from answers requiring verification or insufficient evidence.
 */

import { CheckCircle2, AlertTriangle, HelpCircle, FileCheck } from 'lucide-react'
import type { EvidenceLevel } from '../../types'
import { useLanguage } from '../../context/LanguageContext'

interface EvidenceLevelBadgeProps {
  level: EvidenceLevel
  short?: boolean
  className?: string
}

export const EvidenceLevelBadge = ({ level, short = false, className = '' }: EvidenceLevelBadgeProps) => {
  const { t } = useLanguage()

  switch (level) {
    case 'verified':
      return (
        <span
          className={`evidence-badge evidence-badge-verified ${className}`}
          title="Direct statutory clause identified and verified in MP regulations"
        >
          <CheckCircle2 size={15} aria-hidden />
          <span>{short ? t('evidenceVerifiedShort') : t('evidenceVerified')}</span>
        </span>
      )
    case 'partial':
      return (
        <span
          className={`evidence-badge evidence-badge-partial ${className}`}
          title="Related regulatory clauses identified; partial statutory coverage"
        >
          <FileCheck size={15} aria-hidden />
          <span>{short ? t('evidencePartialShort') : t('evidencePartial')}</span>
        </span>
      )
    case 'needs-verification':
      return (
        <span
          className={`evidence-badge evidence-badge-warning ${className}`}
          title="Regulatory principle applies but on-site/revenue record verification is required"
        >
          <AlertTriangle size={15} aria-hidden />
          <span>{short ? t('evidenceNeedsVerificationShort') : t('evidenceNeedsVerification')}</span>
        </span>
      )
    case 'insufficient':
    default:
      return (
        <span
          className={`evidence-badge evidence-badge-insufficient ${className}`}
          title="No definitive statutory clauses found in the indexed corpus"
        >
          <HelpCircle size={15} aria-hidden />
          <span>{short ? t('evidenceInsufficientShort') : t('evidenceInsufficient')}</span>
        </span>
      )
  }
}

export default EvidenceLevelBadge
