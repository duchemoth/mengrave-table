import { useRef, useState } from "react";
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
  isPlacingEvent: boolean;
  onSelectLocation: (locationId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onExitCleanMapMode: () => void;
  onMoveLocation: (id: string, x: number, y: number) => void;
  onMoveGroup: (id: string, x: number, y: number) => void;
  onMoveEvent: (id: string, x: number, y: number) => void;
  onToggleEventPlacement: () => void;
  onCreateMapEventAt: (x: number, y: number) => void;
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
  isPlacingEvent,
  onSelectLocation,
  onSelectGroup,
  onSelectEvent,
  onExitCleanMapMode,
  onMoveLocation,
  onMoveGroup,
  onMoveEvent,
  onToggleEventPlacement,
  onCreateMapEventAt,
  onOpenLocationEncounter,
  onOpenGroupEncounter,
  onOpenEventEncounter,
}: MapViewProps) {
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [didJustDragMarker, setDidJustDragMarker] = useState(false);

  const didMoveMarkerRef = useRef(false);

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
    if (event.button !== 0) {
      return;
    }

    if (!isDeveloperMode) {
      return;
    }

    event.stopPropagation();
    didMoveMarkerRef.current = false;
    setDraggedLocationId(locationId);
    setIsDraggingMarker(true);
  }

  function startGroupDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    groupId: string,
  ) {
    if (event.button !== 0) {
      return;
    }

    if (userMode === "player") {
      return;
    }

    event.stopPropagation();
    didMoveMarkerRef.current = false;
    setDraggedGroupId(groupId);
    setIsDraggingMarker(true);
  }

  function startEventDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    mapEventId: string,
  ) {
    if (event.button !== 0) {
      return;
    }

    if (userMode === "player") {
      return;
    }

    event.stopPropagation();
    didMoveMarkerRef.current = false;
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

    didMoveMarkerRef.current = true;
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

    didMoveMarkerRef.current = true;
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

    didMoveMarkerRef.current = true;
    onMoveEvent(draggedEventId, x, y);
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isPlacingEvent || userMode === "player") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    event.stopPropagation();
    onCreateMapEventAt(x, y);
  }

  function stopMarkerDrag() {
    const wasDraggingMarker =
      draggedLocationId !== null || draggedGroupId !== null || draggedEventId !== null;

    const didMoveMarker = didMoveMarkerRef.current;

    setDraggedLocationId(null);
    setDraggedGroupId(null);
    setDraggedEventId(null);
    setIsDraggingMarker(false);
    didMoveMarkerRef.current = false;

    if (wasDraggingMarker && didMoveMarker) {
      setDidJustDragMarker(true);

      window.setTimeout(() => {
        setDidJustDragMarker(false);
      }, 120);
    }
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
          className={`map ${isDeveloperMode ? "map-editable" : ""} ${isPlacingEvent ? "map-placing-event" : ""
            }`}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          }}
          onMouseDown={(event) => {
            if (isPlacingEvent) {
              event.stopPropagation();
            }
          }}
          onClick={handleMapClick}
        >
          {!isCleanMapMode && (
            <div className="map-label">
              Вольный Клинок · режим: {getModeTitle(userMode)}
            </div>
          )}

          {!isCleanMapMode && isPlacingEvent && (
            <div className="map-hint">
              Кликни по карте, чтобы разместить событие · Esc — отмена
            </div>
          )}

          {isDeveloperMode && !isCleanMapMode && !isPlacingEvent && (
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
                    if (isDraggingMarker || didJustDragMarker) return;

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
                    if (isDraggingMarker || didJustDragMarker) return;

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
                    if (isDraggingMarker || didJustDragMarker) return;

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
                    if (isDraggingMarker || didJustDragMarker) return;

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
            const isCompleted = mapEvent.status === "completed";

            return (
              <div
                key={mapEvent.id}
                className={`map-event map-event-${mapEvent.category} ${isCompleted ? "completed" : ""
                  }`}
                style={{
                  left: `${mapEvent.x}%`,
                  top: `${mapEvent.y}%`,
                }}
              >
                <button
                  className={`map-event-token ${selectedEventId === mapEvent.id ? "selected" : ""
                    } ${isCompleted ? "completed" : ""}`}
                  onMouseDown={(event) => startEventDrag(event, mapEvent.id)}
                  onClick={(event) => {
                    if (isDraggingMarker || didJustDragMarker) return;

                    event.stopPropagation();
                    onSelectEvent(mapEvent.id);
                    onOpenEventEncounter(mapEvent);
                    onExitCleanMapMode();
                  }}
                  title={`${meta.label}: ${mapEvent.title}`}
                >
                  <span className="map-event-icon">{isCompleted ? "✔" : meta.icon}</span>
                </button>

                <button
                  className={`map-event-label ${isCleanMapMode ? "hidden-in-clean-mode" : ""
                    }`}
                  onMouseDown={(event) => startEventDrag(event, mapEvent.id)}
                  onClick={(event) => {
                    if (isDraggingMarker || didJustDragMarker) return;

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
        <button
          className={`map-create-event-button ${isPlacingEvent ? "active" : ""
            }`}
          onClick={onToggleEventPlacement}
        >
          {isPlacingEvent ? "Отменить событие" : "Разместить событие"}
        </button>
      )}

    </section>
  );
}