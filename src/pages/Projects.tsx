import { FC, useState, useEffect } from 'react'
import {
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Box,
  Progress,
  Badge,
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
  Textarea,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Divider,
  HStack,
  VStack,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Spinner,
  Center
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage } from '../contexts/LanguageContext'
import { UserRole } from '../contexts/Web3Context'
import { createContractService } from '../services/contractService'

// 违禁词列表
const PROHIBITED_WORDS = [
  'drug', 'drugs', '毒', '毒品', '违法', 'illegal', 'hack', 'hacking', 
  'scam', '诈骗', '赌博', 'gambling', 'casino', '色情', 'porn', 'pornography'
];

interface Project {
  id: number
  name: string
  description: string
  target: number
  progress: number
  duration: number
  status: 'active' | 'completed' | 'pending' | 'rejected' | 'approved'
  submitter?: string
  submissionDate?: string
  reviewDate?: string
  reviewedBy?: string
  reviewNotes?: string
}

const Projects: FC = () => {
  const { account, connectWallet, userRole, isVerifier, contract, provider, signer } = useWeb3()
  const { t } = useLanguage()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure()
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [contractService, setContractService] = useState<any>(null)
  
  // 初始化合约服务
    useEffect(() => {
      if (contract && provider && signer && account) {
        const service = createContractService(contract, provider, signer, account)
        setContractService(service)
      }
    }, [contract, provider, signer, account])
  
  // 从区块链加载项目数据
  const loadProjects = async () => {
    if (!contractService) return
    
    setLoading(true)
    try {
      const projectsData = await contractService.getAllProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('加载项目失败:', error)
      toast({
        title: t('common.error'),
        description: '加载项目数据失败',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [contractService])

  // 添加定时刷新机制
  useEffect(() => {
    if (!contractService) return
    
    const interval = setInterval(() => {
      loadProjects()
    }, 10000) // 每10秒刷新一次
    
    return () => clearInterval(interval)
  }, [contractService])
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    target: '',
    duration: ''
  })
  
  const toast = useToast()
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProject({
      ...newProject,
      [name]: value
    })
  }

  // 检查文本中是否包含违禁词
  const containsProhibitedWords = (text: string): [boolean, string] => {
    const lowerText = text.toLowerCase();
    
    for (const word of PROHIBITED_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        return [true, word];
      }
    }
    
    return [false, ''];
  };
  
  const handleSubmitProject = async () => {
    if (!newProject.name || !newProject.description || !newProject.target || !newProject.duration) {
      toast({
        title: t('common.error'),
        description: t('projects.form.incomplete'),
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    if (!contractService) {
      toast({
        title: t('common.error'),
        description: '合约服务未初始化',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    // 检查名称和描述中是否包含违禁词
    const [nameContainsProhibited, prohibitedWordInName] = containsProhibitedWords(newProject.name);
    const [descContainsProhibited, prohibitedWordInDesc] = containsProhibitedWords(newProject.description);
    
    if (nameContainsProhibited || descContainsProhibited) {
      const prohibitedWord = nameContainsProhibited ? prohibitedWordInName : prohibitedWordInDesc;
      
      toast({
        title: t('common.error'),
        description: `您的提交包含违禁词"${prohibitedWord}"，请修改后重试`,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
      return;
    }
    
    setLoading(true)
    try {
      // 提交项目到区块链
      await contractService.submitProject(
        newProject.name,
        newProject.description,
        newProject.target, // 使用target作为projectType
        parseFloat(newProject.duration) // 使用duration作为expectedCredits
      )
      
      toast({
        title: t('common.success'),
        description: t('projects.submit.success'),
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
      // 立即重新加载项目列表
      await loadProjects()
      
      // 重置表单
      setNewProject({
        name: '',
        description: '',
        target: '',
        duration: ''
      })
      
      onClose()
    } catch (error: any) {
      console.error('提交项目失败:', error)
      
      let errorMessage = '提交失败'
      if (error.code === 4001) {
        errorMessage = '用户拒绝了交易'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }
  
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
  
  // 打开审核模态框
  const openReviewModal = (project: Project) => {
    setSelectedProject(project)
    setReviewNotes(project.reviewNotes || '')
    onReviewOpen()
  }
  
  // 审核项目
  const handleReviewProject = async (approve: boolean) => {
    if (!selectedProject || !contractService) return
    
    setLoading(true)
    try {
      if (approve) {
        // 批准项目
        await contractService.approveProject(selectedProject.id, reviewNotes)
        
        toast({
          title: t('common.success'),
          description: `项目已批准！`,
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } else {
        // 拒绝项目或删除项目
        if (selectedProject.status === 'active') {
          await contractService.deleteProject(selectedProject.id)
          toast({
            title: t('common.success'),
            description: '项目已删除',
            status: 'info',
            duration: 3000,
            isClosable: true
          })
        } else {
          await contractService.rejectProject(selectedProject.id, reviewNotes)
          toast({
            title: t('common.success'),
            description: t('projects.review.rejected'),
            status: 'info',
            duration: 3000,
            isClosable: true
          })
        }
      }
      
      // 立即重新加载项目列表
      await loadProjects()
      
    } catch (error: any) {
      console.error('审核项目失败:', error)
      
      let errorMessage = '操作失败'
      if (error.code === 4001) {
        errorMessage = '用户拒绝了交易'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
    
    setSelectedProject(null)
    setReviewNotes('')
    onReviewClose()
  }
  
  // 按状态过滤项目
  const filterProjectsByStatus = (status: string | string[]) => {
    if (Array.isArray(status)) {
      return projects.filter(p => {
        if (status.includes('active') && (p.status === 'active' || p.status === 'approved')) {
          return true
        }
        return status.includes(p.status)
      })
    }
    if (status === 'active') {
      return projects.filter(p => p.status === 'active' || p.status === 'approved')
    }
    return projects.filter(p => p.status === status)
  }
  
  const pendingProjects = filterProjectsByStatus('pending')
  const activeProjects = filterProjectsByStatus(['active', 'completed'])
  const rejectedProjects = filterProjectsByStatus('rejected')
  
  // 渲染项目卡片
  const renderProjectCard = (project: Project) => (
    <Box 
      key={project.id} 
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="lg"
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
        
        {/* 审核/删除按钮 - 仅对验证者显示且只能审核待审核项目或删除活跃项目 */}
        {((project.status === 'pending' || project.status === 'active') && isVerifier) && (
          <Button 
            size="sm" 
            colorScheme={project.status === 'pending' ? "blue" : "red"}
            onClick={() => openReviewModal(project)}
          >
            {project.status === 'pending' ? t('projects.review.button') : t('projects.delete.button') || '删除'}
          </Button>
        )}
      </Flex>
      
      {/* 提交者和日期信息 */}
      <Divider my={3} />
      <VStack align="start" spacing={1} mt={3} fontSize="sm" color="gray.600">
        {project.submitter && (
          <Text>{t('projects.card.submitter')}: {project.submitter}</Text>
        )}
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
  )
  
  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={2}>{t('projects.title')}</Heading>
      <Text mb={8} color="gray.600">{t('projects.subtitle')}</Text>
      
      {!account ? (
        <Alert status="info" mb={8}>
          <AlertIcon />
          <Box>
            <AlertTitle mb={1}>{t('market.connect.title')}</AlertTitle>
            <AlertDescription>{t('projects.connect.desc')}</AlertDescription>
            <Button colorScheme="green" mt={4} onClick={connectWallet}>
              {t('market.connect.button')}
            </Button>
          </Box>
        </Alert>
      ) : (
        <>
          <Button colorScheme="green" mb={8} onClick={onOpen} isLoading={loading}>
            {t('projects.submit.button')}
          </Button>
          
          {loading && (
            <Center mb={8}>
              <VStack>
                <Spinner size="lg" color="green.500" />
                <Text>加载项目数据中...</Text>
              </VStack>
            </Center>
          )}
          
          <Tabs variant="enclosed" colorScheme="green" mb={8}>
            <TabList>
              <Tab>{t('projects.tabs.active')}</Tab>
              {/* 只向验证者显示待审核标签 */}
              {isVerifier && (
                <Tab>
                  {t('projects.tabs.pending')} 
                  {pendingProjects.length > 0 && (
                    <Badge ml={2} colorScheme="yellow" borderRadius="full">
                      {pendingProjects.length}
                    </Badge>
                  )}
                </Tab>
              )}
              {/* 只向验证者显示已拒绝标签 */}
              {isVerifier && (
                <Tab>{t('projects.tabs.rejected')}</Tab>
              )}
            </TabList>
            
            <TabPanels>
              {/* 活跃项目 */}
              <TabPanel>
                {activeProjects.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    {t('projects.list.empty')}
                  </Alert>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
                    {activeProjects.map(renderProjectCard)}
                  </SimpleGrid>
                )}
              </TabPanel>
              
              {/* 待审核项目 - 仅对验证者显示 */}
              {isVerifier && (
                <TabPanel>
                  {pendingProjects.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      {t('projects.review.empty')}
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
                      {pendingProjects.map(renderProjectCard)}
                    </SimpleGrid>
                  )}
                </TabPanel>
              )}
              
              {/* 已拒绝项目 - 仅对验证者显示 */}
              {isVerifier && (
                <TabPanel>
                  {rejectedProjects.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      {t('projects.rejected.empty')}
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
                      {rejectedProjects.map(renderProjectCard)}
                    </SimpleGrid>
                  )}
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </>
      )}
      
      {/* 提交新项目的模态框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('projects.modal.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>{t('projects.modal.name')}</FormLabel>
              <Input 
                name="name"
                placeholder={t('projects.modal.name.placeholder')}
                value={newProject.name}
                onChange={handleInputChange}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>{t('projects.modal.description')}</FormLabel>
              <Textarea 
                name="description"
                placeholder={t('projects.modal.description.placeholder')}
                value={newProject.description}
                onChange={handleInputChange}
                rows={4}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>{t('projects.modal.target')}</FormLabel>
              <Input 
                name="target"
                type="number"
                min="1"
                step="1"
                placeholder={t('projects.modal.target.placeholder')}
                value={newProject.target}
                onChange={handleInputChange}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>{t('projects.modal.duration')}</FormLabel>
              <Input 
                name="duration"
                type="number"
                min="1"
                step="1"
                placeholder={t('projects.modal.duration.placeholder')}
                value={newProject.duration}
                onChange={handleInputChange}
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('projects.modal.cancel')}
            </Button>
            <Button colorScheme="green" onClick={handleSubmitProject} isLoading={loading}>
              {t('projects.modal.submit')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 审核项目的模态框 */}
      <Modal isOpen={isReviewOpen} onClose={onReviewClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProject && selectedProject.status === 'active' 
              ? t('projects.delete.title') || '删除项目' 
              : t('projects.review.title')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProject && (
              <>
                <VStack align="start" spacing={4} mb={4}>
                  <Heading size="md">{selectedProject.name}</Heading>
                  <Text>{selectedProject.description}</Text>
                  
                  <HStack justify="space-between" width="100%">
                    <Text fontWeight="bold">
                      {t('projects.card.target')}: {selectedProject.target} {t('common.tons')}
                    </Text>
                    <Text fontWeight="bold">
                      {t('projects.card.duration')}: {selectedProject.duration} {t('common.months')}
                    </Text>
                  </HStack>
                  
                  <Divider />
                  
                  <Text color="gray.600">
                    {t('projects.card.submitter')}: {selectedProject.submitter}
                  </Text>
                  <Text color="gray.600">
                    {t('projects.card.submitted')}: {selectedProject.submissionDate}
                  </Text>
                </VStack>
                
                <FormControl mb={4}>
                  <FormLabel>{t('projects.review.notes')}</FormLabel>
                  <Textarea 
                    placeholder={t('projects.review.notes.placeholder')}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </FormControl>
              </>
            )}
          </ModalBody>
          
          <ModalFooter>
            {isVerifier && (
              <HStack spacing={4} width="100%">
                {selectedProject && selectedProject.status === 'pending' && (
                  <Button 
                  colorScheme="green" 
                  onClick={() => handleReviewProject(true)}
                  flex={1}
                  isLoading={loading}
                >
                  {t('projects.review.approve') || '批准项目'}
                </Button>
              )}
              <Button 
                colorScheme="red" 
                onClick={() => handleReviewProject(false)}
                flex={1}
                isLoading={loading}
              >
                {selectedProject && selectedProject.status === 'active' 
                  ? t('projects.delete.button') || '删除项目' 
                  : t('projects.review.reject') || '拒绝项目'}
              </Button>
              </HStack>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default Projects