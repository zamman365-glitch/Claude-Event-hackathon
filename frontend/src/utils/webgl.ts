/**
 * webgl.ts — Safe runtime capability checks for 3D graphics and accessibility
 */

/**
 * Detect whether WebGL 1.0 or 2.0 context can be initialized in the current browser
 */
export const isWebGLAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(gl && gl instanceof WebGLRenderingContext || (window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext))
  } catch {
    return false
  }
}

/**
 * Check if the user has requested reduced motion in system accessibility settings
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
