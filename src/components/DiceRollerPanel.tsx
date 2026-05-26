import { useMemo, useState } from "react";
import type { SessionJournalEntryType } from "./panels/SessionJournalPanel";

type JournalEntryDraft = {
    type: SessionJournalEntryType;
    title: string;
    text: string;
    details?: string;
    isHiddenFromPlayers?: boolean;
};

type DiceRollerPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreateJournalEntry: (entry: JournalEntryDraft) => void;
};

type RollVisibility = "hidden" | "open";

type RollHistoryEntry = {
    id: string;
    createdAt: number;
    title: string;
    summary: string;
    details: string;
    visibility: RollVisibility;
};

const DIFFICULTY_PRESETS = [
    { value: 5, label: "5", hint: "Очень легко" },
    { value: 10, label: "10", hint: "Нормально" },
    { value: 15, label: "15", hint: "Трудно" },
    { value: 20, label: "20", hint: "Очень трудно" },
    { value: 25, label: "25", hint: "Почти невозможно" },
];

const SIMPLE_DICE = [4, 6, 8, 10, 12, 20, 100];

function rollDie(sides: number) {
    return Math.floor(Math.random() * sides) + 1;
}

function getRollQuality(total: number, difficulty: number) {
    const margin = total - difficulty;

    if (margin <= -10) {
        return {
            label: "Катастрофа",
            text: "Провал на 10+: тяжёлая цена, серьёзное осложнение или новая угроза.",
            margin,
            isSuccess: false,
        };
    }

    if (margin <= -5) {
        return {
            label: "Явный провал",
            text: "Провал на 5–9: действие не удалось, ситуация заметно ухудшается.",
            margin,
            isSuccess: false,
        };
    }

    if (margin < 0) {
        return {
            label: "Почти получилось",
            text: "Провал на 1–4: можно дать частичный результат, но с ценой.",
            margin,
            isSuccess: false,
        };
    }

    if (margin <= 4) {
        return {
            label: "Успех",
            text: "Успех на 0–4: персонаж получает желаемое без большого преимущества.",
            margin,
            isSuccess: true,
        };
    }

    if (margin <= 9) {
        return {
            label: "Хороший успех",
            text: "Успех на 5–9: результат лучше обычного, можно дать преимущество или сэкономить ресурс.",
            margin,
            isSuccess: true,
        };
    }

    return {
        label: "Сильный успех",
        text: "Успех на 10+: чистый результат, сильное преимущество или дополнительная выгода.",
        margin,
        isSuccess: true,
    };
}

function formatRollTime(timestamp: number) {
    return new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(timestamp));
}

