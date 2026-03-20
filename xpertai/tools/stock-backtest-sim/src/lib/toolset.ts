import { BuiltinToolset } from '@xpert-ai/plugin-sdk'
import { buildBacktestMomentumTool } from './tools/backtest-momentum.tool.js'
import { buildBacktestMomentumAutoTool } from './tools/backtest-momentum-auto.tool.js'
import { buildStressTestTool } from './tools/stress-test.tool.js'

export class StockBacktestSimToolset extends BuiltinToolset {
  override async validateCredentials(credentials: Record<string, never>): Promise<void> {
    await this._validateCredentials(credentials)
  }

  override async _validateCredentials(credentials: Record<string, never>): Promise<void> {
    // Backtest engine uses provided time series, no credentials required.
  }

  override async initTools(): Promise<any[]> {
    this.tools = [
      buildBacktestMomentumTool(),
      buildBacktestMomentumAutoTool(),
      buildStressTestTool()
    ]
    return this.tools
  }
}
