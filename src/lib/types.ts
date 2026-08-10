// Weekday indices follow JS Date convention: 0 = Sunday ... 6 = Saturday.
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface RosterDay {
  weekday: Weekday;
  label: string;
  isRDO: boolean;
  /** 24h "HH:MM", only meaningful when isRDO is false */
  startTime: string;
  /** 24h "HH:MM", may be "earlier" than startTime because the shift crosses midnight */
  endTime: string;
}

export type DashboardMode = "NORMAL" | "WORK_NIGHT" | "RDO" | "EXHAUSTED";

export interface AppSettings {
  timezone: string;
  /** 24h "HH:MM" — the operational day starts here */
  wakeTime: string;
  /** 24h "HH:MM" — shown for reference; sleep itself isn't scheduled as an action */
  sleepTime: string;
  roster: RosterDay[];
  /** null = auto-detect from roster; otherwise the user has pinned a mode */
  modeOverride: DashboardMode | null;
}

export type StepAnchor =
  | { type: "CLOCK"; time: string } // fixed clock time, e.g. "19:00"
  | { type: "ROSTER_WORK_START" }
  | { type: "ROSTER_WORK_END" }
  | { type: "ROSTER_WORK_END_OFFSET"; minutes: number }; // e.g. "get home" ~ end + 90min

export type StepAppliesOn = "ALL" | "WORK_NIGHT_ONLY" | "RDO_ONLY";

export interface RoutineStepDef {
  id: string;
  label: string;
  phase: "POST_WAKE" | "PRE_WORK" | "WORK" | "POST_SHIFT" | "PRE_SLEEP";
  anchor: StepAnchor;
  appliesOn: StepAppliesOn;
  /** id of the step this one hands off to, purely informational for the Now/Next chain */
  chainNext?: string;
  /** true if the scheduled time is a derived estimate, not a fixed commitment */
  approximate?: boolean;
  note?: string;
}

export type OccurrenceStatus =
  | "PENDING"
  | "DONE"
  | "MOVED_LATER"
  | "SKIPPED_TODAY"
  | "NOT_HAPPENING";

export interface RoutineOccurrence {
  /** `${operationalDay}:${stepId}` */
  id: string;
  operationalDay: string; // "YYYY-MM-DD", the calendar date the operational day began
  stepId: string;
  status: OccurrenceStatus;
  /** ISO timestamp, set whenever status last changed */
  updatedAt: string;
}

