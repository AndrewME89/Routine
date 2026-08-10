import type {
  AppSettings,
  DashboardMode,
  ResolvedOccurrence,
  RoutineOccurrence,
  RoutineStepDef,
} from "./types";
import { minutesToTime, resolveClockAnchor, rosterForOperationalDay, timeToMinutes } from "./operationalDay";

export const DEFAULT_ROUTINE_STEPS: RoutineStepDef[] = [
  {
    id: "wake",
    label: "Wake",
    phase: "POST_WAKE",
    anchor: { type: "CLOCK", time: "18:30" },
    appliesOn: "ALL",
    chainNext: "post_wake_meal",
  },
  {
    id: "post_wake_meal",
    label: "Post-Wake Meal",
    phase: "POST_WAKE",
    anchor: { type: "CLOCK", time: "19:00" },
    appliesOn: "ALL",
    chainNext: "feed_koda_evening",
    note: "Default: one chilled meal from the rotation.",
  },
  {
    id: "feed_koda_evening",
    label: "Feed Koda",
    phase: "POST_WAKE",
    anchor: { type: "CLOCK", time: "19:30" },
    appliesOn: "ALL",
    chainNext: "prepare_work_food",
  },
  {
    id: "prepare_work_food",
    label: "Prepare Work Food & Mocha Mix",
    phase: "PRE_WORK",
    anchor: { type: "CLOCK", time: "20:15" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "shower",
    note: "Wrap, snack set, mocha mix — expand for the individual checklist.",
  },
  {
    id: "shower",
    label: "Shower",
    phase: "PRE_WORK",
    anchor: { type: "CLOCK", time: "20:40" },
    appliesOn: "ALL",
    chainNext: "get_ready",
  },
  {
    id: "get_ready",
    label: "Get Ready for Work",
    phase: "PRE_WORK",
    anchor: { type: "CLOCK", time: "21:00" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "leave_for_work",
  },
  {
    id: "leave_for_work",
    label: "Leave for Work",
    phase: "PRE_WORK",
    anchor: { type: "CLOCK", time: "21:20" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "travel_to_work",
  },
  {
    id: "travel_to_work",
    label: "Travel: Home → Work",
    phase: "PRE_WORK",
    anchor: { type: "CLOCK", time: "21:30" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "work",
  },
  {
    id: "work",
    label: "Work",
    phase: "WORK",
    anchor: { type: "ROSTER_WORK_START" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "travel_home",
    note: "Start/end come from the roster in Settings, not a fixed time here.",
  },
  {
    id: "travel_home",
    label: "Travel: Work → Home",
    phase: "POST_SHIFT",
    anchor: { type: "ROSTER_WORK_END" },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "get_home",
    approximate: true,
  },
  {
    id: "get_home",
    label: "Get Home",
    phase: "POST_SHIFT",
    anchor: { type: "ROSTER_WORK_END_OFFSET", minutes: 90 },
    appliesOn: "WORK_NIGHT_ONLY",
    chainNext: "feed_koda_morning",
    approximate: true,
    note: "Estimated from shift end + commute. Adjust with Move Later if it's off.",
  },
  {
    id: "feed_koda_morning",
    label: "Feed Koda",
    phase: "POST_SHIFT",
    anchor: { type: "CLOCK", time: "08:45" },
    appliesOn: "ALL",
    chainNext: "pre_sleep_snack",
  },
  {
    id: "pre_sleep_snack",
    label: "Pre-Sleep Snack",
    phase: "PRE_SLEEP",
    anchor: { type: "CLOCK", time: "10:00" },
    appliesOn: "ALL",
    chainNext: "sleep",
  },
  {
    id: "sleep",
    label: "Sleep",
    phase: "PRE_SLEEP",
    anchor: { type: "CLOCK", time: "10:30" },
    appliesOn: "ALL",
  },
];

function stepApplies(step: RoutineStepDef, mode: DashboardMode): boolean {
  if (step.appliesOn === "ALL") return true;
  if (step.appliesOn === "WORK_NIGHT_ONLY") return mode === "WORK_NIGHT";
  if (step.appliesOn === "RDO_ONLY") return mode === "RDO";
  return true;
}

function resolveAnchorTime(
  step: RoutineStepDef,
  settings: AppSettings,
  operationalDay: string
): Date {
  const roster = rosterForOperationalDay(settings, operationalDay);
  switch (step.anchor.type) {
    case "CLOCK":
      return resolveClockAnchor(operationalDay, step.anchor.time, settings.wakeTime);
    case "ROSTER_WORK_START":
      return resolveClockAnchor(operationalDay, roster.startTime, settings.wakeTime);
    case "ROSTER_WORK_END":
      return resolveClockAnchor(operationalDay, roster.endTime, settings.wakeTime);
    case "ROSTER_WORK_END_OFFSET": {
      const endAnchor = resolveClockAnchor(operationalDay, roster.endTime, settings.wakeTime);
      return new Date(endAnchor.getTime() + step.anchor.minutes * 60000);
    }
  }
}

function defaultOccurrence(operationalDay: string, stepId: string): RoutineOccurrence {
  return {
    id: `${operationalDay}:${stepId}`,
    operationalDay,
    stepId,
    status: "PENDING",
    updatedAt: new Date(0).toISOString(),
  };
}

export function resolveDay(
  settings: AppSettings,
  operationalDay: string,
  mode: DashboardMode,
  existingOccurrences: RoutineOccurrence[],
  steps: RoutineStepDef[] = DEFAULT_ROUTINE_STEPS
): ResolvedOccurrence[] {
  const byStepId = new Map(existingOccurrences.map((o) => [o.stepId, o]));
  const list = steps.filter((step) => stepApplies(step, mode)).map((step) => {
    const occurrence = byStepId.get(step.id) ?? defaultOccurrence(operationalDay, step.id);
    const scheduledAt = resolveAnchorTime(step, settings, operationalDay);
    return { occurrence, step, scheduledAt };
  });
  return list.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export interface NowNext {
  now: ResolvedOccurrence | null;
  next: ResolvedOccurrence | null;
}

/** "Now" is the most recent step whose time has arrived and isn't resolved yet
 * (done/skipped/not-happening all clear it); "Next" is whatever comes after. */
export function computeNowNext(resolved: ResolvedOccurrence[], now: Date): NowNext {
  const pending = resolved.filter((r) => r.occurrence.status === "PENDING" || r.occurrence.status === "MOVED_LATER");
  let current: ResolvedOccurrence | null = null;
  let upcoming: ResolvedOccurrence | null = null;
  for (const item of pending) {
    if (item.scheduledAt.getTime() <= now.getTime()) {
      current = item;
    } else if (!upcoming) {
      upcoming = item;
      break;
    }
  }
  return { now: current, next: upcoming };
}

export function minutesUntil(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

export { timeToMinutes, minutesToTime };
