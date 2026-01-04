import { Decimal } from '@prisma/client/runtime/library';

import { prisma } from '../lib/prisma.js';

interface UserBalance {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  balance: number;
}

interface SimplifiedDebt {
  fromId: string;
  toId: string;
  amount: number;
}

export interface GroupBalanceResult {
  balances: UserBalance[];
  simplifiedDebts: Array<{
    from: { id: string; name: string; email: string; avatarUrl: string | null };
    to: { id: string; name: string; email: string; avatarUrl: string | null };
    amount: number;
  }>;
}

export async function calculateGroupBalances(groupId: string): Promise<GroupBalanceResult> {
  // Get all group members
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, email: true, name: true, avatarUrl: true },
      },
    },
  });

  // Get all expenses with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
    },
  });

  // Get all settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
  });

  // Calculate net balance for each user
  // Positive = owed money, Negative = owes money
  const balanceMap = new Map<string, number>();

  // Initialize all members with 0 balance
  for (const member of members) {
    balanceMap.set(member.userId, 0);
  }

  // Process expenses
  for (const expense of expenses) {
    const payerId = expense.paidById;
    const amount = new Decimal(expense.amount).toNumber();

    // Payer paid the full amount, so they are owed that amount
    const currentPayerBalance = balanceMap.get(payerId) || 0;
    balanceMap.set(payerId, currentPayerBalance + amount);

    // Each person in the split owes their share
    for (const split of expense.splits) {
      const splitAmount = new Decimal(split.amount).toNumber();
      const currentBalance = balanceMap.get(split.userId) || 0;
      balanceMap.set(split.userId, currentBalance - splitAmount);
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const amount = new Decimal(settlement.amount).toNumber();

    // Payer reduced their debt (or increased what they're owed)
    const payerBalance = balanceMap.get(settlement.payerId) || 0;
    balanceMap.set(settlement.payerId, payerBalance + amount);

    // Receiver reduced what they're owed
    const receiverBalance = balanceMap.get(settlement.receiverId) || 0;
    balanceMap.set(settlement.receiverId, receiverBalance - amount);
  }

  // Create user balance list
  const userMap = new Map(members.map((m) => [m.userId, m.user]));
  const balances: UserBalance[] = [];

  for (const [userId, balance] of balanceMap) {
    const user = userMap.get(userId);
    if (user) {
      balances.push({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        balance: Math.round(balance * 100) / 100, // Round to 2 decimal places
      });
    }
  }

  // Sort by balance (most owed first)
  balances.sort((a, b) => b.balance - a.balance);

  // Calculate simplified debts using greedy algorithm
  const simplifiedDebts = simplifyDebts(balanceMap);

  // Map debts to include user info
  const debtsWithUsers = simplifiedDebts.map((debt) => {
    const fromUser = userMap.get(debt.fromId)!;
    const toUser = userMap.get(debt.toId)!;
    return {
      from: {
        id: fromUser.id,
        name: fromUser.name,
        email: fromUser.email,
        avatarUrl: fromUser.avatarUrl,
      },
      to: {
        id: toUser.id,
        name: toUser.name,
        email: toUser.email,
        avatarUrl: toUser.avatarUrl,
      },
      amount: debt.amount,
    };
  });

  return { balances, simplifiedDebts: debtsWithUsers };
}

/**
 * Simplify debts using a greedy algorithm.
 * This minimizes the number of transactions needed to settle all debts.
 */
function simplifyDebts(balanceMap: Map<string, number>): SimplifiedDebt[] {
  const debts: SimplifiedDebt[] = [];
  
  // Create arrays of creditors (positive balance) and debtors (negative balance)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [userId, balance] of balanceMap) {
    const roundedBalance = Math.round(balance * 100) / 100;
    if (roundedBalance > 0.01) {
      creditors.push({ id: userId, amount: roundedBalance });
    } else if (roundedBalance < -0.01) {
      debtors.push({ id: userId, amount: -roundedBalance }); // Store as positive
    }
  }

  // Sort both arrays by amount descending for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Match debtors with creditors
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) {
      debts.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return debts;
}

