/**
 * 板块成分股工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'

export function buildSectorConstituentsTool(config?: { source: string; timeout: number }) {
  const timeout = config?.timeout || 5000
  return tool(
    async (input) => {
      try {
        const constituents = await fetchSectorConstituents(input.sectorCode, input.limit, timeout)
        return formatConstituentsOutput(constituents, input.sectorCode)
      } catch (error) {
        throw new Error(`获取成分股失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'sector_constituents',
      description: '获取指定板块的成分股列表，包括股票代码、名称、权重、涨跌幅等信息',
      schema: z.object({
        sectorCode: z.string().describe('板块代码（如：BK0001）'),
        limit: z.number().min(1).max(100).optional().default(20).describe('返回数量限制，默认20')
      })
    }
  )
}

async function fetchSectorConstituents(sectorCode: string, limit?: number, timeout?: number): Promise<any[]> {
  try {
    const url = buildConstituentsUrl(sectorCode, limit || 20)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout || 5000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return parseConstituents(data)
  } catch (error: any) {
    return [{
      error: '获取成分股失败',
      message: error.message,
      suggestion: '请检查板块代码是否正确'
    }]
  }
}

function buildConstituentsUrl(sectorCode: string, limit: number): string {
  return `https://push2.eastmoney.com/api/qt/clist/get?fid=f3&po=1&pz=${limit}&pn=1&np=1&fs=b:${sectorCode}&fields=f12,f14,f2,f3,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204,f205,f124,f1,f13`
}

function parseConstituents(data: any): any[] {
  if (!data?.data?.diff) return []
  
  return data.data.diff.map((item: any) => {
    const market = item.f13 === 1 ? 'SZ' : item.f13 === 0 ? 'SH' : 'HK'
    return {
      code: item.f12,
      name: item.f14,
      market: market,
      price: item.f2 / 100,
      changePercent: item.f3 / 100,
      volume: item.f66,
      amount: item.f69,
      turnover: item.f72
    }
  })
}

function formatConstituentsOutput(constituents: any[], sectorCode: string): string {
  if (constituents.length === 0) {
    return `暂无板块 ${sectorCode} 的成分股数据`
  }
  
  if (constituents[0].error) {
    return `❌ ${constituents[0].error}: ${constituents[0].message}\n💡 ${constituents[0].suggestion}`
  }
  
  const lines = constituents.map((c, i) => {
    const changeIcon = c.changePercent >= 0 ? '📈' : '📉'
    return `${i + 1}. ${c.name}(${c.code}) ${changeIcon} ${c.changePercent.toFixed(2)}% 成交额: ${(c.amount / 100000000).toFixed(2)}亿`
  })
  
  return `📋 板块 ${sectorCode} 成分股 (共${constituents.length}只)\n\n${lines.join('\n')}`
}