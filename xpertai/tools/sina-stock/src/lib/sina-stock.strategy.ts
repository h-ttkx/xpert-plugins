/**
 * 新浪财经股票工具集策略
 */

import { Injectable } from '@nestjs/common'
import { BuiltinToolset, IToolsetStrategy, ToolsetStrategy } from '@xpert-ai/plugin-sdk'
import { SinaStock, icon } from './types.js'
import { SinaStockToolset } from './toolset.js'
import { buildStockQuotesTool, buildStockDetailTool } from './tools/stock-quotes.tool.js'

@Injectable()
@ToolsetStrategy(SinaStock)
export class SinaStockStrategy implements IToolsetStrategy<any> {

  meta = {
    author: 'Xpert AI',
    tags: ['stock', 'finance', 'quotes', 'sina', 'A股', '港股'],
    name: SinaStock,
    label: {
      en_US: 'Sina Stock',
      zh_Hans: '新浪财经股票'
    },
    description: {
      en_US: 'Real-time stock quotes for A-shares and Hong Kong stocks via Sina Finance API. Free, no API key required.',
      zh_Hans: '通过新浪财经API获取A股和港股实时行情。免费使用，无需API密钥。'
    },
    icon: {
      type: 'svg' as const,
      value: icon
    },
    configSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }

  validateConfig(config: any): Promise<void> {
    return Promise.resolve()
  }

  async create(config: any): Promise<BuiltinToolset> {
    return new SinaStockToolset(config)
  }

  createTools() {
    return [
      buildStockQuotesTool(),
      buildStockDetailTool()
    ]
  }
}