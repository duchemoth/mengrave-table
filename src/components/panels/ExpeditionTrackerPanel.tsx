export type ExpeditionInfophoneLevel = "clean" | "dirty" | "heavy" | "critical";
export type ExpeditionTimeOfDay = "morning" | "day" | "evening" | "night";

export type ExpeditionState = {
  infophoneLevel: ExpeditionInfophoneLevel;
  obscuriaPressure: number;
  routeSegment: number;
  timeOfDay: ExpeditionTimeOfDay;

  supplies: number;
  water: number;
  fuel: number;
  medical: number;
  ammo: number;

  note: string;
};

type ExpeditionTrackerPanelProps = {
  expedition: ExpeditionState;
  canEdit: boolean;
  onChangeExpedition: (expedition: ExpeditionState) => void;
  onAdvanceSegment: () => void;
  onResetExpedition: () => void;
};

const INFOPHONE_LABELS: Record<ExpeditionInfophoneLevel, string> = {
  clean: "Чистый",
  dirty: "Грязный",
  heavy: "Тяжёлый",
  critical: "Критический",
};

const TIME_LABELS: Record<ExpeditionTimeOfDay, string> = {
  morning: "Утро",
  day: "День",
  evening: "Вечер",
  night: "Ночь",
};

function clampResource(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function clampPressure(value: number) {
  return Math.min(10, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
}

export function ExpeditionTrackerPanel({
  expedition,
  canEdit,
  onChangeExpedition,
  onAdvanceSegment,
  onResetExpedition,
}: ExpeditionTrackerPanelProps) {
  function updateExpedition(updatedFields: Partial<ExpeditionState>) {
    if (!canEdit) {
      return;
    }

    onChangeExpedition({
      ...expedition,
      ...updatedFields,
    });
  }

  function updateResource(
    key: "supplies" | "water" | "fuel" | "medical" | "ammo",
    nextValue: number,
  ) {
    updateExpedition({
      [key]: clampResource(nextValue),
    });
  }

  function shiftResource(
    key: "supplies" | "water" | "fuel" | "medical" | "ammo",
    delta: number,
  ) {
    updateResource(key, expedition[key] + delta);
  }

  function shiftPressure(delta: number) {
    updateExpedition({
      obscuriaPressure: clampPressure(expedition.obscuriaPressure + delta),
    });
  }

  return (
    <section className={`expedition-tracker-panel ${canEdit ? "" : "read-only"}`}>
      <header className="expedition-tracker-header">
        <div>
          <p className="eyebrow">Экспедиция</p>
          <h3>Маршрут и давление Обскурии</h3>
        </div>

        <div className="expedition-tracker-actions">
          {canEdit && (
            <>
              <button
                className="expedition-action-button primary"
                type="button"
                onClick={onAdvanceSegment}
              >
                Следующий отрезок
              </button>

              <button
                className="expedition-action-button"
                type="button"
                onClick={onResetExpedition}
              >
                Сбросить
              </button>
            </>
          )}
        </div>
      </header>

      <div className="expedition-summary-grid">
        <article className={`expedition-summary-card infophone-${expedition.infophoneLevel}`}>
          <span>Инфофон</span>
          <strong>{INFOPHONE_LABELS[expedition.infophoneLevel]}</strong>
        </article>

        <article>
          <span>Натиск</span>
          <strong>{expedition.obscuriaPressure} / 10</strong>
        </article>

        <article>
          <span>Отрезок пути</span>
          <strong>{expedition.routeSegment}</strong>
        </article>

        <article>
          <span>Время</span>
          <strong>{TIME_LABELS[expedition.timeOfDay]}</strong>
        </article>
      </div>

      <div className="expedition-controls-grid">
        <label>
          Инфофон
          <select
            value={expedition.infophoneLevel}
            disabled={!canEdit}
            onChange={(event) =>
              updateExpedition({
                infophoneLevel: event.target.value as ExpeditionInfophoneLevel,
              })
            }
          >
            <option value="clean">Чистый</option>
            <option value="dirty">Грязный</option>
            <option value="heavy">Тяжёлый</option>
            <option value="critical">Критический</option>
          </select>
        </label>

        <label>
          Время суток
          <select
            value={expedition.timeOfDay}
            disabled={!canEdit}
            onChange={(event) =>
              updateExpedition({
                timeOfDay: event.target.value as ExpeditionTimeOfDay,
              })
            }
          >
            <option value="morning">Утро</option>
            <option value="day">День</option>
            <option value="evening">Вечер</option>
            <option value="night">Ночь</option>
          </select>
        </label>

        <div className="expedition-stepper">
          <span>Натиск Обскурии</span>

          <div>
            <button type="button" disabled={!canEdit} onClick={() => shiftPressure(-1)}>
              −
            </button>

            <strong>{expedition.obscuriaPressure}</strong>

            <button type="button" disabled={!canEdit} onClick={() => shiftPressure(1)}>
              +
            </button>
          </div>
        </div>

        <div className="expedition-stepper">
          <span>Отрезок пути</span>

          <div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                updateExpedition({
                  routeSegment: Math.max(0, expedition.routeSegment - 1),
                })
              }
            >
              −
            </button>

            <strong>{expedition.routeSegment}</strong>

            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                updateExpedition({
                  routeSegment: expedition.routeSegment + 1,
                })
              }
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="expedition-resources-grid">
        {[
          ["supplies", "Припасы"],
          ["water", "Вода"],
          ["fuel", "Топливо"],
          ["medical", "Медрасход"],
          ["ammo", "Боезапас"],
        ].map(([key, label]) => {
          const resourceKey = key as "supplies" | "water" | "fuel" | "medical" | "ammo";

          return (
            <article key={resourceKey} className="expedition-resource-card">
              <span>{label}</span>

              <div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => shiftResource(resourceKey, -1)}
                >
                  −
                </button>

                <strong>{expedition[resourceKey]}</strong>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => shiftResource(resourceKey, 1)}
                >
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <label className="expedition-note-field">
        Заметка экспедиции
        <textarea
          value={expedition.note}
          disabled={!canEdit}
          onChange={(event) =>
            updateExpedition({
              note: event.target.value,
            })
          }
          placeholder="Маршрут, признаки угрозы, состояние комгена, погода, слухи, следы, решения отряда..."
        />
      </label>
    </section>
  );
}