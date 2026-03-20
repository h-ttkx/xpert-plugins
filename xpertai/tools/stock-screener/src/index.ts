/**
 * 股票筛选插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockScreenerPlugin } from './lib/stock-screener.plugin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['eastmoney', 'tushare']).optional().default('eastmoney'),
  maxItems: z.number().min(1).max(500).optional().default(50),
  timeout: z.number().min(1000).max(30000).optional().default(5000)
})

const plugin: XpertPlugin<z.infer<typeof ConfigSchema>> = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    category: 'tools',
    icon: {
      type: 'svg',
      value: 'screener'
    },
    displayName: 'Stock Screener',
    description: 'Stock screening toolset for filtering stocks by market cap, industry, and financial/technical metrics',
    keywords: ['stock', 'screener', 'filter', 'selection', '股票筛选'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-screener plugin')
    return { module: StockScreenerPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-screener plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-screener plugin stopped')
  },
}

export default plugin