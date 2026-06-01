import { useEffect, useMemo, useRef, useState } from "react";
import { LocalMapViewer } from "./LocalMapViewer";
import type {
  ArsenalItem,
  Location,
  MapEvent,
  MapEventScale,
  MapGroup,
  ReferenceArticle,
} from "../types/campaign";

type JournalEntryDraft = {
  type: "expedition" | "map" | "scene" | "inventory" | "master" | "other";
  title: string;
  text: string;
  details?: string;
  isHiddenFromPlayers?: boolean;
};

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
  imageUrl: string;
};

type EncounterDisplayMode = "overview" | "scene" | "localMap";
type EncounterMode = EncounterDisplayMode | "eventEdit";

type EncounterModalProps = {
  target: EncounterTarget | null;
  isPlayerMode: boolean;
  initialMode: EncounterMode;
  canShowToPlayers: boolean;
  dossierArticles: ReferenceArticle[];
  arsenalItems: ArsenalItem[];
  onOpenDossier: (articleId: string) => void;
  onShowToPlayers: (
    targetKind: EncounterTarget["kind"],
    targetId: string,
    mode: EncounterDisplayMode,
  ) => void;
  onShowGlobalMapToPlayers: () => void;
  onClose: () => void;
  onCreateSceneNote: (note: string) => void;
  onCreateJournalEntry: (entry: JournalEntryDraft) => void;
  onUpdateMapEvent: (event: MapEvent) => void;
  onCreateLocationEvent: (location: Location) => MapEvent;
};

type EventDraft = {
  title: string;
  category: MapEvent["category"];
  status: MapEvent["status"];
  description: string;
  masterNotes: string;
  imageUrl: string;
  isSecret: boolean;
  scale: MapEventScale;
};

type EventTemplateContext =
  | "route"
  | "rest"
  | "crash"
  | "obscuria"
  | "outpost";

type EventTemplateKind =
  | "threat"
  | "find"
  | "trace"
  | "npc"
  | "breakdown"
  | "infophone"
  | "social";

type EventTemplateSeverity = "light" | "medium" | "heavy";

const EVENT_TEMPLATE_CONTEXT_OPTIONS: {
  value: EventTemplateContext;
  label: string;
}[] = [
    { value: "route", label: "Маршрут" },
    { value: "rest", label: "Привал" },
    { value: "crash", label: "Крушение" },
    { value: "obscuria", label: "Обскурия" },
    { value: "outpost", label: "Форпост" },
  ];

const EVENT_TEMPLATE_KIND_OPTIONS: {
  value: EventTemplateKind;
  label: string;
}[] = [
    { value: "threat", label: "Угроза" },
    { value: "find", label: "Находка" },
    { value: "trace", label: "След" },
    { value: "npc", label: "NPC" },
    { value: "breakdown", label: "Поломка" },
    { value: "infophone", label: "Инфофон" },
    { value: "social", label: "Социальное" },
  ];

const EVENT_TEMPLATE_SEVERITY_OPTIONS: {
  value: EventTemplateSeverity;
  label: string;
}[] = [
    { value: "light", label: "Лёгкая" },
    { value: "medium", label: "Средняя" },
    { value: "heavy", label: "Тяжёлая" },
  ];

const EVENT_SCALE_LABELS: Record<MapEventScale, string> = {
  major: "Полноценное событие",
  minor: "Минорное событие",
};

function getMapEventScale(event: MapEvent): MapEventScale {
  return event.scale === "minor" ? "minor" : "major";
}

function getEventTemplateCategory(
  templateKind: EventTemplateKind,
): MapEvent["category"] {
  if (templateKind === "threat") {
    return "conflict";
  }

  if (templateKind === "find" || templateKind === "breakdown") {
    return "object";
  }

  if (templateKind === "trace" || templateKind === "infophone") {
    return "mystery";
  }

  if (templateKind === "npc" || templateKind === "social") {
    return "incident";
  }

  return "other";
}

