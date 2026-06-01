import { useMemo, useState } from "react";
import type {
    ArsenalArmorSubtype,
    ArsenalItem,
    ArsenalItemCategory,
    ArsenalItemCondition,
    ArsenalItemRarity,
    ArsenalItemSlot,
    ArsenalLootAvailability,
    ArsenalLootTag,
    ArsenalResourceSubtype,
    ArsenalWeaponSubtype,
} from "../../types/campaign";

const CATEGORY_OPTIONS: {
    value: ArsenalItemCategory;
    label: string;
}[] = [
        { value: "weapon", label: "Оружие" },
        { value: "armor", label: "Броня" },
        { value: "protection", label: "Защита" },
        { value: "loadBearing", label: "Разгрузка" },
        { value: "storage", label: "Поклажа" },
        { value: "tool", label: "Инструменты" },
        { value: "medicine", label: "Медицина" },
        { value: "resource", label: "Ресурсы" },
        { value: "quest", label: "Квестовое" },
        { value: "misc", label: "Прочее / хлам" },
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
        { value: "backpack", label: "Рюкзак / спина" },
        { value: "none", label: "Обычный предмет / без слота" },
    ];

const WEAPON_SUBTYPE_OPTIONS: {
    value: ArsenalWeaponSubtype;
    label: string;
}[] = [
        { value: "melee", label: "Холодное" },
        { value: "firearm", label: "Огнестрельное" },
        { value: "throwing", label: "Метательное" },
        { value: "special", label: "Особое" },
        { value: "explosive", label: "Взрывчатое" },
        { value: "combined", label: "Комбинированное" },
        { value: "other", label: "Другое" },
    ];

const ARMOR_SUBTYPE_OPTIONS: {
    value: ArsenalArmorSubtype;
    label: string;
}[] = [
        { value: "head", label: "Голова" },
        { value: "torso", label: "Торс" },
        { value: "arms", label: "Руки" },
        { value: "legs", label: "Ноги" },
        { value: "shield", label: "Щит / ручная защита" },
        { value: "fullBody", label: "Комплект / полный доспех" },
        { value: "other", label: "Другое" },
    ];

const RESOURCE_SUBTYPE_OPTIONS: {
    value: ArsenalResourceSubtype;
    label: string;
}[] = [
        { value: "supplies", label: "Припасы" },
        { value: "fuel", label: "Топливо" },
        { value: "ammo", label: "Боезапас" },
        { value: "drink", label: "Питьё" },
        { value: "materials", label: "Материалы" },
        { value: "other", label: "Прочие ресурсы" },
    ];

const RARITY_OPTIONS: {
    value: ArsenalItemRarity;
    label: string;
}[] = [
        { value: "junk", label: "Хлам / мусор" },
        { value: "common", label: "Распространённое" },
        { value: "standard", label: "Обычное" },
        { value: "good", label: "Добротное" },
        { value: "rare", label: "Редкое" },
        { value: "faction", label: "Фракционное" },
        { value: "elite", label: "Элитное" },
        { value: "unique", label: "Уникальное" },
        { value: "forbidden", label: "Запрещённое" },
        { value: "quest", label: "Сюжетное" },
    ];

const LOOT_AVAILABILITY_OPTIONS: {
    value: ArsenalLootAvailability;
    label: string;
}[] = [
        { value: "never", label: "Не выпадает" },
        { value: "starter", label: "Стартовый / безопасный лут" },
        { value: "commonLoot", label: "Обычные находки" },
        { value: "dangerLoot", label: "Опасные находки" },
        { value: "reward", label: "Ценная награда" },
        { value: "manual", label: "Только вручную / сюжетно" },
    ];

const CONDITION_OPTIONS: {
    value: ArsenalItemCondition;
    label: string;
}[] = [
        { value: "new", label: "Новое" },
        { value: "working", label: "Рабочее" },
        { value: "worn", label: "Потрёпанное" },
        { value: "damaged", label: "Повреждённое" },
        { value: "makeshift", label: "Самодельное" },
        { value: "dirty", label: "Грязное" },
        { value: "infected", label: "Заражённое" },
        { value: "radiating", label: "Фонящее" },
        { value: "incomplete", label: "Неполное" },
        { value: "trophy", label: "Трофейное" },
    ];

