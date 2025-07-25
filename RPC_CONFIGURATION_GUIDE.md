# RPC配置指南

## 问题说明

当您看到"拿不到链上的数据"或"API请求限制"错误时，通常是因为使用的公共RPC端点达到了使用限制。公共RPC端点有请求频率和数量限制，在高峰期容易达到限制。

## 解决方案

### 方案1：使用免费的RPC服务提供商

#### 1. Infura (推荐)
1. 访问 [https://infura.io/](https://infura.io/)
2. 注册免费账户
3. 创建新项目
4. 获取Sepolia网络的RPC URL
5. 在`.env`文件中配置：
```bash
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

#### 2. Alchemy
1. 访问 [https://www.alchemy.com/](https://www.alchemy.com/)
2. 注册免费账户
3. 创建新应用，选择Sepolia网络
4. 获取RPC URL
5. 在`.env`文件中配置：
```bash
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

#### 3. QuickNode
1. 访问 [https://www.quicknode.com/](https://www.quicknode.com/)
2. 注册免费账户
3. 创建Sepolia端点
4. 获取RPC URL
5. 在`.env`文件中配置：
```bash
VITE_SEPOLIA_RPC_URL=https://your-endpoint.sepolia.quiknode.pro/YOUR_API_KEY/
```

### 方案2：使用备用公共端点

应用已配置多个备用RPC端点，会自动尝试可用的端点：
- `https://ethereum-sepolia-rpc.publicnode.com`
- `https://sepolia.gateway.tenderly.co`
- `https://rpc.sepolia.org`
- `https://rpc2.sepolia.org`
- `https://rpc.sepolia.dev`

### 方案3：稍后重试

如果是临时的API限制，可以等待一段时间后重新连接钱包。

## 配置步骤

1. 在项目根目录找到`.env`文件
2. 修改或添加`VITE_SEPOLIA_RPC_URL`配置
3. 重启开发服务器：
```bash
npm run dev
```
4. 重新连接钱包

## 验证配置

配置完成后，在浏览器控制台中应该看到：
```
✅ 使用RPC端点: https://your-configured-endpoint
✅ RPC连接正常，当前区块: [区块号]
```

## 常见问题

### Q: 为什么会出现API限制？
A: 公共RPC端点为了防止滥用，会限制每个IP的请求频率和总量。

### Q: 免费的RPC服务有什么限制？
A: 大多数提供商的免费套餐每天有几万到几十万次请求限制，对于开发和测试足够使用。

### Q: 配置后还是有问题怎么办？
A: 检查RPC URL是否正确，确保网络选择为Sepolia，或尝试其他RPC提供商。

### Q: 生产环境建议使用哪个？
A: 建议使用Infura或Alchemy的付费套餐，提供更好的稳定性和性能保障。