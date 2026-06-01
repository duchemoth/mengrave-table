import {
    LOOT_CLUE_LINES,
    LOOT_CONTEXT_OPTIONS,
    LOOT_RESOURCE_LINES,
    type LootContext,
    type LootGeneratorSettings,
} from "../data/lootGenerator";
import type { ArsenalItem, ArsenalItemRarity, ArsenalLootAvailability } from "../types/campaign";

type WeightedItem = {
    item: ArsenalItem;
    weight: number;
};

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

function getItemScore(item: ArsenalItem, settings: LootGeneratorSettings) {
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

    if (matchingTagCount === 0 && settings.mode !== "items") {
        return 0;
    }

    const tagWeight = matchingTagCount > 0 ? matchingTagCount * 5 : 1;
    const rarityWeight = getRarityWeight(item.rarity);
    const availabilityWeight = getAvailabilityWeight(item.lootAvailability);

    return Math.max(0, tagWeight + rarityWeight + availabilityWeight);
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
    if (settings.mode === "clues" || settings.mode === "resources") {
        return 0;
    }

    if (settings.generosity === "poor") {
        return 1;
    }

    if (settings.generosity === "rich") {
        return settings.danger === "high" || settings.danger === "critical" ? 3 : 2;
    }

    return 2;
}

function getResourceCount(settings: LootGeneratorSettings) {
    if (settings.mode === "items" || settings.mode === "clues") {
        return 0;
    }

    if (settings.mode === "resources") {
        return settings.generosity === "rich" ? 3 : 2;
    }

    return settings.generosity === "poor" ? 0 : 1;
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

function formatItemLine(item: ArsenalItem) {
    const details = [
        item.condition !== "working" ? item.condition : "",
        item.rarity === "rare" || item.rarity === "faction" || item.rarity === "forbidden"
            ? item.rarity
            : "",
        item.price.trim() ? `ценность: ${item.price.trim()}` : "",
    ].filter(Boolean);

    const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";

    return `${item.name}${suffix}`;
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

export function generateLootFindings({
    arsenalItems,
    settings,
    sourceTitle,
}: {
    arsenalItems: ArsenalItem[];
    settings: LootGeneratorSettings;
    sourceTitle: string;
}) {
    const itemCount = getItemCount(settings);
    const resourceCount = getResourceCount(settings);
    const clueCount = getClueCount(settings);

    const pickedItems = pickWeightedItems(arsenalItems, settings, itemCount);

    const resources = takeRandomItems(
        LOOT_RESOURCE_LINES[settings.context] ?? [],
        resourceCount,
    );

    const clues = takeRandomItems(LOOT_CLUE_LINES[settings.context] ?? [], clueCount);

    const lines = [
        `Находки: ${sourceTitle}`,
        "",
        ...pickedItems.map((item) => `• ${formatItemLine(item)}`),
        ...resources.map((resource) => `• ${resource}`),
        ...clues.map((clue) => `• ${clue}`),
    ];

    if (pickedItems.length === 0 && resources.length === 0 && clues.length === 0) {
        const fallbackClue = getRandomItem(LOOT_CLUE_LINES[settings.context] ?? []);

        lines.push(
            `• ${fallbackClue ?? "Ничего ценного не найдено, но сама пустота выглядит подозрительно."}`,
        );
    }

    lines.push("", buildCostLine(settings));

    return lines.join("\n");
}