import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useToast } from '@chakra-ui/react'
import CarbonCreditSystemContract from '../contracts/CarbonCreditSystem.json'
const CarbonCreditSystemABI = CarbonCreditSystemContract.abi

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
  connectionError: string | null
}

// 创建上下文
const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  contract: null,
  connectWallet: async () => { },
  isConnecting: false,
  resetConnection: () => { },
  userRole: UserRole.User,
  switchRole: () => { },
  isVerifier: false,
  verifierAddress: '0xe36013952aeF04fA8d3F8EbFd52cA53D58020ee4',
  connectionError: null
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

  // 合约地址和网络配置 - 仅支持Sepolia网络
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0xE8873bf3973FD0Ab479D9dE1bA75ce555F9F6859'
  
  // 调试：输出环境变量
  console.log('🔧 环境变量检查:')
  console.log('VITE_CONTRACT_ADDRESS:', import.meta.env.VITE_CONTRACT_ADDRESS)
  console.log('实际使用的合约地址:', contractAddress)
  const SEPOLIA_CHAIN_ID = 11155111
  
  // 多个备用RPC端点，避免API限制
  const SEPOLIA_RPC_URLS = [
    import.meta.env.VITE_SEPOLIA_RPC_URL,
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.gateway.tenderly.co',
    'https://rpc.sepolia.org',
    'https://rpc2.sepolia.org',
    'https://rpc.sepolia.dev',
    'https://1rpc.io/sepolia'
  ].filter(Boolean) // 过滤掉空值

  // 测试RPC端点连接性
  const testRpcEndpoint = async (rpcUrl: string): Promise<boolean> => {
    try {
      const testProvider = new ethers.JsonRpcProvider(rpcUrl)
      // 设置超时时间为5秒
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('连接超时')), 5000)
      )
      await Promise.race([testProvider.getBlockNumber(), timeoutPromise])
      return true
    } catch (error) {
      console.warn(`RPC端点 ${rpcUrl} 连接失败:`, error)
      return false
    }
  }

  // 获取可用的RPC端点
  const getWorkingRpcUrl = async (): Promise<string> => {
    console.log('🔍 正在测试RPC端点连接性...')
    for (const rpcUrl of SEPOLIA_RPC_URLS) {
      console.log(`测试RPC端点: ${rpcUrl}`)
      const isWorking = await testRpcEndpoint(rpcUrl!)
      if (isWorking) {
        console.log(`✅ 使用RPC端点: ${rpcUrl}`)
        return rpcUrl!
      }
    }
    console.warn('⚠️ 所有RPC端点都不可用，使用默认端点')
    return SEPOLIA_RPC_URLS[0] || 'https://ethereum-sepolia-rpc.publicnode.com'
  }

  // 检查并切换到Sepolia网络
  const switchToSepolia = async () => {
    if (!window.ethereum) return false

    try {
      // 尝试切换到Sepolia网络
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      })
      return true
    } catch (switchError: any) {
      // 如果网络不存在，尝试添加
      if (switchError.code === 4902) {
        try {
          const workingRpcUrl = await getWorkingRpcUrl()
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [workingRpcUrl],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          })
          return true
        } catch (addError) {
          console.error('添加Sepolia网络失败:', addError)
          return false
        }
      }
      console.error('切换到Sepolia网络失败:', switchError)
      return false
    }
  }

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

    // 防止重复连接
    if (isConnecting) {
      return
    }

    try {
      setIsConnecting(true)
      setConnectionError(null)

      // 优化：使用缓存的provider实例
      let browserProvider = provider
      if (!browserProvider) {
        browserProvider = new ethers.BrowserProvider(window.ethereum)
        setProvider(browserProvider)
      }

      // 请求账户访问
      const accounts = await browserProvider.send('eth_requestAccounts', [])

      if (accounts.length > 0) {
        const userAccount = accounts[0]

        // 优化：并行获取网络信息和签名者
        const [networkData, userSigner] = await Promise.all([
          browserProvider.getNetwork(),
          browserProvider.getSigner()
        ])

        const chainIdentifier = Number(networkData.chainId)

        // 检查网络 - 仅支持Sepolia网络
        if (chainIdentifier !== SEPOLIA_CHAIN_ID) {
          toast({
            title: '网络错误',
            description: '请切换到Sepolia测试网络',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })

          const switched = await switchToSepolia()
          if (!switched) {
            return
          }

          // 重新获取网络信息
          const newNetworkData = await browserProvider.getNetwork()
          const newChainId = Number(newNetworkData.chainId)
          setChainId(newChainId)
        } else {
          setChainId(chainIdentifier)
        }

        // 批量更新状态
        setAccount(userAccount)
        setSigner(userSigner)

        // 检查角色
        const role = checkUserRole(userAccount)
        setUserRole(role)
        localStorage.setItem('userRole', role.toString())

        // 优化合约初始化
        try {
          console.log('🔧 开始初始化合约...')
          console.log('📋 合约地址:', contractAddress)
          console.log('👤 签名者地址:', await userSigner.getAddress())
          console.log('🌐 当前网络ID:', chainIdentifier)
          
          // 验证合约地址格式
          if (!ethers.isAddress(contractAddress)) {
            throw new Error(`无效的合约地址: ${contractAddress}`)
          }
          
          // 验证ABI
          if (!CarbonCreditSystemABI || !Array.isArray(CarbonCreditSystemABI)) {
            console.error('ABI验证失败:', CarbonCreditSystemABI)
            throw new Error('合约ABI无效或未加载')
          }
          console.log('✅ ABI验证通过，包含', CarbonCreditSystemABI.length, '个方法')
          
          // 测试RPC连接状态
          console.log('🔗 检查RPC连接状态...')
          try {
            const blockNumber = await browserProvider.getBlockNumber()
            console.log('✅ RPC连接正常，当前区块:', blockNumber)
          } catch (rpcError: any) {
            console.error('❌ RPC连接失败:', rpcError)
            
            // 如果RPC连接失败，尝试使用备用端点
            console.log('🔄 尝试使用备用RPC端点...')
            const workingRpcUrl = await getWorkingRpcUrl()
            
            // 创建新的provider使用工作的RPC端点
            const fallbackProvider = new ethers.JsonRpcProvider(workingRpcUrl)
            const fallbackSigner = await fallbackProvider.getSigner(await userSigner.getAddress())
            
            // 更新provider和signer
            setProvider(new ethers.BrowserProvider(window.ethereum))
            setSigner(fallbackSigner)
            
            toast({
              title: 'RPC端点已切换',
              description: `已切换到备用RPC端点: ${workingRpcUrl}`,
              status: 'info',
              duration: 3000,
              isClosable: true,
            })
          }
          
          const carbonContract = new ethers.Contract(
            contractAddress,
            CarbonCreditSystemABI,
            userSigner
          )
          
          // 测试合约连接 - 尝试调用一个简单的只读方法
          try {
            console.log('🧪 测试合约连接...')
            // 尝试获取合约的基本信息
            const contractCode = await browserProvider.getCode(contractAddress)
            if (contractCode === '0x') {
              throw new Error('合约地址上没有部署代码，请检查合约地址是否正确')
            }
            console.log('✅ 合约代码验证通过')
            
            // 尝试调用合约方法来验证ABI匹配
            // 注意：这里我们不调用具体方法，只是验证合约对象创建成功
            console.log('✅ 合约对象创建成功')
          } catch (testError: any) {
             console.error('❌ 合约连接测试失败:', testError)
             
             // 检查是否是API限制问题
             if (testError?.message?.includes('rate limit') || 
                 testError?.message?.includes('429') ||
                 testError?.message?.includes('quota')) {
               throw new Error('API请求限制：当前RPC端点已达到使用限制，请稍后重试或配置自己的RPC端点')
             }
             
             throw new Error(`合约连接测试失败: ${testError?.message || testError}`)
           }
          
          setContract(carbonContract)
          localStorage.setItem('walletConnected', 'true')
          console.log('🎉 合约初始化完成')

          toast({
            title: '钱包已连接',
            description: `账户: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
        } catch (contractError: any) {
          console.error('❌ 合约初始化失败:', contractError)
          setConnectionError(`合约初始化失败: ${contractError?.message || contractError}`)
          
          // 根据错误类型提供不同的提示
          let errorTitle = '合约初始化失败'
          let errorDescription = contractError?.message || '连接成功但合约初始化失败'
          
          if (contractError?.message?.includes('API请求限制') || 
              contractError?.message?.includes('RPC连接失败')) {
            errorTitle = 'RPC连接问题'
            errorDescription = '当前使用的公共RPC端点可能已达到限制。建议：\n1. 稍后重试\n2. 配置自己的Infura或Alchemy RPC端点'
          }
          
          toast({
            title: errorTitle,
            description: errorDescription,
            status: 'error',
            duration: 8000,
            isClosable: true,
          })
        }
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error)
      setConnectionError(error.message || '未知错误')

      let errorMessage = '连接失败'
      if (error.code === 4001) {
        errorMessage = '用户拒绝了连接请求'
      } else if (error.code === -32002) {
        errorMessage = '请在钱包中确认连接请求'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: '连接失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
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
              console.log('🔧 自动连接 - 开始初始化合约...')
              console.log('📋 合约地址:', contractAddress)
              console.log('👤 签名者地址:', await userSigner.getAddress())
              console.log('🌐 当前网络ID:', chainIdentifier)
              
              // 验证合约地址格式
              if (!ethers.isAddress(contractAddress)) {
                throw new Error(`无效的合约地址: ${contractAddress}`)
              }
              
              // 验证ABI
              if (!CarbonCreditSystemABI || !Array.isArray(CarbonCreditSystemABI)) {
                throw new Error('合约ABI无效或未加载')
              }
              
              // 测试RPC连接状态
              console.log('🔗 自动连接 - 检查RPC连接状态...')
              try {
                const blockNumber = await browserProvider.getBlockNumber()
                console.log('✅ 自动连接 - RPC连接正常，当前区块:', blockNumber)
              } catch (rpcError: any) {
                console.error('❌ 自动连接 - RPC连接失败:', rpcError)
                throw new Error(`RPC连接失败，可能是API限制导致: ${rpcError?.message || rpcError}`)
              }
              
              const carbonContract = new ethers.Contract(
                contractAddress,
                CarbonCreditSystemABI,
                userSigner
              )
              
              // 测试合约连接
              try {
                console.log('🧪 自动连接 - 测试合约连接...')
                const contractCode = await browserProvider.getCode(contractAddress)
                if (contractCode === '0x') {
                  throw new Error('合约地址上没有部署代码，请检查合约地址是否正确')
                }
                console.log('✅ 自动连接 - 合约代码验证通过')
              } catch (testError: any) {
                 console.error('❌ 自动连接 - 合约连接测试失败:', testError)
                 
                 // 检查是否是API限制问题
                 if (testError?.message?.includes('rate limit') || 
                     testError?.message?.includes('429') ||
                     testError?.message?.includes('quota')) {
                   throw new Error('API请求限制：当前RPC端点已达到使用限制，请稍后重试或配置自己的RPC端点')
                 }
                 
                 throw new Error(`合约连接测试失败: ${testError?.message || testError}`)
               }
              
              setContract(carbonContract)
              console.log('🎉 自动连接 - 合约初始化完成')
            } catch (contractError: any) {
              console.error('❌ 自动连接 - 合约初始化失败:', contractError)
              setConnectionError(`自动连接合约初始化失败: ${contractError?.message || contractError}`)
              
              // 如果是API限制问题，显示提示
              if (contractError?.message?.includes('API请求限制') || 
                  contractError?.message?.includes('RPC连接失败')) {
                console.warn('⚠️ 检测到RPC API限制问题，建议配置自己的RPC端点')
              }
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
        verifierAddress,
        connectionError
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}