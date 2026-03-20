/**
 * 新浪财经 API 客户端
 * 免费获取 A股、港股实时行情数据
 */

import { StockMarket, StockQuote, SinaRawQuote } from './types.js'
import iconv from 'iconv-lite'

// 新浪财经 API 地址
const SINA_QUOTE_URL = 'https://hq.sinajs.cn/list='

// 请求头（模拟浏览器）
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://finance.sina.com.cn',
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

/**
 * 根据股票代码判断市场
 */
export function getMarketByCode(code: string): StockMarket {
  const cleanCode = code.replace(/^(sh|sz|hk)/i, '')

  // 港股：5位数字，通常以0、1、2开头
  if (/^\d{5}$/.test(cleanCode) || /^hk/i.test(code)) {
    return StockMarket.HK
  }

  // 上海：6开头
  if (/^6\d{5}$/.test(cleanCode)) {
    return StockMarket.SH
  }

  // 深圳：0、3开头
  if (/^(0|3)\d{5}$/.test(cleanCode)) {
    return StockMarket.SZ
  }

  // 默认上海
  return StockMarket.SH
}

/**
 * 格式化股票代码为新浪格式
 * - 上海: sh600519
 * - 深圳: sz000001
 * - 港股: hk00700
 */
export function formatCodeForSina(code: string): string {
  // 先去除已有前缀
  const cleanCode = code.replace(/^(sh|sz|hk)/i, '')

  // 港股特殊处理 - 5位代码
  if (cleanCode.length === 5 || /^hk/i.test(code)) {
    return `hk${cleanCode.padStart(5, '0')}`
  }

  // A股 - 6位代码
  const paddedCode = cleanCode.padStart(6, '0')
  const market = getMarketByCode(paddedCode)
  return `${market}${paddedCode}`
}

/**
 * 解析新浪返回的行情数据
 * 格式: var hq_str_sh600519="贵州茅台,1678.00,1688.00,1690.00,1668.00,1668.00,14234,239345600.00,..."
 */
export function parseSinaQuote(rawData: string): Map<string, StockQuote> {
  const result = new Map<string, StockQuote>()

  // 正则匹配: var hq_str_sh600519="..."
  const regex = /var hq_str_([^=]+)="([^"]*)"/g
  let match

  while ((match = regex.exec(rawData)) !== null) {
    const code = match[1]  // sh600519
    const data = match[2]  // 贵州茅台,1678.00,...

    if (!data || data.trim() === '') {
      continue
    }

    const fields = data.split(',')
    if (fields.length < 10) {
      continue
    }

    // 解析字段
    const quote = parseQuoteFields(code, fields)
    if (quote) {
      result.set(quote.code, quote)
    }
  }

  return result
}

/**
 * 解析字段数据
 * 新浪数据字段说明（A股）：
 * 0: 名称, 1: 开盘, 2: 昨收, 3: 当前, 4: 最高, 5: 最低,
 * 6: 买入, 7: 卖出, 8: 成交量(股), 9: 成交额(元),
 * ...
 * 30: 日期, 31: 时间
 */
function parseQuoteFields(sinaCode: string, fields: string[]): StockQuote | null {
  try {
    const code = sinaCode.replace(/^(sh|sz|hk)/, '')
    const market = getMarketByCode(code)

    let name = fields[0] || ''
    let open = 0
    let preClose = 0
    let price = 0
    let high = 0
    let low = 0
    let volume = 0
    let amount = 0
    let change = 0
    let changePercent = 0
    let date = ''
    let time = ''

    if (market === StockMarket.HK) {
      // 港股字段（新浪 hk）：
      // 0: 英文名, 1: 中文名, 2: 今开, 3: 昨收, 4: 最高, 5: 最低,
      // 6: 最新价, 7: 涨跌额, 8: 涨跌幅(%), 11: 成交额, 12: 成交量, 17: 日期, 18: 时间
      name = fields[1] || fields[0] || ''
      open = parseFloat(fields[2]) || 0
      preClose = parseFloat(fields[3]) || 0
      high = parseFloat(fields[4]) || 0
      low = parseFloat(fields[5]) || 0
      price = parseFloat(fields[6]) || 0
      change = parseFloat(fields[7])
      if (Number.isNaN(change)) {
        change = price - preClose
      }
      changePercent = parseFloat(fields[8])
      if (Number.isNaN(changePercent)) {
        changePercent = preClose > 0 ? (change / preClose) * 100 : 0
      }
      amount = parseFloat(fields[11]) || 0
      volume = parseFloat(fields[12]) || 0
      date = fields[17] || ''
      time = fields[18] || ''
    } else {
      // 新浪实时行情中 A 股返回值已是：成交量(股)、成交额(元)
      name = fields[0]
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
      code,
      name,
      price,
      open,
      high,
      low,
      preClose,
      volume,
      amount,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      time: `${date} ${time}`,
      market,
    }
  } catch (error) {
    return null
  }
}

/**
 * 获取股票行情（单只或多只）
 */
export async function fetchStockQuotes(codes: string[]): Promise<Map<string, StockQuote>> {
  if (codes.length === 0) {
    return new Map()
  }

  // 格式化代码
  const sinaCodes = codes.map(formatCodeForSina)
  const url = `${SINA_QUOTE_URL}${sinaCodes.join(',')}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 新浪接口默认返回 GBK 编码，直接 text() 会导致中文乱码
    const buffer = Buffer.from(await response.arrayBuffer())
    const text = iconv.decode(buffer, 'gbk')
    return parseSinaQuote(text)
  } catch (error) {
    console.error('Failed to fetch stock quotes:', error)
    return new Map()
  }
}

/**
 * 获取单只股票行情
 */
export async function fetchStockQuote(code: string): Promise<StockQuote | null> {
  const quotes = await fetchStockQuotes([code])
  const cleanCode = code.replace(/^(sh|sz|hk)/i, '')
  const market = getMarketByCode(code)
  const normalizedCode = market === StockMarket.HK ? cleanCode.padStart(5, '0') : cleanCode.padStart(6, '0')
  return quotes.get(normalizedCode) || null
}
