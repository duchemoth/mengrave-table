import type { CampaignData } from "../types/campaign";

export const campaignData: CampaignData = {
  locations: [
    {
      id: "old-harbor",
      title: "Старый порт",
      type: "Локация",
      category: "settlement",
      description:
        "Туманный портовый район, где по ночам слышны цепи и скрип пустых лодок.",
      x: 22,
      y: 58,
    },
    {
      id: "black-tower",
      title: "Чёрная башня",
      type: "Опасная зона",
      category: "danger",
      description:
        "Заброшенная башня на скале. Местные обходят её стороной после заката.",
      x: 64,
      y: 28,
    },
    {
      id: "hidden-shrine",
      title: "Скрытое святилище",
      type: "Секрет",
      category: "secret",
      description:
        "Древнее место силы, отмеченное символом, который видит только мастер.",
      x: 78,
      y: 72,
      isSecret: true,
    },
  ],

  quests: [
  {
    id: "missing-cartographer",
    title: "Найти пропавшего картографа",
    description:
      "Картограф охотничьего корпуса исчез после выхода к старым топям.",
    status: "active",
  },
  {
    id: "black-tower-fire",
    title: "Узнать, кто зажигает огонь в Чёрной башне",
    description:
      "По ночам в башне вспыхивает свет, хотя она считается заброшенной.",
    status: "active",
  },
  {
    id: "lighthouse-letter",
    title: "Доставить письмо смотрителю маяка",
    description:
      "Письмо запечатано сургучом и адресовано смотрителю дальнего маяка.",
    status: "hidden",
    isSecret: true,
  },
],

  npcs: ["Ильмар Кривой Компас", "Сестра Аделия", "Молчаливый лодочник"],

  items: ["Ржавый ключ", "Карта приливов", "Письмо с восковой печатью"],

  groups: [
  {
    id: "group-players",
    name: "Вольный Клинок",
    faction: "players",
    description: "Отряд игроков, действующий на границе известных земель.",
    x: 42,
    y: 58,
    isSecret: false,
    members: [
      {
        id: "member-1",
        name: "Каин",
        role: "Следопыт",
        description: "Ведёт отряд через опасные земли.",
      },
    ],
  },
  {
    id: "group-echomorph-1",
    name: "Стая эхоморфов",
    faction: "echomorph",
    description: "Нестабильная группа тварей у старого тракта.",
    x: 68,
    y: 44,
    isSecret: true,
    members: [
      {
        id: "member-echo-1",
        name: "Искажённая туша",
        role: "Крупная тварь",
        description: "Медленная, но крайне живучая.",
      },
    ],
  },
],
};