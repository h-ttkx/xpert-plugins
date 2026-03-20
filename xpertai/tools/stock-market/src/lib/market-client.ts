/**
 * 股票市场数据客户端
 * 支持新浪财经 (A股、港股) 和腾讯财经 (美股)
 */

import { MarketType, StockQuote, KlineData, KlinePoint, StockSearchResult, MoneyFlow } from './types.js'
import iconv from 'iconv-lite'

const SINA_QUOTE_URL = 'https://hq.sinajs.cn/list='
const SINA_KLINE_URL = 'https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData'
const YAHOO_FINANCE_QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/'
const YAHOO_FINANCE_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search'
const EASTMONEY_MONEY_FLOW_URL = 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get'
const EASTMONEY_MONEY_FLOW_DAY_URL = 'https://push2.eastmoney.com/api/qt/stock/fflow/daykline/get'
const EASTMONEY_MONEY_FLOW_HIS_URL = 'https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get'
const SINA_MONEY_FLOW_URL = 'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_qsfx_lscjfb'
const EASTMONEY_UT = 'fa5fd1943c7b386f172d6893dbfba10b'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://finance.sina.com.cn',
  'Accept': '*/*',
}

const EXPECTED_NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'ECONNABORTED',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_RESPONSE_STATUS_CODE',
])

function getErrorCode(error: unknown): string {
  const err = error as any
  return String(err?.code || err?.cause?.code || err?.errno || '').trim().toUpperCase()
}

function getErrorStatus(error: unknown): number | null {
  const err = error as any
  const status = err?.status || err?.response?.status || err?.cause?.statusCode
  return Number.isFinite(status) ? Number(status) : null
}

function briefError(error: unknown): string {
  const err = error as any
  const code = getErrorCode(error)
  const status = getErrorStatus(error)
  const message = String(err?.message || err?.cause?.message || 'unknown error').replace(/\s+/g, ' ').trim()
  const parts = [code ? `code=${code}` : '', status ? `status=${status}` : '', `msg=${message}`].filter(Boolean)
  return parts.join(' ')
}

function isExpectedNetworkError(error: unknown): boolean {
  const code = getErrorCode(error)
  if (code && EXPECTED_NETWORK_ERROR_CODES.has(code)) return true

  const status = getErrorStatus(error)
  if (status === 403 || status === 429 || (status !== null && status >= 500)) return true

  const message = String((error as any)?.message || '').toLowerCase()
  return message.includes('socket hang up') || message.includes('fetch failed')
}

export function detectMarket(code: string): MarketType {
  const cleanCode = code.replace(/^(sh|sz|hk|us)/i, '')
  
  if (/^[a-zA-Z]{1,5}$/.test(cleanCode) || /^us/i.test(code)) {
    return MarketType.US
  }
  
  if (/^\d{5}$/.test(cleanCode) || /^hk/i.test(code)) {
    return MarketType.HK
  }
  
  if (/^6\d{5}$/.test(cleanCode)) {
    return MarketType.SH
  }
  
  if (/^(0|3)\d{5}$/.test(cleanCode)) {
    return MarketType.SZ
  }
  
  return MarketType.SH
}

export function formatCodeForSina(code: string, market?: MarketType): string {
  const cleanCode = code.replace(/^(sh|sz|hk|us)/i, '')
  const detectedMarket = market || detectMarket(code)
  
  switch (detectedMarket) {
    case MarketType.HK:
      return `hk${cleanCode.padStart(5, '0')}`
    case MarketType.SH:
      return `sh${cleanCode.padStart(6, '0')}`
    case MarketType.SZ:
      return `sz${cleanCode.padStart(6, '0')}`
    default:
      return cleanCode
  }
}

export function normalizeCode(code: string, market?: MarketType): string {
  const cleanCode = code.replace(/^(sh|sz|hk|us)/i, '')
  const detectedMarket = market || detectMarket(code)
  
  if (detectedMarket === MarketType.US) {
    return cleanCode.toUpperCase()
  }
  
  if (detectedMarket === MarketType.HK) {
    return cleanCode.padStart(5, '0')
  }
  return cleanCode.padStart(6, '0')
}

