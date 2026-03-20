import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { buildRebalanceOrders } from '../portfolio-constructor.js'

export function buildPortfolioRebalancePlanTool() {
  return tool(
    async (input) => {
      try {
        const normalizedPriceMap: Record<string, number> = {}
        for (const [code, price] of Object.entries(input.priceMap || {})) {
          normalizedPriceMap[code.toUpperCase()] = price as number
        }
        const currentPositions = (input.currentPositions || []).map((item) => ({
          code: String(item.code || ''),
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0)
        }))
        const targetWeights = (input.targetWeights || []).map((item) => ({
          code: String(item.code || ''),
          weight: Number(item.weight || 0),
          industry: String(item.industry || 'UNKNOWN'),
          score: Number(item.score || 0),
          price: item.price === undefined ? undefined : Number(item.price),
          expectedReturn: item.expectedReturn === undefined ? undefined : Number(item.expectedReturn)
        }))

        const result = buildRebalanceOrders(
          Number(input.totalCapital),
          currentPositions,
          targetWeights,
          normalizedPriceMap,
          input.lotSize
        )

        return JSON.stringify(result, null, 2)
      } catch (error) {
        throw new Error(`生成调仓计划失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'portfolio_rebalance_plan',
      description: '根据当前持仓和目标权重生成调仓买卖指令',
      schema: z.object({
        totalCapital: z.number().positive(),
        currentPositions: z.array(z.object({
          code: z.string(),
          quantity: z.number().nonnegative(),
          price: z.number().positive()
        })).default([]),
        targetWeights: z.array(z.object({
          code: z.string(),
          weight: z.number().min(0).max(1),
          industry: z.string().optional().default('UNKNOWN'),
          score: z.number().optional().default(0),
          price: z.number().positive().optional(),
          expectedReturn: z.number().optional()
        })).default([]),
        priceMap: z.record(z.string(), z.number().positive()).default({}),
        lotSize: z.number().int().min(1).max(1000).optional().default(1)
      })
    }
  )
}
