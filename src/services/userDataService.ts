import { ethers } from 'ethers'

export interface Transaction {
  id: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  date: string
  counterparty: string
  txHash?: string
  status?: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
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
  try {
    localStorage.setItem(storageKey, JSON.stringify(data))
    console.log(`成功保存用户数据到 ${storageKey}:`, data)
  } catch (error) {
    console.error('保存用户数据失败:', error)
  }
}

// 记录交易
export const recordTransaction = (
  account: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number,
  counterparty: string,
  txHash?: string,
  blockNumber?: number,
  status: 'pending' | 'confirmed' | 'failed' = 'confirmed'
): void => {
  if (!account) return
  
  console.log(`正在记录${type}交易:`, { account, amount, price, counterparty, txHash, status })
  
  const userData = getUserData(account)
  
  // 创建新交易记录
  const newTransaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    amount,
    price,
    date: new Date().toISOString(),
    counterparty,
    txHash,
    status,
    blockNumber
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
  
  console.log(`交易记录已保存，新余额：${userData.balance}`)
}

// 获取用户余额
export const getUserBalance = (account: string): number => {
  if (!account) return 0
  const userData = getUserData(account)
  console.log(`获取用户余额: ${userData.balance}`)
  return userData.balance
}

// 获取用户交易历史
export const getUserTransactions = (account: string): Transaction[] => {
  if (!account) return []
  const transactions = getUserData(account).transactions
  console.log(`获取用户交易历史: ${transactions.length}条记录`)
  return transactions
}

// 更新交易状态
export const updateTransactionStatus = (
  account: string,
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed',
  blockNumber?: number
): void => {
  if (!account) return
  
  const userData = getUserData(account)
  
  const updatedTransactions = userData.transactions.map(tx => {
    if (tx.id === transactionId) {
      return { ...tx, status, blockNumber }
    }
    return tx
  })
  
  userData.transactions = updatedTransactions
  saveUserData(account, userData)
}