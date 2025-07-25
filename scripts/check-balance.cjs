const { ethers } = require("hardhat");

async function main() {
  console.log("检查账户余额...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("账户地址:", deployer.address);
  
  // 获取余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  
  // 检查网络信息
  const network = await ethers.provider.getNetwork();
  console.log("网络名称:", network.name);
  console.log("链ID:", network.chainId.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("检查失败:", error);
    process.exit(1);
  });