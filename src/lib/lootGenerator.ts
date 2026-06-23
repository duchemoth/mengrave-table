import {
    LOOT_CLUE_LINES,
    LOOT_CONTEXT_OPTIONS,
    type LootContext,
    type LootGeneratorSettings,
} from "../data/lootGenerator";
import type {
    ArsenalItem,
    ArsenalItemRarity,
    ArsenalLootAvailability,
    CampaignFindingClue,
    CampaignFindingClueType,
    CampaignFindingItem,
} from "../types/campaign";

type WeightedItem = {
    item: ArsenalItem;
    weight: number;
};

export type GeneratedFindingsResult = {
    id: string;
    sourceTitle: string;
    createdAt: number;
    settings: LootGeneratorSettings;
    items: CampaignFindingItem[];
    clues: CampaignFindingClue[];
    costText: string;
    textPreview: string;
};

function createGeneratedId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRandomItem<T>(items: T[]) {
    if (items.length === 0) {
        return null;
    }

    return items[Math.floor(Math.random() * items.length)];
}

function takeRandomItems<T>(items: T[], count: number) {
    const pool = [...items];
    const result: T[] = [];

    while (pool.length > 0 && result.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        const [item] = pool.splice(index, 1);

        result.push(item);
    }

    return result;
}

function getContextTags(context: LootContext) {
    return LOOT_CONTEXT_OPTIONS.find((option) => option.value === context)?.tags ?? [];
}

function getRarityWeight(rarity: ArsenalItemRarity) {
    switch (rarity) {
        case "junk":
            return 10;
        case "common":
            return 9;
        case "standard":
            return 7;
        case "good":
            return 5;
        case "rare":
            return 3;
        case "faction":
            return 2;
        case "elite":
            return 1;
        case "unique":
        case "forbidden":
        case "quest":
            return 0.5;
        default:
            return 4;
    }
}

function getAvailabilityWeight(availability: ArsenalLootAvailability) {
    switch (availability) {
        case "starter":
            return 8;
        case "commonLoot":
            return 7;
        case "dangerLoot":
            return 5;
        case "reward":
            return 2;
        case "manual":
            return 0.5;
        case "never":
            return 0;
        default:
            return 3;
    }
}

function isAvailabilityAllowed(
    availability: ArsenalLootAvailability,
    settings: LootGeneratorSettings,
) {
    if (availability === "never") {
        return false;
    }

    if (availability === "manual") {
        return settings.allowManual;
    }

    if (settings.danger === "low") {
        return availability === "starter" || availability === "commonLoot";
    }

    if (settings.danger === "medium") {
        return (
            availability === "starter" ||
            availability === "commonLoot" ||
            availability === "dangerLoot"
        );
    }

    if (settings.danger === "high") {
        return (
            availability === "commonLoot" ||
            availability === "dangerLoot" ||
            availability === "reward"
        );
    }

    return (
        availability === "dangerLoot" ||
        availability === "reward" ||
        availability === "commonLoot"
    );
}

function isRarityAllowed(rarity: ArsenalItemRarity, settings: LootGeneratorSettings) {
    if (settings.allowManual) {
        return true;
    }

    if (rarity === "unique" || rarity === "quest") {
        return false;
    }

    if (settings.danger === "low") {
        return rarity === "junk" || rarity === "common" || rarity === "standard";
    }

    if (settings.danger === "medium") {
        return (
            rarity === "junk" ||
            rarity === "common" ||
            rarity === "standard" ||
            rarity === "good"
        );
    }

    if (settings.danger === "high") {
        return (
            rarity === "common" ||
            rarity === "standard" ||
            rarity === "good" ||
            rarity === "rare" ||
            rarity === "faction"
        );
    }

    return true;
}

function isItemAllowedByMode(item: ArsenalItem, settings: LootGeneratorSettings) {
    if (settings.mode === "clues") {
        return false;
    }

    if (settings.mode === "resources") {
        return item.category === "resource";
    }

    if (settings.mode === "items") {
        return item.category !== "resource";
    }

    return true;
}

