'use client';

import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Link as ChakraLink,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/lib/hooks/useAuth';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, sendMagicLink } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>();

  const email = watch('email');

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: 'Welcome back!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: 'Enter your email first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for a sign-in link',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Failed to send magic link',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="md">
        <Stack spacing={8}>
          <Stack align="center">
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
            <Heading size="xl">Welcome back</Heading>
            <Text color="gray.600">Sign in to continue splitting expenses</Text>
          </Stack>

          <Box bg={cardBg} p={8} borderRadius="xl" boxShadow="lg">
            {magicLinkSent ? (
              <Stack spacing={4} textAlign="center">
                <Heading size="md">Check your email</Heading>
                <Text color="gray.600">
                  We sent a magic link to <strong>{email}</strong>
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Click the link in the email to sign in. It expires in 15 minutes.
                </Text>
                <Button variant="link" onClick={() => setMagicLinkSent(false)}>
                  Use a different method
                </Button>
              </Stack>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={4}>
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'Password is required',
                      })}
                    />
                    <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                  </FormControl>

                  <Button type="submit" colorScheme="brand" size="lg" isLoading={isLoading}>
                    Sign In
                  </Button>

                  <Divider />

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleMagicLink}
                    isLoading={isLoading}
                  >
                    Sign in with Magic Link
                  </Button>
                </Stack>
              </form>
            )}
          </Box>

          <Text textAlign="center" color="gray.600">
            Don&apos;t have an account?{' '}
            <ChakraLink as={Link} href="/auth/register" color="brand.500" fontWeight="600">
              Sign up
            </ChakraLink>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

