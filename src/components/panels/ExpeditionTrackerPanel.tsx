export type ExpeditionInfophoneLevel = "clean" | "dirty" | "heavy" | "critical";
export type ExpeditionTimeOfDay = "morning" | "day" | "evening" | "night";

export type ExpeditionResourceKey =
    | "supplies"
    | "water"
    | "fuel"
    | "medical"
    | "ammo";

export type ExpeditionSegmentCosts = Record<ExpeditionResourceKey, boolean>;

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

    segmentCosts: ExpeditionSegmentCosts;

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

const EXPEDITION_RESOURCES: {
    key: ExpeditionResourceKey;
    label: string;
}[] = [
        { key: "supplies", label: "Припасы" },
        { key: "water", label: "Вода" },
        { key: "fuel", label: "Топливо" },
        { key: "medical", label: "Медрасход" },
        { key: "ammo", label: "Боезапас" },
    ];

function clampResource(value: number) {
    return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function clampPressure(value: number) {
    return Math.min(10, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
}

function getPressureDangerClass(pressure: number) {
    if (pressure >= 10) {
        return "critical";
    }

    if (pressure >= 7) {
        return "danger";
    }

    if (pressure >= 4) {
        return "warning";
    }

    return "stable";
}

function getResourceDangerClass(value: number) {
    if (value <= 0) {
        return "critical";
    }

    if (value <= 2) {
        return "warning";
    }

    return "stable";
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

    function toggleSegmentCost(resourceKey: ExpeditionResourceKey) {
        updateExpedition({
            segmentCosts: {
                ...expedition.segmentCosts,
                [resourceKey]: !expedition.segmentCosts[resourceKey],
            },
        });
    }

    if (!canEdit) {
        return (
            <section className="expedition-tracker-panel expedition-player-view">
                <header className="expedition-tracker-header">
                    <div>
                        <p className="eyebrow">Экспедиция</p>
                        <h3>Состояние маршрута</h3>
                    </div>
                </header>

                <div className="expedition-player-summary">
                    <article className={`infophone-${expedition.infophoneLevel}`}>
                        <span>Инфофон</span>
                        <strong>{INFOPHONE_LABELS[expedition.infophoneLevel]}</strong>
                    </article>

                    <article className={`pressure-${getPressureDangerClass(expedition.obscuriaPressure)}`}>
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

                <div className="expedition-player-resources">
                    {[
                        ["supplies", "Припасы"],
                        ["water", "Вода"],
                        ["fuel", "Топливо"],
                        ["medical", "Медрасход"],
                        ["ammo", "Боезапас"],
                    ].map(([key, label]) => {
                        const resourceKey = key as "supplies" | "water" | "fuel" | "medical" | "ammo";

                        return (
                            <article
                                key={resourceKey}
                                className={`resource-${getResourceDangerClass(expedition[resourceKey])}`}
                            >
                                <span>{label}</span>
                                <strong>{expedition[resourceKey]}</strong>
                            </article>
                        );
                    })}
                </div>

                <p className="expedition-player-note">
                    Это открытая сводка экспедиции. Мастерские заметки и управление
                    маршрутом скрыты.
                </p>
            </section>
        );
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

            <div className="expedition-layout">
                <section className="expedition-main-column">
                    <div className="expedition-summary-grid">
                        <article className={`expedition-summary-card infophone-${expedition.infophoneLevel}`}>
                            <span>Инфофон</span>
                            <strong>{INFOPHONE_LABELS[expedition.infophoneLevel]}</strong>
                        </article>

                        <article className={`pressure-${getPressureDangerClass(expedition.obscuriaPressure)}`}>
                            <span>Натиск</span>
                            <strong>{expedition.obscuriaPressure} / 10</strong>
                        </article>

                        <article>
                            <span>Отрезок</span>
                            <strong>{expedition.routeSegment}</strong>
                        </article>

                        <article>
                            <span>Время</span>
                            <strong>{TIME_LABELS[expedition.timeOfDay]}</strong>
                        </article>
                    </div>

                    <div className="expedition-route-card">
                        <div>
                            <p className="eyebrow">Ход экспедиции</p>
                            <h4>Текущий переход</h4>
                        </div>

                        <div className="expedition-controls-grid compact">
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

                        <div
                            style={{
                                display: "grid",
                                gap: "10px",
                                marginTop: "4px",
                                padding: "14px 16px 16px",
                                border: "1px solid rgba(36, 26, 18, 0.16)",
                                borderRadius: "16px",
                                background: "rgba(255, 244, 210, 0.24)",
                                boxSizing: "border-box",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "10px",
                                    minHeight: "20px",
                                }}
                            >
                                <span
                                    style={{
                                        color: "var(--blood)",
                                        fontFamily: "Inter, system-ui, sans-serif",
                                        fontSize: "11px",
                                        fontWeight: 950,
                                        letterSpacing: "0.14em",
                                        lineHeight: 1,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Расход за отрезок
                                </span>

                                <span
                                    style={{
                                        color: "var(--ink)",
                                        fontFamily: "Georgia, serif",
                                        fontSize: "16px",
                                        fontWeight: 900,
                                        lineHeight: 1,
                                    }}
                                >
                                    списывать при переходе
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                        gap: "8px",
                                    }}
                                >
                                    {EXPEDITION_RESOURCES.slice(0, 3).map((resource) => (
                                        <label
                                            key={resource.key}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "7px",
                                                minHeight: "34px",
                                                border: "1px solid rgba(36, 26, 18, 0.18)",
                                                borderRadius: "999px",
                                                padding: "7px 10px",
                                                color: "var(--ink-soft)",
                                                background: "rgba(255, 244, 210, 0.34)",
                                                fontFamily: "Inter, system-ui, sans-serif",
                                                fontSize: "12px",
                                                fontWeight: 900,
                                                whiteSpace: "nowrap",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={expedition.segmentCosts[resource.key]}
                                                disabled={!canEdit}
                                                onChange={() => toggleSegmentCost(resource.key)}
                                            />

                                            <span>{resource.label} −1</span>
                                        </label>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                        gap: "8px",
                                    }}
                                >
                                    {EXPEDITION_RESOURCES.slice(3).map((resource) => (
                                        <label
                                            key={resource.key}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "7px",
                                                minHeight: "34px",
                                                border: "1px solid rgba(36, 26, 18, 0.18)",
                                                borderRadius: "999px",
                                                padding: "7px 10px",
                                                color: "var(--ink-soft)",
                                                background: "rgba(255, 244, 210, 0.34)",
                                                fontFamily: "Inter, system-ui, sans-serif",
                                                fontSize: "12px",
                                                fontWeight: 900,
                                                whiteSpace: "nowrap",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={expedition.segmentCosts[resource.key]}
                                                disabled={!canEdit}
                                                onChange={() => toggleSegmentCost(resource.key)}
                                            />

                                            <span>{resource.label} −1</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="expedition-help-text">
                            “Следующий отрезок” двигает время и номер перехода. Натиск меняется вручную.
                        </p>
                    </div>
                </section>

                <section className="expedition-side-column">
                    <div className="expedition-resources-panel">
                        <div>
                            <p className="eyebrow">Ресурсы отряда</p>
                            <h4>Расходники экспедиции</h4>
                        </div>

                        <div className="expedition-resources-grid">
                            {EXPEDITION_RESOURCES.map((resource) => {
                                const resourceKey = resource.key;
                                const label = resource.label;

                                return (
                                    <article
                                        key={resourceKey}
                                        className={`expedition-resource-card resource-${getResourceDangerClass(
                                            expedition[resourceKey],
                                        )}`}
                                    >
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
                    </div>

                    {canEdit && (
                        <label className="expedition-note-field">
                            Заметка экспедиции
                            <textarea
                                value={expedition.note}
                                onChange={(event) =>
                                    updateExpedition({
                                        note: event.target.value,
                                    })
                                }
                                placeholder="Маршрут, признаки угрозы, состояние комгена, погода, слухи, следы, решения отряда..."
                            />
                        </label>
                    )}
                </section>
            </div>
        </section>
    );
}