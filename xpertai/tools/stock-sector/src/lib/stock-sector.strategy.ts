/**
 * 行业板块工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockSectorProvider, icon } from './types.js'
import { StockSectorToolset } from './toolset.js'
import { buildSectorQuotesTool } from './tools/sector-quotes.tool.js'
import { buildSectorConstituentsTool } from './tools/sector-constituents.tool.js'
import { buildSectorRankingTool } from './tools/sector-ranking.tool.js'

@Injectable()
@ToolsetStrategy(StockSectorProvider)
export class StockSectorStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'sector', 'industry', 'concept', '板块', '行业'],
    name: StockSectorProvider,
    label: {
      en_US: 'Stock Sector',
      zh_Hans: '行业板块'
    },
    description: {
      en_US: 'Stock sector and industry toolset for sector quotes, constituents, and rankings',
      zh_Hans: '行业板块工具集，提供板块行情、成分股、排名等功能'
    },
    icon: {
      type: 'svg' as const,
      value: icon
    },
    configSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['eastmoney', 'sina'],
          default: 'eastmoney',
          'x-ui': {
            component: 'select',
            label: 'Data Source',
            placeholder: 'Select data source'
          }
        },
        timeout: {
          type: 'number',
          default: 5000,
          'x-ui': {
            component: 'input',
            label: 'Timeout (ms)',
            placeholder: 'Request timeout in milliseconds'
          }
        }
      },
      required: []
    }
  }

  validateConfig(config: any): Promise<void> {
    return Promise.resolve()
  }

  async create(config: any): Promise<BuiltinToolset> {
    return new StockSectorToolset(config)
  }

  createTools() {
    return [
      buildSectorQuotesTool(),
      buildSectorConstituentsTool(),
      buildSectorRankingTool()
    ]
  }
}