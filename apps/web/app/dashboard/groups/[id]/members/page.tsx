'use client';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft, FiShield, FiTrash2, FiUserPlus } from 'react-icons/fi';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGroup } from '@/lib/hooks/useGroups';

export default function MembersPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { user } = useAuth();
  const { group, refresh } = useGroup(groupId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const members = (group as { members?: Array<{ user: { id: string; name: string; email: string; avatarUrl?: string }; role: string }> })?.members || [];
  const currentMember = members.find((m) => m.user.id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const handleAddMember = async () => {
    if (!email.trim()) return;

    setIsAdding(true);
    try {
      await api.addMember(groupId, { email: email.trim() });
      refresh();
      toast({
        title: 'Member added!',
        status: 'success',
        duration: 3000,
      });
      setEmail('');
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: error instanceof Error ? error.message : 'User not found',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the group?`)) return;

    try {
      await api.removeMember(groupId, userId);
      refresh();
      toast({
        title: 'Member removed',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Stack spacing={6} maxW="600px">
      <HStack>
        <IconButton
          aria-label="Back"
          icon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => router.back()}
        />
        <Box>
          <Heading size="xl">Members</Heading>
          <Text color="gray.600" mt={1}>
            {group?.name}
          </Text>
        </Box>
      </HStack>

      {isAdmin && (
        <Button leftIcon={<FiUserPlus />} colorScheme="brand" onClick={onOpen}>
          Add Member
        </Button>
      )}

      <VStack spacing={3} align="stretch">
        {members.map((member) => (
          <Card key={member.user.id} bg={cardBg}>
            <CardBody>
              <HStack justify="space-between">
                <HStack spacing={4}>
                  <Avatar name={member.user.name} />
                  <Box>
                    <HStack>
                      <Text fontWeight="600">{member.user.name}</Text>
                      {member.role === 'admin' && (
                        <Badge colorScheme="purple" fontSize="xs">
                          <HStack spacing={1}>
                            <Icon as={FiShield} boxSize={3} />
                            <Text>Admin</Text>
                          </HStack>
                        </Badge>
                      )}
                      {member.user.id === user?.id && (
                        <Badge colorScheme="blue" fontSize="xs">
                          You
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {member.user.email}
                    </Text>
                  </Box>
                </HStack>

                {isAdmin && member.user.id !== user?.id && (
                  <IconButton
                    aria-label="Remove member"
                    icon={<FiTrash2 />}
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                  />
                )}
              </HStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Add Member Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Text fontSize="sm" color="gray.500" mt={2}>
                The user must already have a Dividdy account
              </Text>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleAddMember}
              isLoading={isAdding}
              isDisabled={!email.trim()}
            >
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

