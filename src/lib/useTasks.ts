import { useCallback, useEffect, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "./types";
import { deleteTask as deleteTaskDb, loadTasks, saveTask } from "./storage";
import { genId } from "./id";

export interface NewTaskInput {
  title: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  project?: string | null;
  notes?: string;
  tags?: string[];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks().then((t) => {
      setTasks(t);
      setLoading(false);
    });
  }, []);

  const addTask = useCallback(async (input: NewTaskInput) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: genId(),
      title: input.title.trim(),
      notes: input.notes ?? "",
      status: "OPEN",
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate ?? null,
      project: input.project ?? null,
      tags: input.tags ?? [],
      subtasks: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    setTasks((prev) => [task, ...prev]);
    await saveTask(task);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
      );
      const updated = next.find((t) => t.id === id);
      if (updated) saveTask(updated);
      return next;
    });
  }, []);

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => {
      const completedAt = status === "DONE" || status === "NOT_HAPPENING" ? new Date().toISOString() : null;
      return updateTask(id, { status, completedAt });
    },
    [updateTask]
  );

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskDb(id);
  }, []);

  const toggleSubtask = useCallback(
    (id: string, subtaskId: string) => {
      setTasks((prev) => {
        const next = prev.map((t) => {
          if (t.id !== id) return t;
          const subtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, done: !s.done } : s
          );
          const updated = { ...t, subtasks, updatedAt: new Date().toISOString() };
          saveTask(updated);
          return updated;
        });
        return next;
      });
    },
    []
  );

  const addSubtask = useCallback((id: string, title: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        const updated = {
          ...t,
          subtasks: [...t.subtasks, { id: genId(), title, done: false }],
          updatedAt: new Date().toISOString(),
        };
        saveTask(updated);
        return updated;
      });
      return next;
    });
  }, []);

  return { tasks, loading, addTask, updateTask, setStatus, removeTask, toggleSubtask, addSubtask };
}
