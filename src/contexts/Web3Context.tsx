import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useToast } from '@chakra-ui/react'
import CarbonCreditSystemABI from '../contracts/CarbonCreditSystem.json'

// 定义用户角色类型
export enum UserRole {
  User = 0,
  Verifier = 1
}

// 定义上下文类型
interface Web3ContextType {
  account: string | null
  chainId: number | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  contract: any | null
  connectWallet: () => Promise<void>
  isConnecting: boolean
  resetConnection: () => void
  userRole: UserRole
  switchRole: (role: UserRole) => void
  isVerifier: boolean
  verifierAddress: string
}

// 创建上下文
const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  contract: null,
  connectWallet: async () => {},
  isConnecting: false,
  resetConnection: () => {},
  userRole: UserRole.User,
  switchRole: () => {},
  isVerifier: false,
  verifierAddress: '0xe36013952aeF04fA8d3F8EbFd52cA53D58020ee4'
})

// 自定义钩子，用于访问上下文
export const useWeb3 = () => useContext(Web3Context)

interface Web3ProviderProps {
  children: ReactNode
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<any | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(UserRole.User)
  
  const toast = useToast()
  
  // 验证者地址
  const verifierAddress = '0xe36013952aeF04fA8d3F8EbFd52cA53D58020ee4'
  
  // 合约地址
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890'
  
  // 检查账户的角色
  const checkUserRole = (address: string): UserRole => {
    if (address.toLowerCase() === verifierAddress.toLowerCase()) {
      return UserRole.Verifier
    }
    return UserRole.User
  }
  
  // 切换用户角色
  const switchRole = (role: UserRole) => {
    // 只有验证者可以切换角色
    if (account?.toLowerCase() === verifierAddress.toLowerCase()) {
      setUserRole(role)
      toast({
        title: '角色已切换',
        description: `您现在的角色是: ${role === UserRole.Verifier ? '审核者' : '普通用户'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: '角色切换失败',
        description: '您没有权限切换到该角色',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }
  
  // 重置连接状态
  const resetConnection = () => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setConnectionError(null)
    setUserRole(UserRole.User)
    
    // 清除本地存储中的连接状态
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('userRole')
    
    toast({
      title: '连接已重置',
      description: '您可以重新尝试连接钱包',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }
  
  // 连接钱包
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: '未检测到钱包',
        description: '请安装 MetaMask 或其他兼容的钱包',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      // 请求账户访问
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      
      // 尝试获取账户，如果用户拒绝会抛出异常
      const accounts = await browserProvider.send('eth_requestAccounts', [])
      
      if (accounts.length > 0) {
        const userAccount = accounts[0]
        const userSigner = await browserProvider.getSigner()
        const networkData = await browserProvider.getNetwork()
        const chainIdentifier = Number(networkData.chainId)
        
        setAccount(userAccount)
        setChainId(chainIdentifier)
        setProvider(browserProvider)
        setSigner(userSigner)
        
        // 检查角色
        const role = checkUserRole(userAccount)
        setUserRole(role)
        
        // 保存角色到本地存储
        localStorage.setItem('userRole', role.toString())
        
        // 初始化合约
        try {
          // 简化合约初始化，仅保存ABI和地址信息
          const carbonContract = new ethers.Contract(
            contractAddress,
            CarbonCreditSystemABI,
            userSigner
          )
          setContract(carbonContract)
          
          // 保存连接状态到本地存储
          localStorage.setItem('walletConnected', 'true')
          
          toast({
            title: '钱包已连接',
            description: `已连接到账户: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}，角色: ${role === UserRole.Verifier ? '审核者' : '普通用户'}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } catch (contractError) {
          console.error('合约初始化失败:', contractError)
          toast({
            title: '合约初始化失败',
            description: '连接成功但合约初始化失败，部分功能可能不可用',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error)
      setConnectionError(error.message || '未知错误')
      
      // 检查是否是用户拒绝连接
      if (error.code === 4001) {
        toast({
          title: '连接被拒绝',
          description: '您拒绝了钱包连接请求',
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: '连接失败',
          description: `连接钱包时发生错误: ${error.message || '未知错误'}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }
  
  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          // 当账户变化时，需要更新signer和用户角色
          if (provider) {
            provider.getSigner().then(newSigner => {
              setSigner(newSigner)
              const role = checkUserRole(accounts[0])
              setUserRole(role)
              localStorage.setItem('userRole', role.toString())
            }).catch(error => {
              console.error('获取新签名者失败:', error)
            })
          }
        } else {
          // 用户在MetaMask中断开了连接
          setAccount(null)
          setSigner(null)
          setContract(null)
          setUserRole(UserRole.User)
          localStorage.removeItem('walletConnected')
          localStorage.removeItem('userRole')
          
          toast({
            title: '钱包已断开',
            description: '您的钱包连接已断开',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      }
      
      const handleChainChanged = (chainId: string) => {
        setChainId(Number(chainId))
        
        toast({
          title: '网络已更改',
          description: '区块链网络已更改，页面将刷新',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
        
        // 网络变化时刷新页面以确保所有状态正确更新
        window.location.reload()
      }
      
      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log('MetaMask断开连接:', error)
        resetConnection()
      }
      
      // 添加事件监听器
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      window.ethereum.on('disconnect', handleDisconnect)
      
      // 清理函数
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
          window.ethereum.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [toast, provider])
  
  // 自动连接钱包（如果之前已连接）
  useEffect(() => {
    const autoConnect = async () => {
      // 检查本地存储中的连接状态
      const wasConnected = localStorage.getItem('walletConnected') === 'true'
      
      if (wasConnected && window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await browserProvider.listAccounts()
          
          if (accounts.length > 0) {
            const userAccount = accounts[0].address
            const userSigner = await browserProvider.getSigner()
            const networkData = await browserProvider.getNetwork()
            const chainIdentifier = Number(networkData.chainId)
            
            setAccount(userAccount)
            setChainId(chainIdentifier)
            setProvider(browserProvider)
            setSigner(userSigner)
            
            // 恢复用户角色
            const savedRole = localStorage.getItem('userRole')
            if (savedRole) {
              setUserRole(Number(savedRole) as UserRole)
            } else {
              const role = checkUserRole(userAccount)
              setUserRole(role)
              localStorage.setItem('userRole', role.toString())
            }
            
            // 初始化合约
            try {
              // 简化合约初始化，仅保存ABI和地址信息
              const carbonContract = new ethers.Contract(
                contractAddress,
                CarbonCreditSystemABI,
                userSigner
              )
              setContract(carbonContract)
              
              console.log('钱包自动连接成功')
            } catch (contractError) {
              console.error('合约初始化失败:', contractError)
            }
          } else {
            // 没有可用账户，清除连接状态
            localStorage.removeItem('walletConnected')
            localStorage.removeItem('userRole')
          }
        } catch (error) {
          console.error('自动连接失败:', error)
          localStorage.removeItem('walletConnected')
          localStorage.removeItem('userRole')
        }
      }
    }
    
    autoConnect()
  }, [])
  
  // 计算衍生状态
  const isVerifier = userRole === UserRole.Verifier
  
  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        contract,
        connectWallet,
        isConnecting,
        resetConnection,
        userRole,
        switchRole,
        isVerifier,
        verifierAddress
      }}
    >
      {children}
    </Web3Context.Provider>
  )
} 