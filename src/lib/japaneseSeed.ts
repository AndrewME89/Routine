export const JAPANESE_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1A8S7OCJdKfthuYH1xfEhjsZHad3cnTib";

// These are organisational categories for sorting an existing resource
// collection — not a claimed official course sequence. Flattened to
// "Area — Subtopic" so each becomes one trackable item, same pattern as
// Auslan's areas.
const RAW_AREAS: Record<string, string[]> = {
  Foundations: ["Pronunciation", "Writing system", "Hiragana", "Katakana"],
  Grammar: ["Sentence structure", "Particles", "Polite speech", "Casual speech", "Other grammar"],
  Vocabulary: [
    "General vocabulary",
    "Topic vocabulary",
    "Verbs",
    "Numbers",
    "Time/date",
    "Transport",
    "Feelings",
    "Rooms",
    "Other",
  ],
  Conversation: [
    "Greetings",
    "Everyday phrases",
    "Dining",
    "Hotel/travel",
    "Shopping",
    "Questions",
    "Survival phrases",
  ],
  Kanji: ["Recognition", "Meaning", "Readings", "Writing"],
  Reading: ["Beginner reading", "Intermediate reading", "Advanced reading"],
  Writing: ["Writing"],
  "Listening / Audio": ["Listening / Audio"],
  "Culture / Context": ["Culture / Context"],
  Worksheets: ["Worksheets"],
  Reference: ["Reference"],
};

export const JAPANESE_AREAS: string[] = Object.entries(RAW_AREAS).flatMap(([area, subs]) =>
  Array.from(new Set(subs)).map((sub) => (sub === area ? area : `${area} — ${sub}`))
);

// Independently tracked skill confidence — five states only (no "Proficient"
// here, and JLPT level is never claimed unless the user records one).
export const JAPANESE_SKILLS = [
  "Hiragana",
  "Katakana",
  "Kanji",
  "Grammar",
  "Vocabulary",
  "Reading",
  "Listening",
  "Speaking",
  "Writing",
];

export const JAPANESE_PRACTICE_TYPES = [
  "Kana recognition",
  "Kana writing",
  "Vocabulary review",
  "Verb review",
  "Grammar review",
  "Particle practice",
  "Kanji review",
  "Reading",
  "Conversation phrases",
  "Worksheet",
];

// Optional study collections — sourced from the user's own Drive resources
// as they're added; no phrase lists are invented here when source material
// isn't available.
export const JAPANESE_PHRASE_COLLECTIONS = [
  "Greetings",
  "Please / Excuse me / Thank you",
  "Dining",
  "Hotels",
  "Shopping",
  "Everyday questions",
];
