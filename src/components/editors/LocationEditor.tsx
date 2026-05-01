import type { Location, LocationCategory } from "../../types/campaign";

const LOCATION_CATEGORY_LABELS: Record<LocationCategory, string> = {
  settlement: "Поселение",
  danger: "Опасность",
  ruins: "Руины",
  camp: "Лагерь",
  secret: "Секрет",
};

type LocationEditorProps = {
  selectedLocation: Location;
  locations: Location[];
  onUpdateLocation: (location: Location) => void;
  onCreateLocation: () => void;
  onDeleteLocation: () => void;
  onResetLocations: () => void;
  onSelectLocation: (locationId: string) => void;
};

function clampCoordinate(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function LocationEditor({
  selectedLocation,
  locations,
  onUpdateLocation,
  onCreateLocation,
  onDeleteLocation,
  onResetLocations,
  onSelectLocation,
}: LocationEditorProps) {
  return (
    <article className="panel developer-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Эхо</p>
          <h2>Редактор локации</h2>
        </div>

        <div className="editor-actions">
          <button className="secondary-button" onClick={onCreateLocation}>
            Добавить
          </button>

          <button className="danger-button" onClick={onDeleteLocation}>
            Удалить
          </button>

          <button className="danger-button" onClick={onResetLocations}>
            Сбросить
          </button>
        </div>
      </div>

      <div className="editor-form">
        <label>
          Название
          <input
            value={selectedLocation.title}
            onChange={(event) =>
              onUpdateLocation({
                ...selectedLocation,
                title: event.target.value,
              })
            }
          />
        </label>

        <label>
          Тип
          <input
            value={selectedLocation.type}
            onChange={(event) =>
              onUpdateLocation({
                ...selectedLocation,
                type: event.target.value,
              })
            }
          />
        </label>

        <label>
          Категория
          <select
            value={selectedLocation.category}
            onChange={(event) =>
              onUpdateLocation({
                ...selectedLocation,
                category: event.target.value as LocationCategory,
              })
            }
          >
            {Object.entries(LOCATION_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Описание
          <textarea
            rows={5}
            value={selectedLocation.description}
            onChange={(event) =>
              onUpdateLocation({
                ...selectedLocation,
                description: event.target.value,
              })
            }
          />
        </label>

        <div className="editor-grid">
          <label>
            X
            <input
              type="number"
              min="0"
              max="100"
              value={selectedLocation.x}
              onChange={(event) =>
                onUpdateLocation({
                  ...selectedLocation,
                  x: clampCoordinate(Number(event.target.value)),
                })
              }
            />
          </label>

          <label>
            Y
            <input
              type="number"
              min="0"
              max="100"
              value={selectedLocation.y}
              onChange={(event) =>
                onUpdateLocation({
                  ...selectedLocation,
                  y: clampCoordinate(Number(event.target.value)),
                })
              }
            />
          </label>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(selectedLocation.isSecret)}
            onChange={(event) =>
              onUpdateLocation({
                ...selectedLocation,
                isSecret: event.target.checked,
              })
            }
          />
          Секретная локация
        </label>
      </div>

      <div className="dev-table">
        {locations.map((location) => (
          <button
            className={`dev-row dev-row-button ${
              location.id === selectedLocation.id ? "active" : ""
            }`}
            key={location.id}
            onClick={() => onSelectLocation(location.id)}
          >
            <code>{location.id}</code>
            <span>{location.title}</span>
            <span>
              x: {location.x}, y: {location.y}
            </span>
            <span>{location.isSecret ? "secret" : "public"}</span>
          </button>
        ))}
      </div>
    </article>
  );
}