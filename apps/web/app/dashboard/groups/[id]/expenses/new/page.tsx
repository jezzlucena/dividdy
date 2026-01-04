'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { SplitType } from '@dividdy/shared-types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import { api } from '@/lib/api';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useGroup } from '@/lib/hooks/useGroups';

interface ExpenseForm {
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  splitType: SplitType;
}

export default function NewExpensePage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { group, isLoading: groupLoading } = useGroup(groupId);
  const { createExpense } = useExpenses(groupId);
  const { data: categories } = useSWR(
    groupId ? `categories-${groupId}` : null,
    () => api.getCategories(groupId)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [memberShares, setMemberShares] = useState<Record<string, number>>({});
  const [memberPercentages, setMemberPercentages] = useState<Record<string, number>>({});
  const [memberAmounts, setMemberAmounts] = useState<Record<string, number>>({});

  const members = (group as { members?: Array<{ user: { id: string; name: string; avatarUrl?: string } }> })?.members || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      splitType: 'equal',
    },
  });

  const splitType = watch('splitType');
  const amount = watch('amount');

  // Initialize all members as selected
  useEffect(() => {
    if (members.length > 0 && selectedMembers.size === 0) {
      const allMemberIds = new Set(members.map((m) => m.user.id));
      setSelectedMembers(allMemberIds);
      
      // Initialize shares to 1 for all members
      const initialShares: Record<string, number> = {};
      const initialPercentages: Record<string, number> = {};
      members.forEach((m) => {
        initialShares[m.user.id] = 1;
        initialPercentages[m.user.id] = Math.round(100 / members.length);
      });
      setMemberShares(initialShares);
      setMemberPercentages(initialPercentages);
    }
  }, [members, selectedMembers.size]);

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const onSubmit = async (data: ExpenseForm) => {
    if (selectedMembers.size === 0) {
      toast({
        title: 'Select at least one person',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const splits = Array.from(selectedMembers).map((userId) => {
        const split: { userId: string; amount?: number; percentage?: number; shares?: number } = {
          userId,
        };
        
        switch (data.splitType) {
          case 'shares':
            split.shares = memberShares[userId] || 1;
            break;
          case 'percentage':
            split.percentage = memberPercentages[userId] || 0;
            break;
          case 'exact':
            split.amount = memberAmounts[userId] || 0;
            break;
        }
        
        return split;
      });

      await createExpense({
        amount: data.amount,
        description: data.description,
        date: new Date(data.date).toISOString(),
        categoryId: data.categoryId || undefined,
        splitType: data.splitType,
        splits,
      });

      toast({
        title: 'Expense added!',
        status: 'success',
        duration: 3000,
      });
      router.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      toast({
        title: 'Failed to add expense',
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

  const calculateSplitPreview = () => {
    if (!amount || selectedMembers.size === 0) return [];

    return Array.from(selectedMembers).map((userId) => {
      const member = members.find((m) => m.user.id === userId);
      let splitAmount = 0;

      switch (splitType) {
        case 'equal':
          splitAmount = amount / selectedMembers.size;
          break;
        case 'shares': {
          const totalShares = Array.from(selectedMembers).reduce(
            (sum, id) => sum + (memberShares[id] || 1),
            0
          );
          splitAmount = (amount * (memberShares[userId] || 1)) / totalShares;
          break;
        }
        case 'percentage':
          splitAmount = (amount * (memberPercentages[userId] || 0)) / 100;
          break;
        case 'exact':
          splitAmount = memberAmounts[userId] || 0;
          break;
      }

      return {
        userId,
        name: member?.user.name || 'Unknown',
        amount: splitAmount,
      };
    });
  };

  return (
    <Stack spacing={6} maxW="800px">
      <Box>
        <Heading size="xl">Add Expense</Heading>
        <Text color="gray.600" mt={1}>
          {group?.name}
        </Text>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stack spacing={5}>
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

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    placeholder="What was this expense for?"
                    {...register('description', {
                      required: 'Description is required',
                      maxLength: { value: 500, message: 'Description is too long' },
                    })}
                  />
                  <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
                </FormControl>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input type="date" {...register('date')} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <Select placeholder="Select category" {...register('categoryId')}>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stack spacing={5}>
                <Heading size="md">Split Between</Heading>

                <FormControl>
                  <FormLabel>Split Type</FormLabel>
                  <Controller
                    name="splitType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field}>
                        <Stack direction="row" spacing={4}>
                          <Radio value="equal">Equal</Radio>
                          <Radio value="shares">By Shares</Radio>
                          <Radio value="percentage">By Percentage</Radio>
                          <Radio value="exact">Exact Amounts</Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {members.map((member) => (
                    <HStack
                      key={member.user.id}
                      p={3}
                      borderRadius="lg"
                      bg={selectedMembers.has(member.user.id) ? 'brand.50' : 'transparent'}
                      _dark={{
                        bg: selectedMembers.has(member.user.id) ? 'brand.900' : 'transparent',
                      }}
                      border="1px solid"
                      borderColor={selectedMembers.has(member.user.id) ? 'brand.200' : 'gray.200'}
                      _dark={{
                        borderColor: selectedMembers.has(member.user.id) ? 'brand.600' : 'gray.600',
                      }}
                    >
                      <Checkbox
                        isChecked={selectedMembers.has(member.user.id)}
                        onChange={() => toggleMember(member.user.id)}
                      />
                      <Avatar size="sm" name={member.user.name} />
                      <Text flex={1} fontWeight="500">
                        {member.user.name}
                      </Text>

                      {splitType === 'shares' && selectedMembers.has(member.user.id) && (
                        <NumberInput
                          size="sm"
                          w="80px"
                          min={1}
                          value={memberShares[member.user.id] || 1}
                          onChange={(_, val) =>
                            setMemberShares({ ...memberShares, [member.user.id]: val || 1 })
                          }
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      )}

                      {splitType === 'percentage' && selectedMembers.has(member.user.id) && (
                        <InputGroup size="sm" w="100px">
                          <Input
                            type="number"
                            value={memberPercentages[member.user.id] || 0}
                            onChange={(e) =>
                              setMemberPercentages({
                                ...memberPercentages,
                                [member.user.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                          <InputLeftAddon>%</InputLeftAddon>
                        </InputGroup>
                      )}

                      {splitType === 'exact' && selectedMembers.has(member.user.id) && (
                        <InputGroup size="sm" w="120px">
                          <InputLeftAddon>{group?.currency}</InputLeftAddon>
                          <Input
                            type="number"
                            step="0.01"
                            value={memberAmounts[member.user.id] || ''}
                            onChange={(e) =>
                              setMemberAmounts({
                                ...memberAmounts,
                                [member.user.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </InputGroup>
                      )}
                    </HStack>
                  ))}
                </SimpleGrid>

                {/* Split Preview */}
                {amount > 0 && selectedMembers.size > 0 && (
                  <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
                    <Text fontWeight="600" mb={2}>
                      Split Preview
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      {calculateSplitPreview().map((split) => (
                        <HStack key={split.userId} justify="space-between">
                          <Text>{split.name}</Text>
                          <Text fontWeight="600">
                            {group?.currency} {split.amount.toFixed(2)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Stack>
            </CardBody>
          </Card>

          <HStack spacing={4}>
            <Button variant="outline" onClick={() => router.back()} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="brand" isLoading={isLoading} flex={1}>
              Add Expense
            </Button>
          </HStack>
        </Stack>
      </form>
    </Stack>
  );
}

