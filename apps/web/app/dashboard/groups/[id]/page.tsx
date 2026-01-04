'use client';

import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useClipboard,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FiCheck, FiCopy, FiDollarSign, FiMoreVertical, FiPlus, FiSettings, FiShare2, FiUsers } from 'react-icons/fi';

import { useBalances } from '@/lib/hooks/useBalances';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useGroup } from '@/lib/hooks/useGroups';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { group, isLoading: groupLoading } = useGroup(groupId);
  const { expenses, isLoading: expensesLoading } = useExpenses(groupId);
  const { balances, simplifiedDebts, isLoading: balancesLoading } = useBalances(groupId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const inviteUrl = group?.inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/groups/join/${(group as { inviteCode?: string }).inviteCode}`
    : '';
  const { hasCopied, onCopy } = useClipboard(inviteUrl);

  if (groupLoading) {
    return (
      <Stack spacing={6}>
        <Skeleton height="80px" borderRadius="xl" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Skeleton height="120px" borderRadius="xl" />
          <Skeleton height="120px" borderRadius="xl" />
          <Skeleton height="120px" borderRadius="xl" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (!group) {
    return (
      <Card bg={cardBg}>
        <CardBody textAlign="center" py={12}>
          <Heading size="md" mb={2}>
            Group not found
          </Heading>
          <Text color="gray.500" mb={4}>
            This group may have been deleted or you don&apos;t have access
          </Text>
          <Button as={Link} href="/dashboard/groups" colorScheme="brand">
            Back to Groups
          </Button>
        </CardBody>
      </Card>
    );
  }

  const members = (group as { members?: Array<{ user: { id: string; name: string; avatarUrl?: string } }> }).members || [];

  return (
    <Stack spacing={6}>
      {/* Header */}
      <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
        <Box>
          <HStack mb={2}>
            <Heading size="xl">{group.name}</Heading>
            <Badge colorScheme="brand">{group.currency}</Badge>
          </HStack>
          <Text color="gray.600">{group.description || 'No description'}</Text>
          <HStack mt={3}>
            <AvatarGroup size="sm" max={5}>
              {members.map((member) => (
                <Avatar key={member.user.id} name={member.user.name} src={member.user.avatarUrl} />
              ))}
            </AvatarGroup>
            <Text fontSize="sm" color="gray.500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
          </HStack>
        </Box>

        <HStack>
          <Button leftIcon={<FiShare2 />} variant="outline" onClick={onOpen}>
            Invite
          </Button>
          <Button
            as={Link}
            href={`/dashboard/groups/${groupId}/expenses/new`}
            leftIcon={<FiPlus />}
            colorScheme="brand"
          >
            Add Expense
          </Button>
          <Menu>
            <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" />
            <MenuList>
              <MenuItem as={Link} href={`/dashboard/groups/${groupId}/settings`} icon={<FiSettings />}>
                Settings
              </MenuItem>
              <MenuItem as={Link} href={`/dashboard/groups/${groupId}/members`} icon={<FiUsers />}>
                Manage Members
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs colorScheme="brand">
        <TabList>
          <Tab>Expenses</Tab>
          <Tab>Balances</Tab>
          <Tab>Settle Up</Tab>
        </TabList>

        <TabPanels>
          {/* Expenses Tab */}
          <TabPanel px={0}>
            {expensesLoading ? (
              <Stack spacing={3}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height="80px" borderRadius="xl" />
                ))}
              </Stack>
            ) : expenses.length > 0 ? (
              <Stack spacing={3}>
                {expenses.map((expense) => (
                  <Card key={expense.id} bg={cardBg}>
                    <CardBody>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                          <Box
                            w={10}
                            h={10}
                            borderRadius="lg"
                            bg={expense.category?.color || 'gray.200'}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="lg"
                          >
                            {expense.category?.icon || '💰'}
                          </Box>
                          <Box>
                            <Text fontWeight="600">{expense.description}</Text>
                            <Text fontSize="sm" color="gray.500">
                              Paid by {expense.paidBy.name} •{' '}
                              {new Date(expense.date).toLocaleDateString()}
                            </Text>
                          </Box>
                        </HStack>
                        <Box textAlign="right">
                          <Text fontWeight="700" fontSize="lg">
                            {group.currency} {expense.amount.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {expense.splits.length} people
                          </Text>
                        </Box>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card bg={cardBg}>
                <CardBody textAlign="center" py={12}>
                  <Icon as={FiDollarSign} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md" mb={2}>
                    No expenses yet
                  </Heading>
                  <Text color="gray.500" mb={4}>
                    Add your first expense to start tracking
                  </Text>
                  <Button
                    as={Link}
                    href={`/dashboard/groups/${groupId}/expenses/new`}
                    colorScheme="brand"
                    leftIcon={<FiPlus />}
                  >
                    Add Expense
                  </Button>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* Balances Tab */}
          <TabPanel px={0}>
            {balancesLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height="80px" borderRadius="xl" />
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {balances.map((balance) => (
                  <Card key={balance.userId} bg={cardBg}>
                    <CardBody>
                      <Flex justify="space-between" align="center">
                        <HStack>
                          <Avatar size="sm" name={balance.user.name} />
                          <Text fontWeight="500">{balance.user.name}</Text>
                        </HStack>
                        <Text
                          fontWeight="700"
                          color={balance.balance > 0 ? 'green.500' : balance.balance < 0 ? 'red.500' : 'gray.500'}
                        >
                          {balance.balance > 0 ? '+' : ''}
                          {group.currency} {balance.balance.toFixed(2)}
                        </Text>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>

          {/* Settle Up Tab */}
          <TabPanel px={0}>
            {balancesLoading ? (
              <Stack spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height="80px" borderRadius="xl" />
                ))}
              </Stack>
            ) : simplifiedDebts.length > 0 ? (
              <Stack spacing={3}>
                <Text color="gray.600" mb={2}>
                  Simplified payments to settle all balances:
                </Text>
                {simplifiedDebts.map((debt, index) => (
                  <Card key={index} bg={cardBg}>
                    <CardBody>
                      <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                          <Avatar size="sm" name={debt.from.name} />
                          <VStack spacing={0} align="start">
                            <Text fontWeight="500">{debt.from.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              pays {debt.to.name}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack>
                          <Text fontWeight="700" fontSize="lg" color="brand.500">
                            {group.currency} {debt.amount.toFixed(2)}
                          </Text>
                          <Button
                            as={Link}
                            href={`/dashboard/groups/${groupId}/settle?from=${debt.from.id}&to=${debt.to.id}&amount=${debt.amount}`}
                            size="sm"
                            colorScheme="brand"
                          >
                            Settle
                          </Button>
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card bg={cardBg}>
                <CardBody textAlign="center" py={12}>
                  <Icon as={FiCheck} boxSize={12} color="green.400" mb={4} />
                  <Heading size="md" mb={2}>
                    All settled up!
                  </Heading>
                  <Text color="gray.500">
                    No payments needed - everyone is even
                  </Text>
                </CardBody>
              </Card>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Invite Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invite Members</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} color="gray.600">
              Share this link with friends to invite them to the group:
            </Text>
            <Flex
              p={3}
              bg={useColorModeValue('gray.100', 'gray.700')}
              borderRadius="lg"
              align="center"
              justify="space-between"
            >
              <Text fontSize="sm" noOfLines={1} flex={1}>
                {inviteUrl}
              </Text>
              <IconButton
                aria-label="Copy invite link"
                icon={hasCopied ? <FiCheck /> : <FiCopy />}
                size="sm"
                ml={2}
                onClick={() => {
                  onCopy();
                  toast({
                    title: 'Link copied!',
                    status: 'success',
                    duration: 2000,
                  });
                }}
              />
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