export function DiceRollerPanel({
    isOpen,
    onClose,
    onCreateJournalEntry,
}: DiceRollerPanelProps) {
    const [checkTitle, setCheckTitle] = useState("Проверка");
    const [skillBonus, setSkillBonus] = useState(0);
    const [modifier, setModifier] = useState(0);
    const [difficulty, setDifficulty] = useState(15);
    const [visibility, setVisibility] = useState<RollVisibility>("hidden");

    const [simpleDiceCount, setSimpleDiceCount] = useState(1);
    const [simpleDiceModifier, setSimpleDiceModifier] = useState(0);

    const [history, setHistory] = useState<RollHistoryEntry[]>([]);

    const latestRoll = history[0] ?? null;

    const difficultyLabel = useMemo(() => {
        return (
            DIFFICULTY_PRESETS.find((preset) => preset.value === difficulty)?.hint ??
            "Пользовательская"
        );
    }, [difficulty]);

    function addHistoryEntry(entry: Omit<RollHistoryEntry, "id" | "createdAt">) {
        setHistory((currentHistory) => [
            {
                ...entry,
                id: `roll-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                createdAt: Date.now(),
            },
            ...currentHistory,
        ].slice(0, 12));
    }

    function rollCheck() {
        const d20 = rollDie(20);
        const total = d20 + skillBonus + modifier;
        const quality = getRollQuality(total, difficulty);

        const title = checkTitle.trim() || "Проверка";

        const summary = `${title}: d20 ${d20} + навык ${skillBonus >= 0 ? "+" : ""}${skillBonus} + модификатор ${modifier >= 0 ? "+" : ""}${modifier} = ${total} против ${difficulty}. ${quality.label}.`;

        const details = [
            `Бросок: d20 = ${d20}`,
            `Навык / бонус: ${skillBonus >= 0 ? "+" : ""}${skillBonus}`,
            `Модификатор: ${modifier >= 0 ? "+" : ""}${modifier}`,
            `Итого: ${total}`,
            `Сложность: ${difficulty} (${difficultyLabel})`,
            `Разница: ${quality.margin >= 0 ? "+" : ""}${quality.margin}`,
            "",
            quality.text,
        ].join("\n");

        addHistoryEntry({
            title,
            summary,
            details,
            visibility,
        });
    }

    function rollSimpleDie(sides: number) {
        const count = Math.max(1, Math.min(20, Math.floor(simpleDiceCount)));
        const rolls = Array.from({ length: count }, () => rollDie(sides));
        const rawTotal = rolls.reduce((sum, value) => sum + value, 0);
        const total = rawTotal + simpleDiceModifier;

        const title = `${count}d${sides}${simpleDiceModifier !== 0 ? ` ${simpleDiceModifier >= 0 ? "+" : ""}${simpleDiceModifier}` : ""}`;

        const summary = `${title} = ${total}.`;

        const details = [
            `Кости: ${rolls.join(", ")}`,
            `Сумма костей: ${rawTotal}`,
            `Модификатор: ${simpleDiceModifier >= 0 ? "+" : ""}${simpleDiceModifier}`,
            `Итого: ${total}`,
        ].join("\n");

        addHistoryEntry({
            title,
            summary,
            details,
            visibility,
        });
    }

    function addRollToJournal(entry: RollHistoryEntry) {
        onCreateJournalEntry({
            type: "master",
            title: `Бросок — ${entry.title}`,
            text: entry.summary,
            details: entry.details,
            isHiddenFromPlayers: entry.visibility === "hidden",
        });
    }

    function clearHistory() {
        setHistory([]);
    }

    if (!isOpen) {
        return null;
    }

    return (
        <aside
            className="dice-roller-panel"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <header className="dice-roller-header">
                <div>
                    <p className="eyebrow">Мастерский инструмент</p>
                    <h3>Броски</h3>
                </div>

                <button type="button" onClick={onClose}>
                    ×
                </button>
            </header>

            <section className="dice-roller-section">
                <div className="dice-section-header">
                    <h4>Проверка d20</h4>
                    <span>{difficultyLabel}</span>
                </div>

                <label className="dice-field wide">
                    Название проверки
                    <input
                        value={checkTitle}
                        onChange={(event) => setCheckTitle(event.target.value)}
                        placeholder="Например: Наблюдательность, Ремонт, Переговоры"
                    />
                </label>

                <div className="dice-grid">
                    <label className="dice-field">
                        Навык / бонус
                        <input
                            type="number"
                            value={skillBonus}
                            onChange={(event) => setSkillBonus(Number(event.target.value))}
                        />
                    </label>

                    <label className="dice-field">
                        Модификатор
                        <input
                            type="number"
                            value={modifier}
                            onChange={(event) => setModifier(Number(event.target.value))}
                        />
                    </label>

                    <label className="dice-field">
                        Сложность
                        <input
                            type="number"
                            value={difficulty}
                            onChange={(event) => setDifficulty(Number(event.target.value))}
                        />
                    </label>
                </div>

                <div className="dice-difficulty-row">
                    {DIFFICULTY_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            className={difficulty === preset.value ? "active" : ""}
                            type="button"
                            onClick={() => setDifficulty(preset.value)}
                            title={preset.hint}
                        >
                            <strong>{preset.label}</strong>
                            <span>{preset.hint}</span>
                        </button>
                    ))}
                </div>

                <div className="dice-visibility-row">
                    <button
                        className={visibility === "hidden" ? "active" : ""}
                        type="button"
                        onClick={() => setVisibility("hidden")}
                    >
                        Скрытый
                    </button>

                    <button
                        className={visibility === "open" ? "active" : ""}
                        type="button"
                        onClick={() => setVisibility("open")}
                    >
                        Открытый
                    </button>
                </div>

                <button className="dice-primary-button" type="button" onClick={rollCheck}>
                    Бросить d20
                </button>
            </section>

            <section className="dice-roller-section">
                <div className="dice-section-header">
                    <h4>Простой куб</h4>
                    <span>для урона, таблиц, случайностей</span>
                </div>

                <div className="dice-grid compact">
                    <label className="dice-field">
                        Кол-во
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={simpleDiceCount}
                            onChange={(event) => setSimpleDiceCount(Number(event.target.value))}
                        />
                    </label>

                    <label className="dice-field">
                        Модификатор
                        <input
                            type="number"
                            value={simpleDiceModifier}
                            onChange={(event) => setSimpleDiceModifier(Number(event.target.value))}
                        />
                    </label>
                </div>

                <div className="dice-simple-row">
                    {SIMPLE_DICE.map((sides) => (
                        <button key={sides} type="button" onClick={() => rollSimpleDie(sides)}>
                            d{sides}
                        </button>
                    ))}
                </div>
            </section>

            {latestRoll && (
                <section className="dice-latest-result">
                    <p className="eyebrow">Последний результат</p>
                    <strong>{latestRoll.summary}</strong>
                    <small>
                        {latestRoll.visibility === "hidden" ? "Скрытый бросок" : "Открытый бросок"}
                    </small>
                    <button type="button" onClick={() => addRollToJournal(latestRoll)}>
                        + В журнал
                    </button>
                </section>
            )}

            <section className="dice-history">
                <div className="dice-section-header">
                    <h4>История</h4>

                    {history.length > 0 && (
                        <button type="button" onClick={clearHistory}>
                            Очистить
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <p className="dice-empty">Бросков пока нет.</p>
                ) : (
                    <div className="dice-history-list">
                        {history.map((entry) => (
                            <article key={entry.id} className="dice-history-entry">
                                <div>
                                    <strong>{entry.summary}</strong>
                                    <small>
                                        {formatRollTime(entry.createdAt)} ·{" "}
                                        {entry.visibility === "hidden" ? "скрытый" : "открытый"}
                                    </small>
                                </div>

                                <button type="button" onClick={() => addRollToJournal(entry)}>
                                    +
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </aside>
    );
}