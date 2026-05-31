import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useMapViewport } from "../hooks/useMapViewport";
import { getAttachmentKindConfig, getAttachmentStatusLabel } from "../data/attachments";
import type {
  Location,
  MapAttachment,
  MapEvent,
  MapEventScale,
  MapGroup,
  UserMode,
} from "../types/campaign";

type RevealedMapArea = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

type MapViewProps = {
  locations: Location[];
  groups: MapGroup[];
  events: MapEvent[];
  attachments: MapAttachment[];
  globalMapImageUrl: string;
  selectedLocationId: string;
  selectedGroupId: string | null;
  selectedEventId: string | null;
  userMode: UserMode;
  isDeveloperMode: boolean;
  isCleanMapMode: boolean;
  isPlacingEvent: boolean;
  isPlanningRoute: boolean;
  isSuggestingRoute: boolean;
  routePointX: number | null;
  routePointY: number | null;
  suggestedRoutePointX: number | null;
  suggestedRoutePointY: number | null;
  isRevealingFog: boolean;
  isHidingRevealedArea: boolean;
  revealedAreas: RevealedMapArea[];
  onSelectLocation: (locationId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onExitCleanMapMode: () => void;
  onMoveLocation: (id: string, x: number, y: number) => void;
  onMoveGroup: (id: string, x: number, y: number) => void;
  onMoveEvent: (id: string, x: number, y: number) => void;
  onToggleEventPlacement: () => void;
  onToggleFogReveal: () => void;
  onToggleFogHide: () => void;
  onCreateMapEventAt: (x: number, y: number) => void;
  onPlanRouteAt: (x: number, y: number) => void;
  onSuggestRouteAt: (x: number, y: number) => void;
  onCreateRevealedAreaAt: (x: number, y: number) => void;
  onDeleteRevealedAreaAt: (x: number, y: number) => void;
  onClearRevealedAreas: () => void;
  onOpenLocationEncounter: (location: Location) => void;
  onOpenGroupEncounter: (group: MapGroup) => void;
  onOpenEventEncounter: (event: MapEvent) => void;
  onEditEventEncounter: (event: MapEvent) => void;
  onCompleteEvent: (event: MapEvent) => void;
  onDeleteEvent: (event: MapEvent) => void;

  onEditAttachment: (attachment: MapAttachment) => void;
  onLeaveAttachmentHere: (attachment: MapAttachment, x: number, y: number) => void;
  onAttachAttachmentToPlayers: (attachment: MapAttachment) => void;
  onToggleAttachmentPlayerVisibility: (attachment: MapAttachment) => void;
  onDeleteAttachment: (attachment: MapAttachment) => void;
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

function getMapEventScale(event: MapEvent): MapEventScale {
  return event.scale === "minor" ? "minor" : "major";
}

export function MapView({
  locations,
  groups,
  events,
  attachments,
  globalMapImageUrl,
  selectedLocationId,
  selectedGroupId,
  selectedEventId,
  userMode,
  isDeveloperMode,
  isCleanMapMode,
  isRevealingFog,
  isHidingRevealedArea,
  revealedAreas,
  isPlacingEvent,
  isPlanningRoute,
  isSuggestingRoute,
  routePointX,
  routePointY,
  suggestedRoutePointX,
  suggestedRoutePointY,
  onCreateMapEventAt,
  onPlanRouteAt,
  onSuggestRouteAt,
  onOpenLocationEncounter,
  onSelectLocation,
  onSelectGroup,
  onSelectEvent,
  onExitCleanMapMode,
  onMoveLocation,
  onMoveGroup,
  onMoveEvent,
  onToggleEventPlacement,
  onToggleFogReveal,
  onToggleFogHide,
  onCreateRevealedAreaAt,
  onDeleteRevealedAreaAt,
  onClearRevealedAreas,
  onOpenGroupEncounter,
  onOpenEventEncounter,
  onEditEventEncounter,
  onCompleteEvent,
  onDeleteEvent,
  onEditAttachment,
  onLeaveAttachmentHere,
  onAttachAttachmentToPlayers,
  onToggleAttachmentPlayerVisibility,
  onDeleteAttachment,
}: MapViewProps) {
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [eventMoveTargetId, setEventMoveTargetId] = useState<string | null>(null);
  const [eventContextMenu, setEventContextMenu] = useState<{
    event: MapEvent;
    x: number;
    y: number;
  } | null>(null);

  const [attachmentContextMenu, setAttachmentContextMenu] = useState<{
    attachment: MapAttachment;
    x: number;
    y: number;
  } | null>(null);

  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [didJustDragMarker, setDidJustDragMarker] = useState(false);

  const [fogPointer, setFogPointer] = useState<{ x: number; y: number } | null>(
    null,
  );

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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setEventMoveTargetId(null);
      setEventContextMenu(null);
      setAttachmentContextMenu(null);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);


  const isPlayerMode = userMode === "player";

  const playerMapGroup = groups.find((group) => group.faction === "players");

  function getAttachmentMapPosition(attachment: MapAttachment) {
    if (!attachment.attachedToGroupId) {
      return {
        x: clamp(attachment.x),
        y: clamp(attachment.y),
        isAttached: false,
      };
    }

    const attachedGroup = groups.find((group) => {
      return group.id === attachment.attachedToGroupId;
    });

    if (!attachedGroup) {
      return {
        x: clamp(attachment.x),
        y: clamp(attachment.y),
        isAttached: false,
      };
    }

    return {
      x: clamp(attachedGroup.x + attachment.offsetX),
      y: clamp(attachedGroup.y + attachment.offsetY),
      isAttached: true,
    };
  }

  const fogAnchor = {
    x: playerMapGroup?.x ?? 50,
    y: playerMapGroup?.y ?? 50,
  };

  const playerRevealRadius = 5.5;
  const revealedAreaVerticalScale = 16 / 9;

  const manualRevealRadius = 4;
  const shouldShowFogLayer = isPlayerMode || isRevealingFog || isHidingRevealedArea;

  const fogStyle = {
    "--fog-x": `${fogAnchor.x}%`,
    "--fog-y": `${fogAnchor.y}%`,
  } as CSSProperties;

  function startMarkerDrag(
    event: React.MouseEvent<HTMLButtonElement>,
    locationId: string,
  ) {
    if (event.button !== 0) {
      return;
    }

    if (isPlanningRoute || isSuggestingRoute) {
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

    if (isPlanningRoute || isSuggestingRoute) {
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

  function startEventDrag(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function openEventContextMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    mapEvent: MapEvent,
  ) {
    if (userMode === "player") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setEventContextMenu({
      event: mapEvent,
      x: clamp(mapEvent.x + 2.4),
      y: clamp(mapEvent.y - 1.2),
    });

    onSelectEvent(mapEvent.id);
  }

  function closeEventContextMenu() {
    setEventContextMenu(null);
  }

  function openEventFromContext(mapEvent: MapEvent) {
    closeEventContextMenu();
    onSelectEvent(mapEvent.id);
    onOpenEventEncounter(mapEvent);
    onExitCleanMapMode();
  }

  function editEventFromContext(mapEvent: MapEvent) {
    closeEventContextMenu();
    onSelectEvent(mapEvent.id);
    onEditEventEncounter(mapEvent);
    onExitCleanMapMode();
  }

  function startMoveEventFromContext(mapEvent: MapEvent) {
    closeEventContextMenu();
    setEventMoveTargetId(mapEvent.id);
    onSelectEvent(mapEvent.id);
  }

  function completeEventFromContext(mapEvent: MapEvent) {
    closeEventContextMenu();
    onCompleteEvent(mapEvent);
  }

  function deleteEventFromContext(mapEvent: MapEvent) {
    closeEventContextMenu();
    onDeleteEvent(mapEvent);
  }

  function openAttachmentContextMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    attachment: MapAttachment,
  ) {
    if (userMode === "player") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const position = getAttachmentMapPosition(attachment);

    setAttachmentContextMenu({
      attachment,
      x: clamp(position.x + 2.2),
      y: clamp(position.y - 1.2),
    });
  }

  function closeAttachmentContextMenu() {
    setAttachmentContextMenu(null);
  }

  function editAttachmentFromContext(attachment: MapAttachment) {
    closeAttachmentContextMenu();
    onEditAttachment(attachment);
  }

  function leaveAttachmentHereFromContext(attachment: MapAttachment) {
    const position = getAttachmentMapPosition(attachment);

    closeAttachmentContextMenu();
    onLeaveAttachmentHere(attachment, position.x, position.y);
  }

  function attachAttachmentToPlayersFromContext(attachment: MapAttachment) {
    closeAttachmentContextMenu();
    onAttachAttachmentToPlayers(attachment);
  }

  function toggleAttachmentVisibilityFromContext(attachment: MapAttachment) {
    closeAttachmentContextMenu();
    onToggleAttachmentPlayerVisibility(attachment);
  }

  function deleteAttachmentFromContext(attachment: MapAttachment) {
    closeAttachmentContextMenu();
    onDeleteAttachment(attachment);
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

  function updateFogPointer(event: React.MouseEvent<HTMLDivElement>) {
    if (userMode === "player" || (!isRevealingFog && !isHidingRevealedArea)) {
      setFogPointer(null);
      return;
    }

    const map = event.currentTarget.querySelector(".map") as HTMLDivElement | null;

    if (!map) {
      setFogPointer(null);
      return;
    }

    const rect = map.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    setFogPointer({ x, y });
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    closeEventContextMenu();
    closeAttachmentContextMenu();

    if (userMode === "player" && !isSuggestingRoute) {
      return;
    }

    if (
      !eventMoveTargetId &&
      !isPlacingEvent &&
      !isPlanningRoute &&
      !isSuggestingRoute &&
      !isRevealingFog &&
      !isHidingRevealedArea
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

    event.stopPropagation();

    if (eventMoveTargetId && userMode !== "player") {
      onMoveEvent(eventMoveTargetId, x, y);
      setEventMoveTargetId(null);
      return;
    }

    if (isSuggestingRoute) {
      onSuggestRouteAt(x, y);
      return;
    }

    if (userMode === "player") {
      return;
    }

    if (isPlanningRoute) {
      onPlanRouteAt(x, y);
      return;
    }

    if (isPlacingEvent) {
      onCreateMapEventAt(x, y);
      return;
    }

    if (isRevealingFog) {
      onCreateRevealedAreaAt(x, y);
      return;
    }

    if (isHidingRevealedArea) {
      onDeleteRevealedAreaAt(x, y);
    }
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
          updateFogPointer(event);
        }}
        onMouseUp={() => {
          stopMapDrag();
          stopMarkerDrag();
        }}
        onMouseLeave={() => {
          stopMapDrag();
          stopMarkerDrag();
          setFogPointer(null);
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          className={`map ${isDeveloperMode ? "map-editable" : ""} ${isPlacingEvent ? "map-placing-event" : ""
            } ${eventMoveTargetId ? "map-moving-event" : ""} ${isPlanningRoute ? "map-planning-route" : ""} ${isSuggestingRoute ? "map-suggesting-route" : ""} ${isRevealingFog ? "map-revealing-fog" : ""} ${isHidingRevealedArea ? "map-hiding-fog" : ""}`}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            backgroundImage: `url("${globalMapImageUrl.trim() || "/map.jpg"}")`,
          }}
          onMouseDown={(event) => {
            if (
              eventMoveTargetId ||
              isPlacingEvent ||
              isPlanningRoute ||
              isSuggestingRoute ||
              isRevealingFog ||
              isHidingRevealedArea
            ) {
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

          {!isCleanMapMode && eventMoveTargetId && (
            <div className="map-hint">
              Кликни по карте, чтобы переместить событие · Esc — отмена
            </div>
          )}

          {!isCleanMapMode && isPlacingEvent && (
            <div className="map-hint">
              Кликни по карте, чтобы разместить событие · Esc — отмена
            </div>
          )}

          {!isCleanMapMode && isPlanningRoute && (
            <div className="map-hint">
              Кликни по карте, чтобы задать точку маршрута · Esc — отмена
            </div>
          )}

          {!isCleanMapMode && isSuggestingRoute && (
            <div className="map-hint">
              Кликни по карте, чтобы предложить направление · Esc — отмена
            </div>
          )}

          {!isCleanMapMode && isRevealingFog && (
            <div className="map-hint">
              Кликни по карте, чтобы открыть область · Esc — отмена
            </div>
          )}

          {!isCleanMapMode && isHidingRevealedArea && (
            <div className="map-hint">
              Кликни по открытой области, чтобы скрыть её · Esc — отмена
            </div>
          )}

          {isDeveloperMode && !isCleanMapMode && !isPlacingEvent && (
            <div className="map-hint">
              Зажми маркер, чтобы переместить локацию
            </div>
          )}

          {shouldShowFogLayer && (
            <svg
              className="map-fog-layer"
              style={fogStyle}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="map-fog-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#24120d" />
                  <stop offset="48%" stopColor="#2e1d24" />
                  <stop offset="100%" stopColor="#120a08" />
                </linearGradient>

                <radialGradient id="map-fog-blood-stain" cx="18%" cy="22%" r="42%">
                  <stop offset="0%" stopColor="#4b1718" stopOpacity="0.62" />
                  <stop offset="100%" stopColor="#4b1718" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="map-fog-violet-stain" cx="78%" cy="64%" r="48%">
                  <stop offset="0%" stopColor="#342139" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#342139" stopOpacity="0" />
                </radialGradient>

                <pattern
                  id="map-fog-lines"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="1" height="8" fill="rgba(234, 216, 173, 0.055)" />
                </pattern>

                <mask id="map-fog-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />

                  <ellipse
                    cx={fogAnchor.x}
                    cy={fogAnchor.y}
                    rx={playerRevealRadius + 3}
                    ry={(playerRevealRadius + 3) * revealedAreaVerticalScale}
                    fill="rgba(0, 0, 0, 0.42)"
                  />

                  <ellipse
                    cx={fogAnchor.x}
                    cy={fogAnchor.y}
                    rx={playerRevealRadius}
                    ry={playerRevealRadius * revealedAreaVerticalScale}
                    fill="black"
                  />

                  {revealedAreas.map((area) => (
                    <ellipse
                      key={`${area.id}-soft`}
                      cx={area.x}
                      cy={area.y}
                      rx={area.radius + 3}
                      ry={(area.radius + 3) * revealedAreaVerticalScale}
                      fill="rgba(0, 0, 0, 0.42)"
                    />
                  ))}

                  {revealedAreas.map((area) => (
                    <ellipse
                      key={area.id}
                      cx={area.x}
                      cy={area.y}
                      rx={area.radius}
                      ry={area.radius * revealedAreaVerticalScale}
                      fill="black"
                    />
                  ))}
                  {!isPlayerMode && isRevealingFog && fogPointer && (
                    <>
                      <ellipse
                        cx={fogPointer.x}
                        cy={fogPointer.y}
                        rx={manualRevealRadius + 3}
                        ry={(manualRevealRadius + 3) * revealedAreaVerticalScale}
                        fill="rgba(0, 0, 0, 0.42)"
                      />

                      <ellipse
                        cx={fogPointer.x}
                        cy={fogPointer.y}
                        rx={manualRevealRadius}
                        ry={manualRevealRadius * revealedAreaVerticalScale}
                        fill="black"
                      />
                    </>
                  )}
                </mask>
              </defs>

              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#map-fog-gradient)"
                mask="url(#map-fog-mask)"
              />

              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#map-fog-blood-stain)"
                mask="url(#map-fog-mask)"
              />

              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#map-fog-violet-stain)"
                mask="url(#map-fog-mask)"
              />

              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#map-fog-lines)"
                opacity="0.75"
                mask="url(#map-fog-mask)"
              />
              {!isPlayerMode && (isRevealingFog || isHidingRevealedArea) && (
                <>
                  {revealedAreas.map((area) => (
                    <ellipse
                      key={`${area.id}-outline`}
                      className="map-fog-area-outline"
                      cx={area.x}
                      cy={area.y}
                      rx={area.radius}
                      ry={area.radius * revealedAreaVerticalScale}
                    />
                  ))}

                  {isRevealingFog && fogPointer && (
                    <ellipse
                      className="map-fog-preview-circle"
                      cx={fogPointer.x}
                      cy={fogPointer.y}
                      rx={manualRevealRadius}
                      ry={manualRevealRadius * revealedAreaVerticalScale}
                    />
                  )}

                  {isHidingRevealedArea && fogPointer && (
                    <ellipse
                      className="map-fog-delete-cursor"
                      cx={fogPointer.x}
                      cy={fogPointer.y}
                      rx={manualRevealRadius}
                      ry={manualRevealRadius * revealedAreaVerticalScale}
                    />
                  )}
                </>
              )}
            </svg>
          )}

          {routePointX !== null && routePointY !== null && (
            <>
              {playerMapGroup && (
                <svg
                  className="map-route-layer"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    className="map-route-line-shadow"
                    x1={playerMapGroup.x}
                    y1={playerMapGroup.y}
                    x2={routePointX}
                    y2={routePointY}
                  />

                  <line
                    className="map-route-line"
                    x1={playerMapGroup.x}
                    y1={playerMapGroup.y}
                    x2={routePointX}
                    y2={routePointY}
                  />
                </svg>
              )}

              <div
                className="map-route-point"
                style={{
                  left: `${routePointX}%`,
                  top: `${routePointY}%`,
                }}
                title="Точка маршрута"
              >
                ×
              </div>
            </>
          )}

          {suggestedRoutePointX !== null && suggestedRoutePointY !== null && (
            <>
              {playerMapGroup && (
                <svg
                  className="map-route-layer map-route-layer-suggestion"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    className="map-route-suggestion-line-shadow"
                    x1={playerMapGroup.x}
                    y1={playerMapGroup.y}
                    x2={suggestedRoutePointX}
                    y2={suggestedRoutePointY}
                  />

                  <line
                    className="map-route-suggestion-line"
                    x1={playerMapGroup.x}
                    y1={playerMapGroup.y}
                    x2={suggestedRoutePointX}
                    y2={suggestedRoutePointY}
                  />
                </svg>
              )}

              <div
                className="map-route-suggestion-point"
                style={{
                  left: `${suggestedRoutePointX}%`,
                  top: `${suggestedRoutePointY}%`,
                }}
                title="Предложенная точка маршрута"
              >
                ?
              </div>
            </>
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

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

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

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

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

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

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

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

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

          {attachments.map((attachment) => {
            const config = getAttachmentKindConfig(attachment.kind);
            const statusLabel = getAttachmentStatusLabel(
              attachment.kind,
              attachment.status,
            );
            const position = getAttachmentMapPosition(attachment);

            return (
              <div
                key={attachment.id}
                className={`map-attachment ${position.isAttached ? "attached" : "detached"
                  }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                {position.isAttached && (
                  <span
                    className="map-attachment-tether"
                    aria-hidden="true"
                  />
                )}

                <button
                  className="map-attachment-token"
                  type="button"
                  title={`Сопровождение: ${attachment.title}`}
                  onContextMenu={(event) =>
                    openAttachmentContextMenu(event, attachment)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <span className="map-attachment-icon">{config.icon}</span>
                </button>

                <span className="map-attachment-label">
                  {attachment.title || config.defaultTitle}
                  <small>
                    {config.label} · {statusLabel} · Нагрузка{" "}
                    {attachment.burden} · Риск {attachment.risk}
                  </small>
                </span>
              </div>
            );
          })}

          {events.map((mapEvent) => {
            const meta = MAP_EVENT_CATEGORY_META[mapEvent.category];
            const isCompleted = mapEvent.status === "completed";
            const eventScale = getMapEventScale(mapEvent);

            return (
              <div
                key={mapEvent.id}
                className={`map-event map-event-${mapEvent.category} map-event-scale-${eventScale} ${isCompleted ? "completed" : ""
                  }`}
                style={{
                  left: `${mapEvent.x}%`,
                  top: `${mapEvent.y}%`,
                }}
              >
                <button
                  className={`map-event-token ${selectedEventId === mapEvent.id ? "selected" : ""
                    } ${isCompleted ? "completed" : ""}`}
                  onMouseDown={startEventDrag}
                  onContextMenu={(event) => openEventContextMenu(event, mapEvent)}
                  onClick={(event) => {
                    if (isDraggingMarker || didJustDragMarker) return;

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

                    event.stopPropagation();
                    closeEventContextMenu();
                    onSelectEvent(mapEvent.id);
                    onOpenEventEncounter(mapEvent);
                    onExitCleanMapMode();
                  }}
                  title={`${eventScale === "minor" ? "Минорное событие" : "Полноценное событие"} · ${meta.label}: ${mapEvent.title}`}
                >
                  <span className="map-event-icon">{isCompleted ? "✔" : meta.icon}</span>
                </button>

                <button
                  className={`map-event-label ${isCleanMapMode ? "hidden-in-clean-mode" : ""
                    }`}
                  onMouseDown={startEventDrag}
                  onContextMenu={(event) => openEventContextMenu(event, mapEvent)}
                  onClick={(event) => {
                    if (isDraggingMarker || didJustDragMarker) return;

                    if (isPlanningRoute || isSuggestingRoute) {
                      return;
                    }

                    event.stopPropagation();
                    closeEventContextMenu();
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

          {attachmentContextMenu && (
            <div
              className="map-attachment-context-menu"
              style={{
                left: `${attachmentContextMenu.x}%`,
                top: `${attachmentContextMenu.y}%`,
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="map-event-context-menu-title">
                <span>Сопровождение</span>
                <strong>{attachmentContextMenu.attachment.title}</strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  editAttachmentFromContext(attachmentContextMenu.attachment)
                }
              >
                Редактировать
              </button>

              {attachmentContextMenu.attachment.attachedToGroupId ? (
                <button
                  type="button"
                  onClick={() =>
                    leaveAttachmentHereFromContext(attachmentContextMenu.attachment)
                  }
                >
                  Оставить здесь
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    attachAttachmentToPlayersFromContext(
                      attachmentContextMenu.attachment,
                    )
                  }
                >
                  Прикрепить к Вольному Клинку
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  toggleAttachmentVisibilityFromContext(
                    attachmentContextMenu.attachment,
                  )
                }
              >
                {attachmentContextMenu.attachment.isVisibleToPlayers
                  ? "Скрыть от игроков"
                  : "Показать игрокам"}
              </button>

              <button
                className="danger"
                type="button"
                onClick={() =>
                  deleteAttachmentFromContext(attachmentContextMenu.attachment)
                }
              >
                Удалить
              </button>
            </div>
          )}

          {eventContextMenu && (
            <div
              className="map-event-context-menu"
              style={{
                left: `${eventContextMenu.x}%`,
                top: `${eventContextMenu.y}%`,
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div className="map-event-context-menu-title">
                <span>Событие</span>
                <strong>{eventContextMenu.event.title}</strong>
              </div>

              <button
                type="button"
                onClick={() => openEventFromContext(eventContextMenu.event)}
              >
                Открыть
              </button>

              <button
                type="button"
                onClick={() => editEventFromContext(eventContextMenu.event)}
              >
                Редактировать
              </button>

              <button
                type="button"
                onClick={() => startMoveEventFromContext(eventContextMenu.event)}
              >
                Переместить
              </button>

              <button
                type="button"
                onClick={() => completeEventFromContext(eventContextMenu.event)}
              >
                Завершить
              </button>

              <button
                className="danger"
                type="button"
                onClick={() => deleteEventFromContext(eventContextMenu.event)}
              >
                Удалить
              </button>
            </div>
          )}
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

      {!isCleanMapMode && userMode !== "player" && (
        <button
          className={`map-reveal-fog-button ${isRevealingFog ? "active" : ""}`}
          type="button"
          onClick={onToggleFogReveal}
        >
          {isRevealingFog ? "Отменить раскрытие" : "Открыть туман"}
        </button>
      )}

      {!isCleanMapMode && userMode !== "player" && (
        <button
          className={`map-hide-fog-button ${isHidingRevealedArea ? "active" : ""}`}
          type="button"
          onClick={onToggleFogHide}
        >
          {isHidingRevealedArea ? "Отменить скрытие" : "Скрыть область"}
        </button>
      )}

      {!isCleanMapMode && userMode !== "player" && revealedAreas.length > 0 && (
        <button
          className="map-clear-fog-button"
          type="button"
          onClick={onClearRevealedAreas}
        >
          Очистить области
        </button>
      )}

    </section>
  );
}