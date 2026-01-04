'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProfileForm {
  name: string;
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await api.updateMe({ name: data.name });
      await refreshUser();
      toast({
        title: 'Profile updated!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={6} maxW="600px">
      <Box>
        <Heading size="xl">Settings</Heading>
        <Text color="gray.600" mt={1}>
          Manage your account settings
        </Text>
      </Box>

      <Card bg={cardBg}>
        <CardBody>
          <Stack spacing={6}>
            <HStack spacing={4}>
              <Avatar size="xl" name={user?.name} />
              <Box>
                <Heading size="md">{user?.name}</Heading>
                <Text color="gray.500">{user?.email}</Text>
              </Box>
            </HStack>

            <Divider />

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={5}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 1, message: 'Name is required' },
                      maxLength: { value: 100, message: 'Name is too long' },
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input value={user?.email || ''} isDisabled />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Email cannot be changed
                  </Text>
                </FormControl>

                <Button type="submit" colorScheme="brand" isLoading={isLoading}>
                  Save Changes
                </Button>
              </Stack>
            </form>
          </Stack>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          <Stack spacing={4}>
            <Heading size="md">Danger Zone</Heading>
            <Text color="gray.600">
              Sign out from your account or delete your data.
            </Text>
            <HStack>
              <Button variant="outline" colorScheme="red" onClick={logout}>
                Sign Out
              </Button>
            </HStack>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

