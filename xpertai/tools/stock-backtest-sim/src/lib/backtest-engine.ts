import { Holding, PricePoint, StressPosition, SymbolSeries } from './types.js'

interface BacktestOptions {
  initialCapital: number
  lookbackDays?: number
  rebalanceEveryDays?: number
  topN?: number
  feeRate?: number
  slippageRate?: number
  maxSingleWeight?: number
  cashReserveRatio?: number
  benchmarkSeries?: PricePoint[]
}

interface EquityPoint {
  date: string
  equity: number
}

interface TradeLog {
  date: string
  code: string
  side: 'buy' | 'sell'
  quantity: number
  midPrice: number
  price: number
  amount: number
  fee: number
  slippageCost: number
}

interface AttributionRow {
  code: string
  pnl: number
  contribution: number
  endingValue: number
}

const SQRT_252 = Math.sqrt(252)

function safePrice(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function alignSeries(series: SymbolSeries[]): { dates: string[]; closesByCode: Record<string, number[]> } {
  const minLen = Math.min(...series.map((item) => item.prices.length))
  if (!Number.isFinite(minLen) || minLen <= 1) {
    return { dates: [], closesByCode: {} }
  }

  const trimmed = series.map((item) => ({
    code: item.code.toUpperCase(),
    prices: item.prices.slice(-minLen)
  }))

  const dates = trimmed[0].prices.map((item) => item.date)
  const closesByCode: Record<string, number[]> = {}
  for (const item of trimmed) {
    closesByCode[item.code] = item.prices.map((point) => safePrice(point.close))
  }

  return { dates, closesByCode }
}

function portfolioValue(holdings: Map<string, Holding>, prices: Record<string, number>, cash: number): number {
  let value = cash
  for (const item of holdings.values()) {
    const price = prices[item.code] || 0
    value += item.quantity * price
  }
  return value
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, item) => sum + item, 0) / values.length
}

function sampleVariance(values: number[]): number {
  if (values.length <= 1) return 0
  const m = mean(values)
  return values.reduce((sum, item) => sum + (item - m) * (item - m), 0) / (values.length - 1)
}

function annualizedReturn(totalReturn: number, days: number): number {
  if (!Number.isFinite(totalReturn) || days <= 0) return 0
  return Math.pow(1 + totalReturn, 252 / days) - 1
}

function computeBenchmarkStats(
  equityCurve: EquityPoint[],
  benchmarkSeries: PricePoint[] | undefined,
  strategyAnnualizedReturn: number
) {
  if (!benchmarkSeries || benchmarkSeries.length < 2 || equityCurve.length < 2) {
    return null
  }

  const benchmarkByDate = new Map<string, number>()
  for (const point of benchmarkSeries) {
    const close = safePrice(point.close)
    if (close > 0) {
      benchmarkByDate.set(point.date, close)
    }
  }

  const alignedBenchmark: Array<{ date: string; close: number }> = []
  for (const point of equityCurve) {
    const close = benchmarkByDate.get(point.date)
    if (close && close > 0) {
      alignedBenchmark.push({ date: point.date, close })
    }
  }

  if (alignedBenchmark.length < 2) {
    return null
  }

  const benchStart = alignedBenchmark[0].close
  const benchEnd = alignedBenchmark[alignedBenchmark.length - 1].close
  const benchmarkTotalReturn = benchStart > 0 ? benchEnd / benchStart - 1 : 0
  const benchmarkAnnualizedReturn = annualizedReturn(benchmarkTotalReturn, alignedBenchmark.length - 1)

  const strategyReturns: number[] = []
  const benchmarkReturns: number[] = []

  for (let i = 1; i < alignedBenchmark.length; i++) {
    const date = alignedBenchmark[i].date
    const prevDate = alignedBenchmark[i - 1].date

    const strategyNow = equityCurve.find((item) => item.date === date)?.equity || 0
    const strategyPrev = equityCurve.find((item) => item.date === prevDate)?.equity || 0
    const benchNow = alignedBenchmark[i].close
    const benchPrev = alignedBenchmark[i - 1].close

    if (strategyNow > 0 && strategyPrev > 0 && benchNow > 0 && benchPrev > 0) {
      strategyReturns.push(strategyNow / strategyPrev - 1)
      benchmarkReturns.push(benchNow / benchPrev - 1)
    }
  }

  if (strategyReturns.length < 2 || benchmarkReturns.length < 2) {
    return {
      benchmarkTotalReturn,
      benchmarkAnnualizedReturn,
      excessReturn: strategyAnnualizedReturn - benchmarkAnnualizedReturn,
      beta: null,
      alphaAnnualized: null,
      trackingError: null,
      informationRatio: null
    }
  }

  const strategyMean = mean(strategyReturns)
  const benchmarkMean = mean(benchmarkReturns)
  const benchmarkVar = sampleVariance(benchmarkReturns)

  let covariance = 0
  for (let i = 0; i < strategyReturns.length; i++) {
    covariance += (strategyReturns[i] - strategyMean) * (benchmarkReturns[i] - benchmarkMean)
  }
  covariance = covariance / Math.max(1, strategyReturns.length - 1)

  const beta = benchmarkVar > 0 ? covariance / benchmarkVar : 0
  const alphaAnnualized = strategyAnnualizedReturn - beta * benchmarkAnnualizedReturn

  const excessDaily = strategyReturns.map((value, idx) => value - benchmarkReturns[idx])
  const trackingErrorDaily = Math.sqrt(Math.max(0, sampleVariance(excessDaily)))
  const trackingError = trackingErrorDaily * SQRT_252
  const informationRatio = trackingErrorDaily > 0 ? (mean(excessDaily) / trackingErrorDaily) * SQRT_252 : 0

  return {
    benchmarkTotalReturn,
    benchmarkAnnualizedReturn,
    excessReturn: strategyAnnualizedReturn - benchmarkAnnualizedReturn,
    beta,
    alphaAnnualized,
    trackingError,
    informationRatio
  }
}

