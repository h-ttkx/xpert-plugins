# @xpert-ai/plugin-stock-market

Comprehensive stock market data plugin for A-shares, Hong Kong, and US markets.

## Features

- **Real-time Quotes**: Get current stock prices, volume, and market data
- **K-line Charts**: Historical OHLCV data for technical analysis
- **Technical Indicators**: MA, MACD, RSI, KDJ calculations
- **Stock Search**: Search stocks by code or name
- **Multi-market Support**: A-shares (SH/SZ), Hong Kong, and US markets

## Installation

```bash
npm install @xpert-ai/plugin-stock-market
```

## Configuration

```typescript
{
  source: 'sina' | 'tencent',  // Data source (default: 'sina')
  timeout: 5000,                // Request timeout in ms
  cacheEnabled: true,           // Enable data caching
  cacheTTL: 300                 // Cache TTL in seconds
}
```

## Tools

### 1. stock_market_get_quote
Get real-time stock quotes.

**Parameters**:
- `code` (string, required): Stock code (e.g., "600519", "00700", "AAPL")
- `market` (enum, optional): Market type - "auto", "sh", "sz", "hk", "us" (default: "auto")

**Example**:
```typescript
// Get quote for 茅台
{ code: "600519" }

// Get quote for Tencent (HK)
{ code: "00700", market: "hk" }
```

### 2. stock_market_get_kline
Get K-line (candlestick) data.

**Parameters**:
- `code` (string, required): Stock code
- `period` (enum): "1d", "1w", "1m", "3m", "6m", "1y", "ytd"
- `market` (enum, optional): Market type

**Example**:
```typescript
{ code: "600519", period: "1m" }
```

### 3. stock_market_get_technical
Get technical indicators.

**Parameters**:
- `code` (string, required): Stock code
- `indicators` (array): List of indicators - "ma", "macd", "rsi", "kdj"
- `period` (enum, optional): Time period for calculation

**Example**:
```typescript
{ 
  code: "600519", 
  indicators: ["ma", "macd", "rsi"] 
}
```

### 4. stock_market_search
Search for stocks.

**Parameters**:
- `keyword` (string, required): Search keyword
- `market` (enum, optional): Filter by market

**Example**:
```typescript
{ keyword: "茅台" }
{ keyword: "Apple" }
```

## Data Sources

- **Primary**: Sina Finance (free, stable)
- **Backup**: Tencent Finance
- **HK/US**: Snowball / Yahoo Finance

## Error Handling

The plugin uses unified error codes:

| Code | Description |
|------|-------------|
| 1001 | Invalid stock code format |
| 2001 | Stock not found |
| 2002 | No data available |
| 3001 | API error |
| 3003 | Rate limit exceeded |

## Output Format

### Text Format (default)
```
【贵州茅台(600519)】
  当前价: 1690.00 元
  涨跌额: +12.00 元
  涨跌幅: +0.72%
  ...
```

### JSON Format
```json
{
  "success": true,
  "data": {
    "code": "600519",
    "name": "贵州茅台",
    "price": 1690.00,
    ...
  }
}
```

## License

MIT