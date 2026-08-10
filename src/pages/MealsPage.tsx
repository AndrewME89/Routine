import { useMemo, useState } from "react";
import { useMeals } from "../lib/useMeals";
import type { PantryItem } from "../lib/types";
import {
  BACKUP_PLANS,
  FOOD_PREP_STEPS,
  MEAL_CATEGORIES,
  MEAL_SUBTABS,
  SHOPPING_LIST_TYPES,
} from "../lib/mealsSeed";

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function MealsPage() {
  const meals = useMeals();
  const [tab, setTab] = useState("plan");

  if (meals.loading || !meals.settings) return <div className="p-8 text-muted">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Meals</h1>
      <p className="text-sm text-muted mb-6">
        Night-Shift Chilled Meal + Work Wrap — the active/default plan. Theme Week, ready meals and
        emergency options remain available as backups.
      </p>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {MEAL_SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.id
                ? "bg-accent text-white border-accent"
                : "border-border text-muted hover:text-ink hover:border-faint"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan" && <PlanTab meals={meals} />}
      {tab === "chilled" && <ChilledTab meals={meals} />}
      {tab === "stock" && <StockTab meals={meals} />}
      {tab === "shopping" && <ShoppingTab meals={meals} />}
      {tab === "backups" && <BackupsTab />}
    </div>
  );
}

function PlanTab({ meals }: { meals: ReturnType<typeof useMeals> }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Meal slots</div>
        <p className="text-xs text-faint mb-3">Labels and components remain editable.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs text-muted">POST-WAKE MAIN MEAL</div>
            <div className="text-sm mt-0.5">One chilled meal from the rotation</div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs text-muted">WORK MEAL</div>
            <div className="text-sm mt-0.5">Ham, Colby & Greek Salad Wrap</div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs text-muted">SHIFT SNACK SET</div>
            <div className="text-sm mt-0.5">✓ Le Snak · ✓ Fruit pouch · ✓ Belvita · ✓ Grain Waves</div>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Ham, Colby & Greek Salad Wrap</div>
        <p className="text-xs text-faint mb-3">Work meal</p>
        <p className="text-sm text-muted">White wrap · Greek Salad Kit · Champagne Leg Ham · Colby slices</p>
        <p className="text-xs text-faint mt-2">
          Parmesan remains a pantry seasoning, not a required wrap ingredient, unless you choose
          that later. Ham/cheese/salad amounts per wrap aren't supplied yet — set them below if
          you'd like exact per-wrap maths.
        </p>
      </section>
    </div>
  );
}

function ChilledTab({ meals }: { meals: ReturnType<typeof useMeals> }) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div>
      <div className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-5 mb-4">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Chilled meals remaining</div>
        <div className="text-3xl font-semibold font-mono">{meals.coverage.chilledCount}</div>
        <div className="text-sm text-muted mt-1">
          Estimated post-wake meals covered: {meals.coverage.chilledCount}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {meals.coverage.chilled.map((item) => (
          <ChilledCard key={item.id} item={item} meals={meals} />
        ))}
      </div>
      <button
        onClick={() => setShowAdd((s) => !s)}
        className="mt-4 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
      >
        + Add chilled meal
      </button>
      {showAdd && <AddPantryItemForm meals={meals} defaultType="CHILLED_MEAL" defaultCategory="Chilled Meals" onDone={() => setShowAdd(false)} />}
    </div>
  );
}

