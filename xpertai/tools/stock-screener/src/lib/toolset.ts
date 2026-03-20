/**
 * 股票筛选工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { ScreenerClient } from './screener-client.js'
import { buildScreenByMarketCapTool } from './tools/screen-by-market-cap.tool.js'
import { buildScreenByIndustryTool } from './tools/screen-by-industry.tool.js'
import { buildScreenByMetricsTool } from './tools/screen-by-metrics.tool.js'
import { ScreenerConfigSchema } from './types.js'

function readRuntimeConfig(config: any) {
  const credentials = config?.credentials ?? {}
  const options = config?.options ?? {}
  return ScreenerConfigSchema.parse({
    source: credentials.source ?? options.source ?? config?.source,
    maxItems: credentials.maxItems ?? options.maxItems ?? config?.maxItems,
    timeout: credentials.timeout ?? options.timeout ?? config?.timeout
  })
}

export class StockScreenerToolset extends BuiltinToolset {
  private client: ScreenerClient

  constructor(config: any) {
    super(config)
    const runtimeConfig = readRuntimeConfig(config)
    this.client = new ScreenerClient({
      timeout: runtimeConfig.timeout,
      dataSource: runtimeConfig.source
    })
  }

  // Keep compatibility with different SDK implementations.
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 东方财富API无需凭证，免费使用
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildScreenByMarketCapTool(this.client),
      buildScreenByIndustryTool(this.client),
      buildScreenByMetricsTool(this.client)
    ]
    return this.tools
  }
}
