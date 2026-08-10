import { useState } from "react";
import { useHrStudy } from "../lib/useHrStudy";
import type { HrAssessmentStatus, HrModule, HrModuleStatus } from "../lib/types";
import {
  ASSESSMENT_HELPER_SEED,
  GLOSSARY_SEED,
  HR_COURSE_TOTALS,
  LEGISLATION_SEED,
  PROVIDER_RECOMMENDED_WEEKLY_HOURS,
} from "../lib/hrSeed";

const MODULE_STATUS_LABEL: Record<HrModuleStatus, string> = {
  LOCKED: "Locked / Future",
  AVAILABLE: "Available",
  ACTIVE: "Active",
  ASSESSMENTS_SUBMITTED: "Assessments Submitted",
  AWAITING_RESULT: "Awaiting Result",
  COMPETENT: "Competent",
  NOT_YET_COMPETENT: "Changes Required",
};

const MODULE_STATUS_STYLE: Record<HrModuleStatus, string> = {
  LOCKED: "text-faint",
  AVAILABLE: "text-muted",
  ACTIVE: "text-accent-bright",
  ASSESSMENTS_SUBMITTED: "text-good",
  AWAITING_RESULT: "text-warn",
  COMPETENT: "text-good",
  NOT_YET_COMPETENT: "text-warn",
};

const ASSESSMENT_STATUS_LABEL: Record<HrAssessmentStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  AWAITING_FEEDBACK: "Awaiting Feedback",
  COMPETENT: "Competent",
  CHANGES_REQUIRED: "Changes Required",
};

type Tab = "current" | "modules" | "reference" | "setup";

