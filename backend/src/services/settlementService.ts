interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

interface Member {
  _id: { toString(): string };
  name: string;
}

/**
 * Settlement Service
 * 
 * Implements a greedy algorithm to minimize the number of transactions
 * needed to settle all debts in a group.
 * 
 * Algorithm:
 * 1. Calculate net balance for each member (what they paid - what they owe)
 * 2. Separate members into creditors (positive balance) and debtors (negative balance)
 * 3. Match the largest debtor with the largest creditor
 * 4. Transfer the minimum of their absolute amounts
 * 5. Update balances and repeat until all are settled
 */
export class SettlementService {
  /**
   * Calculate simplified debts to minimize transactions
   * @param netBalances - Map of member ID to their net balance
   * @param members - Array of member objects with _id and name
   * @returns Array of settlements
   */
  static calculateSimplifiedDebts(
    netBalances: Record<string, number>,
    members: Member[]
  ): Settlement[] {
    const settlements: Settlement[] = [];
    const memberMap = new Map<string, Member>();
    
    // Create a map for quick member lookup
    for (const member of members) {
      memberMap.set(member._id.toString(), member);
    }

    // Create working copies of balances
    const balances = { ...netBalances };

    // Round small values to zero to avoid floating point issues
    for (const id of Object.keys(balances)) {
      if (Math.abs(balances[id]) < 0.01) {
        balances[id] = 0;
      }
    }

    // Continue until all balances are settled
    while (true) {
      // Find the member who owes the most (most negative balance)
      let maxDebtorId: string | null = null;
      let maxDebt = 0;

      // Find the member who is owed the most (most positive balance)
      let maxCreditorId: string | null = null;
      let maxCredit = 0;

      for (const [memberId, balance] of Object.entries(balances)) {
        if (balance < maxDebt) {
          maxDebt = balance;
          maxDebtorId = memberId;
        }
        if (balance > maxCredit) {
          maxCredit = balance;
          maxCreditorId = memberId;
        }
      }

      // If no significant debtors or creditors, we're done
      if (
        maxDebtorId === null ||
        maxCreditorId === null ||
        Math.abs(maxDebt) < 0.01 ||
        maxCredit < 0.01
      ) {
        break;
      }

      // Calculate the transfer amount (minimum of debt and credit)
      const transferAmount = Math.min(Math.abs(maxDebt), maxCredit);

      // Record the settlement
      const debtor = memberMap.get(maxDebtorId);
      const creditor = memberMap.get(maxCreditorId);

      if (debtor && creditor && transferAmount > 0.01) {
        settlements.push({
          fromId: maxDebtorId,
          fromName: debtor.name,
          toId: maxCreditorId,
          toName: creditor.name,
          amount: Math.round(transferAmount * 100) / 100,
        });
      }

      // Update balances
      balances[maxDebtorId] += transferAmount;
      balances[maxCreditorId] -= transferAmount;

      // Round to avoid floating point issues
      if (Math.abs(balances[maxDebtorId]) < 0.01) {
        balances[maxDebtorId] = 0;
      }
      if (Math.abs(balances[maxCreditorId]) < 0.01) {
        balances[maxCreditorId] = 0;
      }
    }

    return settlements;
  }

  /**
   * Calculate direct debts (who owes whom directly based on expenses)
   * This is an alternative to simplified debts, showing actual expense-based debts
   */
  static calculateDirectDebts(
    expenses: any[],
    members: Member[],
    exchangeRates: Record<string, number>
  ): Settlement[] {
    const debts: Map<string, Map<string, number>> = new Map();
    const memberMap = new Map<string, Member>();

    for (const member of members) {
      memberMap.set(member._id.toString(), member);
    }

    // Calculate debts from each expense
    for (const expense of expenses) {
      const payerId = expense.paidById.toString();
      const rate = exchangeRates[expense.currency] || 1;

      for (const split of expense.splits) {
        const memberId = split.memberId.toString();
        
        // Skip if the member paid for themselves
        if (memberId === payerId) continue;

        const amountInBaseCurrency = split.amount / rate;

        // Add to debt: memberId owes payerId
        if (!debts.has(memberId)) {
          debts.set(memberId, new Map());
        }
        const memberDebts = debts.get(memberId)!;
        const currentDebt = memberDebts.get(payerId) || 0;
        memberDebts.set(payerId, currentDebt + amountInBaseCurrency);
      }
    }

    // Net out mutual debts and create settlements
    const settlements: Settlement[] = [];
    const processed = new Set<string>();

    for (const [debtorId, creditorMap] of debts.entries()) {
      for (const [creditorId, amount] of creditorMap.entries()) {
        const pairKey = [debtorId, creditorId].sort().join('-');
        
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        // Check for reverse debt
        const reverseAmount = debts.get(creditorId)?.get(debtorId) || 0;
        const netAmount = amount - reverseAmount;

        if (Math.abs(netAmount) < 0.01) continue;

        const debtor = memberMap.get(netAmount > 0 ? debtorId : creditorId);
        const creditor = memberMap.get(netAmount > 0 ? creditorId : debtorId);

        if (debtor && creditor) {
          settlements.push({
            fromId: netAmount > 0 ? debtorId : creditorId,
            fromName: debtor.name,
            toId: netAmount > 0 ? creditorId : debtorId,
            toName: creditor.name,
            amount: Math.round(Math.abs(netAmount) * 100) / 100,
          });
        }
      }
    }

    return settlements;
  }
}
