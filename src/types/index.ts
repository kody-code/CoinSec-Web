export interface UserInfo {
  userId: number
  username: string
  nickname: string
  avatar: string | null
  createTime: string
  defaultExpenseAccountId?: number | null
  defaultIncomeAccountId?: number | null
}

export interface AuthResponse {
  userId: number
  token: string
  userInfo: {
    username: string
    nickname: string
  }
}

export interface Category {
  categoryId: number
  name: string
  type: 'income' | 'expense'
  icon: string
  sort: number
}

export interface Account {
  accountId: number
  name: string
  icon: string
  balance: number
  status: number
}

export interface RecordItem {
  recordId: number
  categoryId: number
  categoryName: string
  accountId: number
  accountName: string
  type: 'income' | 'expense'
  amount: number
  remark: string
  recordTime: string
  tagIds?: number[]
}

export interface Transfer {
  transferId: number
  fromAccountId: number
  fromAccountName: string
  toAccountId: number
  toAccountName: string
  amount: number
  remark: string
  transferTime: string
}

export interface CategoryStat {
  categoryId: number
  categoryName: string
  type: string
  total: number
  count: number
}

export interface Statistics {
  totalIncome: number
  totalExpense: number
  categoryStats: CategoryStat[]
}

export interface Tag {
  tagId: number
  name: string
  color: string
}

export interface Budget {
  budgetId: number
  categoryId: number
  categoryName: string
  budgetAmount: number
  periodType: 'MONTHLY' | 'YEARLY'
  periodYear: number
  periodMonth?: number | null
}

export interface BudgetOverview {
  budgetId: number
  categoryId: number
  categoryName: string
  budgetAmount: number
  spentAmount: number
  remaining: number
  percentage: number
}

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ApiResult<T> {
  code: number
  msg: string
  data: T
}
