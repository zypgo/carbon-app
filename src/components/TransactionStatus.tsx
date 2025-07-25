import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Spinner,
  Icon,
  Button,
  Link,
  useColorModeValue
} from '@chakra-ui/react'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'

export interface TransactionState {
  isOpen: boolean
  status: 'pending' | 'success' | 'error' | 'idle'
  hash?: string
  error?: string
  title?: string
  description?: string
}

interface TransactionStatusProps {
  transaction: TransactionState
  onClose: () => void
  chainId?: number
}

const getExplorerUrl = (hash: string, chainId: number = 1) => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io', // Sepolia
    1337: 'http://localhost:8545' // Local
  }
  
  const baseUrl = explorers[chainId] || explorers[1]
  return `${baseUrl}/tx/${hash}`
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transaction,
  onClose,
  chainId = 1
}) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return <Spinner size="lg" color="blue.500" thickness="4px" />
      case 'success':
        return <Icon as={CheckCircle} boxSize={12} color="green.500" />
      case 'error':
        return <Icon as={XCircle} boxSize={12} color="red.500" />
      default:
        return null
    }
  }
  
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'pending':
        return 'blue.500'
      case 'success':
        return 'green.500'
      case 'error':
        return 'red.500'
      default:
        return 'gray.500'
    }
  }
  
  const getStatusText = () => {
    switch (transaction.status) {
      case 'pending':
        return '交易处理中...'
      case 'success':
        return '交易成功！'
      case 'error':
        return '交易失败'
      default:
        return ''
    }
  }
  
  return (
    <Modal 
      isOpen={transaction.isOpen} 
      onClose={onClose}
      closeOnOverlayClick={transaction.status !== 'pending'}
      closeOnEsc={transaction.status !== 'pending'}
      isCentered
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="xl"
        mx={4}
      >
        <ModalHeader
          textAlign="center"
          color={getStatusColor()}
          fontSize="xl"
          fontWeight="bold"
        >
          {transaction.title || getStatusText()}
        </ModalHeader>
        
        {transaction.status !== 'pending' && (
          <ModalCloseButton />
        )}
        
        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* 状态图标 */}
            <VStack spacing={3}>
              {getStatusIcon()}
              <Text
                fontSize="lg"
                fontWeight="medium"
                color={getStatusColor()}
              >
                {getStatusText()}
              </Text>
            </VStack>
            
            {/* 描述信息 */}
            {transaction.description && (
              <Text
                textAlign="center"
                color="gray.600"
                fontSize="md"
              >
                {transaction.description}
              </Text>
            )}
            
            {/* 错误信息 */}
            {transaction.status === 'error' && transaction.error && (
              <VStack spacing={2} w="full">
                <Text fontSize="sm" fontWeight="medium" color="red.500">
                  错误详情：
                </Text>
                <Text
                  fontSize="sm"
                  color="red.400"
                  bg="red.50"
                  p={3}
                  borderRadius="md"
                  w="full"
                  textAlign="center"
                  wordBreak="break-word"
                >
                  {transaction.error}
                </Text>
              </VStack>
            )}
            
            {/* 交易哈希和链接 */}
            {transaction.hash && (
              <VStack spacing={3} w="full">
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  交易哈希：
                </Text>
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  bg="gray.100"
                  p={2}
                  borderRadius="md"
                  w="full"
                  textAlign="center"
                  wordBreak="break-all"
                >
                  {transaction.hash}
                </Text>
                
                {/* 区块链浏览器链接 */}
                {chainId !== 1337 && (
                  <Link
                    href={getExplorerUrl(transaction.hash, chainId)}
                    isExternal
                    color="blue.500"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    <HStack spacing={1}>
                      <Text>在区块链浏览器中查看</Text>
                      <Icon as={ExternalLink} boxSize={3} />
                    </HStack>
                  </Link>
                )}
              </VStack>
            )}
            
            {/* 操作按钮 */}
            {transaction.status !== 'pending' && (
              <Button
                colorScheme={transaction.status === 'success' ? 'green' : 'blue'}
                onClick={onClose}
                size="lg"
                w="full"
              >
                {transaction.status === 'success' ? '完成' : '关闭'}
              </Button>
            )}
            
            {/* 等待提示 */}
            {transaction.status === 'pending' && (
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  请在钱包中确认交易，然后等待区块链确认
                </Text>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  这可能需要几分钟时间
                </Text>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

// 自定义Hook用于管理交易状态
export const useTransactionStatus = () => {
  const [transaction, setTransaction] = React.useState<TransactionState>({
    isOpen: false,
    status: 'idle'
  })
  
  const showTransaction = (config: Partial<TransactionState>) => {
    setTransaction({
      isOpen: true,
      status: 'idle',
      ...config
    })
  }
  
  const updateTransaction = (updates: Partial<TransactionState>) => {
    setTransaction(prev => ({ ...prev, ...updates }))
  }
  
  const closeTransaction = () => {
    setTransaction({
      isOpen: false,
      status: 'idle'
    })
  }
  
  return {
    transaction,
    showTransaction,
    updateTransaction,
    closeTransaction
  }
}