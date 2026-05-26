import type {
    CampaignRelationEntry,
    CampaignRelationLevel,
    CampaignRelationsState,
} from "../../types/campaign";

type RelationshipTrackerPanelProps = {
    relations: CampaignRelationsState;
    canEdit: boolean;
    isPlayerMode: boolean;
    onChangeRelations: (relations: CampaignRelationsState) => void;
};

const RELATION_LEVELS: CampaignRelationLevel[] = [
    "hostile",
    "distrust",
    "tolerated",
    "favorable",
    "patronage",
];

const RELATION_LEVEL_LABELS: Record<CampaignRelationLevel, string> = {
    hostile: "Враждебность",
    distrust: "Недоверие",
    tolerated: "Терпимость",
    favorable: "Благосклонность",
    patronage: "Покровительство",
};

const LAW_ATTENTION_LABELS: Record<number, string> = {
    0: "Не интересуются",
    1: "Заметили",
    2: "Есть вопросы",
    3: "Наблюдение",
    4: "Розыск / давление",
    5: "Силовое решение",
};

function clampLawAttention(value: number) {
    return Math.max(0, Math.min(5, Math.floor(Number.isFinite(value) ? value : 0)));
}

function shiftRelationLevel(
    currentLevel: CampaignRelationLevel,
    delta: -1 | 1,
): CampaignRelationLevel {
    const currentIndex = RELATION_LEVELS.indexOf(currentLevel);
    const nextIndex = Math.max(
        0,
        Math.min(RELATION_LEVELS.length - 1, currentIndex + delta),
    );

    return RELATION_LEVELS[nextIndex];
}

function getRelationToneClass(level: CampaignRelationLevel) {
    if (level === "hostile") {
        return "danger";
    }

    if (level === "distrust") {
        return "warning";
    }

    if (level === "favorable" || level === "patronage") {
        return "good";
    }

    return "neutral";
}

