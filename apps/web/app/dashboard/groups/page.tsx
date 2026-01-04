'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
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
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { FiPlus, FiSearch, FiUserPlus, FiUsers } from 'react-icons/fi';

import { useGroups } from '@/lib/hooks/useGroups';

export default function GroupsPage() {
  const { groups, isLoading, joinGroup } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      await joinGroup(inviteCode.trim());
      toast({
        title: 'Joined group successfully!',
        status: 'success',
        duration: 3000,
      });
      setInviteCode('');
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to join group',
        description: error instanceof Error ? error.message : 'Invalid invite code',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Stack spacing={6}>
      <HStack justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl">Groups</Heading>
          <Text color="gray.600" mt={1}>
            Manage your expense groups
          </Text>
        </Box>
        <HStack>
          <Button leftIcon={<FiUserPlus />} variant="outline" onClick={onOpen}>
            Join Group
          </Button>
          <Button as={Link} href="/dashboard/groups/new" leftIcon={<FiPlus />} colorScheme="brand">
            Create Group
          </Button>
        </HStack>
      </HStack>

      {/* Search */}
      <InputGroup maxW="400px">
        <InputLeftElement>
          <Icon as={FiSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      {/* Groups Grid */}
      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height="140px" borderRadius="xl" />
          ))}
        </SimpleGrid>
      ) : filteredGroups.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredGroups.map((group) => (
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
                <Text fontSize="sm" color="gray.500" noOfLines={2} mb={3}>
                  {group.description || 'No description'}
                </Text>
                <HStack justify="space-between" color="gray.500" fontSize="sm">
                  <HStack>
                    <Icon as={FiUsers} />
                    <Text>{(group as { members?: unknown[] }).members?.length || 0} members</Text>
                  </HStack>
                  <Text fontWeight="600">{group.currency}</Text>
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
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Heading>
            <Text color="gray.500" mb={4}>
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first group to start splitting expenses'}
            </Text>
            {!searchQuery && (
              <Button as={Link} href="/dashboard/groups/new" colorScheme="brand" leftIcon={<FiPlus />}>
                Create Group
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Join Group Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Join a Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} color="gray.600">
              Enter the invite code shared by the group admin
            </Text>
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleJoinGroup}
              isLoading={isJoining}
              isDisabled={!inviteCode.trim()}
            >
              Join Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

