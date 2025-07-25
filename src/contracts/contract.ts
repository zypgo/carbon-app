import { ethers } from 'ethers'
import CarbonCreditSystemABI from './CarbonCreditSystem.json'

export class CarbonContract {
  private contract: ethers.Contract | null = null
  private provider: ethers.BrowserProvider

  constructor(contractAddress: string, provider: ethers.BrowserProvider) {
    this.provider = provider
    this.initContract(contractAddress)
  }

  private async initContract(contractAddress: string) {
    try {
      this.contract = new ethers.Contract(
        contractAddress,
        CarbonCreditSystemABI,
        this.provider
      )
    } catch (error) {
      console.error('初始化合约失败:', error)
      throw error
    }
  }

  private checkContract() {
    if (!this.contract) {
      throw new Error('合约未初始化')
    }
  }

  // 记录碳排放
  async recordEmission(amount: number, activity: string) {
    this.checkContract()
    const signer = await this.provider.getSigner()
    const contractWithSigner = this.contract!.connect(signer) as any
    
    const tx = await contractWithSigner.recordEmission(
      ethers.parseEther(amount.toString()),
      activity
    )
    
    return await tx.wait()
  }

  // 获取用户的碳排放记录
  async getUserEmissions() {
    this.checkContract()
    const emissions = await this.contract!.getUserEmissions()
    
    return emissions.map((emission: any) => ({
      amount: ethers.formatEther(emission.amount),
      timestamp: Number(emission.timestamp),
      activity: emission.activity
    }))
  }

  // 上架碳信用
  async listCredit(amount: number, price: number) {
    this.checkContract()
    const signer = await this.provider.getSigner()
    const contractWithSigner = this.contract!.connect(signer) as any
    
    const tx = await contractWithSigner.listCredit(
      ethers.parseEther(amount.toString()),
      ethers.parseEther(price.toString())
    )
    
    return await tx.wait()
  }

  // 购买碳信用
  async buyCredit(listingId: number, value: number) {
    this.checkContract()
    const signer = await this.provider.getSigner()
    const contractWithSigner = this.contract!.connect(signer) as any
    
    const tx = await contractWithSigner.buyCredit(listingId, {
      value: ethers.parseEther(value.toString())
    })
    
    return await tx.wait()
  }

  // 获取所有上架信息
  async getAllListings() {
    this.checkContract()
    const listings = await this.contract!.getAllListings()
    
    return listings.map((listing: any, index: number) => ({
      id: index,
      seller: listing.seller,
      amount: ethers.formatEther(listing.amount),
      price: ethers.formatEther(listing.price),
      active: listing.active
    }))
  }

  // 铸造碳信用（仅限授权用户）
  async mintCredits(to: string, amount: number) {
    this.checkContract()
    const signer = await this.provider.getSigner()
    const contractWithSigner = this.contract!.connect(signer) as any
    
    const tx = await contractWithSigner.mintCredits(
      to,
      ethers.parseEther(amount.toString())
    )
    
    return await tx.wait()
  }
}