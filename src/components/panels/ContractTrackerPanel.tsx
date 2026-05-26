import { useMemo, useState } from "react";
import type {
  ContractStage,
  Location,
  Quest,
  QuestStatus,
} from "../../types/campaign";

type JournalEntryDraft = {
  type: "expedition" | "map" | "scene" | "inventory" | "master" | "other";
  title: string;
  text: string;
  details?: string;
  isHiddenFromPlayers?: boolean;
};

type ContractTrackerPanelProps = {
  quests: Quest[];
  locations: Location[];
  isPlayerMode: boolean;
  onChangeQuests: (quests: Quest[]) => void;
  onCreateJournalEntry: (entry: JournalEntryDraft) => void;
};

const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  active: "Активно",
  completed: "Завершено",
  failed: "Провалено",
  hidden: "Скрыто",
};

const CONTRACT_STAGE_LABELS: Record<ContractStage, string> = {
  preparation: "Подготовка",
  exit: "Выход",
  route: "Маршрут",
  complication: "Осложнение",
  objective: "Цель",
  return: "Возвращение",
  handoff: "Сдача",
  consequences: "Последствия",
};

const CONTRACT_STAGES: ContractStage[] = [
  "preparation",
  "exit",
  "route",
  "complication",
  "objective",
  "return",
  "handoff",
  "consequences",
];

function getQuestLocationTitle(quest: Quest, locations: Location[]) {
  if (!quest.relatedLocationId) {
    return "";
  }

  return (
    locations.find((location) => location.id === quest.relatedLocationId)?.title ??
    ""
  );
}

function getNormalizedContractStage(quest: Quest): ContractStage {
  return quest.contractStage ?? "preparation";
}

