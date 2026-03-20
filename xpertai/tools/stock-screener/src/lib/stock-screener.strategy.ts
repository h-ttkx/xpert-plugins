/**
 * 股票筛选工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockScreenerProvider, icon } from './types.js'
import { StockScreenerToolset } from './toolset.js'
import { ScreenerClient } from './screener-client.js'
import { buildScreenByIndustryTool } from './tools/screen-by-industry.tool.js'
import { buildScreenByMarketCapTool } from './tools/screen-by-market-cap.tool.js'
import { buildScreenByMetricsTool } from './tools/screen-by-metrics.tool.js'

@Injectable()
@ToolsetStrategy(StockScreenerProvider)
export class StockScreenerStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'screener', 'filter', 'selection', '股票筛选'],
    name: StockScreenerProvider,
    label: {
      en_US: 'Stock Screener',
      zh_Hans: '股票筛选'
    },
    description: {
      en_US: 'Stock screening toolset for filtering stocks by market cap, industry, and financial/technical metrics',
      zh_Hans: '股票筛选工具集，支持按市值、行业、财务指标和技术指标筛选股票'
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
          enum: ['eastmoney', 'tushare'],
          default: 'eastmoney',
          'x-ui': {
            component: 'select',
            label: 'Data Source',
            placeholder: 'Select data source'
          }
        },
        maxItems: {
          type: 'number',
          default: 50,
          minimum: 1,
          maximum: 500,
          'x-ui': {
            component: 'input',
            label: 'Max Items',
            placeholder: 'Maximum number of results'
          }
        },
        timeout: {
          type: 'number',
          default: 5000,
          minimum: 1000,
          maximum: 30000,
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
    return new StockScreenerToolset(config)
  }

  createTools() {
    const client = new ScreenerClient({
      dataSource: 'eastmoney',
      timeout: 5000
    })

    return [
      buildScreenByMarketCapTool(client),
      buildScreenByIndustryTool(client),
      buildScreenByMetricsTool(client)
    ]
  }
}
