/**
 * 新浪财经股票插件模块
 */

import chalk from 'chalk'
import { XpertServerPlugin, IOnPluginBootstrap, IOnPluginDestroy } from '@xpert-ai/plugin-sdk'
import { ConfigModule } from '@nestjs/config'
import { SinaStockStrategy } from './sina-stock.strategy.js'

@XpertServerPlugin({
  imports: [ConfigModule],
  entities: [],
  providers: [SinaStockStrategy]
})
export class SinaStockPlugin implements IOnPluginBootstrap, IOnPluginDestroy {
  private logEnabled = true

  onPluginBootstrap(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${SinaStockPlugin.name} is being bootstrapped...`))
    }
  }

  onPluginDestroy(): void | Promise<void> {
    if (this.logEnabled) {
      console.log(chalk.green(`${SinaStockPlugin.name} is being destroyed...`))
    }
  }
}