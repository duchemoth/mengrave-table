import { useState } from "react";
import type {
    CharacterEmpathy,
    CharacterMass,
    PlayerCharacter,
} from "../types/campaign";

const MASS_LABELS: Record<CharacterMass, string> = {
    deficit: "Дефицит",
    normal: "Норма",
    excess: "Избыток",
};

const EMPATHY_LABELS: Record<CharacterEmpathy, string> = {
    low: "Низкая",
    normal: "Норма",
    high: "Высокая",
};

type CharacterRosterProps = {
    characters: PlayerCharacter[];
    onCreateCharacter: () => PlayerCharacter;
    onUpdateCharacter: (character: PlayerCharacter) => void;
    onDeleteCharacter: (characterId: string) => void;
    onClose: () => void;
};

export function CharacterRoster({
    characters,
    onCreateCharacter,
    onUpdateCharacter,
    onDeleteCharacter,
    onClose,
}: CharacterRosterProps) {
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
        characters[0]?.id ?? null,
    );

    const selectedCharacter =
        characters.find((character) => character.id === selectedCharacterId) ?? null;

    function createCharacter() {
        const newCharacter = onCreateCharacter();

        setSelectedCharacterId(newCharacter.id);
    }

    function updateSelectedCharacter(updatedFields: Partial<PlayerCharacter>) {
        if (!selectedCharacter) {
            return;
        }

        onUpdateCharacter({
            ...selectedCharacter,
            ...updatedFields,
        });
    }

    function deleteSelectedCharacter() {
        if (!selectedCharacter) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить персонажа «${selectedCharacter.characterName}»? Это действие нельзя отменить.`,
        );

        if (!shouldDelete) {
            return;
        }

        onDeleteCharacter(selectedCharacter.id);

        const nextCharacter = characters.find(
            (character) => character.id !== selectedCharacter.id,
        );

        setSelectedCharacterId(nextCharacter?.id ?? null);
    }

    return (
        <section className="character-roster-window">
            <header className="character-roster-header">
                <div>
                    <p className="eyebrow">Мастерская</p>
                    <h2>Досье отряда</h2>
                </div>

                <button className="drawer-tab compact" type="button" onClick={onClose}>
                    ×
                </button>
            </header>

            <div className="character-roster-layout">
                <aside className="character-list-panel">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={createCharacter}
                    >
                        Добавить персонажа
                    </button>

                    {characters.length === 0 ? (
                        <p className="character-empty-text">
                            Персонажей пока нет. Добавь первого вольника отряда.
                        </p>
                    ) : (
                        <div className="character-card-list">
                            {characters.map((character) => {
                                const isSelected = character.id === selectedCharacterId;

                                return (
                                    <button
                                        key={character.id}
                                        className={`character-card-button ${isSelected ? "active" : ""
                                            }`}
                                        type="button"
                                        onClick={() => setSelectedCharacterId(character.id)}
                                    >
                                        <span className="character-card-name">
                                            {character.characterName || "Безымянный персонаж"}
                                        </span>

                                        <span className="character-card-meta">
                                            {character.playerName || "Игрок не указан"}
                                        </span>

                                        <span className="character-card-goal">
                                            {character.personalGoal || "Личная цель не указана"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>

                {selectedCharacter ? (
                    <div className="character-editor-panel">
                        <section className="character-editor-section">
                            <p className="eyebrow">Основное</p>

                            <div className="character-form-grid">
                                <label className="character-field">
                                    Игрок
                                    <input
                                        value={selectedCharacter.playerName}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ playerName: event.target.value })
                                        }
                                        placeholder="Имя игрока"
                                    />
                                </label>

                                <label className="character-field">
                                    Персонаж
                                    <input
                                        value={selectedCharacter.characterName}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                characterName: event.target.value,
                                            })
                                        }
                                        placeholder="Имя персонажа"
                                    />
                                </label>

                                <label className="character-field">
                                    Кличка
                                    <input
                                        value={selectedCharacter.nickname}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ nickname: event.target.value })
                                        }
                                        placeholder="Кличка"
                                    />
                                </label>

                                <label className="character-field">
                                    Возраст
                                    <input
                                        value={selectedCharacter.age}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ age: event.target.value })
                                        }
                                        placeholder="Возраст"
                                    />
                                </label>

                                <label className="character-field">
                                    Происхождение
                                    <input
                                        value={selectedCharacter.origin}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ origin: event.target.value })
                                        }
                                        placeholder="Например: житель форпоста"
                                    />
                                </label>

                                <label className="character-field">
                                    Бывшая деятельность
                                    <input
                                        value={selectedCharacter.formerActivity}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                formerActivity: event.target.value,
                                            })
                                        }
                                        placeholder="Например: санитар, проводник, ремонтник"
                                    />
                                </label>
                            </div>

                            <label className="character-field wide">
                                Причина стать вольником
                                <textarea
                                    value={selectedCharacter.reasonToBecomeFreeblade}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            reasonToBecomeFreeblade: event.target.value,
                                        })
                                    }
                                    placeholder="Почему персонаж ушёл в жизнь Вольного Клинка?"
                                />
                            </label>

                            <label className="character-field wide">
                                Личная цель
                                <textarea
                                    value={selectedCharacter.personalGoal}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            personalGoal: event.target.value,
                                        })
                                    }
                                    placeholder="Что персонаж ищет, доказывает или пытается исправить?"
                                />
                            </label>
                        </section>

                        <section className="character-editor-section">
                            <p className="eyebrow">Тело и психика</p>

                            <div className="character-form-grid compact">
                                <label className="character-field">
                                    Масса
                                    <select
                                        value={selectedCharacter.mass}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                mass: event.target.value as CharacterMass,
                                            })
                                        }
                                    >
                                        <option value="deficit">{MASS_LABELS.deficit}</option>
                                        <option value="normal">{MASS_LABELS.normal}</option>
                                        <option value="excess">{MASS_LABELS.excess}</option>
                                    </select>
                                </label>

                                <label className="character-field">
                                    Эмпатия
                                    <select
                                        value={selectedCharacter.empathy}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                empathy: event.target.value as CharacterEmpathy,
                                            })
                                        }
                                    >
                                        <option value="low">{EMPATHY_LABELS.low}</option>
                                        <option value="normal">{EMPATHY_LABELS.normal}</option>
                                        <option value="high">{EMPATHY_LABELS.high}</option>
                                    </select>
                                </label>
                            </div>

                            <div className="character-resource-grid">
                                <ResourceField
                                    label="ФЗ"
                                    value={selectedCharacter.physicalReserve}
                                    maxValue={selectedCharacter.maxPhysicalReserve}
                                    onChangeValue={(value) =>
                                        updateSelectedCharacter({ physicalReserve: value })
                                    }
                                    onChangeMaxValue={(value) =>
                                        updateSelectedCharacter({ maxPhysicalReserve: value })
                                    }
                                />

                                <ResourceField
                                    label="Психика"
                                    value={selectedCharacter.psyche}
                                    maxValue={selectedCharacter.maxPsyche}
                                    onChangeValue={(value) =>
                                        updateSelectedCharacter({ psyche: value })
                                    }
                                    onChangeMaxValue={(value) =>
                                        updateSelectedCharacter({ maxPsyche: value })
                                    }
                                />

                                <ResourceField
                                    label="Дух"
                                    value={selectedCharacter.spirit}
                                    maxValue={selectedCharacter.maxSpirit}
                                    onChangeValue={(value) =>
                                        updateSelectedCharacter({ spirit: value })
                                    }
                                    onChangeMaxValue={(value) =>
                                        updateSelectedCharacter({ maxSpirit: value })
                                    }
                                />

                                <ResourceField
                                    label="Судьба"
                                    value={selectedCharacter.fate}
                                    maxValue={selectedCharacter.maxFate}
                                    onChangeValue={(value) =>
                                        updateSelectedCharacter({ fate: value })
                                    }
                                    onChangeMaxValue={(value) =>
                                        updateSelectedCharacter({ maxFate: value })
                                    }
                                />
                            </div>

                            <label className="character-field wide">
                                Раны и состояния
                                <textarea
                                    value={selectedCharacter.woundsAndConditions}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            woundsAndConditions: event.target.value,
                                        })
                                    }
                                    placeholder="Кровотечение, перелом, дрожь, тревога, хромота..."
                                />
                            </label>

                            <label className="character-field wide">
                                Отражение / инфофонные последствия
                                <textarea
                                    value={selectedCharacter.reflectionNotes}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            reflectionNotes: event.target.value,
                                        })
                                    }
                                    placeholder="Симптомы, отзвук, микроперехваты, странности..."
                                />
                            </label>
                        </section>

                        <section className="character-editor-section">
                            <p className="eyebrow">Снаряжение и связи</p>

                            <div className="character-form-grid">
                                <label className="character-field">
                                    Оружие
                                    <textarea
                                        value={selectedCharacter.weapons}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ weapons: event.target.value })
                                        }
                                        placeholder="Карабин, тесак, пистольвер..."
                                    />
                                </label>

                                <label className="character-field">
                                    Броня
                                    <textarea
                                        value={selectedCharacter.armor}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ armor: event.target.value })
                                        }
                                        placeholder="Каска, стёганка, бронежилет..."
                                    />
                                </label>

                                <label className="character-field">
                                    Быстрый доступ
                                    <textarea
                                        value={selectedCharacter.quickAccess}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                quickAccess: event.target.value,
                                            })
                                        }
                                        placeholder="Жгуты, фонарь, боезапас, стимулятор..."
                                    />
                                </label>

                                <label className="character-field">
                                    Криптожетон
                                    <textarea
                                        value={selectedCharacter.cryptotoken}
                                        onChange={(event) =>
                                            updateSelectedCharacter({
                                                cryptotoken: event.target.value,
                                            })
                                        }
                                        placeholder="Действующий, стёртый, чужой, повреждённый..."
                                    />
                                </label>
                            </div>

                            <label className="character-field wide">
                                Связь с отрядом
                                <textarea
                                    value={selectedCharacter.squadConnection}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            squadConnection: event.target.value,
                                        })
                                    }
                                    placeholder="Почему отряд терпит его рядом?"
                                />
                            </label>

                            <div className="character-form-grid">
                                <label className="character-field">
                                    Долги
                                    <textarea
                                        value={selectedCharacter.debts}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ debts: event.target.value })
                                        }
                                    />
                                </label>

                                <label className="character-field">
                                    Враги
                                    <textarea
                                        value={selectedCharacter.enemies}
                                        onChange={(event) =>
                                            updateSelectedCharacter({ enemies: event.target.value })
                                        }
                                    />
                                </label>
                            </div>

                            <label className="character-field wide">
                                Заметки мастера
                                <textarea
                                    value={selectedCharacter.masterNotes}
                                    onChange={(event) =>
                                        updateSelectedCharacter({
                                            masterNotes: event.target.value,
                                        })
                                    }
                                    placeholder="Секреты, страхи, личные крючки, скрытые связи..."
                                />
                            </label>

                            <div className="character-actions">
                                <button
                                    className="danger-button"
                                    type="button"
                                    onClick={deleteSelectedCharacter}
                                >
                                    Удалить персонажа
                                </button>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="character-editor-panel empty">
                        <p>Выбери персонажа или создай нового.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

type ResourceFieldProps = {
    label: string;
    value: number;
    maxValue: number;
    onChangeValue: (value: number) => void;
    onChangeMaxValue: (value: number) => void;
};

function ResourceField({
    label,
    value,
    maxValue,
    onChangeValue,
    onChangeMaxValue,
}: ResourceFieldProps) {
    function clampResource(nextValue: number, nextMaxValue: number) {
        return Math.max(0, Math.min(nextMaxValue, nextValue));
    }

    return (
        <div className="character-resource">
            <span className="character-resource-label">{label}</span>

            <div className="character-resource-controls">
                <button
                    type="button"
                    onClick={() => onChangeValue(clampResource(value - 1, maxValue))}
                >
                    −
                </button>

                <span>
                    {value}/{maxValue}
                </span>

                <button
                    type="button"
                    onClick={() => onChangeValue(clampResource(value + 1, maxValue))}
                >
                    +
                </button>
            </div>

            <label>
                Макс.
                <input
                    type="number"
                    min="0"
                    max="20"
                    value={maxValue}
                    onChange={(event) => {
                        const nextMaxValue = Number(event.target.value);

                        onChangeMaxValue(nextMaxValue);
                        onChangeValue(clampResource(value, nextMaxValue));
                    }}
                />
            </label>
        </div>
    );
}