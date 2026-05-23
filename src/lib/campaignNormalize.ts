import type { Location, Quest } from "../types/campaign";

export function normalizeLocation(location: Location): Location {
  return {
    ...location,
    category: location.category ?? (location.isSecret ? "secret" : "settlement"),
    imageUrl: String(location.imageUrl ?? ""),
    isSecret: Boolean(location.isSecret),
  };
}

export function normalizeQuest(rawQuest: unknown, index: number): Quest {
  if (typeof rawQuest === "string") {
    return {
      id: `quest-${index}-${rawQuest}`,
      title: rawQuest,
      description: "",
      status: "active",
      isSecret: false,
      giver: "",
      reward: "",
      relatedLocationId: "",
      masterNotes: "",
    };
  }

  const quest = rawQuest as Partial<Quest>;

  const allowedStatuses: Quest["status"][] = [
    "active",
    "completed",
    "failed",
    "hidden",
  ];

  const status = allowedStatuses.includes(quest.status as Quest["status"])
    ? (quest.status as Quest["status"])
    : "active";

  return {
    id: String(quest.id ?? `quest-${Date.now()}-${index}`),
    title: String(quest.title ?? `Поручение ${index + 1}`),
    description: String(quest.description ?? ""),
    status,
    isSecret: Boolean(quest.isSecret),
    giver: String(quest.giver ?? ""),
    reward: String(quest.reward ?? ""),
    relatedLocationId: String(quest.relatedLocationId ?? ""),
    masterNotes: String(quest.masterNotes ?? ""),
  };
}