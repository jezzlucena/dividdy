'use client';

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { FiDollarSign, FiLock, FiServer, FiUsers } from 'react-icons/fi';

const features = [
  {
    icon: FiUsers,
    title: 'Group Expenses',
    description: 'Create groups for trips, roommates, or any shared spending. Invite friends with a simple link.',
  },
  {
    icon: FiDollarSign,
    title: 'Smart Splitting',
    description: 'Split bills equally, by percentage, shares, or exact amounts. Dividdy calculates who owes what.',
  },
  {
    icon: FiLock,
    title: 'Privacy First',
    description: 'Your financial data stays yours. Self-host on your own server for complete control.',
  },
  {
    icon: FiServer,
    title: 'Self-Hostable',
    description: 'Deploy with Docker in minutes. No vendor lock-in, no monthly fees, no data harvesting.',
  },
];

export default function HomePage() {
  const bgGradient = useColorModeValue(
    'linear(to-br, brand.50, white, purple.50)',
    'linear(to-br, gray.900, gray.800, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Header */}
      <Flex as="header" py={4} px={8} justify="space-between" align="center">
        <Heading size="lg" color="brand.500" fontWeight="800">
          Dividdy
        </Heading>
        <Stack direction="row" spacing={4}>
          <Button as={Link} href="/auth/login" variant="ghost">
            Sign In
          </Button>
          <Button as={Link} href="/auth/register" colorScheme="brand">
            Get Started
          </Button>
        </Stack>
      </Flex>

      {/* Hero */}
      <Container maxW="6xl" py={{ base: 16, md: 24 }}>
        <Stack spacing={8} align="center" textAlign="center">
          <Heading
            as="h1"
            size={{ base: '2xl', md: '3xl', lg: '4xl' }}
            fontWeight="800"
            lineHeight="shorter"
          >
            Split expenses with friends,{' '}
            <Text as="span" color="brand.500">
              without the hassle
            </Text>
          </Heading>
          <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" maxW="2xl">
            Dividdy is a free, open-source alternative to Splitwise. Track group spending, 
            split bills fairly, and settle up easily. Self-host it for complete privacy.
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
            <Button as={Link} href="/auth/register" size="lg" colorScheme="brand" px={8}>
              Start Splitting Free
            </Button>
            <Button
              as="a"
              href="https://github.com/your-repo/dividdy"
              target="_blank"
              size="lg"
              variant="outline"
              px={8}
            >
              View on GitHub
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* Features */}
      <Container maxW="6xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          {features.map((feature) => (
            <Box
              key={feature.title}
              bg={cardBg}
              p={6}
              borderRadius="xl"
              boxShadow="md"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <Icon as={feature.icon} boxSize={10} color="brand.500" mb={4} />
              <Heading size="md" mb={2}>
                {feature.title}
              </Heading>
              <Text color="gray.600" fontSize="sm">
                {feature.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      {/* CTA */}
      <Container maxW="4xl" py={16}>
        <Box
          bg="brand.500"
          color="white"
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          textAlign="center"
        >
          <Heading size="xl" mb={4}>
            Ready to simplify expense sharing?
          </Heading>
          <Text fontSize="lg" mb={6} opacity={0.9}>
            Join thousands who have ditched spreadsheets and IOUs.
          </Text>
          <Button as={Link} href="/auth/register" size="lg" colorScheme="whiteAlpha" px={8}>
            Create Free Account
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box as="footer" py={8} textAlign="center" color="gray.500">
        <Text>
          Dividdy is open source software. Made with ❤️ for fair expense splitting.
        </Text>
      </Box>
    </Box>
  );
}

