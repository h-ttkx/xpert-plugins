import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockPortfolioConstructorPlugin } from './lib/stock-portfolio-constructor.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  maxSingleWeight: z.number().min(0.01).max(1).optional().default(0.2),
  maxIndustryWeight: z.number().min(0.01).max(1).optional().default(0.35),
  maxPositions: z.number().int().min(1).max(100).optional().default(10)
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
    displayName: 'Stock Portfolio Constructor',
    description: 'Build target portfolio weights from research signals and produce rebalance plans',
    keywords: ['portfolio', 'rebalance', 'weights', 'allocation', '组合构建', '调仓'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-portfolio-constructor plugin')
    return { module: StockPortfolioConstructorPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-portfolio-constructor plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-portfolio-constructor plugin stopped')
  },
}

export default plugin
