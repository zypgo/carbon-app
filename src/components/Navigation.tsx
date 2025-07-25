import { useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Box, Flex, HStack, Button, Text, useColorModeValue,
  Menu, MenuButton, MenuList, MenuItem, Select,
  Badge, Tooltip
} from '@chakra-ui/react'
import { ChevronDownIcon, RepeatIcon, InfoIcon } from '@chakra-ui/icons'
import { useWeb3, UserRole } from '../contexts/Web3Context'
import { useLanguage, Language } from '../contexts/LanguageContext'

const Navigation = () => {
  const location = useLocation()
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const { language, setLanguage, t } = useLanguage()
  
  const { 
    account, 
    connectWallet, 
    isConnecting, 
    resetConnection, 
    chainId,
    userRole,
    switchRole,
    isVerifier,
    verifierAddress
  } = useWeb3()
  
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

  // 获取用户角色名称
  const getRoleName = (role: UserRole) => {
    switch(role) {
      case UserRole.Verifier:
        return t('role.verifier') || '审核者';
      case UserRole.User:
      default:
        return t('role.user') || '用户';
    }
  }

  // 获取角色颜色
  const getRoleColor = (role: UserRole) => {
    switch(role) {
      case UserRole.Verifier:
        return 'blue';
      case UserRole.User:
      default:
        return 'green';
    }
  }

  // 获取网络名称
  const getNetworkName = (id: number | null | undefined) => {
    if (!id) return '未知网络';
    
    switch (id) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Mumbai Testnet';
      case 56: return 'BSC Mainnet';
      case 97: return 'BSC Testnet';
      case 31337: return 'Localhost';
      case 1337: return 'Localhost';
      default: return `Chain ID: ${id}`;
    }
  }

  // 获取网络颜色
  const getNetworkColor = (id: number | null | undefined) => {
    if (!id) return 'gray';
    
    switch (id) {
      case 1: return 'blue'; // Ethereum Mainnet
      case 5: return 'yellow'; // Goerli
      case 11155111: return 'purple'; // Sepolia
      case 137: return 'purple'; // Polygon
      case 80001: return 'pink'; // Mumbai
      case 56: return 'yellow'; // BSC
      case 97: return 'orange'; // BSC Testnet
      case 31337: case 1337: return 'green'; // Localhost
      default: return 'gray';
    }
  }

  // 处理角色切换
  const handleRoleSwitch = (role: UserRole) => {
    if (switchRole) {
      switchRole(role);
    }
  }

  // 检查是否是验证者地址
  const isVerifierAddress = account && verifierAddress && 
    account.toLowerCase() === verifierAddress.toLowerCase();

  console.log('Navigation render:', { 
    account, 
    verifierAddress, 
    isVerifierAddress, 
    userRole, 
    isVerifier 
  });

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
            {/* 调试页面 - 仅对验证者显示 */}
            {isVerifier && (
              <NavLink to="/debug" isActive={location.pathname === '/debug'}>
                🔧 调试
              </NavLink>
            )}
          </HStack>
        </HStack>

        <Flex alignItems="center" gap={4}>
          {/* 显示网络状态 */}
          {account && (
            <Tooltip label="当前连接的区块链网络">
              <Badge 
                colorScheme={getNetworkColor(chainId)}
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {getNetworkName(chainId)}
              </Badge>
            </Tooltip>
          )}
          
          {/* 显示用户角色 */}
          {account && (
            <Tooltip label="当前用户角色">
              <Badge 
                colorScheme={getRoleColor(userRole)}
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {getRoleName(userRole)}
              </Badge>
            </Tooltip>
          )}
          
          {/* 角色切换菜单 - 仅对验证者地址显示 */}
          {account && isVerifierAddress && (
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                rightIcon={<ChevronDownIcon />}
                colorScheme="teal"
                variant="outline"
              >
                {t('role.switch') || '切换角色'}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleRoleSwitch(UserRole.Verifier)}>
                  {t('role.verifier') || '审核者'}
                </MenuItem>
                <MenuItem onClick={() => handleRoleSwitch(UserRole.User)}>
                  {t('role.user') || '普通用户'}
                </MenuItem>
              </MenuList>
            </Menu>
          )}
          
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