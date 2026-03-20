# @xpert-ai/plugin-stock-sector

行业板块插件 - 提供A股行业板块、概念板块、地域板块的行情数据、成分股和排名功能

## 功能特性

- ✅ 板块行情查询（行业/概念/地域）
- ✅ 板块成分股列表
- ✅ 板块涨跌幅排名
- ✅ 支持A股市场

## 安装

```bash
npm install @xpert-ai/plugin-stock-sector
```

## 配置

```typescript
{
  source: 'eastmoney' | 'sina',  // 数据源（默认：eastmoney）
  timeout: 5000                   // 请求超时时间（毫秒，默认：5000）
}
```

## 工具说明

### 1. sector_quotes

获取板块实时行情数据

**参数**:
- `type`: 板块类型
  - `industry`: 行业板块
  - `concept`: 概念板块
  - `region`: 地域板块
- `market`: 市场筛选（可选）
  - `SH`: 上海
  - `SZ`: 深圳
  - `HK`: 香港

**示例**:
```typescript
{
  type: 'industry'
}
```

**返回**:
```json
[
  {
    "code": "BK0001",
    "name": "钢铁行业",
    "type": "industry",
    "change": 0.5,
    "changePercent": 1.23,
    "volume": 1234567,
    "amount": 9876543,
    "leadingStock": {
      "code": "600019",
      "name": "宝钢股份",
      "changePercent": 5.2
    }
  }
]
```

### 2. sector_constituents

获取板块成分股列表

**参数**:
- `sectorCode`: 板块代码
- `limit`: 返回数量限制（默认：20，最大：100）

**示例**:
```typescript
{
  sectorCode: 'BK0001',
  limit: 30
}
```

**返回**:
```json
[
  {
    "code": "600019",
    "name": "宝钢股份",
    "market": "SH",
    "weight": 0.15,
    "changePercent": 5.2
  }
]
```

### 3. sector_ranking

获取板块涨跌幅排名

**参数**:
- `type`: 板块类型
- `sortBy`: 排序字段（默认：changePercent）
  - `changePercent`: 按涨跌幅排序
  - `turnover`: 按成交额排序
- `limit`: 返回数量（默认：10，最大：50）

**示例**:
```typescript
{
  type: 'concept',
  sortBy: 'changePercent',
  limit: 10
}
```

**返回**:
```json
[
  {
    "rank": 1,
    "code": "BK0051",
    "name": "新能源",
    "type": "concept",
    "changePercent": 5.8,
    "turnover": 123456789
  }
]
```

## 数据源

- **东方财富**: 提供完整的板块数据（默认）
- **新浪财经**: 备用数据源

## 开发

```bash
# 编译
pnpm exec tsc -p tsconfig.lib.json

# 测试
pnpm exec jest -c jest.config.ts --runInBand
```

## 许可证

MIT