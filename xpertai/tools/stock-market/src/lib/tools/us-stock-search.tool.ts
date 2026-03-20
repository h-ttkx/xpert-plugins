/**
 * 美股搜索工具
 */

import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { searchStock } from '../market-client.js'

export function buildUSSearchTool() {
  return tool(
    async (input) => {
      try {
        const keyword = input.keyword.trim()
        
        if (!keyword) {
          throw new Error('请提供有效的搜索关键词')
        }
        
        const results = await searchStock(keyword)
        
        if (results.length === 0) {
          return `未找到匹配 "${keyword}" 的美股，请尝试其他关键词`
        }
        
        const lines: string[] = [`找到 ${results.length} 个匹配 "${keyword}" 的美股:\n`]
        
        for (const item of results) {
          const typeLabel = item.type === 'ETF' ? 'ETF' : '股票'
          lines.push(`【${item.code}】${item.name} (${typeLabel})`)
        }
        
        lines.push('\n提示: 使用股票代码查询实时行情，例如 AAPL, TSLA, GOOGL')
        
        return lines.join('\n')
      } catch (error) {
        throw new Error(`美股搜索失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_us_search',
      description: `搜索美股股票代码和名称。
支持搜索:
- 美股上市公司 (如 Apple, Tesla, Google)
- ETF基金 (如 SPY, QQQ)
输入公司名称或股票代码的一部分进行搜索。`,
      schema: z.object({
        keyword: z.string().describe('搜索关键词，可以是公司名称或股票代码，如: Apple, Tesla, AAPL')
      })
    }
  )
}