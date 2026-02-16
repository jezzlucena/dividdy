import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { Group } from '../models/index.js';
import { Expense } from '../models/index.js';
import mongoose from 'mongoose';

// Create a new group
export async function createGroup(req: Request, res: Response) {
  try {
    const { name, baseCurrency, members } = req.body;

    if (!name || !members || members.length < 2) {
      return res.status(400).json({ 
        message: 'Group name and at least 2 members are required' 
      });
    }

    const shareCode = nanoid(10);

    const group = new Group({
      name,
      shareCode,
      baseCurrency: baseCurrency || 'USD',
      members: members.map((memberName: string) => ({
        name: memberName,
        _id: new mongoose.Types.ObjectId(),
      })),
      categories: [
        { name: 'Food & Drinks', icon: '🍔', _id: new mongoose.Types.ObjectId() },
        { name: 'Transport', icon: '🚗', _id: new mongoose.Types.ObjectId() },
        { name: 'Accommodation', icon: '🏨', _id: new mongoose.Types.ObjectId() },
        { name: 'Entertainment', icon: '🎬', _id: new mongoose.Types.ObjectId() },
        { name: 'Shopping', icon: '🛍️', _id: new mongoose.Types.ObjectId() },
        { name: 'Utilities', icon: '💡', _id: new mongoose.Types.ObjectId() },
        { name: 'Health', icon: '💊', _id: new mongoose.Types.ObjectId() },
        { name: 'Other', icon: '📦', _id: new mongoose.Types.ObjectId() },
      ],
    });

    await group.save();

    res.status(201).json({
      shareCode: group.shareCode,
      group: {
        id: group._id,
        name: group.name,
        shareCode: group.shareCode,
        baseCurrency: group.baseCurrency,
        members: group.members,
        categories: group.categories,
        createdAt: group.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
}

// Get group by share code
export async function getGroup(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      id: group._id,
      name: group.name,
      shareCode: group.shareCode,
      baseCurrency: group.baseCurrency,
      members: group.members,
      categories: group.categories,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Failed to fetch group' });
  }
}

// Update group
export async function updateGroup(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;
    const { name, baseCurrency } = req.body;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (name) group.name = name;
    if (baseCurrency) group.baseCurrency = baseCurrency;

    await group.save();

    res.json({
      id: group._id,
      name: group.name,
      shareCode: group.shareCode,
      baseCurrency: group.baseCurrency,
      members: group.members,
      categories: group.categories,
      updatedAt: group.updatedAt,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Failed to update group' });
  }
}

// Delete group
export async function deleteGroup(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Delete all expenses associated with this group
    await Expense.deleteMany({ groupId: group._id });

    // Delete the group
    await Group.deleteOne({ _id: group._id });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
}

// Add member to group
export async function addMember(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Member name is required' });
    }

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newMember = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      createdAt: new Date(),
    };

    group.members.push(newMember);
    await group.save();

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
}

// Remove member from group
export async function removeMember(req: Request, res: Response) {
  try {
    const { shareCode, memberId } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if member has any expenses
    const memberObjectId = new mongoose.Types.ObjectId(memberId);
    const hasExpenses = await Expense.exists({
      groupId: group._id,
      $or: [
        { paidById: memberObjectId },
        { 'splits.memberId': memberObjectId },
      ],
    });

    if (hasExpenses) {
      return res.status(400).json({ 
        message: 'Cannot remove member with existing expenses' 
      });
    }

    // Remove member
    group.members = group.members.filter(
      (m) => m._id.toString() !== memberId
    );

    if (group.members.length < 2) {
      return res.status(400).json({ 
        message: 'Group must have at least 2 members' 
      });
    }

    await group.save();

    res.status(204).send();
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
}

// Add category to group
export async function addCategory(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;
    const { name, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newCategory = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      icon: icon || '📦',
    };

    group.categories.push(newCategory);
    await group.save();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Failed to add category' });
  }
}
