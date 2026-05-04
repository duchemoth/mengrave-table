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

export type CampaignData = {
  locations: Location[];
  quests: Quest[];
  npcs: string[];
  items: string[];
  groups: MapGroup[];
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