#!/bin/bash

# Sepolia 测试网络配置脚本
# 用于长期解决方案：部署新合约并迁移数据

echo "🚀 Sepolia 测试网络配置向导"
echo "================================"

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
else
    echo "📁 .env 文件已存在"
fi

echo ""
echo "⚠️  重要提醒："
echo "为了部署到 Sepolia 测试网络，您需要配置以下信息："
echo ""
echo "1. 🌐 Sepolia RPC URL"
echo "   - 推荐使用 Infura: https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
echo "   - 或者 Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
echo ""
echo "2. 🔑 私钥 (PRIVATE_KEY)"
echo "   - 确保账户有足够的 Sepolia ETH"
echo "   - 可以从 https://sepoliafaucet.com/ 获取测试 ETH"
echo ""
echo "3. 🔍 Etherscan API Key (可选，用于合约验证)"
echo "   - 从 https://etherscan.io/apis 获取"
echo ""
echo "请编辑 .env 文件并填入正确的配置信息。"
echo ""
echo "配置完成后，运行以下命令："
echo "1. 部署新合约: npm run deploy:sepolia"
echo "2. 迁移数据: npm run migrate:data"
echo "3. 更新前端: npm run update:frontend"