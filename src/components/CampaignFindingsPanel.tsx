import type {
  ArsenalItem,
  CampaignFinding,
  CampaignFindingItem,
  PartyCargoItem,
} from "../types/campaign";

type CampaignFindingsPanelProps = {
  isOpen: boolean;
  findings: CampaignFinding[];
  partyCargo: PartyCargoItem[];
  arsenalItems: ArsenalItem[];
  onClose: () => void;
  onMoveItemToCargo: (findingId: string) => void;
  onReturnCargoToFindings: (cargoItemId: string) => void;
  onDeleteFinding: (findingId: string) => void;
  onDeleteCargoItem: (cargoItemId: string) => void;
};

const FINDING_CLUE_TYPE_LABELS: Record<string, string> = {
  trace: "След",
  body: "Тело",
  damage: "Повреждения",
  route: "Маршрут",
  obscuria: "Обскурия",
  social: "Социальное",
  technical: "Техника",
  other: "Другое",
};

const ITEM_CATEGORY_LABELS: Record<string, string> = {
  weapon: "Оружие",
  armor: "Броня",
  protection: "Защита",
  loadBearing: "Разгрузка",
  equipment: "Оборудование",
  storage: "Поклажа",
  tool: "Инструменты",
  medicine: "Медицина",
  resource: "Ресурс",
  quest: "Квестовое",
  misc: "Прочее",
};

function getFindingItemTitle(item: CampaignFindingItem, arsenalItems: ArsenalItem[]) {
  return (
    arsenalItems.find((arsenalItem) => arsenalItem.id === item.arsenalItemId)?.name ??
    item.nameSnapshot
  );
}

function getFindingItemDescription(
  item: CampaignFindingItem,
  arsenalItems: ArsenalItem[],
) {
  return (
    arsenalItems.find((arsenalItem) => arsenalItem.id === item.arsenalItemId)
      ?.description ?? ""
  );
}

function getItemMeta(item: CampaignFindingItem) {
  const meta = [
    ITEM_CATEGORY_LABELS[item.categorySnapshot] ?? item.categorySnapshot,
    item.quantity > 1 ? `×${item.quantity}` : "",
    item.raritySnapshot,
    item.conditionSnapshot,
    item.priceSnapshot.trim().length > 0 ? item.priceSnapshot.trim() : "",
  ].filter(Boolean);

  return meta.join(" · ");
}

function sortByCreatedAt<T extends { createdAt: number }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

export function CampaignFindingsPanel({
  isOpen,
  findings,
  partyCargo,
  arsenalItems,
  onClose,
  onMoveItemToCargo,
  onReturnCargoToFindings,
  onDeleteFinding,
  onDeleteCargoItem,
}: CampaignFindingsPanelProps) {
  if (!isOpen) {
    return null;
  }

  const itemFindings = sortByCreatedAt(
    findings.filter((finding): finding is CampaignFindingItem => {
      return finding.kind === "item";
    }),
  );

  const clueFindings = sortByCreatedAt(
    findings.filter((finding) => finding.kind === "clue"),
  );

  const sortedPartyCargo = sortByCreatedAt(partyCargo);

  return (
    <section className="campaign-findings-window" aria-label="Находки">
      <header className="campaign-findings-header">
        <div>
          <p className="eyebrow">Мастерская</p>
          <h2>Находки</h2>
          <span>
            Неразобранные: {findings.length} · Груз отряда: {partyCargo.length}
          </span>
        </div>

        <button className="drawer-tab compact" type="button" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="campaign-findings-layout">
        <section className="campaign-findings-section">
          <div className="campaign-findings-section-header">
            <h3>Предметы</h3>
            <span>{itemFindings.length}</span>
          </div>

          {itemFindings.length === 0 ? (
            <p className="campaign-findings-empty">
              Неразобранных материальных находок нет.
            </p>
          ) : (
            <div className="campaign-findings-list">
              {itemFindings.map((item) => {
                const description = getFindingItemDescription(item, arsenalItems);

                return (
                  <article key={item.id} className="campaign-finding-card">
                    <div className="campaign-finding-card-main">
                      <strong>{getFindingItemTitle(item, arsenalItems)}</strong>
                      <small>{getItemMeta(item)}</small>
                    </div>

                    {description.trim().length > 0 && <p>{description}</p>}

                    {item.sourceTitle.trim().length > 0 && (
                      <span className="campaign-finding-source">
                        Источник: {item.sourceTitle}
                      </span>
                    )}

                    <div className="campaign-finding-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onMoveItemToCargo(item.id)}
                      >
                        В груз отряда
                      </button>

                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => onDeleteFinding(item.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="campaign-findings-section">
          <div className="campaign-findings-section-header">
            <h3>Улики и следы</h3>
            <span>{clueFindings.length}</span>
          </div>

          {clueFindings.length === 0 ? (
            <p className="campaign-findings-empty">Неразобранных улик нет.</p>
          ) : (
            <div className="campaign-findings-list">
              {clueFindings.map((clue) => (
                <article key={clue.id} className="campaign-finding-card clue">
                  <div className="campaign-finding-card-main">
                    <strong>{clue.title}</strong>
                    <small>
                      {FINDING_CLUE_TYPE_LABELS[clue.clueType] ?? clue.clueType}
                      {clue.isHiddenFromPlayers ? " · скрыто" : " · игрокам"}
                    </small>
                  </div>

                  <p>{clue.text}</p>

                  {clue.sourceTitle.trim().length > 0 && (
                    <span className="campaign-finding-source">
                      Источник: {clue.sourceTitle}
                    </span>
                  )}

                  <div className="campaign-finding-actions">
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => onDeleteFinding(clue.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="campaign-findings-section wide">
          <div className="campaign-findings-section-header">
            <h3>Груз отряда</h3>
            <span>{sortedPartyCargo.length}</span>
          </div>

          {sortedPartyCargo.length === 0 ? (
            <p className="campaign-findings-empty">
              В общем грузе пока ничего нет.
            </p>
          ) : (
            <div className="campaign-findings-list cargo">
              {sortedPartyCargo.map((item) => {
                const description = getFindingItemDescription(item, arsenalItems);

                return (
                  <article key={item.id} className="campaign-finding-card cargo">
                    <div className="campaign-finding-card-main">
                      <strong>{getFindingItemTitle(item, arsenalItems)}</strong>
                      <small>{getItemMeta(item)}</small>
                    </div>

                    {description.trim().length > 0 && <p>{description}</p>}

                    {item.sourceTitle.trim().length > 0 && (
                      <span className="campaign-finding-source">
                        Источник: {item.sourceTitle}
                      </span>
                    )}

                    <div className="campaign-finding-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onReturnCargoToFindings(item.id)}
                      >
                        Вернуть в находки
                      </button>

                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => onDeleteCargoItem(item.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}