import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  useToast
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'
import { debugContractConnection, debugProjectReview } from '../utils/contractDebug'

const ProjectDebug: React.FC = () => {
  const { contract, provider, account, isVerifier } = useWeb3()
  const [debugResults, setDebugResults] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // 运行完整的合约诊断
  const runFullDiagnostic = async () => {
    if (!contract || !provider) {
      toast({
        title: '错误',
        description: '合约或提供者未连接',
        status: 'error',
        duration: 3000
      })
      return
    }

    setLoading(true)
    console.log('🔧 开始完整诊断...')
    
    try {
      // 1. 合约连接诊断
      const connectionResult = await debugContractConnection(contract, provider)
      console.log('✅ 合约连接诊断完成:', connectionResult)
      
      // 2. 获取项目数据
      const allProjects = await contract.getAllProjects()
      console.log('📊 获取到的项目:', allProjects)
      setProjects(allProjects)
      
      // 3. 分析每个项目
      const projectAnalysis = allProjects.map((project: any, index: number) => {
        const id = (project.id || project[0]).toString()
        const name = project.name || project[2] || `项目 ${id}`
        const status = Number(project.status || project[8])
        const provider = project.provider || project[1]
        
        return {
          index,
          id,
          name,
          status,
          provider,
          rawData: project
        }
      })
      
      setDebugResults({
        connectionResult,
        projectCount: allProjects.length,
        projectAnalysis,
        timestamp: new Date().toISOString()
      })
      
      toast({
        title: '诊断完成',
        description: `发现 ${allProjects.length} 个项目`,
        status: 'success',
        duration: 3000
      })
      
    } catch (error: any) {
      console.error('❌ 诊断失败:', error)
      toast({
        title: '诊断失败',
        description: error.message,
        status: 'error',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // 测试项目审核
  const testProjectReview = async (projectId: string) => {
    if (!contract) return
    
    console.log('🔍 测试项目审核，项目ID:', projectId)
    const result = await debugProjectReview(contract, projectId)
    console.log('📊 审核测试结果:', result)
    
    toast({
      title: '审核测试完成',
      description: `项目 ${projectId} 测试结果已输出到控制台`,
      status: 'info',
      duration: 3000
    })
  }

  // 尝试审核项目0
  const attemptReviewProject0 = async () => {
    if (!contract) return
    
    setLoading(true)
    try {
      console.log('🚀 尝试审核项目0...')
      
      // 先检查项目是否存在
      await testProjectReview('0')
      
      // 尝试调用verifyProject
      console.log('📞 调用 verifyProject(0)...')
      const tx = await contract.verifyProject(0)
      console.log('✅ 交易发送成功:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ 交易确认:', receipt)
      
      toast({
        title: '审核成功',
        description: `项目0审核成功！交易: ${tx.hash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000
      })
      
    } catch (error: any) {
      console.error('❌ 审核失败:', error)
      toast({
        title: '审核失败',
        description: error.message,
        status: 'error',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Heading mb={6}>项目审核调试工具</Heading>
      
      <VStack spacing={6} align="stretch">
        {/* 连接状态 */}
        <Alert status={contract && provider ? 'success' : 'warning'}>
          <AlertIcon />
          <Box>
            <AlertTitle>连接状态</AlertTitle>
            <AlertDescription>
              合约: {contract ? '✅ 已连接' : '❌ 未连接'}<br/>
              提供者: {provider ? '✅ 已连接' : '❌ 未连接'}<br/>
              账户: {account || '未连接'}<br/>
              验证者权限: {isVerifier ? '✅ 是' : '❌ 否'}
            </AlertDescription>
          </Box>
        </Alert>

        {/* 操作按钮 */}
        <HStack spacing={4}>
          <Button 
            colorScheme="blue" 
            onClick={runFullDiagnostic}
            isLoading={loading}
            loadingText="诊断中..."
          >
            运行完整诊断
          </Button>
          
          <Button 
            colorScheme="green" 
            onClick={attemptReviewProject0}
            isLoading={loading}
            loadingText="审核中..."
            isDisabled={!isVerifier}
          >
            尝试审核项目0
          </Button>
        </HStack>

        {/* 诊断结果 */}
        {debugResults && (
          <Box>
            <Heading size="md" mb={4}>诊断结果</Heading>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>项目统计</AlertTitle>
                <AlertDescription>
                  发现 {debugResults.projectCount} 个项目
                </AlertDescription>
              </Box>
            </Alert>
            
            {debugResults.projectAnalysis.map((project: any) => (
              <Box key={project.index} p={4} border="1px" borderColor="gray.200" borderRadius="md" mb={4}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">项目 {project.index}</Text>
                  <Button 
                    size="sm" 
                    onClick={() => testProjectReview(project.id)}
                  >
                    测试审核
                  </Button>
                </HStack>
                <Text>ID: <Code>{project.id}</Code></Text>
                <Text>名称: {project.name}</Text>
                <Text>状态: {project.status} ({project.status === 0 ? '待审核' : project.status === 1 ? '已批准' : '已拒绝'})</Text>
                <Text>提交者: <Code fontSize="sm">{project.provider}</Code></Text>
                <Divider my={2} />
                <Text fontSize="sm" color="gray.600">原始数据:</Text>
                <Code fontSize="xs" p={2} display="block" whiteSpace="pre-wrap">
                  {JSON.stringify(project.rawData, null, 2)}
                </Code>
              </Box>
            ))}
          </Box>
        )}

        {/* 控制台提示 */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>调试信息</AlertTitle>
            <AlertDescription>
              详细的调试信息会输出到浏览器控制台。请按 F12 打开开发者工具查看。
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  )
}

export default ProjectDebug