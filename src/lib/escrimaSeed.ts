// Every skill/drill line below is taken directly from the user's existing
// Self-Training Plan / Arnis 101 curriculum. Subsection headers in the
// source (CALIBRATION DRILLS, IMPACT TRAINING, CARRANZA) become `subarea`
// metadata rather than being dropped or turned into invented skills.

export const ESCRIMA_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1TkPqYw2tch2T_elY5RJof6uALLOeVNLj";

export interface EscrimaSkillSeed {
  area: string;
  subarea?: string;
  name: string;
}

export const ESCRIMA_SKILL_SEED: EscrimaSkillSeed[] = [
  // AREA 0 — WARM UP
  { area: "Area 0 — Warm Up", name: "Warm Up Exercises" },
  { area: "Area 0 — Warm Up", name: "Warm Up Follow Along" },

  // AREA 1 — BASIC FOOTWORK
  { area: "Area 1 — Basic Footwork", name: "Broken Stepping" },
  { area: "Area 1 — Basic Footwork", name: "Side Step" },
  { area: "Area 1 — Basic Footwork", name: "Ranging Star" },
  { area: "Area 1 — Basic Footwork", name: "Reverse Triangle" },
  { area: "Area 1 — Basic Footwork", name: "Forward Triangle" },
  { area: "Area 1 — Basic Footwork", name: "Diamond" },
  { area: "Area 1 — Basic Footwork", name: "Hourglass" },
  { area: "Area 1 — Basic Footwork", name: "Circling" },

  // AREA 2 — SINGLE STICK
  { area: "Area 2 — Single Stick", name: "Single Stick / Area 1" },
  { area: "Area 2 — Single Stick", name: "Striking Mechanics" },
  { area: "Area 2 — Single Stick", name: "Abakada 10" },
  { area: "Area 2 — Single Stick", name: "Basic Striking Patterns" },
  { area: "Area 2 — Single Stick", name: "X Strikes" },
  { area: "Area 2 — Single Stick", name: "8 Strikes" },
  { area: "Area 2 — Single Stick", name: "- Strikes" },
  { area: "Area 2 — Single Stick", name: "O Strikes" },
  { area: "Area 2 — Single Stick", name: "• Strikes" },
  { area: "Area 2 — Single Stick", name: "Advanced Striking Patterns" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Broken Footwork" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Side Step" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Ranging Star Footwork" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Reverse Triangle" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Forward Triangle" },
  { area: "Area 2 — Single Stick", subarea: "Calibration Drills", name: "Calibrating Diamond" },
  { area: "Area 2 — Single Stick", subarea: "Impact Training", name: "Impact Drill 1" },
  { area: "Area 2 — Single Stick", subarea: "Impact Training", name: "Impact Drill 2" },
  { area: "Area 2 — Single Stick", subarea: "Impact Training", name: "Impact Drill 3" },
  { area: "Area 2 — Single Stick", subarea: "Carranza", name: "Call and Response Drill 1" },
  { area: "Area 2 — Single Stick", subarea: "Carranza", name: "Call and Response Drill 2" },
  { area: "Area 2 — Single Stick", subarea: "Carranza", name: "Free Flow" },

  // AREA 3 — DOUBLE STICK
  { area: "Area 3 — Double Stick", name: "Double Sticks / Area 2" },
  { area: "Area 3 — Double Stick", name: "COB-COB" },
  { area: "Area 3 — Double Stick", name: "1-2-2001" },
  { area: "Area 3 — Double Stick", name: "Single Weave" },
  { area: "Area 3 — Double Stick", name: "Double Weave" },
  { area: "Area 3 — Double Stick", name: "Fluid Strikes" },
  { area: "Area 3 — Double Stick", name: "Call and Response" },
  { area: "Area 3 — Double Stick", name: "Broken 6" },
  { area: "Area 3 — Double Stick", name: "Overhead 6" },
  { area: "Area 3 — Double Stick", name: "Heaven 6" },
  { area: "Area 3 — Double Stick", name: "Standard 6" },
  { area: "Area 3 — Double Stick", name: "Earth 6" },
  { area: "Area 3 — Double Stick", name: "Sinawali Flow Build" },
  { area: "Area 3 — Double Stick", name: "64 Sinawali" },
  { area: "Area 3 — Double Stick", name: "Lower 8" },
  { area: "Area 3 — Double Stick", name: "Thrust Sinawali" },

  // AREA 4 — ESPADA Y DAGA
  { area: "Area 4 — Espada y Daga", name: "Espada Y Daga / Area 3" },
  { area: "Area 4 — Espada y Daga", name: "Basic X" },
  { area: "Area 4 — Espada y Daga", name: "Passing the Dagger" },
  { area: "Area 4 — Espada y Daga", name: "Fluid Strikes 1–4" },
  { area: "Area 4 — Espada y Daga", name: "Seguidas 1" },
  { area: "Area 4 — Espada y Daga", name: "Circular 2" },
  { area: "Area 4 — Espada y Daga", name: "Low High Drill" },
  { area: "Area 4 — Espada y Daga", name: "Broken 1" },

  // AREA 5 — KNIFE
  { area: "Area 5 — Knife", name: "Single Knife / Area 5" },
  { area: "Area 5 — Knife", name: "Sak Sak / Forward Grip" },
  { area: "Area 5 — Knife", name: "Sak Sak Fluid Thrusts" },
  { area: "Area 5 — Knife", name: "Sak Sak Broken Thrusts" },
  { area: "Area 5 — Knife", name: "5 Basic Strikes" },
  { area: "Area 5 — Knife", name: "Sak Sak Jab / Hand Roll" },
  { area: "Area 5 — Knife", name: "Sak Sak Jab / Technique" },
  { area: "Area 5 — Knife", name: "Pakal / Reverse Grip" },
  { area: "Area 5 — Knife", name: "Pakal Fluid Thrusts" },
  { area: "Area 5 — Knife", name: "Pakal Broken Thrusts" },
  { area: "Area 5 — Knife", name: "Pakal Slashes Form 1" },
  { area: "Area 5 — Knife", name: "Pakal Jab" },

  // AREA 6 — STAFF / SPEAR / OAR
  { area: "Area 6 — Staff / Spear / Oar", name: "Pole Arms" },
  { area: "Area 6 — Staff / Spear / Oar", name: "Staff Introduction" },
  { area: "Area 6 — Staff / Spear / Oar", name: "Sibat Basic Strikes" },
  { area: "Area 6 — Staff / Spear / Oar", name: "Bankaw Basic Strikes" },
  { area: "Area 6 — Staff / Spear / Oar", name: "Dula / Oar Basic Strikes" },
  { area: "Area 6 — Staff / Spear / Oar", name: "X Striking Pattern" },
  { area: "Area 6 — Staff / Spear / Oar", name: "8 Striking Pattern" },
  { area: "Area 6 — Staff / Spear / Oar", name: "- Striking Pattern" },

  // AREA 7 — SIBAT
  { area: "Area 7 — Sibat", name: "Spear Introduction" },
  { area: "Area 7 — Sibat", name: "Spear Grips" },
  { area: "Area 7 — Sibat", name: "Spear Thrusts — One-Hand Method" },
  { area: "Area 7 — Sibat", name: "Spear Thrusts — Two-Hand Method" },
];

export const ESCRIMA_AREAS = Array.from(new Set(ESCRIMA_SKILL_SEED.map((s) => s.area)));

// The existing weekly training schedule — preserved as-is, not replaced by
// the optional Foundations plan below.
export interface WeeklyScheduleSlot {
  weekday: number; // 0=Sun..6=Sat
  label: string;
  time: string;
  focus: string;
}

export const ESCRIMA_WEEKLY_SCHEDULE: WeeklyScheduleSlot[] = [
  { weekday: 2, label: "Tuesday", time: "19:30–20:00", focus: "Angles 1–6 + live-hand awareness" },
  { weekday: 4, label: "Thursday", time: "19:30–20:00", focus: "Flow drills + footwork" },
  { weekday: 5, label: "Friday", time: "19:30–20:00", focus: "Patterns + drills" },
  { weekday: 0, label: "Sunday", time: "19:30–20:00", focus: "Timing + accuracy" },
];

// Optional four-day Foundations program from the training spreadsheet —
// shown as a separate, non-mandatory plan. It does not replace the weekly
// schedule above.
export interface FoundationsDay {
  day: string;
  title: string;
  focus: string;
  duration: string;
}

export const ESCRIMA_FOUNDATIONS_PLAN: FoundationsDay[] = [
  { day: "Day A", title: "Stance & Triangle Footwork", focus: "Stance, balance, triangle movement", duration: "20–25 minutes" },
  { day: "Day B", title: "Diamond & Pivot Footwork", focus: "Diamond stepping, pivoting, spatial awareness", duration: "20–30 minutes" },
  { day: "Day C", title: "Strikes & Angles", focus: "Angles of attack and striking mechanics", duration: "25–30 minutes" },
  { day: "Day D", title: "Sinawali Flow", focus: "Single/double-stick weaving and flow", duration: "25–30 minutes" },
];

// Footwork Lab visual reference charts — named in the Drive library.
export const ESCRIMA_FOOTWORK_CHART_SEED: string[] = [
  "V-Step Forward Attack",
  "V-Step Backward Defend",
  "Triangle Step Forward Attack",
  "Triangle Step Lateral Attack",
  "Triangle Step Reverse Attack",
  "Cross Step",
  "Side Lunge",
  "Diamond",
  "Star",
  "X-Step",
  "Footwork Charts SVG",
];

// Suggested video collection categories — used as quick-pick tags when
// adding videos, not a claim that any of these are populated yet.
export const ESCRIMA_VIDEO_COLLECTIONS = [
  "Foundations",
  "Footwork",
  "Single Stick",
  "Double Stick / Sinawali",
  "Flow",
  "Empty Hand",
  "Espada y Daga",
  "Knife",
  "Disarms",
  "Timing / Drills",
  "Other",
];
