import { FC } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  Icon,
  Stack,
  useColorModeValue
} from '@chakra-ui/react'
import { FaShieldAlt, FaExchangeAlt, FaLock } from 'react-icons/fa'
import { useLanguage } from '../contexts/LanguageContext'

const Home: FC = () => {
  const { t } = useLanguage()
  const bgGradient = useColorModeValue(
    'linear(to-r, green.100, blue.100)',
    'linear(to-r, green.900, blue.900)'
  )
  const cardBg = useColorModeValue('white', 'gray.800')

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        py={20}
        px={8}
      >
        <Container maxW="container.xl">
          <Stack spacing={8} alignItems="center" textAlign="center">
            <Heading as="h1" size="2xl">
              {t('home.title')}
            </Heading>
            <Text fontSize="xl" maxW="2xl">
              {t('home.subtitle')}
            </Text>
            <Text fontSize="lg" maxW="3xl">
              {t('home.description')}
            </Text>
            <Button
              as={RouterLink}
              to="/market"
              size="lg"
              colorScheme="green"
              px={8}
            >
              {t('home.cta')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <FeatureCard
            icon={FaShieldAlt}
            title={t('home.feature1.title')}
            description={t('home.feature1.desc')}
          />
          <FeatureCard
            icon={FaExchangeAlt}
            title={t('home.feature2.title')}
            description={t('home.feature2.desc')}
          />
          <FeatureCard
            icon={FaLock}
            title={t('home.feature3.title')}
            description={t('home.feature3.desc')}
          />
        </SimpleGrid>
      </Container>
    </Box>
  )
}

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, description }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardBorder = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      p={6}
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="lg"
      shadow="md"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
    >
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="green.500"
        rounded="full"
        bg={useColorModeValue('green.100', 'green.900')}
        mb={4}
      >
        <Icon as={icon} w={8} h={8} />
      </Flex>
      <Heading as="h3" size="md" mb={3}>
        {title}
      </Heading>
      <Text color={useColorModeValue('gray.600', 'gray.400')}>
        {description}
      </Text>
    </Box>
  )
}

export default Home 