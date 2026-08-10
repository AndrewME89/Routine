import { useState } from "react";
import type { useLearningArea } from "../lib/useLearningArea";

export default function PracticeLauncher({
  learning,
  categories,
}: {
  learning: ReturnType<typeof useLearningArea>;
  categories: string[];
}) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [customMinutes, setCustomMinutes] = useState(15);
  const [showCustom, setShowCustom] = useState(false);
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const log = async (minutes: number) => {
    await learning.logSession(minutes, category, category);
    setJustLogged(`${minutes} min · ${category} logged`);
    setShowCustom(false);
    setTimeout(() => setJustLogged(null), 3000);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wide text-muted mb-3">Practice</div>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm mb-3"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="flex gap-2 flex-wrap">
        {[5, 10, 20].map((m) => (
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
            onClick={() => log(customMinutes)}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
          >
            Log
          </button>
        </div>
      )}
      {justLogged && <div className="text-xs text-good mt-3">✓ {justLogged}</div>}
      {learning.sessions.length > 0 && (
        <div className="text-xs text-muted mt-4 pt-3 border-t border-border/60">
          Last session:{" "}
          {new Date(learning.sessions[0].dateTime).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          })}{" "}
          · {learning.sessions[0].durationMinutes} min · {learning.sessions[0].focus}
        </div>
      )}
    </div>
  );
}
