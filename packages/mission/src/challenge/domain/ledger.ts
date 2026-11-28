// The run's technical debt, map to map; the review charges interest on it (combat/domain/score.ts).
export type Debt = { readonly reason: string; readonly amount: number; readonly stage: number };

export class Ledger {
  private readonly debts: Debt[] = [];

  owe(debt: Debt) {
    this.debts.push(debt);
  }

  // A good decision later can pay some of it back, never below zero.
  repay({ amount, stage }: { amount: number; stage: number }) {
    const paid = Math.min(amount, this.total());
    if (paid > 0) this.debts.push({ reason: "repaid", amount: -paid, stage });
  }

  total() {
    return this.debts.reduce((sum, d) => sum + d.amount, 0);
  }

  reasons() {
    return this.debts.filter((d) => d.amount > 0).map((d) => d.reason);
  }
}
