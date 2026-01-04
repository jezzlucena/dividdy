import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// GET /api/groups/:id/members
router.get('/:id/members', authenticate, async (req, res, next) => {
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

    const members = await prisma.groupMember.findMany({
      where: { groupId: req.params.id },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json(members);
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/members
router.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    const data = addMemberSchema.parse(req.body);

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
      throw new ForbiddenError('Only admins can add members');
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!userToAdd) {
      throw new NotFoundError('User not found with this email');
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToAdd.id,
          groupId: req.params.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictError('User is already a member of this group');
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        userId: userToAdd.id,
        groupId: req.params.id,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/groups/:id/members/:userId
router.patch('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const data = updateMemberSchema.parse(req.body);

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
      throw new ForbiddenError('Only admins can update member roles');
    }

    // Cannot change own role
    if (req.params.userId === req.user!.id) {
      throw new BadRequestError('Cannot change your own role');
    }

    // Update member role
    const updatedMember = await prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId: req.params.userId,
          groupId: req.params.id,
        },
      },
      data: { role: data.role },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    res.json(updatedMember);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    // Check if user is admin or leaving themselves
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

    const isLeavingSelf = req.params.userId === req.user!.id;
    
    if (!isLeavingSelf && membership.role !== 'admin') {
      throw new ForbiddenError('Only admins can remove members');
    }

    // Check if target member exists
    const targetMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.params.userId,
          groupId: req.params.id,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundError('Member not found');
    }

    // Check if this is the last admin
    if (targetMembership.role === 'admin') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId: req.params.id,
          role: 'admin',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestError('Cannot remove the last admin. Promote another member first.');
      }
    }

    // Remove member
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: req.params.userId,
          groupId: req.params.id,
        },
      },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

