import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

// GET /api/groups/:id/categories
router.get('/:id/categories', authenticate, async (req, res, next) => {
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

    const categories = await prisma.category.findMany({
      where: { groupId: req.params.id },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/categories
router.post('/:id/categories', authenticate, async (req, res, next) => {
  try {
    const data = createCategorySchema.parse(req.body);

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

    // Check for duplicate name
    const existing = await prisma.category.findUnique({
      where: {
        groupId_name: {
          groupId: req.params.id,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = await prisma.category.create({
      data: {
        groupId: req.params.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/groups/:id/categories/:categoryId
router.patch('/:id/categories/:categoryId', authenticate, async (req, res, next) => {
  try {
    const data = updateCategorySchema.parse(req.body);

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
      throw new ForbiddenError('Only admins can update categories');
    }

    const category = await prisma.category.findUnique({
      where: { id: req.params.categoryId },
    });

    if (!category || category.groupId !== req.params.id) {
      throw new NotFoundError('Category not found');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: {
          groupId_name: {
            groupId: req.params.id,
            name: data.name,
          },
        },
      });

      if (existing) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: req.params.categoryId },
      data,
    });

    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id/categories/:categoryId
router.delete('/:id/categories/:categoryId', authenticate, async (req, res, next) => {
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
      throw new ForbiddenError('Only admins can delete categories');
    }

    const category = await prisma.category.findUnique({
      where: { id: req.params.categoryId },
    });

    if (!category || category.groupId !== req.params.id) {
      throw new NotFoundError('Category not found');
    }

    await prisma.category.delete({
      where: { id: req.params.categoryId },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

