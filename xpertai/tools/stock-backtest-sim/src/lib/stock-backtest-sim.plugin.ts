import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockBacktestSimStrategy } from './stock-backtest-sim.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockBacktestSimStrategy],
  controllers: [],
  entities: []
})
export class StockBacktestSimPlugin {}
