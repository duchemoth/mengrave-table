import { campaignData } from "../data/campaign";
import type {
  ArsenalArmorSubtype,
  ArsenalItem,
  ArsenalItemCategory,
  ArsenalItemCondition,
  ArsenalItemRarity,
  ArsenalItemSlot,
  ArsenalItemSlotUsage,
  ArsenalLootAvailability,
  ArsenalLootTag,
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
  MapAttachment,
  MapAttachmentKind,
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
export const ATTACHMENTS_STORAGE_KEY = "nri-table-attachments";
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

const ARSENAL_ITEM_SLOT_USAGES: ArsenalItemSlotUsage[] = [
  "normal",
  "twoShoulders",
];

const ARSENAL_WEAPON_SUBTYPES: ArsenalWeaponSubtype[] = [
  "combatMelee",
  "improvisedMelee",
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

const ARSENAL_ITEM_RARITIES: ArsenalItemRarity[] = [
  "junk",
  "common",
  "standard",
  "good",
  "rare",
  "faction",
  "elite",
  "unique",
  "forbidden",
  "quest",
];

const ARSENAL_LOOT_AVAILABILITIES: ArsenalLootAvailability[] = [
  "never",
  "starter",
  "commonLoot",
  "dangerLoot",
  "reward",
  "manual",
];

const ARSENAL_ITEM_CONDITIONS: ArsenalItemCondition[] = [
  "new",
  "working",
  "worn",
  "damaged",
  "makeshift",
  "dirty",
  "infected",
  "radiating",
  "incomplete",
  "trophy",
];

const ARSENAL_LOOT_TAGS: ArsenalLootTag[] = [
  "obscuria",
  "battle",
  "technical",
  "medical",
  "domestic",
  "storage",
  "corpse",
  "infection",
  "weapon",
  "ammo",
  "armor",
  "healing",
  "repair",
  "tool",
  "fuel",
  "food",
  "water",
  "document",
  "clue",
  "quest",
  "container",
  "noisy",
  "heavy",
  "fragile",
  "suspicious",
  "forbidden",
  "radiating",
  "reflectionRisk",
  "infectionRisk",
  "inspectionRisk",
  "voyage",
  "fief",
  "euler",
  "evergal",
  "temerat",
  "valour",
  "brigand",
  "celiate",
];

function normalizeArsenalSlot(slot: ArsenalItem["slot"] | undefined): ArsenalItemSlot {
  return slot && ARSENAL_ITEM_SLOTS.includes(slot) ? slot : "none";
}

function normalizeArsenalSlotUsage(
  value: unknown,
  slot: ArsenalItemSlot,
): ArsenalItemSlotUsage {
  if (
    slot === "shoulderWeapon" &&
    typeof value === "string" &&
    ARSENAL_ITEM_SLOT_USAGES.includes(value as ArsenalItemSlotUsage)
  ) {
    return value as ArsenalItemSlotUsage;
  }

  return "normal";
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
  value: ArsenalItem["weaponSubtype"] | "melee" | undefined,
): ArsenalWeaponSubtype | undefined {
  if (value === "melee") {
    return "combatMelee";
  }

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

function normalizeArsenalRarity(value: unknown): ArsenalItemRarity {
  if (typeof value === "string") {
    if (ARSENAL_ITEM_RARITIES.includes(value as ArsenalItemRarity)) {
      return value as ArsenalItemRarity;
    }

    const normalizedValue = value.toLowerCase();

    if (normalizedValue.includes("хлам") || normalizedValue.includes("мусор")) {
      return "junk";
    }

    if (normalizedValue.includes("распрост") || normalizedValue.includes("част")) {
      return "common";
    }

    if (normalizedValue.includes("обыч")) {
      return "standard";
    }

    if (normalizedValue.includes("доброт") || normalizedValue.includes("качеств")) {
      return "good";
    }

    if (normalizedValue.includes("редк")) {
      return "rare";
    }

    if (normalizedValue.includes("фрак")) {
      return "faction";
    }

    if (normalizedValue.includes("элит")) {
      return "elite";
    }

    if (normalizedValue.includes("уник")) {
      return "unique";
    }

    if (normalizedValue.includes("запрещ")) {
      return "forbidden";
    }

    if (normalizedValue.includes("сюжет") || normalizedValue.includes("квест")) {
      return "quest";
    }
  }

  return "standard";
}

function guessArsenalLootAvailability(item: Partial<ArsenalItem>): ArsenalLootAvailability {
  const text = [
    item.name,
    item.description,
    item.rules,
    item.tags,
    item.rarity,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    item.category === "quest" ||
    text.includes("сюжет") ||
    text.includes("квест") ||
    text.includes("уник") ||
    text.includes("валор") ||
    text.includes("целлиат")
  ) {
    return "manual";
  }

  if (
    text.includes("запрещ") ||
    text.includes("амнезиин") ||
    text.includes("венец") ||
    text.includes("фонит")
  ) {
    return "manual";
  }

  if (item.category === "medicine" || item.category === "resource" || item.category === "tool") {
    return "commonLoot";
  }

  if (item.category === "weapon" || item.category === "armor" || item.category === "protection") {
    return "dangerLoot";
  }

  if (item.category === "misc" || item.category === "storage" || item.category === "loadBearing") {
    return "starter";
  }

  return "commonLoot";
}

function normalizeLootAvailability(
  value: unknown,
  item: Partial<ArsenalItem>,
): ArsenalLootAvailability {
  if (
    typeof value === "string" &&
    ARSENAL_LOOT_AVAILABILITIES.includes(value as ArsenalLootAvailability)
  ) {
    return value as ArsenalLootAvailability;
  }

  return guessArsenalLootAvailability(item);
}

function guessArsenalItemCondition(item: Partial<ArsenalItem>): ArsenalItemCondition {
  const text = [item.name, item.description, item.rules, item.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("нов")) {
    return "new";
  }

  if (
    text.includes("плох") ||
    text.includes("стар") ||
    text.includes("ржав") ||
    text.includes("потрёп") ||
    text.includes("потреп")
  ) {
    return "worn";
  }

  if (
    text.includes("слом") ||
    text.includes("повреж") ||
    text.includes("неполад") ||
    text.includes("осеч")
  ) {
    return "damaged";
  }

  if (text.includes("самодель")) {
    return "makeshift";
  }

  if (text.includes("гряз")) {
    return "dirty";
  }

  if (text.includes("зараж") || text.includes("эхоцит")) {
    return "infected";
  }

  if (text.includes("фонит") || text.includes("инфофон")) {
    return "radiating";
  }

  if (text.includes("неполн") || text.includes("без ")) {
    return "incomplete";
  }

  if (text.includes("троф")) {
    return "trophy";
  }

  return "working";
}

function normalizeArsenalItemCondition(
  value: unknown,
  item: Partial<ArsenalItem>,
): ArsenalItemCondition {
  if (
    typeof value === "string" &&
    ARSENAL_ITEM_CONDITIONS.includes(value as ArsenalItemCondition)
  ) {
    return value as ArsenalItemCondition;
  }

  return guessArsenalItemCondition(item);
}

function addLootTag(tags: Set<ArsenalLootTag>, tag: ArsenalLootTag) {
  tags.add(tag);
}

function guessArsenalLootTags(item: Partial<ArsenalItem>): ArsenalLootTag[] {
  const tags = new Set<ArsenalLootTag>();
  const text = [item.name, item.description, item.rules, item.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (item.category === "weapon") {
    addLootTag(tags, "weapon");
    addLootTag(tags, "battle");
  }

  if (item.category === "armor" || item.category === "protection") {
    addLootTag(tags, "armor");
    addLootTag(tags, "battle");
  }

  if (item.category === "medicine") {
    addLootTag(tags, "medical");
    addLootTag(tags, "healing");
  }

  if (item.category === "tool") {
    addLootTag(tags, "technical");
    addLootTag(tags, "tool");
    addLootTag(tags, "repair");
  }

  if (item.category === "resource") {
    if (item.resourceSubtype === "ammo") {
      addLootTag(tags, "ammo");
      addLootTag(tags, "battle");
    }

    if (item.resourceSubtype === "fuel") {
      addLootTag(tags, "fuel");
      addLootTag(tags, "technical");
    }

    if (item.resourceSubtype === "drink") {
      addLootTag(tags, "water");
      addLootTag(tags, "domestic");
    }

    if (item.resourceSubtype === "supplies") {
      addLootTag(tags, "food");
      addLootTag(tags, "domestic");
    }

    if (item.resourceSubtype === "materials") {
      addLootTag(tags, "technical");
      addLootTag(tags, "repair");
    }
  }

  if (item.category === "quest") {
    addLootTag(tags, "quest");
    addLootTag(tags, "clue");
  }

  if (item.category === "storage") {
    addLootTag(tags, "storage");
    addLootTag(tags, "container");
  }

  if (text.includes("апис") || text.includes("вояж")) addLootTag(tags, "voyage");

  if (
    text.includes("горст") ||
    text.includes("форпост") ||
    text.includes("феод") ||
    text.includes("барон") ||
    text.includes("гарнизон")
  ) {
    addLootTag(tags, "fief");
  }
  if (text.includes("обскур")) addLootTag(tags, "obscuria");
  if (text.includes("труп")) addLootTag(tags, "corpse");
  if (text.includes("документ") || text.includes("накладн") || text.includes("запис")) addLootTag(tags, "document");
  if (text.includes("улика") || text.includes("след")) addLootTag(tags, "clue");
  if (text.includes("контейнер") || text.includes("ящик")) addLootTag(tags, "container");
  if (text.includes("шум")) addLootTag(tags, "noisy");
  if (text.includes("тяж")) addLootTag(tags, "heavy");
  if (text.includes("хруп")) addLootTag(tags, "fragile");
  if (text.includes("подозр")) addLootTag(tags, "suspicious");
  if (text.includes("запрещ")) addLootTag(tags, "forbidden");
  if (text.includes("фонит") || text.includes("инфофон")) addLootTag(tags, "radiating");
  if (text.includes("отраж")) addLootTag(tags, "reflectionRisk");
  if (text.includes("зараж") || text.includes("эхоцит")) addLootTag(tags, "infectionRisk");
  if (text.includes("досмотр")) addLootTag(tags, "inspectionRisk");
  if (text.includes("эйлер")) addLootTag(tags, "euler");
  if (text.includes("эвергал")) addLootTag(tags, "evergal");
  if (text.includes("темер")) addLootTag(tags, "temerat");
  if (text.includes("валор")) addLootTag(tags, "valour");
  if (text.includes("бриган")) addLootTag(tags, "brigand");
  if (text.includes("целлиат")) addLootTag(tags, "celiate");

  return Array.from(tags);
}

function normalizeLegacyLootTag(tag: unknown): ArsenalLootTag | null {
  if (tag === "apis") {
    return "voyage";
  }

  if (tag === "horst") {
    return "fief";
  }

  if (
    typeof tag === "string" &&
    ARSENAL_LOOT_TAGS.includes(tag as ArsenalLootTag)
  ) {
    return tag as ArsenalLootTag;
  }

  return null;
}

function normalizeArsenalLootTags(value: unknown, item: Partial<ArsenalItem>): ArsenalLootTag[] {
  if (Array.isArray(value)) {
    const tags = value
      .map(normalizeLegacyLootTag)
      .filter((tag): tag is ArsenalLootTag => tag !== null);

    return Array.from(new Set(tags));
  }

  return guessArsenalLootTags(item);
}

export function normalizeArsenalItem(item: Partial<ArsenalItem>): ArsenalItem {
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

    rarity: normalizeArsenalRarity(item.rarity),
    lootAvailability: normalizeLootAvailability(
      (item as Partial<ArsenalItem>).lootAvailability,
      item,
    ),
    condition: normalizeArsenalItemCondition(
      (item as Partial<ArsenalItem>).condition,
      item,
    ),
    lootTags: normalizeArsenalLootTags(
      (item as Partial<ArsenalItem>).lootTags,
      item,
    ),

    weight: typeof item.weight === "string" ? item.weight : "",
    price: typeof item.price === "string" ? item.price : "",

    slotUsage: normalizeArsenalSlotUsage(
      (item as Partial<ArsenalItem>).slotUsage,
      slot,
    ),

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
    return campaignData.arsenalItems.map((item) =>
      normalizeArsenalItem(item as Partial<ArsenalItem>),
    );
  }

  try {
    const parsedItems = JSON.parse(savedItems);

    if (!Array.isArray(parsedItems)) {
      return campaignData.arsenalItems.map((item) =>
        normalizeArsenalItem(item as Partial<ArsenalItem>),
      );
    }

    return parsedItems.map((item) =>
      normalizeArsenalItem(item as Partial<ArsenalItem>),
    );
  } catch {
    return campaignData.arsenalItems.map((item) =>
      normalizeArsenalItem(item as Partial<ArsenalItem>),
    );
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

const MAP_ATTACHMENT_KINDS: MapAttachmentKind[] = [
  "survivors",
  "wounded",
  "cargo",
  "cart",
  "vehicle",
  "prisoners",
  "dangerous",
  "device",
  "other",
];

function normalizeAttachmentKind(value: unknown): MapAttachmentKind {
  return MAP_ATTACHMENT_KINDS.includes(value as MapAttachmentKind)
    ? (value as MapAttachmentKind)
    : "other";
}

function normalizeAttachmentNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, value));
}

export function normalizeMapAttachment(
  attachment: Partial<MapAttachment>,
  index = 0,
): MapAttachment {
  return {
    id:
      typeof attachment.id === "string" && attachment.id.trim().length > 0
        ? attachment.id
        : `attachment-${Date.now()}-${index}`,

    title:
      typeof attachment.title === "string" && attachment.title.trim().length > 0
        ? attachment.title
        : "Сопровождение",

    kind: normalizeAttachmentKind(attachment.kind),

    status:
      typeof attachment.status === "string" && attachment.status.trim().length > 0
        ? attachment.status
        : "stable",

    tagIds: Array.isArray(attachment.tagIds)
      ? attachment.tagIds.map(String).filter(Boolean)
      : [],

    description:
      typeof attachment.description === "string" ? attachment.description : "",

    masterNotes:
      typeof attachment.masterNotes === "string" ? attachment.masterNotes : "",

    imageUrl: typeof attachment.imageUrl === "string" ? attachment.imageUrl : "",

    x: normalizeAttachmentNumber(attachment.x, 50, 0, 100),
    y: normalizeAttachmentNumber(attachment.y, 50, 0, 100),

    isSecret: Boolean(attachment.isSecret),
    isVisibleToPlayers:
      typeof attachment.isVisibleToPlayers === "boolean"
        ? attachment.isVisibleToPlayers
        : true,

    attachedToGroupId:
      typeof attachment.attachedToGroupId === "string" &&
        attachment.attachedToGroupId.trim().length > 0
        ? attachment.attachedToGroupId
        : null,

    offsetX: normalizeAttachmentNumber(attachment.offsetX, 2.4, -10, 10),
    offsetY: normalizeAttachmentNumber(attachment.offsetY, 2.1, -10, 10),

    burden: Math.floor(normalizeAttachmentNumber(attachment.burden, 1, 0, 5)),
    risk: Math.floor(normalizeAttachmentNumber(attachment.risk, 1, 0, 5)),
  };
}

export function loadSavedAttachments() {
  const savedAttachments = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);

  if (!savedAttachments) {
    return campaignData.attachments;
  }

  try {
    const parsedAttachments = JSON.parse(savedAttachments);

    if (!Array.isArray(parsedAttachments)) {
      return campaignData.attachments;
    }

    return parsedAttachments.map((attachment, index) =>
      normalizeMapAttachment(attachment as Partial<MapAttachment>, index),
    );
  } catch {
    return campaignData.attachments;
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