import { evaluateOrderRisk, evaluatePortfolioRisk } from './risk-engine.js'

describe('risk-engine', () => {
  it('flags concentration violations for oversized position', () => {
    const report = evaluatePortfolioRisk(1_000_000, [
      { code: '600519', quantity: 1000, price: 600, industry: 'liquor', annualVolatility: 0.28 },
      { code: '000001', quantity: 1000, price: 100, industry: 'bank', annualVolatility: 0.2 }
    ], {
      maxSingleWeight: 0.5,
      maxIndustryWeight: 0.7,
      maxLeverage: 1,
      maxPortfolioVolatility: 1,
      maxVaRRatio: 1
    })

    expect(report.pass).toBe(false)
    expect(report.violations.some((item) => item.startsWith('single_position_exceeded:600519'))).toBe(true)
  })

  it('caps buy order quantity when headroom is insufficient', () => {
    const decision = evaluateOrderRisk(1_000_000, [
      { code: '600519', quantity: 1000, price: 100, industry: 'liquor' }
    ], {
      code: '600519',
      side: 'buy',
      quantity: 10_000,
      price: 100,
      industry: 'liquor'
    }, {
      maxSingleWeight: 0.2,
      maxIndustryWeight: 0.25,
      maxLeverage: 1,
      maxPortfolioVolatility: 1,
      maxVaRRatio: 1
    })

    expect(decision.requestedQuantity).toBe(10_000)
    expect(decision.allowedQuantity).toBeLessThan(10_000)
    expect(decision.allowedQuantity).toBeGreaterThan(0)
  })
})
