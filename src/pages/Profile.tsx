import { FC, useState, useEffect } from 'react'
import {
  Container,
  Heading,
  Text,
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  Button,
  Spinner,
  Flex,
  Tooltip,
  HStack,
  Icon
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { getUserBalance, getUserTransactions, Transaction } from '../services/userDataService'
import { ethers } from 'ethers'
import { InfoIcon, RepeatIcon } from '@chakra-ui/icons'
import { useLanguage } from '../contexts/LanguageContext'

const Profile: FC = () => {
  const { account, connectWallet, provider } = useWeb3()
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [isLoadingEthBalance, setIsLoadingEthBalance] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // 加载用户数据
  useEffect(() => {
    if (account) {
      // 获取用户余额
      const userBalance = getUserBalance(account)
      setBalance(userBalance)
      
      // 获取用户交易历史
      const userTransactions = getUserTransactions(account)
      setTransactions(userTransactions)
      
      // 获取ETH余额
      fetchEthBalance()
    }
  }, [account])
  
  // 获取ETH余额
  const fetchEthBalance = async () => {
    if (!account || !provider) return
    
    try {
      setIsLoadingEthBalance(true)
      const balance = await provider.getBalance(account)
      setEthBalance(ethers.formatEther(balance))
      setLastUpdated(new Date())
    } catch (error) {
      console.error('获取ETH余额失败:', error)
    } finally {
      setIsLoadingEthBalance(false)
    }
  }
  
  // 计算碳抵消量（购买的碳信用总量）
  const calculateOffsetAmount = () => {
    return transactions
      .filter(tx => tx.type === 'buy')
      .reduce((total, tx) => total + tx.amount, 0)
  }
  
  // 计算参与的项目数（不同卖家的数量）
  const calculateProjectCount = () => {
    const sellers = new Set(
      transactions
        .filter(tx => tx.type === 'buy')
        .map(tx => tx.counterparty)
    )
    return sellers.size
  }
  
  // 计算总价值（所有交易的价值总和）
  const calculateTotalValue = () => {
    return transactions.reduce((total, tx) => {
      return total + (tx.price * tx.amount)
    }, 0)
  }
  
  // 计算碳信用的当前市场价值
  const calculateCarbonCreditValue = () => {
    // 使用最近交易的平均价格作为市场价格
    if (transactions.length === 0) return 0
    
    const recentTransactions = transactions.slice(0, Math.min(5, transactions.length))
    const avgPrice = recentTransactions.reduce((sum, tx) => sum + tx.price, 0) / recentTransactions.length
    
    return balance * avgPrice
  }

  return (
    <Container maxW="container.xl">
      <Box mb={8}>
        <Heading>{t('profile.title')}</Heading>
        <Text color="gray.600">{t('profile.address')}: {account || t('profile.connect.title')}</Text>
        {lastUpdated && (
          <Text fontSize="sm" color="gray.500">
            {t('profile.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </Box>

      {!account ? (
        <Alert status="warning" mb={8}>
          <AlertIcon />
          {t('profile.connect.title')}
          <Button ml={4} colorScheme="green" size="sm" onClick={connectWallet}>
            {t('profile.connect.button')}
          </Button>
        </Alert>
      ) : (
        <>
          <Box mb={6}>
            <Flex align="center" mb={2}>
              <Heading size="md" mr={2}>{t('profile.wallet.title')}</Heading>
              <Tooltip label={t('profile.wallet.refresh')}>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchEthBalance}
                  isLoading={isLoadingEthBalance}
                  disabled={isLoadingEthBalance}
                >
                  <Icon as={RepeatIcon} />
                </Button>
              </Tooltip>
            </Flex>
            <HStack spacing={8}>
              <Stat>
                <StatLabel>{t('profile.wallet.eth')}</StatLabel>
                <StatNumber>
                  {isLoadingEthBalance ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      {parseFloat(ethBalance).toFixed(6)} <Text as="span" fontSize="sm" color="gray.500">ETH</Text>
                    </>
                  )}
                </StatNumber>
              </Stat>
            </HStack>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            <StatBox 
              label={t('profile.stats.balance')}
              value={balance.toString()} 
              unit={t('common.credits')}
              tooltip={t('profile.stats.balance.tooltip')}
            />
            <StatBox 
              label={t('profile.stats.value')}
              value={calculateCarbonCreditValue().toFixed(6)} 
              unit={t('common.eth')}
              tooltip={t('profile.stats.value.tooltip')}
            />
            <StatBox 
              label={t('profile.stats.offset')}
              value={calculateOffsetAmount().toString()} 
              unit={t('common.tons')}
              tooltip={t('profile.stats.offset.tooltip')}
            />
            <StatBox 
              label={t('profile.stats.projects')}
              value={calculateProjectCount().toString()} 
              unit={t('common.projects')}
              tooltip={t('profile.stats.projects.tooltip')}
            />
          </SimpleGrid>

          <Tabs>
            <TabList>
              <Tab>{t('profile.tab.transactions')}</Tab>
              <Tab>{t('profile.tab.projects')}</Tab>
              <Tab>{t('profile.tab.settings')}</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {transactions.length > 0 ? (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>{t('profile.table.type')}</Th>
                        <Th isNumeric>{t('profile.table.amount')}</Th>
                        <Th isNumeric>{t('profile.table.price')}</Th>
                        <Th>{t('profile.table.date')}</Th>
                        <Th>{t('profile.table.counterparty')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {transactions.map((tx) => (
                        <Tr key={tx.id}>
                          <Td>
                            <Badge
                              colorScheme={tx.type === 'buy' ? 'green' : 'red'}
                            >
                              {tx.type === 'buy' ? t('profile.type.buy') : t('profile.type.sell')}
                            </Badge>
                          </Td>
                          <Td isNumeric>{tx.amount}</Td>
                          <Td isNumeric>{tx.price}</Td>
                          <Td>{tx.date}</Td>
                          <Td>
                            {tx.counterparty === 'market' 
                              ? t('profile.counterparty.market')
                              : `${tx.counterparty.substring(0, 6)}...${tx.counterparty.substring(tx.counterparty.length - 4)}`
                            }
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text>{t('profile.transactions.empty')}</Text>
                )}
              </TabPanel>
              <TabPanel>
                <Text>{t('profile.projects.empty')}</Text>
              </TabPanel>
              <TabPanel>
                <Text>{t('profile.settings.coming')}</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      )}
    </Container>
  )
}

interface StatBoxProps {
  label: string
  value: string
  unit: string
  tooltip?: string
}

const StatBox = ({ label, value, unit, tooltip }: StatBoxProps) => (
  <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
    <Stat>
      <Flex align="center">
        <StatLabel>{label}</StatLabel>
        {tooltip && (
          <Tooltip label={tooltip}>
            <span>
              <Icon as={InfoIcon} ml={1} boxSize={3} color="gray.500" />
            </span>
          </Tooltip>
        )}
      </Flex>
      <StatNumber>
        {value} <Text as="span" fontSize="sm" color="gray.500">{unit}</Text>
      </StatNumber>
    </Stat>
  </Box>
)

export default Profile 