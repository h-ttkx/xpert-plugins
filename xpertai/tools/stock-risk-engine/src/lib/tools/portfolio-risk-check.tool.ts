import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { evaluatePortfolioRisk } from '../risk-engine.js'

export function buildPortfolioRiskCheckTool() {
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

        const report = evaluatePortfolioRisk(Number(input.totalCapital), positions, {
          maxSingleWeight: input.maxSingleWeight,
          maxIndustryWeight: input.maxIndustryWeight,
          maxLeverage: input.maxLeverage,
          maxPortfolioVolatility: input.maxPortfolioVolatility,
          maxVaRRatio: input.maxVaRRatio,
          confidenceZ: input.confidenceZ,
          horizonDays: input.horizonDays
        })

        return JSON.stringify(report, null, 2)
      } catch (error) {
        throw new Error(`组合风险检查失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'portfolio_risk_check',
      description: '检查组合是否违反风险约束（单票集中度、行业集中度、杠杆、波动率、VaR）',
      schema: z.object({
        totalCapital: z.number().positive().describe('组合总资金（基础货币）'),
        positions: z.array(z.object({
          code: z.string(),
          quantity: z.number().nonnegative(),
          price: z.number().positive(),
          industry: z.string().optional(),
          annualVolatility: z.number().min(0).max(3).optional()
        })).default([]),
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
