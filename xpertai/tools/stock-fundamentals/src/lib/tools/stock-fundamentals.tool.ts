import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { FundamentalsClient } from '../fundamentals-client.js'

export const createStockFundamentalsTool = (config: any) => {
  const client = new FundamentalsClient({
    timeout: config.timeout || 10000,
    dataSource: config.dataSource || 'eastmoney'
  })

  return new DynamicStructuredTool({
    name: 'stock_fundamentals',
    description: 'Get comprehensive fundamentals data for a stock including financial statements, valuation metrics, and financial ratios. Supports A-shares and Hong Kong stocks.',
    schema: z.object({
      code: z.string().describe('Stock code (e.g., 600519 for 贵州茅台, 00700 for Tencent HK)'),
      reportType: z.enum(['annual', 'quarterly']).optional().default('annual').describe('Report type: annual or quarterly')
    }),
    func: async ({ code, reportType }) => {
      try {
        const summary = await client.fetchFinancialSummary(code)
        
        if (!summary) {
          return `Error: Unable to fetch fundamentals data for ${code}. Please verify the stock code is correct.`
        }

        const formatPercent = (value: number | null | undefined) => {
          if (value === null || value === undefined) return 'N/A'
          return `${(value * 100).toFixed(2)}%`
        }

        const formatNumber = (value: number | null | undefined) => {
          if (value === null || value === undefined) return 'N/A'
          return value.toFixed(2)
        }

        const formatMarketCap = (value: number | null | undefined) => {
          if (value === null || value === undefined) return 'N/A'
          if (value >= 100000000) {
            return `${(value / 100000000).toFixed(2)}亿`
          }
          if (value >= 10000) {
            return `${(value / 10000).toFixed(2)}万`
          }
          return value.toFixed(2)
        }

        return `## ${summary.name} (${summary.code}) - 基本面数据

**市场**: ${summary.market.toUpperCase()}
**数据更新时间**: ${summary.lastUpdate}
**数据来源**: ${summary.dataSource}
**数据质量**: ${summary.dataQuality}

### 估值指标
- **市盈率 (PE)**: ${formatNumber(summary.valuation.pe)}
- **市净率 (PB)**: ${formatNumber(summary.valuation.pb)}
- **市销率 (PS)**: ${formatNumber(summary.valuation.ps)}
- **总市值**: ${formatMarketCap(summary.valuation.marketCap)}
- **股息率**: ${formatPercent(summary.valuation.dividendYield)}

### 盈利能力
- **ROE (净资产收益率)**: ${formatPercent(summary.profitability.roe)}
- **ROA (总资产收益率)**: ${formatPercent(summary.profitability.roa)}
- **净利率**: ${formatPercent(summary.profitability.netMargin)}

### 成长性
- **营收增长率**: ${formatPercent(summary.growth.revenueGrowth)}
- **净利润增长率**: ${formatPercent(summary.growth.earningsGrowth)}

### 财务健康
- **资产负债率**: ${formatPercent(summary.financialHealth.debtToEquity)}
- **流动比率**: ${formatNumber(summary.financialHealth.currentRatio)}

---
**免责声明**: ${summary.disclaimer}
`
      } catch (error: any) {
        return `Error fetching fundamentals for ${code}: ${error.message}`
      }
    }
  })
}