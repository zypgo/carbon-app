# 🚀 Carbon Trade DApp 2.0 - 完整部署和迁移指南

## ⚠️ 重要提醒

在开始部署之前，您需要配置正确的环境变量。

## 📋 部署前准备

### 1. 配置私钥

编辑 `.env` 文件，将 `PRIVATE_KEY` 替换为您的实际私钥：

```bash
# 替换为您的实际私钥（不包含0x前缀）
PRIVATE_KEY=your_actual_private_key_here
```

**获取私钥的方法：**
- MetaMask: 账户详情 → 导出私钥
- 确保该账户在Sepolia测试网有足够的ETH用于部署

### 2. 获取Sepolia测试ETH

访问以下水龙头获取测试ETH：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 3. （可选）配置Etherscan API Key

如需验证合约，请在 `.env` 文件中配置：
```bash
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🔄 完整部署和迁移流程

### 方法一：一键完成（推荐）

```bash
npm run full:migration
```

这个命令将自动完成：
1. 部署新的改进版合约到Sepolia
2. 从旧合约迁移有效数据
3. 更新前端配置

### 方法二：分步执行

如果您想分步执行，可以按以下顺序运行：

```bash
# 1. 部署新合约
npm run deploy-sepolia

# 2. 迁移数据
npm run migrate:data

# 3. 更新前端配置
npm run update:frontend
```

## 📊 部署后验证

### 1. 检查部署文件

部署成功后，检查以下文件：
- `deployments/sepolia-deployment.json` - 新合约地址
- `migration-report.json` - 迁移报告
- `MIGRATION_COMPLETED.md` - 迁移完成文档

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试DApp功能

- 访问 http://localhost:5173/carbon-app/
- 测试项目创建功能
- 验证数据显示正常

## 🔍 故障排除

### 常见错误及解决方案

1. **私钥错误**
   ```
   Error: private key too short, expected 32 bytes
   ```
   **解决方案**: 确保私钥是64位十六进制字符串（不包含0x前缀）

2. **余额不足**
   ```
   Error: insufficient funds for gas
   ```
   **解决方案**: 从水龙头获取更多Sepolia ETH

3. **网络连接问题**
   ```
   Error: could not detect network
   ```
   **解决方案**: 检查网络连接，或更换RPC URL

## 📝 部署信息

### 旧合约（已废弃）
- 地址: `0x35998AC86d38aBeDF63dbb1c98695b0AB2F455C0`
- 状态: 包含损坏数据，已废弃

### 新合约特性
- ✅ 输入验证防护
- ✅ 字符串长度限制
- ✅ 数值范围检查
- ✅ 防止数据损坏

## 🎉 完成后的下一步

1. **测试新功能**: 创建项目，验证输入验证是否正常工作
2. **通知用户**: 告知用户新的合约地址
3. **监控系统**: 观察新合约的运行状况
4. **文档更新**: 更新相关文档和说明

---

**需要帮助？** 如果遇到问题，请检查控制台输出的详细错误信息。