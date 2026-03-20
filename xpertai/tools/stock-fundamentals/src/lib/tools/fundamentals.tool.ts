/**
 * 股票基本面数据工具
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { FundamentalsClient } from '../fundamentals-client.js'

const client = new FundamentalsClient({ timeout: 10000 })

export function buildFundamentalsTool() {
  return new DynamicStructuredTool({
    name: 'stock_fundamentals',
    description: '获取股票基本面数据，包括估值指标（PE/PB/PS）、财务比率（ROE/ROA）、股息信息等。支持A股和港股市场。',
    schema: z.object({
      code: z.string().describe('股票代码（如 600519、00700）'),
      market: z.enum(['sh', 'sz', 'hk']).optional().describe('市场：sh=上海，sz=深圳，hk=港股')
    }),
    func: async ({ code, market }) => {
      try {
        const summary = await client.fetchFinancialSummary(code)
        
        if (!summary) {
          return JSON.stringify({
            error: 'NO_DATA',
            message: `无法获取股票 ${code} 的基本面数据`,
            code,
            suggestion: '请检查股票代码是否正确，或稍后重试'
          }, null, 2)
        }

        return JSON.stringify({
          code: summary.code,
          name: summary.name,
          market: summary.market,
          valuation: {
            pe: summary.valuation.pe,
            pb: summary.valuation.pb,
            ps: summary.valuation.ps,
            marketCap: summary.valuation.marketCap,
            dividendYield: summary.valuation.dividendYield
          },
          profitability: {
            roe: summary.profitability.roe,
            roa: summary.profitability.roa,
            netMargin: summary.profitability.netMargin
          },
          growth: {
            revenueGrowth: summary.growth.revenueGrowth,
            earningsGrowth: summary.growth.earningsGrowth
          },
          financialHealth: {
            debtToEquity: summary.financialHealth.debtToEquity,
            currentRatio: summary.financialHealth.currentRatio
          },
          dataSource: summary.dataSource,
          dataQuality: summary.dataQuality,
          lastUpdate: summary.lastUpdate,
          disclaimer: summary.disclaimer
        }, null, 2)
      } catch (error) {
        return JSON.stringify({
          error: 'FETCH_ERROR',
          message: `获取基本面数据失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code
        }, null, 2)
      }
    }
  })
}