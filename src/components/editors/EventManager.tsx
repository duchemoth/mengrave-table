import type {
    MapEvent,
    MapEventCategory,
    MapEventStatus,
} from "../../types/campaign";

const EVENT_CATEGORY_OPTIONS: {
    value: MapEventCategory;
    label: string;
}[] = [
        { value: "incident", label: "Происшествие" },
        { value: "mystery", label: "Неясность" },
        { value: "aberration", label: "Аберрация" },
        { value: "conflict", label: "Столкновение" },
        { value: "object", label: "Объект" },
        { value: "other", label: "Другое" },
    ];

const EVENT_STATUS_OPTIONS: {
    value: MapEventStatus;
    label: string;
}[] = [
        { value: "hidden", label: "Скрыто" },
        { value: "active", label: "Активно" },
        { value: "completed", label: "Завершено" },
    ];

type EventManagerProps = {
    events: MapEvent[];
    selectedEventId: string | null;
    onSelectEvent: (eventId: string | null) => void;
    onCreateEvent: (event: Omit<MapEvent, "id">) => MapEvent;
    onUpdateEvent: (event: MapEvent) => void;
    onDeleteEvent: (eventId: string) => void;
};

export function EventManager({
    events,
    selectedEventId,
    onSelectEvent,
    onCreateEvent,
    onUpdateEvent,
    onDeleteEvent,
}: EventManagerProps) {
    const selectedEvent =
        events.find((event) => event.id === selectedEventId) ?? null;

    function createNewEvent() {
        const newEvent = onCreateEvent({
            title: "Новое событие",
            category: "incident",
            status: "hidden",
            description: "Краткое описание события пока не добавлено.",
            masterNotes: "",
            x: 50,
            y: 50,
            isSecret: true,
        });

        onSelectEvent(newEvent.id);
    }

    function updateSelectedEvent(updatedFields: Partial<MapEvent>) {
        if (!selectedEvent) {
            return;
        }

        onUpdateEvent({
            ...selectedEvent,
            ...updatedFields,
        });
    }

    function deleteSelectedEvent() {
        if (!selectedEvent) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить событие «${selectedEvent.title}»? Это действие нельзя отменить.`,
        );

        if (!shouldDelete) {
            return;
        }

        onDeleteEvent(selectedEvent.id);
        onSelectEvent(null);
    }

    return (
        <section className="panel editor-panel">
            <p className="eyebrow">Глобальная карта</p>
            <h2>События</h2>

            <div className="editor-field">
                <label htmlFor="event-select">Выбрать событие</label>

                <select
                    id="event-select"
                    value={selectedEventId ?? ""}
                    onChange={(event) => {
                        const nextEventId = event.target.value;

                        onSelectEvent(nextEventId.length > 0 ? nextEventId : null);
                    }}
                >
                    <option value="">Не выбрано</option>

                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {event.title}
                        </option>
                    ))}
                </select>
            </div>

            <button className="secondary-button" type="button" onClick={createNewEvent}>
                Создать событие
            </button>

            {selectedEvent && (
                <div className="editor-stack">
                    <div className="editor-field">
                        <label htmlFor="event-title">Название события</label>

                        <input
                            id="event-title"
                            value={selectedEvent.title}
                            onChange={(event) =>
                                updateSelectedEvent({ title: event.target.value })
                            }
                        />
                    </div>

                    <div className="editor-field">
                        <label htmlFor="event-category">Категория</label>

                        <select
                            id="event-category"
                            value={selectedEvent.category}
                            onChange={(event) =>
                                updateSelectedEvent({
                                    category: event.target.value as MapEventCategory,
                                })
                            }
                        >
                            {EVENT_CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="editor-field">
                        <label htmlFor="event-status">Статус</label>

                        <select
                            id="event-status"
                            value={selectedEvent.status}
                            onChange={(event) =>
                                updateSelectedEvent({
                                    status: event.target.value as MapEventStatus,
                                })
                            }
                        >
                            {EVENT_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="editor-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedEvent.isSecret}
                            onChange={(event) =>
                                updateSelectedEvent({ isSecret: event.target.checked })
                            }
                        />

                        Скрыто от игроков
                    </label>

                    <div className="editor-field">
                        <label htmlFor="event-description">Описание для игроков</label>

                        <textarea
                            id="event-description"
                            value={selectedEvent.description}
                            onChange={(event) =>
                                updateSelectedEvent({ description: event.target.value })
                            }
                        />
                    </div>

                    <div className="editor-field">
                        <label htmlFor="event-master-notes">Заметки мастера</label>

                        <textarea
                            id="event-master-notes"
                            value={selectedEvent.masterNotes}
                            onChange={(event) =>
                                updateSelectedEvent({ masterNotes: event.target.value })
                            }
                        />
                    </div>

                    <div className="editor-actions">
                        <button
                            className="danger-button"
                            type="button"
                            onClick={deleteSelectedEvent}
                        >
                            Удалить событие
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}