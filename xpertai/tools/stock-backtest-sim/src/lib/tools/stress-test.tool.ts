import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { runStressTest } from '../backtest-engine.js'

export function buildStressTestTool() {
  return tool(
    async (input) => {
      try {
        const positions = (input.positions || []).map((item) => ({
          code: String(item.code || ''),
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          beta: item.beta === undefined ? undefined : Number(item.beta)
        }))
        const scenarios = (input.scenarios || []).length > 0
          ? (input.scenarios || []).map((item) => ({
              name: String(item.name || 'scenario'),
              marketShock: Number(item.marketShock || 0),
              betaScale: item.betaScale === undefined ? undefined : Number(item.betaScale),
              perSymbolShock: item.perSymbolShock || {}
            }))
          : [
            { name: 'mild_drop', marketShock: -0.03, betaScale: 1 },
            { name: 'medium_drop', marketShock: -0.08, betaScale: 1.1 },
            { name: 'crash', marketShock: -0.15, betaScale: 1.2 }
          ]

        const result = runStressTest(positions, scenarios)
        return JSON.stringify(result, null, 2)
      } catch (error) {
        throw new Error(`压力测试失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'portfolio_stress_test',
      description: '对当前持仓执行压力测试场景仿真，输出PnL与组合损失率',
      schema: z.object({
        positions: z.array(z.object({
          code: z.string(),
          quantity: z.number().nonnegative(),
          price: z.number().positive(),
          beta: z.number().min(0).max(5).optional().default(1)
        })).min(1),
        scenarios: z.array(z.object({
          name: z.string(),
          marketShock: z.number().min(-1).max(1),
          betaScale: z.number().min(0).max(5).optional().default(1),
          perSymbolShock: z.record(z.string(), z.number().min(-1).max(1)).optional().default({})
        })).optional().default([])
      })
    }
  )
}
