import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import AskQuestion from './pages/AskQuestion'
import ExploreRegulations from './pages/ExploreRegulations'
import QueryHistory from './pages/QueryHistory'
import LandRecords from './pages/LandRecords'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/qa" element={<AskQuestion />} />
              <Route path="/regulations" element={<ExploreRegulations />} />
              <Route path="/history" element={<QueryHistory />} />
              <Route path="/land-records" element={<LandRecords />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
