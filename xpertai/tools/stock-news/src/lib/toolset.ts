/**
 * 股票新闻工具集
 */

import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildNewsLatestTool } from './tools/news-latest.tool.js'
import { buildAnnouncementsTool } from './tools/announcements.tool.js'
import { buildNewsTimelineTool } from './tools/news-timeline.tool.js'

export class StockNewsToolset extends BuiltinToolset {
  // Keep compatibility with different SDK implementations.
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 新闻API无需凭证，免费使用
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildNewsLatestTool(),
      buildAnnouncementsTool(),
      buildNewsTimelineTool(),
    ]
    return this.tools
  }
}
