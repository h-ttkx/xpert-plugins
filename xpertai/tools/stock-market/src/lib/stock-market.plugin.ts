/**
 * 股票行情插件模块
 */

import chalk from 'chalk'
import { XpertServerPlugin, IOnPluginBootstrap, IOnPluginDestroy } from '@xpert-ai/plugin-sdk'
import { ConfigModule } from '@nestjs/config'
import { StockMarketStrategy } from './stock-market.strategy.js'

@XpertServerPlugin({
  imports: [ConfigModule],
  entities: [],
  providers: [StockMarketStrategy]
})
export class StockMarketPlugin implements IOnPluginBootstrap, IOnPluginDestroy {
  private logEnabled = true

  onPluginBootstrap(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockMarketPlugin.name} is being bootstrapped...`))
    }
  }

  onPluginDestroy(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockMarketPlugin.name} is being destroyed...`))
    }
  }
}