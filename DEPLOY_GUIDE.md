# Carbon Trade DApp 2.0 部署指南

本指南将帮助您将 Carbon Trade DApp 2.0 部署到不同的网络环境。

## 🚀 快速开始

### 环境准备

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# 🌐 网络配置
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
MAINNET_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# 🔐 私钥（请使用测试账户）
PRIVATE_KEY=your_private_key_here

# 🔍 Etherscan API Key（用于合约验证）
ETHERSCAN_API_KEY=your_etherscan_api_key

# 📊 Gas报告
REPORT_GAS=true
```

## 📋 部署步骤

### 1. 本地开发环境

```bash
# 启动本地区块链网络
npm run node

# 新开终端，部署合约
npm run deploy-local

# 启动前端开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 2. Sepolia 测试网部署

**准备工作：**
- 获取 Sepolia ETH：[Sepolia Faucet](https://sepoliafaucet.com/)
- 注册 [Infura](https://infura.io/) 获取项目 ID
- 获取 [Etherscan API Key](https://etherscan.io/apis)

**部署命令：**
```bash
# 部署到 Sepolia 测试网
npm run deploy-sepolia

# 验证合约（可选）
npm run verify -- --network sepolia CONTRACT_ADDRESS
```

### 3. 主网部署 ⚠️

**⚠️ 警告：主网部署需要真实 ETH，请确保充分测试！**

```bash
# 部署到以太坊主网
npx hardhat run scripts/deploy.js --network mainnet
```

## 🔧 配置说明

### Hardhat 网络配置

项目支持以下网络：

| 网络 | Chain ID | 用途 |
|------|----------|------|
| hardhat | 31337 | 本地开发 |
| localhost | 1337 | 本地测试 |
| sepolia | 11155111 | 测试网 |
| mainnet | 1 | 主网 |

### 智能合约

项目包含两个主要合约：

1. **CarbonCreditSystem.sol** - 核心业务逻辑
2. **CarbonCreditNFT.sol** - NFT 代币合约

## 📊 部署验证

### 检查部署状态

1. **查看部署信息**
```bash
cat deployments/sepolia-deployment.json
```

2. **测试合约功能**
```bash
npx hardhat console --network sepolia
```

3. **前端配置检查**
```bash
cat src/contracts/config.json
```

### 区块链浏览器验证

- **Sepolia**: https://sepolia.etherscan.io/
- **Mainnet**: https://etherscan.io/

## 🛠️ 故障排除

### 常见问题及解决方案

#### 1. Gas 费用问题
```bash
# 检查当前 gas 价格
npx hardhat run scripts/check-gas.js --network sepolia
```

**解决方案：**
- 调整 `hardhat.config.cjs` 中的 gas 设置
- 等待网络拥堵缓解
- 使用 gas 优化工具

#### 2. 私钥/账户问题
```bash
# 检查账户余额
npx hardhat run scripts/check-balance.js --network sepolia
```

**解决方案：**
- 确保私钥格式正确（无 0x 前缀）
- 确认账户有足够 ETH
- 检查网络配置

#### 3. 网络连接问题
```bash
# 测试网络连接
npx hardhat run scripts/test-connection.js --network sepolia
```

**解决方案：**
- 验证 RPC URL
- 检查防火墙设置
- 尝试不同的 RPC 提供商

#### 4. 合约验证失败
```bash
# 手动验证合约
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

**解决方案：**
- 确认 Etherscan API Key
- 检查合约构造参数
- 等待几分钟后重试

## 🔒 安全最佳实践

### 开发环境
- ✅ 使用测试网络进行开发
- ✅ 使用专用测试账户
- ✅ 定期更新依赖包
- ❌ 不要在代码中硬编码私钥

### 生产环境
- ✅ 使用硬件钱包或多重签名
- ✅ 进行安全审计
- ✅ 设置监控和告警
- ✅ 准备应急响应计划

### 环境变量安全
```bash
# 设置文件权限
chmod 600 .env

# 添加到 .gitignore
echo ".env" >> .gitignore
```

## 📈 监控和维护

### 部署后检查清单

- [ ] 合约部署成功
- [ ] 前端连接正常
- [ ] 基本功能测试通过
- [ ] 权限设置正确
- [ ] 监控系统配置

### 持续监控

1. **合约事件监控**
```javascript
// 监听合约事件
contract.on("EmissionRecorded", (user, amount, timestamp) => {
  console.log(`新的排放记录: ${user} - ${amount}`);
});
```

2. **性能监控**
- Gas 使用情况
- 交易成功率
- 响应时间

3. **安全监控**
- 异常交易检测
- 权限变更监控
- 余额变化告警

## 🆘 获取帮助

### 文档资源
- [Hardhat 文档](https://hardhat.org/docs)
- [Ethers.js 文档](https://docs.ethers.io/)
- [React 文档](https://reactjs.org/docs)

### 社区支持
- GitHub Issues
- Discord 社区
- 技术论坛

### 紧急联系
如遇到严重问题，请立即联系开发团队。

---

**🎉 恭喜！您已成功部署 Carbon Trade DApp 2.0**

记住：区块链开发需要谨慎，始终在测试网络上验证功能后再部署到主网。