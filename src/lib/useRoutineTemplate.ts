import { useCallback, useEffect, useMemo, useState } from "react";
import type { RoutineOccurrence, RoutineStepDef, StepAppliesOn } from "./types";
import {
  deleteRoutineStep,
  loadAllOccurrences,
  loadRoutineSteps,
  saveRoutineStep,
  seedRoutineStepsIfEmpty,
} from "./storage";
import { DEFAULT_ROUTINE_STEPS } from "./routineEngine";
import { genId } from "./id";

export interface NewStepInput {
  label: string;
  time: string; // "HH:MM", CLOCK anchor only — custom steps can't derive from the roster
  phase: RoutineStepDef["phase"];
  appliesOn: StepAppliesOn;
  note?: string;
}

export function useRoutineTemplate() {
  const [steps, setSteps] = useState<RoutineStepDef[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedRoutineStepsIfEmpty(DEFAULT_ROUTINE_STEPS);
      const [st, occ] = await Promise.all([loadRoutineSteps(), loadAllOccurrences()]);
      setSteps(st);
      setOccurrences(occ);
      setLoading(false);
    })();
  }, []);

  const addStep = useCallback(async (input: NewStepInput) => {
    const step: RoutineStepDef = {
      id: genId(),
      label: input.label.trim(),
      phase: input.phase,
      anchor: { type: "CLOCK", time: input.time },
      appliesOn: input.appliesOn,
      note: input.note,
    };
    setSteps((prev) => [...prev, step]);
    await saveRoutineStep(step);
    return step;
  }, []);

  const updateStep = useCallback(async (id: string, patch: Partial<RoutineStepDef>) => {
    setSteps((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const updated = next.find((s) => s.id === id);
      if (updated) saveRoutineStep(updated);
      return next;
    });
  }, []);

  const removeStep = useCallback(async (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    await deleteRoutineStep(id);
  }, []);

  /** Last N operational days that have at least one recorded action —
   * only ever counts what was actually actioned, never "missed" steps,
   * since untouched PENDING steps aren't persisted at all. */
  const recentHistory = useMemo(() => {
    const byDay = new Map<string, RoutineOccurrence[]>();
    for (const o of occurrences) {
      const list = byDay.get(o.operationalDay) ?? [];
      list.push(o);
      byDay.set(o.operationalDay, list);
    }
    return Array.from(byDay.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14)
      .map(([day, list]) => ({
        day,
        done: list.filter((o) => o.status === "DONE").length,
        total: list.length,
      }));
  }, [occurrences]);

  return { loading, steps, addStep, updateStep, removeStep, recentHistory };
}