function getEventTemplateTitle(
  context: EventTemplateContext,
  templateKind: EventTemplateKind,
  severity: EventTemplateSeverity,
) {
  const severityPrefix =
    severity === "heavy" ? "Тяжёлое" : severity === "medium" ? "Неспокойное" : "Малое";

  if (context === "rest" && templateKind === "threat") {
    return `${severityPrefix} беспокойство на привале`;
  }

  if (context === "rest" && templateKind === "social") {
    return "Разговор у привала";
  }

  if (context === "crash" && templateKind === "find") {
    return "Находка среди обломков";
  }

  if (context === "crash" && templateKind === "threat") {
    return "Опасность в поле обломков";
  }

  if (context === "crash" && templateKind === "npc") {
    return "Выживший среди дыма";
  }

  if (context === "outpost" && templateKind === "social") {
    return "Разговор на форпосте";
  }

  if (context === "outpost" && templateKind === "npc") {
    return "Человек у ворот";
  }

  if (templateKind === "threat") {
    return "Угроза на маршруте";
  }

  if (templateKind === "find") {
    return "Полезная находка";
  }

  if (templateKind === "trace") {
    return "Следы у дороги";
  }

  if (templateKind === "npc") {
    return "Встреча на маршруте";
  }

  if (templateKind === "breakdown") {
    return "Поломка снаряжения";
  }

  if (templateKind === "infophone") {
    return "Сдвиг инфофона";
  }

  return "Сцена напряжения";
}

function buildEventTemplateDescription(
  context: EventTemplateContext,
  templateKind: EventTemplateKind,
  severity: EventTemplateSeverity,
) {
  const pressureText =
    severity === "heavy"
      ? "Ситуация быстро становится опасной: промедление, шум или жадность могут ухудшить положение отряда."
      : severity === "medium"
        ? "Ситуация требует решения: можно пройти осторожно, рискнуть ради выгоды или потратить ресурс."
        : "Ситуация выглядит небольшой, но может дать зацепку, ресурс или тревожный признак.";

  if (templateKind === "threat") {
    return [
      "Впереди появляется признак угрозы: слишком свежие следы, странный шум, движение в стороне от маршрута или внезапная тишина.",
      pressureText,
    ].join("\n\n");
  }

  if (templateKind === "find") {
    return [
      "Отряд замечает место, где можно что-то подобрать, разобрать или проверить: обронённый груз, старый ящик, фрагмент механизма, след недавнего присутствия.",
      pressureText,
    ].join("\n\n");
  }

  if (templateKind === "trace") {
    return [
      "На земле, металле или растительности видны следы. Они могут принадлежать людям, чудовищу, беглецам, наёмникам или чему-то, что только притворяется знакомым.",
      pressureText,
    ].join("\n\n");
  }

  if (templateKind === "npc") {
    return [
      "На пути появляется человек или небольшая группа. Они выглядят уставшими, настороженными и не сразу готовы говорить правду.",
      pressureText,
    ].join("\n\n");
  }

  if (templateKind === "breakdown") {
    return [
      "Что-то идёт не так с вещами, грузом, оружием, переноской раненого, фонарём, креплением, тележкой или другим снаряжением.",
      pressureText,
    ].join("\n\n");
  }

  if (templateKind === "infophone") {
    return [
      "Место ощущается неправильно: звук глохнет, запахи становятся резче, мысли цепляются за чужие образы, а привычные ориентиры слегка плывут.",
      pressureText,
    ].join("\n\n");
  }

  if (context === "rest") {
    return [
      "Привал даёт отряду шанс перевести дыхание, обработать раны, распределить найденное и впервые спокойно заговорить после дороги.",
      pressureText,
    ].join("\n\n");
  }

  return [
    "Сцена начинается с человеческого напряжения: кто-то просит помощи, скрывает правду, спорит, обвиняет или пытается использовать отряд.",
    pressureText,
  ].join("\n\n");
}

