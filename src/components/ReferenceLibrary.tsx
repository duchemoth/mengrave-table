import { useEffect, useMemo, useState } from "react";
import { ArsenalEditor } from "./editors/ArsenalEditor";
import type {
    ArsenalItem,
    ReferenceArticle,
    ReferenceSection,
    ReferenceVisibility,
} from "../types/campaign";

const SECTION_LABELS: Record<ReferenceSection, string> = {
    rules: "Правила",
    campaign: "Кампания",
    lore: "Лорбук",
    bestiary: "Бестиарий",
    equipment: "Снаряжение",
    factions: "Фракции",
    dossier: "Досье",
    glossary: "Глоссарий",
    other: "Другое",
};

const SECTIONS: ReferenceSection[] = [
    "rules",
    "campaign",
    "lore",
    "bestiary",
    "equipment",
    "factions",
    "dossier",
    "glossary",
    "other",
];

type ReferenceTab = ReferenceSection | "arsenal";

const EMPTY_SUBSECTION_LABEL = "Без подраздела";

const VISIBILITY_LABELS: Record<ReferenceVisibility, string> = {
    players: "Игроки",
    master: "Мастер",
    echo: "Эхо",
};

function normalizeSearchText(value: string) {
    return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

function articleMatchesSearch(article: ReferenceArticle, searchQuery: string) {
    const normalizedQuery = normalizeSearchText(searchQuery);

    if (!normalizedQuery) {
        return true;
    }

    const searchWords = normalizedQuery.split(" ").filter(Boolean);

    const searchableText = normalizeSearchText(
        [
            article.title,
            article.tags,
            article.content,
            article.section,
            article.visibility,
        ].join(" "),
    );

    return searchWords.every((word) => searchableText.includes(word));
}

type ReferenceSubsectionGroup = {
    title: string;
    articles: ReferenceArticle[];
};

function getSubsectionName(article: ReferenceArticle) {
    return article.subsection.trim() || EMPTY_SUBSECTION_LABEL;
}

function groupArticlesBySubsection(
    articles: ReferenceArticle[],
): ReferenceSubsectionGroup[] {
    const groups = new Map<string, ReferenceArticle[]>();

    articles.forEach((article) => {
        const subsectionName = getSubsectionName(article);
        const existingArticles = groups.get(subsectionName) ?? [];

        groups.set(subsectionName, [...existingArticles, article]);
    });

    return Array.from(groups.entries()).map(([title, groupedArticles]) => ({
        title,
        articles: groupedArticles,
    }));
}

type ReferenceLibraryProps = {
    articles: ReferenceArticle[];
    arsenalItems: ArsenalItem[];
    isPlayerMode: boolean;
    isDeveloperMode: boolean;
    initialArticleId?: string | null;
    initialSection?: ReferenceSection | null;
    onCreateArticle: () => ReferenceArticle;
    onUpdateArticle: (article: ReferenceArticle) => void;
    onDeleteArticle: (articleId: string) => void;
    onChangeArsenalItems: (items: ArsenalItem[]) => void;
    onClose: () => void;
};

export function ReferenceLibrary({
    articles,
    arsenalItems,
    isPlayerMode,
    isDeveloperMode,
    initialArticleId = null,
    initialSection = null,
    onCreateArticle,
    onUpdateArticle,
    onDeleteArticle,
    onChangeArsenalItems,
    onClose,
}: ReferenceLibraryProps) {
    const [activeSection, setActiveSection] = useState<ReferenceTab>("rules");
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
        articles[0]?.id ?? null,
    );
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!initialArticleId) {
            return;
        }

        const article = articles.find((item) => item.id === initialArticleId);

        if (!article) {
            return;
        }

        setActiveSection(initialSection ?? article.section);
        setSelectedArticleId(article.id);
        setIsEditing(false);
        setSearchQuery("");
    }, [articles, initialArticleId, initialSection]);

    const [openSubsections, setOpenSubsections] = useState<Record<string, boolean>>(
        {},
    );

    const visibleArticles = useMemo(() => {
        return articles.filter((article) => {
            if (isDeveloperMode) {
                return true;
            }

            if (isPlayerMode) {
                return article.visibility === "players";
            }

            return article.visibility === "players" || article.visibility === "master";
        });
    }, [articles, isDeveloperMode, isPlayerMode]);

    const sectionArticles =
        activeSection === "arsenal"
            ? []
            : visibleArticles.filter(
                (article) =>
                    article.section === activeSection &&
                    articleMatchesSearch(article, searchQuery),
            );

    const subsectionGroups = groupArticlesBySubsection(sectionArticles);

    const selectedArticle =
        visibleArticles.find((article) => article.id === selectedArticleId) ??
        sectionArticles[0] ??
        null;

    function isSubsectionOpen(subsectionTitle: string) {
        return openSubsections[subsectionTitle] ?? true;
    }

    function toggleSubsection(subsectionTitle: string) {
        setOpenSubsections((currentSubsections) => ({
            ...currentSubsections,
            [subsectionTitle]: !isSubsectionOpen(subsectionTitle),
        }));
    }

    function selectSection(section: ReferenceTab) {
        setActiveSection(section);

        if (section === "arsenal") {
            setSelectedArticleId(null);
            setIsEditing(false);
            return;
        }

        const firstArticleInSection = visibleArticles.find(
            (article) => article.section === section,
        );

        setSelectedArticleId(firstArticleInSection?.id ?? null);
        setIsEditing(false);
    }

    function createArticle() {
        if (activeSection === "arsenal") {
            return;
        }

        const article = onCreateArticle();

        if (activeSection === "dossier") {
            onUpdateArticle({
                ...article,
                section: "dossier",
                title: "Новое досье",
                subsection: "NPC",
                visibility: "master",
                tags: "npc",
                content: [
                    "Роль:",
                    "",
                    "Фракция / принадлежность:",
                    "",
                    "Статус:",
                    "",
                    "Что известно игрокам:",
                    "",
                    "Манера поведения:",
                    "",
                    "Секреты мастера:",
                    "",
                    "Связанные места / поручения:",
                    "",
                ].join("\n"),
            });
        } else if (activeSection === "campaign") {
            onUpdateArticle({
                ...article,
                section: "campaign",
                title: "Новая статья кампании",
                subsection: "Пепел Вояжа",
                visibility: "master",
                tags: "кампания, мастер",
                content: [
                    "Назначение статьи:",
                    "",
                    "Кратко для Мастера:",
                    "",
                    "Что важно показать игрокам:",
                    "",
                    "Ключевые сцены / точки:",
                    "",
                    "Решения игроков:",
                    "",
                    "Последствия:",
                    "",
                    "Связанные NPC / события / локации:",
                    "",
                ].join("\n"),
            });
        } else {
            onUpdateArticle({
                ...article,
                section: activeSection,
            });
        }

        setSelectedArticleId(article.id);
        setIsEditing(true);
    }

    function updateSelectedArticle(updatedFields: Partial<ReferenceArticle>) {
        if (!selectedArticle) {
            return;
        }

        onUpdateArticle({
            ...selectedArticle,
            ...updatedFields,
        });
    }

    function deleteSelectedArticle() {
        if (!selectedArticle) {
            return;
        }

        const shouldDelete = window.confirm(
            `Удалить статью «${selectedArticle.title}»? Это действие нельзя отменить.`,
        );

        if (!shouldDelete) {
            return;
        }

        onDeleteArticle(selectedArticle.id);

        const nextArticle =
            sectionArticles.find((article) => article.id !== selectedArticle.id) ??
            null;

        setSelectedArticleId(nextArticle?.id ?? null);
        setIsEditing(false);
    }

    function getImageUrlsText(article: ReferenceArticle) {
        return article.imageUrls.join("\n");
    }

    function parseImageUrls(value: string) {
        return value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }

    return (
        <section className="reference-window">
            <header className="reference-header">
                <div>
                    <p className="eyebrow">Библиотека</p>
                    <h2>Справка</h2>
                </div>

                <button className="drawer-tab compact" type="button" onClick={onClose}>
                    ×
                </button>
            </header>

            <div className="reference-tabs">
                {SECTIONS.map((section) => (
                    <button
                        key={section}
                        className={`reference-tab ${activeSection === section ? "active" : ""}`}
                        type="button"
                        onClick={() => selectSection(section)}
                    >
                        {SECTION_LABELS[section]}
                    </button>
                ))}

                {!isPlayerMode && (
                    <button
                        className={`reference-tab ${activeSection === "arsenal" ? "active" : ""}`}
                        type="button"
                        onClick={() => selectSection("arsenal")}
                    >
                        Арсенал
                    </button>
                )}
            </div>

            {activeSection !== "arsenal" && (
                <div className="reference-search-row">
                    <label className="reference-search-field">
                        Поиск по справке
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Название, тег или слово из текста..."
                        />
                    </label>

                    {searchQuery.trim().length > 0 && (
                        <button
                            className="secondary-button reference-clear-search"
                            type="button"
                            onClick={() => setSearchQuery("")}
                        >
                            Очистить
                        </button>
                    )}
                </div>
            )}


            {activeSection === "arsenal" ? (
                <div className="reference-arsenal-panel">
                    <ArsenalEditor
                        items={arsenalItems}
                        isDeveloperMode={isDeveloperMode}
                        onChangeItems={onChangeArsenalItems}
                    />
                </div>
            ) : (
                <div className="reference-layout">
                    <aside className="reference-article-list">
                        {isDeveloperMode && (
                            <button
                                className="secondary-button reference-create-button"
                                type="button"
                                onClick={createArticle}
                            >
                                {activeSection === "dossier" ? "Добавить досье" : "Добавить статью"}
                            </button>
                        )}

                        {sectionArticles.length === 0 ? (
                            <p className="reference-empty-text">
                                {searchQuery.trim().length > 0
                                    ? "По этому запросу в разделе ничего не найдено."
                                    : "В этом разделе пока нет доступных статей."}
                            </p>
                        ) : (
                            <div className="reference-subsection-list">
                                {subsectionGroups.map((group) => {
                                    const isOpen = isSubsectionOpen(group.title);

                                    return (
                                        <div key={group.title} className="reference-subsection">
                                            <button
                                                className="reference-subsection-header"
                                                type="button"
                                                onClick={() => toggleSubsection(group.title)}
                                            >
                                                <span>
                                                    {isOpen ? "▼" : "▶"} {group.title}
                                                </span>

                                                <small>{group.articles.length}</small>
                                            </button>

                                            {isOpen && (
                                                <div className="reference-article-buttons">
                                                    {group.articles.map((article) => (
                                                        <button
                                                            key={article.id}
                                                            className={`reference-article-button ${selectedArticle?.id === article.id ? "active" : ""
                                                                }`}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedArticleId(article.id);
                                                                setIsEditing(false);
                                                            }}
                                                        >
                                                            <span>{article.title || "Без названия"}</span>
                                                            <small>
                                                                {VISIBILITY_LABELS[article.visibility]}
                                                                {article.tags.trim().length > 0
                                                                    ? ` · ${article.tags.trim()}`
                                                                    : ""}
                                                            </small>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </aside>

                    <main className="reference-content-panel">
                        {!selectedArticle ? (
                            <div className="reference-empty-state">
                                <h3>Статья не выбрана</h3>
                                <p>Выбери статью слева или создай новую в режиме Эхо.</p>
                            </div>
                        ) : isEditing && isDeveloperMode ? (
                            <article className="reference-editor">
                                <div className="reference-editor-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Готово
                                    </button>

                                    <button
                                        className="danger-button"
                                        type="button"
                                        onClick={deleteSelectedArticle}
                                    >
                                        Удалить
                                    </button>
                                </div>

                                <label className="reference-field">
                                    Название
                                    <input
                                        value={selectedArticle.title}
                                        onChange={(event) =>
                                            updateSelectedArticle({ title: event.target.value })
                                        }
                                        placeholder="Название статьи"
                                    />
                                </label>

                                <div className="reference-form-grid">
                                    <label className="reference-field">
                                        Раздел
                                        <select
                                            value={selectedArticle.section}
                                            onChange={(event) =>
                                                updateSelectedArticle({
                                                    section: event.target.value as ReferenceSection,
                                                })
                                            }
                                        >
                                            {SECTIONS.map((section) => (
                                                <option key={section} value={section}>
                                                    {SECTION_LABELS[section]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="reference-field">
                                        Видимость
                                        <select
                                            value={selectedArticle.visibility}
                                            onChange={(event) =>
                                                updateSelectedArticle({
                                                    visibility: event.target.value as ReferenceVisibility,
                                                })
                                            }
                                        >
                                            <option value="players">Игроки</option>
                                            <option value="master">Мастер</option>
                                            <option value="echo">Эхо</option>
                                        </select>
                                    </label>
                                </div>

                                <label className="reference-field">
                                    Подраздел
                                    <input
                                        value={selectedArticle.subsection}
                                        onChange={(event) =>
                                            updateSelectedArticle({ subsection: event.target.value })
                                        }
                                        placeholder={
                                            selectedArticle.section === "dossier"
                                                ? "Например: Апис, Форпост Горста, Вояж, Бриганты..."
                                                : selectedArticle.section === "campaign"
                                                    ? "Например: Пепел Вояжа, Апис, Крушение, Путь к Горсту, Форпост Горста..."
                                                    : "Например: Базовая механика, Бой, Обскурия..."
                                        }
                                    />
                                </label>

                                <label className="reference-field">
                                    Теги
                                    <input
                                        value={selectedArticle.tags}
                                        onChange={(event) =>
                                            updateSelectedArticle({ tags: event.target.value })
                                        }
                                        placeholder="Например: d20, бой, инфофон"
                                    />
                                </label>

                                <label className="reference-field">
                                    Текст статьи
                                    <textarea
                                        value={selectedArticle.content}
                                        onChange={(event) =>
                                            updateSelectedArticle({ content: event.target.value })
                                        }
                                        placeholder={
                                            selectedArticle.section === "dossier"
                                                ? "Описание NPC, роль, поведение, сведения для игроков и скрытые заметки мастера..."
                                                : selectedArticle.section === "campaign"
                                                    ? "Обзор сцены, маршрут, последствия решений, подсказки мастеру, связки между событиями..."
                                                    : "Текст правила, лора, описания или заметки..."
                                        }
                                    />
                                </label>

                                <label className="reference-field">
                                    Ссылки на изображения
                                    <textarea
                                        value={getImageUrlsText(selectedArticle)}
                                        onChange={(event) =>
                                            updateSelectedArticle({
                                                imageUrls: parseImageUrls(event.target.value),
                                            })
                                        }
                                        placeholder="Каждая ссылка с новой строки. Файлы пока не загружаем, чтобы не раздувать прототип."
                                    />
                                </label>
                            </article>
                        ) : (
                            <article className="reference-reader">
                                <header className="reference-reader-header">
                                    <div>
                                        <p className="eyebrow">
                                            {SECTION_LABELS[selectedArticle.section]}
                                            {selectedArticle.subsection.trim()
                                                ? ` · ${selectedArticle.subsection.trim()}`
                                                : ""}{" "}
                                            · {VISIBILITY_LABELS[selectedArticle.visibility]}
                                        </p>
                                        <h3>{selectedArticle.title || "Без названия"}</h3>
                                    </div>

                                    {isDeveloperMode && (
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Редактировать
                                        </button>
                                    )}
                                </header>

                                {selectedArticle.tags.trim().length > 0 && (
                                    <p className="reference-tags">{selectedArticle.tags}</p>
                                )}

                                {selectedArticle.imageUrls.length > 0 && (
                                    <div className="reference-images">
                                        {selectedArticle.imageUrls.map((imageUrl) => (
                                            <img key={imageUrl} src={imageUrl} alt="" />
                                        ))}
                                    </div>
                                )}

                                <div className="reference-article-text">
                                    {selectedArticle.content.trim().length > 0 ? (
                                        selectedArticle.content
                                            .split("\n")
                                            .map((paragraph, index) => (
                                                <p key={`${paragraph}-${index}`}>
                                                    {paragraph.trim() || "\u00A0"}
                                                </p>
                                            ))
                                    ) : (
                                        <p className="reference-empty-text">
                                            В статье пока нет текста.
                                        </p>
                                    )}
                                </div>
                            </article>
                        )}
                    </main>
                </div>
            )}
        </section>
    );
}