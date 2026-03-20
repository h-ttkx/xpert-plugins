/**
 * Sina Client 单元测试
 */

import { StockMarket } from './types.js'
import { getMarketByCode, formatCodeForSina, parseSinaQuote } from './sina-client.js'

describe('getMarketByCode', () => {
  it('should return SH for Shanghai A-share codes', () => {
    expect(getMarketByCode('600519')).toBe(StockMarket.SH)
    expect(getMarketByCode('600000')).toBe(StockMarket.SH)
    expect(getMarketByCode('sh600519')).toBe(StockMarket.SH)
  })

  it('should return SZ for Shenzhen A-share codes', () => {
    expect(getMarketByCode('000001')).toBe(StockMarket.SZ)
    expect(getMarketByCode('300001')).toBe(StockMarket.SZ)
    expect(getMarketByCode('sz000001')).toBe(StockMarket.SZ)
  })

  it('should return HK for Hong Kong stock codes', () => {
    expect(getMarketByCode('00700')).toBe(StockMarket.HK)
    expect(getMarketByCode('hk00700')).toBe(StockMarket.HK)
    expect(getMarketByCode('09988')).toBe(StockMarket.HK)
  })

  it('should handle codes with prefix', () => {
    expect(getMarketByCode('sh600519')).toBe(StockMarket.SH)
    expect(getMarketByCode('sz000001')).toBe(StockMarket.SZ)
    expect(getMarketByCode('hk00700')).toBe(StockMarket.HK)
  })

  it('should default to SH for unknown codes', () => {
    expect(getMarketByCode('abc')).toBe(StockMarket.SH)
  })
})

describe('formatCodeForSina', () => {
  it('should format Shanghai A-share codes', () => {
    expect(formatCodeForSina('600519')).toBe('sh600519')
    expect(formatCodeForSina('sh600519')).toBe('sh600519')
    expect(formatCodeForSina('SH600519')).toBe('sh600519')
  })

  it('should format Shenzhen A-share codes', () => {
    expect(formatCodeForSina('000001')).toBe('sz000001')
    expect(formatCodeForSina('sz000001')).toBe('sz000001')
    expect(formatCodeForSina('SZ000001')).toBe('sz000001')
  })

  it('should format Hong Kong stock codes', () => {
    expect(formatCodeForSina('00700')).toBe('hk00700')
    expect(formatCodeForSina('hk00700')).toBe('hk00700')
    expect(formatCodeForSina('HK00700')).toBe('hk00700')
  })

  it('should handle short codes by padding', () => {
    expect(formatCodeForSina('1')).toBe('sz000001')
    expect(formatCodeForSina('99')).toBe('sz000099')
  })
})

describe('parseSinaQuote', () => {
  it('should parse valid Sina quote data', () => {
    const rawData = 'var hq_str_sh600519="贵州茅台,1678.00,1688.00,1690.00,1668.00,1668.00,14234,239345600.00,2025-01-15,09:30:00"'
    const result = parseSinaQuote(rawData)

    expect(result.size).toBe(1)
    const quote = result.get('600519')
    expect(quote).toBeDefined()
    expect(quote?.name).toBe('贵州茅台')
    expect(quote?.price).toBe(1690)
    expect(quote?.open).toBe(1678)
    expect(quote?.preClose).toBe(1688)
  })

  it('should parse multiple stock quotes', () => {
    const rawData = `
      var hq_str_sh600519="贵州茅台,1678.00,1688.00,1690.00,1668.00,1668.00,14234,239345600.00,2025-01-15,09:30:00"
      var hq_str_sz000001="平安银行,12.30,12.50,12.40,12.20,12.20,50000,60000000.00,2025-01-15,09:30:00"
    `
    const result = parseSinaQuote(rawData)

    expect(result.size).toBe(2)
    expect(result.has('600519')).toBe(true)
    expect(result.has('000001')).toBe(true)
  })

  it('should return empty Map for invalid data', () => {
    const result = parseSinaQuote('invalid data')
    expect(result.size).toBe(0)
  })

  it('should return empty Map for empty data', () => {
    const result = parseSinaQuote('')
    expect(result.size).toBe(0)
  })

  it('should calculate change and changePercent correctly', () => {
    const rawData = 'var hq_str_sh600519="贵州茅台,100.00,100.00,110.00,90.00,90.00,10000,1000000.00,2025-01-15,09:30:00"'
    const result = parseSinaQuote(rawData)

    const quote = result.get('600519')
    expect(quote?.change).toBe(10) // 110 - 100
    expect(quote?.changePercent).toBe(10) // (10/100) * 100
  })

  it('should parse Hong Kong stock quote fields correctly', () => {
    const rawData = 'var hq_str_hk00700="TENCENT,腾讯控股,510.500,512.000,530.500,510.500,521.500,9.500,1.855,518.00000,518.00000,11683725867,22399030,0.000,0.000,683.000,415.374,2026/02/27,16:08"'
    const result = parseSinaQuote(rawData)

    const quote = result.get('00700')
    expect(quote).toBeDefined()
    expect(quote?.name).toBe('腾讯控股')
    expect(quote?.open).toBe(510.5)
    expect(quote?.preClose).toBe(512)
    expect(quote?.price).toBe(521.5)
    expect(quote?.high).toBe(530.5)
    expect(quote?.low).toBe(510.5)
    expect(quote?.change).toBe(9.5)
    expect(quote?.changePercent).toBe(1.86)
    expect(quote?.volume).toBe(22399030)
    expect(quote?.amount).toBe(11683725867)
    expect(quote?.time).toBe('2026/02/27 16:08')
    expect(quote?.market).toBe(StockMarket.HK)
  })
})
