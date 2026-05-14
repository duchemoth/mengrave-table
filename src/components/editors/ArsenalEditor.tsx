import { useMemo, useState } from "react";
import type {
    ArsenalItem,
    ArsenalItemCategory,
    ArsenalItemSlot,
} from "../../types/campaign";

const CATEGORY_OPTIONS: {
    value: ArsenalItemCategory;
    label: string;
}[] = [
        { value: "weapon", label: "Оружие" },
        { value: "armor", label: "Броня" },
        { value: "protection", label: "Защита" },
        { value: "loadBearing", label: "Разгрузка" },
        { value: "tool", label: "Инструменты" },
        { value: "medicine", label: "Медицина" },
        { value: "resource", label: "Ресурсы" },
        { value: "quest", label: "Квестовое" },
        { value: "misc", label: "Прочее" },
    ];

const SLOT_OPTIONS: {
    value: ArsenalItemSlot;
    label: string;
}[] = [
        { value: "shoulderWeapon", label: "Оружие — плечо" },
        { value: "smallWeapon", label: "Малое оружие" },
        { value: "headArmor", label: "Броня — голова" },
        { value: "torsoArmor", label: "Броня — торс" },
        { value: "armsArmor", label: "Броня — руки" },
        { value: "legsArmor", label: "Броня — ноги" },
        { value: "protection", label: "Защитное снаряжение" },
        { value: "loadBearing", label: "Разгрузка" },
        { value: "quick", label: "Быстрый слот" },
        { value: "backpack", label: "Рюкзак" },
        { value: "none", label: "Без слота" },
    ];

function createArsenalItem(): ArsenalItem {
    return {
        id: `arsenal-item-${Date.now()}`,
        name: "Новый предмет",
        category: "misc",
        slot: "backpack",

        description: "",
        rules: "",
        tags: "",
        rarity: "",
        weight: "",
        price: "",

        isVisibleToPlayers: true,
    };
}

type ArsenalEditorProps = {
    items: ArsenalItem[];
    isDeveloperMode: boolean;
    onChangeItems: (items: ArsenalItem[]) => void;
};

