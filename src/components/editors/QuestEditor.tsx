import { useMemo, useState } from "react";
import type { Location, Quest, QuestStatus } from "../../types/campaign";

const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  active: "Активно",
  completed: "Завершено",
  failed: "Провалено",
  hidden: "Скрыто",
};

type QuestEditorProps = {
  quests: Quest[];
  locations: Location[];
  onChangeQuests: (quests: Quest[]) => void;
};

function createEmptyQuest(index: number): Quest {
  return {
    id: `quest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: `Новое поручение ${index}`,
    description: "Описание нового поручения.",
    status: "active",
    isSecret: false,
    giver: "",
    reward: "",
    relatedLocationId: "",
    masterNotes: "",
    contractStage: "preparation",
    publicProgressNote: "",
    masterProgressNote: "",
  };
}

export function QuestEditor({
  quests,
  locations,
  onChangeQuests,
}: QuestEditorProps) {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    quests[0]?.id ?? null,
  );

  const selectedQuest = useMemo(() => {
    return quests.find((quest) => quest.id === selectedQuestId) ?? quests[0] ?? null;
  }, [quests, selectedQuestId]);

  function updateQuest(updatedQuest: Quest) {
    onChangeQuests(
      quests.map((quest) =>
        quest.id === updatedQuest.id ? updatedQuest : quest,
      ),
    );
  }

  function createQuest() {
    const newQuest = createEmptyQuest(quests.length + 1);

    onChangeQuests([...quests, newQuest]);
    setSelectedQuestId(newQuest.id);
  }

  function duplicateQuest() {
    if (!selectedQuest) {
      return;
    }

    const duplicatedQuest: Quest = {
      ...selectedQuest,
      id: `quest-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `${selectedQuest.title} — копия`,
      status: "hidden",
      isSecret: true,
    };

    onChangeQuests([...quests, duplicatedQuest]);
    setSelectedQuestId(duplicatedQuest.id);
  }

  function deleteQuest(questId: string) {
    const questToDelete = quests.find((quest) => quest.id === questId);

    if (!questToDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Удалить поручение «${questToDelete.title}»?`,
    );

    if (!shouldDelete) {
      return;
    }

    const nextQuests = quests.filter((quest) => quest.id !== questId);

    onChangeQuests(nextQuests);
    setSelectedQuestId(nextQuests[0]?.id ?? null);
  }

  function moveQuest(questId: string, direction: "up" | "down") {
    const currentIndex = quests.findIndex((quest) => quest.id === questId);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= quests.length) {
      return;
    }

    const nextQuests = [...quests];
    const [movedQuest] = nextQuests.splice(currentIndex, 1);

    nextQuests.splice(nextIndex, 0, movedQuest);
    onChangeQuests(nextQuests);
  }

  return (
    <article className="panel developer-panel quest-editor-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Эхо</p>
          <h2>Редактор поручений</h2>
        </div>

        <div className="editor-actions">
          <button className="secondary-button" type="button" onClick={createQuest}>
            Добавить
          </button>

          <button
            className="secondary-button"
            type="button"
            disabled={!selectedQuest}
            onClick={duplicateQuest}
          >
            Дублировать
          </button>
        </div>
      </div>

      {quests.length === 0 ? (
        <p className="editor-empty-text">
          Поручений пока нет. Создай первое поручение для демо-кампании.
        </p>
      ) : (
        <div className="quest-editor-layout">
          <div className="quest-editor-list">
            {quests.map((quest, index) => {
              const isSelected = selectedQuest?.id === quest.id;

              return (
                <button
                  key={quest.id}
                  className={`quest-editor-list-item ${isSelected ? "active" : ""}`}
                  type="button"
                  onClick={() => setSelectedQuestId(quest.id)}
                >
                  <span>{quest.title}</span>
                  <small>
                    {QUEST_STATUS_LABELS[quest.status]}
                    {quest.isSecret ? " · скрыто" : ""}
                    {index > 0 || index < quests.length - 1 ? "" : ""}
                  </small>
                </button>
              );
            })}
          </div>

          {selectedQuest && (
            <section className="quest-editor-card">
              <div className="panel-header-row">
                <div>
                  <p className="eyebrow">Выбранное поручение</p>
                  <h3>{selectedQuest.title}</h3>
                </div>

                <div className="editor-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => moveQuest(selectedQuest.id, "up")}
                  >
                    ↑
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => moveQuest(selectedQuest.id, "down")}
                  >
                    ↓
                  </button>

                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => deleteQuest(selectedQuest.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div className="editor-form">
                <label>
                  Название
                  <input
                    value={selectedQuest.title}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        title: event.target.value,
                      })
                    }
                    placeholder="Найти место крушения Аписа"
                  />
                </label>

                <label>
                  Статус
                  <select
                    value={selectedQuest.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value as QuestStatus;

                      updateQuest({
                        ...selectedQuest,
                        status: nextStatus,
                        isSecret:
                          nextStatus === "hidden" ? true : selectedQuest.isSecret,
                      });
                    }}
                  >
                    {Object.entries(QUEST_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedQuest.isSecret)}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        isSecret: event.target.checked,
                        status: event.target.checked
                          ? "hidden"
                          : selectedQuest.status === "hidden"
                            ? "active"
                            : selectedQuest.status,
                      })
                    }
                  />
                  Скрыто от игроков
                </label>

                <label>
                  Выдал / источник
                  <input
                    value={selectedQuest.giver ?? ""}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        giver: event.target.value,
                      })
                    }
                    placeholder="Комендант Горста, интендант, вояджер, найденный документ..."
                  />
                </label>

                <label>
                  Связанная локация
                  <select
                    value={selectedQuest.relatedLocationId ?? ""}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        relatedLocationId: event.target.value,
                      })
                    }
                  >
                    <option value="">Не привязано</option>

                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Описание для игроков
                  <textarea
                    rows={5}
                    value={selectedQuest.description}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        description: event.target.value,
                      })
                    }
                    placeholder="Что игроки знают о задаче, куда идти, что нужно сделать."
                  />
                </label>

                <label>
                  Награда / цена вопроса
                  <textarea
                    rows={3}
                    value={selectedQuest.reward ?? ""}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        reward: event.target.value,
                      })
                    }
                    placeholder="Амперии, топливо, доступ, услуги, лечение, репутация, снаряжение..."
                  />
                </label>

                <label>
                  Заметки мастера
                  <textarea
                    rows={5}
                    value={selectedQuest.masterNotes ?? ""}
                    onChange={(event) =>
                      updateQuest({
                        ...selectedQuest,
                        masterNotes: event.target.value,
                      })
                    }
                    placeholder="Скрытые условия, настоящие мотивы, подвохи, последствия, варианты провала."
                  />
                </label>
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}