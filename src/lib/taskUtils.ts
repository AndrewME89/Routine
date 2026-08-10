import type { Task } from "./types";
import { dateKey } from "./operationalDay";

export type TaskView = "DUE_SOON" | "UPCOMING" | "NO_DATE" | "ALL" | "COMPLETED";

const DUE_SOON_WINDOW_DAYS = 3;

function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

export function filterTasks(tasks: Task[], view: TaskView, now: Date): Task[] {
  const today = dateKey(now);
  const active = tasks.filter((t) => t.status !== "DONE" && t.status !== "NOT_HAPPENING");

  switch (view) {
    case "COMPLETED":
      return tasks
        .filter((t) => t.status === "DONE" || t.status === "NOT_HAPPENING")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    case "NO_DATE":
      return active.filter((t) => !t.dueDate);
    case "DUE_SOON":
      // Includes anything due today or earlier, plus the next few days —
      // shown together, neutrally, rather than splitting out "overdue".
      return active
        .filter((t) => t.dueDate && daysBetween(today, t.dueDate) <= DUE_SOON_WINDOW_DAYS)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    case "UPCOMING":
      return active
        .filter((t) => t.dueDate && daysBetween(today, t.dueDate) > DUE_SOON_WINDOW_DAYS)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    case "ALL":
    default:
      return active.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  }
}

/** Plain, neutral date framing — never "X days overdue". */
export function dueDateLabel(dueDate: string, now: Date): string {
  const today = dateKey(now);
  const diff = daysBetween(today, dueDate);
  const [y, mo, da] = dueDate.split("-").map(Number);
  const d = new Date(y, mo - 1, da);
  const formatted = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  if (diff === 0) return `Due today · ${formatted}`;
  if (diff === 1) return `Due tomorrow · ${formatted}`;
  if (diff === -1) return `Was due yesterday · ${formatted}`;
  if (diff < 0) return `Was due ${formatted}`;
  return `Due ${formatted}`;
}
