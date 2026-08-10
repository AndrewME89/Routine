import type {
  AppSettings,
  AuslanPreferences,
  HrAssessment,
  HrCourseSettings,
  HrModule,
  HrReferenceNote,
  LearningArea,
  LearningResource,
  LearningSession,
  LearningTopic,
  RoutineOccurrence,
  Task,
} from "./types";
import { DEFAULT_SETTINGS } from "./defaultSettings";

const DB_NAME = "nightshift-os";
// Bumping this only ever ADDS object stores in onupgradeneeded — existing
// stores and their data are left alone, so this is a safe, additive
// migration, not a reset.
const DB_VERSION = 4;
const STORE_SETTINGS = "settings";
const STORE_OCCURRENCES = "occurrences";
const STORE_TASKS = "tasks";
const STORE_HR_MODULES = "hr_modules";
const STORE_HR_ASSESSMENTS = "hr_assessments";
const STORE_HR_COURSE_SETTINGS = "hr_course_settings";
const STORE_HR_REFERENCE_NOTES = "hr_reference_notes";
const STORE_LEARNING_RESOURCES = "learning_resources";
const STORE_LEARNING_SESSIONS = "learning_sessions";
const STORE_LEARNING_TOPICS = "learning_topics";
const STORE_AUSLAN_PREFS = "auslan_preferences";
const SETTINGS_KEY = "app";
const AUSLAN_PREFS_KEY = "auslan";
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
      if (!db.objectStoreNames.contains(STORE_LEARNING_RESOURCES)) {
        const store = db.createObjectStore(STORE_LEARNING_RESOURCES, { keyPath: "id" });
        store.createIndex("byLearningArea", "learningArea");
      }
      if (!db.objectStoreNames.contains(STORE_LEARNING_SESSIONS)) {
        const store = db.createObjectStore(STORE_LEARNING_SESSIONS, { keyPath: "id" });
        store.createIndex("byLearningArea", "learningArea");
      }
      if (!db.objectStoreNames.contains(STORE_LEARNING_TOPICS)) {
        const store = db.createObjectStore(STORE_LEARNING_TOPICS, { keyPath: "id" });
        store.createIndex("byLearningArea", "learningArea");
      }
      if (!db.objectStoreNames.contains(STORE_AUSLAN_PREFS)) {
        db.createObjectStore(STORE_AUSLAN_PREFS);
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

// --- Shared learning infrastructure --------------------------------------

export async function loadLearningResources(area: LearningArea): Promise<LearningResource[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LEARNING_RESOURCES, "readonly");
    const idx = tx.objectStore(STORE_LEARNING_RESOURCES).index("byLearningArea");
    const req = idx.getAll(IDBKeyRange.only(area));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveLearningResource(resource: LearningResource): Promise<void> {
  await withStore(STORE_LEARNING_RESOURCES, "readwrite", (s) => s.put(resource));
}

export async function deleteLearningResource(id: string): Promise<void> {
  await withStore(STORE_LEARNING_RESOURCES, "readwrite", (s) => s.delete(id));
}

export async function loadLearningSessions(area: LearningArea): Promise<LearningSession[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LEARNING_SESSIONS, "readonly");
    const idx = tx.objectStore(STORE_LEARNING_SESSIONS).index("byLearningArea");
    const req = idx.getAll(IDBKeyRange.only(area));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveLearningSession(session: LearningSession): Promise<void> {
  await withStore(STORE_LEARNING_SESSIONS, "readwrite", (s) => s.put(session));
}

export async function loadLearningTopics(area: LearningArea): Promise<LearningTopic[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LEARNING_TOPICS, "readonly");
    const idx = tx.objectStore(STORE_LEARNING_TOPICS).index("byLearningArea");
    const req = idx.getAll(IDBKeyRange.only(area));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveLearningTopic(topic: LearningTopic): Promise<void> {
  await withStore(STORE_LEARNING_TOPICS, "readwrite", (s) => s.put(topic));
}

export async function seedLearningTopicsIfEmpty(
  area: LearningArea,
  topics: LearningTopic[]
): Promise<void> {
  const existing = await loadLearningTopics(area);
  if (existing.length > 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LEARNING_TOPICS, "readwrite");
    const store = tx.objectStore(STORE_LEARNING_TOPICS);
    for (const t of topics) store.put(t);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

const DEFAULT_AUSLAN_PREFS: AuslanPreferences = {
  dominantHand: "UNSPECIFIED",
  regionalVariation: "SOUTHERN",
};

export async function loadAuslanPreferences(): Promise<AuslanPreferences> {
  try {
    const stored = await withStore<AuslanPreferences | undefined>(
      STORE_AUSLAN_PREFS,
      "readonly",
      (s) => s.get(AUSLAN_PREFS_KEY)
    );
    if (!stored) return DEFAULT_AUSLAN_PREFS;
    return { ...DEFAULT_AUSLAN_PREFS, ...stored };
  } catch {
    return DEFAULT_AUSLAN_PREFS;
  }
}

export async function saveAuslanPreferences(prefs: AuslanPreferences): Promise<void> {
  await withStore(STORE_AUSLAN_PREFS, "readwrite", (s) => s.put(prefs, AUSLAN_PREFS_KEY));
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
  learningResources: LearningResource[];
  learningSessions: LearningSession[];
  learningTopics: LearningTopic[];
  auslanPreferences: AuslanPreferences;
}> {
  const settings = await loadSettings();
  const occurrences = await getAllFromStore<RoutineOccurrence>(STORE_OCCURRENCES);
  const tasks = await getAllFromStore<Task>(STORE_TASKS);
  const hrModules = await loadHrModules();
  const hrAssessments = await loadHrAssessments();
  const hrCourseSettings = await loadHrCourseSettings();
  const hrReferenceNotes = await loadHrReferenceNotes();
  const learningResources = await getAllFromStore<LearningResource>(STORE_LEARNING_RESOURCES);
  const learningSessions = await getAllFromStore<LearningSession>(STORE_LEARNING_SESSIONS);
  const learningTopics = await getAllFromStore<LearningTopic>(STORE_LEARNING_TOPICS);
  const auslanPreferences = await loadAuslanPreferences();
  return {
    exportedAt: new Date().toISOString(),
    settings,
    occurrences,
    tasks,
    hrModules,
    hrAssessments,
    hrCourseSettings,
    hrReferenceNotes,
    learningResources,
    learningSessions,
    learningTopics,
    auslanPreferences,
  };
}
