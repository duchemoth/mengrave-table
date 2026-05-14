export type UserMode = "player" | "master" | "developer";

export type LocationCategory =
  | "settlement"
  | "danger"
  | "ruins"
  | "camp"
  | "secret";

export type Location = {
  id: string;
  title: string;
  type: string;
  category: LocationCategory;
  description: string;
  x: number;
  y: number;
  isSecret?: boolean;
};

export type QuestStatus = "active" | "completed" | "failed" | "hidden";

export type Quest = {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  isSecret?: boolean;
};

export type ArsenalItemCategory =
  | "weapon"
  | "armor"
  | "protection"
  | "loadBearing"
  | "tool"
  | "medicine"
  | "resource"
  | "quest"
  | "misc";

export type ArsenalItemSlot =
  | "shoulderWeapon"
  | "smallWeapon"
  | "headArmor"
  | "torsoArmor"
  | "armsArmor"
  | "legsArmor"
  | "protection"
  | "loadBearing"
  | "quick"
  | "backpack"
  | "none";

export type ArsenalItem = {
  id: string;
  name: string;
  category: ArsenalItemCategory;
  slot: ArsenalItemSlot;

  description: string;
  rules: string;
  tags: string;
  rarity: string;
  weight: string;
  price: string;

  quickSlotCount?: 2 | 4 | 6;
  isVisibleToPlayers: boolean;
};

export type CharacterInventorySlot = {
  itemId: string | null;
  note: string;
};

export type CharacterInventoryQuickSlot = {
  id: string;
  itemId: string | null;
  quantity: number;
  note: string;
};

export type CharacterBackpackEntry = {
  id: string;
  itemId: string;
  quantity: number;
  note: string;
};

export type CharacterInventory = {
  weaponSlots: {
    shoulder1: CharacterInventorySlot;
    shoulder2: CharacterInventorySlot;
    small: CharacterInventorySlot;
  };

  armorSlots: {
    head: CharacterInventorySlot;
    torso: CharacterInventorySlot;
    arms: CharacterInventorySlot;
    legs: CharacterInventorySlot;
  };

  protectionSlot: CharacterInventorySlot;

  loadBearing: {
    itemId: string | null;
    note: string;
    quickSlots: CharacterInventoryQuickSlot[];
  };

  backpack: CharacterBackpackEntry[];
};

export type CampaignData = {
  locations: Location[];
  groups: MapGroup[];
  events: MapEvent[];
  characters: PlayerCharacter[];
  referenceArticles: ReferenceArticle[];
  quests: Quest[];
  npcs: string[];
  items: string[];
  arsenalItems: ArsenalItem[];
};

export type MapGroupFaction =
  | "players"
  | "fief"
  | "euler"
  | "voyager"
  | "evergal"
  | "brigand"
  | "infiltrator"
  | "freeblade"
  | "valour"
  | "echomorph";

export type GroupMember = {
  id: string;
  name: string;
  role: string;
  description: string;
};

export type MapGroup = {
  id: string;
  name: string;
  faction: MapGroupFaction;
  description: string;
  x: number;
  y: number;
  isSecret: boolean;
  members: GroupMember[];
};

export type MapEventCategory =
  | "incident"
  | "mystery"
  | "aberration"
  | "conflict"
  | "object"
  | "other";

export type MapEventStatus = "hidden" | "active" | "completed";

export type MapEvent = {
  id: string;
  title: string;
  category: MapEventCategory;
  status: MapEventStatus;
  description: string;
  masterNotes: string;
  x: number;
  y: number;
  isSecret: boolean;
};

export type CharacterMass = "deficit" | "normal" | "excess";

export type CharacterEmpathy = "low" | "normal" | "high";

export type CharacterStatus = "draft" | "pendingReview" | "approved";

export type CharacterSkillKey =
  | "melee"
  | "shooting"
  | "specialWeapons"
  | "athletics"
  | "endurance"
  | "stealth"
  | "observation"
  | "tracking"
  | "navigation"
  | "survival"
  | "firstAid"
  | "medicine"
  | "repair"
  | "devices"
  | "crowns"
  | "driving"
  | "tactics"
  | "intimidation"
  | "negotiation"
  | "insight"
  | "criminal"
  | "factions"
  | "neurography"
  | "echoInfophone";

export type CharacterSkills = Record<CharacterSkillKey, number>;

export type PlayerCharacter = {
  id: string;

  ownerPlayerId?: string;
  ownerPlayerName: string;
  status: CharacterStatus;
  isVisibleToPlayers: boolean;

  playerName: string;
  characterName: string;
  nickname: string;
  oldName: string;
  oldNameKnownBy: string;

  age: string;
  origin: string;
  formerActivity: string;
  reasonToBecomeFreeblade: string;
  personalGoal: string;
  squadConnection: string;

  mass: CharacterMass;
  empathy: CharacterEmpathy;

  physicalReserve: number;
  psyche: number;
  spirit: number;
  fate: number;

  maxPhysicalReserve: number;
  maxPsyche: number;
  maxSpirit: number;
  maxFate: number;

  skills: CharacterSkills;
  specializations: string;
  traits: string;

  woundsAndConditions: string;
  reflectionNotes: string;

  quickAccess: string;
  backpackAndLoad: string;
  weapons: string;
  armor: string;
  cryptotoken: string;
  
  inventory: CharacterInventory;

  contacts: string;
  debts: string;
  enemies: string;
  patrons: string;

  progressionNotes: string;
  secretHooks: string;
  masterNotes: string;
};

export type ReferenceVisibility = "players" | "master" | "echo";

export type ReferenceSection =
  | "rules"
  | "lore"
  | "bestiary"
  | "equipment"
  | "factions"
  | "glossary"
  | "other";

export type ReferenceArticle = {
  id: string;

  section: ReferenceSection;
  subsection: string;
  title: string;
  content: string;

  visibility: ReferenceVisibility;

  tags: string;

  imageUrls: string[];
  assetIds: string[];

  updatedAt: string;
};