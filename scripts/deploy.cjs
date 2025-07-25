const { ethers } = require("hardhat");

async function main() {
  console.log("开始部署 Carbon Trade DApp 2.0 智能合约...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 部署 CarbonCreditNFT 合约
  console.log("\n部署 CarbonCreditNFT 合约...");
  const CarbonCreditNFT = await ethers.getContractFactory("CarbonCreditNFT");
  const carbonCreditNFT = await CarbonCreditNFT.deploy();
  await carbonCreditNFT.waitForDeployment();
  const nftAddress = await carbonCreditNFT.getAddress();
  console.log("CarbonCreditNFT 部署地址:", nftAddress);

  // 部署 CarbonCreditSystem 合约
  console.log("\n部署 CarbonCreditSystem 合约...");
  const CarbonCreditSystem = await ethers.getContractFactory("CarbonCreditSystem");
  const carbonCreditSystem = await CarbonCreditSystem.deploy(nftAddress);
  await carbonCreditSystem.waitForDeployment();
  const systemAddress = await carbonCreditSystem.getAddress();
  console.log("CarbonCreditSystem 部署地址:", systemAddress);

  // 设置 NFT 合约的 minter 权限
  console.log("\n设置 NFT 合约权限...");
  const MINTER_ROLE = await carbonCreditNFT.MINTER_ROLE();
  await carbonCreditNFT.grantRole(MINTER_ROLE, systemAddress);
  console.log("已设置 CarbonCreditSystem 为 NFT minter");

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      CarbonCreditNFT: nftAddress,
      CarbonCreditSystem: systemAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n=== 部署完成 ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // 写入部署信息到文件
  const fs = require('fs');
  const path = require('path');
  const deploymentPath = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `${hre.network.name}-deployment.json`;
  fs.writeFileSync(
    path.join(deploymentPath, fileName),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n部署信息已保存到: deployments/${fileName}`);

  // 更新前端合约配置
  const contractConfig = {
    CarbonCreditSystem: {
      address: systemAddress,
      network: hre.network.name
    },
    CarbonCreditNFT: {
      address: nftAddress,
      network: hre.network.name
    }
  };

  const configPath = path.join(__dirname, '..', 'src', 'contracts', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
  console.log(`前端配置已更新: src/contracts/config.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });