import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { evaluateOrderRisk } from '../risk-engine.js'

export function buildOrderRiskCheckTool() {
  return tool(
    async (input) => {
      try {
        const positions = (input.positions || []).map((item) => ({
          code: String(item.code || ''),
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          industry: item.industry ? String(item.industry) : undefined,
          annualVolatility: item.annualVolatility === undefined ? undefined : Number(item.annualVolatility)
        }))
        const order = {
          code: String(input.order?.code || ''),
          side: input.order?.side === 'sell' ? 'sell' as const : 'buy' as const,
          quantity: Number(input.order?.quantity || 0),
          price: Number(input.order?.price || 0),
          industry: input.order?.industry ? String(input.order.industry) : undefined
        }

        const decision = evaluateOrderRisk(
          Number(input.totalCapital),
          positions,
          order,
          {
            maxSingleWeight: input.maxSingleWeight,
            maxIndustryWeight: input.maxIndustryWeight,
            maxLeverage: input.maxLeverage,
            maxPortfolioVolatility: input.maxPortfolioVolatility,
            maxVaRRatio: input.maxVaRRatio,
            confidenceZ: input.confidenceZ,
            horizonDays: input.horizonDays
          }
        )

        return JSON.stringify(decision, null, 2)
      } catch (error) {
        throw new Error(`订单风险检查失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'order_risk_check',
      description: '评估单笔订单是否可通过风险限制，并返回可执行数量建议',
      schema: z.object({
        totalCapital: z.number().positive(),
        positions: z.array(z.object({
          code: z.string(),
          quantity: z.number().nonnegative(),
          price: z.number().positive(),
          industry: z.string().optional(),
          annualVolatility: z.number().min(0).max(3).optional()
        })).default([]),
        order: z.object({
          code: z.string(),
          side: z.enum(['buy', 'sell']),
          quantity: z.number().int().positive(),
          price: z.number().positive(),
          industry: z.string().optional()
        }),
        maxSingleWeight: z.number().min(0.01).max(1).optional().default(0.2),
        maxIndustryWeight: z.number().min(0.01).max(1).optional().default(0.35),
        maxLeverage: z.number().min(0.1).max(5).optional().default(1),
        maxPortfolioVolatility: z.number().min(0.01).max(3).optional().default(0.35),
        maxVaRRatio: z.number().min(0.001).max(0.2).optional().default(0.03),
        confidenceZ: z.number().min(0.5).max(5).optional().default(1.65),
        horizonDays: z.number().int().min(1).max(30).optional().default(1)
      })
    }
  )
}
