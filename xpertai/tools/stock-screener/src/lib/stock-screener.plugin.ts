/**
 * 股票筛选插件模块
 */

import chalk from 'chalk'
import { XpertServerPlugin, IOnPluginBootstrap, IOnPluginDestroy } from '@xpert-ai/plugin-sdk'
import { ConfigModule } from '@nestjs/config'
import { StockScreenerStrategy } from './stock-screener.strategy.js'

@XpertServerPlugin({
  imports: [ConfigModule],
  entities: [],
  providers: [StockScreenerStrategy]
})
export class StockScreenerPlugin implements IOnPluginBootstrap, IOnPluginDestroy {
  private logEnabled = true

  onPluginBootstrap(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockScreenerPlugin.name} is being bootstrapped...`))
    }
  }

  onPluginDestroy(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${StockScreenerPlugin.name} is being destroyed...`))
    }
  }
}