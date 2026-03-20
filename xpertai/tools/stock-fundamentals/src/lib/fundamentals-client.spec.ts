/**
 * 基本面客户端单元测试
 */

import { FundamentalsClient } from './fundamentals-client.js'
import { MarketType } from './types.js'
import axios from 'axios'

describe('FundamentalsClient', () => {
  let client: FundamentalsClient

  beforeEach(() => {
    client = new FundamentalsClient({ timeout: 5000 })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('detectMarket', () => {
    it('should return SH for Shanghai A-share codes (6开头)', () => {
      expect(client.detectMarket('600519')).toBe(MarketType.SH)
      expect(client.detectMarket('601398')).toBe(MarketType.SH)
    })

    it('should return SZ for Shenzhen A-share codes (0/3开头)', () => {
      expect(client.detectMarket('000001')).toBe(MarketType.SZ)
      expect(client.detectMarket('300750')).toBe(MarketType.SZ)
    })

    it('should return HK for Hong Kong stock codes (5位数字)', () => {
      expect(client.detectMarket('00700')).toBe(MarketType.HK)
      expect(client.detectMarket('09988')).toBe(MarketType.HK)
    })

    it('should return US for letter-based codes', () => {
      expect(client.detectMarket('AAPL')).toBe(MarketType.US)
      expect(client.detectMarket('TSLA')).toBe(MarketType.US)
    })

    it('should handle codes with prefix', () => {
      expect(client.detectMarket('SH600519')).toBe(MarketType.SH)
      expect(client.detectMarket('SZ000001')).toBe(MarketType.SZ)
      expect(client.detectMarket('HK00700')).toBe(MarketType.HK)
      expect(client.detectMarket('USAAPL')).toBe(MarketType.US)
    })
  })

  describe('formatCodeForEastmoney', () => {
    it('should format Shanghai codes', () => {
      expect(client.formatCodeForEastmoney('600519')).toBe('600519')
      expect(client.formatCodeForEastmoney('SH600519')).toBe('600519')
    })

    it('should format Shenzhen codes', () => {
      expect(client.formatCodeForEastmoney('000001')).toBe('000001')
      expect(client.formatCodeForEastmoney('SZ000001')).toBe('000001')
    })

    it('should format HK codes', () => {
      expect(client.formatCodeForEastmoney('00700')).toBe('00700')
      expect(client.formatCodeForEastmoney('HK00700')).toBe('00700')
    })
  })

  describe('fetchValuationMetrics', () => {
    it('should return null for invalid code gracefully', async () => {
      const result = await client.fetchValuationMetrics('INVALID123')
      expect(result).toBeNull()
    }, 15000)

    it('should parse valuation fields from ulist endpoint', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          data: {
            diff: [
              {
                f12: '600519',
                f14: '贵州茅台',
                f20: 1792637335475,
                f9: 2080,
                f23: 789
              }
            ]
          }
        }
      } as any)

      const result = await client.fetchValuationMetrics('600519')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('600519')
      expect(result?.name).toBe('贵州茅台')
      expect(result?.pe).toBe(20.8)
      expect(result?.pb).toBe(7.89)
      expect(result?.marketCap).toBe(1792637335475)
      expect(result?.source).toBe('eastmoney-ulist')
    })

    it('should fallback to tencent quote when eastmoney valuation endpoints fail', async () => {
      jest.spyOn(axios, 'get').mockRejectedValue(new Error('socket hang up'))
      jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from(
          'v_sh600519="1~贵州茅台~600519~1429.23~1440.11~1440.10~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~0~~20260303112639~-11.20~-0.78~1440.10~1422.13~0/0/0~0~0~0~0~~1440.10~1422.13~1.25~17897.82~17897.82~7.88~1584.12~1296.10~1.30~-24~1430.22~20.77~20.76~~~0.64~0~0.0000~0~ ~GP-A~";',
          'utf8'
        ),
      } as any)

      const result = await client.fetchValuationMetrics('600519')
      expect(result).not.toBeNull()
      expect(result?.source).toBe('tencent-quote')
      expect(result?.pe).toBeCloseTo(20.76, 2)
      expect(result?.pb).toBe(7.88)
      expect(result?.marketCap).toBeCloseTo(17897.82 * 100000000)
    })
  })

  describe('fetchFinancialRatios', () => {
    it('should return null for invalid code gracefully', async () => {
      const result = await client.fetchFinancialRatios('INVALID123')
      expect(result).toBeNull()
    }, 15000)

    it('should map DBFXAjaxNew payload into ratios and growth', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          bgq: [
            {
              SECURITY_CODE: '600519',
              SECURITY_NAME_ABBR: '贵州茅台',
              REPORT_DATE: '2025-09-30 00:00:00',
              ROE: 24.64,
              JROA: 22.16,
              SALE_NPR: 51.1,
              DEBT_ASSET_RATIO: 12.8,
              TOTAL_ASSETS_TR: 0.43,
              TOTAL_OPERATE_INCOME: 130903889634.88,
              PARENT_NETPROFIT: 64626746712.18
            },
            {
              SECURITY_CODE: '600519',
              SECURITY_NAME_ABBR: '贵州茅台',
              REPORT_DATE: '2025-06-30 00:00:00',
              TOTAL_OPERATE_INCOME: 91093762553.97,
              PARENT_NETPROFIT: 45402962298.1
            }
          ]
        }
      } as any)

      const result = await client.fetchFinancialRatios('600519')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('600519')
      expect(result?.name).toBe('贵州茅台')
      expect(result?.profitability.roe).toBe(24.64)
      expect(result?.profitability.roa).toBe(22.16)
      expect(result?.profitability.netMargin).toBe(51.1)
      expect(result?.leverage.debtToAssets).toBe(12.8)
      expect(result?.growth.revenueGrowth).toBeGreaterThan(0)
      expect(result?.growth.earningsGrowth).toBeGreaterThan(0)
    })
  })

  describe('fetchFinancialSummary', () => {
    it('should return null for invalid code gracefully', async () => {
      const result = await client.fetchFinancialSummary('INVALID123')
      expect(result).toBeNull()
    }, 15000)
  })
})
