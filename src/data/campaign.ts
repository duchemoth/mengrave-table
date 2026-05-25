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
      imageUrl: "",
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
      imageUrl: "",
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
      imageUrl: "",
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

  arsenalItems: [],

  groups: [
    {
      id: "group-players",
      name: "Вольный Клинок",
      faction: "players",
      description: "Отряд игроков, действующий на границе известных земель.",
      imageUrl: "",
      x: 18,
      y: 62,
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
      name: "Стая у чёрной насыпи",
      faction: "echomorph",
      description:
        "Нечто движется между камнями. Издали похоже на людей, если смотреть недолго.",
      imageUrl: "",
      x: 70,
      y: 36,
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

  events: [],

  characters: [],

  referenceArticles: [],

};