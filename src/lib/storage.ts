import type { AppSettings, RoutineOccurrence, Task } from "./types";
import { DEFAULT_SETTINGS } from "./defaultSettings";

const DB_NAME = "nightshift-os";
// Bumping this only ever ADDS object stores in onupgradeneeded — existing
// stores and their data are left alone, so this is a safe, additive
// migration, not a reset.
const DB_VERSION = 2;
const STORE_SETTINGS = "settings";
const STORE_OCCURRENCES = "occurrences";
const STORE_TASKS = "tasks";
const SETTINGS_KEY = "app";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORE_OCCURRENCES)) {
        const store = db.createObjectStore(STORE_OCCURRENCES, { keyPath: "id" });
        store.createIndex("byOperationalDay", "operationalDay");
      }
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const store = db.createObjectStore(STORE_TASKS, { keyPath: "id" });
        store.createIndex("byStatus", "status");
        store.createIndex("byDueDate", "dueDate");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const req = fn(tx.objectStore(storeName));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await withStore<AppSettings | undefined>(
      STORE_SETTINGS,
      "readonly",
      (s) => s.get(SETTINGS_KEY)
    );
    if (!stored) return DEFAULT_SETTINGS;
    // Merge over defaults so new fields introduced later don't crash old saves.
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await withStore(STORE_SETTINGS, "readwrite", (s) => s.put(settings, SETTINGS_KEY));
}

export async function loadOccurrencesForDay(
  operationalDay: string
): Promise<RoutineOccurrence[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OCCURRENCES, "readonly");
    const idx = tx.objectStore(STORE_OCCURRENCES).index("byOperationalDay");
    const req = idx.getAll(IDBKeyRange.only(operationalDay));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveOccurrence(occurrence: RoutineOccurrence): Promise<void> {
  await withStore(STORE_OCCURRENCES, "readwrite", (s) => s.put(occurrence));
}

export async function loadTasks(): Promise<Task[]> {
  return getAllFromStore<Task>(STORE_TASKS);
}

export async function saveTask(task: Task): Promise<void> {
  await withStore(STORE_TASKS, "readwrite", (s) => s.put(task));
}

export async function deleteTask(id: string): Promise<void> {
  await withStore(STORE_TASKS, "readwrite", (s) => s.delete(id));
}

/** Full local backup — everything the app knows, in one downloadable file. */
export async function exportAll(): Promise<{
  exportedAt: string;
  settings: AppSettings;
  occurrences: RoutineOccurrence[];
  tasks: Task[];
}> {
  const settings = await loadSettings();
  const occurrences = await getAllFromStore<RoutineOccurrence>(STORE_OCCURRENCES);
  const tasks = await getAllFromStore<Task>(STORE_TASKS);
  return { exportedAt: new Date().toISOString(), settings, occurrences, tasks };
}
