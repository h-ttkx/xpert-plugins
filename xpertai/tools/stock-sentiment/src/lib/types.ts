/**
 * 股票情绪分析工具集类型定义
 */

export const StockSentimentProvider = 'stock-sentiment'

export enum SentimentLevel {
  VERY_BEARISH = 'very_bearish',
  BEARISH = 'bearish',
  NEUTRAL = 'neutral',
  BULLISH = 'bullish',
  VERY_BULLISH = 'very_bullish'
}

export interface SentimentScore {
  score: number
  level: SentimentLevel
  confidence: number
  timestamp: string
}

export interface SentimentFactor {
  name: string
  weight: number
  score: number
  description: string
  sources?: string[]
}

export interface SentimentSummary {
  code: string
  name: string
  overallScore: SentimentScore
  factors: SentimentFactor[]
  newsCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  timeWindow: string
  riskWarning?: string
  dataSource: string
  lastUpdate: string
}

export interface SentimentTrend {
  code: string
  dates: string[]
  scores: number[]
  trend: 'rising' | 'falling' | 'stable'
  changePercent: number
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWM1MmQ1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHBhdGggZD0iTTIgMTJzMy03IDEwLTcgMTAgNyAxMCA3LTMgNy0xMCA3LTEwLTctMTAtN1oiPjwvcGF0aD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIj48L2NpcmNsZT4KPC9zdmc+`