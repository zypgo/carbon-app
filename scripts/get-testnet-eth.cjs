const { ethers } = require("hardhat");

async function main() {
  console.log("=== Sepolia 测试网 ETH 获取指南 ===");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  const address = deployer.address;
  const balance = await ethers.provider.getBalance(address);
  
  console.log("\n📍 部署账户信息:");
  console.log(`地址: ${address}`);
  console.log(`当前余额: ${ethers.formatEther(balance)} ETH`);
  
  const requiredBalance = ethers.parseEther("0.01");
  const hasEnoughBalance = balance >= requiredBalance;
  
  console.log(`所需余额: 0.01 ETH (用于合约部署)`);
  console.log(`余额状态: ${hasEnoughBalance ? '✅ 充足' : '❌ 不足'}`);
  
  if (!hasEnoughBalance) {
    console.log("\n🚰 获取测试 ETH 的方法:");
    console.log("\n1. Alchemy Sepolia 水龙头:");
    console.log(`   https://sepoliafaucet.com/`);
    console.log(`   输入地址: ${address}`);
    
    console.log("\n2. Chainlink 水龙头:");
    console.log(`   https://faucets.chain.link/sepolia`);
    console.log(`   输入地址: ${address}`);
    
    console.log("\n3. QuickNode 水龙头:");
    console.log(`   https://faucet.quicknode.com/ethereum/sepolia`);
    console.log(`   输入地址: ${address}`);
    
    console.log("\n📋 操作步骤:");
    console.log("1. 复制上面的地址");
    console.log("2. 访问任一水龙头网站");
    console.log("3. 粘贴地址并申请测试 ETH");
    console.log("4. 等待交易确认 (通常 1-2 分钟)");
    console.log("5. 重新运行此脚本检查余额");
    console.log("6. 余额充足后执行: npm run deploy-sepolia");
  } else {
    console.log("\n✅ 余额充足，可以开始部署!");
    console.log("执行命令: npm run deploy-sepolia");
  }
  
  console.log("\n=== 检查完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("检查失败:", error);
    process.exit(1);
  });