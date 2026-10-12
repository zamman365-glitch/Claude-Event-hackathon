/**
 * API service layer.
 * Replace stubs with real endpoint calls when backend is ready.
 * Never import backend URLs directly in components — always go through here.
 */

import axios from 'axios'

// Base URL comes from env var; default to empty string for mock/local
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptors (add auth tokens, error normalisation, etc.) ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralised error handling — expand per phase
    return Promise.reject(error)
  },
)

// ── Stub exports (replace with real calls) ────────────────────
export const landRecordService = {
  getByKhasra: (_khasra: string) => {
    throw new Error('Not implemented — connect to MP Bhulekh API or data source.')
  },
}

export const schemeService = {
  getEligibleSchemes: (_profile: unknown) => {
    throw new Error('Not implemented — connect to scheme eligibility logic.')
  },
}
