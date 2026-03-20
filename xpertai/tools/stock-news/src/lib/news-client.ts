/**
 * 新闻数据客户端 - 基于新浪财经和东方财富API
 */

import axios from 'axios'

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

export type MarketType = 'sh' | 'sz' | 'hk' | 'us'

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

export class NewsClient {
  private timeout: number

  constructor(timeout = 5000) {
    this.timeout = timeout
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

  private unwrapJsonLikePayload(payload: unknown): any {
    if (typeof payload !== 'string') return payload
    const raw = payload.trim()
    if (!raw) return payload
    try {
      return JSON.parse(raw)
    } catch {
      const match = raw.match(/^[\w$.]*\(([\s\S]+)\)\s*;?$/)
      if (!match?.[1]) return payload
      try {
        return JSON.parse(match[1])
      } catch {
        return payload
      }
    }
  }

  private normalizePublishTime(value: unknown): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const ms = value > 1_000_000_000_000 ? value : value * 1000
      return new Date(ms).toISOString().replace('T', ' ').slice(0, 19)
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      if (/^\d{10,13}$/.test(trimmed)) {
        const n = Number(trimmed)
        if (Number.isFinite(n)) {
          const ms = trimmed.length === 13 ? n : n * 1000
          return new Date(ms).toISOString().replace('T', ' ').slice(0, 19)
        }
      }
      return trimmed
    }
    return ''
  }

  private extractNewsRows(payload: any): any[] {
    const data = this.unwrapJsonLikePayload(payload)
    const candidates = [
      data?.data?.list,
      data?.data?.items,
      data?.result?.data?.list,
      data?.result?.list,
      data?.list,
      data?.items,
    ]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate
      }
    }
    return []
  }

  detectMarket(code: string): MarketType {
    const lowerCode = code.toLowerCase()
    
    if (lowerCode.startsWith('sh')) return 'sh'
    if (lowerCode.startsWith('sz')) return 'sz'
    if (lowerCode.startsWith('hk')) return 'hk'
    if (lowerCode.startsWith('us')) return 'us'
    
    const cleanCode = code.replace(/^(sh|sz|hk|us)/i, '')
    
    if (/^\d{5}$/.test(cleanCode)) {
      return 'hk'
    }
    
    if (/^[a-zA-Z]+$/.test(cleanCode)) {
      return 'us'
    }
    
    if (/^6\d{5}$/.test(cleanCode)) {
      return 'sh'
    }
    
    if (/^0\d{5}$/.test(cleanCode) || /^3\d{5}$/.test(cleanCode)) {
      return 'sz'
    }
    
    if (/^\d{1,4}$/.test(cleanCode)) {
      return 'hk'
    }
    
    return 'sh'
  }

  formatCodeForSina(code: string): string {
    const market = this.detectMarket(code)
    const cleanCode = code.replace(/^(sh|sz|hk|us)/i, '')
    
    if (market === 'hk') {
      return cleanCode.padStart(5, '0')
    }
    
    return cleanCode.padStart(6, '0')
  }

  private normalizeCode(code: string): string {
    return code.replace(/^(sh|sz|hk|us)/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  }

  private normalizeAshareCode(code: string): string {
    return this.normalizeCode(code).padStart(6, '0')
  }

  private extractAnnouncementCodes(item: any): string[] {
    const values: string[] = []
    const append = (value: unknown) => {
      if (typeof value === 'string' && value.trim()) {
        values.push(value)
      } else if (typeof value === 'number') {
        values.push(String(value))
      }
    }

    append(item?.code)
    append(item?.stock_code)
    append(item?.stockCode)
    append(item?.secCode)
    append(item?.secid)
    append(item?.secId)
    append(item?.securitycode)
    append(item?.securityCode)
    append(item?.security_code)
    append(item?.symbol)

    if (typeof item?.stock_list === 'string') {
      item.stock_list.split(',').forEach((token: string) => append(token))
    } else if (Array.isArray(item?.stock_list)) {
      item.stock_list.forEach((token: unknown) => append(token))
    }

    if (typeof item?.codes === 'string') {
      item.codes.split(',').forEach((token: string) => append(token))
    } else if (Array.isArray(item?.codes)) {
      item.codes.forEach((entry: any) => {
        if (typeof entry === 'string') {
          append(entry)
          return
        }
        append(entry?.code)
        append(entry?.stock_code)
        append(entry?.stockCode)
        append(entry?.secCode)
      })
    }

    if (Array.isArray(item?.codes)) {
      item.codes.forEach((entry: any) => {
        append(entry?.secu_code)
        append(entry?.security_code)
        append(entry?.securityCode)
      })
    }

    const secIdCandidates = [item?.secid, item?.secId, item?.security_id]
    for (const secId of secIdCandidates) {
      if (typeof secId === 'string') {
        const m = secId.match(/^[01]\.(\d{6})$/)
        if (m?.[1]) {
          values.push(m[1])
        }
      }
    }

    return values
      .map((value) => this.normalizeCode(value))
      .map((value) => {
        const secMatch = value.match(/^[01](\d{6})$/)
        if (secMatch?.[1]) return secMatch[1]
        return value
      })
      .filter((value) => /^\d{6}$/.test(value))
  }

  private isAnnouncementForCode(item: any, targetCode: string): boolean {
    const codes = this.extractAnnouncementCodes(item)
    if (codes.includes(targetCode)) return true

    const title = String(item?.title || item?.notice_title || '')
    if (title.includes(targetCode)) return true

    const secid = String(item?.secid || item?.secId || '')
    if (secid.endsWith(`.${targetCode}`)) return true

    return false
  }

  private async fallbackNewsFromAnnouncements(code: string, maxItems: number): Promise<NewsItem[]> {
    const announcements = await this.fetchAnnouncements(code, maxItems)
    return announcements.map((item) => ({
      title: item.title,
      summary: item.summary,
      source: '东方财富公告',
      publishTime: item.publishTime,
      url: item.url,
      sentiment: 'neutral',
      relevance: 0.7
    }))
  }

  async fetchLatestNews(code: string, maxItems = 20, timeWindowDays = 7): Promise<NewsItem[]> {
    try {
      const market = this.detectMarket(code)
      const formattedCode = this.formatCodeForSina(code)
      const requestItems = Math.min(Math.max(maxItems * 3, 30), 100)
      
      const url = 'https://feeds.finance.sina.com.cn/finance/api/newsfeed.php'
      const response = await axios.get(url, {
        params: {
          symbol: market === 'hk' ? `hk${formattedCode}` : `${market}${formattedCode}`,
          page: 1,
          num: requestItems
        },
        timeout: this.timeout
      })

      const rows = this.extractNewsRows(response.data)
      if (rows.length === 0) {
        return await this.fallbackNewsFromAnnouncements(code, maxItems)
      }

      const cutoff = Number.isFinite(timeWindowDays) && timeWindowDays > 0
        ? Date.now() - timeWindowDays * 24 * 60 * 60 * 1000
        : null

      const items = rows.map((item: any) => ({
        title: item.title || item.name || item.headline || '',
        summary: item.summary || item.content?.slice(0, 200) || item.desc || item.digest,
        source: item.source || item.media || '新浪财经',
        publishTime: this.normalizePublishTime(item.ctime || item.time || item.publish_time || item.publishTime || item.datetime),
        url: item.url || item.link || item.docurl,
        sentiment: this.analyzeSentiment(item.title + ' ' + (item.summary || '')),
        relevance: 0.8
      })).filter((item: NewsItem) => {
        if (!item.title) return false
        if (cutoff === null || !item.publishTime) return true
        const timestamp = Date.parse(item.publishTime.replace(' ', 'T'))
        return Number.isNaN(timestamp) || timestamp >= cutoff
      })

      if (items.length > 0) {
        return items.slice(0, maxItems)
      }

      return await this.fallbackNewsFromAnnouncements(code, maxItems)
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-news] latest ${code} failed: ${this.briefError(error)}`)
      return await this.fallbackNewsFromAnnouncements(code, maxItems)
    }
  }

  async fetchAnnouncements(code: string, maxItems = 10): Promise<Announcement[]> {
    try {
      const market = this.detectMarket(code)
      
      if (market === 'hk' || market === 'us') {
        return []
      }

      const cleanCode = this.normalizeAshareCode(code)
      const secid = market === 'sh' ? `1.${cleanCode}` : `0.${cleanCode}`
      
      const url = 'https://np-anotice-stock.eastmoney.com/api/security/ann'
      const response = await axios.get(url, {
        params: {
          cb: '',
          sr: -1,
          page_size: Math.max(maxItems * 2, 20),
          page_index: 1,
          ann_type: 'SHA,SHB,SZA,SZB',
          client_source: 'web',
          f_node: 0,
          s_node: 0,
          secid: secid,
          stock_list: cleanCode,
        },
        timeout: this.timeout
      })

      const payload = this.unwrapJsonLikePayload(response.data)
      const rows = payload?.data?.list || payload?.result?.data?.list || payload?.list
      if (!Array.isArray(rows) || rows.length === 0) {
        return []
      }

      const filtered = rows.filter((item: any) => this.isAnnouncementForCode(item, cleanCode))
      if (filtered.length === 0) {
        return []
      }

      return filtered.map((item: any) => ({
        code: cleanCode,
        title: item.title || '',
        type: item.ann_type_name || '公告',
        publishTime: item.notice_date || '',
        url: item.adj_url ? `https://pdf.dfcfw.com/pdf/H2_${item.adj_url}.pdf` : undefined,
        summary: item.abstract
      }))
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-news] announcements ${code} failed: ${this.briefError(error)}`)
      return []
    }
  }

  async fetchNewsTimeline(code: string, startDate?: string, endDate?: string): Promise<{ date: string; news: NewsItem[] }[]> {
    try {
      const end = endDate ? Date.parse(endDate) : Date.now()
      const start = startDate ? Date.parse(startDate) : NaN
      const timeWindowDays = Number.isFinite(start)
        ? Math.max(1, Math.min(90, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1))
        : 30

      const news = await this.fetchLatestNews(code, 100, timeWindowDays)
      
      const grouped: { [date: string]: NewsItem[] } = {}
      
      for (const item of news) {
        const date = item.publishTime.split(' ')[0] || item.publishTime.split('T')[0] || 'unknown'
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(item)
      }

      let result = Object.entries(grouped)
        .map(([date, items]) => ({ date, news: items }))
        .sort((a, b) => b.date.localeCompare(a.date))

      if (startDate) {
        result = result.filter(r => r.date >= startDate)
      }
      if (endDate) {
        result = result.filter(r => r.date <= endDate)
      }

      return result.slice(0, 7)
    } catch (error) {
      const level = this.isExpectedNetworkError(error) ? 'warn' : 'error'
      console[level](`[stock-news] timeline ${code} failed: ${this.briefError(error)}`)
      return []
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['上涨', '增长', '利好', '突破', '新高', '盈利', '收益', '涨停', '大涨']
    const negativeWords = ['下跌', '亏损', '利空', '跌停', '大跌', '下滑', '减少', '风险', '违约']
    
    let positiveCount = 0
    let negativeCount = 0
    
    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++
    }
    
    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++
    }
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
}
