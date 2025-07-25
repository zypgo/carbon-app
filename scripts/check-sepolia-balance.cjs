const { ethers } = require("hardhat");

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("请提供要检查的地址");
    console.log("用法: node scripts/check-sepolia-balance.cjs <address>");
    process.exit(1);
  }

  console.log("检查Sepolia网络账户余额...");
  console.log("账户地址:", address);
  
  try {
    // 连接到Sepolia网络
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    
    // 获取余额
    const balance = await provider.getBalance(address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH");
    
    // 检查网络信息
    const network = await provider.getNetwork();
    console.log("网络名称: Sepolia");
    console.log("链ID:", network.chainId.toString());
    
    // 检查余额是否足够部署
    const balanceInEth = parseFloat(ethers.formatEther(balance));
    const requiredEth = 0.02; // 估计需要的ETH
    
    if (balanceInEth >= requiredEth) {
      console.log("✅ 余额充足，可以进行部署");
    } else {
      console.log("❌ 余额不足，需要至少", requiredEth, "ETH 进行部署");
      console.log("请访问 https://sepoliafaucet.com/ 获取测试ETH");
    }
  } catch (error) {
    console.error("检查失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("检查失败:", error);
    process.exit(1);
  });