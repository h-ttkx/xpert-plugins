/**
 * 股票新闻工具 - 获取最新新闻
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { NewsClient } from '../news-client.js'

export function buildNewsLatestTool() {
  const client = new NewsClient()

  return new DynamicStructuredTool({
    name: 'stock_news_latest',
    description: '获取股票最新新闻，支持A股和港股。返回新闻标题、摘要、来源、发布时间等信息。',
    schema: z.object({
      codes: z.array(z.string()).describe('股票代码列表，如 ["600519", "000001"]'),
      maxItems: z.number().optional().default(20).describe('最大返回条数，默认20'),
      timeWindow: z.number().optional().default(7).describe('时间窗口（天），默认7')
    }),
    func: async ({ codes, maxItems = 20, timeWindow = 7 }) => {
      const results = await Promise.all(
        codes.map(async (code) => {
          const news = await client.fetchLatestNews(code, maxItems, timeWindow)
          return { code, news }
        })
      )

      const output = results
        .map((r) => {
          if (r.news.length === 0) {
            return `【${r.code}】暂无新闻数据`
          }
          
          const newsText = r.news
            .slice(0, maxItems)
            .map((n, i) => {
              const sentiment = n.sentiment === 'positive' ? '🟢' : n.sentiment === 'negative' ? '🔴' : '⚪'
              return `${i + 1}. [${n.publishTime}] ${n.title}\n   来源: ${n.source} ${sentiment}\n   ${n.summary ? `摘要: ${n.summary.slice(0, 100)}...` : ''}`
            })
            .join('\n\n')
          
          return `【${r.code}】最新新闻 (${r.news.length}条):\n\n${newsText}`
        })
        .join('\n\n---\n\n')

      return output || '未获取到任何新闻数据'
    }
  })
}
