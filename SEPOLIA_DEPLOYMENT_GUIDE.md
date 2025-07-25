# Sepolia 测试网部署指南

## 当前状态
- ✅ 环境配置已完成
- ✅ 部署脚本已准备就绪
- ❌ 账户余额不足 (当前: 0.000000000000000012 ETH)

## 部署账户信息
- **地址**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **当前余额**: 0.000000000000000012 ETH
- **所需余额**: 约 0.01-0.02 ETH (用于合约部署)

## 获取 Sepolia 测试 ETH

### 方法1: Alchemy Sepolia 水龙头
1. 访问: https://sepoliafaucet.com/
2. 输入地址: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. 完成验证并申请测试 ETH

### 方法2: Chainlink 水龙头
1. 访问: https://faucets.chain.link/sepolia
2. 输入地址: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. 连接钱包或完成验证

### 方法3: QuickNode 水龙头
1. 访问: https://faucet.quicknode.com/ethereum/sepolia
2. 输入地址: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. 完成验证并申请

## 部署步骤

### 1. 检查余额
```bash
npx hardhat run scripts/check-balance.cjs --network sepolia
```

### 2. 执行部署
```bash
npm run deploy-sepolia
```

### 3. 验证部署
部署成功后，会看到类似输出:
```
✅ CarbonCreditNFT 部署成功: 0x...
✅ CarbonCreditSystem 部署成功: 0x...
✅ 权限设置完成
✅ 部署信息已保存
```

## 预期部署结果

部署成功后将创建:
- `ignition/deployments/chain-11155111/` 目录
- `deployed_addresses.json` 文件包含合约地址
- 前端配置自动更新

## 故障排除

### 余额不足错误
```
Error: insufficient funds for intrinsic transaction cost
```
**解决方案**: 从水龙头获取更多测试 ETH

### 网络连接错误
```
HeadersTimeoutError: Headers Timeout Error
```
**解决方案**: 已配置稳定的 Alchemy RPC 端点

### Gas 费用过高
```
Error: transaction underpriced
```
**解决方案**: 等待网络拥堵缓解或增加 gas price

## 下一步

1. **获取测试 ETH**: 使用上述水龙头为地址充值
2. **重新部署**: 余额充足后执行 `npm run deploy-sepolia`
3. **验证合约**: 部署成功后可选择在 Etherscan 上验证
4. **测试功能**: 使用前端应用测试所有功能

## 安全提醒

⚠️ **重要**: 当前使用的是 Hardhat 默认测试私钥，仅用于开发测试。
- 不要向此地址发送真实资产
- 生产环境请使用安全生成的私钥
- 妥善保管私钥，不要泄露