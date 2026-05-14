import { useEffect, useMemo, useState } from "react";
import type { Location, MapEvent, MapGroup } from "../types/campaign";

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

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  incident: "Происшествие",
  mystery: "Неясность",
  aberration: "Аберрация",
  conflict: "Столкновение",
  object: "Объект",
  other: "Другое",
};

type EncounterTarget =
  | { kind: "location"; data: Location }
  | { kind: "group"; data: MapGroup }
  | { kind: "event"; data: MapEvent };

type SceneDraft = {
  playerDescription: string;
  masterNotes: string;
};

type LocalMapDraft = {
  imageUrl: string;
  notes: string;
};

type EncounterModalProps = {
  target: EncounterTarget | null;
  isPlayerMode: boolean;
  onClose: () => void;
  onCreateSceneNote: (note: string) => void;
  onUpdateMapEvent: (event: MapEvent) => void;
  onCreateLocationEvent: (location: Location) => MapEvent;
};

type EventDraft = {
  title: string;
  category: MapEvent["category"];
  status: MapEvent["status"];
  description: string;
  masterNotes: string;
  isSecret: boolean;
};

function getSceneStorageKey(target: EncounterTarget) {
  return `nri-table-scene-${target.kind}-${target.data.id}`;
}

function getLocalMapStorageKey(target: EncounterTarget) {
  return `nri-table-local-map-${target.kind}-${target.data.id}`;
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

function loadLocalMapDraft(storageKey: string): LocalMapDraft {
  try {
    const savedLocalMap = localStorage.getItem(storageKey);

    if (!savedLocalMap) {
      return {
        imageUrl: "",
        notes: "",
      };
    }

    const parsedLocalMap = JSON.parse(savedLocalMap) as Partial<LocalMapDraft>;

    return {
      imageUrl: parsedLocalMap.imageUrl ?? "",
      notes: parsedLocalMap.notes ?? "",
    };
  } catch {
    return {
      imageUrl: "",
      notes: "",
    };
  }
}

function saveLocalMapDraft(storageKey: string, draft: LocalMapDraft) {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function EncounterModal({
  target,
  isPlayerMode,
  onClose,
  onCreateSceneNote,
  onUpdateMapEvent,
  onCreateLocationEvent,
}: EncounterModalProps) {
  const [mode, setMode] = useState<
    "overview" | "scene" | "localMap" | "eventEdit"
  >("overview");
  const [playerDescription, setPlayerDescription] = useState("");
  const [masterNotes, setMasterNotes] = useState("");
  const [isSceneNoteCreated, setIsSceneNoteCreated] = useState(false);
  const [localMapImageUrl, setLocalMapImageUrl] = useState("");
  const [localMapNotes, setLocalMapNotes] = useState("");
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    title: "",
    category: "incident",
    status: "hidden",
    description: "",
    masterNotes: "",
    isSecret: true,
  });

  const [isEventSaved, setIsEventSaved] = useState(false);

  const sceneStorageKey = useMemo(() => {
    if (!target) {
      return null;
    }

    return getSceneStorageKey(target);
  }, [target]);

  const localMapStorageKey = useMemo(() => {
    if (!target) {
      return null;
    }

    return getLocalMapStorageKey(target);
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

  useEffect(() => {
    if (!localMapStorageKey) {
      setLocalMapImageUrl("");
      setLocalMapNotes("");
      return;
    }

    const savedLocalMap = loadLocalMapDraft(localMapStorageKey);

    setLocalMapImageUrl(savedLocalMap.imageUrl);
    setLocalMapNotes(savedLocalMap.notes);
  }, [localMapStorageKey]);

  useEffect(() => {
    if (!target || target.kind !== "event") {
      return;
    }

    setEventDraft({
      title: target.data.title,
      category: target.data.category,
      status: target.data.status,
      description: target.data.description,
      masterNotes: target.data.masterNotes,
      isSecret: target.data.isSecret,
    });

    setIsEventSaved(false);
  }, [target]);

  if (!target) {
    return null;
  }

  const isLocation = target.kind === "location";
  const isGroup = target.kind === "group";
  const isEvent = target.kind === "event";

  const title = isLocation
    ? target.data.title
    : isGroup
      ? target.data.name
      : target.data.title;

  const typeLabel = isLocation
    ? target.data.type
    : isGroup
      ? "Группа на карте"
      : "Событие на карте";

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

  function updateLocalMapImageUrl(nextImageUrl: string) {
    setLocalMapImageUrl(nextImageUrl);

    if (!localMapStorageKey) {
      return;
    }

    saveLocalMapDraft(localMapStorageKey, {
      imageUrl: nextImageUrl,
      notes: localMapNotes,
    });
  }

  function updateLocalMapNotes(nextNotes: string) {
    setLocalMapNotes(nextNotes);

    if (!localMapStorageKey) {
      return;
    }

    saveLocalMapDraft(localMapStorageKey, {
      imageUrl: localMapImageUrl,
      notes: nextNotes,
    });
  }

  function removeLocalMapImage() {
    updateLocalMapImageUrl("");
  }

  function updateEventDraft(updatedFields: Partial<EventDraft>) {
    setEventDraft((currentDraft) => ({
      ...currentDraft,
      ...updatedFields,
    }));

    setIsEventSaved(false);
  }

  function createEventFromCurrentLocation() {
    if (!target || target.kind !== "location") {
      return;
    }

    const newEvent = onCreateLocationEvent(target.data);

    setEventDraft({
      title: newEvent.title,
      category: newEvent.category,
      status: newEvent.status,
      description: newEvent.description,
      masterNotes: newEvent.masterNotes,
      isSecret: newEvent.isSecret,
    });

    setMode("eventEdit");
  }

  function toggleEventCompletion() {
    if (!target || target.kind !== "event") {
      return;
    }

    const nextStatus = target.data.status === "completed" ? "active" : "completed";

    const updatedEvent: MapEvent = {
      ...target.data,
      status: nextStatus,
    };

    onUpdateMapEvent(updatedEvent);

    setEventDraft((currentDraft) => ({
      ...currentDraft,
      status: nextStatus,
    }));
  }

  function saveEventDraft() {
    if (!target || target.kind !== "event") {
      return;
    }

    const updatedEvent: MapEvent = {
      ...target.data,
      title: eventDraft.title.trim() || "Безымянное событие",
      category: eventDraft.category,
      status: eventDraft.status,
      description:
        eventDraft.description.trim() ||
        "Краткое описание события пока не добавлено.",
      masterNotes: eventDraft.masterNotes,
      isSecret: eventDraft.isSecret,
    };

    onUpdateMapEvent(updatedEvent);
    setIsEventSaved(true);
    setMode("overview");

    window.setTimeout(() => {
      setIsEventSaved(false);
    }, 1600);
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
          <p className="eyebrow">
            {mode === "overview"
              ? typeLabel
              : mode === "localMap"
                ? "Локальная карта"
                : mode === "eventEdit"
                  ? "Редактирование"
                  : "Сцена"}
          </p>
          <h2>{title}</h2>

          {isGroup && mode === "overview" && (
            <p className="encounter-faction">
              Фракция: {FACTION_LABELS[target.data.faction] ?? target.data.faction}
            </p>
          )}

          {isEvent && mode === "overview" && (
            <p className="encounter-faction">
              Категория:{" "}
              {EVENT_CATEGORY_LABELS[target.data.category] ?? target.data.category}
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

                {isGroup && (
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

              <button
                className="secondary-button"
                type="button"
                onClick={() => setMode("localMap")}
              >
                Открыть локальную карту
              </button>

              {!isPlayerMode && (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      if (isLocation && target.kind === "location") {
                        createEventFromCurrentLocation();
                        return;
                      }

                      if (isEvent) {
                        setMode("eventEdit");
                      }
                    }}
                  >
                    {isLocation
                      ? "Создать событие"
                      : isGroup
                        ? "Начать конфликт"
                        : isEventSaved
                          ? "Событие сохранено"
                          : "Редактировать событие"}
                  </button>

                  {isEvent && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={toggleEventCompletion}
                    >
                      {target.data.status === "completed"
                        ? "Вернуть в активные"
                        : "Завершить событие"}
                    </button>
                  )}
                </>
              )}

              <button className="secondary-button" type="button" onClick={closeModal}>
                Закрыть
              </button>
            </footer>
          </>
        ) : mode === "scene" ? (
          <>
            <div className={`scene-layout ${isPlayerMode ? "player-only" : ""}`}>
              <section className="scene-card">
                <p className="eyebrow">Для игроков</p>
                <h3>Описание сцены</h3>

                {isPlayerMode ? (
                  <div className="scene-readonly-text">
                    {playerDescription.trim().length > 0 ? (
                      <p>{playerDescription}</p>
                    ) : (
                      <p>Описание сцены пока не добавлено.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="scene-textarea"
                    value={playerDescription}
                    onChange={(event) => updatePlayerDescription(event.target.value)}
                    placeholder="Что мастер зачитывает игрокам: обстановка, запахи, шумы, первое впечатление..."
                  />
                )}
              </section>

              {!isPlayerMode && (

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
                )}
          </div>

            <footer className="encounter-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setMode("overview")}
              >
                Вернуться к обзору
              </button>

              {!isPlayerMode && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={createSceneNote}
                >
                  {isSceneNoteCreated ? "Заметка создана" : "Создать заметку сцены"}
                </button>
              )}

              <button
                className="secondary-button"
                type="button"
                onClick={() => setMode("localMap")}
              >
                Открыть локальную карту
              </button>

              <button className="secondary-button" type="button" onClick={closeModal}>
                Закрыть
              </button>
            </footer>
          </>
        ) : mode === "localMap" ? (
          <>
            <div className="local-map-layout">
              <section className="local-map-main">
                <div className="local-map-frame">
                  {localMapImageUrl.trim().length > 0 ? (
                    <img
                      className="local-map-image"
                      src={localMapImageUrl.trim()}
                      alt={`Локальная карта: ${title}`}
                    />
                  ) : (
                    <div className="local-map-empty">
                      <p className="eyebrow">1920 × 1080 · 16:9</p>
                      <h3>Локальная карта не назначена</h3>
                      <p>
                        Позже здесь будет горизонтальная карта сцены: тракт,
                        руины, форт, двор, зал, переправа или другой участок.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {!isPlayerMode && (
                <aside className="local-map-sidebar">
                  <section className="local-map-card">
                    <p className="eyebrow">Фон карты</p>
                    <h3>Изображение</h3>

                    <label className="local-map-field">
                      Путь или ссылка на картинку
                      <input
                        value={localMapImageUrl}
                        onChange={(event) =>
                          updateLocalMapImageUrl(event.target.value)
                        }
                        placeholder="/local-maps/old-harbor.webp"
                      />
                    </label>

                    <p className="local-map-help">
                      Рекомендуемый стандарт: 1920×1080, WebP или JPEG. Для
                      локальных файлов положи изображение в папку public/local-maps
                      и укажи путь от корня сайта.
                    </p>

                    {localMapImageUrl.trim().length > 0 && (
                      <button
                        className="danger-button"
                        type="button"
                        onClick={removeLocalMapImage}
                      >
                        Убрать карту
                      </button>
                    )}
                  </section>

                  <section className="local-map-card">
                    <p className="eyebrow">Для мастера</p>
                    <h3>Заметки к карте</h3>

                    <textarea
                      className="local-map-notes"
                      value={localMapNotes}
                      onChange={(event) => updateLocalMapNotes(event.target.value)}
                      placeholder="Входы, укрытия, опасные зоны, засады, запертые двери, шумы, маршруты отхода..."
                    />
                  </section>
                </aside>
              )}
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
                onClick={() => setMode("scene")}
              >
                Открыть сцену
              </button>

              <button className="secondary-button" type="button" onClick={closeModal}>
                Закрыть
              </button>
            </footer>
          </>
        ) : (
          <>
            {isPlayerMode ? (
              <div className="scene-card">
                <p className="eyebrow">Недоступно</p>
                <h3>Редактирование скрыто</h3>
                <p>
                  Этот раздел доступен только Мастеру.
                </p>
              </div>
            ) : (
              <div className="event-edit-layout">
                <section className="event-edit-card">
                  <p className="eyebrow">Событие</p>
                  <h3>Редактирование события</h3>

                  <div className="event-form-grid">
                    <label className="event-field">
                      Название
                      <input
                        value={eventDraft.title}
                        onChange={(event) =>
                          updateEventDraft({ title: event.target.value })
                        }
                        placeholder="Название события"
                      />
                    </label>

                    <label className="event-field">
                      Категория
                      <select
                        value={eventDraft.category}
                        onChange={(event) =>
                          updateEventDraft({
                            category: event.target.value as MapEvent["category"],
                          })
                        }
                      >
                        <option value="incident">Происшествие</option>
                        <option value="mystery">Неясность</option>
                        <option value="aberration">Аберрация</option>
                        <option value="conflict">Столкновение</option>
                        <option value="object">Объект</option>
                        <option value="other">Другое</option>
                      </select>
                    </label>

                    <label className="event-field">
                      Статус
                      <select
                        value={eventDraft.status}
                        onChange={(event) =>
                          updateEventDraft({
                            status: event.target.value as MapEvent["status"],
                          })
                        }
                      >
                        <option value="hidden">Скрыто</option>
                        <option value="active">Активно</option>
                        <option value="completed">Завершено</option>
                      </select>
                    </label>

                    <label className="event-checkbox">
                      <input
                        type="checkbox"
                        checked={eventDraft.isSecret}
                        onChange={(event) =>
                          updateEventDraft({ isSecret: event.target.checked })
                        }
                      />
                      Скрыто от игроков
                    </label>
                  </div>
                </section>

                <section className="event-edit-card">
                  <p className="eyebrow">Для игроков</p>
                  <h3>Описание</h3>

                  <textarea
                    className="scene-textarea"
                    value={eventDraft.description}
                    onChange={(event) =>
                      updateEventDraft({ description: event.target.value })
                    }
                    placeholder="Что игроки видят, слышат или замечают..."
                  />
                </section>

                <section className="event-edit-card">
                  <p className="eyebrow">Для мастера</p>
                  <h3>Скрытые заметки</h3>

                  <textarea
                    className="scene-textarea"
                    value={eventDraft.masterNotes}
                    onChange={(event) =>
                      updateEventDraft({ masterNotes: event.target.value })
                    }
                    placeholder="Что знает только мастер: причины, последствия, скрытые угрозы..."
                  />
                </section>
              </div>
            )}

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
                onClick={saveEventDraft}
              >
                Сохранить событие
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