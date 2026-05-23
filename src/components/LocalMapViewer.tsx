import { useEffect, useMemo, useState } from "react";

export type LocalMapPointKind = "interest" | "entrance" | "danger" | "object";

export type LocalMapPoint = {
    id: string;
    title: string;
    kind: LocalMapPointKind;
    x: number;
    y: number;
    description: string;
    masterNotes: string;
    isSecret: boolean;
    targetLocalMapId: string;
};

export type LocalMapLevel = {
    id: string;
    title: string;
    imageUrl: string;
    notes: string;
    points: LocalMapPoint[];
};

export type LocalMapDraft = {
    imageUrl: string;
    notes: string;
    points: LocalMapPoint[];
    levels?: LocalMapLevel[];
    activeLevelId?: string;
};

type LocalMapViewerProps = {
    title: string;
    storageKey: string | null;
    isPlayerMode: boolean;
    canShowToPlayers: boolean;
    onShowToPlayers: () => void;
    onBackToOverview: () => void;
    onClose: () => void;
};

const ROOT_LOCAL_MAP_ID = "root";

const LOCAL_MAP_POINT_KIND_LABELS: Record<LocalMapPointKind, string> = {
    interest: "Интерес",
    entrance: "Вход",
    danger: "Опасность",
    object: "Объект",
};

function clampLocalMapCoordinate(value: number) {
    return Math.max(0, Math.min(100, value));
}

function createRootLocalMapLevel(): LocalMapLevel {
    return {
        id: ROOT_LOCAL_MAP_ID,
        title: "Основная карта",
        imageUrl: "",
        notes: "",
        points: [],
    };
}

function createLocalMapLevel(title = "Новая подлокация"): LocalMapLevel {
    return {
        id: `local-map-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        imageUrl: "",
        notes: "",
        points: [],
    };
}

function normalizeLocalMapPoint(value: unknown): LocalMapPoint | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const point = value as Partial<LocalMapPoint>;

    const kind: LocalMapPointKind =
        point.kind === "entrance" ||
            point.kind === "danger" ||
            point.kind === "object" ||
            point.kind === "interest"
            ? point.kind
            : "interest";

    return {
        id:
            typeof point.id === "string" && point.id.trim().length > 0
                ? point.id
                : `local-point-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title:
            typeof point.title === "string" && point.title.trim().length > 0
                ? point.title
                : "Точка интереса",
        kind,
        x:
            typeof point.x === "number" && Number.isFinite(point.x)
                ? clampLocalMapCoordinate(point.x)
                : 50,
        y:
            typeof point.y === "number" && Number.isFinite(point.y)
                ? clampLocalMapCoordinate(point.y)
                : 50,
        description: typeof point.description === "string" ? point.description : "",
        masterNotes: typeof point.masterNotes === "string" ? point.masterNotes : "",
        isSecret: Boolean(point.isSecret),
        targetLocalMapId:
            typeof point.targetLocalMapId === "string" ? point.targetLocalMapId : "",
    };
}

function normalizeLocalMapPoints(value: unknown): LocalMapPoint[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(normalizeLocalMapPoint)
        .filter((point): point is LocalMapPoint => point !== null);
}

