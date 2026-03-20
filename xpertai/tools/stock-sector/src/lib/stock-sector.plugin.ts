/**
 * 行业板块NestJS模块
 */

import { Module } from '@nestjs/common'
import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockSectorStrategy } from './stock-sector.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockSectorStrategy],
  controllers: [],
  entities: []
})
export class StockSectorPlugin {}