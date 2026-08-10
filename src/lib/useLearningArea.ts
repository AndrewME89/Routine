import { useCallback, useEffect, useState } from "react";
import type {
  LearningArea,
  LearningResource,
  LearningSession,
  LearningTopic,
  ResourceStatus,
  TopicStatus,
} from "./types";
import {
  deleteLearningResource,
  loadLearningResources,
  loadLearningSessions,
  loadLearningTopics,
  saveLearningResource,
  saveLearningSession,
  saveLearningTopic,
  seedLearningTopicsIfEmpty,
} from "./storage";
import { genId } from "./id";
import { operationalDayForInstant } from "./operationalDay";

export interface NewResourceInput {
  title: string;
  resourceType: LearningResource["resourceType"];
  sourceType: LearningResource["sourceType"];
  sourceURL: string;
  category: string;
  subcategory?: string;
  level?: string;
  notes?: string;
}

export function useLearningArea(area: LearningArea, topicSeedAreas: string[], wakeTime = "18:30") {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      await seedLearningTopicsIfEmpty(
        area,
        topicSeedAreas.map((a) => ({
          id: `${area.toLowerCase()}-topic-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          learningArea: area,
          area: a,
          status: "NOT_STARTED" as TopicStatus,
          notes: "",
          updatedAt: now,
        }))
      );
      const [r, s, t] = await Promise.all([
        loadLearningResources(area),
        loadLearningSessions(area),
        loadLearningTopics(area),
      ]);
      setResources(r);
      setSessions(s);
      setTopics(t);
      setLoading(false);
    })();
    // topicSeedAreas is static per-page; area is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  const addResource = useCallback(
    async (input: NewResourceInput) => {
      const now = new Date().toISOString();
      const resource: LearningResource = {
        id: genId(),
        learningArea: area,
        title: input.title.trim(),
        resourceType: input.resourceType,
        sourceType: input.sourceType,
        sourceURL: input.sourceURL.trim(),
        category: input.category,
        subcategory: input.subcategory ?? "",
        level: input.level ?? "",
        notes: input.notes ?? "",
        status: "UNREAD",
        favourite: false,
        lastOpened: null,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      setResources((prev) => [resource, ...prev]);
      await saveLearningResource(resource);
      return resource;
    },
    [area]
  );

  const updateResource = useCallback(async (id: string, patch: Partial<LearningResource>) => {
    setResources((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      );
      const updated = next.find((r) => r.id === id);
      if (updated) saveLearningResource(updated);
      return next;
    });
  }, []);

  const openResource = useCallback(
    (id: string) => updateResource(id, { lastOpened: new Date().toISOString() }),
    [updateResource]
  );

  const removeResource = useCallback(async (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    await deleteLearningResource(id);
  }, []);

  const updateTopic = useCallback(async (id: string, patch: Partial<LearningTopic>) => {
    setTopics((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
      );
      const updated = next.find((t) => t.id === id);
      if (updated) saveLearningTopic(updated);
      return next;
    });
  }, []);

  const logSession = useCallback(
    async (durationMinutes: number, activityType: string, focus: string) => {
      const now = new Date();
      const session: LearningSession = {
        id: genId(),
        learningArea: area,
        dateTime: now.toISOString(),
        operationalDay: operationalDayForInstant(now, wakeTime),
        durationMinutes,
        activityType,
        focus,
        notes: "",
        completed: true,
      };
      setSessions((prev) => [session, ...prev]);
      await saveLearningSession(session);
      return session;
    },
    [area, wakeTime]
  );

  return {
    loading,
    resources,
    sessions,
    topics,
    addResource,
    updateResource,
    openResource,
    removeResource,
    updateTopic,
    logSession,
  };
}

export const RESOURCE_STATUS_LABEL: Record<ResourceStatus, string> = {
  UNREAD: "Unread",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
  REFERENCE: "Reference",
  ARCHIVED: "Archived",
  NEEDS_REVIEW: "Needs Review",
};

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
};
