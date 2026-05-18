import { useEffect, useState } from "react";
import { campaignData } from "../data/campaign";
import type {
  ArsenalItem,
  Location,
  MapEvent,
  MapGroup,
  PlayerCharacter,
  Quest,
  ReferenceArticle,
} from "../types/campaign";
import { normalizeLocation, normalizeQuest } from "../lib/campaignNormalize";
import {
  CHARACTERS_STORAGE_KEY,
  REFERENCE_ARTICLES_STORAGE_KEY,
  EVENTS_STORAGE_KEY,
  GROUPS_STORAGE_KEY,
  ITEMS_STORAGE_KEY,
  ARSENAL_ITEMS_STORAGE_KEY,
  LOCATIONS_STORAGE_KEY,
  NPCS_STORAGE_KEY,
  QUESTS_STORAGE_KEY,
  loadSavedCharacters,
  loadSavedReferenceArticles,
  loadSavedEvents,
  loadSavedGroups,
  loadSavedLocations,
  loadSavedQuests,
  loadSavedTextList,
  saveToStorage,
  createEmptyInventory,
  createEmptyWallet,
  loadSavedArsenalItems,
} from "../lib/storage";

export function useCampaign() {
  const [locations, setLocations] = useState<Location[]>(loadSavedLocations);
  const [groups, setGroups] = useState<MapGroup[]>(loadSavedGroups);
  const [events, setEvents] = useState<MapEvent[]>(loadSavedEvents);
  const [characters, setCharacters] =
    useState<PlayerCharacter[]>(loadSavedCharacters);
  const [quests, setQuests] = useState<Quest[]>(loadSavedQuests);
  const [referenceArticles, setReferenceArticles] = useState<ReferenceArticle[]>(
    loadSavedReferenceArticles,
  );

  const [npcs, setNpcs] = useState<string[]>(() =>
    loadSavedTextList(NPCS_STORAGE_KEY, campaignData.npcs),
  );

  const [items, setItems] = useState<string[]>(() =>
    loadSavedTextList(ITEMS_STORAGE_KEY, campaignData.items),
  );

  const [arsenalItems, setArsenalItems] =
    useState<ArsenalItem[]>(loadSavedArsenalItems);

  useEffect(() => {
    saveToStorage(LOCATIONS_STORAGE_KEY, locations);
  }, [locations]);

  useEffect(() => {
    saveToStorage(GROUPS_STORAGE_KEY, groups);
  }, [groups]);

  useEffect(() => {
    saveToStorage(EVENTS_STORAGE_KEY, events);
  }, [events]);

  useEffect(() => {
    saveToStorage(CHARACTERS_STORAGE_KEY, characters);
  }, [characters]);

  useEffect(() => {
    saveToStorage(REFERENCE_ARTICLES_STORAGE_KEY, referenceArticles);
  }, [referenceArticles]);

  useEffect(() => {
    saveToStorage(QUESTS_STORAGE_KEY, quests);
  }, [quests]);

  useEffect(() => {
    saveToStorage(NPCS_STORAGE_KEY, npcs);
  }, [npcs]);

  useEffect(() => {
    saveToStorage(ITEMS_STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    saveToStorage(ARSENAL_ITEMS_STORAGE_KEY, arsenalItems);
  }, [arsenalItems]);

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

  function deleteLocation(locationId: string) {
    setLocations((currentLocations) =>
      currentLocations.filter((location) => location.id !== locationId),
    );
  }

  function updateGroup(updatedGroup: MapGroup) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group,
      ),
    );
  }

  function createGroup(group: Omit<MapGroup, "id">) {
    const newGroup: MapGroup = {
      ...group,
      id: `group-${Date.now()}`,
    };

    setGroups((currentGroups) => [...currentGroups, newGroup]);

    return newGroup;
  }

  function deleteGroup(groupId: string) {
    setGroups((currentGroups) =>
      currentGroups.filter((group) => group.id !== groupId),
    );
  }

  function updateEvent(updatedEvent: MapEvent) {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  }

  function createEvent(event: Omit<MapEvent, "id">) {
    const newEvent: MapEvent = {
      ...event,
      id: `event-${Date.now()}`,
    };

    setEvents((currentEvents) => [...currentEvents, newEvent]);

    return newEvent;
  }

  function deleteEvent(eventId: string) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  }

  function exportCampaign(extraCampaignData: Record<string, unknown> = {}) {
    const archiveData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      type: "mogila-chelovechestva-campaign",
      campaign: {
        locations,
        groups,
        events,
        characters,
        referenceArticles,
        quests,
        npcs,
        items,
        arsenalItems,
        ...extraCampaignData,
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

  function importCampaign(
    file: File,
    onSuccess?: (
      firstLocationId: string,
      importedCampaign?: {
        revealedAreas?: unknown[];
        masterNotes?: unknown;
        globalMap?: unknown;
        expedition?: unknown;
        sceneDrafts?: unknown;
        localMaps?: unknown;
      },
    ) => void,
  ) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsedData = JSON.parse(text) as {
          campaign?: {
            locations?: Location[];
            groups?: MapGroup[];
            events?: MapEvent[];
            characters?: PlayerCharacter[];
            referenceArticles?: ReferenceArticle[];
            quests?: unknown[];
            npcs?: string[];
            items?: string[];
            arsenalItems?: ArsenalItem[];
            revealedAreas?: unknown[];
            masterNotes?: unknown;
            globalMap?: unknown;
            sceneDrafts?: unknown;
            localMaps?: unknown;
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
            parsedData.campaign.groups.map((group) => ({
              ...group,
              isSecret: Boolean(group.isSecret),
              members: Array.isArray(group.members) ? group.members : [],
            })),
          );
        }

        if (Array.isArray(parsedData.campaign?.events)) {
          setEvents(
            parsedData.campaign.events.map((event) => ({
              ...event,
              status: event.status ?? "hidden",
              isSecret: Boolean(event.isSecret),
            })),
          );
        }

        if (Array.isArray(parsedData.campaign?.characters)) {
          setCharacters(parsedData.campaign.characters);
        }

        if (Array.isArray(parsedData.campaign?.referenceArticles)) {
          setReferenceArticles(parsedData.campaign.referenceArticles);
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

        if (Array.isArray(parsedData.campaign?.arsenalItems)) {
          setArsenalItems(parsedData.campaign.arsenalItems);
        }

        onSuccess?.(normalizedLocations[0].id, parsedData.campaign);

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
    events,
    characters,
    referenceArticles,
    quests,
    npcs,
    items,
    arsenalItems,

    setQuests,
    setNpcs,
    setItems,
    setArsenalItems,
    setCharacters,
    setReferenceArticles,

    resetLocations,
    createLocation,
    createReferenceArticle,
    updateLocation,
    deleteLocation,

    updateGroup,
    updateReferenceArticle,
    createGroup,
    deleteGroup,

    updateEvent,
    createEvent,
    deleteEvent,

    createCharacter,
    updateCharacter,
    deleteCharacter,
    deleteReferenceArticle,

    exportCampaign,
    importCampaign,
  };

  function createEmptyCharacterSkills() {
    return {
      melee: 0,
      shooting: 0,
      specialWeapons: 0,
      athletics: 0,
      endurance: 0,
      stealth: 0,
      observation: 0,
      tracking: 0,
      navigation: 0,
      survival: 0,
      firstAid: 0,
      medicine: 0,
      repair: 0,
      devices: 0,
      crowns: 0,
      driving: 0,
      tactics: 0,
      intimidation: 0,
      negotiation: 0,
      insight: 0,
      criminal: 0,
      factions: 0,
      neurography: 0,
      echoInfophone: 0,
    };
  }

  function createCharacter() {
    const newCharacter: PlayerCharacter = {
      id: `character-${Date.now()}`,

      ownerPlayerName: "",
      status: "approved",
      isVisibleToPlayers: false,

      playerName: "",
      characterName: "Новый Вольный Клинок",
      nickname: "",
      oldName: "",
      oldNameKnownBy: "",

      age: "",
      origin: "",
      formerActivity: "",
      reasonToBecomeFreeblade: "",
      personalGoal: "",
      squadConnection: "",

      mass: "normal",
      empathy: "normal",

      physicalReserve: 4,
      psyche: 4,
      spirit: 3,
      fate: 1,

      maxPhysicalReserve: 4,
      maxPsyche: 4,
      maxSpirit: 3,
      maxFate: 3,

      skills: createEmptyCharacterSkills(),
      specializations: "",
      traits: "",

      woundsAndConditions: "",
      reflectionNotes: "",

      quickAccess: "",
      backpackAndLoad: "",
      weapons: "",
      armor: "",
      cryptotoken: "",
      wallet: createEmptyWallet(),

      inventory: createEmptyInventory(),

      contacts: "",
      debts: "",
      enemies: "",
      patrons: "",

      progressionNotes: "",
      secretHooks: "",
      masterNotes: "",
    };

    setCharacters((currentCharacters) => [...currentCharacters, newCharacter]);

    return newCharacter;
  }

  function updateCharacter(updatedCharacter: PlayerCharacter) {
    setCharacters((currentCharacters) =>
      currentCharacters.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character,
      ),
    );
  }

  function deleteCharacter(characterId: string) {
    setCharacters((currentCharacters) =>
      currentCharacters.filter((character) => character.id !== characterId),
    );
  }

  function createReferenceArticle() {
    const newArticle: ReferenceArticle = {
      id: `reference-${Date.now()}`,

      section: "rules",
      subsection: "",
      title: "Новая статья",
      content: "",

      visibility: "master",

      tags: "",

      imageUrls: [],
      assetIds: [],

      updatedAt: new Date().toISOString(),
    };

    setReferenceArticles((currentArticles) => [...currentArticles, newArticle]);

    return newArticle;
  }

  function updateReferenceArticle(updatedArticle: ReferenceArticle) {
    setReferenceArticles((currentArticles) =>
      currentArticles.map((article) =>
        article.id === updatedArticle.id
          ? {
            ...updatedArticle,
            updatedAt: new Date().toISOString(),
          }
          : article,
      ),
    );
  }

  function deleteReferenceArticle(articleId: string) {
    setReferenceArticles((currentArticles) =>
      currentArticles.filter((article) => article.id !== articleId),
    );
  }

}