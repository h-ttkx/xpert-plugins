/**
 * 新浪财经股票工具集
 */

import { StructuredToolInterface, ToolSchemaBase } from '@langchain/core/tools'
import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildStockQuotesTool, buildStockDetailTool } from './tools/stock-quotes.tool.js'

export class SinaStockToolset extends BuiltinToolset<StructuredToolInterface, Record<string, never>> {
  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // 新浪财经API无需凭证，免费使用
  }

  override async initTools(): Promise<StructuredToolInterface<ToolSchemaBase, any, any>[]> {
    this.tools = [
      buildStockQuotesTool(),
      buildStockDetailTool(),
    ]
    return this.tools
  }
}