/**
 * Navbar — Accessible sticky navigation bar with language selector (EN/HI),
 * civic-tech branding, responsive mobile drawer, and direct links to
 * Ask a Question, Explore Regulations, Query History, and Land Records.
 */

import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  MessageSquare,
  BookOpen,
  History,
  Map,
  Leaf,
  Globe,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '../../constants/app'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { key: 'dashboard'         as const, to: '/',            icon: <LayoutDashboard size={15} /> },
  { key: 'askQuestion'       as const, to: '/qa',          icon: <MessageSquare size={15} /> },
  { key: 'exploreRegulations'as const, to: '/regulations', icon: <BookOpen size={15} /> },
  { key: 'queryHistory'      as const, to: '/history',      icon: <History size={15} /> },
  { key: 'landRecords'       as const, to: '/land-records', icon: <Map size={15} /> },
]

export const Navbar = () => {
  const { lang, toggle, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const themeLabel = theme === 'dark' ? t('themeSwitchLight') : t('themeSwitchDark')

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content ↓
      </a>

      <nav className="navbar" aria-label="Main navigation">
        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand"
          onClick={closeMenu}
          aria-label={`${APP_NAME} — Home`}
        >
          <div className="navbar-brand-icon" aria-hidden>
            <Leaf size={20} color="#52b788" />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">{APP_NAME}</span>
            <span className="navbar-brand-tagline">{APP_TAGLINE}</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-nav" role="list">
          {NAV_ITEMS.map(({ key, to, icon }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {icon}
                <span>{t(key)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Actions: Language Selector + Theme Toggle + Mobile Hamburger */}
        <div className="navbar-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {theme === 'dark' ? (
              <Sun size={17} className="theme-toggle-sun" aria-hidden />
            ) : (
              <Moon size={17} className="theme-toggle-moon" aria-hidden />
            )}
            <span className="theme-toggle-label-sr sr-only">{themeLabel}</span>
          </button>

          {/* Language Selector Pill */}
          <div className="lang-toggle-wrapper">
            <Globe size={13} className="lang-globe-icon" aria-hidden />
            <div className="lang-toggle" role="group" aria-label="Language selection">
              <button
                type="button"
                onClick={() => lang !== 'en' && toggle()}
                className={lang === 'en' ? 'active' : ''}
                aria-pressed={lang === 'en'}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => lang !== 'hi' && toggle()}
                className={lang === 'hi' ? 'active' : ''}
                aria-pressed={lang === 'hi'}
                lang="hi"
                title="हिंदी में बदलें"
              >
                हि
              </button>
            </div>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <nav
        id="mobile-menu"
        className={`navbar-mobile-menu${menuOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map(({ key, to, icon }) => (
          <NavLink
            key={key}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={closeMenu}
          >
            {icon}
            <span>{t(key)}</span>
          </NavLink>
        ))}

        {/* Mobile Theme Toggle Item */}
        <div className="navbar-mobile-theme-row">
          <button
            type="button"
            className="mobile-theme-toggle-btn"
            onClick={() => {
              toggleTheme()
            }}
            aria-label={themeLabel}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            <span>{themeLabel}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar
