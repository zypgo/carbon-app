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
  Icon,
  Progress,
  Divider,
  VStack
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { createContractService, Project, Transaction, EmissionRecord } from '../services/contractService'
import { ethers } from 'ethers'
import { InfoIcon, RepeatIcon } from '@chakra-ui/icons'
import { useLanguage } from '../contexts/LanguageContext'

const Profile: FC = () => {
  const { account, connectWallet, provider, contract, signer } = useWeb3()
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [isLoadingEthBalance, setIsLoadingEthBalance] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [userEmissions, setUserEmissions] = useState<EmissionRecord[]>([])
  const [contractService, setContractService] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 初始化合约服务
    useEffect(() => {
      if (contract && signer && account && provider) {
        const service = createContractService(contract, provider, signer, account)
        setContractService(service)
      }
    }, [contract, provider, signer, account])

  // 加载用户数据
  useEffect(() => {
    if (account && contractService) {
      loadUserData()
    }
  }, [account, contractService])

  // 加载用户数据
  const loadUserData = async () => {
    if (!account || !contractService) return
    
    setIsLoading(true)
    try {
      // 获取用户碳信用余额
      const userBalance = await contractService.getCarbonCredits(account)
      setBalance(userBalance)
      
      // 获取用户交易历史
      const userTransactions = await contractService.getUserTransactions(account)
      setTransactions(userTransactions)
      
      // 获取用户提交的项目
      const projects = await contractService.getUserProjects(account)
      setUserProjects(projects)
      
      // 获取用户排放记录
      const emissions = await contractService.getUserEmissions(account)
      setUserEmissions(emissions)
      
      // 获取ETH余额
      await fetchEthBalance()
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  

  
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
  
  // 计算参与的项目数（使用实际提交的项目数量）
  const calculateProjectCount = () => {
    return userProjects.length
  }
  
  // 计算总排放量
  const calculateTotalEmissions = () => {
    return userEmissions.reduce((total, emission) => total + emission.amount, 0)
  }
  
  // 计算净碳足迹（排放量 - 抵消量）
  const calculateNetCarbonFootprint = () => {
    const totalEmissions = calculateTotalEmissions()
    const totalOffset = calculateOffsetAmount()
    return Math.max(0, totalEmissions - totalOffset)
  }
  
  // 计算总价值（所有交易的价值总和）
  const calculateTotalValue = () => {
    return transactions.reduce((total, tx) => {
      return total + ((tx.price || 0) * tx.amount)
    }, 0)
  }
  
  // 计算碳信用的当前市场价值
  const calculateCarbonCreditValue = () => {
    // 使用最近交易的平均价格作为市场价格
    if (transactions.length === 0) return 0
    
    const recentTransactions = transactions.slice(0, Math.min(5, transactions.length))
    const avgPrice = recentTransactions.reduce((sum, tx) => sum + (tx.price || 0), 0) / recentTransactions.length
    
    return balance * avgPrice
  }
  
  // 渲染项目卡片
  const renderProjectCard = (project: Project) => (
    <Box 
      key={project.id} 
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="lg"
      mb={4}
      _hover={{ shadow: "lg" }}
      transition="all 0.3s"
    >
      <Heading fontSize="xl" mb={2}>{project.name}</Heading>
      <Text mb={4} color="gray.600" noOfLines={3}>{project.description}</Text>
      
      <Text fontWeight="bold" mb={1}>
        {t('projects.card.target')}: {project.target} {t('common.tons')}
      </Text>
      
      {(project.status === 'approved') && (
        <>
          <Text fontWeight="bold" mb={1}>
            {t('projects.card.progress')}:
          </Text>
          <Progress 
            value={project.progress && project.target ? (project.progress / project.target) * 100 : 0}
            colorScheme="green"
            size="sm"
            mb={2}
          />
          <Text fontSize="sm" color="gray.600">
            {project.progress || 0} / {project.target || 0} {t('common.tons')}
            ({project.progress && project.target ? Math.round((project.progress / project.target) * 100) : 0}%)
          </Text>
        </>
      )}
      
      <Text fontWeight="bold" mb={2}>
        {t('projects.card.duration')}: {project.duration || 0} {t('common.months')}
      </Text>
      
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontWeight="bold">
          {t('projects.card.status')}: {getStatusBadge(project.status)}
        </Text>
      </Flex>
      
      {/* 提交者和日期信息 */}
      <Divider my={3} />
      <VStack align="start" spacing={1} mt={3} fontSize="sm" color="gray.600">
        {project.submissionTime && (
          <Text>{t('projects.card.submitted')}: {new Date(project.submissionTime * 1000).toLocaleDateString()}</Text>
        )}
        {project.reviewTime && (
          <Text>{t('projects.card.reviewed')}: {new Date(project.reviewTime * 1000).toLocaleDateString()}</Text>
        )}
        {project.reviewedBy && (
          <Text>审核者: {project.reviewedBy}</Text>
        )}
        {project.reviewNotes && (
          <Text>{t('projects.card.notes')}: {project.reviewNotes}</Text>
        )}
      </VStack>
    </Box>
  );
  
  // 渲染状态徽章
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
      case 'approved':
        return <Badge colorScheme="green">{t('projects.status.active')}</Badge>
      case 'completed':
        return <Badge colorScheme="blue">{t('projects.status.completed')}</Badge>
      case 'pending':
        return <Badge colorScheme="yellow">{t('projects.status.pending')}</Badge>
      case 'rejected':
        return <Badge colorScheme="red">{t('projects.status.rejected')}</Badge>
      default:
        return null
    }
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

          {isLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>加载用户数据中...</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6} mb={8}>
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
              <StatBox 
                label="净碳足迹"
                value={calculateNetCarbonFootprint().toFixed(2)} 
                unit={t('common.tons')}
                tooltip="总排放量减去总抵消量"
              />
            </SimpleGrid>
          )}

          <Tabs>
            <TabList>
              <Tab>{t('profile.tab.transactions')}</Tab>
              <Tab>{t('profile.tab.projects')}</Tab>
              <Tab>排放记录</Tab>
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
                              : tx.counterparty
                              ? `${tx.counterparty.substring(0, 6)}...${tx.counterparty.substring(tx.counterparty.length - 4)}`
                              : '未知'
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
                {userProjects.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>{t('profile.my.projects')}</Heading>
                    {userProjects.map(renderProjectCard)}
                  </Box>
                ) : (
                  <Text>{t('profile.projects.empty')}</Text>
                )}
              </TabPanel>
              <TabPanel>
                {userEmissions.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>我的排放记录</Heading>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>排放源</Th>
                          <Th isNumeric>排放量 (吨)</Th>
                          <Th>记录日期</Th>
                          <Th>验证状态</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userEmissions.map((emission) => (
                          <Tr key={emission.id}>
                            <Td>{emission.source}</Td>
                            <Td isNumeric>{emission.amount}</Td>
                            <Td>{new Date(emission.timestamp * 1000).toLocaleDateString()}</Td>
                            <Td>
                              <Badge colorScheme={emission.verified ? 'green' : 'yellow'}>
                                {emission.verified ? '已验证' : '待验证'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                    <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                      <Text fontWeight="bold">总排放量: {calculateTotalEmissions().toFixed(2)} 吨 CO₂</Text>
                      <Text>总抵消量: {calculateOffsetAmount().toFixed(2)} 吨 CO₂</Text>
                      <Text color={calculateNetCarbonFootprint() > 0 ? 'red.500' : 'green.500'}>
                        净碳足迹: {calculateNetCarbonFootprint().toFixed(2)} 吨 CO₂
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  <Text>暂无排放记录</Text>
                )}
              </TabPanel>
              <TabPanel>
                <VStack spacing={4} align="start">
                  <Text>{t('profile.settings.coming')}</Text>
                  <Button 
                    colorScheme="blue" 
                    onClick={loadUserData}
                    isLoading={isLoading}
                    disabled={!contractService}
                  >
                    刷新数据
                  </Button>
                </VStack>
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
            <Icon as={InfoIcon} ml={1} boxSize={3} color="gray.400" />
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