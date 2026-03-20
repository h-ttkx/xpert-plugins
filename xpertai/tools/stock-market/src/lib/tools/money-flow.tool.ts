/**
 * 资金流向工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { fetchMoneyFlow, detectMarket } from '../market-client.js'
import { MarketType } from '../types.js'

export function buildMoneyFlowTool() {
  return tool(
    async (input) => {
      try {
        const code = input.code.trim()
        
        if (!code) {
          throw new Error('请提供有效的股票代码')
        }
        
        const market = detectMarket(code)
        
        if (market === MarketType.US) {
          return '资金流向数据暂不支持美股，仅支持A股'
        }
        
        if (market === MarketType.HK) {
          return '资金流向数据暂不支持港股，仅支持A股'
        }
        
        const flow = await fetchMoneyFlow(code)
        
        if (!flow) {
          return `【资金流向 ${code}】${market === MarketType.SH ? '沪A' : '深A'}

暂未获取到实时资金流向数据。
可能原因:
- 数据源接口短时无数据
- 非交易时段或数据延迟
- 股票代码不在支持范围

建议:
- 稍后重试
- 使用 stock_quote_realtime 先确认标的可正常查询`
        }
        
        const formatAmount = (value: number) => {
          if (Math.abs(value) >= 100000000) {
            return `${(value / 100000000).toFixed(2)}亿`
          }
          return `${(value / 10000).toFixed(2)}万`
        }
        
        const formatSign = (value: number) => value >= 0 ? '+' : ''
        
        const marketLabel = market === MarketType.SH ? '沪A' : '深A'
        
        const result = `【资金流向 ${code}】${marketLabel}

主力净流入: ${formatSign(flow.mainNetInflow)}${formatAmount(flow.mainNetInflow)} (${formatSign(flow.mainNetInflowPercent)}${flow.mainNetInflowPercent.toFixed(2)}%)

详细分类:
  超大单: ${formatSign(flow.superLargeNetInflow)}${formatAmount(flow.superLargeNetInflow)}
  大单:   ${formatSign(flow.largeNetInflow)}${formatAmount(flow.largeNetInflow)}
  中单:   ${formatSign(flow.mediumNetInflow)}${formatAmount(flow.mediumNetInflow)}
  小单:   ${formatSign(flow.smallNetInflow)}${formatAmount(flow.smallNetInflow)}

说明:
- 正值表示净流入，负值表示净流出
- 超大单: 单笔成交额>100万
- 大单: 20万<单笔成交额≤100万
- 中单: 5万<单笔成交额≤20万
- 小单: 单笔成交额≤5万

更新时间: ${flow.time || 'N/A'}`
        
        return result
      } catch (error) {
        throw new Error(`获取资金流向失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_money_flow',
      description: `获取A股主力资金流向数据。
仅支持A股市场:
- 上海证券交易所 (6开头)
- 深圳证券交易所 (0/3开头)
返回主力净流入、超大单、大单、中单、小单等资金流向数据。`,
      schema: z.object({
        code: z.string().describe('A股股票代码，如: 600519, 000001')
      })
    }
  )
}