export default function HrStudyPage() {
  const hr = useHrStudy();
  const [tab, setTab] = useState<Tab>("current");

  if (hr.loading || !hr.courseSettings) return <div className="p-8 text-muted">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-accent-bright font-medium mb-1">
          Career-Critical
        </div>
        <h1 className="text-2xl font-semibold">Certificate IV — Human Resource Management</h1>
        <p className="text-sm text-muted mt-1">
          Swinburne Open Education · {HR_COURSE_TOTALS.modules} modules ·{" "}
          {HR_COURSE_TOTALS.assessments} listed assessments · {HR_COURSE_TOTALS.indicativeHours}{" "}
          indicative hours (editable course metadata, not fixed)
        </p>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {([
          ["current", "Current Module"],
          ["modules", "All Modules"],
          ["reference", "Reference"],
          ["setup", "Course Setup"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === id
                ? "bg-accent text-white border-accent"
                : "border-border text-muted hover:text-ink hover:border-faint"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "current" && <CurrentModuleTab hr={hr} />}
      {tab === "modules" && <AllModulesTab hr={hr} />}
      {tab === "reference" && <ReferenceTab hr={hr} />}
      {tab === "setup" && <SetupTab hr={hr} />}
    </div>
  );
}

function CurrentModuleTab({ hr }: { hr: ReturnType<typeof useHrStudy> }) {
  const active = hr.activeModule;

  if (!active) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-sm text-muted mb-3">
          No module is marked Active yet. AndrewOS won't guess — pick which module Swinburne
          currently has unlocked for you.
        </div>
        <ModulePicker hr={hr} />
      </div>
    );
  }

  const assessments = hr.moduleAssessments(active.id);
  const [newAssessment, setNewAssessment] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-5">
        <div className="text-xs text-muted mb-1">
          {active.unitCode ?? "No unit code supplied"} · Module {active.order} of{" "}
          {HR_COURSE_TOTALS.modules}
        </div>
        <h2 className="text-lg font-semibold mb-4">{active.title}</h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <ProgressField
            label="Topics"
            completed={active.topicsCompleted}
            total={active.topicsTotal}
            onChange={(completed, total) => hr.updateModule(active.id, { topicsCompleted: completed, topicsTotal: total })}
          />
          <ProgressField
            label="Activities"
            completed={active.activitiesCompleted}
            total={active.activitiesTotal}
            onChange={(completed, total) => hr.updateModule(active.id, { activitiesCompleted: completed, activitiesTotal: total })}
          />
        </div>

        <div className="text-sm text-muted mb-1">
          Assessments: {assessments.filter((a) => a.status === "SUBMITTED" || a.status === "COMPETENT").length} /{" "}
          {active.assessmentsPlanned} planned submitted
        </div>

        <textarea
          value={active.notes}
          onChange={(e) => hr.updateModule(active.id, { notes: e.target.value })}
          placeholder="Notes — where you stopped, what you remember completing…"
          rows={2}
          className="w-full mt-3 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-faint"
        />

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => hr.updateModule(active.id, { lastStudied: new Date().toISOString().slice(0, 10) })}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
          >
            Study Now
          </button>
          <button
            onClick={() => hr.unlockNext(active.id)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-ink"
          >
            All assessments submitted — unlock next module
          </button>
          <select
            value={active.status}
            onChange={(e) => hr.setModuleStatus(active.id, e.target.value as HrModuleStatus)}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-sm ml-auto"
          >
            {(Object.keys(MODULE_STATUS_LABEL) as HrModuleStatus[]).map((s) => (
              <option key={s} value={s}>
                {MODULE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {active.lastStudied && (
          <div className="text-xs text-muted mt-2">Last studied: {active.lastStudied}</div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Assessments</div>
        <div className="space-y-2 mb-3">
          {assessments.length === 0 && (
            <div className="text-sm text-muted">No assessments added for this module yet.</div>
          )}
          {assessments.map((a) => (
            <div key={a.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm flex-1 min-w-[8rem]">{a.title}</span>
                <select
                  value={a.status}
                  onChange={(e) => hr.setAssessmentStatus(a.id, e.target.value as HrAssessmentStatus)}
                  className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs"
                >
                  {(Object.keys(ASSESSMENT_STATUS_LABEL) as HrAssessmentStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {ASSESSMENT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => hr.removeAssessment(a.id)}
                  className="text-xs text-muted hover:text-warn px-1"
                >
                  Delete
                </button>
              </div>
              {a.submittedDate && (
                <div className="text-xs text-muted mt-1">Submitted {a.submittedDate} · attempt {a.attemptNumber}</div>
              )}
              {a.status === "CHANGES_REQUIRED" ? (
                <input
                  value={a.feedbackNotes}
                  onChange={(e) => hr.updateAssessment(a.id, { feedbackNotes: e.target.value })}
                  placeholder="What changes are required…"
                  className="w-full mt-2 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs placeholder:text-faint"
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAssessment}
            onChange={(e) => setNewAssessment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newAssessment.trim()) {
                hr.addAssessment(active.id, newAssessment.trim());
                setNewAssessment("");
              }
            }}
            placeholder="Add assessment name from the actual module…"
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-faint"
          />
        </div>
        <p className="text-xs text-faint mt-2">
          Assessment type defaults to Unknown until the real assessment specifies one — nothing here is assumed.
        </p>
      </div>

      <div className="bg-surface/60 border border-border rounded-2xl p-4">
        <button
          className="text-sm text-muted hover:text-ink"
          onClick={() => {
            const el = document.getElementById("future-modules");
            el?.classList.toggle("hidden");
          }}
        >
          Upcoming / Future Modules ▾
        </button>
        <div id="future-modules" className="hidden mt-3 space-y-1.5">
          {hr.modules
            .filter((m) => m.order > active.order)
            .map((m) => (
              <div key={m.id} className="text-sm text-faint flex justify-between">
                <span>
                  {m.order}. {m.unitCode ?? "—"} {m.title}
                </span>
                <span>Locked / Future</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function ProgressField({
  label,
  completed,
  total,
  onChange,
}: {
  label: string;
  completed: number;
  total: number;
  onChange: (completed: number, total: number) => void;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <input
          type="number"
          min={0}
          value={completed}
          onChange={(e) => onChange(Number(e.target.value), total)}
          className="w-14 bg-surface-2 border border-border rounded px-1.5 py-1 text-xs"
        />
        <span className="text-muted">/</span>
        <input
          type="number"
          min={0}
          value={total}
          onChange={(e) => onChange(completed, Number(e.target.value))}
          className="w-14 bg-surface-2 border border-border rounded px-1.5 py-1 text-xs"
        />
      </div>
    </div>
  );
}

function ModulePicker({ hr }: { hr: ReturnType<typeof useHrStudy> }) {
  return (
    <div className="space-y-1.5">
      {hr.modules.map((m) => (
        <button
          key={m.id}
          onClick={() => {
            hr.chooseActiveModule(m.id);
            hr.updateCourseSettings({ setupComplete: true });
          }}
          className="w-full text-left text-sm border border-border rounded-lg px-3 py-2 hover:border-accent hover:bg-accent/10"
        >
          {m.order}. {m.unitCode ?? "—"} — {m.title}
        </button>
      ))}
    </div>
  );
}

function AllModulesTab({ hr }: { hr: ReturnType<typeof useHrStudy> }) {
  return (
    <div className="space-y-2">
      {hr.modules.map((m) => (
        <ModuleRow key={m.id} module={m} hr={hr} />
      ))}
      <div className="text-xs text-muted pt-2">
        Course totals: {HR_COURSE_TOTALS.modules} modules · {HR_COURSE_TOTALS.assessments} listed
        assessments · {HR_COURSE_TOTALS.indicativeHours} indicative hours. Metadata remains
        editable and may change with course material.
      </div>
    </div>
  );
}

function ModuleRow({ module: m, hr }: { module: HrModule; hr: ReturnType<typeof useHrStudy> }) {
  const [open, setOpen] = useState(false);
  const isFuture = m.status === "LOCKED";

  return (
    <div className={`border border-border rounded-xl p-4 ${isFuture ? "opacity-60" : "bg-surface"}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 text-left">
        <span className="h-7 w-7 shrink-0 rounded-full bg-surface-2 grid place-items-center text-xs font-mono">
          {m.order}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{m.unitCode ?? "N/A"}</div>
          <div className="text-sm">{m.title}</div>
          <div className="text-xs text-muted">
            {m.assessmentsPlanned} assessment(s) · {m.indicativeHours} indicative hours
          </div>
        </div>
        <span className={`text-xs font-medium ${MODULE_STATUS_STYLE[m.status]}`}>
          {MODULE_STATUS_LABEL[m.status]}
        </span>
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-3 items-center">
          <label className="text-xs text-muted flex items-center gap-2">
            Assessments planned
            <input
              type="number"
              value={m.assessmentsPlanned}
              onChange={(e) => hr.updateModule(m.id, { assessmentsPlanned: Number(e.target.value) })}
              className="w-14 bg-surface-2 border border-border rounded px-1.5 py-1"
            />
          </label>
          <label className="text-xs text-muted flex items-center gap-2">
            Indicative hours
            <input
              type="number"
              value={m.indicativeHours}
              onChange={(e) => hr.updateModule(m.id, { indicativeHours: Number(e.target.value) })}
              className="w-16 bg-surface-2 border border-border rounded px-1.5 py-1"
            />
          </label>
          {m.status !== "ACTIVE" && !isFuture && (
            <button
              onClick={() => hr.chooseActiveModule(m.id)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink ml-auto"
            >
              Make this the active module
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReferenceTab({ hr }: { hr: ReturnType<typeof useHrStudy> }) {
  const noteFor = (id: string) => hr.referenceNotes.find((n) => n.id === id) ?? { favourite: false, note: "" };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Legislation</div>
        <div className="space-y-2">
          {LEGISLATION_SEED.map((l) => {
            const n = noteFor(l.id);
            return (
              <div key={l.id} className="border border-border rounded-lg p-3 flex gap-3 items-start">
                <button
                  onClick={() => hr.setReferenceNote(l.id, { favourite: !n.favourite })}
                  className={n.favourite ? "text-warn" : "text-faint hover:text-muted"}
                >
                  ★
                </button>
                <div className="flex-1">
                  <div className="text-sm">{l.name}</div>
                  <input
                    value={n.note}
                    onChange={(e) => hr.setReferenceNote(l.id, { note: e.target.value })}
                    placeholder="Note (which module/assessment this relates to)…"
                    className="w-full mt-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs placeholder:text-faint"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Glossary</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {GLOSSARY_SEED.map((g) => {
            const n = noteFor(g.id);
            return (
              <div key={g.id} className="border border-border rounded-lg p-3 flex gap-2 items-start">
                <button
                  onClick={() => hr.setReferenceNote(g.id, { favourite: !n.favourite })}
                  className={n.favourite ? "text-warn" : "text-faint hover:text-muted"}
                >
                  ★
                </button>
                <div className="text-sm">{g.term}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Assessment Helper — command verbs</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {ASSESSMENT_HELPER_SEED.map((t) => (
            <div key={t.id} className="border border-border rounded-lg p-3">
              <div className="text-sm font-medium">{t.term}</div>
              <div className="text-xs text-muted mt-0.5">{t.meaning}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupTab({ hr }: { hr: ReturnType<typeof useHrStudy> }) {
  const cs = hr.courseSettings!;
  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-4">Enrolment</div>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block text-muted mb-1">Enrolment start</span>
            <input
              type="date"
              value={cs.enrolmentStartDate ?? ""}
              onChange={(e) => hr.updateCourseSettings({ enrolmentStartDate: e.target.value || null })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="block text-muted mb-1">Course expiry</span>
            <input
              type="date"
              value={cs.enrolmentEndDate ?? ""}
              onChange={(e) => hr.updateCourseSettings({ enrolmentEndDate: e.target.value || null })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-xs text-muted mt-3">
          Handbook reference — verify with Student Services before making financial decisions:
          course extension fee $50/month, maximum extension 6 months. Not added to Money
          automatically.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-4">Study pace</div>
        <div className="text-sm text-muted mb-2">
          Swinburne indicative pace: {PROVIDER_RECOMMENDED_WEEKLY_HOURS.min}–
          {PROVIDER_RECOMMENDED_WEEKLY_HOURS.max} h/week (provider guidance, not a forced target)
        </div>
        <label className="text-sm flex items-center gap-2">
          Your current target
          <input
            type="number"
            min={0}
            value={cs.weeklyStudyTargetHours ?? ""}
            onChange={(e) =>
              hr.updateCourseSettings({
                weeklyStudyTargetHours: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="hours/week"
            className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5"
          />
        </label>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">
          Structured Workplace Learning &amp; Assessment
        </div>
        <p className="text-sm text-muted mb-3">
          Does your HR qualification show an SWLA requirement? This hasn't been confirmed either
          way — AndrewOS won't assume.
        </p>
        <div className="flex gap-2">
          {(["YES", "NO", "UNSURE"] as const).map((v) => (
            <button
              key={v}
              onClick={() => hr.updateCourseSettings({ swlaStatus: v })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                cs.swlaStatus === v
                  ? "bg-accent text-white border-accent"
                  : "border-border text-muted hover:text-ink"
              }`}
            >
              {v === "YES" ? "Yes" : v === "NO" ? "No" : "Unsure"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Support contacts</div>
        <div className="text-sm mb-3">
          <div className="font-medium">Student Services</div>
          <div className="text-muted">studentservices@swinburneopen.edu.au</div>
          <div className="text-xs text-muted mt-1">
            Enrolment, extensions, payments, platform/login issues, reasonable adjustment,
            deferral — administrative, not academic.
          </div>
        </div>
        <div className="text-sm">
          <div className="font-medium">Trainer / Assessor</div>
          <div className="text-xs text-muted mt-1">
            Contact via the learning platform's message centre for course content, learning, and
            assessment questions/feedback.
          </div>
        </div>
      </div>

      <div className="text-xs text-faint">
        Assessment attempt policy: the supplied sources disagree (two free reassessments with a
        possible fee from the 4th attempt, vs. "up to three resubmissions without penalty").
        Verify the current allowance with Swinburne — this tracker won't resolve that silently.
      </div>
    </div>
  );
}
