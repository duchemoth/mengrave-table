import { useEffect, useState } from "react";
import "./App.css";
import { MapView } from "./components/MapView";
import { SideDrawer } from "./components/SideDrawer";
import { TopBar } from "./components/TopBar";
import { campaignData } from "./data/campaign";
import type { Location, Quest, UserMode } from "./types/campaign";

const DEVELOPER_PASSWORD = "550034";
const LOCATIONS_STORAGE_KEY = "nri-table-locations";
const QUESTS_STORAGE_KEY = "nri-table-quests";
const NPCS_STORAGE_KEY = "nri-table-npcs";
const ITEMS_STORAGE_KEY = "nri-table-items";

function loadSavedLocations() {
  const savedLocations = localStorage.getItem(LOCATIONS_STORAGE_KEY);

  if (!savedLocations) {
    return campaignData.locations;
  }

  try {
    const parsedLocations = JSON.parse(savedLocations) as Location[];

    return parsedLocations.map((location) => ({
      ...location,
      category: location.category ?? (location.isSecret ? "secret" : "settlement"),
    }));
  } catch {
    return campaignData.locations;
  }
}

function loadSavedTextList(storageKey: string, fallbackItems: string[]) {
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

function normalizeQuest(rawQuest: unknown, index: number): Quest {
  if (typeof rawQuest === "string") {
    return {
      id: `quest-${index}-${rawQuest}`,
      title: rawQuest,
      description: "",
      status: "active",
      isSecret: false,
    };
  }

  const quest = rawQuest as Partial<Quest>;

  return {
    id: String(quest.id ?? `quest-${Date.now()}-${index}`),
    title: String(quest.title ?? `Поручение ${index + 1}`),
    description: String(quest.description ?? ""),
    status: quest.status ?? "active",
    isSecret: Boolean(quest.isSecret),
  };
}

function loadSavedQuests() {
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

function clampCoordinate(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function App() {
  const [locations, setLocations] = useState<Location[]>(loadSavedLocations);
  const [selectedLocationId, setSelectedLocationId] = useState("old-harbor");
  const [userMode, setUserMode] = useState<UserMode>("master");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCleanMapMode, setIsCleanMapMode] = useState(false);
  const [quests, setQuests] = useState<Quest[]>(loadSavedQuests);

const [npcs, setNpcs] = useState<string[]>(() =>
  loadSavedTextList(NPCS_STORAGE_KEY, campaignData.npcs),
);

const [items, setItems] = useState<string[]>(() =>
  loadSavedTextList(ITEMS_STORAGE_KEY, campaignData.items),
);

  const isPlayerMode = userMode === "player";
  const isDeveloperMode = userMode === "developer";

  const visibleLocations = locations.filter((location) => {
    return !isPlayerMode || !location.isSecret;
  });

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    locations[0];

  useEffect(() => {
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
  localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(quests));
}, [quests]);

useEffect(() => {
  localStorage.setItem(NPCS_STORAGE_KEY, JSON.stringify(npcs));
}, [npcs]);

useEffect(() => {
  localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
}, [items]);

  function changeMode(nextMode: UserMode) {
    if (nextMode === "developer" && userMode !== "developer") {
      const password = window.prompt("Введите пароль Эха");

      if (password !== DEVELOPER_PASSWORD) {
        window.alert("Неверный пароль");
        return;
      }
    }

    setUserMode(nextMode);
    setIsSidebarOpen(true);
    setIsCleanMapMode(false);
  }

  function updateSelectedLocation(updatedLocation: Location) {
    setLocations((currentLocations) =>
      currentLocations.map((location) =>
        location.id === updatedLocation.id ? updatedLocation : location,
      ),
    );
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

    const x = ((event.clientX - mapRectangle.left) / mapRectangle.width) * 100;
    const y = ((event.clientY - mapRectangle.top) / mapRectangle.height) * 100;

    moveSelectedLocation(x, y);
  }

  function resetLocations() {
    const shouldReset = window.confirm(
      "Сбросить все локации к стартовым данным? Текущие изменения будут потеряны.",
    );

    if (!shouldReset) {
      return;
    }

    setLocations(campaignData.locations);
    setSelectedLocationId(campaignData.locations[0].id);
  }

  function createLocation() {
    const newLocationNumber = locations.length + 1;

    const newLocation: Location = {
      id: `location-${Date.now()}`,
      title: `Новая локация ${newLocationNumber}`,
      type: "Локация",
      category: "settlement",
      description: "Описание новой локации.",
      x: 50,
      y: 50,
      isSecret: false,
    };

    setLocations((currentLocations) => [...currentLocations, newLocation]);
    setSelectedLocationId(newLocation.id);
    setIsSidebarOpen(true);
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

    setLocations(remainingLocations);
    setSelectedLocationId(remainingLocations[0].id);
  }

  function exportCampaign() {
    const archiveData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      type: "mogila-chelovechestva-campaign",
      campaign: {
        locations,
        quests,
        npcs,
        items,
},
    };

    const json = JSON.stringify(archiveData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mogila-chelovechestva-campaign.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  function importCampaign(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsedData = JSON.parse(text) as {
          campaign?: {
            locations?: Location[];
            quests?: string[];
            npcs?: string[];
            items?: string[];
          };
          locations?: Location[];
        };

        const importedLocations =
          parsedData.campaign?.locations ?? parsedData.locations;

        if (!Array.isArray(importedLocations)) {
          window.alert("В файле не найден список локаций кампании.");
          return;
        }

        const normalizedLocations = importedLocations.map((location) => ({
          ...location,
          category: location.category ?? "settlement",
          isSecret: Boolean(location.isSecret),
        }));

        if (normalizedLocations.length === 0) {
          window.alert("В файле нет локаций.");
          return;
        }

        setLocations(normalizedLocations);
setSelectedLocationId(normalizedLocations[0].id);

if (Array.isArray(parsedData.campaign?.quests)) {
  setQuests(parsedData.campaign.quests.map(normalizeQuest));
}

if (Array.isArray(parsedData.campaign?.npcs)) {
  setNpcs(parsedData.campaign.npcs.map(String));
}

if (Array.isArray(parsedData.campaign?.items)) {
  setItems(parsedData.campaign.items.map(String));
}

setIsSidebarOpen(true);

window.alert("Кампания импортирована.");

      } catch {
        window.alert("Не удалось прочитать JSON-файл кампании.");
      }
    };

    reader.readAsText(file);
  }

  return (
    <main className="atlas-screen">
      <TopBar
        userMode={userMode}
        isSidebarOpen={isSidebarOpen}
        isCleanMapMode={isCleanMapMode}
        onChangeMode={changeMode}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onEnableCleanMapMode={() => {
          setIsCleanMapMode(true);
          setIsSidebarOpen(false);
        }}
        onRestoreInterface={() => {
          setIsCleanMapMode(false);
          setIsSidebarOpen(true);
        }}
      />

      <MapView
        locations={visibleLocations}
        selectedLocationId={selectedLocationId}
        userMode={userMode}
        isDeveloperMode={isDeveloperMode}
        isCleanMapMode={isCleanMapMode}
        onMapClick={handleMapClick}
        onSelectLocation={setSelectedLocationId}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onExitCleanMapMode={() => setIsCleanMapMode(false)}
      />

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
        onToggleOpen={() => setIsSidebarOpen((current) => !current)}
        onUpdateLocation={updateSelectedLocation}
        onCreateLocation={createLocation}
        onDeleteLocation={deleteSelectedLocation}
        onResetLocations={resetLocations}
        onSelectLocation={setSelectedLocationId}
        onExportCampaign={exportCampaign}
        onImportCampaign={importCampaign}
      />
    </main>
  );
}

export default App;