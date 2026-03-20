import { SentimentClient, MarketType } from './sentiment-client.js'
import { SentimentLevel } from './types.js'

describe('SentimentClient', () => {
  let client: SentimentClient

  beforeEach(() => {
    client = new SentimentClient({ timeout: 5000 })
  })

  describe('detectMarket', () => {
    it('should detect sh market with prefix', () => {
      expect(client.detectMarket('sh600519')).toBe('sh')
      expect(client.detectMarket('SH600519')).toBe('sh')
    })

    it('should detect sz market with prefix', () => {
      expect(client.detectMarket('sz000001')).toBe('sz')
      expect(client.detectMarket('SZ000001')).toBe('sz')
    })

    it('should detect hk market with prefix', () => {
      expect(client.detectMarket('hk00700')).toBe('hk')
      expect(client.detectMarket('HK00700')).toBe('hk')
    })

    it('should detect us market with prefix', () => {
      expect(client.detectMarket('usAAPL')).toBe('us')
      expect(client.detectMarket('USTSLA')).toBe('us')
    })

    it('should detect market by code pattern - sh', () => {
      expect(client.detectMarket('600519')).toBe('sh')
      expect(client.detectMarket('601318')).toBe('sh')
    })

    it('should detect market by code pattern - sz', () => {
      expect(client.detectMarket('000001')).toBe('sz')
      expect(client.detectMarket('300750')).toBe('sz')
    })

    it('should detect market by code pattern - hk (5 digits)', () => {
      expect(client.detectMarket('00700')).toBe('hk')
      expect(client.detectMarket('09988')).toBe('hk')
    })

    it('should detect market by code pattern - us (letters)', () => {
      expect(client.detectMarket('AAPL')).toBe('us')
      expect(client.detectMarket('TSLA')).toBe('us')
    })
  })

  describe('formatCodeForSina', () => {
    it('should format sh code', () => {
      expect(client.formatCodeForSina('sh600519')).toBe('600519')
      expect(client.formatCodeForSina('600519')).toBe('600519')
    })

    it('should format sz code', () => {
      expect(client.formatCodeForSina('sz000001')).toBe('000001')
      expect(client.formatCodeForSina('000001')).toBe('000001')
    })

    it('should format hk code with padding', () => {
      expect(client.formatCodeForSina('hk00700')).toBe('00700')
      expect(client.formatCodeForSina('00700')).toBe('00700')
      expect(client.formatCodeForSina('700')).toBe('00700')
    })

    it('should format us code', () => {
      expect(client.formatCodeForSina('usAAPL')).toBe('AAPL')
      expect(client.formatCodeForSina('AAPL')).toBe('AAPL')
    })
  })

  describe('getSentimentLevel', () => {
    it('should return VERY_BULLISH for score >= 80', () => {
      expect(client.getSentimentLevel(80)).toBe(SentimentLevel.VERY_BULLISH)
      expect(client.getSentimentLevel(90)).toBe(SentimentLevel.VERY_BULLISH)
      expect(client.getSentimentLevel(100)).toBe(SentimentLevel.VERY_BULLISH)
    })

    it('should return BULLISH for score >= 60 and < 80', () => {
      expect(client.getSentimentLevel(60)).toBe(SentimentLevel.BULLISH)
      expect(client.getSentimentLevel(70)).toBe(SentimentLevel.BULLISH)
      expect(client.getSentimentLevel(79)).toBe(SentimentLevel.BULLISH)
    })

    it('should return NEUTRAL for score >= 40 and < 60', () => {
      expect(client.getSentimentLevel(40)).toBe(SentimentLevel.NEUTRAL)
      expect(client.getSentimentLevel(50)).toBe(SentimentLevel.NEUTRAL)
      expect(client.getSentimentLevel(59)).toBe(SentimentLevel.NEUTRAL)
    })

    it('should return BEARISH for score >= 20 and < 40', () => {
      expect(client.getSentimentLevel(20)).toBe(SentimentLevel.BEARISH)
      expect(client.getSentimentLevel(30)).toBe(SentimentLevel.BEARISH)
      expect(client.getSentimentLevel(39)).toBe(SentimentLevel.BEARISH)
    })

    it('should return VERY_BEARISH for score < 20', () => {
      expect(client.getSentimentLevel(0)).toBe(SentimentLevel.VERY_BEARISH)
      expect(client.getSentimentLevel(10)).toBe(SentimentLevel.VERY_BEARISH)
      expect(client.getSentimentLevel(19)).toBe(SentimentLevel.VERY_BEARISH)
    })
  })

  describe('config weights', () => {
    it('should use default weights', () => {
      const defaultClient = new SentimentClient()
      expect((defaultClient as any).newsWeight).toBe(0.4)
      expect((defaultClient as any).priceWeight).toBe(0.3)
      expect((defaultClient as any).volumeWeight).toBe(0.3)
    })

    it('should accept custom weights', () => {
      const customClient = new SentimentClient({
        newsWeight: 0.5,
        priceWeight: 0.3,
        volumeWeight: 0.2
      })
      expect((customClient as any).newsWeight).toBe(0.5)
      expect((customClient as any).priceWeight).toBe(0.3)
      expect((customClient as any).volumeWeight).toBe(0.2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty code', () => {
      expect(client.detectMarket('')).toBe('sh')
    })

    it('should handle code with special characters', () => {
      expect(client.formatCodeForSina('sh-600519')).toBe('600519')
    })

    it('should handle lowercase code', () => {
      expect(client.detectMarket('aapl')).toBe('us')
    })
    
    it('should handle short HK code', () => {
      expect(client.detectMarket('700')).toBe('hk')
      expect(client.formatCodeForSina('700')).toBe('00700')
    })
    
    it('should handle 4-digit HK code', () => {
      expect(client.detectMarket('1234')).toBe('hk')
      expect(client.formatCodeForSina('1234')).toBe('01234')
    })
    
    it('should handle 3-digit HK code', () => {
      expect(client.detectMarket('1')).toBe('hk')
      expect(client.formatCodeForSina('1')).toBe('00001')
    })
    
    it('should handle code with multiple special characters', () => {
      expect(client.formatCodeForSina('sh_600-519')).toBe('600519')
      expect(client.formatCodeForSina('hk.00700')).toBe('00700')
    })
    
    it('should handle whitespace in code', () => {
      expect(client.formatCodeForSina(' sh600519 ')).toBe('600519')
    })
  })

  describe('sentiment level boundaries', () => {
    it('should handle boundary score 79', () => {
      expect(client.getSentimentLevel(79)).toBe(SentimentLevel.BULLISH)
    })

    it('should handle boundary score 80', () => {
      expect(client.getSentimentLevel(80)).toBe(SentimentLevel.VERY_BULLISH)
    })

    it('should handle boundary score 59', () => {
      expect(client.getSentimentLevel(59)).toBe(SentimentLevel.NEUTRAL)
    })

    it('should handle boundary score 60', () => {
      expect(client.getSentimentLevel(60)).toBe(SentimentLevel.BULLISH)
    })

    it('should handle boundary score 39', () => {
      expect(client.getSentimentLevel(39)).toBe(SentimentLevel.BEARISH)
    })

    it('should handle boundary score 40', () => {
      expect(client.getSentimentLevel(40)).toBe(SentimentLevel.NEUTRAL)
    })

    it('should handle boundary score 19', () => {
      expect(client.getSentimentLevel(19)).toBe(SentimentLevel.VERY_BEARISH)
    })

    it('should handle boundary score 20', () => {
      expect(client.getSentimentLevel(20)).toBe(SentimentLevel.BEARISH)
    })
  })

  describe('market detection priority', () => {
    it('should prioritize prefix over pattern', () => {
      expect(client.detectMarket('hk600519')).toBe('hk')
      expect(client.detectMarket('us000001')).toBe('us')
    })

    it('should detect 6-digit sh codes starting with 6', () => {
      expect(client.detectMarket('600000')).toBe('sh')
      expect(client.detectMarket('689000')).toBe('sh')
    })

    it('should detect 6-digit sz codes starting with 0 or 3', () => {
      expect(client.detectMarket('000001')).toBe('sz')
      expect(client.detectMarket('300001')).toBe('sz')
      expect(client.detectMarket('002001')).toBe('sz')
    })
  })

  describe('weight validation', () => {
    it('should handle zero weights', () => {
      const zeroClient = new SentimentClient({
        newsWeight: 0,
        priceWeight: 0,
        volumeWeight: 0
      })
      expect((zeroClient as any).newsWeight).toBe(0)
      expect((zeroClient as any).priceWeight).toBe(0)
      expect((zeroClient as any).volumeWeight).toBe(0)
    })

    it('should handle unequal weights', () => {
      const unequalClient = new SentimentClient({
        newsWeight: 0.6,
        priceWeight: 0.3,
        volumeWeight: 0.1
      })
      expect((unequalClient as any).newsWeight).toBe(0.6)
      expect((unequalClient as any).priceWeight).toBe(0.3)
      expect((unequalClient as any).volumeWeight).toBe(0.1)
    })
  })

  describe('formatCodeForSina normalization', () => {
    it('should uppercase US codes', () => {
      expect(client.formatCodeForSina('aapl')).toBe('AAPL')
      expect(client.formatCodeForSina('tsla')).toBe('TSLA')
    })

    it('should preserve leading zeros for A-shares', () => {
      expect(client.formatCodeForSina('sh600519')).toBe('600519')
      expect(client.formatCodeForSina('sz000001')).toBe('000001')
    })
  })
})