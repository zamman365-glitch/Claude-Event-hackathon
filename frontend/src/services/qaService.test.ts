import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  qaService,
  mapBackendResponseToQAAnswer,
  STATUTORY_DOCUMENT_TITLE,
} from './qaService'
import { apiClient } from './api'
import type { BhumiVikasQueryResponse } from '../types'

describe('QA Service & Backend Response Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps answered status without warnings to "verified"', () => {
    const backendResp: BhumiVikasQueryResponse = {
      status: 'answered',
      answer: 'The minimum front setback for a 10m road is 3.6m.',
      rule_no: '56',
      rules_version: 'consolidated up to 2025-03-06',
      warnings: [],
      citations: [
        {
          rule: '56',
          page: 77,
          quote: 'Front open space shall not be less than 3.6 m',
        },
      ],
      disclaimer: 'The tool points to the rule; the clerk decides.',
    }

    const answer = mapBackendResponseToQAAnswer(backendResp, 'What is the front setback?')
    expect(answer.evidenceLevel).toBe('verified')
    expect(answer.isMockData).toBe(false)
    expect(answer.evidence.length).toBe(1)
    expect(answer.evidence[0].documentTitle).toBe(STATUTORY_DOCUMENT_TITLE)
    expect(answer.evidence[0].ruleNumber).toBe('Rule 56')
    expect(answer.evidence[0].pdfPage).toBe(77)
    expect(answer.evidence[0].originalText).toBe('Front open space shall not be less than 3.6 m')
  })

  it('maps answered status with warnings to "needs-verification"', () => {
    const backendResp: BhumiVikasQueryResponse = {
      status: 'answered',
      answer: 'Under gazette notification dated 28 Aug 2026, permission rules have changed.',
      rule_no: '14',
      rules_version: 'consolidated up to 2025-03-06',
      warnings: ['Post-consolidation amendment 28 Aug 2026 applies to this plot size.'],
      citations: [
        {
          rule: '14',
          page: 47,
          quote: 'Development permission under section 14',
        },
      ],
      disclaimer: 'The tool points to the rule; the clerk decides.',
    }

    const answer = mapBackendResponseToQAAnswer(backendResp, 'Do I need permission for 300 sqm plot?')
    expect(answer.evidenceLevel).toBe('needs-verification')
    expect(answer.warnings).toEqual([
      'Post-consolidation amendment 28 Aug 2026 applies to this plot size.',
    ])
  })

  it('maps not_found status to "insufficient"', () => {
    const backendResp: BhumiVikasQueryResponse = {
      status: 'not_found',
      answer: 'not found',
      rules_version: 'consolidated up to 2025-03-06',
      warnings: [],
      citations: [],
      disclaimer: 'The tool points to the rule; the clerk decides.',
    }

    const answer = mapBackendResponseToQAAnswer(backendResp, 'How do I pay property tax?')
    expect(answer.evidenceLevel).toBe('insufficient')
    expect(answer.evidence.length).toBe(0)
  })

  it('maps needs_info status and captures clarifying_question', () => {
    const backendResp: BhumiVikasQueryResponse = {
      status: 'needs_info',
      answer: 'Please specify the width of the road facing your plot.',
      clarifying_question: 'What is the width of the facing street/road in metres?',
      rules_version: 'consolidated up to 2025-03-06',
      warnings: [],
      citations: [],
      disclaimer: 'The tool points to the rule; the clerk decides.',
    }

    const answer = mapBackendResponseToQAAnswer(backendResp, 'What is my setback?')
    expect(answer.status).toBe('needs_info')
    expect(answer.clarifying_question).toBe(
      'What is the width of the facing street/road in metres?',
    )
  })

  it('preserves calculations for front open space, rear open space, far, and fees', () => {
    const backendResp: BhumiVikasQueryResponse = {
      status: 'answered',
      answer: 'Calculation complete.',
      rule_no: '56',
      rules_version: 'consolidated up to 2025-03-06',
      warnings: [],
      citations: [],
      calculation: {
        front_open_space: {
          rule: '56(1)(a)',
          page: 76,
          front_open_space_m: 3.0,
          street_width_m: 9.0,
          building_height_m: 9.0,
          slab_label: 'Up to 12m street width',
        },
        rear_open_space: {
          rule: '56(2)(a)',
          page: 77,
          rear_open_space_m: 2.5,
          plot_area_sqm: 200.0,
          slab_label: 'Plots up to 250 sqm',
        },
        far: {
          rule: '61 Table 8',
          page: 83,
          use_group: 'residential',
          category: 'Standard',
          far: 1.5,
          plot_area_sqm: 200.0,
          max_builtup_area_sqm: 300.0,
        },
        fees: {
          rule: '21',
          page: 35,
          built_up_area_sqm: 200.0,
          use_group: 'residential',
          application_fee_rs: 200.0,
          permission_fee_rs: 2000.0,
          total_fee_rs: 2200.0,
        },
      },
      disclaimer: 'The tool points to the rule; the clerk decides.',
    }

    const answer = mapBackendResponseToQAAnswer(backendResp, 'Calculate my setbacks and fees')
    expect(answer.calculation).toBeDefined()
    expect(answer.calculation?.front_open_space?.front_open_space_m).toBe(3.0)
    expect(answer.calculation?.rear_open_space?.rear_open_space_m).toBe(2.5)
    expect(answer.calculation?.far?.far).toBe(1.5)
    expect(answer.calculation?.fees?.total_fee_rs).toBe(2200.0)
  })

  it('starts query history empty', async () => {
    const history = await qaService.getHistory()
    expect(history).toEqual([])
  })

  it('calls POST /api/query with { query }', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        status: 'answered',
        answer: 'Front setback is 3.0m.',
        rule_no: '56',
        rules_version: 'consolidated up to 2025-03-06',
        warnings: [],
        citations: [{ rule: '56', page: 76, quote: 'Front setback quote' }],
        disclaimer: 'Disclaimer text',
      },
    } as any)

    const answer = await qaService.askQuestion('front setback on 9m road')
    expect(mockPost).toHaveBeenCalledWith('/api/query', { query: 'front setback on 9m road' })
    expect(answer.evidenceLevel).toBe('verified')
    expect(answer.answerText).toBe('Front setback is 3.0m.')
  })
})
