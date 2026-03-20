import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { ScreenerClient } from '../screener-client.js'
import { MarketType } from '../types.js'

export function buildScreenByMarketCapTool(client: ScreenerClient) {
  return tool(
    async (input) => {
      try {
        const market = input.market as MarketType | 'ALL'
        const minCap = input.minCap ? input.minCap * 100000000 : undefined
        const maxCap = input.maxCap ? input.maxCap * 100000000 : undefined
        const limit = input.limit || 50

        const results = await client.screenByMarketCap(market, minCap, maxCap, limit)

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

        let output = `【按市值筛选 - ${marketLabel}】\n`
        output += `筛选条件: `
        const conditions: string[] = []
        if (minCap) conditions.push(`市值 >= ${input.minCap}亿`)
        if (maxCap) conditions.push(`市值 <= ${input.maxCap}亿`)
        output += conditions.length > 0 ? conditions.join(', ') : '不限'
        output += `\n找到 ${results.length} 只股票:\n\n`

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
        throw new Error(`按市值筛选失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_screen_by_market_cap',
      description: `按市值筛选股票。
支持市场:
- SH: 上海证券交易所
- SZ: 深圳证券交易所
- HK: 香港联合交易所
- ALL: 全市场
返回市值、PE、PB、ROE等指标。`,
      schema: z.object({
        market: z.enum(['SH', 'SZ', 'HK', 'ALL']).describe('市场类型: SH(上海), SZ(深圳), HK(港股), ALL(全市场)'),
        minCap: z.number().optional().describe('最小市值(亿元)'),
        maxCap: z.number().optional().describe('最大市值(亿元)'),
        limit: z.number().min(1).max(200).optional().describe('返回数量限制，默认50，最大200')
      })
    }
  )
}