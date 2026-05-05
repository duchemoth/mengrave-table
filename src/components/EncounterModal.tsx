import { useEffect, useMemo, useState } from "react";
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

type SceneDraft = {
  playerDescription: string;
  masterNotes: string;
};

type EncounterModalProps = {
  target: EncounterTarget | null;
  onClose: () => void;
  onCreateSceneNote: (note: string) => void;
};

function getSceneStorageKey(target: EncounterTarget) {
  return `nri-table-scene-${target.kind}-${target.data.id}`;
}

function loadSceneDraft(storageKey: string): SceneDraft {
  try {
    const savedScene = localStorage.getItem(storageKey);

    if (!savedScene) {
      return {
        playerDescription: "",
        masterNotes: "",
      };
    }

    const parsedScene = JSON.parse(savedScene) as Partial<SceneDraft>;

    return {
      playerDescription: parsedScene.playerDescription ?? "",
      masterNotes: parsedScene.masterNotes ?? "",
    };
  } catch {
    return {
      playerDescription: "",
      masterNotes: "",
    };
  }
}

function saveSceneDraft(storageKey: string, draft: SceneDraft) {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function EncounterModal({
  target,
  onClose,
  onCreateSceneNote,
}: EncounterModalProps) {
  const [mode, setMode] = useState<"overview" | "scene">("overview");
  const [playerDescription, setPlayerDescription] = useState("");
  const [masterNotes, setMasterNotes] = useState("");
  const [isSceneNoteCreated, setIsSceneNoteCreated] = useState(false);

  const sceneStorageKey = useMemo(() => {
    if (!target) {
      return null;
    }

    return getSceneStorageKey(target);
  }, [target]);

  useEffect(() => {
    if (!sceneStorageKey) {
      setPlayerDescription("");
      setMasterNotes("");
      return;
    }

    const savedDraft = loadSceneDraft(sceneStorageKey);

    setPlayerDescription(savedDraft.playerDescription);
    setMasterNotes(savedDraft.masterNotes);
  }, [sceneStorageKey]);

  if (!target) {
    return null;
  }

  const isLocation = target.kind === "location";
  const title = isLocation ? target.data.title : target.data.name;
  const typeLabel = isLocation ? target.data.type : "Группа на карте";
  const description = target.data.description || "Описание пока не добавлено.";

  function updatePlayerDescription(nextPlayerDescription: string) {
    setPlayerDescription(nextPlayerDescription);

    if (!sceneStorageKey) {
      return;
    }

    saveSceneDraft(sceneStorageKey, {
      playerDescription: nextPlayerDescription,
      masterNotes,
    });
  }

  function updateMasterNotes(nextMasterNotes: string) {
    setMasterNotes(nextMasterNotes);

    if (!sceneStorageKey) {
      return;
    }

    saveSceneDraft(sceneStorageKey, {
      playerDescription,
      masterNotes: nextMasterNotes,
    });
  }

  function createSceneNote() {
    if (!target) {
      return;
    }

    const note = [
      `## Сцена: ${title}`,
      "",
      "### Для игроков",
      playerDescription.trim() || "Описание сцены не заполнено.",
      "",
      "### Для мастера",
      masterNotes.trim() || "Скрытые заметки не заполнены.",
      "",
      "---",
      "",
    ].join("\n");

    onCreateSceneNote(note);
    setIsSceneNoteCreated(true);

    window.setTimeout(() => {
      setIsSceneNoteCreated(false);
    }, 1600);
  }

  function closeModal() {
    setMode("overview");
    onClose();
  }

  return (
    <div className="encounter-backdrop" onClick={closeModal}>
      <section
        className="encounter-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="encounter-close-button" onClick={closeModal}>
          ×
        </button>

        <header className="encounter-header">
          <p className="eyebrow">{mode === "overview" ? typeLabel : "Сцена"}</p>
          <h2>{title}</h2>

          {!isLocation && mode === "overview" && (
            <p className="encounter-faction">
              Фракция: {FACTION_LABELS[target.data.faction] ?? target.data.faction}
            </p>
          )}
        </header>

        {mode === "overview" ? (
          <>
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
              <button
                className="secondary-button"
                type="button"
                onClick={() => setMode("scene")}
              >
                Открыть сцену
              </button>

              <button className="secondary-button" type="button">
                {isLocation ? "Создать событие" : "Начать конфликт"}
              </button>

              <button className="secondary-button" type="button">
                Открыть локальную карту
              </button>

              <button className="secondary-button" type="button" onClick={closeModal}>
                Закрыть
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="scene-layout">
              <section className="scene-card">
                <p className="eyebrow">Для игроков</p>
                <h3>Описание сцены</h3>

                <textarea
                  className="scene-textarea"
                  value={playerDescription}
                  onChange={(event) => updatePlayerDescription(event.target.value)}
                  placeholder="Что мастер зачитывает игрокам: обстановка, запахи, шумы, первое впечатление..."
                  autoFocus
                />
              </section>

              <section className="scene-card">
                <p className="eyebrow">Для мастера</p>
                <h3>Скрытые заметки</h3>

                <textarea
                  className="scene-textarea"
                  value={masterNotes}
                  onChange={(event) => updateMasterNotes(event.target.value)}
                  placeholder="Что знает только мастер: мотивы NPC, ловушки, скрытые угрозы, варианты развития..."
                />
              </section>
            </div>

            <footer className="encounter-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setMode("overview")}
              >
                Вернуться к обзору
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={createSceneNote}
              >
                {isSceneNoteCreated ? "Заметка создана" : "Создать заметку сцены"}
              </button>

              <button className="secondary-button" type="button">
                Открыть локальную карту
              </button>

              <button className="secondary-button" type="button" onClick={closeModal}>
                Закрыть
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}