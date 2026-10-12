import { describe, it, expect } from 'vitest'
import { regulationsService } from './regulationsService'

describe('Regulations Explorer Service (Phase 3 & 7)', () => {
  it('retrieves all indexed authentic statutory rules (11 rules)', async () => {
    const rules = await regulationsService.getAllRules()
    expect(rules.length).toBe(11)
    expect(rules.every((r) => r.id && r.ruleNumber && r.documentTitle)).toBe(true)
  })

  it('retrieves rule by unique identifier', async () => {
    const rule = await regulationsService.getRuleById('rule-bvn-44-tab7')
    expect(rule).toBeDefined()
    expect(rule?.ruleNumber).toContain('Rule 44')
    expect(rule?.pdfPage).toBe(63)
  })

  it('retrieves rule by rule number with case-insensitive matching', async () => {
    const rule14 = await regulationsService.getRuleByNumber('rule 14(3)')
    expect(rule14).toBeDefined()
    expect(rule14?.id).toBe('rule-bvn-14-3')

    const sec165 = await regulationsService.getRuleByNumber('Section 165')
    expect(sec165).toBeDefined()
    expect(sec165?.id).toBe('rule-mplrc-165')
  })

  it('searches rules by text across title and verbatim statutory text', async () => {
    const farResults = await regulationsService.searchRules({ query: 'Floor Area Ratio' })
    expect(farResults.length).toBeGreaterThan(0)
    expect(farResults.some((r) => r.ruleNumber.includes('44'))).toBe(true)

    const hindiResults = await regulationsService.searchRules({ query: 'वर्षा जल संचयन' })
    expect(hindiResults.length).toBeGreaterThan(0)
    expect(hindiResults[0].ruleNumber).toBe('Rule 67(2)')
  })

  it('filters rules by category and documentType', async () => {
    const buildingRules = await regulationsService.searchRules({ categoryId: 'rc-1' })
    expect(buildingRules.length).toBeGreaterThan(0)
    expect(buildingRules.every((r) => r.categoryId === 'rc-1')).toBe(true)

    const actRules = await regulationsService.searchRules({ documentType: 'act' })
    expect(actRules.length).toBeGreaterThan(0)
    expect(actRules.every((r) => r.documentType === 'act')).toBe(true)
  })

  it('returns empty array when search query matches nothing', async () => {
    const results = await regulationsService.searchRules({ query: 'completely_unmatched_alien_statute' })
    expect(results).toEqual([])
  })
})
