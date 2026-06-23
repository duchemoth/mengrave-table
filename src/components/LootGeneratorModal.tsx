import { useMemo, useState } from "react";
import {
    DEFAULT_LOOT_GENERATOR_SETTINGS,
    LOOT_CONTEXT_OPTIONS,
    LOOT_DANGER_OPTIONS,
    LOOT_GENEROSITY_OPTIONS,
    LOOT_RESULT_MODE_OPTIONS,
    type LootGeneratorSettings,
} from "../data/lootGenerator";
import {
    generateFindingsResult,
    type GeneratedFindingsResult,
} from "../lib/lootGenerator";
import type { ArsenalItem, CampaignFinding } from "../types/campaign";

type LootGeneratorModalProps = {
    isOpen: boolean;
    sourceTitle: string;
    arsenalItems: ArsenalItem[];
    onClose: () => void;
    onInsertToFindings: (text: string) => void;
    onAddToFindings: (findings: CampaignFinding[]) => void;
};

function clampGeneratorCount(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
        return min;
    }

    return Math.max(min, Math.min(max, Math.floor(value)));
}

export function LootGeneratorModal({
    isOpen,
    sourceTitle,
    arsenalItems,
    onClose,
    onInsertToFindings,
    onAddToFindings,
}: LootGeneratorModalProps) {
    const [settings, setSettings] = useState<LootGeneratorSettings>(
        DEFAULT_LOOT_GENERATOR_SETTINGS,
    );
    const [generatedResult, setGeneratedResult] =
        useState<GeneratedFindingsResult | null>(null);
    const [generatedText, setGeneratedText] = useState("");
    const [isStructuredResultAdded, setIsStructuredResultAdded] = useState(false);

    const availableItemCount = useMemo(() => {
        return arsenalItems.filter((item) => item.lootAvailability !== "never").length;
    }, [arsenalItems]);

    const generatedItemCount = generatedResult?.items.length ?? 0;
    const generatedClueCount = generatedResult?.clues.length ?? 0;
    const generatedFindingCount = generatedItemCount + generatedClueCount;

    const isItemCountDisabled = settings.mode === "clues";
    const isClueCountDisabled =
        settings.mode === "items" || settings.mode === "resources";

    if (!isOpen) {
        return null;
    }

    function updateSettings(updatedFields: Partial<LootGeneratorSettings>) {
        setSettings((currentSettings) => ({
            ...currentSettings,
            ...updatedFields,
        }));
        setIsStructuredResultAdded(false);
    }

    function generateFindings() {
        const nextResult = generateFindingsResult({
            arsenalItems,
            settings,
            sourceTitle,
        });

        setGeneratedResult(nextResult);
        setGeneratedText(nextResult.textPreview);
        setIsStructuredResultAdded(false);
    }

    function insertFindings() {
        if (!generatedText.trim()) {
            return;
        }

        onInsertToFindings(generatedText.trim());
    }

    function addStructuredFindings() {
        if (!generatedResult) {
            return;
        }

        const nextFindings: CampaignFinding[] = [
            ...generatedResult.items,
            ...generatedResult.clues,
        ];

        if (nextFindings.length === 0) {
            return;
        }

        onAddToFindings(nextFindings);
        setIsStructuredResultAdded(true);
    }

    return (
        <div className="loot-generator-backdrop" role="presentation" onClick={onClose}>
            <section
                className="loot-generator-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Генератор находок"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="loot-generator-header">
                    <div>
                        <p className="eyebrow">Мастерский инструмент</p>
                        <h3>Генератор находок</h3>
                        <small>{sourceTitle}</small>
                    </div>

                    <button
                        className="loot-generator-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть генератор находок"
                    >
                        ×
                    </button>
                </header>

                <div className="loot-generator-grid">
                    <label>
                        Контекст
                        <select
                            value={settings.context}
                            onChange={(event) =>
                                updateSettings({
                                    context: event.target.value as LootGeneratorSettings["context"],
                                })
                            }
                        >
                            {LOOT_CONTEXT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Опасность
                        <select
                            value={settings.danger}
                            onChange={(event) =>
                                updateSettings({
                                    danger: event.target.value as LootGeneratorSettings["danger"],
                                })
                            }
                        >
                            {LOOT_DANGER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Щедрость
                        <select
                            value={settings.generosity}
                            onChange={(event) =>
                                updateSettings({
                                    generosity: event.target.value as LootGeneratorSettings["generosity"],
                                })
                            }
                        >
                            {LOOT_GENEROSITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Тип результата
                        <select
                            value={settings.mode}
                            onChange={(event) =>
                                updateSettings({
                                    mode: event.target.value as LootGeneratorSettings["mode"],
                                })
                            }
                        >
                            {LOOT_RESULT_MODE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Предметов
                        <input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={settings.itemCount}
                            disabled={isItemCountDisabled}
                            onChange={(event) =>
                                updateSettings({
                                    itemCount: clampGeneratorCount(
                                        Number(event.target.value),
                                        0,
                                        10,
                                    ),
                                })
                            }
                        />
                    </label>

                    <label>
                        Улик и следов
                        <input
                            type="number"
                            min={0}
                            max={8}
                            step={1}
                            value={settings.clueCount}
                            disabled={isClueCountDisabled}
                            onChange={(event) =>
                                updateSettings({
                                    clueCount: clampGeneratorCount(
                                        Number(event.target.value),
                                        0,
                                        8,
                                    ),
                                })
                            }
                        />
                    </label>
                </div>

                <label className="loot-generator-checkbox">
                    <input
                        type="checkbox"
                        checked={settings.allowManual}
                        onChange={(event) =>
                            updateSettings({
                                allowManual: event.target.checked,
                            })
                        }
                    />
                    Разрешить сюжетные предметы Арсенала
                </label>

                <p className="loot-generator-hint">
                    В Арсенале доступно предметов для подбора: {availableItemCount}. Материальные
                    находки берутся только из Арсенала. Количество задаёт число карточек, а
                    щедрость, опасность и контекст влияют на качество и состав выдачи.
                </p>

                {generatedResult && (
                    <div className="loot-generator-summary">
                        <strong>Структурный результат готов</strong>
                        <span>
                            Предметы: {generatedItemCount} · Улики и следы: {generatedClueCount}
                        </span>
                    </div>
                )}

                <div className="loot-generator-actions">
                    <button className="primary-button" type="button" onClick={generateFindings}>
                        Сгенерировать
                    </button>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={addStructuredFindings}
                        disabled={!generatedResult || generatedFindingCount === 0 || isStructuredResultAdded}
                    >
                        {isStructuredResultAdded ? "Добавлено в Находки" : "Добавить в Находки"}
                    </button>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={insertFindings}
                        disabled={!generatedText.trim()}
                    >
                        Вставить текст в точку
                    </button>
                </div>

                <textarea
                    className="loot-generator-result"
                    value={generatedText}
                    onChange={(event) => setGeneratedText(event.target.value)}
                    placeholder="Здесь появятся предметы, улики и цена."
                />
            </section>
        </div>
    );
}