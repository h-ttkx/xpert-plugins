import { buildRebalanceOrders, buildTargetWeights } from './portfolio-constructor.js'

describe('portfolio-constructor', () => {
  it('builds long-only target weights under single weight cap', () => {
    const result = buildTargetWeights([
      { code: 'AAA', score: 0.9, expectedReturn: 0.2, risk: 0.25, industry: 'tech' },
      { code: 'BBB', score: 0.7, expectedReturn: 0.15, risk: 0.2, industry: 'tech' },
      { code: 'CCC', score: 0.6, expectedReturn: 0.12, risk: 0.18, industry: 'finance' }
    ], {
      maxPositions: 3,
      maxSingleWeight: 0.5,
      maxIndustryWeight: 0.8
    })

    expect(result.targetWeights.length).toBe(3)
    const sum = result.targetWeights.reduce((acc, item) => acc + item.weight, 0)
    expect(sum).toBeCloseTo(1, 6)
    expect(result.targetWeights.every((item) => item.weight <= 0.500001)).toBe(true)
  })

  it('creates buy and sell rebalance orders', () => {
    const plan = buildRebalanceOrders(
      1_000_000,
      [
        { code: 'AAA', quantity: 1000, price: 100 },
        { code: 'DDD', quantity: 2000, price: 20 }
      ],
      [
        { code: 'AAA', weight: 0.2, industry: 'TECH', score: 0.8, price: 100 },
        { code: 'BBB', weight: 0.3, industry: 'BANK', score: 0.7, price: 50 }
      ],
      { AAA: 100, BBB: 50, DDD: 20 },
      100
    )

    expect(plan.orders.some((item) => item.code === 'BBB' && item.side === 'buy')).toBe(true)
    expect(plan.orders.some((item) => item.code === 'DDD' && item.side === 'sell')).toBe(true)
  })
})