async function fetchSinaQuotes(sinaCodes: string[]): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>()
  
  if (sinaCodes.length === 0) return result
  
  const url = `${SINA_QUOTE_URL}${sinaCodes.join(',')}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    if (!response.ok) return result
    
    const buffer = Buffer.from(await response.arrayBuffer())
    const text = iconv.decode(buffer, 'gbk')
    
    const regex = /var hq_str_([^=]+)="([^"]*)"/g
    let match
    
    while ((match = regex.exec(text)) !== null) {
      const sinaCode = match[1]
      const data = match[2]
      
      if (!data || data.trim() === '') continue
      
      const fields = data.split(',')
      if (fields.length < 10) continue
      
      const quote = parseSinaQuoteFields(sinaCode, fields)
      if (quote) {
        result.set(quote.code, quote)
      }
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] Sina quotes failed: ${briefError(error)}`)
  }
  
  return result
}

function parseSinaQuoteFields(sinaCode: string, fields: string[]): StockQuote | null {
  try {
    const code = sinaCode.replace(/^(sh|sz|hk)/, '')
    const market = detectMarket(code)
    
    let name = ''
    let open = 0, preClose = 0, price = 0, high = 0, low = 0
    let volume = 0, amount = 0, change = 0, changePercent = 0
    let date = '', time = ''
    
    if (market === MarketType.HK) {
      name = fields[1] || fields[0] || ''
      open = parseFloat(fields[2]) || 0
      preClose = parseFloat(fields[3]) || 0
      high = parseFloat(fields[4]) || 0
      low = parseFloat(fields[5]) || 0
      price = parseFloat(fields[6]) || 0
      change = parseFloat(fields[7])
      if (Number.isNaN(change)) change = price - preClose
      changePercent = parseFloat(fields[8])
      if (Number.isNaN(changePercent)) changePercent = preClose > 0 ? (change / preClose) * 100 : 0
      amount = parseFloat(fields[11]) || 0
      volume = parseFloat(fields[12]) || 0
      date = fields[17] || ''
      time = fields[18] || ''
    } else {
      name = fields[0] || ''
      open = parseFloat(fields[1]) || 0
      preClose = parseFloat(fields[2]) || 0
      price = parseFloat(fields[3]) || 0
      high = parseFloat(fields[4]) || 0
      low = parseFloat(fields[5]) || 0
      volume = parseFloat(fields[8]) || 0
      amount = parseFloat(fields[9]) || 0
      change = price - preClose
      changePercent = preClose > 0 ? (change / preClose) * 100 : 0
      date = fields[30] || ''
      time = fields[31] || ''
    }
    
    return {
      code: normalizeCode(code, market),
      name,
      market,
      price,
      open,
      high,
      low,
      preClose,
      volume,
      amount,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      time: `${date} ${time}`.trim(),
      source: 'sina'
    }
  } catch {
    return null
  }
}

export async function fetchRealtimeQuotes(codes: string[]): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>()
  const sinaCodes: string[] = []
  const usCodes: string[] = []
  
  for (const code of codes) {
    const market = detectMarket(code)
    if (market === MarketType.US) {
      usCodes.push(code.toUpperCase().replace(/^US/i, ''))
    } else {
      sinaCodes.push(formatCodeForSina(code, market))
    }
  }
  
  const sinaQuotes = await fetchSinaQuotes(sinaCodes)
  sinaQuotes.forEach((quote, code) => result.set(code, quote))
  
  const usQuotes = await fetchUSStockQuotes(usCodes)
  usQuotes.forEach((quote, code) => result.set(code, quote))
  
  return result
}

async function fetchUSStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>()
  
  if (symbols.length === 0) return result
  
  try {
    for (const symbol of symbols) {
      const quote = await fetchSingleUSQuote(symbol)
      if (quote) {
        result.set(quote.code, quote)
      }
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] US quotes batch failed: ${briefError(error)}`)
  }
  
  return result
}

async function fetchSingleUSQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const url = `${YAHOO_FINANCE_QUOTE_URL}${symbol}?interval=1d&range=1d`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    if (!response.ok) return null
    
    const data = await response.json() as any
    
    if (!data?.chart?.result?.[0]) return null
    
    const result = data.chart.result[0]
    const meta = result.meta || {}
    const quote = result.indicators?.quote?.[0] || {}
    
    const price = meta.regularMarketPrice || 0
    const preClose = meta.chartPreviousClose || meta.previousClose || 0
    const change = price - preClose
    const changePercent = preClose > 0 ? (change / preClose) * 100 : 0
    
    return {
      code: symbol.toUpperCase(),
      name: meta.shortName || symbol,
      market: MarketType.US,
      price: Math.round(price * 100) / 100,
      open: Math.round((quote.open?.[0] || 0) * 100) / 100,
      high: Math.round((quote.high?.[0] || 0) * 100) / 100,
      low: Math.round((quote.low?.[0] || 0) * 100) / 100,
      preClose: Math.round(preClose * 100) / 100,
      volume: quote.volume?.[0] || 0,
      amount: 0,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : '',
      source: 'yahoo'
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] US quote ${symbol} failed: ${briefError(error)}`)
    return null
  }
}

