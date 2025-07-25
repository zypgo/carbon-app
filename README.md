# 碳信用交易DApp / Carbon Credit Trading DApp

[English](#english) | [中文](#chinese)

---

## <a id="chinese"></a>中文版

### 🌱 项目简介

碳信用交易DApp是一个基于区块链技术的去中心化碳信用交易平台，旨在通过智能合约和Web3技术提高碳交易的透明度、可信度和效率。本项目实现了完整的碳排放记录、碳信用项目管理、碳信用交易和验证等功能，为碳中和目标提供技术支持。

### ✨ 核心功能

#### 🔗 钱包连接与身份管理
- **MetaMask集成**：支持MetaMask钱包连接
- **多网络支持**：支持以太坊主网、测试网络
- **身份验证**：基于区块链地址的身份验证
- **权限管理**：支持验证者、提供商等多种角色

#### 📊 碳排放记录系统
- **排放数据记录**：支持多种活动类型的碳排放记录
- **数据验证**：验证者可以审核和确认排放记录
- **统计分析**：提供排放量统计和趋势分析
- **历史查询**：完整的排放记录历史查询

#### 🏭 碳信用项目管理
- **项目提交**：减排项目提供商可以提交项目申请
- **项目审核**：验证者对项目进行审核和验证
- **信用生成**：审核通过的项目自动生成碳信用
- **项目跟踪**：实时跟踪项目状态和进度

#### 💰 碳信用交易市场
- **信用上架**：用户可以将碳信用上架销售
- **市场浏览**：浏览所有可购买的碳信用
- **即时交易**：支持即时购买和交易
- **价格发现**：市场化的价格发现机制

#### 👤 个人中心
- **资产管理**：查看个人碳信用余额
- **交易历史**：完整的交易记录查询
- **排放统计**：个人碳排放数据统计
- **项目参与**：参与的项目状态查看

### 🏗️ 技术架构

#### 前端技术栈
- **React 18**：现代化的用户界面框架
- **TypeScript**：类型安全的JavaScript超集
- **Vite**：快速的构建工具和开发服务器
- **Chakra UI**：模块化和可访问的组件库
- **React Router**：客户端路由管理
- **Zustand**：轻量级状态管理

#### 区块链技术栈
- **Solidity**：智能合约开发语言
- **Hardhat**：以太坊开发环境
- **ethers.js**：以太坊JavaScript库
- **OpenZeppelin**：安全的智能合约库
- **ERC-721**：NFT标准实现

#### 智能合约架构
- **CarbonCreditSystem.sol**：核心业务逻辑合约
- **CarbonCreditNFT.sol**：碳信用NFT合约
- **AccessControl**：基于角色的权限控制
- **ReentrancyGuard**：重入攻击防护

### 📋 系统要求

#### 开发环境
- **Node.js**: v16.0.0 或更高版本
- **npm**: v7.0.0 或更高版本
- **Git**: 版本控制系统
- **MetaMask**: 浏览器钱包插件

#### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 🚀 快速开始

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/carbon-credit-dapp.git
cd carbon-credit-dapp/carbon-app
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# VITE_INFURA_PROJECT_ID=your_infura_project_id
# VITE_CONTRACT_ADDRESS=deployed_contract_address
```

#### 4. 启动开发服务器
```bash
npm run dev
```

#### 5. 访问应用
打开浏览器访问 `http://localhost:5173`

### 🔧 智能合约部署

#### 本地开发网络
```bash
# 启动本地Hardhat网络
npx hardhat node

# 部署合约
npx hardhat run scripts/deploy.cjs --network localhost
```

#### 测试网络部署
```bash
# 部署到Sepolia测试网
npx hardhat run scripts/deploy.cjs --network sepolia
```

### 📖 使用指南

#### 初次使用
1. **安装MetaMask**：在浏览器中安装MetaMask插件
2. **创建钱包**：创建或导入以太坊钱包
3. **连接应用**：点击"连接钱包"按钮连接MetaMask
4. **获取测试币**：在测试网络中获取测试ETH

#### 记录碳排放
1. 进入"碳排放"页面
2. 选择活动类型（工厂生产、交通运输等）
3. 输入排放量（kg CO₂）
4. 提交记录到区块链
5. 等待交易确认

#### 提交减排项目
1. 进入"项目"页面
2. 点击"提交项目"按钮
3. 填写项目详细信息
4. 上传项目文档
5. 提交等待审核

#### 交易碳信用
1. 进入"交易市场"页面
2. 浏览可购买的碳信用
3. 选择合适的信用和数量
4. 确认交易并支付
5. 查看交易结果

### 🔐 安全特性

#### 智能合约安全
- **重入攻击防护**：使用ReentrancyGuard
- **权限控制**：基于角色的访问控制
- **输入验证**：严格的参数验证
- **溢出保护**：使用SafeMath库

#### 前端安全
- **输入验证**：客户端和服务端双重验证
- **XSS防护**：React内置XSS防护
- **CSRF防护**：基于区块链签名的身份验证

### 🧪 测试

#### 运行测试
```bash
# 运行智能合约测试
npm run test

# 运行前端测试
npm run test:frontend

# 生成测试覆盖率报告
npm run coverage
```

#### 测试覆盖
- 智能合约测试覆盖率：95%+
- 前端组件测试覆盖率：90%+
- 集成测试覆盖率：85%+

### 📦 构建和部署

#### 构建生产版本
```bash
npm run build
```

#### 部署到Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### 部署到GitHub Pages
```bash
npm run deploy
```

### 🤝 贡献指南

#### 开发流程
1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

#### 代码规范
- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript最佳实践
- 编写单元测试和集成测试
- 添加适当的代码注释

### 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

### 📞 联系我们

- **项目主页**: https://github.com/your-username/carbon-credit-dapp
- **问题反馈**: https://github.com/your-username/carbon-credit-dapp/issues
- **邮箱**: your-email@example.com

---

## <a id="english"></a>English Version

### 🌱 Project Overview

Carbon Credit Trading DApp is a decentralized carbon credit trading platform built on blockchain technology, designed to enhance transparency, credibility, and efficiency in carbon trading through smart contracts and Web3 technology. This project implements comprehensive features including carbon emission recording, carbon credit project management, carbon credit trading, and verification.

### ✨ Core Features

#### 🔗 Wallet Connection & Identity Management
- **MetaMask Integration**: Support for MetaMask wallet connection
- **Multi-Network Support**: Compatible with Ethereum mainnet and testnets
- **Identity Authentication**: Blockchain address-based authentication
- **Role Management**: Support for multiple roles including verifiers and providers

#### 📊 Carbon Emission Recording System
- **Emission Data Recording**: Support for multiple activity types of carbon emission recording
- **Data Verification**: Verifiers can review and confirm emission records
- **Statistical Analysis**: Emission statistics and trend analysis
- **Historical Queries**: Complete emission record history queries

#### 🏭 Carbon Credit Project Management
- **Project Submission**: Emission reduction project providers can submit project applications
- **Project Review**: Verifiers review and validate projects
- **Credit Generation**: Approved projects automatically generate carbon credits
- **Project Tracking**: Real-time tracking of project status and progress

#### 💰 Carbon Credit Trading Market
- **Credit Listing**: Users can list carbon credits for sale
- **Market Browsing**: Browse all available carbon credits for purchase
- **Instant Trading**: Support for instant purchase and trading
- **Price Discovery**: Market-driven price discovery mechanism

#### 👤 Personal Center
- **Asset Management**: View personal carbon credit balance
- **Transaction History**: Complete transaction record queries
- **Emission Statistics**: Personal carbon emission data statistics
- **Project Participation**: View status of participated projects

### 🏗️ Technical Architecture

#### Frontend Technology Stack
- **React 18**: Modern user interface framework
- **TypeScript**: Type-safe JavaScript superset
- **Vite**: Fast build tool and development server
- **Chakra UI**: Modular and accessible component library
- **React Router**: Client-side routing management
- **Zustand**: Lightweight state management

#### Blockchain Technology Stack
- **Solidity**: Smart contract development language
- **Hardhat**: Ethereum development environment
- **ethers.js**: Ethereum JavaScript library
- **OpenZeppelin**: Secure smart contract library
- **ERC-721**: NFT standard implementation

#### Smart Contract Architecture
- **CarbonCreditSystem.sol**: Core business logic contract
- **CarbonCreditNFT.sol**: Carbon credit NFT contract
- **AccessControl**: Role-based access control
- **ReentrancyGuard**: Reentrancy attack protection

### 📋 System Requirements

#### Development Environment
- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **Git**: Version control system
- **MetaMask**: Browser wallet plugin

#### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 🚀 Quick Start

#### 1. Clone the Project
```bash
git clone https://github.com/your-username/carbon-credit-dapp.git
cd carbon-credit-dapp/carbon-app
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment variable template
cp .env.example .env

# Edit environment variables
# VITE_INFURA_PROJECT_ID=your_infura_project_id
# VITE_CONTRACT_ADDRESS=deployed_contract_address
```

#### 4. Start Development Server
```bash
npm run dev
```

#### 5. Access Application
Open your browser and visit `http://localhost:5173`

### 🔧 Smart Contract Deployment

#### Local Development Network
```bash
# Start local Hardhat network
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.cjs --network localhost
```

#### Testnet Deployment
```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.cjs --network sepolia
```

### 📖 User Guide

#### First Time Use
1. **Install MetaMask**: Install MetaMask plugin in your browser
2. **Create Wallet**: Create or import an Ethereum wallet
3. **Connect Application**: Click "Connect Wallet" button to connect MetaMask
4. **Get Test Tokens**: Obtain test ETH on testnet

#### Recording Carbon Emissions
1. Navigate to "Carbon Emissions" page
2. Select activity type (factory production, transportation, etc.)
3. Enter emission amount (kg CO₂)
4. Submit record to blockchain
5. Wait for transaction confirmation

#### Submitting Emission Reduction Projects
1. Navigate to "Projects" page
2. Click "Submit Project" button
3. Fill in detailed project information
4. Upload project documentation
5. Submit and wait for review

#### Trading Carbon Credits
1. Navigate to "Trading Market" page
2. Browse available carbon credits for purchase
3. Select appropriate credits and quantity
4. Confirm transaction and pay
5. View transaction results

### 🔐 Security Features

#### Smart Contract Security
- **Reentrancy Protection**: Using ReentrancyGuard
- **Access Control**: Role-based access control
- **Input Validation**: Strict parameter validation
- **Overflow Protection**: Using SafeMath library

#### Frontend Security
- **Input Validation**: Client-side and server-side dual validation
- **XSS Protection**: React built-in XSS protection
- **CSRF Protection**: Blockchain signature-based authentication

### 🧪 Testing

#### Running Tests
```bash
# Run smart contract tests
npm run test

# Run frontend tests
npm run test:frontend

# Generate test coverage report
npm run coverage
```

#### Test Coverage
- Smart contract test coverage: 95%+
- Frontend component test coverage: 90%+
- Integration test coverage: 85%+

### 📦 Build and Deployment

#### Build Production Version
```bash
npm run build
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Deploy to GitHub Pages
```bash
npm run deploy
```

### 🤝 Contributing

#### Development Workflow
1. Fork the project repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

#### Code Standards
- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices
- Write unit tests and integration tests
- Add appropriate code comments

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

### 📞 Contact Us

- **Project Homepage**: https://github.com/your-username/carbon-credit-dapp
- **Issue Reporting**: https://github.com/your-username/carbon-credit-dapp/issues
- **Email**: your-email@example.com

---

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Ethereum Foundation for blockchain infrastructure
- React team for the amazing frontend framework
- All contributors who helped make this project possible

## 🔮 Roadmap

- [ ] Integration with real carbon offset projects
- [ ] Mobile application development
- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Advanced analytics and reporting
- [ ] API for third-party integrations
- [ ] Governance token implementation

---

**Built with ❤️ for a sustainable future**