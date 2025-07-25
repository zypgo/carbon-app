import React from 'react'
import {
  Box,

  VStack,

  Text,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from '@chakra-ui/react'
import { useWeb3 } from '../contexts/Web3Context'


const ProjectDebug: React.FC = () => {
  const { contract, provider, account, isVerifier } = useWeb3()
  const toast = useToast()



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