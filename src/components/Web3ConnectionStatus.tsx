import React from 'react'
import {
  Box,
  Badge,
  HStack,
  Text,
  Tooltip,
  Icon,
  VStack,
  Divider
} from '@chakra-ui/react'
import { Wifi, WifiOff, Shield, User, AlertCircle } from 'lucide-react'
import { useWeb3, UserRole } from '../contexts/Web3Context'

export const Web3ConnectionStatus: React.FC = () => {
  const { 
    account, 
    chainId, 
    provider, 
    contract, 
    userRole, 
    isVerifier, 
    connectionError,
    isConnecting 
  } = useWeb3()

  const isConnected = !!(account && provider && contract)
  const isCorrectNetwork = chainId === 11155111 // Sepolia

  const getConnectionStatus = () => {
    if (isConnecting) return { status: 'connecting', color: 'yellow', text: '连接中...' }
    if (connectionError) return { status: 'error', color: 'red', text: '连接错误' }
    if (!account) return { status: 'disconnected', color: 'gray', text: '未连接' }
    if (!isCorrectNetwork) return { status: 'wrong-network', color: 'orange', text: '网络错误' }
    if (!contract) return { status: 'no-contract', color: 'orange', text: '合约未连接' }
    return { status: 'connected', color: 'green', text: '已连接' }
  }

  const connectionStatus = getConnectionStatus()

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 11155111:
        return 'Sepolia 测试网'
      case 1:
        return 'Ethereum 主网'
      case 5:
        return 'Goerli 测试网'
      default:
        return chainId ? `网络 ${chainId}` : '未知网络'
    }
  }

  return (
    <Box 
      bg="white" 
      p={4} 
      borderRadius="lg" 
      shadow="sm" 
      border="1px" 
      borderColor="gray.200"
      maxW="300px"
    >
      <VStack align="start" spacing={3}>
        {/* 连接状态 */}
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            连接状态
          </Text>
          <HStack spacing={2}>
            <Icon 
              as={isConnected ? Wifi : WifiOff} 
              color={connectionStatus.color === 'green' ? 'green.500' : 'red.500'}
              size={16}
            />
            <Badge 
              colorScheme={connectionStatus.color} 
              variant="subtle"
              fontSize="xs"
            >
              {connectionStatus.text}
            </Badge>
          </HStack>
        </HStack>

        {/* 账户信息 */}
        {account && (
          <>
            <Divider />
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                账户地址
              </Text>
              <Tooltip label={account} placement="top">
                <Text fontSize="sm" fontFamily="mono">
                  {formatAddress(account)}
                </Text>
              </Tooltip>
            </HStack>
          </>
        )}

        {/* 网络信息 */}
        {chainId && (
          <HStack justify="space-between" w="full">
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              网络
            </Text>
            <HStack spacing={2}>
              {!isCorrectNetwork && (
                <Icon as={AlertCircle} color="orange.500" size={14} />
              )}
              <Text fontSize="sm" color={isCorrectNetwork ? 'green.600' : 'orange.600'}>
                {getNetworkName(chainId)}
              </Text>
            </HStack>
          </HStack>
        )}

        {/* 用户角色 */}
        {account && (
          <>
            <Divider />
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                用户角色
              </Text>
              <HStack spacing={2}>
                <Icon 
                  as={isVerifier ? Shield : User} 
                  color={isVerifier ? 'purple.500' : 'blue.500'}
                  size={14}
                />
                <Badge 
                  colorScheme={isVerifier ? 'purple' : 'blue'} 
                  variant="subtle"
                  fontSize="xs"
                >
                  {userRole === UserRole.Verifier ? '审核者' : '普通用户'}
                </Badge>
              </HStack>
            </HStack>
          </>
        )}

        {/* 合约状态 */}
        {account && (
          <HStack justify="space-between" w="full">
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              合约状态
            </Text>
            <Badge 
              colorScheme={contract ? 'green' : 'red'} 
              variant="subtle"
              fontSize="xs"
            >
              {contract ? '已连接' : '未连接'}
            </Badge>
          </HStack>
        )}

        {/* 错误提示 */}
        {connectionError && (
          <>
            <Divider />
            <Box w="full">
              <Text fontSize="xs" color="red.500" noOfLines={2}>
                {connectionError}
              </Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  )
}

export default Web3ConnectionStatus