export async function fetchKlineData(
  code: string,
  period: 'day' | 'week' | 'month' = 'day',
  count: number = 100
): Promise<KlineData | null> {
  const market = detectMarket(code)
  
  if (market === MarketType.US) {
    return null
  }
  
  const sinaCode = formatCodeForSina(code, market)
  
  try {
    const params = new URLSearchParams({
      symbol: sinaCode,
      scale: period === 'day' ? '240' : period === 'week' ? '1680' : '7200',
      datalen: String(count),
    })
    
    const url = `${SINA_KLINE_URL}?${params}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })
    
    if (!response.ok) return null
    
    const data = await response.json() as Array<{day: string; open: string; high: string; low: string; close: string; volume: string}>
    
    if (!Array.isArray(data) || data.length === 0) return null
    
    const points: KlinePoint[] = data.map(item => ({
      date: item.day || '',
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseFloat(item.volume) || 0,
    }))
    
    return {
      code: normalizeCode(code, market),
      market,
      period,
      data: points
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] K-line failed: ${briefError(error)}`)
    return null
  }
}

export function calculateMA(data: KlinePoint[], periods: number[]): { [period: string]: number } {
  const result: { [period: string]: number } = {}
  
  for (const period of periods) {
    if (data.length < period) continue
    
    const slice = data.slice(-period)
    const sum = slice.reduce((acc, item) => acc + item.close, 0)
    result[`ma${period}`] = Math.round((sum / period) * 100) / 100
  }
  
  return result
}

export function calculateMACD(data: KlinePoint[]): { dif: number; dea: number; macd: number } | null {
  if (data.length < 35) return null
  
  const closes = data.map(d => d.close)
  
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  
  if (!ema12 || !ema26) return null
  
  const dif = ema12 - ema26
  const deaList: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    const ema12Val = calculateEMA(closes.slice(0, i + 1), 12)
    const ema26Val = calculateEMA(closes.slice(0, i + 1), 26)
    if (ema12Val && ema26Val) {
      deaList.push(ema12Val - ema26Val)
    }
  }
  
  const dea = deaList.length >= 9 ? calculateEMA(deaList, 9) || 0 : 0
  const macd = (dif - dea) * 2
  
  return {
    dif: Math.round(dif * 100) / 100,
    dea: Math.round(dea * 100) / 100,
    macd: Math.round(macd * 100) / 100
  }
}

function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null
  
  const k = 2 / (period + 1)
  let ema = data.slice(0, period).reduce((a, b) => a + b) / period
  
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k)
  }
  
  return ema
}

export function calculateRSI(data: KlinePoint[], period: number = 14): number | null {
  if (data.length < period + 1) return null
  
  let gains = 0
  let losses = 0
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    if (change > 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return Math.round((100 - (100 / (1 + rs))) * 100) / 100
}

export function calculateKDJ(data: KlinePoint[]): { k: number; d: number; j: number } | null {
  if (data.length < 9) return null
  
  const period = 9
  const recent = data.slice(-period)
  
  const highest = Math.max(...recent.map(d => d.high))
  const lowest = Math.min(...recent.map(d => d.low))
  const close = recent[recent.length - 1].close
  
  if (highest === lowest) return null
  
  const rsv = ((close - lowest) / (highest - lowest)) * 100
  
  const k = Math.round(rsv * 100) / 100
  const d = Math.round(k * 100) / 100
  const j = Math.round((3 * k - 2 * d) * 100) / 100
  
  return { k, d, j }
}

export async function searchStock(keyword: string): Promise<StockSearchResult[]> {
  const results: StockSearchResult[] = []
  const q = (keyword || '').trim()
  if (!q) return []
  
  try {
    const url = `${YAHOO_FINANCE_SEARCH_URL}?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    if (response.ok) {
      const data = await response.json() as any
      const quotes = Array.isArray(data?.quotes) ? data.quotes : []
      for (const item of quotes) {
        if (item?.quoteType === 'EQUITY' || item?.quoteType === 'ETF') {
          const symbol = String(item.symbol || '').trim()
          if (!symbol) continue
          const shortName = String(item.shortname || item.longname || symbol).trim()
          if (!shortName) continue
          results.push({
            code: symbol,
            name: shortName,
            market: MarketType.US,
            type: item.quoteType
          })
        }
      }
    } else {
      const level = response.status === 403 || response.status === 429 || response.status >= 500 ? 'warn' : 'error'
      console[level](`[stock-market] Yahoo search non-OK: status=${response.status}`)
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] Yahoo search failed: ${briefError(error)}`)
  }

  if (results.length > 0) {
    return dedupeUSSearchResults(results)
  }

  return fallbackUSStockSearch(q)
}

