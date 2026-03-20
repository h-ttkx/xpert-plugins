# @xpert-ai/plugin-stock-screener

股票筛选插件 - 根据条件筛选股票

## 功能

- 按市值筛选
- 按行业筛选
- 按财务指标筛选
- 按技术指标筛选

## 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| source | string | 'eastmoney' | 数据源 |
| maxItems | number | 50 | 最大返回条数 |
| timeout | number | 5000 | 请求超时时间(毫秒) |

## 工具列表

- `stock_screen_by_market_cap` - 按市值筛选股票
- `stock_screen_by_industry` - 按行业筛选股票
- `stock_screen_by_metrics` - 按财务/技术指标筛选股票

## 使用示例

```typescript
// 按市值筛选
{
  "tool": "stock_screen_by_market_cap",
  "input": {
    "market": "SH",
    "minCap": 1000000000,
    "maxCap": 10000000000
  }
}

// 按行业筛选
{
  "tool": "stock_screen_by_industry",
  "input": {
    "industry": "电子",
    "maxItems": 20
  }
}
```