function buildEventTemplateMasterNotes(
  context: EventTemplateContext,
  templateKind: EventTemplateKind,
  severity: EventTemplateSeverity,
) {
  const riskLine =
    severity === "heavy"
      ? "Цена провала высокая: Натиск +1, потеря ресурса, ранение, ухудшение отношений или появление преследователя."
      : severity === "medium"
        ? "Цена провала умеренная: расход времени, шум, потеря мелкого ресурса, осложнение следующей сцены."
        : "Цена провала малая: тревожный признак, небольшая задержка, подозрение NPC или лёгкий расход.";

  const contextLine =
    context === "route"
      ? "Контекст: маршрут. Важно дать выбор между скоростью, осторожностью и выгодой."
      : context === "rest"
        ? "Контекст: привал. Важно дать не только угрозу, но и человеческую сцену восстановления."
        : context === "crash"
          ? "Контекст: крушение. Любая находка или спасение должны конкурировать со временем, дымом, огнём и ранеными."
          : context === "obscuria"
            ? "Контекст: Обскурия. Не объясняй всё сразу, показывай признаки и последствия."
            : "Контекст: форпост. Дави через подозрение, нехватку ресурсов, бюрократию и чужую память о поступках отряда.";

  const kindLine =
    templateKind === "threat"
      ? "Вопрос сцены: обойти, проверить, вступить в контакт, устроить засаду или ускориться?"
      : templateKind === "find"
        ? "Вопрос сцены: забрать, оставить, вскрыть, потратить время, отдать NPC или скрыть от других?"
        : templateKind === "trace"
          ? "Вопрос сцены: идти по следу, отметить для позже, скрыть следы от себя или уйти другим маршрутом?"
          : templateKind === "npc"
            ? "Вопрос сцены: помочь, допросить, обменяться, бросить, взять с собой или использовать?"
            : templateKind === "breakdown"
              ? "Вопрос сцены: чинить сейчас, бросить, разобрать на детали, потратить ресурс или рискнуть дальше?"
              : templateKind === "infophone"
                ? "Вопрос сцены: идти через зону, обходить, включать Венцы, тратить время на проверку или принять риск?"
                : "Вопрос сцены: кому верить, что обещать, чем заплатить и кто запомнит поступок?";

  return [
    contextLine,
    kindLine,
    "",
    "Возможные проверки:",
    "• Наблюдательность;",
    "• Выживание;",
    "• Следопытство;",
    "• Первая помощь / Медицина;",
    "• Ремонт / Устройства;",
    "• Переговоры / Проницательность;",
    "• Эхо и инфофон.",
    "",
    riskLine,
    "",
    "Возможные последствия:",
    "• добавить запись в журнал;",
    "• изменить отношение фракции;",
    "• изменить Натиск;",
    "• выдать ресурс экспедиции;",
    "• создать локальную точку;",
    "• открыть или скрыть следующее событие.",
  ].join("\n");
}

function buildEventTemplate(
  context: EventTemplateContext,
  templateKind: EventTemplateKind,
  severity: EventTemplateSeverity,
): Partial<EventDraft> {
  return {
    title: getEventTemplateTitle(context, templateKind, severity),
    category: getEventTemplateCategory(templateKind),
    status: severity === "heavy" ? "hidden" : "active",
    description: buildEventTemplateDescription(context, templateKind, severity),
    masterNotes: buildEventTemplateMasterNotes(context, templateKind, severity),
    isSecret: severity === "heavy" || templateKind === "threat" || templateKind === "infophone",
    scale: severity === "light" ? "minor" : "major",
  };
}

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
        imageUrl: "",
      };
    }

    const parsedScene = JSON.parse(savedScene) as Partial<SceneDraft>;

    return {
      playerDescription: parsedScene.playerDescription ?? "",
      masterNotes: parsedScene.masterNotes ?? "",
      imageUrl: parsedScene.imageUrl ?? "",
    };
  } catch {
    return {
      playerDescription: "",
      masterNotes: "",
      imageUrl: "",
    };
  }
}

function saveSceneDraft(storageKey: string, draft: SceneDraft) {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function EncounterModal({
  target,
  isPlayerMode,
  initialMode,
  canShowToPlayers,
  dossierArticles,
  arsenalItems,
  onOpenDossier,
  onShowToPlayers,
  onShowGlobalMapToPlayers,
  onClose,
  onCreateSceneNote,
  onCreateJournalEntry,
  onUpdateMapEvent,
  onCreateLocationEvent,
}: EncounterModalProps) {
  const [mode, setMode] = useState<EncounterMode>(initialMode);
  const [playerDescription, setPlayerDescription] = useState("");
  const [masterNotes, setMasterNotes] = useState("");
  const [sceneImageUrl, setSceneImageUrl] = useState("");
  const [isSceneNoteCreated, setIsSceneNoteCreated] = useState(false);
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    title: "",
    category: "incident",
    status: "hidden",
    description: "",
    masterNotes: "",
    imageUrl: "",
    isSecret: true,
    scale: "major",
  });

  const [eventTemplateContext, setEventTemplateContext] =
    useState<EventTemplateContext>("route");
  const [eventTemplateKind, setEventTemplateKind] =
    useState<EventTemplateKind>("threat");
  const [eventTemplateSeverity, setEventTemplateSeverity] =
    useState<EventTemplateSeverity>("medium");

  const [isEventSaved, setIsEventSaved] = useState(false);

  const [shownPlayerMode, setShownPlayerMode] = useState<
    EncounterDisplayMode | "globalMap" | null
  >(null);

  const shownPlayerTimerRef = useRef<number | null>(null);

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
    if (!target) {
      return;
    }

    if (isPlayerMode && initialMode === "eventEdit") {
      setMode("overview");
      return;
    }

    setMode(initialMode);
  }, [target?.kind, target?.data.id, initialMode, isPlayerMode]);

  useEffect(() => {
    return () => {
      if (shownPlayerTimerRef.current !== null) {
        window.clearTimeout(shownPlayerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneStorageKey) {
      setPlayerDescription("");
      setMasterNotes("");
      setSceneImageUrl("");
      return;
    }

    const savedDraft = loadSceneDraft(sceneStorageKey);

    setPlayerDescription(savedDraft.playerDescription);
    setMasterNotes(savedDraft.masterNotes);
    setSceneImageUrl(savedDraft.imageUrl);
  }, [sceneStorageKey]);

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
      imageUrl: target.data.imageUrl,
      isSecret: target.data.isSecret,
      scale: getMapEventScale(target.data),
    });

    setIsEventSaved(false);
  }, [target]);

  if (!target) {
    return null;
  }

  function markShownToPlayers(nextMode: EncounterDisplayMode | "globalMap") {
    setShownPlayerMode(nextMode);

    if (shownPlayerTimerRef.current !== null) {
      window.clearTimeout(shownPlayerTimerRef.current);
    }

    shownPlayerTimerRef.current = window.setTimeout(() => {
      setShownPlayerMode(null);
    }, 1800);
  }

  function showCurrentToPlayers(nextMode: EncounterDisplayMode) {
    if (!target) {
      return;
    }

    onShowToPlayers(target.kind, target.data.id, nextMode);
    markShownToPlayers(nextMode);
  }

  function showGlobalMapToPlayers() {
    onShowGlobalMapToPlayers();
    markShownToPlayers("globalMap");
  }

  function getShownPlayerLabel() {
    if (shownPlayerMode === "globalMap") {
      return "Игроки возвращены на карту";
    }

    if (shownPlayerMode === "overview") {
      return "Обзор показан игрокам";
    }

    if (shownPlayerMode === "scene") {
      return "Сцена показана игрокам";
    }

    if (shownPlayerMode === "localMap") {
      return "Карта показана игрокам";
    }

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

  const imageUrl = target.data.imageUrl?.trim() ?? "";

  function updatePlayerDescription(nextPlayerDescription: string) {
    setPlayerDescription(nextPlayerDescription);

    if (!sceneStorageKey) {
      return;
    }

    saveSceneDraft(sceneStorageKey, {
      playerDescription: nextPlayerDescription,
      masterNotes,
      imageUrl: sceneImageUrl,
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
      imageUrl: sceneImageUrl,
    });
  }

  function updateSceneImageUrl(nextSceneImageUrl: string) {
    setSceneImageUrl(nextSceneImageUrl);

    if (!sceneStorageKey) {
      return;
    }

    saveSceneDraft(sceneStorageKey, {
      playerDescription,
      masterNotes,
      imageUrl: nextSceneImageUrl,
    });
  }

  function updateEventDraft(updatedFields: Partial<EventDraft>) {
    setEventDraft((currentDraft) => ({
      ...currentDraft,
      ...updatedFields,
    }));

    setIsEventSaved(false);
  }

  function applyQuickEventTemplate() {
    const template = buildEventTemplate(
      eventTemplateContext,
      eventTemplateKind,
      eventTemplateSeverity,
    );

    updateEventDraft(template);
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
      imageUrl: newEvent.imageUrl,
      isSecret: newEvent.isSecret,
      scale: getMapEventScale(newEvent),
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
      imageUrl: eventDraft.imageUrl.trim(),
      isSecret: eventDraft.isSecret,
      scale: eventDraft.scale,
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
    <div className="encounter-backdrop">
      <section
        className={`encounter-modal ${mode === "localMap" ? "local-map-mode" : ""}`}
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

        {canShowToPlayers && (
          <div className="encounter-player-toolbar">
            <button
              className="secondary-button"
              type="button"
              onClick={showGlobalMapToPlayers}
            >
              Вернуть игроков на карту
            </button>

            {shownPlayerMode && (
              <span className="encounter-player-status">
                {getShownPlayerLabel()} ✓
              </span>
            )}
          </div>
        )}

        {mode === "overview" ? (
          <>
            <div className="encounter-body">
              {imageUrl ? (
                <div className="encounter-art">
                  <img src={imageUrl} alt={title} className="encounter-art-image" />
                </div>
              ) : (
                <div className="encounter-art-placeholder">
                  <span>Иллюстрация не задана</span>
                </div>
              )}

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
              {canShowToPlayers && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => showCurrentToPlayers("overview")}
                >
                  Показать игрокам
                </button>
              )}
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
              <section className="scene-card scene-illustration-card">
                <p className="eyebrow">Иллюстрация</p>
                <h3>Кадр сцены</h3>

                {sceneImageUrl.trim().length > 0 ? (
                  <div className="scene-image-frame">
                    <img
                      className="scene-image"
                      src={sceneImageUrl.trim()}
                      alt={title}
                    />
                  </div>
                ) : (
                  <div className="scene-image-placeholder">
                    <span>Иллюстрация сцены пока не задана.</span>
                  </div>
                )}

                {!isPlayerMode && (
                  <label className="scene-image-input-row">
                    <span>Путь к изображению</span>
                    <input
                      type="text"
                      value={sceneImageUrl}
                      onChange={(event) => updateSceneImageUrl(event.target.value)}
                      placeholder="/scene-images/apis-interior.webp"
                    />
                    <p className="scene-image-hint">
                      Для сцен лучше класть изображения в public/scene-images/ и указывать путь от корня сайта.
                    </p>
                  </label>
                )}
              </section>

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
                <section className="scene-card scene-master-card">
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
              {canShowToPlayers && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => showCurrentToPlayers("scene")}
                >
                  Показать сцену игрокам
                </button>
              )}
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
          <LocalMapViewer
            title={title}
            storageKey={localMapStorageKey}
            isPlayerMode={isPlayerMode}
            canShowToPlayers={canShowToPlayers}
            dossierArticles={dossierArticles}
            arsenalItems={arsenalItems}
            onOpenDossier={onOpenDossier}
            onShowToPlayers={() => showCurrentToPlayers("localMap")}
            onBackToOverview={() => setMode("overview")}
            onClose={closeModal}
            onCreateJournalEntry={onCreateJournalEntry}
          />

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
                <section className="event-edit-card event-template-card">
                  <p className="eyebrow">Быстрая заготовка</p>
                  <h3>Собрать событие</h3>

                  <div className="event-template-grid">
                    <label className="event-field">
                      Контекст
                      <select
                        value={eventTemplateContext}
                        onChange={(event) =>
                          setEventTemplateContext(
                            event.target.value as EventTemplateContext,
                          )
                        }
                      >
                        {EVENT_TEMPLATE_CONTEXT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="event-field">
                      Тип
                      <select
                        value={eventTemplateKind}
                        onChange={(event) =>
                          setEventTemplateKind(
                            event.target.value as EventTemplateKind,
                          )
                        }
                      >
                        {EVENT_TEMPLATE_KIND_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="event-field">
                      Тяжесть
                      <select
                        value={eventTemplateSeverity}
                        onChange={(event) =>
                          setEventTemplateSeverity(
                            event.target.value as EventTemplateSeverity,
                          )
                        }
                      >
                        {EVENT_TEMPLATE_SEVERITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={applyQuickEventTemplate}
                    >
                      Заполнить заготовкой
                    </button>
                  </div>

                  <p className="event-template-help">
                    Заготовка перезапишет название, категорию, статус, описание,
                    скрытость и заметки мастера. Иллюстрация не меняется.
                  </p>
                </section>

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

                    <label className="event-field">
                      Путь к иллюстрации
                      <input
                        value={eventDraft.imageUrl}
                        onChange={(event) =>
                          updateEventDraft({ imageUrl: event.target.value })
                        }
                        placeholder="/images/events/ambush-road.jpg"
                      />
                    </label>

                    <label className="event-field">
                      Масштаб
                      <select
                        value={eventDraft.scale}
                        onChange={(event) =>
                          updateEventDraft({
                            scale: event.target.value as MapEventScale,
                          })
                        }
                      >
                        <option value="major">{EVENT_SCALE_LABELS.major}</option>
                        <option value="minor">{EVENT_SCALE_LABELS.minor}</option>
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