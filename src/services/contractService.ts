import { ethers } from 'ethers'
import { useToast } from '@chakra-ui/react'

// 智能合约接口定义
export interface EmissionRecord {
  id: number
  user: string
  amount: number
  activity: string
  source?: string
  timestamp: number
  verified: boolean
  isVerified: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  location: string
  expectedCredits: number
  submitter: string
  status: 'pending' | 'approved' | 'rejected'
  verifier?: string
  submissionTime: number
  reviewTime?: number
  reviewNotes?: string
  reviewedBy?: string
  progress?: number
  target?: number
  duration?: number
  isVerified?: boolean
}

export interface CreditListing {
  id: string
  seller: string
  amount: number
  pricePerCredit: number
  totalPrice: number
  active: boolean
  timestamp: number
  projectId: string
}

export interface Transaction {
  id: string
  type: 'buy' | 'sell' | 'mint' | 'emission'
  amount: number
  price?: number
  from: string
  to?: string
  counterparty?: string
  date?: string
  txHash: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

// 智能合约服务类
export class ContractService {
  private contract: any
  private provider: ethers.BrowserProvider
  private signer: ethers.JsonRpcSigner
  private account: string

  constructor(contract: any, provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, account: string) {
    this.contract = contract
    this.provider = provider
    this.signer = signer
    this.account = account
  }

