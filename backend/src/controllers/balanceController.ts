import { Request, Response } from 'express';
import { Group, Expense } from '../models/index.js';
import { SettlementService } from '../services/settlementService.js';
import { CurrencyService } from '../services/currencyService.js';

// Get balances for all members in a group
export async function getBalances(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ groupId: group._id });

    // Get exchange rates for currency conversion
    const currencies = [...new Set(expenses.map((e) => e.currency))];
    const exchangeRates = await CurrencyService.getExchangeRates(
      group.baseCurrency,
      currencies
    );

    // Calculate balances for each member
    const balances: Record<string, { paid: number; owes: number; net: number }> = {};

    // Initialize balances for all members
    for (const member of group.members) {
      balances[member._id.toString()] = { paid: 0, owes: 0, net: 0 };
    }

    // Process all expenses
    for (const expense of expenses) {
      const rate = exchangeRates[expense.currency] || 1;
      const amountInBaseCurrency = expense.amount / rate;

      // Add to payer's "paid" amount
      const payerId = expense.paidById.toString();
      if (balances[payerId]) {
        balances[payerId].paid += amountInBaseCurrency;
      }

      // Add to each split member's "owes" amount
      for (const split of expense.splits) {
        const memberId = split.memberId.toString();
        const splitAmountInBaseCurrency = split.amount / rate;
        if (balances[memberId]) {
          balances[memberId].owes += splitAmountInBaseCurrency;
        }
      }
    }

    // Calculate net balance for each member
    for (const memberId of Object.keys(balances)) {
      balances[memberId].net = balances[memberId].paid - balances[memberId].owes;
    }

    // Format response with member info
    const memberBalances = group.members.map((member) => {
      const balance = balances[member._id.toString()];
      return {
        member: {
          id: member._id,
          name: member.name,
        },
        paid: Math.round(balance.paid * 100) / 100,
        owes: Math.round(balance.owes * 100) / 100,
        net: Math.round(balance.net * 100) / 100,
      };
    });

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => {
      const rate = exchangeRates[expense.currency] || 1;
      return sum + (expense.amount / rate);
    }, 0);

    res.json({
      baseCurrency: group.baseCurrency,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balances: memberBalances,
    });
  } catch (error) {
    console.error('Error calculating balances:', error);
    res.status(500).json({ message: 'Failed to calculate balances' });
  }
}

// Get simplified settlements
export async function getSettlements(req: Request, res: Response) {
  try {
    const { shareCode } = req.params;

    const group = await Group.findOne({ shareCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ groupId: group._id });

    // Get exchange rates for currency conversion
    const currencies = [...new Set(expenses.map((e) => e.currency))];
    const exchangeRates = await CurrencyService.getExchangeRates(
      group.baseCurrency,
      currencies
    );

    // Calculate net balances
    const netBalances: Record<string, number> = {};

    for (const member of group.members) {
      netBalances[member._id.toString()] = 0;
    }

    for (const expense of expenses) {
      const rate = exchangeRates[expense.currency] || 1;
      const amountInBaseCurrency = expense.amount / rate;

      // Payer gets credited
      const payerId = expense.paidById.toString();
      if (netBalances[payerId] !== undefined) {
        netBalances[payerId] += amountInBaseCurrency;
      }

      // Split members get debited
      for (const split of expense.splits) {
        const memberId = split.memberId.toString();
        const splitAmountInBaseCurrency = split.amount / rate;
        if (netBalances[memberId] !== undefined) {
          netBalances[memberId] -= splitAmountInBaseCurrency;
        }
      }
    }

    // Calculate simplified settlements
    const settlements = SettlementService.calculateSimplifiedDebts(
      netBalances,
      group.members
    );

    res.json({
      baseCurrency: group.baseCurrency,
      settlements: settlements.map((s) => ({
        from: {
          id: s.fromId,
          name: s.fromName,
        },
        to: {
          id: s.toId,
          name: s.toName,
        },
        amount: Math.round(s.amount * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Error calculating settlements:', error);
    res.status(500).json({ message: 'Failed to calculate settlements' });
  }
}
