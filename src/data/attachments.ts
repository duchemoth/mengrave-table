import type { MapAttachmentKind } from "../types/campaign";

export type AttachmentOption = {
    value: string;
    label: string;
};

export type AttachmentKindConfig = {
    label: string;
    icon: string;
    statusLabel: string;
    defaultTitle: string;
    defaultStatus: string;
    defaultBurden: number;
    defaultRisk: number;
    defaultTagIds: string[];
    statuses: AttachmentOption[];
    tags: AttachmentOption[];
    burdenHint: string;
    riskHint: string;
    descriptionPlaceholder: string;
    masterNotesPlaceholder: string;
};

export const ATTACHMENT_KIND_CONFIG: Record<
    MapAttachmentKind,
    AttachmentKindConfig
> = {
    survivors: {
        label: "Выжившие",
        icon: "♟",
        statusLabel: "Состояние людей",
        defaultTitle: "Выжившие",
        defaultStatus: "strained",
        defaultBurden: 3,
        defaultRisk: 2,
        defaultTagIds: ["wounded", "panicking", "thirsty", "slow"],
        statuses: [
            { value: "gathered", label: "Собраны" },
            { value: "strained", label: "Напряжены" },
            { value: "panicking", label: "Паникуют" },
            { value: "scattered", label: "Рассеяны" },
            { value: "exhausted", label: "Истощены" },
            { value: "abandoned", label: "Брошены" },
        ],
        tags: [
            { value: "wounded", label: "Раненые" },
            { value: "thirsty", label: "Мало воды" },
            { value: "hungry", label: "Голод" },
            { value: "panicking", label: "Паника" },
            { value: "noisy", label: "Шумят" },
            { value: "slow", label: "Замедляют" },
            { value: "witness", label: "Есть свидетель" },
            { value: "conflict", label: "Есть конфликт" },
            { value: "symptomRisk", label: "Риск симптомов" },
            { value: "needsLeader", label: "Нужен лидер" },
        ],
        burdenHint: "Сколько внимания, еды, воды, времени и защиты требуют люди.",
        riskHint:
            "Насколько они шумят, паникуют, привлекают угрозу или портят переговоры.",
        descriptionPlaceholder:
            "Кто эти люди, почему они идут с отрядом, что игроки о них знают...",
        masterNotesPlaceholder:
            "Кто среди них важен, кто может обвинить отряд, кто станет свидетелем на форпосте...",
    },

    wounded: {
        label: "Раненые",
        icon: "✚",
        statusLabel: "Состояние раненых",
        defaultTitle: "Раненые",
        defaultStatus: "stable",
        defaultBurden: 4,
        defaultRisk: 2,
        defaultTagIds: ["needsCarrier", "needsMedicine", "slow"],
        statuses: [
            { value: "stable", label: "Стабилен" },
            { value: "weakening", label: "Слабеет" },
            { value: "bleeding", label: "Кровотечение" },
            { value: "unconscious", label: "Без сознания" },
            { value: "critical", label: "Критично" },
            { value: "lost", label: "Умер / потерян" },
        ],
        tags: [
            { value: "needsBandage", label: "Нужна перевязка" },
            { value: "needsCarrier", label: "Нужен носильщик" },
            { value: "needsMedicine", label: "Требует медицины" },
            { value: "slow", label: "Нельзя быстро идти" },
            { value: "screaming", label: "Кричит от боли" },
            { value: "infectionRisk", label: "Риск инфекции" },
            { value: "reflectionRisk", label: "Риск Отражения" },
        ],
        burdenHint:
            "Насколько раненые замедляют отряд и требуют рук, времени и медицины.",
        riskHint:
            "Насколько их состояние создаёт шум, панику, кровь, запах и опасность ухудшения.",
        descriptionPlaceholder:
            "Кто ранен, насколько тяжело, можно ли переносить, кто за него отвечает...",
        masterNotesPlaceholder:
            "Что станет хуже без лечения, кто умрёт первым, кто заметит жестокость отряда...",
    },

    cargo: {
        label: "Груз",
        icon: "▣",
        statusLabel: "Состояние груза",
        defaultTitle: "Груз",
        defaultStatus: "intact",
        defaultBurden: 2,
        defaultRisk: 1,
        defaultTagIds: ["valuable"],
        statuses: [
            { value: "intact", label: "Целый" },
            { value: "heavy", label: "Тяжёлый" },
            { value: "damaged", label: "Повреждён" },
            { value: "partlyLost", label: "Частично потерян" },
            { value: "hidden", label: "Спрятан" },
            { value: "abandoned", label: "Брошен" },
        ],
        tags: [
            { value: "heavy", label: "Тяжёлый" },
            { value: "valuable", label: "Ценный" },
            { value: "fragile", label: "Хрупкий" },
            { value: "suspicious", label: "Подозрительный" },
            { value: "needsCarrier", label: "Нужен носильщик" },
            { value: "needsTool", label: "Нужен инструмент" },
            { value: "tradeable", label: "Можно обменять" },
            { value: "looterBait", label: "Привлекает мародёров" },
        ],
        burdenHint: "Насколько груз тяжёлый, неудобный или требует носильщиков.",
        riskHint:
            "Насколько груз вызывает подозрение, жадность, погоню или конфликт на досмотре.",
        descriptionPlaceholder:
            "Что это за груз, кому он принадлежит, зачем его тащат...",
        masterNotesPlaceholder:
            "Кто будет его искать, что внутри, что будет при потере или вскрытии...",
    },

    cart: {
        label: "Повозка / обоз",
        icon: "▤",
        statusLabel: "Состояние повозки",
        defaultTitle: "Повозка",
        defaultStatus: "rolling",
        defaultBurden: 3,
        defaultRisk: 2,
        defaultTagIds: ["noisy", "needsRoad"],
        statuses: [
            { value: "rolling", label: "Катится" },
            { value: "hardGoing", label: "Идёт тяжело" },
            { value: "creaking", label: "Скрипит" },
            { value: "damaged", label: "Повреждена" },
            { value: "stuck", label: "Застряла" },
            { value: "abandoned", label: "Брошена" },
        ],
        tags: [
            { value: "noisy", label: "Шумит" },
            { value: "slow", label: "Замедляет" },
            { value: "needsRoad", label: "Нужна дорога" },
            { value: "badInSwamp", label: "Не проходит по топи" },
            { value: "needsRepair", label: "Нужен ремонт" },
            { value: "leavesTrail", label: "Оставляет след" },
            { value: "cargoSpace", label: "Даёт место под груз" },
            { value: "cover", label: "Можно использовать как укрытие" },
        ],
        burdenHint: "Насколько повозка ограничивает маршрут и требует обслуживания.",
        riskHint:
            "Насколько она шумит, оставляет след, застревает или привлекает внимание.",
        descriptionPlaceholder:
            "Что за повозка, что везёт, кто её тянет или толкает...",
        masterNotesPlaceholder:
            "Где застрянет, что сломается, кто захочет её бросить или украсть...",
    },

    vehicle: {
        label: "Транспорт",
        icon: "▰",
        statusLabel: "Состояние транспорта",
        defaultTitle: "Транспорт",
        defaultStatus: "running",
        defaultBurden: 2,
        defaultRisk: 3,
        defaultTagIds: ["fuelHungry", "noisy", "leavesTrail"],
        statuses: [
            { value: "running", label: "На ходу" },
            { value: "noisy", label: "Шумит" },
            { value: "overheating", label: "Перегревается" },
            { value: "damaged", label: "Повреждён" },
            { value: "stalled", label: "Заглох" },
            { value: "abandoned", label: "Брошен" },
        ],
        tags: [
            { value: "fuelHungry", label: "Жрёт топливо" },
            { value: "noisy", label: "Шумит" },
            { value: "leavesTrail", label: "Оставляет след" },
            { value: "needsRepair", label: "Нужен ремонт" },
            { value: "needsDriver", label: "Нужен водитель" },
            { value: "badTerrain", label: "Плохая проходимость" },
            { value: "speed", label: "Даёт скорость" },
            { value: "cover", label: "Даёт укрытие" },
            { value: "attention", label: "Привлекает внимание" },
        ],
        burdenHint:
            "Насколько транспорт требует топлива, ремонта, дороги и внимания.",
        riskHint:
            "Насколько транспорт шумит, выдаёт отряд, ломается или провоцирует погоню.",
        descriptionPlaceholder:
            "Что это за транспорт, в каком он состоянии, кто им управляет...",
        masterNotesPlaceholder:
            "Что ломается первым, сколько топлива осталось, кто услышит двигатель...",
    },

    prisoners: {
        label: "Пленные",
        icon: "◉",
        statusLabel: "Состояние пленных",
        defaultTitle: "Пленные",
        defaultStatus: "controlled",
        defaultBurden: 2,
        defaultRisk: 3,
        defaultTagIds: ["guarded", "escapeRisk"],
        statuses: [
            { value: "controlled", label: "Под контролем" },
            { value: "resisting", label: "Сопротивляются" },
            { value: "wounded", label: "Ранены" },
            { value: "silent", label: "Молчат" },
            { value: "talking", label: "Готовы говорить" },
            { value: "escaped", label: "Сбежали / потеряны" },
        ],
        tags: [
            { value: "guarded", label: "Нужно охранять" },
            { value: "escapeRisk", label: "Может сбежать" },
            { value: "liar", label: "Может врать" },
            { value: "witness", label: "Ценный свидетель" },
            { value: "conflict", label: "Вызывает конфликт" },
            { value: "needsWater", label: "Требует воды" },
            { value: "knowsRoute", label: "Может знать маршрут" },
            { value: "dangerousUnarmed", label: "Опасен без оружия" },
        ],
        burdenHint:
            "Насколько пленные требуют охраны, воды, времени и отдельного внимания.",
        riskHint:
            "Насколько они могут сбежать, соврать, спровоцировать конфликт или сорвать сцену.",
        descriptionPlaceholder:
            "Кого взяли, почему он важен, что игроки о нём знают...",
        masterNotesPlaceholder:
            "Что он скрывает, кто захочет его забрать, что будет при побеге...",
    },

    dangerous: {
        label: "Опасная ноша",
        icon: "☉",
        statusLabel: "Состояние опасной ноши",
        defaultTitle: "Опасная ноша",
        defaultStatus: "stable",
        defaultBurden: 1,
        defaultRisk: 4,
        defaultTagIds: ["dangerousInspection", "doNotOpen"],
        statuses: [
            { value: "stable", label: "Стабильно" },
            { value: "radiating", label: "Фонит" },
            { value: "unstable", label: "Нестабильно" },
            { value: "leaking", label: "Утечка" },
            { value: "critical", label: "Критично" },
            { value: "abandoned", label: "Брошено" },
        ],
        tags: [
            { value: "radiating", label: "Фонит" },
            { value: "reflectionRisk", label: "Риск Отражения" },
            { value: "infectionRisk", label: "Риск заражения" },
            { value: "doNotOpen", label: "Нельзя вскрывать" },
            { value: "needsContainer", label: "Нужен контейнер" },
            { value: "badRest", label: "Портит отдых" },
            { value: "attractsEcho", label: "Привлекает эхоморфов" },
            { value: "dangerousInspection", label: "Опасно на досмотре" },
        ],
        burdenHint:
            "Насколько предмет неудобен физически и требует особых условий переноски.",
        riskHint:
            "Насколько ноша фонит, заражает, портит отдых, привлекает угрозы или опасна на досмотре.",
        descriptionPlaceholder:
            "Что это за предмет, почему его нельзя просто бросить или вскрыть...",
        masterNotesPlaceholder:
            "Что внутри, кто ищет, что произойдёт при вскрытии, потере или досмотре...",
    },

    device: {
        label: "Устройство",
        icon: "⚙",
        statusLabel: "Состояние устройства",
        defaultTitle: "Устройство",
        defaultStatus: "working",
        defaultBurden: 2,
        defaultRisk: 2,
        defaultTagIds: ["needsOperator"],
        statuses: [
            { value: "working", label: "Работает" },
            { value: "unstable", label: "Нестабильно" },
            { value: "noisy", label: "Шумит" },
            { value: "damaged", label: "Повреждено" },
            { value: "empty", label: "Разряжено" },
            { value: "broken", label: "Сломано" },
        ],
        tags: [
            { value: "needsFuel", label: "Требует топлива" },
            { value: "needsCharge", label: "Требует заряда" },
            { value: "noisy", label: "Шумит" },
            { value: "heating", label: "Греется" },
            { value: "needsOperator", label: "Нужен оператор" },
            { value: "needsRepair", label: "Нужен ремонт" },
            { value: "protection", label: "Даёт защиту" },
            { value: "communication", label: "Даёт связь" },
            { value: "failureRisk", label: "Может отказать" },
        ],
        burdenHint:
            "Насколько устройство требует носильщика, оператора, энергии или обслуживания.",
        riskHint:
            "Насколько устройство шумит, греется, ломается или создаёт зависимость от энергии.",
        descriptionPlaceholder:
            "Что это за устройство, зачем его несут, кто умеет им пользоваться...",
        masterNotesPlaceholder:
            "Когда оно откажет, что потребляет, какую цену создаёт, кто его хочет...",
    },

    other: {
        label: "Другое",
        icon: "•",
        statusLabel: "Состояние",
        defaultTitle: "Сопровождение",
        defaultStatus: "stable",
        defaultBurden: 1,
        defaultRisk: 1,
        defaultTagIds: [],
        statuses: [
            { value: "stable", label: "Стабильно" },
            { value: "strained", label: "Напряжено" },
            { value: "damaged", label: "Повреждено" },
            { value: "hidden", label: "Спрятано" },
            { value: "lost", label: "Потеряно" },
            { value: "abandoned", label: "Брошено" },
        ],
        tags: [
            { value: "important", label: "Важно" },
            { value: "secret", label: "Секретно" },
            { value: "valuable", label: "Ценно" },
            { value: "dangerous", label: "Опасно" },
            { value: "slow", label: "Замедляет" },
            { value: "noisy", label: "Шумит" },
        ],
        burdenHint: "Насколько сопровождение мешает движению или требует внимания.",
        riskHint: "Насколько сопровождение создаёт угрозы, шум или последствия.",
        descriptionPlaceholder: "Что это такое и почему оно идёт с отрядом...",
        masterNotesPlaceholder: "Скрытые свойства, будущая цена, последствия потери...",
    },
};

export const ATTACHMENT_KIND_OPTIONS = Object.entries(
    ATTACHMENT_KIND_CONFIG,
).map(([value, config]) => ({
    value: value as MapAttachmentKind,
    label: config.label,
}));

export function getAttachmentKindConfig(kind: MapAttachmentKind) {
    return ATTACHMENT_KIND_CONFIG[kind] ?? ATTACHMENT_KIND_CONFIG.other;
}

export function getAttachmentStatusLabel(
    kind: MapAttachmentKind,
    status: string,
) {
    const config = getAttachmentKindConfig(kind);

    return (
        config.statuses.find((statusOption) => statusOption.value === status)?.label ??
        status
    );
}

export function getAttachmentTagLabel(kind: MapAttachmentKind, tagId: string) {
    const config = getAttachmentKindConfig(kind);

    return config.tags.find((tag) => tag.value === tagId)?.label ?? tagId;
}