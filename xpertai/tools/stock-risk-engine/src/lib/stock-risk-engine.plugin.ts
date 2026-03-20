import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockRiskEngineStrategy } from './stock-risk-engine.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockRiskEngineStrategy],
  controllers: [],
  entities: []
})
export class StockRiskEnginePlugin {}
