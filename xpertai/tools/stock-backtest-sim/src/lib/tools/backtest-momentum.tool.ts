import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { runMomentumBacktest } from '../backtest-engine.js'

export function buildBacktestMomentumTool() {
  return tool(
    async (input) => {
      try {
        const series = (input.series || []).map((item) => ({
          code: String(item.code || ''),
          prices: (item.prices || []).map((point) => ({
            date: String(point.date || ''),
            close: Number(point.close || 0)
          }))
        }))

        const result = runMomentumBacktest(series, {
          initialCapital: Number(input.initialCapital),
          lookbackDays: input.lookbackDays,
          rebalanceEveryDays: input.rebalanceEveryDays,
          topN: input.topN,
          feeRate: input.feeRate,
          slippageRate: input.slippageRate,
          maxSingleWeight: input.maxSingleWeight,
          cashReserveRatio: input.cashReserveRatio,
          benchmarkSeries: (input.benchmarkSeries || []).map((point) => ({
            date: String(point.date || ''),
            close: Number(point.close || 0)
          }))
        })

        return JSON.stringify(result, null, 2)
      } catch (error) {
        throw new Error(`回测失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'backtest_momentum_strategy',
      description: '使用价格序列执行动量策略回测，并返回收益、回撤、夏普、基准对比、成本拆解、归因和交易记录',
      schema: z.object({
        initialCapital: z.number().positive().default(1_000_000),
        series: z.array(z.object({
          code: z.string(),
          prices: z.array(z.object({
            date: z.string(),
            close: z.number().positive()
          })).min(30)
        })).min(2),
        lookbackDays: z.number().int().min(5).max(250).optional().default(20),
        rebalanceEveryDays: z.number().int().min(1).max(60).optional().default(5),
        topN: z.number().int().min(1).max(20).optional().default(3),
        feeRate: z.number().min(0).max(0.01).optional().default(0.0005),
        slippageRate: z.number().min(0).max(0.01).optional().default(0.0005),
        maxSingleWeight: z.number().min(0.01).max(1).optional().default(0.4),
        cashReserveRatio: z.number().min(0).max(0.5).optional().default(0.05),
        benchmarkSeries: z.array(z.object({
          date: z.string(),
          close: z.number().positive()
        })).optional().default([])
      })
    }
  )
}
