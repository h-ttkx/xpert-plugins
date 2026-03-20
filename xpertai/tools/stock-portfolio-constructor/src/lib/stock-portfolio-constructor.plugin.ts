import { XpertServerPlugin } from '@xpert-ai/plugin-sdk'
import { StockPortfolioConstructorStrategy } from './stock-portfolio-constructor.strategy.js'

@XpertServerPlugin({
  imports: [],
  providers: [StockPortfolioConstructorStrategy],
  controllers: [],
  entities: []
})
export class StockPortfolioConstructorPlugin {}
