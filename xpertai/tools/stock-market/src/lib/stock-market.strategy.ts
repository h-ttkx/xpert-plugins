/**
 * 股票行情工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockMarketProvider, icon } from './types.js'
import { StockMarketToolset } from './toolset.js'
import { buildQuoteRealtimeTool } from './tools/quote-realtime.tool.js'
import { buildKlineHistoryTool } from './tools/kline-history.tool.js'
import { buildTechnicalIndicatorsTool } from './tools/technical-indicators.tool.js'
import { buildBasicInfoTool } from './tools/basic-info.tool.js'
import { buildUSSearchTool } from './tools/us-stock-search.tool.js'
import { buildMoneyFlowTool } from './tools/money-flow.tool.js'

@Injectable()
@ToolsetStrategy(StockMarketProvider)
export class StockMarketStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'market', 'quotes', 'kline', 'technical', 'A股', '港股', '美股'],
    name: StockMarketProvider,
    label: {
      en_US: 'Stock Market',
      zh_Hans: '股票行情'
    },
    description: {
      en_US: 'Comprehensive stock market data including real-time quotes, K-line charts, technical indicators for A-shares, Hong Kong, and US markets. Free for basic usage.',
      zh_Hans: '全面的股票行情数据，包括实时报价、K线图表、技术指标，支持A股、港股、美股市场。基础功能免费使用。'
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
          enum: ['sina', 'tencent'],
          default: 'sina',
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
          default: 300,
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
    return new StockMarketToolset(config)
  }

  createTools() {
    return [
      buildQuoteRealtimeTool(),
      buildKlineHistoryTool(),
      buildTechnicalIndicatorsTool(),
      buildBasicInfoTool(),
      buildUSSearchTool(),
      buildMoneyFlowTool(),
    ]
  }
}
