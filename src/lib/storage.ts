import { campaignData } from "../data/campaign";
import type {
  ArsenalItem,
  CharacterInventory,
  CharacterWallet,
  Location,
  MapEvent,
  MapGroup,
  PlayerCharacter,
  ReferenceArticle,
} from "../types/campaign";
import { normalizeLocation, normalizeQuest } from "./campaignNormalize";

export const LOCATIONS_STORAGE_KEY = "nri-table-locations";
export const QUESTS_STORAGE_KEY = "nri-table-quests";
export const NPCS_STORAGE_KEY = "nri-table-npcs";
export const ITEMS_STORAGE_KEY = "nri-table-items";
export const ARSENAL_ITEMS_STORAGE_KEY = "nri-table-arsenal-items";
export const GROUPS_STORAGE_KEY = "nri-table-groups";
export const EVENTS_STORAGE_KEY = "nri-table-events";
export const CHARACTERS_STORAGE_KEY = "nri-table-characters";
export const REFERENCE_ARTICLES_STORAGE_KEY = "nri-table-reference-articles";

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

export function createEmptyInventory(): CharacterInventory {
  return {
    weaponSlots: {
      shoulder1: {
        itemId: null,
        note: "",
      },
      shoulder2: {
        itemId: null,
        note: "",
      },
      small: {
        itemId: null,
        note: "",
      },
    },

    armorSlots: {
      head: {
        itemId: null,
        note: "",
      },
      torso: {
        itemId: null,
        note: "",
      },
      arms: {
        itemId: null,
        note: "",
      },
      legs: {
        itemId: null,
        note: "",
      },
    },

    protectionSlot: {
      itemId: null,
      note: "",
    },

    loadBearing: {
      itemId: null,
      note: "",
      quickSlots: [
        {
          id: "quick-1",
          itemId: null,
          quantity: 1,
          note: "",
        },
        {
          id: "quick-2",
          itemId: null,
          quantity: 1,
          note: "",
        },
      ],
    },

    backpack: [],
  };
}

export function createEmptyWallet(): CharacterWallet {
  return {
    amperies: 0,
    miliamperies: 0,
    note: "",
  };
}

function normalizeWallet(value: unknown): CharacterWallet {
  const emptyWallet = createEmptyWallet();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyWallet;
  }

  const wallet = value as Partial<CharacterWallet>;

  return {
    amperies:
      typeof wallet.amperies === "number" && Number.isFinite(wallet.amperies)
        ? Math.max(0, Math.floor(wallet.amperies))
        : 0,

    miliamperies:
      typeof wallet.miliamperies === "number" &&
        Number.isFinite(wallet.miliamperies)
        ? Math.max(0, Math.floor(wallet.miliamperies))
        : 0,

    note: typeof wallet.note === "string" ? wallet.note : "",
  };
}

