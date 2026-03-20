/**
 * 情绪分析客户端 - 基于新闻、价格、成交量数据综合分析
 */

import axios from 'axios'
import { SentimentLevel, SentimentScore, SentimentFactor, SentimentSummary, SentimentTrend } from './types.js'

export type MarketType = 'sh' | 'sz' | 'hk' | 'us'

interface NewsItem {
  title: string
  summary?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

interface PriceData {
  change: number
  changePercent: number
  volume: number
  turnoverRate?: number
}

export class SentimentClient {
  private timeout: number
  private newsWeight: number
  private priceWeight: number
  private volumeWeight: number

  constructor(config?: {
    timeout?: number
    newsWeight?: number
    priceWeight?: number
    volumeWeight?: number
  }) {
    this.timeout = config?.timeout ?? 5000
    this.newsWeight = config?.newsWeight ?? 0.4
    this.priceWeight = config?.priceWeight ?? 0.3
    this.volumeWeight = config?.volumeWeight ?? 0.3
  }

  detectMarket(code: string): MarketType {
    const trimmedCode = code.trim()
    const lowerCode = trimmedCode.toLowerCase()
    
    if (lowerCode.startsWith('sh')) return 'sh'
    if (lowerCode.startsWith('sz')) return 'sz'
    if (lowerCode.startsWith('hk')) return 'hk'
    if (lowerCode.startsWith('us')) return 'us'
    
    const cleanCode = trimmedCode.replace(/^(sh|sz|hk|us)/i, '').replace(/[^a-zA-Z0-9]/g, '')
    
    if (/^[a-zA-Z]+$/.test(cleanCode)) {
      return 'us'
    }
    
    if (/^\d{1,5}$/.test(cleanCode)) {
      if (/^6\d{5}$/.test(cleanCode)) {
        return 'sh'
      }
      if (/^0\d{5}$/.test(cleanCode) || /^3\d{5}$/.test(cleanCode)) {
        return 'sz'
      }
      return 'hk'
    }
    
    if (/^6\d{5}$/.test(cleanCode)) {
      return 'sh'
    }
    
    if (/^0\d{5}$/.test(cleanCode) || /^3\d{5}$/.test(cleanCode)) {
      return 'sz'
    }
    
    return 'sh'
  }

  formatCodeForSina(code: string): string {
    const trimmedCode = code.trim()
    const market = this.detectMarket(trimmedCode)
    let cleanCode = trimmedCode.replace(/^(sh|sz|hk|us)/i, '')
    cleanCode = cleanCode.replace(/[^a-zA-Z0-9]/g, '')
    
    if (market === 'hk') {
      return cleanCode.padStart(5, '0')
    }
    
    if (market === 'us') {
      return cleanCode.toUpperCase()
    }
    
    return cleanCode.padStart(6, '0')
  }

  getSentimentLevel(score: number): SentimentLevel {
    if (score >= 80) return SentimentLevel.VERY_BULLISH
    if (score >= 60) return SentimentLevel.BULLISH
    if (score >= 40) return SentimentLevel.NEUTRAL
    if (score >= 20) return SentimentLevel.BEARISH
    return SentimentLevel.VERY_BEARISH
  }

  async fetchSentimentSummary(code: string): Promise<SentimentSummary> {
    const market = this.detectMarket(code)
    const formattedCode = this.formatCodeForSina(code)
    
    const [newsSentiment, priceSentiment, volumeSentiment] = await Promise.all([
      this.analyzeNewsSentiment(code),
      this.analyzePriceSentiment(code),
      this.analyzeVolumeSentiment(code)
    ])
    
    const overallScore = this.calculateOverallScore(
      newsSentiment.score,
      priceSentiment.score,
      volumeSentiment.score
    )
    
    const factors: SentimentFactor[] = [
      {
        name: 'news_sentiment',
        weight: this.newsWeight,
        score: newsSentiment.score,
        description: newsSentiment.description,
        sources: ['新浪财经', '东方财富']
      },
      {
        name: 'price_sentiment',
        weight: this.priceWeight,
        score: priceSentiment.score,
        description: priceSentiment.description
      },
      {
        name: 'volume_sentiment',
        weight: this.volumeWeight,
        score: volumeSentiment.score,
        description: volumeSentiment.description
      }
    ]
    
    const riskWarning = this.generateRiskWarning(overallScore.score, newsSentiment.negativeCount)
    
    return {
      code: formattedCode,
      name: await this.fetchStockName(code) || formattedCode,
      overallScore,
      factors,
      newsCount: newsSentiment.totalCount,
      positiveCount: newsSentiment.positiveCount,
      negativeCount: newsSentiment.negativeCount,
      neutralCount: newsSentiment.neutralCount,
      timeWindow: '7天',
      riskWarning,
      dataSource: 'sina',
      lastUpdate: new Date().toISOString()
    }
  }

