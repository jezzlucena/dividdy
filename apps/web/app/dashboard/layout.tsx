'use client';

import {
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { FiHome, FiLogOut, FiMoon, FiSettings, FiSun, FiUsers } from 'react-icons/fi';

import { useAuth } from '@/lib/hooks/useAuth';

const navItems = [
  { href: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { href: '/dashboard/groups', icon: FiUsers, label: 'Groups' },
  { href: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useColorMode();
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        w="240px"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        py={6}
        px={4}
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        h="100vh"
      >
        <VStack spacing={8} align="stretch" h="full">
          <Heading
            as={Link}
            href="/dashboard"
            size="lg"
            color="brand.500"
            fontWeight="800"
            px={2}
          >
            Dividdy
          </Heading>

          <VStack spacing={1} align="stretch" flex={1}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <HStack
                    px={3}
                    py={2}
                    borderRadius="lg"
                    bg={isActive ? 'brand.50' : 'transparent'}
                    color={isActive ? 'brand.600' : 'gray.600'}
                    _hover={{ bg: isActive ? 'brand.50' : 'gray.100' }}
                    _dark={{
                      bg: isActive ? 'brand.900' : 'transparent',
                      color: isActive ? 'brand.200' : 'gray.300',
                      _hover: { bg: isActive ? 'brand.900' : 'gray.700' },
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={item.icon} boxSize={5} />
                    <Text fontWeight={isActive ? '600' : '500'}>{item.label}</Text>
                  </HStack>
                </Link>
              );
            })}
          </VStack>

          <Box>
            <HStack
              px={3}
              py={2}
              borderRadius="lg"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              _dark={{ _hover: { bg: 'gray.700' } }}
              onClick={logout}
              color="gray.600"
              _dark={{ color: 'gray.300' }}
            >
              <Icon as={FiLogOut} boxSize={5} />
              <Text fontWeight="500">Sign Out</Text>
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box ml={{ base: 0, md: '240px' }} flex={1}>
        {/* Top Bar */}
        <Flex
          h="64px"
          px={6}
          align="center"
          justify="space-between"
          borderBottom="1px"
          borderColor={borderColor}
          bg={sidebarBg}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Heading size="md" display={{ base: 'block', md: 'none' }} color="brand.500">
            Dividdy
          </Heading>

          <Box display={{ base: 'none', md: 'block' }} />

          <HStack spacing={4}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              variant="ghost"
              onClick={toggleColorMode}
            />

            <Menu>
              <MenuButton>
                <HStack>
                  <Avatar size="sm" name={user?.name} />
                  <Text fontWeight="500" display={{ base: 'none', md: 'block' }}>
                    {user?.name}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} href="/dashboard/settings">
                  Settings
                </MenuItem>
                <MenuItem onClick={logout}>Sign Out</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Page Content */}
        <Box p={6}>{children}</Box>
      </Box>
    </Flex>
  );
}

