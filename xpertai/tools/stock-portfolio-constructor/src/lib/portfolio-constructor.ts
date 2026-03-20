import { CandidateSignal, Position, RebalanceOrder, TargetWeight } from './types.js'

interface BuildOptions {
  maxPositions?: number
  longOnly?: boolean
  maxSingleWeight?: number
  maxIndustryWeight?: number
  minWeight?: number
}

interface BuildResult {
  targetWeights: TargetWeight[]
  dropped: string[]
}

function scoreToAlpha(candidate: CandidateSignal): number {
  const expected = Number.isFinite(candidate.expectedReturn as number)
    ? Number(candidate.expectedReturn)
    : Math.max(0.01, Math.abs(candidate.score) * 0.1)
  const risk = Number.isFinite(candidate.risk as number)
    ? Math.max(0.01, Number(candidate.risk))
    : 0.2
  return Math.max(0, candidate.score) * (expected / risk)
}

function normalize(weights: Array<{ code: string; weight: number; industry: string; score: number; expectedReturn?: number; price?: number }>) {
  const total = weights.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) return weights
  return weights.map((item) => ({ ...item, weight: item.weight / total }))
}

function capSingle(weights: Array<{ code: string; weight: number; industry: string; score: number; expectedReturn?: number; price?: number }>, cap: number) {
  let output = [...weights]
  for (let round = 0; round < 4; round++) {
    let overflow = 0
    const bounded = output.map((item) => {
      if (item.weight > cap) {
        overflow += item.weight - cap
        return { ...item, weight: cap }
      }
      return item
    })

    if (overflow <= 1e-10) {
      output = bounded
      break
    }

    const receivers = bounded.filter((item) => item.weight < cap - 1e-10)
    if (receivers.length === 0) {
      output = bounded
      break
    }

    const receiverWeight = receivers.reduce((sum, item) => sum + item.weight, 0)
    output = bounded.map((item) => {
      if (item.weight >= cap - 1e-10) return item
      const ratio = receiverWeight > 0 ? item.weight / receiverWeight : 1 / receivers.length
      return { ...item, weight: item.weight + overflow * ratio }
    })
  }
  return output
}

function capIndustry(weights: Array<{ code: string; weight: number; industry: string; score: number; expectedReturn?: number; price?: number }>, cap: number) {
  let output = [...weights]
  for (let round = 0; round < 4; round++) {
    const industryTotals = new Map<string, number>()
    for (const item of output) {
      industryTotals.set(item.industry, (industryTotals.get(item.industry) || 0) + item.weight)
    }

    let overflow = 0
    const bounded = output.map((item) => {
      const industryTotal = industryTotals.get(item.industry) || 0
      if (industryTotal <= cap + 1e-10) return item
      const nextWeight = industryTotal > 0 ? item.weight * (cap / industryTotal) : item.weight
      overflow += item.weight - nextWeight
      return { ...item, weight: nextWeight }
    })

    if (overflow <= 1e-10) {
      output = bounded
      break
    }

    const industryAfter = new Map<string, number>()
    for (const item of bounded) {
      industryAfter.set(item.industry, (industryAfter.get(item.industry) || 0) + item.weight)
    }

    const receivers = bounded.filter((item) => (industryAfter.get(item.industry) || 0) < cap - 1e-10)
    if (receivers.length === 0) {
      output = bounded
      break
    }

    const receiverSum = receivers.reduce((sum, item) => sum + item.weight, 0)
    output = bounded.map((item) => {
      if ((industryAfter.get(item.industry) || 0) >= cap - 1e-10) return item
      const ratio = receiverSum > 0 ? item.weight / receiverSum : 1 / receivers.length
      return { ...item, weight: item.weight + overflow * ratio }
    })
  }

  return output
}

