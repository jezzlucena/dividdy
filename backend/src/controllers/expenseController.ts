import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Group, Expense, type SplitMethod } from '../models/index.js';

// Get all expenses for a group
export async function getExpenses(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ groupId: group._id })
      .sort({ date: -1, createdAt: -1 });

    // Enrich expenses with member names
    const enrichedExpenses = expenses.map((expense) => {
      const paidBy = group.members.find(
        (m) => m._id.toString() === expense.paidById.toString()
      );
      const category = group.categories.find(
        (c) => c._id.toString() === expense.categoryId?.toString()
      );

      return {
        id: expense._id,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        category: category || null,
        paidBy: paidBy || null,
        splitMethod: expense.splitMethod,
        splits: expense.splits.map((split) => {
          const member = group.members.find(
            (m) => m._id.toString() === split.memberId.toString()
          );
          return {
            member: member || null,
            amount: split.amount,
            percentage: split.percentage,
            shares: split.shares,
          };
        }),
        items: expense.items,
        createdAt: expense.createdAt,
      };
    });

    res.json(enrichedExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
}

// Create a new expense
export async function createExpense(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;
    const {
      description,
      amount,
      currency,
      date,
      categoryId,
      paidById,
      splitMethod,
      splits,
      items,
    } = req.body;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Validate payer exists
    const payer = group.members.find((m) => m._id.toString() === paidById);
    if (!payer) {
      return res.status(400).json({ message: 'Invalid payer' });
    }

    // Calculate splits based on method
    const calculatedSplits = calculateSplits(
      amount,
      splitMethod as SplitMethod,
      splits,
      items,
      group.members
    );

    const expense = new Expense({
      groupId: group._id,
      description,
      amount,
      currency: currency || group.baseCurrency,
      date: date || new Date(),
      categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined,
      paidById: new mongoose.Types.ObjectId(paidById),
      splitMethod,
      splits: calculatedSplits,
      items: splitMethod === 'itemized' ? items : undefined,
    });

    await expense.save();

    res.status(201).json({
      id: expense._id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paidById: expense.paidById,
      splitMethod: expense.splitMethod,
      splits: expense.splits,
      items: expense.items,
      createdAt: expense.createdAt,
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
}

// Update an expense
export async function updateExpense(req: Request, res: Response) {
  try {
    const { shareCode, expenseId } = req.params;
    const {
      description,
      amount,
      currency,
      date,
      categoryId,
      paidById,
      splitMethod,
      splits,
      items,
    } = req.body;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      groupId: group._id,
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update fields
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (currency !== undefined) expense.currency = currency;
    if (date !== undefined) expense.date = new Date(date);
    if (categoryId !== undefined) {
      expense.categoryId = categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined;
    }
    if (paidById !== undefined) {
      expense.paidById = new mongoose.Types.ObjectId(paidById);
    }
    if (splitMethod !== undefined) expense.splitMethod = splitMethod;

    // Recalculate splits if needed
    if (splits !== undefined || amount !== undefined || splitMethod !== undefined) {
      expense.splits = calculateSplits(
        expense.amount,
        expense.splitMethod as SplitMethod,
        splits || expense.splits,
        items || expense.items,
        group.members
      );
    }

    if (splitMethod === 'itemized' && items !== undefined) {
      expense.items = items;
    }

    await expense.save();

    res.json({
      id: expense._id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paidById: expense.paidById,
      splitMethod: expense.splitMethod,
      splits: expense.splits,
      items: expense.items,
      updatedAt: expense.updatedAt,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Failed to update expense' });
  }
}

// Delete an expense
export async function deleteExpense(req: Request, res: Response) {
  try {
    const { shareCode, expenseId } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const result = await Expense.deleteOne({
      _id: expenseId,
      groupId: group._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
}

// Helper function to calculate splits
function calculateSplits(
  totalAmount: number,
  method: SplitMethod,
  splits: any[],
  items: any[] | undefined,
  members: any[]
): any[] {
  switch (method) {
    case 'equal': {
      const selectedMembers = splits.map((s) => s.memberId);
      const splitAmount = totalAmount / selectedMembers.length;
      return selectedMembers.map((memberId) => ({
        memberId: new mongoose.Types.ObjectId(memberId),
        amount: Math.round(splitAmount * 100) / 100,
      }));
    }

    case 'percentage': {
      return splits.map((split) => ({
        memberId: new mongoose.Types.ObjectId(split.memberId),
        amount: Math.round((totalAmount * split.percentage / 100) * 100) / 100,
        percentage: split.percentage,
      }));
    }

    case 'shares': {
      const totalShares = splits.reduce((sum, s) => sum + (s.shares || 1), 0);
      const amountPerShare = totalAmount / totalShares;
      return splits.map((split) => ({
        memberId: new mongoose.Types.ObjectId(split.memberId),
        amount: Math.round((amountPerShare * (split.shares || 1)) * 100) / 100,
        shares: split.shares || 1,
      }));
    }

    case 'exact': {
      return splits.map((split) => ({
        memberId: new mongoose.Types.ObjectId(split.memberId),
        amount: split.amount,
      }));
    }

    case 'itemized': {
      // Calculate from items
      const memberAmounts: Record<string, number> = {};
      
      if (items) {
        for (const item of items) {
          const perMemberAmount = item.amount / item.memberIds.length;
          for (const memberId of item.memberIds) {
            const id = memberId.toString();
            memberAmounts[id] = (memberAmounts[id] || 0) + perMemberAmount;
          }
        }
      }

      return Object.entries(memberAmounts).map(([memberId, amount]) => ({
        memberId: new mongoose.Types.ObjectId(memberId),
        amount: Math.round(amount * 100) / 100,
      }));
    }

    default:
      return splits.map((split) => ({
        memberId: new mongoose.Types.ObjectId(split.memberId),
        amount: split.amount || 0,
      }));
  }
}
