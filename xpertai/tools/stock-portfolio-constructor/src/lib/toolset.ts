import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildPortfolioBuildTargetTool } from './tools/portfolio-build-target.tool.js'
import { buildPortfolioRebalancePlanTool } from './tools/portfolio-rebalance-plan.tool.js'

export class StockPortfolioConstructorToolset extends BuiltinToolset {
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // Portfolio constructor runs deterministic local calculations.
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildPortfolioBuildTargetTool(),
      buildPortfolioRebalancePlanTool()
    ]
    return this.tools
  }
}
