import { ethers } from 'ethers'

/**
 * 十六进制数据解析工具
 * 用于解析智能合约返回的原始十六进制数据
 */
export class HexDataParser {
  /**
   * 解析项目数据的十六进制字符串
   * @param hexData 十六进制数据字符串
   * @returns 解析后的项目数据或错误信息
   */
  static parseProjectData(hexData: string): {
    success: boolean
    data?: any[]
    error?: string
    analysis?: string
  } {
    try {
      // 移除0x前缀
      const cleanHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData
      
      console.log('🔍 开始解析十六进制数据...')
      console.log('📊 原始数据长度:', cleanHex.length)
      console.log('📊 原始数据:', cleanHex.substring(0, 100) + '...')
      
      // 检查数据长度是否合理
      if (cleanHex.length < 64) {
        return {
          success: false,
          error: '数据长度过短，可能不是有效的合约返回数据',
          analysis: `数据长度: ${cleanHex.length} 字符，期望至少64字符`
        }
      }
      
      // 尝试解析为项目数组
      const projectABI = [
        'tuple(uint256,address,string,string,string,uint256,uint256,uint256,uint8,address,uint256,string,string)[]'
      ]
      
      try {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          projectABI,
          '0x' + cleanHex
        )
        
        console.log('✅ 成功解码项目数据:', decoded)
        
        return {
          success: true,
          data: decoded[0],
          analysis: `成功解析出 ${decoded[0].length} 个项目`
        }
      } catch (decodeError: any) {
        console.warn('⚠️ 标准解码失败，尝试其他方法:', decodeError.message)
        
        // 尝试手动解析数据结构
        const manualResult = this.manualParseProjectData(cleanHex)
        if (manualResult.success) {
          return manualResult
        }
        
        return {
          success: false,
          error: `ABI解码失败: ${decodeError.message}`,
          analysis: this.analyzeHexStructure(cleanHex)
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: `解析过程出错: ${error.message}`,
        analysis: '数据格式可能不正确或已损坏'
      }
    }
  }
  
  /**
   * 手动解析项目数据（当标准ABI解码失败时）
   */
  private static manualParseProjectData(hexData: string): {
    success: boolean
    data?: any[]
    error?: string
    analysis?: string
  } {
    try {
      console.log('🔧 尝试手动解析数据结构...')
      
      // 检查是否包含数组长度信息
      const arrayLengthHex = hexData.substring(0, 64)
      const arrayLength = parseInt(arrayLengthHex, 16)
      
      console.log('📊 数组长度:', arrayLength)
      
      if (arrayLength > 100) {
        return {
          success: false,
          error: '数组长度异常，可能数据格式错误',
          analysis: `解析出的数组长度: ${arrayLength}，这可能表示数据格式不正确`
        }
      }
      
      // 尝试提取字符串数据
      const strings = this.extractStringsFromHex(hexData)
      
      return {
        success: false,
        error: '手动解析未完成',
        analysis: `检测到 ${strings.length} 个可能的字符串: ${strings.slice(0, 3).join(', ')}${strings.length > 3 ? '...' : ''}`
      }
    } catch (error: any) {
      return {
        success: false,
        error: `手动解析失败: ${error.message}`,
        analysis: '无法识别数据结构'
      }
    }
  }
  
  /**
   * 从十六进制数据中提取字符串
   */
  private static extractStringsFromHex(hexData: string): string[] {
    const strings: string[] = []
    
    // 查找可能的字符串模式
    for (let i = 0; i < hexData.length - 64; i += 2) {
      try {
        // 尝试解析长度前缀的字符串
        const lengthHex = hexData.substring(i, i + 64)
        const length = parseInt(lengthHex, 16)
        
        if (length > 0 && length < 1000) {
          const stringStart = i + 64
          const stringEnd = stringStart + (length * 2)
          
          if (stringEnd <= hexData.length) {
            const stringHex = hexData.substring(stringStart, stringEnd)
            const decoded = Buffer.from(stringHex, 'hex').toString('utf8')
            
            // 检查是否是有效的UTF-8字符串
            if (this.isValidString(decoded)) {
              strings.push(decoded)
            }
          }
        }
      } catch (error) {
        // 忽略解析错误，继续下一个位置
      }
    }
    
    return strings
  }
  
  /**
   * 检查字符串是否有效
   */
  private static isValidString(str: string): boolean {
    // 检查是否包含可打印字符
    const printableRegex = /^[\x20-\x7E\u4e00-\u9fff]*$/
    return str.length > 0 && str.length < 200 && printableRegex.test(str)
  }
  