export interface ResolvedOccurrence {
  occurrence: RoutineOccurrence;
  step: RoutineStepDef;
  scheduledAt: Date;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "NOT_HAPPENING";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** "YYYY-MM-DD" or null for someday/no date */
  dueDate: string | null;
  project: string | null;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// HR Study (Certificate IV in Human Resource Management)
// ---------------------------------------------------------------------------

export type HrModuleStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "ACTIVE"
  | "ASSESSMENTS_SUBMITTED"
  | "AWAITING_RESULT"
  | "COMPETENT"
  | "NOT_YET_COMPETENT";

export interface HrModule {
  id: string; // matches seed order, e.g. "hr-module-1"
  order: number;
  unitCode: string | null;
  title: string;
  assessmentsPlanned: number;
  indicativeHours: number;
  status: HrModuleStatus;
  topicsCompleted: number;
  topicsTotal: number;
  activitiesCompleted: number;
  activitiesTotal: number;
  notes: string;
  lastStudied: string | null; // "YYYY-MM-DD"
  updatedAt: string;
}

export type HrAssessmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AWAITING_FEEDBACK"
  | "COMPETENT"
  | "CHANGES_REQUIRED";

export interface HrAssessment {
  id: string;
  moduleId: string;
  title: string;
  /** free text — "UNKNOWN" until the actual assessment specifies a type */
  assessmentType: string;
  status: HrAssessmentStatus;
  submittedDate: string | null;
  attemptNumber: number;
  feedbackNotes: string;
  updatedAt: string;
}

export type SwlaStatus = "UNKNOWN" | "YES" | "NO" | "UNSURE";

export interface HrCourseSettings {
  setupComplete: boolean;
  enrolmentStartDate: string | null;
  enrolmentEndDate: string | null;
  extensionMonthsUsed: number;
  weeklyStudyTargetHours: number | null;
  swlaStatus: SwlaStatus;
}

export interface HrReferenceNote {
  /** legislation or glossary seed id */
  id: string;
  favourite: boolean;
  note: string;
}

// ---------------------------------------------------------------------------
// Shared learning infrastructure (Auslan / Escrima / Japanese)
// ---------------------------------------------------------------------------

export type LearningArea = "AUSLAN" | "ESCRIMA" | "JAPANESE";

export type ResourceType =
  | "DOCUMENT"
  | "PDF"
  | "WORKSHEET"
  | "ANSWER_KEY"
  | "IMAGE"
  | "REFERENCE_CHART"
  | "VIDEO"
  | "BOOK"
  | "CHEAT_SHEET"
  | "COURSE"
  | "WEBSITE"
  | "EXTERNAL_LINK"
  | "OTHER";

export type ResourceSourceType = "GOOGLE_DRIVE" | "EXTERNAL_WEB" | "APP_RESOURCE" | "USER_CREATED";

export type ResourceStatus =
  | "UNREAD"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETE"
  | "REFERENCE"
  | "ARCHIVED"
  | "NEEDS_REVIEW";

export interface LearningResource {
  id: string;
  learningArea: LearningArea;
  title: string;
  resourceType: ResourceType;
  sourceType: ResourceSourceType;
  /** The Drive/external URL. Never a fabricated link — blank until supplied. */
  sourceURL: string;
  category: string;
  subcategory: string;
  level: string;
  notes: string;
  status: ResourceStatus;
  favourite: boolean;
  lastOpened: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningSession {
  id: string;
  learningArea: LearningArea;
  dateTime: string; // ISO
  operationalDay: string; // "YYYY-MM-DD"
  durationMinutes: number;
  activityType: string;
  focus: string;
  notes: string;
  completed: boolean;
}

export type TopicStatus = "NOT_STARTED" | "IN_PROGRESS" | "REVIEW" | "COMPLETE";

export interface LearningTopic {
  id: string;
  learningArea: LearningArea;
  area: string; // section name, e.g. "Fingerspelling"
  status: TopicStatus;
  notes: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Auslan
// ---------------------------------------------------------------------------

export type DominantHand = "RIGHT" | "LEFT" | "UNSPECIFIED";
export type RegionalVariation = "SOUTHERN" | "NORTHERN" | "UNSURE";

export interface AuslanPreferences {
  dominantHand: DominantHand;
  regionalVariation: RegionalVariation;
}

// ---------------------------------------------------------------------------
// Escrima / Arnis / Kali
// ---------------------------------------------------------------------------

export type TrainingSkillStatus =
  | "NOT_STARTED"
  | "LEARNING"
  | "PRACTISING"
  | "COMFORTABLE"
  | "REVIEW"
  | "PROFICIENT";

export interface TrainingSkill {
  id: string;
  area: string;
  subarea: string;
  name: string;
  status: TrainingSkillStatus;
  lastPractised: string | null; // "YYYY-MM-DD"
  timesPractised: number;
  practiceMinutes: number;
  confidence: number; // 1-5
  leftSideConfidence: number | null;
  rightSideConfidence: number | null;
  notes: string;
  nextReview: string | null;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  dateTime: string; // ISO
  operationalDay: string;
  durationMinutes: number;
  plannedFocus: string;
  actualFocus: string;
  skillsPractised: string[]; // TrainingSkill ids
  energyBefore: number | null;
  energyAfter: number | null;
  confidenceNotes: string;
  technicalNotes: string;
  nextTime: string;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Japanese
// ---------------------------------------------------------------------------

// Deliberately five states — no "Proficient" here, and no JLPT level is ever
// implied by reaching Comfortable/Review.
export type JapaneseSkillStatus = "NOT_STARTED" | "LEARNING" | "PRACTISING" | "COMFORTABLE" | "REVIEW";

export interface JapaneseSkillConfidence {
  id: string;
  skill: string; // one of JAPANESE_SKILLS
  status: JapaneseSkillStatus;
  updatedAt: string;
}

export type WorksheetStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "REVIEW";

export interface JapaneseWorksheet {
  id: string;
  title: string;
  status: WorksheetStatus;
  worksheetURL: string;
  answerKeyURL: string;
  /** Answer key content is never shown until the user explicitly asks. */
  answerKeyRevealed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningFlashcard {
  id: string;
  learningArea: LearningArea;
  front: string; // Japanese
  reading: string; // kana reading
  romaji: string;
  englishMeaning: string;
  category: string;
  sourceResource: string;
  notes: string;
  confidence: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface JapaneseSettings {
  /** Only ever set if the user explicitly records one — never inferred. */
  jlptSelfReported: string | null;
}

// ---------------------------------------------------------------------------
// Meals — Night-Shift Chilled Meal + Work Wrap system
// ---------------------------------------------------------------------------

export type PantryItemType = "CHILLED_MEAL" | "FRUIT_POUCH" | "WRAP_COMPONENT" | "SNACK_COMPONENT";

export interface PantryItem {
  id: string;
  itemType: PantryItemType;
  title: string;
  category: string;
  /** Individual consumable units on hand — drives coverage/snack-set math. */
  currentStock: number;
  /** How many priced units (packs) to buy — drives the shopping basket. */
  purchaseQuantity: number;
  minStock: number | null;
  targetStock: number | null;
  price: number;
  pricePer100g: number | null;
  unitNote: string;
  favourite: boolean;
  rating: number | null; // 1-5
  active: boolean;
  reorderFlag: boolean;
  lastEaten: string | null; // ISO
  timesEaten: number;
  notes: string;
  updatedAt: string;
}

export interface MealSettings {
  forwardGroceryBudget: number;
  takeawayConvenienceBudget: number;
}

// ---------------------------------------------------------------------------
// Money — debt-avalanche + bills + transactions
// ---------------------------------------------------------------------------

export interface DebtAccount {
  id: string;
  title: string;
  balance: number;
  startingBalance: number;
  /** null until the user confirms an actual rate — never assumed 0%. */
  interestRate: number | null;
  interestRateConfirmed: boolean;
  monthlyFee: number | null;
  baselineWeeklyPayment: number;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoneySettings {
  baseDebtPool: number;
  debtAccelerator: number;
  balancedDebtPool: number;
  emergencySavings: number;
  debtSprintPool: number;
  debtSprintEnabled: boolean;
  acceleratorPaused: boolean;
  manualTargetId: string | null;
}

export type BillFrequency = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDay: string;
  frequency: BillFrequency;
  notes: string;
  active: boolean;
  updatedAt: string;
}

export type TransactionType = "debt_payment" | "bill_payment" | "purchase" | "takeaway" | "other";

export interface ExpenseTransaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  debtId: string | null;
  source: string;
  dateTime: string;
  operationalDay: string;
  notes: string;
}
