/**
 * IsometricFallback — Accessible 2D/Isometric SVG architectural fallback
 *
 * Rendered when:
 * 1. WebGL is unavailable or fails to initialize.
 * 2. User explicitly selects "2D Plan View".
 * 3. System detects low-power mode or reduced-motion preference.
 *
 * Directly displays verified statutory standards from MP Bhumi Vikas Niyam and State Acts.
 */

import React from 'react'
import type { Language } from '../../types'
import { useTheme } from '../../context/ThemeContext'

export type SpatialScenarioKey = 'setback' | 'far' | 'water' | 'canal'

interface IsometricFallbackProps {
  scenario: SpatialScenarioKey
  lang: Language
  showSetbacks: boolean
  showBuilding: boolean
  showPurchasableFar: boolean
  showDimensions: boolean
  onToggleLayer?: (layer: 'setbacks' | 'building' | 'purchasable' | 'dimensions') => void
}

export const IsometricFallback: React.FC<IsometricFallbackProps> = ({
  scenario,
  lang,
  showSetbacks,
  showBuilding,
  showPurchasableFar,
  showDimensions,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="iso-fallback-wrapper" role="img" aria-label="Isometric architectural spatial standards diagram">
      <svg
        viewBox="0 0 800 500"
        className="iso-fallback-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle architectural drop shadows & gradients */}
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1e293b' : '#334155'} />
            <stop offset="100%" stopColor={isDark ? '#0f172a' : '#1e293b'} />
          </linearGradient>

          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1e293b' : '#f8fafc'} />
            <stop offset="100%" stopColor={isDark ? '#0f172a' : '#edf2f7'} />
          </linearGradient>

          <linearGradient id="setbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity={isDark ? '0.75' : '0.85'} />
            <stop offset="100%" stopColor="#fde68a" stopOpacity={isDark ? '0.55' : '0.70'} />
          </linearGradient>

          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#334155' : '#ffffff'} />
            <stop offset="100%" stopColor={isDark ? '#1e293b' : '#e2e8f0'} />
          </linearGradient>

          <linearGradient id="purchasableFarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="bufferGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.65" />
          </linearGradient>

          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* ── Background Grid & Ground Base ── */}
        <rect width="800" height="500" fill={isDark ? '#0b1120' : 'var(--clr-neutral-50, #faf8f5)'} />
        <rect x="40" y="40" width="720" height="420" rx="16" fill="url(#groundGrad)" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" />
        <rect x="40" y="40" width="720" height="420" rx="16" fill="url(#gridPattern)" opacity="0.6" />

        {/* ── Scenario 1: Rule 14(3) Setbacks ── */}
        {scenario === 'setback' && (
          <g className="scenario-group-setback">
            {/* Abutting Highway Road */}
            <path d="M 40 400 L 760 400 L 760 460 L 40 460 Z" fill="url(#roadGrad)" />
            {/* Highway Centerline */}
            <line x1="60" y1="430" x2="740" y2="430" stroke="#f8fafc" strokeWidth="2" strokeDasharray="16, 12" />
            <text x="400" y="435" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600" letterSpacing="1">
              {lang === 'hi' ? 'वर्गीकृत राजमार्ग (सड़क चौड़ाई >= 12m)' : 'CLASSIFIED DISTRICT / STATE HIGHWAY (>= 12m WIDTH)'}
            </text>

            {/* Plot Boundary */}
            <rect x="120" y="80" width="560" height="300" rx="8" fill={isDark ? '#1e293b' : '#ffffff'} stroke={isDark ? '#22c55e' : '#15803d'} strokeWidth="2.5" strokeDasharray="8, 4" />
            <text x="135" y="102" fill={isDark ? '#86efac' : '#15803d'} fontSize="12" fontWeight="700">
              {lang === 'hi' ? 'भूखंड सीमा (कृषि भूमि से लगी)' : 'PLOT BOUNDARY (ABUTTING AGRICULTURAL HOLDINGS)'}
            </text>

            {/* Setback Zones (Amber) */}
            {showSetbacks && (
              <g className="setback-overlays">
                {/* 6.0m Highway Front Setback */}
                <rect x="120" y="320" width="560" height="60" fill="url(#setbackGrad)" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4, 4" />
                {/* 3.0m Side & Rear Setbacks */}
                <rect x="120" y="80" width="60" height="240" fill="url(#setbackGrad)" opacity="0.8" />
                <rect x="620" y="80" width="60" height="240" fill="url(#setbackGrad)" opacity="0.8" />
                <rect x="120" y="80" width="560" height="50" fill="url(#setbackGrad)" opacity="0.8" />
              </g>
            )}

            {/* Permissible Building Footprint */}
            {showBuilding && (
              <g className="building-envelope">
                <rect x="200" y="150" width="400" height="150" rx="6" fill="url(#buildingGrad)" stroke={isDark ? '#64748b' : '#1e293b'} strokeWidth="2" />
                {/* Architectural Grid / Divisions */}
                <line x1="333" y1="150" x2="333" y2="300" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="3, 3" />
                <line x1="466" y1="150" x2="466" y2="300" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="3, 3" />
                <text x="400" y="230" textAnchor="middle" fill={isDark ? '#f8fafc' : '#0f172a'} fontSize="15" fontWeight="700">
                  {lang === 'hi' ? 'अनुमत भवन निर्माण क्षेत्र (Build Footprint)' : 'PERMISSIBLE BUILDING ENVELOPE'}
                </text>
                <text x="400" y="250" textAnchor="middle" fill={isDark ? '#cbd5e1' : '#475569'} fontSize="12">
                  {lang === 'hi' ? 'नियम 14(3) के अधीन अनुविभागीय अधिकारी (SDO) अनुमति' : 'Compliant with Rule 14(3) clearance'}
                </text>
              </g>
            )}

            {/* Dimension Callouts */}
            {showDimensions && (
              <g className="dimension-markers">
                {/* 6.0m Highway Setback dimension line */}
                <line x1="695" y1="320" x2="695" y2="380" stroke="#b45309" strokeWidth="2" />
                <polyline points="691,324 695,320 699,324" fill="none" stroke="#b45309" strokeWidth="2" />
                <polyline points="691,376 695,380 699,376" fill="none" stroke="#b45309" strokeWidth="2" />
                <rect x="705" y="338" width="85" height="24" rx="4" fill="#b45309" />
                <text x="747" y="354" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">6.0m</text>

                {/* 3.0m Side Setback dimension line */}
                <line x1="120" y1="65" x2="180" y2="65" stroke="#15803d" strokeWidth="2" />
                <polyline points="124,61 120,65 124,69" fill="none" stroke="#15803d" strokeWidth="2" />
                <polyline points="176,61 180,65 176,69" fill="none" stroke="#15803d" strokeWidth="2" />
                <rect x="127" y="45" width="46" height="18" rx="3" fill="#15803d" />
                <text x="150" y="58" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">3.0m</text>
              </g>
            )}
          </g>
        )}

        {/* ── Scenario 2: Rule 44 (FAR & Height) ── */}
        {scenario === 'far' && (
          <g className="scenario-group-far">
            {/* Road (9.0m width) */}
            <path d="M 40 410 L 760 410 L 760 460 L 40 460 Z" fill="url(#roadGrad)" />
            <text x="400" y="440" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">
              {lang === 'hi' ? 'सड़क चौड़ाई >= 9.0 मीटर (Road Width Entry 3)' : 'ABUTTING ROAD WIDTH >= 9.0 METRES (ENTRY 3)'}
            </text>

            {/* Baseline 1.50 FAR Building Volume */}
            {showBuilding && (
              <g className="far-baseline-floors">
                {/* Floor 1 (Ground) */}
                <rect x="220" y="270" width="360" height="90" rx="4" fill={isDark ? '#334155' : '#f1f5f9'} stroke={isDark ? '#64748b' : '#334155'} strokeWidth="2" />
                <text x="240" y="320" fill={isDark ? '#f8fafc' : '#334155'} fontSize="13" fontWeight="600">Ground Floor (FAR Base)</text>

                {/* Floor 2 */}
                <rect x="220" y="180" width="360" height="85" rx="4" fill={isDark ? '#1e293b' : '#e2e8f0'} stroke={isDark ? '#64748b' : '#334155'} strokeWidth="2" />
                <text x="240" y="228" fill={isDark ? '#f8fafc' : '#334155'} fontSize="13" fontWeight="600">First Floor (FAR Base)</text>

                {/* Floor 3 (Baseline FAR 1.50 ceiling) */}
                <rect x="220" y="105" width="360" height="70" rx="4" fill={isDark ? '#0f172a' : '#cbd5e1'} stroke={isDark ? '#64748b' : '#334155'} strokeWidth="2" />
                <text x="240" y="145" fill={isDark ? '#f8fafc' : '#334155'} fontSize="13" fontWeight="600">Second Floor — Baseline FAR 1.50 Ceiling</text>
              </g>
            )}

            {/* Purchasable Compounding FAR Tier (+0.25) */}
            {showPurchasableFar && (
              <g className="far-purchasable-tier">
                <rect x="220" y="60" width="220" height="40" rx="4" fill="url(#purchasableFarGrad)" stroke="#d97706" strokeWidth="2" strokeDasharray="5, 3" />
                <text x="330" y="85" textAnchor="middle" fill="#78350f" fontSize="12" fontWeight="700">
                  +0.25 Purchasable FAR Volume
                </text>
              </g>
            )}

            {/* Dimension Callouts for Height and FAR */}
            {showDimensions && (
              <g className="far-dimensions">
                <line x1="600" y1="60" x2="600" y2="360" stroke="#b45309" strokeWidth="2" />
                <polyline points="596,64 600,60 604,64" fill="none" stroke="#b45309" strokeWidth="2" />
                <polyline points="596,356 600,360 604,356" fill="none" stroke="#b45309" strokeWidth="2" />
                <rect x="610" y="195" width="135" height="30" rx="4" fill="#78350f" />
                <text x="677" y="215" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                  12.5m Height Limit
                </text>
              </g>
            )}
          </g>
        )}

        {/* ── Scenario 3: Rule 52(1)(a) Water Body Buffer ── */}
        {scenario === 'water' && (
          <g className="scenario-group-water">
            {/* Natural Water Body (Lake / River) */}
            <path d="M 40 40 L 760 40 L 760 150 L 40 150 Z" fill="url(#waterGrad)" />
            <text x="400" y="85" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700" letterSpacing="1">
              {lang === 'hi' ? 'प्राकृतिक जल निकाय / झील / नदी (NOTIFIED WATER BODY)' : 'NOTIFIED NATURAL WATER BODY (LAKE / RIVER / TANK)'}
            </text>
            {/* HFL Indicator line */}
            <line x1="40" y1="150" x2="760" y2="150" stroke="#0369a1" strokeWidth="3" strokeDasharray="8, 4" />
            <rect x="580" y="130" width="165" height="20" rx="4" fill="#0369a1" />
            <text x="662" y="144" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
              HFL (Highest Flood Level)
            </text>

            {/* 30.0m Green Buffer Zone */}
            {showSetbacks && (
              <g className="lake-buffer-zone">
                <rect x="40" y="150" width="720" height="120" fill="url(#bufferGrad)" stroke="#15803d" strokeWidth="1.5" strokeDasharray="6, 3" />
                <text x="400" y="215" textAnchor="middle" fill="#14532d" fontSize="15" fontWeight="700">
                  {lang === 'hi' ? '30.0 मीटर अनिवार्य हरित बफर क्षेत्र (निर्माण पूर्णतः वर्जित)' : '30.0m MANDATORY GREEN BUFFER (CONSTRUCTION STRICTLY PROHIBITED)'}
                </text>
              </g>
            )}

            {/* Safe Building Zone */}
            {showBuilding && (
              <g className="safe-building-zone">
                <rect x="180" y="310" width="440" height="120" rx="6" fill="url(#buildingGrad)" stroke={isDark ? '#64748b' : '#334155'} strokeWidth="2" />
                <text x="400" y="375" textAnchor="middle" fill={isDark ? '#f8fafc' : '#0f172a'} fontSize="15" fontWeight="700">
                  {lang === 'hi' ? 'सुरक्षित भवन क्षेत्र (4.5m अग्र व 3.0m पृष्ठ स्थान सहित)' : 'PERMISSIBLE CONSTRUCTION BEYOND 30m BUFFER'}
                </text>
              </g>
            )}

            {/* 30.0m dimension bracket */}
            {showDimensions && (
              <g className="buffer-dimension">
                <line x1="100" y1="150" x2="100" y2="270" stroke="#15803d" strokeWidth="2.5" />
                <polyline points="96,154 100,150 104,154" fill="none" stroke="#15803d" strokeWidth="2.5" />
                <polyline points="96,266 100,270 104,266" fill="none" stroke="#15803d" strokeWidth="2.5" />
                <rect x="110" y="196" width="60" height="26" rx="4" fill="#14532d" />
                <text x="140" y="214" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">30.0m</text>
              </g>
            )}
          </g>
        )}

        {/* ── Scenario 4: Section 27(b) Canal Buffer ── */}
        {scenario === 'canal' && (
          <g className="scenario-group-canal">
            {/* Government Irrigation Canal */}
            <path d="M 40 40 L 760 40 L 760 120 L 40 120 Z" fill="url(#waterGrad)" />
            <text x="400" y="80" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700">
              {lang === 'hi' ? 'शासकीय नहर / वितरिका (GOVERNMENT CANAL CHANNEL)' : 'GOVERNMENT IRRIGATION CANAL / DISTRIBUTARY CHANNEL'}
            </text>

            {/* 4.5m Canal Outer Boundary Buffer */}
            {showSetbacks && (
              <g className="canal-buffer-strip">
                <rect x="40" y="120" width="720" height="80" fill="url(#setbackGrad)" stroke="#b45309" strokeWidth="1.5" strokeDasharray="6, 3" />
                <text x="400" y="165" textAnchor="middle" fill="#78350f" fontSize="14" fontWeight="700">
                  {lang === 'hi' ? '4.5 मीटर नहर बाहरी सीमा सेटबैक (कार्यपालन यंत्री NOC अनिवार्य)' : '4.5m CANAL OUTER BOUNDARY SETBACK (NOC MANDATORY)'}
                </text>
              </g>
            )}

            {/* Building Zone */}
            {showBuilding && (
              <rect x="160" y="240" width="480" height="180" rx="6" fill="url(#buildingGrad)" stroke={isDark ? '#64748b' : '#334155'} strokeWidth="2" />
            )}

            {showDimensions && (
              <g className="canal-dimension">
                <line x1="80" y1="120" x2="80" y2="200" stroke="#b45309" strokeWidth="2" />
                <polyline points="76,124 80,120 84,124" fill="none" stroke="#b45309" strokeWidth="2" />
                <polyline points="76,196 80,200 84,196" fill="none" stroke="#b45309" strokeWidth="2" />
                <rect x="90" y="148" width="55" height="24" rx="4" fill="#b45309" />
                <text x="117" y="164" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">4.5m</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}

export default IsometricFallback
