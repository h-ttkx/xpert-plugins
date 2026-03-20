export const StockRiskEngineProvider = 'stock-risk-engine'

export interface PositionInput {
  code: string
  quantity: number
  price: number
  industry?: string
  annualVolatility?: number
}

export interface OrderInput {
  code: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  industry?: string
}

export interface RiskLimits {
  maxSingleWeight: number
  maxIndustryWeight: number
  maxLeverage: number
  maxPortfolioVolatility: number
  maxVaRRatio: number
  confidenceZ: number
  horizonDays: number
}

export interface PortfolioRiskReport {
  pass: boolean
  totalCapital: number
  grossExposure: number
  leverage: number
  concentrationHHI: number
  annualizedVolatility: number
  varEstimate: number
  varRatio: number
  positionWeights: Record<string, number>
  industryWeights: Record<string, number>
  violations: string[]
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWY0NDQ0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDdoLTlMNyAzSCA0djE4aDE2WiIvPjxwYXRoIGQ9Ik0xMiAxMnY0Ii8+PHBhdGggZD0iTTEyIDhoLjAxIi8+PC9zdmc+`
