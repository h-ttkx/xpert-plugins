import { NewsClient } from './news-client'
import axios from 'axios'

describe('NewsClient', () => {
  let client: NewsClient

  beforeEach(() => {
    client = new NewsClient()
  })

  describe('detectMarket', () => {
    it('should return SH for Shanghai A-share codes (6开头)', () => {
      expect(client.detectMarket('600519')).toBe('sh')
      expect(client.detectMarket('601318')).toBe('sh')
    })

    it('should return SZ for Shenzhen A-share codes (0/3开头)', () => {
      expect(client.detectMarket('000001')).toBe('sz')
      expect(client.detectMarket('300750')).toBe('sz')
    })

    it('should return HK for Hong Kong stock codes (5位数字)', () => {
      expect(client.detectMarket('00700')).toBe('hk')
      expect(client.detectMarket('09988')).toBe('hk')
    })

    it('should return US for letter-based codes', () => {
      expect(client.detectMarket('AAPL')).toBe('us')
      expect(client.detectMarket('TSLA')).toBe('us')
    })

    it('should handle codes with prefix', () => {
      expect(client.detectMarket('sh600519')).toBe('sh')
      expect(client.detectMarket('sz000001')).toBe('sz')
      expect(client.detectMarket('hk00700')).toBe('hk')
    })
  })

  describe('formatCodeForSina', () => {
    it('should format Shanghai codes', () => {
      expect(client.formatCodeForSina('600519')).toBe('600519')
      expect(client.formatCodeForSina('sh600519')).toBe('600519')
    })

    it('should format Shenzhen codes', () => {
      expect(client.formatCodeForSina('000001')).toBe('000001')
      expect(client.formatCodeForSina('sz000001')).toBe('000001')
    })

    it('should format HK codes', () => {
      expect(client.formatCodeForSina('00700')).toBe('00700')
      expect(client.formatCodeForSina('hk00700')).toBe('00700')
      expect(client.formatCodeForSina('700')).toBe('00700')
    })
  })

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const result = (client as any).analyzeSentiment('股价上涨，创新高，利好消息')
      expect(result).toBe('positive')
    })

    it('should detect negative sentiment', () => {
      const result = (client as any).analyzeSentiment('股价下跌，利空消息，大跌')
      expect(result).toBe('negative')
    })

    it('should return neutral for mixed content', () => {
      const result = (client as any).analyzeSentiment('公司发布公告')
      expect(result).toBe('neutral')
    })
  })

  describe('data fallback and filtering', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should filter announcements to the requested stock code', async () => {
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          data: {
            list: [
              {
                title: '贵州茅台关于业绩说明会的公告',
                ann_type_name: '公告',
                notice_date: '2026-03-01',
                codes: [{ stock_code: '600519' }]
              },
              {
                title: '其他公司公告',
                ann_type_name: '公告',
                notice_date: '2026-03-01',
                codes: [{ stock_code: '000001' }]
              }
            ]
          }
        }
      } as any)

      const items = await client.fetchAnnouncements('600519', 10)
      expect(items.length).toBe(1)
      expect(items[0].title).toContain('贵州茅台')
    })

    it('should fallback latest news from announcements when Sina feed has no rows', async () => {
      jest.spyOn(axios, 'get')
        .mockResolvedValueOnce({
          data: {
            data: {
              list: []
            }
          }
        } as any)
        .mockResolvedValueOnce({
          data: {
            data: {
              list: [
                {
                  title: '贵州茅台公告',
                  ann_type_name: '公告',
                  notice_date: '2026-03-01',
                  codes: [{ stock_code: '600519' }]
                }
              ]
            }
          }
        } as any)

      const news = await client.fetchLatestNews('600519', 5)
      expect(news.length).toBe(1)
      expect(news[0].source).toBe('东方财富公告')
      expect(news[0].title).toContain('贵州茅台')
    })
  })
})
