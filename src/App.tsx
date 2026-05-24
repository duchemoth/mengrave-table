import { useEffect, useRef, useState } from "react";
import "./App.css";
import "./styles/character.css";
import "./styles/expedition.css";
import "./styles/party.css";
import "./styles/local-map.css";
import { BottomDrawer } from "./components/BottomDrawer";
import { PartyStatusPanel } from "./components/panels/PartyStatusPanel";
import {
  ExpeditionTrackerPanel,
  type ExpeditionRouteStatus,
  type ExpeditionState,
  type ExpeditionTimeOfDay,
} from "./components/panels/ExpeditionTrackerPanel";
import {
  SessionJournalPanel,
  type SessionJournalEntry,
  type SessionJournalEntryType,
} from "./components/panels/SessionJournalPanel";
import { EncounterModal } from "./components/EncounterModal";
import { HudTools } from "./components/HudTools";
import { MapView } from "./components/MapView";
import { MasterNotes } from "./components/MasterNotes";
import { CharacterRoster } from "./components/CharacterRoster";
import { CampaignStartMenu } from "./components/CampaignStartMenu";
import { SideDrawer } from "./components/SideDrawer";
import { TopBar } from "./components/TopBar";
import { campaignData } from "./data/campaign";
import { useCampaign } from "./hooks/useCampaign";
import { useInterfaceMode } from "./hooks/useInterfaceMode";
import { ReferenceLibrary } from "./components/ReferenceLibrary";
import type { Location, MapEvent, MapGroup, } from "./types/campaign";

const MASTER_NOTES_STORAGE_KEY = "nri-table-master-notes";
const GLOBAL_MAP_STORAGE_KEY = "nri-table-global-map";
const DEFAULT_GLOBAL_MAP_IMAGE_URL = "/map.jpg";

const PLAYER_PRESENTATION_STORAGE_KEY = "nri-table-player-presentation";

const EXPEDITION_STORAGE_KEY = "nri-table-expedition";

const SESSION_JOURNAL_STORAGE_KEY = "nri-table-session-journal";

const ROUTE_SEGMENT_DISTANCE = 4;

const ROUTE_AUTO_REVEAL_RADIUS = 4;

function normalizeJournalEntry(value: unknown): SessionJournalEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entry = value as Partial<SessionJournalEntry>;

  const allowedTypes: SessionJournalEntryType[] = [
    "expedition",
    "map",
    "scene",
    "inventory",
    "master",
    "other",
  ];

  return {
    id:
      typeof entry.id === "string" && entry.id.trim().length > 0
        ? entry.id
        : `journal-entry-${Date.now()}`,
    createdAt:
      typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
        ? entry.createdAt
        : Date.now(),
    type:
      typeof entry.type === "string" &&
        allowedTypes.includes(entry.type as SessionJournalEntryType)
        ? (entry.type as SessionJournalEntryType)
        : "other",
    title:
      typeof entry.title === "string" && entry.title.trim().length > 0
        ? entry.title
        : "Запись журнала",
    text: typeof entry.text === "string" ? entry.text : "",
    details: typeof entry.details === "string" ? entry.details : "",
    isHiddenFromPlayers: Boolean(entry.isHiddenFromPlayers),
  };
}

function normalizeJournalEntries(value: unknown): SessionJournalEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeJournalEntry)
    .filter((entry): entry is SessionJournalEntry => entry !== null);
}

function loadSavedJournalEntries() {
  const savedJournal = localStorage.getItem(SESSION_JOURNAL_STORAGE_KEY);

  if (!savedJournal) {
    return [];
  }

  try {
    return normalizeJournalEntries(JSON.parse(savedJournal));
  } catch {
    return [];
  }
}

const DEFAULT_EXPEDITION_STATE: ExpeditionState = {
  infophoneLevel: "clean",
  obscuriaPressure: 0,
  routeSegment: 0,
  timeOfDay: "morning",

  supplies: 0,
  water: 0,
  fuel: 0,
  medical: 0,
  ammo: 0,

  segmentCosts: {
    supplies: false,
    water: true,
    fuel: false,
    medical: false,
    ammo: false,
  },

  routeTarget: "",
  routeDescription: "",
  routeStatus: "none",

  routePointX: null,
  routePointY: null,

  suggestedRoutePointX: null,
  suggestedRoutePointY: null,

  note: "",
};

function normalizeExpeditionRouteStatus(value: unknown): ExpeditionRouteStatus {
  if (
    value === "none" ||
    value === "planned" ||
    value === "moving" ||
    value === "reached" ||
    value === "lost"
  ) {
    return value;
  }

  return "none";
}

function normalizeExpeditionState(value: unknown): ExpeditionState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_EXPEDITION_STATE;
  }

  const expedition = value as Partial<ExpeditionState>;

  return {
    infophoneLevel:
      expedition.infophoneLevel === "clean" ||
        expedition.infophoneLevel === "dirty" ||
        expedition.infophoneLevel === "heavy" ||
        expedition.infophoneLevel === "critical"
        ? expedition.infophoneLevel
        : "clean",

    obscuriaPressure:
      typeof expedition.obscuriaPressure === "number" &&
        Number.isFinite(expedition.obscuriaPressure)
        ? Math.min(10, Math.max(0, Math.floor(expedition.obscuriaPressure)))
        : 0,

    routeSegment:
      typeof expedition.routeSegment === "number" &&
        Number.isFinite(expedition.routeSegment)
        ? Math.max(0, Math.floor(expedition.routeSegment))
        : 0,

    timeOfDay:
      expedition.timeOfDay === "morning" ||
        expedition.timeOfDay === "day" ||
        expedition.timeOfDay === "evening" ||
        expedition.timeOfDay === "night"
        ? expedition.timeOfDay
        : "morning",

    supplies:
      typeof expedition.supplies === "number" && Number.isFinite(expedition.supplies)
        ? Math.max(0, Math.floor(expedition.supplies))
        : 0,

    water:
      typeof expedition.water === "number" && Number.isFinite(expedition.water)
        ? Math.max(0, Math.floor(expedition.water))
        : 0,

    fuel:
      typeof expedition.fuel === "number" && Number.isFinite(expedition.fuel)
        ? Math.max(0, Math.floor(expedition.fuel))
        : 0,

    medical:
      typeof expedition.medical === "number" && Number.isFinite(expedition.medical)
        ? Math.max(0, Math.floor(expedition.medical))
        : 0,

    ammo:
      typeof expedition.ammo === "number" && Number.isFinite(expedition.ammo)
        ? Math.max(0, Math.floor(expedition.ammo))
        : 0,

    segmentCosts:
      expedition.segmentCosts &&
        typeof expedition.segmentCosts === "object" &&
        !Array.isArray(expedition.segmentCosts)
        ? {
          supplies: Boolean(expedition.segmentCosts.supplies),
          water:
            typeof expedition.segmentCosts.water === "boolean"
              ? expedition.segmentCosts.water
              : true,
          fuel: Boolean(expedition.segmentCosts.fuel),
          medical: Boolean(expedition.segmentCosts.medical),
          ammo: Boolean(expedition.segmentCosts.ammo),
        }
        : DEFAULT_EXPEDITION_STATE.segmentCosts,

    routeTarget:
      typeof expedition.routeTarget === "string" ? expedition.routeTarget : "",

    routeDescription:
      typeof expedition.routeDescription === "string"
        ? expedition.routeDescription
        : "",

    routeStatus: normalizeExpeditionRouteStatus(expedition.routeStatus),

    routePointX:
      typeof expedition.routePointX === "number" &&
        Number.isFinite(expedition.routePointX)
        ? Math.max(0, Math.min(100, expedition.routePointX))
        : null,

    routePointY:
      typeof expedition.routePointY === "number" &&
        Number.isFinite(expedition.routePointY)
        ? Math.max(0, Math.min(100, expedition.routePointY))
        : null,

    suggestedRoutePointX:
      typeof expedition.suggestedRoutePointX === "number" &&
        Number.isFinite(expedition.suggestedRoutePointX)
        ? Math.max(0, Math.min(100, expedition.suggestedRoutePointX))
        : null,

    suggestedRoutePointY:
      typeof expedition.suggestedRoutePointY === "number" &&
        Number.isFinite(expedition.suggestedRoutePointY)
        ? Math.max(0, Math.min(100, expedition.suggestedRoutePointY))
        : null,

    note: typeof expedition.note === "string" ? expedition.note : "",
  };
}

