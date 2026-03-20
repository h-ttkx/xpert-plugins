/**
 * 股票情绪分析工具集 NestJS 模块
 */

import { Module } from '@nestjs/common'
import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockSentimentStrategy } from './stock-sentiment.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockSentimentStrategy],
  controllers: [],
  entities: []
})
export class StockSentimentPlugin {}