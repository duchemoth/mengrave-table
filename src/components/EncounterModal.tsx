import type { Location, MapGroup } from "../types/campaign";

type EncounterTarget =
  | { kind: "location"; data: Location }
  | { kind: "group"; data: MapGroup };

type EncounterModalProps = {
  target: EncounterTarget | null;
  onClose: () => void;
};

export function EncounterModal({ target, onClose }: EncounterModalProps) {
  if (!target) {
    return null;
  }

  const title = target.kind === "location" ? target.data.title : target.data.name;
  const typeLabel = target.kind === "location" ? target.data.type : "Группа на карте";
  const description = target.data.description;

  return (
    <div className="encounter-backdrop" onClick={onClose}>
      <section
        className="encounter-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="encounter-art-placeholder">
          <span>Арт сцены</span>
        </div>

        <div className="encounter-content">
          <p className="eyebrow">{typeLabel}</p>
          <h2>{title}</h2>

          <p>{description || "Описание пока не добавлено."}</p>

          <div className="encounter-actions">
            <button className="secondary-button" type="button">
              Описать сцену
            </button>

            <button className="secondary-button" type="button">
              Начать конфликт
            </button>

            <button className="secondary-button" type="button">
              Открыть тактическую карту
            </button>

            <button className="danger-button" type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}