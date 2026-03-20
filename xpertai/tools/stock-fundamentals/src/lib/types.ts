/**
 * 股票基本面工具集类型定义
 */

export const StockFundamentalsProvider = 'stock-fundamentals'

export enum MarketType {
  SH = 'sh',
  SZ = 'sz',
  HK = 'hk',
  US = 'us'
}

export interface FundamentalsData {
  code: string
  name: string
  market: MarketType
  pe: number | null
  peTTM: number | null
  pb: number | null
  ps: number | null
  marketCap: number | null
  totalShares: number | null
  floatShares: number | null
  roe: number | null
  roa: number | null
  grossMargin: number | null
  netMargin: number | null
  debtRatio: number | null
  currentRatio: number | null
  quickRatio: number | null
  dividendYield: number | null
  eps: number | null
  bvps: number | null
  updateDate: string
  source?: string
}

export interface FinancialStatement {
  code: string
  name: string
  market: MarketType
  reportDate: string
  reportType: 'annual' | 'quarterly'
  income: {
    revenue: number
    revenueGrowth: number | null
    operatingIncome: number
    netIncome: number
    netIncomeGrowth: number | null
    eps: number
  }
  balance: {
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    currentAssets: number
    currentLiabilities: number
    cash: number
  }
  cashFlow: {
    operatingCashFlow: number
    investingCashFlow: number
    financingCashFlow: number
    freeCashFlow: number | null
  }
  source?: string
}

export interface ValuationSnapshot {
  code: string
  name: string
  market: MarketType
  currentPrice: number
  pe: number | null
  peTTM: number | null
  pb: number | null
  ps: number | null
  peg: number | null
  marketCap: number | null
  enterpriseValue: number | null
  evPerEbitda: number | null
  priceToBook: number | null
  priceToSales: number | null
  valuationLevel: 'undervalued' | 'fair' | 'overvalued' | 'unknown'
  analysisNote: string
  updateDate: string
  source?: string
}

export interface ValuationMetrics {
  code: string
  name: string
  market: MarketType
  pe: number | null
  pb: number | null
  ps: number | null
  marketCap: number | null
  ev: number | null
  evEbitda: number | null
  peg: number | null
  priceToBook: number | null
  priceToSales: number | null
  dividendYield: number | null
  updateDate: string
  source?: string
}

export interface FinancialRatios {
  code: string
  name: string
  market: MarketType
  reportDate: string
  profitability: {
    roe: number
    roa: number
    grossMargin: number
    operatingMargin: number
    netMargin: number
    roic: number
  }
  liquidity: {
    currentRatio: number
    quickRatio: number
    cashRatio: number
  }
  leverage: {
    debtToEquity: number
    debtToAssets: number
    interestCoverage: number
  }
  efficiency: {
    assetTurnover: number
    inventoryTurnover: number
    receivablesTurnover: number
  }
  growth: {
    revenueGrowth: number
    earningsGrowth: number
    epsGrowth: number
  }
}

export interface FinancialSummary {
  code: string
  name: string
  market: MarketType
  lastUpdate: string
  valuation: {
    pe: number | null
    pb: number | null
    ps: number | null
    marketCap: number | null
    dividendYield: number | null
  }
  profitability: {
    roe: number
    roa: number
    netMargin: number
  }
  growth: {
    revenueGrowth: number
    earningsGrowth: number
  }
  financialHealth: {
    debtToEquity: number
    currentRatio: number
  }
  dataSource: string
  dataQuality: 'high' | 'medium' | 'low'
  disclaimer: string
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjE5NmYzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiI+PC9yZWN0PgogIDxsaW5lIHgxPSI3IiB5MT0iMTYiIHgyPSIxNyIgeTI9IjE2Ij48L2xpbmU+CiAgPGxpbmUgeDE9IjciIHkxPSIxMiIgeDI9IjE3IiB5Mj0iMTIiPjwvbGluZT4KICA8bGluZSB4MT0iNyIgeTE9IjgiIHgyPSIxNyIgeTI9IjgiPjwvbGluZT4KPC9zdmc+`
