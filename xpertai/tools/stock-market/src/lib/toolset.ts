/**
 * 股票行情工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildQuoteRealtimeTool } from './tools/quote-realtime.tool.js'
import { buildKlineHistoryTool } from './tools/kline-history.tool.js'
import { buildTechnicalIndicatorsTool } from './tools/technical-indicators.tool.js'
import { buildBasicInfoTool } from './tools/basic-info.tool.js'
import { buildUSSearchTool } from './tools/us-stock-search.tool.js'
import { buildMoneyFlowTool } from './tools/money-flow.tool.js'

export class StockMarketToolset extends BuiltinToolset {
  // Keep compatibility with different SDK implementations.
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 新浪财经API无需凭证，免费使用
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildQuoteRealtimeTool(),
      buildKlineHistoryTool(),
      buildTechnicalIndicatorsTool(),
      buildBasicInfoTool(),
      buildUSSearchTool(),
      buildMoneyFlowTool(),
    ]
    return this.tools
  }
}
