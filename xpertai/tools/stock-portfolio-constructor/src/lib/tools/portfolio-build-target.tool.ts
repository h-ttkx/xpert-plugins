import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { buildTargetWeights } from '../portfolio-constructor.js'

export function buildPortfolioBuildTargetTool() {
  return tool(
    async (input) => {
      try {
        const candidates = (input.candidates || []).map((item) => ({
          code: String(item.code || ''),
          score: Number(item.score || 0),
          expectedReturn: item.expectedReturn === undefined ? undefined : Number(item.expectedReturn),
          risk: item.risk === undefined ? undefined : Number(item.risk),
          industry: item.industry ? String(item.industry) : undefined,
          price: item.price === undefined ? undefined : Number(item.price)
        }))

        const result = buildTargetWeights(candidates, {
          maxPositions: input.maxPositions,
          longOnly: input.longOnly,
          maxSingleWeight: input.maxSingleWeight,
          maxIndustryWeight: input.maxIndustryWeight,
          minWeight: input.minWeight
        })
        return JSON.stringify(result, null, 2)
      } catch (error) {
        throw new Error(`构建目标组合失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'portfolio_build_target',
      description: '基于候选标的和打分构建目标权重组合，支持单票和行业权重约束',
      schema: z.object({
        candidates: z.array(z.object({
          code: z.string(),
          score: z.number(),
          expectedReturn: z.number().optional(),
          risk: z.number().positive().optional(),
          industry: z.string().optional(),
          price: z.number().positive().optional()
        })).min(1),
        maxPositions: z.number().int().min(1).max(100).optional().default(10),
        longOnly: z.boolean().optional().default(true),
        maxSingleWeight: z.number().min(0.01).max(1).optional().default(0.2),
        maxIndustryWeight: z.number().min(0.01).max(1).optional().default(0.35),
        minWeight: z.number().min(0).max(1).optional().default(0.01)
      })
    }
  )
}
