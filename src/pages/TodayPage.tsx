import type { useAppData } from "../lib/useAppData";
import type { DashboardMode, OccurrenceStatus, ResolvedOccurrence } from "../lib/types";
import { computeNowNext, minutesUntil } from "../lib/routineEngine";
import { formatDayLabel, weekdayName } from "../lib/operationalDay";

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
    return <div className="p-8 text-muted">Loading…</div>;
  }

  const { now: nowStep, next: nextStep } = computeNowNext(resolved, now);

  const grouped = resolved.reduce<Record<string, ResolvedOccurrence[]>>((acc, item) => {
    (acc[item.step.phase] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted mb-1">
            Operational Day · {weekdayName(operationalDay).slice(0, 3).toUpperCase()}
          </div>
          <h1 className="text-2xl font-semibold">Today</h1>
        </div>
        <div className="text-right font-mono">
          <div className="text-lg">{timeLabel(now)}</div>
          <div className="text-xs text-muted">{formatDayLabel(operationalDay)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Dashboard Mode</div>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => updateSettings({ modeOverride: m.id })}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                mode === m.id
                  ? "bg-accent text-white border-accent"
                  : "border-border text-muted hover:text-ink hover:border-faint"
              }`}
            >
              {m.label}
            </button>
          ))}
          {settings.modeOverride && (
            <button
              onClick={() => updateSettings({ modeOverride: null })}
              className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-ink underline decoration-dotted"
            >
              Back to auto (from roster)
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Now &amp; Next</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-faint mb-1">NOW</div>
            {nowStep ? (
              <>
                <div className="text-lg font-semibold">{nowStep.step.label}</div>
                <div className="text-sm text-muted font-mono">{timeLabel(nowStep.scheduledAt)}</div>
              </>
            ) : (
              <div className="text-sm text-muted">Nothing due yet.</div>
            )}
          </div>
          <div>
            <div className="text-xs text-faint mb-1">NEXT</div>
            {nextStep ? (
              <>
                <div className="text-lg font-semibold">{nextStep.step.label}</div>
                <div className="text-sm text-muted font-mono">
                  {timeLabel(nextStep.scheduledAt)} · in {minutesUntil(nextStep.scheduledAt, now)} min
                </div>
              </>
            ) : (
              <div className="text-sm text-muted">Nothing else scheduled.</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([phase, items]) => (
          <div key={phase}>
            <div className="text-xs uppercase tracking-wide text-muted mb-2">
              {PHASE_LABELS[phase as ResolvedOccurrence["step"]["phase"]]}
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
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
        resolved ? "border-border/60 bg-surface/40 opacity-60" : "border-border bg-surface"
      }`}
    >
      <div className="w-16 font-mono text-sm text-muted shrink-0">
        {timeLabel(scheduledAt)}
        {step.approximate && <span className="text-faint">~</span>}
      </div>
      <div className="flex-1 min-w-[10rem]">
        <div className="text-sm font-medium">{step.label}</div>
        {step.note && <div className="text-xs text-muted">{step.note}</div>}
        {occurrence.status !== "PENDING" && (
          <div className="text-xs text-accent-bright mt-0.5">{STATUS_LABEL[occurrence.status]}</div>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_ACTIONS.map((a) => (
          <button
            key={a.status}
            onClick={() => onSetStatus(a.status)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              occurrence.status === a.status
                ? "bg-accent text-white border-accent"
                : "border-border text-muted hover:text-ink hover:border-faint"
            }`}
          >
            {a.label}
          </button>
        ))}
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
