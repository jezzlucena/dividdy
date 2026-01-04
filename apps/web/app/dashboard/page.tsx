'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';
import { FiArrowRight, FiDollarSign, FiPlus, FiUsers } from 'react-icons/fi';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGroups } from '@/lib/hooks/useGroups';

export default function DashboardPage() {
  const { user } = useAuth();
  const { groups, isLoading } = useGroups();
  const cardBg = useColorModeValue('white', 'gray.800');

  const totalGroups = groups.length;
  const recentGroups = groups.slice(0, 3);

  return (
    <Stack spacing={8}>
      {/* Welcome */}
      <Box>
        <Heading size="xl">Welcome back, {user?.name?.split(' ')[0]}!</Heading>
        <Text color="gray.600" mt={1}>
          Here&apos;s an overview of your expense groups
        </Text>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiUsers} color="brand.500" />
                  <Text>Active Groups</Text>
                </HStack>
              </StatLabel>
              <StatNumber>
                {isLoading ? <Skeleton height="36px" width="40px" /> : totalGroups}
              </StatNumber>
              <StatHelpText>Groups you&apos;re part of</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiDollarSign} color="green.500" />
                  <Text>You are owed</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="green.500">$0.00</StatNumber>
              <StatHelpText>Across all groups</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FiDollarSign} color="red.500" />
                  <Text>You owe</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="red.500">$0.00</StatNumber>
              <StatHelpText>Across all groups</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent Groups */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Recent Groups</Heading>
          <Button as={Link} href="/dashboard/groups" variant="ghost" rightIcon={<FiArrowRight />}>
            View All
          </Button>
        </HStack>

        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="xl" />
            ))}
          </SimpleGrid>
        ) : recentGroups.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {recentGroups.map((group) => (
              <Card
                key={group.id}
                as={Link}
                href={`/dashboard/groups/${group.id}`}
                bg={cardBg}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
              >
                <CardBody>
                  <Heading size="sm" mb={2}>
                    {group.name}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {group.description || 'No description'}
                  </Text>
                  <HStack mt={3} color="gray.500" fontSize="sm">
                    <Icon as={FiUsers} />
                    <Text>{(group as { members?: unknown[] }).members?.length || 0} members</Text>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Card bg={cardBg}>
            <CardBody textAlign="center" py={12}>
              <Icon as={FiUsers} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>
                No groups yet
              </Heading>
              <Text color="gray.500" mb={4}>
                Create your first group to start splitting expenses
              </Text>
              <Button as={Link} href="/dashboard/groups/new" colorScheme="brand" leftIcon={<FiPlus />}>
                Create Group
              </Button>
            </CardBody>
          </Card>
        )}
      </Box>
    </Stack>
  );
}

