import { useState } from "react";
import { useMoney } from "../lib/useMoney";
import { formatAud, projectPayoff, totalDebtPool } from "../lib/debtEngine";
import { computeWeeklyPayment } from "../lib/debtEngine";
import type { Bill, DebtAccount } from "../lib/types";

const SUBTABS = [
  { id: "freedom", label: "Debt Freedom" },
  { id: "overview", label: "Overview" },
  { id: "bills", label: "Bills" },
  { id: "transactions", label: "Transactions" },
  { id: "savings", label: "Savings" },
];

export default function MoneyPage() {
  const money = useMoney();
  const [tab, setTab] = useState("freedom");

  if (money.loading || !money.settings) return <div className="p-8 text-muted">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Money</h1>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.id ? "bg-accent text-white border-accent" : "border-border text-muted hover:text-ink hover:border-faint"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "freedom" && <FreedomTab money={money} />}
      {tab === "overview" && <OverviewTab money={money} />}
      {tab === "bills" && <BillsTab money={money} />}
      {tab === "transactions" && <TransactionsTab money={money} />}
      {tab === "savings" && <SavingsTab money={money} />}
    </div>
  );
}

function FreedomTab({ money }: { money: ReturnType<typeof useMoney> }) {
  const s = money.settings!;
  const [showAddDebt, setShowAddDebt] = useState(false);
  const pool = totalDebtPool(s);
  const weeksIndicative = pool > 0 ? Math.round(money.totalDebt / pool) : null;

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Total Current Debt</div>
        <div className="text-3xl font-semibold font-mono">{formatAud(money.totalDebt)}</div>
        <p className="text-sm text-muted mt-2">
          Balanced pool: <b>{formatAud(s.balancedDebtPool)}/week</b> · Base payments {formatAud(s.baseDebtPool)} +
          accelerator {formatAud(s.debtAccelerator)}
        </p>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input type="checkbox" checked={s.debtSprintEnabled} onChange={money.toggleDebtSprint} />
          Debt Sprint ({formatAud(s.debtSprintPool)}/week) — redirects emergency savings to debt, manual only
        </label>
      </section>

      {money.debts.length === 0 ? (
        <div className="text-sm text-muted text-center py-8 border border-dashed border-border rounded-xl">
          No debts added yet. Add your accounts below — nothing is pre-filled.
        </div>
      ) : (
        <div className="space-y-3">
          {money.debts
            .filter((d) => d.active)
            .map((d) => (
              <DebtCard key={d.id} debt={d} money={money} />
            ))}
        </div>
      )}

      <button
        onClick={() => setShowAddDebt((v) => !v)}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
      >
        + Add debt account
      </button>
      {showAddDebt && <AddDebtForm money={money} onDone={() => setShowAddDebt(false)} />}

      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Debt Payments This Cycle</div>
        <p className="text-xs text-faint mb-3">
          {s.acceleratorPaused ? "Accelerator paused this cycle." : "Baseline and accelerator remain separate."}
        </p>
        <div className="space-y-1.5">
          {money.debts
            .filter((d) => d.active)
            .map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <span>{d.title}</span>
                <b className="font-mono">
                  {formatAud(s.acceleratorPaused ? d.baselineWeeklyPayment : computeWeeklyPayment(d, money.debts, s))} planned
                </b>
              </div>
            ))}
        </div>
        <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-border">
          <span>Total</span>
          <span className="font-mono">
            {formatAud(
              s.acceleratorPaused
                ? s.baseDebtPool
                : money.debts.filter((d) => d.active).reduce((sum, d) => sum + computeWeeklyPayment(d, money.debts, s), 0)
            )}
          </span>
        </div>
        <button
          onClick={money.toggleAcceleratorPaused}
          className="mt-3 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
        >
          {s.acceleratorPaused ? "Resume accelerator" : "Pause accelerator"}
        </button>
      </section>

      {weeksIndicative !== null && money.totalDebt > 0 && (
        <section className="bg-surface border border-border rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Whole-debt indicative range</div>
          <p className="text-xs text-faint mb-2">Cost details incomplete for a precise figure.</p>
          <p className="text-sm">
            <b>Balanced:</b> approximately {weeksIndicative} weeks at {formatAud(s.balancedDebtPool)}/week.
          </p>
          <small className="text-faint">
            Indicative only — unconfirmed debts' cost details are incomplete. This simplified total excludes
            unknown interest and material fees.
          </small>
        </section>
      )}
    </div>
  );
}

