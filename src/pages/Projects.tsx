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
import { ethers } from 'ethers'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage } from '../contexts/LanguageContext'
import { UserRole } from '../contexts/Web3Context'
import { createContractService } from '../services/contractService'
import { RefreshCw } from 'lucide-react'
import ErrorDiagnostics from '../components/ErrorDiagnostics'
import { debugContractConnection, debugProjectReview } from '../utils/contractDebug'

// 违禁词列表
const PROHIBITED_WORDS = [
  'drug', 'drugs', '毒', '毒品', '违法', 'illegal', 'hack', 'hacking',
  'scam', '诈骗', '赌博', 'gambling', 'casino', '色情', 'porn', 'pornography'
];

interface Project {
  id: string  // 修改为字符串类型，与合约返回的数据保持一致
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
  isVerified?: boolean
}

const Projects: FC = () => {
  const { account, connectWallet, userRole, isVerifier, contract, provider, signer, chainId, connectionError } = useWeb3()
  const { t } = useLanguage()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure()

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [contractService, setContractService] = useState<any>(null)
  const [lastError, setLastError] = useState<any>(null)

  // 初始化合约服务
  useEffect(() => {
    if (contract && provider && signer && account) {
      const service = createContractService(contract, provider, signer, account)
      setContractService(service)
      
      // 运行合约连接诊断
       debugContractConnection(contract, provider).catch(console.error)
    }
  }, [contract, provider, signer, account, chainId])

  // 从区块链加载项目数据 - 使用逐个获取的方式避免BAD_DATA错误
  const loadProjects = async () => {
    console.log('🔄 开始加载项目数据...')
    console.log('🔧 合约服务状态:', !!contractService)
    console.log('👤 当前账户:', account)
    console.log('🔗 合约对象:', !!contract)
    console.log('🌐 当前网络链ID:', chainId)
    console.log('👥 用户角色 - isVerifier:', isVerifier)

    if (!contractService) {
      console.warn('⚠️ 合约服务未初始化，跳过加载')
      return
    }

    if (!account) {
      console.warn('⚠️ 账户未连接，跳过加载')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 使用逐个获取项目的方式避免BAD_DATA错误...')
      
      // 先检查区块链连接状态
      const blockNumber = await contractService.provider.getBlockNumber()
      console.log('🔗 当前区块号:', blockNumber)
      
      // 1. 获取所有项目ID列表
      console.log('📋 获取项目ID列表...')
      let projectIds: any[] = []
      try {
        // 尝试获取项目总数
        const stats = await contract.getPlatformStats()
        const totalProjects = Number(stats.totalProjects)
        console.log('📊 项目总数:', totalProjects)
        
        // 生成项目ID数组 (合约中项目ID从1开始)
        projectIds = Array.from({ length: totalProjects }, (_, i) => i + 1)
        console.log('📋 生成的项目ID列表:', projectIds)
      } catch (statsError) {
        console.warn('⚠️ 无法获取项目统计，尝试使用allProjectIds数组...')
        try {
          // 备用方案：尝试获取allProjectIds数组的长度
          // 由于不知道数组长度，我们尝试获取前20个ID
          for (let i = 0; i < 20; i++) {
            try {
              const projectId = await contract.allProjectIds(i)
              projectIds.push(Number(projectId))
            } catch {
              // 如果获取失败，说明已经到达数组末尾
              break
            }
          }
          console.log('📋 从allProjectIds获取的项目ID列表:', projectIds)
        } catch (idsError) {
          console.error('❌ 无法获取项目ID列表:', idsError)
          throw new Error('无法获取项目ID列表')
        }
      }

      const validProjects: any[] = [] // 创建一个只存放好项目的空数组
      let skippedCount = 0 // 记录跳过的损坏项目数量

      // 2. 使用 for 循环，一个一个地去获取项目
      for (const projectId of projectIds) {
        try {
          console.log(`🔍 正在获取项目 ID: ${projectId}...`)
          
          // 3. 核心：在循环内部使用 try...catch
          // 尝试获取单个项目的数据
          const projectData = await contract.projects(projectId)
          console.log(`✅ 项目 ${projectId} 数据获取成功:`, projectData)
          
          // 安全处理项目数据，转换为前端需要的格式
          const getSubmitter = () => {
            const provider = projectData.provider
            return provider && provider !== ethers.ZeroAddress ? provider : '未知提交者'
          }
          
          const getCreatedAt = () => {
            const timestamp = Number(projectData.createdAt) || 0
            return timestamp > 0 ? timestamp : Math.floor(Date.now() / 1000)
          }
          
          const getVerifier = () => {
            const verifier = projectData.verifier
            return verifier && verifier !== ethers.ZeroAddress ? verifier : undefined
          }
          
          const processedProject = {
            id: projectData.id.toString(),
            name: projectData.name || `项目 ${projectId}`,
            description: projectData.description || '暂无描述',
            location: projectData.projectType || '未分类',
            expectedCredits: Number(projectData.totalCredits) || 0,
            target: Number(projectData.totalCredits) || 0,
            progress: 0,
            duration: 12,
            submitter: getSubmitter(),
            status: Number(projectData.status) === 1 ? 'approved' : Number(projectData.status) === 2 ? 'rejected' : 'pending',
            verifier: getVerifier(),
            submissionTime: getCreatedAt(),
            submissionDate: new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN'),
            reviewTime: Number(projectData.status) === 1 ? getCreatedAt() : undefined,
            reviewDate: Number(projectData.status) === 1 ? new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN') : undefined,
            reviewedBy: getVerifier(),
            reviewNotes: projectData.reviewNotes || '',
            isVerified: Number(projectData.status) === 1
          }
          
          console.log(`✅ 项目 ${projectId} 处理完成:`, {
            originalId: projectData.id,
            stringId: projectData.id.toString(),
            numericId: Number(projectData.id),
            status: Number(projectData.status)
          })
          
          // 如果成功，将其添加到我们的好项目列表中
          validProjects.push(processedProject)
          console.log(`✅ 项目 ${projectId} 处理完成并添加到列表`)

        } catch (error) {
          // 4. 如果捕获到错误，说明这就是那个"坏苹果"！
          console.error(`❌ 无法获取项目 ID: ${projectId}。跳过此项目。`, error)
          skippedCount++
          // 我们什么都不做，直接进入下一次循环，把它忽略掉。
        }
      }

      // 5. 循环结束后，用只包含好项目的数组来更新状态
      setProjects(validProjects)
      
      // 成功加载数据后清除错误状态
      setLastError(null)

      console.log(`🎉 项目加载完成！总共处理 ${projectIds.length} 个项目，成功加载 ${validProjects.length} 个，跳过 ${skippedCount} 个损坏项目`)
      
      // 显示加载结果
      if (validProjects.length === 0) {
        toast({
          title: '提示',
          description: '区块链上暂无有效项目数据，请先提交一个测试项目',
          status: 'info',
          duration: 5000,
          isClosable: true
        })
      } else {
        const message = skippedCount > 0 
          ? `成功加载 ${validProjects.length} 个项目，跳过 ${skippedCount} 个损坏项目`
          : `成功加载 ${validProjects.length} 个项目`
        
        toast({
          title: '数据加载成功',
          description: message,
          status: skippedCount > 0 ? 'warning' : 'success',
          duration: 5000,
          isClosable: true
        })
      }
      
    } catch (error: any) {
      console.error('❌ 加载项目失败:', error)
      
      // 保存错误信息用于诊断
      setLastError(error)
      
      // 根据错误类型提供不同的提示
      let errorTitle = t('common.error')
      let errorDescription = `加载项目数据失败: ${error?.message || '未知错误'}`
      let duration = 5000
      
      if (error?.message?.includes('API请求限制') || 
          error?.message?.includes('RPC连接失败') ||
          error?.message?.includes('rate limit')) {
        errorTitle = 'RPC连接问题'
        errorDescription = '当前RPC端点可能已达到使用限制。\n\n解决方案：\n1. 稍后重试（点击刷新按钮）\n2. 配置自己的RPC端点（详见RPC_CONFIGURATION_GUIDE.md）\n3. 使用其他网络连接'
        duration = 10000
      } else if (error?.code === 'BAD_DATA') {
        errorTitle = '智能合约数据解析错误'
        errorDescription = '检测到损坏的项目数据。已启用逐个获取模式，请刷新页面重试。'
        duration = 8000
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        status: 'error',
        duration: duration,
        isClosable: true
      })
    } finally {
      setLoading(false)
      console.log('🏁 项目加载完成')
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

  // 页面可见性变化时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && contractService) {
        loadProjects()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [contractService])

  // 手动刷新函数
  const handleRefresh = () => {
    loadProjects()
  }

  // 创建测试项目的函数
  const createTestProject = async () => {
    if (!contractService) {
      console.error('❌ ContractService未初始化')
      toast({
        title: '错误',
        description: 'ContractService未初始化，请先连接钱包',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    if (!contract) {
      console.error('❌ 合约对象未初始化')
      toast({
        title: '错误',
        description: '合约对象未初始化，请检查网络连接',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setLoading(true)
      console.log('🧪 开始创建测试项目...')
      console.log('📋 合约地址:', contract.target || contract.address)
      console.log('👤 当前账户:', account)

      const testProject = {
        name: `测试项目 ${new Date().toLocaleString()}`,
        description: '这是一个用于测试的碳减排项目，包含太阳能发电设施',
        projectType: '可再生能源',
        expectedCredits: 100
      }

      console.log('📝 测试项目数据:', testProject)

      // 先检查当前项目数量
      console.log('🔍 提交前检查当前项目数量...')
      const beforeProjects = await contract.getAllProjects()
      console.log('📊 提交前项目数量:', beforeProjects.length)

      const txHash = await contractService.submitProject(
        testProject.name,
        testProject.description,
        testProject.projectType,
        testProject.expectedCredits
      )

      console.log('✅ 测试项目创建成功，交易哈希:', txHash)

      toast({
        title: '测试项目提交成功',
        description: `交易哈希: ${txHash.substring(0, 10)}...\n正在等待区块确认...`,
        status: 'success',
        duration: 8000,
        isClosable: true
      })

      // 等待交易确认
      console.log('⏳ 等待交易确认...')
      const receipt = await provider?.waitForTransaction(txHash)
      console.log('✅ 交易已确认:', receipt)

      // 检查提交后的项目数量
      console.log('🔍 提交后检查项目数量...')
      const afterProjects = await contract.getAllProjects()
      console.log('📊 提交后项目数量:', afterProjects.length)

      if (afterProjects.length > beforeProjects.length) {
        console.log('🎉 项目成功添加到区块链')
        toast({
          title: '项目确认成功',
          description: `项目已成功添加到区块链，项目数量从${beforeProjects.length}增加到${afterProjects.length}`,
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } else {
        console.warn('⚠️ 项目数量未增加，可能存在问题')
        toast({
          title: '警告',
          description: '交易已确认但项目数量未增加，请检查合约状态',
          status: 'warning',
          duration: 5000,
          isClosable: true
        })
      }

      // 重新加载项目列表
      console.log('🔄 重新加载项目列表...')
      await loadProjects()

    } catch (error: any) {
      console.error('❌ 创建测试项目失败:', error)
      toast({
        title: '创建测试项目失败',
        description: error.message || '未知错误',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    target: '',
    duration: ''
  })

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
    switch (status) {
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
    console.log('🚀 开始审核项目流程...')
    console.log('📋 选中的项目:', selectedProject)
    console.log('🔧 合约服务状态:', !!contractService)
    
    // 运行项目审核诊断
     if (selectedProject && contract) {
       debugProjectReview(contract, selectedProject.id).catch(console.error)
     }
    
    if (!selectedProject || !contractService) {
      console.error('❌ 项目信息或合约服务不可用')
      toast({
        title: t('common.error'),
        description: '项目信息或合约服务不可用',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }
    
    console.log('🔍 项目详细信息:')
    console.log('- ID:', selectedProject.id, '(类型:', typeof selectedProject.id, ')')
    console.log('- 名称:', selectedProject.name)
    console.log('- 状态:', selectedProject.status)
    console.log('- 是否已验证:', selectedProject.isVerified)
    console.log('- 提交者:', selectedProject.submitter)

    // 检查合约连接状态
    if (!contract) {
      toast({
        title: t('common.error'),
        description: '合约未连接，请检查钱包连接',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setLoading(true)
    try {
      console.log('🔍 开始审核项目:', {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        approve,
        reviewNotes,
        currentStatus: selectedProject.status
      })

      if (approve) {
        // 检查项目是否已经被验证过
        if (selectedProject.isVerified || selectedProject.status === 'approved') {
          toast({
            title: t('common.error'),
            description: '项目已经被验证过，无法重复验证',
            status: 'error',
            duration: 5000,
            isClosable: true
          })
          return
        }

        console.log('✅ 正在批准项目...')
        const txHash = await contractService.approveProject(selectedProject.id, reviewNotes)
        console.log('✅ 项目批准成功，交易哈希:', txHash)

        toast({
          title: t('common.success'),
          description: `项目已批准！交易哈希: ${txHash.substring(0, 10)}...`,
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } else {
        // 拒绝项目或删除项目
        if (selectedProject.status === 'approved' || selectedProject.status === 'active') {
          console.log('🗑️ 正在删除已批准的项目...')
          const txHash = await contractService.deleteProject(selectedProject.id)
          console.log('🗑️ 项目删除成功，交易哈希:', txHash)

          toast({
            title: t('common.success'),
            description: `项目已删除！交易哈希: ${txHash.substring(0, 10)}...`,
            status: 'info',
            duration: 3000,
            isClosable: true
          })
        } else {
          console.log('❌ 正在拒绝待审核项目...')
          const txHash = await contractService.rejectProject(selectedProject.id, reviewNotes)
          console.log('❌ 项目拒绝成功，交易哈希:', txHash)

          toast({
            title: t('common.success'),
            description: `项目已拒绝！交易哈希: ${txHash.substring(0, 10)}...`,
            status: 'info',
            duration: 3000,
            isClosable: true
          })
        }
      }

      // 等待一段时间后重新加载项目列表，确保区块链状态更新
      console.log('🔄 等待区块链状态更新...')
      setTimeout(async () => {
        await loadProjects()
        console.log('🔄 项目列表已重新加载')
      }, 2000)

    } catch (error: any) {
      console.error('❌ 审核项目失败:', error)

      let errorMessage = '操作失败'
      if (error.code === 4001) {
        errorMessage = '用户拒绝了交易'
      } else if (error.code === -32603) {
        errorMessage = '合约执行失败，请检查网络连接'
      } else if (error.message.includes('Already verified')) {
        errorMessage = '项目已经被验证过，无法重复验证'
      } else if (error.message.includes('revert')) {
        errorMessage = '合约执行被拒绝，请检查权限和项目状态'
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

  // 修复项目分类逻辑：
  // - 待审核：显示pending状态的项目
  // - 活跃项目：显示已审核通过的项目（approved状态）
  // - 已拒绝：显示被拒绝的项目
  console.log('🔍 所有项目数据:', projects)
  console.log('📊 项目状态分布:', projects.map(p => ({ id: p.id, name: p.name, status: p.status, isVerified: p.isVerified })))

  const pendingProjects = projects.filter(p => p.status === 'pending')
  const activeProjects = projects.filter(p => p.status === 'approved')
  const rejectedProjects = projects.filter(p => p.status === 'rejected')

  console.log('📋 待审核项目:', pendingProjects.length, pendingProjects)
  console.log('✅ 活跃项目:', activeProjects.length, activeProjects)
  console.log('❌ 已拒绝项目:', rejectedProjects.length, rejectedProjects)

  // 调试信息：显示每个项目的详细信息
  if (projects.length > 0) {
    console.log('🔍 项目详细信息:')
    projects.forEach((project, index) => {
      console.log(`项目 ${index + 1}:`, {
        id: project.id,
        name: project.name,
        status: project.status,
        submitter: project.submitter,
        submissionDate: project.submissionDate,
        isVerified: project.isVerified
      })
    })
  }

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
        {isVerifier && (
          project.status === 'pending' ? (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => openReviewModal(project)}
            >
              {t('projects.review.button')}
            </Button>
          ) : (project.status === 'approved' || project.status === 'active') ? (
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => openReviewModal(project)}
            >
              {t('projects.delete.button') || '删除'}
            </Button>
          ) : null
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
      <Flex justify="space-between" align="center" mb={2}>
        <Heading as="h1">{t('projects.title')}</Heading>
        <Flex align="center" gap={4}>
          {/* 连接状态指示器 */}
          <Box>
            {contractService && account ? (
              <Flex align="center" gap={2}>
                <Box w={2} h={2} bg="green.400" borderRadius="full" />
                <Text fontSize="sm" color="green.600">已连接</Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2}>
                <Box w={2} h={2} bg="red.400" borderRadius="full" />
                <Text fontSize="sm" color="red.600">未连接</Text>
              </Flex>
            )}
          </Box>
          <Button
            size="sm"
            variant="outline"
            colorScheme="green"
            onClick={handleRefresh}
            isLoading={loading}
            leftIcon={<RefreshCw size={16} />}
          >
            刷新
          </Button>
        </Flex>
      </Flex>
      <Text mb={4} color="gray.600">{t('projects.subtitle')}</Text>

      {/* 合约状态面板 */}
      <Box mb={6} p={4} bg={contract && contractService && !connectionError ? "green.50" : "red.50"} borderRadius="md" fontSize="sm" border="1px solid" borderColor={contract && contractService && !connectionError ? "green.200" : "red.200"}>
        <Text fontWeight="bold" mb={2} color={contract && contractService && !connectionError ? "green.600" : "red.600"}>
          {contract && contractService && !connectionError ? '✅ 合约连接正常' : '❌ 合约连接异常'}
        </Text>
        <VStack align="start" spacing={1}>
          <Text>📱 钱包连接: {account ? `✅ ${account.substring(0, 10)}...` : '❌ 未连接'}</Text>
          <Text>🌐 网络链ID: {chainId || '未知'}</Text>
          <Text>👥 用户角色: {userRole || '未设置'} {isVerifier ? '(验证者)' : '(普通用户)'}</Text>
          <Text>🔗 合约对象: {contract ? '✅ 已连接' : '❌ 未连接'}</Text>
          <Text>⚙️ 合约服务: {contractService ? '✅ 已初始化' : '❌ 未初始化'}</Text>
          <Text>📊 项目总数: {projects.length}</Text>
          <Text>📋 待审核项目: {pendingProjects.length}</Text>
          <Text>✅ 活跃项目: {activeProjects.length}</Text>
          <Text>❌ 已拒绝项目: {rejectedProjects.length}</Text>
          <Text>🔄 加载状态: {loading ? '加载中...' : '空闲'}</Text>
          
          {/* 实时诊断信息 */}
          {projects.length === 0 && account && contractService && (
            <Alert status="info" mt={2}>
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">诊断信息</AlertTitle>
                <AlertDescription fontSize="xs">
                  合约连接正常但无项目数据。请点击"创建测试项目"按钮提交一个测试项目，然后观察控制台日志。
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          {connectionError && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">合约连接错误</AlertTitle>
                <AlertDescription fontSize="xs">{connectionError}</AlertDescription>
              </Box>
            </Alert>
          )}
          {!contract || !contractService ? (
            <Alert status="warning" mt={2}>
              <AlertIcon />
              <Text fontSize="sm">请检查钱包连接和网络设置</Text>
            </Alert>
          ) : null}
        </VStack>
      </Box>

      {/* 错误诊断组件 */}
      {lastError && (
        <Box mb={6}>
          <ErrorDiagnostics
            error={lastError}
            contractAddress={contractService?.getContractAddress()}
            networkId={chainId || undefined}
          />
        </Box>
      )}

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
          <HStack spacing={4} mb={8}>
            <Button colorScheme="green" onClick={onOpen} isLoading={loading}>
              {t('projects.submit.button')}
            </Button>
            <Button
              colorScheme="orange"
              onClick={createTestProject}
              isLoading={loading}
            >
              创建测试项目
            </Button>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={createTestProject}
              isLoading={loading}
            >
              🧪 创建测试项目
            </Button>
          </HStack>

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
            {isVerifier && selectedProject && (
              <HStack spacing={4} width="100%">
                {/* 批准按钮 - 只对待审核项目显示 */}
                {selectedProject.status === 'pending' && !selectedProject.isVerified && (
                  <Button
                    colorScheme="green"
                    onClick={() => handleReviewProject(true)}
                    flex={1}
                    isLoading={loading}
                    leftIcon={<span>✅</span>}
                  >
                    {t('projects.review.approve') || '批准项目'}
                  </Button>
                )}
                
                {/* 拒绝/删除按钮 - 根据项目状态显示不同文本 */}
                <Button
                  colorScheme="red"
                  onClick={() => handleReviewProject(false)}
                  flex={selectedProject.status === 'pending' ? 1 : 2}
                  isLoading={loading}
                  leftIcon={<span>{selectedProject.status === 'approved' || selectedProject.status === 'active' ? '🗑️' : '❌'}</span>}
                >
                  {selectedProject.status === 'approved' || selectedProject.status === 'active'
                    ? t('projects.delete.button') || '删除项目'
                    : t('projects.review.reject') || '拒绝项目'}
                </Button>
              </HStack>
            )}
            
            {/* 非验证者用户显示提示 */}
            {!isVerifier && (
              <Text fontSize="sm" color="gray.500" textAlign="center" width="100%">
                只有验证者可以审核项目
              </Text>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default Projects