function loadSavedExpeditionState() {
  const savedExpedition = localStorage.getItem(EXPEDITION_STORAGE_KEY);

  if (!savedExpedition) {
    return DEFAULT_EXPEDITION_STATE;
  }

  try {
    return normalizeExpeditionState(JSON.parse(savedExpedition));
  } catch {
    return DEFAULT_EXPEDITION_STATE;
  }
}

function getNextTimeOfDay(timeOfDay: ExpeditionTimeOfDay): ExpeditionTimeOfDay {
  if (timeOfDay === "morning") {
    return "day";
  }

  if (timeOfDay === "day") {
    return "evening";
  }

  if (timeOfDay === "evening") {
    return "night";
  }

  return "morning";
}

function getExpeditionTimeLabel(timeOfDay: ExpeditionTimeOfDay) {
  if (timeOfDay === "morning") {
    return "Утро";
  }

  if (timeOfDay === "day") {
    return "День";
  }

  if (timeOfDay === "evening") {
    return "Вечер";
  }

  return "Ночь";
}

function getExpeditionInfophoneLabel(level: ExpeditionState["infophoneLevel"]) {
  if (level === "clean") {
    return "Чистый";
  }

  if (level === "dirty") {
    return "Грязный";
  }

  if (level === "heavy") {
    return "Тяжёлый";
  }

  return "Критический";
}

function getExpeditionRouteStatusLabel(status: ExpeditionRouteStatus) {
  if (status === "none") {
    return "Не задан";
  }

  if (status === "planned") {
    return "Намечен";
  }

  if (status === "moving") {
    return "В пути";
  }

  if (status === "reached") {
    return "Достигнут";
  }

  return "Потерян";
}

type EncounterDisplayMode = "overview" | "scene" | "localMap";

type PlayerPresentation =
  | {
    mode: "globalMap";
    updatedAt: number;
  }
  | {
    mode: EncounterDisplayMode;
    targetKind: "location" | "group" | "event";
    targetId: string;
    updatedAt: number;
  };

function loadPlayerPresentation(): PlayerPresentation | null {
  const savedPresentation = localStorage.getItem(PLAYER_PRESENTATION_STORAGE_KEY);

  if (!savedPresentation) {
    return null;
  }

  try {
    const parsedPresentation = JSON.parse(savedPresentation) as Partial<PlayerPresentation>;

    if (parsedPresentation.mode === "globalMap") {
      return {
        mode: "globalMap",
        updatedAt:
          typeof parsedPresentation.updatedAt === "number"
            ? parsedPresentation.updatedAt
            : Date.now(),
      };
    }

    if (
      (parsedPresentation.mode === "overview" ||
        parsedPresentation.mode === "scene" ||
        parsedPresentation.mode === "localMap") &&
      (parsedPresentation.targetKind === "location" ||
        parsedPresentation.targetKind === "group" ||
        parsedPresentation.targetKind === "event") &&
      typeof parsedPresentation.targetId === "string"
    ) {
      return {
        mode: parsedPresentation.mode,
        targetKind: parsedPresentation.targetKind,
        targetId: parsedPresentation.targetId,
        updatedAt:
          typeof parsedPresentation.updatedAt === "number"
            ? parsedPresentation.updatedAt
            : Date.now(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

function savePlayerPresentation(presentation: PlayerPresentation) {
  localStorage.setItem(
    PLAYER_PRESENTATION_STORAGE_KEY,
    JSON.stringify(presentation),
  );
}

type GlobalMapSettings = {
  imageUrl: string;
};

function normalizeGlobalMapSettings(value: unknown): GlobalMapSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      imageUrl: DEFAULT_GLOBAL_MAP_IMAGE_URL,
    };
  }

  const rawSettings = value as {
    imageUrl?: unknown;
  };

  return {
    imageUrl:
      typeof rawSettings.imageUrl === "string" &&
        rawSettings.imageUrl.trim().length > 0
        ? rawSettings.imageUrl.trim()
        : DEFAULT_GLOBAL_MAP_IMAGE_URL,
  };
}

function loadSavedGlobalMapSettings(): GlobalMapSettings {
  const savedSettings = localStorage.getItem(GLOBAL_MAP_STORAGE_KEY);

  if (!savedSettings) {
    return {
      imageUrl: DEFAULT_GLOBAL_MAP_IMAGE_URL,
    };
  }

  try {
    return normalizeGlobalMapSettings(JSON.parse(savedSettings));
  } catch {
    return {
      imageUrl: DEFAULT_GLOBAL_MAP_IMAGE_URL,
    };
  }
}

const SCENE_STORAGE_PREFIX = "nri-table-scene-";
const LOCAL_MAP_STORAGE_PREFIX = "nri-table-local-map-";

const PLAYER_SCREEN_SYNC_KEYS = [
  "nri-table-locations",
  "nri-table-groups",
  "nri-table-events",
  "nri-table-characters",
  "nri-table-reference-articles",
  "nri-table-quests",
  "nri-table-npcs",
  "nri-table-items",
  "nri-table-master-notes",
  "nri-table-revealed-areas",
  "nri-table-global-map",
  "nri-table-expedition",
  "nri-table-player-presentation",
  "nri-table-session-journal",
];

const PLAYER_SCREEN_SYNC_PREFIXES = [
  "nri-table-scene-",
  "nri-table-local-map-",
];

function shouldSyncPlayerScreen(storageKey: string | null) {
  if (!storageKey) {
    return false;
  }

  if (PLAYER_SCREEN_SYNC_KEYS.includes(storageKey)) {
    return true;
  }

  return PLAYER_SCREEN_SYNC_PREFIXES.some((prefix) =>
    storageKey.startsWith(prefix),
  );
}

function isKeyboardShortcutBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, button, a, [role='button'], [contenteditable='true']",
    ),
  );
}

type JsonStorageArchive = Record<string, unknown>;

function collectJsonStorageByPrefix(prefix: string): JsonStorageArchive {
  const archive: JsonStorageArchive = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key || !key.startsWith(prefix)) {
      continue;
    }

    const savedValue = localStorage.getItem(key);

    if (!savedValue) {
      continue;
    }

    try {
      archive[key] = JSON.parse(savedValue);
    } catch {
      archive[key] = savedValue;
    }
  }

  return archive;
}

