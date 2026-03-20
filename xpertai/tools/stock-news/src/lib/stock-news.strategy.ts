/**
 * 股票新闻工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { StockNewsProvider, icon } from './types.js'
import { StockNewsToolset } from './toolset.js'
import { buildNewsLatestTool } from './tools/news-latest.tool.js'
import { buildAnnouncementsTool } from './tools/announcements.tool.js'
import { buildNewsTimelineTool } from './tools/news-timeline.tool.js'

@Injectable()
@ToolsetStrategy(StockNewsProvider)
export class StockNewsStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'news', 'announcement', 'timeline', 'A股', '港股', '新闻', '公告'],
    name: StockNewsProvider,
    label: {
      en_US: 'Stock News',
      zh_Hans: '股票新闻'
    },
    description: {
      en_US: 'Stock news, announcements and news timeline for A-shares and Hong Kong stocks. Includes source deduplication and publish time normalization.',
      zh_Hans: '股票新闻、公告和新闻时间线，支持A股和港股。包括来源去重和发布时间标准化。'
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
          enum: ['sina', 'eastmoney', 'tencent'],
          default: 'sina',
          'x-ui': {
            component: 'select',
            label: 'News Source',
            placeholder: 'Select news source'
          }
        },
        maxItems: {
          type: 'number',
          default: 20,
          'x-ui': {
            component: 'input',
            label: 'Max Items',
            placeholder: 'Maximum number of news items to return'
          }
        },
        timeWindow: {
          type: 'number',
          default: 7,
          'x-ui': {
            component: 'input',
            label: 'Time Window (days)',
            placeholder: 'News time window in days'
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
    return new StockNewsToolset(config)
  }

  createTools() {
    return [
      buildNewsLatestTool(),
      buildAnnouncementsTool(),
      buildNewsTimelineTool(),
    ]
  }
}