function ChilledCard({ item, meals }: { item: PantryItem; meals: ReturnType<typeof useMeals> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-border rounded-lg p-3 ${item.active === false ? "opacity-50" : ""}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-start gap-2 text-left">
        <button
          onClick={(e) => {
            e.stopPropagation();
            meals.updateItem(item.id, { favourite: !item.favourite });
          }}
          className={item.favourite ? "text-warn" : "text-faint"}
        >
          ★
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm">{item.title}</div>
          <div className="text-xs text-muted">Stock {item.currentStock} · {money(item.price)}</div>
        </div>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-border/60 space-y-2 text-xs">
          <p className="text-faint">Planning data — not a live supermarket price.</p>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1">
              Stock
              <input
                type="number"
                value={item.currentStock}
                onChange={(e) => meals.updateItem(item.id, { currentStock: Number(e.target.value) })}
                className="w-14 bg-surface-2 border border-border rounded px-1.5 py-0.5"
              />
            </label>
            <label className="flex items-center gap-1">
              Price
              <input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) => meals.updateItem(item.id, { price: Number(e.target.value) })}
                className="w-16 bg-surface-2 border border-border rounded px-1.5 py-0.5"
              />
            </label>
            <label className="flex items-center gap-1">
              Rating
              <input
                type="number"
                min={0}
                max={5}
                value={item.rating ?? ""}
                onChange={(e) => meals.updateItem(item.id, { rating: e.target.value ? Number(e.target.value) : null })}
                className="w-12 bg-surface-2 border border-border rounded px-1.5 py-0.5"
              />
            </label>
          </div>
          <input
            value={item.notes}
            onChange={(e) => meals.updateItem(item.id, { notes: e.target.value })}
            placeholder="Texture/flavour notes…"
            className="w-full bg-surface-2 border border-border rounded px-2 py-1"
          />
          <div className="flex gap-2">
            <button
              onClick={() => meals.updateItem(item.id, { active: item.active === false })}
              className="text-muted hover:text-ink"
            >
              {item.active === false ? "Reactivate" : "Archive"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StockTab({ meals }: { meals: ReturnType<typeof useMeals> }) {
  const s = meals.settings!;
  return (
    <div className="space-y-6">
      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Food Coverage</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Post-wake meals available" value={String(meals.coverage.chilledCount)} />
          <Stat label="Wrap lunches available" value={`Up to ${meals.coverage.wraps}`} />
          <Stat label="Complete snack sets available" value={String(meals.coverage.snackSets)} />
        </div>
        <p className="text-xs text-faint mt-3">
          Shown separately rather than combined into one misleading "days of food" figure.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Work Food Prep</div>
        <p className="text-xs text-faint mb-3">No forced 90-minute cook-up.</p>
        <ul className="space-y-1.5 text-sm">
          {FOOD_PREP_STEPS.map((step) => (
            <li key={step} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {step}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">Food & Money</div>
        <p className="text-xs text-faint mb-3">Purchase cost ≠ weekly consumption.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-muted mb-1">Forward grocery budget</span>
            <input
              type="number"
              value={s.forwardGroceryBudget}
              onChange={(e) => meals.updateSettings({ forwardGroceryBudget: Number(e.target.value) })}
              className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="block text-muted mb-1">Takeaway + Convenience</span>
            <input
              type="number"
              value={s.takeawayConvenienceBudget}
              onChange={(e) => meals.updateSettings({ takeawayConvenienceBudget: Number(e.target.value) })}
              className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5"
            />
          </label>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-mono mt-0.5">{value}</div>
    </div>
  );
}

function ShoppingTab({ meals }: { meals: ReturnType<typeof useMeals> }) {
  const [listType, setListType] = useState<string>(SHOPPING_LIST_TYPES[0]);
  const [showAdd, setShowAdd] = useState(false);

  const basketTotal = useMemo(
    () => meals.items.filter((i) => i.active).reduce((sum, i) => sum + lineTotal(i), 0),
    [meals.items]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select
          value={listType}
          onChange={(e) => setListType(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          {SHOPPING_LIST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-bright"
        >
          + Add product
        </button>
      </div>

      {showAdd && <AddPantryItemForm meals={meals} defaultType="OTHER" defaultCategory="Other" onDone={() => setShowAdd(false)} />}

      <div className="space-y-6">
        {MEAL_CATEGORIES.map((cat) => {
          const rows = meals.items.filter((i) => i.category === cat);
          if (rows.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-xs uppercase tracking-wide text-muted mb-2">{cat}</div>
              <div className="space-y-1.5">
                {rows.map((r) => (
                  <ShoppingRow key={r.id} item={r} meals={meals} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
        <span className="text-sm text-muted">Estimated Basket Total</span>
        <span className="text-lg font-mono font-semibold">{money(basketTotal)}</span>
      </div>
      <p className="text-xs text-faint mt-1">
        Totals recalculate live from quantity × unit price — never hard-coded.
      </p>
    </div>
  );
}

function lineTotal(item: PantryItem): number {
  if (item.pricePer100g) return item.pricePer100g * item.purchaseQuantity;
  return item.price * item.purchaseQuantity;
}

function ShoppingRow({ item, meals }: { item: PantryItem; meals: ReturnType<typeof useMeals> }) {
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm">
      <span className="flex-1 min-w-0 truncate">{item.title}</span>
      <input
        type="number"
        value={item.purchaseQuantity}
        onChange={(e) => meals.updateItem(item.id, { purchaseQuantity: Number(e.target.value) })}
        className="w-14 bg-surface-2 border border-border rounded px-1.5 py-1 text-xs"
        title="Quantity to buy"
      />
      <span className="text-xs text-muted w-20 text-right">
        {money(item.pricePer100g ?? item.price)}
        {item.pricePer100g ? "/100g" : ""}
      </span>
      <span className="text-xs font-mono w-16 text-right">{money(lineTotal(item))}</span>
    </div>
  );
}

function AddPantryItemForm({
  meals,
  defaultType,
  defaultCategory,
  onDone,
}: {
  meals: ReturnType<typeof useMeals>;
  defaultType: PantryItem["itemType"] | "OTHER";
  defaultCategory: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(1);

  const submit = async () => {
    if (!title.trim()) return;
    await meals.addItem({
      title,
      category,
      itemType: (defaultType === "OTHER" ? "WRAP_COMPONENT" : defaultType) as PantryItem["itemType"],
      price,
      currentStock: stock,
    });
    setTitle("");
    onDone();
  };

  return (
    <div className="border border-border rounded-lg p-3 mb-4 space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Product name…"
        className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          {MEAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Price"
          className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          placeholder="Qty"
          className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        />
        <button onClick={submit} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright ml-auto">
          Add
        </button>
      </div>
    </div>
  );
}

function BackupsTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted mb-2">
        Alternatives to the active plan — never auto-pulled into the current shopping list.
      </p>
      {BACKUP_PLANS.map((b) => (
        <div key={b.name} className="border border-border rounded-lg p-3">
          <div className="text-sm font-medium">{b.name}</div>
          <div className="text-xs text-muted mt-0.5">{b.note}</div>
        </div>
      ))}
    </div>
  );
}
