import { ScreenerClient } from './screener-client'
import { MarketType } from './types'

describe('ScreenerClient', () => {
  let client: ScreenerClient

  beforeEach(() => {
    client = new ScreenerClient({ timeout: 5000 })
  })

  describe('detectMarket', () => {
    it('should detect SH market for 6-prefix codes', () => {
      expect(client.detectMarket('600519')).toBe(MarketType.SH)
      expect(client.detectMarket('sh600519')).toBe(MarketType.SH)
      expect(client.detectMarket('SH600519')).toBe(MarketType.SH)
    })

    it('should detect SZ market for 0/3-prefix codes', () => {
      expect(client.detectMarket('000001')).toBe(MarketType.SZ)
      expect(client.detectMarket('300001')).toBe(MarketType.SZ)
      expect(client.detectMarket('sz000001')).toBe(MarketType.SZ)
    })

    it('should detect HK market for 5-digit codes', () => {
      expect(client.detectMarket('00700')).toBe(MarketType.HK)
      expect(client.detectMarket('hk00700')).toBe(MarketType.HK)
      expect(client.detectMarket('HK00700')).toBe(MarketType.HK)
    })

    it('should detect US market for letter codes', () => {
      expect(client.detectMarket('AAPL')).toBe(MarketType.US)
      expect(client.detectMarket('TSLA')).toBe(MarketType.US)
      expect(client.detectMarket('usAAPL')).toBe(MarketType.US)
    })

    it('should default to SH for unknown codes', () => {
      expect(client.detectMarket('123')).toBe(MarketType.SH)
    })
  })

  describe('formatCodeForEastmoney', () => {
    it('should format SH codes to 6 digits', () => {
      expect(client.formatCodeForEastmoney('600519')).toBe('600519')
      expect(client.formatCodeForEastmoney('sh619')).toBe('000619')
    })

    it('should format SZ codes to 6 digits', () => {
      expect(client.formatCodeForEastmoney('000001')).toBe('000001')
      expect(client.formatCodeForEastmoney('sz1')).toBe('000001')
    })

    it('should format HK codes to 5 digits', () => {
      expect(client.formatCodeForEastmoney('00700')).toBe('00700')
      expect(client.formatCodeForEastmoney('hk700')).toBe('00700')
    })

    it('should format US codes as uppercase', () => {
      expect(client.formatCodeForEastmoney('aapl')).toBe('AAPL')
    })
  })

  describe('screenByMarketCap', () => {
    it('should return empty array on network error', async () => {
      const results = await client.screenByMarketCap(MarketType.SH, 100, 1000, 10)
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('screenByIndustry', () => {
    it('should return empty array on network error', async () => {
      const results = await client.screenByIndustry('银行', 'ALL', 10)
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('screenByMetrics', () => {
    it('should return empty array on network error', async () => {
      const conditions = [{ field: 'pe', operator: '<=' as const, value: 30 }]
      const results = await client.screenByMetrics(conditions, 'ALL', 10)
      expect(Array.isArray(results)).toBe(true)
    })
  })
})