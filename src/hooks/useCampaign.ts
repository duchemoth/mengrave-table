import { useEffect, useState } from "react";
import { campaignData } from "../data/campaign";
import type { Location, Quest, MapGroup } from "../types/campaign";
import { normalizeLocation, normalizeQuest } from "../lib/campaignNormalize";
import {
  GROUPS_STORAGE_KEY,
  ITEMS_STORAGE_KEY,
  LOCATIONS_STORAGE_KEY,
  NPCS_STORAGE_KEY,
  QUESTS_STORAGE_KEY,
  loadSavedGroups,
  loadSavedLocations,
  loadSavedQuests,
  loadSavedTextList,
  saveToStorage,
} from "../lib/storage";

export function useCampaign() {
  const [locations, setLocations] = useState<Location[]>(loadSavedLocations);
  const [groups, setGroups] = useState<MapGroup[]>(loadSavedGroups);
  const [quests, setQuests] = useState<Quest[]>(loadSavedQuests);

  const [npcs, setNpcs] = useState<string[]>(() =>
    loadSavedTextList(NPCS_STORAGE_KEY, campaignData.npcs),
  );

  const [items, setItems] = useState<string[]>(() =>
    loadSavedTextList(ITEMS_STORAGE_KEY, campaignData.items),
  );

  useEffect(() => {
    saveToStorage(LOCATIONS_STORAGE_KEY, locations);
  }, [locations]);

  useEffect(() => {
    saveToStorage(GROUPS_STORAGE_KEY, groups);
  }, [groups]);

  useEffect(() => {
    saveToStorage(QUESTS_STORAGE_KEY, quests);
  }, [quests]);

  useEffect(() => {
    saveToStorage(NPCS_STORAGE_KEY, npcs);
  }, [npcs]);

  useEffect(() => {
    saveToStorage(ITEMS_STORAGE_KEY, items);
  }, [items]);

  function resetLocations() {
    setLocations(campaignData.locations);
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

    return newLocation;
  }

  function updateLocation(updatedLocation: Location) {
    setLocations((currentLocations) =>
      currentLocations.map((location) =>
        location.id === updatedLocation.id ? updatedLocation : location,
      ),
    );
  }

  function updateGroup(updatedGroup: MapGroup) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group,
      ),
    );
  }

  function deleteLocation(locationId: string) {
    setLocations((currentLocations) =>
      currentLocations.filter((location) => location.id !== locationId),
    );
  }

  function exportCampaign() {
    const archiveData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      type: "mogila-chelovechestva-campaign",
      campaign: {
        locations,
        groups,
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

  function importCampaign(file: File, onSuccess?: (firstLocationId: string) => void) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsedData = JSON.parse(text) as {
          campaign?: {
            locations?: Location[];
            groups?: MapGroup[];
            quests?: unknown[];
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

        const normalizedLocations = importedLocations.map(normalizeLocation);

        if (normalizedLocations.length === 0) {
          window.alert("В файле нет локаций.");
          return;
        }

        setLocations(normalizedLocations);

        if (Array.isArray(parsedData.campaign?.groups)) {
          setGroups(
            parsedData.campaign.groups.map((group: MapGroup) => ({
            ...group,
            isSecret: Boolean(group.isSecret),
            members: Array.isArray(group.members) ? group.members : [],
          })),
        );
      }

        if (Array.isArray(parsedData.campaign?.quests)) {
          setQuests(parsedData.campaign.quests.map(normalizeQuest));
        }

        if (Array.isArray(parsedData.campaign?.npcs)) {
          setNpcs(parsedData.campaign.npcs.map(String));
        }

        if (Array.isArray(parsedData.campaign?.items)) {
          setItems(parsedData.campaign.items.map(String));
        }

        onSuccess?.(normalizedLocations[0].id);

        window.alert("Кампания импортирована.");
      } catch {
        window.alert("Не удалось прочитать JSON-файл кампании.");
      }
    };

    reader.readAsText(file);
  }

  return {
    locations,
    groups,
    quests,
    npcs,
    items,

    setQuests,
    setNpcs,
    setGroups,
    setItems,

    resetLocations,
    createLocation,
    updateLocation,
    updateGroup,
    deleteLocation,
    exportCampaign,
    importCampaign,
  };
}