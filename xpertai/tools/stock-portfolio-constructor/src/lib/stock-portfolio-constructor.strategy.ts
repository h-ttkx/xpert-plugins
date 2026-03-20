import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockPortfolioConstructorProvider, icon } from './types.js'
import { StockPortfolioConstructorToolset } from './toolset.js'
import { buildPortfolioBuildTargetTool } from './tools/portfolio-build-target.tool.js'
import { buildPortfolioRebalancePlanTool } from './tools/portfolio-rebalance-plan.tool.js'

@Injectable()
@ToolsetStrategy(StockPortfolioConstructorProvider)
export class StockPortfolioConstructorStrategy implements IToolsetStrategy<any> {
  meta = {
    author: 'Xpert AI',
    tags: ['portfolio', 'rebalance', 'allocation', '组合构建', '调仓'],
    name: StockPortfolioConstructorProvider,
    label: {
      en_US: 'Stock Portfolio Constructor',
      zh_Hans: '股票组合构建'
    },
    description: {
      en_US: 'Build target portfolio weights from research signals and generate rebalance plans.',
      zh_Hans: '根据研究信号构建目标组合权重并生成调仓计划。'
    },
    icon: {
      type: 'svg' as const,
      value: icon
    },
    configSchema: {
      type: 'object',
      properties: {
        maxSingleWeight: {
          type: 'number',
          default: 0.2,
          'x-ui': { component: 'input', label: 'Max Single Weight' }
        },
        maxIndustryWeight: {
          type: 'number',
          default: 0.35,
          'x-ui': { component: 'input', label: 'Max Industry Weight' }
        },
        maxPositions: {
          type: 'number',
          default: 10,
          'x-ui': { component: 'input', label: 'Max Positions' }
        }
      },
      required: []
    }
  }

  validateConfig(config: any): Promise<void> {
    return Promise.resolve()
  }

  async create(config: any): Promise<BuiltinToolset> {
    return new StockPortfolioConstructorToolset(config)
  }

  createTools() {
    return [
      buildPortfolioBuildTargetTool(),
      buildPortfolioRebalancePlanTool()
    ]
  }
}
