/**
 * 股票行情工具集插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockMarketPlugin } from './lib/stock-market.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['sina', 'tencent']).optional().default('sina'),
  timeout: z.number().optional().default(5000),
  cacheEnabled: z.boolean().optional().default(true),
  cacheTTL: z.number().optional().default(300)
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
    displayName: 'Stock Market',
    description: 'Comprehensive stock market data including real-time quotes, K-line charts, technical indicators, and stock search for A-shares, Hong Kong, and US markets',
    keywords: ['stock', 'market', 'quotes', 'kline', 'technical', 'A股', '港股', '美股'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-market plugin')
    return { module: StockMarketPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-market plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-market plugin stopped')
  },
}

export default plugin