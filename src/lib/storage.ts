import { campaignData } from "../data/campaign";
import type {
  ArsenalArmorSubtype,
  ArsenalItem,
  ArsenalItemCategory,
  ArsenalItemSlot,
  ArsenalResourceSubtype,
  ArsenalWeaponSubtype,
  CharacterBodyZone,
  CharacterConditionEntry,
  CharacterConditionKey,
  CharacterInventory,
  CharacterWallet,
  CharacterWoundEntry,
  CharacterWoundSeverity,
  CharacterWoundStatus,
  CharacterWoundType,
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

    backpackSlot: {
      itemId: null,
      note: "",
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

    backpackSlot: {
      ...emptyInventory.backpackSlot,
      ...(inventory.backpackSlot ?? {}),
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

const ARSENAL_ITEM_CATEGORIES: ArsenalItemCategory[] = [
  "weapon",
  "armor",
  "protection",
  "loadBearing",
  "storage",
  "tool",
  "medicine",
  "resource",
  "quest",
  "misc",
];

const ARSENAL_ITEM_SLOTS: ArsenalItemSlot[] = [
  "shoulderWeapon",
  "smallWeapon",
  "headArmor",
  "torsoArmor",
  "armsArmor",
  "legsArmor",
  "protection",
  "loadBearing",
  "quick",
  "backpack",
  "none",
];

const ARSENAL_WEAPON_SUBTYPES: ArsenalWeaponSubtype[] = [
  "melee",
  "firearm",
  "throwing",
  "special",
  "explosive",
  "combined",
  "other",
];

const ARSENAL_ARMOR_SUBTYPES: ArsenalArmorSubtype[] = [
  "head",
  "torso",
  "arms",
  "legs",
  "shield",
  "fullBody",
  "other",
];

const ARSENAL_RESOURCE_SUBTYPES: ArsenalResourceSubtype[] = [
  "supplies",
  "fuel",
  "ammo",
  "drink",
  "materials",
  "other",
];

function normalizeArsenalSlot(slot: ArsenalItem["slot"] | undefined): ArsenalItemSlot {
  return slot && ARSENAL_ITEM_SLOTS.includes(slot) ? slot : "none";
}

function normalizeArsenalCategory(
  category: ArsenalItem["category"] | undefined,
  slot: ArsenalItemSlot,
): ArsenalItemCategory {
  if (slot === "backpack") {
    return "storage";
  }

  if (slot === "loadBearing") {
    return "loadBearing";
  }

  if (
    slot === "headArmor" ||
    slot === "torsoArmor" ||
    slot === "armsArmor" ||
    slot === "legsArmor"
  ) {
    return "armor";
  }

  if (slot === "shoulderWeapon" || slot === "smallWeapon") {
    return "weapon";
  }

  return category && ARSENAL_ITEM_CATEGORIES.includes(category)
    ? category
    : "misc";
}

function normalizeWeaponSubtype(
  value: ArsenalItem["weaponSubtype"] | undefined,
): ArsenalWeaponSubtype | undefined {
  return value && ARSENAL_WEAPON_SUBTYPES.includes(value) ? value : undefined;
}

function normalizeArmorSubtype(
  value: ArsenalItem["armorSubtype"] | undefined,
  slot: ArsenalItemSlot,
): ArsenalArmorSubtype | undefined {
  if (value && ARSENAL_ARMOR_SUBTYPES.includes(value)) {
    return value;
  }

  if (slot === "headArmor") {
    return "head";
  }

  if (slot === "torsoArmor") {
    return "torso";
  }

  if (slot === "armsArmor") {
    return "arms";
  }

  if (slot === "legsArmor") {
    return "legs";
  }

  return undefined;
}

function normalizeResourceSubtype(
  value: ArsenalItem["resourceSubtype"] | undefined,
): ArsenalResourceSubtype | undefined {
  return value && ARSENAL_RESOURCE_SUBTYPES.includes(value)
    ? value
    : "other";
}

function normalizeQuickSlotCount(value: ArsenalItem["quickSlotCount"]) {
  if (value === 2 || value === 4 || value === 6) {
    return value;
  }

  return undefined;
}

function normalizeArsenalItem(item: Partial<ArsenalItem>): ArsenalItem {
  const slot = normalizeArsenalSlot(item.slot);
  const category = normalizeArsenalCategory(item.category, slot);

  return {
    id:
      typeof item.id === "string" && item.id.trim().length > 0
        ? item.id
        : `arsenal-item-${Date.now()}`,
    name:
      typeof item.name === "string" && item.name.trim().length > 0
        ? item.name
        : "Новый предмет",

    category,
    slot,

    weaponSubtype:
      category === "weapon" ? normalizeWeaponSubtype(item.weaponSubtype) : undefined,
    armorSubtype:
      category === "armor" ? normalizeArmorSubtype(item.armorSubtype, slot) : undefined,
    resourceSubtype:
      category === "resource"
        ? normalizeResourceSubtype(item.resourceSubtype)
        : undefined,

    description: typeof item.description === "string" ? item.description : "",
    rules: typeof item.rules === "string" ? item.rules : "",
    tags: typeof item.tags === "string" ? item.tags : "",
    rarity: typeof item.rarity === "string" ? item.rarity : "",
    weight: typeof item.weight === "string" ? item.weight : "",
    price: typeof item.price === "string" ? item.price : "",

    quickSlotCount:
      slot === "loadBearing" ? normalizeQuickSlotCount(item.quickSlotCount) : undefined,

    backpackSlotCount:
      slot === "backpack" &&
        typeof item.backpackSlotCount === "number" &&
        Number.isFinite(item.backpackSlotCount)
        ? Math.max(0, Math.floor(item.backpackSlotCount))
        : undefined,

    isVisibleToPlayers:
      typeof item.isVisibleToPlayers === "boolean"
        ? item.isVisibleToPlayers
        : true,
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

const CHARACTER_CONDITION_KEYS: CharacterConditionKey[] = [
  "bleeding",
  "stunned",
  "panic",
  "exhausted",
  "limping",
  "infection",
  "unconscious",
  "pain",
  "burning",
  "echoPressure",
];

const CHARACTER_BODY_ZONES: CharacterBodyZone[] = [
  "head",
  "torso",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
  "wholeBody",
];

const CHARACTER_WOUND_SEVERITIES: CharacterWoundSeverity[] = [
  "light",
  "medium",
  "heavy",
  "critical",
];

const CHARACTER_WOUND_TYPES: CharacterWoundType[] = [
  "cut",
  "piercing",
  "gunshot",
  "blunt",
  "burn",
  "shrapnel",
  "bite",
  "echo",
];

const CHARACTER_WOUND_STATUSES: CharacterWoundStatus[] = [
  "fresh",
  "stabilized",
  "worsened",
];

function normalizeCharacterConditions(value: unknown): CharacterConditionEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => {
      return entry && typeof entry === "object";
    })
    .map((entry, index) => {
      const condition = entry as Partial<CharacterConditionEntry>;
      const key = CHARACTER_CONDITION_KEYS.includes(
        condition.key as CharacterConditionKey,
      )
        ? (condition.key as CharacterConditionKey)
        : "pain";

      return {
        id:
          typeof condition.id === "string" && condition.id.trim().length > 0
            ? condition.id
            : `condition-${Date.now()}-${index}`,
        key,
        note: typeof condition.note === "string" ? condition.note : "",
      };
    });
}

function normalizeCharacterWounds(value: unknown): CharacterWoundEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => {
      return entry && typeof entry === "object";
    })
    .map((entry, index) => {
      const wound = entry as Partial<CharacterWoundEntry>;

      const zone = CHARACTER_BODY_ZONES.includes(wound.zone as CharacterBodyZone)
        ? (wound.zone as CharacterBodyZone)
        : "torso";

      const severity = CHARACTER_WOUND_SEVERITIES.includes(
        wound.severity as CharacterWoundSeverity,
      )
        ? (wound.severity as CharacterWoundSeverity)
        : "light";

      const woundType = CHARACTER_WOUND_TYPES.includes(
        wound.woundType as CharacterWoundType,
      )
        ? (wound.woundType as CharacterWoundType)
        : "cut";

      const status = CHARACTER_WOUND_STATUSES.includes(
        wound.status as CharacterWoundStatus,
      )
        ? (wound.status as CharacterWoundStatus)
        : "fresh";

      return {
        id:
          typeof wound.id === "string" && wound.id.trim().length > 0
            ? wound.id
            : `wound-${Date.now()}-${index}`,
        zone,
        severity,
        woundType,
        status,
        note: typeof wound.note === "string" ? wound.note : "",
      };
    });
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

    conditions: normalizeCharacterConditions(character.conditions),
    wounds: normalizeCharacterWounds(character.wounds),

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

function normalizeReferenceArticle(article: ReferenceArticle): ReferenceArticle {
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