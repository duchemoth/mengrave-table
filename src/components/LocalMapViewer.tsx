import { useEffect, useMemo, useRef, useState } from "react";
import { LootGeneratorModal } from "./LootGeneratorModal";
import type { ArsenalItem, CampaignFinding, ReferenceArticle } from "../types/campaign";

type JournalEntryDraft = {
    type: "expedition" | "map" | "scene" | "inventory" | "master" | "other";
    title: string;
    text: string;
    details?: string;
    isHiddenFromPlayers?: boolean;
};

export type LocalMapPointKind =
    | "interest"
    | "entrance"
    | "danger"
    | "hazard"
    | "object"
    | "npc"
    | "player"
    | "enemy"
    | "creature"
    | "corpse";

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
    linkedDossierId: string;

    isKeyScene: boolean;
    stakes: string;
    choices: string;
    findings: string;
    threat: string;
    consequences: string;
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
    dossierArticles: ReferenceArticle[];
    arsenalItems: ArsenalItem[];
    onOpenDossier: (articleId: string) => void;
    onShowToPlayers: () => void;
    onBackToOverview: () => void;
    onClose: () => void;
    onCreateJournalEntry: (entry: JournalEntryDraft) => void;
    onAddFindings: (findings: CampaignFinding[]) => void;
};

const ROOT_LOCAL_MAP_ID = "root";

const LOCAL_MAP_POINT_KIND_LABELS: Record<LocalMapPointKind, string> = {
    interest: "Интерес",
    entrance: "Вход",
    danger: "Опасность",
    hazard: "Активная угроза",
    object: "Объект",
    npc: "Персонаж",
    player: "Игрок",
    enemy: "Противник",
    creature: "Существо",
    corpse: "Труп",
};

function getLocalMapPointIcon(kind: LocalMapPointKind) {
    switch (kind) {
        case "entrance":
            return "⇣";
        case "danger":
            return "!";
        case "hazard":
            return "☣";
        case "object":
            return "◆";
        case "npc":
            return "♟";
        case "player":
            return "♟";
        case "enemy":
            return "♟";
        case "creature":
            return "☠";
        case "corpse":
            return "†";
        case "interest":
        default:
            return "?";
    }
}

const DRAGGABLE_LOCAL_MAP_POINT_KINDS: LocalMapPointKind[] = [
    "npc",
    "player",
    "enemy",
    "creature",
];

function isDraggableLocalMapPoint(kind: LocalMapPointKind) {
    return DRAGGABLE_LOCAL_MAP_POINT_KINDS.includes(kind);
}

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
            point.kind === "hazard" ||
            point.kind === "object" ||
            point.kind === "npc" ||
            point.kind === "player" ||
            point.kind === "enemy" ||
            point.kind === "creature" ||
            point.kind === "corpse" ||
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
        linkedDossierId:
            typeof point.linkedDossierId === "string" ? point.linkedDossierId : "",

        isKeyScene: Boolean(point.isKeyScene),
        stakes: typeof point.stakes === "string" ? point.stakes : "",
        choices: typeof point.choices === "string" ? point.choices : "",
        findings: typeof point.findings === "string" ? point.findings : "",
        threat: typeof point.threat === "string" ? point.threat : "",
        consequences:
            typeof point.consequences === "string" ? point.consequences : "",
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

    const hasRootLevel = normalizedLevels.some(
        (level) => level.id === ROOT_LOCAL_MAP_ID,
    );

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
        linkedDossierId: "",

        isKeyScene: false,
        stakes: "",
        choices: "",
        findings: "",
        threat: "",
        consequences: "",
    };
}

function hasText(value: string) {
    return value.trim().length > 0;
}

function shouldShowKeySceneFields(point: LocalMapPoint) {
    return (
        point.isKeyScene ||
        hasText(point.stakes) ||
        hasText(point.choices) ||
        hasText(point.findings) ||
        hasText(point.threat) ||
        hasText(point.consequences)
    );
}

