/**
 * 股票基本面工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildFundamentalsTool } from './tools/fundamentals.tool.js'
import { buildValuationSnapshotTool } from './tools/valuation-snapshot.tool.js'

export class StockFundamentalsToolset extends BuiltinToolset {
  // Keep compatibility with different SDK implementations.
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 东方财富API无需凭证，免费使用
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildFundamentalsTool(),
      buildValuationSnapshotTool(),
    ]
    return this.tools
  }
}