function normalizeLocalMapLevel(value: unknown): LocalMapLevel | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const level = value as Partial<LocalMapLevel>;

    return {
        id:
            typeof level.id === "string" && level.id.trim().length > 0
                ? level.id
                : `local-map-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title:
            typeof level.title === "string" && level.title.trim().length > 0
                ? level.title
                : "Локальная карта",
        imageUrl: typeof level.imageUrl === "string" ? level.imageUrl : "",
        notes: typeof level.notes === "string" ? level.notes : "",
        points: normalizeLocalMapPoints(level.points),
    };
}

function normalizeLocalMapLevels(value: unknown): LocalMapLevel[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const normalizedLevels = value
        .map(normalizeLocalMapLevel)
        .filter((level): level is LocalMapLevel => level !== null);

    if (normalizedLevels.length === 0) {
        return [createRootLocalMapLevel()];
    }

    const hasRootLevel = normalizedLevels.some((level) => level.id === ROOT_LOCAL_MAP_ID);

    if (hasRootLevel) {
        return normalizedLevels;
    }

    return [
        {
            ...createRootLocalMapLevel(),
            title: "Основная карта",
        },
        ...normalizedLevels,
    ];
}

function loadLocalMapDraft(storageKey: string): LocalMapDraft {
    try {
        const savedLocalMap = localStorage.getItem(storageKey);

        if (!savedLocalMap) {
            return {
                imageUrl: "",
                notes: "",
                points: [],
                levels: [createRootLocalMapLevel()],
                activeLevelId: ROOT_LOCAL_MAP_ID,
            };
        }

        const parsedLocalMap = JSON.parse(savedLocalMap) as Partial<LocalMapDraft>;

        if (Array.isArray(parsedLocalMap.levels)) {
            const levels = normalizeLocalMapLevels(parsedLocalMap.levels);
            const activeLevelId =
                typeof parsedLocalMap.activeLevelId === "string" &&
                    levels.some((level) => level.id === parsedLocalMap.activeLevelId)
                    ? parsedLocalMap.activeLevelId
                    : levels[0]?.id ?? ROOT_LOCAL_MAP_ID;

            return {
                imageUrl: "",
                notes: "",
                points: [],
                levels,
                activeLevelId,
            };
        }

        const migratedRootLevel: LocalMapLevel = {
            id: ROOT_LOCAL_MAP_ID,
            title: "Основная карта",
            imageUrl: parsedLocalMap.imageUrl ?? "",
            notes: parsedLocalMap.notes ?? "",
            points: normalizeLocalMapPoints(parsedLocalMap.points),
        };

        return {
            imageUrl: migratedRootLevel.imageUrl,
            notes: migratedRootLevel.notes,
            points: migratedRootLevel.points,
            levels: [migratedRootLevel],
            activeLevelId: ROOT_LOCAL_MAP_ID,
        };
    } catch {
        return {
            imageUrl: "",
            notes: "",
            points: [],
            levels: [createRootLocalMapLevel()],
            activeLevelId: ROOT_LOCAL_MAP_ID,
        };
    }
}

function saveLocalMapDraft(storageKey: string, draft: LocalMapDraft) {
    localStorage.setItem(storageKey, JSON.stringify(draft));
}

function createLocalMapPoint(x: number, y: number): LocalMapPoint {
    return {
        id: `local-point-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: "Новая точка",
        kind: "interest",
        x,
        y,
        description: "",
        masterNotes: "",
        isSecret: false,
        targetLocalMapId: "",
    };
}

