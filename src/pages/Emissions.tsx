import { FC, useState, useEffect } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage } from '../contexts/LanguageContext'
import { createContractService, EmissionRecord } from '../services/contractService'

const Emissions: FC = () => {
  const { account, contract, connectWallet, provider, signer } = useWeb3()
  const { t, language } = useLanguage()
  const [activity, setActivity] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emissions, setEmissions] = useState<EmissionRecord[]>([])
  const toast = useToast()

  // 加载排放记录
    const loadEmissions = async () => {
      if (!contract || !account || !provider || !signer) return
      
      try {
        setIsLoading(true)
        const contractService = createContractService(contract, provider, signer, account)
        const records = await contractService.getEmissionRecords(account)
        setEmissions(records)
     } catch (error) {
       console.error('加载排放记录失败:', error)
       toast({
         title: t('common.error'),
         description: '加载排放记录失败',
         status: 'error',
         duration: 3000,
         isClosable: true
       })
     } finally {
       setIsLoading(false)
     }
   }

  useEffect(() => {
    loadEmissions()
  }, [contract, account])

  // 根据当前语言获取活动类型选项
  const getEmissionActivities = () => {
    if (language === 'zh') {
      return [
        { value: 'transportation', label: '交通出行' },
        { value: 'electricity', label: '电力使用' },
        { value: 'heating', label: '供暖' },
        { value: 'industrial', label: '工业生产' },
        { value: 'other', label: '其他活动' }
      ]
    } else {
      return [
        { value: 'transportation', label: 'Transportation' },
        { value: 'electricity', label: 'Electricity' },
        { value: 'heating', label: 'Heating' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'other', label: 'Other Activities' }
      ]
    }
  }

  const emissionActivities = getEmissionActivities()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
    
    if (!activity || !amount || parseFloat(amount) <= 0) {
      toast({
        title: t('common.error'),
        description: t('emissions.form.error'),
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    if (!contract || !signer || !provider) {
      toast({
        title: t('common.error'),
        description: '合约未连接',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    try {
         setIsSubmitting(true)
         const contractService = createContractService(contract, provider, signer, account)
         
         // 调用合约方法记录排放
         await contractService.recordEmission(
           parseFloat(amount),
           emissionActivities.find(a => a.value === activity)?.label || activity
         )
      
      toast({
        title: t('common.success'),
        description: t('emissions.record.success'),
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
      // 重置表单
      setActivity('')
      setAmount('')
      
      // 重新加载排放记录
      await loadEmissions()
      
    } catch (error) {
      console.error('记录失败:', error)
      toast({
        title: t('common.error'),
        description: t('emissions.record.error'),
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 计算总排放量
  const totalEmissions = emissions.reduce((sum, emission) => sum + emission.amount, 0)
  const averageEmission = emissions.length > 0 ? totalEmissions / emissions.length : 0

  if (isLoading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="green.500" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={4}>{t('emissions.title')}</Heading>
      <Text mb={8} color="gray.600">
        {t('emissions.subtitle')}
      </Text>

      {/* 统计信息卡片 */}
      {account && (
        <VStack spacing={4} mb={8}>
          <Box w="full" p={6} borderWidth="1px" borderRadius="lg" bg="green.50">
            <Heading size="md" mb={4} color="green.700">排放统计</Heading>
            <VStack spacing={2} align="start">
              <Text><strong>总排放量:</strong> {totalEmissions.toFixed(2)} kg CO₂</Text>
              <Text><strong>平均排放量:</strong> {averageEmission.toFixed(2)} kg CO₂</Text>
              <Text><strong>记录数量:</strong> {emissions.length} 条</Text>
            </VStack>
          </Box>
        </VStack>
      )}

      {!account ? (
        <Alert status="warning" mb={8}>
          <AlertIcon />
          <AlertTitle>{t('market.connect.title')}</AlertTitle>
          <AlertDescription>
            {t('emissions.connect.desc')}
            <Button ml={4} colorScheme="green" size="sm" onClick={connectWallet}>
              {t('market.connect.button')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Box mb={8} p={6} borderWidth="1px" borderRadius="lg">
            <Heading size="md" mb={4}>{t('emissions.form.title')}</Heading>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>{t('emissions.form.activity')}</FormLabel>
                  <Select 
                    placeholder={t('emissions.form.activity.placeholder')} 
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                  >
                    {emissionActivities.map(activity => (
                      <option key={activity.value} value={activity.value}>
                        {activity.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>{t('emissions.form.amount')}</FormLabel>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="请输入排放量 (kg CO₂)"
                  />
                </FormControl>
                
                <Button 
                  type="submit" 
                  colorScheme="green" 
                  alignSelf="flex-end"
                  isLoading={isSubmitting}
                  loadingText="记录中..."
                  isDisabled={!activity || !amount || parseFloat(amount) <= 0}
                >
                  {t('emissions.form.submit')}
                </Button>
              </VStack>
            </form>
          </Box>

          <Heading size="md" mb={4}>{t('emissions.history.title')}</Heading>
          {emissions.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              {t('emissions.history.empty')}
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>{t('emissions.table.activity')}</Th>
                    <Th isNumeric>{t('emissions.table.amount')}</Th>
                    <Th>{t('emissions.table.time')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {emissions.map((emission) => (
                    <Tr key={emission.id}>
                      <Td>{emission.id}</Td>
                      <Td>{emission.activity}</Td>
                      <Td isNumeric>{emission.amount.toFixed(2)} kg CO₂</Td>
                      <Td>{new Date(emission.timestamp * 1000).toLocaleString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default Emissions