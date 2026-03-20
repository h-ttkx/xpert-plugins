import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockRiskEnginePlugin } from './lib/stock-risk-engine.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  defaultMaxSingleWeight: z.number().min(0.01).max(1).optional().default(0.2),
  defaultMaxIndustryWeight: z.number().min(0.01).max(1).optional().default(0.35),
  defaultMaxLeverage: z.number().min(0.1).max(5).optional().default(1),
  defaultMaxVarRatio: z.number().min(0.001).max(0.2).optional().default(0.03)
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
    displayName: 'Stock Risk Engine',
    description: 'Risk checks for portfolio and orders, including concentration, leverage, volatility, and VaR constraints',
    keywords: ['risk', 'portfolio', 'VaR', 'position limit', '风控', '组合风险'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-risk-engine plugin')
    return { module: StockRiskEnginePlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-risk-engine plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-risk-engine plugin stopped')
  },
}

export default plugin
