import type {
  AppSettings,
  HrAssessment,
  HrCourseSettings,
  HrModule,
  HrReferenceNote,
  RoutineOccurrence,
  Task,
} from "./types";
import { DEFAULT_SETTINGS } from "./defaultSettings";

const DB_NAME = "nightshift-os";
// Bumping this only ever ADDS object stores in onupgradeneeded — existing
// stores and their data are left alone, so this is a safe, additive
// migration, not a reset.
const DB_VERSION = 3;
const STORE_SETTINGS = "settings";
const STORE_OCCURRENCES = "occurrences";
const STORE_TASKS = "tasks";
const STORE_HR_MODULES = "hr_modules";
const STORE_HR_ASSESSMENTS = "hr_assessments";
const STORE_HR_COURSE_SETTINGS = "hr_course_settings";
const STORE_HR_REFERENCE_NOTES = "hr_reference_notes";
const SETTINGS_KEY = "app";
const HR_COURSE_SETTINGS_KEY = "hr";

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
      if (!db.objectStoreNames.contains(STORE_HR_MODULES)) {
        db.createObjectStore(STORE_HR_MODULES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_HR_ASSESSMENTS)) {
        const store = db.createObjectStore(STORE_HR_ASSESSMENTS, { keyPath: "id" });
        store.createIndex("byModuleId", "moduleId");
      }
      if (!db.objectStoreNames.contains(STORE_HR_COURSE_SETTINGS)) {
        db.createObjectStore(STORE_HR_COURSE_SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORE_HR_REFERENCE_NOTES)) {
        db.createObjectStore(STORE_HR_REFERENCE_NOTES, { keyPath: "id" });
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

async function putAllIfEmpty<T>(storeName: string, rows: T[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        for (const row of rows) store.put(row);
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
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

// --- HR Study -----------------------------------------------------------

export async function seedHrModulesIfEmpty(modules: HrModule[]): Promise<void> {
  await putAllIfEmpty(STORE_HR_MODULES, modules);
}

export async function loadHrModules(): Promise<HrModule[]> {
  const rows = await getAllFromStore<HrModule>(STORE_HR_MODULES);
  return rows.sort((a, b) => a.order - b.order);
}

export async function saveHrModule(module: HrModule): Promise<void> {
  await withStore(STORE_HR_MODULES, "readwrite", (s) => s.put(module));
}

export async function loadHrAssessments(): Promise<HrAssessment[]> {
  return getAllFromStore<HrAssessment>(STORE_HR_ASSESSMENTS);
}

export async function saveHrAssessment(assessment: HrAssessment): Promise<void> {
  await withStore(STORE_HR_ASSESSMENTS, "readwrite", (s) => s.put(assessment));
}

export async function deleteHrAssessment(id: string): Promise<void> {
  await withStore(STORE_HR_ASSESSMENTS, "readwrite", (s) => s.delete(id));
}

const DEFAULT_HR_COURSE_SETTINGS: HrCourseSettings = {
  setupComplete: false,
  enrolmentStartDate: null,
  enrolmentEndDate: null,
  extensionMonthsUsed: 0,
  weeklyStudyTargetHours: null,
  swlaStatus: "UNKNOWN",
};

export async function loadHrCourseSettings(): Promise<HrCourseSettings> {
  try {
    const stored = await withStore<HrCourseSettings | undefined>(
      STORE_HR_COURSE_SETTINGS,
      "readonly",
      (s) => s.get(HR_COURSE_SETTINGS_KEY)
    );
    if (!stored) return DEFAULT_HR_COURSE_SETTINGS;
    return { ...DEFAULT_HR_COURSE_SETTINGS, ...stored };
  } catch {
    return DEFAULT_HR_COURSE_SETTINGS;
  }
}

export async function saveHrCourseSettings(settings: HrCourseSettings): Promise<void> {
  await withStore(STORE_HR_COURSE_SETTINGS, "readwrite", (s) =>
    s.put(settings, HR_COURSE_SETTINGS_KEY)
  );
}

export async function loadHrReferenceNotes(): Promise<HrReferenceNote[]> {
  return getAllFromStore<HrReferenceNote>(STORE_HR_REFERENCE_NOTES);
}

export async function saveHrReferenceNote(note: HrReferenceNote): Promise<void> {
  await withStore(STORE_HR_REFERENCE_NOTES, "readwrite", (s) => s.put(note));
}

/** Full local backup — everything the app knows, in one downloadable file. */
export async function exportAll(): Promise<{
  exportedAt: string;
  settings: AppSettings;
  occurrences: RoutineOccurrence[];
  tasks: Task[];
  hrModules: HrModule[];
  hrAssessments: HrAssessment[];
  hrCourseSettings: HrCourseSettings;
  hrReferenceNotes: HrReferenceNote[];
}> {
  const settings = await loadSettings();
  const occurrences = await getAllFromStore<RoutineOccurrence>(STORE_OCCURRENCES);
  const tasks = await getAllFromStore<Task>(STORE_TASKS);
  const hrModules = await loadHrModules();
  const hrAssessments = await loadHrAssessments();
  const hrCourseSettings = await loadHrCourseSettings();
  const hrReferenceNotes = await loadHrReferenceNotes();
  return {
    exportedAt: new Date().toISOString(),
    settings,
    occurrences,
    tasks,
    hrModules,
    hrAssessments,
    hrCourseSettings,
    hrReferenceNotes,
  };
}
