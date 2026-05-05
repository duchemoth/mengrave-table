import { useState } from "react";
import { useMapViewport } from "../hooks/useMapViewport";
import type { Location, MapEvent, MapGroup, UserMode } from "../types/campaign";

type MapViewProps = {
  locations: Location[];
  groups: MapGroup[];
  events: MapEvent[];
  selectedLocationId: string;
  selectedGroupId: string | null;
  selectedEventId: string | null;
  userMode: UserMode;
  isDeveloperMode: boolean;
  isCleanMapMode: boolean;
  onSelectLocation: (locationId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onExitCleanMapMode: () => void;
  onMoveLocation: (id: string, x: number, y: number) => void;
  onMoveGroup: (id: string, x: number, y: number) => void;
  onMoveEvent: (id: string, x: number, y: number) => void;
  onCreateMapEvent: () => void;
  onOpenLocationEncounter: (location: Location) => void;
  onOpenGroupEncounter: (group: MapGroup) => void;
  onOpenEventEncounter: (event: MapEvent) => void;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getModeTitle(mode: UserMode) {
  if (mode === "player") return "Игрок";
  if (mode === "master") return "Мастер";
  return "Эхо";
}

const MAP_GROUP_FACTION_META = {
  players: { label: "Отряд игроков", icon: "⚔" },
  fief: { label: "Феодальные силы", icon: "♜" },
  euler: { label: "Дом Эйлеров", icon: "⚙" },
  voyager: { label: "Купеческие вояджеры", icon: "◆" },
  evergal: { label: "Эвергальский конклав", icon: "✚" },
  brigand: { label: "Бриганты", icon: "☠" },
  infiltrator: { label: "Наймиты", icon: "◐" },
  freeblade: { label: "Вольники", icon: "✦" },
  valour: { label: "Валор Обскурия", icon: "⚜" },
  echomorph: { label: "Эхоморфы", icon: "☉" },
} as const;

const MAP_EVENT_CATEGORY_META = {
  incident: { label: "Происшествие", icon: "!" },
  mystery: { label: "Неясность", icon: "?" },
  aberration: { label: "Аберрация", icon: "☉" },
  conflict: { label: "Столкновение", icon: "⚔" },
  object: { label: "Объект", icon: "◆" },
  other: { label: "Другое", icon: "•" },
} as const;

export function MapView({
  locations,
  groups,
  events,
  selectedLocationId,
  selectedGroupId,
  selectedEventId,
  userMode,
  isDeveloperMode,
  isCleanMapMode,
  onSelectLocation,
  onSelectGroup,
  onSelectEvent,
  onExitCleanMapMode,
  onMoveLocation,
  onMoveGroup,
  onMoveEvent,
  onCreateMapEvent,
  onOpenLocationEncounter,
  onOpenGroupEncounter,
  onOpenEventEncounter,
}: MapViewProps) {
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  const {
    scale,
    offsetX,
    offsetY,
    isDraggingMap,
    handleWheel,
    startMapDrag,
    moveMap,
    stopMapDrag,
    resetMapView,
  } = useMapViewport();

  function startMarkerDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    locationId: string,
  ) {
    if (!isDeveloperMode) {
      return;
    }

    event.stopPropagation();
    setDraggedLocationId(locationId);
    setIsDraggingMarker(true);
  }

  function startGroupDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    groupId: string,
  ) {
    if (userMode === "player") {
      return;
    }

    event.stopPropagation();
    setDraggedGroupId(groupId);
    setIsDraggingMarker(true);
  }

  function startEventDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    mapEventId: string,
  ) {
    if (userMode === "player") {
      return;
    }

    event.stopPropagation();
    setDraggedEventId(mapEventId);
    setIsDraggingMarker(true);
  }

  function handleMarkerMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!draggedLocationId) {
      return;
    }

    const map = event.currentTarget.querySelector(".map") as HTMLDivElement | null;

    if (!map) {
      return;
    }

    const rect = map.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    onMoveLocation(draggedLocationId, x, y);
  }

  function handleGroupMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!draggedGroupId) {
      return;
    }

    const map = event.currentTarget.querySelector(".map") as HTMLDivElement | null;

    if (!map) {
      return;
    }

    const rect = map.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    onMoveGroup(draggedGroupId, x, y);
  }

  function handleEventMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!draggedEventId) {
      return;
    }

    const map = event.currentTarget.querySelector(".map") as HTMLDivElement | null;

    if (!map) {
      return;
    }

    const rect = map.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    onMoveEvent(draggedEventId, x, y);
  }

  function stopMarkerDrag() {
    setDraggedLocationId(null);
    setDraggedGroupId(null);
    setDraggedEventId(null);
    setIsDraggingMarker(false);
  }

  return (
    <section className="map-stage">
      <div
        className={`map-viewport ${isDraggingMap || draggedLocationId || draggedGroupId || draggedEventId
          ? "map-dragging"
          : ""
          }`}
        onWheel={handleWheel}
        onMouseDown={startMapDrag}
        onMouseMove={(event) => {
          moveMap(event);
          handleMarkerMove(event);
          handleGroupMove(event);
          handleEventMove(event);
        }}
        onMouseUp={() => {
          stopMapDrag();
          stopMarkerDrag();
        }}
        onMouseLeave={() => {
          stopMapDrag();
          stopMarkerDrag();
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className={`map ${isDeveloperMode ? "map-editable" : ""}`}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          }}
        >
          {!isCleanMapMode && (
            <div className="map-label">
              Вольный Клинок · режим: {getModeTitle(userMode)}
            </div>
          )}

          {isDeveloperMode && !isCleanMapMode && (
            <div className="map-hint">
              Зажми маркер, чтобы переместить локацию
            </div>
          )}

          {locations.map((location) => {
            const isSelected = selectedLocationId === location.id;

            return (
              <div
                key={location.id}
                className={`map-marker ${isSelected ? "active" : ""}`}
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                }}
              >
                <button
                  className={`map-pin map-pin-${location.category} ${isSelected ? "active" : ""
                    } ${location.isSecret ? "secret" : ""}`}
                  onMouseDown={(event) => startMarkerDrag(event, location.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectLocation(location.id);
                    onOpenLocationEncounter(location);
                    onExitCleanMapMode();
                  }}
                  title={location.title}
                >
                  <span />
                </button>

                <button
                  className={`map-marker-label ${location.isSecret ? "secret" : ""
                    } ${isCleanMapMode ? "hidden-in-clean-mode" : ""}`}
                  onMouseDown={(event) => startMarkerDrag(event, location.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectLocation(location.id);
                    onOpenLocationEncounter(location);
                    onExitCleanMapMode();
                  }}
                >
                  {location.title}
                </button>
              </div>
            );
          })}

          {groups.map((group) => {
            const meta = MAP_GROUP_FACTION_META[group.faction];

            return (
              <div
                key={group.id}
                className={`map-group map-group-${group.faction}`}
                style={{
                  left: `${group.x}%`,
                  top: `${group.y}%`,
                }}
              >
                <button
                  className={`map-group-token ${selectedGroupId === group.id ? "selected" : ""
                    }`}
                  onMouseDown={(event) => startGroupDrag(event, group.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectGroup(group.id);
                    onOpenGroupEncounter(group);
                    onExitCleanMapMode();
                  }}
                  title={`${meta.label}: ${group.name}`}
                >
                  <span className="map-group-icon">{meta.icon}</span>
                </button>

                <button
                  className={`map-group-label ${isCleanMapMode ? "hidden-in-clean-mode" : ""
                    }`}
                  onMouseDown={(event) => startGroupDrag(event, group.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectGroup(group.id);
                    onOpenGroupEncounter(group);
                    onExitCleanMapMode();
                  }}
                >
                  {group.name}
                </button>
              </div>
            );
          })}
          {events.map((mapEvent) => {
            const meta = MAP_EVENT_CATEGORY_META[mapEvent.category];

            return (
              <div
                key={mapEvent.id}
                className={`map-event map-event-${mapEvent.category}`}
                style={{
                  left: `${mapEvent.x}%`,
                  top: `${mapEvent.y}%`,
                }}
              >
                <button
                  className={`map-event-token ${selectedEventId === mapEvent.id ? "selected" : ""
                    }`}
                  onMouseDown={(event) => startEventDrag(event, mapEvent.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectEvent(mapEvent.id);
                    onOpenEventEncounter(mapEvent);
                    onExitCleanMapMode();
                  }}
                  title={`${meta.label}: ${mapEvent.title}`}
                >
                  <span className="map-event-icon">{meta.icon}</span>
                </button>

                <button
                  className={`map-event-label ${isCleanMapMode ? "hidden-in-clean-mode" : ""
                    }`}
                  onMouseDown={(event) => startEventDrag(event, mapEvent.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectEvent(mapEvent.id);
                    onOpenEventEncounter(mapEvent);
                    onExitCleanMapMode();
                  }}
                >
                  {mapEvent.title}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {!isCleanMapMode && (
        <button className="map-reset-button" onClick={resetMapView}>
          Сбросить вид · {Math.round(scale * 100)}%
        </button>
      )}

      {!isCleanMapMode && userMode !== "player" && (
        <button className="map-create-event-button" onClick={onCreateMapEvent}>
          Создать событие
        </button>
      )}

    </section>
  );
}