const LOOT_TAG_OPTIONS: {
    value: ArsenalLootTag;
    label: string;
    group: string;
}[] = [
        { value: "obscuria", label: "Обскурия", group: "Контекст" },
        { value: "battle", label: "Бой", group: "Контекст" },
        { value: "technical", label: "Техника", group: "Контекст" },
        { value: "medical", label: "Медицина", group: "Контекст" },
        { value: "domestic", label: "Быт", group: "Контекст" },
        { value: "storage", label: "Склад / поклажа", group: "Контекст" },
        { value: "corpse", label: "Труп", group: "Контекст" },
        { value: "infection", label: "Заражение", group: "Контекст" },

        { value: "weapon", label: "Оружие", group: "Функция" },
        { value: "ammo", label: "Боеприпасы", group: "Функция" },
        { value: "armor", label: "Броня", group: "Функция" },
        { value: "healing", label: "Лечение", group: "Функция" },
        { value: "repair", label: "Ремонт", group: "Функция" },
        { value: "tool", label: "Инструмент", group: "Функция" },
        { value: "fuel", label: "Топливо", group: "Функция" },
        { value: "food", label: "Еда", group: "Функция" },
        { value: "water", label: "Вода", group: "Функция" },
        { value: "document", label: "Документ", group: "Функция" },
        { value: "clue", label: "Улика", group: "Функция" },
        { value: "quest", label: "Квестовое", group: "Функция" },
        { value: "container", label: "Контейнер", group: "Функция" },

        { value: "noisy", label: "Шумит", group: "Риск" },
        { value: "heavy", label: "Тяжёлое", group: "Риск" },
        { value: "fragile", label: "Хрупкое", group: "Риск" },
        { value: "suspicious", label: "Подозрительное", group: "Риск" },
        { value: "forbidden", label: "Запрещённое", group: "Риск" },
        { value: "radiating", label: "Фонит", group: "Риск" },
        { value: "reflectionRisk", label: "Риск Отражения", group: "Риск" },
        { value: "infectionRisk", label: "Риск заражения", group: "Риск" },
        { value: "inspectionRisk", label: "Опасно на досмотре", group: "Риск" },

        { value: "voyage", label: "Вояж", group: "Фракция" },
        { value: "fief", label: "Феод", group: "Фракция" },
        { value: "euler", label: "Эйлер", group: "Фракция" },
        { value: "evergal", label: "Эвергаль", group: "Фракция" },
        { value: "temerat", label: "Темерат", group: "Фракция" },
        { value: "valour", label: "Валор", group: "Фракция" },
        { value: "brigand", label: "Бриганты", group: "Фракция" },
        { value: "celiate", label: "Целлиат", group: "Фракция" },
    ];

function getWeaponSubtypeLabel(value: ArsenalWeaponSubtype | undefined) {
    return (
        WEAPON_SUBTYPE_OPTIONS.find((option) => option.value === value)?.label ??
        "Другое"
    );
}

function getArmorSubtypeLabel(value: ArsenalArmorSubtype | undefined) {
    return (
        ARMOR_SUBTYPE_OPTIONS.find((option) => option.value === value)?.label ??
        "Другое"
    );
}

function getResourceSubtypeLabel(value: ArsenalResourceSubtype | undefined) {
    return (
        RESOURCE_SUBTYPE_OPTIONS.find((option) => option.value === value)?.label ??
        "Прочие ресурсы"
    );
}

