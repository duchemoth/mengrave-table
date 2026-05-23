import type { Location, Quest, QuestStatus } from "../../types/campaign";

type QuestListPanelProps = {
  quests: Quest[];
  locations: Location[];
  isPlayerMode: boolean;
};

const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  active: "Активно",
  completed: "Завершено",
  failed: "Провалено",
  hidden: "Скрыто",
};

function getQuestLocationTitle(
  quest: Quest,
  locations: Location[],
): string | null {
  if (!quest.relatedLocationId) {
    return null;
  }

  return (
    locations.find((location) => location.id === quest.relatedLocationId)?.title ??
    null
  );
}

export function QuestListPanel({
  quests,
  locations,
  isPlayerMode,
}: QuestListPanelProps) {
  const visibleQuests = quests.filter((quest) => {
    if (!isPlayerMode) {
      return true;
    }

    return !quest.isSecret && quest.status !== "hidden";
  });

  const activeQuests = visibleQuests.filter((quest) => quest.status === "active");
  const completedQuests = visibleQuests.filter(
    (quest) => quest.status === "completed",
  );
  const failedQuests = visibleQuests.filter((quest) => quest.status === "failed");
  const hiddenQuests = visibleQuests.filter((quest) => quest.status === "hidden");

  function renderQuestCard(quest: Quest) {
    const locationTitle = getQuestLocationTitle(quest, locations);

    return (
      <div className={`quest-card quest-card-${quest.status}`} key={quest.id}>
        <div className="quest-card-header">
          <h3>{quest.title}</h3>
          <span>{QUEST_STATUS_LABELS[quest.status]}</span>
        </div>

        <p>{quest.description || "Описание поручения пока не добавлено."}</p>

        <div className="quest-card-meta">
          {quest.giver && <span>Источник: {quest.giver}</span>}
          {locationTitle && <span>Локация: {locationTitle}</span>}
          {quest.reward && <span>Награда: {quest.reward}</span>}
        </div>

        {quest.isSecret && !isPlayerMode && (
          <div className="secret-note">Скрыто от игроков.</div>
        )}

        {quest.masterNotes && !isPlayerMode && (
          <details className="quest-master-notes">
            <summary>Заметки мастера</summary>
            <p>{quest.masterNotes}</p>
          </details>
        )}
      </div>
    );
  }

  return (
    <article className="panel quest-list-panel">
      <p className="eyebrow">Кампания</p>
      <h2>Поручения</h2>

      {visibleQuests.length === 0 ? (
        <p className="editor-empty-text">
          Видимых поручений пока нет.
        </p>
      ) : (
        <div className="quest-list">
          {activeQuests.length > 0 && (
            <section className="quest-list-section">
              <h3>Активные</h3>
              {activeQuests.map(renderQuestCard)}
            </section>
          )}

          {completedQuests.length > 0 && (
            <section className="quest-list-section">
              <h3>Завершённые</h3>
              {completedQuests.map(renderQuestCard)}
            </section>
          )}

          {failedQuests.length > 0 && (
            <section className="quest-list-section">
              <h3>Проваленные</h3>
              {failedQuests.map(renderQuestCard)}
            </section>
          )}

          {!isPlayerMode && hiddenQuests.length > 0 && (
            <section className="quest-list-section">
              <h3>Скрытые</h3>
              {hiddenQuests.map(renderQuestCard)}
            </section>
          )}
        </div>
      )}
    </article>
  );
}