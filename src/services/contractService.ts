import { ethers } from 'ethers'
import { useToast } from '@chakra-ui/react'

// 智能合约接口定义
export interface EmissionRecord {
  id: string
  user: string
  amount: number
  activity: string
  source?: string
  timestamp: number
  verified: boolean
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
        id: emission.id.toString(),
        user: emission.user,
        amount: Number(ethers.formatUnits(emission.amount, 18)),
        activity: emission.activity,
        timestamp: Number(emission.timestamp),
        verified: emission.verified
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
        ethers.parseUnits(expectedCredits.toString(), 18),
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
      console.log('获取所有项目...')
      
      const allProjects = await this.contract.getAllProjects()
      const projects: Project[] = []
      
      for (let i = 0; i < allProjects.length; i++) {
        try {
          const project = allProjects[i]
          
          let status: 'pending' | 'approved' | 'rejected' = 'pending';
            if (project.status === 1) {
              status = 'approved';
            } else if (project.status === 2) {
              status = 'rejected';
            }
          
          projects.push({
            id: project.id.toString(),
            name: project.name,
            description: project.description,
            location: project.projectType, // 使用projectType作为location
            expectedCredits: Number(ethers.formatUnits(project.totalCredits, 18)),
            submitter: project.provider,
            status: status,
            verifier: project.verifier !== ethers.ZeroAddress ? project.verifier : undefined,
            submissionTime: Number(project.createdAt),
            reviewTime: project.verified ? Number(project.createdAt) : undefined,
            reviewNotes: project.reviewNotes || ''
          })
        } catch (error) {
          console.warn(`处理项目 ${i} 失败:`, error)
        }
      }
      
      return projects
    } catch (error: any) {
      console.error('获取项目列表失败:', error)
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
      console.log('正在批准项目:', { projectId, notes })
      
      const tx = await this.contract.verifyProject(projectId)
      
      console.log('项目批准交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('项目批准交易已确认:', receipt)
      
      return tx.hash
    } catch (error: any) {
      console.error('批准项目失败:', error)
      throw new Error(`批准项目失败: ${error.message}`)
    }
  }

  // 拒绝项目
  async rejectProject(projectId: string, notes?: string): Promise<string> {
    try {
      console.log('正在拒绝项目:', { projectId, notes })
      
      const tx = await this.contract.rejectProject(projectId, notes || '')
      
      console.log('项目拒绝交易已发送:', tx.hash)
      const receipt = await tx.wait()
      console.log('项目拒绝交易已确认:', receipt)
      
      return tx.hash
    } catch (error: any) {
      console.error('拒绝项目失败:', error)
      throw new Error(`拒绝项目失败: ${error.message}`)
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
        amount = Number(ethers.formatUnits(project.totalCredits, 18))
      }
      
      const tx = await this.contract.issueCredits(
        projectId,
        ethers.parseUnits(amount.toString(), 18),
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
      console.log('获取用户碳积分余额...')
      
      const totalCredits = await this.contract.getUserTotalCredits(this.account)
      const formattedBalance = Number(ethers.formatUnits(totalCredits, 18))
      
      console.log('用户碳积分余额:', formattedBalance)
      return formattedBalance
    } catch (error: any) {
      console.error('获取用户余额失败:', error)
      return 0
    }
  }

  // 上架碳积分
  async listCredit(projectId: string, amount: number, pricePerCredit: number): Promise<string>
  async listCredit(amount: number, pricePerCredit: number): Promise<string>
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
          throw new Error('您还没有任何项目，无法上架碳信用')
        }
        
        // 找到第一个已验证且有信用的项目
        let foundProject = null
        for (const project of userProjects) {
          if (project.status === 'approved') {
            const userCredits = await this.contract.getUserCredits(this.account, project.id)
            if (Number(ethers.formatUnits(userCredits, 18)) >= amount) {
              foundProject = project
              break
            }
          }
        }
        
        if (!foundProject) {
          throw new Error('您没有足够的碳信用可以上架')
        }
        
        projectId = foundProject.id
      }
      
      console.log('正在上架碳积分:', { projectId, amount, price })
      
      const tx = await this.contract.listCredits(
        projectId,
        ethers.parseUnits(amount.toString(), 18),
        ethers.parseUnits(price.toString(), 18)
      )
      
      console.log('上架交易已发送:', tx.hash)
      return tx
    } catch (error: any) {
      console.error('上架碳积分失败:', error)
      throw new Error(`上架碳积分失败: ${error.message}`)
    }
  }

  // 购买碳积分
  async buyCredit(listingId: string, amount: number, totalPrice: number): Promise<any> {
    try {
      console.log('正在购买碳积分:', { listingId, amount, totalPrice })
      
      const tx = await this.contract.buyCredits(
        listingId,
        ethers.parseUnits(amount.toString(), 18),
        {
          value: ethers.parseUnits(totalPrice.toString(), 18)
        }
      )
      
      console.log('购买交易已发送:', tx.hash)
      return tx
    } catch (error: any) {
      console.error('购买碳积分失败:', error)
      throw error
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
              amount: Number(ethers.formatUnits(listing.amount, 18)),
              pricePerCredit: Number(ethers.formatUnits(listing.pricePerCredit, 18)),
              totalPrice: Number(ethers.formatUnits(listing.amount, 18)) * Number(ethers.formatUnits(listing.pricePerCredit, 18)),
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