function clearStorageByPrefix(prefix: string) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function restoreJsonStorageArchive(prefix: string, archive: unknown) {
  if (!archive || typeof archive !== "object" || Array.isArray(archive)) {
    return;
  }

  clearStorageByPrefix(prefix);

  Object.entries(archive as JsonStorageArchive).forEach(([key, value]) => {
    if (!key.startsWith(prefix)) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  });
}

const REVEALED_AREAS_STORAGE_KEY = "nri-table-revealed-areas";

type RevealedMapArea = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

type BottomPanelTab = "party" | "expedition" | "journal";

function App() {
  const {
    locations,
    groups,
    events,
    characters,
    referenceArticles,
    quests,
    npcs,
    arsenalItems,
    setQuests,
    setNpcs,
    setArsenalItems,
    resetLocations: resetCampaignLocations,
    createLocation: createCampaignLocation,
    updateLocation,
    updateGroup,
    updateEvent,
    createGroup,
    createEvent,
    createCharacter,
    createReferenceArticle,
    updateCharacter,
    updateReferenceArticle,
    deleteGroup,
    deleteEvent,
    deleteCharacter,
    deleteReferenceArticle,
    deleteLocation,
    exportCampaign,
    importCampaign,
  } = useCampaign();

  const {
    userMode,
    isPlayerMode,
    isDeveloperMode,
    isPlayerScreen,
    isSidebarOpen,
    isBottomDrawerOpen,
    isCleanMapMode,
    changeMode,
    toggleSidebar,
    toggleBottomDrawer,
    openSidebar,
    enableCleanMapMode,
    exitCleanMapMode,
    restoreInterface,
  } = useInterfaceMode();

  const playerScreenSyncTimerRef = useRef<number | null>(null);

  const [selectedLocationId, setSelectedLocationId] = useState("old-harbor");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPlacingEvent, setIsPlacingEvent] = useState(false);

  const [isPlanningRoute, setIsPlanningRoute] = useState(false);

  const [isSuggestingRoute, setIsSuggestingRoute] = useState(false);

  const [isRevealingFog, setIsRevealingFog] = useState(false);
  const [isHidingRevealedArea, setIsHidingRevealedArea] = useState(false);

  const [revealedAreas, setRevealedAreas] = useState<RevealedMapArea[]>(() => {
    const savedAreas = localStorage.getItem(REVEALED_AREAS_STORAGE_KEY);

    if (!savedAreas) {
      return [];
    }

    try {
      const parsedAreas = JSON.parse(savedAreas) as RevealedMapArea[];

      if (!Array.isArray(parsedAreas)) {
        return [];
      }

      return parsedAreas.filter((area) => {
        return (
          typeof area.id === "string" &&
          typeof area.x === "number" &&
          typeof area.y === "number" &&
          typeof area.radius === "number"
        );
      });
    } catch {
      return [];
    }
  });

  const [encounterTarget, setEncounterTarget] = useState<
    | { kind: "location"; data: Location }
    | { kind: "group"; data: MapGroup }
    | { kind: "event"; data: MapEvent }
    | null
  >(null);

  const [encounterInitialMode, setEncounterInitialMode] =
    useState<EncounterDisplayMode>("overview");

  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [isCharactersOpen, setIsCharactersOpen] = useState(false);

  const [characterRosterInitialId, setCharacterRosterInitialId] = useState<
    string | null
  >(null);

  const [activeBottomPanelTab, setActiveBottomPanelTab] =
    useState<BottomPanelTab>("party");

  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const [isStartMenuOpen, setIsStartMenuOpen] = useState(true);

  const [expeditionState, setExpeditionState] = useState<ExpeditionState>(
    loadSavedExpeditionState,
  );

  const [journalEntries, setJournalEntries] = useState<SessionJournalEntry[]>(
    loadSavedJournalEntries,
  );

  const [masterNotes, setMasterNotes] = useState(() => {
    return localStorage.getItem(MASTER_NOTES_STORAGE_KEY) ?? "";
  });

  const [globalMapImageUrl, setGlobalMapImageUrl] = useState(() => {
    return loadSavedGlobalMapSettings().imageUrl;
  });

  useEffect(() => {
    localStorage.setItem(MASTER_NOTES_STORAGE_KEY, masterNotes);
  }, [masterNotes]);

  useEffect(() => {
    localStorage.setItem(
      GLOBAL_MAP_STORAGE_KEY,
      JSON.stringify({
        imageUrl: globalMapImageUrl,
      }),
    );
  }, [globalMapImageUrl]);

  useEffect(() => {
    localStorage.setItem(
      REVEALED_AREAS_STORAGE_KEY,
      JSON.stringify(revealedAreas),
    );
  }, [revealedAreas]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPlacingEvent(false);
        setIsRevealingFog(false);
        setIsHidingRevealedArea(false);
        setIsPlanningRoute(false);
        setIsSuggestingRoute(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isPlayerMode) {
      setIsPlacingEvent(false);
      setIsRevealingFog(false);
      setIsHidingRevealedArea(false);
      setIsPlanningRoute(false);
      return;
    }

    setIsSuggestingRoute(false);
  }, [isPlayerMode]);

  useEffect(() => {
    if (!isPlayerScreen) {
      return;
    }

    function handleStorageChange(event: StorageEvent) {
      if (!shouldSyncPlayerScreen(event.key)) {
        return;
      }

      if (playerScreenSyncTimerRef.current !== null) {
        window.clearTimeout(playerScreenSyncTimerRef.current);
      }

      playerScreenSyncTimerRef.current = window.setTimeout(() => {
        window.location.reload();
      }, 350);
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      if (playerScreenSyncTimerRef.current !== null) {
        window.clearTimeout(playerScreenSyncTimerRef.current);
      }
    };
  }, [isPlayerScreen]);

  useEffect(() => {
    localStorage.setItem(EXPEDITION_STORAGE_KEY, JSON.stringify(expeditionState));
  }, [expeditionState]);

  useEffect(() => {
    function handleExpeditionStorageChange(event: StorageEvent) {
      if (event.key !== EXPEDITION_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        setExpeditionState(normalizeExpeditionState(JSON.parse(event.newValue)));
      } catch {
        // Ignore broken external expedition payloads.
      }
    }

    window.addEventListener("storage", handleExpeditionStorageChange);

    return () => {
      window.removeEventListener("storage", handleExpeditionStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SESSION_JOURNAL_STORAGE_KEY,
      JSON.stringify(journalEntries),
    );
  }, [journalEntries]);

  const visibleLocations = locations.filter((location) => {
    return !isPlayerMode || !location.isSecret;
  });

  const visibleGroups = groups.filter((group) => {
    return !isPlayerMode || !group.isSecret;
  });

  const visibleEvents = events.filter((event) => {
    if (!isPlayerMode) {
      return true;
    }

    return !event.isSecret && event.status !== "hidden";
  });

  const visibleCharacters = characters;

  const visibleArsenalItems = isPlayerMode
    ? arsenalItems.filter((item) => item.isVisibleToPlayers !== false)
    : arsenalItems;

  function getPresentationTarget(presentation: PlayerPresentation) {
    if (presentation.mode === "globalMap") {
      return null;
    }

    if (presentation.targetKind === "location") {
      const location = visibleLocations.find((item) => item.id === presentation.targetId);

      return location ? { kind: "location" as const, data: location } : null;
    }

    if (presentation.targetKind === "group") {
      const group = visibleGroups.find((item) => item.id === presentation.targetId);

      return group ? { kind: "group" as const, data: group } : null;
    }

    const event = visibleEvents.find((item) => item.id === presentation.targetId);

    return event ? { kind: "event" as const, data: event } : null;
  }

  useEffect(() => {
    if (!isPlayerScreen) {
      return;
    }

    const presentation = loadPlayerPresentation();

    if (!presentation || presentation.mode === "globalMap") {
      setEncounterTarget(null);
      setEncounterInitialMode("overview");
      return;
    }

    const presentationTarget = getPresentationTarget(presentation);

    if (!presentationTarget) {
      setEncounterTarget(null);
      setEncounterInitialMode("overview");
      return;
    }

    setEncounterInitialMode(presentation.mode);
    setEncounterTarget(presentationTarget);
  }, [isPlayerScreen]);

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    locations[0];

  function updateSelectedLocation(updatedLocation: Location) {
    updateLocation(updatedLocation);
  }

  function resetLocations() {
    const shouldReset = window.confirm(
      "Сбросить все локации к стартовым данным? Текущие изменения будут потеряны.",
    );

    if (!shouldReset) {
      return;
    }

    resetCampaignLocations();
    setSelectedLocationId(campaignData.locations[0].id);
  }

  function createLocation() {
    const newLocation = createCampaignLocation();

    setSelectedLocationId(newLocation.id);
    openSidebar();
  }

  function deleteSelectedLocation() {
    if (locations.length <= 1) {
      window.alert("Нельзя удалить последнюю локацию.");
      return;
    }

    const shouldDelete = window.confirm(
      `Удалить локацию «${selectedLocation.title}»? Это действие нельзя отменить.`,
    );

    if (!shouldDelete) {
      return;
    }

    const remainingLocations = locations.filter((location) => {
      return location.id !== selectedLocation.id;
    });

    deleteLocation(selectedLocation.id);
    setSelectedLocationId(remainingLocations[0].id);
  }

  function normalizeRevealedAreas(value: unknown): RevealedMapArea[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((area) => {
        if (
          typeof area !== "object" ||
          area === null ||
          !("id" in area) ||
          !("x" in area) ||
          !("y" in area) ||
          !("radius" in area)
        ) {
          return null;
        }

        const normalizedArea = area as {
          id: unknown;
          x: unknown;
          y: unknown;
          radius: unknown;
        };

        if (
          typeof normalizedArea.id !== "string" ||
          typeof normalizedArea.x !== "number" ||
          typeof normalizedArea.y !== "number" ||
          typeof normalizedArea.radius !== "number"
        ) {
          return null;
        }

        return {
          id: normalizedArea.id,
          x: Math.max(0, Math.min(100, normalizedArea.x)),
          y: Math.max(0, Math.min(100, normalizedArea.y)),
          radius: Math.max(1, Math.min(30, normalizedArea.radius)),
        };
      })
      .filter((area): area is RevealedMapArea => area !== null);
  }

  function handleImportCampaign(file: File) {
    importCampaign(file, (firstLocationId, importedCampaign) => {
      setSelectedLocationId(firstLocationId);

      setRevealedAreas(
        normalizeRevealedAreas(importedCampaign?.revealedAreas),
      );

      if (typeof importedCampaign?.masterNotes === "string") {
        setMasterNotes(importedCampaign.masterNotes);
      }

      restoreJsonStorageArchive(
        SCENE_STORAGE_PREFIX,
        importedCampaign?.sceneDrafts,
      );

      restoreJsonStorageArchive(
        LOCAL_MAP_STORAGE_PREFIX,
        importedCampaign?.localMaps,
      );

      const importedGlobalMap = normalizeGlobalMapSettings(
        importedCampaign?.globalMap,
      );

      setGlobalMapImageUrl(importedGlobalMap.imageUrl);
      setExpeditionState(normalizeExpeditionState(importedCampaign?.expedition));
      setJournalEntries(normalizeJournalEntries(importedCampaign?.journalEntries));

      openSidebar();
    });
  }

  function handleExportCampaign() {
    exportCampaign({
      revealedAreas,
      masterNotes,
      globalMap: {
        imageUrl: globalMapImageUrl,
      },
      expedition: expeditionState,
      journalEntries,
      sceneDrafts: collectJsonStorageByPrefix(SCENE_STORAGE_PREFIX),
      localMaps: collectJsonStorageByPrefix(LOCAL_MAP_STORAGE_PREFIX),
    });
  }

  async function handleLoadDemoCampaign() {
    const shouldLoadDemo = window.confirm(
      "Загрузить демо-кампанию? Текущие данные будут заменены. Перед этим можно экспортировать текущую кампанию.",
    );

    if (!shouldLoadDemo) {
      return;
    }

    try {
      const response = await fetch("/campaigns/demo-campaign.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        window.alert(
          "Демо-кампания пока не найдена. Нужно добавить файл public/campaigns/demo-campaign.json.",
        );
        return;
      }

      const demoBlob = await response.blob();

      const demoFile = new File([demoBlob], "demo-campaign.json", {
        type: "application/json",
      });

      handleImportCampaign(demoFile);
      setIsStartMenuOpen(false);
    } catch {
      window.alert("Не удалось загрузить демо-кампанию.");
    }
  }

  function clampMapCoordinate(value: number) {
    return Math.max(0, Math.min(100, value));
  }

  function isRevealedAreaNearPoint(
    areas: RevealedMapArea[],
    x: number,
    y: number,
  ) {
    return areas.some((area) => {
      const deltaX = area.x - x;
      const deltaY = area.y - y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      return distance <= ROUTE_AUTO_REVEAL_RADIUS * 0.75;
    });
  }

  function getRouteMovementStep({
    startX,
    startY,
    targetX,
    targetY,
  }: {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  }) {
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= 0) {
      return {
        nextX: targetX,
        nextY: targetY,
        distance,
        didMove: false,
        didReach: true,
      };
    }

    if (distance <= ROUTE_SEGMENT_DISTANCE) {
      return {
        nextX: targetX,
        nextY: targetY,
        distance,
        didMove: true,
        didReach: true,
      };
    }

    const movementRatio = ROUTE_SEGMENT_DISTANCE / distance;

    return {
      nextX: clampMapCoordinate(startX + deltaX * movementRatio),
      nextY: clampMapCoordinate(startY + deltaY * movementRatio),
      distance,
      didMove: true,
      didReach: false,
    };
  }

  function handleMoveLocation(id: string, x: number, y: number) {
    const location = locations.find((currentLocation) => {
      return currentLocation.id === id;
    });

    if (!location) {
      return;
    }

    updateLocation({
      ...location,
      x,
      y,
    });
  }

  function handleMoveGroup(id: string, x: number, y: number) {
    const group = groups.find((currentGroup) => {
      return currentGroup.id === id;
    });

    if (!group) {
      return;
    }

    updateGroup({
      ...group,
      x,
      y,
    });
  }

  function handleMoveEvent(id: string, x: number, y: number) {
    const event = events.find((currentEvent) => {
      return currentEvent.id === id;
    });

    if (!event) {
      return;
    }

    updateEvent({
      ...event,
      x,
      y,
    });
  }

  function handleOpenLocationEncounter(location: Location) {
    setEncounterInitialMode("overview");
    setEncounterTarget({ kind: "location", data: location });
  }

  function handleOpenGroupEncounter(group: MapGroup) {
    setEncounterInitialMode("overview");
    setEncounterTarget({ kind: "group", data: group });
  }

  function handleOpenEventEncounter(event: MapEvent) {
    setEncounterInitialMode("overview");
    setEncounterTarget({ kind: "event", data: event });
  }

  function handleShowToPlayers(
    targetKind: "location" | "group" | "event",
    targetId: string,
    mode: EncounterDisplayMode,
  ) {
    if (isPlayerMode) {
      return;
    }

    savePlayerPresentation({
      mode,
      targetKind,
      targetId,
      updatedAt: Date.now(),
    });

    const locationTarget =
      targetKind === "location"
        ? locations.find((location) => location.id === targetId)
        : null;

    const groupTarget =
      targetKind === "group"
        ? groups.find((group) => group.id === targetId)
        : null;

    const eventTarget =
      targetKind === "event"
        ? events.find((mapEvent) => mapEvent.id === targetId)
        : null;

    const targetTitle =
      locationTarget?.title ??
      groupTarget?.name ??
      eventTarget?.title ??
      "Объект без названия";

    const modeTitle =
      mode === "overview"
        ? "обзор"
        : mode === "scene"
          ? "сцена"
          : "локальная карта";

    addSystemJournalEntry({
      type: mode === "scene" ? "scene" : "map",
      title:
        mode === "localMap"
          ? "Игрокам показана локальная карта"
          : mode === "scene"
            ? "Игрокам показана сцена"
            : "Игрокам показан обзор",
      text: targetTitle,
      details: `Экран игроков переключён на ${modeTitle}.`,
      isHiddenFromPlayers: false,
    });
  }

  function handleShowGlobalMapToPlayers() {
    if (isPlayerMode) {
      return;
    }

    savePlayerPresentation({
      mode: "globalMap",
      updatedAt: Date.now(),
    });

    addSystemJournalEntry({
      type: "map",
      title: "Экран игроков возвращён к карте",
      text: "Игрокам снова показан обзор глобальной карты.",
      details: "",
      isHiddenFromPlayers: false,
    });
  }

  function handleUpdateEncounterEvent(updatedEvent: MapEvent) {
    updateEvent(updatedEvent);

    setEncounterTarget((currentTarget) => {
      if (
        currentTarget?.kind === "event" &&
        currentTarget.data.id === updatedEvent.id
      ) {
        return {
          kind: "event",
          data: updatedEvent,
        };
      }

      return currentTarget;
    });
  }

  function handleDeleteCharacter(characterId: string) {
    deleteCharacter(characterId);
  }

  function handleCreateSceneNote(note: string) {
    setMasterNotes((currentNotes) => {
      const separator = currentNotes.trim().length > 0 ? "\n\n" : "";

      return `${currentNotes}${separator}${note}`;
    });

    setIsNotesOpen(true);
  }

  function handleDeleteGroup(groupId: string) {
    deleteGroup(groupId);

    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  }

  function handleDeleteEvent(eventId: string) {
    deleteEvent(eventId);

    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }

    if (encounterTarget?.kind === "event" && encounterTarget.data.id === eventId) {
      setEncounterTarget(null);
    }
  }

  function handleToggleEventPlacement() {
    if (isPlayerMode) {
      return;
    }

    setIsRevealingFog(false);
    setIsHidingRevealedArea(false);
    setIsPlacingEvent((currentValue) => !currentValue);
  }

  function handleToggleFogReveal() {
    if (isPlayerMode) {
      return;
    }

    setIsPlacingEvent(false);
    setIsHidingRevealedArea(false);
    setIsRevealingFog((currentValue) => !currentValue);
  }

  function handleToggleFogHide() {
    if (isPlayerMode) {
      return;
    }

    setIsPlacingEvent(false);
    setIsRevealingFog(false);
    setIsHidingRevealedArea((currentValue) => !currentValue);
  }

  function handleCreateRevealedAreaAt(x: number, y: number) {
    if (isPlayerMode) {
      return;
    }

    const newArea: RevealedMapArea = {
      id: `revealed-area-${Date.now()}`,
      x,
      y,
      radius: 4,
    };

    setRevealedAreas((currentAreas) => [...currentAreas, newArea]);
    setIsRevealingFog(false);

    addSystemJournalEntry({
      type: "map",
      title: "Мастер открыл область тумана",
      text: "Открыт участок глобальной карты вручную.",
      details:
        "Ручное раскрытие области. Возможная причина: разведка, высота, нейрогравюра, сцена или решение Мастера.",
      isHiddenFromPlayers: false,
    });
  }

  function handleDeleteRevealedAreaAt(x: number, y: number) {
    if (isPlayerMode) {
      return;
    }

    const revealedAreaVerticalScale = 16 / 9;

    const clickedArea = revealedAreas.find((area) => {
      const horizontalDistance = x - area.x;
      const verticalDistance = y - area.y;
      const verticalRadius = area.radius * revealedAreaVerticalScale;

      const ellipseHitValue =
        (horizontalDistance * horizontalDistance) / (area.radius * area.radius) +
        (verticalDistance * verticalDistance) / (verticalRadius * verticalRadius);

      return ellipseHitValue <= 1.25;
    });

    if (!clickedArea) {
      window.alert("Здесь нет ручной открытой области.");
      return;
    }

    setRevealedAreas((currentAreas) =>
      currentAreas.filter((area) => area.id !== clickedArea.id),
    );

    setIsHidingRevealedArea(false);
  }

  function handleClearRevealedAreas() {
    if (isPlayerMode) {
      return;
    }

    const shouldClear = window.confirm(
      "Очистить все ручные раскрытые области тумана войны?",
    );

    if (!shouldClear) {
      return;
    }

    setRevealedAreas([]);
    setIsRevealingFog(false);
    setIsHidingRevealedArea(false);
  }

  function handleCreateMapEventAt(x: number, y: number) {
    if (isPlayerMode) {
      return;
    }

    const newEvent = createEvent({
      title: "Новое событие",
      category: "incident",
      status: "hidden",
      description: "Краткое описание события пока не добавлено.",
      masterNotes: "",
      imageUrl: "",
      x,
      y,
      isSecret: true,
    });

    setSelectedEventId(newEvent.id);
    setEncounterTarget({ kind: "event", data: newEvent });
    setIsPlacingEvent(false);
  }

  function handleCreateLocationEvent(location: Location) {
    const newEvent = createEvent({
      title: `Событие: ${location.title}`,
      category: "incident",
      status: "hidden",
      description: "Краткое описание события пока не добавлено.",
      masterNotes: "",
      imageUrl: location.imageUrl ?? "",
      x: clampMapCoordinate(location.x + 2),
      y: clampMapCoordinate(location.y + 2),
      isSecret: true,
    });

    setSelectedEventId(newEvent.id);
    setEncounterTarget({ kind: "event", data: newEvent });

    return newEvent;
  }

  function handleOpenPlayerScreen() {
    const playerUrl = new URL(window.location.href);

    playerUrl.searchParams.set("view", "player");

    const playerWindow = window.open(playerUrl.toString(), "nri-player-screen");

    playerWindow?.focus();
  }

  function handleOpenCharacterSheet(characterId: string) {
    setCharacterRosterInitialId(characterId);
    setIsCharactersOpen(true);
  }

  function handleAdvanceExpeditionSegment() {
    if (isPlayerMode) {
      return;
    }

    const current = expeditionState;

    const nextTimeOfDay = getNextTimeOfDay(current.timeOfDay);
    const nextRouteSegment = current.routeSegment + 1;

    const nextSupplies = current.segmentCosts.supplies
      ? Math.max(0, current.supplies - 1)
      : current.supplies;

    const nextWater = current.segmentCosts.water
      ? Math.max(0, current.water - 1)
      : current.water;

    const nextFuel = current.segmentCosts.fuel
      ? Math.max(0, current.fuel - 1)
      : current.fuel;

    const nextMedical = current.segmentCosts.medical
      ? Math.max(0, current.medical - 1)
      : current.medical;

    const nextAmmo = current.segmentCosts.ammo
      ? Math.max(0, current.ammo - 1)
      : current.ammo;

    const spentResources = [
      current.segmentCosts.supplies ? "Припасы −1" : null,
      current.segmentCosts.water ? "Вода −1" : null,
      current.segmentCosts.fuel ? "Топливо −1" : null,
      current.segmentCosts.medical ? "Медрасход −1" : null,
      current.segmentCosts.ammo ? "Боезапас −1" : null,
    ].filter((item): item is string => item !== null);

    const playerGroup = groups.find((group) => group.faction === "players");

    let nextRouteStatus = current.routeStatus;
    let routeMovementDetails = "Движение по карте: точка маршрута не задана.";

    let autoRevealPoint: { x: number; y: number } | null = null;
    let autoRevealDetails = "Авто-разведка: не применялась.";

    if (
      playerGroup &&
      current.routePointX !== null &&
      current.routePointY !== null &&
      current.routeStatus !== "reached" &&
      current.routeStatus !== "lost"
    ) {
      const routeMovement = getRouteMovementStep({
        startX: playerGroup.x,
        startY: playerGroup.y,
        targetX: current.routePointX,
        targetY: current.routePointY,
      });

      if (routeMovement.didMove) {
        updateGroup({
          ...playerGroup,
          x: routeMovement.nextX,
          y: routeMovement.nextY,
        });

        autoRevealPoint = {
          x: routeMovement.nextX,
          y: routeMovement.nextY,
        };
      }

      nextRouteStatus = routeMovement.didReach ? "reached" : "moving";

      routeMovementDetails = routeMovement.didReach
        ? "Движение по карте: отряд достиг точки маршрута."
        : `Движение по карте: отряд продвинулся к точке маршрута на ${ROUTE_SEGMENT_DISTANCE}% карты. Осталось примерно ${Math.max(
          0,
          Math.round(routeMovement.distance - ROUTE_SEGMENT_DISTANCE),
        )}%.`;
    } else if (
      playerGroup &&
      current.routePointX !== null &&
      current.routePointY !== null &&
      current.routeStatus === "reached"
    ) {
      routeMovementDetails = "Движение по карте: точка маршрута уже достигнута.";
    } else if (
      playerGroup &&
      current.routePointX !== null &&
      current.routePointY !== null &&
      current.routeStatus === "lost"
    ) {
      routeMovementDetails = "Движение по карте: маршрут потерян, отряд не продвигался.";
    } else if (!playerGroup) {
      routeMovementDetails = "Движение по карте: группа игроков не найдена.";
    }

    if (autoRevealPoint) {
      if (isRevealedAreaNearPoint(revealedAreas, autoRevealPoint.x, autoRevealPoint.y)) {
        autoRevealDetails =
          "Авто-разведка: рядом уже была открытая область, новая область не создана.";
      } else {
        const revealedArea: RevealedMapArea = {
          id: `revealed-area-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          x: autoRevealPoint.x,
          y: autoRevealPoint.y,
          radius: ROUTE_AUTO_REVEAL_RADIUS,
        };

        setRevealedAreas((currentAreas) => {
          if (
            isRevealedAreaNearPoint(
              currentAreas,
              revealedArea.x,
              revealedArea.y,
            )
          ) {
            return currentAreas;
          }

          return [...currentAreas, revealedArea];
        });

        autoRevealDetails = `Авто-разведка: открыта область вокруг новой позиции отряда, радиус ${ROUTE_AUTO_REVEAL_RADIUS}%.`;
      }
    }

    addSystemJournalEntry({
      type: "expedition",
      title: "Отряд продвинулся",
      text: `Отрезок ${nextRouteSegment}. Время: ${getExpeditionTimeLabel(
        nextTimeOfDay,
      )}.`,
      details: [
        current.routeTarget.trim().length > 0
          ? `Маршрут: ${current.routeTarget}.`
          : "Маршрут: цель не задана.",
        current.routeDescription.trim().length > 0
          ? `Описание маршрута: ${current.routeDescription}.`
          : "Описание маршрута не задано.",
        `Статус маршрута: ${getExpeditionRouteStatusLabel(nextRouteStatus)}.`,
        routeMovementDetails,
        autoRevealDetails,
        "",
        spentResources.length > 0
          ? `Расход: ${spentResources.join(", ")}.`
          : "Расход ресурсов за этот отрезок не применялся.",
        "",
        `Инфофон: ${getExpeditionInfophoneLabel(current.infophoneLevel)}.`,
        `Натиск Обскурии: ${current.obscuriaPressure}/10.`,
        `Припасы: ${nextSupplies}.`,
        `Вода: ${nextWater}.`,
        `Топливо: ${nextFuel}.`,
        `Медрасход: ${nextMedical}.`,
        `Боезапас: ${nextAmmo}.`,
      ].join("\n"),
      isHiddenFromPlayers: false,
    });

    setExpeditionState({
      ...current,
      routeSegment: nextRouteSegment,
      timeOfDay: nextTimeOfDay,
      supplies: nextSupplies,
      water: nextWater,
      fuel: nextFuel,
      medical: nextMedical,
      ammo: nextAmmo,
      routeStatus: nextRouteStatus,
    });
  }

  function handleResetExpedition() {
    if (isPlayerMode) {
      return;
    }

    const shouldReset = window.confirm("Сбросить текущую экспедицию?");

    if (!shouldReset) {
      return;
    }

    setExpeditionState(DEFAULT_EXPEDITION_STATE);
  }

  function handleAddJournalEntry(entry: SessionJournalEntry) {
    setJournalEntries((current) => [entry, ...current]);
  }

  function handleDeleteJournalEntry(entryId: string) {
    setJournalEntries((current) =>
      current.filter((entry) => entry.id !== entryId),
    );
  }

  function handleClearJournalEntries() {
    const shouldClear = window.confirm("Очистить журнал сессии?");

    if (!shouldClear) {
      return;
    }

    setJournalEntries([]);
  }

  function addSystemJournalEntry({
    type,
    title,
    text,
    details = "",
    isHiddenFromPlayers = false,
  }: {
    type: SessionJournalEntryType;
    title: string;
    text: string;
    details?: string;
    isHiddenFromPlayers?: boolean;
  }) {
    setJournalEntries((current) => [
      {
        id: `journal-entry-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        createdAt: Date.now(),
        type,
        title,
        text,
        details,
        isHiddenFromPlayers,
      },
      ...current,
    ]);
  }

  function handleStartRoutePlanning() {
    if (isPlayerMode) {
      return;
    }

    setIsPlacingEvent(false);
    setIsRevealingFog(false);
    setIsHidingRevealedArea(false);
    setIsPlanningRoute((currentValue) => !currentValue);
  }

  function handlePlanRouteAt(x: number, y: number) {
    if (isPlayerMode) {
      return;
    }

    setExpeditionState((current) => ({
      ...current,
      routePointX: x,
      routePointY: y,
      routeStatus: "planned",
    }));

    setIsPlanningRoute(false);

    addSystemJournalEntry({
      type: "map",
      title: "Задана точка маршрута",
      text: "Мастер отметил точку маршрута на глобальной карте.",
      details: `Координаты точки: ${Math.round(x)}%, ${Math.round(y)}%.`,
      isHiddenFromPlayers: false,
    });
  }

  function handleClearRoutePoint() {
    if (isPlayerMode) {
      return;
    }

    setExpeditionState((current) => ({
      ...current,
      routePointX: null,
      routePointY: null,
    }));

    setIsPlanningRoute(false);

    addSystemJournalEntry({
      type: "map",
      title: "Точка маршрута сброшена",
      text: "Мастер убрал точку маршрута с глобальной карты.",
      details: "",
      isHiddenFromPlayers: false,
    });
  }

  const canAdvanceExpeditionFromMap =
    !isPlayerMode &&
    !isCleanMapMode &&
    !isPlacingEvent &&
    !isPlanningRoute &&
    !isSuggestingRoute &&
    !isRevealingFog &&
    !isHidingRevealedArea &&
    !encounterTarget &&
    !isNotesOpen &&
    !isCharactersOpen &&
    !isReferenceOpen;

  useEffect(() => {
    function handleSpaceAdvance(event: KeyboardEvent) {
      if (event.code !== "Space") {
        return;
      }

      if (event.repeat) {
        return;
      }

      if (isKeyboardShortcutBlockedTarget(event.target)) {
        return;
      }

      if (!canAdvanceExpeditionFromMap) {
        return;
      }

      event.preventDefault();
      handleAdvanceExpeditionSegment();
    }

    window.addEventListener("keydown", handleSpaceAdvance);

    return () => {
      window.removeEventListener("keydown", handleSpaceAdvance);
    };
  }, [canAdvanceExpeditionFromMap]);

  function handleStartRouteSuggestion() {
    if (!isPlayerMode) {
      return;
    }

    setIsPlacingEvent(false);
    setIsRevealingFog(false);
    setIsHidingRevealedArea(false);
    setIsPlanningRoute(false);
    setIsSuggestingRoute((currentValue) => !currentValue);
  }

  function handleSuggestRouteAt(x: number, y: number) {
    if (!isPlayerMode) {
      return;
    }

    setExpeditionState((current) => ({
      ...current,
      suggestedRoutePointX: x,
      suggestedRoutePointY: y,
    }));

    setIsSuggestingRoute(false);

    addSystemJournalEntry({
      type: "map",
      title: "Игроки предложили направление",
      text: "Игроки отметили предложенную точку маршрута на глобальной карте.",
      details: `Координаты предложения: ${Math.round(x)}%, ${Math.round(y)}%.`,
      isHiddenFromPlayers: false,
    });
  }

  function handleAcceptRouteSuggestion() {
    if (isPlayerMode) {
      return;
    }

    if (
      expeditionState.suggestedRoutePointX === null ||
      expeditionState.suggestedRoutePointY === null
    ) {
      return;
    }

    const acceptedX = expeditionState.suggestedRoutePointX;
    const acceptedY = expeditionState.suggestedRoutePointY;

    setExpeditionState((current) => ({
      ...current,
      routePointX: acceptedX,
      routePointY: acceptedY,
      routeStatus: "planned",
      suggestedRoutePointX: null,
      suggestedRoutePointY: null,
    }));

    addSystemJournalEntry({
      type: "map",
      title: "Мастер принял направление",
      text: "Предложенная игроками точка стала текущей точкой маршрута.",
      details: `Координаты маршрута: ${Math.round(acceptedX)}%, ${Math.round(acceptedY)}%.`,
      isHiddenFromPlayers: false,
    });
  }

  function handleClearRouteSuggestion() {
    if (isPlayerMode) {
      return;
    }

    setExpeditionState((current) => ({
      ...current,
      suggestedRoutePointX: null,
      suggestedRoutePointY: null,
    }));

    setIsSuggestingRoute(false);

    addSystemJournalEntry({
      type: "map",
      title: "Мастер убрал предложение маршрута",
      text: "Предложенная игроками точка маршрута удалена.",
      details: "",
      isHiddenFromPlayers: false,
    });
  }

  return (
    <main className="atlas-screen">
      <TopBar
        userMode={userMode}
        isPlayerScreen={isPlayerScreen}
        isCleanMapMode={isCleanMapMode}
        onChangeMode={changeMode}
        onOpenPlayerScreen={handleOpenPlayerScreen}
        onEnableCleanMapMode={enableCleanMapMode}
        onRestoreInterface={restoreInterface}
      />

      {!isPlayerMode && !isCleanMapMode && (
        <button
          className="global-advance-turn-button"
          type="button"
          disabled={!canAdvanceExpeditionFromMap}
          onClick={handleAdvanceExpeditionSegment}
          title={
            canAdvanceExpeditionFromMap
              ? "Сделать ход: продвинуть время, маршрут и расход экспедиции"
              : "Нельзя сделать ход во время активного режима или открытого окна"
          }
        >
          <span>Сделать ход</span>
          <small>Space</small>
        </button>
      )}

      {!isCleanMapMode && !isPlayerScreen && (
        <button
          className="campaign-menu-open-button"
          type="button"
          onClick={() => setIsStartMenuOpen(true)}
        >
          Меню
        </button>
      )}

      <MapView
        locations={visibleLocations}
        groups={visibleGroups}
        events={visibleEvents}
        globalMapImageUrl={globalMapImageUrl}
        selectedLocationId={selectedLocationId}
        selectedGroupId={selectedGroupId}
        selectedEventId={selectedEventId}
        userMode={userMode}
        isDeveloperMode={isDeveloperMode}
        isCleanMapMode={isCleanMapMode}
        onSelectLocation={setSelectedLocationId}
        onSelectGroup={setSelectedGroupId}
        onSelectEvent={setSelectedEventId}
        onExitCleanMapMode={exitCleanMapMode}
        onMoveLocation={handleMoveLocation}
        onMoveGroup={handleMoveGroup}
        onMoveEvent={handleMoveEvent}
        isPlacingEvent={isPlacingEvent}
        isPlanningRoute={isPlanningRoute}
        isSuggestingRoute={isSuggestingRoute}
        routePointX={expeditionState.routePointX}
        routePointY={expeditionState.routePointY}
        suggestedRoutePointX={expeditionState.suggestedRoutePointX}
        suggestedRoutePointY={expeditionState.suggestedRoutePointY}
        onPlanRouteAt={handlePlanRouteAt}
        onSuggestRouteAt={handleSuggestRouteAt}
        isRevealingFog={isRevealingFog}
        isHidingRevealedArea={isHidingRevealedArea}
        revealedAreas={revealedAreas}
        onToggleFogReveal={handleToggleFogReveal}
        onToggleFogHide={handleToggleFogHide}
        onCreateRevealedAreaAt={handleCreateRevealedAreaAt}
        onDeleteRevealedAreaAt={handleDeleteRevealedAreaAt}
        onClearRevealedAreas={handleClearRevealedAreas}
        onToggleEventPlacement={handleToggleEventPlacement}
        onCreateMapEventAt={handleCreateMapEventAt}
        onOpenLocationEncounter={handleOpenLocationEncounter}
        onOpenGroupEncounter={handleOpenGroupEncounter}
        onOpenEventEncounter={handleOpenEventEncounter}
      />

      {!isCleanMapMode && (
        <BottomDrawer
          isOpen={isBottomDrawerOpen}
          onToggleOpen={toggleBottomDrawer}
        >
          <section className="bottom-panel-workspace">
            <nav className="bottom-panel-tabs" aria-label="Разделы нижней панели">
              <button
                className={`bottom-panel-tab ${activeBottomPanelTab === "party" ? "active" : ""
                  }`}
                type="button"
                onClick={() => setActiveBottomPanelTab("party")}
              >
                Отряд
              </button>

              <button
                className={`bottom-panel-tab ${activeBottomPanelTab === "expedition" ? "active" : ""
                  }`}
                type="button"
                onClick={() => setActiveBottomPanelTab("expedition")}
              >
                Экспедиция
              </button>

              <button
                className={`bottom-panel-tab ${activeBottomPanelTab === "journal" ? "active" : ""
                  }`}
                type="button"
                onClick={() => setActiveBottomPanelTab("journal")}
              >
                Журнал
              </button>
            </nav>

            <div className="bottom-panel-tab-content">
              {activeBottomPanelTab === "party" && (
                <PartyStatusPanel
                  characters={visibleCharacters}
                  arsenalItems={visibleArsenalItems}
                  onOpenCharacter={handleOpenCharacterSheet}
                />
              )}

              {activeBottomPanelTab === "expedition" && (
                <ExpeditionTrackerPanel
                  expedition={expeditionState}
                  canEdit={!isPlayerMode}
                  isPlanningRoute={isPlanningRoute}
                  isSuggestingRoute={isSuggestingRoute}
                  onChangeExpedition={setExpeditionState}
                  onAdvanceSegment={handleAdvanceExpeditionSegment}
                  onResetExpedition={handleResetExpedition}
                  onStartRoutePlanning={handleStartRoutePlanning}
                  onClearRoutePoint={handleClearRoutePoint}
                  onStartRouteSuggestion={handleStartRouteSuggestion}
                  onAcceptRouteSuggestion={handleAcceptRouteSuggestion}
                  onClearRouteSuggestion={handleClearRouteSuggestion}
                />
              )}

              {activeBottomPanelTab === "journal" && (
                <SessionJournalPanel
                  entries={journalEntries}
                  canEdit={!isPlayerMode}
                  onAddEntry={handleAddJournalEntry}
                  onDeleteEntry={handleDeleteJournalEntry}
                  onClearEntries={handleClearJournalEntries}
                />
              )}
            </div>
          </section>
        </BottomDrawer>
      )}

      <SideDrawer
        isOpen={isSidebarOpen && !isCleanMapMode}
        isPlayerMode={isPlayerMode}
        isDeveloperMode={isDeveloperMode}
        selectedLocation={selectedLocation}
        locations={locations}
        groups={groups}
        selectedGroupId={selectedGroupId}
        events={events}
        selectedEventId={selectedEventId}
        globalMapImageUrl={globalMapImageUrl}
        onChangeGlobalMapImageUrl={setGlobalMapImageUrl}
        quests={quests}
        npcs={npcs}
        onChangeQuests={setQuests}
        onChangeNpcs={setNpcs}
        onToggleOpen={toggleSidebar}
        onUpdateLocation={updateSelectedLocation}
        onCreateLocation={createLocation}
        onDeleteLocation={deleteSelectedLocation}
        onResetLocations={resetLocations}
        onSelectLocation={setSelectedLocationId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={createGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={handleDeleteGroup}
        onSelectEvent={setSelectedEventId}
        onCreateEvent={createEvent}
        onDeleteEvent={handleDeleteEvent}
        onOpenEvent={handleOpenEventEncounter}
        onExportCampaign={handleExportCampaign}
        onImportCampaign={handleImportCampaign}
      />

      {!isCleanMapMode && (
        <HudTools
          isPlayerMode={isPlayerMode}
          isNotesOpen={isNotesOpen}
          isCharactersOpen={isCharactersOpen}
          isReferenceOpen={isReferenceOpen}
          onToggleNotes={() => setIsNotesOpen((current) => !current)}
          onToggleCharacters={() => setIsCharactersOpen((current) => !current)}
          onToggleReference={() => setIsReferenceOpen((current) => !current)}
        />
      )}

      {!isCleanMapMode && !isPlayerMode && isNotesOpen && (
        <MasterNotes
          notes={masterNotes}
          onChangeNotes={setMasterNotes}
          onClose={() => setIsNotesOpen(false)}
        />
      )}

      {!isCleanMapMode && isCharactersOpen && (
        <CharacterRoster
          characters={characters}
          arsenalItems={arsenalItems}
          initialCharacterId={characterRosterInitialId}
          isPlayerMode={isPlayerMode}
          onCreateCharacter={createCharacter}
          onUpdateCharacter={updateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onClose={() => setIsCharactersOpen(false)}
        />
      )}

      {!isCleanMapMode && isReferenceOpen && (
        <ReferenceLibrary
          articles={referenceArticles}
          arsenalItems={arsenalItems}
          isPlayerMode={isPlayerMode}
          isDeveloperMode={isDeveloperMode}
          onCreateArticle={createReferenceArticle}
          onUpdateArticle={updateReferenceArticle}
          onDeleteArticle={deleteReferenceArticle}
          onChangeArsenalItems={setArsenalItems}
          onClose={() => setIsReferenceOpen(false)}
        />
      )}

      {!isCleanMapMode && !isPlayerScreen && (
        <CampaignStartMenu
          isOpen={isStartMenuOpen}
          onContinue={() => setIsStartMenuOpen(false)}
          onLoadDemoCampaign={handleLoadDemoCampaign}
          onImportCampaign={(file) => {
            handleImportCampaign(file);
            setIsStartMenuOpen(false);
          }}
          onExportCampaign={handleExportCampaign}
        />
      )}

      <EncounterModal
        target={encounterTarget}
        isPlayerMode={isPlayerMode}
        initialMode={encounterInitialMode}
        canShowToPlayers={!isPlayerMode && !isPlayerScreen}
        onShowGlobalMapToPlayers={handleShowGlobalMapToPlayers}
        onShowToPlayers={handleShowToPlayers}
        onClose={() => setEncounterTarget(null)}
        onCreateSceneNote={handleCreateSceneNote}
        onUpdateMapEvent={handleUpdateEncounterEvent}
        onCreateLocationEvent={handleCreateLocationEvent}
      />
    </main>
  );
}

export default App;