import { useEffect, useState } from "react";
import "./App.css";
import { BottomDrawer } from "./components/BottomDrawer";
import { EncounterModal } from "./components/EncounterModal";
import { HudTools } from "./components/HudTools";
import { MapView } from "./components/MapView";
import { MasterNotes } from "./components/MasterNotes";
import { SideDrawer } from "./components/SideDrawer";
import { TopBar } from "./components/TopBar";
import { InventoryPanel } from "./components/panels/InventoryPanel";
import { campaignData } from "./data/campaign";
import { useCampaign } from "./hooks/useCampaign";
import { useInterfaceMode } from "./hooks/useInterfaceMode";
import type { Location, MapGroup } from "./types/campaign";

const MASTER_NOTES_STORAGE_KEY = "nri-table-master-notes";

function App() {
  const {
    locations,
    groups,
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
    createGroup,
    deleteGroup,
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

  const [encounterTarget, setEncounterTarget] = useState<
    | { kind: "location"; data: Location }
    | { kind: "group"; data: MapGroup }
    | null
  >(null);

  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const [masterNotes, setMasterNotes] = useState(() => {
    return localStorage.getItem(MASTER_NOTES_STORAGE_KEY) ?? "";
  });

  useEffect(() => {
    localStorage.setItem(MASTER_NOTES_STORAGE_KEY, masterNotes);
  }, [masterNotes]);

  const visibleLocations = locations.filter((location) => {
    return !isPlayerMode || !location.isSecret;
  });

  const visibleGroups = groups.filter((group) => {
    return !isPlayerMode || !group.isSecret;
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

  function handleOpenLocationEncounter(location: Location) {
    setEncounterTarget({ kind: "location", data: location });
  }

  function handleOpenGroupEncounter(group: MapGroup) {
    setEncounterTarget({ kind: "group", data: group });
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
        selectedLocationId={selectedLocationId}
        selectedGroupId={selectedGroupId}
        userMode={userMode}
        isDeveloperMode={isDeveloperMode}
        isCleanMapMode={isCleanMapMode}
        onSelectLocation={setSelectedLocationId}
        onSelectGroup={setSelectedGroupId}
        onExitCleanMapMode={exitCleanMapMode}
        onMoveLocation={handleMoveLocation}
        onMoveGroup={handleMoveGroup}
        onOpenLocationEncounter={handleOpenLocationEncounter}
        onOpenGroupEncounter={handleOpenGroupEncounter}
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
        onExportCampaign={exportCampaign}
        onImportCampaign={handleImportCampaign}
      />

      {!isCleanMapMode && (
        <HudTools
          isPlayerMode={isPlayerMode}
          isNotesOpen={isNotesOpen}
          onToggleNotes={() => setIsNotesOpen((current) => !current)}
        />
      )}

      {!isCleanMapMode && !isPlayerMode && isNotesOpen && (
        <MasterNotes
          notes={masterNotes}
          onChangeNotes={setMasterNotes}
          onClose={() => setIsNotesOpen(false)}
        />
      )}

      <EncounterModal
        target={encounterTarget}
        onClose={() => setEncounterTarget(null)}
        onCreateSceneNote={handleCreateSceneNote}
      />
    </main>
  );
}

export default App;