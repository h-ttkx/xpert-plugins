/**
 * K线历史数据工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchKlineData, detectMarket } from '../market-client.js'
import { MarketType } from '../types.js'

export function buildKlineHistoryTool() {
  return tool(
    async (input) => {
      try {
        const code = input.code.trim()
        const period = input.period || 'day'
        const count = Math.min(input.count || 30, 100)
        
        if (!code) {
          throw new Error('请提供有效的股票代码')
        }
        
        const market = detectMarket(code)
        if (market === MarketType.US) {
          throw new Error('暂不支持美股K线数据')
        }
        
        const klineData = await fetchKlineData(code, period as 'day' | 'week' | 'month', count)
        
        if (!klineData || klineData.data.length === 0) {
          throw new Error(`未获取到 ${code} 的K线数据`)
        }
        
        const periodLabel = { day: '日K', week: '周K', month: '月K' }[period]
        const marketLabel = {
          [MarketType.SH]: '沪A',
          [MarketType.SZ]: '深A',
          [MarketType.HK]: '港股'
        }[market]
        
        const recent = klineData.data.slice(-5)
        const latest = recent[recent.length - 1]
        const prev = recent.length > 1 ? recent[recent.length - 2] : null
        const change = prev ? latest.close - prev.close : 0
        const changePercent = prev && prev.close > 0 
          ? ((change / prev.close) * 100).toFixed(2) 
          : '0.00'
        
        let output = `【${code}】${marketLabel} ${periodLabel}数据\n\n`
        output += `最近交易日:\n`
        output += `  日期: ${latest.date}\n`
        output += `  收盘: ${latest.close.toFixed(2)} | 涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)\n`
        output += `  开盘: ${latest.open.toFixed(2)} | 最高: ${latest.high.toFixed(2)} | 最低: ${latest.low.toFixed(2)}\n`
        output += `  成交量: ${(latest.volume / 10000).toFixed(2)}万股\n\n`
        
        output += `最近5日数据:\n`
        output += `日期         开盘     最高     最低     收盘     成交量(万股)\n`
        for (const item of recent) {
          const vol = (item.volume / 10000).toFixed(2)
          output += `${item.date}  ${item.open.toFixed(2).padStart(7)}  ${item.high.toFixed(2).padStart(7)}  ${item.low.toFixed(2).padStart(7)}  ${item.close.toFixed(2).padStart(7)}  ${vol.padStart(10)}\n`
        }
        
        output += `\n数据范围: ${klineData.data[0].date} 至 ${klineData.data[klineData.data.length - 1].date} (共${klineData.data.length}条)`
        
        return output
      } catch (error) {
        throw new Error(`获取K线数据失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_kline_history',
      description: `获取股票K线历史数据，支持日K、周K、月K。
返回开高低收、成交量等信息，可查看近期走势。`,
      schema: z.object({
        code: z.string().describe('股票代码，如: 600519, 00700'),
        period: z.enum(['day', 'week', 'month']).optional().default('day').describe('K线周期: day(日K), week(周K), month(月K)'),
        count: z.number().min(1).max(100).optional().default(30).describe('返回数据条数，最多100条')
      })
    }
  )
}