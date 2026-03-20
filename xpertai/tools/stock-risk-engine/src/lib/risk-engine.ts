import { OrderInput, PortfolioRiskReport, PositionInput, RiskLimits } from './types.js'

const SQRT_252 = Math.sqrt(252)

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxSingleWeight: 0.2,
  maxIndustryWeight: 0.35,
  maxLeverage: 1,
  maxPortfolioVolatility: 0.35,
  maxVaRRatio: 0.03,
  confidenceZ: 1.65,
  horizonDays: 1
}

function normalizeLimits(input: Partial<RiskLimits> = {}): RiskLimits {
  return {
    ...DEFAULT_RISK_LIMITS,
    ...input
  }
}

function marketValue(position: PositionInput): number {
  return Math.max(0, position.quantity * position.price)
}

function toWeight(value: number, totalCapital: number): number {
  if (totalCapital <= 0) return 0
  return value / totalCapital
}

function clampMin(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function evaluatePortfolioRisk(
  totalCapital: number,
  positions: PositionInput[],
  inputLimits: Partial<RiskLimits> = {}
): PortfolioRiskReport {
  const limits = normalizeLimits(inputLimits)
  const safeCapital = clampMin(totalCapital)
  const safePositions = positions.filter((p) => p.quantity > 0 && p.price > 0)

  const weightsByCode: Record<string, number> = {}
  const industryWeights: Record<string, number> = {}
  let grossExposure = 0
  let varianceApprox = 0

  for (const position of safePositions) {
    const value = marketValue(position)
    grossExposure += value

    const weight = toWeight(value, safeCapital)
    const code = position.code.toUpperCase()
    weightsByCode[code] = (weightsByCode[code] || 0) + weight

    const industry = (position.industry || 'UNKNOWN').toUpperCase()
    industryWeights[industry] = (industryWeights[industry] || 0) + weight

    const sigmaAnnual = Number.isFinite(position.annualVolatility as number)
      ? Math.max(0, Number(position.annualVolatility))
      : 0.3
    varianceApprox += Math.pow(weight * sigmaAnnual, 2)
  }

  const leverage = toWeight(grossExposure, safeCapital)
  const annualizedVolatility = Math.sqrt(varianceApprox)
  const dailyVolatility = annualizedVolatility / SQRT_252
  const varRatio = limits.confidenceZ * dailyVolatility * Math.sqrt(Math.max(1, limits.horizonDays))
  const varEstimate = varRatio * safeCapital

  let concentrationHHI = 0
  for (const weight of Object.values(weightsByCode)) {
    concentrationHHI += weight * weight
  }

  const violations: string[] = []

  for (const [code, weight] of Object.entries(weightsByCode)) {
    if (weight > limits.maxSingleWeight + 1e-12) {
      violations.push(`single_position_exceeded:${code}:${(weight * 100).toFixed(2)}%>${(limits.maxSingleWeight * 100).toFixed(2)}%`)
    }
  }

  for (const [industry, weight] of Object.entries(industryWeights)) {
    if (weight > limits.maxIndustryWeight + 1e-12) {
      violations.push(`industry_exceeded:${industry}:${(weight * 100).toFixed(2)}%>${(limits.maxIndustryWeight * 100).toFixed(2)}%`)
    }
  }

  if (leverage > limits.maxLeverage + 1e-12) {
    violations.push(`leverage_exceeded:${leverage.toFixed(4)}>${limits.maxLeverage.toFixed(4)}`)
  }

  if (annualizedVolatility > limits.maxPortfolioVolatility + 1e-12) {
    violations.push(`volatility_exceeded:${annualizedVolatility.toFixed(4)}>${limits.maxPortfolioVolatility.toFixed(4)}`)
  }

  if (varRatio > limits.maxVaRRatio + 1e-12) {
    violations.push(`var_exceeded:${(varRatio * 100).toFixed(2)}%>${(limits.maxVaRRatio * 100).toFixed(2)}%`)
  }

  return {
    pass: violations.length === 0,
    totalCapital: safeCapital,
    grossExposure,
    leverage,
    concentrationHHI,
    annualizedVolatility,
    varEstimate,
    varRatio,
    positionWeights: weightsByCode,
    industryWeights,
    violations
  }
}

function mergeOrder(positions: PositionInput[], order: OrderInput, applyQty: number): PositionInput[] {
  const orderCode = order.code.toUpperCase()
  const price = Math.max(0, order.price)
  const index = positions.findIndex((item) => item.code.toUpperCase() === orderCode)
  const next = positions.map((item) => ({ ...item }))

  if (index < 0) {
    if (order.side === 'buy' && applyQty > 0) {
      next.push({
        code: orderCode,
        quantity: applyQty,
        price,
        industry: order.industry || 'UNKNOWN',
        annualVolatility: 0.3
      })
    }
    return next
  }

  const current = { ...next[index] }
  if (order.side === 'buy') {
    current.quantity += applyQty
    current.price = price || current.price
    current.industry = order.industry || current.industry
  } else {
    current.quantity = Math.max(0, current.quantity - applyQty)
  }

  if (current.quantity <= 0) {
    next.splice(index, 1)
  } else {
    next[index] = current
  }

  return next
}

export function evaluateOrderRisk(
  totalCapital: number,
  positions: PositionInput[],
  order: OrderInput,
  inputLimits: Partial<RiskLimits> = {}
) {
  const limits = normalizeLimits(inputLimits)
  const safeCapital = clampMin(totalCapital)
  const safeOrderQty = Math.max(0, Math.floor(order.quantity))
  const safePrice = Math.max(0, order.price)
  if (safeOrderQty === 0 || safePrice <= 0) {
    return {
      requestedQuantity: safeOrderQty,
      allowedQuantity: 0,
      pass: false,
      reason: 'invalid_order_input',
      reportAfter: evaluatePortfolioRisk(safeCapital, positions, limits)
    }
  }

  if (order.side === 'sell') {
    const existing = positions.find((p) => p.code.toUpperCase() === order.code.toUpperCase())
    const maxSell = existing ? Math.floor(Math.max(0, existing.quantity)) : 0
    const allowedQuantity = Math.min(maxSell, safeOrderQty)
    const reportAfter = evaluatePortfolioRisk(safeCapital, mergeOrder(positions, order, allowedQuantity), limits)
    return {
      requestedQuantity: safeOrderQty,
      allowedQuantity,
      pass: allowedQuantity > 0,
      reason: allowedQuantity > 0 ? 'ok' : 'no_position_to_sell',
      reportAfter
    }
  }

  const currentReport = evaluatePortfolioRisk(safeCapital, positions, limits)
  const currentCode = order.code.toUpperCase()
  const currentPosition = positions.find((p) => p.code.toUpperCase() === currentCode)
  const currentIndustry = (order.industry || currentPosition?.industry || 'UNKNOWN').toUpperCase()

  const currentCodeWeight = currentReport.positionWeights[currentCode] || 0
  const currentIndustryWeight = currentReport.industryWeights[currentIndustry] || 0

  const codeHeadroomValue = Math.max(0, (limits.maxSingleWeight - currentCodeWeight) * safeCapital)
  const industryHeadroomValue = Math.max(0, (limits.maxIndustryWeight - currentIndustryWeight) * safeCapital)
  const leverageHeadroomValue = Math.max(0, limits.maxLeverage * safeCapital - currentReport.grossExposure)

  const allowedByRule = Math.floor(Math.min(codeHeadroomValue, industryHeadroomValue, leverageHeadroomValue) / safePrice)
  const tentativeAllowed = Math.max(0, Math.min(safeOrderQty, allowedByRule))

  let allowedQuantity = tentativeAllowed
  let reportAfter = evaluatePortfolioRisk(safeCapital, mergeOrder(positions, order, allowedQuantity), limits)

  while (allowedQuantity > 0 && !reportAfter.pass) {
    allowedQuantity -= 1
    reportAfter = evaluatePortfolioRisk(safeCapital, mergeOrder(positions, order, allowedQuantity), limits)
  }

  return {
    requestedQuantity: safeOrderQty,
    allowedQuantity,
    pass: allowedQuantity === safeOrderQty,
    reason: allowedQuantity === safeOrderQty ? 'ok' : allowedQuantity > 0 ? 'partially_allowed' : 'risk_limit_exceeded',
    reportAfter
  }
}
