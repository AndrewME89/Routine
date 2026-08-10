import { useMemo, useState } from "react";
import { useTasks } from "../lib/useTasks";
import { filterTasks, dueDateLabel, type TaskView } from "../lib/taskUtils";
import type { Task, TaskPriority } from "../lib/types";

const VIEWS: { id: TaskView; label: string }[] = [
  { id: "DUE_SOON", label: "Due Soon" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "NO_DATE", label: "No Date" },
  { id: "ALL", label: "All" },
  { id: "COMPLETED", label: "Completed" },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-warn",
  MEDIUM: "bg-accent",
  LOW: "bg-faint",
};

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, setStatus, removeTask, toggleSubtask, addSubtask } =
    useTasks();
  const [view, setView] = useState<TaskView>("DUE_SOON");
  const [quickTitle, setQuickTitle] = useState("");
  const [showQuickDetails, setShowQuickDetails] = useState(false);
  const [quickDue, setQuickDue] = useState("");
  const [quickPriority, setQuickPriority] = useState<TaskPriority>("MEDIUM");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const now = new Date();

  const visible = useMemo(() => filterTasks(tasks, view, now), [tasks, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const map: Partial<Record<TaskView, number>> = {};
    for (const v of VIEWS) map[v.id] = filterTasks(tasks, v.id, now).length;
    return map;
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitQuickAdd = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    await addTask({ title, dueDate: quickDue || null, priority: quickPriority });
    setQuickTitle("");
    setQuickDue("");
    setQuickPriority("MEDIUM");
    setShowQuickDetails(false);
  };

  if (loading) return <div className="p-8 text-muted">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="flex gap-2">
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuickAdd()}
            placeholder="Add a task and hit Enter…"
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-faint"
          />
          <button
            onClick={() => setShowQuickDetails((s) => !s)}
            className="px-3 py-2 rounded-lg border border-border text-sm text-muted hover:text-ink"
          >
            {showQuickDetails ? "Hide details" : "+ Details"}
          </button>
          <button
            onClick={submitQuickAdd}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-bright"
          >
            Add
          </button>
        </div>
        {showQuickDetails && (
          <div className="flex gap-3 mt-3">
            <label className="text-xs text-muted flex items-center gap-2">
              Due
              <input
                type="date"
                value={quickDue}
                onChange={(e) => setQuickDue(e.target.value)}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-muted flex items-center gap-2">
              Priority
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              view === v.id
                ? "bg-accent text-white border-accent"
                : "border-border text-muted hover:text-ink hover:border-faint"
            }`}
          >
            {v.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[v.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-sm text-muted border border-dashed border-border rounded-xl p-6 text-center">
          Nothing here right now.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              now={now}
              expanded={expandedId === task.id}
              onToggleExpand={() => setExpandedId((id) => (id === task.id ? null : task.id))}
              onSetStatus={(s) => setStatus(task.id, s)}
              onUpdate={(patch) => updateTask(task.id, patch)}
              onRemove={() => removeTask(task.id)}
              onToggleSubtask={(sid) => toggleSubtask(task.id, sid)}
              onAddSubtask={(title) => addSubtask(task.id, title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  now,
  expanded,
  onToggleExpand,
  onSetStatus,
  onUpdate,
  onRemove,
  onToggleSubtask,
  onAddSubtask,
}: {
  task: Task;
  now: Date;
  expanded: boolean;
  onToggleExpand: () => void;
  onSetStatus: (status: Task["status"]) => void;
  onUpdate: (patch: Partial<Task>) => void;
  onRemove: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onAddSubtask: (title: string) => void;
}) {
  const [newSubtask, setNewSubtask] = useState("");
  const isDone = task.status === "DONE";
  const isNotHappening = task.status === "NOT_HAPPENING";

  return (
    <div
      className={`rounded-xl border border-border bg-surface px-4 py-3 ${
        isDone || isNotHappening ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSetStatus(isDone ? "OPEN" : "DONE")}
          aria-label={isDone ? "Mark not done" : "Mark done"}
          className={`h-5 w-5 rounded-md border shrink-0 grid place-items-center transition-colors ${
            isDone ? "bg-good border-good text-base" : "border-faint hover:border-accent"
          }`}
        >
          {isDone && "✓"}
        </button>
        <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
        <button onClick={onToggleExpand} className="flex-1 text-left min-w-0">
          <div className={`text-sm ${isDone ? "line-through text-muted" : ""}`}>{task.title}</div>
          <div className="text-xs text-muted flex gap-2 flex-wrap mt-0.5">
            {task.dueDate && <span>{dueDateLabel(task.dueDate, now)}</span>}
            {isNotHappening && <span>Not happening</span>}
            {task.project && <span>· {task.project}</span>}
            {task.subtasks.length > 0 && (
              <span>
                · {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
              </span>
            )}
          </div>
        </button>
        <button
          onClick={onToggleExpand}
          className="text-xs text-muted hover:text-ink px-2 py-1"
        >
          {expanded ? "Close" : "Open"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
          <textarea
            value={task.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes…"
            rows={2}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-faint"
          />

          <div className="flex flex-wrap gap-3 text-xs">
            <label className="flex items-center gap-2 text-muted">
              Due
              <input
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-muted">
              Priority
              <select
                value={task.priority}
                onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })}
                className="bg-surface-2 border border-border rounded-lg px-2 py-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-muted">
              Project
              <input
                value={task.project ?? ""}
                onChange={(e) => onUpdate({ project: e.target.value || null })}
                placeholder="none"
                className="bg-surface-2 border border-border rounded-lg px-2 py-1 w-28"
              />
            </label>
          </div>

          <div>
            <div className="text-xs text-muted mb-1.5">Subtasks</div>
            <div className="space-y-1.5">
              {task.subtasks.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(s.id)} />
                  <span className={s.done ? "line-through text-muted" : ""}>{s.title}</span>
                </label>
              ))}
              <div className="flex gap-2">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtask.trim()) {
                      onAddSubtask(newSubtask.trim());
                      setNewSubtask("");
                    }
                  }}
                  placeholder="Add subtask…"
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm placeholder:text-faint"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap pt-1">
            <button
              onClick={() => onSetStatus("NOT_HAPPENING")}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
            >
              Not Happening
            </button>
            <button
              onClick={() => onSetStatus("OPEN")}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-ink"
            >
              Reopen
            </button>
            <button
              onClick={onRemove}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-danger ml-auto"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
