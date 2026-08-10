// Weekday indices follow JS Date convention: 0 = Sunday ... 6 = Saturday.
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface RosterDay {
  weekday: Weekday;
  label: string;
  isRDO: boolean;
  /** 24h "HH:MM", only meaningful when isRDO is false */
  startTime: string;
  /** 24h "HH:MM", may be "earlier" than startTime because the shift crosses midnight */
  endTime: string;
}

export type DashboardMode = "NORMAL" | "WORK_NIGHT" | "RDO" | "EXHAUSTED";

export interface AppSettings {
  timezone: string;
  /** 24h "HH:MM" — the operational day starts here */
  wakeTime: string;
  /** 24h "HH:MM" — shown for reference; sleep itself isn't scheduled as an action */
  sleepTime: string;
  roster: RosterDay[];
  /** null = auto-detect from roster; otherwise the user has pinned a mode */
  modeOverride: DashboardMode | null;
}

export type StepAnchor =
  | { type: "CLOCK"; time: string } // fixed clock time, e.g. "19:00"
  | { type: "ROSTER_WORK_START" }
  | { type: "ROSTER_WORK_END" }
  | { type: "ROSTER_WORK_END_OFFSET"; minutes: number }; // e.g. "get home" ~ end + 90min

export type StepAppliesOn = "ALL" | "WORK_NIGHT_ONLY" | "RDO_ONLY";

export interface RoutineStepDef {
  id: string;
  label: string;
  phase: "POST_WAKE" | "PRE_WORK" | "WORK" | "POST_SHIFT" | "PRE_SLEEP";
  anchor: StepAnchor;
  appliesOn: StepAppliesOn;
  /** id of the step this one hands off to, purely informational for the Now/Next chain */
  chainNext?: string;
  /** true if the scheduled time is a derived estimate, not a fixed commitment */
  approximate?: boolean;
  note?: string;
}

export type OccurrenceStatus =
  | "PENDING"
  | "DONE"
  | "MOVED_LATER"
  | "SKIPPED_TODAY"
  | "NOT_HAPPENING";

export interface RoutineOccurrence {
  /** `${operationalDay}:${stepId}` */
  id: string;
  operationalDay: string; // "YYYY-MM-DD", the calendar date the operational day began
  stepId: string;
  status: OccurrenceStatus;
  /** ISO timestamp, set whenever status last changed */
  updatedAt: string;
}

export interface ResolvedOccurrence {
  occurrence: RoutineOccurrence;
  step: RoutineStepDef;
  scheduledAt: Date;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "NOT_HAPPENING";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** "YYYY-MM-DD" or null for someday/no date */
  dueDate: string | null;
  project: string | null;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
