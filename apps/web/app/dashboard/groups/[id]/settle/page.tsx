'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBalances, useSettlements } from '@/lib/hooks/useBalances';
import { useGroup } from '@/lib/hooks/useGroups';

interface SettleForm {
  receiverId: string;
  amount: number;
}

function SettleContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.id as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { group, isLoading: groupLoading } = useGroup(groupId);
  const { refresh: refreshBalances } = useBalances(groupId);
  const { createSettlement } = useSettlements(groupId);
  const [isLoading, setIsLoading] = useState(false);

  const members = (group as { members?: Array<{ user: { id: string; name: string; avatarUrl?: string } }> })?.members || [];

  // Pre-fill from URL params
  const prefilledTo = searchParams.get('to');
  const prefilledAmount = searchParams.get('amount');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettleForm>();

  useEffect(() => {
    if (prefilledTo) setValue('receiverId', prefilledTo);
    if (prefilledAmount) setValue('amount', parseFloat(prefilledAmount));
  }, [prefilledTo, prefilledAmount, setValue]);

  const selectedReceiver = members.find((m) => m.user.id === watch('receiverId'));

  const onSubmit = async (data: SettleForm) => {
    setIsLoading(true);
    try {
      await createSettlement({
        receiverId: data.receiverId,
        amount: data.amount,
      });
      refreshBalances();
      toast({
        title: 'Settlement recorded!',
        status: 'success',
        duration: 3000,
      });
      router.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      toast({
        title: 'Failed to record settlement',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (groupLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Stack spacing={6} maxW="500px">
      <Box>
        <Heading size="xl">Record Payment</Heading>
        <Text color="gray.600" mt={1}>
          Record a payment you made to someone in {group?.name}
        </Text>
      </Box>

      <Card bg={cardBg}>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={5}>
              <FormControl isInvalid={!!errors.receiverId}>
                <FormLabel>You paid</FormLabel>
                <Select
                  placeholder="Select person"
                  {...register('receiverId', { required: 'Please select who you paid' })}
                >
                  {members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.receiverId?.message}</FormErrorMessage>
              </FormControl>

              {selectedReceiver && (
                <HStack p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                  <Avatar size="md" name={selectedReceiver.user.name} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="600">{selectedReceiver.user.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      You are recording a payment to this person
                    </Text>
                  </VStack>
                </HStack>
              )}

              <FormControl isInvalid={!!errors.amount}>
                <FormLabel>Amount</FormLabel>
                <InputGroup size="lg">
                  <InputLeftAddon>{group?.currency}</InputLeftAddon>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                  />
                </InputGroup>
                <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
              </FormControl>

              <HStack spacing={4} pt={4}>
                <Button variant="outline" onClick={() => router.back()} isDisabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" colorScheme="brand" isLoading={isLoading} flex={1}>
                  Record Payment
                </Button>
              </HStack>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Stack>
  );
}

export default function SettlePage() {
  return (
    <Suspense fallback={<Text>Loading...</Text>}>
      <SettleContent />
    </Suspense>
  );
}

