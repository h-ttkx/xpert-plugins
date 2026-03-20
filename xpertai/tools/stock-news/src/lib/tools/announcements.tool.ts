/**
 * 股票公告工具 - 获取公告列表
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { NewsClient } from '../news-client.js'

export function buildAnnouncementsTool() {
  const client = new NewsClient()

  return new DynamicStructuredTool({
    name: 'stock_announcements',
    description: '获取股票公告列表，仅支持A股。返回公告标题、类型、发布时间等信息。',
    schema: z.object({
      code: z.string().describe('股票代码，如 600519'),
      type: z.string().optional().describe('公告类型过滤，如 "业绩预告", "重大事项"'),
      maxItems: z.number().optional().default(10).describe('最大返回条数，默认10')
    }),
    func: async ({ code, type, maxItems = 10 }) => {
      let announcements = await client.fetchAnnouncements(code, maxItems * 2)
      
      if (type) {
        announcements = announcements.filter(a => a.type.includes(type))
      }

      if (announcements.length === 0) {
        return `【${code}】暂无公告数据或该股票代码不支持公告查询（仅支持A股）`
      }

      const output = announcements
        .slice(0, maxItems)
        .map((a, i) => {
          return `${i + 1}. [${a.publishTime}] [${a.type}] ${a.title}\n   ${a.summary ? `摘要: ${a.summary.slice(0, 100)}...` : ''}\n   ${a.url ? `链接: ${a.url}` : ''}`
        })
        .join('\n\n')

      return `【${code}】公告列表 (${announcements.length}条):\n\n${output}`
    }
  })
}