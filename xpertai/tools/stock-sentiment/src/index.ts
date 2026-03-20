/**
 * 股票情绪分析工具集插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockSentimentPlugin } from './lib/stock-sentiment.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['sina', 'eastmoney', 'tushare']).optional().default('sina'),
  scoreRange: z.tuple([z.number(), z.number()]).optional().default([0, 100]),
  newsWeight: z.number().min(0).max(1).optional().default(0.4),
  priceWeight: z.number().min(0).max(1).optional().default(0.3),
  volumeWeight: z.number().min(0).max(1).optional().default(0.3)
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
    displayName: 'Stock Sentiment',
    description: 'Stock sentiment analysis and scoring for A-shares and Hong Kong stocks',
    keywords: ['stock', 'sentiment', 'analysis', 'scoring', 'A股', '港股', '情绪分析', '舆情'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-sentiment plugin')
    return { module: StockSentimentPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-sentiment plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-sentiment plugin stopped')
  },
}

export default plugin