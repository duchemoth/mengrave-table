import { useMemo, useState } from "react";
import {
    DEFAULT_LOOT_GENERATOR_SETTINGS,
    LOOT_CONTEXT_OPTIONS,
    LOOT_DANGER_OPTIONS,
    LOOT_GENEROSITY_OPTIONS,
    LOOT_RESULT_MODE_OPTIONS,
    type LootGeneratorSettings,
} from "../data/lootGenerator";
import { generateLootFindings } from "../lib/lootGenerator";
import type { ArsenalItem } from "../types/campaign";

type LootGeneratorModalProps = {
    isOpen: boolean;
    sourceTitle: string;
    arsenalItems: ArsenalItem[];
    onClose: () => void;
    onInsertToFindings: (text: string) => void;
};

export function LootGeneratorModal({
    isOpen,
    sourceTitle,
    arsenalItems,
    onClose,
    onInsertToFindings,
}: LootGeneratorModalProps) {
    const [settings, setSettings] = useState<LootGeneratorSettings>(
        DEFAULT_LOOT_GENERATOR_SETTINGS,
    );
    const [generatedText, setGeneratedText] = useState("");

    const availableItemCount = useMemo(() => {
        return arsenalItems.filter((item) => item.lootAvailability !== "never").length;
    }, [arsenalItems]);

    if (!isOpen) {
        return null;
    }

    function updateSettings(updatedFields: Partial<LootGeneratorSettings>) {
        setSettings((currentSettings) => ({
            ...currentSettings,
            ...updatedFields,
        }));
    }

    function generateFindings() {
        setGeneratedText(
            generateLootFindings({
                arsenalItems,
                settings,
                sourceTitle,
            }),
        );
    }

    function insertFindings() {
        if (!generatedText.trim()) {
            return;
        }

        onInsertToFindings(generatedText.trim());
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
                        aria-label="Закрыть"
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
                    Разрешить сюжетные / ручные предметы
                </label>

                <p className="loot-generator-hint">
                    В Арсенале доступно предметов для подбора: {availableItemCount}. Генератор
                    ничего не выдаёт автоматически игрокам — только готовит текст для Мастера.
                </p>

                <div className="loot-generator-actions">
                    <button className="primary-button" type="button" onClick={generateFindings}>
                        Сгенерировать
                    </button>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={insertFindings}
                        disabled={!generatedText.trim()}
                    >
                        Вставить в находки точки
                    </button>
                </div>

                <textarea
                    className="loot-generator-result"
                    value={generatedText}
                    onChange={(event) => setGeneratedText(event.target.value)}
                    placeholder="Здесь появятся находки, ресурсы, улики и цена..."
                />
            </section>
        </div>
    );
}