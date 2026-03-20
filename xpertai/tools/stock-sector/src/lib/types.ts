/**
 * 行业板块工具类型定义
 */

import { z } from 'zod'

export const StockSectorProvider = 'stock-sector'

export enum SectorType {
  INDUSTRY = 'industry',
  CONCEPT = 'concept',
  REGION = 'region'
}

export type SectorTypeEnum = 'industry' | 'concept' | 'region'

export type Market = 'SH' | 'SZ' | 'HK'

export interface SectorQuote {
  code: string
  name: string
  type: SectorTypeEnum
  change: number
  changePercent: number
  volume: number
  amount: number
  leadingStock?: {
    code: string
    name: string
    changePercent: number
  }
}

export interface SectorInfo {
  code: string
  name: string
  type: SectorTypeEnum
  stockCount: number
  description?: string
}

export interface SectorConstituent {
  code: string
  name: string
  market: Market
  weight?: number
  changePercent?: number
}

export interface SectorRanking {
  rank: number
  code: string
  name: string
  type: SectorTypeEnum
  changePercent: number
  turnover: number
}

export interface SectorConfig {
  source?: string
  timeout?: number
}

export const SectorConfigSchema = z.object({
  source: z.enum(['eastmoney', 'sina']).default('eastmoney').describe('数据源'),
  timeout: z.number().min(1000).max(30000).default(5000).describe('请求超时时间(毫秒)')
})

export type TSectorConfig = z.infer<typeof SectorConfigSchema>

export const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3v18h18"></path>
  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
</svg>`