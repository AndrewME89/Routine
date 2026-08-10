import { useEffect, useRef, useState } from "react";
import { useEscrima } from "../lib/useEscrima";
import { useLearningArea, TOPIC_STATUS_LABEL } from "../lib/useLearningArea";
import type { TrainingSkillStatus } from "../lib/types";
import {
  ESCRIMA_DRIVE_FOLDER_URL,
  ESCRIMA_FOOTWORK_CHART_SEED,
  ESCRIMA_FOUNDATIONS_PLAN,
  ESCRIMA_VIDEO_COLLECTIONS,
  ESCRIMA_WEEKLY_SCHEDULE,
} from "../lib/escrimaSeed";
import ResourceLibrary from "../components/ResourceLibrary";

const SKILL_STATUS_LABEL: Record<TrainingSkillStatus, string> = {
  NOT_STARTED: "Not Started",
  LEARNING: "Learning",
  PRACTISING: "Practising",
  COMFORTABLE: "Comfortable",
  REVIEW: "Review",
  PROFICIENT: "Proficient",
};

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function EscrimaPage() {
  const escrima = useEscrima();
  const learning = useLearningArea("ESCRIMA", []);
  const [seededCharts, setSeededCharts] = useState(false);
  const [justLogged, setJustLogged] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState(15);
  const [showCustom, setShowCustom] = useState(false);

  const footworkLabRef = useRef<HTMLDivElement>(null);
  const videoLibRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const sessionHistoryRef = useRef<HTMLDivElement>(null);

  // Seed the named Footwork Lab charts once, same additive pattern as
  // elsewhere — real Drive links get filled in per-resource when handy.
  useEffect(() => {
    if (learning.loading || seededCharts) return;
    const alreadySeeded = learning.resources.some((r) => r.category === "Footwork Lab");
    if (alreadySeeded) {
      setSeededCharts(true);
      return;
    }
    setSeededCharts(true);
    for (const name of ESCRIMA_FOOTWORK_CHART_SEED) {
      learning.addResource({
        title: name,
        resourceType: "REFERENCE_CHART",
        sourceType: "GOOGLE_DRIVE",
        sourceURL: ESCRIMA_DRIVE_FOLDER_URL,
        category: "Footwork Lab",
        notes: "Starter link points at the Arnis Drive folder — edit in the exact file link when handy.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learning.loading, learning.resources.length]);

  if (escrima.loading || learning.loading) return <div className="p-8 text-muted">Loading…</div>;

  const footworkCharts = learning.resources.filter((r) => r.category === "Footwork Lab");
  const videos = learning.resources.filter((r) => r.resourceType === "VIDEO");
  const otherResources = learning.resources.filter(
    (r) => r.category !== "Footwork Lab" && r.resourceType !== "VIDEO"
  );

  const logCustom = async () => {
    const s = await escrima.trainNow(customMinutes);
    setJustLogged(`${customMinutes} min logged — ${escrima.buildSuggestion(customMinutes)}`);
    setShowCustom(false);
    setTimeout(() => setJustLogged(null), 5000);
    void s;
  };

  const log = async (minutes: number) => {
    await escrima.trainNow(minutes);
    setJustLogged(`${minutes} min logged — ${escrima.buildSuggestion(minutes)}`);
    setTimeout(() => setJustLogged(null), 5000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Physical Training · Important Personal Training
        </div>
        <h1 className="text-2xl font-semibold">Escrima / Arnis / Kali</h1>
        <p className="text-sm text-muted mt-1">Filipino Martial Arts — also searchable as Kali or FMA.</p>
      </div>

      <div className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-5 mb-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-muted mb-1">Next Training</div>
            <div className="text-sm font-medium">
              {escrima.todaysScheduleSlot
                ? `${escrima.todaysScheduleSlot.label} ${escrima.todaysScheduleSlot.time}`
                : nextScheduleLabel()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Current Focus</div>
            <div className="text-sm font-medium">{escrima.skillNeedingReview?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">This Week</div>
            <div className="text-sm font-medium">{escrima.thisWeekSessionCount} session(s)</div>
          </div>
        </div>

        <div className="text-xs uppercase tracking-wide text-muted mb-2">Train Now</div>
        <div className="flex gap-2 flex-wrap">
          {[5, 10, 20, 30].map((m) => (
            <button
              key={m}
              onClick={() => log(m)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:border-accent hover:text-ink"
            >
              {m} MIN
            </button>
          ))}
          <button
            onClick={() => setShowCustom((s) => !s)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:border-accent hover:text-ink"
          >
            CUSTOM
          </button>
        </div>
        {showCustom && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              min={1}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
            />
            <span className="text-sm text-muted">min</span>
            <button
              onClick={logCustom}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
            >
              Log
            </button>
          </div>
        )}
        {justLogged && <div className="text-xs text-good mt-3">✓ {justLogged}</div>}

        <div className="flex gap-3 flex-wrap mt-4 pt-4 border-t border-border/60 text-xs">
          <button onClick={() => scrollTo(footworkLabRef)} className="text-muted hover:text-ink underline decoration-dotted">
            Footwork Lab
          </button>
          <button onClick={() => scrollTo(videoLibRef)} className="text-muted hover:text-ink underline decoration-dotted">
            Video Library
          </button>
          <button onClick={() => scrollTo(resourcesRef)} className="text-muted hover:text-ink underline decoration-dotted">
            Resources
          </button>
          <button onClick={() => scrollTo(sessionHistoryRef)} className="text-muted hover:text-ink underline decoration-dotted">
            Session History
          </button>
        </div>
      </div>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Curriculum Progress</div>
        <div className="space-y-3">
          {Array.from(escrima.skillsByArea.entries()).map(([area, skills]) => (
            <AreaBlock key={area} area={area} skills={skills} escrima={escrima} />
          ))}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Optional Foundations Plan (4-Day)</div>
        <p className="text-xs text-muted mb-3">
          Doesn't replace your current weekly schedule below — an optional structured program.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ESCRIMA_FOUNDATIONS_PLAN.map((d) => (
            <div key={d.day} className="border border-border rounded-lg p-3">
              <div className="text-xs text-accent-bright font-medium">{d.day}</div>
              <div className="text-sm font-medium">{d.title}</div>
              <div className="text-xs text-muted mt-1">{d.focus}</div>
              <div className="text-xs text-faint mt-1">Typical duration: {d.duration}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Weekly Schedule</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ESCRIMA_WEEKLY_SCHEDULE.map((s) => (
            <div key={s.weekday} className="border border-border rounded-lg p-3">
              <div className="text-sm font-medium">
                {s.label} · {s.time}
              </div>
              <div className="text-xs text-muted mt-1">{s.focus}</div>
            </div>
          ))}
        </div>
      </section>

      <div ref={footworkLabRef} className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-accent-bright mb-3">Footwork Lab</div>
        <p className="text-sm text-muted mb-3">
          Visual reference charts. Each may link to its curriculum skill via its notes field.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {footworkCharts.map((r) => (
            <a
              key={r.id}
              href={r.sourceURL || undefined}
              target="_blank"
              rel="noreferrer"
              onClick={() => learning.openResource(r.id)}
              className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm hover:border-accent"
            >
              <span>{r.title}</span>
              <span className="text-xs text-muted">Open ↗</span>
            </a>
          ))}
        </div>
      </div>

      <div ref={videoLibRef} className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Video Library</div>
        <p className="text-xs text-muted mb-3">
          Suggested collection categories (use these when adding a video, for consistent
          filtering): {ESCRIMA_VIDEO_COLLECTIONS.join(" · ")}
        </p>
        {videos.length === 0 ? (
          <div className="text-sm text-muted text-center py-4 border border-dashed border-border rounded-xl">
            No videos added yet — use Resources below (type: Video) to add them. Metadata only;
            nothing autoplays or loads until opened.
          </div>
        ) : (
          <div className="space-y-1.5">
            {videos.map((v) => (
              <div key={v.id} className="border border-border rounded-lg px-3 py-2 text-sm flex justify-between">
                <span>{v.title}</span>
                <span className="text-xs text-muted">{v.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={resourcesRef}>
        <ResourceLibrary
          learning={{ ...learning, resources: otherResources }}
          driveHint={{ label: "Open Arnis/Escrima/Kali Drive folder ↗", url: ESCRIMA_DRIVE_FOLDER_URL }}
        />
        <p className="text-xs text-faint mt-2">
          Importing the Self-Training Plan spreadsheet? Prices and external-site availability may
          be old — label them "Source list / verify externally" in the note field rather than
          current pricing.
        </p>
      </div>

      <div ref={sessionHistoryRef} className="bg-surface border border-border rounded-2xl p-5 mt-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Recent Sessions</div>
        {escrima.sessions.length === 0 ? (
          <div className="text-sm text-muted">No sessions logged yet.</div>
        ) : (
          <div className="space-y-1.5">
            {escrima.sessions.slice(0, 8).map((s) => (
              <div key={s.id} className="text-sm flex justify-between border-b border-border/60 pb-1.5">
                <span>{new Date(s.dateTime).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} · {s.actualFocus}</span>
                <span className="text-muted">{s.durationMinutes} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function scrollTo(ref: React.RefObject<HTMLDivElement>) {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function nextScheduleLabel(): string {
  const today = new Date().getDay();
  const days = ESCRIMA_WEEKLY_SCHEDULE.map((s) => s.weekday);
  const upcoming = days.filter((d) => d > today).sort((a, b) => a - b)[0] ?? Math.min(...days);
  const slot = ESCRIMA_WEEKLY_SCHEDULE.find((s) => s.weekday === upcoming)!;
  return `${WEEKDAY_NAMES[slot.weekday]} ${slot.time}`;
}

function AreaBlock({
  area,
  skills,
  escrima,
}: {
  area: string;
  skills: ReturnType<typeof useEscrima>["skills"];
  escrima: ReturnType<typeof useEscrima>;
}) {
  const [open, setOpen] = useState(false);
  const proficient = skills.filter((s) => s.status === "PROFICIENT" || s.status === "COMFORTABLE").length;

  return (
    <div className="border border-border rounded-xl p-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 text-left">
        <span className="flex-1 text-sm font-medium">{area}</span>
        <span className="text-xs text-muted">
          {proficient}/{skills.length} comfortable+
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-1.5">
          {skills.map((s) => (
            <div key={s.id} className="border border-border/60 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex-1 text-sm min-w-[8rem]">
                  {s.subarea && <span className="text-faint">{s.subarea} · </span>}
                  {s.name}
                </span>
                <select
                  value={s.status}
                  onChange={(e) => escrima.updateSkill(s.id, { status: e.target.value as TrainingSkillStatus })}
                  className="bg-surface-2 border border-border rounded px-2 py-1 text-xs"
                >
                  {(Object.keys(SKILL_STATUS_LABEL) as TrainingSkillStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {SKILL_STATUS_LABEL[st]}
                    </option>
                  ))}
                </select>
                <label className="text-xs text-muted flex items-center gap-1">
                  Confidence
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={s.confidence}
                    onChange={(e) => escrima.updateSkill(s.id, { confidence: Number(e.target.value) })}
                    className="w-10 bg-surface-2 border border-border rounded px-1 py-0.5"
                  />
                </label>
              </div>
              {s.timesPractised > 0 && (
                <div className="text-xs text-faint mt-1">
                  Practised {s.timesPractised}× · last {s.lastPractised}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
