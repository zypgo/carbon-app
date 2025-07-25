import React from 'react'
import {
  HStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { useWeb3 } from '../contexts/Web3Context'

interface NetworkConfig {
  name: string
  displayName: string
  color: string
  icon: React.ElementType
  isTestnet?: boolean
}

const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  1: {
    name: 'mainnet',
    displayName: '以太坊主网',
    color: 'green',
    icon: Wifi
  },
  11155111: {
    name: 'sepolia',
    displayName: 'Sepolia 测试网',
    color: 'blue',
    icon: Wifi,
    isTestnet: true
  },
  1337: {
    name: 'localhost',
    displayName: '本地网络',
    color: 'purple',
    icon: Wifi,
    isTestnet: true
  }
}

const UNKNOWN_NETWORK: NetworkConfig = {
  name: 'unknown',
  displayName: '未知网络',
  color: 'red',
  icon: AlertTriangle
}

export const NetworkIndicator: React.FC = () => {
  const { chainId, account } = useWeb3()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  if (!account) {
    return (
      <HStack
        spacing={2}
        px={3}
        py={2}
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
      >
        <Icon as={WifiOff} boxSize={4} color="gray.400" />
        <Text fontSize="sm" color="gray.500">
          未连接
        </Text>
      </HStack>
    )
  }
  
  const networkConfig = chainId ? NETWORK_CONFIGS[chainId] || UNKNOWN_NETWORK : UNKNOWN_NETWORK
  const IconComponent = networkConfig.icon
  
  const getTooltipText = () => {
    if (!chainId) return '网络信息不可用'
    
    const config = NETWORK_CONFIGS[chainId]
    if (!config) {
      return `未知网络 (Chain ID: ${chainId})`
    }
    
    return `当前连接到 ${config.displayName} (Chain ID: ${chainId})`
  }
  
  return (
    <Tooltip label={getTooltipText()} placement="bottom">
      <HStack
        spacing={2}
        px={3}
        py={2}
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        cursor="help"
        _hover={{
          borderColor: `${networkConfig.color}.300`,
          shadow: 'sm'
        }}
        transition="all 0.2s"
      >
        <Icon 
          as={IconComponent} 
          boxSize={4} 
          color={`${networkConfig.color}.500`}
        />
        
        <VStack spacing={0} align="start">
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="medium">
              {networkConfig.displayName}
            </Text>
            
            {networkConfig.isTestnet && (
              <Badge 
                colorScheme="orange" 
                size="sm" 
                fontSize="xs"
                px={2}
                py={1}
              >
                测试网
              </Badge>
            )}
            
            {chainId && !NETWORK_CONFIGS[chainId] && (
              <Badge 
                colorScheme="red" 
                size="sm" 
                fontSize="xs"
                px={2}
                py={1}
              >
                不支持
              </Badge>
            )}
          </HStack>
          
          {chainId && (
            <Text fontSize="xs" color="gray.500">
              Chain ID: {chainId}
            </Text>
          )}
        </VStack>
      </HStack>
    </Tooltip>
  )
}

// 网络切换组件
export const NetworkSwitcher: React.FC = () => {
  const { chainId } = useWeb3()
  
  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
    } catch (error: any) {
      // 如果网络不存在，尝试添加网络
      if (error.code === 4902) {
        await addNetwork(targetChainId)
      } else {
        console.error('切换网络失败:', error)
      }
    }
  }
  
  const addNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return
    
    const networkParams: Record<number, any> = {
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Test Network',
        nativeCurrency: {
          name: 'Sepolia ETH',
          symbol: 'SEP',
          decimals: 18
        },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io/']
      }
    }
    
    const params = networkParams[targetChainId]
    if (!params) return
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params]
      })
    } catch (error) {
      console.error('添加网络失败:', error)
    }
  }
  
  return (
    <HStack spacing={2}>
      {Object.entries(NETWORK_CONFIGS).map(([id, config]) => {
        const networkId = Number(id)
        const isActive = chainId === networkId
        
        return (
          <Button
            key={id}
            size="sm"
            variant={isActive ? 'solid' : 'outline'}
            colorScheme={config.color}
            onClick={() => switchNetwork(networkId)}
            leftIcon={<Icon as={config.icon} boxSize={3} />}
            isDisabled={isActive}
          >
            {config.name}
          </Button>
        )
      })}
    </HStack>
  )
}

import { VStack, Button } from '@chakra-ui/react'