export async function fetchMoneyFlow(code: string): Promise<MoneyFlow | null> {
  const market = detectMarket(code)
  
  if (market === MarketType.US || market === MarketType.HK) {
    return null
  }
  
  const normalizedCode = normalizeCode(code, market)
  const secid = market === MarketType.SH ? `1.${normalizedCode}` : `0.${normalizedCode}`
  
  try {
    const kline = await fetchMoneyFlowKline(secid)
    if (kline) {
      const parsed = parseMoneyFlowKline(kline)
      if (parsed) {
        return {
          code: normalizedCode,
          name: '',
          market,
          mainNetInflow: parsed.mainNetInflow,
          mainNetInflowPercent: parsed.mainNetInflowPercent,
          superLargeNetInflow: parsed.superLargeNetInflow,
          largeNetInflow: parsed.largeNetInflow,
          mediumNetInflow: parsed.mediumNetInflow,
          smallNetInflow: parsed.smallNetInflow,
          time: parsed.time,
          source: 'eastmoney'
        }
      }
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] Money flow failed: ${briefError(error)}`)
  }

  // Fallback: Sina historical money-flow endpoint is usually more stable.
  return fetchMoneyFlowFromSina(normalizedCode, market)
}

async function fetchMoneyFlowKline(secid: string): Promise<string | null> {
  const endpoints = [
    EASTMONEY_MONEY_FLOW_HIS_URL,
    EASTMONEY_MONEY_FLOW_DAY_URL,
    EASTMONEY_MONEY_FLOW_URL,
  ]
  const profiles = [
    { klt: '101', lmt: '1' },
    { klt: '1', lmt: '1' },
  ]
  const failures: string[] = []

  for (const endpoint of endpoints) {
    for (const profile of profiles) {
      try {
        const params = new URLSearchParams({
          secid,
          klt: profile.klt,
          lmt: profile.lmt,
          ut: EASTMONEY_UT,
          fields1: 'f1,f2,f3,f7',
          fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63',
        })

        const url = `${endpoint}?${params}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://data.eastmoney.com/',
          },
        })
        if (!response.ok) continue

        const data = await response.json() as any
        const klines = data?.data?.klines
        if (Array.isArray(klines) && klines.length > 0) {
          const latest = klines[klines.length - 1]
          if (typeof latest === 'string' && latest.trim()) {
            if (parseMoneyFlowKline(latest)) {
              return latest
            }
          }
          if (Array.isArray(latest)) {
            const merged = latest.join(',')
            if (parseMoneyFlowKline(merged)) {
              return merged
            }
          }
        }
      } catch (error) {
        failures.push(`${endpoint}(${profile.klt}/${profile.lmt}) ${briefError(error)}`)
      }
    }
  }

  if (failures.length > 0) {
    const samples = failures.slice(0, 2).join(' | ')
    const suffix = failures.length > 2 ? ` | +${failures.length - 2} more` : ''
    console.warn(`[stock-market] Money-flow endpoints failed for secid=${secid}: ${samples}${suffix}`)
  }

  return null
}

function parseMoneyFlowKline(kline: string): {
  time: string
  mainNetInflow: number
  mainNetInflowPercent: number
  superLargeNetInflow: number
  largeNetInflow: number
  mediumNetInflow: number
  smallNetInflow: number
} | null {
  const parts = (kline || '').split(',')
  if (parts.length < 2) return null
  const toNumber = (raw: string): number => {
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  }

  // f51-f63 order:
  // [date, main, small, medium, large, super, main%, small%, medium%, large%, super%, close, chg%]
  if (parts.length >= 13) {
    return {
      time: parts[0] || '',
      mainNetInflow: toNumber(parts[1]),
      smallNetInflow: toNumber(parts[2]),
      mediumNetInflow: toNumber(parts[3]),
      largeNetInflow: toNumber(parts[4]),
      superLargeNetInflow: toNumber(parts[5]),
      mainNetInflowPercent: toNumber(parts[6]),
    }
  }

  // Compatible fallback for legacy/variant field order.
  if (parts.length >= 12) {
    return {
      time: parts[0] || '',
      mainNetInflow: toNumber(parts[1]),
      mainNetInflowPercent: toNumber(parts[3]),
      superLargeNetInflow: toNumber(parts[5]),
      largeNetInflow: toNumber(parts[7]),
      mediumNetInflow: toNumber(parts[9]),
      smallNetInflow: toNumber(parts[11]),
    }
  }

  // Some endpoints may return a compact variant:
  // [date, main, main%, super, large, small]
  if (parts.length >= 6) {
    const percentCandidate = toNumber(parts[2])
    return {
      time: parts[0] || '',
      mainNetInflow: toNumber(parts[1]),
      mainNetInflowPercent: Math.abs(percentCandidate) <= 100 ? percentCandidate : 0,
      superLargeNetInflow: toNumber(parts[3]),
      largeNetInflow: toNumber(parts[4]),
      mediumNetInflow: 0,
      smallNetInflow: toNumber(parts[5]),
    }
  }

  return null
}

