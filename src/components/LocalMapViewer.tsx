import { useEffect, useState } from "react";

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

export type LocalMapDraft = {
    imageUrl: string;
    notes: string;
    points: LocalMapPoint[];
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

const LOCAL_MAP_POINT_KIND_LABELS: Record<LocalMapPointKind, string> = {
    interest: "Интерес",
    entrance: "Вход",
    danger: "Опасность",
    object: "Объект",
};

function clampLocalMapCoordinate(value: number) {
    return Math.max(0, Math.min(100, value));
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

function loadLocalMapDraft(storageKey: string): LocalMapDraft {
    try {
        const savedLocalMap = localStorage.getItem(storageKey);

        if (!savedLocalMap) {
            return {
                imageUrl: "",
                notes: "",
                points: [],
            };
        }

        const parsedLocalMap = JSON.parse(savedLocalMap) as Partial<LocalMapDraft>;

        return {
            imageUrl: parsedLocalMap.imageUrl ?? "",
            notes: parsedLocalMap.notes ?? "",
            points: normalizeLocalMapPoints(parsedLocalMap.points),
        };
    } catch {
        return {
            imageUrl: "",
            notes: "",
            points: [],
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
    title,
    storageKey,
    isPlayerMode,
    canShowToPlayers,
    onShowToPlayers,
    onBackToOverview,
    onClose,
}: LocalMapViewerProps) {
    const [localMapImageUrl, setLocalMapImageUrl] = useState("");
    const [localMapNotes, setLocalMapNotes] = useState("");
    const [localMapPoints, setLocalMapPoints] = useState<LocalMapPoint[]>([]);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [isPlacingPoint, setIsPlacingPoint] = useState(false);

    const visiblePoints = isPlayerMode
        ? localMapPoints.filter((point) => !point.isSecret)
        : localMapPoints;

    const selectedPoint =
        localMapPoints.find((point) => point.id === selectedPointId) ?? null;

    useEffect(() => {
        if (!storageKey) {
            setLocalMapImageUrl("");
            setLocalMapNotes("");
            setLocalMapPoints([]);
            setSelectedPointId(null);
            setIsPlacingPoint(false);
            return;
        }

        const savedLocalMap = loadLocalMapDraft(storageKey);

        setLocalMapImageUrl(savedLocalMap.imageUrl);
        setLocalMapNotes(savedLocalMap.notes);
        setLocalMapPoints(savedLocalMap.points);
        setSelectedPointId(null);
        setIsPlacingPoint(false);
    }, [storageKey]);

    function saveDraft(nextDraft: LocalMapDraft) {
        if (!storageKey) {
            return;
        }

        saveLocalMapDraft(storageKey, nextDraft);
    }

    function updateLocalMapImageUrl(nextImageUrl: string) {
        setLocalMapImageUrl(nextImageUrl);

        saveDraft({
            imageUrl: nextImageUrl,
            notes: localMapNotes,
            points: localMapPoints,
        });
    }

    function updateLocalMapNotes(nextNotes: string) {
        setLocalMapNotes(nextNotes);

        saveDraft({
            imageUrl: localMapImageUrl,
            notes: nextNotes,
            points: localMapPoints,
        });
    }

    function updateLocalMapPoints(nextPoints: LocalMapPoint[]) {
        setLocalMapPoints(nextPoints);

        saveDraft({
            imageUrl: localMapImageUrl,
            notes: localMapNotes,
            points: nextPoints,
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

        updateLocalMapPoints([...localMapPoints, newPoint]);
        setSelectedPointId(newPoint.id);
        setIsPlacingPoint(false);
    }

    function updateSelectedPoint(updatedFields: Partial<LocalMapPoint>) {
        if (!selectedPoint) {
            return;
        }

        const nextPoints = localMapPoints.map((point) =>
            point.id === selectedPoint.id ? { ...point, ...updatedFields } : point,
        );

        updateLocalMapPoints(nextPoints);
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

        updateLocalMapPoints(
            localMapPoints.filter((point) => point.id !== selectedPoint.id),
        );

        setSelectedPointId(null);
    }

    return (
        <>
            <div className="local-map-layout">
                <section className="local-map-main">
                    <div
                        className={`local-map-frame ${isPlacingPoint ? "placing-point" : ""
                            }`}
                        onClick={handleLocalMapClick}
                    >
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
                                Рекомендуемый стандарт: 1920×1080, WebP или JPEG. Для локальных
                                файлов положи изображение в папку public/local-maps и укажи путь
                                от корня сайта.
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
                            <p className="eyebrow">Точки</p>
                            <h3>Интересы и входы</h3>

                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setIsPlacingPoint((current) => !current)}
                            >
                                {isPlacingPoint ? "Отменить точку" : "Добавить точку"}
                            </button>

                            {localMapPoints.length > 0 ? (
                                <div className="local-map-point-list">
                                    {localMapPoints.map((point) => (
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
                                    ID целевой локальной карты
                                    <input
                                        value={selectedPoint.targetLocalMapId}
                                        onChange={(event) =>
                                            updateSelectedPoint({
                                                targetLocalMapId: event.target.value,
                                            })
                                        }
                                        placeholder="Например: barracks-interior"
                                    />
                                </label>

                                <p className="local-map-help">
                                    Поле ID пока только задел под подуровни. Следующим коммитом
                                    сделаем переходы между локальными картами.
                                </p>

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
                                value={localMapNotes}
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