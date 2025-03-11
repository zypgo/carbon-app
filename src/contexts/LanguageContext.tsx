import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 定义支持的语言
export type Language = 'zh' | 'en'

// 语言上下文类型
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
  t: (key: string) => key
})

// 自定义钩子，用于访问上下文
export const useLanguage = () => useContext(LanguageContext)

interface LanguageProviderProps {
  children: ReactNode
}

// 翻译文本
const translations: Record<Language, Record<string, string>> = {
  zh: {
    // 导航
    'nav.home': '首页',
    'nav.market': '交易市场',
    'nav.emissions': '碳排放',
    'nav.projects': '项目',
    'nav.profile': '个人中心',
    'nav.connect': '连接钱包',
    'nav.reset': '重置连接',
    
    // 首页
    'home.title': '碳信用交易平台',
    'home.subtitle': '基于区块链的透明碳交易解决方案',
    'home.description': '记录碳排放，交易碳信用，共同应对气候变化',
    'home.feature1.title': '透明可信',
    'home.feature1.desc': '所有交易记录在区块链上，公开透明',
    'home.feature2.title': '便捷交易',
    'home.feature2.desc': '简单易用的界面，轻松买卖碳信用',
    'home.feature3.title': '数据安全',
    'home.feature3.desc': '区块链技术确保数据不可篡改',
    'home.cta': '开始使用',
    
    // 市场
    'market.title': '碳信用交易市场',
    'market.subtitle': '在这里您可以购买和出售碳信用，帮助减少全球碳排放',
    'market.balance': '您的碳信用余额',
    'market.connect.title': '请先连接钱包',
    'market.connect.desc': '连接钱包后即可参与碳信用交易',
    'market.connect.button': '连接钱包',
    'market.sell': '出售碳信用',
    'market.refresh': '刷新列表',
    'market.table.id': 'ID',
    'market.table.seller': '卖家',
    'market.table.amount': '数量',
    'market.table.price': '价格 (ETH)',
    'market.table.status': '状态',
    'market.table.action': '操作',
    'market.status.available': '可购买',
    'market.status.sold': '已售出',
    'market.action.buy': '购买',
    'market.tooltip.price': '非常低的测试价格，适合真实交易测试',
    'market.alert.title': '真实交易提示',
    'market.alert.desc': '点击购买按钮将发起真实的测试网交易，会消耗少量测试网ETH。价格已设置为非常低的金额（0.0001-0.0002 ETH）。',
    
    // 出售模态框
    'sell.title': '出售碳信用',
    'sell.amount': '数量',
    'sell.amount.placeholder': '输入要出售的碳信用数量',
    'sell.price': '价格 (ETH)',
    'sell.price.placeholder': '输入每个碳信用的价格',
    'sell.balance': '您当前的碳信用余额',
    'sell.tip': '建议设置低价格（如0.0001 ETH）以便测试',
    'sell.cancel': '取消',
    'sell.confirm': '确认出售',
    
    // 个人中心
    'profile.title': '个人中心',
    'profile.address': '钱包地址',
    'profile.lastUpdated': '最后更新',
    'profile.connect.title': '请先连接钱包',
    'profile.connect.button': '连接钱包',
    'profile.wallet.title': '钱包余额',
    'profile.wallet.refresh': '刷新余额',
    'profile.wallet.eth': 'ETH余额',
    'profile.stats.balance': '碳信用余额',
    'profile.stats.balance.tooltip': '您当前持有的碳信用数量',
    'profile.stats.value': '碳信用价值',
    'profile.stats.value.tooltip': '基于最近交易价格计算的碳信用总价值',
    'profile.stats.offset': '碳抵消量',
    'profile.stats.offset.tooltip': '您已购买的碳信用总量，代表已抵消的碳排放',
    'profile.stats.projects': '参与项目数',
    'profile.stats.projects.tooltip': '您参与的不同碳抵消项目数量',
    'profile.tab.transactions': '交易历史',
    'profile.tab.projects': '我的项目',
    'profile.tab.settings': '设置',
    'profile.transactions.empty': '暂无交易记录',
    'profile.projects.empty': '暂无提交的项目',
    'profile.settings.coming': '设置功能即将推出...',
    'profile.table.type': '类型',
    'profile.table.amount': '数量',
    'profile.table.price': '价格 (ETH)',
    'profile.table.date': '日期',
    'profile.table.counterparty': '交易方',
    'profile.type.buy': '购买',
    'profile.type.sell': '出售',
    'profile.counterparty.market': '市场',
    
    // 碳排放
    'emissions.title': '碳排放记录',
    'emissions.subtitle': '记录您的碳排放数据，帮助您了解自己的碳足迹',
    'emissions.connect.desc': '连接钱包后即可记录碳排放数据',
    'emissions.form.title': '记录新的排放',
    'emissions.form.activity': '活动类型',
    'emissions.form.activity.placeholder': '选择活动类型',
    'emissions.form.amount': '排放量 (吨 CO2)',
    'emissions.form.submit': '记录排放',
    'emissions.form.error': '请选择活动类型并输入有效的排放量',
    'emissions.record.success': '您的碳排放数据已成功记录',
    'emissions.record.error': '提交过程中发生错误',
    'emissions.history.title': '历史排放记录',
    'emissions.history.empty': '暂无排放记录',
    'emissions.table.activity': '活动类型',
    'emissions.table.amount': '排放量 (吨 CO2)',
    'emissions.table.time': '记录时间',
    
    // 项目
    'projects.title': '碳减排项目',
    'projects.subtitle': '浏览和参与各种碳减排项目，共同应对气候变化',
    'projects.connect.desc': '连接钱包后即可提交和参与项目',
    'projects.submit.button': '提交新项目',
    'projects.modal.title': '提交新项目',
    'projects.modal.name': '项目名称',
    'projects.modal.name.placeholder': '输入项目名称',
    'projects.modal.description': '项目描述',
    'projects.modal.description.placeholder': '详细描述项目内容和减排方式',
    'projects.modal.target': '减排目标 (吨 CO2)',
    'projects.modal.target.placeholder': '输入预计减排量',
    'projects.modal.duration': '项目周期 (月)',
    'projects.modal.duration.placeholder': '输入项目持续时间',
    'projects.modal.cancel': '取消',
    'projects.modal.submit': '提交项目',
    'projects.submit.success': '项目提交成功',
    'projects.submit.error': '项目提交失败',
    'projects.form.incomplete': '表单不完整，请填写所有必填项',
    'projects.list.empty': '暂无项目',
    'projects.card.target': '减排目标',
    'projects.card.progress': '当前进度',
    'projects.card.duration': '项目周期',
    'projects.card.status': '状态',
    'projects.status.active': '进行中',
    'projects.status.completed': '已完成',
    'projects.status.pending': '待审核',
    
    // 通用
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.warning': '警告',
    'common.info': '提示',
    'common.credits': '个',
    'common.eth': 'ETH',
    'common.tons': '吨 CO2',
    'common.projects': '个项目',
    'common.language': '语言',
    'common.language.zh': '中文',
    'common.language.en': '英文'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.market': 'Market',
    'nav.emissions': 'Emissions',
    'nav.projects': 'Projects',
    'nav.profile': 'Profile',
    'nav.connect': 'Connect Wallet',
    'nav.reset': 'Reset Connection',
    
    // Home
    'home.title': 'Carbon Credit Trading Platform',
    'home.subtitle': 'Blockchain-based Transparent Carbon Trading Solution',
    'home.description': 'Record carbon emissions, trade carbon credits, and combat climate change together',
    'home.feature1.title': 'Transparent & Trustworthy',
    'home.feature1.desc': 'All transactions recorded on blockchain, open and transparent',
    'home.feature2.title': 'Convenient Trading',
    'home.feature2.desc': 'Simple and easy-to-use interface for carbon credit trading',
    'home.feature3.title': 'Data Security',
    'home.feature3.desc': 'Blockchain technology ensures data immutability',
    'home.cta': 'Get Started',
    
    // Market
    'market.title': 'Carbon Credit Market',
    'market.subtitle': 'Buy and sell carbon credits here to help reduce global carbon emissions',
    'market.balance': 'Your Carbon Credit Balance',
    'market.connect.title': 'Please Connect Wallet First',
    'market.connect.desc': 'Connect your wallet to participate in carbon credit trading',
    'market.connect.button': 'Connect Wallet',
    'market.sell': 'Sell Credits',
    'market.refresh': 'Refresh List',
    'market.table.id': 'ID',
    'market.table.seller': 'Seller',
    'market.table.amount': 'Amount',
    'market.table.price': 'Price (ETH)',
    'market.table.status': 'Status',
    'market.table.action': 'Action',
    'market.status.available': 'Available',
    'market.status.sold': 'Sold',
    'market.action.buy': 'Buy',
    'market.tooltip.price': 'Very low test price, suitable for real transaction testing',
    'market.alert.title': 'Real Transaction Notice',
    'market.alert.desc': 'Clicking the buy button will initiate a real testnet transaction, consuming a small amount of testnet ETH. Prices are set to very low amounts (0.0001-0.0002 ETH).',
    
    // Sell Modal
    'sell.title': 'Sell Carbon Credits',
    'sell.amount': 'Amount',
    'sell.amount.placeholder': 'Enter the amount of carbon credits to sell',
    'sell.price': 'Price (ETH)',
    'sell.price.placeholder': 'Enter the price per carbon credit',
    'sell.balance': 'Your current carbon credit balance',
    'sell.tip': 'Recommended to set a low price (e.g., 0.0001 ETH) for testing',
    'sell.cancel': 'Cancel',
    'sell.confirm': 'Confirm Sale',
    
    // Profile
    'profile.title': 'Profile',
    'profile.address': 'Wallet Address',
    'profile.lastUpdated': 'Last Updated',
    'profile.connect.title': 'Please Connect Wallet First',
    'profile.connect.button': 'Connect Wallet',
    'profile.wallet.title': 'Wallet Balance',
    'profile.wallet.refresh': 'Refresh Balance',
    'profile.wallet.eth': 'ETH Balance',
    'profile.stats.balance': 'Carbon Credit Balance',
    'profile.stats.balance.tooltip': 'The number of carbon credits you currently hold',
    'profile.stats.value': 'Carbon Credit Value',
    'profile.stats.value.tooltip': 'Total value of your carbon credits based on recent transaction prices',
    'profile.stats.offset': 'Carbon Offset',
    'profile.stats.offset.tooltip': 'Total carbon credits purchased, representing offset carbon emissions',
    'profile.stats.projects': 'Projects Participated',
    'profile.stats.projects.tooltip': 'Number of different carbon offset projects you have participated in',
    'profile.tab.transactions': 'Transaction History',
    'profile.tab.projects': 'My Projects',
    'profile.tab.settings': 'Settings',
    'profile.transactions.empty': 'No transaction records',
    'profile.projects.empty': 'No submitted projects',
    'profile.settings.coming': 'Settings feature coming soon...',
    'profile.table.type': 'Type',
    'profile.table.amount': 'Amount',
    'profile.table.price': 'Price (ETH)',
    'profile.table.date': 'Date',
    'profile.table.counterparty': 'Counterparty',
    'profile.type.buy': 'Buy',
    'profile.type.sell': 'Sell',
    'profile.counterparty.market': 'Market',
    
    // Emissions
    'emissions.title': 'Carbon Emissions',
    'emissions.subtitle': 'Record your carbon emission data to understand your carbon footprint',
    'emissions.connect.desc': 'Connect your wallet to record carbon emissions',
    'emissions.form.title': 'Record New Emission',
    'emissions.form.activity': 'Activity Type',
    'emissions.form.activity.placeholder': 'Select activity type',
    'emissions.form.amount': 'Emission Amount (tons CO2)',
    'emissions.form.submit': 'Record Emission',
    'emissions.form.error': 'Please select an activity type and enter a valid emission amount',
    'emissions.record.success': 'Your carbon emission data has been successfully recorded',
    'emissions.record.error': 'An error occurred during submission',
    'emissions.history.title': 'Emission History',
    'emissions.history.empty': 'No emission records',
    'emissions.table.activity': 'Activity Type',
    'emissions.table.amount': 'Amount (tons CO2)',
    'emissions.table.time': 'Record Time',
    
    // Projects
    'projects.title': 'Carbon Reduction Projects',
    'projects.subtitle': 'Browse and participate in various carbon reduction projects to combat climate change',
    'projects.connect.desc': 'Connect your wallet to submit and participate in projects',
    'projects.submit.button': 'Submit New Project',
    'projects.modal.title': 'Submit New Project',
    'projects.modal.name': 'Project Name',
    'projects.modal.name.placeholder': 'Enter project name',
    'projects.modal.description': 'Project Description',
    'projects.modal.description.placeholder': 'Describe the project details and emission reduction methods',
    'projects.modal.target': 'Reduction Target (tons CO2)',
    'projects.modal.target.placeholder': 'Enter estimated reduction amount',
    'projects.modal.duration': 'Project Duration (months)',
    'projects.modal.duration.placeholder': 'Enter project duration',
    'projects.modal.cancel': 'Cancel',
    'projects.modal.submit': 'Submit Project',
    'projects.submit.success': 'Project submitted successfully',
    'projects.submit.error': 'Project submission failed',
    'projects.form.incomplete': 'Form incomplete, please fill in all required fields',
    'projects.list.empty': 'No projects available',
    'projects.card.target': 'Reduction Target',
    'projects.card.progress': 'Current Progress',
    'projects.card.duration': 'Project Duration',
    'projects.card.status': 'Status',
    'projects.status.active': 'Active',
    'projects.status.completed': 'Completed',
    'projects.status.pending': 'Pending Review',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    'common.credits': 'credits',
    'common.eth': 'ETH',
    'common.tons': 'tons CO2',
    'common.projects': 'projects',
    'common.language': 'Language',
    'common.language.zh': 'Chinese',
    'common.language.en': 'English'
  }
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // 从本地存储获取语言设置，默认为中文
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('app_language')
    return (savedLanguage as Language) || 'zh'
  })

  // 翻译函数
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  // 当语言变化时，保存到本地存储
  useEffect(() => {
    localStorage.setItem('app_language', language)
    // 可以在这里添加更多语言变化时的逻辑，如更新HTML的lang属性
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
} 