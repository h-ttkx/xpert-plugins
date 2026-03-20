import axios from 'axios'
import { MarketType, ScreenResult, ScreenCondition } from './types.js'

export class ScreenerClient {
  private timeout: number
  private dataSource: string

  constructor(config: { timeout?: number; dataSource?: string } = {}) {
    this.timeout = config.timeout || 10000
    this.dataSource = config.dataSource || 'eastmoney'
  }

  detectMarket(code: string): MarketType {
    const upperCode = code.toUpperCase()
    if (upperCode.startsWith('SH')) {
      return MarketType.SH
    }
    if (upperCode.startsWith('SZ')) {
      return MarketType.SZ
    }
    if (upperCode.startsWith('HK')) {
      return MarketType.HK
    }
    if (upperCode.startsWith('US')) {
      return MarketType.US
    }
    
    const cleanCode = upperCode.replace(/^(SH|SZ|HK|US)/, '')
    
    if (/^\d{5}$/.test(cleanCode)) {
      return MarketType.HK
    }
    
    if (/^\d{6}$/.test(cleanCode)) {
      if (cleanCode.startsWith('6')) {
        return MarketType.SH
      }
      return MarketType.SZ
    }
    
    if (/^[A-Z]+$/.test(cleanCode)) {
      return MarketType.US
    }
    
    return MarketType.SH
  }

  formatCodeForEastmoney(code: string): string {
    const cleanCode = code.toUpperCase().replace(/^(SH|SZ|HK|US)/, '')
    const market = this.detectMarket(code)
    
    if (market === MarketType.HK) {
      return cleanCode.padStart(5, '0')
    }
    
    if (market === MarketType.SH || market === MarketType.SZ) {
      return cleanCode.padStart(6, '0')
    }
    
    return cleanCode
  }

  async screenByMarketCap(
    market: MarketType | 'ALL',
    minCap?: number,
    maxCap?: number,
    limit: number = 50
  ): Promise<ScreenResult[]> {
    try {
      const marketMap: { [key: string]: string } = {
        [MarketType.SH]: '1',
        [MarketType.SZ]: '0',
        [MarketType.HK]: '116',
        'ALL': ''
      }

      const marketCode = marketMap[market] || ''
      
      const url = 'https://push2.eastmoney.com/api/qt/clist/get'
      const params: any = {
        pn: 1,
        pz: limit,
        po: 1,
        np: 1,
        fltt: 2,
        invt: 2,
        fid: 'f20',
        fs: market === 'ALL' ? 'b:MK0021,b:MK0022,b:MK0023' : `b:${marketCode}`,
        fields: 'f12,f14,f2,f3,f20,f21,f9,f23,f116,f100'
      }

      const response = await axios.get(url, {
        params,
        timeout: this.timeout
      })

      if (response.data && response.data.data && response.data.data.diff) {
        let results = response.data.data.diff.map((item: any) => ({
          code: item.f12 || '',
          name: item.f14 || '',
          market: this.detectMarket(item.f12),
          price: item.f2 || 0,
          changePercent: item.f3 || 0,
          marketCap: item.f20 || 0,
          pe: item.f9 || null,
          pb: item.f23 || null,
          roe: item.f116 || null
        }))

        if (minCap !== undefined || maxCap !== undefined) {
          results = results.filter((item: ScreenResult) => {
            if (minCap !== undefined && item.marketCap < minCap) return false
            if (maxCap !== undefined && item.marketCap > maxCap) return false
            return true
          })
        }

        return results
      }

      return []
    } catch (error) {
      console.error('Failed to screen by market cap:', error)
      return []
    }
  }

