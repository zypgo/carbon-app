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
import { getUserBalance, getUserTransactions, Transaction } from '../services/userDataService'
import { ethers } from 'ethers'
import { InfoIcon, RepeatIcon } from '@chakra-ui/icons'
import { useLanguage } from '../contexts/LanguageContext'

// 使用与Projects组件相同的本地存储键名
const STORAGE_KEY = 'carbon_app_projects';

// 项目接口定义 (与Projects组件保持一致)
interface Project {
  id: number
  name: string
  description: string
  target: number
  progress: number
  duration: number
  status: 'active' | 'completed' | 'pending' | 'rejected'
  submitter?: string
  submissionDate?: string
  reviewDate?: string
  reviewedBy?: string
  reviewNotes?: string
}

const Profile: FC = () => {
  const { account, connectWallet, provider } = useWeb3()
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [ethBalance, setEthBalance] = useState<string>('0')
  const [isLoadingEthBalance, setIsLoadingEthBalance] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  
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
      
      // 加载用户提交的项目
      loadUserProjects()
    }
  }, [account])
  
  // 从localStorage加载项目并过滤出用户提交的项目
  const loadUserProjects = () => {
    if (!account) return;
    
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      if (savedProjects) {
        const allProjects: Project[] = JSON.parse(savedProjects);
        
        // 过滤出当前用户提交的项目
        const filteredProjects = allProjects.filter(
          project => project.submitter && 
          (project.submitter.toLowerCase() === account.toLowerCase() || 
           project.submitter.includes(account.substring(0, 6)))
        );
        
        setUserProjects(filteredProjects);
        console.log(`已加载用户项目: 找到${filteredProjects.length}个项目`);
      }
    } catch (error) {
      console.error('加载用户项目失败:', error);
    }
  };
  
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
    return userProjects.length;
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
      
      {(project.status === 'active' || project.status === 'completed') && (
        <>
          <Text fontWeight="bold" mb={1}>
            {t('projects.card.progress')}:
          </Text>
          <Progress 
            value={(project.progress / project.target) * 100} 
            colorScheme="green" 
            mb={4}
          />
          <Text fontSize="sm" mb={4}>
            {project.progress} / {project.target} {t('common.tons')} 
            ({Math.round((project.progress / project.target) * 100)}%)
          </Text>
        </>
      )}
      
      <Text fontWeight="bold" mb={2}>
        {t('projects.card.duration')}: {project.duration} {t('common.months')}
      </Text>
      
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontWeight="bold">
          {t('projects.card.status')}: {getStatusBadge(project.status)}
        </Text>
      </Flex>
      
      {/* 提交者和日期信息 */}
      <Divider my={3} />
      <VStack align="start" spacing={1} mt={3} fontSize="sm" color="gray.600">
        {project.submissionDate && (
          <Text>{t('projects.card.submitted')}: {project.submissionDate}</Text>
        )}
        {project.reviewDate && (
          <Text>{t('projects.card.reviewed')}: {project.reviewDate}</Text>
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