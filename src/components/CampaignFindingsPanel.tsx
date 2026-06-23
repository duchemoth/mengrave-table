import { useState } from "react";
import type {
  ArsenalItem,
  CampaignFinding,
  CampaignFindingClue,
  CampaignFindingItem,
  PartyCargoItem,
  PlayerCharacter,
} from "../types/campaign";

type FindingItemSource = "findings" | "cargo";
type FindingsPanelTab = "findings" | "cargo";

type CampaignFindingsPanelProps = {
  isOpen: boolean;
  findings: CampaignFinding[];
  partyCargo: PartyCargoItem[];
  arsenalItems: ArsenalItem[];
  characters: PlayerCharacter[];
  onClose: () => void;
  onMoveItemToCargo: (findingId: string) => void;
  onReturnCargoToFindings: (cargoItemId: string) => void;
  onDeleteFinding: (findingId: string) => void;
  onDeleteCargoItem: (cargoItemId: string) => void;
  onGiveItemToCharacter: (
    source: FindingItemSource,
    itemId: string,
    characterId: string,
  ) => void;
  onAddItemToExpeditionResource: (
    source: FindingItemSource,
    itemId: string,
  ) => void;
  onSendClueToJournal: (clueId: string, isHiddenFromPlayers: boolean) => void;
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

const RESOURCE_ACTION_LABELS: Record<string, string> = {
  supplies: "В припасы",
  fuel: "В топливо",
  ammo: "В боезапас",
  drink: "В воду",
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

function getItemResourceSubtype(
  item: CampaignFindingItem,
  arsenalItems: ArsenalItem[],
) {
  return (
    item.resourceSubtypeSnapshot ??
    arsenalItems.find((arsenalItem) => arsenalItem.id === item.arsenalItemId)
      ?.resourceSubtype
  );
}

function getResourceActionLabel(
  item: CampaignFindingItem,
  arsenalItems: ArsenalItem[],
) {
  const resourceSubtype = getItemResourceSubtype(item, arsenalItems);

  if (!resourceSubtype) {
    return null;
  }

  return RESOURCE_ACTION_LABELS[resourceSubtype] ?? null;
}

function getItemMeta(item: CampaignFindingItem, arsenalItems: ArsenalItem[]) {
  const resourceSubtype = getItemResourceSubtype(item, arsenalItems);

  const meta = [
    ITEM_CATEGORY_LABELS[item.categorySnapshot] ?? item.categorySnapshot,
    resourceSubtype ? `ресурс: ${resourceSubtype}` : "",
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

function getCharacterName(character: PlayerCharacter) {
  const characterName =
    character.characterName.trim() ||
    character.nickname.trim() ||
    character.oldName.trim() ||
    "Персонаж без имени";

  const playerName =
    character.playerName.trim() ||
    character.ownerPlayerName.trim();

  if (!playerName) {
    return characterName;
  }

  return `${characterName} · ${playerName}`;
}

export function CampaignFindingsPanel({
  isOpen,
  findings,
  partyCargo,
  arsenalItems,
  characters,
  onClose,
  onMoveItemToCargo,
  onReturnCargoToFindings,
  onDeleteFinding,
  onDeleteCargoItem,
  onGiveItemToCharacter,
  onAddItemToExpeditionResource,
  onSendClueToJournal,
}: CampaignFindingsPanelProps) {
  const [activeTab, setActiveTab] = useState<FindingsPanelTab>("findings");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<
    Record<string, string>
  >({});

  if (!isOpen) {
    return null;
  }

  const itemFindings = sortByCreatedAt(
    findings.filter((finding): finding is CampaignFindingItem => {
      return finding.kind === "item";
    }),
  );

  const clueFindings = sortByCreatedAt(
    findings.filter((finding): finding is CampaignFindingClue => {
      return finding.kind === "clue";
    }),
  );

  const sortedPartyCargo = sortByCreatedAt(partyCargo);

  function getSelectedCharacterId(itemId: string) {
    return selectedCharacterIds[itemId] ?? "";
  }

  function setSelectedCharacterId(itemId: string, characterId: string) {
    setSelectedCharacterIds((current) => ({
      ...current,
      [itemId]: characterId,
    }));
  }

  function renderCharacterSelect(itemId: string) {
    if (characters.length === 0) {
      return (
        <p className="campaign-finding-warning">
          В отряде нет персонажей, которым можно выдать предмет.
        </p>
      );
    }

    return (
      <label className="campaign-finding-character-select">
        Кому выдать
        <select
          value={getSelectedCharacterId(itemId)}
          onChange={(event) => setSelectedCharacterId(itemId, event.target.value)}
        >
          <option value="">Выбрать персонажа</option>

          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {getCharacterName(character)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  function renderItemActions(item: CampaignFindingItem, source: FindingItemSource) {
    const resourceActionLabel = getResourceActionLabel(item, arsenalItems);
    const selectedCharacterId = getSelectedCharacterId(item.id);

    return (
      <>
        {renderCharacterSelect(item.id)}

        <div className="campaign-finding-actions">
          {characters.length > 0 && (
            <button
              className="secondary-button"
              type="button"
              disabled={!selectedCharacterId}
              onClick={() =>
                onGiveItemToCharacter(source, item.id, selectedCharacterId)
              }
            >
              Выдать в рюкзак
            </button>
          )}

          {resourceActionLabel && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onAddItemToExpeditionResource(source, item.id)}
            >
              {resourceActionLabel}
            </button>
          )}

          {source === "findings" ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onMoveItemToCargo(item.id)}
            >
              В груз отряда
            </button>
          ) : (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onReturnCargoToFindings(item.id)}
            >
              Вернуть в находки
            </button>
          )}

          <button
            className="danger-button"
            type="button"
            onClick={() =>
              source === "findings"
                ? onDeleteFinding(item.id)
                : onDeleteCargoItem(item.id)
            }
          >
            Удалить
          </button>
        </div>
      </>
    );
  }

  function renderItemCard(item: CampaignFindingItem, source: FindingItemSource) {
    const description = getFindingItemDescription(item, arsenalItems);

    return (
      <article
        key={item.id}
        className={`campaign-finding-card ${source === "cargo" ? "cargo" : ""}`}
      >
        <div className="campaign-finding-card-main">
          <strong>{getFindingItemTitle(item, arsenalItems)}</strong>
          <small>{getItemMeta(item, arsenalItems)}</small>
        </div>

        {description.trim().length > 0 && <p>{description}</p>}

        {item.sourceTitle.trim().length > 0 && (
          <span className="campaign-finding-source">
            Источник: {item.sourceTitle}
          </span>
        )}

        {renderItemActions(item, source)}
      </article>
    );
  }

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

      <div className="campaign-findings-tabs" role="tablist" aria-label="Разделы находок">
        <button
          className={`campaign-findings-tab ${activeTab === "findings" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("findings")}
        >
          Находки
          <span>{findings.length}</span>
        </button>

        <button
          className={`campaign-findings-tab ${activeTab === "cargo" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("cargo")}
        >
          Груз отряда
          <span>{partyCargo.length}</span>
        </button>
      </div>

      <div className="campaign-findings-content">
        {activeTab === "findings" && (
          <div className="campaign-findings-layout findings-view">
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
                  {itemFindings.map((item) => renderItemCard(item, "findings"))}
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
                          className="secondary-button"
                          type="button"
                          onClick={() => onSendClueToJournal(clue.id, true)}
                        >
                          В журнал скрыто
                        </button>

                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => onSendClueToJournal(clue.id, false)}
                        >
                          В журнал игрокам
                        </button>

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
          </div>
        )}

        {activeTab === "cargo" && (
          <section className="campaign-findings-section campaign-findings-cargo-view">
            <div className="campaign-findings-section-header">
              <h3>Груз отряда</h3>
              <span>{sortedPartyCargo.length}</span>
            </div>

            {sortedPartyCargo.length === 0 ? (
              <p className="campaign-findings-empty">
                В общем грузе пока ничего нет. Сначала отправь предметы из вкладки
                “Находки” в груз отряда.
              </p>
            ) : (
              <div className="campaign-findings-list cargo campaign-findings-cargo-list">
                {sortedPartyCargo.map((item) => renderItemCard(item, "cargo"))}
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}