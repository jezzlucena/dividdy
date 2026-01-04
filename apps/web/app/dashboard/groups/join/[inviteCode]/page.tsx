'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGroups } from '@/lib/hooks/useGroups';

export default function JoinGroupPage() {
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { joinGroup } = useGroups();
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/dashboard/groups/join/${inviteCode}`);
      return;
    }

    setStatus('joining');

    joinGroup(inviteCode)
      .then((group) => {
        setStatus('success');
        toast({
          title: 'Joined group!',
          description: `You've been added to ${group.name}`,
          status: 'success',
          duration: 3000,
        });
        router.push(`/dashboard/groups/${group.id}`);
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Invalid or expired invite link');
      });
  }, [authLoading, isAuthenticated, inviteCode, joinGroup, router, toast]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={20}>
      <Container maxW="md">
        <Stack spacing={8} align="center">
          <Heading
            as={Link}
            href="/"
            size="lg"
            color="brand.500"
            fontWeight="800"
            _hover={{ textDecoration: 'none' }}
          >
            Dividdy
          </Heading>

          <Card bg={cardBg} w="full">
            <CardBody py={12} textAlign="center">
              {(status === 'loading' || status === 'joining') && (
                <Stack spacing={4} align="center">
                  <Spinner size="xl" color="brand.500" />
                  <Heading size="md">Joining group...</Heading>
                  <Text color="gray.600">Please wait while we add you to the group</Text>
                </Stack>
              )}

              {status === 'success' && (
                <Stack spacing={4} align="center">
                  <Heading size="md" color="green.500">
                    ✓ Joined!
                  </Heading>
                  <Text color="gray.600">Redirecting to your group...</Text>
                </Stack>
              )}

              {status === 'error' && (
                <Stack spacing={4} align="center">
                  <Heading size="md" color="red.500">
                    Unable to join
                  </Heading>
                  <Text color="gray.600">{errorMessage}</Text>
                  <Button as={Link} href="/dashboard/groups" colorScheme="brand">
                    Go to Groups
                  </Button>
                </Stack>
              )}
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

