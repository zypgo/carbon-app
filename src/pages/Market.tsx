import { FC, useState, useEffect } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Box,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Tooltip,
  HStack,
  VStack,
  Flex,
  Icon
} from '@chakra-ui/react'
import { FaLeaf } from 'react-icons/fa'
import { useWeb3 } from '../contexts/Web3Context'
import { createContractService } from '../services/contractService'
import { ethers } from 'ethers'
import { useLanguage } from '../contexts/LanguageContext'
import { TransactionStatus, useTransactionStatus } from '../components/TransactionStatus'
import { NetworkIndicator } from '../components/NetworkIndicator'

interface CreditListing {
  id: string
  seller: string
  amount: number
  pricePerCredit: number
  totalPrice: number
  active: boolean
  timestamp: number
  projectId: string
}

const Market: FC = () => {
  const { account, contract, connectWallet, provider, signer, chainId } = useWeb3()
  const { t } = useLanguage()
  const { transaction, showTransaction, updateTransaction, closeTransaction } = useTransactionStatus()
  const [listings, setListings] = useState<CreditListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [contractService, setContractService] = useState<any>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [sellAmount, setSellAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const toast = useToast()

  // 初始化合约服务
    useEffect(() => {
      if (contract && signer && account && provider) {
        const service = createContractService(contract, provider, signer, account)
        setContractService(service)
      }
    }, [contract, provider, signer, account])

  // 加载数据的函数
  const loadListings = async () => {
    if (contractService) {
      try {
        setIsLoading(true)
        const contractListings = await contractService.getAllListings()
        setListings(contractListings.filter((listing: any) => listing.active))
      } catch (error) {
        console.error('加载上架信息失败:', error)
        toast({
          title: t('common.error'),
          description: '加载市场数据失败',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const loadUserBalance = async () => {
    if (contractService && account) {
      try {
        console.log('🔄 开始加载用户碳信用余额...')
        const balance = await contractService.getUserBalance(account)
        console.log('✅ 用户碳信用余额加载完成:', balance)
        console.log('💰 用户碳信用余额:', balance)
        setUserBalance(balance)
      } catch (error) {
        console.error('❌ 加载用户余额失败:', error)
        setUserBalance(0)
      }
    } else {
      console.warn('⚠️ 无法加载余额：contractService或account未初始化')
      setUserBalance(0)
    }
  }

  const loadData = async () => {
    await Promise.all([loadListings(), loadUserBalance()])
  }

  // 初始加载数据
  useEffect(() => {
    loadData()
  }, [contractService, account])

  // 定时刷新机制
  useEffect(() => {
    if (!contractService) return
    
    const interval = setInterval(() => {
      loadData()
    }, 15000) // 每15秒刷新一次

    return () => clearInterval(interval)
  }, [contractService, account])

  const handleBuy = async (listingId: number, price: number, amount: number, seller: string) => {
    if (!account) {
      toast({
        title: t('common.warning'),
        description: t('market.connect.title'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (!contractService) {
      toast({
        title: t('common.error'),
        description: '智能合约未初始化',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setIsLoading(true)
      
      // 显示交易状态
      showTransaction({
        status: 'pending',
        title: '购买碳信用',
        description: `正在购买 ${amount} 个碳信用，价格 ${price} ETH`
      })
      
      try {
        // 使用合约服务购买碳信用
        const result = await contractService.buyCredit(listingId, amount, price)
        
        console.log("Transaction sent:", result.hash);
        
        // 更新交易状态为等待确认
        updateTransaction({
          hash: result.hash,
          description: '交易已发送，等待区块链确认...'
        })
        
        // 等待交易被确认
        const receipt = await result.wait();
        console.log("Transaction confirmed in block:", receipt?.blockNumber);
        
        // 交易成功
        updateTransaction({
          status: 'success',
          description: `成功购买 ${amount} 个碳信用！`
        })
        
        // 立即重新加载数据
        await loadData()
        
      } catch (error: any) {
        console.error('智能合约交易失败:', error);
        
        // 显示详细的错误信息
        let errorMessage = '交易失败';
        
        if (error.code) {
          switch(error.code) {
            case 'ACTION_REJECTED':
            case 4001:
              errorMessage = '用户拒绝了交易';
              break;
            case 'INSUFFICIENT_FUNDS':
            case -32000:
              errorMessage = '余额不足';
              break;
            case 'NETWORK_ERROR':
              errorMessage = '网络错误，请检查网络连接';
              break;
            case 'UNPREDICTABLE_GAS_LIMIT':
              errorMessage = 'Gas 估算失败，请稍后重试';
              break;
            default:
              errorMessage = error.message || '未知错误';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // 更新交易状态为失败
        updateTransaction({
          status: 'error',
          error: errorMessage
        })
      }
    } catch (error: any) {
      console.error('购买准备失败:', error);
      
      // 显示交易失败
      showTransaction({
        status: 'error',
        title: '购买失败',
        error: error.message || '交易准备失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSell = async () => {
    if (!account) {
      toast({
        title: t('common.warning'),
        description: t('market.connect.title'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    const amount = parseFloat(sellAmount)
    const price = parseFloat(sellPrice)
    
    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    // 检查余额
    if (amount > userBalance) {
      toast({
        title: t('common.error'),
        description: `${t('common.error')}: ${userBalance}`,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (!contractService) {
      toast({
        title: t('common.error'),
        description: '智能合约未初始化',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      // 显示交易状态
      showTransaction({
        status: 'pending',
        title: '上架碳信用',
        description: `正在上架 ${amount} 个碳信用，价格 ${price} ETH`
      })
      
      try {
        // 使用合约服务上架碳信用
        const result = await contractService.listCredit(amount, price)
        
        console.log("List transaction sent:", result.hash);
        
        // 更新交易状态为等待确认
        updateTransaction({
          hash: result.hash,
          description: '交易已发送，等待区块链确认...'
        })
        
        // 等待交易被确认
        const receipt = await result.wait();
        console.log("List transaction confirmed in block:", receipt?.blockNumber);
        
        // 显示成功状态
        updateTransaction({
          status: 'success',
          description: `成功上架碳信用！`
        })
        
        // 立即重新加载数据
        await loadData()
        
        // 重置表单并关闭模态框
        setSellAmount('')
        setSellPrice('')
        onClose()
        
      } catch (error: any) {
        console.error('智能合约上架失败:', error);
        
        // 显示详细的错误信息
        let errorMessage = '上架失败';
        let errorDetails = '';
        
        if (error.message) {
          errorMessage = error.message;
          
          // 为常见错误提供解决方案
          if (error.message.includes('可用碳信用不足')) {
            errorDetails = '提示：您的碳信用可能分布在多个项目中，系统会自动选择信用最多的项目进行上架。';
          } else if (error.message.includes('还没有任何已验证的碳信用')) {
            errorDetails = '请先提交减碳项目并等待审核通过后再进行上架。';
          } else if (error.message.includes('没有找到有可用信用的项目')) {
            errorDetails = '请确保您有已审核通过的项目且项目中有可用的碳信用。';
          }
        } else if (error.code) {
          switch(error.code) {
            case 'ACTION_REJECTED':
            case 4001:
              errorMessage = '用户拒绝了交易';
              break;
            case 'INSUFFICIENT_FUNDS':
            case -32000:
              errorMessage = 'ETH余额不足支付交易费用';
              errorDetails = '请确保您的钱包中有足够的ETH来支付Gas费用。';
              break;
            case 'NETWORK_ERROR':
              errorMessage = '网络错误，请检查网络连接';
              break;
            case 'UNPREDICTABLE_GAS_LIMIT':
              errorMessage = 'Gas 估算失败，请稍后重试';
              break;
            default:
              errorMessage = error.message || '未知错误';
          }
        }
        
        // 更新交易状态为失败
        updateTransaction({
          status: 'error',
          error: errorMessage + (errorDetails ? '\n\n' + errorDetails : '')
        })
      }
      
    } catch (error: any) {
      console.error('上架准备失败:', error)
      
      // 显示交易失败
      showTransaction({
        status: 'error',
        title: '上架失败',
        error: error.message || '上架准备失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="green.500" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* 页面头部 */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={2}>
          <Heading>{t('market.title')}</Heading>
          <Text color="gray.600">
            {t('market.subtitle')}
          </Text>
        </VStack>
        
        {/* 网络状态指示器 */}
        <NetworkIndicator />
      </Flex>
      
      <Alert status="info" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>{t('market.alert.title')}</AlertTitle>
          <AlertDescription>
            {t('market.alert.desc')}
          </AlertDescription>
        </Box>
      </Alert>
      
      {account && (
        <Box mb={8} p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={FaLeaf} color="green.500" />
              <Text fontWeight="bold" fontSize="lg">
                我的碳信用余额: {userBalance.toFixed(2)} {t('common.credits')}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              💡 这是您通过已验证的减碳项目获得的碳信用总数，可用于交易市场买卖
            </Text>
            <Text fontSize="sm" color="gray.600">
              📊 余额来源：所有已批准项目中您拥有的碳信用之和
            </Text>
          </VStack>
        </Box>
      )}

      {!account ? (
        <Alert status="warning" mb={8}>
          <AlertIcon />
          <AlertTitle>{t('market.connect.title')}</AlertTitle>
          <AlertDescription>
            {t('market.connect.desc')}
            <Button ml={4} colorScheme="green" size="sm" onClick={connectWallet}>
              {t('market.connect.button')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Box mb={8}>
            <Button colorScheme="green" mr={4} onClick={onOpen}>
              {t('market.sell')}
            </Button>
            <Button 
              variant="outline" 
              colorScheme="green"
              onClick={async () => {
                if (contractService) {
                  setIsLoading(true)
                  try {
                    const updatedListings = await contractService.getAllListings()
                    setListings(updatedListings.filter((listing: any) => listing.active))
                    if (account) {
                      const newBalance = await contractService.getUserBalance(account)
                      setUserBalance(newBalance)
                    }
                  } catch (error) {
                    console.error('刷新数据失败:', error)
                  } finally {
                    setIsLoading(false)
                  }
                }
              }}
            >
              {t('market.refresh')}
            </Button>
          </Box>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{t('market.table.id')}</Th>
                <Th>{t('market.table.seller')}</Th>
                <Th isNumeric>{t('market.table.amount')}</Th>
                <Th isNumeric>{t('market.table.price')}</Th>
                <Th>{t('market.table.status')}</Th>
                <Th>{t('market.table.action')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {listings.map((listing) => (
                <Tr key={listing.id}>
                  <Td>{listing.id}</Td>
                  <Td>{`${listing.seller.substring(0, 6)}...${listing.seller.substring(listing.seller.length - 4)}`}</Td>
                  <Td isNumeric>{listing.amount}</Td>
                  <Td isNumeric>
                    <Tooltip label={t('market.tooltip.price')}>
                      {listing.pricePerCredit}
                    </Tooltip>
                  </Td>
                  <Td>
                    <Badge colorScheme={listing.active ? 'green' : 'gray'}>
                      {listing.active ? t('market.status.available') : t('market.status.sold')}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      colorScheme="green"
                      size="sm"
                      isDisabled={!listing.active || listing.seller === account}
                      onClick={() => handleBuy(parseInt(listing.id), listing.pricePerCredit, listing.amount, listing.seller)}
                    >
                      {t('market.action.buy')}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      )}
      
      {/* 出售碳信用模态框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('sell.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>{t('sell.amount')}</FormLabel>
              <Input 
                type="number" 
                value={sellAmount} 
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder={t('sell.amount.placeholder')}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t('sell.price')}</FormLabel>
              <Input 
                type="number" 
                value={sellPrice} 
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder={t('sell.price.placeholder')}
              />
            </FormControl>
            <Alert status="info" mt={4} size="sm">
              <AlertIcon />
              {t('sell.tip')}
            </Alert>
            {userBalance > 0 && (
              <Text mt={2} fontSize="sm">
                {t('sell.balance')}: {userBalance} {t('common.credits')}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('sell.cancel')}
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleSell}
              isDisabled={!sellAmount || !sellPrice || parseFloat(sellAmount) <= 0 || parseFloat(sellPrice) <= 0}
            >
              {t('sell.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 交易状态模态框 */}
      <TransactionStatus
        transaction={transaction}
        onClose={closeTransaction}
        chainId={chainId || 1}
      />
    </Container>
  )
}

export default Market