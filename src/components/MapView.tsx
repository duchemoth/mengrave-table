import { useState } from "react";
import { useMapViewport } from "../hooks/useMapViewport";
import type { Location, UserMode } from "../types/campaign";

type MapViewProps = {
  locations: Location[];
  selectedLocationId: string;
  userMode: UserMode;
  isDeveloperMode: boolean;
  isCleanMapMode: boolean;
  onMapClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSelectLocation: (locationId: string) => void;
  onOpenSidebar: () => void;
  onExitCleanMapMode: () => void;
  onMoveLocation: (id: string, x: number, y: number) => void;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getModeTitle(mode: UserMode) {
  if (mode === "player") return "Игрок";
  if (mode === "master") return "Мастер";
  return "Эхо";
}

export function MapView({
  locations,
  selectedLocationId,
  userMode,
  isDeveloperMode,
  isCleanMapMode,
  onMapClick,
  onSelectLocation,
  onOpenSidebar,
  onExitCleanMapMode,
  onMoveLocation,
}: MapViewProps) {
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
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

  function stopMarkerDrag() {
    setDraggedLocationId(null);
    setIsDraggingMarker(false);
  }

  return (
    <section className="map-stage">
      <div
        className={`map-viewport ${
          isDraggingMap || draggedLocationId ? "map-dragging" : ""
        }`}
        onWheel={handleWheel}
        onMouseDown={startMapDrag}
        onMouseMove={(event) => {
          moveMap(event);
          handleMarkerMove(event);
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
          onClick={onMapClick}
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
              Клик по карте перемещает выбранную локацию
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
                  className={`map-pin map-pin-${location.category} ${
                    isSelected ? "active" : ""
                  } ${location.isSecret ? "secret" : ""}`}
                  onMouseDown={(event) => startMarkerDrag(event, location.id)}
                  onClick={(event) => {
                    if (isDraggingMarker) return;

                    event.stopPropagation();
                    onSelectLocation(location.id);
                    onOpenSidebar();
                    onExitCleanMapMode();
                  }}
                  title={location.title}
                >
                  <span />
                </button>

                {!isCleanMapMode && (
                  <button
                    className={`map-marker-label ${
                      location.isSecret ? "secret" : ""
                    }`}
                    onMouseDown={(event) => startMarkerDrag(event, location.id)}
                    onClick={(event) => {
                      if (isDraggingMarker) return;
                      event.stopPropagation();
                      onSelectLocation(location.id);
                      onOpenSidebar();
                    }}
                  >
                    {location.title}
                  </button>
                )}
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
    </section>
  );
}