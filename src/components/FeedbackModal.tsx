import { useState } from "react";

type FeedbackModalProps = {
    isOpen: boolean;
    feedbackUrl: string;
    onClose: () => void;
};

const FEEDBACK_TEMPLATE = [
    "Баг / обратная связь по Mengrave Table",
    "",
    "1. Где случилось?",
    "Глобальная карта / локальная карта / персонажи / арсенал / справка / генератор находок / другое:",
    "",
    "2. Что я нажимал перед проблемой:",
    "",
    "3. Что ожидал увидеть:",
    "",
    "4. Что произошло на самом деле:",
    "",
    "5. Браузер и устройство:",
    "",
    "6. Скриншот приложил: да / нет",
    "",
    "7. Если сломалась кампания, экспорт JSON приложил: да / нет",
].join("\n");

export function FeedbackModal({
    isOpen,
    feedbackUrl,
    onClose,
}: FeedbackModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) {
        return null;
    }

    async function copyFeedbackTemplate() {
        try {
            await navigator.clipboard.writeText(FEEDBACK_TEMPLATE);
            setIsCopied(true);

            window.setTimeout(() => {
                setIsCopied(false);
            }, 1800);
        } catch {
            window.alert(
                "Не удалось скопировать шаблон автоматически. Выдели текст в окне и скопируй вручную.",
            );
        }
    }

    function openFeedbackLink() {
        window.open(feedbackUrl, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="feedback-layer" role="presentation" onClick={onClose}>
            <section
                className="feedback-card"
                role="dialog"
                aria-modal="true"
                aria-label="Сообщить о баге"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="feedback-header">
                    <div>
                        <p className="eyebrow">Открытое тестирование</p>
                        <h2>Сообщить о баге</h2>
                    </div>

                    <button
                        className="feedback-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </div>

                <p className="feedback-text">
                    Напиши в сообщения группы, что случилось. Если проблема связана с
                    кампанией, локальными картами, персонажами или арсеналом — приложи
                    экспортированный JSON кампании и скриншот.
                </p>

                <textarea
                    className="feedback-template"
                    readOnly
                    value={FEEDBACK_TEMPLATE}
                />

                <div className="feedback-actions">
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={copyFeedbackTemplate}
                    >
                        {isCopied ? "Скопировано ✓" : "Скопировать шаблон"}
                    </button>

                    <button
                        className="primary-button"
                        type="button"
                        onClick={openFeedbackLink}
                    >
                        Открыть сообщения группы
                    </button>
                </div>
            </section>
        </div>
    );
}