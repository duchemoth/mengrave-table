import { useState } from "react";
import type {
    MapEvent,
    MapEventCategory,
    MapEventScale,
    MapEventStatus,
} from "../../types/campaign";

const EVENT_CATEGORY_LABELS: Record<MapEventCategory, string> = {
    incident: "Происшествие",
    mystery: "Неясность",
    aberration: "Аберрация",
    conflict: "Столкновение",
    object: "Объект",
    other: "Другое",
};

const EVENT_STATUS_LABELS: Record<MapEventStatus, string> = {
    hidden: "Скрыто",
    active: "Активно",
    completed: "Завершено",
};

const EVENT_SCALE_LABELS: Record<MapEventScale, string> = {
    major: "полноценное",
    minor: "минорное",
};

function getMapEventScale(event: MapEvent): MapEventScale {
    return event.scale === "minor" ? "minor" : "major";
}

type EventStatusFilter = "all" | MapEventStatus;
type EventCategoryFilter = "all" | MapEventCategory;

type EventManagerProps = {
    events: MapEvent[];
    selectedEventId: string | null;
    onSelectEvent: (eventId: string | null) => void;
    onCreateEvent: (event: Omit<MapEvent, "id">) => MapEvent;
    onDeleteEvent: (eventId: string) => void;
    onOpenEvent: (event: MapEvent) => void;
};

export function EventManager({
    events,
    selectedEventId,
    onSelectEvent,
    onCreateEvent,
    onDeleteEvent,
    onOpenEvent,
}: EventManagerProps) {
    const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");

    const [categoryFilter, setCategoryFilter] =
        useState<EventCategoryFilter>("all");

    const filteredEvents = events.filter((event) => {
        const matchesStatus =
            statusFilter === "all" || event.status === statusFilter;

        const matchesCategory =
            categoryFilter === "all" || event.category === categoryFilter;

        return matchesStatus && matchesCategory;
    });

    const selectedEvent =
        events.find((event) => event.id === selectedEventId) ?? null;

    function createNewEvent() {
        const newEvent = onCreateEvent({
            title: "Новое событие",
            category: "incident",
            status: "hidden",
            description: "Краткое описание события пока не добавлено.",
            masterNotes: "",
            imageUrl: "",
            x: 50,
            y: 50,
            isSecret: true,
            scale: "major",
        });

        onSelectEvent(newEvent.id);
        onOpenEvent(newEvent);
    }

    function openSelectedEvent() {
        if (!selectedEvent) {
            return;
        }

        onOpenEvent(selectedEvent);
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

            <div className="event-filter-tabs">
                <button
                    className={`event-filter-tab ${statusFilter === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter("all")}
                >
                    Все
                </button>

                <button
                    className={`event-filter-tab ${statusFilter === "hidden" ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter("hidden")}
                >
                    Скрытые
                </button>

                <button
                    className={`event-filter-tab ${statusFilter === "active" ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter("active")}
                >
                    Активные
                </button>

                <button
                    className={`event-filter-tab ${statusFilter === "completed" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                >
                    Завершённые
                </button>
            </div>

            <div className="event-filter-tabs event-filter-tabs-secondary">
                <button
                    className={`event-filter-tab ${categoryFilter === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                >
                    Все типы
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "incident" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("incident")}
                >
                    Происшествия
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "mystery" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("mystery")}
                >
                    Неясности
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "aberration" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("aberration")}
                >
                    Аберрации
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "conflict" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("conflict")}
                >
                    Столкновения
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "object" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("object")}
                >
                    Объекты
                </button>

                <button
                    className={`event-filter-tab ${categoryFilter === "other" ? "active" : ""
                        }`}
                    type="button"
                    onClick={() => setCategoryFilter("other")}
                >
                    Другое
                </button>
            </div>

            <button className="secondary-button" type="button" onClick={createNewEvent}>
                Создать событие
            </button>

            {events.length === 0 ? (
                <p className="editor-empty-text">
                    Событий пока нет. Создай первое событие на карте.
                </p>
            ) : filteredEvents.length === 0 ? (
                <p className="editor-empty-text">
                    В этом фильтре событий пока нет.
                </p>
            ) : (
                <div className="event-list">
                    {filteredEvents.map((event) => {
                        const isSelected = selectedEventId === event.id;

                        return (
                            <button
                                key={event.id}
                                className={`event-list-item event-list-item-${getMapEventScale(event)} ${isSelected ? "active" : ""}`}
                                type="button"
                                onClick={() => onSelectEvent(event.id)}
                                onDoubleClick={() => onOpenEvent(event)}
                            >
                                <span className="event-list-title">{event.title}</span>

                                <span className="event-list-meta">
                                    {EVENT_CATEGORY_LABELS[event.category]} ·{" "}
                                    {EVENT_STATUS_LABELS[event.status]} ·{" "}
                                    {EVENT_SCALE_LABELS[getMapEventScale(event)]}
                                    {event.isSecret ? " · скрыто" : ""}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedEvent && (
                <div className="event-list-actions">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={openSelectedEvent}
                    >
                        Открыть событие
                    </button>

                    <button
                        className="danger-button"
                        type="button"
                        onClick={deleteSelectedEvent}
                    >
                        Удалить
                    </button>
                </div>
            )}
        </section>
    );
}