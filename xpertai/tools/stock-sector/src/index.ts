/**
 * 行业板块插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockSectorPlugin } from './lib/stock-sector.plugin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  source: z.enum(['eastmoney', 'sina']).optional().default('eastmoney'),
  timeout: z.number().min(1000).max(30000).optional().default(5000)
})

const plugin: XpertPlugin<z.infer<typeof ConfigSchema>> = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    category: 'tools',
    icon: {
      type: 'svg',
      value: 'sector'
    },
    displayName: 'Stock Sector',
    description: 'Stock sector and industry toolset for sector quotes, constituents, and rankings',
    keywords: ['stock', 'sector', 'industry', 'concept', '板块', '行业'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-sector plugin')
    return { module: StockSectorPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-sector plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-sector plugin stopped')
  },
}

export default plugin