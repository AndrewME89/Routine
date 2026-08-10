import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSettings, DashboardMode, OccurrenceStatus, RoutineOccurrence, RoutineStepDef } from "./types";
import { loadSettings, saveSettings, loadOccurrencesForDay, saveOccurrence, loadRoutineSteps, seedRoutineStepsIfEmpty } from "./storage";
import { detectDashboardMode, operationalDayForInstant } from "./operationalDay";
import { resolveDay, DEFAULT_ROUTINE_STEPS } from "./routineEngine";

export function useAppData() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [now, setNow] = useState(new Date());
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [steps, setSteps] = useState<RoutineStepDef[]>([]);
  const [loading, setLoading] = useState(true);

  // Tick once a minute — enough to keep Now/Next honest without busywork.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      await seedRoutineStepsIfEmpty(DEFAULT_ROUTINE_STEPS);
      const [s, st] = await Promise.all([loadSettings(), loadRoutineSteps()]);
      setSettings(s);
      setSteps(st);
      setLoading(false);
    })();
  }, []);

  const operationalDay = useMemo(() => {
    if (!settings) return null;
    return operationalDayForInstant(now, settings.wakeTime);
  }, [settings, now]);

  useEffect(() => {
    if (!operationalDay) return;
    loadOccurrencesForDay(operationalDay).then(setOccurrences);
  }, [operationalDay]);

  const mode: DashboardMode | null = useMemo(() => {
    if (!settings || !operationalDay) return null;
    return detectDashboardMode(settings, operationalDay);
  }, [settings, operationalDay]);

  const resolved = useMemo(() => {
    if (!settings || !operationalDay || !mode || steps.length === 0) return [];
    return resolveDay(settings, operationalDay, mode, occurrences, steps);
  }, [settings, operationalDay, mode, occurrences, steps]);

  const setStatus = useCallback(
    async (stepId: string, status: OccurrenceStatus) => {
      if (!operationalDay) return;
      const record: RoutineOccurrence = {
        id: `${operationalDay}:${stepId}`,
        operationalDay,
        stepId,
        status,
        updatedAt: new Date().toISOString(),
      };
      // Optimistic: reflect it locally immediately, persist right after.
      setOccurrences((prev) => {
        const next = prev.filter((o) => o.stepId !== stepId);
        next.push(record);
        return next;
      });
      await saveOccurrence(record);
    },
    [operationalDay]
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, now, operationalDay, mode, resolved, steps, loading, setStatus, updateSettings };
}
