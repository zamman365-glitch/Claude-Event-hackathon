import { describe, it, expect } from 'vitest'
import { isWebGLAvailable, prefersReducedMotion } from '../../utils/webgl'
import { STATUTORY_RULES } from '../../assets/data/regulationsData'

describe('Architectural 3D Visualizer & Spatial Standards (Phase 6)', () => {
  it('detects WebGL environment and returns boolean', () => {
    const available = isWebGLAvailable()
    expect(typeof available).toBe('boolean')
  })

  it('detects reduced motion setting without error', () => {
    const reduced = prefersReducedMotion()
    expect(typeof reduced).toBe('boolean')
  })

  it('derives 3D spatial scenarios directly from authentic statutory rules', () => {
    // 1. Rule 14(3) Setback scenario
    const rule14 = STATUTORY_RULES.find((r) => r.ruleNumber === 'Rule 14(3)')
    expect(rule14).toBeDefined()
    expect(rule14?.pdfPage).toBe(47)
    expect(rule14?.keyNumericalValues).toBeDefined()
    const agriSetback = rule14?.keyNumericalValues?.find((v) => v.label.includes('Agricultural'))
    expect(agriSetback?.value).toBe('3.0')
    const hwySetback = rule14?.keyNumericalValues?.find((v) => v.label.includes('Highway'))
    expect(hwySetback?.value).toBe('6.0')

    // 2. Rule 44 FAR scenario
    const rule44 = STATUTORY_RULES.find((r) => r.ruleNumber.includes('Rule 44'))
    expect(rule44).toBeDefined()
    expect(rule44?.pdfPage).toBe(63)
    const farBaseline = rule44?.keyNumericalValues?.find((v) => v.label.includes('9.0m'))
    expect(farBaseline?.value).toBe('1.50')
    const purchasable = rule44?.keyNumericalValues?.find((v) => v.label.includes('Purchasable'))
    expect(purchasable?.value).toBe('+0.25')

    // 3. Rule 52(1)(a) Water Buffer scenario
    const rule52 = STATUTORY_RULES.find((r) => r.ruleNumber === 'Rule 52(1)(a)')
    expect(rule52).toBeDefined()
    expect(rule52?.pdfPage).toBe(72)
    const bufferVal = rule52?.keyNumericalValues?.find((v) => v.label.includes('Buffer'))
    expect(bufferVal?.value).toBe('30.0')

    // 4. Section 27(b) Canal scenario
    const sec27 = STATUTORY_RULES.find((r) => r.ruleNumber === 'Section 27(b)')
    expect(sec27).toBeDefined()
    expect(sec27?.pdfPage).toBe(112)
    const canalVal = sec27?.keyNumericalValues?.find((v) => v.label.includes('Canal'))
    expect(canalVal?.value).toBe('4.5')
  })

  it('statutory rules maintain conditions and table context', () => {
    const rule44 = STATUTORY_RULES.find((r) => r.ruleNumber.includes('Rule 44'))
    expect(rule44?.conditions?.length).toBeGreaterThan(0)
    expect(rule44?.statutoryTable).toBeDefined()
    expect(rule44?.statutoryTable?.title).toContain('Table 7')
  })
})
