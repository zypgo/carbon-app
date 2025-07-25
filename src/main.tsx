import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { HashRouter as Router } from 'react-router-dom'
import App from './App'
import { Web3Provider } from './contexts/Web3Context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Web3Provider>
        <Router>
          <App />
        </Router>
      </Web3Provider>
    </ChakraProvider>
  </React.StrictMode>
)