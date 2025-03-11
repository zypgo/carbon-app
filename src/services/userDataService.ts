import { ethers } from 'ethers'

export interface Transaction {
  id: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  date: string
  counterparty: string
}

export interface UserData {
  balance: number
  transactions: Transaction[]
}

// 初始化用户数据
const initUserData = (): UserData => {
  return {
    balance: 100, // 初始余额
    transactions: []
  }
}

// 从本地存储获取用户数据
export const getUserData = (account: string): UserData => {
  if (!account) return initUserData()
  
  const storageKey = `userData_${account}`
  const storedData = localStorage.getItem(storageKey)
  
  if (storedData) {
    try {
      return JSON.parse(storedData)
    } catch (error) {
      console.error('解析用户数据失败:', error)
      return initUserData()
    }
  }
  
  return initUserData()
}

// 保存用户数据到本地存储
export const saveUserData = (account: string, data: UserData): void => {
  if (!account) return
  
  const storageKey = `userData_${account}`
  localStorage.setItem(storageKey, JSON.stringify(data))
}

// 记录交易
export const recordTransaction = (
  account: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number,
  counterparty: string
): void => {
  if (!account) return
  
  const userData = getUserData(account)
  
  // 创建新交易记录
  const newTransaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    amount,
    price,
    date: new Date().toISOString().split('T')[0],
    counterparty
  }
  
  // 更新余额
  if (type === 'buy') {
    userData.balance += amount
  } else if (type === 'sell') {
    userData.balance = Math.max(0, userData.balance - amount)
  }
  
  // 添加交易记录
  userData.transactions = [newTransaction, ...userData.transactions]
  
  // 保存更新后的数据
  saveUserData(account, userData)
}

// 获取用户余额
export const getUserBalance = (account: string): number => {
  if (!account) return 0
  return getUserData(account).balance
}

// 获取用户交易历史
export const getUserTransactions = (account: string): Transaction[] => {
  if (!account) return []
  return getUserData(account).transactions
} 