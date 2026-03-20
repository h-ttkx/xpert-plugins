/**
 * 新浪财经股票工具集插件入口
 */

import type { XpertPlugin } from '@xpert-ai/plugin-sdk'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { z } from 'zod'
import { SinaStockPlugin } from './lib/sina-stock.plugin.js'
import { icon } from './lib/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as {
  name: string
  version: string
}

const ConfigSchema = z.object({})

const plugin: XpertPlugin<z.infer<typeof ConfigSchema>> = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    category: 'tools',
    icon: {
      type: 'image',
      value: icon
    },
    displayName: 'Sina Stock',
    description: 'Real-time stock quotes for A-shares and Hong Kong stocks via Sina Finance API',
    keywords: ['stock', 'finance', 'quotes', 'sina', 'A股', '港股'],
    author: 'XpertAI Team',
  },
  config: {
    schema: ConfigSchema,
  },
  register(ctx) {
    ctx.logger.log('register sina-stock plugin')
    return { module: SinaStockPlugin, global: true }
  },
  async onStart(ctx) {
    ctx.logger.log('sina-stock plugin started')
  },
  async onStop(ctx) {
    ctx.logger.log('sina-stock plugin stopped')
  },
}

export default plugin