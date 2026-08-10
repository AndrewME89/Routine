import type { AppSettings, RosterDay, Weekday } from "./types";

const DAY_LABELS: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// Placeholder roster only — every day defaults to RDO until you set your own
// shift times in Settings. Nothing about your real schedule lives in source
// code; it's stored in this browser's IndexedDB the moment you edit it.
const DEFAULT_ROSTER: RosterDay[] = ([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((weekday) => ({
  weekday,
  label: DAY_LABELS[weekday],
  isRDO: true,
  startTime: "23:00",
  endTime: "07:00",
}));

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: "Australia/Melbourne",
  wakeTime: "18:30",
  sleepTime: "10:30",
  roster: DEFAULT_ROSTER,
  modeOverride: null,
};
