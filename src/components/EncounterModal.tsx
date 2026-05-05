import type { Location, MapGroup } from "../types/campaign";

const FACTION_LABELS: Record<string, string> = {
  players: "Игроки",
  fief: "Феодалы",
  euler: "Эйлеры",
  voyager: "Вояджеры",
  evergal: "Эвергаль",
  valour: "Валоры",
  brigand: "Бриганты",
  infiltrator: "Наймиты",
  freeblade: "Вольники",
  echomorph: "Эхоморфы",
};

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

  const isLocation = target.kind === "location";
  const title = isLocation ? target.data.title : target.data.name;
  const typeLabel = isLocation ? target.data.type : "Группа на карте";
  const description = target.data.description || "Описание пока не добавлено.";

  return (
    <div className="encounter-backdrop" onClick={onClose}>
      <section
        className="encounter-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="encounter-close-button" onClick={onClose}>
          ×
        </button>

        <header className="encounter-header">
          <p className="eyebrow">{typeLabel}</p>
<h2>{title}</h2>

{!isLocation && (
  <p className="encounter-faction">
    Фракция: {FACTION_LABELS[target.data.faction] ?? target.data.faction}
  </p>
)}
        </header>

        <div className="encounter-body">
          <div className="encounter-art-placeholder">
            <span>Арт сцены</span>
          </div>

          <div className="encounter-content">
            <h3>Описание</h3>
            <p>{description}</p>

            {!isLocation && (
              <div className="encounter-details">
                <h3>Состав группы</h3>

                {target.data.members.length > 0 ? (
                  <ul>
                    {target.data.members.map((member) => (
                      <li key={member.id}>
                        <strong>{member.name}</strong> — {member.role}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Состав группы пока не указан.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="encounter-actions">
          <button className="secondary-button" type="button">
            Открыть сцену
          </button>

          <button className="secondary-button" type="button">
            {isLocation ? "Создать событие" : "Начать конфликт"}
          </button>

          <button className="secondary-button" type="button">
            Открыть локальную карту
          </button>

          <button className="secondary-button" type="button" onClick={onClose}>
            Закрыть
          </button>
        </footer>
      </section>
    </div>
  );
}