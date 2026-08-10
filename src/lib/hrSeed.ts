// Seed content sourced directly from the supplied Certificate IV structure.
// Unit codes, titles, assessment counts and indicative hours are exactly as
// given — nothing here is invented. Where the source said "N/A" (Study Order
// 1's unit code), it stays null rather than being guessed.

export interface HrModuleSeed {
  order: number;
  unitCode: string | null;
  title: string;
  assessmentsPlanned: number;
  indicativeHours: number;
}

export const HR_MODULE_SEED: HrModuleSeed[] = [
  { order: 1, unitCode: null, title: "Introduction to Human Resource Management", assessmentsPlanned: 1, indicativeHours: 23 },
  { order: 2, unitCode: "BSBHRM417", title: "Support human resource functions and processes", assessmentsPlanned: 1, indicativeHours: 54 },
  { order: 3, unitCode: "BSBHRM415", title: "Coordinate recruitment and onboarding", assessmentsPlanned: 3, indicativeHours: 56 },
  { order: 4, unitCode: "BSBHRM413", title: "Support the learning and development of teams and individuals", assessmentsPlanned: 3, indicativeHours: 56 },
  { order: 5, unitCode: "BSBTWK401", title: "Build and maintain business relationships", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 6, unitCode: "BSBXCM401", title: "Apply communication strategies in the workplace", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 7, unitCode: "BSBCRT411", title: "Apply critical thinking to work practices", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 8, unitCode: "BSBHRM412", title: "Support employee and industrial relations", assessmentsPlanned: 4, indicativeHours: 66 },
  { order: 9, unitCode: "BSBCMM412", title: "Lead difficult conversations", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 10, unitCode: "BSBHRM411", title: "Administer performance development processes", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 11, unitCode: "BSBHRM529", title: "Coordinate separation and termination process", assessmentsPlanned: 4, indicativeHours: 61 },
  { order: 12, unitCode: "BSBWRT411", title: "Write complex documents", assessmentsPlanned: 3, indicativeHours: 50 },
  { order: 13, unitCode: "BSBWHS411", title: "Implement and monitor WHS", assessmentsPlanned: 3, indicativeHours: 50 },
];

export const HR_COURSE_TOTALS = {
  modules: 13,
  assessments: 37,
  indicativeHours: 666,
};

export const PROVIDER_RECOMMENDED_WEEKLY_HOURS = { min: 14, max: 23 };

export interface LegislationSeed {
  id: string;
  name: string;
}

// Legislation/reference areas listed in the course outline.
export const LEGISLATION_SEED: LegislationSeed[] = [
  { id: "whs-2011", name: "Work Health and Safety Act 2011" },
  { id: "fair-work-2009", name: "Fair Work Act 2009" },
  { id: "racial-discrim-1975", name: "Racial Discrimination Act 1975" },
  { id: "sex-discrim-1984", name: "Sex Discrimination Act 1984" },
  { id: "age-discrim-2004", name: "Age Discrimination Act 2004" },
  { id: "disability-discrim-1992", name: "Disability Discrimination Act 1992" },
];

export interface GlossarySeed {
  id: string;
  term: string;
}

// Key HR terminology listed in the course outline. Definitions are written
// generically by this app (not copied from any handbook) since only the term
// list itself was supplied.
export const GLOSSARY_SEED: GlossarySeed[] = [
  { id: "human-resources", term: "Human Resources" },
  { id: "recruitment", term: "Recruitment" },
  { id: "onboarding", term: "Onboarding" },
  { id: "performance-management", term: "Performance Management" },
  { id: "industrial-relations", term: "Industrial Relations" },
  { id: "whs", term: "Workplace Health and Safety" },
  { id: "eeo", term: "Equal Employment Opportunity" },
  { id: "award", term: "Award" },
  { id: "enterprise-agreement", term: "Enterprise Agreement" },
  { id: "fair-work-act", term: "Fair Work Act 2009" },
  { id: "training-development", term: "Training and Development" },
  { id: "conflict-resolution", term: "Conflict Resolution" },
  { id: "code-of-conduct", term: "Code of Conduct" },
  { id: "grievance-procedure", term: "Grievance Procedure" },
];

export interface AssessmentHelperTerm {
  id: string;
  term: string;
  meaning: string;
}

// Generic command-verb reference. These are ordinary generic definitions of
// common assessment instruction words, written by this app — not extracted
// from any specific course document, and no worked examples are attached
// (the source material's own examples aren't reproduced here).
export const ASSESSMENT_HELPER_SEED: AssessmentHelperTerm[] = [
  { id: "analyse", term: "Analyse", meaning: "Break something down into its parts and examine how they relate." },
  { id: "compare", term: "Compare", meaning: "Identify similarities (and usually differences) between two or more things." },
  { id: "contrast", term: "Contrast", meaning: "Focus specifically on the differences between two or more things." },
  { id: "define", term: "Define", meaning: "State the precise meaning of a term or concept." },
  { id: "demonstrate", term: "Demonstrate", meaning: "Show a skill or process in practice, usually by doing it." },
  { id: "describe", term: "Describe", meaning: "Give a detailed account of something's features or characteristics." },
  { id: "discuss", term: "Discuss", meaning: "Explore a topic from multiple angles, weighing different points." },
  { id: "evaluate", term: "Evaluate", meaning: "Judge the value, effectiveness, or significance of something, with reasons." },
  { id: "explain", term: "Explain", meaning: "Make something clear by giving reasons or a step-by-step account." },
  { id: "illustrate", term: "Illustrate", meaning: "Use examples to make a point clearer." },
  { id: "identify", term: "Identify", meaning: "Point out or name specific items, without necessarily explaining them." },
  { id: "justify", term: "Justify", meaning: "Give reasons or evidence to support a decision or claim." },
  { id: "list", term: "List", meaning: "Provide a number of items, one after another, with little elaboration." },
  { id: "outline", term: "Outline", meaning: "Give the main points/structure without going into full detail." },
  { id: "summarise", term: "Summarise", meaning: "Give the main points concisely, leaving out minor detail." },
  { id: "apply", term: "Apply", meaning: "Use knowledge or a method in a specific situation or context." },
  { id: "demonstrate-competence", term: "Demonstrate Competence", meaning: "Show, through action or evidence, that a skill has been reliably mastered." },
  { id: "interpret", term: "Interpret", meaning: "Explain the meaning or significance of information." },
  { id: "observe", term: "Observe", meaning: "Watch and note relevant details, often as evidence for later assessment." },
  { id: "propose", term: "Propose", meaning: "Put forward an idea, plan, or solution for consideration." },
  { id: "role-play", term: "Role-play", meaning: "Act out a scenario in character to demonstrate a skill in context." },
  { id: "state", term: "State", meaning: "Express a fact or point clearly and briefly." },
  { id: "provide-evidence", term: "Provide Evidence", meaning: "Supply material (documents, records, examples) that supports a claim." },
];
