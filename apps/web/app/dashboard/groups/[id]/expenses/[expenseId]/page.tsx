'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  FormControl,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { FiArrowLeft, FiMessageCircle, FiPaperclip, FiSend, FiTrash2, FiUpload } from 'react-icons/fi';
import useSWR from 'swr';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { useExpense } from '@/lib/hooks/useExpenses';
import { useGroup } from '@/lib/hooks/useGroups';

export default function ExpenseDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const expenseId = params.expenseId as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { user } = useAuth();
  const { group } = useGroup(groupId);
  const { expense, refresh: refreshExpense } = useExpense(groupId, expenseId);
  const { data: comments, mutate: mutateComments } = useSWR(
    expenseId ? `comments-${expenseId}` : null,
    () => api.getComments(expenseId)
  );

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createComment(expenseId, { content: newComment.trim() });
      mutateComments();
      setNewComment('');
    } catch (error) {
      toast({
        title: 'Failed to add comment',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await api.uploadReceipt(expenseId, file);
      refreshExpense();
      toast({
        title: 'Receipt uploaded!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to upload receipt',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.deleteExpense(expenseId);
      toast({
        title: 'Expense deleted',
        status: 'success',
        duration: 3000,
      });
      router.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      toast({
        title: 'Failed to delete expense',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (!expense) {
    return <Text>Loading...</Text>;
  }

  const canEdit = expense.paidBy.id === user?.id;
  const receiptUrl = (expense as { receipt?: { filePath: string } }).receipt?.filePath
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/${(expense as { receipt?: { filePath: string } }).receipt?.filePath}`
    : null;

  return (
    <Stack spacing={6} maxW="800px">
      <HStack>
        <IconButton
          aria-label="Back"
          icon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => router.back()}
        />
        <Box flex={1}>
          <Heading size="xl">{expense.description}</Heading>
          <Text color="gray.600" mt={1}>
            {group?.name}
          </Text>
        </Box>
        {canEdit && (
          <IconButton
            aria-label="Delete expense"
            icon={<FiTrash2 />}
            colorScheme="red"
            variant="ghost"
            onClick={handleDeleteExpense}
          />
        )}
      </HStack>

      {/* Expense Details */}
      <Card bg={cardBg}>
        <CardBody>
          <Stack spacing={4}>
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Amount
                </Text>
                <Text fontSize="3xl" fontWeight="700">
                  {group?.currency} {expense.amount.toFixed(2)}
                </Text>
              </Box>
              {expense.category && (
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={expense.category.color || 'gray.200'}
                  fontSize="2xl"
                >
                  {expense.category.icon || '💰'}
                </Box>
              )}
            </HStack>

            <Divider />

            <HStack>
              <Avatar size="sm" name={expense.paidBy.name} />
              <Box>
                <Text fontWeight="500">Paid by {expense.paidBy.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(expense.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Box>
            </HStack>

            <Divider />

            <Box>
              <Text fontWeight="600" mb={2}>
                Split ({expense.splitType})
              </Text>
              <VStack align="stretch" spacing={2}>
                {expense.splits.map((split) => (
                  <HStack key={split.id} justify="space-between">
                    <HStack>
                      <Avatar size="xs" name={split.user.name} />
                      <Text>{split.user.name}</Text>
                    </HStack>
                    <Text fontWeight="500">
                      {group?.currency} {split.amount.toFixed(2)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </Stack>
        </CardBody>
      </Card>

      {/* Receipt */}
      <Card bg={cardBg}>
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Heading size="sm">Receipt</Heading>
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleUploadReceipt}
            />
            <Button
              size="sm"
              leftIcon={<FiUpload />}
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              Upload
            </Button>
          </HStack>

          {receiptUrl ? (
            <Box borderRadius="lg" overflow="hidden">
              <Image src={receiptUrl} alt="Receipt" maxH="400px" objectFit="contain" />
            </Box>
          ) : (
            <Box
              p={8}
              borderRadius="lg"
              border="2px dashed"
              borderColor="gray.300"
              textAlign="center"
              color="gray.500"
            >
              <Icon as={FiPaperclip} boxSize={8} mb={2} />
              <Text>No receipt attached</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Comments */}
      <Card bg={cardBg}>
        <CardBody>
          <Heading size="sm" mb={4}>
            <HStack>
              <Icon as={FiMessageCircle} />
              <Text>Comments ({comments?.length || 0})</Text>
            </HStack>
          </Heading>

          <VStack align="stretch" spacing={4}>
            {comments?.map((comment) => (
              <HStack key={comment.id} align="start" spacing={3}>
                <Avatar size="sm" name={comment.user.name} />
                <Box flex={1}>
                  <HStack>
                    <Text fontWeight="500">{comment.user.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Text>
                  </HStack>
                  <Text>{comment.content}</Text>
                </Box>
              </HStack>
            ))}

            {(!comments || comments.length === 0) && (
              <Text color="gray.500" textAlign="center" py={4}>
                No comments yet
              </Text>
            )}

            <Divider />

            <FormControl>
              <HStack>
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <IconButton
                  aria-label="Send comment"
                  icon={<FiSend />}
                  colorScheme="brand"
                  onClick={handleAddComment}
                  isLoading={isSubmitting}
                  isDisabled={!newComment.trim()}
                />
              </HStack>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </Stack>
  );
}

