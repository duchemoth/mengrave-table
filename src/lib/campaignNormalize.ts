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
    };
  }

  const quest = rawQuest as Partial<Quest>;

  return {
    id: String(quest.id ?? `quest-${Date.now()}-${index}`),
    title: String(quest.title ?? `Поручение ${index + 1}`),
    description: String(quest.description ?? ""),
    status: quest.status ?? "active",
    isSecret: Boolean(quest.isSecret),
  };
}