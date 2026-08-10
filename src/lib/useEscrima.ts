import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrainingSession, TrainingSkill, TrainingSkillStatus } from "./types";
import {
  loadTrainingSessions,
  loadTrainingSkills,
  saveTrainingSession,
  saveTrainingSkill,
  seedTrainingSkillsIfEmpty,
} from "./storage";
import { ESCRIMA_SKILL_SEED, ESCRIMA_WEEKLY_SCHEDULE } from "./escrimaSeed";
import { genId } from "./id";
import { operationalDayForInstant } from "./operationalDay";

function buildSeedSkills(): TrainingSkill[] {
  const now = new Date().toISOString();
  return ESCRIMA_SKILL_SEED.map((s) => ({
    id: `escrima-skill-${s.area}-${s.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    area: s.area,
    subarea: s.subarea ?? "",
    name: s.name,
    status: "NOT_STARTED" as TrainingSkillStatus,
    lastPractised: null,
    timesPractised: 0,
    practiceMinutes: 0,
    confidence: 1,
    leftSideConfidence: null,
    rightSideConfidence: null,
    notes: "",
    nextReview: null,
    updatedAt: now,
  }));
}

export function useEscrima(wakeTime = "18:30") {
  const [skills, setSkills] = useState<TrainingSkill[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedTrainingSkillsIfEmpty(buildSeedSkills());
      const [sk, se] = await Promise.all([loadTrainingSkills(), loadTrainingSessions()]);
      setSkills(sk);
      setSessions(se);
      setLoading(false);
    })();
  }, []);

  const updateSkill = useCallback(async (id: string, patch: Partial<TrainingSkill>) => {
    setSkills((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
      );
      const updated = next.find((s) => s.id === id);
      if (updated) saveTrainingSkill(updated);
      return next;
    });
  }, []);

  const skillsByArea = useMemo(() => {
    const map = new Map<string, TrainingSkill[]>();
    for (const s of skills) {
      const list = map.get(s.area) ?? [];
      list.push(s);
      map.set(s.area, list);
    }
    return map;
  }, [skills]);

  const todaysScheduleSlot = useMemo(() => {
    const weekday = new Date().getDay();
    return ESCRIMA_WEEKLY_SCHEDULE.find((s) => s.weekday === weekday) ?? null;
  }, []);

  /** A skill worth revisiting: never practised, or practised longest ago. */
  const skillNeedingReview = useMemo(() => {
    if (skills.length === 0) return null;
    const notStarted = skills.filter((s) => s.status === "NOT_STARTED");
    if (notStarted.length > 0) return notStarted[0];
    return [...skills].sort((a, b) => (a.lastPractised ?? "").localeCompare(b.lastPractised ?? ""))[0];
  }, [skills]);

  const thisWeekSessionCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    return sessions.filter((s) => new Date(s.dateTime) >= weekAgo).length;
  }, [sessions]);

  /** Proportional breakdown of a session, using only what's actually in the
   * curriculum — never inventing drill names that aren't seeded. */
  const buildSuggestion = useCallback(
    (minutes: number) => {
      const parts: string[] = [];
      const warmup = minutes >= 10 ? Math.max(2, Math.round(minutes * 0.15)) : 0;
      const footwork = minutes >= 10 ? Math.max(3, Math.round(minutes * 0.25)) : Math.round(minutes * 0.4);
      const flow = minutes >= 20 ? Math.max(2, Math.round(minutes * 0.15)) : 0;
      const focusMinutes = Math.max(1, minutes - warmup - footwork - flow);
      if (warmup) parts.push(`${warmup} min warm-up`);
      parts.push(`${footwork} min footwork`);
      const focusLabel = skillNeedingReview ? skillNeedingReview.name : todaysScheduleSlot?.focus ?? "open practice";
      parts.push(`${focusMinutes} min ${focusLabel}`);
      if (flow) parts.push(`${flow} min slow flow`);
      return parts.join(" · ");
    },
    [skillNeedingReview, todaysScheduleSlot]
  );

  const trainNow = useCallback(
    async (minutes: number) => {
      const now = new Date();
      const plannedFocus = todaysScheduleSlot?.focus ?? skillNeedingReview?.name ?? "Open practice";
      const session: TrainingSession = {
        id: genId(),
        dateTime: now.toISOString(),
        operationalDay: operationalDayForInstant(now, wakeTime),
        durationMinutes: minutes,
        plannedFocus,
        actualFocus: plannedFocus,
        skillsPractised: skillNeedingReview ? [skillNeedingReview.id] : [],
        energyBefore: null,
        energyAfter: null,
        confidenceNotes: "",
        technicalNotes: "",
        nextTime: "",
        completed: true,
      };
      setSessions((prev) => [session, ...prev]);
      await saveTrainingSession(session);
      if (skillNeedingReview) {
        await updateSkill(skillNeedingReview.id, {
          lastPractised: now.toISOString().slice(0, 10),
          timesPractised: skillNeedingReview.timesPractised + 1,
          practiceMinutes: skillNeedingReview.practiceMinutes + minutes,
          status: skillNeedingReview.status === "NOT_STARTED" ? "LEARNING" : skillNeedingReview.status,
        });
      }
      return session;
    },
    [skillNeedingReview, todaysScheduleSlot, updateSkill, wakeTime]
  );

  return {
    loading,
    skills,
    sessions,
    skillsByArea,
    todaysScheduleSlot,
    skillNeedingReview,
    thisWeekSessionCount,
    updateSkill,
    buildSuggestion,
    trainNow,
  };
}
