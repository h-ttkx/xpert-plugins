import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildOrderRiskCheckTool } from './tools/order-risk-check.tool.js'
import { buildPortfolioRiskCheckTool } from './tools/portfolio-risk-check.tool.js'

export class StockRiskEngineToolset extends BuiltinToolset {
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // Risk engine uses deterministic local calculation; no credentials required.
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildPortfolioRiskCheckTool(),
      buildOrderRiskCheckTool()
    ]
    return this.tools
  }
}
