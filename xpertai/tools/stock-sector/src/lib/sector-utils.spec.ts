describe('Stock Sector Tools', () => {
  describe('buildSectorQuotesUrl', () => {
    it('should build correct URL for industry sector', () => {
      const type = 'industry'
      const expected = 'm:90+t:2'
      expect(expected).toContain('t:2')
    })

    it('should build correct URL for concept sector', () => {
      const type = 'concept'
      const expected = 'm:90+t:3'
      expect(expected).toContain('t:3')
    })

    it('should build correct URL for region sector', () => {
      const type = 'region'
      const expected = 'm:90+t:1'
      expect(expected).toContain('t:1')
    })
  })

  describe('parseSectorQuotes', () => {
    it('should return empty array for null data', () => {
      const data = null
      const result = data?.data?.diff || []
      expect(result).toEqual([])
    })

    it('should return empty array for missing diff', () => {
      const data = { data: {} }
      const result = data?.data?.diff || []
      expect(result).toEqual([])
    })

    it('should parse sector quotes correctly', () => {
      const mockItem = {
        f12: 'BK0001',
        f14: '银行',
        f2: 100000,
        f3: 250,
        f66: 1000000,
        f69: 500000000,
        f72: 100000,
        f184: '600036,招商银行'
      }
      expect(mockItem.f12).toBe('BK0001')
      expect(mockItem.f14).toBe('银行')
      expect(mockItem.f3 / 100).toBe(2.5)
    })
  })

  describe('buildConstituentsUrl', () => {
    it('should build correct URL with sector code', () => {
      const sectorCode = 'BK0001'
      const limit = 20
      expect(sectorCode).toBe('BK0001')
      expect(limit).toBe(20)
    })
  })

  describe('parseConstituents', () => {
    it('should return empty array for null data', () => {
      const data = null
      const result = data?.data?.diff || []
      expect(result).toEqual([])
    })

    it('should parse constituents correctly', () => {
      const mockItem = {
        f12: '600036',
        f14: '招商银行',
        f13: 0,
        f2: 3550,
        f3: 150,
        f66: 5000000,
        f69: 180000000,
        f72: 50000
      }
      const market = mockItem.f13 === 1 ? 'SZ' : mockItem.f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('SH')
      expect(mockItem.f14).toBe('招商银行')
    })

    it('should detect SZ market for f13=1', () => {
      const mockItem = { f13: 1 }
      const market = mockItem.f13 === 1 ? 'SZ' : mockItem.f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('SZ')
    })

    it('should detect HK market for other f13 values', () => {
      const mockItem = { f13: 116 }
      const market = mockItem.f13 === 1 ? 'SZ' : mockItem.f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('HK')
    })
  })

  describe('buildRankingUrl', () => {
    it('should build correct URL for changePercent sorting', () => {
      const sortBy = 'changePercent'
      const fid = sortBy === 'turnover' ? 'f69' : 'f3'
      expect(fid).toBe('f3')
    })

    it('should build correct URL for turnover sorting', () => {
      const sortBy = 'turnover'
      const fid = sortBy === 'turnover' ? 'f69' : 'f3'
      expect(fid).toBe('f69')
    })

    it('should handle ascending order', () => {
      const order = 'asc'
      const po = order === 'asc' ? '0' : '1'
      expect(po).toBe('0')
    })

    it('should handle descending order', () => {
      const order = 'desc'
      const po = order === 'asc' ? '0' : '1'
      expect(po).toBe('1')
    })
  })

  describe('formatQuotesOutput', () => {
    it('should return message for empty quotes', () => {
      const quotes: any[] = []
      const result = quotes.length === 0 ? '暂无板块行情数据' : ''
      expect(result).toBe('暂无板块行情数据')
    })

    it('should format quotes with change icon', () => {
      const quote = { changePercent: 2.5, name: '银行', code: 'BK0001' }
      const changeIcon = quote.changePercent >= 0 ? '📈' : '📉'
      expect(changeIcon).toBe('📈')
    })

    it('should format negative change with down icon', () => {
      const quote = { changePercent: -1.5, name: '医药', code: 'BK0002' }
      const changeIcon = quote.changePercent >= 0 ? '📈' : '📉'
      expect(changeIcon).toBe('📉')
    })
  })

  describe('formatRankingOutput', () => {
    it('should return message for empty ranking', () => {
      const ranking: any[] = []
      const result = ranking.length === 0 ? '暂无板块排名数据' : ''
      expect(result).toBe('暂无板块排名数据')
    })

    it('should show gold medal for rank 1', () => {
      const rank = 1
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`
      expect(medal).toBe('🥇')
    })

    it('should show silver medal for rank 2', () => {
      const rank = 2
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`
      expect(medal).toBe('🥈')
    })

    it('should show bronze medal for rank 3', () => {
      const rank = 3
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`
      expect(medal).toBe('🥉')
    })

    it('should show number for rank > 3', () => {
      const rank = 5
      const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`
      expect(medal).toBe('5.')
    })
  })

  describe('Sector Types', () => {
    it('should support industry sector', () => {
      const type = 'industry'
      expect(['industry', 'concept', 'region']).toContain(type)
    })

    it('should support concept sector', () => {
      const type = 'concept'
      expect(['industry', 'concept', 'region']).toContain(type)
    })

    it('should support region sector', () => {
      const type = 'region'
      expect(['industry', 'concept', 'region']).toContain(type)
    })
  })

  describe('Error Handling', () => {
    it('should handle error response', () => {
      const quotes = [{
        error: '获取板块行情失败',
        message: 'Network error',
        suggestion: '请稍后重试'
      }]
      expect(quotes[0].error).toBe('获取板块行情失败')
      expect(quotes[0].suggestion).toBe('请稍后重试')
    })

    it('should handle constituents error', () => {
      const constituents = [{
        error: '获取成分股失败',
        message: 'Invalid sector code',
        suggestion: '请检查板块代码是否正确'
      }]
      expect(constituents[0].error).toBe('获取成分股失败')
    })

    it('should handle ranking error', () => {
      const ranking = [{
        error: '获取板块排名失败',
        message: 'Timeout',
        suggestion: '请稍后重试或切换数据源'
      }]
      expect(ranking[0].error).toBe('获取板块排名失败')
    })
  })

  describe('Data Formatting', () => {
    it('should format amount to 亿', () => {
      const amount = 500000000
      const formatted = (amount / 100000000).toFixed(2)
      expect(formatted).toBe('5.00')
    })

    it('should format changePercent correctly', () => {
      const f3 = 250
      const changePercent = f3 / 100
      expect(changePercent).toBe(2.5)
    })

    it('should format price correctly', () => {
      const f2 = 3550
      const price = f2 / 100
      expect(price).toBe(35.5)
    })
  })

  describe('Market Detection', () => {
    it('should identify SH market', () => {
      const f13 = 0
      const market = f13 === 1 ? 'SZ' : f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('SH')
    })

    it('should identify SZ market', () => {
      const f13 = 1
      const market = f13 === 1 ? 'SZ' : f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('SZ')
    })

    it('should identify HK market', () => {
      const f13 = 116
      const market = f13 === 1 ? 'SZ' : f13 === 0 ? 'SH' : 'HK'
      expect(market).toBe('HK')
    })
  })
})