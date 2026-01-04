import { Decimal } from '@prisma/client/runtime/library';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';
import { deleteFile, upload } from '../utils/upload.js';

const router = Router();

const expenseSplitSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().positive().optional(),
});

const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  date: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
  splitType: z.enum(['equal', 'percentage', 'shares', 'exact']),
  splits: z.array(expenseSplitSchema).min(1, 'At least one split is required'),
});

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().datetime().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  splitType: z.enum(['equal', 'percentage', 'shares', 'exact']).optional(),
  splits: z.array(expenseSplitSchema).optional(),
});

// Helper to validate and calculate splits
function calculateSplits(
  amount: number,
  splitType: string,
  splits: Array<{ userId: string; amount?: number; percentage?: number; shares?: number }>
): Array<{ userId: string; amount: number; percentage: number | null; shares: number | null }> {
  const result: Array<{ userId: string; amount: number; percentage: number | null; shares: number | null }> = [];

  switch (splitType) {
    case 'equal': {
      const splitAmount = amount / splits.length;
      for (const split of splits) {
        result.push({
          userId: split.userId,
          amount: Math.round(splitAmount * 100) / 100,
          percentage: null,
          shares: null,
        });
      }
      break;
    }
    case 'percentage': {
      let totalPercentage = 0;
      for (const split of splits) {
        if (split.percentage === undefined) {
          throw new BadRequestError('Percentage required for percentage split');
        }
        totalPercentage += split.percentage;
      }
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestError('Percentages must add up to 100');
      }
      for (const split of splits) {
        result.push({
          userId: split.userId,
          amount: Math.round((amount * split.percentage!) / 100 * 100) / 100,
          percentage: split.percentage!,
          shares: null,
        });
      }
      break;
    }
    case 'shares': {
      let totalShares = 0;
      for (const split of splits) {
        if (split.shares === undefined) {
          throw new BadRequestError('Shares required for shares split');
        }
        totalShares += split.shares;
      }
      if (totalShares === 0) {
        throw new BadRequestError('Total shares must be greater than 0');
      }
      for (const split of splits) {
        result.push({
          userId: split.userId,
          amount: Math.round((amount * split.shares!) / totalShares * 100) / 100,
          percentage: null,
          shares: split.shares!,
        });
      }
      break;
    }
    case 'exact': {
      let totalAmount = 0;
      for (const split of splits) {
        if (split.amount === undefined) {
          throw new BadRequestError('Amount required for exact split');
        }
        totalAmount += split.amount;
      }
      if (Math.abs(totalAmount - amount) > 0.01) {
        throw new BadRequestError('Split amounts must equal total amount');
      }
      for (const split of splits) {
        result.push({
          userId: split.userId,
          amount: split.amount!,
          percentage: null,
          shares: null,
        });
      }
      break;
    }
  }

  return result;
}

