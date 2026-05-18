import type { ArsenalItem, PlayerCharacter } from "../../types/campaign";

type PartyStatusPanelProps = {
    characters: PlayerCharacter[];
    arsenalItems: ArsenalItem[];
    onOpenCharacter: (characterId: string) => void;
};

function getCriticalClass(character: PlayerCharacter) {
    if (
        character.physicalReserve <= 0 ||
        character.psyche <= 0 ||
        character.spirit <= 0
    ) {
        return "critical";
    }

    if (
        character.physicalReserve <= Math.ceil(character.maxPhysicalReserve / 2) ||
        character.psyche <= Math.ceil(character.maxPsyche / 2)
    ) {
        return "warning";
    }

    return "";
}

export function PartyStatusPanel({
    characters,
    arsenalItems,
    onOpenCharacter,
}: PartyStatusPanelProps) {
    function getItemName(itemId: string | null | undefined) {
        if (!itemId) {
            return "—";
        }

        return (
            arsenalItems.find((item) => item.id === itemId)?.name ??
            "Предмет удалён"
        );
    }

    if (characters.length === 0) {
        return (
            <div className="party-status-panel empty">
                <p className="eyebrow">Отряд</p>
                <h3>Персонажей пока нет</h3>
                <p>Добавь первого Вольного Клинка через раздел “Персонажи”.</p>
            </div>
        );
    }

    return (
        <section className="party-status-panel">
            <header className="party-status-header">
                <div>
                    <p className="eyebrow">Оперативная панель</p>
                    <h3>Отряд</h3>
                </div>

                <span>{characters.length} персонажей</span>
            </header>

            <div className="party-status-list">
                {characters.map((character) => {
                    const criticalClass = getCriticalClass(character);
                    const inventory = character.inventory;

                    const shoulder1 = getItemName(
                        inventory?.weaponSlots.shoulder1.itemId,
                    );
                    const shoulder2 = getItemName(
                        inventory?.weaponSlots.shoulder2.itemId,
                    );
                    const smallWeapon = getItemName(
                        inventory?.weaponSlots.small.itemId,
                    );

                    const protection = getItemName(inventory?.protectionSlot.itemId);

                    const quickSlots = inventory?.loadBearing.quickSlots ?? [];
                    const visibleQuickSlots = quickSlots.slice(0, 6);

                    return (
                        <article
                            key={character.id}
                            className={`party-character-card ${criticalClass}`}
                        >
                            <div className="party-character-main">
                                <h4>{character.characterName || "Безымянный персонаж"}</h4>
                                <p>{character.playerName || "Игрок не указан"}</p>
                            </div>

                            <div className="party-resource-row">
                                <span>
                                    ФЗ {character.physicalReserve}/{character.maxPhysicalReserve}
                                </span>
                                <span>
                                    Психика {character.psyche}/{character.maxPsyche}
                                </span>
                                <span>
                                    Дух {character.spirit}/{character.maxSpirit}
                                </span>
                                <span>
                                    Судьба {character.fate}/{character.maxFate}
                                </span>
                            </div>

                            <div className="party-loadout-grid">
                                <div>
                                    <strong>Оружие</strong>
                                    <span>{shoulder1}</span>
                                    <span>{shoulder2}</span>
                                    <span>{smallWeapon}</span>
                                </div>

                                <div>
                                    <strong>Защита</strong>
                                    <span>{protection}</span>
                                    <span>
                                        {character.wallet.amperies} амп.{" "}
                                        {character.wallet.miliamperies} мА
                                    </span>
                                </div>
                            </div>

                            <div className="party-quick-slots">
                                {visibleQuickSlots.length === 0 ? (
                                    <span className="party-quick-empty">
                                        Быстрые слоты не назначены
                                    </span>
                                ) : (
                                    visibleQuickSlots.map((slot, index) => (
                                        <span key={slot.id} className="party-quick-slot">
                                            {index + 1}. {getItemName(slot.itemId)}
                                            {slot.quantity > 1 ? ` ×${slot.quantity}` : ""}
                                        </span>
                                    ))
                                )}
                            </div>

                            <button
                                className="party-character-open-button"
                                type="button"
                                onClick={() => onOpenCharacter(character.id)}
                            >
                                Полная карта
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}