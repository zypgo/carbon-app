import { useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Box, Flex, HStack, Button, Text, useColorModeValue,
  Menu, MenuButton, MenuList, MenuItem, Select,
  Avatar
} from '@chakra-ui/react'
import { ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons'
import { useWeb3 } from '../contexts/Web3Context'
import { useLanguage, Language } from '../contexts/LanguageContext'

interface NavigationProps {
  account: string | null
  connectWallet: () => void
  isConnecting: boolean
  resetConnection?: () => void
}

const Navigation = ({ account, connectWallet, isConnecting, resetConnection }: NavigationProps) => {
  const location = useLocation()
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const { language, setLanguage, t } = useLanguage()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const handleConnectClick = () => {
    setConnectionAttempts(prev => prev + 1)
    connectWallet()
  }

  const handleResetConnection = () => {
    if (resetConnection) {
      resetConnection()
      setConnectionAttempts(0)
    }
  }
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language)
  }

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={2}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Box fontWeight="bold" fontSize="xl">
            <RouterLink to="/">Carbon DApp</RouterLink>
          </Box>
          <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
            <NavLink to="/" isActive={location.pathname === '/'}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/market" isActive={location.pathname === '/market'}>
              {t('nav.market')}
            </NavLink>
            <NavLink to="/emissions" isActive={location.pathname === '/emissions'}>
              {t('nav.emissions')}
            </NavLink>
            <NavLink to="/projects" isActive={location.pathname === '/projects'}>
              {t('nav.projects')}
            </NavLink>
            <NavLink to="/profile" isActive={location.pathname === '/profile'}>
              {t('nav.profile')}
            </NavLink>
          </HStack>
        </HStack>

        <Flex alignItems="center" gap={4}>
          {/* 语言切换 */}
          <Select 
            value={language} 
            onChange={handleLanguageChange} 
            size="sm" 
            width="auto"
            variant="filled"
          >
            <option value="zh">{t('common.language.zh')}</option>
            <option value="en">{t('common.language.en')}</option>
          </Select>
          
          {account ? (
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                colorScheme="green"
              >
                {formatAddress(account)}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={handleResetConnection}>
                  {t('nav.reset')}
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button
              colorScheme="green"
              onClick={handleConnectClick}
              isLoading={isConnecting}
              loadingText={t('common.loading')}
              leftIcon={connectionAttempts > 1 ? <RepeatIcon /> : undefined}
            >
              {t('nav.connect')}
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

interface NavLinkProps {
  to: string
  isActive: boolean
  children: React.ReactNode
}

const NavLink = ({ to, isActive, children }: NavLinkProps) => {
  const activeColor = useColorModeValue('green.500', 'green.300')
  const hoverColor = useColorModeValue('gray.700', 'gray.300')
  const color = isActive ? activeColor : 'inherit'

  return (
    <RouterLink to={to}>
      <Text
        px={2}
        py={1}
        rounded="md"
        fontWeight={isActive ? 'bold' : 'medium'}
        color={color}
        _hover={{
          color: isActive ? activeColor : hoverColor,
        }}
      >
        {children}
      </Text>
    </RouterLink>
  )
}

export default Navigation 