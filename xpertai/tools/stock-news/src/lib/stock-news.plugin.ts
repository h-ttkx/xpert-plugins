/**
 * 股票新闻工具集 NestJS 模块
 */

import { Module } from '@nestjs/common'
import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockNewsStrategy } from './stock-news.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockNewsStrategy],
  controllers: [],
  entities: []
})
export class StockNewsPlugin {}