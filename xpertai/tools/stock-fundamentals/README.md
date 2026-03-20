# @xpert-ai/plugin-stock-fundamentals

Stock fundamentals plugin for XpertAI platform - comprehensive financial data including financial statements, valuation metrics, and financial ratios.

## Features

- **Financial Statements**: Balance sheet, income statement, and cash flow statement
- **Valuation Metrics**: PE, PB, PS, PEG, EV/EBITDA, and more
- **Financial Ratios**: Profitability, liquidity, leverage, efficiency, and growth ratios
- **Multi-Market Support**: A-shares (Shanghai/Shenzhen), Hong Kong stocks
- **Data Quality Indicators**: Confidence levels for financial data
- **Fallback Strategy**: Automatic fallback between data sources

## Installation

```bash
npm install @xpert-ai/plugin-stock-fundamentals
```

## Configuration

The plugin supports the following configuration options:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dataSource` | `eastmoney` \| `sina` | `eastmoney` | Financial data source |
| `market` | `cn` \| `hk` \| `us` | `cn` | Target market |
| `timeout` | number | 10000 | Request timeout in milliseconds |
| `fallbackEnabled` | boolean | true | Enable automatic fallback to alternative data sources |

## Tools

### stock_fundamentals
Get comprehensive financial fundamentals for a stock including:
- Balance Sheet (assets, liabilities, equity)
- Income Statement (revenue, net income, EPS)
- Cash Flow (operating, investing, financing)
- Key financial metrics

**Parameters:**
- `code` (string): Stock code (e.g., "600519", "00700")
- `market` (string, optional): Market type (sh/sz/hk)
- `reportType` (string, optional): "annual" or "quarterly"

### stock_valuation_snapshot
Get valuation metrics for a stock:
- PE Ratio (Price-to-Earnings)
- PB Ratio (Price-to-Book)
- PS Ratio (Price-to-Sales)
- PEG Ratio
- EV/EBITDA
- Dividend Yield
- Market Capitalization

**Parameters:**
- `code` (string): Stock code
- `market` (string, optional): Market type

## Usage Example

```typescript
import plugin from '@xpert-ai/plugin-stock-fundamentals'

// In your XpertAI platform configuration
{
  plugins: [
    {
      name: '@xpert-ai/plugin-stock-fundamentals',
      config: {
        dataSource: 'eastmoney',
        market: 'cn',
        timeout: 10000,
        fallbackEnabled: true
      }
    }
  ]
}
```

## Data Sources

### East Money (东方财富)
- Primary source for A-shares fundamentals
- Comprehensive financial statements
- Real-time valuation metrics
- High data quality

### Sina Finance (新浪财经)
- Fallback data source
- Basic fundamental data
- Limited historical data

## Output Format

### Financial Summary
```json
{
  "code": "600519",
  "name": "贵州茅台",
  "market": "sh",
  "lastUpdate": "2026-03-02",
  "valuation": {
    "pe": 25.6,
    "pb": 8.2,
    "marketCap": 2100000000000
  },
  "profitability": {
    "roe": 0.285,
    "roa": 0.152,
    "netMargin": 0.52
  },
  "growth": {
    "revenueGrowth": 0.15,
    "earningsGrowth": 0.18
  },
  "financialHealth": {
    "debtToEquity": 0.25,
    "currentRatio": 4.5
  },
  "dataSource": "eastmoney",
  "dataQuality": "high",
  "disclaimer": "Data for reference only, not investment advice"
}
```

## Error Handling

The plugin implements comprehensive error handling:
- Invalid stock codes return clear error messages
- Missing data fields are marked as `null`
- Network failures trigger fallback to alternative sources
- Rate limiting is handled with automatic retries

## Disclaimer

Financial data provided by this plugin is for reference only and should not be considered as investment advice. Always verify data from official sources before making investment decisions.

## License

MIT

## Author

XpertAI Team