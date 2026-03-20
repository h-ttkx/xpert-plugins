/**
 * Market Client 单元测试
 */

import { MarketType } from './types.js'
import { detectMarket, formatCodeForSina, normalizeCode, calculateMA, calculateRSI, searchStock, fetchMoneyFlow } from './market-client.js'

describe('detectMarket', () => {
  it('should return SH for Shanghai A-share codes (6开头)', () => {
    expect(detectMarket('600519')).toBe(MarketType.SH)
    expect(detectMarket('600000')).toBe(MarketType.SH)
    expect(detectMarket('sh600519')).toBe(MarketType.SH)
    expect(detectMarket('SH600519')).toBe(MarketType.SH)
  })

  it('should return SZ for Shenzhen A-share codes (0/3开头)', () => {
    expect(detectMarket('000001')).toBe(MarketType.SZ)
    expect(detectMarket('300001')).toBe(MarketType.SZ)
    expect(detectMarket('sz000001')).toBe(MarketType.SZ)
    expect(detectMarket('SZ300001')).toBe(MarketType.SZ)
  })

  it('should return HK for Hong Kong stock codes (5位数字)', () => {
    expect(detectMarket('00700')).toBe(MarketType.HK)
    expect(detectMarket('hk00700')).toBe(MarketType.HK)
    expect(detectMarket('09988')).toBe(MarketType.HK)
    expect(detectMarket('HK00700')).toBe(MarketType.HK)
  })

  it('should return US for US stock codes (字母)', () => {
    expect(detectMarket('AAPL')).toBe(MarketType.US)
    expect(detectMarket('TSLA')).toBe(MarketType.US)
    expect(detectMarket('usAAPL')).toBe(MarketType.US)
  })

  it('should return US for letter-based codes', () => {
    expect(detectMarket('abc')).toBe(MarketType.US)
    expect(detectMarket('XYZ')).toBe(MarketType.US)
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

  it('should handle short codes by padding (A-share default)', () => {
    expect(formatCodeForSina('1')).toBe('sh000001')
    expect(formatCodeForSina('99')).toBe('sh000099')
    expect(formatCodeForSina('700')).toBe('sh000700')
  })

  it('should respect market parameter', () => {
    expect(formatCodeForSina('600519', MarketType.SH)).toBe('sh600519')
    expect(formatCodeForSina('000001', MarketType.SZ)).toBe('sz000001')
    expect(formatCodeForSina('00700', MarketType.HK)).toBe('hk00700')
  })
})

describe('normalizeCode', () => {
  it('should normalize A-share codes to 6 digits', () => {
    expect(normalizeCode('600519')).toBe('600519')
    expect(normalizeCode('sh600519')).toBe('600519')
    expect(normalizeCode('1')).toBe('000001')
  })

it('should normalize HK codes to 5 digits', () => {
    expect(normalizeCode('00700')).toBe('00700')
    expect(normalizeCode('hk00700')).toBe('00700')
  })

  it('should normalize short codes as A-share (6 digits)', () => {
    expect(normalizeCode('700')).toBe('000700')
  })

  it('should respect market parameter', () => {
    expect(normalizeCode('600519', MarketType.SH)).toBe('600519')
    expect(normalizeCode('00700', MarketType.HK)).toBe('00700')
  })
})

describe('calculateMA', () => {
  const mockKlineData = [
    { date: '2026-01-01', open: 10, high: 11, low: 9, close: 10, volume: 1000 },
    { date: '2026-01-02', open: 10, high: 12, low: 10, close: 11, volume: 1100 },
    { date: '2026-01-03', open: 11, high: 12, low: 10, close: 12, volume: 1200 },
    { date: '2026-01-04', open: 12, high: 13, low: 11, close: 13, volume: 1300 },
    { date: '2026-01-05', open: 13, high: 14, low: 12, close: 14, volume: 1400 },
  ]

  it('should calculate MA correctly', () => {
    const ma = calculateMA(mockKlineData, [5])
    expect(ma.ma5).toBeCloseTo(12) // (10+11+12+13+14)/5
  })

  it('should return empty for insufficient data', () => {
    const ma = calculateMA(mockKlineData.slice(0, 3), [5])
    expect(ma).toEqual({})
  })

  it('should calculate multiple MA periods', () => {
    const ma = calculateMA(mockKlineData, [3, 5])
    expect(ma.ma3).toBeDefined()
    expect(ma.ma5).toBeDefined()
  })
})

describe('calculateRSI', () => {
  const generateKlineData = (closes: number[]) => {
    return closes.map((close, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      open: close - 1,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1000
    }))
  }

  it('should return null for insufficient data', () => {
    const data = generateKlineData([10, 11, 12])
    const rsi = calculateRSI(data, 14)
    expect(rsi).toBeNull()
  })

  it('should calculate RSI correctly for uptrend', () => {
    const uptrendData = generateKlineData(Array.from({ length: 20 }, (_, i) => 100 + i))
    const rsi = calculateRSI(uptrendData, 14)
    expect(rsi).toBeGreaterThan(70)
  })

  it('should calculate RSI correctly for downtrend', () => {
    const downtrendData = generateKlineData(Array.from({ length: 20 }, (_, i) => 100 - i))
    const rsi = calculateRSI(downtrendData, 14)
    expect(rsi).toBeLessThan(30)
  })

  it('should calculate RSI correctly for sideways', () => {
    const sidewaysData = generateKlineData(Array.from({ length: 20 }, () => 100))
    const rsi = calculateRSI(sidewaysData, 14)
    expect(rsi).toBe(100)
  })
})

describe('US Stock Support', () => {
  it('should detect US stock codes correctly', () => {
    expect(detectMarket('AAPL')).toBe(MarketType.US)
    expect(detectMarket('TSLA')).toBe(MarketType.US)
    expect(detectMarket('GOOGL')).toBe(MarketType.US)
    expect(detectMarket('MSFT')).toBe(MarketType.US)
  })

  it('should detect US stock codes with us prefix', () => {
    expect(detectMarket('usAAPL')).toBe(MarketType.US)
    expect(detectMarket('USTSLA')).toBe(MarketType.US)
  })

  it('should not format US stock codes with sh/sz/hk prefix', () => {
    expect(formatCodeForSina('AAPL', MarketType.US)).toBe('AAPL')
    expect(formatCodeForSina('TSLA', MarketType.US)).toBe('TSLA')
  })

  it('should normalize US stock codes to uppercase', () => {
    expect(normalizeCode('aapl', MarketType.US)).toBe('AAPL')
    expect(normalizeCode('tsla', MarketType.US)).toBe('TSLA')
  })
})

describe('Money Flow', () => {
  describe('formatCodeForEastmoney', () => {
    it('should format SH codes with market prefix 1', () => {
      expect(formatCodeForSina('600519', MarketType.SH)).toBe('sh600519')
    })

    it('should format SZ codes with market prefix 0', () => {
      expect(formatCodeForSina('000001', MarketType.SZ)).toBe('sz000001')
    })

    it('should not format HK codes for money flow', () => {
      expect(formatCodeForSina('00700', MarketType.HK)).toBe('hk00700')
    })

    it('should not format US codes for money flow', () => {
      expect(formatCodeForSina('AAPL', MarketType.US)).toBe('AAPL')
    })
  })

  describe('normalizeCode for money flow', () => {
    it('should normalize SH codes to 6 digits', () => {
      expect(normalizeCode('sh600519')).toBe('600519')
      expect(normalizeCode('600519')).toBe('600519')
    })

    it('should normalize SZ codes to 6 digits', () => {
      expect(normalizeCode('sz000001')).toBe('000001')
      expect(normalizeCode('000001')).toBe('000001')
    })

    it('should pad short codes with zeros', () => {
      expect(normalizeCode('1')).toBe('000001')
      expect(normalizeCode('19')).toBe('000019')
    })
  })
})

describe('searchStock', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should fallback to built-in US universe when upstream returns non-OK', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 503,
    } as any)

    const results = await searchStock('Apple')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((item) => item.code === 'AAPL')).toBe(true)
  })

  it('should fallback to symbol result when upstream payload is empty', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ quotes: [] }),
    } as any)

    const results = await searchStock('ABCD')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].code).toBe('ABCD')
  })
})

