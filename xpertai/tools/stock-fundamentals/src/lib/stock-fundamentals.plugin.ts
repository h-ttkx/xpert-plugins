/**
 * 股票基本面插件模块
 */

import chalk from 'chalk'
import { XpertServerPlugin, IOnPluginBootstrap, IOnPluginDestroy } from '@xpert-ai/plugin-sdk'
import { ConfigModule } from '@nestjs/config'
import { StockFundamentalsStrategy } from './stock-fundamentals.strategy.js'

@XpertServerPlugin({
  imports: [ConfigModule],
  entities: [],
  providers: [StockFundamentalsStrategy]
})
export class StockFundamentalsPlugin implements IOnPluginBootstrap, IOnPluginDestroy {
  private logEnabled = true

  onPluginBootstrap(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockFundamentalsPlugin.name} is being bootstrapped...`))
    }
  }

  onPluginDestroy(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockFundamentalsPlugin.name} is being destroyed...`))
    }
  }
}
