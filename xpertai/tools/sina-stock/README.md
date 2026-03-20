# Xpert Plugin: Sina Stock

## Overview

`@xpert-ai/plugin-sina-stock` is a stock quote plugin that enables XpertAI agents to fetch real-time A-share and Hong Kong stock data via the Sina Finance API. It provides free, no-API-key-required access to stock market data including prices, trading volume, and price changes.

## Features

- Fetches real-time stock quotes for A-shares (Shanghai and Shenzhen) and Hong Kong stocks
- Uses the free Sina Finance API - no API key required
- Supports multiple stock codes in a single request
- Returns formatted human-readable results including:
  - Current price
  - Price change and percentage
  - Open, high, low, previous close prices
  - Trading volume and amount
  - Update timestamp
- Provides two tools:
  - `sina_stock_quotes`: Get quotes for multiple stocks
  - `sina_stock_detail`: Get detailed quote for a single stock (JSON format)

## Installation

```bash
npm install @xpert-ai/plugin-sina-stock
```

> **Peer dependencies:** ensure the host environment already provides `@xpert-ai/plugin-sdk`, `@nestjs/common`, `@nestjs/config`, `@langchain/core`, `chalk`, and `zod` in the versions listed in `package.json`.

## Configuration

This plugin has no runtime configuration. The strategy publishes an empty JSON schema, so you can register the toolset without credentials or additional options.

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| _none_ | – | – | The sina-stock toolset works out of the box. |

## Usage

1. Add the plugin to the `PLUGINS` environment variable so that the XpertAI host loads it:

   ```bash
   PLUGINS=@xpert-ai/plugin-sina-stock
   ```

2. Create a toolset instance (via the XpertAI admin UI or API) referencing the `sina-stock` provider:

   ```jsonc
   {
     "provider": "sina-stock",
     "options": {}
   }
   ```

3. Once attached to an agent, the tools become available to the LLM.

### Stock Code Format

- **Shanghai A-shares**: `sh` + 6-digit code (e.g., `sh600519` for Kweichow Moutai)
- **Shenzhen A-shares**: `sz` + 6-digit code (e.g., `sz000001` for Ping An Bank)
- **Hong Kong stocks**: `hk` + 5-digit code (e.g., `hk00700` for Tencent)

### Example Usage

**Get multiple stock quotes:**
```
Input: 600519, 000001, 00700
Output:
【贵州茅台(sh600519)】
  当前价: 1688.00 元
  涨跌额: +10.00 元
  涨跌幅: +0.60%
  ...
```

**Get single stock detail:**
```
Input: 600519
Output: (JSON format with all stock details)
```

## Sina Finance API

This plugin uses the free Sina Finance API:

- **Endpoint**: `https://hq.sinajs.cn/list=sh600519,sz000001,hk00700`
- **Rate Limit**: Please respect reasonable usage limits
- **Data**: Real-time delayed data (15-30 minutes)

## Development

From the monorepo root (`xpertai/`), use Nx to build or test:

```bash
npx nx build @xpert-ai/plugin-sina-stock
npx nx test @xpert-ai/plugin-sina-stock
```

Or directly:

```bash
cd tools/sina-stock
corepack pnpm exec tsc -p tsconfig.lib.json
corepack pnpm exec jest -c jest.config.ts
```

## License

MIT – see the repository root `LICENSE`.