function getItemScore(item: ArsenalItem, settings: LootGeneratorSettings) {
    if (!isItemAllowedByMode(item, settings)) {
        return 0;
    }

    if (!isAvailabilityAllowed(item.lootAvailability, settings)) {
        return 0;
    }

    if (!isRarityAllowed(item.rarity, settings)) {
        return 0;
    }

    const contextTags = getContextTags(settings.context);
    const matchingTagCount = item.lootTags.filter((tag) =>
        contextTags.includes(tag),
    ).length;

    if (matchingTagCount === 0 && settings.mode === "mixed") {
        return 0;
    }

    const tagWeight = matchingTagCount > 0 ? matchingTagCount * 5 : 1;
    const rarityWeight = getRarityWeight(item.rarity);
    const availabilityWeight = getAvailabilityWeight(item.lootAvailability);
    const resourceModeBonus =
        settings.mode === "resources" && item.category === "resource" ? 5 : 0;

    return Math.max(0, tagWeight + rarityWeight + availabilityWeight + resourceModeBonus);
}

function weightedPick(items: WeightedItem[]) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight <= 0) {
        return null;
    }

    let roll = Math.random() * totalWeight;

    for (const item of items) {
        roll -= item.weight;

        if (roll <= 0) {
            return item.item;
        }
    }

    return items[items.length - 1]?.item ?? null;
}

function pickWeightedItems(items: ArsenalItem[], settings: LootGeneratorSettings, count: number) {
    const weightedItems: WeightedItem[] = items
        .map((item) => ({
            item,
            weight: getItemScore(item, settings),
        }))
        .filter((item) => item.weight > 0);

    const result: ArsenalItem[] = [];
    const usedIds = new Set<string>();

    while (result.length < count) {
        const availableItems = weightedItems.filter((item) => !usedIds.has(item.item.id));
        const pickedItem = weightedPick(availableItems);

        if (!pickedItem) {
            break;
        }

        result.push(pickedItem);
        usedIds.add(pickedItem.id);
    }

    return result;
}

function getItemCount(settings: LootGeneratorSettings) {
    if (settings.mode === "clues") {
        return 0;
    }

    if (settings.mode === "resources") {
        return settings.generosity === "rich" ? 3 : 2;
    }

    if (settings.generosity === "poor") {
        return 1;
    }

    if (settings.generosity === "rich") {
        return settings.danger === "high" || settings.danger === "critical" ? 3 : 2;
    }

    return 2;
}

function getClueCount(settings: LootGeneratorSettings) {
    if (settings.mode === "items" || settings.mode === "resources") {
        return 0;
    }

    if (settings.mode === "clues") {
        return settings.generosity === "rich" ? 3 : 2;
    }

    return settings.danger === "low" ? 1 : 2;
}

function getGeneratedQuantity(item: ArsenalItem, settings: LootGeneratorSettings) {
    if (item.category !== "resource") {
        return 1;
    }

    if (settings.generosity === "rich") {
        return 2;
    }

    return 1;
}

function createFindingItem(
    item: ArsenalItem,
    settings: LootGeneratorSettings,
    sourceTitle: string,
    createdAt: number,
): CampaignFindingItem {
    return {
        id: createGeneratedId("finding-item"),
        kind: "item",

        arsenalItemId: item.id,
        quantity: getGeneratedQuantity(item, settings),

        sourceTitle,
        createdAt,

        nameSnapshot: item.name,
        categorySnapshot: item.category,
        slotSnapshot: item.slot,
        resourceSubtypeSnapshot:
            item.category === "resource" ? item.resourceSubtype : undefined,
        raritySnapshot: item.rarity,
        conditionSnapshot: item.condition,
        weightSnapshot: item.weight,
        priceSnapshot: item.price,
        lootTagsSnapshot: [...item.lootTags],

        note: "",
    };
}

function getClueTypeFromContext(context: LootContext): CampaignFindingClueType {
    if (context === "corpse" || context === "medical") {
        return "body";
    }

    if (context === "battlefield") {
        return "damage";
    }

    if (context === "road") {
        return "route";
    }

    if (context === "obscuria") {
        return "obscuria";
    }

    if (context === "technical" || context === "crash" || context === "voyage") {
        return "technical";
    }

    if (context === "domestic" || context === "fief") {
        return "social";
    }

    return "other";
}

function buildClueTitle(clueText: string) {
    const normalized = clueText.trim();

    if (!normalized) {
        return "Улика";
    }

    const colonIndex = normalized.indexOf(":");

    if (colonIndex > 4 && colonIndex <= 52) {
        return normalized.slice(0, colonIndex);
    }

    const sentenceEndIndex = normalized.search(/[.!?]/);

    if (sentenceEndIndex > 8 && sentenceEndIndex <= 52) {
        return normalized.slice(0, sentenceEndIndex);
    }

    if (normalized.length <= 52) {
        return normalized;
    }

    return `${normalized.slice(0, 49).trim()}…`;
}

