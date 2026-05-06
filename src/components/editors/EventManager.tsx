import type {
  MapEvent,
  MapEventCategory,
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

      <button className="secondary-button" type="button" onClick={createNewEvent}>
        Создать событие
      </button>

      {events.length === 0 ? (
        <p className="editor-empty-text">
          Событий пока нет. Создай первое событие на карте.
        </p>
      ) : (
        <div className="event-list">
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;

            return (
              <button
                key={event.id}
                className={`event-list-item ${isSelected ? "active" : ""}`}
                type="button"
                onClick={() => onSelectEvent(event.id)}
                onDoubleClick={() => onOpenEvent(event)}
              >
                <span className="event-list-title">{event.title}</span>

                <span className="event-list-meta">
                  {EVENT_CATEGORY_LABELS[event.category]} ·{" "}
                  {EVENT_STATUS_LABELS[event.status]}
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