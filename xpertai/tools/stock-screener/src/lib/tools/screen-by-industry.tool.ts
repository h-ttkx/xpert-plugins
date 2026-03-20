import { tool } from '@langchain/core/tools'
import { getErrorMessage } from '@xpert-ai/plugin-sdk'
import { z } from 'zod'
import { ScreenerClient } from '../screener-client.js'
import { MarketType } from '../types.js'

const INDUSTRIES = [
  '银行', '房地产', '医药生物', '电子', '计算机', '传媒', '通信',
  '电气设备', '机械设备', '化工', '汽车', '食品饮料', '家用电器',
  '建筑材料', '钢铁', '有色金属', '采掘', '公用事业', '交通运输',
  '商业贸易', '休闲服务', '综合', '国防军工', '轻工制造', '纺织服装',
  '非银金融', '建筑装饰'
]

export function buildScreenByIndustryTool(client: ScreenerClient) {
  return tool(
    async (input) => {
      try {
        const industry = input.industry
        const market = input.market as MarketType | 'ALL'
        const limit = input.limit || 50

        const results = await client.screenByIndustry(industry, market, limit)

        if (results.length === 0) {
          return `未找到行业"${industry}"的股票。支持的行业: ${INDUSTRIES.slice(0, 10).join('、')}等。`
        }

        let output = `【按行业筛选 - ${industry}】\n`
        output += `找到 ${results.length} 只股票:\n\n`

        results.slice(0, 20).forEach((item, index) => {
          const changeSign = item.changePercent >= 0 ? '+' : ''
          const marketName = {
            [MarketType.SH]: '沪A',
            [MarketType.SZ]: '深A',
            [MarketType.HK]: '港股',
            [MarketType.US]: '美股'
          }[item.market]
          
          output += `${index + 1}. ${item.name}(${item.code}) [${marketName}]\n`
          output += `   价格: ${item.price.toFixed(2)} | 涨跌: ${changeSign}${item.changePercent.toFixed(2)}%\n`
          output += `   市值: ${(item.marketCap / 100000000).toFixed(2)}亿`
          if (item.pe) output += ` | PE: ${item.pe.toFixed(2)}`
          if (item.pb) output += ` | PB: ${item.pb.toFixed(2)}`
          output += `\n`
        })

        if (results.length > 20) {
          output += `\n... 还有 ${results.length - 20} 只股票未显示。`
        }

        return output
      } catch (error) {
        throw new Error(`按行业筛选失败: ${getErrorMessage(error)}`)
      }
    },
    {
      name: 'stock_screen_by_industry',
      description: `按行业筛选股票。
支持行业: 银行、房地产、医药生物、电子、计算机、传媒、通信、电气设备、机械设备、化工、汽车、食品饮料、家用电器等。
返回行业内的股票列表，包含市值、PE、PB等指标。`,
      schema: z.object({
        industry: z.string().describe('行业名称，如: 银行、医药生物、计算机'),
        market: z.enum(['SH', 'SZ', 'HK', 'ALL']).optional().default('ALL').describe('市场类型: SH(上海), SZ(深圳), HK(港股), ALL(全市场)'),
        limit: z.number().min(1).max(200).optional().describe('返回数量限制，默认50，最大200')
      })
    }
  )
}