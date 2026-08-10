import { useMemo, useState } from "react";
import type { useLearningArea } from "../lib/useLearningArea";
import { RESOURCE_STATUS_LABEL } from "../lib/useLearningArea";
import type { LearningResource, ResourceStatus, ResourceType } from "../lib/types";

const RESOURCE_TYPES: ResourceType[] = [
  "DOCUMENT",
  "PDF",
  "WORKSHEET",
  "ANSWER_KEY",
  "IMAGE",
  "REFERENCE_CHART",
  "VIDEO",
  "BOOK",
  "CHEAT_SHEET",
  "COURSE",
  "WEBSITE",
  "EXTERNAL_LINK",
  "OTHER",
];

/** Shared, reusable across every learning page. Metadata-only — resources are
 * never fetched or previewed inline, only opened out via their stored URL, so
 * this stays cheap regardless of how many resources a page accumulates. */
export default function ResourceLibrary({
  learning,
  driveHint,
}: {
  learning: ReturnType<typeof useLearningArea>;
  driveHint?: { label: string; url: string };
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "ALL">("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(learning.resources.map((r) => r.category).filter(Boolean))),
    [learning.resources]
  );

  const filtered = useMemo(() => {
    return learning.resources.filter((r) => {
      if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;
      if (typeFilter !== "ALL" && r.resourceType !== typeFilter) return false;
      if (onlyFavourites && !r.favourite) return false;
      if (onlyNeedsReview && r.status !== "NEEDS_REVIEW") return false;
      return true;
    });
  }, [learning.resources, query, categoryFilter, typeFilter, onlyFavourites, onlyNeedsReview]);

  const recentlyUsed = useMemo(
    () =>
      learning.resources
        .filter((r) => r.lastOpened)
        .sort((a, b) => (b.lastOpened ?? "").localeCompare(a.lastOpened ?? ""))
        .slice(0, 3),
    [learning.resources]
  );

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wide text-muted">Resource Library</div>
        <div className="flex gap-2">
          {driveHint && (
            <a
              href={driveHint.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
            >
              {driveHint.label}
            </a>
          )}
          <button
            onClick={() => setShowAddForm((s) => !s)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-bright"
          >
            + Add Resource
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddResourceForm
          learning={learning}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {recentlyUsed.length > 0 && (
        <div className="mb-3 text-xs text-muted">
          Recently used: {recentlyUsed.map((r) => r.title).join(" · ")}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="flex-1 min-w-[8rem] bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm placeholder:text-faint"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ResourceType | "ALL")}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="ALL">All types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          onClick={() => setOnlyFavourites((v) => !v)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border ${
            onlyFavourites ? "bg-warn/20 border-warn text-warn" : "border-border text-muted"
          }`}
        >
          ★ Favourites
        </button>
        <button
          onClick={() => setOnlyNeedsReview((v) => !v)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border ${
            onlyNeedsReview ? "bg-warn/20 border-warn text-warn" : "border-border text-muted"
          }`}
        >
          Needs Review
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-muted text-center py-6 border border-dashed border-border rounded-xl">
          No resources match yet. Add one, or open the Drive folder above and copy links in.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((r) => (
            <ResourceRow key={r.id} resource={r} learning={learning} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceRow({
  resource: r,
  learning,
}: {
  resource: LearningResource;
  learning: ReturnType<typeof useLearningArea>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => learning.updateResource(r.id, { favourite: !r.favourite })}
          className={r.favourite ? "text-warn" : "text-faint hover:text-muted"}
        >
          ★
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <div className="text-sm truncate">{r.title}</div>
          <div className="text-xs text-muted">
            {r.resourceType.replace("_", " ")}
            {r.category && ` · ${r.category}`} · {RESOURCE_STATUS_LABEL[r.status]}
          </div>
        </button>
        {r.sourceURL ? (
          <a
            href={r.sourceURL}
            target="_blank"
            rel="noreferrer"
            onClick={() => learning.openResource(r.id)}
            className="text-xs px-2 py-1 rounded-lg border border-border text-muted hover:text-ink shrink-0"
          >
            Open in Drive
          </a>
        ) : (
          <span className="text-xs text-faint shrink-0">no link yet</span>
        )}
      </div>
      {open && (
        <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap gap-2 items-center text-xs">
          <input
            value={r.sourceURL}
            onChange={(e) => learning.updateResource(r.id, { sourceURL: e.target.value })}
            placeholder="Drive/external URL…"
            className="flex-1 min-w-[10rem] bg-surface-2 border border-border rounded px-2 py-1"
          />
          <select
            value={r.status}
            onChange={(e) => learning.updateResource(r.id, { status: e.target.value as ResourceStatus })}
            className="bg-surface-2 border border-border rounded px-2 py-1"
          >
            {(Object.keys(RESOURCE_STATUS_LABEL) as ResourceStatus[]).map((s) => (
              <option key={s} value={s}>
                {RESOURCE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <input
            value={r.notes}
            onChange={(e) => learning.updateResource(r.id, { notes: e.target.value })}
            placeholder="Note…"
            className="flex-1 min-w-[8rem] bg-surface-2 border border-border rounded px-2 py-1"
          />
          <button
            onClick={() => learning.removeResource(r.id)}
            className="text-muted hover:text-warn px-1"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function AddResourceForm({
  learning,
  onDone,
}: {
  learning: ReturnType<typeof useLearningArea>;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("DOCUMENT");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    await learning.addResource({
      title,
      resourceType: type,
      sourceType: url ? "GOOGLE_DRIVE" : "USER_CREATED",
      sourceURL: url,
      category,
    });
    setTitle("");
    setCategory("");
    setUrl("");
    onDone();
  };

  return (
    <div className="border border-border rounded-lg p-3 mb-3 space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Resource title…"
        className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm placeholder:text-faint"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ResourceType)}
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        >
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category…"
          className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm w-32"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Drive/external URL (optional)…"
          className="flex-1 min-w-[10rem] bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
        />
        <button
          onClick={submit}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
        >
          Add
        </button>
      </div>
    </div>
  );
}