async function fetchMoneyFlowFromSina(normalizedCode: string, market: MarketType): Promise<MoneyFlow | null> {
  const sinaCode = market === MarketType.SH ? `sh${normalizedCode}` : `sz${normalizedCode}`

  try {
    const params = new URLSearchParams({
      page: '1',
      num: '1',
      sort: 'opendate',
      asc: '0',
      daima: sinaCode,
    })
    const response = await fetch(`${SINA_MONEY_FLOW_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vip.stock.finance.sina.com.cn/',
        'Accept': 'application/json, text/plain, */*',
      },
    })
    if (!response.ok) {
      return null
    }

    const payload = await response.json() as any
    const row = Array.isArray(payload) ? payload[0] : null
    if (!row) {
      return null
    }

    const toNumber = (raw: any): number => {
      const value = Number(raw)
      return Number.isFinite(value) ? value : 0
    }
    const ratioRaw = toNumber(row.ratioamount)
    const ratioPercent = Math.abs(ratioRaw) <= 1 ? ratioRaw * 100 : ratioRaw

    return {
      code: normalizedCode,
      name: '',
      market,
      mainNetInflow: toNumber(row.netamount),
      mainNetInflowPercent: ratioPercent,
      superLargeNetInflow: toNumber(row.r0_net),
      largeNetInflow: toNumber(row.r1_net),
      mediumNetInflow: toNumber(row.r2_net),
      smallNetInflow: toNumber(row.r3_net),
      time: String(row.opendate || ''),
      source: 'sina'
    }
  } catch (error) {
    const level = isExpectedNetworkError(error) ? 'warn' : 'error'
    console[level](`[stock-market] Sina money-flow failed: ${briefError(error)}`)
    return null
  }
}

function dedupeUSSearchResults(items: StockSearchResult[]) {
  const map = new Map<string, StockSearchResult>()
  for (const item of items) {
    const key = (item.code || '').toUpperCase()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, {
        ...item,
        code: key
      })
    }
  }
  return Array.from(map.values()).slice(0, 20)
}

function fallbackUSStockSearch(keyword: string): StockSearchResult[] {
  const q = (keyword || '').trim().toLowerCase()
  if (!q) return []

  const universe: StockSearchResult[] = [
    { code: 'AAPL', name: 'Apple Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'MSFT', name: 'Microsoft Corporation', market: MarketType.US, type: 'EQUITY' },
    { code: 'GOOGL', name: 'Alphabet Inc. Class A', market: MarketType.US, type: 'EQUITY' },
    { code: 'AMZN', name: 'Amazon.com, Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'META', name: 'Meta Platforms, Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'NVDA', name: 'NVIDIA Corporation', market: MarketType.US, type: 'EQUITY' },
    { code: 'TSLA', name: 'Tesla, Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'AMD', name: 'Advanced Micro Devices, Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'BABA', name: 'Alibaba Group Holding Limited', market: MarketType.US, type: 'EQUITY' },
    { code: 'PDD', name: 'PDD Holdings Inc.', market: MarketType.US, type: 'EQUITY' },
    { code: 'SPY', name: 'SPDR S&P 500 ETF Trust', market: MarketType.US, type: 'ETF' },
    { code: 'QQQ', name: 'Invesco QQQ Trust', market: MarketType.US, type: 'ETF' },
  ]

  const matched = universe.filter((item) => {
    const code = item.code.toLowerCase()
    const name = item.name.toLowerCase()
    return code.includes(q) || name.includes(q)
  })
  if (matched.length > 0) return matched

  if (/^[a-z]{1,5}$/i.test(q)) {
    return [{
      code: q.toUpperCase(),
      name: `${q.toUpperCase()} (symbol)`,
      market: MarketType.US,
      type: 'EQUITY'
    }]
  }

  return []
}
