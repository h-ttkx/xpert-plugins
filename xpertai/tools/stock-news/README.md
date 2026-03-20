# @xpert-ai/plugin-stock-news

股票新闻工具集插件 - 获取A股和港股新闻、公告和新闻时间线

## 功能概述

本插件提供以下核心功能：

- **新闻查询**: 获取股票相关新闻，支持来源去重和时间标准化
- **公告查询**: 获取公司公告信息
- **新闻时间线**: 按时间线展示新闻和公告

## 工具列表

### stock_news_latest

获取股票最新新闻

**参数**:
- `codes` (string[]): 股票代码列表，如 ['600519', '000001']
- `maxItems` (number, 可选): 最大返回条数，默认20
- `timeWindow` (number, 可选): 时间窗口（天），默认7

**返回**:
```json
{
  "news": [
    {
      "title": "新闻标题",
      "summary": "新闻摘要",
      "source": "新浪财经",
      "publishTime": "2026-03-02 10:30:00",
      "url": "https://...",
      "sentiment": "positive",
      "relevance": 0.95
    }
  ]
}
```

### stock_announcements

获取股票公告列表

**参数**:
- `code` (string): 股票代码
- `type` (string, 可选): 公告类型，如 '业绩预告', '重大事项'
- `maxItems` (number, 可选): 最大返回条数，默认10

**返回**:
```json
{
  "announcements": [
    {
      "code": "600519",
      "title": "公告标题",
      "type": "业绩预告",
      "publishTime": "2026-03-02",
      "url": "https://...",
      "summary": "公告摘要"
    }
  ]
}
```

### stock_news_timeline

获取股票新闻时间线

**参数**:
- `code` (string): 股票代码
- `startDate` (string, 可选): 开始日期，格式 YYYY-MM-DD
- `endDate` (string, 可选): 结束日期，格式 YYYY-MM-DD

**返回**:
```json
{
  "code": "600519",
  "date": "2026-03-02",
  "news": [...],
  "announcements": [...]
}
```

## 配置说明

插件支持以下配置项：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| source | string | 'sina' | 数据源，可选 sina/eastmoney/tencent |
| maxItems | number | 20 | 默认最大返回条数 |
| timeWindow | number | 7 | 默认时间窗口（天） |

## 安装使用

```bash
# 编译插件
cd xpert-plugins/xpertai
corepack pnpm -C tools/stock-news exec tsc -p tsconfig.lib.json

# 安装到平台
curl -X POST http://127.0.0.1:3000/api/plugin \
  -H "Authorization: Bearer <token>" \
  -H "tenant-id: <tenant-id>" \
  -H "organization-id: <organization-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "pluginName":"@xpert-ai/plugin-stock-news",
    "source":"code",
    "workspacePath":"/path/to/xpert-plugins/xpertai/tools/stock-news"
  }'
```

## 数据来源

- 新浪财经 (sina)
- 东方财富 (eastmoney)
- 腾讯财经 (tencent)

## 注意事项

1. 免费接口有访问频率限制，建议合理设置缓存
2. 不同数据源的返回格式可能略有差异
3. 新闻数据仅供参考，不构成投资建议