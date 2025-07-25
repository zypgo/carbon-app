// 合约调试工具
import { ethers } from 'ethers'

// 调试合约连接和项目数据
export const debugContractConnection = async (contract: any, provider: any) => {
  console.log('🔧 开始合约连接调试...')
  
  try {
    // 1. 检查合约地址
    const contractAddress = contract.target || contract.address
    console.log('📋 合约地址:', contractAddress)
    
    // 2. 检查网络连接
    const network = await provider.getNetwork()
    console.log('🌐 网络信息:', {
      chainId: Number(network.chainId),
      name: network.name
    })
    
    // 3. 检查合约代码
    const code = await provider.getCode(contractAddress)
    console.log('💾 合约代码长度:', code.length)
    console.log('💾 合约是否部署:', code !== '0x')
    
    // 4. 检查项目计数
    try {
      const projectCount = await contract.projectCount()
      console.log('📊 项目总数:', Number(projectCount))
    } catch (error) {
      console.error('❌ 获取项目计数失败:', error)
    }
    
    // 5. 尝试获取所有项目
    try {
      console.log('📞 调用 getAllProjects...')
      const allProjects = await contract.getAllProjects()
      console.log('📊 getAllProjects 返回:', allProjects)
      console.log('📊 项目数量:', allProjects.length)
      
      // 详细分析每个项目
      allProjects.forEach((project: any, index: number) => {
        console.log(`\n🔍 项目 ${index} 详细信息:`)
        console.log('- 原始数据:', project)
        console.log('- ID (project.id):', project.id)
        console.log('- ID (project[0]):', project[0])
        console.log('- ID 类型:', typeof (project.id || project[0]))
        console.log('- ID 字符串:', (project.id || project[0]).toString())
        console.log('- 名称:', project.name || project[2])
        console.log('- 状态:', Number(project.status || project[8]))
        console.log('- 提交者:', project.provider || project[1])
      })
      
    } catch (error) {
      console.error('❌ 获取项目列表失败:', error)
      
      // 尝试直接调用合约方法
      try {
        console.log('🔍 尝试获取单个项目...')
        const project0 = await contract.projects(0)
        console.log('📊 项目0数据:', project0)
      } catch (singleError) {
        console.error('❌ 获取单个项目也失败:', singleError)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ 合约调试失败:', error)
    return false
  }
}

// 调试项目审核功能
export const debugProjectReview = async (contract: any, projectId: string) => {
  console.log('🔧 开始项目审核调试...')
  console.log('🔍 项目ID:', projectId, '类型:', typeof projectId)
  
  try {
    // 1. 获取所有项目
    const allProjects = await contract.getAllProjects()
    console.log('📊 所有项目:', allProjects)
    
    // 2. 查找目标项目
    const targetProject = allProjects.find((p: any) => {
      const pId = (p.id || p[0]).toString()
      console.log(`🔍 比较: ${pId} === ${projectId} ? ${pId === projectId}`)
      return pId === projectId
    })
    
    if (targetProject) {
      console.log('✅ 找到目标项目:', targetProject)
      console.log('📋 项目状态:', Number(targetProject.status || targetProject[8]))
    } else {
      console.error('❌ 未找到目标项目')
      console.log('📋 可用项目ID列表:', allProjects.map((p: any) => (p.id || p[0]).toString()))
    }
    
    // 3. 尝试数字比较
    const numericProjectId = Number(projectId)
    const projectByNumber = allProjects.find((p: any) => {
      const pId = Number(p.id || p[0])
      console.log(`🔍 数字比较: ${pId} === ${numericProjectId} ? ${pId === numericProjectId}`)
      return pId === numericProjectId
    })
    
    if (projectByNumber) {
      console.log('✅ 通过数字比较找到项目:', projectByNumber)
    }
    
    return { targetProject, projectByNumber }
  } catch (error) {
    console.error('❌ 项目审核调试失败:', error)
    return null
  }
}