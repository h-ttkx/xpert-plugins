import { PricePoint, SymbolSeries } from './types.js'

const SINA_KLINE_URL = 'https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData'

interface AdapterOptions {
  timeoutMs?: number
}

function detectMarket(code: string): 'sh' | 'sz' | 'hk' {
  const normalized = code.trim().toLowerCase()
  if (normalized.startsWith('sh')) return 'sh'
  if (normalized.startsWith('sz')) return 'sz'
  if (normalized.startsWith('hk')) return 'hk'

  const clean = normalized.replace(/^(sh|sz|hk)/, '')
  if (/^6\d{5}$/.test(clean)) return 'sh'
  if (/^(0|3)\d{5}$/.test(clean)) return 'sz'
  if (/^\d{5}$/.test(clean)) return 'hk'
  return 'sh'
}

function formatSinaSymbol(code: string): string {
  const normalized = code.trim().toLowerCase()
  if (/^(sh|sz|hk)\w+/.test(normalized)) return normalized

  const clean = normalized.replace(/^(sh|sz|hk)/, '')
  const market = detectMarket(clean)
  if (market === 'hk') return `hk${clean.padStart(5, '0')}`
  if (market === 'sh') return `sh${clean.padStart(6, '0')}`
  return `sz${clean.padStart(6, '0')}`
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/^(SH|SZ|HK)/, '')
}

function parsePricePoints(raw: any): PricePoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => ({
      date: String(item?.day || item?.date || ''),
      close: Number(item?.close || 0)
    }))
    .filter((item) => item.date && Number.isFinite(item.close) && item.close > 0)
}

export class MarketDataAdapter {
  private timeoutMs: number

  constructor(options: AdapterOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 10000
  }

  async fetchDailySeries(code: string, count = 200): Promise<SymbolSeries> {
    const symbol = formatSinaSymbol(code)
    const params = new URLSearchParams({
      symbol,
      scale: '240',
      datalen: String(Math.max(30, Math.min(1000, Math.floor(count))))
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(`${SINA_KLINE_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn'
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`http_${response.status}`)
      }

      const payload = await response.json() as any
      const prices = parsePricePoints(payload)
      if (prices.length < 30) {
        throw new Error('insufficient_series_points')
      }

      return {
        code: normalizeCode(code),
        prices
      }
    } finally {
      clearTimeout(timer)
    }
  }

  async fetchSeriesBatch(codes: string[], count = 200): Promise<SymbolSeries[]> {
    const uniqueCodes = Array.from(new Set(codes.map((item) => item.trim()).filter(Boolean)))
    const results = await Promise.all(uniqueCodes.map(async (code) => {
      try {
        return await this.fetchDailySeries(code, count)
      } catch (error) {
        const message = String((error as any)?.message || 'unknown')
        console.warn(`[stock-backtest-sim] fetch series failed for ${code}: ${message}`)
        return null
      }
    }))

    return results.filter((item): item is SymbolSeries => !!item)
  }
}
