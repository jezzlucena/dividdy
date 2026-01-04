import { Decimal } from '@prisma/client/runtime/library';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

const createSettlementSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  amount: z.number().positive('Amount must be positive'),
});

// GET /api/groups/:id/settlements
router.get('/:id/settlements', authenticate, async (req, res, next) => {
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

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { groupId: req.params.id },
        include: {
          payer: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
          receiver: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { settledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where: { groupId: req.params.id } }),
    ]);

    // Convert Decimal to number
    const serializedSettlements = settlements.map((settlement) => ({
      ...settlement,
      amount: new Decimal(settlement.amount).toNumber(),
    }));

    res.json({
      data: serializedSettlements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/settlements
router.post('/:id/settlements', authenticate, async (req, res, next) => {
  try {
    const data = createSettlementSchema.parse(req.body);

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

    // Check if receiver is a member
    const receiverMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: data.receiverId,
          groupId: req.params.id,
        },
      },
    });

    if (!receiverMembership) {
      throw new BadRequestError('Receiver is not a member of this group');
    }

    // Cannot settle with yourself
    if (data.receiverId === req.user!.id) {
      throw new BadRequestError('Cannot settle with yourself');
    }

    // Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        groupId: req.params.id,
        payerId: req.user!.id,
        receiverId: data.receiverId,
        amount: data.amount,
      },
      include: {
        payer: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    // Convert Decimal to number
    const serializedSettlement = {
      ...settlement,
      amount: new Decimal(settlement.amount).toNumber(),
    };

    res.status(201).json(serializedSettlement);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id/settlements/:settlementId
router.delete('/:id/settlements/:settlementId', authenticate, async (req, res, next) => {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: req.params.settlementId },
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    if (settlement.groupId !== req.params.id) {
      throw new NotFoundError('Settlement not found in this group');
    }

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

    // Only payer, receiver, or admin can delete
    const canDelete =
      settlement.payerId === req.user!.id ||
      settlement.receiverId === req.user!.id ||
      membership.role === 'admin';

    if (!canDelete) {
      throw new BadRequestError('Only the payer, receiver, or an admin can delete this settlement');
    }

    await prisma.settlement.delete({
      where: { id: req.params.settlementId },
    });

    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

