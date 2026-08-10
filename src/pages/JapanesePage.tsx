import { useState } from "react";
import { useJapanese, WORKSHEET_STATUS_LABEL } from "../lib/useJapanese";
import { useLearningArea, TOPIC_STATUS_LABEL } from "../lib/useLearningArea";
import type { JapaneseSkillStatus, TopicStatus, WorksheetStatus } from "../lib/types";
import {
  JAPANESE_AREAS,
  JAPANESE_DRIVE_FOLDER_URL,
  JAPANESE_PHRASE_COLLECTIONS,
  JAPANESE_PRACTICE_TYPES,
  JAPANESE_SKILLS,
} from "../lib/japaneseSeed";
import ResourceLibrary from "../components/ResourceLibrary";
import PracticeLauncher from "../components/PracticeLauncher";

const SKILL_STATUS_LABEL: Record<JapaneseSkillStatus, string> = {
  NOT_STARTED: "Not Started",
  LEARNING: "Learning",
  PRACTISING: "Practising",
  COMFORTABLE: "Comfortable",
  REVIEW: "Review",
};

export default function JapanesePage() {
  const jp = useJapanese();
  const learning = useLearningArea("JAPANESE", JAPANESE_AREAS);
  const [areaFilter, setAreaFilter] = useState<string>("ALL");

  if (jp.loading || learning.loading || !jp.settings) return <div className="p-8 text-muted">Loading…</div>;

  const topArea = (full: string) => full.split(" — ")[0];
  const areaGroups = Array.from(new Set(JAPANESE_AREAS.map(topArea)));
  const visibleTopics = learning.topics.filter((t) => areaFilter === "ALL" || topArea(t.area) === areaFilter);

  const needsReviewCount = learning.resources.filter((r) => r.status === "NEEDS_REVIEW").length;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Personal Learning · Optional / Personal Interest
        </div>
        <h1 className="text-2xl font-semibold">Japanese</h1>
        <p className="text-sm text-muted mt-1">
          Below HR Career Study in priority. Categories here organise an existing resource
          collection — they aren't a claimed formal course sequence.
        </p>
        {jp.settings.jlptSelfReported && (
          <p className="text-xs text-accent-bright mt-1">Self-recorded level: {jp.settings.jlptSelfReported}</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-muted">Learning Areas</div>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs"
              >
                <option value="ALL">All areas</option>
                {areaGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {visibleTopics.map((t) => (
                <div key={t.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5">
                  <span className="flex-1 text-sm">{t.area}</span>
                  <select
                    value={t.status}
                    onChange={(e) => learning.updateTopic(t.id, { status: e.target.value as TopicStatus })}
                    className="bg-surface-2 border border-border rounded px-2 py-1 text-xs"
                  >
                    {(Object.keys(TOPIC_STATUS_LABEL) as TopicStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {TOPIC_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-muted mb-3">Optional Phrase Collections</div>
            <p className="text-xs text-muted mb-3">
              Sourced from your Drive resources as you add them — nothing invented here when
              source material isn't available yet.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {JAPANESE_PHRASE_COLLECTIONS.map((c) => (
                <span key={c} className="text-xs px-2 py-1 rounded-lg border border-border text-muted">
                  {c}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-muted">Worksheets</div>
              <AddWorksheetForm jp={jp} />
            </div>
            {jp.worksheets.length === 0 ? (
              <div className="text-sm text-muted text-center py-4 border border-dashed border-border rounded-xl">
                No worksheets tracked yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {jp.worksheets.map((w) => (
                  <WorksheetRow key={w.id} worksheet={w} jp={jp} />
                ))}
              </div>
            )}
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-muted">Flashcards</div>
              <span className="text-xs text-faint">User-created only — no bulk extraction</span>
            </div>
            <AddFlashcardForm jp={jp} />
            {jp.flashcards.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {jp.flashcards.map((c) => (
                  <div key={c.id} className="border border-border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="text-lg">{c.front}</div>
                      <button
                        onClick={() => jp.removeFlashcard(c.id)}
                        className="text-xs text-faint hover:text-warn"
                      >
                        Delete
                      </button>
                    </div>
                    {c.reading && <div className="text-xs text-muted">{c.reading}</div>}
                    <div className="text-sm mt-1">{c.englishMeaning}</div>
                    {c.category && <div className="text-xs text-faint mt-1">{c.category}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <ResourceLibrary
            learning={learning}
            driveHint={{ label: "Open Japanese Drive folder ↗", url: JAPANESE_DRIVE_FOLDER_URL }}
          />
          {needsReviewCount > 0 && (
            <p className="text-xs text-warn -mt-3">
              {needsReviewCount} resource(s) marked Needs Review — the folder is large and may
              contain duplicates or ambiguous filenames; nothing is deleted, just flagged.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-muted mb-3">Skill Confidence</div>
            <div className="space-y-2">
              {JAPANESE_SKILLS.map((name) => {
                const skill = jp.skills.find((s) => s.skill === name);
                if (!skill) return null;
                return (
                  <div key={skill.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm">{name}</span>
                    <select
                      value={skill.status}
                      onChange={(e) => jp.setSkillStatus(skill.id, e.target.value as JapaneseSkillStatus)}
                      className="bg-surface-2 border border-border rounded px-2 py-1 text-xs"
                    >
                      {(Object.keys(SKILL_STATUS_LABEL) as JapaneseSkillStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {SKILL_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <label className="text-xs text-muted block mb-1.5">
                Self-recorded JLPT level (optional — never assumed)
              </label>
              <input
                value={jp.settings.jlptSelfReported ?? ""}
                onChange={(e) => jp.updateSettings({ jlptSelfReported: e.target.value || null })}
                placeholder="e.g. N5 — leave blank if none"
                className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm placeholder:text-faint"
              />
            </div>
          </section>

          <PracticeLauncher learning={learning} categories={JAPANESE_PRACTICE_TYPES} />
        </div>
      </div>
    </div>
  );
}

function AddWorksheetForm({ jp }: { jp: ReturnType<typeof useJapanese> }) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            jp.addWorksheet(title.trim());
            setTitle("");
          }
        }}
        placeholder="Worksheet title…"
        className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm placeholder:text-faint"
      />
    </div>
  );
}

function WorksheetRow({
  worksheet: w,
  jp,
}: {
  worksheet: import("../lib/types").JapaneseWorksheet;
  jp: ReturnType<typeof useJapanese>;
}) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 text-sm min-w-[8rem]">{w.title}</span>
        <select
          value={w.status}
          onChange={(e) => jp.updateWorksheet(w.id, { status: e.target.value as WorksheetStatus })}
          className="bg-surface-2 border border-border rounded px-2 py-1 text-xs"
        >
          {(Object.keys(WORKSHEET_STATUS_LABEL) as WorksheetStatus[]).map((s) => (
            <option key={s} value={s}>
              {WORKSHEET_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button onClick={() => jp.removeWorksheet(w.id)} className="text-xs text-faint hover:text-warn">
          Delete
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => w.worksheetURL && window.open(w.worksheetURL, "_blank")}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
        >
          Open Worksheet
        </button>
        {w.answerKeyRevealed ? (
          <button
            onClick={() => w.answerKeyURL && window.open(w.answerKeyURL, "_blank")}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-good text-good"
          >
            Open Answer Key
          </button>
        ) : (
          <button
            onClick={() => jp.updateWorksheet(w.id, { answerKeyRevealed: true })}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
          >
            Check Answer Key
          </button>
        )}
      </div>
    </div>
  );
}

function AddFlashcardForm({ jp }: { jp: ReturnType<typeof useJapanese> }) {
  const [front, setFront] = useState("");
  const [reading, setReading] = useState("");
  const [romaji, setRomaji] = useState("");
  const [meaning, setMeaning] = useState("");
  const [category, setCategory] = useState("");

  const submit = () => {
    if (!front.trim() || !meaning.trim()) return;
    jp.addFlashcard({ front, reading, romaji, englishMeaning: meaning, category });
    setFront("");
    setReading("");
    setRomaji("");
    setMeaning("");
    setCategory("");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="日本語" className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <input value={reading} onChange={(e) => setReading(e.target.value)} placeholder="reading" className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <input value={romaji} onChange={(e) => setRomaji(e.target.value)} placeholder="romaji (opt)" className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="English meaning" className="flex-1 min-w-[8rem] bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="category" className="w-28 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm" />
      <button onClick={submit} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright">
        Add
      </button>
    </div>
  );
}
