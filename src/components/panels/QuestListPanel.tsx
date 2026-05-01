import type { Quest } from "../../types/campaign";

type QuestListPanelProps = {
  quests: Quest[];
  isPlayerMode: boolean;
};

export function QuestListPanel({ quests, isPlayerMode }: QuestListPanelProps) {
  const visibleQuests = quests.filter((quest) => {
    return !isPlayerMode || !quest.isSecret;
  });

  return (
    <article className="panel">
      <h2>Поручения</h2>

      <div className="quest-list">
        {visibleQuests.map((quest) => (
          <div className={`quest-card quest-card-${quest.status}`} key={quest.id}>
            <div className="quest-card-header">
              <h3>{quest.title}</h3>
              <span>{quest.status}</span>
            </div>

            <p>{quest.description}</p>

            {quest.isSecret && !isPlayerMode && (
              <div className="secret-note">Секретное поручение.</div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}