import { useState } from "react";
import "./App.css";
import { MapView } from "./components/MapView";
import { SideDrawer } from "./components/SideDrawer";
import { TopBar } from "./components/TopBar";
import { campaignData } from "./data/campaign";
import { useCampaign } from "./hooks/useCampaign";
import { useInterfaceMode } from "./hooks/useInterfaceMode";
import { clampCoordinate, getRelativeMapCoordinate } from "./lib/coordinates";
import type { Location } from "./types/campaign";
import { BottomDrawer } from "./components/BottomDrawer";
import { InventoryPanel } from "./components/panels/InventoryPanel";

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

  function moveSelectedLocation(x: number, y: number) {
    updateSelectedLocation({
      ...selectedLocation,
      x: clampCoordinate(x),
      y: clampCoordinate(y),
    });
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isDeveloperMode) {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    const mapRectangle = event.currentTarget.getBoundingClientRect();

    const x = getRelativeMapCoordinate(
      event.clientX,
      mapRectangle.left,
      mapRectangle.width,
    );

    const y = getRelativeMapCoordinate(
      event.clientY,
      mapRectangle.top,
      mapRectangle.height,
    );

    moveSelectedLocation(x, y);
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

    const remainingLocations = locations.filter(
      (location) => location.id !== selectedLocation.id,
    );

    deleteLocation(selectedLocation.id);
    setSelectedLocationId(remainingLocations[0].id);
  }

  function handleImportCampaign(file: File) {
    importCampaign(file, (firstLocationId) => {
      setSelectedLocationId(firstLocationId);
      openSidebar();
    });
  }

  return (
    <main className="atlas-screen">
      <TopBar
        userMode={userMode}
        isSidebarOpen={isSidebarOpen}
        isCleanMapMode={isCleanMapMode}
        onChangeMode={changeMode}
        onToggleSidebar={toggleSidebar}
        onEnableCleanMapMode={enableCleanMapMode}
        onRestoreInterface={restoreInterface}
      />

      <MapView
  locations={visibleLocations}
  groups={visibleGroups}
  selectedLocationId={selectedLocationId}
  userMode={userMode}
  isDeveloperMode={isDeveloperMode}
  isCleanMapMode={isCleanMapMode}
  onMapClick={handleMapClick}
  onSelectLocation={setSelectedLocationId}
  onSelectGroup={setSelectedGroupId}
  onOpenSidebar={openSidebar}
  onExitCleanMapMode={exitCleanMapMode}
  onMoveLocation={(id, x, y) => {
    const location = locations.find((l) => l.id === id);
    if (!location) return;

    updateLocation({
      ...location,
      x,
      y,
    });
  }}
  onMoveGroup={(id, x, y) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;

    updateGroup({
      ...group,
      x,
      y,
    });
  }}
/>

<BottomDrawer
  isOpen={isBottomDrawerOpen && !isCleanMapMode}
  onToggleOpen={toggleBottomDrawer}
>
  <InventoryPanel npcs={npcs} items={items} />
</BottomDrawer>

      <SideDrawer
        isOpen={isSidebarOpen && !isCleanMapMode}
        isPlayerMode={isPlayerMode}
        isDeveloperMode={isDeveloperMode}
        selectedLocation={selectedLocation}
        locations={locations}
        quests={quests}
        npcs={npcs}
        items={items}
        onChangeQuests={setQuests}
        onChangeNpcs={setNpcs}
        onChangeItems={setItems}
        onToggleOpen={toggleSidebar}
        onUpdateLocation={updateSelectedLocation}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={createGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={(groupId) => {
          deleteGroup(groupId);

        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
      }}
        onCreateLocation={createLocation}
        onDeleteLocation={deleteSelectedLocation}
        onResetLocations={resetLocations}
        onSelectLocation={setSelectedLocationId}
        onExportCampaign={exportCampaign}
        onImportCampaign={handleImportCampaign}
      />
    </main>
  );
}

export default App;