import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';
import * as expenseController from '../controllers/expenseController.js';
import * as balanceController from '../controllers/balanceController.js';

const router = Router();

// Group routes
router.post('/', groupController.createGroup);
router.get('/:shareCode', groupController.getGroup);
router.put('/:shareCode', groupController.updateGroup);
router.delete('/:shareCode', groupController.deleteGroup);

// Member routes
router.post('/:shareCode/members', groupController.addMember);
router.delete('/:shareCode/members/:memberId', groupController.removeMember);

// Category routes
router.post('/:shareCode/categories', groupController.addCategory);

// Expense routes
router.get('/:shareCode/expenses', expenseController.getExpenses);
router.post('/:shareCode/expenses', expenseController.createExpense);
router.put('/:shareCode/expenses/:expenseId', expenseController.updateExpense);
router.delete('/:shareCode/expenses/:expenseId', expenseController.deleteExpense);

// Balance and settlement routes
router.get('/:shareCode/balances', balanceController.getBalances);
router.get('/:shareCode/settlements', balanceController.getSettlements);

export default router;
