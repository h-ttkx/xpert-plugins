import axios from 'axios'
import { MarketType, ValuationMetrics, FinancialSummary, FinancialRatios } from './types.js'

const EASTMONEY_UT = 'f057cbcbce2a86e2866ab8877db1d059'
const EASTMONEY_STOCK_GET_URL = 'https://push2.eastmoney.com/api/qt/stock/get'
const EASTMONEY_ULIST_URL = 'https://push2.eastmoney.com/api/qt/ulist.np/get'
const EASTMONEY_FINANCE_RATIO_URL = 'https://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/DBFXAjaxNew'
const TENCENT_QUOTE_URL = 'https://qt.gtimg.cn/q='
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

export class FundamentalsClient {
  private timeout: number
  private dataSource: string

  constructor(config: { timeout?: number; dataSource?: string } = {}) {
    this.timeout = config.timeout || 10000
    this.dataSource = config.dataSource || 'eastmoney'
  }

  private getErrorCode(error: unknown): string {
    const err = error as any
    return String(err?.code || err?.cause?.code || err?.errno || '').trim().toUpperCase()
  }

  private getErrorStatus(error: unknown): number | null {
    const err = error as any
    const status = err?.status || err?.response?.status || err?.cause?.statusCode
    return Number.isFinite(status) ? Number(status) : null
  }

  private briefError(error: unknown): string {
    const err = error as any
    const code = this.getErrorCode(error)
    const status = this.getErrorStatus(error)
    const message = String(err?.message || err?.cause?.message || 'unknown error').replace(/\s+/g, ' ').trim()
    const parts = [code ? `code=${code}` : '', status ? `status=${status}` : '', `msg=${message}`].filter(Boolean)
    return parts.join(' ')
  }

  private isExpectedNetworkError(error: unknown): boolean {
    const code = this.getErrorCode(error)
    if (code && EXPECTED_NETWORK_ERROR_CODES.has(code)) return true

    const status = this.getErrorStatus(error)
    if (status === 403 || status === 429 || (status !== null && status >= 500)) return true

    const message = String((error as any)?.message || '').toLowerCase()
    return message.includes('socket hang up') || message.includes('fetch failed')
  }

  private parsePayload(payload: unknown): any {
    if (payload && typeof payload === 'object') {
      return payload
    }

    if (typeof payload !== 'string') {
      return null
    }

    const raw = payload.trim()
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      const match = raw.match(/^[^(]+\(([\s\S]+)\)\s*;?$/)
      if (!match) {
        return null
      }
      try {
        return JSON.parse(match[1])
      } catch {
        return null
      }
    }
  }

