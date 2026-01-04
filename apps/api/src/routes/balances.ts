import { Router } from 'express';

import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { calculateGroupBalances } from '../services/balanceService.js';

const router = Router();

// GET /api/groups/:id/balances
router.get('/:id/balances', authenticate, async (req, res, next) => {
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

    const balances = await calculateGroupBalances(req.params.id);

    res.json({
      groupId: req.params.id,
      ...balances,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