  async screenByIndustry(
    industry: string,
    market: MarketType | 'ALL',
    limit: number = 50
  ): Promise<ScreenResult[]> {
    try {
      const industryMap: { [key: string]: string } = {
        '银行': 'BK0478',
        '房地产': 'BK0451',
        '医药生物': 'BK0727',
        '电子': 'BK0736',
        '计算机': 'BK0728',
        '传媒': 'BK0741',
        '通信': 'BK0734',
        '电气设备': 'BK0428',
        '机械设备': 'BK0429',
        '化工': 'BK0427',
        '汽车': 'BK0488',
        '食品饮料': 'BK0439',
        '家用电器': 'BK0457',
        '钢铁': 'BK0440',
        '有色金属': 'BK0479',
        '采掘': 'BK0436',
        '公用事业': 'BK0454',
        '交通运输': 'BK0450',
        '商业贸易': 'BK0462',
        '休闲服务': 'BK0492',
        '综合': 'BK0472',
        '国防军工': 'BK0738',
        '轻工制造': 'BK0438',
        '纺织服装': 'BK0449',
        '非银金融': 'BK0469',
        '建筑装饰': 'BK0453'
      }

      const industryCode = industryMap[industry] || industry

      const url = 'https://push2.eastmoney.com/api/qt/clist/get'
      const params: any = {
        pn: 1,
        pz: limit,
        po: 1,
        np: 1,
        fltt: 2,
        invt: 2,
        fid: 'f20',
        fs: `b:${industryCode}`,
        fields: 'f12,f14,f2,f3,f20,f21,f9,f23,f116,f100'
      }

      const response = await axios.get(url, {
        params,
        timeout: this.timeout
      })

      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map((item: any) => ({
          code: item.f12 || '',
          name: item.f14 || '',
          market: this.detectMarket(item.f12),
          price: item.f2 || 0,
          changePercent: item.f3 || 0,
          marketCap: item.f20 || 0,
          pe: item.f9 || null,
          pb: item.f23 || null,
          roe: item.f116 || null
        }))
      }

      return []
    } catch (error) {
      console.error('Failed to screen by industry:', error)
      return []
    }
  }

  async screenByMetrics(
    conditions: ScreenCondition[],
    market: MarketType | 'ALL',
    limit: number = 50
  ): Promise<ScreenResult[]> {
    try {
      const marketMap: { [key: string]: string } = {
        [MarketType.SH]: '1',
        [MarketType.SZ]: '0',
        [MarketType.HK]: '116',
        'ALL': ''
      }

      const marketCode = marketMap[market] || ''
      
      const url = 'https://push2.eastmoney.com/api/qt/clist/get'
      const params: any = {
        pn: 1,
        pz: Math.min(limit * 3, 500),
        po: 1,
        np: 1,
        fltt: 2,
        invt: 2,
        fid: 'f20',
        fs: market === 'ALL' ? 'b:MK0021,b:MK0022,b:MK0023' : `b:${marketCode}`,
        fields: 'f12,f14,f2,f3,f20,f21,f9,f23,f116,f100,f162,f167,f170,f171,f84,f85'
      }

      const response = await axios.get(url, {
        params,
        timeout: this.timeout
      })

      if (response.data && response.data.data && response.data.data.diff) {
        let results = response.data.data.diff.map((item: any) => {
          const metrics: { [key: string]: number | null } = {
            'marketCap': item.f20 || null,
            'pe': item.f9 || null,
            'pb': item.f23 || null,
            'roe': item.f116 || null,
            'price': item.f2 || null,
            'changePercent': item.f3 || null,
            'dividendYield': item.f170 || null
          }

          return {
            code: item.f12 || '',
            name: item.f14 || '',
            market: this.detectMarket(item.f12),
            price: item.f2 || 0,
            changePercent: item.f3 || 0,
            marketCap: item.f20 || 0,
            pe: item.f9 || null,
            pb: item.f23 || null,
            roe: item.f116 || null,
            metrics
          }
        })

        for (const condition of conditions) {
          results = results.filter((item: any) => {
            const value = item.metrics[condition.field]
            if (value === null || value === undefined) return false

            if (condition.operator === '>' && value <= (condition.value as number)) return false
            if (condition.operator === '<' && value >= (condition.value as number)) return false
            if (condition.operator === '=' && value !== (condition.value as number)) return false
            if (condition.operator === '>=' && value < (condition.value as number)) return false
            if (condition.operator === '<=' && value > (condition.value as number)) return false
            if (condition.operator === 'between') {
              const [min, max] = condition.value as [number, number]
              if (value < min || value > max) return false
            }

            return true
          })
        }

        return results.slice(0, limit)
      }

      return []
    } catch (error) {
      console.error('Failed to screen by metrics:', error)
      return []
    }
  }
}