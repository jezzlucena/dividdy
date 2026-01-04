import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000),
});

// GET /api/expenses/:expenseId/comments
router.get('/:expenseId/comments', authenticate, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
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

    const comments = await prisma.comment.findMany({
      where: { expenseId: req.params.expenseId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses/:expenseId/comments
router.post('/:expenseId/comments', authenticate, async (req, res, next) => {
  try {
    const data = createCommentSchema.parse(req.body);

    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
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

    const comment = await prisma.comment.create({
      data: {
        expenseId: req.params.expenseId,
        userId: req.user!.id,
        content: data.content,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:expenseId/comments/:commentId
router.delete('/:expenseId/comments/:commentId', authenticate, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      include: {
        expense: true,
      },
    });

    if (!comment || comment.expenseId !== req.params.expenseId) {
      throw new NotFoundError('Comment not found');
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: comment.expense.groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Only comment author or admin can delete
    if (comment.userId !== req.user!.id && membership.role !== 'admin') {
      throw new ForbiddenError('Only the author or an admin can delete this comment');
    }

    await prisma.comment.delete({
      where: { id: req.params.commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

