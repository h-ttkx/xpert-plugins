/**
 * 板块排名工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'

export function buildSectorRankingTool(config?: { source: string; timeout: number }) {
  const timeout = config?.timeout || 5000
  return tool(
    async (input) => {
      try {
        const ranking = await fetchSectorRanking(input.type, input.sortBy, input.limit, input.order, timeout)
        return formatRankingOutput(ranking, input.type, input.sortBy)
      } catch (error) {
        throw new Error(`获取板块排名失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'sector_ranking',
      description: '获取板块涨跌幅或成交额排名，支持行业、概念、地域板块',
      schema: z.object({
        type: z.enum(['industry', 'concept', 'region']).describe('板块类型：industry-行业板块, concept-概念板块, region-地域板块'),
        sortBy: z.enum(['changePercent', 'turnover']).optional().default('changePercent').describe('排序字段：changePercent-涨跌幅, turnover-成交额'),
        limit: z.number().min(1).max(50).optional().default(10).describe('返回数量，默认10'),
        order: z.enum(['desc', 'asc']).optional().default('desc').describe('排序方向：desc-降序, asc-升序')
      })
    }
  )
}

async function fetchSectorRanking(type: string, sortBy?: string, limit?: number, order?: string, timeout?: number): Promise<any[]> {
  try {
    const url = buildRankingUrl(type, sortBy || 'changePercent', order || 'desc', limit || 10)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout || 5000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return parseRanking(data, type)
  } catch (error: any) {
    return [{
      error: '获取板块排名失败',
      message: error.message,
      suggestion: '请稍后重试或切换数据源'
    }]
  }
}

function buildRankingUrl(type: string, sortBy: string, order: string, limit: number): string {
  const typeMap: Record<string, string> = {
    industry: 'm:90+t:2',
    concept: 'm:90+t:3',
    region: 'm:90+t:1'
  }
  const fid = sortBy === 'turnover' ? 'f69' : 'f3'
  const po = order === 'asc' ? '0' : '1'
  
  return `https://push2.eastmoney.com/api/qt/clist/get?fid=${fid}&po=${po}&pz=${limit}&pn=1&np=1&fs=${typeMap[type] || typeMap.industry}&fields=f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13`
}

function parseRanking(data: any, type: string): any[] {
  if (!data?.data?.diff) return []
  
  return data.data.diff.map((item: any, index: number) => ({
    rank: index + 1,
    code: item.f12,
    name: item.f14,
    type: type,
    price: item.f2 / 100,
    changePercent: item.f3 / 100,
    volume: item.f66,
    amount: item.f69,
    turnover: item.f72
  }))
}

function formatRankingOutput(ranking: any[], type: string, sortBy?: string): string {
  if (ranking.length === 0) {
    return '暂无板块排名数据'
  }
  
  if (ranking[0].error) {
    return `❌ ${ranking[0].error}: ${ranking[0].message}\n💡 ${ranking[0].suggestion}`
  }
  
  const typeLabel = type === 'industry' ? '行业' : type === 'concept' ? '概念' : '地域'
  const sortLabel = (sortBy === 'turnover') ? '成交额' : '涨跌幅'
  
  const lines = ranking.map((r) => {
    const changeIcon = r.changePercent >= 0 ? '📈' : '📉'
    const medal = r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `${r.rank}.`
    return `${medal} ${r.name}(${r.code}) ${changeIcon} ${r.changePercent.toFixed(2)}% 成交额: ${(r.amount / 100000000).toFixed(2)}亿`
  })
  
  return `🏆 ${typeLabel}板块${sortLabel}排名 (TOP ${ranking.length})\n\n${lines.join('\n')}`
}