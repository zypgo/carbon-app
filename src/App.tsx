import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { useWeb3 } from './contexts/Web3Context'
import { LanguageProvider } from './contexts/LanguageContext'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Market from './pages/Market'
import Emissions from './pages/Emissions'
import Projects from './pages/Projects'
import Profile from './pages/Profile'

function App() {
  return (
    <LanguageProvider>
      <Box minH="100vh">
        <Navigation />
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
    </LanguageProvider>
  )
}

export default App 