  private asNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === 'string') {
      const normalized = value.trim()
      if (!normalized || normalized === '-' || normalized === '--') {
        return null
      }
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }
    return null
  }

  private asRatio(value: unknown): number | null {
    const num = this.asNumber(value)
    if (num === null) return null

    // Eastmoney often returns ratio fields *100 (e.g. 2080 => 20.80)
    const normalized = Math.abs(num) >= 100 ? num / 100 : num
    return Math.round(normalized * 100) / 100
  }

  private firstNumber(record: Record<string, any>, keys: string[]): number {
    for (const key of keys) {
      const num = this.asNumber(record?.[key])
      if (num !== null) {
        return num
      }
    }
    return 0
  }

  private firstText(record: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
      const raw = record?.[key]
      if (raw === null || raw === undefined) continue
      const text = String(raw).trim()
      if (text) {
        return text
      }
    }
    return ''
  }

  private eastmoneyFinanceCode(formattedCode: string, market: MarketType): string {
    if (market === MarketType.SH) return `SH${formattedCode}`
    if (market === MarketType.SZ) return `SZ${formattedCode}`
    if (market === MarketType.HK) return `HK${formattedCode}`
    return formattedCode
  }

  private tencentQuoteCode(formattedCode: string, market: MarketType): string | null {
    if (market === MarketType.SH) return `sh${formattedCode}`
    if (market === MarketType.SZ) return `sz${formattedCode}`
    if (market === MarketType.HK) return `hk${formattedCode.padStart(5, '0')}`
    return null
  }

  private decodeTencentQuote(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    try {
      return new TextDecoder('gb18030').decode(bytes)
    } catch {
      return Buffer.from(bytes).toString('utf8')
    }
  }

  private async fetchTencentValuation(code: string, market: MarketType, formattedCode: string): Promise<ValuationMetrics | null> {
    const quoteCode = this.tencentQuoteCode(formattedCode, market)
    if (!quoteCode) {
      return null
    }

    try {
      const response = await fetch(`${TENCENT_QUOTE_URL}${quoteCode}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://stockapp.finance.qq.com/'
        }
      })
      if (!response.ok) {
        return null
      }

      const text = this.decodeTencentQuote(await response.arrayBuffer())
      const matched = text.match(/\"([^\"]*)\"/)
      if (!matched) {
        return null
      }
      const parts = matched[1].split('~')
      if (parts.length < 54) {
        return null
      }

      const pickFirst = (indexes: number[], validator?: (value: number) => boolean): number | null => {
        for (const index of indexes) {
          const value = this.asNumber(parts[index])
          if (value === null) continue
          if (!validator || validator(value)) {
            return value
          }
        }
        return null
      }

      const marketCapYi =
        pickFirst([44, 45, 43], (value) => value > 100) ??
        pickFirst([44, 45, 43], (value) => value > 0)
      const pe = pickFirst([52, 53, 51, 54], (value) => value > -200 && value < 1000)
      const pb = pickFirst([46, 45, 47, 48, 49, 50], (value) => value > 0 && value < 100)

      if (pe === null && pb === null && marketCapYi === null) {
        return null
      }

      return {
        code: parts[2] || formattedCode,
        name: parts[1] || '',
        market,
        pe,
        pb,
        ps: null,
        marketCap: marketCapYi !== null ? marketCapYi * 100000000 : null,
        ev: null,
        evEbitda: null,
        peg: null,
        priceToBook: pb,
        priceToSales: null,
        dividendYield: null,
        updateDate: new Date().toISOString().split('T')[0],
        source: 'tencent-quote'
      }
    } catch {
      return null
    }
  }

  private isValidStockCode(code: string): boolean {
    const clean = code.toUpperCase().replace(/^(SH|SZ|HK|US)/, '')
    return /^\d{5,6}$/.test(clean) || /^[A-Z]{1,5}$/.test(clean)
  }

  private buildEmptyValuation(code: string, market: MarketType, name = '', source = 'fallback'): ValuationMetrics {
    return {
      code: this.formatCodeForEastmoney(code),
      name,
      market,
      pe: null,
      pb: null,
      ps: null,
      marketCap: null,
      ev: null,
      evEbitda: null,
      peg: null,
      priceToBook: null,
      priceToSales: null,
      dividendYield: null,
      updateDate: new Date().toISOString().split('T')[0],
      source
    }
  }

  detectMarket(code: string): MarketType {
    const upperCode = code.toUpperCase()
    if (upperCode.startsWith('SH')) {
      return MarketType.SH
    }
    if (upperCode.startsWith('SZ')) {
      return MarketType.SZ
    }
    if (upperCode.startsWith('HK')) {
      return MarketType.HK
    }
    if (upperCode.startsWith('US')) {
      return MarketType.US
    }
    
    const cleanCode = upperCode.replace(/^(SH|SZ|HK|US)/, '')
    
    if (/^\d{5}$/.test(cleanCode)) {
      return MarketType.HK
    }
    
    if (/^\d{6}$/.test(cleanCode)) {
      if (cleanCode.startsWith('6')) {
        return MarketType.SH
      }
      return MarketType.SZ
    }
    
    if (/^[A-Z]+$/.test(cleanCode)) {
      return MarketType.US
    }
    
    return MarketType.SH
  }

  formatCodeForEastmoney(code: string): string {
    const cleanCode = code.toUpperCase().replace(/^(SH|SZ|HK|US)/, '')
    const market = this.detectMarket(code)
    
    if (market === MarketType.HK) {
      return cleanCode.padStart(5, '0')
    }
    
    if (market === MarketType.SH || market === MarketType.SZ) {
      return cleanCode.padStart(6, '0')
    }
    
    return cleanCode
  }

  async fetchValuationMetrics(code: string): Promise<ValuationMetrics | null> {
    if (!this.isValidStockCode(code)) {
      return null
    }

    const market = this.detectMarket(code)
    const formattedCode = this.formatCodeForEastmoney(code)
    const secid = market === MarketType.SH 
      ? `1.${formattedCode}`
      : market === MarketType.SZ
      ? `0.${formattedCode}`
      : market === MarketType.HK
      ? `116.${formattedCode}`
      : `105.${formattedCode}`

    let eastmoneyFailed = false

    try {
      const ulistResponse = await axios.get(EASTMONEY_ULIST_URL, {
        params: {
          secids: secid,
          ut: EASTMONEY_UT,
          fields: 'f12,f14,f20,f9,f23'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        },
        timeout: this.timeout
      })
      const ulistPayload = this.parsePayload(ulistResponse.data)
      const ulistRow = ulistPayload?.data?.diff?.[0]

      if (ulistRow) {
        return {
          code: ulistRow.f12 || formattedCode,
          name: ulistRow.f14 || '',
          market,
          pe: this.asRatio(ulistRow.f9),
          pb: this.asRatio(ulistRow.f23),
          ps: null,
          marketCap: this.asNumber(ulistRow.f20),
          ev: null,
          evEbitda: null,
          peg: null,
          priceToBook: this.asRatio(ulistRow.f23),
          priceToSales: null,
          dividendYield: null,
          updateDate: new Date().toISOString().split('T')[0],
          source: 'eastmoney-ulist'
        }
      }

      const stockResponse = await axios.get(EASTMONEY_STOCK_GET_URL, {
        params: {
          secid,
          ut: EASTMONEY_UT,
          invt: 2,
          fltt: 2,
          fields: 'f57,f58,f162,f167,f173,f116,f117,f170,f171'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        },
        timeout: this.timeout
      })
      const stockPayload = this.parsePayload(stockResponse.data)
      const data = stockPayload?.data

      if (data) {
        return {
          code: data.f57 || formattedCode,
          name: data.f58 || '',
          market,
          pe: this.asRatio(data.f162),
          pb: this.asRatio(data.f167),
          ps: null,
          marketCap: this.asNumber(data.f116) ?? this.asNumber(data.f117),
          ev: null,
          evEbitda: null,
          peg: null,
          priceToBook: this.asRatio(data.f167),
          priceToSales: null,
          dividendYield: this.asRatio(data.f170) ?? this.asRatio(data.f171),
          updateDate: new Date().toISOString().split('T')[0],
          source: 'eastmoney-stock-get'
        }
      }
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-fundamentals] valuation ${code} failed: ${this.briefError(error)}`)
      eastmoneyFailed = true
    }

    const tencentFallback = await this.fetchTencentValuation(code, market, formattedCode)
    if (tencentFallback) {
      return tencentFallback
    }

    return this.buildEmptyValuation(code, market, '', eastmoneyFailed ? 'eastmoney-error' : 'eastmoney-empty')
  }

  async fetchFinancialRatios(code: string): Promise<FinancialRatios | null> {
    try {
      if (!this.isValidStockCode(code)) {
        return null
      }

      const market = this.detectMarket(code)
      if (market === MarketType.US) {
        return null
      }

      const formattedCode = this.formatCodeForEastmoney(code)

      const response = await axios.get(EASTMONEY_FINANCE_RATIO_URL, {
        params: { code: this.eastmoneyFinanceCode(formattedCode, market) },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://emweb.securities.eastmoney.com/'
        },
        timeout: this.timeout
      })
      const payload = this.parsePayload(response.data)
      const rows = Array.isArray(payload?.bgq) ? payload.bgq : Array.isArray(payload?.data) ? payload.data : []

      if (!rows.length) {
        return null
      }

      const latestReport = rows[0] as Record<string, any>
      const prevReport = rows[1] as Record<string, any> | undefined
      const latestRevenue = this.firstNumber(latestReport, ['TOTAL_OPERATE_INCOME', 'TOTAL_INCOME'])
      const prevRevenue = prevReport ? this.firstNumber(prevReport, ['TOTAL_OPERATE_INCOME', 'TOTAL_INCOME']) : 0
      const latestProfit = this.firstNumber(latestReport, ['PARENT_NETPROFIT', 'NETPROFIT'])
      const prevProfit = prevReport ? this.firstNumber(prevReport, ['PARENT_NETPROFIT', 'NETPROFIT']) : 0

      const revenueGrowth = prevRevenue > 0 ? ((latestRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const earningsGrowth = prevProfit > 0 ? ((latestProfit - prevProfit) / prevProfit) * 100 : 0

      return {
        code: latestReport.SECURITY_CODE || formattedCode,
        name: this.firstText(latestReport, ['SECURITY_NAME_ABBR']),
        market,
        reportDate: this.firstText(latestReport, ['REPORT_DATE', 'date']),
        profitability: {
          roe: this.firstNumber(latestReport, ['ROE', 'roe']),
          roa: this.firstNumber(latestReport, ['JROA', 'ROA', 'roa']),
          grossMargin: this.firstNumber(latestReport, ['GROSS_MARGIN', 'XSMLL', 'xsmll']),
          operatingMargin: this.firstNumber(latestReport, ['OPERATING_MARGIN', 'YYMLL', 'yymll']),
          netMargin: this.firstNumber(latestReport, ['SALE_NPR', 'JLL', 'jll']),
          roic: this.firstNumber(latestReport, ['ROIC', 'roic'])
        },
        liquidity: {
          currentRatio: this.firstNumber(latestReport, ['CURRENT_RATIO', 'LDBL', 'ldbl']),
          quickRatio: this.firstNumber(latestReport, ['QUICK_RATIO', 'SDBL', 'sdbl']),
          cashRatio: this.firstNumber(latestReport, ['CASH_RATIO', 'XJBL', 'xjbl'])
        },
        leverage: {
          debtToEquity: this.firstNumber(latestReport, ['DEBT_EQUITY_RATIO', 'DEBT_ASSET_RATIO', 'ZCFZL', 'zcfzl']),
          debtToAssets: this.firstNumber(latestReport, ['DEBT_ASSET_RATIO', 'ZCFZL', 'zcfzl']),
          interestCoverage: this.firstNumber(latestReport, ['INTEREST_COVERAGE', 'LXBS', 'lxbs'])
        },
        efficiency: {
          assetTurnover: this.firstNumber(latestReport, ['TOTAL_ASSETS_TR', 'ZZCL', 'zzcl']),
          inventoryTurnover: this.firstNumber(latestReport, ['CHZZL', 'chzzl']),
          receivablesTurnover: this.firstNumber(latestReport, ['YSZZL', 'yszzl'])
        },
        growth: {
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          earningsGrowth: Math.round(earningsGrowth * 100) / 100,
          epsGrowth: this.firstNumber(latestReport, ['EPS_GROWTH', 'MGJLL', 'mgjll'])
        }
      }
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-fundamentals] ratios ${code} failed: ${this.briefError(error)}`)
      return null
    }
  }

  async fetchFinancialSummary(code: string): Promise<FinancialSummary | null> {
    try {
      const [valuation, ratios] = await Promise.all([
        this.fetchValuationMetrics(code),
        this.fetchFinancialRatios(code)
      ])

      if (!valuation) {
        return null
      }

      const hasValuation = [valuation.pe, valuation.pb, valuation.marketCap].some((v) => v !== null)
      const hasRatios = !!ratios && [
        ratios.profitability.roe,
        ratios.profitability.roa,
        ratios.profitability.netMargin,
        ratios.growth.revenueGrowth,
        ratios.growth.earningsGrowth
      ].some((v) => Number.isFinite(v) && v !== 0)

      const dataQuality: 'high' | 'medium' | 'low' =
        hasValuation && hasRatios ? 'high' : (hasValuation || hasRatios ? 'medium' : 'low')
      const sources = [valuation.source || 'unknown', ratios ? 'eastmoney-finance' : null].filter(Boolean).join('+')

      return {
        code: valuation.code,
        name: valuation.name,
        market: valuation.market,
        lastUpdate: new Date().toISOString(),
        valuation: {
          pe: valuation.pe,
          pb: valuation.pb,
          ps: valuation.ps,
          marketCap: valuation.marketCap,
          dividendYield: valuation.dividendYield
        },
        profitability: {
          roe: ratios?.profitability.roe || 0,
          roa: ratios?.profitability.roa || 0,
          netMargin: ratios?.profitability.netMargin || 0
        },
        growth: {
          revenueGrowth: ratios?.growth.revenueGrowth || 0,
          earningsGrowth: ratios?.growth.earningsGrowth || 0
        },
        financialHealth: {
          debtToEquity: ratios?.leverage.debtToEquity || 0,
          currentRatio: ratios?.liquidity.currentRatio || 0
        },
        dataSource: sources || 'eastmoney',
        dataQuality,
        disclaimer: 'Data from Eastmoney. For reference only, not investment advice.'
      }
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-fundamentals] summary ${code} failed: ${this.briefError(error)}`)
      return null
    }
  }
}
