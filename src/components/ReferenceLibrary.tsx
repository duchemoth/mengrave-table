import { useMemo, useState } from "react";
import type {
    ReferenceArticle,
    ReferenceSection,
    ReferenceVisibility,
} from "../types/campaign";

const SECTION_LABELS: Record<ReferenceSection, string> = {
    rules: "Правила",
    lore: "Лорбук",
    bestiary: "Бестиарий",
    equipment: "Снаряжение",
    factions: "Фракции",
    glossary: "Глоссарий",
    other: "Другое",
};

const SECTIONS: ReferenceSection[] = [
    "rules",
    "lore",
    "bestiary",
    "equipment",
    "factions",
    "glossary",
    "other",
];

const VISIBILITY_LABELS: Record<ReferenceVisibility, string> = {
    players: "Игроки",
    master: "Мастер",
    echo: "Эхо",
};

type ReferenceLibraryProps = {
    articles: ReferenceArticle[];
    isPlayerMode: boolean;
    isDeveloperMode: boolean;
    onCreateArticle: () => ReferenceArticle;
    onUpdateArticle: (article: ReferenceArticle) => void;
    onDeleteArticle: (articleId: string) => void;
    onClose: () => void;
};

export function ReferenceLibrary({
    articles,
    isPlayerMode,
    isDeveloperMode,
    onCreateArticle,
    onUpdateArticle,
    onDeleteArticle,
    onClose,
}: ReferenceLibraryProps) {
    const [activeSection, setActiveSection] = useState<ReferenceSection>("rules");
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
        articles[0]?.id ?? null,
    );
    const [isEditing, setIsEditing] = useState(false);

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

    const sectionArticles = visibleArticles.filter(
        (article) => article.section === activeSection,
    );

    const selectedArticle =
        visibleArticles.find((article) => article.id === selectedArticleId) ??
        sectionArticles[0] ??
        null;

    function selectSection(section: ReferenceSection) {
        setActiveSection(section);

        const firstArticleInSection = visibleArticles.find(
            (article) => article.section === section,
        );

        setSelectedArticleId(firstArticleInSection?.id ?? null);
        setIsEditing(false);
    }

    function createArticle() {
        const newArticle = onCreateArticle();

        const updatedArticle: ReferenceArticle = {
            ...newArticle,
            section: activeSection,
            visibility: "master",
            updatedAt: new Date().toISOString(),
        };

        onUpdateArticle(updatedArticle);
        setSelectedArticleId(updatedArticle.id);
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
                        className={`reference-tab ${activeSection === section ? "active" : ""
                            }`}
                        type="button"
                        onClick={() => selectSection(section)}
                    >
                        {SECTION_LABELS[section]}
                    </button>
                ))}
            </div>

            <div className="reference-layout">
                <aside className="reference-article-list">
                    {isDeveloperMode && (
                        <button
                            className="secondary-button reference-create-button"
                            type="button"
                            onClick={createArticle}
                        >
                            Добавить статью
                        </button>
                    )}

                    {sectionArticles.length === 0 ? (
                        <p className="reference-empty-text">
                            В этом разделе пока нет доступных статей.
                        </p>
                    ) : (
                        <div className="reference-article-buttons">
                            {sectionArticles.map((article) => (
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
                                        {SECTION_LABELS[article.section]} ·{" "}
                                        {VISIBILITY_LABELS[article.visibility]}
                                    </small>
                                </button>
                            ))}
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
                                    placeholder="Текст правила, лора, описания или заметки..."
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
                                        {SECTION_LABELS[selectedArticle.section]} ·{" "}
                                        {VISIBILITY_LABELS[selectedArticle.visibility]}
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
        </section>
    );
}