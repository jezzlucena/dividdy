import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  currency: z.string().length(3).optional(),
});

// GET /api/groups
router.get('/', authenticate, async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: req.user!.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(groups);
  } catch (error) {
    next(error);
  }
});

// POST /api/groups
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createGroupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        currency: data.currency,
        inviteCode: uuidv4(),
        members: {
          create: {
            userId: req.user!.id,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Create default categories
    await prisma.category.createMany({
      data: [
        { groupId: group.id, name: 'Food & Drinks', icon: '🍽️', color: '#ef4444' },
        { groupId: group.id, name: 'Transportation', icon: '🚗', color: '#f97316' },
        { groupId: group.id, name: 'Entertainment', icon: '🎬', color: '#eab308' },
        { groupId: group.id, name: 'Shopping', icon: '🛒', color: '#22c55e' },
        { groupId: group.id, name: 'Utilities', icon: '💡', color: '#3b82f6' },
        { groupId: group.id, name: 'Rent', icon: '🏠', color: '#8b5cf6' },
        { groupId: group.id, name: 'Other', icon: '📦', color: '#6b7280' },
      ],
    });

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        categories: true,
        _count: {
          select: { expenses: true, settlements: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId === req.user!.id);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/groups/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const data = updateGroupSchema.parse(req.body);

    // Check if user is admin
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

    if (membership.role !== 'admin') {
      throw new ForbiddenError('Only admins can update the group');
    }

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json(group);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    // Check if user is admin
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

    if (membership.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete the group');
    }

    await prisma.group.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/regenerate-invite
router.post('/:id/regenerate-invite', authenticate, async (req, res, next) => {
  try {
    // Check if user is admin
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

    if (membership.role !== 'admin') {
      throw new ForbiddenError('Only admins can regenerate invite codes');
    }

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: { inviteCode: uuidv4() },
      select: { inviteCode: true },
    });

    res.json({ inviteCode: group.inviteCode });
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/join/:inviteCode
router.post('/join/:inviteCode', authenticate, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode: req.params.inviteCode },
    });

    if (!group) {
      throw new NotFoundError('Invalid invite code');
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user!.id,
          groupId: group.id,
        },
      },
    });

    if (existingMembership) {
      res.json({ message: 'Already a member of this group', groupId: group.id });
      return;
    }

    // Add as member
    await prisma.groupMember.create({
      data: {
        userId: req.user!.id,
        groupId: group.id,
        role: 'member',
      },
    });

    const fullGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.status(201).json(fullGroup);
  } catch (error) {
    next(error);
  }
});

export default router;