export function runMomentumBacktest(series: SymbolSeries[], options: BacktestOptions) {
  const lookbackDays = options.lookbackDays ?? 20
  const rebalanceEveryDays = options.rebalanceEveryDays ?? 5
  const topN = options.topN ?? 3
  const feeRate = options.feeRate ?? 0.0005
  const slippageRate = options.slippageRate ?? 0.0005
  const maxSingleWeight = options.maxSingleWeight ?? 0.4
  const cashReserveRatio = options.cashReserveRatio ?? 0.05

  const aligned = alignSeries(series.filter((item) => item.prices.length > lookbackDays + 2))
  if (aligned.dates.length <= lookbackDays + 1) {
    throw new Error('not_enough_price_history')
  }

  let cash = options.initialCapital
  const holdings = new Map<string, Holding>()
  const equityCurve: EquityPoint[] = []
  const trades: TradeLog[] = []

  let totalFees = 0
  let totalSlippageCost = 0
  let turnover = 0

  const pnlLedger = new Map<string, { buyCost: number; sellProceeds: number; quantity: number }>()

  const updateLedger = (code: string, side: 'buy' | 'sell', quantity: number, netCashEffect: number) => {
    const key = code.toUpperCase()
    const current = pnlLedger.get(key) || { buyCost: 0, sellProceeds: 0, quantity: 0 }
    if (side === 'buy') {
      current.buyCost += Math.max(0, -netCashEffect)
      current.quantity += quantity
    } else {
      current.sellProceeds += Math.max(0, netCashEffect)
      current.quantity -= quantity
    }
    pnlLedger.set(key, current)
  }

  for (let day = lookbackDays; day < aligned.dates.length; day++) {
    const date = aligned.dates[day]
    const dailyPrices: Record<string, number> = {}
    for (const [code, closes] of Object.entries(aligned.closesByCode)) {
      dailyPrices[code] = closes[day]
    }

    if ((day - lookbackDays) % rebalanceEveryDays === 0) {
      const momentum = Object.entries(aligned.closesByCode)
        .map(([code, closes]) => {
          const past = closes[day - lookbackDays]
          const now = closes[day]
          if (past <= 0 || now <= 0) return { code, score: Number.NEGATIVE_INFINITY }
          return { code, score: (now - past) / past }
        })
        .filter((item) => Number.isFinite(item.score) && item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)

      const selectedCodes = new Set(momentum.map((item) => item.code))
      const totalEquityBefore = portfolioValue(holdings, dailyPrices, cash)
      const investable = totalEquityBefore * (1 - cashReserveRatio)
      const baseWeight = momentum.length > 0 ? Math.min(maxSingleWeight, 1 / momentum.length) : 0

      const targetValueByCode: Record<string, number> = {}
      for (const item of momentum) {
        targetValueByCode[item.code] = investable * baseWeight
      }

      for (const [code, holding] of Array.from(holdings.entries())) {
        if (selectedCodes.has(code)) continue
        const midPrice = dailyPrices[code] || 0
        if (midPrice <= 0 || holding.quantity <= 0) continue
        const tradePrice = midPrice * (1 - slippageRate)
        const amount = holding.quantity * tradePrice
        const fee = amount * feeRate
        const slippageCost = holding.quantity * Math.max(0, midPrice - tradePrice)
        const netCash = amount - fee
        cash += netCash
        totalFees += fee
        totalSlippageCost += slippageCost
        turnover += amount
        updateLedger(code, 'sell', holding.quantity, netCash)
        trades.push({ date, code, side: 'sell', quantity: holding.quantity, midPrice, price: tradePrice, amount, fee, slippageCost })
        holdings.delete(code)
      }

      for (const [code, targetValue] of Object.entries(targetValueByCode)) {
        const midPrice = dailyPrices[code] || 0
        if (midPrice <= 0) continue
        const currentQty = holdings.get(code)?.quantity || 0
        const currentValue = currentQty * midPrice
        const delta = targetValue - currentValue
        if (Math.abs(delta) < midPrice) continue

        if (delta < 0) {
          const qtyToSell = Math.min(currentQty, Math.floor(Math.abs(delta) / midPrice))
          if (qtyToSell <= 0) continue
          const tradePrice = midPrice * (1 - slippageRate)
          const amount = qtyToSell * tradePrice
          const fee = amount * feeRate
          const slippageCost = qtyToSell * Math.max(0, midPrice - tradePrice)
          const netCash = amount - fee
          cash += netCash
          totalFees += fee
          totalSlippageCost += slippageCost
          turnover += amount
          holdings.set(code, { code, quantity: currentQty - qtyToSell })
          if ((holdings.get(code)?.quantity || 0) <= 0) holdings.delete(code)
          updateLedger(code, 'sell', qtyToSell, netCash)
          trades.push({ date, code, side: 'sell', quantity: qtyToSell, midPrice, price: tradePrice, amount, fee, slippageCost })
        } else {
          const qtyToBuy = Math.floor(delta / midPrice)
          if (qtyToBuy <= 0) continue
          const tradePrice = midPrice * (1 + slippageRate)
          const amount = qtyToBuy * tradePrice
          const fee = amount * feeRate
          const slippageCost = qtyToBuy * Math.max(0, tradePrice - midPrice)
          const totalCost = amount + fee
          if (totalCost > cash) continue
          cash -= totalCost
          totalFees += fee
          totalSlippageCost += slippageCost
          turnover += amount
          holdings.set(code, { code, quantity: currentQty + qtyToBuy })
          updateLedger(code, 'buy', qtyToBuy, -totalCost)
          trades.push({ date, code, side: 'buy', quantity: qtyToBuy, midPrice, price: tradePrice, amount, fee, slippageCost })
        }
      }
    }

    const equity = portfolioValue(holdings, dailyPrices, cash)
    equityCurve.push({ date, equity })
  }

  const first = equityCurve[0]?.equity || options.initialCapital
  const last = equityCurve[equityCurve.length - 1]?.equity || first
  const totalReturn = first > 0 ? last / first - 1 : 0

  const dailyReturns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity
    const now = equityCurve[i].equity
    if (prev > 0) dailyReturns.push(now / prev - 1)
  }

  const dailyVol = Math.sqrt(Math.max(0, sampleVariance(dailyReturns)))
  const annualVol = dailyVol * SQRT_252
  const annualReturn = annualizedReturn(totalReturn, Math.max(1, dailyReturns.length))
  const sharpe = annualVol > 0 ? annualReturn / annualVol : 0

  let peak = equityCurve[0]?.equity || 0
  let maxDrawdown = 0
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity)
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, (peak - point.equity) / peak)
    }
  }

  const finalPrices = equityCurve.length > 0
    ? Object.fromEntries(Object.entries(aligned.closesByCode).map(([code, values]) => [code, values[values.length - 1] || 0]))
    : {}

  const attribution: AttributionRow[] = []
  for (const [code, stats] of pnlLedger.entries()) {
    const endingValue = Math.max(0, stats.quantity) * (finalPrices[code] || 0)
    const pnl = stats.sellProceeds + endingValue - stats.buyCost
    attribution.push({
      code,
      pnl,
      contribution: options.initialCapital > 0 ? pnl / options.initialCapital : 0,
      endingValue
    })
  }
  attribution.sort((a, b) => b.pnl - a.pnl)

  const benchmark = computeBenchmarkStats(equityCurve, options.benchmarkSeries, annualReturn)

  return {
    summary: {
      startDate: equityCurve[0]?.date || null,
      endDate: equityCurve[equityCurve.length - 1]?.date || null,
      initialCapital: options.initialCapital,
      finalCapital: last,
      totalReturn,
      annualizedReturn: annualReturn,
      annualizedVolatility: annualVol,
      sharpe,
      maxDrawdown,
      tradeCount: trades.length,
      benchmarkTotalReturn: benchmark?.benchmarkTotalReturn ?? null,
      excessReturn: benchmark?.excessReturn ?? null
    },
    benchmark,
    costBreakdown: {
      turnover,
      totalFees,
      totalSlippageCost,
      totalCost: totalFees + totalSlippageCost
    },
    attribution,
    equityCurve,
    trades: trades.slice(-200)
  }
}

export function runStressTest(
  positions: StressPosition[],
  scenarios: Array<{ name: string; marketShock: number; betaScale?: number; perSymbolShock?: Record<string, number> }>
) {
  const baseValue = positions.reduce((sum, item) => sum + Math.max(0, item.quantity * item.price), 0)
  const results = scenarios.map((scenario) => {
    let pnl = 0
    for (const position of positions) {
      const code = position.code.toUpperCase()
      const beta = Number.isFinite(position.beta as number) ? Number(position.beta) : 1
      const betaScale = Number.isFinite(scenario.betaScale as number) ? Number(scenario.betaScale) : 1
      const symbolShock = scenario.perSymbolShock?.[code] ?? scenario.marketShock * beta * betaScale
      pnl += position.quantity * position.price * symbolShock
    }
    const stressedValue = baseValue + pnl
    return {
      name: scenario.name,
      marketShock: scenario.marketShock,
      pnl,
      stressedValue,
      returnRate: baseValue > 0 ? pnl / baseValue : 0
    }
  })

  return {
    baseValue,
    scenarios: results
  }
}
