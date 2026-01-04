'use client';

import {
  Box,
  Button,
  Container,
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

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.name);
      toast({
        title: 'Account created!',
        description: 'Welcome to Dividdy',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
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
            <Heading size="xl">Create your account</Heading>
            <Text color="gray.600">Start splitting expenses in minutes</Text>
          </Stack>

          <Box bg={cardBg} p={8} borderRadius="xl" boxShadow="lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Name</FormLabel>
                  <Input
                    placeholder="Your name"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 1, message: 'Name is required' },
                      maxLength: { value: 100, message: 'Name is too long' },
                    })}
                  />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>

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
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                  />
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>

                <Button type="submit" colorScheme="brand" size="lg" isLoading={isLoading}>
                  Create Account
                </Button>
              </Stack>
            </form>
          </Box>

          <Text textAlign="center" color="gray.600">
            Already have an account?{' '}
            <ChakraLink as={Link} href="/auth/login" color="brand.500" fontWeight="600">
              Sign in
            </ChakraLink>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

