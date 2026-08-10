import { useCallback, useEffect, useState } from "react";
import type {
  JapaneseSettings,
  JapaneseSkillConfidence,
  JapaneseSkillStatus,
  JapaneseWorksheet,
  LearningFlashcard,
  WorksheetStatus,
} from "./types";
import {
  deleteFlashcard as deleteFlashcardDb,
  deleteJapaneseWorksheet as deleteWorksheetDb,
  loadFlashcards,
  loadJapaneseSettings,
  loadJapaneseSkills,
  loadJapaneseWorksheets,
  saveFlashcard,
  saveJapaneseSettings,
  saveJapaneseSkill,
  saveJapaneseWorksheet,
  seedJapaneseSkillsIfEmpty,
} from "./storage";
import { JAPANESE_SKILLS } from "./japaneseSeed";
import { genId } from "./id";

function buildSeedSkills(): JapaneseSkillConfidence[] {
  const now = new Date().toISOString();
  return JAPANESE_SKILLS.map((skill) => ({
    id: `japanese-skill-${skill.toLowerCase()}`,
    skill,
    status: "NOT_STARTED" as JapaneseSkillStatus,
    updatedAt: now,
  }));
}

export function useJapanese() {
  const [skills, setSkills] = useState<JapaneseSkillConfidence[]>([]);
  const [worksheets, setWorksheets] = useState<JapaneseWorksheet[]>([]);
  const [flashcards, setFlashcards] = useState<LearningFlashcard[]>([]);
  const [settings, setSettings] = useState<JapaneseSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedJapaneseSkillsIfEmpty(buildSeedSkills());
      const [sk, ws, fc, st] = await Promise.all([
        loadJapaneseSkills(),
        loadJapaneseWorksheets(),
        loadFlashcards("JAPANESE"),
        loadJapaneseSettings(),
      ]);
      setSkills(sk);
      setWorksheets(ws);
      setFlashcards(fc);
      setSettings(st);
      setLoading(false);
    })();
  }, []);

  const setSkillStatus = useCallback((id: string, status: JapaneseSkillStatus) => {
    setSkills((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
      const updated = next.find((s) => s.id === id);
      if (updated) saveJapaneseSkill(updated);
      return next;
    });
  }, []);

  const addWorksheet = useCallback(async (title: string, worksheetURL = "", answerKeyURL = "") => {
    const now = new Date().toISOString();
    const w: JapaneseWorksheet = {
      id: genId(),
      title: title.trim(),
      status: "NOT_STARTED",
      worksheetURL,
      answerKeyURL,
      answerKeyRevealed: false,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    setWorksheets((prev) => [w, ...prev]);
    await saveJapaneseWorksheet(w);
  }, []);

  const updateWorksheet = useCallback(async (id: string, patch: Partial<JapaneseWorksheet>) => {
    setWorksheets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w));
      const updated = next.find((w) => w.id === id);
      if (updated) saveJapaneseWorksheet(updated);
      return next;
    });
  }, []);

  const removeWorksheet = useCallback(async (id: string) => {
    setWorksheets((prev) => prev.filter((w) => w.id !== id));
    await deleteWorksheetDb(id);
  }, []);

  const addFlashcard = useCallback(
    async (input: {
      front: string;
      reading: string;
      romaji: string;
      englishMeaning: string;
      category: string;
    }) => {
      const now = new Date().toISOString();
      const card: LearningFlashcard = {
        id: genId(),
        learningArea: "JAPANESE",
        front: input.front,
        reading: input.reading,
        romaji: input.romaji,
        englishMeaning: input.englishMeaning,
        category: input.category,
        sourceResource: "",
        notes: "",
        confidence: 1,
        createdAt: now,
        updatedAt: now,
      };
      setFlashcards((prev) => [card, ...prev]);
      await saveFlashcard(card);
    },
    []
  );

  const updateFlashcard = useCallback(async (id: string, patch: Partial<LearningFlashcard>) => {
    setFlashcards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
      const updated = next.find((c) => c.id === id);
      if (updated) saveFlashcard(updated);
      return next;
    });
  }, []);

  const removeFlashcard = useCallback(async (id: string) => {
    setFlashcards((prev) => prev.filter((c) => c.id !== id));
    await deleteFlashcardDb(id);
  }, []);

  const updateSettings = useCallback((patch: Partial<JapaneseSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveJapaneseSettings(next);
      return next;
    });
  }, []);

  return {
    loading,
    skills,
    worksheets,
    flashcards,
    settings,
    setSkillStatus,
    addWorksheet,
    updateWorksheet,
    removeWorksheet,
    addFlashcard,
    updateFlashcard,
    removeFlashcard,
    updateSettings,
  };
}

export const WORKSHEET_STATUS_LABEL: Record<WorksheetStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REVIEW: "Review",
};
