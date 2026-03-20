# @xpert-ai/plugin-stock-sentiment

股票情绪分析插件，提供股票市场情绪分析和评分功能。

## 功能特性

- 📊 **情绪评分**: 综合新闻、价格、成交量等多维度计算情绪分数
- 📈 **情绪趋势**: 追踪情绪变化趋势
- 🔍 **情绪因子**: 分析影响情绪的关键因素
- ⚠️ **风险提示**: 提供情绪极端情况下的风险预警

## 支持市场

- 🇨🇳 A股市场 (上海、深圳)
- 🇭🇰 港股市场
- 🇺🇸 美股市场 (部分支持)

## 工具列表

### 1. stock_sentiment_summary

获取股票情绪摘要，包括综合评分、情绪因子和风险提示。

**参数**:
- `code` (string): 股票代码，如 "600519"、"00700"
- `days` (number, 可选): 时间窗口（天数），默认7天

**返回示例**:
```json
{
  "code": "600519",
  "name": "贵州茅台",
  "overallScore": {
    "score": 72,
    "level": "bullish",
    "confidence": 0.85
  },
  "factors": [
    {
      "name": "news_sentiment",
      "weight": 0.4,
      "score": 75,
      "description": "新闻情绪偏向积极"
    }
  ],
  "newsCount": 15,
  "positiveCount": 10,
  "negativeCount": 3,
  "neutralCount": 2
}
```

### 2. stock_sentiment_score

获取单个股票的快速情绪评分。

**参数**:
- `code` (string): 股票代码

**返回示例**:
```json
{
  "code": "600519",
  "score": 72,
  "level": "bullish",
  "confidence": 0.85,
  "timestamp": "2026-03-02T03:00:00Z"
}
```

## 安装

```bash
npm install @xpert-ai/plugin-stock-sentiment
```

## 使用方法

### 在 Xpert 平台中使用

1. 在插件市场安装 `@xpert-ai/plugin-stock-sentiment`
2. 在 Agent 中调用工具

### 配置选项

```typescript
{
  source: 'sina',        // 数据源: sina, eastmoney, tushare
  scoreRange: [0, 100],  // 评分范围
  newsWeight: 0.4,       // 新闻权重
  priceWeight: 0.3,      // 价格权重
  volumeWeight: 0.3      // 成交量权重
}
```

## 数据来源

- 新浪财经: 新闻情绪、舆情数据
- 东方财富: 资金流向、市场热度
- Tushare: 财务数据、分析师评级

## 情绪评分说明

| 分数范围 | 情绪等级 | 说明 |
|---------|---------|------|
| 80-100 | very_bullish | 极度乐观 |
| 60-79 | bullish | 乐观 |
| 40-59 | neutral | 中性 |
| 20-39 | bearish | 悲观 |
| 0-19 | very_bearish | 极度悲观 |

## 注意事项

⚠️ **风险提示**: 情绪分析仅供参考，不构成投资建议。市场有风险，投资需谨慎。

📊 **数据延迟**: 情绪数据可能存在延迟，请结合实时行情综合判断。

## License

MIT