  async fetchSentimentScore(code: string): Promise<SentimentScore> {
    const summary = await this.fetchSentimentSummary(code)
    return summary.overallScore
  }

  private async analyzeNewsSentiment(code: string): Promise<{
    score: number
    description: string
    totalCount: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
  }> {
    try {
      const market = this.detectMarket(code)
      const formattedCode = this.formatCodeForSina(code)
      
      const url = 'https://feeds.finance.sina.com.cn/finance/api/newsfeed.php'
      const response = await axios.get(url, {
        params: {
          symbol: market === 'hk' ? `hk${formattedCode}` : `${market}${formattedCode}`,
          page: 1,
          num: 20
        },
        timeout: this.timeout
      })

      const newsList = response.data?.data?.list || []
      
      let positiveCount = 0
      let negativeCount = 0
      let neutralCount = 0
      
      const positiveWords = ['上涨', '增长', '利好', '突破', '新高', '盈利', '收益', '涨停', '大涨', '反弹']
      const negativeWords = ['下跌', '亏损', '利空', '跌停', '大跌', '下滑', '减少', '风险', '违约', '减持']
      
      for (const item of newsList) {
        const text = (item.title || '') + ' ' + (item.summary || '')
        let positive = 0
        let negative = 0
        
        for (const word of positiveWords) {
          if (text.includes(word)) positive++
        }
        for (const word of negativeWords) {
          if (text.includes(word)) negative++
        }
        
        if (positive > negative) positiveCount++
        else if (negative > positive) negativeCount++
        else neutralCount++
      }
      
      const totalCount = newsList.length
      let score = 50
      
      if (totalCount > 0) {
        const positiveRatio = positiveCount / totalCount
        const negativeRatio = negativeCount / totalCount
        score = Math.round(50 + (positiveRatio - negativeRatio) * 100)
        score = Math.max(0, Math.min(100, score))
      }
      
      let description = '新闻情绪'
      if (score >= 70) description = '新闻情绪偏积极，市场信心较强'
      else if (score >= 50) description = '新闻情绪中性，市场观望为主'
      else description = '新闻情绪偏谨慎，注意风险防范'
      
      return {
        score,
        description,
        totalCount,
        positiveCount,
        negativeCount,
        neutralCount
      }
    } catch (error) {
      return {
        score: 50,
        description: '无法获取新闻数据',
        totalCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      }
    }
  }

  private async analyzePriceSentiment(code: string): Promise<{
    score: number
    description: string
  }> {
    try {
      const market = this.detectMarket(code)
      const formattedCode = this.formatCodeForSina(code)
      
      const sinaCode = market === 'hk' 
        ? `hk${formattedCode}` 
        : `${market}${formattedCode}`
      
      const url = `https://hq.sinajs.cn/list=${sinaCode}`
      const response = await axios.get(url, {
        timeout: this.timeout,
        responseType: 'arraybuffer'
      })
      
      const text = response.data.toString('utf-8')
      const match = text.match(/="([^"]*)"/)
      
      if (!match || !match[1]) {
        return { score: 50, description: '无法获取价格数据' }
      }
      
      const parts = match[1].split(',')
      
      if (parts.length < 6) {
        return { score: 50, description: '价格数据不完整' }
      }
      
      const currentPrice = parseFloat(parts[3]) || 0
      const preClose = parseFloat(parts[2]) || 0
      const changePercent = preClose > 0 ? ((currentPrice - preClose) / preClose) * 100 : 0
      
      let score = 50
      if (changePercent > 5) score = 90
      else if (changePercent > 2) score = 70
      else if (changePercent > 0) score = 60
      else if (changePercent > -2) score = 40
      else if (changePercent > -5) score = 30
      else score = 10
      
      let description = '价格情绪'
      if (changePercent > 0) {
        description = `股价上涨${changePercent.toFixed(2)}%，市场表现强势`
      } else if (changePercent < 0) {
        description = `股价下跌${Math.abs(changePercent).toFixed(2)}%，市场表现偏弱`
      } else {
        description = '股价持平，市场表现平稳'
      }
      
      return { score, description }
    } catch (error) {
      return { score: 50, description: '无法获取价格数据' }
    }
  }

