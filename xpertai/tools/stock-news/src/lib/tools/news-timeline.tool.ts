/**
 * 新闻时间线工具 - 按时间线展示新闻
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { NewsClient } from '../news-client.js'

export function buildNewsTimelineTool() {
  const client = new NewsClient()

  return new DynamicStructuredTool({
    name: 'stock_news_timeline',
    description: '获取股票新闻时间线，按日期分组展示新闻。支持A股和港股。',
    schema: z.object({
      code: z.string().describe('股票代码，如 600519'),
      startDate: z.string().optional().describe('开始日期，格式 YYYY-MM-DD'),
      endDate: z.string().optional().describe('结束日期，格式 YYYY-MM-DD')
    }),
    func: async ({ code, startDate, endDate }) => {
      const timeline = await client.fetchNewsTimeline(code, startDate, endDate)

      if (timeline.length === 0) {
        return `【${code}】暂无新闻时间线数据`
      }

      const output = timeline
        .map((day) => {
          const newsText = day.news
            .slice(0, 5)
            .map((n, i) => {
              const sentiment = n.sentiment === 'positive' ? '🟢' : n.sentiment === 'negative' ? '🔴' : '⚪'
              return `${i + 1}. ${n.title} ${sentiment}\n   来源: ${n.source} | ${n.publishTime.split(' ')[1] || ''}`
            })
            .join('\n')
          
          return `📅 ${day.date} (${day.news.length}条)\n\n${newsText}`
        })
        .join('\n\n---\n\n')

      return `【${code}】新闻时间线:\n\n${output}`
    }
  })
}