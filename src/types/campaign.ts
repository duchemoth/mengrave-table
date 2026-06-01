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
  imageUrl: string;
  x: number;
  y: number;
  isSecret?: boolean;
};

export type QuestStatus = "active" | "completed" | "failed" | "hidden";

export type ContractStage =
  | "preparation"
  | "exit"
  | "route"
  | "complication"
  | "objective"
  | "return"
  | "handoff"
  | "consequences";

export type CampaignStart =
  | {
    kind: "globalMap";
  }
  | {
    kind: "encounter";
    targetKind: "location" | "group" | "event";
    targetId: string;
    mode: "overview" | "scene" | "localMap";
  };

export type Quest = {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  isSecret?: boolean;

  giver?: string;
  reward?: string;
  relatedLocationId?: string;
  masterNotes?: string;

  contractStage?: ContractStage;
  publicProgressNote?: string;
  masterProgressNote?: string;
};

export type CampaignRelationLevel =
  | "hostile"
  | "distrust"
  | "tolerated"
  | "favorable"
  | "patronage";

export type CampaignRelationEntry = {
  id: string;
  title: string;
  level: CampaignRelationLevel;
  note: string;
  isVisibleToPlayers: boolean;
};

export type CampaignRelationsState = {
  entries: CampaignRelationEntry[];
  lawAttention: number;
  lawNote: string;
  lawVisibleToPlayers: boolean;
};

export type ArsenalItemCategory =
  | "weapon"
  | "armor"
  | "protection"
  | "loadBearing"
  | "storage"
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

export type ArsenalWeaponSubtype =
  | "combatMelee"
  | "improvisedMelee"
  | "firearm"
  | "throwing"
  | "special"
  | "explosive"
  | "combined"
  | "other";

export type ArsenalArmorSubtype =
  | "head"
  | "torso"
  | "arms"
  | "legs"
  | "shield"
  | "fullBody"
  | "other";

export type ArsenalResourceSubtype =
  | "supplies"
  | "fuel"
  | "ammo"
  | "drink"
  | "materials"
  | "other";

export type ArsenalItemRarity =
  | "junk"
  | "common"
  | "standard"
  | "good"
  | "rare"
  | "faction"
  | "elite"
  | "unique"
  | "forbidden"
  | "quest";

export type ArsenalLootAvailability =
  | "never"
  | "starter"
  | "commonLoot"
  | "dangerLoot"
  | "reward"
  | "manual";

export type ArsenalItemCondition =
  | "new"
  | "working"
  | "worn"
  | "damaged"
  | "makeshift"
  | "dirty"
  | "infected"
  | "radiating"
  | "incomplete"
  | "trophy";

export type ArsenalItemSlotUsage =
  | "normal"
  | "twoShoulders";

export type ArsenalLootTag =
  | "voyage"
  | "fief"
  | "obscuria"
  | "battle"
  | "technical"
  | "medical"
  | "domestic"
  | "storage"
  | "corpse"
  | "infection"
  | "weapon"
  | "ammo"
  | "armor"
  | "healing"
  | "repair"
  | "tool"
  | "fuel"
  | "food"
  | "water"
  | "document"
  | "clue"
  | "quest"
  | "container"
  | "noisy"
  | "heavy"
  | "fragile"
  | "suspicious"
  | "forbidden"
  | "radiating"
  | "reflectionRisk"
  | "infectionRisk"
  | "inspectionRisk"
  | "euler"
  | "evergal"
  | "temerat"
  | "valour"
  | "brigand"
  | "celiate";

export type ArsenalItem = {
  id: string;
  name: string;
  category: ArsenalItemCategory;
  slot: ArsenalItemSlot;

  weaponSubtype?: ArsenalWeaponSubtype;
  armorSubtype?: ArsenalArmorSubtype;
  resourceSubtype?: ArsenalResourceSubtype;

  description: string;
  rules: string;

  // Свободные ручные теги / заметки. Новому генератору лучше использовать lootTags.
  tags: string;

  rarity: ArsenalItemRarity;
  lootAvailability: ArsenalLootAvailability;
  condition: ArsenalItemCondition;
  lootTags: ArsenalLootTag[];

  weight: string;
  price: string;

  slotUsage: ArsenalItemSlotUsage;

  quickSlotCount?: 2 | 4 | 6;
  backpackSlotCount?: number;
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

export type CharacterWallet = {
  amperies: number;
  miliamperies: number;
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

  backpackSlot: CharacterInventorySlot;

  backpack: CharacterBackpackEntry[];
};

export type CampaignData = {
  start?: CampaignStart;
  locations: Location[];
  groups: MapGroup[];
  events: MapEvent[];
  attachments: MapAttachment[];
  characters: PlayerCharacter[];
  referenceArticles: ReferenceArticle[];
  quests: Quest[];
  npcs: string[];
  items: string[];
  arsenalItems: ArsenalItem[];
  relations?: CampaignRelationsState;
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
  imageUrl: string;
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

export type MapEventScale = "major" | "minor";

export type MapEvent = {
  id: string;
  title: string;
  category: MapEventCategory;
  status: MapEventStatus;
  description: string;
  masterNotes: string;
  imageUrl: string;
  x: number;
  y: number;
  isSecret: boolean;
  scale?: MapEventScale;
};

export type MapAttachmentKind =
  | "survivors"
  | "wounded"
  | "cargo"
  | "cart"
  | "vehicle"
  | "prisoners"
  | "dangerous"
  | "device"
  | "other";

export type MapAttachment = {
  id: string;
  title: string;

  kind: MapAttachmentKind;
  status: string;
  tagIds: string[];

  description: string;
  masterNotes: string;
  imageUrl: string;

  x: number;
  y: number;

  isSecret: boolean;
  isVisibleToPlayers: boolean;

  attachedToGroupId: string | null;
  offsetX: number;
  offsetY: number;

  burden: number;
  risk: number;
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

export type CharacterConditionKey =
  | "bleeding"
  | "stunned"
  | "panic"
  | "exhausted"
  | "limping"
  | "infection"
  | "unconscious"
  | "pain"
  | "burning"
  | "echoPressure";

export type CharacterConditionEntry = {
  id: string;
  key: CharacterConditionKey;
  note: string;
};

export type CharacterBodyZone =
  | "head"
  | "torso"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg"
  | "wholeBody";

export type CharacterWoundSeverity =
  | "light"
  | "medium"
  | "heavy"
  | "critical";

export type CharacterWoundType =
  | "cut"
  | "piercing"
  | "gunshot"
  | "blunt"
  | "burn"
  | "shrapnel"
  | "bite"
  | "echo";

export type CharacterWoundStatus =
  | "fresh"
  | "stabilized"
  | "worsened";

export type CharacterWoundEntry = {
  id: string;
  zone: CharacterBodyZone;
  severity: CharacterWoundSeverity;
  woundType: CharacterWoundType;
  status: CharacterWoundStatus;
  note: string;
};

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

  conditions?: CharacterConditionEntry[];
  wounds?: CharacterWoundEntry[];

  quickAccess: string;
  backpackAndLoad: string;
  weapons: string;
  armor: string;
  cryptotoken: string;
  wallet: CharacterWallet;

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
  | "campaign"
  | "lore"
  | "bestiary"
  | "equipment"
  | "factions"
  | "dossier"
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