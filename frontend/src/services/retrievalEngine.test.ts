import { describe, it, expect } from 'vitest'
import { tokenize, retrieveRules } from './retrievalEngine'
import { qaService } from './qaService'

describe('Deterministic Retrieval Engine (Phase 4)', () => {
  it('tokenizes English and Hindi queries correctly', () => {
    const enTokens = tokenize('What is the minimum setback required from agricultural boundary?')
    expect(enTokens).toContain('minimum')
    expect(enTokens).toContain('setback')
    expect(enTokens).toContain('agricultural')
    expect(enTokens).toContain('boundary')
    expect(enTokens).not.toContain('is')
    expect(enTokens).not.toContain('the')

    const hiTokens = tokenize('कृषि भूमि की सीमा से न्यूनतम दूरी (सेटबैक) क्या है?')
    expect(hiTokens).toContain('कृषि')
    expect(hiTokens).toContain('भूमि')
    expect(hiTokens).toContain('सीमा')
    expect(hiTokens).toContain('दूरी')
    expect(hiTokens).toContain('सेटबैक')
  })

  it('retrieves Rule 14(3) on setback query with high confidence', async () => {
    const results = retrieveRules('What is the minimum setback from an agricultural land boundary?')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Rule 14(3)')
    expect(results[0].evidenceLevel).toBe('verified')
    expect(results[0].score).toBeGreaterThanOrEqual(0.65)
  })

  it('retrieves Rule 44 on FAR query with Table 7 context', async () => {
    const results = retrieveRules('What is the maximum permissible floor area ratio FAR in residential plots?')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toContain('Rule 44')
    expect(results[0].evidenceLevel).toBe('verified')
    expect(results[0].rule.statutoryTable).toBeDefined()
  })

  it('retrieves Section 165 on land conversion / diversion query', async () => {
    const results = retrieveRules('How to convert agricultural land to residential use under MPLRC?')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Section 165')
    expect(results[0].rule.documentTitle).toContain('Madhya Pradesh Land Revenue Code')
  })

  it('retrieves Section 237 on Nistar rights query in Hindi', async () => {
    const results = retrieveRules('क्या निस्तार या चरनोई भूमि पर निर्माण किया जा सकता है?')
    expect(results.length).toBeGreaterThan(0)
    const ruleNumbers = results.map(r => r.rule.ruleNumber)
    expect(ruleNumbers).toContain('Section 237')
  })

  it('retrieves Section 58 on Panchayat building permission (naksha pass)', async () => {
    const results = retrieveRules('How do I apply for a building permit naksha pass in gram panchayat?')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Section 58')
    expect(results[0].rule.documentTitle).toContain('Panchayat Raj')
  })

  it('retrieves RFCTLARR Act on land acquisition compensation', async () => {
    const results = retrieveRules('What is the compensation and solatium multiplier for land acquisition?')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Section 26 to 30')
    expect(results[0].rule.documentTitle).toContain('RFCTLARR')
  })

  it('retrieves Canal setback under Irrigation Act', async () => {
    const results = retrieveRules('Canal setback distance from water drainage')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Section 27(b)')
  })

  it('returns insufficient evidence when query has no statutory match', async () => {
    const answer = await qaService.askQuestion('Can I build an astronomical space telescope launchpad in Bhopal?')
    expect(answer.evidenceLevel).toBe('insufficient')
    expect(answer.evidence.length).toBe(0)
    expect(answer.isMockData).toBe(false)
  })

  it('preserves numerical values, units, conditions, and table context', async () => {
    const answer = await qaService.askQuestion('Rule 44 floor area ratio FAR')
    expect(answer.answerText).toContain('1.50')
    expect(answer.answerText).toContain('Mandatory Conditions')
    expect(answer.evidence[0].pdfPage).toBe(63)
    expect(answer.evidence[0].officialUrl).toBeDefined()
  })

  it('retrieves RFCTLARR Act on Hindi acquisition query with verified confidence', async () => {
    const answer = await qaService.askQuestion('सरकार द्वारा भूमि अधिग्रहण पर मुझे कितना मुआवजा मिलेगा?')
    expect(answer.evidenceLevel).toBe('verified')
    expect(answer.evidence[0].ruleNumber).toBe('Section 26 to 30')
    expect(answer.evidence[0].pdfPage).toBe(18)
    expect(answer.answerTextHi).toContain('सांत्वना राशि')
  })

  it('retrieves Rule 67(2) on rainwater harvesting query', async () => {
    const results = retrieveRules('mandatory rain water harvesting recharge pit on 100 sq.m plot')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Rule 67(2)')
    expect(results[0].evidenceLevel).toBe('verified')
  })

  it('retrieves Rule 52(1)(a) on water body 30m buffer query', async () => {
    const results = retrieveRules('lake river buffer distance 30 metres HFL highest flood level')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Rule 52(1)(a)')
    expect(results[0].evidenceLevel).toBe('verified')
  })

  it('retrieves Section 248 on unauthorised encroachment penalty query', async () => {
    const results = retrieveRules('unauthorised construction penalty 20 percent eviction nistar land')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].rule.ruleNumber).toBe('Section 248')
    expect(results[0].evidenceLevel).toBe('verified')
  })

  it('returns insufficient evidence for completely unrelated queries', async () => {
    const answer1 = await qaService.askQuestion('How do I cook Hyderabadi biryani with saffron?')
    expect(answer1.evidenceLevel).toBe('insufficient')
    expect(answer1.evidence.length).toBe(0)

    const answer2 = await qaService.askQuestion('What is the corporate GST tax rate for software exports?')
    expect(answer2.evidenceLevel).toBe('insufficient')
    expect(answer2.evidence.length).toBe(0)
  })

  it('handles empty query with validation error', async () => {
    await expect(qaService.askQuestion('   ')).rejects.toThrow('Question cannot be empty')
  })
})
