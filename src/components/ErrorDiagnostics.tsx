import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse,
  Code,
  Divider,
  Badge,
  useDisclosure,
  useColorModeValue,
  Textarea,
  useToast
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon, AlertTriangleIcon, InfoIcon, CopyIcon } from 'lucide-react'
import { HexDataParser } from '../utils/hexDataParser'

interface ErrorDiagnosticsProps {
  error?: any
  contractAddress?: string
  networkId?: number
}

export const ErrorDiagnostics: React.FC<ErrorDiagnosticsProps> = ({
  error,
  contractAddress,
  networkId
}) => {
  const { isOpen, onToggle } = useDisclosure()
  const [showRawData, setShowRawData] = useState(false)
  const [showDiagnosticReport, setShowDiagnosticReport] = useState(false)
  const toast = useToast()

  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // 生成诊断报告
  const diagnosticReport = error?.data ? HexDataParser.createDiagnosticReport(error.data, error) : null
  
  // 复制到剪贴板功能
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: '已复制到剪贴板',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }).catch(() => {
      toast({
        title: '复制失败',
        status: 'error',
        duration: 2000,
        isClosable: true,
      })
    })
  }

  if (!error) return null

  const isBadDataError = error.code === 'BAD_DATA'
  const isNetworkError = error.code === 'NETWORK_ERROR'
  const isCallException = error.code === 'CALL_EXCEPTION'

  const getDiagnosisMessage = () => {
    if (isBadDataError) {
      return {
        title: '智能合约数据解析错误',
        description: '合约返回的数据格式与预期不符，可能是合约版本不匹配或ABI配置错误。',
        severity: 'error' as const,
        icon: AlertTriangleIcon
      }
    }
    
    if (isNetworkError) {
      return {
        title: '网络连接错误',
        description: 'RPC端点连接失败，请检查网络连接或更换RPC端点。',
        severity: 'warning' as const,
        icon: AlertTriangleIcon
      }
    }
    
    if (isCallException) {
      return {
        title: '合约调用异常',
        description: '合约方法调用失败，可能是合约地址错误或方法不存在。',
        severity: 'error' as const,
        icon: AlertTriangleIcon
      }
    }
    
    return {
      title: '未知错误',
      description: '发生了未知错误，请查看详细信息。',
      severity: 'info' as const,
      icon: InfoIcon
    }
  }

  const getSolutions = () => {
    if (isBadDataError) {
      return [
        '检查合约地址是否正确配置',
        '验证智能合约ABI是否与部署的合约匹配',
        '确认网络ID是否正确（当前: ' + (networkId || '未知') + '）',
        '尝试重新部署合约或更新ABI文件',
        '检查合约是否已正确部署到当前网络'
      ]
    }
    
    if (isNetworkError) {
      return [
        '检查网络连接是否正常',
        '更换RPC端点（参考 RPC_CONFIGURATION_GUIDE.md）',
        '配置自己的Infura或Alchemy端点',
        '检查防火墙设置',
        '稍后重试（可能是临时网络问题）'
      ]
    }
    
    if (isCallException) {
      return [
        '验证合约地址: ' + (contractAddress || '未配置'),
        '检查合约是否已部署到当前网络',
        '确认调用的方法名称和参数正确',
        '检查账户权限（某些方法可能需要特定角色）',
        '查看合约事件日志获取更多信息'
      ]
    }
    
    return [
      '查看浏览器控制台获取更多错误信息',
      '尝试刷新页面',
      '检查钱包连接状态',
      '联系技术支持'
    ]
  }

  const diagnosis = getDiagnosisMessage()
  const solutions = getSolutions()

  return (
    <Box w="full" p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
      <Alert status={diagnosis.severity} variant="left-accent">
        <AlertIcon as={diagnosis.icon} />
        <Box flex="1">
          <AlertTitle fontSize="md">{diagnosis.title}</AlertTitle>
          <AlertDescription fontSize="sm" mt={1}>
            {diagnosis.description}
          </AlertDescription>
        </Box>
      </Alert>

      <VStack align="stretch" mt={4} spacing={3}>
        {/* 错误基本信息 */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="semibold" fontSize="sm">错误信息</Text>
            <Badge colorScheme={diagnosis.severity === 'error' ? 'red' : 'orange'}>
              {error.code || 'UNKNOWN'}
            </Badge>
          </HStack>
          <Code p={2} fontSize="xs" bg="gray.100" borderRadius="md" display="block">
            {error.message || '无错误消息'}
          </Code>
        </Box>

        {/* 解决方案 */}
        <Box>
          <Text fontWeight="semibold" fontSize="sm" mb={2}>建议解决方案</Text>
          <VStack align="stretch" spacing={1}>
            {solutions.map((solution, index) => (
              <HStack key={index} align="flex-start">
                <Text fontSize="xs" color="gray.500" mt={0.5}>{index + 1}.</Text>
                <Text fontSize="xs">{solution}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* 详细信息切换 */}
        <Divider />
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          rightIcon={isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        >
          {isOpen ? '隐藏' : '显示'}详细错误信息
        </Button>

        <Collapse in={isOpen}>
          <VStack align="stretch" spacing={3} pt={2}>
            {/* 合约信息 */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={2}>合约信息</Text>
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.600">合约地址:</Text>
                  <Code fontSize="xs">{contractAddress || '未配置'}</Code>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.600">网络ID:</Text>
                  <Code fontSize="xs">{networkId || '未知'}</Code>
                </HStack>
              </VStack>
            </Box>

            {/* 原始错误数据 */}
            {isBadDataError && error.data && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="semibold" fontSize="sm">原始返回数据</Text>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={<ChevronDownIcon size={12} />}
                      onClick={() => setShowRawData(!showRawData)}
                    >
                      {showRawData ? '隐藏' : '显示'}原始数据
                    </Button>
                    
                    {diagnosticReport && (
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<ChevronDownIcon size={12} />}
                        onClick={() => setShowDiagnosticReport(!showDiagnosticReport)}
                      >
                        {showDiagnosticReport ? '隐藏' : '显示'}诊断报告
                      </Button>
                    )}
                  </HStack>
                </HStack>
                <Collapse in={showRawData}>
                  <Code
                    p={2}
                    fontSize="xs"
                    bg="gray.100"
                    borderRadius="md"
                    display="block"
                    whiteSpace="pre-wrap"
                    wordBreak="break-all"
                  >
                    {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
                  </Code>
                </Collapse>
                
                {/* 诊断报告 */}
                {diagnosticReport && (
                  <Collapse in={showDiagnosticReport}>
                    <Box mt={3}>
                      <Text fontWeight="semibold" fontSize="sm" mb={2}>十六进制数据诊断报告</Text>
                      <VStack align="stretch" spacing={2}>
                        {diagnosticReport.analysis.map((item, index) => (
                          <Box key={index} p={2} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" fontWeight="medium">{item.field}</Text>
                              <Badge size="sm" colorScheme={item.status === 'valid' ? 'green' : 'red'}>
                                {item.status}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">{item.description}</Text>
                            {item.value && (
                              <Code fontSize="xs" mt={1} display="block">{item.value}</Code>
                            )}
                          </Box>
                        ))}
                        
                        {diagnosticReport.suggestions.length > 0 && (
                          <Box mt={2}>
                            <Text fontSize="xs" fontWeight="medium" mb={1}>建议:</Text>
                            <VStack align="stretch" spacing={1}>
                              {diagnosticReport.suggestions.map((suggestion, index) => (
                                <Text key={index} fontSize="xs" color="blue.600">• {suggestion}</Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                        
                        <HStack justify="flex-end" mt={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            leftIcon={<CopyIcon size={12} />}
                            onClick={() => copyToClipboard(JSON.stringify(diagnosticReport, null, 2))}
                          >
                            复制报告
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </Collapse>
                )}
              </Box>
            )}

            {/* 完整错误堆栈 */}
            {error.stack && (
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={2}>错误堆栈</Text>
                <Code
                  p={2}
                  fontSize="xs"
                  bg="gray.100"
                  borderRadius="md"
                  display="block"
                  whiteSpace="pre-wrap"
                  maxH="200px"
                  overflowY="auto"
                >
                  {error.stack}
                </Code>
              </Box>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  )
}

export default ErrorDiagnostics