  private async analyzeVolumeSentiment(code: string): Promise<{
    score: number
    description: string
  }> {
    try {
      const market = this.detectMarket(code)
      const formattedCode = this.formatCodeForSina(code)
      
      const sinaCode = market === 'hk' 
        ? `hk${formattedCode}` 
        : `${market}${formattedCode}`
      
      const url = `https://hq.sinajs.cn/list=${sinaCode}`
      const response = await axios.get(url, {
        timeout: this.timeout,
        responseType: 'arraybuffer'
      })
      
      const text = response.data.toString('utf-8')
      const match = text.match(/="([^"]*)"/)
      
      if (!match || !match[1]) {
        return { score: 50, description: '无法获取成交量数据' }
      }
      
      const parts = match[1].split(',')
      
      if (parts.length < 10) {
        return { score: 50, description: '成交量数据不完整' }
      }
      
      const volume = parseFloat(parts[8]) || 0
      const amount = parseFloat(parts[9]) || 0
      
      let score = 50
      if (amount > 10000000) score = 80
      else if (amount > 5000000) score = 70
      else if (amount > 1000000) score = 60
      else if (amount > 500000) score = 50
      else score = 40
      
      let description = '成交情绪'
      if (amount > 5000000) {
        description = `成交额${(amount / 10000).toFixed(2)}万，交易活跃`
      } else if (amount > 1000000) {
        description = `成交额${(amount / 10000).toFixed(2)}万，交易适中`
      } else {
        description = `成交额${(amount / 10000).toFixed(2)}万，交易清淡`
      }
      
      return { score, description }
    } catch (error) {
      return { score: 50, description: '无法获取成交量数据' }
    }
  }

  private calculateOverallScore(
    newsScore: number,
    priceScore: number,
    volumeScore: number
  ): SentimentScore {
    const weightedScore = 
      newsScore * this.newsWeight +
      priceScore * this.priceWeight +
      volumeScore * this.volumeWeight
    
    const score = Math.round(weightedScore)
    
    return {
      score,
      level: this.getSentimentLevel(score),
      confidence: 0.75,
      timestamp: new Date().toISOString()
    }
  }

  private generateRiskWarning(score: number, negativeCount: number): string | undefined {
    if (score < 30) {
      return '情绪评分较低，建议谨慎操作，关注风险控制'
    }
    if (negativeCount > 5) {
      return '负面新闻较多，建议关注市场动态，做好风险管理'
    }
    if (score > 80) {
      return '情绪评分较高，市场可能存在过热风险，注意回调'
    }
    return undefined
  }

  private async fetchStockName(code: string): Promise<string | null> {
    try {
      const market = this.detectMarket(code)
      const formattedCode = this.formatCodeForSina(code)
      
      const sinaCode = market === 'hk' 
        ? `hk${formattedCode}` 
        : `${market}${formattedCode}`
      
      const url = `https://hq.sinajs.cn/list=${sinaCode}`
      const response = await axios.get(url, {
        timeout: this.timeout,
        responseType: 'arraybuffer'
      })
      
      const text = response.data.toString('utf-8')
      const match = text.match(/="([^"]*)"/)
      
      if (match && match[1]) {
        const parts = match[1].split(',')
        if (parts.length > 0) {
          return parts[0]
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  async fetchSentimentTrend(code: string, days: number = 7): Promise<SentimentTrend> {
    try {
      const dates: string[] = []
      const scores: number[] = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
        
        const score = await this.fetchSentimentScore(code)
        scores.push(score.score)
      }
      
      let trend: 'rising' | 'falling' | 'stable' = 'stable'
      if (scores.length >= 2) {
        const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / 3
        const earlier = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3
        const changePercent = ((recent - earlier) / earlier) * 100
        
        if (changePercent > 5) trend = 'rising'
        else if (changePercent < -5) trend = 'falling'
      }
      
      const changePercent = scores.length >= 2 
        ? ((scores[scores.length - 1] - scores[0]) / scores[0]) * 100 
        : 0
      
      return {
        code,
        dates,
        scores,
        trend,
        changePercent: Math.round(changePercent * 100) / 100
      }
    } catch (error) {
      return {
        code,
        dates: [],
        scores: [],
        trend: 'stable',
        changePercent: 0
      }
    }
  }
}