import { Routes, Route } from 'react-router-dom'
import { Box, Container } from '@chakra-ui/react'
import { useWeb3 } from './contexts/Web3Context'
import { LanguageProvider } from './contexts/LanguageContext'
import Navigation from './components/Navigation'
import Web3ErrorHandler from './components/Web3ErrorHandler'
import Web3ConnectionStatus from './components/Web3ConnectionStatus'
import Home from './pages/Home'
import Market from './pages/Market'
import Emissions from './pages/Emissions'
import Projects from './pages/Projects'
import Profile from './pages/Profile'


// 内部App组件，可以使用Web3Context
function AppContent() {
  const { connectionError, connectWallet } = useWeb3()

  return (
    <Box minH="100vh" bg="gray.50">
      <Navigation />
      
      {/* 连接状态和错误处理 */}
      <Container maxW="container.xl" pt={4}>
        {connectionError && (
          <Web3ErrorHandler 
            error={connectionError} 
            onRetry={connectWallet}
          />
        )}
        
        {/* 连接状态显示 */}
        <Box position="fixed" top={20} right={4} zIndex={1000}>
          <Web3ConnectionStatus />
        </Box>
      </Container>
      
      <Box as="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/emissions" element={<Emissions />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/profile" element={<Profile />} />

        </Routes>
      </Box>
    </Box>
  )
}

// 外部App组件，不使用Web3Context
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App