function DebtCard({ debt: d, money }: { debt: DebtAccount; money: ReturnType<typeof useMoney> }) {
  const s = money.settings!;
  const isTarget = money.target?.id === d.id;
  const currentPayment = computeWeeklyPayment(d, money.debts, s);
  const projection = projectPayoff(d.balance, d.interestRate, currentPayment, (d.monthlyFee ?? 0) / 4.345);
  const baselineProjection = projectPayoff(d.balance, d.interestRate, d.baselineWeeklyPayment, (d.monthlyFee ?? 0) / 4.345);
  const pctOfTotal = money.totalDebt > 0 ? (d.balance / money.totalDebt) * 100 : 0;
  const pctCleared = d.startingBalance > 0 ? Math.max(0, (1 - d.balance / d.startingBalance) * 100) : 0;
  const [open, setOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  return (
    <article className={`border rounded-xl p-4 ${isTarget ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-accent-bright font-medium">{isTarget ? "CURRENT TARGET" : "ACTIVE DEBT"}</span>
          <h3 className="text-base font-semibold">{d.title}</h3>
        </div>
        <b className="font-mono">{formatAud(d.balance)}</b>
      </div>
      <div className="flex justify-between text-xs text-muted mt-2">
        <span>{pctOfTotal.toFixed(1)}% of total debt</span>
        <span>{pctCleared.toFixed(1)}% cleared</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mt-1 mb-3">
        <div className="h-full bg-accent" style={{ width: `${Math.max(1, pctCleared)}%` }} />
      </div>

      <button onClick={() => setOpen((o) => !o)} className="text-xs text-muted hover:text-ink underline decoration-dotted">
        {open ? "Hide details" : "Show details"}
      </button>

      {open && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-3">
          <dt className="text-muted">Borrowing cost</dt>
          <dd>{d.interestRateConfirmed ? `${d.interestRate?.toFixed(2)}% APR · confirmed` : "Needs confirmation — not treated as 0%"}</dd>
          <dt className="text-muted">Baseline payment</dt>
          <dd>{formatAud(d.baselineWeeklyPayment)}/week</dd>
          <dt className="text-muted">Extra / accelerator</dt>
          <dd>{formatAud(Math.max(0, currentPayment - d.baselineWeeklyPayment))}/week</dd>
          <dt className="text-muted">Current payment</dt>
          <dd>{formatAud(currentPayment)}/week</dd>
          <dt className="text-muted">Projected payoff</dt>
          <dd>{projection ? `${projection.weeks} weeks · ${projection.date}` : "Complete cost details for a more accurate projection."}</dd>
          <dt className="text-muted">Estimated interest</dt>
          <dd>{projection ? formatAud(projection.interest) : "Unavailable until cost details are confirmed"}</dd>
          {projection && baselineProjection && (
            <>
              <dt className="text-muted">Interest saved</dt>
              <dd>{formatAud(Math.max(0, baselineProjection.interest - projection.interest))} versus baseline</dd>
            </>
          )}
        </dl>
      )}
      {open && <p className="text-xs text-faint mt-2">Estimate — lender methods, fees, transaction timing and future rate changes can alter results.</p>}

      <div className="flex gap-2 flex-wrap mt-3">
        <button onClick={() => money.paymentMade(d)} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-bright">
          Payment made
        </button>
        <button onClick={() => setShowExtra((v) => !v)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-ink">
          Add extra
        </button>
        <button onClick={() => money.changeTarget(d.id)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-ink">
          Change target
        </button>
      </div>
      {showExtra && <AddExtraForm debt={d} money={money} onDone={() => setShowExtra(false)} />}

      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={d.interestRateConfirmed}
            onChange={(e) => money.updateDebt(d.id, { interestRateConfirmed: e.target.checked })}
          />
          Rate confirmed
        </label>
        <input
          type="number"
          step="0.01"
          value={d.interestRate ?? ""}
          onChange={(e) => money.updateDebt(d.id, { interestRate: e.target.value ? Number(e.target.value) : null })}
          placeholder="APR %"
          className="bg-surface-2 border border-border rounded px-2 py-1"
        />
        <input
          type="number"
          step="0.01"
          value={d.baselineWeeklyPayment}
          onChange={(e) => money.updateDebt(d.id, { baselineWeeklyPayment: Number(e.target.value) })}
          placeholder="Baseline $/wk"
          className="bg-surface-2 border border-border rounded px-2 py-1"
        />
        <button onClick={() => money.removeDebt(d.id)} className="text-muted hover:text-danger text-left">
          Remove
        </button>
      </div>
    </article>
  );
}

function AddExtraForm({ debt, money, onDone }: { debt: DebtAccount; money: ReturnType<typeof useMoney>; onDone: () => void }) {
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState("Buffer");
  return (
    <div className="mt-2 flex gap-2 items-center text-xs">
      <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-24 bg-surface-2 border border-border rounded px-2 py-1" />
      <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1">
        {["Buffer", "Windfall", "Savings", "Other"].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          money.addExtraPayment(debt, amount, source);
          onDone();
        }}
        className="px-2.5 py-1 rounded-lg bg-accent text-white font-medium"
      >
        Apply
      </button>
    </div>
  );
}

function AddDebtForm({ money, onDone }: { money: ReturnType<typeof useMoney>; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [balance, setBalance] = useState(0);
  const [payment, setPayment] = useState(0);
  const submit = async () => {
    if (!title.trim()) return;
    await money.addDebt({ title, balance, baselineWeeklyPayment: payment });
    setTitle("");
    onDone();
  };
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Account name…" className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <div className="flex gap-2">
        <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} placeholder="Balance" className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm w-28" />
        <input type="number" value={payment} onChange={(e) => setPayment(Number(e.target.value))} placeholder="Baseline $/wk" className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm w-28" />
        <button onClick={submit} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright ml-auto">
          Add
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ money }: { money: ReturnType<typeof useMoney> }) {
  const s = money.settings!;
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Stat label="Current debt" value={formatAud(money.totalDebt)} />
      <Stat label="Balanced pool" value={`${formatAud(s.balancedDebtPool)}/wk`} />
      <Stat label="Emergency Savings" value={`${formatAud(s.emergencySavings)}/wk`} />
      <section className="bg-surface border border-border rounded-2xl p-5 sm:col-span-3">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Cost-avalanche rules</div>
        <p className="text-xs text-faint mb-2">Rollovers never return silently to spending.</p>
        <p className="text-sm text-muted">
          All active debts keep their baseline payments. Accelerator and freed payments go to the highest
          confirmed-cost target. Cleared-payment amounts remain inside the debt pool until you explicitly change it.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-surface">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-mono mt-0.5">{value}</div>
    </div>
  );
}

function BillsTab({ money }: { money: ReturnType<typeof useMoney> }) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div>
      <button onClick={() => setShowAdd((s) => !s)} className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-bright mb-3">
        + Add bill
      </button>
      {showAdd && <AddBillForm money={money} onDone={() => setShowAdd(false)} />}
      <div className="space-y-1.5">
        {money.bills.map((b) => (
          <BillRow key={b.id} bill={b} money={money} />
        ))}
        {money.bills.length === 0 && <div className="text-sm text-muted">No bills tracked yet.</div>}
      </div>
    </div>
  );
}

function BillRow({ bill: b, money }: { bill: Bill; money: ReturnType<typeof useMoney> }) {
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm">
      <span className="flex-1">{b.title}</span>
      <span className="text-muted text-xs">{b.frequency}</span>
      <span className="font-mono">{formatAud(b.amount)}</span>
      <button onClick={() => money.removeBill(b.id)} className="text-xs text-muted hover:text-danger">
        Delete
      </button>
    </div>
  );
}

function AddBillForm({ money, onDone }: { money: ReturnType<typeof useMoney>; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [frequency, setFrequency] = useState<Bill["frequency"]>("MONTHLY");
  const [dueDay, setDueDay] = useState("");
  const submit = async () => {
    if (!title.trim()) return;
    await money.addBill({ title, amount, frequency, dueDay, notes: "" });
    setTitle("");
    onDone();
  };
  return (
    <div className="border border-border rounded-lg p-3 mb-3 space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bill name…" className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <div className="flex gap-2">
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm w-24" />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as Bill["frequency"])} className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm">
          {["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "ANNUAL"].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day" className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm w-24" />
        <button onClick={submit} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright ml-auto">
          Add
        </button>
      </div>
    </div>
  );
}

function TransactionsTab({ money }: { money: ReturnType<typeof useMoney> }) {
  const [showTakeaway, setShowTakeaway] = useState(false);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  return (
    <div>
      <button onClick={() => setShowTakeaway((s) => !s)} className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink mb-3">
        Record takeaway
      </button>
      {showTakeaway && (
        <div className="border border-border rounded-lg p-3 mb-4 space-y-2">
          <div className="text-sm font-medium">Record takeaway</div>
          <p className="text-xs text-faint">No guilt trip attached.</p>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount (AUD)" className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTakeaway(false)} className="text-xs text-muted hover:text-ink px-2 py-1">
              Cancel
            </button>
            <button
              onClick={() => {
                money.recordSpend("takeaway", "Takeaway", amount, notes);
                setShowTakeaway(false);
                setAmount(0);
                setNotes("");
              }}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium"
            >
              Record purchase
            </button>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {money.transactions.slice(0, 20).map((t) => (
          <div key={t.id} className="flex justify-between text-sm border-b border-border/60 pb-1.5">
            <span>{t.title}</span>
            <span className="font-mono text-muted">{formatAud(t.amount)}</span>
          </div>
        ))}
        {money.transactions.length === 0 && <div className="text-sm text-muted">No transactions recorded yet.</div>}
      </div>
    </div>
  );
}

function SavingsTab({ money }: { money: ReturnType<typeof useMoney> }) {
  const s = money.settings!;
  return (
    <section className="bg-surface border border-border rounded-2xl p-5 max-w-sm">
      <div className="text-xs uppercase tracking-wide text-muted mb-3">Emergency Savings</div>
      <label className="text-sm">
        <span className="block text-muted mb-1">Weekly contribution</span>
        <input
          type="number"
          value={s.emergencySavings}
          onChange={(e) => money.updateSettings({ emergencySavings: Number(e.target.value) })}
          className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5"
        />
      </label>
      {s.debtSprintEnabled && (
        <p className="text-xs text-warn mt-2">
          Debt Sprint is active — this contribution is currently redirected to debt.
        </p>
      )}
    </section>
  );
}
