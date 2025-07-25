import React from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  VStack,
  Text,
  Code,
  Collapse,
  useDisclosure
} from '@chakra-ui/react'
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { useWeb3 } from '../contexts/Web3Context'

interface Web3ErrorHandlerProps {
  error: string | null
  onRetry?: () => void
}

export const Web3ErrorHandler: React.FC<Web3ErrorHandlerProps> = ({ error, onRetry }) => {
  const { isOpen, onToggle } = useDisclosure()
  const { resetConnection } = useWeb3()

  if (!error) return null

  const isRpcError = error.includes('RPC') || error.includes('API请求限制') || error.includes('rate limit')
  const isContractError = error.includes('合约') || error.includes('contract')
  const isNetworkError = error.includes('网络') || error.includes('network')

  const getErrorType = () => {
    if (isRpcError) return 'RPC连接问题'
    if (isContractError) return '合约连接问题'
    if (isNetworkError) return '网络问题'
    return '连接错误'
  }

  const getErrorSolution = () => {
    if (isRpcError) {
      return (
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">建议解决方案：</Text>
          <Text fontSize="sm">• 稍后重试（公共RPC端点可能达到限制）</Text>
          <Text fontSize="sm">• 配置自己的Infura或Alchemy RPC端点</Text>
          <Text fontSize="sm">• 检查网络连接</Text>
        </VStack>
      )
    }
    if (isContractError) {
      return (
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">建议解决方案：</Text>
          <Text fontSize="sm">• 确认已连接到Sepolia测试网络</Text>
          <Text fontSize="sm">• 检查合约地址是否正确</Text>
          <Text fontSize="sm">• 重新连接钱包</Text>
        </VStack>
      )
    }
    if (isNetworkError) {
      return (
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">建议解决方案：</Text>
          <Text fontSize="sm">• 切换到Sepolia测试网络</Text>
          <Text fontSize="sm">• 检查MetaMask网络配置</Text>
          <Text fontSize="sm">• 重新连接钱包</Text>
        </VStack>
      )
    }
    return (
      <VStack align="start" spacing={2}>
        <Text fontSize="sm">建议解决方案：</Text>
        <Text fontSize="sm">• 重新连接钱包</Text>
        <Text fontSize="sm">• 刷新页面</Text>
        <Text fontSize="sm">• 检查网络连接</Text>
      </VStack>
    )
  }

  return (
    <Alert status="error" borderRadius="md" mb={4}>
      <AlertIcon as={AlertTriangle} />
      <Box flex="1">
        <AlertTitle fontSize="md">{getErrorType()}</AlertTitle>
        <AlertDescription>
          <VStack align="start" spacing={3} mt={2}>
            <Text fontSize="sm">
              {error.length > 100 ? `${error.substring(0, 100)}...` : error}
            </Text>
            
            {getErrorSolution()}
            
            <Box>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={onRetry || resetConnection}
                mr={2}
              >
                重试连接
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
              >
                {isOpen ? '隐藏详情' : '查看详情'}
              </Button>
              
              {isRpcError && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<ExternalLink size={16} />}
                  onClick={() => window.open('https://docs.infura.io/networks/ethereum/how-to/secure-a-project/project-id', '_blank')}
                  ml={2}
                >
                  配置RPC
                </Button>
              )}
            </Box>
            
            <Collapse in={isOpen} animateOpacity>
              <Box p={3} bg="gray.50" borderRadius="md" mt={2}>
                <Text fontSize="xs" fontWeight="bold" mb={2}>错误详情：</Text>
                <Code fontSize="xs" p={2} display="block" whiteSpace="pre-wrap">
                  {error}
                </Code>
              </Box>
            </Collapse>
          </VStack>
        </AlertDescription>
      </Box>
    </Alert>
  )
}

export default Web3ErrorHandler