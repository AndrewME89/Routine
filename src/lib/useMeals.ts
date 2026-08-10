import { useCallback, useEffect, useMemo, useState } from "react";
import type { MealSettings, PantryItem } from "./types";
import {
  loadMealSettings,
  loadPantryItems,
  saveManyPantryItems,
  saveMealSettings,
  savePantryItem,
  seedPantryItemsIfEmpty,
} from "./storage";
import { PANTRY_SEED } from "./mealsSeed";
import { genId } from "./id";

function buildSeedItems(): PantryItem[] {
  const now = new Date().toISOString();
  return PANTRY_SEED.map((s) => ({
    id: s.id ?? genId(),
    itemType: s.itemType,
    title: s.title,
    category: s.category,
    currentStock: s.currentStock,
    purchaseQuantity: s.purchaseQuantity,
    minStock: null,
    targetStock: null,
    price: s.price,
    pricePer100g: s.pricePer100g ?? null,
    unitNote: s.unitNote ?? "",
    favourite: false,
    rating: null,
    active: true,
    reorderFlag: false,
    lastEaten: null,
    timesEaten: 0,
    notes: "",
    updatedAt: now,
  }));
}

/** Same formula as the real app: complete snack sets = the lowest stock
 * among the four fixed snack/wrap component ids, never averaged. */
function computeCoverage(items: PantryItem[]) {
  const byId = (id: string) => items.find((i) => i.id === id)?.currentStock ?? 0;
  const chilled = items.filter((i) => i.itemType === "CHILLED_MEAL" && i.active);
  const fruitCount = items
    .filter((i) => i.itemType === "FRUIT_POUCH")
    .reduce((sum, i) => sum + i.currentStock, 0);
  return {
    chilled,
    chilledCount: chilled.reduce((sum, i) => sum + i.currentStock, 0),
    wraps: byId("stock-wraps"),
    fruitCount,
    snackSets: Math.min(byId("stock-lesnak"), fruitCount, byId("stock-belvita"), byId("stock-grainwaves")),
  };
}

export function useMeals() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [settings, setSettings] = useState<MealSettings | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [manualPick, setManualPick] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedPantryItemsIfEmpty(buildSeedItems());
      const [it, st] = await Promise.all([loadPantryItems(), loadMealSettings()]);
      setItems(it);
      setSettings(st);
      setLoading(false);
    })();
  }, []);

  const coverage = useMemo(() => computeCoverage(items), [items]);

  // Suggested chilled meal: favourite, then rating, then longest since eaten —
  // same tie-break order as the real app, not a random pick.
  const rotation = useMemo(() => {
    return [...coverage.chilled]
      .filter((i) => i.currentStock > 0)
      .sort((a, b) => {
        if (a.favourite !== b.favourite) return a.favourite ? -1 : 1;
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (a.lastEaten ?? "").localeCompare(b.lastEaten ?? "");
      });
  }, [coverage.chilled]);

  const suggested = rotation.length > 0 ? rotation[rotationIndex % rotation.length] : null;

  const updateItem = useCallback(async (id: string, patch: Partial<PantryItem>) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i));
      const updated = next.find((i) => i.id === id);
      if (updated) savePantryItem(updated);
      return next;
    });
  }, []);

  const eatThis = useCallback(() => {
    if (!suggested) return;
    updateItem(suggested.id, {
      currentStock: Math.max(0, suggested.currentStock - 1),
      lastEaten: new Date().toISOString(),
      timesEaten: suggested.timesEaten + 1,
    });
  }, [suggested, updateItem]);

  const pickAnother = useCallback(() => {
    if (rotation.length < 2) return;
    setRotationIndex((i) => i + 1);
  }, [rotation.length]);

  const markOutOfStock = useCallback(() => {
    if (!suggested) return;
    updateItem(suggested.id, { currentStock: 0, reorderFlag: true });
  }, [suggested, updateItem]);

  /** Decrements one wrap, one of each snack component, and one fruit pouch —
   * exactly what the real "PACK WORK FOOD" button does. Ham/cheese/salad
   * portions are deliberately left untouched since per-wrap quantities
   * aren't configured, matching the same honesty the real app keeps. */
  const packWorkFood = useCallback(async () => {
    const fixedIds = ["stock-wraps", "stock-lesnak", "stock-belvita", "stock-grainwaves"];
    const updates: PantryItem[] = [];
    for (const id of fixedIds) {
      const item = items.find((i) => i.id === id);
      if (item && item.currentStock > 0) updates.push({ ...item, currentStock: item.currentStock - 1 });
    }
    const pouch = items.find((i) => i.itemType === "FRUIT_POUCH" && i.currentStock > 0);
    if (pouch) updates.push({ ...pouch, currentStock: pouch.currentStock - 1 });
    if (updates.length === 0) return;
    const now = new Date().toISOString();
    const stamped = updates.map((u) => ({ ...u, updatedAt: now }));
    setItems((prev) => {
      const byId = new Map(stamped.map((u) => [u.id, u]));
      return prev.map((i) => byId.get(i.id) ?? i);
    });
    await saveManyPantryItems(stamped);
  }, [items]);

  const addItem = useCallback(
    async (input: {
      title: string;
      category: string;
      itemType: PantryItem["itemType"];
      price: number;
      currentStock: number;
    }) => {
      const now = new Date().toISOString();
      const item: PantryItem = {
        id: genId(),
        itemType: input.itemType,
        title: input.title,
        category: input.category,
        currentStock: input.currentStock,
        purchaseQuantity: input.currentStock,
        minStock: null,
        targetStock: null,
        price: input.price,
        pricePer100g: null,
        unitNote: "",
        favourite: false,
        rating: null,
        active: true,
        reorderFlag: false,
        lastEaten: null,
        timesEaten: 0,
        notes: "",
        updatedAt: now,
      };
      setItems((prev) => [...prev, item]);
      await savePantryItem(item);
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<MealSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveMealSettings(next);
      return next;
    });
  }, []);

  return {
    loading,
    items,
    settings,
    coverage,
    suggested,
    manualPick,
    setManualPick,
    updateItem,
    eatThis,
    pickAnother,
    markOutOfStock,
    packWorkFood,
    addItem,
    updateSettings,
  };
}
