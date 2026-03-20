export const StockBacktestSimProvider = 'stock-backtest-sim'

export interface PricePoint {
  date: string
  close: number
}

export interface SymbolSeries {
  code: string
  prices: PricePoint[]
}

export interface Holding {
  code: string
  quantity: number
}

export interface StressPosition {
  code: string
  quantity: number
  price: number
  beta?: number
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBhMzdmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyAxNyA5IDExIDEzIDE1IDIxIDciLz48L3N2Zz4=`
