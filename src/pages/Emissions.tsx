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

interface EmissionRecord {
  id: number
  activity: string
  amount: number
  timestamp: number
}

const Emissions: FC = () => {
  const { account, contract, connectWallet } = useWeb3()
  const { t, language } = useLanguage()
  const [activity, setActivity] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emissions, setEmissions] = useState<EmissionRecord[]>([
    {
      id: 1,
      activity: '交通出行',
      amount: 2.5,
      timestamp: Date.now() - 86400000 * 2
    },
    {
      id: 2,
      activity: '电力使用',
      amount: 1.8,
      timestamp: Date.now() - 86400000
    }
  ])
  const toast = useToast()

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
    
    try {
      setIsSubmitting(true)
      // 这里应该调用合约方法记录排放
      // await contract.recordEmission(parseFloat(amount), activity)
      
      // 模拟记录成功
      setTimeout(() => {
        const newEmission: EmissionRecord = {
          id: emissions.length + 1,
          activity: emissionActivities.find(a => a.value === activity)?.label || activity,
          amount: parseFloat(amount),
          timestamp: Date.now()
        }
        
        setEmissions(prev => [newEmission, ...prev])
        
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
        setIsSubmitting(false)
      }, 2000)
    } catch (error) {
      console.error('记录失败:', error)
      toast({
        title: t('common.error'),
        description: t('emissions.record.error'),
        status: 'error',
        duration: 5000,
        isClosable: true
      })
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
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
                  />
                </FormControl>
                
                <Button type="submit" colorScheme="green" alignSelf="flex-end">
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
                    <Td isNumeric>{emission.amount.toFixed(2)}</Td>
                    <Td>{new Date(emission.timestamp).toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </>
      )}
    </Container>
  )
}

export default Emissions 