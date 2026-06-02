import { useEffect, useRef, useState } from "react";
import { CharacterPreview } from "./CharacterPreview";
import type {
    ArsenalItem,
    ArsenalItemSlot,
    CharacterBodyZone,
    CharacterConditionEntry,
    CharacterConditionKey,
    CharacterEmpathy,
    CharacterInventory,
    CharacterMass,
    CharacterSkillKey,
    CharacterWoundEntry,
    CharacterWoundSeverity,
    CharacterWoundStatus,
    CharacterWoundType,
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

const CONDITION_OPTIONS: {
    key: CharacterConditionKey;
    label: string;
}[] = [
        { key: "bleeding", label: "Кровотечение" },
        { key: "stunned", label: "Оглушён" },
        { key: "panic", label: "Паника" },
        { key: "exhausted", label: "Истощён" },
        { key: "limping", label: "Хромота" },
        { key: "infection", label: "Заражение" },
        { key: "unconscious", label: "Без сознания" },
        { key: "pain", label: "Боль" },
        { key: "burning", label: "Горит" },
        { key: "echoPressure", label: "Эхо-давление" },
    ];

const BODY_ZONE_OPTIONS: {
    value: CharacterBodyZone;
    label: string;
}[] = [
        { value: "head", label: "Голова" },
        { value: "torso", label: "Торс" },
        { value: "leftArm", label: "Левая рука" },
        { value: "rightArm", label: "Правая рука" },
        { value: "leftLeg", label: "Левая нога" },
        { value: "rightLeg", label: "Правая нога" },
        { value: "wholeBody", label: "Всё тело" },
    ];

const WOUND_SEVERITY_OPTIONS: {
    value: CharacterWoundSeverity;
    label: string;
}[] = [
        { value: "light", label: "Лёгкая" },
        { value: "medium", label: "Средняя" },
        { value: "heavy", label: "Тяжёлая" },
        { value: "critical", label: "Критическая" },
    ];

const WOUND_TYPE_OPTIONS: {
    value: CharacterWoundType;
    label: string;
}[] = [
        { value: "cut", label: "Резаная" },
        { value: "piercing", label: "Колотая" },
        { value: "gunshot", label: "Огнестрельная" },
        { value: "blunt", label: "Дробящая" },
        { value: "burn", label: "Ожог" },
        { value: "shrapnel", label: "Осколочная" },
        { value: "bite", label: "Укус" },
        { value: "echo", label: "Эхо-поражение" },
    ];

const WOUND_STATUS_LABELS: Record<CharacterWoundStatus, string> = {
    fresh: "Свежая",
    stabilized: "Стабилизирована",
    worsened: "Ухудшена",
};

function getConditionLabel(key: CharacterConditionKey) {
    return CONDITION_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

function getBodyZoneLabel(value: CharacterBodyZone) {
    return BODY_ZONE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getWoundSeverityLabel(value: CharacterWoundSeverity) {
    return (
        WOUND_SEVERITY_OPTIONS.find((option) => option.value === value)?.label ??
        value
    );
}

function getWoundTypeLabel(value: CharacterWoundType) {
    return WOUND_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

const CHARACTER_SKILL_LABELS: {
    key: CharacterSkillKey;
    label: string;
}[] = [
        { key: "melee", label: "Ближний бой" },
        { key: "shooting", label: "Стрельба" },
        { key: "specialWeapons", label: "Особое оружие" },
        { key: "athletics", label: "Атлетика" },
        { key: "endurance", label: "Выносливость" },
        { key: "stealth", label: "Скрытность" },
        { key: "observation", label: "Наблюдательность" },
        { key: "tracking", label: "Следопытство" },
        { key: "navigation", label: "Навигация" },
        { key: "survival", label: "Выживание" },
        { key: "firstAid", label: "Первая помощь" },
        { key: "medicine", label: "Медицина" },
        { key: "repair", label: "Ремонт" },
        { key: "devices", label: "Работа с устройствами" },
        { key: "crowns", label: "Венцы" },
        { key: "driving", label: "Вождение" },
        { key: "tactics", label: "Тактика" },
        { key: "intimidation", label: "Запугивание" },
        { key: "negotiation", label: "Переговоры" },
        { key: "insight", label: "Проницательность" },
        { key: "criminal", label: "Криминальная среда" },
        { key: "factions", label: "Фракции" },
        { key: "neurography", label: "Нейрогравюра" },
        { key: "echoInfophone", label: "Эхо и инфофон" },
    ];

const BACKPACK_CATEGORY_FILTERS: {
    value: "all" | ArsenalItem["category"];
    label: string;
}[] = [
        { value: "all", label: "Все категории" },
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

const STARTING_SKILL_POINTS = 12;
const STARTING_SKILL_MAX = 3;

type CharacterTab =
    | "dossier"
    | "condition"
    | "skills"
    | "equipment"
    | "relations"
    | "master";

type EquipmentSection =
    | "weapons"
    | "armor"
    | "equipment"
    | "quickAccess"
    | "backpack"
    | "cryptotoken";

type SkillsSection = "specializations" | "traits";

type RelationsSection =
    | "contacts"
    | "debts"
    | "enemies"
    | "patrons"
    | "oldName";

type MasterSection = "notes" | "secretHooks" | "progression" | "danger";

type CharacterRosterProps = {
    characters: PlayerCharacter[];
    arsenalItems: ArsenalItem[];
    initialCharacterId?: string | null;
    isPlayerMode: boolean;
    onCreateCharacter: () => PlayerCharacter;
    onUpdateCharacter: (character: PlayerCharacter) => void;
    onDeleteCharacter: (characterId: string) => void;
    onClose: () => void;
};

export function CharacterRoster({
    characters,
    arsenalItems,
    initialCharacterId,
    isPlayerMode,
    onCreateCharacter,
    onUpdateCharacter,
    onDeleteCharacter,
    onClose,
}: CharacterRosterProps) {
    const canEditCharacters = !isPlayerMode;
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
        characters[0]?.id ?? null,
    );
    const [activeTab, setActiveTab] = useState<CharacterTab>("dossier");

    const lastInitialCharacterIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!initialCharacterId) {
            return;
        }

        if (lastInitialCharacterIdRef.current === initialCharacterId) {
            return;
        }

        const characterExists = characters.some(
            (character) => character.id === initialCharacterId,
        );

        if (!characterExists) {
            return;
        }

        lastInitialCharacterIdRef.current = initialCharacterId;
        setSelectedCharacterId(initialCharacterId);
        setActiveTab("dossier");
    }, [characters, initialCharacterId]);

    useEffect(() => {
        if (isPlayerMode && activeTab === "master") {
            setActiveTab("dossier");
        }
    }, [isPlayerMode, activeTab]);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [backpackSearchQuery, setBackpackSearchQuery] = useState("");
    const [backpackCategoryFilter, setBackpackCategoryFilter] = useState<
        "all" | ArsenalItem["category"]
    >("all");
    const [backpackSelectedItemId, setBackpackSelectedItemId] = useState("");
    const [backpackQuantity, setBackpackQuantity] = useState(1);

    const [woundZone, setWoundZone] = useState<CharacterBodyZone>("torso");
    const [woundSeverity, setWoundSeverity] =
        useState<CharacterWoundSeverity>("light");
    const [woundType, setWoundType] = useState<CharacterWoundType>("cut");

    const [openEquipmentSections, setOpenEquipmentSections] = useState<
        Record<EquipmentSection, boolean>
    >({
        weapons: true,
        armor: false,
        equipment: false,
        quickAccess: false,
        backpack: false,
        cryptotoken: false,
    });

    const [openSkillsSections, setOpenSkillsSections] = useState<
        Record<SkillsSection, boolean>
    >({
        specializations: true,
        traits: false,
    });

    const [openRelationsSections, setOpenRelationsSections] = useState<
        Record<RelationsSection, boolean>
    >({
        contacts: true,
        debts: false,
        enemies: false,
        patrons: false,
        oldName: false,
    });

    const [openMasterSections, setOpenMasterSections] = useState<
        Record<MasterSection, boolean>
    >({
        notes: true,
        secretHooks: false,
        progression: false,
        danger: false,
    });

    const selectedCharacter =
        characters.find((character) => character.id === selectedCharacterId) ?? null;

    const spentSkillPoints = selectedCharacter
        ? Object.values(selectedCharacter.skills).reduce(
            (sum, value) => sum + value,
            0,
        )
        : 0;

    const hasTooManySkillPoints = spentSkillPoints > STARTING_SKILL_POINTS;

    const hasSkillAboveStartingMax = selectedCharacter
        ? Object.values(selectedCharacter.skills).some(
            (value) => value > STARTING_SKILL_MAX,
        )
        : false;

    function createCharacter() {
        if (!canEditCharacters) {
            return;
        }

        const newCharacter = onCreateCharacter();

        setSelectedCharacterId(newCharacter.id);
        setActiveTab("dossier");
    }

    function updateSelectedCharacter(updatedFields: Partial<PlayerCharacter>) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        onUpdateCharacter({
            ...selectedCharacter,
            ...updatedFields,
        });
    }

    function getArsenalItem(itemId: string | null) {
        if (!itemId) {
            return null;
        }

        return arsenalItems.find((item) => item.id === itemId) ?? null;
    }

    function isTwoShoulderWeapon(itemId: string | null) {
        const item = getArsenalItem(itemId);

        return item?.slot === "shoulderWeapon" && item.slotUsage === "twoShoulders";
    }

    function getBlockedShoulderSlot(
        slotKey: keyof CharacterInventory["weaponSlots"],
    ): keyof CharacterInventory["weaponSlots"] | null {
        if (!selectedCharacter) {
            return null;
        }

        if (slotKey === "small") {
            return null;
        }

        const oppositeSlotKey = slotKey === "shoulder1" ? "shoulder2" : "shoulder1";
        const oppositeItemId =
            selectedCharacter.inventory.weaponSlots[oppositeSlotKey].itemId;

        return isTwoShoulderWeapon(oppositeItemId) ? oppositeSlotKey : null;
    }

    function getArsenalItemsForSlots(slots: ArsenalItemSlot[]) {
        return arsenalItems.filter((item) => slots.includes(item.slot));
    }

    function getInventoryItemName(itemId: string | null) {
        return getArsenalItem(itemId)?.name ?? "Пусто";
    }

    function updateInventory(nextInventory: CharacterInventory) {
        if (!canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            inventory: nextInventory,
        });
    }

    function updateWeaponSlot(
        slotKey: keyof CharacterInventory["weaponSlots"],
        itemId: string | null,
    ) {
        if (!selectedCharacter) {
            return;
        }

        const weaponSlots = selectedCharacter.inventory.weaponSlots;

        if (slotKey === "small") {
            updateInventory({
                ...selectedCharacter.inventory,
                weaponSlots: {
                    ...weaponSlots,
                    small: {
                        ...weaponSlots.small,
                        itemId,
                    },
                },
            });
            return;
        }

        const oppositeSlotKey = slotKey === "shoulder1" ? "shoulder2" : "shoulder1";
        const selectedItem = getArsenalItem(itemId);

        if (selectedItem?.slotUsage === "twoShoulders") {
            updateInventory({
                ...selectedCharacter.inventory,
                weaponSlots: {
                    ...weaponSlots,
                    [slotKey]: {
                        ...weaponSlots[slotKey],
                        itemId,
                    },
                    [oppositeSlotKey]: {
                        ...weaponSlots[oppositeSlotKey],
                        itemId: null,
                        note: "Занято тяжёлым оружием",
                    },
                },
            });
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            weaponSlots: {
                ...weaponSlots,
                [slotKey]: {
                    ...weaponSlots[slotKey],
                    itemId,
                },
                ...(itemId === null
                    ? {
                        [oppositeSlotKey]: {
                            ...weaponSlots[oppositeSlotKey],
                            note:
                                weaponSlots[oppositeSlotKey].note === "Занято тяжёлым оружием"
                                    ? ""
                                    : weaponSlots[oppositeSlotKey].note,
                        },
                    }
                    : {}),
            },
        });
    }

    function updateWeaponSlotNote(
        slotKey: keyof CharacterInventory["weaponSlots"],
        note: string,
    ) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            weaponSlots: {
                ...selectedCharacter.inventory.weaponSlots,
                [slotKey]: {
                    ...selectedCharacter.inventory.weaponSlots[slotKey],
                    note,
                },
            },
        });
    }

    function updateArmorSlot(
        slotKey: keyof CharacterInventory["armorSlots"],
        itemId: string | null,
    ) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            armorSlots: {
                ...selectedCharacter.inventory.armorSlots,
                [slotKey]: {
                    ...selectedCharacter.inventory.armorSlots[slotKey],
                    itemId,
                },
            },
        });
    }

    function updateArmorSlotNote(
        slotKey: keyof CharacterInventory["armorSlots"],
        note: string,
    ) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            armorSlots: {
                ...selectedCharacter.inventory.armorSlots,
                [slotKey]: {
                    ...selectedCharacter.inventory.armorSlots[slotKey],
                    note,
                },
            },
        });
    }

    function updateProtectionSlot(itemId: string | null) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            protectionSlot: {
                ...selectedCharacter.inventory.protectionSlot,
                itemId,
            },
        });
    }

    function updateProtectionSlotNote(note: string) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            protectionSlot: {
                ...selectedCharacter.inventory.protectionSlot,
                note,
            },
        });
    }

    function getEquippedEquipmentSlot() {
        if (!selectedCharacter) {
            return {
                itemId: null,
                note: "",
            };
        }

        return (
            selectedCharacter.inventory.equipmentSlot ?? {
                itemId: null,
                note: "",
            }
        );
    }

    function updateEquipmentSlot(itemId: string | null) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            equipmentSlot: {
                ...getEquippedEquipmentSlot(),
                itemId,
            },
        });
    }

    function updateEquipmentSlotNote(note: string) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            equipmentSlot: {
                ...getEquippedEquipmentSlot(),
                note,
            },
        });
    }

    function getBackpackSlotCount(itemId: string | null) {
        const backpackItem = getArsenalItem(itemId);

        if (
            backpackItem?.slot === "backpack" &&
            typeof backpackItem.backpackSlotCount === "number" &&
            Number.isFinite(backpackItem.backpackSlotCount)
        ) {
            return Math.max(0, Math.floor(backpackItem.backpackSlotCount));
        }

        return 0;
    }

    function getBackpackUsedSlots() {
        if (!selectedCharacter) {
            return 0;
        }

        return selectedCharacter.inventory.backpack.length;
    }

    function getEquippedBackpackSlot() {
        if (!selectedCharacter) {
            return {
                itemId: null,
                note: "",
            };
        }

        return (
            selectedCharacter.inventory.backpackSlot ?? {
                itemId: null,
                note: "",
            }
        );
    }

    function getBackpackCapacity() {
        if (!selectedCharacter) {
            return 0;
        }

        return getBackpackSlotCount(getEquippedBackpackSlot().itemId);
    }

    function getQuickSlotCountForLoadBearing(itemId: string | null) {
        const loadBearingItem = getArsenalItem(itemId);

        if (
            loadBearingItem?.quickSlotCount === 2 ||
            loadBearingItem?.quickSlotCount === 4 ||
            loadBearingItem?.quickSlotCount === 6
        ) {
            return loadBearingItem.quickSlotCount;
        }

        return 2;
    }

    function getPreparedQuickSlots() {
        if (!selectedCharacter) {
            return [];
        }

        const quickSlotCount = getQuickSlotCountForLoadBearing(
            selectedCharacter.inventory.loadBearing.itemId,
        );

        return Array.from({ length: quickSlotCount }, (_, index) => {
            const existingSlot = selectedCharacter.inventory.loadBearing.quickSlots[index];

            return {
                id: existingSlot?.id ?? `quick-${index + 1}`,
                itemId: existingSlot?.itemId ?? null,
                quantity: existingSlot?.quantity ?? 1,
                note: existingSlot?.note ?? "",
            };
        });
    }

    function updateBackpackSlotItem(itemId: string | null) {
        if (!selectedCharacter) {
            return;
        }

        const nextCapacity = getBackpackSlotCount(itemId);
        const usedSlots = getBackpackUsedSlots();

        if (itemId === null && usedSlots > 0) {
            const shouldRemoveBackpack = window.confirm(
                "В рюкзаке уже есть предметы. Если снять рюкзак, содержимое останется в списке, но вместимость станет 0. Продолжить?",
            );

            if (!shouldRemoveBackpack) {
                return;
            }
        }

        if (itemId !== null && nextCapacity < usedSlots) {
            const shouldEquipSmallerBackpack = window.confirm(
                `В выбранном рюкзаке ${nextCapacity} слотов, а сейчас занято ${usedSlots}. Лишние предметы не удалятся, но рюкзак будет перегружен. Продолжить?`,
            );

            if (!shouldEquipSmallerBackpack) {
                return;
            }
        }

        updateInventory({
            ...selectedCharacter.inventory,
            backpackSlot: {
                ...getEquippedBackpackSlot(),
                itemId,
            },
        });
    }

    function updateBackpackSlotNote(note: string) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            backpackSlot: {
                ...getEquippedBackpackSlot(),
                note,
            },
        });
    }

    function updateLoadBearingItem(itemId: string | null) {
        if (!selectedCharacter) {
            return;
        }

        const quickSlotCount = getQuickSlotCountForLoadBearing(itemId);
        const currentQuickSlots = selectedCharacter.inventory.loadBearing.quickSlots;

        const nextQuickSlots = Array.from({ length: quickSlotCount }, (_, index) => {
            const existingSlot = currentQuickSlots[index];

            return {
                id: existingSlot?.id ?? `quick-${index + 1}`,
                itemId: existingSlot?.itemId ?? null,
                quantity: existingSlot?.quantity ?? 1,
                note: existingSlot?.note ?? "",
            };
        });

        updateInventory({
            ...selectedCharacter.inventory,
            loadBearing: {
                ...selectedCharacter.inventory.loadBearing,
                itemId,
                quickSlots: nextQuickSlots,
            },
        });
    }

    function updateLoadBearingNote(note: string) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            loadBearing: {
                ...selectedCharacter.inventory.loadBearing,
                note,
            },
        });
    }

    function updateQuickSlot(
        slotIndex: number,
        updatedFields: Partial<CharacterInventory["loadBearing"]["quickSlots"][number]>,
    ) {
        if (!selectedCharacter) {
            return;
        }

        const quickSlots = getPreparedQuickSlots().map((slot, index) =>
            index === slotIndex
                ? {
                    ...slot,
                    ...updatedFields,
                }
                : slot,
        );

        updateInventory({
            ...selectedCharacter.inventory,
            loadBearing: {
                ...selectedCharacter.inventory.loadBearing,
                quickSlots,
            },
        });
    }

    function updateWallet(updatedFields: Partial<PlayerCharacter["wallet"]>) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            wallet: {
                ...selectedCharacter.wallet,
                ...updatedFields,
            },
        });
    }

    function getCharacterConditions(character: PlayerCharacter) {
        return character.conditions ?? [];
    }

    function getCharacterWounds(character: PlayerCharacter) {
        return character.wounds ?? [];
    }

    function addCondition(conditionKey: CharacterConditionKey) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        const currentConditions = getCharacterConditions(selectedCharacter);
        const alreadyHasCondition = currentConditions.some(
            (condition) => condition.key === conditionKey,
        );

        if (alreadyHasCondition) {
            return;
        }

        const nextCondition: CharacterConditionEntry = {
            id: `condition-${Date.now()}-${conditionKey}`,
            key: conditionKey,
            note: "",
        };

        updateSelectedCharacter({
            conditions: [...currentConditions, nextCondition],
        });
    }

    function deleteCondition(conditionId: string) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            conditions: getCharacterConditions(selectedCharacter).filter(
                (condition) => condition.id !== conditionId,
            ),
        });
    }

    function updateCondition(
        conditionId: string,
        updatedFields: Partial<CharacterConditionEntry>,
    ) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            conditions: getCharacterConditions(selectedCharacter).map((condition) =>
                condition.id === conditionId
                    ? {
                        ...condition,
                        ...updatedFields,
                    }
                    : condition,
            ),
        });
    }

    function addWound() {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        const nextWound: CharacterWoundEntry = {
            id: `wound-${Date.now()}`,
            zone: woundZone,
            severity: woundSeverity,
            woundType,
            status: "fresh",
            note: "",
        };

        updateSelectedCharacter({
            wounds: [...getCharacterWounds(selectedCharacter), nextWound],
        });
    }

    function updateWound(
        woundId: string,
        updatedFields: Partial<CharacterWoundEntry>,
    ) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            wounds: getCharacterWounds(selectedCharacter).map((wound) =>
                wound.id === woundId
                    ? {
                        ...wound,
                        ...updatedFields,
                    }
                    : wound,
            ),
        });
    }

    function deleteWound(woundId: string) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        updateSelectedCharacter({
            wounds: getCharacterWounds(selectedCharacter).filter(
                (wound) => wound.id !== woundId,
            ),
        });
    }

    function addBackpackEntry() {
        if (!selectedCharacter) {
            return;
        }

        const backpackCapacity = getBackpackCapacity();
        const usedSlots = getBackpackUsedSlots();

        if (backpackCapacity <= 0) {
            window.alert("Сначала экипируй рюкзак в слот “Рюкзак / спина”.");
            return;
        }

        if (usedSlots >= backpackCapacity) {
            window.alert("В рюкзаке нет свободных слотов.");
            return;
        }

        const filteredItems = getFilteredBackpackAllowedItems();
        const selectedItem =
            filteredItems.find((item) => item.id === backpackSelectedItemId) ??
            filteredItems[0] ??
            null;

        if (!selectedItem) {
            window.alert("Не найден подходящий предмет. Измени поиск или категорию.");
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            backpack: [
                ...selectedCharacter.inventory.backpack,
                {
                    id: `backpack-${Date.now()}`,
                    itemId: selectedItem.id,
                    quantity: Math.max(1, Math.floor(backpackQuantity)),
                    note: "",
                },
            ],
        });

        setBackpackSelectedItemId("");
        setBackpackQuantity(1);
    }

    function updateBackpackEntry(
        entryId: string,
        updatedFields: Partial<CharacterInventory["backpack"][number]>,
    ) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            backpack: selectedCharacter.inventory.backpack.map((entry) =>
                entry.id === entryId
                    ? {
                        ...entry,
                        ...updatedFields,
                    }
                    : entry,
            ),
        });
    }

    function deleteBackpackEntry(entryId: string) {
        if (!selectedCharacter) {
            return;
        }

        updateInventory({
            ...selectedCharacter.inventory,
            backpack: selectedCharacter.inventory.backpack.filter(
                (entry) => entry.id !== entryId,
            ),
        });
    }

    function renderInventorySelect(
        value: string | null,
        allowedSlots: ArsenalItemSlot[],
        onChange: (itemId: string | null) => void,
        isDisabled = false,
    ) {
        const availableItems = getArsenalItemsForSlots(allowedSlots);

        return (
            <select
                value={value ?? ""}
                disabled={isDisabled}
                onChange={(event) => onChange(event.target.value || null)}
            >
                <option value="">Пусто</option>

                {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>
        );
    }

    function getBackpackAllowedItems() {
        return arsenalItems.filter((item) => {
            if (item.slot === "backpack") {
                return false;
            }

            if (item.slot === "loadBearing") {
                return false;
            }

            return true;
        });
    }

    function normalizeBackpackSearchText(value: string) {
        return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
    }

    function getFilteredBackpackAllowedItems() {
        const normalizedSearchQuery = normalizeBackpackSearchText(backpackSearchQuery);

        return getBackpackAllowedItems().filter((item) => {
            const matchesCategory =
                backpackCategoryFilter === "all" || item.category === backpackCategoryFilter;

            const searchableText = normalizeBackpackSearchText(
                [
                    item.name,
                    item.description,
                    item.rules,
                    item.tags,
                    item.rarity,
                    item.weight,
                    item.price,
                ].join(" "),
            );

            const matchesSearch =
                normalizedSearchQuery.length === 0 ||
                searchableText.includes(normalizedSearchQuery);

            return matchesCategory && matchesSearch;
        });
    }

    function renderBackpackItemSelect(
        value: string,
        onChange: (itemId: string) => void,
    ) {
        const availableItems = getBackpackAllowedItems();

        return (
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>
        );
    }

    function updateSelectedSkill(skillKey: CharacterSkillKey, nextValue: number) {
        if (!selectedCharacter || !canEditCharacters) {
            return;
        }

        const normalizedValue = Math.max(0, Math.min(10, nextValue));

        onUpdateCharacter({
            ...selectedCharacter,
            skills: {
                ...selectedCharacter.skills,
                [skillKey]: normalizedValue,
            },
        });
    }

    function deleteSelectedCharacter() {
        if (!selectedCharacter || !canEditCharacters) {
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
        setActiveTab("dossier");
    }

    function sanitizeFileName(value: string) {
        const cleanedValue = value
            .trim()
            .replace(/[\\/:*?"<>|]+/g, "-")
            .replace(/\s+/g, "_");

        return cleanedValue || "character";
    }

    function getImportedCharacterData(
        parsedData: unknown,
    ): Partial<PlayerCharacter> {
        if (typeof parsedData !== "object" || parsedData === null) {
            throw new Error("Imported character data is not an object.");
        }

        if ("character" in parsedData) {
            const payload = parsedData as { character?: Partial<PlayerCharacter> };

            if (!payload.character || typeof payload.character !== "object") {
                throw new Error("Character archive does not contain character data.");
            }

            return payload.character;
        }

        return parsedData as Partial<PlayerCharacter>;
    }

    function exportSelectedCharacter() {
        if (!selectedCharacter) {
            return;
        }

        const payload = {
            archiveType: "nri-player-character",
            version: 1,
            exportedAt: new Date().toISOString(),
            character: selectedCharacter,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${sanitizeFileName(
            selectedCharacter.characterName || "character",
        )}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    function importCharacterFromFile(file: File) {
        if (!canEditCharacters) {
            return;
        }
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const fileText = String(reader.result ?? "");
                const parsedData = JSON.parse(fileText);
                const importedData = getImportedCharacterData(parsedData);

                const newCharacter = onCreateCharacter();

                const importedCharacter: PlayerCharacter = {
                    ...newCharacter,
                    ...importedData,

                    id: newCharacter.id,

                    ownerPlayerId: importedData.ownerPlayerId,
                    ownerPlayerName: importedData.ownerPlayerName ?? "",
                    status: importedData.status ?? "approved",
                    isVisibleToPlayers: Boolean(importedData.isVisibleToPlayers),

                    characterName:
                        importedData.characterName?.trim() ||
                        newCharacter.characterName ||
                        "Импортированный Вольный Клинок",

                    skills: {
                        ...newCharacter.skills,
                        ...(importedData.skills ?? {}),
                    },

                    maxFate: Math.min(3, importedData.maxFate ?? newCharacter.maxFate),
                    fate: Math.min(
                        importedData.fate ?? newCharacter.fate,
                        Math.min(3, importedData.maxFate ?? newCharacter.maxFate),
                    ),
                };

                onUpdateCharacter(importedCharacter);
                setSelectedCharacterId(importedCharacter.id);
                setActiveTab("dossier");
            } catch {
                window.alert(
                    "Не удалось импортировать персонажа. Проверь, что выбран правильный JSON-файл персонажа.",
                );
            }
        };

        reader.readAsText(file);
    }

    function toggleEquipmentSection(section: EquipmentSection) {
        setOpenEquipmentSections((currentSections) => ({
            ...currentSections,
            [section]: !currentSections[section],
        }));
    }

    function toggleSkillsSection(section: SkillsSection) {
        setOpenSkillsSections((currentSections) => ({
            ...currentSections,
            [section]: !currentSections[section],
        }));
    }

    function toggleRelationsSection(section: RelationsSection) {
        setOpenRelationsSections((currentSections) => ({
            ...currentSections,
            [section]: !currentSections[section],
        }));
    }

    function toggleMasterSection(section: MasterSection) {
        setOpenMasterSections((currentSections) => ({
            ...currentSections,
            [section]: !currentSections[section],
        }));
    }

    return (
        <section
            className={`character-roster-window ${isPlayerMode ? "read-only" : ""}`}
        >
            <header className="character-roster-header">
                <div>
                    <p className="eyebrow">{isPlayerMode ? "Просмотр" : "Мастерская"}</p>
                    <h2>{isPlayerMode ? "Карты персонажей" : "Досье отряда"}</h2>
                </div>

                <button className="drawer-tab compact" type="button" onClick={onClose}>
                    ×
                </button>
            </header>

            <div className="character-roster-layout">
                <aside className="character-list-panel">
                    {canEditCharacters && (
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={createCharacter}
                        >
                            Добавить персонажа
                        </button>
                    )}

                    <div className="character-import-export-row">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={exportSelectedCharacter}
                            disabled={!selectedCharacter}
                        >
                            Экспорт
                        </button>

                        {canEditCharacters && (
                            <label className="secondary-button character-import-button">
                                Импорт
                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];

                                        if (file) {
                                            importCharacterFromFile(file);
                                        }

                                        event.currentTarget.value = "";
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    <button
                        className="secondary-button character-preview-button"
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={!selectedCharacter}
                    >
                        Просмотр / печать
                    </button>

                    {characters.length === 0 ? (
                        <p className="character-empty-text">
                            Персонажей пока нет. Добавь первого вольника отряда.
                        </p>
                    ) : (
                        <div className="character-card-list">
                            {characters.map((character) => {
                                const isSelected = character.id === selectedCharacterId;

                                const hasWounds =
                                    character.woundsAndConditions.trim().length > 0 ||
                                    (character.wounds ?? []).length > 0 ||
                                    (character.conditions ?? []).length > 0;
                                const hasReflection = character.reflectionNotes.trim().length > 0;
                                const isExhausted = character.physicalReserve <= 0;
                                const isBroken = character.psyche <= 0;
                                const isSpiritBroken = character.spirit <= 0;

                                const hasCriticalResource =
                                    isExhausted || isBroken || isSpiritBroken;

                                const conditionBadges = [
                                    hasWounds ? "Ранен" : null,
                                    hasReflection ? "Отражение" : null,
                                    isExhausted ? "Истощён" : null,
                                    isBroken ? "Срыв" : null,
                                    isSpiritBroken ? "Надлом" : null,
                                ].filter(Boolean);

                                return (
                                    <button
                                        key={character.id}
                                        className={`character-card-button ${isSelected ? "active" : ""
                                            } ${hasCriticalResource ? "critical" : ""}`}
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

                                        <span className="character-card-resources">
                                            ФЗ {character.physicalReserve}/
                                            {character.maxPhysicalReserve} · Психика{" "}
                                            {character.psyche}/{character.maxPsyche}
                                        </span>

                                        <span className="character-card-resources">
                                            Дух {character.spirit}/{character.maxSpirit} · Судьба{" "}
                                            {character.fate}/{character.maxFate}
                                        </span>

                                        {conditionBadges.length > 0 && (
                                            <span className="character-card-badges">
                                                {conditionBadges.map((badge) => (
                                                    <span key={badge} className="character-card-badge">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>

                {selectedCharacter ? (
                    <div className="character-editor-panel">
                        <div className="character-tabs">
                            <button
                                className={`character-tab ${activeTab === "dossier" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setActiveTab("dossier")}
                            >
                                Досье
                            </button>

                            <button
                                className={`character-tab ${activeTab === "condition" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setActiveTab("condition")}
                            >
                                Состояние
                            </button>

                            <button
                                className={`character-tab ${activeTab === "skills" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setActiveTab("skills")}
                            >
                                Навыки
                            </button>

                            <button
                                className={`character-tab ${activeTab === "equipment" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setActiveTab("equipment")}
                            >
                                Снаряжение
                            </button>

                            <button
                                className={`character-tab ${activeTab === "relations" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setActiveTab("relations")}
                            >
                                Связи
                            </button>

                            {!isPlayerMode && (
                                <button
                                    className={`character-tab ${activeTab === "master" ? "active" : ""}`}
                                    type="button"
                                    onClick={() => setActiveTab("master")}
                                >
                                    Мастер
                                </button>
                            )}
                        </div>

                        <div className="character-tab-content">
                            {activeTab === "dossier" && (
                                <section className="character-editor-section">
                                    <p className="eyebrow">Основное</p>

                                    <div className="character-form-grid">
                                        <label className="character-field">
                                            Игрок
                                            <input
                                                value={selectedCharacter.playerName}
                                                onChange={(event) =>
                                                    updateSelectedCharacter({
                                                        playerName: event.target.value,
                                                    })
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
                                                    updateSelectedCharacter({
                                                        nickname: event.target.value,
                                                    })
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
                                            Старое имя
                                            <input
                                                value={selectedCharacter.oldName}
                                                onChange={(event) =>
                                                    updateSelectedCharacter({
                                                        oldName: event.target.value,
                                                    })
                                                }
                                                placeholder="Старое имя, если известно"
                                            />
                                        </label>

                                        <label className="character-field">
                                            Происхождение
                                            <input
                                                value={selectedCharacter.origin}
                                                onChange={(event) =>
                                                    updateSelectedCharacter({
                                                        origin: event.target.value,
                                                    })
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
                                </section>
                            )}

                            {activeTab === "condition" && (
                                <section className="character-editor-section">
                                    <p className="eyebrow">Состояние</p>

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
                                            maxAllowed={3}
                                            onChangeValue={(value) =>
                                                updateSelectedCharacter({ fate: value })
                                            }
                                            onChangeMaxValue={(value) =>
                                                updateSelectedCharacter({ maxFate: value })
                                            }
                                        />
                                    </div>

                                    <div className="character-condition-manager">
                                        <div className="character-condition-block">
                                            <div className="character-condition-header">
                                                <div>
                                                    <p className="eyebrow">Состояния</p>
                                                    <h4>Быстрые метки</h4>
                                                </div>

                                                <span>
                                                    {getCharacterConditions(selectedCharacter).length} активно
                                                </span>
                                            </div>

                                            <div className="character-condition-buttons">
                                                {CONDITION_OPTIONS.map((condition) => {
                                                    const isActive = getCharacterConditions(
                                                        selectedCharacter,
                                                    ).some((entry) => entry.key === condition.key);

                                                    return (
                                                        <button
                                                            key={condition.key}
                                                            className={`character-condition-button ${isActive ? "active" : ""}`}
                                                            type="button"
                                                            onClick={() => addCondition(condition.key)}
                                                            disabled={isActive}
                                                        >
                                                            {condition.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {getCharacterConditions(selectedCharacter).length > 0 && (
                                                <div className="character-condition-list">
                                                    {getCharacterConditions(selectedCharacter).map((condition) => (
                                                        <div
                                                            key={condition.id}
                                                            className="character-condition-chip"
                                                        >
                                                            <strong>{getConditionLabel(condition.key)}</strong>

                                                            <input
                                                                value={condition.note}
                                                                onChange={(event) =>
                                                                    updateCondition(condition.id, {
                                                                        note: event.target.value,
                                                                    })
                                                                }
                                                                placeholder="Краткая заметка..."
                                                            />

                                                            <button
                                                                className="danger-button"
                                                                type="button"
                                                                onClick={() => deleteCondition(condition.id)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-condition-block">
                                            <div className="character-condition-header">
                                                <div>
                                                    <p className="eyebrow">Раны</p>
                                                    <h4>Добавить рану</h4>
                                                </div>

                                                <span>{getCharacterWounds(selectedCharacter).length} записано</span>
                                            </div>

                                            <div className="character-wound-add-grid">
                                                <label className="character-field">
                                                    Зона
                                                    <select
                                                        value={woundZone}
                                                        onChange={(event) =>
                                                            setWoundZone(event.target.value as CharacterBodyZone)
                                                        }
                                                    >
                                                        {BODY_ZONE_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label className="character-field">
                                                    Тяжесть
                                                    <select
                                                        value={woundSeverity}
                                                        onChange={(event) =>
                                                            setWoundSeverity(
                                                                event.target.value as CharacterWoundSeverity,
                                                            )
                                                        }
                                                    >
                                                        {WOUND_SEVERITY_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label className="character-field">
                                                    Тип
                                                    <select
                                                        value={woundType}
                                                        onChange={(event) =>
                                                            setWoundType(event.target.value as CharacterWoundType)
                                                        }
                                                    >
                                                        {WOUND_TYPE_OPTIONS.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <button
                                                    className="character-secondary-button"
                                                    type="button"
                                                    onClick={addWound}
                                                >
                                                    Добавить рану
                                                </button>
                                            </div>

                                            {getCharacterWounds(selectedCharacter).length > 0 && (
                                                <div className="character-wound-list">
                                                    {getCharacterWounds(selectedCharacter).map((wound) => (
                                                        <div
                                                            key={wound.id}
                                                            className={`character-wound-card wound-${wound.severity} wound-status-${wound.status}`}
                                                        >
                                                            <div className="character-wound-main">
                                                                <strong>
                                                                    {getWoundSeverityLabel(wound.severity)}{" "}
                                                                    {getWoundTypeLabel(wound.woundType).toLowerCase()} рана
                                                                </strong>

                                                                <span>
                                                                    {getBodyZoneLabel(wound.zone)} ·{" "}
                                                                    {WOUND_STATUS_LABELS[wound.status]}
                                                                </span>
                                                            </div>

                                                            <div className="character-wound-controls">
                                                                <select
                                                                    value={wound.status}
                                                                    onChange={(event) =>
                                                                        updateWound(wound.id, {
                                                                            status:
                                                                                event.target.value as CharacterWoundStatus,
                                                                        })
                                                                    }
                                                                >
                                                                    <option value="fresh">Свежая</option>
                                                                    <option value="stabilized">Стабилизирована</option>
                                                                    <option value="worsened">Ухудшена</option>
                                                                </select>

                                                                <input
                                                                    value={wound.note}
                                                                    onChange={(event) =>
                                                                        updateWound(wound.id, {
                                                                            note: event.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="Заметка: жгут, осколок, перевязка..."
                                                                />

                                                                <button
                                                                    className="danger-button"
                                                                    type="button"
                                                                    onClick={() => deleteWound(wound.id)}
                                                                >
                                                                    Удалить
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <label className="character-field wide">
                                            Свободная заметка по ранам
                                            <textarea
                                                value={selectedCharacter.woundsAndConditions}
                                                onChange={(event) =>
                                                    updateSelectedCharacter({
                                                        woundsAndConditions: event.target.value,
                                                    })
                                                }
                                                placeholder="Редкие эффекты, особые травмы, договорённости мастера..."
                                            />
                                        </label>
                                    </div>

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
                            )}

                            {activeTab === "skills" && (
                                <section className="character-editor-section">
                                    <div className="character-skills-header">
                                        <div>
                                            <p className="eyebrow">Навыки</p>
                                            <h3 className="character-section-title">
                                                Навыки персонажа
                                            </h3>
                                        </div>

                                        <div
                                            className={`character-skill-points ${hasTooManySkillPoints ? "warning" : ""
                                                }`}
                                        >
                                            Очки: {spentSkillPoints}/{STARTING_SKILL_POINTS}
                                        </div>
                                    </div>

                                    <p className="character-help-text">
                                        Стартовая рекомендация: 12 очков навыков, максимум 3 в
                                        одном навыке. Превышение не блокируется, но подсвечивается
                                        для контроля мастера.
                                    </p>

                                    {(hasTooManySkillPoints || hasSkillAboveStartingMax) && (
                                        <div className="character-warning-box">
                                            {hasTooManySkillPoints && (
                                                <p>
                                                    Потрачено больше 12 очков. Это нормально для опытного
                                                    персонажа, но не для стандартного старта.
                                                </p>
                                            )}

                                            {hasSkillAboveStartingMax && (
                                                <p>
                                                    Один или несколько навыков выше 3. Для стартового
                                                    персонажа это обычно недоступно без особого
                                                    разрешения.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="character-skills-grid">
                                        {CHARACTER_SKILL_LABELS.map((skill) => {
                                            const value = selectedCharacter.skills[skill.key];
                                            const isAboveStartingMax = value > STARTING_SKILL_MAX;

                                            return (
                                                <div
                                                    key={skill.key}
                                                    className={`character-skill-row ${isAboveStartingMax ? "above-starting-max" : ""
                                                        }`}
                                                >
                                                    <span className="character-skill-name">
                                                        {skill.label}
                                                    </span>

                                                    <div className="character-skill-controls">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateSelectedSkill(skill.key, value - 1)
                                                            }
                                                        >
                                                            −
                                                        </button>

                                                        <span>{value}</span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateSelectedSkill(skill.key, value + 1)
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="character-accordion-list character-skills-accordion-list">
                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleSkillsSection("specializations")}
                                            >
                                                <span>
                                                    {openSkillsSections.specializations ? "▼" : "▶"}{" "}
                                                    Специализации
                                                </span>
                                                <small>
                                                    узкие области внутри навыков: оружие, тропы, фракции,
                                                    режимы
                                                </small>
                                            </button>

                                            {openSkillsSections.specializations && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Специализации
                                                        <textarea
                                                            value={selectedCharacter.specializations}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    specializations: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Например: Стрельба — пистольверы; Ремонт — комген; Навигация — караванные тропы; Венцы — форсаж..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleSkillsSection("traits")}
                                            >
                                                <span>
                                                    {openSkillsSections.traits ? "▼" : "▶"} Черты
                                                </span>
                                                <small>
                                                    положительные, отрицательные, сюжетные и реалистичные
                                                    особенности
                                                </small>
                                            </button>

                                            {openSkillsSections.traits && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Черты
                                                        <textarea
                                                            value={selectedCharacter.traits}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    traits: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Например: Крепкий, Плохой сон, Долг, Узнаваемое лицо, Непереносимость Венца..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "equipment" && (
                                <section className="character-editor-section">
                                    <p className="eyebrow">Снаряжение</p>
                                    <h3 className="character-section-title">
                                        Инвентарь персонажа
                                    </h3>

                                    <p className="character-help-text">
                                        Предметы выбираются из Арсенала. Эхо редактирует карточки,
                                        Мастер выдаёт и снимает вещи у персонажей.
                                    </p>

                                    <div className="character-accordion-list">
                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("weapons")}
                                            >
                                                <span>
                                                    {openEquipmentSections.weapons ? "▼" : "▶"} Оружие
                                                </span>
                                                <small>два плечевых слота и малое оружие</small>
                                            </button>

                                            {openEquipmentSections.weapons && (
                                                <div className="character-accordion-body">
                                                    <div className="character-inventory-grid">
                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Плечо 1</p>
                                                            <h4>Основное оружие</h4>

                                                            {getBlockedShoulderSlot("shoulder1") ? (
                                                                <div className="character-slot-locked">
                                                                    Занято тяжёлым оружием:{" "}
                                                                    {getInventoryItemName(
                                                                        selectedCharacter.inventory.weaponSlots[
                                                                            getBlockedShoulderSlot("shoulder1") ?? "shoulder2"
                                                                        ].itemId,
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                renderInventorySelect(
                                                                    selectedCharacter.inventory.weaponSlots.shoulder1.itemId,
                                                                    ["shoulderWeapon"],
                                                                    (itemId) => updateWeaponSlot("shoulder1", itemId),
                                                                )
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.weaponSlots.shoulder1.note}
                                                                disabled={Boolean(getBlockedShoulderSlot("shoulder1"))}
                                                                onChange={(event) =>
                                                                    updateWeaponSlotNote("shoulder1", event.target.value)
                                                                }
                                                                placeholder="Заметка: ремень, состояние, боезапас."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Плечо 2</p>
                                                            <h4>Запасное оружие</h4>

                                                            {getBlockedShoulderSlot("shoulder2") ? (
                                                                <div className="character-slot-locked">
                                                                    Занято тяжёлым оружием:{" "}
                                                                    {getInventoryItemName(
                                                                        selectedCharacter.inventory.weaponSlots[
                                                                            getBlockedShoulderSlot("shoulder2") ?? "shoulder1"
                                                                        ].itemId,
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                renderInventorySelect(
                                                                    selectedCharacter.inventory.weaponSlots.shoulder2.itemId,
                                                                    ["shoulderWeapon"],
                                                                    (itemId) => updateWeaponSlot("shoulder2", itemId),
                                                                )
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.weaponSlots.shoulder2.note}
                                                                disabled={Boolean(getBlockedShoulderSlot("shoulder2"))}
                                                                onChange={(event) =>
                                                                    updateWeaponSlotNote("shoulder2", event.target.value)
                                                                }
                                                                placeholder="Заметка."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Малый слот</p>
                                                            <h4>Нож / пистольвер</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.weaponSlots.small.itemId,
                                                                ["smallWeapon"],
                                                                (itemId) => updateWeaponSlot("small", itemId),
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.weaponSlots.small.note}
                                                                onChange={(event) =>
                                                                    updateWeaponSlotNote("small", event.target.value)
                                                                }
                                                                placeholder="Голень, пояс, скрытое ношение..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("armor")}
                                            >
                                                <span>
                                                    {openEquipmentSections.armor ? "▼" : "▶"} Броня и защита
                                                </span>
                                                <small>голова, торс, руки, ноги, Венец/противогаз</small>
                                            </button>

                                            {openEquipmentSections.armor && (
                                                <div className="character-accordion-body">
                                                    <div className="character-inventory-grid">
                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Голова</p>
                                                            <h4>Шлем</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.armorSlots.head.itemId,
                                                                ["headArmor"],
                                                                (itemId) => updateArmorSlot("head", itemId),
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.armorSlots.head.note}
                                                                onChange={(event) =>
                                                                    updateArmorSlotNote("head", event.target.value)
                                                                }
                                                                placeholder="Состояние, повреждения, особенности..."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Торс</p>
                                                            <h4>Броня</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.armorSlots.torso.itemId,
                                                                ["torsoArmor"],
                                                                (itemId) => updateArmorSlot("torso", itemId),
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.armorSlots.torso.note}
                                                                onChange={(event) =>
                                                                    updateArmorSlotNote("torso", event.target.value)
                                                                }
                                                                placeholder="Плиты, стёганка, пробития..."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Руки</p>
                                                            <h4>Защита рук</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.armorSlots.arms.itemId,
                                                                ["armsArmor"],
                                                                (itemId) => updateArmorSlot("arms", itemId),
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.armorSlots.arms.note}
                                                                onChange={(event) =>
                                                                    updateArmorSlotNote("arms", event.target.value)
                                                                }
                                                                placeholder="Наручи, перчатки, повреждения..."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card">
                                                            <p className="eyebrow">Ноги</p>
                                                            <h4>Защита ног</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.armorSlots.legs.itemId,
                                                                ["legsArmor"],
                                                                (itemId) => updateArmorSlot("legs", itemId),
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.armorSlots.legs.note}
                                                                onChange={(event) =>
                                                                    updateArmorSlotNote("legs", event.target.value)
                                                                }
                                                                placeholder="Поножи, ботинки, хромота..."
                                                            />
                                                        </div>

                                                        <div className="character-inventory-slot-card wide">
                                                            <p className="eyebrow">Защитное снаряжение</p>
                                                            <h4>Венец / противогаз</h4>

                                                            {renderInventorySelect(
                                                                selectedCharacter.inventory.protectionSlot.itemId,
                                                                ["protection"],
                                                                updateProtectionSlot,
                                                            )}

                                                            <input
                                                                value={selectedCharacter.inventory.protectionSlot.note}
                                                                onChange={(event) =>
                                                                    updateProtectionSlotNote(event.target.value)
                                                                }
                                                                placeholder="Режим Венца, фильтры, заряд, побочные эффекты..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("equipment")}
                                            >
                                                <span>
                                                    {openEquipmentSections.equipment ? "▼" : "▶"} Оборудование
                                                </span>
                                                <small>комген, носимые агрегаты, полевые аппараты</small>
                                            </button>

                                            {openEquipmentSections.equipment && (
                                                <div className="character-accordion-body">
                                                    <div className="character-inventory-slot-card wide">
                                                        <p className="eyebrow">Оборудование</p>
                                                        <h4>{getInventoryItemName(getEquippedEquipmentSlot().itemId)}</h4>

                                                        {renderInventorySelect(
                                                            getEquippedEquipmentSlot().itemId,
                                                            ["equipment"],
                                                            updateEquipmentSlot,
                                                        )}

                                                        <input
                                                            value={getEquippedEquipmentSlot().note}
                                                            onChange={(event) => updateEquipmentSlotNote(event.target.value)}
                                                            placeholder="Комген, кабели, шум, нагрев, режим работы, состояние..."
                                                        />

                                                        <p className="character-help-text">
                                                            Сюда ставится навесное техническое снаряжение: комген,
                                                            носимый агрегат, тяжёлый датчик, полевой аппарат или особый
                                                            контейнер с креплением.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("quickAccess")}
                                            >
                                                <span>
                                                    {openEquipmentSections.quickAccess ? "▼" : "▶"} Быстрый доступ
                                                </span>
                                                <small>разгрузка и быстрые предметы</small>
                                            </button>

                                            {openEquipmentSections.quickAccess && (
                                                <div className="character-accordion-body">
                                                    <div className="character-inventory-slot-card wide">
                                                        <p className="eyebrow">Разгрузка</p>
                                                        <h4>Слот разгрузки</h4>

                                                        {renderInventorySelect(
                                                            selectedCharacter.inventory.loadBearing.itemId,
                                                            ["loadBearing"],
                                                            updateLoadBearingItem,
                                                        )}

                                                        <input
                                                            value={selectedCharacter.inventory.loadBearing.note}
                                                            onChange={(event) =>
                                                                updateLoadBearingNote(event.target.value)
                                                            }
                                                            placeholder="Пояс, жилет, подсумки, состояние..."
                                                        />
                                                    </div>

                                                    <div className="character-quick-slots">
                                                        {getPreparedQuickSlots().map((slot, index) => (
                                                            <div
                                                                key={slot.id}
                                                                className="character-inventory-slot-card"
                                                            >
                                                                <p className="eyebrow">Быстрый слот {index + 1}</p>
                                                                <h4>{getInventoryItemName(slot.itemId)}</h4>

                                                                {renderInventorySelect(
                                                                    slot.itemId,
                                                                    ["quick", "none"],
                                                                    (itemId) => updateQuickSlot(index, { itemId }),
                                                                )}

                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={slot.quantity}
                                                                    onChange={(event) =>
                                                                        updateQuickSlot(index, {
                                                                            quantity: Math.max(
                                                                                1,
                                                                                Number(event.target.value) || 1,
                                                                            ),
                                                                        })
                                                                    }
                                                                    placeholder="Кол-во"
                                                                />

                                                                <input
                                                                    value={slot.note}
                                                                    onChange={(event) =>
                                                                        updateQuickSlot(index, { note: event.target.value })
                                                                    }
                                                                    placeholder="Заметка..."
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("backpack")}
                                            >
                                                <span>
                                                    {openEquipmentSections.backpack ? "▼" : "▶"} Рюкзак
                                                </span>
                                                <small>предметы медленного доступа</small>
                                            </button>

                                            {openEquipmentSections.backpack && (
                                                <div className="character-accordion-body">
                                                    <div className="character-inventory-slot-card wide">
                                                        <p className="eyebrow">Рюкзак / спина</p>
                                                        <h4>{getInventoryItemName(getEquippedBackpackSlot().itemId)}</h4>

                                                        {renderInventorySelect(
                                                            getEquippedBackpackSlot().itemId,
                                                            ["backpack"],
                                                            updateBackpackSlotItem,
                                                        )}

                                                        <input
                                                            value={getEquippedBackpackSlot().note}
                                                            onChange={(event) => updateBackpackSlotNote(event.target.value)}
                                                            placeholder="Состояние, крепления, повреждения, особые карманы..."
                                                        />

                                                        <p
                                                            className={`character-help-text ${getBackpackUsedSlots() > getBackpackCapacity()
                                                                ? "warning"
                                                                : ""
                                                                }`}
                                                        >
                                                            Вместимость: {getBackpackUsedSlots()}/{getBackpackCapacity()} слотов.
                                                            {getBackpackUsedSlots() > getBackpackCapacity()
                                                                ? " Рюкзак перегружен."
                                                                : ""}
                                                        </p>
                                                    </div>

                                                    <div className="character-backpack-add-card">
                                                        <div className="character-backpack-add-header">
                                                            <div>
                                                                <p className="eyebrow">Добавить в рюкзак</p>
                                                                <h4>Поиск предмета</h4>
                                                            </div>

                                                            <span>
                                                                Найдено: {getFilteredBackpackAllowedItems().length}
                                                            </span>
                                                        </div>

                                                        <div className="character-backpack-add-grid">
                                                            <label className="character-field">
                                                                Поиск
                                                                <input
                                                                    value={backpackSearchQuery}
                                                                    onChange={(event) =>
                                                                        setBackpackSearchQuery(event.target.value)
                                                                    }
                                                                    placeholder="Название, тег, описание..."
                                                                />
                                                            </label>

                                                            <label className="character-field">
                                                                Категория
                                                                <select
                                                                    value={backpackCategoryFilter}
                                                                    onChange={(event) =>
                                                                        setBackpackCategoryFilter(
                                                                            event.target.value as "all" | ArsenalItem["category"],
                                                                        )
                                                                    }
                                                                >
                                                                    {BACKPACK_CATEGORY_FILTERS.map((filter) => (
                                                                        <option key={filter.value} value={filter.value}>
                                                                            {filter.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </label>

                                                            <label className="character-field">
                                                                Предмет
                                                                <select
                                                                    value={
                                                                        getFilteredBackpackAllowedItems().some(
                                                                            (item) => item.id === backpackSelectedItemId,
                                                                        )
                                                                            ? backpackSelectedItemId
                                                                            : getFilteredBackpackAllowedItems()[0]?.id ?? ""
                                                                    }
                                                                    onChange={(event) =>
                                                                        setBackpackSelectedItemId(event.target.value)
                                                                    }
                                                                    disabled={getFilteredBackpackAllowedItems().length === 0}
                                                                >
                                                                    {getFilteredBackpackAllowedItems().map((item) => (
                                                                        <option key={item.id} value={item.id}>
                                                                            {item.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </label>

                                                            <label className="character-field">
                                                                Кол-во
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={backpackQuantity}
                                                                    onChange={(event) =>
                                                                        setBackpackQuantity(
                                                                            Math.max(
                                                                                1,
                                                                                Math.floor(Number(event.target.value) || 1),
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                        </div>

                                                        <button
                                                            className="character-secondary-button"
                                                            type="button"
                                                            onClick={addBackpackEntry}
                                                            disabled={
                                                                getBackpackCapacity() <= 0 ||
                                                                getBackpackUsedSlots() >= getBackpackCapacity() ||
                                                                getFilteredBackpackAllowedItems().length === 0
                                                            }
                                                        >
                                                            Добавить выбранный предмет
                                                        </button>

                                                        {getFilteredBackpackAllowedItems().length === 0 && (
                                                            <p className="character-help-text warning">
                                                                Подходящих предметов нет. Измени поиск или категорию.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {selectedCharacter.inventory.backpack.length === 0 ? (
                                                        <p className="character-help-text">
                                                            Рюкзак пуст. Экипируй рюкзак и добавь предмет из Арсенала.
                                                        </p>
                                                    ) : (
                                                        <div className="character-backpack-list">
                                                            {selectedCharacter.inventory.backpack.map((entry) => (
                                                                <div
                                                                    key={entry.id}
                                                                    className="character-backpack-row"
                                                                >
                                                                    {renderBackpackItemSelect(entry.itemId, (itemId) =>
                                                                        updateBackpackEntry(entry.id, { itemId }),
                                                                    )}

                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={entry.quantity}
                                                                        onChange={(event) =>
                                                                            updateBackpackEntry(entry.id, {
                                                                                quantity: Math.max(
                                                                                    1,
                                                                                    Number(event.target.value) || 1,
                                                                                ),
                                                                            })
                                                                        }
                                                                        placeholder="Кол-во"
                                                                    />

                                                                    <input
                                                                        value={entry.note}
                                                                        onChange={(event) =>
                                                                            updateBackpackEntry(entry.id, {
                                                                                note: event.target.value,
                                                                            })
                                                                        }
                                                                        placeholder="Заметка"
                                                                    />

                                                                    <button
                                                                        className="danger-button"
                                                                        type="button"
                                                                        onClick={() => deleteBackpackEntry(entry.id)}
                                                                    >
                                                                        Убрать
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleEquipmentSection("cryptotoken")}
                                            >
                                                <span>
                                                    {openEquipmentSections.cryptotoken ? "▼" : "▶"}{" "}
                                                    Криптожетон
                                                </span>
                                                <small>статус личности, амперии, прошлое</small>
                                            </button>

                                            {openEquipmentSections.cryptotoken && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Криптожетон
                                                        <textarea
                                                            value={selectedCharacter.cryptotoken}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    cryptotoken: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Действующий, частично стёртый, аннулированный, чужой, повреждённый..."
                                                        />
                                                    </label>

                                                    <div className="character-wallet-card">
                                                        <div>
                                                            <p className="eyebrow">Кошелёк криптожето́на</p>
                                                            <h4>
                                                                {selectedCharacter.wallet.amperies} амп.{" "}
                                                                {selectedCharacter.wallet.miliamperies} мА
                                                            </h4>
                                                        </div>

                                                        <div className="character-wallet-grid">
                                                            <label>
                                                                Амперии
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={selectedCharacter.wallet.amperies}
                                                                    onChange={(event) =>
                                                                        updateWallet({
                                                                            amperies: Math.max(
                                                                                0,
                                                                                Math.floor(Number(event.target.value) || 0),
                                                                            ),
                                                                        })
                                                                    }
                                                                />
                                                            </label>

                                                            <label>
                                                                Милиамперии
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={999}
                                                                    value={selectedCharacter.wallet.miliamperies}
                                                                    onChange={(event) =>
                                                                        updateWallet({
                                                                            miliamperies: Math.min(
                                                                                999,
                                                                                Math.max(
                                                                                    0,
                                                                                    Math.floor(Number(event.target.value) || 0),
                                                                                ),
                                                                            ),
                                                                        })
                                                                    }
                                                                />
                                                            </label>
                                                        </div>

                                                        <label>
                                                            Финансовая заметка
                                                            <input
                                                                value={selectedCharacter.wallet.note}
                                                                onChange={(event) =>
                                                                    updateWallet({
                                                                        note: event.target.value,
                                                                    })
                                                                }
                                                                placeholder="Долг, залог, доступ к счёту, чужой кошелёк..."
                                                            />
                                                        </label>

                                                        <p className="character-help-text">
                                                            1 амперий = 1000 милиампериев. Кошелёк отражает доступные
                                                            средства на криптожето́не персонажа.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "relations" && (
                                <section className="character-editor-section">
                                    <p className="eyebrow">Связи</p>
                                    <h3 className="character-section-title">Связи персонажа</h3>

                                    <div className="character-accordion-list">
                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleRelationsSection("contacts")}
                                            >
                                                <span>
                                                    {openRelationsSections.contacts ? "▼" : "▶"} Контакты
                                                </span>
                                                <small>
                                                    люди, которые могут помочь, продать, предупредить или
                                                    спрятать
                                                </small>
                                            </button>

                                            {openRelationsSections.contacts && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Контакты
                                                        <textarea
                                                            value={selectedCharacter.contacts}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    contacts: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Кто может помочь персонажу? Знакомые, посредники, старые сослуживцы, врачи, проводники..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleRelationsSection("debts")}
                                            >
                                                <span>
                                                    {openRelationsSections.debts ? "▼" : "▶"} Долги
                                                </span>
                                                <small>
                                                    кому персонаж должен деньги, услугу, молчание или жизнь
                                                </small>
                                            </button>

                                            {openRelationsSections.debts && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Долги
                                                        <textarea
                                                            value={selectedCharacter.debts}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    debts: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Кому персонаж должен? Фракция, врач, бригадир, покровитель, старый отряд..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleRelationsSection("enemies")}
                                            >
                                                <span>
                                                    {openRelationsSections.enemies ? "▼" : "▶"} Враги
                                                </span>
                                                <small>
                                                    те, кто ищет, ненавидит, шантажирует или готовит
                                                    расплату
                                                </small>
                                            </button>

                                            {openRelationsSections.enemies && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Враги
                                                        <textarea
                                                            value={selectedCharacter.enemies}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    enemies: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Кто хочет навредить персонажу? Темерат, бриганты, старые сослуживцы, родственники погибших..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleRelationsSection("patrons")}
                                            >
                                                <span>
                                                    {openRelationsSections.patrons ? "▼" : "▶"}{" "}
                                                    Покровители
                                                </span>
                                                <small>защита, интерес, контроль или опасная поддержка</small>
                                            </button>

                                            {openRelationsSections.patrons && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Покровители
                                                        <textarea
                                                            value={selectedCharacter.patrons}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    patrons: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Кто прикрывает или использует персонажа? Кастелян, Эвергаль, Вояжер, баронский человек..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleRelationsSection("oldName")}
                                            >
                                                <span>
                                                    {openRelationsSections.oldName ? "▼" : "▶"} Старое имя
                                                </span>
                                                <small>
                                                    кто знает прошлое, настоящее имя, старый криптожетон
                                                    или старую вину
                                                </small>
                                            </button>

                                            {openRelationsSections.oldName && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Кто знает старое имя
                                                        <textarea
                                                            value={selectedCharacter.oldNameKnownBy}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    oldNameKnownBy: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Кто знает старое имя персонажа? Кто может связать его с прошлым, долгом, преступлением или семьёй?"
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === "master" && (
                                <section className="character-editor-section">
                                    <p className="eyebrow">Мастер</p>
                                    <h3 className="character-section-title">
                                        Мастерская часть
                                    </h3>

                                    <div className="character-accordion-list">
                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleMasterSection("notes")}
                                            >
                                                <span>
                                                    {openMasterSections.notes ? "▼" : "▶"} Заметки
                                                    мастера
                                                </span>
                                                <small>
                                                    скрытые детали, личные крючки, наблюдения по игре
                                                </small>
                                            </button>

                                            {openMasterSections.notes && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Заметки мастера
                                                        <textarea
                                                            value={selectedCharacter.masterNotes}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    masterNotes: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Секреты, страхи, личные крючки, скрытые связи, что важно помнить мастеру..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleMasterSection("secretHooks")}
                                            >
                                                <span>
                                                    {openMasterSections.secretHooks ? "▼" : "▶"} Секреты
                                                    и крючки
                                                </span>
                                                <small>
                                                    личные квесты, скрытые последствия, будущие сцены
                                                </small>
                                            </button>

                                            {openMasterSections.secretHooks && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Секреты и крючки
                                                        <textarea
                                                            value={selectedCharacter.secretHooks}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    secretHooks: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Скрытые последствия, личный квест, фракционные зацепки, кто может выйти на персонажа, что всплывёт позже..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleMasterSection("progression")}
                                            >
                                                <span>
                                                    {openMasterSections.progression ? "▼" : "▶"} Прогресс
                                                    и развитие
                                                </span>
                                                <small>
                                                    что персонаж пережил, чему учится, куда меняется
                                                </small>
                                            </button>

                                            {openMasterSections.progression && (
                                                <div className="character-accordion-body">
                                                    <label className="character-field wide">
                                                        Прогресс и развитие
                                                        <textarea
                                                            value={selectedCharacter.progressionNotes}
                                                            onChange={(event) =>
                                                                updateSelectedCharacter({
                                                                    progressionNotes: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Что персонаж осваивает, пережил, доказал, потерял или начал менять в себе..."
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="character-accordion character-accordion-danger">
                                            <button
                                                className="character-accordion-header"
                                                type="button"
                                                onClick={() => toggleMasterSection("danger")}
                                            >
                                                <span>
                                                    {openMasterSections.danger ? "▼" : "▶"} Опасная зона
                                                </span>
                                                <small>удаление персонажа и необратимые действия</small>
                                            </button>

                                            {openMasterSections.danger && (
                                                <div className="character-accordion-body">
                                                    <p className="character-help-text">
                                                        Удаление персонажа нельзя отменить. Используй
                                                        только если это тестовая карточка или персонаж точно
                                                        больше не нужен.
                                                    </p>

                                                    <div className="character-actions">
                                                        <button
                                                            className="danger-button"
                                                            type="button"
                                                            onClick={deleteSelectedCharacter}
                                                        >
                                                            Удалить персонажа
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="character-editor-panel empty">
                        <p>Выбери персонажа или создай нового.</p>
                    </div>
                )}
            </div>

            {selectedCharacter && isPreviewOpen && (
                <CharacterPreview
                    character={selectedCharacter}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </section>
    );
}

type ResourceFieldProps = {
    label: string;
    value: number;
    maxValue: number;
    maxAllowed?: number;
    onChangeValue: (value: number) => void;
    onChangeMaxValue: (value: number) => void;
};

function ResourceField({
    label,
    value,
    maxValue,
    maxAllowed = 20,
    onChangeValue,
    onChangeMaxValue,
}: ResourceFieldProps) {
    function clampResource(nextValue: number, nextMaxValue: number) {
        return Math.max(0, Math.min(nextMaxValue, nextValue));
    }

    function clampMaxValue(nextMaxValue: number) {
        return Math.max(0, Math.min(maxAllowed, nextMaxValue));
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
                    max={maxAllowed}
                    value={maxValue}
                    onChange={(event) => {
                        const nextMaxValue = clampMaxValue(Number(event.target.value));

                        onChangeMaxValue(nextMaxValue);
                        onChangeValue(clampResource(value, nextMaxValue));
                    }}
                />
            </label>
        </div>
    );
}