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
};

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
}: MapViewProps) {
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
    return (
    <section className="map-stage">
      <div
        className={`map-viewport ${isDraggingMap ? "map-dragging" : ""}`}
        onWheel={handleWheel}
        onMouseDown={startMapDrag}
        onMouseMove={moveMap}
        onMouseUp={stopMapDrag}
        onMouseLeave={stopMapDrag}
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
                  onClick={(event) => {
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
                    onClick={(event) => {
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