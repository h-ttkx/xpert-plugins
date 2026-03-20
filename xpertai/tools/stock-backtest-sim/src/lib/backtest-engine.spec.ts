import { runMomentumBacktest, runStressTest } from './backtest-engine.js'

describe('backtest-engine', () => {
  it('runs momentum backtest and returns summary', () => {
    const makeSeries = (code: string, base: number, slope: number) => ({
      code,
      prices: Array.from({ length: 80 }, (_, idx) => ({
        date: `2026-01-${String((idx % 28) + 1).padStart(2, '0')}`,
        close: base + slope * idx
      }))
    })

    const result = runMomentumBacktest([
      makeSeries('AAA', 10, 0.2),
      makeSeries('BBB', 12, 0.1),
      makeSeries('CCC', 8, 0.05)
    ], {
      initialCapital: 1_000_000,
      lookbackDays: 20,
      rebalanceEveryDays: 5,
      topN: 2,
      benchmarkSeries: Array.from({ length: 80 }, (_, idx) => ({
        date: `2026-01-${String((idx % 28) + 1).padStart(2, '0')}`,
        close: 100 + idx * 0.08
      }))
    })

    expect(result.summary.finalCapital).toBeGreaterThan(0)
    expect(result.equityCurve.length).toBeGreaterThan(10)
    expect(result.costBreakdown.totalCost).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.attribution)).toBe(true)
    expect(result.benchmark?.benchmarkTotalReturn).not.toBeNull()
  })

  it('computes stress test scenario pnl', () => {
    const report = runStressTest([
      { code: 'AAA', quantity: 1000, price: 10, beta: 1.2 },
      { code: 'BBB', quantity: 2000, price: 20, beta: 0.8 }
    ], [
      { name: 'shock', marketShock: -0.1, betaScale: 1 }
    ])

    expect(report.baseValue).toBe(50_000)
    expect(report.scenarios[0].pnl).toBeLessThan(0)
    expect(report.scenarios[0].returnRate).toBeLessThan(0)
  })
})
