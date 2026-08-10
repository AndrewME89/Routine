import type { useAppData } from "../lib/useAppData";
import type { DashboardMode, OccurrenceStatus, ResolvedOccurrence } from "../lib/types";
import { computeNowNext, minutesUntil } from "../lib/routineEngine";
import { formatDayLabel, weekdayName } from "../lib/operationalDay";
import FoodCard from "../components/FoodCard";

const MODES: { id: DashboardMode; label: string }[] = [
  { id: "NORMAL", label: "Normal" },
  { id: "WORK_NIGHT", label: "Work Night" },
  { id: "RDO", label: "RDO" },
  { id: "EXHAUSTED", label: "I'm Exhausted" },
];

const PHASE_LABELS: Record<ResolvedOccurrence["step"]["phase"], string> = {
  POST_WAKE: "Post-Wake",
  PRE_WORK: "Pre-Work",
  WORK: "Work",
  POST_SHIFT: "Post-Shift",
  PRE_SLEEP: "Pre-Sleep",
};

function timeLabel(d: Date) {
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const STATUS_ACTIONS: { status: OccurrenceStatus; label: string }[] = [
  { status: "DONE", label: "Done" },
  { status: "MOVED_LATER", label: "Move Later" },
  { status: "SKIPPED_TODAY", label: "Skip Today" },
  { status: "NOT_HAPPENING", label: "Not Happening" },
];

export default function TodayPage({ data }: { data: ReturnType<typeof useAppData> }) {
  const { settings, now, operationalDay, mode, resolved, loading, setStatus, updateSettings } = data;

  if (loading || !settings || !operationalDay || !mode) {
    return (
      <div className="mx-auto max-w-[1180px] p-5 md:p-8 lg:p-10">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  const { now: nowStep, next: nextStep } = computeNowNext(resolved, now);

  const grouped = resolved.reduce<Record<string, ResolvedOccurrence[]>>((acc, item) => {
    (acc[item.step.phase] ??= []).push(item);
    return acc;
  }, {});

  const pendingCount = resolved.filter((item) => item.occurrence.status === "PENDING").length;
  const doneCount = resolved.filter((item) => item.occurrence.status === "DONE").length;

  return (
    <div className="mx-auto w-full max-w-[1180px] p-5 pb-12 md:p-8 md:pb-14 lg:p-10">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Operational Day
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
              {weekdayName(operationalDay)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink md:text-[2.15rem]">Today</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
            Your current shift-day plan, surfaced in the order you actually need it.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 shadow-panel sm:min-w-[205px] sm:justify-end">
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <div className="font-mono text-xl font-medium tracking-[-0.04em] text-ink">{timeLabel(now)}</div>
            <div className="mt-0.5 text-[11px] text-muted">{formatDayLabel(operationalDay)}</div>
          </div>
        </div>
      </header>

      <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Dashboard Mode</div>
            <div className="mt-1 text-sm text-muted">Tune the day without rewriting your roster.</div>
          </div>
          {settings.modeOverride && (
            <button
              onClick={() => updateSettings({ modeOverride: null })}
              className="self-start rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:border-faint hover:text-ink sm:self-auto"
            >
              Back to roster auto
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:flex sm:flex-wrap sm:p-4 md:px-5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => updateSettings({ modeOverride: m.id })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                mode === m.id
                  ? "border-accent bg-accent text-white shadow-[0_8px_24px_rgba(155,135,245,0.18)]"
                  : "border-border bg-surface-2 text-muted hover:border-faint hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-2 shadow-panel">
        <div className="pointer-events-none absolute -right-14 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Now &amp; Next</div>
              <div className="mt-1 text-sm text-muted">The only two things that deserve your attention right now.</div>
            </div>
            <div className="hidden gap-2 sm:flex">
              <span className="rounded-md border border-border bg-base/30 px-2 py-1 font-mono text-[10px] text-muted">
                {pendingCount} pending
              </span>
              <span className="rounded-md border border-border bg-base/30 px-2 py-1 font-mono text-[10px] text-good">
                {doneCount} done
              </span>
            </div>
          </div>
        </div>

        <div className="relative grid md:grid-cols-2">
          <NowNextCard
            label="NOW"
            title={nowStep?.step.label ?? "Nothing due yet"}
            meta={nowStep ? timeLabel(nowStep.scheduledAt) : "You’re clear for the moment."}
            active
          />
          <NowNextCard
            label="NEXT"
            title={nextStep?.step.label ?? "Nothing else scheduled"}
            meta={
              nextStep
                ? `${timeLabel(nextStep.scheduledAt)} · in ${minutesUntil(nextStep.scheduledAt, now)} min`
                : "No more scheduled steps today."
            }
          />
        </div>
      </section>

      <div className="[&>section]:shadow-panel">
        <FoodCard mode={mode} />
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Timeline</div>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">Routine chain</h2>
          </div>
          <div className="font-mono text-[11px] text-muted">{resolved.length} steps</div>
        </div>

        <div className="space-y-7">
          {Object.entries(grouped).map(([phase, items]) => (
            <div key={phase}>
              <div className="mb-2.5 flex items-center gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {PHASE_LABELS[phase as ResolvedOccurrence["step"]["phase"]]}
                </div>
                <div className="h-px flex-1 bg-border" />
                <div className="font-mono text-[10px] text-faint">{items.length}</div>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <RoutineRow
                    key={item.step.id}
                    item={item}
                    onSetStatus={(status) => setStatus(item.step.id, status)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NowNextCard({
  label,
  title,
  meta,
  active = false,
}: {
  label: string;
  title: string;
  meta: string;
  active?: boolean;
}) {
  return (
    <div className={`min-h-[142px] px-5 py-5 md:px-6 ${active ? "md:border-r md:border-border" : ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-cyan"}`} />
        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-faint">{label}</span>
      </div>
      <div className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</div>
      <div className="mt-1.5 font-mono text-xs text-muted">{meta}</div>
    </div>
  );
}

function RoutineRow({
  item,
  onSetStatus,
}: {
  item: ResolvedOccurrence;
  onSetStatus: (status: OccurrenceStatus) => void;
}) {
  const { step, occurrence, scheduledAt } = item;
  const resolved = occurrence.status !== "PENDING";

  return (
    <div
      className={`group rounded-xl border px-3.5 py-3 transition-colors sm:px-4 ${
        resolved
          ? "border-border/70 bg-surface/45"
          : "border-border bg-surface hover:border-faint"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex w-[62px] shrink-0 items-center gap-2 pt-0.5 font-mono text-xs text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${resolved ? "bg-faint" : "bg-accent"}`} />
            <span>
              {timeLabel(scheduledAt)}
              {step.approximate && <span className="text-faint">~</span>}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-medium ${resolved ? "text-muted" : "text-ink"}`}>{step.label}</div>
            {step.note && <div className="mt-0.5 text-xs leading-5 text-muted">{step.note}</div>}
            {resolved && (
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-bright">
                {STATUS_LABEL[occurrence.status]}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pl-[74px] lg:pl-0">
          {STATUS_ACTIONS.map((action) => (
            <button
              key={action.status}
              onClick={() => onSetStatus(action.status)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
                occurrence.status === action.status
                  ? "border-accent bg-accent/15 text-accent-bright"
                  : "border-border bg-surface-2 text-muted hover:border-faint hover:text-ink"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<OccurrenceStatus, string> = {
  PENDING: "",
  DONE: "✓ Done",
  MOVED_LATER: "Moved later",
  SKIPPED_TODAY: "Skipped today",
  NOT_HAPPENING: "Not happening",
};
