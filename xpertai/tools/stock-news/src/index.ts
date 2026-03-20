/**
 * 股票新闻工具集插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockNewsPlugin } from './lib/stock-news.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['sina', 'eastmoney', 'tencent']).optional().default('sina'),
  maxItems: z.number().optional().default(20),
  timeWindow: z.number().optional().default(7)
})

const plugin: XpertPlugin<z.infer<typeof ConfigSchema>> = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    category: 'tools',
    icon: {
      type: 'image',
      value: icon
    },
    displayName: 'Stock News',
    description: 'Stock news, announcements and news timeline for A-shares and Hong Kong stocks',
    keywords: ['stock', 'news', 'announcement', 'timeline', 'A股', '港股', '新闻', '公告'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-news plugin')
    return { module: StockNewsPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-news plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-news plugin stopped')
  },
}

export default plugin