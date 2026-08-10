import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bill, DebtAccount, ExpenseTransaction, MoneySettings, TransactionType } from "./types";
import {
  loadBills,
  loadDebtAccounts,
  loadMoneySettings,
  loadTransactions,
  saveBill,
  deleteBill as deleteBillDb,
  saveDebtAccount,
  deleteDebtAccount as deleteDebtDb,
  saveManyRecords,
  saveMoneySettings,
  saveTransaction,
} from "./storage";
import { genId } from "./id";
import { computeWeeklyPayment, currentTarget } from "./debtEngine";
import { operationalDayForInstant } from "./operationalDay";

export function useMoney(wakeTime = "18:30") {
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [settings, setSettings] = useState<MoneySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [d, b, t, s] = await Promise.all([
        loadDebtAccounts(),
        loadBills(),
        loadTransactions(),
        loadMoneySettings(),
      ]);
      setDebts(d);
      setBills(b);
      setTransactions(t);
      setSettings(s);
      setLoading(false);
    })();
  }, []);

  const totalDebt = useMemo(() => debts.filter((d) => d.active).reduce((sum, d) => sum + d.balance, 0), [debts]);
  const target = useMemo(() => (settings ? currentTarget(debts, settings) : null), [debts, settings]);

  const addDebt = useCallback(
    async (input: { title: string; balance: number; baselineWeeklyPayment: number }) => {
      const now = new Date().toISOString();
      const debt: DebtAccount = {
        id: genId(),
        title: input.title.trim(),
        balance: input.balance,
        startingBalance: input.balance,
        interestRate: null,
        interestRateConfirmed: false,
        monthlyFee: null,
        baselineWeeklyPayment: input.baselineWeeklyPayment,
        active: true,
        notes: "",
        createdAt: now,
        updatedAt: now,
      };
      setDebts((prev) => [...prev, debt]);
      await saveDebtAccount(debt);
    },
    []
  );

  const updateDebt = useCallback(async (id: string, patch: Partial<DebtAccount>) => {
    setDebts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
      const updated = next.find((d) => d.id === id);
      if (updated) saveDebtAccount(updated);
      return next;
    });
  }, []);

  const removeDebt = useCallback(async (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    await deleteDebtDb(id);
  }, []);

  const changeTarget = useCallback(
    (debtId: string) => {
      if (!settings) return;
      const next = { ...settings, manualTargetId: debtId };
      setSettings(next);
      saveMoneySettings(next);
    },
    [settings]
  );

  const toggleAcceleratorPaused = useCallback(() => {
    if (!settings) return;
    const next = { ...settings, acceleratorPaused: !settings.acceleratorPaused };
    setSettings(next);
    saveMoneySettings(next);
  }, [settings]);

  const toggleDebtSprint = useCallback(() => {
    if (!settings) return;
    const next = { ...settings, debtSprintEnabled: !settings.debtSprintEnabled };
    setSettings(next);
    saveMoneySettings(next);
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<MoneySettings>) => {
      if (!settings) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      saveMoneySettings(next);
    },
    [settings]
  );

  /** "Payment made" — applies this cycle's computed weekly payment
   * (baseline, or baseline+accelerator+rollovers if this is the target). */
  const paymentMade = useCallback(
    async (debt: DebtAccount) => {
      if (!settings) return;
      const amount = computeWeeklyPayment(debt, debts, settings);
      const applied = Math.min(amount, debt.balance);
      const now = new Date();
      const updatedDebt: DebtAccount = {
        ...debt,
        balance: Math.max(0, debt.balance - applied),
        updatedAt: now.toISOString(),
      };
      const tx: ExpenseTransaction = {
        id: genId(),
        type: "debt_payment",
        title: `Payment to ${debt.title}`,
        amount: applied,
        debtId: debt.id,
        source: "Planned payment",
        dateTime: now.toISOString(),
        operationalDay: operationalDayForInstant(now, wakeTime),
        notes: "",
      };
      setDebts((prev) => prev.map((d) => (d.id === debt.id ? updatedDebt : d)));
      setTransactions((prev) => [tx, ...prev]);
      await saveManyRecords([updatedDebt], [tx]);
    },
    [debts, settings, wakeTime]
  );

  const addExtraPayment = useCallback(
    async (debt: DebtAccount, amount: number, source: string) => {
      const applied = Math.min(amount, debt.balance);
      const now = new Date();
      const updatedDebt: DebtAccount = {
        ...debt,
        balance: Math.max(0, debt.balance - applied),
        updatedAt: now.toISOString(),
      };
      const tx: ExpenseTransaction = {
        id: genId(),
        type: "debt_payment",
        title: `Extra payment to ${debt.title}`,
        amount: applied,
        debtId: debt.id,
        source,
        dateTime: now.toISOString(),
        operationalDay: operationalDayForInstant(now, wakeTime),
        notes: "",
      };
      setDebts((prev) => prev.map((d) => (d.id === debt.id ? updatedDebt : d)));
      setTransactions((prev) => [tx, ...prev]);
      await saveManyRecords([updatedDebt], [tx]);
    },
    [wakeTime]
  );

  const addBill = useCallback(async (input: Omit<Bill, "id" | "active" | "updatedAt">) => {
    const bill: Bill = { ...input, id: genId(), active: true, updatedAt: new Date().toISOString() };
    setBills((prev) => [...prev, bill]);
    await saveBill(bill);
  }, []);

  const updateBill = useCallback(async (id: string, patch: Partial<Bill>) => {
    setBills((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b));
      const updated = next.find((b) => b.id === id);
      if (updated) saveBill(updated);
      return next;
    });
  }, []);

  const removeBill = useCallback(async (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    await deleteBillDb(id);
  }, []);

  const recordSpend = useCallback(
    async (type: TransactionType, title: string, amount: number, notes: string) => {
      const now = new Date();
      const tx: ExpenseTransaction = {
        id: genId(),
        type,
        title,
        amount,
        debtId: null,
        source: "",
        dateTime: now.toISOString(),
        operationalDay: operationalDayForInstant(now, wakeTime),
        notes,
      };
      setTransactions((prev) => [tx, ...prev]);
      await saveTransaction(tx);
    },
    [wakeTime]
  );

  return {
    loading,
    debts,
    bills,
    transactions,
    settings,
    totalDebt,
    target,
    addDebt,
    updateDebt,
    removeDebt,
    changeTarget,
    toggleAcceleratorPaused,
    toggleDebtSprint,
    updateSettings,
    paymentMade,
    addExtraPayment,
    addBill,
    updateBill,
    removeBill,
    recordSpend,
  };
}
