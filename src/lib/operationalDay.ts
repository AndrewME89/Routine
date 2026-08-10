import type { AppSettings, DashboardMode, RosterDay, Weekday } from "./types";

/** "HH:MM" -> minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const m = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Which operational day a given instant belongs to, as a "YYYY-MM-DD" key —
 * the calendar date the operational day BEGAN, not the date currently showing
 * on the clock. 02:00 Friday belongs to Thursday's operational day whenever
 * Thursday's shift started at/after wakeTime.
 */
export function operationalDayForInstant(instant: Date, wakeTime: string): string {
  const nowMinutes = instant.getHours() * 60 + instant.getMinutes();
  const wakeMinutes = timeToMinutes(wakeTime);
  if (nowMinutes >= wakeMinutes) {
    return dateKey(instant);
  }
  return dateKey(addDays(instant, -1));
}

/** The actual Date/time that a clock-time anchor (e.g. "19:00") falls on,
 * given which operational day it belongs to and where the wake boundary is.
 * Clock times at/after wakeTime land on the operational day's own date;
 * clock times before wakeTime land on the following calendar date. */
export function resolveClockAnchor(operationalDay: string, clockTime: string, wakeTime: string): Date {
  const [y, mo, da] = operationalDay.split("-").map(Number);
  const base = new Date(y, mo - 1, da);
  const belongsToNextDate = timeToMinutes(clockTime) < timeToMinutes(wakeTime);
  const target = belongsToNextDate ? addDays(base, 1) : base;
  const [h, m] = clockTime.split(":").map(Number);
  target.setHours(h, m, 0, 0);
  return target;
}

export function rosterForOperationalDay(settings: AppSettings, operationalDay: string): RosterDay {
  const [y, mo, da] = operationalDay.split("-").map(Number);
  const weekday = new Date(y, mo - 1, da).getDay() as Weekday;
  const found = settings.roster.find((r) => r.weekday === weekday);
  return found ?? settings.roster[0];
}

export function detectDashboardMode(settings: AppSettings, operationalDay: string): DashboardMode {
  if (settings.modeOverride) return settings.modeOverride;
  const roster = rosterForOperationalDay(settings, operationalDay);
  return roster.isRDO ? "RDO" : "WORK_NIGHT";
}

export function formatDayLabel(operationalDay: string): string {
  const [y, mo, da] = operationalDay.split("-").map(Number);
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function weekdayName(operationalDay: string): string {
  const [y, mo, da] = operationalDay.split("-").map(Number);
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString("en-AU", { weekday: "long" });
}
