import { useState } from "react";
import { useRoutineTemplate } from "../lib/useRoutineTemplate";
import type { RoutineStepDef, StepAppliesOn } from "../lib/types";
import { formatDayLabel } from "../lib/operationalDay";

const PHASE_LABELS: Record<RoutineStepDef["phase"], string> = {
  POST_WAKE: "Post-Wake",
  PRE_WORK: "Pre-Work",
  WORK: "Work",
  POST_SHIFT: "Post-Shift",
  PRE_SLEEP: "Pre-Sleep",
};

const APPLIES_ON_LABEL: Record<StepAppliesOn, string> = {
  ALL: "Every day",
  WORK_NIGHT_ONLY: "Work Night only",
  RDO_ONLY: "RDO only",
};

export default function RoutinesPage() {
  const rt = useRoutineTemplate();
  const [showAdd, setShowAdd] = useState(false);

  if (rt.loading) return <div className="p-8 text-muted">Loading…</div>;

  const grouped = rt.steps.reduce<Record<string, RoutineStepDef[]>>((acc, step) => {
    (acc[step.phase] ??= []).push(step);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Routines</h1>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
        >
          + Add Step
        </button>
      </div>
      <p className="text-sm text-muted mb-6">
        This is the template Today generates from. Edit times, add your own steps, or retire ones
        you don't use — changes apply from your next operational day onward.
      </p>

      {showAdd && <AddStepForm rt={rt} onDone={() => setShowAdd(false)} />}

      <div className="space-y-6">
        {(Object.keys(PHASE_LABELS) as RoutineStepDef["phase"][]).map((phase) => {
          const steps = grouped[phase];
          if (!steps || steps.length === 0) return null;
          return (
            <div key={phase}>
              <div className="text-xs uppercase tracking-wide text-muted mb-2">{PHASE_LABELS[phase]}</div>
              <div className="space-y-2">
                {steps.map((step) => (
                  <StepRow key={step.id} step={step} rt={rt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section className="bg-surface border border-border rounded-2xl p-5 mt-8">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Recent Activity</div>
        <p className="text-xs text-muted mb-3">
          Only shows steps you've actually actioned (Done, Moved, Skipped, Not Happening) —
          untouched steps aren't counted as missed here.
        </p>
        {rt.recentHistory.length === 0 ? (
          <div className="text-sm text-muted">No actions recorded yet.</div>
        ) : (
          <div className="space-y-1.5">
            {rt.recentHistory.map((h) => (
              <div key={h.day} className="flex justify-between text-sm border-b border-border/60 pb-1.5">
                <span>{formatDayLabel(h.day)}</span>
                <span className="text-muted">
                  {h.done}/{h.total} done
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StepRow({ step, rt }: { step: RoutineStepDef; rt: ReturnType<typeof useRoutineTemplate> }) {
  const anchor = step.anchor;
  const isClock = anchor.type === "CLOCK";
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg px-3 py-2.5 bg-surface">
      <div className="flex items-center gap-3">
        <div className="w-16 font-mono text-sm text-muted shrink-0">
          {anchor.type === "CLOCK" ? anchor.time : "roster"}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left text-sm min-w-0">
          {step.label}
        </button>
        <span className="text-xs text-faint shrink-0">{APPLIES_ON_LABEL[step.appliesOn]}</span>
      </div>
      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap gap-2 items-center">
          <input
            value={step.label}
            onChange={(e) => rt.updateStep(step.id, { label: e.target.value })}
            className="flex-1 min-w-[8rem] bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm"
          />
          {anchor.type === "CLOCK" ? (
            <input
              type="time"
              value={anchor.time}
              onChange={(e) => rt.updateStep(step.id, { anchor: { type: "CLOCK", time: e.target.value } })}
              className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm font-mono"
            />
          ) : (
            <span className="text-xs text-faint px-2">Derived from roster — edit in Settings</span>
          )}
          <select
            value={step.appliesOn}
            onChange={(e) => rt.updateStep(step.id, { appliesOn: e.target.value as StepAppliesOn })}
            className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm"
          >
            {(Object.keys(APPLIES_ON_LABEL) as StepAppliesOn[]).map((a) => (
              <option key={a} value={a}>
                {APPLIES_ON_LABEL[a]}
              </option>
            ))}
          </select>
          <button
            onClick={() => rt.removeStep(step.id)}
            className="text-xs text-muted hover:text-danger px-2 ml-auto"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function AddStepForm({ rt, onDone }: { rt: ReturnType<typeof useRoutineTemplate>; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("19:00");
  const [phase, setPhase] = useState<RoutineStepDef["phase"]>("POST_WAKE");
  const [appliesOn, setAppliesOn] = useState<StepAppliesOn>("ALL");

  const submit = async () => {
    if (!label.trim()) return;
    await rt.addStep({ label, time, phase, appliesOn });
    setLabel("");
    onDone();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 mb-6 space-y-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Step name…"
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-faint"
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        />
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as RoutineStepDef["phase"])}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          {(Object.keys(PHASE_LABELS) as RoutineStepDef["phase"][]).map((p) => (
            <option key={p} value={p}>
              {PHASE_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          value={appliesOn}
          onChange={(e) => setAppliesOn(e.target.value as StepAppliesOn)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          {(Object.keys(APPLIES_ON_LABEL) as StepAppliesOn[]).map((a) => (
            <option key={a} value={a}>
              {APPLIES_ON_LABEL[a]}
            </option>
          ))}
        </select>
        <button
          onClick={submit}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright ml-auto"
        >
          Add
        </button>
      </div>
    </div>
  );
}
