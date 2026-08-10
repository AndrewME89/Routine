import { useEffect, useState } from "react";
import { useLearningArea, TOPIC_STATUS_LABEL } from "../lib/useLearningArea";
import type { TopicStatus } from "../lib/types";
import { loadAuslanPreferences, saveAuslanPreferences } from "../lib/storage";
import type { AuslanPreferences, DominantHand, RegionalVariation } from "../lib/types";
import {
  AUSLAN_AREAS,
  AUSLAN_DRIVE_FOLDER_URL,
  AUSLAN_PRACTICE_CATEGORIES,
  AUSLAN_REFERENCE_NOTES,
  AUSLAN_RESOURCE_SEED,
  AUSLAN_SOURCE_PRIORITY,
} from "../lib/auslanSeed";
import ResourceLibrary from "../components/ResourceLibrary";
import PracticeLauncher from "../components/PracticeLauncher";

export default function AuslanPage() {
  const learning = useLearningArea("AUSLAN", AUSLAN_AREAS);
  const [prefs, setPrefs] = useState<AuslanPreferences | null>(null);
  const [seededResources, setSeededResources] = useState(false);

  useEffect(() => {
    loadAuslanPreferences().then(setPrefs);
  }, []);

  // Seed the two specifically-named reference resources once, if the
  // resource library is otherwise empty — same additive pattern as modules.
  useEffect(() => {
    if (learning.loading || seededResources || learning.resources.length > 0) return;
    setSeededResources(true);
    for (const r of AUSLAN_RESOURCE_SEED) {
      learning.addResource({
        title: r.title,
        resourceType: r.resourceType,
        sourceType: "GOOGLE_DRIVE",
        sourceURL: AUSLAN_DRIVE_FOLDER_URL,
        category: r.category,
        notes: "Starter link points at the Auslan Drive folder — edit in the exact file link when handy.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learning.loading, learning.resources.length]);

  const updatePrefs = (patch: Partial<AuslanPreferences>) => {
    setPrefs((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveAuslanPreferences(next);
      return next;
    });
  };

  if (learning.loading || !prefs) return <div className="p-8 text-muted">Loading…</div>;

  const fingerspellingResources = learning.resources.filter((r) => r.category === "Fingerspelling");

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Personal Learning · Optional
        </div>
        <h1 className="text-2xl font-semibold">Auslan</h1>
        <p className="text-sm text-muted mt-1">
          Below HR Career Study in priority. A navigator, tracker and resource library — not a
          replacement for the Student Book's visual material.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-muted mb-3">
              About Auslan &amp; this page
            </div>
            <ul className="space-y-1.5 text-sm text-muted">
              {AUSLAN_REFERENCE_NOTES.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <div className="text-xs text-faint mt-3">
              Source priority: {AUSLAN_SOURCE_PRIORITY.join(" → ")}. The Gemini Chat Auslan Tutor
              export is kept archive/historical only, if shown at all — it isn't used as
              authoritative sign-language data.
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-accent-bright mb-3">
              Fingerspelling
            </div>
            <p className="text-sm text-muted mb-3">
              The alphabet and fingerspelling poster are the prominent starting reference.
            </p>
            <div className="space-y-2">
              {fingerspellingResources.map((r) => (
                <a
                  key={r.id}
                  href={r.sourceURL || undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => learning.openResource(r.id)}
                  className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm hover:border-accent"
                >
                  <span>{r.title}</span>
                  <span className="text-xs text-muted">Open Fingerspelling Resource ↗</span>
                </a>
              ))}
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-muted mb-3">Learning Areas</div>
            <div className="space-y-2">
              {learning.topics
                .sort((a, b) => AUSLAN_AREAS.indexOf(a.area) - AUSLAN_AREAS.indexOf(b.area))
                .map((t) => (
                  <div key={t.id} className="border border-border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{t.area}</span>
                      <select
                        value={t.status}
                        onChange={(e) =>
                          learning.updateTopic(t.id, { status: e.target.value as TopicStatus })
                        }
                        className="bg-surface-2 border border-border rounded px-2 py-1 text-xs"
                      >
                        {(Object.keys(TOPIC_STATUS_LABEL) as TopicStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {TOPIC_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
            </div>
            <p className="text-xs text-faint mt-3">
              Complete means "worked through", not fluency — Auslan learning leans on video and
              visual material this page can link to but not replace.
            </p>
          </section>

          <ResourceLibrary
            learning={learning}
            driveHint={{ label: "Open Auslan Drive folder ↗", url: AUSLAN_DRIVE_FOLDER_URL }}
          />
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-muted mb-3">Preferences</div>
            <label className="text-sm block mb-3">
              <span className="block text-muted mb-1.5">Dominant Signing Hand</span>
              <div className="flex gap-1.5">
                {(["RIGHT", "LEFT", "UNSPECIFIED"] as DominantHand[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => updatePrefs({ dominantHand: h })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs border ${
                      prefs.dominantHand === h
                        ? "bg-accent text-white border-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    {h === "UNSPECIFIED" ? "Unspecified" : h.charAt(0) + h.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </label>
            <label className="text-sm block">
              <span className="block text-muted mb-1.5">Regional Variation</span>
              <div className="flex gap-1.5">
                {(["SOUTHERN", "NORTHERN", "UNSURE"] as RegionalVariation[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => updatePrefs({ regionalVariation: v })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs border ${
                      prefs.regionalVariation === v
                        ? "bg-accent text-white border-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    {v.charAt(0) + v.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </label>
            <p className="text-xs text-faint mt-3">
              Defaults to Southern/Victorian since AndrewOS is set for Melbourne — freely editable,
              neither variation is presented as universally correct.
            </p>
          </section>

          <PracticeLauncher learning={learning} categories={AUSLAN_PRACTICE_CATEGORIES} />
        </div>
      </div>
    </div>
  );
}