export function LocalMapViewer({
    title,
    storageKey,
    isPlayerMode,
    canShowToPlayers,
    dossierArticles,
    arsenalItems,
    onOpenDossier,
    onShowToPlayers,
    onBackToOverview,
    onClose,
    onCreateJournalEntry,
    onAddFindings,
}: LocalMapViewerProps) {
    const [localMapLevels, setLocalMapLevels] = useState<LocalMapLevel[]>([
        createRootLocalMapLevel(),
    ]);
    const [activeLevelId, setActiveLevelId] = useState(ROOT_LOCAL_MAP_ID);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const [isPlacingPoint, setIsPlacingPoint] = useState(false);
    const [levelHistory, setLevelHistory] = useState<string[]>([]);

    const [isLootGeneratorOpen, setIsLootGeneratorOpen] = useState(false);
    const [lootGeneratorPointId, setLootGeneratorPointId] = useState<string | null>(null);

    const localMapFrameRef = useRef<HTMLDivElement | null>(null);

    const pointDragStateRef = useRef<{
        pointId: string;
        startClientX: number;
        startClientY: number;
        didMove: boolean;
    } | null>(null);

    const didJustDragPointRef = useRef(false);

    const [draggingPointId, setDraggingPointId] = useState<string | null>(null);

    const activeLevel =
        localMapLevels.find((level) => level.id === activeLevelId) ??
        localMapLevels[0] ??
        createRootLocalMapLevel();

    const visiblePoints = isPlayerMode
        ? activeLevel.points.filter((point) => !point.isSecret)
        : activeLevel.points;

    const selectedPoint =
        activeLevel.points.find((point) => point.id === selectedPointId) ?? null;

    const lootGeneratorPoint =
        activeLevel.points.find((point) => point.id === lootGeneratorPointId) ?? null;

    const entranceTargetLevel = useMemo(() => {
        if (!selectedPoint?.targetLocalMapId) {
            return null;
        }

        return (
            localMapLevels.find(
                (level) => level.id === selectedPoint.targetLocalMapId,
            ) ?? null
        );
    }, [localMapLevels, selectedPoint]);

    const linkedDossier = useMemo(() => {
        if (!selectedPoint?.linkedDossierId) {
            return null;
        }

        return (
            dossierArticles.find((article) => article.id === selectedPoint.linkedDossierId) ??
            null
        );
    }, [dossierArticles, selectedPoint]);

    useEffect(() => {
        if (!storageKey) {
            setLocalMapLevels([createRootLocalMapLevel()]);
            setActiveLevelId(ROOT_LOCAL_MAP_ID);
            setSelectedPointId(null);
            setIsPlacingPoint(false);
            setLevelHistory([]);
            setIsLootGeneratorOpen(false);
            setLootGeneratorPointId(null);
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
        setIsLootGeneratorOpen(false);
        setLootGeneratorPointId(null);
    }, [storageKey]);

    useEffect(() => {
        if (!draggingPointId) {
            return;
        }

        function handleMouseMove(event: MouseEvent) {
            const dragState = pointDragStateRef.current;
            const frameElement = localMapFrameRef.current;

            if (!dragState || !frameElement) {
                return;
            }

            const movementDistance = Math.hypot(
                event.clientX - dragState.startClientX,
                event.clientY - dragState.startClientY,
            );

            if (movementDistance > 4) {
                dragState.didMove = true;
            }

            const rect = frameElement.getBoundingClientRect();

            const x = clampLocalMapCoordinate(
                ((event.clientX - rect.left) / rect.width) * 100,
            );

            const y = clampLocalMapCoordinate(
                ((event.clientY - rect.top) / rect.height) * 100,
            );

            updatePointPosition(dragState.pointId, x, y);
        }

        function handleMouseUp() {
            const didMove = Boolean(pointDragStateRef.current?.didMove);

            if (didMove) {
                didJustDragPointRef.current = true;

                window.setTimeout(() => {
                    didJustDragPointRef.current = false;
                }, 0);
            }

            pointDragStateRef.current = null;
            setDraggingPointId(null);
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingPointId, activeLevel.id]);

    function saveDraft(
        nextLevels: LocalMapLevel[],
        nextActiveLevelId = activeLevelId,
    ) {
        if (!storageKey) {
            return;
        }

        const rootLevel =
            nextLevels.find((level) => level.id === ROOT_LOCAL_MAP_ID) ??
            nextLevels[0];

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

    function updatePointPosition(pointId: string, x: number, y: number) {
        updateLocalMapLevels((currentLevels) =>
            currentLevels.map((level) =>
                level.id === activeLevel.id
                    ? {
                        ...level,
                        points: level.points.map((point) =>
                            point.id === pointId ? { ...point, x, y } : point,
                        ),
                    }
                    : level,
            ),
        );
    }

    function startLocalMapPointDrag(
        event: React.MouseEvent<HTMLButtonElement>,
        point: LocalMapPoint,
    ) {
        if (
            isPlayerMode ||
            isPlacingPoint ||
            !isDraggableLocalMapPoint(point.kind)
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        pointDragStateRef.current = {
            pointId: point.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            didMove: false,
        };

        setSelectedPointId(point.id);
        setDraggingPointId(point.id);
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

    function insertGeneratedFindings(text: string) {
        if (!lootGeneratorPoint || !text.trim()) {
            return;
        }

        const nextFindings = [
            lootGeneratorPoint.findings.trim(),
            text.trim(),
        ]
            .filter(Boolean)
            .join("\n\n");

        updateLocalMapLevels((currentLevels) =>
            currentLevels.map((level) =>
                level.id === activeLevel.id
                    ? {
                        ...level,
                        points: level.points.map((point) =>
                            point.id === lootGeneratorPoint.id
                                ? {
                                    ...point,
                                    findings: nextFindings,
                                    isKeyScene: true,
                                }
                                : point,
                        ),
                    }
                    : level,
            ),
        );

        setSelectedPointId(lootGeneratorPoint.id);
        setIsLootGeneratorOpen(false);
        setLootGeneratorPointId(null);
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

    function createSelectedPointJournalEntry() {
        if (!selectedPoint || isPlayerMode) {
            return;
        }

        const pointKindLabel =
            LOCAL_MAP_POINT_KIND_LABELS[selectedPoint.kind] ?? selectedPoint.kind;

        const text = [
            `Локальная карта: ${title}.`,
            `Уровень: ${activeLevel.title}.`,
            `Точка: ${selectedPoint.title}.`,
            `Тип: ${pointKindLabel}.`,
            selectedPoint.description.trim()
                ? `Описание: ${selectedPoint.description.trim()}`
                : "",
            selectedPoint.stakes.trim()
                ? `Ставка: ${selectedPoint.stakes.trim()}`
                : "",
        ]
            .filter(Boolean)
            .join("\n");

        const details = [
            selectedPoint.choices.trim()
                ? `Варианты действий:\n${selectedPoint.choices.trim()}`
                : "",
            selectedPoint.findings.trim()
                ? `Находки / улики:\n${selectedPoint.findings.trim()}`
                : "",
            selectedPoint.threat.trim()
                ? `Угроза / давление:\n${selectedPoint.threat.trim()}`
                : "",
            selectedPoint.consequences.trim()
                ? `Последствия:\n${selectedPoint.consequences.trim()}`
                : "",
            selectedPoint.masterNotes.trim()
                ? `Заметки мастера:\n${selectedPoint.masterNotes.trim()}`
                : "",
            linkedDossier
                ? `Связанное досье: ${linkedDossier.title || "Без названия"}`
                : "",
            entranceTargetLevel
                ? `Переход: ${entranceTargetLevel.title}`
                : "",
        ]
            .filter(Boolean)
            .join("\n\n");

        onCreateJournalEntry({
            type: "scene",
            title: `${title} — ${selectedPoint.title}`,
            text: text || "Локальная точка зафиксирована в журнале.",
            details,
            isHiddenFromPlayers: selectedPoint.isSecret,
        });
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

        updateLocalMapLevels(
            (currentLevels) => [...currentLevels, nextLevel],
            nextLevel.id,
        );

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
        setIsLootGeneratorOpen(false);
        setLootGeneratorPointId(null);
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
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={goBackLevel}
                        >
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
                        <button
                            className="danger-button"
                            type="button"
                            onClick={deleteActiveLevel}
                        >
                            Удалить подуровень
                        </button>
                    )}
                </div>
            </div>

            <div className="local-map-layout">
                <section className="local-map-main">
                    <div
                        ref={localMapFrameRef}
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
                                    } ${point.isSecret ? "secret" : ""} ${point.isKeyScene ? "key-scene" : ""} ${isDraggableLocalMapPoint(point.kind) ? "draggable" : ""} ${draggingPointId === point.id ? "dragging" : ""}`}
                                type="button"
                                style={{
                                    left: `${point.x}%`,
                                    top: `${point.y}%`,
                                }}
                                title={
                                    point.targetLocalMapId
                                        ? `${point.title} — двойной клик для перехода`
                                        : point.title
                                }
                                onMouseDown={(event) => startLocalMapPointDrag(event, point)}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    if (didJustDragPointRef.current) {
                                        return;
                                    }

                                    setSelectedPointId(point.id);
                                }}
                                onDoubleClick={(event) => {
                                    event.stopPropagation();

                                    if (didJustDragPointRef.current) {
                                        return;
                                    }

                                    if (!point.targetLocalMapId) {
                                        return;
                                    }

                                    goToLevel(point.targetLocalMapId);
                                }}
                            >
                                <span className="local-map-point-icon">
                                    {getLocalMapPointIcon(point.kind)}
                                </span>

                                {point.isKeyScene && (
                                    <span className="local-map-point-key-badge">⋯</span>
                                )}

                                <span className="local-map-point-label">
                                    {point.title || "Без названия"}
                                </span>
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
                        {selectedPoint && (
                            <section className="local-map-card local-map-selected-point-card">
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
                                        onChange={(event) => {
                                            const nextKind = event.target.value as LocalMapPointKind;

                                            updateSelectedPoint({
                                                kind: nextKind,
                                                linkedDossierId:
                                                    nextKind === "npc" ? selectedPoint.linkedDossierId : "",
                                            });
                                        }}
                                    >
                                        <option value="interest">Интерес</option>
                                        <option value="entrance">Вход / переход</option>
                                        <option value="danger">Опасность</option>
                                        <option value="hazard">Активная угроза среды</option>
                                        <option value="object">Объект</option>
                                        <option value="npc">Персонаж / NPC</option>
                                        <option value="player">Игрок</option>
                                        <option value="enemy">Противник</option>
                                        <option value="creature">Существо</option>
                                        <option value="corpse">Труп</option>
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

                                <label className="local-map-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedPoint.isKeyScene}
                                        onChange={(event) =>
                                            updateSelectedPoint({ isKeyScene: event.target.checked })
                                        }
                                    />
                                    Ключевая сцена / выбор
                                </label>

                                {selectedPoint.kind === "npc" && (
                                    <label className="local-map-field">
                                        Связанное досье
                                        <select
                                            value={selectedPoint.linkedDossierId}
                                            onChange={(event) =>
                                                updateSelectedPoint({
                                                    linkedDossierId: event.target.value,
                                                })
                                            }
                                        >
                                            <option value="">Не привязано</option>
                                            {dossierArticles.map((article) => (
                                                <option key={article.id} value={article.id}>
                                                    {article.title || "Без названия"}
                                                    {article.subsection.trim()
                                                        ? ` · ${article.subsection.trim()}`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {linkedDossier && (
                                            <div className="local-map-dossier-actions">
                                                <p className="local-map-help">
                                                    Досье: {linkedDossier.title || "Без названия"}
                                                    {linkedDossier.visibility === "players"
                                                        ? " · видно игрокам"
                                                        : linkedDossier.visibility === "master"
                                                            ? " · мастер"
                                                            : " · эхо"}
                                                </p>

                                                <button
                                                    className="secondary-button"
                                                    type="button"
                                                    onClick={() => onOpenDossier(linkedDossier.id)}
                                                >
                                                    Открыть досье
                                                </button>
                                            </div>
                                        )}
                                    </label>
                                )}

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

                                {shouldShowKeySceneFields(selectedPoint) ? (
                                    <div className="local-map-key-scene-card">
                                        <div className="local-map-key-scene-header">
                                            <div>
                                                <p className="eyebrow">Структура сцены</p>
                                                <h4>Ставка, выбор, последствия</h4>
                                            </div>

                                            <span>
                                                {selectedPoint.isKeyScene ? "Ключевая" : "Заполнена"}
                                            </span>
                                        </div>

                                        <label className="local-map-field">
                                            Ставка
                                            <textarea
                                                value={selectedPoint.stakes}
                                                onChange={(event) =>
                                                    updateSelectedPoint({ stakes: event.target.value })
                                                }
                                                placeholder="Что здесь можно выиграть, потерять или изменить?"
                                            />
                                        </label>

                                        <label className="local-map-field">
                                            Варианты действий
                                            <textarea
                                                value={selectedPoint.choices}
                                                onChange={(event) =>
                                                    updateSelectedPoint({ choices: event.target.value })
                                                }
                                                placeholder="Какие решения доступны: спасать, вскрывать, бросить, рискнуть, торговаться..."
                                            />
                                        </label>

                                        <label className="local-map-field">
                                            Находки / улики
                                            <textarea
                                                value={selectedPoint.findings}
                                                onChange={(event) =>
                                                    updateSelectedPoint({ findings: event.target.value })
                                                }
                                                placeholder="Что можно найти: предметы, следы, свидетельства, ресурсы, зацепки..."
                                            />
                                        </label>

                                        <label className="local-map-field">
                                            Угроза / давление
                                            <textarea
                                                value={selectedPoint.threat}
                                                onChange={(event) =>
                                                    updateSelectedPoint({ threat: event.target.value })
                                                }
                                                placeholder="Что ухудшается со временем, при шуме, провале, жадности или промедлении?"
                                            />
                                        </label>

                                        <label className="local-map-field">
                                            Последствия
                                            <textarea
                                                value={selectedPoint.consequences}
                                                onChange={(event) =>
                                                    updateSelectedPoint({ consequences: event.target.value })
                                                }
                                                placeholder="Что изменится после решения: кто выжил, что сгорело, кто запомнил, что стало недоступно..."
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="local-map-key-scene-placeholder">
                                        <strong>Обычная точка</strong>
                                        <span>
                                            Включи “Ключевая сцена / выбор”, если у точки есть ставка,
                                            варианты действий, находки, угроза или последствия.
                                        </span>
                                    </div>
                                )}

                                <label className="local-map-field">
                                    Целевая подкарта
                                    <select
                                        value={selectedPoint.targetLocalMapId}
                                        onChange={(event) =>
                                            updateSelectedPoint({
                                                targetLocalMapId: event.target.value,
                                                kind: event.target.value
                                                    ? "entrance"
                                                    : selectedPoint.kind,
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

                                <div className="local-map-point-action-row">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={createSublevelFromSelectedPoint}
                                    >
                                        Создать подуровень из точки
                                    </button>

                                    {!isPlayerMode && (
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => {
                                                setLootGeneratorPointId(selectedPoint.id);
                                                setIsLootGeneratorOpen(true);
                                            }}
                                        >
                                            Сгенерировать находки
                                        </button>
                                    )}

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={createSelectedPointJournalEntry}
                                    >
                                        + В журнал
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
                                </div>
                            </section>
                        )}

                        <section className="local-map-card local-map-points-card">
                            <p className="eyebrow">Точки</p>
                            <h3>Точки и персонажи</h3>

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
                                                {point.kind === "npc" && point.linkedDossierId
                                                    ? ` · ${dossierArticles.find((article) => article.id === point.linkedDossierId)?.title ?? "досье"}`
                                                    : ""}
                                                {point.targetLocalMapId ? " · переход" : ""}
                                                {point.isKeyScene ? " · сцена" : ""}
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
                                        <small>
                                            {level.id === ROOT_LOCAL_MAP_ID ? "основная" : level.id}
                                        </small>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="local-map-card local-map-image-settings-card">
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
                                Для локальных файлов положи изображение в папку public/local-maps
                                и укажи путь от корня сайта, например /local-maps/1.png.
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

                            {(hasText(selectedPoint.stakes) ||
                                hasText(selectedPoint.choices) ||
                                hasText(selectedPoint.findings) ||
                                hasText(selectedPoint.threat) ||
                                hasText(selectedPoint.consequences)) && (
                                    <div className="local-map-point-briefing">
                                        {hasText(selectedPoint.stakes) && (
                                            <article>
                                                <strong>Ставка</strong>
                                                <p>{selectedPoint.stakes}</p>
                                            </article>
                                        )}

                                        {hasText(selectedPoint.choices) && !isPlayerMode && (
                                            <article>
                                                <strong>Варианты</strong>
                                                <p>{selectedPoint.choices}</p>
                                            </article>
                                        )}

                                        {hasText(selectedPoint.findings) && !isPlayerMode && (
                                            <article>
                                                <strong>Находки</strong>
                                                <p>{selectedPoint.findings}</p>
                                            </article>
                                        )}

                                        {hasText(selectedPoint.threat) && !isPlayerMode && (
                                            <article>
                                                <strong>Угроза</strong>
                                                <p>{selectedPoint.threat}</p>
                                            </article>
                                        )}

                                        {hasText(selectedPoint.consequences) && !isPlayerMode && (
                                            <article>
                                                <strong>Последствия</strong>
                                                <p>{selectedPoint.consequences}</p>
                                            </article>
                                        )}
                                    </div>
                                )}

                            {selectedPoint.kind === "npc" &&
                                linkedDossier &&
                                linkedDossier.visibility === "players" && (
                                    <div className="local-map-linked-dossier">
                                        <strong>Досье</strong>
                                        <span>{linkedDossier.title || "Без названия"}</span>
                                        {linkedDossier.content.trim().length > 0 && (
                                            <p>{linkedDossier.content.split("\n").find(Boolean)}</p>
                                        )}

                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => onOpenDossier(linkedDossier.id)}
                                        >
                                            Открыть досье
                                        </button>
                                    </div>
                                )}

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

            {lootGeneratorPoint && (
                <LootGeneratorModal
                    isOpen={isLootGeneratorOpen}
                    sourceTitle={`${activeLevel.title} — ${lootGeneratorPoint.title}`}
                    arsenalItems={arsenalItems}
                    onClose={() => {
                        setIsLootGeneratorOpen(false);
                        setLootGeneratorPointId(null);
                    }}
                    onInsertToFindings={insertGeneratedFindings}
                    onAddToFindings={onAddFindings}
                />
            )}
        </>
    );
}