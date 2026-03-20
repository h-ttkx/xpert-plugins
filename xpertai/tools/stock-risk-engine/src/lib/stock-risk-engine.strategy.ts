import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockRiskEngineProvider, icon } from './types.js'
import { StockRiskEngineToolset } from './toolset.js'
import { buildOrderRiskCheckTool } from './tools/order-risk-check.tool.js'
import { buildPortfolioRiskCheckTool } from './tools/portfolio-risk-check.tool.js'

@Injectable()
@ToolsetStrategy(StockRiskEngineProvider)
export class StockRiskEngineStrategy implements IToolsetStrategy<any> {
  meta = {
    author: 'Xpert AI',
    tags: ['risk', 'portfolio', 'VaR', '风控', '仓位'],
    name: StockRiskEngineProvider,
    label: {
      en_US: 'Stock Risk Engine',
      zh_Hans: '股票风险引擎'
    },
    description: {
      en_US: 'Risk checks for portfolio and orders, including concentration, leverage, volatility, and VaR constraints.',
      zh_Hans: '组合与订单风险检查工具，覆盖集中度、杠杆、波动率和VaR约束。'
    },
    icon: {
      type: 'svg' as const,
      value: icon
    },
    configSchema: {
      type: 'object',
      properties: {
        defaultMaxSingleWeight: {
          type: 'number',
          default: 0.2,
          'x-ui': { component: 'input', label: 'Max Single Weight' }
        },
        defaultMaxIndustryWeight: {
          type: 'number',
          default: 0.35,
          'x-ui': { component: 'input', label: 'Max Industry Weight' }
        },
        defaultMaxLeverage: {
          type: 'number',
          default: 1,
          'x-ui': { component: 'input', label: 'Max Leverage' }
        },
        defaultMaxVarRatio: {
          type: 'number',
          default: 0.03,
          'x-ui': { component: 'input', label: 'Max VaR Ratio' }
        }
      },
      required: []
    }
  }

  validateConfig(config: any): Promise<void> {
    return Promise.resolve()
  }

  async create(config: any): Promise<BuiltinToolset> {
    return new StockRiskEngineToolset(config)
  }

  createTools() {
    return [
      buildPortfolioRiskCheckTool(),
      buildOrderRiskCheckTool()
    ]
  }
}
