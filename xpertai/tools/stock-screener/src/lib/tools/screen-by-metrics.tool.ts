import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { ScreenerClient } from '../screener-client.js'
import { MarketType, ScreenCondition } from '../types.js'

export function buildScreenByMetricsTool(client: ScreenerClient) {
  return tool(
    async (input) => {
      try {
        const market = input.market as MarketType | 'ALL'
        const limit = input.limit || 50

        const conditions: ScreenCondition[] = []

        if (input.peMin !== undefined || input.peMax !== undefined) {
          if (input.peMin !== undefined && input.peMax !== undefined) {
            conditions.push({ field: 'pe', operator: 'between', value: [input.peMin, input.peMax] })
          } else if (input.peMin !== undefined) {
            conditions.push({ field: 'pe', operator: '>=', value: input.peMin })
          } else if (input.peMax !== undefined) {
            conditions.push({ field: 'pe', operator: '<=', value: input.peMax! })
          }
        }

        if (input.pbMin !== undefined || input.pbMax !== undefined) {
          if (input.pbMin !== undefined && input.pbMax !== undefined) {
            conditions.push({ field: 'pb', operator: 'between', value: [input.pbMin, input.pbMax] })
          } else if (input.pbMin !== undefined) {
            conditions.push({ field: 'pb', operator: '>=', value: input.pbMin })
          } else if (input.pbMax !== undefined) {
            conditions.push({ field: 'pb', operator: '<=', value: input.pbMax! })
          }
        }

        if (input.roeMin !== undefined) {
          conditions.push({ field: 'roe', operator: '>=', value: input.roeMin })
        }

        if (input.dividendYieldMin !== undefined) {
          conditions.push({ field: 'dividendYield', operator: '>=', value: input.dividendYieldMin })
        }

        if (conditions.length === 0) {
          return '请至少提供一个筛选条件（PE、PB、ROE或股息率）。'
        }

        const results = await client.screenByMetrics(conditions, market, limit)

        if (results.length === 0) {
          return '未找到符合条件的股票。'
        }

        const marketLabel = {
          [MarketType.SH]: '沪A',
          [MarketType.SZ]: '深A',
          [MarketType.HK]: '港股',
          [MarketType.US]: '美股',
          'ALL': '全市场'
        }[market]

        let output = `【按指标筛选 - ${marketLabel}】\n`
        output += `筛选条件:\n`
        
        const conditionTexts: string[] = []
        if (input.peMin !== undefined || input.peMax !== undefined) {
          if (input.peMin !== undefined && input.peMax !== undefined) {
            conditionTexts.push(`  PE: ${input.peMin} - ${input.peMax}`)
          } else if (input.peMin !== undefined) {
            conditionTexts.push(`  PE >= ${input.peMin}`)
          } else {
            conditionTexts.push(`  PE <= ${input.peMax}`)
          }
        }
        if (input.pbMin !== undefined || input.pbMax !== undefined) {
          if (input.pbMin !== undefined && input.pbMax !== undefined) {
            conditionTexts.push(`  PB: ${input.pbMin} - ${input.pbMax}`)
          } else if (input.pbMin !== undefined) {
            conditionTexts.push(`  PB >= ${input.pbMin}`)
          } else {
            conditionTexts.push(`  PB <= ${input.pbMax}`)
          }
        }
        if (input.roeMin !== undefined) {
          conditionTexts.push(`  ROE >= ${input.roeMin}%`)
        }
        if (input.dividendYieldMin !== undefined) {
          conditionTexts.push(`  股息率 >= ${input.dividendYieldMin}%`)
        }
        
        output += conditionTexts.join('\n') + '\n'
        output += `找到 ${results.length} 只股票:\n\n`

        results.slice(0, 20).forEach((item, index) => {
          const changeSign = item.changePercent >= 0 ? '+' : ''
          const marketName = {
            [MarketType.SH]: '沪A',
            [MarketType.SZ]: '深A',
            [MarketType.HK]: '港股',
            [MarketType.US]: '美股'
          }[item.market]
          
          output += `${index + 1}. ${item.name}(${item.code}) [${marketName}]\n`
          output += `   价格: ${item.price.toFixed(2)} | 涨跌: ${changeSign}${item.changePercent.toFixed(2)}%\n`
          output += `   市值: ${(item.marketCap / 100000000).toFixed(2)}亿`
          if (item.pe) output += ` | PE: ${item.pe.toFixed(2)}`
          if (item.pb) output += ` | PB: ${item.pb.toFixed(2)}`
          if (item.roe) output += ` | ROE: ${item.roe.toFixed(2)}%`
          output += `\n`
        })

        if (results.length > 20) {
          output += `\n... 还有 ${results.length - 20} 只股票未显示。`
        }

        return output
      } catch (error) {
        throw new Error(`按指标筛选失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_screen_by_metrics',
      description: `按财务指标筛选股票。
支持指标:
- PE: 市盈率
- PB: 市净率
- ROE: 净资产收益率
- 股息率: 分红收益率
返回符合条件的股票列表。`,
      schema: z.object({
        market: z.enum(['SH', 'SZ', 'HK', 'ALL']).optional().default('ALL').describe('市场类型'),
        peMin: z.number().optional().describe('最小市盈率'),
        peMax: z.number().optional().describe('最大市盈率'),
        pbMin: z.number().optional().describe('最小市净率'),
        pbMax: z.number().optional().describe('最大市净率'),
        roeMin: z.number().optional().describe('最小ROE(%)'),
        dividendYieldMin: z.number().optional().describe('最小股息率(%)'),
        limit: z.number().min(1).max(200).optional().describe('返回数量限制，默认50，最大200')
      })
    }
  )
}