export function RelationshipTrackerPanel({
    relations,
    canEdit,
    isPlayerMode,
    onChangeRelations,
}: RelationshipTrackerPanelProps) {
    const visibleEntries = isPlayerMode
        ? relations.entries.filter((entry) => entry.isVisibleToPlayers)
        : relations.entries;

    function updateRelations(updatedFields: Partial<CampaignRelationsState>) {
        if (!canEdit) {
            return;
        }

        onChangeRelations({
            ...relations,
            ...updatedFields,
        });
    }

    function updateEntry(
        entryId: string,
        updatedFields: Partial<CampaignRelationEntry>,
    ) {
        if (!canEdit) {
            return;
        }

        updateRelations({
            entries: relations.entries.map((entry) =>
                entry.id === entryId
                    ? {
                        ...entry,
                        ...updatedFields,
                    }
                    : entry,
            ),
        });
    }

    function shiftEntry(entryId: string, delta: -1 | 1) {
        const entry = relations.entries.find((item) => item.id === entryId);

        if (!entry) {
            return;
        }

        updateEntry(entryId, {
            level: shiftRelationLevel(entry.level, delta),
        });
    }

    function addRelation() {
        if (!canEdit) {
            return;
        }

        const nextRelation: CampaignRelationEntry = {
            id: `relation-${Date.now()}`,
            title: "Новая сила",
            level: "tolerated",
            note: "",
            isVisibleToPlayers: false,
        };

        updateRelations({
            entries: [...relations.entries, nextRelation],
        });
    }

    function deleteRelation(entryId: string) {
        if (!canEdit) {
            return;
        }

        updateRelations({
            entries: relations.entries.filter((entry) => entry.id !== entryId),
        });
    }

    return (
        <section className={`relationship-panel ${isPlayerMode ? "read-only" : ""}`}>
            <header className="relationship-header">
                <div>
                    <p className="eyebrow">Отношения</p>
                    <h3>Репутация и внимание</h3>
                </div>

                {canEdit && (
                    <button
                        className="relationship-add-button"
                        type="button"
                        onClick={addRelation}
                    >
                        + Связь
                    </button>
                )}
            </header>

            <div className="relationship-layout">
                <article className="law-attention-card">
                    <div>
                        <p className="eyebrow">Темерат / закон</p>
                        <h4>Внимание закона</h4>
                    </div>

                    <div className={`law-attention-value law-${relations.lawAttention}`}>
                        <strong>{relations.lawAttention} / 5</strong>
                        <span>
                            {LAW_ATTENTION_LABELS[relations.lawAttention] ??
                                LAW_ATTENTION_LABELS[0]}
                        </span>
                    </div>

                    {canEdit && (
                        <div className="relationship-stepper">
                            <button
                                type="button"
                                onClick={() =>
                                    updateRelations({
                                        lawAttention: clampLawAttention(relations.lawAttention - 1),
                                    })
                                }
                            >
                                −
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    updateRelations({
                                        lawAttention: clampLawAttention(relations.lawAttention + 1),
                                    })
                                }
                            >
                                +
                            </button>
                        </div>
                    )}

                    {!isPlayerMode && (
                        <>
                            <label className="relationship-note-field">
                                Заметка закона
                                <textarea
                                    value={relations.lawNote}
                                    onChange={(event) =>
                                        updateRelations({
                                            lawNote: event.target.value,
                                        })
                                    }
                                    readOnly={!canEdit}
                                    placeholder="Почему Темерат заинтересовался, кто задаёт вопросы, что висит над отрядом..."
                                />
                            </label>

                            <label className="relationship-checkbox">
                                <input
                                    type="checkbox"
                                    checked={relations.lawVisibleToPlayers}
                                    onChange={(event) =>
                                        updateRelations({
                                            lawVisibleToPlayers: event.target.checked,
                                        })
                                    }
                                    disabled={!canEdit}
                                />
                                Видно игрокам
                            </label>
                        </>
                    )}

                    {isPlayerMode && relations.lawVisibleToPlayers && relations.lawNote && (
                        <p className="relationship-public-note">{relations.lawNote}</p>
                    )}
                </article>

                <div className="relationship-list">
                    {visibleEntries.length === 0 ? (
                        <p className="relationship-empty">
                            Видимых отношений пока нет.
                        </p>
                    ) : (
                        visibleEntries.map((entry) => (
                            <article
                                key={entry.id}
                                className={`relationship-card relation-${getRelationToneClass(
                                    entry.level,
                                )}`}
                            >
                                <div className="relationship-card-main">
                                    {canEdit ? (
                                        <input
                                            value={entry.title}
                                            onChange={(event) =>
                                                updateEntry(entry.id, {
                                                    title: event.target.value,
                                                })
                                            }
                                            placeholder="Название фракции / силы"
                                        />
                                    ) : (
                                        <h4>{entry.title}</h4>
                                    )}

                                    <span>{RELATION_LEVEL_LABELS[entry.level]}</span>
                                </div>

                                {canEdit && (
                                    <div className="relationship-card-actions">
                                        <button type="button" onClick={() => shiftEntry(entry.id, -1)}>
                                            −
                                        </button>

                                        <select
                                            value={entry.level}
                                            onChange={(event) =>
                                                updateEntry(entry.id, {
                                                    level: event.target.value as CampaignRelationLevel,
                                                })
                                            }
                                        >
                                            {RELATION_LEVELS.map((level) => (
                                                <option key={level} value={level}>
                                                    {RELATION_LEVEL_LABELS[level]}
                                                </option>
                                            ))}
                                        </select>

                                        <button type="button" onClick={() => shiftEntry(entry.id, 1)}>
                                            +
                                        </button>
                                    </div>
                                )}

                                {!isPlayerMode && (
                                    <label className="relationship-note-field">
                                        Заметка
                                        <textarea
                                            value={entry.note}
                                            onChange={(event) =>
                                                updateEntry(entry.id, {
                                                    note: event.target.value,
                                                })
                                            }
                                            readOnly={!canEdit}
                                            placeholder="Что они помнят, чего хотят, чем грозят, что могут дать..."
                                        />
                                    </label>
                                )}

                                {isPlayerMode && entry.note && (
                                    <p className="relationship-public-note">{entry.note}</p>
                                )}

                                {!isPlayerMode && (
                                    <div className="relationship-card-footer">
                                        <label className="relationship-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={entry.isVisibleToPlayers}
                                                onChange={(event) =>
                                                    updateEntry(entry.id, {
                                                        isVisibleToPlayers: event.target.checked,
                                                    })
                                                }
                                                disabled={!canEdit}
                                            />
                                            Видно игрокам
                                        </label>

                                        {canEdit && (
                                            <button
                                                className="relationship-delete-button"
                                                type="button"
                                                onClick={() => deleteRelation(entry.id)}
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                )}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}