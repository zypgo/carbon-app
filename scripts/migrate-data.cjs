const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 旧合约地址（被污染的合约）
const OLD_CONTRACT_ADDRESS = "0x35998AC86d38aBeDF63dbb1c98695b0AB2F455C0";

// 从部署文件读取新合约地址
function getNewContractAddress() {
  const deploymentPath = path.join(__dirname, '..', 'deployments', 'sepolia-deployment.json');
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    return deployment.contracts.CarbonCreditSystem;
  }
  throw new Error('新合约部署信息未找到，请先部署新合约');
}

async function main() {
  console.log("🚀 开始数据迁移过程...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("迁移账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 获取合约工厂
  const CarbonCreditSystem = await ethers.getContractFactory("CarbonCreditSystem");
  
  // 连接到旧合约
  console.log("\n📡 连接到旧合约:", OLD_CONTRACT_ADDRESS);
  const oldContract = CarbonCreditSystem.attach(OLD_CONTRACT_ADDRESS);
  
  // 获取新合约地址并连接
  const newContractAddress = getNewContractAddress();
  console.log("📡 连接到新合约:", newContractAddress);
  const newContract = CarbonCreditSystem.attach(newContractAddress);
  
  try {
    // 获取所有项目ID
    console.log("\n🔍 获取旧合约中的所有项目ID...");
    
    // 通过遍历获取所有项目ID（因为allProjectIds是数组访问函数）
    const projectIds = [];
    let index = 0;
    
    try {
      while (true) {
        const projectId = await oldContract.allProjectIds(index);
        projectIds.push(projectId);
        index++;
      }
    } catch (error) {
      // 当索引超出范围时会抛出错误，这是正常的
      console.log(`通过遍历找到 ${projectIds.length} 个项目`);
    }
    
    const validProjects = [];
    const corruptedProjects = [];
    
    // 逐个检查项目数据
    console.log("\n🔍 检查项目数据完整性...");
    for (let i = 0; i < projectIds.length; i++) {
      const projectId = projectIds[i];
      try {
        console.log(`检查项目 ID: ${projectId}`);
        
        // 尝试获取项目数据
        const projectData = await oldContract.projects(projectId);
        
        // 验证数据完整性
        if (projectData.id > 0 && 
            projectData.provider !== ethers.ZeroAddress &&
            projectData.name && 
            projectData.name.length > 0 &&
            projectData.totalCredits > 0) {
          
          validProjects.push({
            id: projectData.id,
            provider: projectData.provider,
            name: projectData.name,
            description: projectData.description,
            projectType: projectData.projectType,
            totalCredits: projectData.totalCredits,
            verified: projectData.verified || false,
            documentHash: projectData.documentHash
          });
          
          console.log(`  ✅ 项目 ${projectId} 数据完整`);
        } else {
          console.log(`  ⚠️  项目 ${projectId} 数据不完整，跳过`);
          corruptedProjects.push(projectId);
        }
        
      } catch (error) {
        console.log(`  ❌ 项目 ${projectId} 数据损坏:`, error.message);
        corruptedProjects.push(projectId);
      }
    }
    
    console.log(`\n📊 数据检查完成:`);
    console.log(`  ✅ 有效项目: ${validProjects.length}`);
    console.log(`  ❌ 损坏项目: ${corruptedProjects.length}`);
    
    if (corruptedProjects.length > 0) {
      console.log(`  损坏的项目ID: [${corruptedProjects.join(', ')}]`);
    }
    
    // 迁移有效项目到新合约
    if (validProjects.length > 0) {
      console.log(`\n🔄 开始迁移 ${validProjects.length} 个有效项目到新合约...`);
      
      for (let i = 0; i < validProjects.length; i++) {
        const project = validProjects[i];
        
        try {
          console.log(`\n迁移项目 ${i + 1}/${validProjects.length}: ${project.name}`);
          
          // 在新合约中创建项目
          const tx = await newContract.createProject(
            project.name,
            project.description,
            project.projectType,
            project.totalCredits,
            project.documentHash
          );
          
          console.log(`  交易哈希: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`  ✅ 项目迁移成功，Gas使用: ${receipt.gasUsed}`);
          
          // 如果原项目已验证，在新合约中也验证它
          if (project.verified) {
            console.log(`  🔄 验证迁移的项目...`);
            try {
              // 从事件日志中获取新项目ID
              const projectCreatedEvent = receipt.logs.find(log => 
                log.fragment && log.fragment.name === 'ProjectCreated'
              );
              if (projectCreatedEvent) {
                const newProjectId = projectCreatedEvent.args[0];
                const approveTx = await newContract.verifyProject(newProjectId);
                await approveTx.wait();
                console.log(`  ✅ 项目已验证`);
              }
            } catch (error) {
              console.log(`  ⚠️  项目验证失败: ${error.message}`);
            }
          }
          
        } catch (error) {
          console.log(`  ❌ 迁移项目失败:`, error.message);
        }
      }
    }
    
    // 生成迁移报告
    const migrationReport = {
      timestamp: new Date().toISOString(),
      oldContract: OLD_CONTRACT_ADDRESS,
      newContract: newContractAddress,
      totalProjects: projectIds.length,
      validProjects: validProjects.length,
      corruptedProjects: corruptedProjects.length,
      corruptedProjectIds: corruptedProjects,
      migrationStatus: 'completed'
    };
    
    // 保存迁移报告
    const reportPath = path.join(__dirname, '..', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2));
    
    console.log(`\n📋 迁移报告已保存到: migration-report.json`);
    console.log(`\n🎉 数据迁移完成!`);
    console.log(`\n📝 总结:`);
    console.log(`  - 总项目数: ${projectIds.length}`);
    console.log(`  - 成功迁移: ${validProjects.length}`);
    console.log(`  - 损坏跳过: ${corruptedProjects.length}`);
    console.log(`  - 旧合约: ${OLD_CONTRACT_ADDRESS}`);
    console.log(`  - 新合约: ${newContractAddress}`);
    
  } catch (error) {
    console.error("❌ 迁移过程中发生错误:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("迁移失败:", error);
    process.exit(1);
  });