function getRarityLabel(value: ArsenalItemRarity) {
    return RARITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getLootAvailabilityLabel(value: ArsenalLootAvailability) {
    return (
        LOOT_AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label ??
        value
    );
}

function getConditionLabel(value: ArsenalItemCondition) {
    return CONDITION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getLootTagLabel(value: ArsenalLootTag) {
    return LOOT_TAG_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function groupLootTagsByGroup() {
    const groups = new Map<string, typeof LOOT_TAG_OPTIONS>();

    LOOT_TAG_OPTIONS.forEach((option) => {
        groups.set(option.group, [...(groups.get(option.group) ?? []), option]);
    });

    return Array.from(groups.entries()).map(([title, options]) => ({
        title,
        options,
    }));
}

function getArmorSubtypeFromSlot(slot: ArsenalItemSlot): ArsenalArmorSubtype | undefined {
    if (slot === "headArmor") {
        return "head";
    }

    if (slot === "torsoArmor") {
        return "torso";
    }

    if (slot === "armsArmor") {
        return "arms";
    }

    if (slot === "legsArmor") {
        return "legs";
    }

    return undefined;
}

function createArsenalItem(): ArsenalItem {
    return {
        id: `arsenal-item-${Date.now()}`,
        name: "Новый предмет",
        category: "misc",
        slot: "none",

        weaponSubtype: undefined,
        armorSubtype: undefined,
        resourceSubtype: undefined,

        description: "",
        rules: "",
        tags: "",
        rarity: "standard",
        lootAvailability: "commonLoot",
        condition: "working",
        lootTags: [],

        weight: "",
        price: "",

        quickSlotCount: undefined,
        backpackSlotCount: undefined,
        isVisibleToPlayers: true,
    };
}

type ArsenalEditorProps = {
    items: ArsenalItem[];
    isDeveloperMode: boolean;
    onChangeItems: (items: ArsenalItem[]) => void;
};

type ArsenalCategoryGroup = {
    key: string;
    label: string;
};

const ARSENAL_CATEGORY_GROUPS: ArsenalCategoryGroup[] = [
    { key: "weapon", label: "Оружие" },
    { key: "armor", label: "Броня" },
    { key: "protection", label: "Защита" },
    { key: "loadBearing", label: "Разгрузка" },
    { key: "storage", label: "Поклажа" },
    { key: "medicine", label: "Медицина" },
    { key: "resource", label: "Ресурсы" },
    { key: "tool", label: "Инструменты" },
    { key: "quest", label: "Квестовое" },
    { key: "misc", label: "Прочее / хлам" },
];

function getArsenalCategoryLabel(category: string) {
    const group = ARSENAL_CATEGORY_GROUPS.find((item) => item.key === category);
    return group?.label ?? category;
}

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

    const [openCategoryGroups, setOpenCategoryGroups] = useState<Record<string, boolean>>({
        weapon: false,
        armor: false,
        protection: false,
        loadBearing: false,
        storage: false,
        medicine: false,
        resource: false,
        tool: false,
        quest: false,
        misc: false,
    });

    const [openSubtypeGroups, setOpenSubtypeGroups] = useState<Record<string, boolean>>({});

    const lootTagGroups = useMemo(() => groupLootTagsByGroup(), []);

    const filteredItems = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return items.filter((item) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                item.name.toLowerCase().includes(normalizedSearch) ||
                item.description.toLowerCase().includes(normalizedSearch) ||
                item.rules.toLowerCase().includes(normalizedSearch) ||
                item.tags.toLowerCase().includes(normalizedSearch) ||
                getRarityLabel(item.rarity).toLowerCase().includes(normalizedSearch) ||
                getLootAvailabilityLabel(item.lootAvailability).toLowerCase().includes(normalizedSearch) ||
                getConditionLabel(item.condition).toLowerCase().includes(normalizedSearch) ||
                item.lootTags.some((tag) =>
                    getLootTagLabel(tag).toLowerCase().includes(normalizedSearch),
                );

            const matchesCategory =
                categoryFilter === "all" || item.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, categoryFilter]);

    const groupedItems = useMemo(() => {
        return ARSENAL_CATEGORY_GROUPS.map((group) => ({
            ...group,
            items: filteredItems.filter((item) => item.category === group.key),
        })).filter((group) => group.items.length > 0);
    }, [filteredItems]);

    function toggleCategoryGroup(categoryKey: string) {
        setOpenCategoryGroups((current) => ({
            ...current,
            [categoryKey]: !current[categoryKey],
        }));
    }

    function toggleSubtypeGroup(groupKey: string) {
        setOpenSubtypeGroups((current) => ({
            ...current,
            [groupKey]: !current[groupKey],
        }));
    }

    function getItemSubtypeLabel(item: ArsenalItem) {
        if (item.category === "weapon") {
            return getWeaponSubtypeLabel(item.weaponSubtype);
        }

        if (item.category === "armor") {
            return getArmorSubtypeLabel(
                item.armorSubtype ?? getArmorSubtypeFromSlot(item.slot),
            );
        }

        if (item.category === "resource") {
            return getResourceSubtypeLabel(item.resourceSubtype);
        }

        return getArsenalCategoryLabel(item.category);
    }

    function updateItemCategory(category: ArsenalItemCategory) {
        if (category === "weapon") {
            updateItem({
                category,
                slot: selectedItem?.slot === "smallWeapon" ? "smallWeapon" : "shoulderWeapon",
                weaponSubtype: selectedItem?.weaponSubtype ?? "other",
                armorSubtype: undefined,
                resourceSubtype: undefined,
                backpackSlotCount: undefined,
            });
            return;
        }

        if (category === "armor") {
            updateItem({
                category,
                slot: "torsoArmor",
                weaponSubtype: undefined,
                armorSubtype: selectedItem?.armorSubtype ?? "torso",
                resourceSubtype: undefined,
                backpackSlotCount: undefined,
            });
            return;
        }

        if (category === "loadBearing") {
            updateItem({
                category,
                slot: "loadBearing",
                weaponSubtype: undefined,
                armorSubtype: undefined,
                resourceSubtype: undefined,
                quickSlotCount: selectedItem?.quickSlotCount ?? 2,
                backpackSlotCount: undefined,
            });
            return;
        }

        if (category === "storage") {
            updateItem({
                category,
                slot: "backpack",
                weaponSubtype: undefined,
                armorSubtype: undefined,
                resourceSubtype: undefined,
                quickSlotCount: undefined,
                backpackSlotCount: selectedItem?.backpackSlotCount ?? 6,
            });
            return;
        }

        if (category === "resource") {
            updateItem({
                category,
                slot: "none",
                weaponSubtype: undefined,
                armorSubtype: undefined,
                resourceSubtype: selectedItem?.resourceSubtype ?? "other",
                quickSlotCount: undefined,
                backpackSlotCount: undefined,
            });
            return;
        }

        updateItem({
            category,
            slot: category === "protection" ? "protection" : "none",
            weaponSubtype: undefined,
            armorSubtype: undefined,
            resourceSubtype: undefined,
            quickSlotCount: undefined,
            backpackSlotCount: undefined,
        });
    }

    function updateItemSlot(slot: ArsenalItemSlot) {
        if (slot === "backpack") {
            updateItem({
                slot,
                category: "storage",
                backpackSlotCount: selectedItem?.backpackSlotCount ?? 6,
                quickSlotCount: undefined,
            });
            return;
        }

        if (slot === "loadBearing") {
            updateItem({
                slot,
                category: "loadBearing",
                quickSlotCount: selectedItem?.quickSlotCount ?? 2,
                backpackSlotCount: undefined,
            });
            return;
        }

        const armorSubtype = getArmorSubtypeFromSlot(slot);

        if (armorSubtype) {
            updateItem({
                slot,
                category: "armor",
                armorSubtype,
                weaponSubtype: undefined,
                backpackSlotCount: undefined,
            });
            return;
        }

        if (slot === "shoulderWeapon" || slot === "smallWeapon") {
            updateItem({
                slot,
                category: "weapon",
                weaponSubtype: selectedItem?.weaponSubtype ?? "other",
                armorSubtype: undefined,
                backpackSlotCount: undefined,
            });
            return;
        }

        updateItem({
            slot,
            backpackSlotCount: undefined,
        });
    }

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

    function toggleLootTag(tag: ArsenalLootTag) {
        if (!selectedItem) {
            return;
        }

        const currentTags = Array.isArray(selectedItem.lootTags)
            ? selectedItem.lootTags
            : [];

        updateItem({
            lootTags: currentTags.includes(tag)
                ? currentTags.filter((currentTag) => currentTag !== tag)
                : [...currentTags, tag],
        });
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
            <div className="arsenal-heading">
                <div>
                    <p className="eyebrow">Арсенал</p>
                    <h2>Справочник снаряжения</h2>
                </div>

                <p>
                    Эхо редактирует карточки. Мастер выдаёт готовые вещи персонажам.
                </p>
            </div>

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
                <div className="arsenal-list grouped">
                    {groupedItems.map((group) => {
                        const isOpen = openCategoryGroups[group.key] ?? true;

                        return (
                            <div key={group.key} className="arsenal-group">
                                <button
                                    className="arsenal-group-header"
                                    type="button"
                                    onClick={() => toggleCategoryGroup(group.key)}
                                >
                                    <span>
                                        {isOpen ? "▼" : "▶"} {group.label}
                                    </span>

                                    <strong>{group.items.length}</strong>
                                </button>

                                {isOpen && (
                                    <div className="arsenal-group-items">
                                        {group.key === "weapon" ? (
                                            WEAPON_SUBTYPE_OPTIONS.map((subtype) => {
                                                const subtypeItems = group.items.filter(
                                                    (item) =>
                                                        (item.weaponSubtype ?? "other") === subtype.value,
                                                );

                                                if (subtypeItems.length === 0) {
                                                    return null;
                                                }

                                                const subtypeGroupKey = `${group.key}-${subtype.value}`;
                                                const isSubtypeOpen =
                                                    openSubtypeGroups[subtypeGroupKey] ?? false;

                                                return (
                                                    <div key={subtypeGroupKey} className="arsenal-subgroup">
                                                        <button
                                                            className="arsenal-subgroup-header"
                                                            type="button"
                                                            onClick={() => toggleSubtypeGroup(subtypeGroupKey)}
                                                        >
                                                            <span>
                                                                {isSubtypeOpen ? "▼" : "▶"} {subtype.label}
                                                            </span>

                                                            <strong>{subtypeItems.length}</strong>
                                                        </button>

                                                        {isSubtypeOpen && (
                                                            <div className="arsenal-group-items">
                                                                {subtypeItems.map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        className={`arsenal-list-item ${selectedItem?.id === item.id ? "active" : ""}`}
                                                                        type="button"
                                                                        onClick={() => setSelectedItemId(item.id)}
                                                                    >
                                                                        <strong>{item.name}</strong>
                                                                        <span>{getItemSubtypeLabel(item)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : group.key === "armor" ? (
                                            ARMOR_SUBTYPE_OPTIONS.map((subtype) => {
                                                const subtypeItems = group.items.filter(
                                                    (item) =>
                                                        (item.armorSubtype ??
                                                            getArmorSubtypeFromSlot(item.slot) ??
                                                            "other") === subtype.value,
                                                );

                                                if (subtypeItems.length === 0) {
                                                    return null;
                                                }

                                                const subtypeGroupKey = `${group.key}-${subtype.value}`;
                                                const isSubtypeOpen =
                                                    openSubtypeGroups[subtypeGroupKey] ?? false;

                                                return (
                                                    <div key={subtypeGroupKey} className="arsenal-subgroup">
                                                        <button
                                                            className="arsenal-subgroup-header"
                                                            type="button"
                                                            onClick={() => toggleSubtypeGroup(subtypeGroupKey)}
                                                        >
                                                            <span>
                                                                {isSubtypeOpen ? "▼" : "▶"} {subtype.label}
                                                            </span>

                                                            <strong>{subtypeItems.length}</strong>
                                                        </button>

                                                        {isSubtypeOpen && (
                                                            <div className="arsenal-group-items">
                                                                {subtypeItems.map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        className={`arsenal-list-item ${selectedItem?.id === item.id ? "active" : ""}`}
                                                                        type="button"
                                                                        onClick={() => setSelectedItemId(item.id)}
                                                                    >
                                                                        <strong>{item.name}</strong>
                                                                        <span>{getItemSubtypeLabel(item)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : group.key === "resource" ? (
                                            RESOURCE_SUBTYPE_OPTIONS.map((subtype) => {
                                                const subtypeItems = group.items.filter(
                                                    (item) =>
                                                        (item.resourceSubtype ?? "other") === subtype.value,
                                                );

                                                if (subtypeItems.length === 0) {
                                                    return null;
                                                }

                                                const subtypeGroupKey = `${group.key}-${subtype.value}`;
                                                const isSubtypeOpen =
                                                    openSubtypeGroups[subtypeGroupKey] ?? false;

                                                return (
                                                    <div key={subtypeGroupKey} className="arsenal-subgroup">
                                                        <button
                                                            className="arsenal-subgroup-header"
                                                            type="button"
                                                            onClick={() => toggleSubtypeGroup(subtypeGroupKey)}
                                                        >
                                                            <span>
                                                                {isSubtypeOpen ? "▼" : "▶"} {subtype.label}
                                                            </span>

                                                            <strong>{subtypeItems.length}</strong>
                                                        </button>

                                                        {isSubtypeOpen && (
                                                            <div className="arsenal-group-items">
                                                                {subtypeItems.map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        className={`arsenal-list-item ${selectedItem?.id === item.id ? "active" : ""}`}
                                                                        type="button"
                                                                        onClick={() => setSelectedItemId(item.id)}
                                                                    >
                                                                        <strong>{item.name}</strong>
                                                                        <span>{getItemSubtypeLabel(item)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            group.items.map((item) => (
                                                <button
                                                    key={item.id}
                                                    className={`arsenal-list-item ${selectedItem?.id === item.id ? "active" : ""}`}
                                                    type="button"
                                                    onClick={() => setSelectedItemId(item.id)}
                                                >
                                                    <strong>{item.name}</strong>
                                                    <span>{getArsenalCategoryLabel(item.category)}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                                            updateItemCategory(event.target.value as ArsenalItemCategory)
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
                                    Слот / место
                                    <select
                                        value={selectedItem.slot}
                                        onChange={(event) =>
                                            updateItemSlot(event.target.value as ArsenalItemSlot)
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

                            <div className="arsenal-form-grid">
                                <label>
                                    Редкость
                                    <select
                                        value={selectedItem.rarity}
                                        onChange={(event) =>
                                            updateItem({ rarity: event.target.value as ArsenalItemRarity })
                                        }
                                    >
                                        {RARITY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Доступность в находках
                                    <select
                                        value={selectedItem.lootAvailability}
                                        onChange={(event) =>
                                            updateItem({
                                                lootAvailability: event.target.value as ArsenalLootAvailability,
                                            })
                                        }
                                    >
                                        {LOOT_AVAILABILITY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Состояние
                                    <select
                                        value={selectedItem.condition}
                                        onChange={(event) =>
                                            updateItem({ condition: event.target.value as ArsenalItemCondition })
                                        }
                                    >
                                        {CONDITION_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
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
                                    Ручные теги / заметки
                                    <input
                                        value={selectedItem.tags}
                                        onChange={(event) => updateItem({ tags: event.target.value })}
                                        placeholder="Свободный текст, если нужно"
                                    />
                                </label>
                            </div>

                            <section className="arsenal-loot-tags-panel">
                                <div>
                                    <p className="eyebrow">Генератор находок</p>
                                    <h4>Лут-теги</h4>
                                </div>

                                {lootTagGroups.map((group) => (
                                    <div key={group.title} className="arsenal-loot-tag-group">
                                        <strong>{group.title}</strong>

                                        <div className="arsenal-loot-tag-list">
                                            {group.options.map((option) => {
                                                const isActive = selectedItem.lootTags.includes(option.value);

                                                return (
                                                    <button
                                                        key={option.value}
                                                        className={isActive ? "active" : ""}
                                                        type="button"
                                                        onClick={() => toggleLootTag(option.value)}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <label>
                                Описание
                                <textarea
                                    value={selectedItem.description}
                                    onChange={(event) =>
                                        updateItem({ description: event.target.value })
                                    }
                                    placeholder="Что это за предмет, как выглядит, где используется..."
                                />
                            </label>

                            <label>
                                Свойства / правила
                                <textarea
                                    value={selectedItem.rules}
                                    onChange={(event) => updateItem({ rules: event.target.value })}
                                    placeholder="Краткие правила, эффекты, ограничения, поломки, особенности..."
                                />
                            </label>

                            {selectedItem.category === "weapon" && (
                                <label>
                                    Подтип оружия
                                    <select
                                        value={selectedItem.weaponSubtype ?? "other"}
                                        onChange={(event) =>
                                            updateItem({
                                                weaponSubtype: event.target.value as ArsenalWeaponSubtype,
                                            })
                                        }
                                    >
                                        {WEAPON_SUBTYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {selectedItem.category === "armor" && (
                                <label>
                                    Подтип брони
                                    <select
                                        value={
                                            selectedItem.armorSubtype ??
                                            getArmorSubtypeFromSlot(selectedItem.slot) ??
                                            "other"
                                        }
                                        onChange={(event) =>
                                            updateItem({
                                                armorSubtype: event.target.value as ArsenalArmorSubtype,
                                            })
                                        }
                                    >
                                        {ARMOR_SUBTYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {selectedItem.category === "resource" && (
                                <label>
                                    Подтип ресурса
                                    <select
                                        value={selectedItem.resourceSubtype ?? "other"}
                                        onChange={(event) =>
                                            updateItem({
                                                resourceSubtype: event.target.value as ArsenalResourceSubtype,
                                            })
                                        }
                                    >
                                        {RESOURCE_SUBTYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {selectedItem.slot === "loadBearing" && (
                                <label>
                                    Количество быстрых слотов
                                    <select
                                        value={selectedItem.quickSlotCount ?? 2}
                                        onChange={(event) =>
                                            updateItem({
                                                quickSlotCount: Number(event.target.value) as 2 | 4 | 6,
                                            })
                                        }
                                    >
                                        <option value={2}>2 быстрых слота</option>
                                        <option value={4}>4 быстрых слота</option>
                                        <option value={6}>6 быстрых слотов</option>
                                    </select>
                                </label>
                            )}

                            {selectedItem.slot === "backpack" && (
                                <label>
                                    Вместимость поклажи
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={selectedItem.backpackSlotCount ?? 6}
                                        onChange={(event) =>
                                            updateItem({
                                                backpackSlotCount: Math.max(
                                                    0,
                                                    Math.floor(Number(event.target.value) || 0),
                                                ),
                                            })
                                        }
                                    />
                                </label>
                            )}

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
                                <dt>Редкость</dt>
                                <dd>{getRarityLabel(selectedItem.rarity)}</dd>

                                <dt>Доступность</dt>
                                <dd>{getLootAvailabilityLabel(selectedItem.lootAvailability)}</dd>

                                <dt>Состояние</dt>
                                <dd>{getConditionLabel(selectedItem.condition)}</dd>

                                {selectedItem.quickSlotCount && (
                                    <>
                                        <dt>Быстрые слоты</dt>
                                        <dd>{selectedItem.quickSlotCount}</dd>
                                    </>
                                )}

                                {typeof selectedItem.backpackSlotCount === "number" && (
                                    <>
                                        <dt>Вместимость поклажи</dt>
                                        <dd>{selectedItem.backpackSlotCount}</dd>
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

                                {selectedItem.lootTags.length > 0 && (
                                    <>
                                        <dt>Лут-теги</dt>
                                        <dd>
                                            {selectedItem.lootTags
                                                .map((tag) => getLootTagLabel(tag))
                                                .join(", ")}
                                        </dd>
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