export function ContractTrackerPanel({
  quests,
  locations,
  isPlayerMode,
  onChangeQuests,
  onCreateJournalEntry,
}: ContractTrackerPanelProps) {
  const visibleQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (!isPlayerMode) {
        return true;
      }

      return !quest.isSecret && quest.status !== "hidden";
    });
  }, [quests, isPlayerMode]);

  const activeFirstQuests = useMemo(() => {
    return [...visibleQuests].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") {
        return -1;
      }

      if (a.status !== "active" && b.status === "active") {
        return 1;
      }

      return a.title.localeCompare(b.title, "ru");
    });
  }, [visibleQuests]);

  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    activeFirstQuests[0]?.id ?? null,
  );

  const selectedQuest =
    activeFirstQuests.find((quest) => quest.id === selectedQuestId) ??
    activeFirstQuests[0] ??
    null;

  function updateQuest(updatedFields: Partial<Quest>) {
    if (!selectedQuest || isPlayerMode) {
      return;
    }

    onChangeQuests(
      quests.map((quest) =>
        quest.id === selectedQuest.id
          ? {
            ...quest,
            ...updatedFields,
          }
          : quest,
      ),
    );
  }

  function shiftContractStage(direction: "previous" | "next") {
    if (!selectedQuest || isPlayerMode) {
      return;
    }

    const currentStage = getNormalizedContractStage(selectedQuest);
    const currentIndex = CONTRACT_STAGES.indexOf(currentStage);

    const nextIndex =
      direction === "previous"
        ? Math.max(0, currentIndex - 1)
        : Math.min(CONTRACT_STAGES.length - 1, currentIndex + 1);

    updateQuest({
      contractStage: CONTRACT_STAGES[nextIndex],
    });
  }

  function createContractJournalEntry() {
    if (!selectedQuest || isPlayerMode) {
      return;
    }

    const stage = getNormalizedContractStage(selectedQuest);
    const locationTitle = getQuestLocationTitle(selectedQuest, locations);

    const text = [
      `Этап: ${CONTRACT_STAGE_LABELS[stage]}.`,
      `Статус: ${QUEST_STATUS_LABELS[selectedQuest.status]}.`,
      selectedQuest.publicProgressNote?.trim()
        ? `Заметка игрокам: ${selectedQuest.publicProgressNote.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const details = [
      selectedQuest.description.trim()
        ? `Описание поручения:\n${selectedQuest.description.trim()}`
        : "",
      selectedQuest.giver?.trim()
        ? `Источник: ${selectedQuest.giver.trim()}`
        : "",
      locationTitle ? `Локация: ${locationTitle}` : "",
      selectedQuest.reward?.trim()
        ? `Награда: ${selectedQuest.reward.trim()}`
        : "",
      selectedQuest.masterProgressNote?.trim()
        ? `Скрытая заметка мастера:\n${selectedQuest.masterProgressNote.trim()}`
        : "",
      selectedQuest.masterNotes?.trim()
        ? `Заметки из редактора:\n${selectedQuest.masterNotes.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    onCreateJournalEntry({
      type: "scene",
      title: `Контракт — ${selectedQuest.title}`,
      text: text || "Состояние контракта зафиксировано.",
      details,
      isHiddenFromPlayers:
        Boolean(selectedQuest.isSecret) || selectedQuest.status === "hidden",
    });
  }

  if (activeFirstQuests.length === 0) {
    return (
      <section className="contract-tracker-panel">
        <header className="contract-tracker-header">
          <div>
            <p className="eyebrow">Контракты</p>
            <h3>Поручений пока нет</h3>
          </div>
        </header>

        <p className="contract-empty-text">
          Создай поручение в боковой панели Эха, чтобы оно появилось здесь.
        </p>
      </section>
    );
  }

  return (
    <section className={`contract-tracker-panel ${isPlayerMode ? "read-only" : ""}`}>
      <header className="contract-tracker-header">
        <div>
          <p className="eyebrow">Контракты</p>
          <h3>Ведение поручения</h3>
        </div>

        <span>{activeFirstQuests.length} доступно</span>
      </header>

      <div className="contract-tracker-layout">
        <aside className="contract-list">
          {activeFirstQuests.map((quest) => {
            const isSelected = selectedQuest?.id === quest.id;
            const stage = getNormalizedContractStage(quest);

            return (
              <button
                key={quest.id}
                className={`contract-list-item ${isSelected ? "active" : ""} contract-status-${quest.status}`}
                type="button"
                onClick={() => setSelectedQuestId(quest.id)}
              >
                <strong>{quest.title}</strong>
                <span>
                  {QUEST_STATUS_LABELS[quest.status]} · {CONTRACT_STAGE_LABELS[stage]}
                </span>
              </button>
            );
          })}
        </aside>

        {selectedQuest && (
          <article className="contract-card">
            <div className="contract-card-header">
              <div>
                <p className="eyebrow">Активный контракт</p>
                <h4>{selectedQuest.title}</h4>
              </div>

              <span className={`contract-status-badge contract-status-${selectedQuest.status}`}>
                {QUEST_STATUS_LABELS[selectedQuest.status]}
              </span>
            </div>

            <p className="contract-description">
              {selectedQuest.description || "Описание поручения пока не добавлено."}
            </p>

            <div className="contract-meta-grid">
              <span>
                <strong>Источник:</strong>{" "}
                {selectedQuest.giver?.trim() || "Не указан"}
              </span>

              <span>
                <strong>Локация:</strong>{" "}
                {getQuestLocationTitle(selectedQuest, locations) || "Не привязана"}
              </span>

              <span>
                <strong>Награда:</strong>{" "}
                {selectedQuest.reward?.trim() || "Не указана"}
              </span>
            </div>

            <section className="contract-stage-card">
              <div className="contract-stage-header">
                <div>
                  <p className="eyebrow">Этап</p>
                  <h4>
                    {CONTRACT_STAGE_LABELS[getNormalizedContractStage(selectedQuest)]}
                  </h4>
                </div>

                {!isPlayerMode && (
                  <div className="contract-stage-actions">
                    <button
                      type="button"
                      onClick={() => shiftContractStage("previous")}
                    >
                      ←
                    </button>

                    <button
                      type="button"
                      onClick={() => shiftContractStage("next")}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              <div className="contract-stage-track">
                {CONTRACT_STAGES.map((stage) => {
                  const isCurrent = getNormalizedContractStage(selectedQuest) === stage;

                  return (
                    <button
                      key={stage}
                      className={`contract-stage-step ${isCurrent ? "active" : ""}`}
                      type="button"
                      disabled={isPlayerMode}
                      onClick={() => updateQuest({ contractStage: stage })}
                    >
                      {CONTRACT_STAGE_LABELS[stage]}
                    </button>
                  );
                })}
              </div>
            </section>

            {!isPlayerMode && (
              <div className="contract-status-actions">
                <button type="button" onClick={createContractJournalEntry}>
                  + В журнал
                </button>

                <button
                  type="button"
                  onClick={() => updateQuest({ status: "active", isSecret: false })}
                >
                  Активно
                </button>

                <button
                  type="button"
                  onClick={() => updateQuest({ status: "completed" })}
                >
                  Завершено
                </button>

                <button
                  type="button"
                  onClick={() => updateQuest({ status: "failed" })}
                >
                  Провалено
                </button>

                <button
                  type="button"
                  onClick={() => updateQuest({ status: "hidden", isSecret: true })}
                >
                  Скрыть
                </button>
              </div>
            )}

            <div className="contract-notes-grid">
              <label>
                Заметка игрокам
                <textarea
                  value={selectedQuest.publicProgressNote ?? ""}
                  onChange={(event) =>
                    updateQuest({
                      publicProgressNote: event.target.value,
                    })
                  }
                  readOnly={isPlayerMode}
                  placeholder="Коротко: что отряд сейчас понимает о контракте."
                />
              </label>

              {!isPlayerMode && (
                <label>
                  Скрытая заметка мастера
                  <textarea
                    value={selectedQuest.masterProgressNote ?? ""}
                    onChange={(event) =>
                      updateQuest({
                        masterProgressNote: event.target.value,
                      })
                    }
                    placeholder="Подвох, последствия, скрытый заказчик, что помнить мастеру."
                  />
                </label>
              )}
            </div>

            {selectedQuest.masterNotes && !isPlayerMode && (
              <details className="contract-master-details">
                <summary>Старые заметки из редактора поручения</summary>
                <p>{selectedQuest.masterNotes}</p>
              </details>
            )}
          </article>
        )}
      </div>
    </section>
  );
}