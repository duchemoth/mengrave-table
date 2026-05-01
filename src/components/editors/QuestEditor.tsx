import type { Quest, QuestStatus } from "../../types/campaign";

const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  active: "Активно",
  completed: "Завершено",
  failed: "Провалено",
  hidden: "Скрыто",
};

type QuestEditorProps = {
  quests: Quest[];
  onChangeQuests: (quests: Quest[]) => void;
};

export function QuestEditor({ quests, onChangeQuests }: QuestEditorProps) {
  function updateQuest(updatedQuest: Quest) {
    onChangeQuests(
      quests.map((quest) =>
        quest.id === updatedQuest.id ? updatedQuest : quest,
      ),
    );
  }

  function createQuest() {
    const newQuest: Quest = {
      id: `quest-${Date.now()}`,
      title: `Новое поручение ${quests.length + 1}`,
      description: "Описание нового поручения.",
      status: "active",
      isSecret: false,
    };

    onChangeQuests([...quests, newQuest]);
  }

  function deleteQuest(questId: string) {
    if (quests.length <= 1) {
      window.alert("Нельзя удалить последнее поручение.");
      return;
    }

    const shouldDelete = window.confirm("Удалить это поручение?");

    if (!shouldDelete) {
      return;
    }

    onChangeQuests(quests.filter((quest) => quest.id !== questId));
  }

  return (
    <article className="panel developer-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Эхо</p>
          <h2>Редактор поручений</h2>
        </div>

        <button className="secondary-button" onClick={createQuest}>
          Добавить
        </button>
      </div>

      <div className="quest-editor-list">
        {quests.map((quest) => (
          <div className="quest-editor-card" key={quest.id}>
            <div className="editor-form">
              <label>
                Название
                <input
                  value={quest.title}
                  onChange={(event) =>
                    updateQuest({
                      ...quest,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Описание
                <textarea
                  rows={3}
                  value={quest.description}
                  onChange={(event) =>
                    updateQuest({
                      ...quest,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Статус
                <select
                  value={quest.status}
                  onChange={(event) =>
                    updateQuest({
                      ...quest,
                      status: event.target.value as QuestStatus,
                    })
                  }
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
                  checked={Boolean(quest.isSecret)}
                  onChange={(event) =>
                    updateQuest({
                      ...quest,
                      isSecret: event.target.checked,
                      status: event.target.checked ? "hidden" : quest.status,
                    })
                  }
                />
                Секретное поручение
              </label>
            </div>

            <button
              className="danger-button"
              onClick={() => deleteQuest(quest.id)}
            >
              Удалить поручение
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}