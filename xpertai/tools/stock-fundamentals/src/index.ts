/**
 * 股票基本面工具集插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockFundamentalsPlugin } from './lib/stock-fundamentals.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['eastmoney', 'sina']).optional().default('eastmoney'),
  timeout: z.number().optional().default(10000),
  cacheEnabled: z.boolean().optional().default(true),
  cacheTTL: z.number().optional().default(3600)
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
    displayName: 'Stock Fundamentals',
    description: 'Comprehensive stock fundamentals data including valuation metrics, financial statements, key ratios for A-shares and Hong Kong stocks',
    keywords: ['stock', 'fundamentals', 'valuation', 'financial', 'PE', 'PB', 'ROE', 'A股', '港股'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-fundamentals plugin')
    return { module: StockFundamentalsPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-fundamentals plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-fundamentals plugin stopped')
  },
}

export default plugin
