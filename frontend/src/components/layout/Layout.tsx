import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { apiClient } from '../../services/api'
import Navbar from './Navbar'
import Footer from './Footer'

const Layout = () => {
  const [isMockMode, setIsMockMode] = useState(false)

  useEffect(() => {
    let mounted = true
    apiClient
      .get<{ mock?: boolean; status?: string }>('/api/health')
      .then((res) => {
        if (mounted && res.data?.mock === true) {
          setIsMockMode(true)
        }
      })
      .catch((err) => {
        // Backend might be offline during dev tests
        console.warn('GET /api/health check failed:', err)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="app-shell">
      {isMockMode && (
        <aside className="demo-mode-banner" role="banner" aria-label="Demo mode active">
          <div className="demo-mode-inner">
            <AlertTriangle size={15} aria-hidden />
            <span>Demo mode</span>
          </div>
        </aside>
      )}
      <Navbar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