function createFindingClue(
    clueText: string,
    context: LootContext,
    sourceTitle: string,
    createdAt: number,
): CampaignFindingClue {
    return {
        id: createGeneratedId("finding-clue"),
        kind: "clue",

        title: buildClueTitle(clueText),
        text: clueText,

        clueType: getClueTypeFromContext(context),

        sourceTitle,
        createdAt,

        isHiddenFromPlayers: true,
        note: "",
    };
}

function formatItemLine(item: CampaignFindingItem) {
    const details = [
        item.quantity > 1 ? `×${item.quantity}` : "",
        item.conditionSnapshot !== "working" ? item.conditionSnapshot : "",
        item.raritySnapshot === "rare" ||
            item.raritySnapshot === "faction" ||
            item.raritySnapshot === "forbidden"
            ? item.raritySnapshot
            : "",
        item.priceSnapshot.trim() ? `ценность: ${item.priceSnapshot.trim()}` : "",
    ].filter(Boolean);

    const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";

    return `${item.nameSnapshot}${suffix}`;
}

function buildCostLine(settings: LootGeneratorSettings) {
    if (settings.danger === "low" && settings.generosity === "poor") {
        return "Цена: находка мелкая; серьёзной награды здесь нет, но можно получить след или время на осмотр.";
    }

    if (settings.danger === "critical") {
        return "Цена: безопасно забрать всё нельзя; нужен выбор между временем, шумом, риском заражения, ранеными или приближением угрозы.";
    }

    if (settings.danger === "high") {
        return "Цена: быстрый сбор создаёт шум или ухудшает позицию; аккуратный осмотр тратит время.";
    }

    return "Цена: при спешке Мастер может дать шум, задержку, повреждение предмета или неполную информацию.";
}

export function renderGeneratedFindingsText(result: GeneratedFindingsResult) {
    const lines = [`Находки: ${result.sourceTitle}`, ""];

    if (result.items.length > 0) {
        lines.push("Предметы:");
        lines.push(...result.items.map((item) => `• ${formatItemLine(item)}`));
        lines.push("");
    }

    if (result.clues.length > 0) {
        lines.push("Улики и следы:");
        lines.push(...result.clues.map((clue) => `• ${clue.text}`));
        lines.push("");
    }

    lines.push(result.costText);

    return lines.join("\n");
}

export function generateFindingsResult({
    arsenalItems,
    settings,
    sourceTitle,
}: {
    arsenalItems: ArsenalItem[];
    settings: LootGeneratorSettings;
    sourceTitle: string;
}): GeneratedFindingsResult {
    const createdAt = Date.now();
    const itemCount = getItemCount(settings);
    const clueCount = getClueCount(settings);

    const pickedItems = pickWeightedItems(arsenalItems, settings, itemCount);
    const items = pickedItems.map((item) =>
        createFindingItem(item, settings, sourceTitle, createdAt),
    );

    const pickedClues = takeRandomItems(
        LOOT_CLUE_LINES[settings.context] ?? [],
        clueCount,
    );

    const clues = pickedClues.map((clue) =>
        createFindingClue(clue, settings.context, sourceTitle, createdAt),
    );

    if (items.length === 0 && clues.length === 0) {
        const fallbackClue =
            getRandomItem(LOOT_CLUE_LINES[settings.context] ?? []) ??
            "Ничего ценного не найдено, но сама пустота выглядит подозрительно.";

        clues.push(
            createFindingClue(fallbackClue, settings.context, sourceTitle, createdAt),
        );
    }

    const resultWithoutTextPreview: Omit<GeneratedFindingsResult, "textPreview"> = {
        id: createGeneratedId("generated-findings"),
        sourceTitle,
        createdAt,
        settings,
        items,
        clues,
        costText: buildCostLine(settings),
    };

    const result: GeneratedFindingsResult = {
        ...resultWithoutTextPreview,
        textPreview: "",
    };

    return {
        ...result,
        textPreview: renderGeneratedFindingsText(result),
    };
}

export function generateLootFindings({
    arsenalItems,
    settings,
    sourceTitle,
}: {
    arsenalItems: ArsenalItem[];
    settings: LootGeneratorSettings;
    sourceTitle: string;
}) {
    return generateFindingsResult({
        arsenalItems,
        settings,
        sourceTitle,
    }).textPreview;
}