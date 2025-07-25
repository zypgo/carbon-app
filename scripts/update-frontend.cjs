const fs = require('fs');
const path = require('path');

/**
 * 更新前端配置脚本
 * 将前端指向新部署的合约地址
 */

function updateFrontendConfig() {
  console.log("🔄 更新前端配置...");
  
  try {
    // 读取部署信息
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'sepolia-deployment.json');
    
    if (!fs.existsSync(deploymentPath)) {
      throw new Error('部署信息文件不存在，请先部署新合约');
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const newSystemAddress = deployment.contracts.CarbonCreditSystem;
    const newNFTAddress = deployment.contracts.CarbonCreditNFT;
    
    console.log(`新的 CarbonCreditSystem 地址: ${newSystemAddress}`);
    console.log(`新的 CarbonCreditNFT 地址: ${newNFTAddress}`);
    
    // 更新合约配置文件
    const configPath = path.join(__dirname, '..', 'src', 'contracts', 'config.json');
    const contractConfig = {
      CarbonCreditSystem: {
        address: newSystemAddress,
        network: 'sepolia'
      },
      CarbonCreditNFT: {
        address: newNFTAddress,
        network: 'sepolia'
      }
    };
    
    fs.writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
    console.log(`✅ 合约配置已更新: ${configPath}`);
    
    // 更新环境变量文件
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新或添加环境变量
    const envUpdates = {
      'REACT_APP_CONTRACT_ADDRESS': newSystemAddress,
      'REACT_APP_NFT_CONTRACT_ADDRESS': newNFTAddress,
      'REACT_APP_NETWORK_ID': '11155111',
      'REACT_APP_NETWORK_NAME': 'sepolia'
    };
    
    Object.entries(envUpdates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ 环境变量已更新: ${envPath}`);
    
    // 创建迁移完成标记文件
    const migrationCompletePath = path.join(__dirname, '..', 'MIGRATION_COMPLETED.md');
    const migrationCompleteContent = `# 数据迁移完成

## 迁移信息
- 迁移时间: ${new Date().toISOString()}
- 旧合约地址: 0x35998AC86d38aBeDF63dbb1c98695b0AB2F455C0
- 新合约地址: ${newSystemAddress}
- NFT合约地址: ${newNFTAddress}
- 网络: Sepolia 测试网

## 重要说明

✅ **前端已更新**: DApp 现在指向新的干净合约
✅ **数据已迁移**: 所有有效项目数据已迁移到新合约
✅ **输入验证**: 新合约包含防护代码，防止数据损坏

## 旧合约状态

⚠️ **已废弃**: 旧合约 \`0x35998AC86d38aBeDF63dbb1c98695b0AB2F455C0\` 包含损坏数据，已被废弃

## 下一步

1. 测试新 DApp 功能
2. 在 Etherscan 上为旧合约添加废弃说明
3. 通知用户使用新合约地址

---

**长期解决方案已完成！** 🎉
`;
    
    fs.writeFileSync(migrationCompletePath, migrationCompleteContent);
    console.log(`✅ 迁移完成文档已创建: ${migrationCompletePath}`);
    
    console.log(`\n🎉 前端配置更新完成！`);
    console.log(`\n📝 总结:`);
    console.log(`  - 合约配置已更新`);
    console.log(`  - 环境变量已更新`);
    console.log(`  - DApp 现在指向新合约: ${newSystemAddress}`);
    console.log(`\n⚠️  请重启开发服务器以应用新配置`);
    
  } catch (error) {
    console.error('❌ 更新前端配置失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateFrontendConfig();
}

module.exports = { updateFrontendConfig };