import type { DebtAccount, MoneySettings } from "./types";

export interface PayoffProjection {
  weeks: number;
  months: number;
  interest: number;
  total: number;
  date: string;
}

/**
 * Ported directly from the real app's compiled projection function. It's a
 * simplified WEEKLY-COMPOUNDING simulation, not a closed-form formula:
 * each week, interest accrues on the current balance (+ any flat weekly
 * fee), gets added to the balance, then the payment is subtracted (capped
 * at whatever's left). Runs until paid off or 5200 weeks (100 years) as a
 * safety cap so a too-small payment can't loop forever.
 *
 * Returns null when balance, APR, or payment aren't known yet — the caller
 * is expected to show "Complete cost details for a more accurate
 * projection" rather than pretending 0% APR.
 */
export function projectPayoff(
  balance: number | null,
  aprPercent: number | null,
  weeklyPayment: number | null,
  weeklyFee = 0
): PayoffProjection | null {
  if (!balance || aprPercent == null || weeklyPayment == null) return null;
  let remaining = balance;
  let weeks = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const weeklyRate = aprPercent / 100 / 52;
  while (remaining > 0 && weeks < 5200) {
    const interestThisWeek = remaining * weeklyRate + weeklyFee;
    totalInterest += interestThisWeek;
    remaining += interestThisWeek;
    const payment = Math.min(weeklyPayment, remaining);
    remaining -= payment;
    totalPaid += payment;
    weeks++;
  }
  const date = new Date(Date.now() + weeks * 7 * 86_400_000).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { weeks, months: Math.round(weeks / 4.345), interest: totalInterest, total: totalPaid, date };
}

export function formatAud(n: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n || 0);
}

/** Highest CONFIRMED-cost active debt — never assumes an unconfirmed rate is
 * 0%, and a manual override always wins over the automatic pick. */
export function currentTarget(debts: DebtAccount[], settings: MoneySettings): DebtAccount | null {
  const active = debts.filter((d) => d.active && d.balance > 0);
  if (settings.manualTargetId) {
    const manual = active.find((d) => d.id === settings.manualTargetId);
    if (manual) return manual;
  }
  const confirmed = active
    .filter((d) => d.interestRateConfirmed && d.interestRate != null)
    .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  return confirmed[0] ?? null;
}

/**
 * Weekly payment for one debt this cycle:
 * - Cleared debts (balance 0) pay nothing, but their baseline payment
 *   doesn't vanish — it rolls into the pool below.
 * - The current target gets its own baseline, PLUS the accelerator (unless
 *   paused), PLUS every cleared debt's former baseline payment. The total
 *   debt-payment pool never shrinks just because one account finished.
 * - Every other active debt keeps paying its own baseline only.
 */
export function computeWeeklyPayment(
  debt: DebtAccount,
  allDebts: DebtAccount[],
  settings: MoneySettings
): number {
  if (!debt.active || debt.balance <= 0) return 0;
  const target = currentTarget(allDebts, settings);
  if (target && target.id === debt.id) {
    const rolledFromCleared = allDebts
      .filter((d) => d.active && d.balance <= 0)
      .reduce((sum, d) => sum + d.baselineWeeklyPayment, 0);
    const accelerator = settings.acceleratorPaused ? 0 : settings.debtAccelerator;
    return debt.baselineWeeklyPayment + accelerator + rolledFromCleared;
  }
  return debt.baselineWeeklyPayment;
}

export function totalDebtPool(settings: MoneySettings): number {
  return settings.debtSprintEnabled ? settings.debtSprintPool : settings.balancedDebtPool;
}
