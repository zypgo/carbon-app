import { FC, useState } from 'react'
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
  AlertDescription
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage } from '../contexts/LanguageContext'

interface Project {
  id: number
  name: string
  description: string
  target: number
  progress: number
  duration: number
  status: 'active' | 'completed' | 'pending'
}

const Projects: FC = () => {
  const { account, connectWallet } = useWeb3()
  const { t } = useLanguage()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: '森林保护计划',
      description: '保护亚马逊雨林，减少森林砍伐，增加碳汇',
      target: 5000,
      progress: 3500,
      duration: 24,
      status: 'active'
    },
    {
      id: 2,
      name: '可再生能源转型',
      description: '支持太阳能和风能项目，减少化石燃料使用',
      target: 3000,
      progress: 3000,
      duration: 12,
      status: 'completed'
    },
    {
      id: 3,
      name: '海洋碳捕获',
      description: '利用海藻养殖捕获大气中的二氧化碳',
      target: 2000,
      progress: 500,
      duration: 36,
      status: 'active'
    }
  ])
  
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
    
    const project: Project = {
      id: projects.length + 1,
      name: newProject.name,
      description: newProject.description,
      target: parseFloat(newProject.target),
      progress: 0,
      duration: parseInt(newProject.duration),
      status: 'pending'
    }
    
    setProjects([...projects, project])
    
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
      default:
        return null
    }
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={4}>{t('projects.title')}</Heading>
      <Text mb={8} color="gray.600">
        {t('projects.subtitle')}
      </Text>
      
      {!account ? (
        <Alert status="warning" mb={8}>
          <AlertIcon />
          <AlertTitle>{t('market.connect.title')}</AlertTitle>
          <AlertDescription>
            {t('projects.connect.desc')}
            <Button ml={4} colorScheme="green" size="sm" onClick={connectWallet}>
              {t('market.connect.button')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Button colorScheme="green" mb={8} onClick={onOpen}>
          {t('projects.submit.button')}
        </Button>
      )}
      
      {projects.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          {t('projects.list.empty')}
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
          {projects.map((project) => (
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
              
              <Text fontWeight="bold" mb={2}>
                {t('projects.card.duration')}: {project.duration} {project.duration > 1 ? '个月' : '个月'}
              </Text>
              
              <Text fontWeight="bold">
                {t('projects.card.status')}: {getStatusBadge(project.status)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
      
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
    </Container>
  )
}

export default Projects 