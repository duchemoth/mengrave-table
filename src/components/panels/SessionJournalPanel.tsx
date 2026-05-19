import { useMemo, useState } from "react";

export type SessionJournalEntryType =
    | "expedition"
    | "map"
    | "scene"
    | "inventory"
    | "master"
    | "other";

export type SessionJournalEntry = {
    id: string;
    createdAt: number;
    type: SessionJournalEntryType;
    title: string;
    text: string;
    details: string;
    isHiddenFromPlayers: boolean;
};

type SessionJournalPanelProps = {
    entries: SessionJournalEntry[];
    canEdit: boolean;
    onAddEntry: (entry: SessionJournalEntry) => void;
    onDeleteEntry: (entryId: string) => void;
    onClearEntries: () => void;
};

const JOURNAL_TYPE_LABELS: Record<SessionJournalEntryType, string> = {
    expedition: "Экспедиция",
    map: "Карта",
    scene: "Сцена",
    inventory: "Инвентарь",
    master: "Мастер",
    other: "Другое",
};

function formatJournalTime(timestamp: number) {
    const date = new Date(timestamp);

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function createEmptyDraft() {
    return {
        type: "master" as SessionJournalEntryType,
        title: "",
        text: "",
        details: "",
        isHiddenFromPlayers: true,
    };
}

export function SessionJournalPanel({
    entries,
    canEdit,
    onAddEntry,
    onDeleteEntry,
    onClearEntries,
}: SessionJournalPanelProps) {
    const [draft, setDraft] = useState(createEmptyDraft);
    const [isDraftOpen, setIsDraftOpen] = useState(false);
    const [expandedEntryIds, setExpandedEntryIds] = useState<string[]>([]);

    const visibleEntries = useMemo(() => {
        return canEdit
            ? entries
            : entries.filter((entry) => !entry.isHiddenFromPlayers);
    }, [canEdit, entries]);

    const sortedEntries = useMemo(() => {
        return [...visibleEntries].sort((a, b) => b.createdAt - a.createdAt);
    }, [visibleEntries]);

    function toggleEntry(entryId: string) {
        setExpandedEntryIds((current) =>
            current.includes(entryId)
                ? current.filter((id) => id !== entryId)
                : [...current, entryId],
        );
    }

    function addEntry() {
        if (!canEdit) {
            return;
        }

        const title = draft.title.trim();
        const text = draft.text.trim();
        const details = draft.details.trim();

        if (!title && !text && !details) {
            return;
        }

        onAddEntry({
            id: `journal-entry-${Date.now()}`,
            createdAt: Date.now(),
            type: draft.type,
            title: title || JOURNAL_TYPE_LABELS[draft.type],
            text,
            details,
            isHiddenFromPlayers: draft.isHiddenFromPlayers,
        });

        setDraft(createEmptyDraft());
        setIsDraftOpen(false);
    }

    function clearEntries() {
        if (!canEdit || entries.length === 0) {
            return;
        }

        onClearEntries();
        setExpandedEntryIds([]);
    }

    return (
        <section className={`session-journal-panel ${canEdit ? "" : "read-only"}`}>
            <header className="session-journal-header">
                <div>
                    <p className="eyebrow">Журнал</p>
                    <h3>Хроника сессии</h3>
                </div>

                <div className="session-journal-meta">
                    <span>{visibleEntries.length} записей</span>

                    {canEdit && (
                        <button type="button" onClick={() => setIsDraftOpen((current) => !current)}>
                            {isDraftOpen ? "Свернуть запись" : "Новая запись"}
                        </button>
                    )}

                    {canEdit && entries.length > 0 && (
                        <button type="button" onClick={clearEntries}>
                            Очистить
                        </button>
                    )}
                </div>
            </header>

            {canEdit && isDraftOpen && (
                <section className="session-journal-draft">
                    <div className="session-journal-draft-grid">
                        <label>
                            Тип
                            <select
                                value={draft.type}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        type: event.target.value as SessionJournalEntryType,
                                    }))
                                }
                            >
                                <option value="expedition">Экспедиция</option>
                                <option value="map">Карта</option>
                                <option value="scene">Сцена</option>
                                <option value="inventory">Инвентарь</option>
                                <option value="master">Мастер</option>
                                <option value="other">Другое</option>
                            </select>
                        </label>

                        <label>
                            Заголовок
                            <input
                                value={draft.title}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="Например: Отряд продвинулся"
                            />
                        </label>

                        <label className="session-journal-hidden-toggle">
                            <input
                                type="checkbox"
                                checked={draft.isHiddenFromPlayers}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        isHiddenFromPlayers: event.target.checked,
                                    }))
                                }
                            />
                            Скрыто от игроков
                        </label>
                    </div>

                    <label>
                        Запись
                        <textarea
                            value={draft.text}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    text: event.target.value,
                                }))
                            }
                            placeholder="Кратко: что произошло, что решили игроки, что изменилось..."
                        />
                    </label>

                    <label>
                        Подробности
                        <textarea
                            value={draft.details}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    details: event.target.value,
                                }))
                            }
                            placeholder="Опционально: подробности, скрытые причины, состояние экспедиции, последствия..."
                        />
                    </label>

                    <button className="session-journal-add-button" type="button" onClick={addEntry}>
                        Добавить запись
                    </button>
                </section>
            )}

            <div className="session-journal-list">
                {sortedEntries.length === 0 ? (
                    <article className="session-journal-empty">
                        <p className="eyebrow">Пусто</p>
                        <h4>Записей пока нет</h4>
                        <p>
                            Здесь появится хроника партии: переходы, сцены, открытия карты,
                            находки и мастерские заметки.
                        </p>
                    </article>
                ) : (
                    sortedEntries.map((entry) => {
                        const isExpanded = expandedEntryIds.includes(entry.id);
                        const hasDetails = entry.details.trim().length > 0;

                        return (
                            <article
                                key={entry.id}
                                className={`session-journal-entry ${entry.isHiddenFromPlayers ? "hidden-entry" : ""
                                    }`}
                            >
                                <button
                                    className="session-journal-entry-main"
                                    type="button"
                                    onClick={() => toggleEntry(entry.id)}
                                >
                                    <div>
                                        <span className={`journal-entry-type type-${entry.type}`}>
                                            {JOURNAL_TYPE_LABELS[entry.type]}
                                        </span>

                                        {entry.isHiddenFromPlayers && canEdit && (
                                            <span className="journal-entry-hidden-badge">
                                                Скрыто
                                            </span>
                                        )}
                                    </div>

                                    <strong>{entry.title}</strong>

                                    {entry.text.trim().length > 0 && <p>{entry.text}</p>}

                                    <small>
                                        {formatJournalTime(entry.createdAt)}
                                        {hasDetails ? ` · ${isExpanded ? "Свернуть" : "Подробнее"}` : ""}
                                    </small>
                                </button>

                                {isExpanded && hasDetails && (
                                    <div className="session-journal-entry-details">
                                        {entry.details}
                                    </div>
                                )}

                                {canEdit && (
                                    <button
                                        className="session-journal-delete-button"
                                        type="button"
                                        onClick={() => onDeleteEntry(entry.id)}
                                    >
                                        Удалить
                                    </button>
                                )}
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
}