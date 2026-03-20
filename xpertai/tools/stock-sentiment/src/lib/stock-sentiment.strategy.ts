/**
 * 股票情绪分析工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockSentimentProvider, icon } from './types.js'
import { StockSentimentToolset } from './toolset.js'
import { buildSentimentSummaryTool } from './tools/sentiment-summary.tool.js'
import { buildSentimentScoreTool } from './tools/sentiment-score.tool.js'

@Injectable()
@ToolsetStrategy(StockSentimentProvider)
export class StockSentimentStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'sentiment', 'analysis', 'A股', '港股', '情绪分析', '舆情'],
    name: StockSentimentProvider,
    label: {
      en_US: 'Stock Sentiment',
      zh_Hans: '股票情绪'
    },
    description: {
      en_US: 'Stock sentiment analysis and scoring for A-shares and Hong Kong stocks. Includes sentiment factors, trends, and risk warnings.',
      zh_Hans: '股票情绪分析和评分，支持A股和港股。包括情绪因子、趋势和风险提示。'
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
          enum: ['sina', 'eastmoney', 'tushare'],
          default: 'sina',
          'x-ui': {
            component: 'select',
            label: 'Data Source',
            placeholder: 'Select sentiment data source'
          }
        },
        scoreRange: {
          type: 'array',
          items: { type: 'number' },
          default: [0, 100],
          'x-ui': {
            component: 'input',
            label: 'Score Range',
            placeholder: 'Min and max score values'
          }
        },
        newsWeight: {
          type: 'number',
          default: 0.4,
          'x-ui': {
            component: 'input',
            label: 'News Weight',
            placeholder: 'Weight for news sentiment (0-1)'
          }
        },
        priceWeight: {
          type: 'number',
          default: 0.3,
          'x-ui': {
            component: 'input',
            label: 'Price Weight',
            placeholder: 'Weight for price sentiment (0-1)'
          }
        },
        volumeWeight: {
          type: 'number',
          default: 0.3,
          'x-ui': {
            component: 'input',
            label: 'Volume Weight',
            placeholder: 'Weight for volume sentiment (0-1)'
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
    return new StockSentimentToolset(config)
  }

  createTools() {
    return [
      buildSentimentSummaryTool(),
      buildSentimentScoreTool(),
    ]
  }
}