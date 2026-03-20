/**
 * 股票基础信息工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchRealtimeQuotes, detectMarket, normalizeCode } from '../market-client.js'
import { MarketType } from '../types.js'

export function buildBasicInfoTool() {
  return tool(
    async (input) => {
      try {
        const code = input.code.trim()
        
        if (!code) {
          throw new Error('请提供有效的股票代码')
        }
        
        const market = detectMarket(code)
        
        if (market === MarketType.US) {
          const normalizedCode = code.toUpperCase()
          return JSON.stringify({
            code: normalizedCode,
            market: 'US',
            name: `${normalizedCode} (美股)`,
            note: '美股基础信息暂不支持，请使用实时行情工具获取价格数据'
          }, null, 2)
        }
        
        const quotes = await fetchRealtimeQuotes([code])
        
        if (quotes.size === 0) {
          throw new Error(`未找到股票 ${code} 的信息`)
        }
        
        const quote = quotes.values().next().value
        const normalizedCode = normalizeCode(code, market)
        
        const amplitude = quote.preClose > 0 
          ? ((quote.high - quote.low) / quote.preClose * 100).toFixed(2)
          : '0.00'
        
        const turnoverRate = 'N/A'
        
        const result: Record<string, any> = {
          code: normalizedCode,
          name: quote.name,
          market: {
            [MarketType.SH]: '上海证券交易所',
            [MarketType.SZ]: '深圳证券交易所',
            [MarketType.HK]: '香港联合交易所',
            [MarketType.US]: '美国证券交易所'
          }[quote.market],
          marketCode: quote.market.toUpperCase(),
          latestPrice: quote.price,
          change: quote.change,
          changePercent: `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent}%`,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          preClose: quote.preClose,
          volume: {
            value: quote.volume,
            unit: '股',
            formatted: `${(quote.volume / 10000).toFixed(2)}万股`
          },
          amount: {
            value: quote.amount,
            unit: quote.market === MarketType.HK ? '港元' : '元',
            formatted: `${(quote.amount / 100000000).toFixed(2)}亿`
          },
          amplitude: `${amplitude}%`,
          turnoverRate,
          updateTime: quote.time || 'N/A',
          dataSource: quote.source || 'sina'
        }
        
        return JSON.stringify(result, null, 2)
      } catch (error) {
        throw new Error(`获取股票基础信息失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_basic_info',
      description: `获取股票基础信息，返回JSON格式。
包含: 代码、名称、市场、价格、涨跌、成交量、成交额、振幅等。
适合需要结构化数据的场景。`,
      schema: z.object({
        code: z.string().describe('股票代码，如: 600519, 000001, 00700')
      })
    }
  )
}