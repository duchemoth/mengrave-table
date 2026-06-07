import { PROJECT_SUPPORTERS } from "../data/credits";

type CreditsModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="credits-layer" role="presentation" onClick={onClose}>
            <section
                className="credits-card"
                role="dialog"
                aria-modal="true"
                aria-label="Доска почёта"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="credits-header">
                    <div>
                        <p className="eyebrow">Первые меценаты</p>
                        <h2>Доска почёта</h2>
                        <span>
                            Эти люди поддержали “Могилу Человечества” на раннем этапе и
                            помогли довести “Вольный Клинок” до тестового демо.
                        </span>
                    </div>

                    <button
                        className="credits-close"
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </header>

                <div className="credits-content">
                    <p>
                        Их имена вписаны в первую тестовую сборку цифрового стола. Спасибо
                        за доверие, терпение и топливо для машины.
                    </p>

                    <div className="credits-supporter-list">
                        {PROJECT_SUPPORTERS.map((supporter) => (
                            <div className="credits-supporter" key={supporter}>
                                {supporter}
                            </div>
                        ))}
                    </div>
                </div>

                <footer className="credits-footer">
                    <button className="primary" type="button" onClick={onClose}>
                        Закрыть
                    </button>
                </footer>
            </section>
        </div>
    );
}