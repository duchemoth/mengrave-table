import { useEffect, useState } from "react";
import "./App.css";
import { BottomDrawer } from "./components/BottomDrawer";
import { EncounterModal } from "./components/EncounterModal";
import { HudTools } from "./components/HudTools";
import { MapView } from "./components/MapView";
import { MasterNotes } from "./components/MasterNotes";
import { CharacterRoster } from "./components/CharacterRoster";
import { SideDrawer } from "./components/SideDrawer";
import { TopBar } from "./components/TopBar";
import { InventoryPanel } from "./components/panels/InventoryPanel";
import { campaignData } from "./data/campaign";
import { useCampaign } from "./hooks/useCampaign";
import { useInterfaceMode } from "./hooks/useInterfaceMode";
import { ReferenceLibrary } from "./components/ReferenceLibrary";
import type { Location, MapEvent, MapGroup, } from "./types/campaign";

const MASTER_NOTES_STORAGE_KEY = "nri-table-master-notes";

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
    items,
    setQuests,
    setNpcs,
    setItems,
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

  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [isCharactersOpen, setIsCharactersOpen] = useState(false);

  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const [masterNotes, setMasterNotes] = useState(() => {
    return localStorage.getItem(MASTER_NOTES_STORAGE_KEY) ?? "";
  });

  useEffect(() => {
    localStorage.setItem(MASTER_NOTES_STORAGE_KEY, masterNotes);
  }, [masterNotes]);

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

  function handleImportCampaign(file: File) {
    importCampaign(file, (firstLocationId) => {
      setSelectedLocationId(firstLocationId);
      openSidebar();
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
    setEncounterTarget({ kind: "location", data: location });
  }

  function handleOpenGroupEncounter(group: MapGroup) {
    setEncounterTarget({ kind: "group", data: group });
  }

  function handleOpenEventEncounter(event: MapEvent) {
    setEncounterTarget({ kind: "event", data: event });
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

  return (
    <main className="atlas-screen">
      <TopBar
        userMode={userMode}
        isCleanMapMode={isCleanMapMode}
        onChangeMode={changeMode}
        onEnableCleanMapMode={enableCleanMapMode}
        onRestoreInterface={restoreInterface}
      />

      <MapView
        locations={visibleLocations}
        groups={visibleGroups}
        events={visibleEvents}
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
          <InventoryPanel npcs={npcs} items={items} />
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
        quests={quests}
        npcs={npcs}
        items={items}
        onChangeQuests={setQuests}
        onChangeNpcs={setNpcs}
        onChangeItems={setItems}
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
        onExportCampaign={exportCampaign}
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
          onCreateCharacter={createCharacter}
          onUpdateCharacter={updateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onClose={() => setIsCharactersOpen(false)}
        />
      )}

      {!isCleanMapMode && isReferenceOpen && (
        <ReferenceLibrary
          articles={referenceArticles}
          isPlayerMode={isPlayerMode}
          isDeveloperMode={isDeveloperMode}
          onCreateArticle={createReferenceArticle}
          onUpdateArticle={updateReferenceArticle}
          onDeleteArticle={deleteReferenceArticle}
          onClose={() => setIsReferenceOpen(false)}
        />
      )}

      <EncounterModal
        target={encounterTarget}
        onClose={() => setEncounterTarget(null)}
        onCreateSceneNote={handleCreateSceneNote}
        onUpdateMapEvent={handleUpdateEncounterEvent}
        onCreateLocationEvent={handleCreateLocationEvent}
      />
    </main>
  );
}

export default App;