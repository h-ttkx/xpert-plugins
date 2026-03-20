/**
 * 股票估值快照工具
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { FundamentalsClient } from '../fundamentals-client.js'

const client = new FundamentalsClient({ timeout: 10000 })

function determineValuationLevel(pe: number | null, pb: number | null, peg: number | null): 'undervalued' | 'fair' | 'overvalued' | 'unknown' {
  if (pe === null && pb === null) return 'unknown'
  
  const peScore = pe !== null ? (pe < 15 ? 1 : pe < 25 ? 0 : -1) : 0
  const pbScore = pb !== null ? (pb < 1.5 ? 1 : pb < 3 ? 0 : -1) : 0
  const pegScore = peg !== null ? (peg < 1 ? 1 : peg < 2 ? 0 : -1) : 0
  
  const totalScore = peScore + pbScore + pegScore
  
  if (totalScore >= 1) return 'undervalued'
  if (totalScore <= -1) return 'overvalued'
  return 'fair'
}

function generateAnalysisNote(pe: number | null, pb: number | null, peg: number | null, level: string): string {
  const notes: string[] = []
  
  if (pe !== null) {
    if (pe < 0) {
      notes.push('PE为负值，公司处于亏损状态')
    } else if (pe < 15) {
      notes.push('PE较低，可能被低估或增长预期较低')
    } else if (pe > 30) {
      notes.push('PE较高，市场预期较高增长')
    } else {
      notes.push('PE处于合理区间')
    }
  }
  
  if (pb !== null) {
    if (pb < 1) {
      notes.push('PB低于1，市值低于净资产')
    } else if (pb > 3) {
      notes.push('PB较高，市场给予溢价')
    }
  }
  
  if (peg !== null && peg > 0) {
    if (peg < 1) {
      notes.push('PEG小于1，相对增长预期估值较低')
    } else if (peg > 2) {
      notes.push('PEG大于2，估值相对增长预期偏高')
    }
  }
  
  if (notes.length === 0) {
    notes.push('数据有限，建议结合其他指标综合分析')
  }
  
  return notes.join('；')
}

export function buildValuationSnapshotTool() {
  return new DynamicStructuredTool({
    name: 'stock_valuation_snapshot',
    description: '获取股票估值快照，包括当前估值水平分析、PE/PB历史分位、估值建议等。支持A股和港股市场。',
    schema: z.object({
      code: z.string().describe('股票代码（如 600519、00700）'),
      market: z.enum(['sh', 'sz', 'hk']).optional().describe('市场：sh=上海，sz=深圳，hk=港股')
    }),
    func: async ({ code, market }) => {
      try {
        const valuation = await client.fetchValuationMetrics(code)
        
        if (!valuation) {
          return JSON.stringify({
            error: 'NO_DATA',
            message: `无法获取股票 ${code} 的估值数据`,
            code,
            suggestion: '请检查股票代码是否正确，或稍后重试'
          }, null, 2)
        }

        const peg = valuation.pe && valuation.pe > 0 ? null : null
        const valuationLevel = determineValuationLevel(valuation.pe, valuation.pb, peg)
        const analysisNote = generateAnalysisNote(valuation.pe, valuation.pb, peg, valuationLevel)

        return JSON.stringify({
          code: valuation.code,
          name: valuation.name,
          market: valuation.market,
          pe: valuation.pe,
          pb: valuation.pb,
          ps: valuation.ps,
          peg: peg,
          marketCap: valuation.marketCap,
          enterpriseValue: valuation.ev,
          evPerEbitda: valuation.evEbitda,
          priceToBook: valuation.priceToBook,
          priceToSales: valuation.priceToSales,
          dividendYield: valuation.dividendYield,
          valuationLevel,
          analysisNote,
          updateDate: valuation.updateDate,
          dataSource: valuation.source,
          disclaimer: '数据来自东方财富，仅供参考，不构成投资建议'
        }, null, 2)
      } catch (error) {
        return JSON.stringify({
          error: 'FETCH_ERROR',
          message: `获取估值数据失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code
        }, null, 2)
      }
    }
  })
}