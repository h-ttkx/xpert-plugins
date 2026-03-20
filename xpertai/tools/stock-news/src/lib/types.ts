/**
 * 股票新闻工具集类型定义
 */

export const StockNewsProvider = 'stock-news'

export enum MarketType {
  SH = 'sh',
  SZ = 'sz',
  HK = 'hk',
  US = 'us'
}

export interface NewsItem {
  title: string
  summary?: string
  source: string
  publishTime: string
  url?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  relevance?: number
}

export interface Announcement {
  code: string
  title: string
  type: string
  publishTime: string
  url?: string
  summary?: string
}

export interface NewsTimeline {
  code: string
  date: string
  news: NewsItem[]
  announcements?: Announcement[]
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTc2YzNmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHBhdGggZD0iTTQgMjJINkM3LjEgMjIgOCAyMS4xIDggMjBWMTBDOCA4LjkgNy4xIDggNiA4SDRDMi45IDggMiA4LjkgMiAxMFYyMEMyIDIxLjEgMi45IDIyIDQgMjJaIj48L3BhdGg+CiAgPHBhdGggZD0iTTYuNUgxN0MxOSAwIDIwIDEgMjAgMy41VjE0TDE1IDE5SDYuNUM1LjEgMTkgNCAxNy45IDQgMTYuNVY5QzQgNy42IDUuMSA2LjUgNi41IDYuNVoiPjwvcGF0aD4KICA8bGluZSB4MT0iOCIgeTE9IjYiIHgyPSIxNiIgeTI9IjYiPjwvbGluZT4KICA8bGluZSB4MT0iOCIgeTE9IjEwIiB4Mj0iMTQiIHkyPSIxMCI+PC9saW5lPgogIDxsaW5lIHgxPSI4IiB5MT0iMTQiIHgyPSIxMiIgeTI9IjE0Ij48L2xpbmU+Cjwvc3ZnPg==`