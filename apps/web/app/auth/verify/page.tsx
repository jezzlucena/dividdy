'use client';

import {
  Box,
  Container,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { useAuth } from '@/lib/hooks/useAuth';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        setStatus('success');
        toast({
          title: 'Signed in successfully!',
          status: 'success',
          duration: 3000,
        });
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
      });
  }, [token, verifyMagicLink, toast]);

  return (
    <Stack spacing={4} textAlign="center">
      {status === 'loading' && (
        <>
          <Spinner size="xl" color="brand.500" />
          <Heading size="lg">Verifying your magic link...</Heading>
          <Text color="gray.600">Please wait while we sign you in</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <Heading size="lg" color="green.500">
            ✓ Verified!
          </Heading>
          <Text color="gray.600">Redirecting you to your dashboard...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Heading size="lg" color="red.500">
            Verification failed
          </Heading>
          <Text color="gray.600">{errorMessage}</Text>
          <Text fontSize="sm">
            <Link href="/auth/login">
              <Text as="span" color="brand.500" fontWeight="600">
                Try signing in again
              </Text>
            </Link>
          </Text>
        </>
      )}
    </Stack>
  );
}

export default function VerifyPage() {
  const cardBg = useColorModeValue('white', 'gray.800');

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

          <Box bg={cardBg} p={12} borderRadius="xl" boxShadow="lg" w="full">
            <Suspense
              fallback={
                <Stack spacing={4} textAlign="center">
                  <Spinner size="xl" color="brand.500" />
                  <Heading size="lg">Loading...</Heading>
                </Stack>
              }
            >
              <VerifyContent />
            </Suspense>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