export function ArsenalEditor({
    items,
    isDeveloperMode,
    onChangeItems,
}: ArsenalEditorProps) {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(
        items[0]?.id ?? null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<ArsenalItemCategory | "all">(
        "all",
    );

    const filteredItems = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return items.filter((item) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                item.name.toLowerCase().includes(normalizedSearch) ||
                item.description.toLowerCase().includes(normalizedSearch) ||
                item.rules.toLowerCase().includes(normalizedSearch) ||
                item.tags.toLowerCase().includes(normalizedSearch);

            const matchesCategory =
                categoryFilter === "all" || item.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, categoryFilter]);

    const selectedItem =
        items.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null;

    function createItem() {
        if (!isDeveloperMode) {
            return;
        }

        const newItem = createArsenalItem();

        onChangeItems([...items, newItem]);
        setSelectedItemId(newItem.id);
    }

    function updateItem(updatedFields: Partial<ArsenalItem>) {
        if (!isDeveloperMode || !selectedItem) {
            return;
        }

        onChangeItems(
            items.map((item) =>
                item.id === selectedItem.id
                    ? {
                        ...item,
                        ...updatedFields,
                    }
                    : item,
            ),
        );
    }

    function deleteItem() {
        if (!isDeveloperMode || !selectedItem) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить предмет «${selectedItem.name}» из Арсенала? У персонажей, которым он уже выдан, может остаться ссылка на удалённую карточку.`,
        );

        if (!shouldDelete) {
            return;
        }

        const nextItems = items.filter((item) => item.id !== selectedItem.id);

        onChangeItems(nextItems);
        setSelectedItemId(nextItems[0]?.id ?? null);
    }

    return (
        <section className="arsenal-editor">
            <p className="eyebrow">Арсенал</p>
            <h2>Справочник снаряжения</h2>

            <p className="editor-empty-text">
                Эхо создаёт и правит карточки предметов. Мастер использует этот каталог,
                чтобы выдавать вещи персонажам.
            </p>

            <div className="arsenal-toolbar">
                <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Поиск по Арсеналу..."
                />

                <select
                    value={categoryFilter}
                    onChange={(event) =>
                        setCategoryFilter(event.target.value as ArsenalItemCategory | "all")
                    }
                >
                    <option value="all">Все категории</option>
                    {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {isDeveloperMode && (
                <button className="editor-button" type="button" onClick={createItem}>
                    Создать предмет
                </button>
            )}

            <div className="arsenal-layout">
                <div className="arsenal-list">
                    {filteredItems.length === 0 ? (
                        <p className="editor-empty-text">В Арсенале пока нет предметов.</p>
                    ) : (
                        filteredItems.map((item) => (
                            <button
                                key={item.id}
                                className={`arsenal-list-item ${selectedItem?.id === item.id ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setSelectedItemId(item.id)}
                            >
                                <strong>{item.name}</strong>
                                <span>
                                    {CATEGORY_OPTIONS.find((option) => option.value === item.category)
                                        ?.label ?? "Прочее"}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                <div className="arsenal-details">
                    {!selectedItem ? (
                        <p className="editor-empty-text">Выбери предмет из списка.</p>
                    ) : isDeveloperMode ? (
                        <>
                            <label>
                                Название
                                <input
                                    value={selectedItem.name}
                                    onChange={(event) => updateItem({ name: event.target.value })}
                                    placeholder="Пистольвер барабанный"
                                />
                            </label>

                            <div className="arsenal-form-grid">
                                <label>
                                    Категория
                                    <select
                                        value={selectedItem.category}
                                        onChange={(event) =>
                                            updateItem({
                                                category: event.target.value as ArsenalItemCategory,
                                            })
                                        }
                                    >
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Слот
                                    <select
                                        value={selectedItem.slot}
                                        onChange={(event) =>
                                            updateItem({
                                                slot: event.target.value as ArsenalItemSlot,
                                            })
                                        }
                                    >
                                        {SLOT_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {selectedItem.slot === "loadBearing" && (
                                <label>
                                    Быстрые слоты разгрузки
                                    <select
                                        value={selectedItem.quickSlotCount ?? 2}
                                        onChange={(event) =>
                                            updateItem({
                                                quickSlotCount: Number(event.target.value) as 2 | 4 | 6,
                                            })
                                        }
                                    >
                                        <option value={2}>2 слота</option>
                                        <option value={4}>4 слота</option>
                                        <option value={6}>6 слотов</option>
                                    </select>
                                </label>
                            )}

                            <label>
                                Описание
                                <textarea
                                    value={selectedItem.description}
                                    onChange={(event) =>
                                        updateItem({ description: event.target.value })
                                    }
                                    placeholder="Краткое описание предмета, внешний вид, назначение..."
                                />
                            </label>

                            <label>
                                Правила / свойства
                                <textarea
                                    value={selectedItem.rules}
                                    onChange={(event) => updateItem({ rules: event.target.value })}
                                    placeholder="Урон, защита, особенности, ограничения, эффекты..."
                                />
                            </label>

                            <div className="arsenal-form-grid">
                                <label>
                                    Редкость / доступ
                                    <input
                                        value={selectedItem.rarity}
                                        onChange={(event) => updateItem({ rarity: event.target.value })}
                                        placeholder="обычное / редкое / фракционное"
                                    />
                                </label>

                                <label>
                                    Масса
                                    <input
                                        value={selectedItem.weight}
                                        onChange={(event) => updateItem({ weight: event.target.value })}
                                        placeholder="1.5 кг / тяжёлое / —"
                                    />
                                </label>

                                <label>
                                    Цена / ценность
                                    <input
                                        value={selectedItem.price}
                                        onChange={(event) => updateItem({ price: event.target.value })}
                                        placeholder="амперии / услуга / награда"
                                    />
                                </label>

                                <label>
                                    Теги
                                    <input
                                        value={selectedItem.tags}
                                        onChange={(event) => updateItem({ tags: event.target.value })}
                                        placeholder="шумное, надёжное, редкое"
                                    />
                                </label>
                            </div>

                            <label className="editor-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedItem.isVisibleToPlayers}
                                    onChange={(event) =>
                                        updateItem({ isVisibleToPlayers: event.target.checked })
                                    }
                                />
                                Видно игрокам
                            </label>

                            <button className="danger-button" type="button" onClick={deleteItem}>
                                Удалить предмет
                            </button>
                        </>
                    ) : (
                        <article className="arsenal-readonly-card">
                            <p className="eyebrow">
                                {CATEGORY_OPTIONS.find(
                                    (option) => option.value === selectedItem.category,
                                )?.label ?? "Предмет"}
                            </p>

                            <h3>{selectedItem.name}</h3>

                            {selectedItem.description.trim().length > 0 && (
                                <p>{selectedItem.description}</p>
                            )}

                            {selectedItem.rules.trim().length > 0 && (
                                <>
                                    <h4>Свойства</h4>
                                    <p>{selectedItem.rules}</p>
                                </>
                            )}

                            <dl>
                                {selectedItem.rarity.trim().length > 0 && (
                                    <>
                                        <dt>Доступ</dt>
                                        <dd>{selectedItem.rarity}</dd>
                                    </>
                                )}

                                {selectedItem.weight.trim().length > 0 && (
                                    <>
                                        <dt>Масса</dt>
                                        <dd>{selectedItem.weight}</dd>
                                    </>
                                )}

                                {selectedItem.price.trim().length > 0 && (
                                    <>
                                        <dt>Цена</dt>
                                        <dd>{selectedItem.price}</dd>
                                    </>
                                )}

                                {selectedItem.tags.trim().length > 0 && (
                                    <>
                                        <dt>Теги</dt>
                                        <dd>{selectedItem.tags}</dd>
                                    </>
                                )}
                            </dl>
                        </article>
                    )}
                </div>
            </div>
        </section>
    );
}