function normalizeInventory(value: unknown): CharacterInventory {
  const emptyInventory = createEmptyInventory();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyInventory;
  }

  const inventory = value as Partial<CharacterInventory>;

  return {
    weaponSlots: {
      shoulder1: {
        ...emptyInventory.weaponSlots.shoulder1,
        ...(inventory.weaponSlots?.shoulder1 ?? {}),
      },
      shoulder2: {
        ...emptyInventory.weaponSlots.shoulder2,
        ...(inventory.weaponSlots?.shoulder2 ?? {}),
      },
      small: {
        ...emptyInventory.weaponSlots.small,
        ...(inventory.weaponSlots?.small ?? {}),
      },
    },

    armorSlots: {
      head: {
        ...emptyInventory.armorSlots.head,
        ...(inventory.armorSlots?.head ?? {}),
      },
      torso: {
        ...emptyInventory.armorSlots.torso,
        ...(inventory.armorSlots?.torso ?? {}),
      },
      arms: {
        ...emptyInventory.armorSlots.arms,
        ...(inventory.armorSlots?.arms ?? {}),
      },
      legs: {
        ...emptyInventory.armorSlots.legs,
        ...(inventory.armorSlots?.legs ?? {}),
      },
    },

    protectionSlot: {
      ...emptyInventory.protectionSlot,
      ...(inventory.protectionSlot ?? {}),
    },

    loadBearing: {
      itemId:
        typeof inventory.loadBearing?.itemId === "string"
          ? inventory.loadBearing.itemId
          : null,
      note:
        typeof inventory.loadBearing?.note === "string"
          ? inventory.loadBearing.note
          : "",
      quickSlots: Array.isArray(inventory.loadBearing?.quickSlots)
        ? inventory.loadBearing.quickSlots.slice(0, 6).map((slot, index) => ({
          id:
            typeof slot.id === "string" && slot.id.trim().length > 0
              ? slot.id
              : `quick-${index + 1}`,
          itemId: typeof slot.itemId === "string" ? slot.itemId : null,
          quantity:
            typeof slot.quantity === "number" && Number.isFinite(slot.quantity)
              ? Math.max(1, Math.floor(slot.quantity))
              : 1,
          note: typeof slot.note === "string" ? slot.note : "",
        }))
        : emptyInventory.loadBearing.quickSlots,
    },

    backpack: Array.isArray(inventory.backpack)
      ? inventory.backpack
        .filter((entry) => {
          return (
            entry &&
            typeof entry === "object" &&
            "itemId" in entry &&
            typeof entry.itemId === "string"
          );
        })
        .map((entry, index) => ({
          id:
            typeof entry.id === "string" && entry.id.trim().length > 0
              ? entry.id
              : `backpack-${Date.now()}-${index}`,
          itemId: entry.itemId,
          quantity:
            typeof entry.quantity === "number" &&
              Number.isFinite(entry.quantity)
              ? Math.max(1, Math.floor(entry.quantity))
              : 1,
          note: typeof entry.note === "string" ? entry.note : "",
        }))
      : [],
  };
}

function normalizeArsenalItem(item: Partial<ArsenalItem>): ArsenalItem {
  return {
    id:
      typeof item.id === "string" && item.id.trim().length > 0
        ? item.id
        : `arsenal-item-${Date.now()}`,
    name:
      typeof item.name === "string" && item.name.trim().length > 0
        ? item.name
        : "Новый предмет",

    category: item.category ?? "misc",
    slot: item.slot ?? "backpack",

    description: item.description ?? "",
    rules: item.rules ?? "",
    tags: item.tags ?? "",
    rarity: item.rarity ?? "",
    weight: item.weight ?? "",
    price: item.price ?? "",

    quickSlotCount: item.quickSlotCount,
    isVisibleToPlayers: Boolean(item.isVisibleToPlayers),
  };
}

export function loadSavedArsenalItems() {
  const savedItems = localStorage.getItem(ARSENAL_ITEMS_STORAGE_KEY);

  if (!savedItems) {
    return campaignData.arsenalItems;
  }

  try {
    const parsedItems = JSON.parse(savedItems);

    if (!Array.isArray(parsedItems)) {
      return campaignData.arsenalItems;
    }

    return parsedItems.map((item) =>
      normalizeArsenalItem(item as Partial<ArsenalItem>),
    );
  } catch {
    return campaignData.arsenalItems;
  }
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
    wallet: normalizeWallet(character.wallet),

    inventory: normalizeInventory(character.inventory),

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

function normalizeReferenceArticle(
  article: ReferenceArticle,
): ReferenceArticle {
  return {
    ...article,

    id: article.id ?? `reference-${Date.now()}`,
    section: article.section ?? "other",
    subsection: article.subsection ?? "",
    title: article.title ?? "Новая статья",
    content: article.content ?? "",

    visibility: article.visibility ?? "master",

    tags: article.tags ?? "",

    imageUrls: Array.isArray(article.imageUrls) ? article.imageUrls : [],
    assetIds: Array.isArray(article.assetIds) ? article.assetIds : [],

    updatedAt: article.updatedAt ?? new Date().toISOString(),
  };
}

export function loadSavedReferenceArticles() {
  const savedArticles = localStorage.getItem(REFERENCE_ARTICLES_STORAGE_KEY);

  if (!savedArticles) {
    return campaignData.referenceArticles;
  }

  try {
    const parsedArticles = JSON.parse(savedArticles);

    if (!Array.isArray(parsedArticles)) {
      return campaignData.referenceArticles;
    }

    return parsedArticles.map((article) =>
      normalizeReferenceArticle(article as ReferenceArticle),
    );
  } catch {
    return campaignData.referenceArticles;
  }
}