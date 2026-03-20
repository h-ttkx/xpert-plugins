/**
 * 板块行情工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'

export function buildSectorQuotesTool(config?: { source: string; timeout: number }) {
  const timeout = config?.timeout || 5000
  return tool(
    async (input) => {
      try {
        const quotes = await fetchSectorQuotes(input.type, input.market, timeout)
        return formatQuotesOutput(quotes)
      } catch (error) {
        throw new Error(`获取板块行情失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'sector_quotes',
      description: `获取行业板块、概念板块、地域板块的实时行情数据，包括涨跌幅、成交量、成交额、领涨股等。
支持类型:
- industry: 行业板块 (如银行、医药、房地产等)
- concept: 概念板块 (如人工智能、新能源、芯片等)
- region: 地域板块 (如上海、北京、深圳等)`,
      schema: z.object({
        type: z.enum(['industry', 'concept', 'region']).describe('板块类型：industry-行业板块, concept-概念板块, region-地域板块'),
        market: z.enum(['SH', 'SZ', 'HK']).optional().describe('市场筛选（可选）：SH-上海, SZ-深圳, HK-港股')
      })
    }
  )
}

async function fetchSectorQuotes(type: string, market?: string, timeout?: number): Promise<any[]> {
  try {
    const url = buildSectorQuotesUrl(type, market)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout || 5000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return parseSectorQuotes(data, type)
  } catch (error: any) {
    return [{
      error: '获取板块行情失败',
      message: error.message,
      suggestion: '请稍后重试或切换数据源'
    }]
  }
}

function buildSectorQuotesUrl(type: string, market?: string): string {
  const typeMap: Record<string, string> = {
    industry: 'm:90+t:2',
    concept: 'm:90+t:3',
    region: 'm:90+t:1'
  }
  const secid = market ? `${market === 'HK' ? '116' : market}` : 'm:90'
  return `https://push2.eastmoney.com/api/qt/clist/get?fid=f3&po=1&pz=50&pn=1&np=1&fs=${typeMap[type] || typeMap.industry}&fields=f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13`
}

function parseSectorQuotes(data: any, type: string): any[] {
  if (!data?.data?.diff) return []
  
  return data.data.diff.map((item: any, index: number) => ({
    rank: index + 1,
    code: item.f12,
    name: item.f14,
    type: type,
    price: item.f2 / 100,
    change: item.f3 / 100,
    changePercent: item.f3 / 100,
    volume: item.f66,
    amount: item.f69,
    turnover: item.f72,
    leadingStock: item.f184 ? {
      code: String(item.f184).split(',')[0] || '',
      name: String(item.f184).split(',')[1] || ''
    } : undefined
  }))
}

function formatQuotesOutput(quotes: any[]): string {
  if (quotes.length === 0) {
    return '暂无板块行情数据'
  }
  
  if (quotes[0].error) {
    return `❌ ${quotes[0].error}: ${quotes[0].message}\n💡 ${quotes[0].suggestion}`
  }
  
  const lines = quotes.map((q, i) => {
    const changeIcon = q.changePercent >= 0 ? '📈' : '📉'
    return `${i + 1}. ${q.name}(${q.code}) ${changeIcon} ${q.changePercent.toFixed(2)}% 成交额: ${(q.amount / 100000000).toFixed(2)}亿`
  })
  
  return `📊 板块行情 (共${quotes.length}个板块)\n\n${lines.join('\n')}`
}