  /**
   * 分析十六进制数据结构
   */
  private static analyzeHexStructure(hexData: string): string {
    const analysis: string[] = []
    
    analysis.push(`数据总长度: ${hexData.length} 字符 (${hexData.length / 2} 字节)`)
    
    // 检查是否是32字节对齐
    if (hexData.length % 64 === 0) {
      analysis.push(`数据是32字节对齐的 (${hexData.length / 64} 个槽位)`)
    } else {
      analysis.push('数据不是32字节对齐的，可能格式异常')
    }
    
    // 检查前几个字节
    const firstBytes = hexData.substring(0, 64)
    const firstValue = parseInt(firstBytes, 16)
    analysis.push(`第一个32字节值: ${firstValue} (可能是数组长度或偏移量)`)
    
    // 检查是否包含地址模式
    const addressPattern = /[0-9a-f]{40}/gi
    const addresses = hexData.match(addressPattern) || []
    if (addresses.length > 0) {
      analysis.push(`检测到 ${addresses.length} 个可能的以太坊地址`)
    }
    
    // 检查零值模式
    const zeroPattern = /0{64}/g
    const zeroMatches = hexData.match(zeroPattern) || []
    if (zeroMatches.length > 0) {
      analysis.push(`包含 ${zeroMatches.length} 个全零的32字节槽位`)
    }
    
    return analysis.join('\n')
  }
  
  /**
   * 创建诊断报告
   */
  static createDiagnosticReport(hexData: string, error?: any): {
    analysis: Array<{
      field: string
      status: 'valid' | 'invalid'
      description: string
      value?: string
    }>
    suggestions: string[]
    rawReport: string
  } {
    const analysis: Array<{
      field: string
      status: 'valid' | 'invalid'
      description: string
      value?: string
    }> = []
    
    const suggestions: string[] = []
    const report: string[] = []
    
    report.push('=== 十六进制数据诊断报告 ===')
    report.push('')
    
    if (error) {
      analysis.push({
        field: '错误代码',
        status: 'invalid',
        description: error.code || '未知错误代码',
        value: error.code
      })
      
      analysis.push({
        field: '错误消息',
        status: 'invalid',
        description: error.message || '无错误消息',
        value: error.message
      })
      
      report.push('错误信息:')
      report.push(`- 错误代码: ${error.code || '未知'}`)
      report.push(`- 错误消息: ${error.message || '无消息'}`)
      report.push('')
    }
    
    const parseResult = this.parseProjectData(hexData)
    
    analysis.push({
      field: '数据解析状态',
      status: parseResult.success ? 'valid' : 'invalid',
      description: parseResult.success ? '数据解析成功' : '数据解析失败',
      value: parseResult.success ? '成功' : '失败'
    })
    
    if (hexData) {
      analysis.push({
        field: '数据长度',
        status: hexData.length >= 64 ? 'valid' : 'invalid',
        description: `数据长度: ${hexData.length} 字符`,
        value: `${hexData.length} 字符`
      })
      
      analysis.push({
        field: '数据对齐',
        status: hexData.length % 64 === 0 ? 'valid' : 'invalid',
        description: hexData.length % 64 === 0 ? '数据是32字节对齐的' : '数据不是32字节对齐的',
        value: `${hexData.length / 64} 个槽位`
      })
    }
    
    report.push('解析结果:')
    report.push(`- 解析状态: ${parseResult.success ? '成功' : '失败'}`)
    
    if (parseResult.error) {
      report.push(`- 错误原因: ${parseResult.error}`)
    }
    
    if (parseResult.analysis) {
      report.push('- 数据分析:')
      report.push(parseResult.analysis.split('\n').map(line => `  ${line}`).join('\n'))
    }
    
    if (parseResult.data) {
      analysis.push({
        field: '项目数量',
        status: 'valid',
        description: `成功解析出 ${parseResult.data.length} 个项目`,
        value: parseResult.data.length.toString()
      })
      
      report.push(`- 解析出的项目数量: ${parseResult.data.length}`)
      parseResult.data.forEach((project, index) => {
        report.push(`  项目 ${index + 1}:`)
        report.push(`    ID: ${project[0]?.toString() || '未知'}`)
        report.push(`    名称: ${project[2] || '未知'}`)
        report.push(`    状态: ${project[8] || '未知'}`)
      })
    }
    
    report.push('')
    report.push('建议解决方案:')
    
    if (parseResult.success) {
      suggestions.push('数据解析成功，问题可能在数据处理逻辑中')
      suggestions.push('检查项目状态映射和数据转换逻辑')
      report.push('- 数据解析成功，问题可能在数据处理逻辑中')
      report.push('- 检查项目状态映射和数据转换逻辑')
    } else {
      suggestions.push('检查智能合约ABI是否与部署的合约匹配')
      suggestions.push('验证合约地址是否正确')
      suggestions.push('确认网络连接和RPC端点状态')
      suggestions.push('考虑重新部署合约或更新前端ABI')
      report.push('- 检查智能合约ABI是否与部署的合约匹配')
      report.push('- 验证合约地址是否正确')
      report.push('- 确认网络连接和RPC端点状态')
      report.push('- 考虑重新部署合约或更新前端ABI')
    }
    
    return {
      analysis,
      suggestions,
      rawReport: report.join('\n')
    }
  }
}

export default HexDataParser