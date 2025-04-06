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
  TabPanels
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage } from '../contexts/LanguageContext'
import { UserRole } from '../contexts/Web3Context'

// 违禁词列表
const PROHIBITED_WORDS = [
  'drug', 'drugs', '毒', '毒品', '违法', 'illegal', 'hack', 'hacking', 
  'scam', '诈骗', '赌博', 'gambling', 'casino', '色情', 'porn', 'pornography'
];

// 本地存储键名
const STORAGE_KEY = 'carbon_app_projects';

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

const Projects: FC = () => {
  const { account, connectWallet, userRole, isVerifier } = useWeb3()
  const { t } = useLanguage()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure()
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  
  // 初始项目列表
  const initialProjects: Project[] = [
    {
      id: 1,
      name: '森林保护计划',
      description: '保护亚马逊雨林，减少森林砍伐，增加碳汇',
      target: 5000,
      progress: 3500,
      duration: 24,
      status: 'active',
      submitter: '0x1234...5678',
      submissionDate: '2023-10-01'
    },
    {
      id: 2,
      name: '可再生能源转型',
      description: '支持太阳能和风能项目，减少化石燃料使用',
      target: 3000,
      progress: 3000,
      duration: 12,
      status: 'completed',
      submitter: '0x8765...4321',
      submissionDate: '2023-09-15',
      reviewDate: '2023-09-20',
      reviewedBy: '0xe360...0ee4',
      reviewNotes: '项目符合减排标准，已验证完成'
    },
    {
      id: 3,
      name: '海洋碳捕获',
      description: '利用海藻养殖捕获大气中的二氧化碳',
      target: 2000,
      progress: 500,
      duration: 36,
      status: 'active',
      submitter: '0xabcd...efgh',
      submissionDate: '2023-08-20',
      reviewDate: '2023-08-25',
      reviewedBy: '0xe360...0ee4'
    },
    {
      id: 4,
      name: '工业减排项目',
      description: '改进工业流程，减少能源消耗和排放',
      target: 8000,
      progress: 0,
      duration: 48,
      status: 'pending',
      submitter: '0x2468...1357',
      submissionDate: '2023-10-10'
    },
    {
      id: 5,
      name: '建筑节能方案',
      description: '通过改进建筑隔热和能源系统减少碳排放',
      target: 3500,
      progress: 0,
      duration: 24,
      status: 'rejected',
      submitter: '0x1357...2468',
      submissionDate: '2023-09-01',
      reviewDate: '2023-09-10',
      reviewedBy: '0xe360...0ee4',
      reviewNotes: '项目不符合减排标准，缺乏技术可行性证明'
    }
  ];
  
  const [projects, setProjects] = useState<Project[]>([]);
  
  // 从本地存储加载项目数据
  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      // 首次加载使用初始项目列表
      setProjects(initialProjects);
      // 保存到本地存储
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProjects));
    }
  }, []);
  
  // 当项目列表变更时，更新本地存储
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);
  
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
  
  const handleSubmitProject = () => {
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
    
    // 自动审核通过
    const project: Project = {
      id: Math.max(0, ...projects.map(p => p.id)) + 1,
      name: newProject.name,
      description: newProject.description,
      target: parseFloat(newProject.target),
      progress: 0,
      duration: parseInt(newProject.duration),
      status: 'active',  // 直接设为活跃状态，无需等待审核
      submitter: account || '0xunknown',
      submissionDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date().toISOString().split('T')[0],
      reviewedBy: 'system',
      reviewNotes: '系统自动审核通过'
    }
    
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    
    toast({
      title: t('common.success'),
      description: t('projects.submit.success'),
      status: 'success',
      duration: 5000,
      isClosable: true
    })
    
    // 重置表单
    setNewProject({
      name: '',
      description: '',
      target: '',
      duration: ''
    })
    
    onClose()
  }
  
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
  
  // 打开审核模态框
  const openReviewModal = (project: Project) => {
    setSelectedProject(project)
    setReviewNotes(project.reviewNotes || '')
    onReviewOpen()
  }
  
  // 审核项目 - 验证者只能拒绝/删除项目
  const handleReviewProject = (approve: boolean) => {
    if (!selectedProject) return
    
    // 验证者只能拒绝项目，不能批准
    if (isVerifier && approve) {
      toast({
        title: t('common.error'),
        description: "验证者只能删除或拒绝项目，无法批准",
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return;
    }
    
    if (!approve) {
      // 拒绝逻辑
      const updatedProjects = projects.map(p => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            status: 'rejected' as const,
            reviewDate: new Date().toISOString().split('T')[0],
            reviewedBy: account || '0xunknown',
            reviewNotes: reviewNotes || '项目已被删除'
          }
        }
        return p
      })
      
      setProjects(updatedProjects)
      
      // 保存到本地存储
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      
      toast({
        title: t('common.success'),
        description: t('projects.review.rejected'),
        status: 'info',
        duration: 3000,
        isClosable: true
      })
    }
    
    setSelectedProject(null)
    setReviewNotes('')
    onReviewClose()
  }
  
  // 按状态过滤项目
  const filterProjectsByStatus = (status: string | string[]) => {
    if (Array.isArray(status)) {
      return projects.filter(p => status.includes(p.status))
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
          <Button colorScheme="green" mb={8} onClick={onOpen}>
            {t('projects.submit.button')}
          </Button>
          
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
            <Button colorScheme="green" onClick={handleSubmitProject}>
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
              <Button 
                colorScheme="red" 
                onClick={() => handleReviewProject(false)}
                width="100%"
              >
                {selectedProject && selectedProject.status === 'active' 
                  ? t('projects.delete.button') || '删除项目' 
                  : t('projects.review.reject')}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default Projects