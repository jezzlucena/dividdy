'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useGroups } from '@/lib/hooks/useGroups';

interface CreateGroupForm {
  name: string;
  description: string;
  currency: string;
}

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
];

export default function NewGroupPage() {
  const { createGroup } = useGroups();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupForm>({
    defaultValues: {
      currency: 'USD',
    },
  });

  const onSubmit = async (data: CreateGroupForm) => {
    setIsLoading(true);
    try {
      const group = await createGroup({
        name: data.name,
        description: data.description || undefined,
        currency: data.currency,
      });
      toast({
        title: 'Group created!',
        description: `${data.name} is ready for expense splitting`,
        status: 'success',
        duration: 3000,
      });
      router.push(`/dashboard/groups/${group.id}`);
    } catch (error) {
      toast({
        title: 'Failed to create group',
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
        <Heading size="xl">Create Group</Heading>
        <Text color="gray.600" mt={1}>
          Set up a new expense group
        </Text>
      </Box>

      <Card bg={cardBg}>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={5}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Group Name</FormLabel>
                <Input
                  placeholder="e.g., Summer Trip 2024, Apartment Expenses"
                  {...register('name', {
                    required: 'Group name is required',
                    maxLength: { value: 100, message: 'Name is too long' },
                  })}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Description (optional)</FormLabel>
                <Textarea
                  placeholder="What is this group for?"
                  rows={3}
                  {...register('description', {
                    maxLength: { value: 500, message: 'Description is too long' },
                  })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Currency</FormLabel>
                <Select {...register('currency')}>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={4} pt={4}>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={isLoading}
                  flex={1}
                >
                  Create Group
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Stack>
  );
}

