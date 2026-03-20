/**
 * 股票行情工具集类型定义
 */

export const StockMarketProvider = 'stock-market'

export enum MarketType {
  SH = 'sh',
  SZ = 'sz',
  HK = 'hk',
  US = 'us'
}

export interface StockQuote {
  code: string
  name: string
  market: MarketType
  price: number
  open: number
  high: number
  low: number
  preClose: number
  volume: number
  amount: number
  change: number
  changePercent: number
  time: string
  source?: string
}

export interface KlineData {
  code: string
  market: MarketType
  period: string
  data: KlinePoint[]
}

export interface KlinePoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount?: number
}

export interface TechnicalIndicators {
  code: string
  market: MarketType
  indicators: {
    ma?: { [period: string]: number }
    macd?: {
      dif: number
      dea: number
      macd: number
    }
    rsi?: { [period: string]: number }
    kdj?: {
      k: number
      d: number
      j: number
    }
  }
  time: string
}

export interface StockSearchResult {
  code: string
  name: string
  market: MarketType
  type?: string
}

export interface MoneyFlow {
  code: string
  name: string
  market: MarketType
  mainNetInflow: number
  mainNetInflowPercent: number
  superLargeNetInflow: number
  largeNetInflow: number
  mediumNetInflow: number
  smallNetInflow: number
  time: string
  source?: string
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNGE5MGUyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHBvbHlsaW5lIHBvaW50cz0iMjIgMTIgMTggMTIgMTUgMjEgOSAzIDEyIDkgNiA5Ij48L3BvbHlsaW5lPgogIDxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIj48L2xpbmU+Cjwvc3ZnPg==`