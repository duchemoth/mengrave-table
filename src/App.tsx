import { useEffect, useRef, useState } from "react";
import "./App.css";
import { BottomDrawer } from "./components/BottomDrawer";
import { PartyStatusPanel } from "./components/panels/PartyStatusPanel";
import { EncounterModal } from "./components/EncounterModal";
import { HudTools } from "./components/HudTools";
import { MapView } from "./components/MapView";
import { MasterNotes } from "./components/MasterNotes";
import { CharacterRoster } from "./components/CharacterRoster";
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
  "nri-table-player-presentation",
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

  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

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
    }
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
      sceneDrafts: collectJsonStorageByPrefix(SCENE_STORAGE_PREFIX),
      localMaps: collectJsonStorageByPrefix(LOCAL_MAP_STORAGE_PREFIX),
    });
  }

  function clampMapCoordinate(value: number) {
    return Math.max(0, Math.min(100, value));
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
  }

  function handleShowGlobalMapToPlayers() {
    if (isPlayerMode) {
      return;
    }

    savePlayerPresentation({
      mode: "globalMap",
      updatedAt: Date.now(),
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
          <PartyStatusPanel
            characters={characters}
            arsenalItems={arsenalItems}
            onOpenCharacter={handleOpenCharacterSheet}
          />
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

      {!isCleanMapMode && !isPlayerMode && isCharactersOpen && (
        <CharacterRoster
          characters={characters}
          arsenalItems={arsenalItems}
          initialCharacterId={characterRosterInitialId}
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