/**
 * 股票基本面工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockFundamentalsProvider, icon } from './types.js'
import { StockFundamentalsToolset } from './toolset.js'
import { buildFundamentalsTool } from './tools/fundamentals.tool.js'
import { buildValuationSnapshotTool } from './tools/valuation-snapshot.tool.js'

@Injectable()
@ToolsetStrategy(StockFundamentalsProvider)
export class StockFundamentalsStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'fundamentals', 'valuation', 'financial', 'PE', 'PB', 'ROE', 'A股', '港股'],
    name: StockFundamentalsProvider,
    label: {
      en_US: 'Stock Fundamentals',
      zh_Hans: '股票基本面'
    },
    description: {
      en_US: 'Comprehensive stock fundamentals data including valuation metrics (PE/PB/PS), financial statements, key ratios (ROE/ROA), and dividend information for A-shares and Hong Kong stocks. Essential for fundamental analysis.',
      zh_Hans: '全面的股票基本面数据，包括估值指标（PE/PB/PS）、财务报表、关键财务比率（ROE/ROA）和股息信息，支持A股和港股市场。基本面分析必备工具。'
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
            placeholder: 'Select data source for fundamentals'
          }
        },
        timeout: {
          type: 'number',
          default: 10000,
          'x-ui': {
            component: 'input',
            label: 'Timeout (ms)',
            placeholder: 'Request timeout in milliseconds'
          }
        },
        cacheEnabled: {
          type: 'boolean',
          default: true,
          'x-ui': {
            component: 'switch',
            label: 'Enable Cache'
          }
        },
        cacheTTL: {
          type: 'number',
          default: 3600,
          'x-ui': {
            component: 'input',
            label: 'Cache TTL (seconds)',
            placeholder: 'Cache time-to-live in seconds'
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
    return new StockFundamentalsToolset(config)
  }

  createTools() {
    return [
      buildFundamentalsTool(),
      buildValuationSnapshotTool(),
    ]
  }
}
