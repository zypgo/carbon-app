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
  Tooltip
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { recordTransaction, getUserBalance } from '../services/userDataService'
import { ethers } from 'ethers'
import { useLanguage } from '../contexts/LanguageContext'

interface CreditListing {
  id: number
  seller: string
  amount: number
  price: number
  active: boolean
}

const Market: FC = () => {
  const { account, contract, connectWallet, provider, signer } = useWeb3()
  const { t } = useLanguage()
  const [listings, setListings] = useState<CreditListing[]>([
    {
      id: 1,
      seller: '0x1234567890123456789012345678901234567890',
      amount: 100,
      price: 0.0001,
      active: true
    },
    {
      id: 2,
      seller: '0x0987654321098765432109876543210987654321',
      amount: 50,
      price: 0.0002,
      active: true
    },
    {
      id: 3,
      seller: '0x5678901234567890123456789012345678901234',
      amount: 200,
      price: 0.0001,
      active: true
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [sellAmount, setSellAmount] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const toast = useToast()

  // 加载用户余额
  useEffect(() => {
    if (account) {
      const balance = getUserBalance(account)
      setUserBalance(balance)
    }
  }, [account])

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

    if (!signer) {
      toast({
        title: t('common.error'),
        description: t('market.connect.desc'),
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setIsLoading(true)
      
      // 准备交易参数
      const weiValue = ethers.parseEther(price.toString())
      
      // 创建一个简单的交易对象
      const tx = {
        to: seller,
        value: weiValue
      }
      
      // 发送交易
      toast({
        title: t('common.info'),
        description: t('market.connect.desc'),
        status: 'info',
        duration: 5000,
        isClosable: true
      })
      
      try {
        // 发送实际的以太坊交易
        const transaction = await signer.sendTransaction(tx)
        
        // 等待交易被确认
        await transaction.wait()
        
        // 交易成功
        setListings(prevListings => 
          prevListings.map(listing => 
            listing.id === listingId ? { ...listing, active: false } : listing
          )
        )
        
        // 记录交易并更新余额
        recordTransaction(account, 'buy', amount, price, seller)
        setUserBalance(getUserBalance(account))
        
        toast({
          title: t('common.success'),
          description: `${t('profile.type.buy')} ${amount} ${t('common.credits')}, ${transaction.hash.substring(0, 10)}...`,
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } catch (error: any) {
        console.error('交易失败:', error)
        toast({
          title: t('common.error'),
          description: error.message || t('common.error'),
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    } catch (error: any) {
      console.error('购买失败:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSell = () => {
    if (!account) return
    
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
    
    try {
      setIsLoading(true)
      
      // 创建新的上架信息
      const newListing: CreditListing = {
        id: listings.length + 1,
        seller: account,
        amount: amount,
        price: price,
        active: true
      }
      
      setListings([...listings, newListing])
      
      // 记录交易并更新余额
      recordTransaction(account, 'sell', amount, price, 'market')
      setUserBalance(getUserBalance(account))
      
      toast({
        title: t('common.success'),
        description: `${t('profile.type.sell')} ${amount} ${t('common.credits')}`,
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
      // 重置表单并关闭模态框
      setSellAmount('')
      setSellPrice('')
      onClose()
      setIsLoading(false)
    } catch (error) {
      console.error('上架失败:', error)
      toast({
        title: t('common.error'),
        description: t('common.error'),
        status: 'error',
        duration: 5000,
        isClosable: true
      })
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
      <Heading mb={4}>{t('market.title')}</Heading>
      <Text mb={2} color="gray.600">
        {t('market.subtitle')}
      </Text>
      
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
        <Text mb={8} fontWeight="bold">
          {t('market.balance')}: {userBalance} {t('common.credits')}
        </Text>
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
            <Button variant="outline" colorScheme="green">
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
                      {listing.price}
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
                      onClick={() => handleBuy(listing.id, listing.price, listing.amount, listing.seller)}
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
    </Container>
  )
}

export default Market 