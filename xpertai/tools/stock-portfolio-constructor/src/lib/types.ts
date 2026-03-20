export const StockPortfolioConstructorProvider = 'stock-portfolio-constructor'

export interface CandidateSignal {
  code: string
  score: number
  expectedReturn?: number
  risk?: number
  industry?: string
  price?: number
}

export interface TargetWeight {
  code: string
  weight: number
  industry: string
  price?: number
  expectedReturn?: number
  score: number
}

export interface Position {
  code: string
  quantity: number
  price: number
}

export interface RebalanceOrder {
  code: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  estimatedAmount: number
}

export const icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxwYXRoIGQ9Ik03IDE0bDMgM2w3LTciLz48L3N2Zz4=`
