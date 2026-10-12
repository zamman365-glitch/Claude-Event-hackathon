import { describe, it, expect } from 'vitest'
import { STRINGS } from './strings'

describe('Bilingual Localization Parity (Phase 5 & 7)', () => {
  it('ensures identical key coverage between English and Hindi catalogs', () => {
    const enKeys = Object.keys(STRINGS.en)
    const hiKeys = Object.keys(STRINGS.hi)

    // Check count parity
    expect(enKeys.length).toBe(hiKeys.length)

    // Check each key in en exists in hi
    const missingInHi = enKeys.filter((k) => !(k in STRINGS.hi))
    expect(missingInHi).toEqual([])

    // Check each key in hi exists in en
    const missingInEn = hiKeys.filter((k) => !(k in STRINGS.en))
    expect(missingInEn).toEqual([])
  })

  it('ensures no empty or undefined string values in either language catalog', () => {
    for (const [key, value] of Object.entries(STRINGS.en)) {
      expect(typeof value, `en.${key} must be a string`).toBe('string')
      expect(value.trim().length, `en.${key} must not be empty`).toBeGreaterThan(0)
    }

    for (const [key, value] of Object.entries(STRINGS.hi)) {
      expect(typeof value, `hi.${key} must be a string`).toBe('string')
      expect(value.trim().length, `hi.${key} must not be empty`).toBeGreaterThan(0)
    }
  })

  it('validates critical legal disclaimers and verified notices exist in both languages', () => {
    expect(STRINGS.en.verifiedCorpusNotice).toBeDefined()
    expect(STRINGS.hi.verifiedCorpusNotice).toBeDefined()
    expect(STRINGS.hi.verifiedCorpusNotice).toContain('वैधानिक डेटा')
  })
})
