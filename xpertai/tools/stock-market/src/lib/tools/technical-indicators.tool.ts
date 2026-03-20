/**
 * 技术指标工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchKlineData, calculateMA, calculateMACD, calculateRSI, calculateKDJ, detectMarket } from '../market-client.js'
import { MarketType } from '../types.js'

export function buildTechnicalIndicatorsTool() {
  return tool(
    async (input) => {
      try {
        const code = input.code.trim()
        
        if (!code) {
          throw new Error('请提供有效的股票代码')
        }
        
        const market = detectMarket(code)
        if (market === MarketType.US) {
          throw new Error('暂不支持美股技术指标')
        }
        
        const klineData = await fetchKlineData(code, 'day', 100)
        
        if (!klineData || klineData.data.length < 35) {
          throw new Error('数据不足，无法计算技术指标')
        }
        
        const data = klineData.data
        const latest = data[data.length - 1]
        
        const ma = calculateMA(data, [5, 10, 20, 30, 60])
        const macd = calculateMACD(data)
        const rsi6 = calculateRSI(data, 6)
        const rsi12 = calculateRSI(data, 12)
        const rsi24 = calculateRSI(data, 24)
        const kdj = calculateKDJ(data)
        
        let output = `【${code}】技术指标分析\n\n`
        
        output += `均线系统 (MA):\n`
        Object.entries(ma).forEach(([key, value]) => {
          const diff = latest.close - value
          const sign = diff >= 0 ? '+' : ''
          output += `  ${key.toUpperCase()}: ${value.toFixed(2)} (${sign}${diff.toFixed(2)})\n`
        })
        
        if (macd) {
          output += `\nMACD指标:\n`
          output += `  DIF: ${macd.dif.toFixed(2)}\n`
          output += `  DEA: ${macd.dea.toFixed(2)}\n`
          output += `  MACD: ${macd.macd.toFixed(2)} ${macd.macd > 0 ? '(多头)' : '(空头)'}\n`
        }
        
        if (rsi6 !== null || rsi12 !== null || rsi24 !== null) {
          output += `\nRSI指标:\n`
          if (rsi6 !== null) output += `  RSI(6): ${rsi6.toFixed(2)} ${rsi6 > 70 ? '(超买)' : rsi6 < 30 ? '(超卖)' : ''}\n`
          if (rsi12 !== null) output += `  RSI(12): ${rsi12.toFixed(2)}\n`
          if (rsi24 !== null) output += `  RSI(24): ${rsi24.toFixed(2)}\n`
        }
        
        if (kdj) {
          output += `\nKDJ指标:\n`
          output += `  K: ${kdj.k.toFixed(2)}\n`
          output += `  D: ${kdj.d.toFixed(2)}\n`
          output += `  J: ${kdj.j.toFixed(2)}\n`
        }
        
        output += `\n价格位置:\n`
        output += `  当前价: ${latest.close.toFixed(2)}\n`
        if (ma.ma5) {
          const ma5Status = latest.close > ma.ma5 ? '站上' : '跌破'
          output += `  相对MA5: ${ma5Status} (${((latest.close / ma.ma5 - 1) * 100).toFixed(2)}%)\n`
        }
        if (ma.ma20) {
          const ma20Status = latest.close > ma.ma20 ? '站上' : '跌破'
          output += `  相对MA20: ${ma20Status} (${((latest.close / ma.ma20 - 1) * 100).toFixed(2)}%)\n`
        }
        
        return output
      } catch (error) {
        throw new Error(`计算技术指标失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_technical_indicators',
      description: `计算股票技术指标，包括:
- 移动平均线 (MA5/10/20/30/60)
- MACD指标 (DIF/DEA/MACD)
- RSI指标 (6/12/24日)
- KDJ指标
返回指标数值和简单分析。`,
      schema: z.object({
        code: z.string().describe('股票代码，如: 600519, 00700')
      })
    }
  )
}