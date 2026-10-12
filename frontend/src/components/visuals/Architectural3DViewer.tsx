/**
 * Architectural3DViewer — Interactive 3D Architectural Spatial Envelope Visualizer
 *
 * Visualizes authentic spatial building regulations:
 * 1. Rule 14(3): Setbacks from Agricultural Boundary (3m) & Highway (6m).
 * 2. Rule 44 (Table 7): Permissible FAR (1.50) & Purchasable Compounding Tier (+0.25).
 * 3. Rule 52(1)(a): Water Body 30.0m Green Buffer from Highest Flood Level (HFL).
 * 4. Section 27(b): Government Canal 4.5m Setback clearance.
 *
 * Features:
 * - Pure Three.js WebGL rendering with automatic canvas lifecycle & disposal.
 * - Graceful fallback to 2D/Isometric SVG when WebGL is unavailable or user selects 2D.
 * - Respects system reduced-motion preferences.
 * - Interactive orbit, pitch, zoom, layer toggles, and verified dimension badges.
 * - Conceptual disclaimer explicitly labeling it as an educational spatial model.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import {
  RotateCcw,
  Play,
  Pause,
  Layers,
  ExternalLink,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { isWebGLAvailable, prefersReducedMotion } from '../../utils/webgl'
import { IsometricFallback, type SpatialScenarioKey } from './IsometricFallback'

export interface Architectural3DViewerProps {
  initialScenario?: SpatialScenarioKey
  compact?: boolean
  className?: string
  showControls?: boolean
}

interface ScenarioMeta {
  key: SpatialScenarioKey
  ruleCitation: string
  actTitleEn: string
  actTitleHi: string
  titleEn: string
  titleHi: string
  pdfPage: number
  statutoryValues: Array<{ label: string; value: string }>
  qaQuery: string
  registryQuery: string
}

const SCENARIOS: ScenarioMeta[] = [
  {
    key: 'setback',
    ruleCitation: 'Rule 14(3)',
    actTitleEn: 'Madhya Pradesh Bhumi Vikas Niyam, 2012',
    actTitleHi: 'मध्य प्रदेश भूमि विकास नियम, 2012',
    titleEn: 'Agricultural Boundary (3m) & Highway (6m) Setbacks',
    titleHi: 'कृषि भूमि सीमा (3m) एवं राजमार्ग (6m) सेटबैक',
    pdfPage: 47,
    statutoryValues: [
      { label: 'Agricultural Boundary Setback', value: '3.0 metres (m)' },
      { label: 'Highway Carriage-way Setback', value: '6.0 metres (m)' },
    ],
    qaQuery: 'What is the minimum setback required from an agricultural land boundary?',
    registryQuery: 'Rule 14(3)',
  },
  {
    key: 'far',
    ruleCitation: 'Rule 44 (Table 7)',
    actTitleEn: 'Madhya Pradesh Bhumi Vikas Niyam, 2012',
    actTitleHi: 'मध्य प्रदेश भूमि विकास नियम, 2012',
    titleEn: 'Residential FAR (1.50) & Purchasable Envelope (+0.25)',
    titleHi: 'आवासीय तल क्षेत्र अनुपात (1.50) एवं क्रय योग्य FAR (+0.25)',
    pdfPage: 63,
    statutoryValues: [
      { label: 'Abutting Road Width Threshold', value: '>= 9.0 metres (m)' },
      { label: 'Baseline Permissible FAR', value: '1.50 (Ratio)' },
      { label: 'Purchasable / Compounding FAR', value: '+0.25 (Total 1.75)' },
      { label: 'Maximum Building Height', value: '12.5 metres (m)' },
    ],
    qaQuery: 'What is the maximum floor area ratio (FAR) for residential buildings in rural MP?',
    registryQuery: 'Rule 44',
  },
  {
    key: 'water',
    ruleCitation: 'Rule 52(1)(a)',
    actTitleEn: 'Madhya Pradesh Bhumi Vikas Niyam, 2012',
    actTitleHi: 'मध्य प्रदेश भूमि विकास नियम, 2012',
    titleEn: 'Natural Water Body (Lake / River) 30.0m Green Buffer',
    titleHi: 'प्राकृतिक जल निकाय (झील / नदी) 30.0m हरित बफर',
    pdfPage: 72,
    statutoryValues: [
      { label: 'Water Body HFL Buffer Distance', value: '30.0 metres (m)' },
      { label: 'Front Open Space', value: '4.5 metres (m)' },
      { label: 'Rear Open Space', value: '3.0 metres (m)' },
    ],
    qaQuery: 'What is the buffer distance from lake river water body?',
    registryQuery: 'Rule 52(1)(a)',
  },
  {
    key: 'canal',
    ruleCitation: 'Section 27(b)',
    actTitleEn: 'Madhya Pradesh Irrigation Act, 1931',
    actTitleHi: 'मध्य प्रदेश सिंचाई अधिनियम, 1931',
    titleEn: 'Government Canal Outer Boundary Setback (4.5m)',
    titleHi: 'शासकीय नहर बाहरी सीमा सेटबैक (4.5 मीटर)',
    pdfPage: 112,
    statutoryValues: [
      { label: 'Canal Outer Boundary Setback', value: '4.5 metres (m)' },
      { label: 'Authority Sanction', value: 'Executive Engineer NOC' },
    ],
    qaQuery: 'Canal setback distance from water drainage',
    registryQuery: 'Section 27(b)',
  },
]

export const Architectural3DViewer: React.FC<Architectural3DViewerProps> = ({
  initialScenario = 'setback',
  compact = false,
  className = '',
  showControls = true,
}) => {
  const { lang } = useLanguage()
  const { theme } = useTheme()
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Capability & View State
  const [hasWebGL] = useState<boolean>(() => isWebGLAvailable())
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() => (isWebGLAvailable() ? '3d' : '2d'))
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<SpatialScenarioKey>(initialScenario)

  // Layer Toggles
  const [showSetbacks, setShowSetbacks] = useState<boolean>(true)
  const [showBuilding, setShowBuilding] = useState<boolean>(true)
  const [showPurchasableFar, setShowPurchasableFar] = useState<boolean>(true)
  const [showDimensions, setShowDimensions] = useState<boolean>(true)

  // Motion Controls
  const [isRotating, setIsRotating] = useState<boolean>(() => !prefersReducedMotion())

  const scenario = SCENARIOS.find((s) => s.key === selectedScenarioKey) || SCENARIOS[0]

  // Three.js Scene, Camera, Renderer references
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animFrameIdRef = useRef<number | null>(null)

  // Pointer drag interaction state
  const isDraggingRef = useRef<boolean>(false)
  const prevPointerXRef = useRef<number>(0)
  const prevPointerYRef = useRef<number>(0)
  const rotationYRef = useRef<number>(Math.PI * 0.25)
  const rotationXRef = useRef<number>(Math.PI * 0.18)
  const distanceRef = useRef<number>(34)

  // Build 3D Meshes for chosen scenario
  const updateMeshes = useCallback(() => {
    if (!modelGroupRef.current) return
    const group = modelGroupRef.current

    // Clear existing children
    while (group.children.length > 0) {
      const obj = group.children[0]
      group.remove(obj)
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    }

    const isDark = theme === 'dark'

    // ── Architectural Ground Base ──
    const groundGeo = new THREE.BoxGeometry(26, 0.4, 26)
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xf1f5f9,
      roughness: 0.9,
      metalness: 0.05,
    })
    const groundMesh = new THREE.Mesh(groundGeo, groundMat)
    groundMesh.position.y = -0.2
    groundMesh.receiveShadow = true
    group.add(groundMesh)

    // Plot Boundary Line
    const plotBoundaryGeo = new THREE.BoxGeometry(20, 0.08, 18)
    const plotEdges = new THREE.EdgesGeometry(plotBoundaryGeo)
    const plotLine = new THREE.LineSegments(
      plotEdges,
      new THREE.LineBasicMaterial({ color: isDark ? 0x22c55e : 0x15803d, linewidth: 2 }),
    )
    plotLine.position.y = 0.04
    group.add(plotLine)

    // ── Scenario-Specific Geometry ──
    if (selectedScenarioKey === 'setback') {
      // Highway Road Surface in front
      const roadGeo = new THREE.BoxGeometry(26, 0.1, 5)
      const roadMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0f172a : 0x1e293b,
        roughness: 0.8,
      })
      const roadMesh = new THREE.Mesh(roadGeo, roadMat)
      roadMesh.position.set(0, 0.01, 10.5)
      group.add(roadMesh)

      // Road Centerline
      const lineGeo = new THREE.PlaneGeometry(24, 0.2)
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide })
      const lineMesh = new THREE.Mesh(lineGeo, lineMat)
      lineMesh.rotation.x = -Math.PI / 2
      lineMesh.position.set(0, 0.07, 10.5)
      group.add(lineMesh)

      // Setback Envelopes (6.0m Highway Front & 3.0m Agricultural Sides/Rear)
      if (showSetbacks) {
        // Highway Front Setback (6m)
        const frontSetbackGeo = new THREE.BoxGeometry(20, 0.2, 3.6)
        const frontSetbackMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: isDark ? 0.55 : 0.45,
          roughness: 0.5,
        })
        const frontSetbackMesh = new THREE.Mesh(frontSetbackGeo, frontSetbackMat)
        frontSetbackMesh.position.set(0, 0.1, 6.2)
        group.add(frontSetbackMesh)

        // Side Setbacks (3m)
        const sideSetbackGeo = new THREE.BoxGeometry(2.4, 0.2, 12)
        const sideSetbackMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: isDark ? 0.45 : 0.35,
        })
        const leftSideMesh = new THREE.Mesh(sideSetbackGeo, sideSetbackMat)
        leftSideMesh.position.set(-8.8, 0.1, -1.6)
        group.add(leftSideMesh)

        const rightSideMesh = new THREE.Mesh(sideSetbackGeo, sideSetbackMat)
        rightSideMesh.position.set(8.8, 0.1, -1.6)
        group.add(rightSideMesh)

        // Rear Setback (3m)
        const rearSetbackGeo = new THREE.BoxGeometry(20, 0.2, 2.4)
        const rearMesh = new THREE.Mesh(rearSetbackGeo, sideSetbackMat)
        rearMesh.position.set(0, 0.1, -7.8)
        group.add(rearMesh)
      }

      // Permissible Building Footprint Mass
      if (showBuilding) {
        const buildingGeo = new THREE.BoxGeometry(13, 6.5, 9)
        const buildingMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x334155 : 0xffffff,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.92,
        })
        const buildingMesh = new THREE.Mesh(buildingGeo, buildingMat)
        buildingMesh.position.set(0, 3.25, -0.5)
        buildingMesh.castShadow = true

        // Structural Outline Edges
        const edges = new THREE.EdgesGeometry(buildingGeo)
        const wire = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isDark ? 0x86efac : 0x0f3323 }),
        )
        buildingMesh.add(wire)

        group.add(buildingMesh)
      }
    } else if (selectedScenarioKey === 'far') {
      // Abutting 9m Road
      const roadGeo = new THREE.BoxGeometry(26, 0.1, 4.5)
      const roadMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x0f172a : 0x1e293b,
        roughness: 0.8,
      })
      const roadMesh = new THREE.Mesh(roadGeo, roadMat)
      roadMesh.position.set(0, 0.01, 10.5)
      group.add(roadMesh)

      // Baseline 1.50 FAR Floors (Ground + 2 Floors)
      if (showBuilding) {
        const floorGeo = new THREE.BoxGeometry(12, 6.8, 11)
        const floorMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x334155 : 0xf8fafc,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.9,
        })
        const floorMesh = new THREE.Mesh(floorGeo, floorMat)
        floorMesh.position.set(0, 3.4, 0)
        floorMesh.castShadow = true

        const edges = new THREE.EdgesGeometry(floorGeo)
        const wire = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isDark ? 0x94a3b8 : 0x1e293b }),
        )
        floorMesh.add(wire)
        group.add(floorMesh)
      }

      // Purchasable / Compounding FAR Tier (+0.25)
      if (showPurchasableFar) {
        const purchasableGeo = new THREE.BoxGeometry(7.5, 2.8, 8)
        const purchasableMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.65,
          roughness: 0.2,
          metalness: 0.2,
        })
        const purchasableMesh = new THREE.Mesh(purchasableGeo, purchasableMat)
        purchasableMesh.position.set(-2, 8.2, 0)

        const pEdges = new THREE.EdgesGeometry(purchasableGeo)
        const pWire = new THREE.LineSegments(
          pEdges,
          new THREE.LineBasicMaterial({ color: isDark ? 0xfde68a : 0x78350f }),
        )
        purchasableMesh.add(pWire)
        group.add(purchasableMesh)
      }
    } else if (selectedScenarioKey === 'water') {
      // Natural Water Body Plane (Lake / River)
      const waterGeo = new THREE.BoxGeometry(26, 0.2, 8)
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85,
      })
      const waterMesh = new THREE.Mesh(waterGeo, waterMat)
      waterMesh.position.set(0, 0.05, -9)
      group.add(waterMesh)

      // HFL Line Marker
      const hflGeo = new THREE.PlaneGeometry(26, 0.2)
      const hflMat = new THREE.MeshBasicMaterial({ color: 0x0369a1, side: THREE.DoubleSide })
      const hflMesh = new THREE.Mesh(hflGeo, hflMat)
      hflMesh.rotation.x = -Math.PI / 2
      hflMesh.position.set(0, 0.16, -5)
      group.add(hflMesh)

      // 30.0m Mandatory Green Buffer Zone
      if (showSetbacks) {
        const bufferGeo = new THREE.BoxGeometry(26, 0.15, 6)
        const bufferMat = new THREE.MeshStandardMaterial({
          color: 0x16a34a,
          transparent: true,
          opacity: 0.45,
          roughness: 0.7,
        })
        const bufferMesh = new THREE.Mesh(bufferGeo, bufferMat)
        bufferMesh.position.set(0, 0.08, -2)
        group.add(bufferMesh)
      }

      // Safe Permissible Building Footprint beyond 30m Buffer
      if (showBuilding) {
        const bGeo = new THREE.BoxGeometry(14, 6.0, 7)
        const bMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x334155 : 0xffffff,
          roughness: 0.3,
          transparent: true,
          opacity: 0.9,
        })
        const bMesh = new THREE.Mesh(bGeo, bMat)
        bMesh.position.set(0, 3.0, 5)

        const edges = new THREE.EdgesGeometry(bGeo)
        const wire = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isDark ? 0x86efac : 0x0f172a }),
        )
        bMesh.add(wire)
        group.add(bMesh)
      }
    } else if (selectedScenarioKey === 'canal') {
      // Government Canal Channel
      const canalGeo = new THREE.BoxGeometry(26, 0.2, 5)
      const canalMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.2,
        metalness: 0.4,
      })
      const canalMesh = new THREE.Mesh(canalGeo, canalMat)
      canalMesh.position.set(0, 0.05, -10)
      group.add(canalMesh)

      // 4.5m Canal Outer Boundary NOC Setback
      if (showSetbacks) {
        const cSetbackGeo = new THREE.BoxGeometry(26, 0.15, 4.5)
        const cSetbackMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.45,
        })
        const cSetbackMesh = new THREE.Mesh(cSetbackGeo, cSetbackMat)
        cSetbackMesh.position.set(0, 0.08, -5.25)
        group.add(cSetbackMesh)
      }

      // Safe Building Envelope
      if (showBuilding) {
        const cbGeo = new THREE.BoxGeometry(14, 6, 8)
        const cbMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x334155 : 0xffffff,
          roughness: 0.4,
        })
        const cbMesh = new THREE.Mesh(cbGeo, cbMat)
        cbMesh.position.set(0, 3.0, 2)

        const edges = new THREE.EdgesGeometry(cbGeo)
        const wire = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isDark ? 0x94a3b8 : 0x1e293b }),
        )
        cbMesh.add(wire)
        group.add(cbMesh)
      }
    }
  }, [selectedScenarioKey, showSetbacks, showBuilding, showPurchasableFar, theme])

  // Setup Three.js Canvas Lifecycle
  useEffect(() => {
    if (!hasWebGL || viewMode !== '3d' || !canvasContainerRef.current) return

    const container = canvasContainerRef.current
    const width = container.clientWidth || 640
    const height = container.clientHeight || 420

    const isDark = theme === 'dark'

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? 0x0f172a : 0xfaf8f5)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 200)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    rendererRef.current = renderer

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.95 : 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, isDark ? 1.4 : 1.25)
    sunLight.position.set(24, 38, 20)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0xdbeafe, isDark ? 0.6 : 0.4)
    fillLight.position.set(-20, 16, -18)
    scene.add(fillLight)

    // 5. Model Group
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    // Build initial geometry
    updateMeshes()

    // 6. Camera Position Update Function
    const updateCamera = () => {
      const cy = Math.cos(rotationXRef.current)
      const cx = distanceRef.current * Math.cos(rotationYRef.current) * cy
      const cz = distanceRef.current * Math.sin(rotationYRef.current) * cy
      const cyPos = distanceRef.current * Math.sin(rotationXRef.current)

      camera.position.set(cx, Math.max(3, cyPos), cz)
      camera.lookAt(0, 2.5, 0)
    }

    updateCamera()

    // 7. Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate)

      if (isRotating && !isDraggingRef.current) {
        rotationYRef.current += 0.0025
        updateCamera()
      }

      renderer.render(scene, camera)
    }

    animate()

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return
      const newW = container.clientWidth
      const newH = container.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    })
    resizeObserver.observe(container)

    // 9. Pointer Drag Events
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      prevPointerXRef.current = clientX
      prevPointerYRef.current = clientY
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const deltaX = clientX - prevPointerXRef.current
      const deltaY = clientY - prevPointerYRef.current

      rotationYRef.current -= deltaX * 0.007
      rotationXRef.current = Math.max(
        0.1,
        Math.min(Math.PI * 0.42, rotationXRef.current + deltaY * 0.007),
      )

      prevPointerXRef.current = clientX
      prevPointerYRef.current = clientY
      updateCamera()
    }

    const handlePointerUp = () => {
      isDraggingRef.current = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      distanceRef.current = Math.max(16, Math.min(65, distanceRef.current + e.deltaY * 0.03))
      updateCamera()
    }

    const domEl = renderer.domElement
    domEl.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    domEl.addEventListener('touchstart', handlePointerDown, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('touchend', handlePointerUp)
    domEl.addEventListener('wheel', handleWheel, { passive: false })

    // Cleanup on unmount or view change
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      resizeObserver.disconnect()
      domEl.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      domEl.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
      domEl.removeEventListener('wheel', handleWheel)

      renderer.dispose()
      if (container.contains(domEl)) {
        container.removeChild(domEl)
      }
    }
  }, [hasWebGL, viewMode, isRotating, updateMeshes, theme])

  // Update meshes when scenario or layer toggles change
  useEffect(() => {
    if (viewMode === '3d') {
      updateMeshes()
    }
  }, [selectedScenarioKey, showSetbacks, showBuilding, showPurchasableFar, viewMode, updateMeshes])

  // Reset Camera View
  const handleResetCamera = () => {
    rotationYRef.current = Math.PI * 0.25
    rotationXRef.current = Math.PI * 0.18
    distanceRef.current = 34
    if (cameraRef.current) {
      const cy = Math.cos(rotationXRef.current)
      const cx = distanceRef.current * Math.cos(rotationYRef.current) * cy
      const cz = distanceRef.current * Math.sin(rotationYRef.current) * cy
      const cyPos = distanceRef.current * Math.sin(rotationXRef.current)
      cameraRef.current.position.set(cx, Math.max(3, cyPos), cz)
      cameraRef.current.lookAt(0, 2.5, 0)
    }
  }

  return (
    <div className={`arch-3d-card-wrapper ${compact ? 'is-compact' : ''} ${className}`}>
      {/* ── Header Strip ── */}
      <div className="arch-3d-header">
        <div className="arch-3d-title-group">
          <div className="arch-badge-row">
            <span className="arch-statutory-pill">
              {scenario.ruleCitation}
            </span>
            <span className="arch-doc-pill">
              {lang === 'hi' ? scenario.actTitleHi : scenario.actTitleEn} (Page {scenario.pdfPage})
            </span>
          </div>

          <h3 className="arch-3d-heading">
            {lang === 'hi' ? scenario.titleHi : scenario.titleEn}
          </h3>
        </div>

        {/* Action switchers: 3D vs 2D & Scenario Selector */}
        <div className="arch-top-actions">
          {hasWebGL && (
            <div className="arch-view-mode-toggle" role="group" aria-label="View Mode Toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === '3d' ? 'is-active' : ''}`}
                onClick={() => setViewMode('3d')}
                title="3D Interactive Orbit"
              >
                3D View
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === '2d' ? 'is-active' : ''}`}
                onClick={() => setViewMode('2d')}
                title="2D Plan View"
              >
                2D Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Scenario Selection Chips ── */}
      <div className="arch-scenario-chips-row" role="tablist" aria-label="Spatial Rule Scenarios">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.key}
            type="button"
            role="tab"
            aria-selected={selectedScenarioKey === sc.key}
            className={`arch-scenario-chip ${selectedScenarioKey === sc.key ? 'is-selected' : ''}`}
            onClick={() => setSelectedScenarioKey(sc.key)}
          >
            <strong>{sc.ruleCitation}</strong>
            <span>{sc.key === 'setback' ? 'Setbacks' : sc.key === 'far' ? 'FAR (1.50)' : sc.key === 'water' ? '30m Buffer' : 'Canal Offset'}</span>
          </button>
        ))}
      </div>

      {/* ── 3D Canvas / 2D SVG Viewport ── */}
      <div className="arch-viewport-container">
        {viewMode === '3d' && hasWebGL ? (
          <div
            ref={canvasContainerRef}
            className="arch-webgl-canvas-box"
            tabIndex={0}
            role="region"
            aria-label={`3D Spatial visualization for ${scenario.ruleCitation}. Click and drag to orbit, scroll to zoom.`}
          />
        ) : (
          <IsometricFallback
            scenario={selectedScenarioKey}
            lang={lang}
            showSetbacks={showSetbacks}
            showBuilding={showBuilding}
            showPurchasableFar={showPurchasableFar}
            showDimensions={showDimensions}
          />
        )}

        {/* 3D In-Canvas Floating Dimension Tags */}
        {showDimensions && (
          <div className="arch-floating-dimension-tags" aria-hidden>
            {scenario.statutoryValues.map((sv, idx) => (
              <div key={idx} className="arch-dimension-badge">
                <span className="dim-badge-label">{sv.label}:</span>
                <strong className="dim-badge-val">{sv.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* On-Canvas Orbit Controls Toolbar */}
        {viewMode === '3d' && hasWebGL && showControls && (
          <div className="arch-viewport-controls-toolbar">
            <button
              type="button"
              className="arch-tool-btn"
              onClick={() => setIsRotating((prev) => !prev)}
              title={isRotating ? 'Pause Auto-Orbit' : 'Start Auto-Orbit'}
              aria-label={isRotating ? 'Pause Auto-Orbit' : 'Start Auto-Orbit'}
            >
              {isRotating ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button
              type="button"
              className="arch-tool-btn"
              onClick={handleResetCamera}
              title="Reset 3D Perspective"
              aria-label="Reset 3D Perspective"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Layer Toggles Toolbar ── */}
      {showControls && (
        <div className="arch-layer-toggles-strip">
          <span className="arch-layers-label">
            <Layers size={13} aria-hidden /> Layers:
          </span>

          <label className="arch-toggle-checkbox">
            <input
              type="checkbox"
              checked={showSetbacks}
              onChange={(e) => setShowSetbacks(e.target.checked)}
            />
            <span>Clearances & Setbacks</span>
          </label>

          <label className="arch-toggle-checkbox">
            <input
              type="checkbox"
              checked={showBuilding}
              onChange={(e) => setShowBuilding(e.target.checked)}
            />
            <span>Building Envelope</span>
          </label>

          {selectedScenarioKey === 'far' && (
            <label className="arch-toggle-checkbox">
              <input
                type="checkbox"
                checked={showPurchasableFar}
                onChange={(e) => setShowPurchasableFar(e.target.checked)}
              />
              <span>+0.25 Purchasable FAR</span>
            </label>
          )}

          <label className="arch-toggle-checkbox">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
            />
            <span>Dimension Tags</span>
          </label>
        </div>
      )}

      {/* ── Verified Statutory Details & Actions Footer ── */}
      <div className="arch-card-footer">
        {/* Conceptual Disclaimer (Requirements 9 & 10) */}
        <div className="arch-disclaimer-callout" role="note">
          <ShieldAlert size={14} className="arch-disclaimer-icon" aria-hidden />
          <p className="arch-disclaimer-text">
            <strong>Civic-Tech Spatial Disclaimer: </strong>
            Conceptual 3D illustration based on verified MP Bhumi Vikas Niyam & State Acts. Not an engineered structural plan. Subject to physical survey and SDO (Revenue) / Town & Country Planning demarcation.
          </p>
        </div>

        <div className="arch-action-buttons-row">
          <Link
            to={`/qa?q=${encodeURIComponent(scenario.qaQuery)}`}
            className="arch-cta-btn arch-cta-ask"
            title="Ask Q&A Assistant about this specific statutory rule"
          >
            <HelpCircle size={14} aria-hidden />
            <span>Ask Assistant About {scenario.ruleCitation}</span>
          </Link>

          <Link
            to={`/regulations?q=${encodeURIComponent(scenario.registryQuery)}`}
            className="arch-cta-btn arch-cta-inspect"
            title="Inspect verbatim gazette text and numerical standards"
          >
            <span>Inspect Rulebook Citation (Page {scenario.pdfPage})</span>
            <ExternalLink size={13} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Architectural3DViewer
