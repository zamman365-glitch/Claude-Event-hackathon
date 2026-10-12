/**
 * Home — Welcoming civic-tech dashboard for Bhumi Vikas Sahayak.
 * Features:
 * - Product branding and civic-tech welcoming dashboard
 * - Prominent natural-language question input that jumps directly into Q&A
 * - Suggested question chips
 * - System KPI metrics
 * - Service navigation cards (Ask Question, Explore Regulations, Query History, Land Records)
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  BookOpen,
  History,
  Map,
  ArrowRight,
  Sprout,
  Shield,
  Search,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import Badge from '../components/common/Badge'
import { SUGGESTED_QUESTIONS } from '../assets/data/mockQA'
import Architectural3DViewer from '../components/visuals/Architectural3DViewer'

const Home = () => {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [queryText, setQueryText] = useState('')

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault()
    if (queryText.trim()) {
      navigate(`/qa?q=${encodeURIComponent(queryText.trim())}`)
    } else {
      navigate('/qa')
    }
  }

  const handleQuickQuestion = (q: string) => {
    navigate(`/qa?q=${encodeURIComponent(q)}`)
  }

  const FEATURES = [
    {
      icon: <MessageSquare size={24} />,
      iconBg: 'linear-gradient(135deg, #dcf3e6, #b8e6ce)',
      iconClr: 'var(--clr-brand-700)',
      badge: { label: 'Statutory AI', color: 'green' as const },
      titleKey: 'f1Title' as const,
      descKey: 'f1Desc' as const,
      ctaKey: 'f1Cta' as const,
      to: '/qa',
      accentBar: 'var(--clr-brand-600)',
    },
    {
      icon: <BookOpen size={24} />,
      iconBg: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
      iconClr: 'var(--clr-accent-500)',
      badge: { label: '6 Key Domains', color: 'orange' as const },
      titleKey: 'f2Title' as const,
      descKey: 'f2Desc' as const,
      ctaKey: 'f2Cta' as const,
      to: '/regulations',
      accentBar: 'var(--clr-accent-500)',
    },
    {
      icon: <History size={24} />,
      iconBg: 'linear-gradient(135deg, #eff6ff, #bfdbfe)',
      iconClr: '#1d4ed8',
      badge: { label: 'Audit Trail', color: 'blue' as const },
      titleKey: 'queryHistory' as const,
      descKey: 'historySubtitle' as const,
      ctaKey: 'historyReask' as const,
      to: '/history',
      accentBar: '#3b82f6',
    },
    {
      icon: <Map size={24} />,
      iconBg: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
      iconClr: '#15803d',
      badge: { label: 'MP Bhulekh', color: 'green' as const },
      titleKey: 'f3Title' as const,
      descKey: 'f3Desc' as const,
      ctaKey: 'f3Cta' as const,
      to: '/land-records',
      accentBar: '#16a34a',
    },
  ]

  return (
    <div className="page-home">
      {/* ── Welcoming Dashboard Hero ── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <Sprout size={13} aria-hidden />
            <span>{t('heroEyebrow')}</span>
            <span className="hero-eyebrow-divider">•</span>
            <Shield size={13} aria-hidden />
            <span>MP Building & Revenue Laws</span>
          </div>

          <h1 id="hero-heading" className="hero-title-en">
            Bhumi Vikas<br />Sahayak
          </h1>
          <p className="hero-title-hi" lang="hi">
            भूमि विकास सहायक
          </p>

          <p className="hero-desc">{t('heroDesc')}</p>

          {/* Prominent Natural Language Search in Hero */}
          <form onSubmit={handleHeroSearch} className="hero-nl-search-bar" role="search">
            <div className="hero-search-inner">
              <Search size={18} className="hero-search-icon" aria-hidden />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={t('askInputPlaceholder')}
                className="hero-search-input"
                aria-label={t('askQuestion')}
                lang={lang === 'hi' ? 'hi' : 'en'}
              />
              <button type="submit" className="hero-search-submit-btn">
                <span>{t('askButton')}</span>
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          </form>

          {/* Suggested Quick Question Chips directly on Dashboard */}
          <div className="hero-quick-chips">
            <span className="hero-chips-label">
              <Sparkles size={13} aria-hidden /> Quick Questions:
            </span>
            <div className="hero-chips-list">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((sq) => {
                const text = lang === 'hi' ? sq.textHi : sq.textEn
                return (
                  <button
                    key={sq.id}
                    type="button"
                    onClick={() => handleQuickQuestion(text)}
                    className="hero-quick-chip"
                    title={text}
                  >
                    <span>{sq.icon}</span>
                    <span className="hero-chip-text">{text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <span className="hero-badge">
              🏛️ {t('heroBadge')}
            </span>
          </div>
        </div>
      </section>

      {/* ── Key Statistics Strip ── */}
      <section className="stats-section" aria-label="Platform statistics">
        {(['1', '2', '3', '4'] as const).map((n) => (
          <div key={n} className="stat-item">
            <div className="stat-num">{t(`stat${n}Num` as any)}</div>
            <div
              className="stat-lbl"
              lang={lang === 'hi' ? 'hi' : undefined}
            >
              {t(`stat${n}Lbl` as any)}
            </div>
          </div>
        ))}
      </section>

      {/* ── Interactive 3D Spatial Regulations Showcase ── */}
      <section className="spatial-visuals-section" aria-labelledby="spatial-heading" style={{ maxWidth: 'var(--max-w-content)', margin: 'var(--space-12) auto', padding: '0 var(--space-4)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
          <p className="section-eyebrow">
            {lang === 'hi' ? 'स्थानिक विनियामक प्रतिरूपण' : 'Spatial Regulatory Envelopes'}
          </p>
          <h2 id="spatial-heading" className="section-title">
            {lang === 'hi' ? 'त्रिविमीय (3D) स्थापत्य स्थानिक मानक' : 'Interactive Architectural 3D Spatial Envelopes'}
          </h2>
          <p className="section-subtitle">
            {lang === 'hi'
              ? 'मध्य प्रदेश भूमि विकास नियम 2012 के वैधानिक संख्यात्मक मानकों (3m/6m सेटबैक, 1.50 FAR, 30m जल बफर) का अंतःक्रियात्मक 3D दृश्य।'
              : 'Explore physical setbacks, permissible floor area massing, and water body green buffers derived directly from official Madhya Pradesh statutory building rules.'}
          </p>
        </div>

        <Architectural3DViewer />
      </section>

      {/* ── Dashboard Feature Grid ── */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="section-header">
          <p className="section-eyebrow">Municipal & Citizen Services</p>
          <h2
            id="features-heading"
            className="section-title"
            lang={lang === 'hi' ? 'hi' : undefined}
          >
            {t('featureTitle')}
          </h2>
          <p
            className="section-subtitle"
            lang={lang === 'hi' ? 'hi' : undefined}
          >
            {t('featureSubtitle')}
          </p>
        </div>

        <div className="feature-grid" role="list">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="feature-card"
              role="listitem"
              aria-label={t(f.titleKey as any)}
            >
              {/* Top accent strip */}
              <div
                style={{
                  height: 3,
                  background: f.accentBar,
                  margin: 'calc(-1 * var(--space-8)) calc(-1 * var(--space-8)) 0',
                  borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                }}
              />

              <div
                style={{
                  marginTop: 'var(--space-5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  className="feature-card-icon"
                  style={{ background: f.iconBg, color: f.iconClr }}
                  aria-hidden
                >
                  {f.icon}
                </div>
                <Badge color={f.badge.color} showDot>
                  {f.badge.label}
                </Badge>
              </div>

              <div>
                <h3
                  className="feature-card-title"
                  lang={lang === 'hi' ? 'hi' : undefined}
                >
                  {t(f.titleKey as any)}
                </h3>
                <p
                  className="feature-card-desc"
                  lang={lang === 'hi' ? 'hi' : undefined}
                >
                  {t(f.descKey as any)}
                </p>
              </div>

              <div className="feature-card-arrow" aria-hidden>
                {t(f.ctaKey as any)}
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