describe('fetchMoneyFlow', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should continue fallback endpoints when first kline format is invalid', async () => {
    const mockFetch = jest.spyOn(global, 'fetch' as any)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { klines: ['2026-03-03,1'] } }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { klines: [] } }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { klines: ['2026-03-03,100000,20000,15000,30000,35000,2.5,0.8,0.6,1.2,1.4,1432.18,-0.55'] }
        }),
      } as any)

    const flow = await fetchMoneyFlow('600519')
    expect(flow).not.toBeNull()
    expect(flow?.mainNetInflow).toBe(100000)
    expect(flow?.mainNetInflowPercent).toBe(2.5)
    expect(flow?.superLargeNetInflow).toBe(35000)
  })

  it('should parse compact kline format without returning null', async () => {
    jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { klines: ['2026-03-03,-446576688.0,-35831.0,446612512.0,-293104384.0,-153472304.0'] }
      }),
    } as any)

    const flow = await fetchMoneyFlow('600519')
    expect(flow).not.toBeNull()
    expect(flow?.mainNetInflow).toBe(-446576688)
    expect(flow?.superLargeNetInflow).toBe(446612512)
    // Outlier values should not be treated as a valid percent directly.
    expect(flow?.mainNetInflowPercent).toBe(0)
  })

  it('should fallback to Sina money-flow endpoint when Eastmoney is unavailable', async () => {
    jest.spyOn(global, 'fetch' as any).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('vip.stock.finance.sina.com.cn')) {
        return {
          ok: true,
          json: async () => ([
            {
              opendate: '2026-03-02',
              netamount: '-628562480.69',
              ratioamount: '-0.124252',
              r0_net: '-472062874.89',
              r1_net: '-154909133.21',
              r2_net: '-1637989.95',
              r3_net: '47517.36'
            }
          ])
        } as any
      }

      return {
        ok: false,
        status: 503,
        json: async () => ({})
      } as any
    })

    const flow = await fetchMoneyFlow('600519')
    expect(flow).not.toBeNull()
    expect(flow?.source).toBe('sina')
    expect(flow?.mainNetInflow).toBeCloseTo(-628562480.69)
    expect(flow?.mainNetInflowPercent).toBeCloseTo(-12.4252)
    expect(flow?.superLargeNetInflow).toBeCloseTo(-472062874.89)
  })
})
