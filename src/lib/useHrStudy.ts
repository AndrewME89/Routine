import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  HrAssessment,
  HrAssessmentStatus,
  HrCourseSettings,
  HrModule,
  HrModuleStatus,
  HrReferenceNote,
} from "./types";
import {
  loadHrAssessments,
  loadHrCourseSettings,
  loadHrModules,
  loadHrReferenceNotes,
  saveHrAssessment,
  deleteHrAssessment as deleteHrAssessmentDb,
  saveHrCourseSettings,
  saveHrModule,
  saveHrReferenceNote,
  seedHrModulesIfEmpty,
} from "./storage";
import { HR_MODULE_SEED } from "./hrSeed";
import { genId } from "./id";

function buildSeedModules(): HrModule[] {
  const now = new Date().toISOString();
  return HR_MODULE_SEED.map((m) => ({
    id: `hr-module-${m.order}`,
    order: m.order,
    unitCode: m.unitCode,
    title: m.title,
    assessmentsPlanned: m.assessmentsPlanned,
    indicativeHours: m.indicativeHours,
    // Module 1 starts AVAILABLE (nothing is guessed as ACTIVE without the
    // user confirming it in setup); everything else starts LOCKED/FUTURE.
    status: m.order === 1 ? "AVAILABLE" : "LOCKED",
    topicsCompleted: 0,
    topicsTotal: 0,
    activitiesCompleted: 0,
    activitiesTotal: 0,
    notes: "",
    lastStudied: null,
    updatedAt: now,
  }));
}

export function useHrStudy() {
  const [modules, setModules] = useState<HrModule[]>([]);
  const [assessments, setAssessments] = useState<HrAssessment[]>([]);
  const [courseSettings, setCourseSettings] = useState<HrCourseSettings | null>(null);
  const [referenceNotes, setReferenceNotes] = useState<HrReferenceNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedHrModulesIfEmpty(buildSeedModules());
      const [m, a, cs, rn] = await Promise.all([
        loadHrModules(),
        loadHrAssessments(),
        loadHrCourseSettings(),
        loadHrReferenceNotes(),
      ]);
      setModules(m);
      setAssessments(a);
      setCourseSettings(cs);
      setReferenceNotes(rn);
      setLoading(false);
    })();
  }, []);

  const activeModule = useMemo(() => modules.find((m) => m.status === "ACTIVE") ?? null, [modules]);

  const updateModule = useCallback(async (id: string, patch: Partial<HrModule>) => {
    setModules((prev) => {
      const next = prev.map((m) =>
        m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
      );
      const updated = next.find((m) => m.id === id);
      if (updated) saveHrModule(updated);
      return next;
    });
  }, []);

  const setModuleStatus = useCallback(
    (id: string, status: HrModuleStatus) => updateModule(id, { status }),
    [updateModule]
  );

  /** Setup: pick which module is currently active. Modules before it are left
   * AVAILABLE (not guessed as competent), the chosen one becomes ACTIVE,
   * everything after stays LOCKED/FUTURE. */
  const chooseActiveModule = useCallback(
    async (moduleId: string) => {
      const target = modules.find((m) => m.id === moduleId);
      if (!target) return;
      const now = new Date().toISOString();
      const next = modules.map((m) => {
        if (m.id === moduleId) return { ...m, status: "ACTIVE" as const, updatedAt: now };
        if (m.order < target.order && m.status === "LOCKED") {
          return { ...m, status: "AVAILABLE" as const, updatedAt: now };
        }
        return m;
      });
      setModules(next);
      for (const m of next) {
        if (m.id === moduleId || (m.order < target.order && m.status === "AVAILABLE")) {
          saveHrModule(m);
        }
      }
    },
    [modules]
  );

  /** All assessments submitted (not necessarily graded) unlocks the next module. */
  const unlockNext = useCallback(
    async (currentModuleId: string) => {
      const current = modules.find((m) => m.id === currentModuleId);
      if (!current) return;
      const now = new Date().toISOString();
      const next = modules.map((m) => {
        if (m.id === currentModuleId) return { ...m, status: "ASSESSMENTS_SUBMITTED" as const, updatedAt: now };
        if (m.order === current.order + 1 && m.status === "LOCKED") {
          return { ...m, status: "AVAILABLE" as const, updatedAt: now };
        }
        return m;
      });
      setModules(next);
      for (const m of next) {
        if (m.id === currentModuleId || m.order === current.order + 1) saveHrModule(m);
      }
    },
    [modules]
  );

  const moduleAssessments = useCallback(
    (moduleId: string) => assessments.filter((a) => a.moduleId === moduleId),
    [assessments]
  );

  const addAssessment = useCallback(async (moduleId: string, title: string) => {
    const now = new Date().toISOString();
    const assessment: HrAssessment = {
      id: genId(),
      moduleId,
      title: title.trim(),
      assessmentType: "UNKNOWN",
      status: "NOT_STARTED",
      submittedDate: null,
      attemptNumber: 1,
      feedbackNotes: "",
      updatedAt: now,
    };
    setAssessments((prev) => [...prev, assessment]);
    await saveHrAssessment(assessment);
  }, []);

  const updateAssessment = useCallback(async (id: string, patch: Partial<HrAssessment>) => {
    setAssessments((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
      );
      const updated = next.find((a) => a.id === id);
      if (updated) saveHrAssessment(updated);
      return next;
    });
  }, []);

  const removeAssessment = useCallback(async (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    await deleteHrAssessmentDb(id);
  }, []);

  const setAssessmentStatus = useCallback(
    (id: string, status: HrAssessmentStatus) => {
      const patch: Partial<HrAssessment> = { status };
      if (status === "SUBMITTED" && !assessments.find((a) => a.id === id)?.submittedDate) {
        patch.submittedDate = new Date().toISOString().slice(0, 10);
      }
      return updateAssessment(id, patch);
    },
    [assessments, updateAssessment]
  );

  const updateCourseSettings = useCallback(async (patch: Partial<HrCourseSettings>) => {
    setCourseSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveHrCourseSettings(next);
      return next;
    });
  }, []);

  const setReferenceNote = useCallback(
    (id: string, patch: Partial<Omit<HrReferenceNote, "id">>) => {
      setReferenceNotes((prev) => {
        const existing = prev.find((n) => n.id === id) ?? { id, favourite: false, note: "" };
        const updated = { ...existing, ...patch };
        const next = [...prev.filter((n) => n.id !== id), updated];
        saveHrReferenceNote(updated);
        return next;
      });
    },
    []
  );

  return {
    loading,
    modules,
    assessments,
    courseSettings,
    referenceNotes,
    activeModule,
    updateModule,
    setModuleStatus,
    chooseActiveModule,
    unlockNext,
    moduleAssessments,
    addAssessment,
    updateAssessment,
    removeAssessment,
    setAssessmentStatus,
    updateCourseSettings,
    setReferenceNote,
  };
}
