/**
 * 行业板块工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildSectorConstituentsTool } from './tools/sector-constituents.tool.js'
import { buildSectorQuotesTool } from './tools/sector-quotes.tool.js'
import { buildSectorRankingTool } from './tools/sector-ranking.tool.js'
import { SectorConfigSchema } from './types.js'

function readRuntimeConfig(config: any) {
  const credentials = config?.credentials ?? {}
  const options = config?.options ?? {}
  const parsed = SectorConfigSchema.parse({
    source: credentials.source ?? options.source ?? config?.source,
    timeout: credentials.timeout ?? options.timeout ?? config?.timeout
  })
  return {
    source: parsed.source ?? 'eastmoney',
    timeout: parsed.timeout ?? 5000
  }
}

export class StockSectorToolset extends BuiltinToolset {
  private readonly runtimeConfig: { source: 'eastmoney' | 'sina'; timeout: number }

  constructor(config: any) {
    super(config)
    this.runtimeConfig = readRuntimeConfig(config)
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
      buildSectorQuotesTool(this.runtimeConfig),
      buildSectorConstituentsTool(this.runtimeConfig),
      buildSectorRankingTool(this.runtimeConfig)
    ]
    return this.tools
  }
}
