import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { StockBacktestSimPlugin } from './lib/stock-backtest-sim.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({
  defaultFeeRate: z.number().min(0).max(0.01).optional().default(0.0005),
  defaultSlippageRate: z.number().min(0).max(0.01).optional().default(0.0005),
  defaultRebalanceDays: z.number().int().min(1).max(60).optional().default(5)
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
    displayName: 'Stock Backtest & Simulation',
    description: 'Run historical backtests and scenario stress simulation for stock strategies',
    keywords: ['backtest', 'simulation', 'stress test', '回测', '仿真'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register stock-backtest-sim plugin')
    return { module: StockBacktestSimPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('stock-backtest-sim plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('stock-backtest-sim plugin stopped')
  },
}

export default plugin