export function LocalMapViewer({
    storageKey,
    isPlayerMode,
    canShowToPlayers,
    onShowToPlayers,
    onBackToOverview,
    onClose,
}: LocalMapViewerProps) {
    const [localMapLevels, setLocalMapLevels] = useState<LocalMapLevel[]>([
        createRootLocalMapLevel(),
    ]);
    const [activeLevelId, setActiveLevelId] = useState(ROOT_LOCAL_MAP_ID);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [isPlacingPoint, setIsPlacingPoint] = useState(false);
    const [levelHistory, setLevelHistory] = useState<string[]>([]);

    const activeLevel =
        localMapLevels.find((level) => level.id === activeLevelId) ??
        localMapLevels[0] ??
        createRootLocalMapLevel();

    const visiblePoints = isPlayerMode
        ? activeLevel.points.filter((point) => !point.isSecret)
        : activeLevel.points;

    const selectedPoint =
        activeLevel.points.find((point) => point.id === selectedPointId) ?? null;

    const entranceTargetLevel = useMemo(() => {
        if (!selectedPoint?.targetLocalMapId) {
            return null;
        }

        return (
            localMapLevels.find((level) => level.id === selectedPoint.targetLocalMapId) ??
            null
        );
    }, [localMapLevels, selectedPoint]);

    useEffect(() => {
        if (!storageKey) {
            setLocalMapLevels([createRootLocalMapLevel()]);
            setActiveLevelId(ROOT_LOCAL_MAP_ID);
            setSelectedPointId(null);
            setIsPlacingPoint(false);
            setLevelHistory([]);
            return;
        }

        const savedLocalMap = loadLocalMapDraft(storageKey);
        const nextLevels = savedLocalMap.levels?.length
            ? savedLocalMap.levels
            : [createRootLocalMapLevel()];

        const nextActiveLevelId =
            savedLocalMap.activeLevelId &&
                nextLevels.some((level) => level.id === savedLocalMap.activeLevelId)
                ? savedLocalMap.activeLevelId
                : nextLevels[0]?.id ?? ROOT_LOCAL_MAP_ID;

        setLocalMapLevels(nextLevels);
        setActiveLevelId(nextActiveLevelId);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
        setLevelHistory([]);
    }, [storageKey]);

    function saveDraft(nextLevels: LocalMapLevel[], nextActiveLevelId = activeLevelId) {
        if (!storageKey) {
            return;
        }

        const rootLevel =
            nextLevels.find((level) => level.id === ROOT_LOCAL_MAP_ID) ?? nextLevels[0];

        saveLocalMapDraft(storageKey, {
            imageUrl: rootLevel?.imageUrl ?? "",
            notes: rootLevel?.notes ?? "",
            points: rootLevel?.points ?? [],
            levels: nextLevels,
            activeLevelId: nextActiveLevelId,
        });
    }

    function updateLocalMapLevels(
        updater: (currentLevels: LocalMapLevel[]) => LocalMapLevel[],
        nextActiveLevelId = activeLevelId,
    ) {
        setLocalMapLevels((currentLevels) => {
            const nextLevels = updater(currentLevels);
            saveDraft(nextLevels, nextActiveLevelId);
            return nextLevels;
        });
    }

    function updateActiveLevel(updatedFields: Partial<LocalMapLevel>) {
        updateLocalMapLevels((currentLevels) =>
            currentLevels.map((level) =>
                level.id === activeLevel.id ? { ...level, ...updatedFields } : level,
            ),
        );
    }

    function updateActiveLevelPoints(nextPoints: LocalMapPoint[]) {
        updateActiveLevel({
            points: nextPoints,
        });
    }

    function updateLocalMapImageUrl(nextImageUrl: string) {
        updateActiveLevel({
            imageUrl: nextImageUrl,
        });
    }

    function updateLocalMapNotes(nextNotes: string) {
        updateActiveLevel({
            notes: nextNotes,
        });
    }

    function removeLocalMapImage() {
        updateLocalMapImageUrl("");
    }

    function handleLocalMapClick(event: React.MouseEvent<HTMLDivElement>) {
        if (isPlayerMode || !isPlacingPoint) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const x = clampLocalMapCoordinate(
            ((event.clientX - rect.left) / rect.width) * 100,
        );

        const y = clampLocalMapCoordinate(
            ((event.clientY - rect.top) / rect.height) * 100,
        );

        const newPoint = createLocalMapPoint(x, y);

        updateActiveLevelPoints([...activeLevel.points, newPoint]);
        setSelectedPointId(newPoint.id);
        setIsPlacingPoint(false);
    }

    function updateSelectedPoint(updatedFields: Partial<LocalMapPoint>) {
        if (!selectedPoint) {
            return;
        }

        const nextPoints = activeLevel.points.map((point) =>
            point.id === selectedPoint.id ? { ...point, ...updatedFields } : point,
        );

        updateActiveLevelPoints(nextPoints);
    }

    function deleteSelectedPoint() {
        if (!selectedPoint) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить точку «${selectedPoint.title}»?`,
        );

        if (!shouldDelete) {
            return;
        }

        updateActiveLevelPoints(
            activeLevel.points.filter((point) => point.id !== selectedPoint.id),
        );

        setSelectedPointId(null);
    }

    function createSublevelFromSelectedPoint() {
        if (!selectedPoint) {
            return;
        }

        const nextLevel = createLocalMapLevel(selectedPoint.title || "Подлокация");

        updateLocalMapLevels((currentLevels) => {
            return [
                ...currentLevels.map((level) =>
                    level.id === activeLevel.id
                        ? {
                            ...level,
                            points: level.points.map((point): LocalMapPoint =>
                                point.id === selectedPoint.id
                                    ? {
                                        ...point,
                                        kind: "entrance" as LocalMapPointKind,
                                        targetLocalMapId: nextLevel.id,
                                    }
                                    : point,
                            ),
                        }
                        : level,
                ),
                nextLevel,
            ];
        });

        setSelectedPointId(selectedPoint.id);
    }

    function createEmptySublevel() {
        const nextLevel = createLocalMapLevel();

        updateLocalMapLevels((currentLevels) => [...currentLevels, nextLevel], nextLevel.id);

        setActiveLevelId(nextLevel.id);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
        setLevelHistory((currentHistory) => [...currentHistory, activeLevel.id]);
    }

    function goToLevel(nextLevelId: string) {
        if (!localMapLevels.some((level) => level.id === nextLevelId)) {
            return;
        }

        setLevelHistory((currentHistory) => [...currentHistory, activeLevel.id]);
        setActiveLevelId(nextLevelId);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
        saveDraft(localMapLevels, nextLevelId);
    }

    function goBackLevel() {
        const previousLevelId = levelHistory[levelHistory.length - 1];

        if (!previousLevelId) {
            return;
        }

        setLevelHistory((currentHistory) => currentHistory.slice(0, -1));
        setActiveLevelId(previousLevelId);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
        saveDraft(localMapLevels, previousLevelId);
    }

    function deleteActiveLevel() {
        if (activeLevel.id === ROOT_LOCAL_MAP_ID) {
            window.alert("Основную локальную карту удалить нельзя.");
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить локальную карту «${activeLevel.title}»? Входы на неё будут отвязаны.`,
        );

        if (!shouldDelete) {
            return;
        }

        const nextLevels = localMapLevels
            .filter((level) => level.id !== activeLevel.id)
            .map((level) => ({
                ...level,
                points: level.points.map((point) =>
                    point.targetLocalMapId === activeLevel.id
                        ? { ...point, targetLocalMapId: "" }
                        : point,
                ),
            }));

        const nextActiveLevelId = ROOT_LOCAL_MAP_ID;

        setLocalMapLevels(nextLevels);
        setActiveLevelId(nextActiveLevelId);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
        setLevelHistory([]);
        saveDraft(nextLevels, nextActiveLevelId);
    }

    return (
        <>
            <div className="local-map-level-bar">
                <div>
                    <p className="eyebrow">Уровень локальной карты</p>
                    <strong>{activeLevel.title}</strong>
                </div>

                <div className="local-map-level-actions">
                    {levelHistory.length > 0 && (
                        <button className="secondary-button" type="button" onClick={goBackLevel}>
                            Назад
                        </button>
                    )}

                    {!isPlayerMode && (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={createEmptySublevel}
                        >
                            Новая подкарта
                        </button>
                    )}

                    {!isPlayerMode && activeLevel.id !== ROOT_LOCAL_MAP_ID && (
                        <button className="danger-button" type="button" onClick={deleteActiveLevel}>
                            Удалить подуровень
                        </button>
                    )}
                </div>
            </div>

            <div className="local-map-layout">
                <section className="local-map-main">
                    <div
                        className={`local-map-frame ${isPlacingPoint ? "placing-point" : ""
                            }`}
                        onClick={handleLocalMapClick}
                    >
                        {activeLevel.imageUrl.trim().length > 0 ? (
                            <img
                                className="local-map-image"
                                src={activeLevel.imageUrl.trim()}
                                alt={`Локальная карта: ${activeLevel.title}`}
                            />
                        ) : (
                            <div className="local-map-empty">
                                <p className="eyebrow">1920 × 1080 · 16:9</p>
                                <h3>Локальная карта не назначена</h3>
                                <p>
                                    Позже здесь будет горизонтальная карта сцены: тракт, руины,
                                    форт, двор, зал, переправа или другой участок.
                                </p>
                            </div>
                        )}

                        {visiblePoints.map((point) => (
                            <button
                                key={point.id}
                                className={`local-map-point local-map-point-${point.kind} ${selectedPointId === point.id ? "selected" : ""
                                    } ${point.isSecret ? "secret" : ""}`}
                                type="button"
                                style={{
                                    left: `${point.x}%`,
                                    top: `${point.y}%`,
                                }}
                                title={point.title}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedPointId(point.id);
                                }}
                            >
                                {point.kind === "entrance"
                                    ? "⇣"
                                    : point.kind === "danger"
                                        ? "!"
                                        : point.kind === "object"
                                            ? "◆"
                                            : "?"}
                            </button>
                        ))}

                        {!isPlayerMode && isPlacingPoint && (
                            <div className="local-map-place-hint">
                                Кликни по локальной карте, чтобы поставить точку
                            </div>
                        )}
                    </div>
                </section>

                {!isPlayerMode && (
                    <aside className="local-map-sidebar">
                        <section className="local-map-card">
                            <p className="eyebrow">Карты объекта</p>
                            <h3>Подлокации</h3>

                            <div className="local-map-level-list">
                                {localMapLevels.map((level) => (
                                    <button
                                        key={level.id}
                                        className={`local-map-level-list-item ${activeLevel.id === level.id ? "active" : ""
                                            }`}
                                        type="button"
                                        onClick={() => {
                                            setActiveLevelId(level.id);
                                            setSelectedPointId(null);
                                            setIsPlacingPoint(false);
                                            saveDraft(localMapLevels, level.id);
                                        }}
                                    >
                                        <span>{level.title}</span>
                                        <small>{level.id === ROOT_LOCAL_MAP_ID ? "основная" : level.id}</small>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="local-map-card">
                            <p className="eyebrow">Фон карты</p>
                            <h3>Изображение</h3>

                            <label className="local-map-field">
                                Название карты
                                <input
                                    value={activeLevel.title}
                                    onChange={(event) =>
                                        updateActiveLevel({ title: event.target.value })
                                    }
                                    placeholder="Комендатура"
                                />
                            </label>

                            <label className="local-map-field">
                                Путь или ссылка на картинку
                                <input
                                    value={activeLevel.imageUrl}
                                    onChange={(event) =>
                                        updateLocalMapImageUrl(event.target.value)
                                    }
                                    placeholder="/local-maps/old-harbor.webp"
                                />
                            </label>

                            <p className="local-map-help">
                                Для локальных файлов положи изображение в папку public/local-maps и
                                укажи путь от корня сайта, например /local-maps/1.png.
                            </p>

                            {activeLevel.imageUrl.trim().length > 0 && (
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
                            <p className="eyebrow">Точки</p>
                            <h3>Интересы и входы</h3>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setIsPlacingPoint((current) => !current)}
                            >
                                {isPlacingPoint ? "Отменить точку" : "Добавить точку"}
                            </button>

                            {activeLevel.points.length > 0 ? (
                                <div className="local-map-point-list">
                                    {activeLevel.points.map((point) => (
                                        <button
                                            key={point.id}
                                            className={`local-map-point-list-item ${selectedPointId === point.id ? "active" : ""
                                                }`}
                                            type="button"
                                            onClick={() => setSelectedPointId(point.id)}
                                        >
                                            <span>{point.title}</span>
                                            <small>
                                                {LOCAL_MAP_POINT_KIND_LABELS[point.kind]}
                                                {point.targetLocalMapId ? " · переход" : ""}
                                                {point.isSecret ? " · скрыто" : ""}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="local-map-help">
                                    Точек пока нет. Нажми “Добавить точку”, затем кликни по карте.
                                </p>
                            )}
                        </section>

                        {selectedPoint && (
                            <section className="local-map-card">
                                <p className="eyebrow">Выбранная точка</p>
                                <h3>{selectedPoint.title}</h3>

                                <label className="local-map-field">
                                    Название
                                    <input
                                        value={selectedPoint.title}
                                        onChange={(event) =>
                                            updateSelectedPoint({ title: event.target.value })
                                        }
                                        placeholder="Северный вход"
                                    />
                                </label>

                                <label className="local-map-field">
                                    Тип
                                    <select
                                        value={selectedPoint.kind}
                                        onChange={(event) =>
                                            updateSelectedPoint({
                                                kind: event.target.value as LocalMapPointKind,
                                            })
                                        }
                                    >
                                        <option value="interest">Интерес</option>
                                        <option value="entrance">Вход / переход</option>
                                        <option value="danger">Опасность</option>
                                        <option value="object">Объект</option>
                                    </select>
                                </label>

                                <label className="local-map-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedPoint.isSecret}
                                        onChange={(event) =>
                                            updateSelectedPoint({ isSecret: event.target.checked })
                                        }
                                    />
                                    Скрыто от игроков
                                </label>

                                <label className="local-map-field">
                                    Описание для игроков
                                    <textarea
                                        value={selectedPoint.description}
                                        onChange={(event) =>
                                            updateSelectedPoint({ description: event.target.value })
                                        }
                                        placeholder="Что видно, слышно или понятно при осмотре точки."
                                    />
                                </label>

                                <label className="local-map-field">
                                    Заметки мастера
                                    <textarea
                                        value={selectedPoint.masterNotes}
                                        onChange={(event) =>
                                            updateSelectedPoint({ masterNotes: event.target.value })
                                        }
                                        placeholder="Ловушки, проверки, скрытые детали, последствия."
                                    />
                                </label>

                                <label className="local-map-field">
                                    Целевая подкарта
                                    <select
                                        value={selectedPoint.targetLocalMapId}
                                        onChange={(event) =>
                                            updateSelectedPoint({
                                                targetLocalMapId: event.target.value,
                                                kind: event.target.value ? "entrance" : selectedPoint.kind,
                                            })
                                        }
                                    >
                                        <option value="">Нет перехода</option>
                                        {localMapLevels
                                            .filter((level) => level.id !== activeLevel.id)
                                            .map((level) => (
                                                <option key={level.id} value={level.id}>
                                                    {level.title}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={createSublevelFromSelectedPoint}
                                >
                                    Создать подуровень из точки
                                </button>

                                {entranceTargetLevel && (
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => goToLevel(entranceTargetLevel.id)}
                                    >
                                        Перейти: {entranceTargetLevel.title}
                                    </button>
                                )}

                                <button
                                    className="danger-button"
                                    type="button"
                                    onClick={deleteSelectedPoint}
                                >
                                    Удалить точку
                                </button>
                            </section>
                        )}

                        <section className="local-map-card">
                            <p className="eyebrow">Для мастера</p>
                            <h3>Заметки к карте</h3>

                            <textarea
                                className="local-map-notes"
                                value={activeLevel.notes}
                                onChange={(event) => updateLocalMapNotes(event.target.value)}
                                placeholder="Входы, укрытия, опасные зоны, засады, запертые двери, шумы, маршруты отхода."
                            />
                        </section>
                    </aside>
                )}

                {isPlayerMode && selectedPoint && (
                    <aside className="local-map-sidebar">
                        <section className="local-map-card">
                            <p className="eyebrow">
                                {LOCAL_MAP_POINT_KIND_LABELS[selectedPoint.kind]}
                            </p>
                            <h3>{selectedPoint.title}</h3>

                            <p>
                                {selectedPoint.description.trim().length > 0
                                    ? selectedPoint.description
                                    : "Описание точки пока не добавлено."}
                            </p>

                            {entranceTargetLevel && (
                                <button
                                    className="secondary-button"
                                    type="button"
                                    onClick={() => goToLevel(entranceTargetLevel.id)}
                                >
                                    Войти: {entranceTargetLevel.title}
                                </button>
                            )}
                        </section>
                    </aside>
                )}
            </div>

            <footer className="encounter-actions">
                {canShowToPlayers && (
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={onShowToPlayers}
                    >
                        Показать карту игрокам
                    </button>
                )}

                <button
                    className="secondary-button"
                    type="button"
                    onClick={onBackToOverview}
                >
                    Вернуться к обзору
                </button>

                <button className="secondary-button" type="button" onClick={onClose}>
                    Закрыть
                </button>
            </footer>
        </>
    );
}