export function buildTargetWeights(candidates: CandidateSignal[], options: BuildOptions = {}): BuildResult {
  const maxPositions = options.maxPositions ?? 10
  const longOnly = options.longOnly ?? true
  const maxSingleWeight = options.maxSingleWeight ?? 0.2
  const maxIndustryWeight = options.maxIndustryWeight ?? 0.35
  const minWeight = options.minWeight ?? 0.01

  let pool = candidates
    .map((item) => ({ ...item, code: item.code.toUpperCase(), industry: (item.industry || 'UNKNOWN').toUpperCase() }))
    .filter((item) => Number.isFinite(item.score))

  if (longOnly) {
    pool = pool.filter((item) => item.score > 0)
  }

  pool.sort((a, b) => b.score - a.score)

  const selected = pool.slice(0, maxPositions)
  const dropped = pool.slice(maxPositions).map((item) => item.code)
  if (selected.length === 0) {
    return { targetWeights: [], dropped }
  }

  const withAlpha = selected.map((item) => ({
    code: item.code,
    score: item.score,
    industry: item.industry,
    expectedReturn: item.expectedReturn,
    price: item.price,
    weight: scoreToAlpha(item)
  }))

  let weights = normalize(withAlpha)
  weights = capSingle(weights, maxSingleWeight)
  weights = normalize(weights)
  weights = capIndustry(weights, maxIndustryWeight)
  weights = normalize(weights)

  weights = weights.filter((item) => item.weight >= minWeight)
  weights = normalize(weights)

  return {
    targetWeights: weights.map((item) => ({
      code: item.code,
      weight: item.weight,
      industry: item.industry,
      expectedReturn: item.expectedReturn,
      price: item.price,
      score: item.score
    })),
    dropped
  }
}

function positionValue(position: Position): number {
  return Math.max(0, position.quantity * position.price)
}

export function buildRebalanceOrders(
  totalCapital: number,
  currentPositions: Position[],
  targetWeights: TargetWeight[],
  priceMap: Record<string, number>,
  lotSize = 1
): { orders: RebalanceOrder[]; estimatedTurnover: number; netCashDelta: number } {
  const safeLotSize = Math.max(1, Math.floor(lotSize))
  const currentMap = new Map(currentPositions.map((item) => [item.code.toUpperCase(), item]))

  const orders: RebalanceOrder[] = []
  let turnover = 0
  let netCashDelta = 0

  for (const target of targetWeights) {
    const code = target.code.toUpperCase()
    const current = currentMap.get(code)
    const refPrice = Number.isFinite(priceMap[code]) ? priceMap[code] : (current?.price || target.price || 0)
    if (refPrice <= 0) continue

    const targetValue = totalCapital * target.weight
    const currentValue = current ? positionValue(current) : 0
    const deltaValue = targetValue - currentValue
    const quantityRaw = Math.floor(Math.abs(deltaValue) / refPrice)
    const quantity = Math.floor(quantityRaw / safeLotSize) * safeLotSize
    if (quantity <= 0) continue

    const side: 'buy' | 'sell' = deltaValue >= 0 ? 'buy' : 'sell'
    const amount = quantity * refPrice
    orders.push({
      code,
      side,
      quantity,
      price: refPrice,
      estimatedAmount: amount
    })

    turnover += amount
    netCashDelta += side === 'buy' ? -amount : amount
  }

  for (const current of currentPositions) {
    const code = current.code.toUpperCase()
    if (targetWeights.some((item) => item.code.toUpperCase() === code)) continue
    const quantity = Math.floor(Math.max(0, current.quantity) / safeLotSize) * safeLotSize
    if (quantity <= 0) continue
    const refPrice = Number.isFinite(priceMap[code]) ? priceMap[code] : current.price
    if (refPrice <= 0) continue
    const amount = quantity * refPrice
    orders.push({
      code,
      side: 'sell',
      quantity,
      price: refPrice,
      estimatedAmount: amount
    })
    turnover += amount
    netCashDelta += amount
  }

  return {
    orders,
    estimatedTurnover: turnover,
    netCashDelta
  }
}
