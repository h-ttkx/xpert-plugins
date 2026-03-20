/**
 * 实时行情工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchRealtimeQuotes, detectMarket, normalizeCode } from '../market-client.js'
import { MarketType } from '../types.js'

export function buildQuoteRealtimeTool() {
  return tool(
    async (input) => {
      try {
        const codes = input.codes.split(',').map((c: string) => c.trim()).filter(Boolean)
        
        if (codes.length === 0) {
          throw new Error('请提供有效的股票代码')
        }
        
        const quotes = await fetchRealtimeQuotes(codes)
        
        if (quotes.size === 0) {
          throw new Error('未获取到股票数据，请检查股票代码是否正确')
        }
        
        const results: string[] = []
        quotes.forEach((quote, code) => {
          const changeSign = quote.change >= 0 ? '+' : ''
          const marketLabel = {
            [MarketType.SH]: '沪A',
            [MarketType.SZ]: '深A',
            [MarketType.HK]: '港股',
            [MarketType.US]: '美股'
          }[quote.market]
          
          const currency = quote.market === MarketType.HK ? '港元' : 
                          quote.market === MarketType.US ? '美元' : '元'
          
          const volumeStr = quote.market === MarketType.US 
            ? `${(quote.volume / 1000000).toFixed(2)}百万股`
            : `${(quote.volume / 10000).toFixed(2)}万股`
          
          const amountStr = quote.market === MarketType.US 
            ? quote.amount > 0 ? `${(quote.amount / 1000000).toFixed(2)}百万美元` : 'N/A'
            : `${(quote.amount / 100000000).toFixed(2)}亿`
          
          results.push(
            `【${quote.name}(${quote.code})】${marketLabel}\n` +
            `  当前价: ${quote.price.toFixed(2)} ${currency}\n` +
            `  涨跌额: ${changeSign}${quote.change.toFixed(2)}\n` +
            `  涨跌幅: ${changeSign}${quote.changePercent.toFixed(2)}%\n` +
            `  今开: ${quote.open.toFixed(2)} | 最高: ${quote.high.toFixed(2)} | 最低: ${quote.low.toFixed(2)}\n` +
            `  昨收: ${quote.preClose.toFixed(2)}\n` +
            `  成交量: ${volumeStr}${quote.market !== MarketType.US ? ` | 成交额: ${amountStr}` : ''}\n` +
            `  更新: ${quote.time || 'N/A'}`
          )
        })
        
        return results.join('\n\n')
      } catch (error) {
        throw new Error(`获取实时行情失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_quote_realtime',
      description: `获取A股、港股和美股的实时行情数据。
支持市场:
- 上海证券交易所 (6开头)
- 深圳证券交易所 (0/3开头)
- 香港联合交易所 (5位代码)
- 美国股市 (字母代码如 AAPL, TSLA, GOOGL)
返回实时价格、涨跌幅、成交量等信息。`,
      schema: z.object({
        codes: z.string().describe('股票代码，多个用逗号分隔，如: 600519,000001,00700,AAPL,TSLA')
      })
    }
  )
}