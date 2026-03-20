/**
 * 股票筛选工具类型定义
 */

import { z } from 'zod'

export const StockScreenerProvider = 'stock-screener'

export enum MarketType {
  SH = 'SH',
  SZ = 'SZ',
  HK = 'HK',
  US = 'US'
}

export type Market = 'SH' | 'SZ' | 'HK' | 'US'

export interface ScreenCondition {
  field: string
  operator: '>' | '<' | '=' | '>=' | '<=' | 'between'
  value: number | [number, number]
}

export interface ScreenResult {
  code: string
  name: string
  market: Market
  value?: number
  [key: string]: any
}

export interface ScreenerConfig {
  source?: string
  maxItems?: number
  timeout?: number
}

export const ScreenerConfigSchema = z.object({
  source: z.enum(['eastmoney', 'tushare']).default('eastmoney').describe('数据源'),
  maxItems: z.number().min(1).max(500).default(50).describe('最大返回条数'),
  timeout: z.number().min(1000).max(30000).default(5000).describe('请求超时时间(毫秒)')
})

export type TScreenerConfig = z.infer<typeof ScreenerConfigSchema>

export const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" y1="21" x2="4" y2="14"></line>
  <line x1="4" y1="10" x2="4" y2="3"></line>
  <line x1="12" y1="21" x2="12" y2="12"></line>
  <line x1="12" y1="8" x2="12" y2="3"></line>
  <line x1="20" y1="21" x2="20" y2="16"></line>
  <line x1="20" y1="12" x2="20" y2="3"></line>
  <line x1="1" y1="14" x2="7" y2="14"></line>
  <line x1="9" y1="8" x2="15" y2="8"></line>
  <line x1="17" y1="16" x2="23" y2="16"></line>
</svg>`