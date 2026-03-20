import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockBacktestSimProvider, icon } from './types.js'
import { StockBacktestSimToolset } from './toolset.js'
import { buildBacktestMomentumTool } from './tools/backtest-momentum.tool.js'
import { buildBacktestMomentumAutoTool } from './tools/backtest-momentum-auto.tool.js'
import { buildStressTestTool } from './tools/stress-test.tool.js'

@Injectable()
@ToolsetStrategy(StockBacktestSimProvider)
export class StockBacktestSimStrategy implements IToolsetStrategy<any> {
  meta = {
    author: 'Xpert AI',
    tags: ['backtest', 'simulation', 'stress', '回测', '仿真'],
    name: StockBacktestSimProvider,
    label: {
      en_US: 'Stock Backtest & Simulation',
      zh_Hans: '股票回测与仿真'
    },
    description: {
      en_US: 'Run historical momentum backtests and portfolio stress simulations.',
      zh_Hans: '执行历史动量回测与组合压力测试仿真。'
    },
    icon: {
      type: 'svg' as const,
      value: icon
    },
    configSchema: {
      type: 'object',
      properties: {
        defaultFeeRate: {
          type: 'number',
          default: 0.0005,
          'x-ui': { component: 'input', label: 'Default Fee Rate' }
        },
        defaultSlippageRate: {
          type: 'number',
          default: 0.0005,
          'x-ui': { component: 'input', label: 'Default Slippage Rate' }
        },
        defaultRebalanceDays: {
          type: 'number',
          default: 5,
          'x-ui': { component: 'input', label: 'Default Rebalance Days' }
        }
      },
      required: []
    }
  }

  validateConfig(config: any): Promise<void> {
    return Promise.resolve()
  }

  async create(config: any): Promise<BuiltinToolset> {
    return new StockBacktestSimToolset(config)
  }

  createTools() {
    return [
      buildBacktestMomentumTool(),
      buildBacktestMomentumAutoTool(),
      buildStressTestTool()
    ]
  }
}
