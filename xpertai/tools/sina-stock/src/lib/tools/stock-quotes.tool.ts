/**
 * 获取股票行情工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchStockQuotes, formatCodeForSina } from '../sina-client.js'

/**
 * 获取股票实时行情工具
 */
export function buildStockQuotesTool() {
  return tool(
    async (input) => {
      try {
        const codes = input.codes.split(',').map((c: string) => c.trim()).filter(Boolean)

        if (codes.length === 0) {
          return '请提供有效的股票代码'
        }

        const quotes = await fetchStockQuotes(codes)

        if (quotes.size === 0) {
          return '未获取到股票数据，请检查股票代码是否正确'
        }

        // 格式化输出
        const results: string[] = []
        quotes.forEach((quote, code) => {
          const changeSign = quote.change >= 0 ? '+' : ''
          results.push(
            `【${quote.name}(${quote.code})】\n` +
            `  当前价: ${quote.price.toFixed(2)} 元\n` +
            `  涨跌额: ${changeSign}${quote.change.toFixed(2)} 元\n` +
            `  涨跌幅: ${changeSign}${quote.changePercent.toFixed(2)}%\n` +
            `  今开: ${quote.open.toFixed(2)} 元\n` +
            `  最高: ${quote.high.toFixed(2)} 元\n` +
            `  最低: ${quote.low.toFixed(2)} 元\n` +
            `  昨收: ${quote.preClose.toFixed(2)} 元\n` +
            `  成交量: ${(quote.volume / 10000).toFixed(2)} 万股\n` +
            `  成交额: ${(quote.amount / 100000000).toFixed(2)} 亿元\n` +
            `  更新时间: ${quote.time}`
          )
        })

        return results.join('\n\n')
      } catch (error) {
        return `获取股票行情失败: ${getErrorMessage(error)}`
      }
    },
    {
      name: 'sina_stock_quotes',
      description: `获取A股和港股的实时行情数据。
支持上海证券交易所(6开头)、深圳证券交易所(0/3开头)和港股。
输入股票代码，返回当前价格、涨跌幅、成交量等信息。
示例: 600519 (贵州茅台), 000001 (平安银行), 00700 (腾讯控股)`,
      schema: z.object({
        codes: z.string().describe('股票代码，多个用逗号分隔，如: 600519,000001,00700')
      })
    }
  )
}

/**
 * 获取单只股票详情工具
 */
export function buildStockDetailTool() {
  return tool(
    async (input) => {
      try {
        const code = input.code.trim()
        if (!code) {
          return '请提供有效的股票代码'
        }

        const quotes = await fetchStockQuotes([code])

        if (quotes.size === 0) {
          return `未找到股票 ${code} 的数据，请检查代码是否正确`
        }

        const quote = quotes.values().next().value

        // 计算更多指标
        const amplitude = quote.preClose > 0
          ? ((quote.high - quote.low) / quote.preClose * 100).toFixed(2)
          : '0.00'

        const turnoverRate = quote.amount > 0 && quote.preClose > 0
          ? (quote.volume * quote.price / (quote.amount * 100) * 100).toFixed(2)
          : 'N/A'

        return JSON.stringify({
          code: quote.code,
          name: quote.name,
          market: quote.market.toUpperCase(),
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          preClose: quote.preClose,
          volume: quote.volume,
          amount: quote.amount,
          amplitude: `${amplitude}%`,
          time: quote.time
        }, null, 2)
      } catch (error) {
        return `获取股票详情失败: ${getErrorMessage(error)}`
      }
    },
    {
      name: 'sina_stock_detail',
      description: `获取单只股票的详细行情数据，返回JSON格式。
包含: 代码、名称、市场、价格、涨跌、成交量、成交额、振幅等。`,
      schema: z.object({
        code: z.string().describe('股票代码，如: 600519, 000001, 00700')
      })
    }
  )
}