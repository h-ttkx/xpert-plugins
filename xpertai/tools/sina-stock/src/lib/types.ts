/**
 * 新浪财经股票工具集类型定义
 */

// 插件名称常量
export const SinaStock = 'sina-stock'

// 股票市场类型
export enum StockMarket {
  SH = 'sh', // 上海证券交易所
  SZ = 'sz', // 深圳证券交易所
  HK = 'hk', // 港股
}

// 股票行情数据接口
export interface StockQuote {
  code: string           // 股票代码
  name: string           // 股票名称
  price: number          // 当前价格
  open: number           // 开盘价
  high: number           // 最高价
  low: number            // 最低价
  preClose: number       // 昨收价
  volume: number         // 成交量（股）
  amount: number         // 成交额（元）
  change: number         // 涨跌额
  changePercent: number  // 涨跌幅（%）
  time: string           // 数据时间
  market: StockMarket    // 市场
}

// 新浪财经原始数据字段映射
export interface SinaRawQuote {
  code: string
  data: string[]  // 新浪返回的逗号分隔数据
}

// 插件图标（股票图标）
export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNGE5MGUyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHBvbHlsaW5lIHBvaW50cz0iMjIgMTIgMTggMTIgMTUgMjEgOSAzIDEyIDkgNiA5Ij48L3BvbHlsaW5lPgogIDxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIj48L2xpbmU+Cjwvc3ZnPg==`