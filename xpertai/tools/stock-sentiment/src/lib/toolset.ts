/**
 * 股票情绪分析工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildSentimentSummaryTool } from './tools/sentiment-summary.tool.js'
import { buildSentimentScoreTool } from './tools/sentiment-score.tool.js'

export class StockSentimentToolset extends BuiltinToolset {
  // Keep compatibility with different SDK implementations.
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 情绪分析API无需凭证，免费使用
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildSentimentSummaryTool(),
      buildSentimentScoreTool(),
    ]
    return this.tools
  }
}
