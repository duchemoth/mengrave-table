import { campaignData } from "../data/campaign";
import type { Location, MapEvent, MapGroup, PlayerCharacter } from "../types/campaign";
import { normalizeLocation, normalizeQuest } from "./campaignNormalize";

export const LOCATIONS_STORAGE_KEY = "nri-table-locations";
export const QUESTS_STORAGE_KEY = "nri-table-quests";
export const NPCS_STORAGE_KEY = "nri-table-npcs";
export const ITEMS_STORAGE_KEY = "nri-table-items";
export const GROUPS_STORAGE_KEY = "nri-table-groups";
export const EVENTS_STORAGE_KEY = "nri-table-events";
export const CHARACTERS_STORAGE_KEY = "nri-table-characters";

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

function createEmptyCharacterSkills() {
  return {
    melee: 0,
    shooting: 0,
    specialWeapons: 0,
    athletics: 0,
    endurance: 0,
    stealth: 0,
    observation: 0,
    tracking: 0,
    navigation: 0,
    survival: 0,
    firstAid: 0,
    medicine: 0,
    repair: 0,
    devices: 0,
    crowns: 0,
    driving: 0,
    tactics: 0,
    intimidation: 0,
    negotiation: 0,
    insight: 0,
    criminal: 0,
    factions: 0,
    neurography: 0,
    echoInfophone: 0,
  };
}

function normalizeCharacter(character: PlayerCharacter): PlayerCharacter {
  const emptySkills = createEmptyCharacterSkills();

  return {
    ...character,

    ownerPlayerName: character.ownerPlayerName ?? "",
    status: character.status ?? "approved",
    isVisibleToPlayers: Boolean(character.isVisibleToPlayers),

    playerName: character.playerName ?? "",
    characterName: character.characterName ?? "Новый Вольный Клинок",
    nickname: character.nickname ?? "",
    oldName: character.oldName ?? "",
    oldNameKnownBy: character.oldNameKnownBy ?? "",

    age: character.age ?? "",
    origin: character.origin ?? "",
    formerActivity: character.formerActivity ?? "",
    reasonToBecomeFreeblade: character.reasonToBecomeFreeblade ?? "",
    personalGoal: character.personalGoal ?? "",
    squadConnection: character.squadConnection ?? "",

    mass: character.mass ?? "normal",
    empathy: character.empathy ?? "normal",

    physicalReserve: character.physicalReserve ?? 4,
    psyche: character.psyche ?? 4,
    spirit: character.spirit ?? 3,
    fate: character.fate ?? 1,

    maxPhysicalReserve: character.maxPhysicalReserve ?? 4,
    maxPsyche: character.maxPsyche ?? 4,
    maxSpirit: character.maxSpirit ?? 3,
    maxFate: character.maxFate ?? 3,

    skills: {
      ...emptySkills,
      ...(character.skills ?? {}),
    },

    specializations: character.specializations ?? "",
    traits: character.traits ?? "",

    woundsAndConditions: character.woundsAndConditions ?? "",
    reflectionNotes: character.reflectionNotes ?? "",

    quickAccess: character.quickAccess ?? "",
    backpackAndLoad: character.backpackAndLoad ?? "",
    weapons: character.weapons ?? "",
    armor: character.armor ?? "",
    cryptotoken: character.cryptotoken ?? "",

    contacts: character.contacts ?? "",
    debts: character.debts ?? "",
    enemies: character.enemies ?? "",
    patrons: character.patrons ?? "",

    progressionNotes: character.progressionNotes ?? "",
    secretHooks: character.secretHooks ?? "",
    masterNotes: character.masterNotes ?? "",
  };
}

export function loadSavedCharacters() {
  const savedCharacters = localStorage.getItem(CHARACTERS_STORAGE_KEY);

  if (!savedCharacters) {
    return campaignData.characters;
  }

  try {
    const parsedCharacters = JSON.parse(savedCharacters);

    if (!Array.isArray(parsedCharacters)) {
      return campaignData.characters;
    }

    return parsedCharacters.map((character) =>
      normalizeCharacter(character as PlayerCharacter),
    );
  } catch {
    return campaignData.characters;
  }
}