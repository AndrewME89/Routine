import { useMeals } from "../lib/useMeals";
import type { DashboardMode } from "../lib/types";

export default function FoodCard({ mode }: { mode: DashboardMode }) {
  const meals = useMeals();
  if (meals.loading || !meals.settings) return null;

  const isWork = mode === "WORK_NIGHT";

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Food · Current Active Plan</div>
          <h2 className="text-lg font-semibold">Night-Shift Chilled Meal + Work Wrap</h2>
        </div>
      </div>

      <div className="border border-border rounded-lg p-3 mb-3">
        <div className="text-xs text-muted mb-1">Post-Wake Main Meal</div>
        {meals.manualPick ? (
          <select
            value={meals.suggested?.id ?? ""}
            onChange={() => {}}
            className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
          >
            {meals.coverage.chilled
              .filter((c) => c.currentStock > 0)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        ) : (
          <h3 className="text-base font-medium">{meals.suggested?.title ?? "No chilled meals currently stocked"}</h3>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={meals.eatThis} disabled={!meals.suggested} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-bright disabled:opacity-40">
            Eat This
          </button>
          <button onClick={meals.pickAnother} disabled={meals.coverage.chilled.filter(c=>c.currentStock>0).length < 2} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-ink disabled:opacity-40">
            Pick Another
          </button>
          <button onClick={() => meals.setManualPick(!meals.manualPick)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-ink">
            Choose Myself
          </button>
          <button onClick={meals.markOutOfStock} disabled={!meals.suggested} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-danger disabled:opacity-40">
            Mark Out of Stock
          </button>
        </div>
      </div>

      {isWork && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs text-muted mb-1">Work Meal</div>
            <div className="text-sm font-medium">Ham, Colby & Greek Salad Wrap</div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs text-muted mb-1">Shift Snack Set</div>
            <div className="text-sm">✓ Le Snak · ✓ Fruit pouch · ✓ Belvita · ✓ Grain Waves</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs bg-surface-2 rounded-lg px-3 py-2 mb-3">
        <b className="text-muted">Food Coverage</b>
        <span>
          Chilled meals <strong>{meals.coverage.chilledCount}</strong>
        </span>
        <span>
          Wrap lunches <strong>up to {meals.coverage.wraps}*</strong>
        </span>
        <span>
          Complete snack sets <strong>{meals.coverage.snackSets}</strong>
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {isWork && (
          <button
            onClick={meals.packWorkFood}
            disabled={meals.coverage.wraps < 1 || meals.coverage.snackSets < 1}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-bright disabled:opacity-40"
          >
            Pack Work Food
          </button>
        )}
        <span className="text-xs text-faint self-center">*Ham/cheese/salad portions unchanged until per-wrap quantities are set.</span>
      </div>
    </section>
  );
}