// GET /api/groups/:id/expenses
router.get('/:id/expenses', authenticate, async (req, res, next) => {
  try {
    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: req.params.id,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Group not found');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: req.params.id },
        include: {
          paidBy: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
          category: true,
          splits: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true },
              },
            },
          },
          receipt: true,
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: { groupId: req.params.id } }),
    ]);

    // Convert Decimal to number for JSON serialization
    const serializedExpenses = expenses.map((expense) => ({
      ...expense,
      amount: new Decimal(expense.amount).toNumber(),
      splits: expense.splits.map((split) => ({
        ...split,
        amount: new Decimal(split.amount).toNumber(),
        percentage: split.percentage ? new Decimal(split.percentage).toNumber() : null,
      })),
    }));

    res.json({
      data: serializedExpenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/expenses
router.post('/:id/expenses', authenticate, async (req, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: req.params.id,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Group not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || category.groupId !== req.params.id) {
        throw new BadRequestError('Invalid category');
      }
    }

    // Validate all split users are members
    const memberIds = await prisma.groupMember.findMany({
      where: { groupId: req.params.id },
      select: { userId: true },
    });
    const memberIdSet = new Set(memberIds.map((m) => m.userId));

    for (const split of data.splits) {
      if (!memberIdSet.has(split.userId)) {
        throw new BadRequestError(`User ${split.userId} is not a member of this group`);
      }
    }

    // Calculate splits
    const calculatedSplits = calculateSplits(data.amount, data.splitType, data.splits);

    // Create expense with splits
    const expense = await prisma.expense.create({
      data: {
        groupId: req.params.id,
        paidById: req.user!.id,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        splitType: data.splitType,
        splits: {
          create: calculatedSplits,
        },
      },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
        category: true,
        splits: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Convert Decimal to number
    const serializedExpense = {
      ...expense,
      amount: new Decimal(expense.amount).toNumber(),
      splits: expense.splits.map((split) => ({
        ...split,
        amount: new Decimal(split.amount).toNumber(),
        percentage: split.percentage ? new Decimal(split.percentage).toNumber() : null,
      })),
    };

    res.status(201).json(serializedExpense);
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/:id (moved to /api/groups/:groupId/expenses/:id for consistency)
router.get('/:groupId/expenses/:expenseId', authenticate, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
        category: true,
        splits: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        receipt: true,
        comments: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Convert Decimal to number
    const serializedExpense = {
      ...expense,
      amount: new Decimal(expense.amount).toNumber(),
      splits: expense.splits.map((split) => ({
        ...split,
        amount: new Decimal(split.amount).toNumber(),
        percentage: split.percentage ? new Decimal(split.percentage).toNumber() : null,
      })),
    };

    res.json(serializedExpense);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/expenses/:id
router.patch('/:expenseId', authenticate, async (req, res, next) => {
  try {
    const data = updateExpenseSchema.parse(req.body);

    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: { splits: true },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Only payer or admin can edit
    if (expense.paidById !== req.user!.id && membership.role !== 'admin') {
      throw new ForbiddenError('Only the payer or an admin can edit this expense');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.splitType !== undefined) updateData.splitType = data.splitType;

    // If splits are being updated, recalculate them
    if (data.splits) {
      const amount = data.amount ?? new Decimal(expense.amount).toNumber();
      const splitType = data.splitType ?? expense.splitType;
      const calculatedSplits = calculateSplits(amount, splitType, data.splits);

      // Delete old splits and create new ones
      await prisma.expenseSplit.deleteMany({
        where: { expenseId: expense.id },
      });

      await prisma.expenseSplit.createMany({
        data: calculatedSplits.map((split) => ({
          expenseId: expense.id,
          ...split,
        })),
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: req.params.expenseId },
      data: updateData,
      include: {
        paidBy: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
        category: true,
        splits: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Convert Decimal to number
    const serializedExpense = {
      ...updatedExpense,
      amount: new Decimal(updatedExpense.amount).toNumber(),
      splits: updatedExpense.splits.map((split) => ({
        ...split,
        amount: new Decimal(split.amount).toNumber(),
        percentage: split.percentage ? new Decimal(split.percentage).toNumber() : null,
      })),
    };

    res.json(serializedExpense);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id
router.delete('/:expenseId', authenticate, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: { receipt: true },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Only payer or admin can delete
    if (expense.paidById !== req.user!.id && membership.role !== 'admin') {
      throw new ForbiddenError('Only the payer or an admin can delete this expense');
    }

    // Delete receipt file if exists
    if (expense.receipt) {
      deleteFile(expense.receipt.filePath);
    }

    await prisma.expense.delete({
      where: { id: req.params.expenseId },
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses/:id/receipt
router.post('/:expenseId/receipt', authenticate, upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: { receipt: true },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Delete old receipt if exists
    if (expense.receipt) {
      deleteFile(expense.receipt.filePath);
      await prisma.receipt.delete({ where: { id: expense.receipt.id } });
    }

    // Create new receipt
    const receipt = await prisma.receipt.create({
      data: {
        expenseId: expense.id,
        filePath: req.file.filename,
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id/receipt
router.delete('/:expenseId/receipt', authenticate, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: { receipt: true },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    if (!expense.receipt) {
      throw new NotFoundError('No receipt found');
    }

    deleteFile(expense.receipt.filePath);
    await prisma.receipt.delete({ where: { id: expense.receipt.id } });

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