  // 记录碳排放
  async recordEmission(amount: number, activity: string): Promise<string> {
    try {
      console.log('正在记录碳排放:', { amount, activity })

      const tx = await this.contract.recordEmission(
        ethers.parseUnits(amount.toString(), 18),
        activity
      )

      console.log('交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('记录碳排放失败:', error)
      throw new Error(`记录碳排放失败: ${error.message}`)
    }
  }

  // 获取用户的碳排放记录
  async getUserEmissions(): Promise<EmissionRecord[]> {
    try {
      console.log('获取用户碳排放记录...')

      const emissions = await this.contract.getUserEmissions(this.account)

      return emissions.map((emission: any) => ({
        id: Number(emission.id),
        user: emission.user,
        amount: Number(ethers.formatUnits(emission.amount, 18)),
        activity: emission.activity,
        timestamp: Number(emission.timestamp),
        verified: emission.verified,
        isVerified: emission.verified
      }))
    } catch (error: any) {
      console.error('获取碳排放记录失败:', error)
      return []
    }
  }

  // 获取排放记录的别名方法
  async getEmissionRecords(userAddress: string): Promise<EmissionRecord[]> {
    return this.getUserEmissions()
  }

  // 验证排放记录（仅验证者）
  async verifyEmission(emissionId: number): Promise<string> {
    try {
      console.log('正在验证排放记录:', { emissionId })

      const tx = await this.contract.verifyEmission(emissionId)

      console.log('验证交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('验证交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('验证排放记录失败:', error)
      throw new Error(`验证排放记录失败: ${error.message}`)
    }
  }

  // 提交减碳项目
  async submitProject(name: string, description: string, projectType: string, expectedCredits: number, documentHash?: string): Promise<string> {
    try {
      console.log('正在提交减碳项目:', { name, description, projectType, expectedCredits, documentHash })

      // 如果没有提供documentHash，生成一个默认值
      const finalDocumentHash = documentHash || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const tx = await this.contract.createProject(
        name,
        description,
        projectType,
        expectedCredits, // 直接使用整数，不转换为wei
        finalDocumentHash
      )

      console.log('项目提交交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('项目提交交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('提交项目失败:', error)
      throw new Error(`提交项目失败: ${error.message}`)
    }
  }

  // 获取所有项目
  async getAllProjects(): Promise<Project[]> {
    try {
      console.log('🔍 开始获取所有项目...')
      console.log('📋 合约地址:', this.contract.target || this.contract.address)
      console.log('👤 当前账户:', this.account)

      // 检查合约连接状态
      if (!this.contract) {
        console.error('❌ 合约未初始化')
        throw new Error('合约未初始化')
      }

      // 检查RPC连接状态
      try {
        const blockNumber = await this.provider.getBlockNumber()
        console.log('✅ RPC连接正常，当前区块:', blockNumber)
      } catch (rpcError: any) {
        console.error('❌ RPC连接失败:', rpcError)
        
        // 检查是否是API限制问题
        if (rpcError?.message?.includes('rate limit') || 
            rpcError?.message?.includes('429') ||
            rpcError?.message?.includes('quota') ||
            rpcError?.code === 429) {
          throw new Error('API请求限制：当前RPC端点已达到使用限制，请稍后重试或配置自己的RPC端点。详见RPC_CONFIGURATION_GUIDE.md')
        }
        
        throw new Error(`RPC连接失败: ${rpcError?.message || rpcError}`)
      }

      console.log('📞 正在调用合约的getAllProjects方法...')
      
      // 调用合约方法获取项目数据
      const allProjects = await this.contract.getAllProjects()
      console.log('📊 合约返回的原始数据:', allProjects)
      console.log('📈 项目数量:', allProjects.length)
      
      // 验证返回数据的结构
      if (!Array.isArray(allProjects)) {
        console.error('❌ 合约返回数据格式错误，期望数组，实际:', typeof allProjects)
        throw new Error('合约返回数据格式错误')
      }

      const projects: Project[] = []

      for (let i = 0; i < allProjects.length; i++) {
        try {
          const project = allProjects[i]
          console.log(`🔍 处理项目 ${i}:`, project)

          // 根据新合约ABI定义，项目结构体字段顺序：
          // 0: id (uint256)
          // 1: provider (address)
          // 2: name (string)
          // 3: description (string)
          // 4: projectType (string)
          // 5: totalCredits (uint256)
          // 6: availableCredits (uint256)
          // 7: pricePerCredit (uint256)
          // 8: status (uint8 enum) - 0: Pending, 1: Approved, 2: Rejected
          // 9: verifier (address)
          // 10: createdAt (uint256)
          // 11: documentHash (string)
          // 12: reviewNotes (string)

          // 处理项目状态 - 新合约使用status字段而不是verified
          let status: 'pending' | 'approved' | 'rejected' = 'pending'
          const projectStatus = Number(project.status || project[8] || 0)
          
          if (projectStatus === 1) {
            status = 'approved'
          } else if (projectStatus === 2) {
            status = 'rejected'
          } else {
            status = 'pending'
          }

          console.log(`📋 项目 ${i} 状态: ${projectStatus} -> ${status}`)

          // 检查项目是否已经被验证过
          const isVerified = projectStatus === 1

          // 安全地获取字段值，支持结构体和数组两种格式
          const getId = () => (project.id || project[0]).toString()
          const getName = () => project.name || project[2] || `项目 ${getId()}`
          const getDescription = () => project.description || project[3] || '暂无描述'
          const getProjectType = () => project.projectType || project[4] || '未分类'
          const getTotalCredits = () => Number(project.totalCredits || project[5]) || 0 // 直接使用整数，不需要格式化
          const getProvider = () => {
            const provider = project.provider || project[1]
            return provider && provider !== ethers.ZeroAddress ? provider : '未知提交者'
          }
          const getVerifier = () => {
            const verifier = project.verifier || project[9]
            return verifier && verifier !== ethers.ZeroAddress ? verifier : undefined
          }
          const getCreatedAt = () => {
            const timestamp = Number(project.createdAt || project[10]) || 0
            return timestamp > 0 ? timestamp : Math.floor(Date.now() / 1000) // 如果时间戳为0，使用当前时间
          }
          const getReviewNotes = () => project.reviewNotes || project[12] || ''

          const processedProject = {
            id: getId(),
            name: getName(),
            description: getDescription(),
            location: getProjectType(),
            expectedCredits: getTotalCredits(),
            target: getTotalCredits(),
            progress: 0,
            duration: 12,
            submitter: getProvider(),
            status: status,
            verifier: getVerifier(),
            submissionTime: getCreatedAt(),
            submissionDate: new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN'),
            reviewTime: isVerified ? getCreatedAt() : undefined,
            reviewDate: isVerified ? new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN') : undefined,
            reviewedBy: getVerifier(),
            reviewNotes: getReviewNotes(),
            isVerified: isVerified
          }

          console.log(`✅ 项目 ${i} 处理完成:`, processedProject)
          projects.push(processedProject)
        } catch (error) {
          console.warn(`⚠️ 处理项目 ${i} 失败:`, error)
          // 继续处理下一个项目，不中断整个流程
        }
      }

      console.log('🎉 最终项目列表:', projects)
      console.log('📊 总共处理了', projects.length, '个项目')
      return projects
      
    } catch (contractError: any) {
      console.error('❌ 合约调用失败:', contractError)
      
      // 特殊处理BAD_DATA错误
      if (contractError.code === 'BAD_DATA') {
        console.error('🔍 BAD_DATA错误详情:')
        console.error('- 错误代码:', contractError.code)
        console.error('- 错误信息:', contractError.message)
        console.error('- 方法签名:', contractError.info?.signature)
        console.error('- 原始数据:', contractError.info?.method)
        
        // 尝试解析十六进制数据
        if (contractError.data) {
          console.error('- 返回数据:', contractError.data)
          try {
            // 根据ABI定义尝试解码返回数据
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
              ['tuple(uint256,address,string,string,string,uint256,uint256,uint256,uint8,address,uint256,string,string)[]'],
              contractError.data
            )
            console.log('✅ 成功解码数据:', decoded)
            return this.processProjectData(decoded[0])
          } catch (decodeError) {
            console.error('❌ 数据解码失败:', decodeError)
            
            // 尝试其他可能的解码格式
            try {
              // 尝试简化的解码格式
              const simpleDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256[]'],
                contractError.data
              )
              console.log('✅ 简化解码成功:', simpleDecoded)
            } catch (simpleDecodeError) {
              console.error('❌ 简化解码也失败:', simpleDecodeError)
            }
          }
        }
        
        throw new Error('智能合约数据解析错误：可能是合约版本不匹配或数据格式变更。请检查合约地址和ABI配置。')
      }
      
      // 处理其他类型的错误
      if (contractError.code === 'CALL_EXCEPTION') {
        console.error('📞 合约调用异常，可能的原因:')
        console.error('- 合约地址错误或合约未部署')
        console.error('- 方法名称不存在')
        console.error('- 网络连接问题')
        throw new Error('合约调用失败：请检查合约地址和网络连接')
      }
      
      // 如果是网络错误，提供更详细的信息
      if (contractError.code === 'NETWORK_ERROR') {
        console.error('🌐 网络连接错误，请检查网络连接')
      } else if (contractError.code === 'CALL_EXCEPTION') {
        console.error('📞 合约调用异常，可能是合约地址错误或方法不存在')
      } else if (contractError.code === 'BAD_DATA') {
        console.error('📊 数据解析错误，可能是合约ABI不匹配')
      }

      return []
    }
  }

  // 审核项目（仅验证者）
  async reviewProject(projectId: string, approved: boolean): Promise<string> {
    try {
      console.log('正在审核项目:', { projectId, approved })

      const tx = await this.contract.verifyProject(projectId)

      console.log('项目审核交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('项目审核交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('审核项目失败:', error)
      throw new Error(`审核项目失败: ${error.message}`)
    }
  }

  // 批准项目
  async approveProject(projectId: string, notes?: string): Promise<string> {
    try {
      console.log('🔍 正在批准项目:', { projectId, notes, projectIdType: typeof projectId })

      // 确保项目ID是数字类型
      const numericProjectId = Number(projectId)
      if (isNaN(numericProjectId)) {
        throw new Error(`无效的项目ID: ${projectId}`)
      }

      console.log('📊 转换后的项目ID:', numericProjectId)

      // 先检查项目状态
      console.log('🔍 获取所有项目以验证项目存在性...')
      const allProjects = await this.contract.getAllProjects()
      console.log('📊 获取到的所有项目:', allProjects)
      console.log('🔍 查找项目ID:', projectId, '类型:', typeof projectId)
      
      // 详细记录每个项目的ID信息
      allProjects.forEach((p: any, index: number) => {
        const rawId = p.id || p[0]
        const stringId = rawId.toString()
        console.log(`项目 ${index}: 原始ID=${rawId} (类型: ${typeof rawId}), 字符串ID=${stringId}, 匹配=${stringId === projectId}`)
      })
      
      let project = allProjects.find((p: any) => {
        const pId = (p.id || p[0]).toString()
        console.log(`🔍 比较项目ID: ${pId} === ${projectId} ? ${pId === projectId}`)
        return pId === projectId
      })

      if (!project) {
        console.error('❌ 项目不存在！')
        console.error('🔍 查找的项目ID:', projectId, '(类型:', typeof projectId, ')')
        console.error('📋 可用项目列表:', allProjects.map((p: any, index: number) => ({
          index,
          rawId: p.id || p[0],
          stringId: (p.id || p[0]).toString(),
          name: p.name || p[2],
          status: Number(p.status || p[8])
        })))
        
        // 尝试通过数字比较查找项目
        const numericProjectId = Number(projectId)
        console.log('🔍 尝试数字比较，查找项目ID:', numericProjectId)
        const projectByNumber = allProjects.find((p: any) => {
          const pId = Number(p.id || p[0])
          console.log(`🔍 数字比较: ${pId} === ${numericProjectId} ? ${pId === numericProjectId}`)
          return pId === numericProjectId
        })
        
        if (projectByNumber) {
           console.log('✅ 通过数字比较找到项目:', projectByNumber)
           // 使用找到的项目继续处理
           project = projectByNumber
         } else {
           throw new Error(`项目 ${projectId} 不存在。可用项目: ${allProjects.map(p => (p.id || p[0]).toString()).join(', ')}`)
         }
      }

      console.log('✅ 找到项目:', {
        id: (project.id || project[0]).toString(),
        name: project.name || project[2],
        status: Number(project.status || project[8])
      })

      // ProjectStatus: Pending=0, Approved=1, Rejected=2
      const projectStatus = Number(project.status || project[8])
      if (projectStatus === 1) {
        throw new Error('项目已经被批准，无法重复验证')
      }
      if (projectStatus === 2) {
        throw new Error('项目已被拒绝，无法验证')
      }
      if (projectStatus !== 0) {
        throw new Error(`项目状态异常: ${projectStatus}`)
      }

      console.log('📞 调用合约verifyProject方法，项目ID:', numericProjectId)
      const tx = await this.contract.verifyProject(numericProjectId)

      console.log('✅ 项目批准交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ 项目批准交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('❌ 批准项目失败:', error)
      throw new Error(`批准项目失败: ${error.message}`)
    }
  }

  // 拒绝项目
  async rejectProject(projectId: string, notes?: string): Promise<string> {
    try {
      console.log('🔍 开始拒绝项目:', { projectId, notes, projectIdType: typeof projectId })
      console.log('📋 合约地址:', this.contract.target || this.contract.address)
      console.log('👤 当前账户:', this.account)

      // 检查合约连接状态
      if (!this.contract) {
        throw new Error('合约未初始化')
      }

      // 确保项目ID是数字类型
      const numericProjectId = Number(projectId)
      if (isNaN(numericProjectId)) {
        throw new Error(`无效的项目ID: ${projectId}`)
      }

      console.log('📊 转换后的项目ID:', numericProjectId)

      // 检查项目是否存在
      console.log('🔍 获取所有项目以验证项目存在性...')
      const allProjects = await this.contract.getAllProjects()
      console.log('📊 获取到的所有项目:', allProjects)
      console.log('🔍 查找项目ID:', projectId, '类型:', typeof projectId)
      
      // 详细记录每个项目的ID信息
      allProjects.forEach((p: any, index: number) => {
        const rawId = p.id || p[0]
        const stringId = rawId.toString()
        console.log(`项目 ${index}: 原始ID=${rawId} (类型: ${typeof rawId}), 字符串ID=${stringId}, 匹配=${stringId === projectId}`)
      })
      
      let project = allProjects.find((p: any) => {
        const pId = (p.id || p[0]).toString()
        console.log(`🔍 比较项目ID: ${pId} === ${projectId} ? ${pId === projectId}`)
        return pId === projectId
      })
      
      if (!project) {
        console.error('❌ 项目不存在！')
        console.error('🔍 查找的项目ID:', projectId, '(类型:', typeof projectId, ')')
        console.error('📋 可用项目列表:', allProjects.map((p: any, index: number) => ({
          index,
          rawId: p.id || p[0],
          stringId: (p.id || p[0]).toString(),
          name: p.name || p[2],
          status: Number(p.status || p[8])
        })))
        
        // 尝试通过数字比较查找项目
        const numericProjectId = Number(projectId)
        console.log('🔍 尝试数字比较，查找项目ID:', numericProjectId)
        const projectByNumber = allProjects.find((p: any) => {
          const pId = Number(p.id || p[0])
          console.log(`🔍 数字比较: ${pId} === ${numericProjectId} ? ${pId === numericProjectId}`)
          return pId === numericProjectId
        })
        
        if (projectByNumber) {
          console.log('✅ 通过数字比较找到项目:', projectByNumber)
          // 使用找到的项目继续处理
          project = projectByNumber
        } else {
          throw new Error(`项目 ${projectId} 不存在。可用项目: ${allProjects.map(p => (p.id || p[0]).toString()).join(', ')}`)
        }
      }

      console.log('✅ 找到项目:', {
        id: (project.id || project[0]).toString(),
        name: project.name || project[2],
        status: Number(project.status || project[8]),
        provider: project.provider || project[1]
      })

      // 检查项目状态 - ProjectStatus: Pending=0, Approved=1, Rejected=2
      const projectStatus = Number(project.status || project[8])
      if (projectStatus === 1) {
        throw new Error('已批准的项目无法拒绝')
      }
      if (projectStatus === 2) {
        throw new Error('项目已被拒绝')
      }
      if (projectStatus !== 0) {
        throw new Error(`项目状态异常: ${projectStatus}`)
      }

      console.log('📞 调用合约的rejectProject方法，项目ID:', numericProjectId)
      const tx = await this.contract.rejectProject(numericProjectId, notes || '')
      console.log('✅ 项目拒绝交易已发送:', tx.hash)

      console.log('⏳ 等待交易确认...')
      const receipt = await tx.wait()
      console.log('✅ 项目拒绝交易已确认:', {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      })

      return tx.hash
    } catch (error: any) {
      console.error('❌ 拒绝项目失败:', error)
      
      // 提供更详细的错误信息
      let errorMessage = '拒绝项目失败'
      if (error.code === 4001) {
        errorMessage = '用户取消了交易'
      } else if (error.code === -32603) {
        errorMessage = '合约执行失败，请检查网络连接和权限'
      } else if (error.message.includes('revert')) {
        errorMessage = '合约执行被拒绝，可能是权限不足或项目状态不正确'
      } else if (error.message.includes('VERIFIER_ROLE')) {
        errorMessage = '只有验证者可以拒绝项目'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  // 删除项目（仅项目所有者或管理员）
  async deleteProject(projectId: string): Promise<string> {
    try {
      console.log('正在删除项目:', { projectId })

      // 删除项目实际上是拒绝项目的一种形式
      return await this.rejectProject(projectId, 'Project deleted by admin')
    } catch (error: any) {
      console.error('删除项目失败:', error)
      throw new Error(`删除项目失败: ${error.message}`)
    }
  }

  // 铸造碳积分（项目通过后自动调用）
  async mintCredits(projectId: string, amount?: number, tokenURI?: string): Promise<string> {
    try {
      console.log('正在铸造碳积分:', { projectId, amount, tokenURI })

      // 如果没有提供amount，获取项目的总信用额度
      if (!amount) {
        const allProjects = await this.contract.getAllProjects()
        const project = allProjects.find((p: any) => p.id.toString() === projectId)
        if (!project) {
          throw new Error('项目不存在')
        }
        amount = Number(project.totalCredits) // 直接使用整数，不需要格式化
      }

      const tx = await this.contract.issueCredits(
        projectId,
        amount, // 直接使用整数，不转换为wei
        tokenURI || `https://carbon-credits.com/metadata/${projectId}`
      )

      console.log('铸造积分交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('铸造积分交易已确认:', receipt)

      return tx.hash
    } catch (error: any) {
      console.error('铸造积分失败:', error)
      throw new Error(`铸造积分失败: ${error.message}`)
    }
  }

  // 获取用户碳积分余额
  async getUserBalance(): Promise<number> {
    try {
      console.log('🔍 获取用户碳积分余额...')
      console.log('👤 用户地址:', this.account)

      // 使用CarbonCreditSystem合约的getUserTotalCredits方法
      // 这个方法基于userCredits映射，计算用户在所有项目中的信用总数
      try {
        const totalCredits = await this.contract.getUserTotalCredits(this.account)
        const formattedBalance = Number(totalCredits) // 直接使用整数，不需要格式化
        console.log('💰 用户碳积分余额 (来自CarbonCreditSystem):', formattedBalance)

        // 额外调试：显示用户在各个项目中的信用分布
        const allProjects = await this.getAllProjects()
        console.log('📊 用户信用分布详情:')
        let debugTotal = 0

        for (const project of allProjects) {
          try {
            const projectCredits = await this.contract.getUserCredits(this.account, project.id)
            const formattedProjectCredits = Number(projectCredits) // 直接使用整数，不需要格式化
            if (formattedProjectCredits > 0) {
              console.log(`  项目 ${project.id} (${project.name}): ${formattedProjectCredits} 信用`)
              debugTotal += formattedProjectCredits
            }
          } catch (error) {
            console.warn(`获取项目 ${project.id} 信用失败:`, error)
          }
        }

        console.log('🧮 调试计算总和:', debugTotal)
        console.log('📈 合约返回总和:', formattedBalance)

        return formattedBalance
      } catch (error) {
        console.error('❌ 获取用户余额失败:', error)
        console.log('🔄 尝试备用方法：手动计算各项目信用总和')

        // 备用方法：手动计算所有项目的信用总和
        const allProjects = await this.getAllProjects()
        let totalBalance = 0

        for (const project of allProjects) {
          try {
            const projectCredits = await this.contract.getUserCredits(this.account, project.id)
            const formattedProjectCredits = Number(projectCredits) // 直接使用整数，不需要格式化
            totalBalance += formattedProjectCredits

            if (formattedProjectCredits > 0) {
              console.log(`  项目 ${project.id}: ${formattedProjectCredits} 信用`)
            }
          } catch (error) {
            console.warn(`获取项目 ${project.id} 信用失败:`, error)
          }
        }

        console.log('💰 手动计算的用户碳积分余额:', totalBalance)
        return totalBalance
      }
    } catch (error: any) {
      console.error('❌ 获取用户余额完全失败:', error)
      return 0
    }
  }

  // 上架碳积分
  async listCredit(projectIdOrAmount: string | number, amountOrPrice?: number, pricePerCredit?: number): Promise<string> {
    try {
      let projectId: string
      let amount: number
      let price: number

      if (typeof projectIdOrAmount === 'string') {
        // 三参数版本：listCredit(projectId, amount, pricePerCredit)
        projectId = projectIdOrAmount
        amount = amountOrPrice!
        price = pricePerCredit!
      } else {
        // 两参数版本：listCredit(amount, pricePerCredit) - 使用第一个有信用的项目
        amount = projectIdOrAmount
        price = amountOrPrice!

        // 获取用户的所有项目，找到第一个有信用的项目
        const allProjects = await this.getAllProjects()
        const userProjects = allProjects.filter(p => p.submitter.toLowerCase() === this.account.toLowerCase())

        if (userProjects.length === 0) {
          throw new Error('您还没有任何项目，请先提交减碳项目并等待审核通过')
        }

        // 找到有信用的项目，优先选择信用最多的项目
        let foundProject = null
        let totalAvailableCredits = 0
        let projectsWithCredits: Array<{ project: any, credits: number }> = []

        for (const project of userProjects) {
          if (project.status === 'approved') {
            try {
              const userCredits = await this.contract.getUserCredits(this.account, project.id)
              const availableCredits = Number(userCredits) // 直接使用整数，不需要格式化
              totalAvailableCredits += availableCredits

              if (availableCredits > 0) {
                projectsWithCredits.push({ project, credits: availableCredits })
              }
            } catch (error) {
              console.warn(`获取项目 ${project.id} 信用失败:`, error)
            }
          }
        }

        // 检查总余额是否足够
        if (totalAvailableCredits < amount) {
          if (totalAvailableCredits === 0) {
            throw new Error('您还没有任何已验证的碳信用。请等待项目审核通过或提交新的减碳项目。')
          } else {
            throw new Error(`您的可用碳信用不足。可用: ${totalAvailableCredits.toFixed(2)}，需要: ${amount}`)
          }
        }

        // 按信用数量降序排序，选择信用最多的项目
        projectsWithCredits.sort((a, b) => b.credits - a.credits)

        if (projectsWithCredits.length === 0) {
          throw new Error('没有找到有可用信用的项目')
        }

        // 选择信用最多的项目
        foundProject = projectsWithCredits[0].project
        const maxCreditsInProject = projectsWithCredits[0].credits

        // 如果单个项目的信用不足，调整上架数量为该项目的最大可用信用
        if (maxCreditsInProject < amount) {
          console.warn(`单个项目信用不足，调整上架数量从 ${amount} 到 ${maxCreditsInProject}`)
          amount = maxCreditsInProject
        }

        projectId = foundProject.id
      }

      console.log('正在上架碳积分:', { projectId, amount, price })

      // 验证参数
      if (amount <= 0 || price <= 0) {
        throw new Error('上架数量和价格必须大于0')
      }

      const tx = await this.contract.listCredits(
        projectId,
        amount, // 直接使用整数，不转换为wei
        ethers.parseUnits(price.toString(), 18) // 价格仍然使用wei单位（ETH）
      )

      console.log('上架交易已发送:', tx.hash)
      return tx
    } catch (error: any) {
      console.error('上架碳积分失败:', error)

      // 改进错误消息
      let errorMessage = error.message || '上架失败'
      if (error.code === 'CALL_EXCEPTION') {
        errorMessage = '智能合约调用失败，请检查您的余额和网络连接'
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = '余额不足支付交易费用'
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = '用户拒绝了交易'
      }

      throw new Error(errorMessage)
    }
  }

  // 购买碳积分
  async buyCredit(listingId: string, amount: number, totalPrice?: number): Promise<any> {
    try {
      console.log('正在购买碳积分:', { listingId, amount, totalPrice })

      // 验证参数
      if (!listingId || amount <= 0) {
        throw new Error('无效的购买参数')
      }

      // 如果没有提供totalPrice，从合约获取listing信息计算
      let finalTotalPrice = totalPrice
      if (!finalTotalPrice) {
        try {
          const listing = await this.contract.listings(listingId)
          if (!listing || listing.seller === '0x0000000000000000000000000000000000000000') {
            throw new Error('该商品不存在或已下架')
          }

          const availableAmount = Number(listing.amount) // 直接使用整数，不需要格式化
          if (amount > availableAmount) {
            throw new Error(`购买数量超过可用数量。可用: ${availableAmount}，请求: ${amount}`)
          }

          const pricePerCredit = Number(ethers.formatUnits(listing.pricePerCredit, 18))
          finalTotalPrice = pricePerCredit * amount
        } catch (error) {
          throw new Error('无法获取商品信息，请检查商品ID是否正确')
        }
      }

      console.log('购买详情:', {
        amount,
        totalPrice: finalTotalPrice
      })

      // 检查用户余额
      const balance = await this.signer.provider.getBalance(this.account)
      const balanceInEth = Number(ethers.formatEther(balance))

      if (balanceInEth < finalTotalPrice) {
        throw new Error(`ETH余额不足。需要: ${finalTotalPrice.toFixed(6)} ETH，可用: ${balanceInEth.toFixed(6)} ETH`)
      }

      const tx = await this.contract.buyCredits(
        listingId,
        amount, // 直接使用整数，不转换为wei
        {
          value: ethers.parseUnits(finalTotalPrice.toString(), 18)
        }
      )

      console.log('购买交易已发送:', tx.hash)
      return tx
    } catch (error: any) {
      console.error('购买碳积分失败:', error)

      // 改进错误消息
      let errorMessage = error.message || '购买失败'
      if (error.code === 'CALL_EXCEPTION') {
        errorMessage = '智能合约调用失败，请检查商品状态和您的余额'
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'ETH余额不足支付交易费用'
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = '用户拒绝了交易'
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = '交易可能失败，请检查商品状态和参数'
      }

      throw new Error(errorMessage)
    }
  }

  // 获取所有上架的碳积分
  async getAllListings(): Promise<CreditListing[]> {
    try {
      console.log('获取所有碳积分上架信息...')

      const allListings = await this.contract.getAllListings()
      const listings: CreditListing[] = []

      for (let i = 0; i < allListings.length; i++) {
        try {
          const listing = allListings[i]

          if (listing.active && Number(listing.amount) > 0) {
            listings.push({
              id: listing.id.toString(),
              seller: listing.seller,
              amount: Number(listing.amount), // 直接使用整数，不需要格式化
              pricePerCredit: Number(ethers.formatUnits(listing.pricePerCredit, 18)),
              totalPrice: Number(listing.amount) * Number(ethers.formatUnits(listing.pricePerCredit, 18)),
              active: listing.active,
              timestamp: Number(listing.createdAt),
              projectId: listing.projectId.toString()
            })
          }
        } catch (error) {
          console.warn(`处理上架信息 ${i} 失败:`, error)
        }
      }

      return listings
    } catch (error: any) {
      console.error('获取上架信息失败:', error)
      return []
    }
  }

  // 获取用户交易历史
  async getUserTransactions(): Promise<Transaction[]> {
    try {
      console.log('获取用户交易历史...')

      // 这里需要通过事件日志来获取交易历史
      // 由于智能合约可能没有直接的交易历史查询函数，我们通过事件来获取
      const filter = this.contract.filters.Transfer(null, this.account)
      const events = await this.contract.queryFilter(filter, -10000) // 获取最近10000个区块的事件

      const transactions: Transaction[] = events.map((event: any, index: number) => ({
        id: `tx_${event.transactionHash}_${index}`,
        type: 'buy' as const,
        amount: Number(ethers.formatUnits(event.args.value, 18)),
        from: event.args.from,
        to: event.args.to,
        txHash: event.transactionHash,
        timestamp: Date.now(), // 实际应该从区块信息获取
        status: 'confirmed' as const
      }))

      return transactions
    } catch (error: any) {
      console.error('获取交易历史失败:', error)
      return []
    }
  }

  // 获取用户提交的项目
  async getUserProjects(userAddress: string): Promise<Project[]> {
    try {
      console.log('获取用户项目...')

      const allProjects = await this.getAllProjects()
      return allProjects.filter(project =>
        project.submitter.toLowerCase() === userAddress.toLowerCase()
      )
    } catch (error: any) {
      console.error('获取用户项目失败:', error)
      return []
    }
  }

  // 获取用户碳信用余额（别名方法）
  async getCarbonCredits(userAddress: string): Promise<number> {
    return this.getUserBalance()
  }

  // 检查用户是否为验证者
  async isVerifier(address: string): Promise<boolean> {
    try {
      const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('VERIFIER_ROLE'))
      return await this.contract.hasRole(VERIFIER_ROLE, address)
    } catch (error: any) {
      console.error('检查验证者状态失败:', error)
      return false
    }
  }

  // 处理项目数据的辅助方法
  private processProjectData(rawProjects: any[]): Project[] {
    const projects: Project[] = []
    
    for (let i = 0; i < rawProjects.length; i++) {
      try {
        const project = rawProjects[i]
        console.log(`🔍 处理解码项目 ${i}:`, project)

        // 根据ABI，项目结构体中有status字段（enum类型）
        // 0: Pending, 1: Approved, 2: Rejected
        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        const projectStatus = Number(project.status || project[8]); // status是第9个字段
        
        if (projectStatus === 1) {
          status = 'approved';
        } else if (projectStatus === 2) {
          status = 'rejected';
        } else {
          status = 'pending';
        }

        console.log(`📋 解码项目 ${i} 状态: ${projectStatus} -> ${status}`)

        // 检查项目是否已经被验证过
        const isVerified = projectStatus === 1;

        // 安全获取字段值，处理可能的空值或零地址
        const getId = () => (project.id || project[0]).toString()
        const getName = () => project.name || project[2] || `项目 ${getId()}`
        const getDescription = () => project.description || project[3] || '暂无描述'
        const getProjectType = () => project.projectType || project[4] || '未分类'
        const getTotalCredits = () => Number(project.totalCredits || project[5]) || 0 // 直接使用整数，不需要formatUnits
        const getProvider = () => {
          const provider = project.provider || project[1]
          return provider && provider !== ethers.ZeroAddress ? provider : '未知提交者'
        }
        const getVerifier = () => {
          const verifier = project.verifier || project[9]
          return verifier && verifier !== ethers.ZeroAddress ? verifier : undefined
        }
        const getCreatedAt = () => {
          const timestamp = Number(project.createdAt || project[10]) || 0
          return timestamp > 0 ? timestamp : Math.floor(Date.now() / 1000) // 如果时间戳为0，使用当前时间
        }
        const getReviewNotes = () => project.reviewNotes || project[12] || ''

        const processedProject = {
          id: getId(),
          name: getName(),
          description: getDescription(),
          location: getProjectType(),
          expectedCredits: getTotalCredits(),
          target: getTotalCredits(),
          progress: 0,
          duration: 12,
          submitter: getProvider(),
          status: status,
          verifier: getVerifier(),
          submissionTime: getCreatedAt(),
          submissionDate: new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN'),
          reviewTime: isVerified ? getCreatedAt() : undefined,
          reviewDate: isVerified ? new Date(getCreatedAt() * 1000).toLocaleDateString('zh-CN') : undefined,
          reviewedBy: getVerifier(),
          reviewNotes: getReviewNotes(),
          isVerified: isVerified
        }

        console.log(`✅ 解码项目 ${i} 处理完成:`, processedProject)
        projects.push(processedProject)
      } catch (error) {
        console.warn(`⚠️ 处理解码项目 ${i} 失败:`, error)
      }
    }
    
    console.log('🎉 解码项目列表处理完成:', projects)
    return projects
  }

  // 获取合约地址
  getContractAddress(): string {
    return this.contract.target || this.contract.address
  }

  // 获取网络信息
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name
      }
    } catch (error: any) {
      console.error('获取网络信息失败:', error)
      return null
    }
  }
}

// 创建合约服务实例的工厂函数
export const createContractService = (
  contract: any,
  provider?: ethers.BrowserProvider,
  signer?: ethers.JsonRpcSigner,
  account?: string
): ContractService => {
  // 从合约中获取signer和provider
  const contractSigner = signer || contract.runner
  const contractProvider = provider || contractSigner?.provider
  const contractAccount = account || contractSigner?.address

  return new ContractService(contract, contractProvider, contractSigner, contractAccount)
}