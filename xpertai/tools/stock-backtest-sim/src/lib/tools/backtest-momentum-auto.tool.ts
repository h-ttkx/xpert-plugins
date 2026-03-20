import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { runMomentumBacktest } from '../backtest-engine.js'
import { MarketDataAdapter } from '../market-data-adapter.js'

export function buildBacktestMomentumAutoTool() {
  return tool(
    async (input) => {
      try {
        const codes = (input.codes || []).map((item) => String(item || '').trim()).filter(Boolean)
        if (codes.length < 2) {
          throw new Error('至少需要提供2个股票代码')
        }

        const adapter = new MarketDataAdapter({ timeoutMs: Number(input.timeoutMs || 10000) })
        const series = await adapter.fetchSeriesBatch(codes, Number(input.count || 200))
        if (series.length < 2) {
          throw new Error('可用行情序列不足，至少需要2只股票成功取数')
        }

        let benchmarkSeries = undefined as Array<{ date: string; close: number }> | undefined
        if (input.includeBenchmark !== false) {
          try {
            const benchmark = await adapter.fetchDailySeries(String(input.benchmarkCode || 'sh000300'), Number(input.count || 200))
            benchmarkSeries = benchmark.prices
          } catch (error) {
            const message = String((error as any)?.message || 'unknown')
            console.warn(`[stock-backtest-sim] benchmark fetch failed: ${message}`)
          }
        }

        const result = runMomentumBacktest(series, {
          initialCapital: Number(input.initialCapital),
          lookbackDays: input.lookbackDays,
          rebalanceEveryDays: input.rebalanceEveryDays,
          topN: input.topN,
          feeRate: input.feeRate,
          slippageRate: input.slippageRate,
          maxSingleWeight: input.maxSingleWeight,
          cashReserveRatio: input.cashReserveRatio,
          benchmarkSeries
        })

        return JSON.stringify({
          inputSummary: {
            requestedCodes: codes,
            loadedSeries: series.map((item) => ({ code: item.code, points: item.prices.length })),
            benchmarkCode: input.includeBenchmark === false ? null : String(input.benchmarkCode || 'sh000300')
          },
          ...result
        }, null, 2)
      } catch (error) {
        throw new Error(`自动取数回测失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'backtest_momentum_strategy_auto',
      description: '自动拉取行情并执行动量回测，输出收益、基准对比、成本拆解和归因报告',
      schema: z.object({
        codes: z.array(z.string()).min(2).describe('股票代码列表，例如 ["600519", "000001", "300750"]'),
        count: z.number().int().min(30).max(1000).optional().default(200).describe('拉取历史K线数量'),
        initialCapital: z.number().positive().optional().default(1_000_000),
        lookbackDays: z.number().int().min(5).max(250).optional().default(20),
        rebalanceEveryDays: z.number().int().min(1).max(60).optional().default(5),
        topN: z.number().int().min(1).max(20).optional().default(3),
        feeRate: z.number().min(0).max(0.01).optional().default(0.0005),
        slippageRate: z.number().min(0).max(0.01).optional().default(0.0005),
        maxSingleWeight: z.number().min(0.01).max(1).optional().default(0.4),
        cashReserveRatio: z.number().min(0).max(0.5).optional().default(0.05),
        includeBenchmark: z.boolean().optional().default(true),
        benchmarkCode: z.string().optional().default('sh000300').describe('基准代码，默认沪深300'),
        timeoutMs: z.number().int().min(1000).max(30000).optional().default(10000)
      })
    }
  )
}
