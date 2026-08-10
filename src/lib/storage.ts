import type {
  AppSettings,
  AuslanPreferences,
  HrAssessment,
  HrCourseSettings,
  HrModule,
  HrReferenceNote,
  JapaneseSettings,
  JapaneseSkillConfidence,
  JapaneseWorksheet,
  LearningArea,
  LearningFlashcard,
  LearningResource,
  LearningSession,
  LearningTopic,
  RoutineOccurrence,
  RoutineStepDef,
  Task,
  TrainingSession,
  TrainingSkill,
} from "./types";
import { DEFAULT_SETTINGS } from "./defaultSettings";

const DB_NAME = "nightshift-os";
// Bumping this only ever ADDS object stores in onupgradeneeded — existing
// stores and their data are left alone, so this is a safe, additive
// migration, not a reset.
const DB_VERSION = 7;
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
const STORE_TRAINING_SKILLS = "training_skills";
const STORE_TRAINING_SESSIONS = "training_sessions";
const STORE_JAPANESE_SKILLS = "japanese_skill_confidence";
const STORE_JAPANESE_WORKSHEETS = "japanese_worksheets";
const STORE_JAPANESE_SETTINGS = "japanese_settings";
const STORE_FLASHCARDS = "learning_flashcards";
const STORE_ROUTINE_STEPS = "routine_steps";
const SETTINGS_KEY = "app";
const AUSLAN_PREFS_KEY = "auslan";
const JAPANESE_SETTINGS_KEY = "japanese";
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
      if (!db.objectStoreNames.contains(STORE_TRAINING_SKILLS)) {
        const store = db.createObjectStore(STORE_TRAINING_SKILLS, { keyPath: "id" });
        store.createIndex("byArea", "area");
      }
      if (!db.objectStoreNames.contains(STORE_TRAINING_SESSIONS)) {
        db.createObjectStore(STORE_TRAINING_SESSIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_JAPANESE_SKILLS)) {
        db.createObjectStore(STORE_JAPANESE_SKILLS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_JAPANESE_WORKSHEETS)) {
        db.createObjectStore(STORE_JAPANESE_WORKSHEETS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_JAPANESE_SETTINGS)) {
        db.createObjectStore(STORE_JAPANESE_SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORE_FLASHCARDS)) {
        const store = db.createObjectStore(STORE_FLASHCARDS, { keyPath: "id" });
        store.createIndex("byLearningArea", "learningArea");
      }
      if (!db.objectStoreNames.contains(STORE_ROUTINE_STEPS)) {
        db.createObjectStore(STORE_ROUTINE_STEPS, { keyPath: "id" });
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

export async function loadAllOccurrences(): Promise<RoutineOccurrence[]> {
  return getAllFromStore<RoutineOccurrence>(STORE_OCCURRENCES);
}

// --- Routine template -------------------------------------------------

export async function seedRoutineStepsIfEmpty(steps: RoutineStepDef[]): Promise<void> {
  await putAllIfEmpty(STORE_ROUTINE_STEPS, steps);
}

export async function loadRoutineSteps(): Promise<RoutineStepDef[]> {
  return getAllFromStore<RoutineStepDef>(STORE_ROUTINE_STEPS);
}

export async function saveRoutineStep(step: RoutineStepDef): Promise<void> {
  await withStore(STORE_ROUTINE_STEPS, "readwrite", (s) => s.put(step));
}

export async function deleteRoutineStep(id: string): Promise<void> {
  await withStore(STORE_ROUTINE_STEPS, "readwrite", (s) => s.delete(id));
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

// --- Escrima / training ----------------------------------------------------

export async function seedTrainingSkillsIfEmpty(skills: TrainingSkill[]): Promise<void> {
  await putAllIfEmpty(STORE_TRAINING_SKILLS, skills);
}

export async function loadTrainingSkills(): Promise<TrainingSkill[]> {
  return getAllFromStore<TrainingSkill>(STORE_TRAINING_SKILLS);
}

export async function saveTrainingSkill(skill: TrainingSkill): Promise<void> {
  await withStore(STORE_TRAINING_SKILLS, "readwrite", (s) => s.put(skill));
}

export async function loadTrainingSessions(): Promise<TrainingSession[]> {
  return getAllFromStore<TrainingSession>(STORE_TRAINING_SESSIONS);
}

export async function saveTrainingSession(session: TrainingSession): Promise<void> {
  await withStore(STORE_TRAINING_SESSIONS, "readwrite", (s) => s.put(session));
}

// --- Japanese ---------------------------------------------------------

export async function seedJapaneseSkillsIfEmpty(skills: JapaneseSkillConfidence[]): Promise<void> {
  await putAllIfEmpty(STORE_JAPANESE_SKILLS, skills);
}

export async function loadJapaneseSkills(): Promise<JapaneseSkillConfidence[]> {
  return getAllFromStore<JapaneseSkillConfidence>(STORE_JAPANESE_SKILLS);
}

export async function saveJapaneseSkill(skill: JapaneseSkillConfidence): Promise<void> {
  await withStore(STORE_JAPANESE_SKILLS, "readwrite", (s) => s.put(skill));
}

export async function loadJapaneseWorksheets(): Promise<JapaneseWorksheet[]> {
  return getAllFromStore<JapaneseWorksheet>(STORE_JAPANESE_WORKSHEETS);
}

export async function saveJapaneseWorksheet(w: JapaneseWorksheet): Promise<void> {
  await withStore(STORE_JAPANESE_WORKSHEETS, "readwrite", (s) => s.put(w));
}

export async function deleteJapaneseWorksheet(id: string): Promise<void> {
  await withStore(STORE_JAPANESE_WORKSHEETS, "readwrite", (s) => s.delete(id));
}

const DEFAULT_JAPANESE_SETTINGS: JapaneseSettings = { jlptSelfReported: null };

export async function loadJapaneseSettings(): Promise<JapaneseSettings> {
  try {
    const stored = await withStore<JapaneseSettings | undefined>(
      STORE_JAPANESE_SETTINGS,
      "readonly",
      (s) => s.get(JAPANESE_SETTINGS_KEY)
    );
    if (!stored) return DEFAULT_JAPANESE_SETTINGS;
    return { ...DEFAULT_JAPANESE_SETTINGS, ...stored };
  } catch {
    return DEFAULT_JAPANESE_SETTINGS;
  }
}

export async function saveJapaneseSettings(settings: JapaneseSettings): Promise<void> {
  await withStore(STORE_JAPANESE_SETTINGS, "readwrite", (s) => s.put(settings, JAPANESE_SETTINGS_KEY));
}

export async function loadFlashcards(area: LearningArea): Promise<LearningFlashcard[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FLASHCARDS, "readonly");
    const idx = tx.objectStore(STORE_FLASHCARDS).index("byLearningArea");
    const req = idx.getAll(IDBKeyRange.only(area));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveFlashcard(card: LearningFlashcard): Promise<void> {
  await withStore(STORE_FLASHCARDS, "readwrite", (s) => s.put(card));
}

export async function deleteFlashcard(id: string): Promise<void> {
  await withStore(STORE_FLASHCARDS, "readwrite", (s) => s.delete(id));
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
  trainingSkills: TrainingSkill[];
  trainingSessions: TrainingSession[];
  japaneseSkills: JapaneseSkillConfidence[];
  japaneseWorksheets: JapaneseWorksheet[];
  japaneseSettings: JapaneseSettings;
  flashcards: LearningFlashcard[];
  routineSteps: RoutineStepDef[];
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
  const trainingSkills = await loadTrainingSkills();
  const trainingSessions = await loadTrainingSessions();
  const japaneseSkills = await loadJapaneseSkills();
  const japaneseWorksheets = await loadJapaneseWorksheets();
  const japaneseSettings = await loadJapaneseSettings();
  const flashcards = await getAllFromStore<LearningFlashcard>(STORE_FLASHCARDS);
  const routineSteps = await loadRoutineSteps();
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
    trainingSkills,
    trainingSessions,
    japaneseSkills,
    japaneseWorksheets,
    japaneseSettings,
    flashcards,
    routineSteps,
  };
}
