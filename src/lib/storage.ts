import { campaignData } from "../data/campaign";
import type { Location, MapEvent, MapGroup } from "../types/campaign";
import { normalizeLocation, normalizeQuest } from "./campaignNormalize";

export const LOCATIONS_STORAGE_KEY = "nri-table-locations";
export const QUESTS_STORAGE_KEY = "nri-table-quests";
export const NPCS_STORAGE_KEY = "nri-table-npcs";
export const ITEMS_STORAGE_KEY = "nri-table-items";
export const GROUPS_STORAGE_KEY = "nri-table-groups";
export const EVENTS_STORAGE_KEY = "nri-table-events";

export function loadSavedLocations() {
  const savedLocations = localStorage.getItem(LOCATIONS_STORAGE_KEY);

  if (!savedLocations) {
    return campaignData.locations;
  }

  try {
    const parsedLocations = JSON.parse(savedLocations) as Location[];

    if (!Array.isArray(parsedLocations)) {
      return campaignData.locations;
    }

    return parsedLocations.map(normalizeLocation);
  } catch {
    return campaignData.locations;
  }
}

export function loadSavedQuests() {
  const savedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);

  if (!savedQuests) {
    return campaignData.quests;
  }

  try {
    const parsedQuests = JSON.parse(savedQuests);

    if (!Array.isArray(parsedQuests)) {
      return campaignData.quests;
    }

    return parsedQuests.map(normalizeQuest);
  } catch {
    return campaignData.quests;
  }
}

export function loadSavedTextList(storageKey: string, fallbackItems: string[]) {
  const savedItems = localStorage.getItem(storageKey);

  if (!savedItems) {
    return fallbackItems;
  }

  try {
    const parsedItems = JSON.parse(savedItems);

    if (!Array.isArray(parsedItems)) {
      return fallbackItems;
    }

    return parsedItems.map(String);
  } catch {
    return fallbackItems;
  }
}

export function saveToStorage(storageKey: string, value: unknown) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function loadSavedGroups() {
  const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);

  if (!savedGroups) {
    return campaignData.groups;
  }

  try {
    const parsedGroups = JSON.parse(savedGroups) as MapGroup[];

    if (!Array.isArray(parsedGroups)) {
      return campaignData.groups;
    }

    return parsedGroups.map((group) => ({
      ...group,
      isSecret: Boolean(group.isSecret),
      members: Array.isArray(group.members) ? group.members : [],
    }));
  } catch {
    return campaignData.groups;
  }
}

export function loadSavedEvents() {
  const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);

  if (!savedEvents) {
    return campaignData.events;
  }

  try {
    const parsedEvents = JSON.parse(savedEvents);

    if (!Array.isArray(parsedEvents)) {
      return campaignData.events;
    }

    return parsedEvents.map((event): MapEvent => ({
      ...event,
      status: event.status ?? "hidden",
      isSecret: Boolean(event.isSecret),
    }));
  } catch {
    return campaignData.events;
  }
}