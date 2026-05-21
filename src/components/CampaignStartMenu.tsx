import { useRef, useState } from "react";

type CampaignStartMenuProps = {
    isOpen: boolean;
    onContinue: () => void;
    onLoadDemoCampaign: () => Promise<void>;
    onImportCampaign: (file: File) => void;
    onExportCampaign: () => void;
};

export function CampaignStartMenu({
    isOpen,
    onContinue,
    onLoadDemoCampaign,
    onImportCampaign,
    onExportCampaign,
}: CampaignStartMenuProps) {
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);

    if (!isOpen) {
        return null;
    }

    async function handleLoadDemoCampaign() {
        if (isLoadingDemo) {
            return;
        }

        setIsLoadingDemo(true);

        try {
            await onLoadDemoCampaign();
        } finally {
            setIsLoadingDemo(false);
        }
    }

    function handleImportClick() {
        importInputRef.current?.click();
    }

    function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        onImportCampaign(file);
        event.target.value = "";
    }

    return (
        <section className="campaign-start-menu">
            <div className="campaign-start-menu-backdrop" />

            <div className="campaign-start-menu-card">
                <div className="campaign-start-menu-header">
                    <p>Могила Человечества</p>
                    <h1>Вольный Клинок</h1>
                    <span>Цифровой стол экспедиции</span>
                </div>

                <div className="campaign-start-menu-actions">
                    <button type="button" className="primary" onClick={onContinue}>
                        Продолжить текущую кампанию
                    </button>

                    <button
                        type="button"
                        onClick={handleLoadDemoCampaign}
                        disabled={isLoadingDemo}
                    >
                        {isLoadingDemo ? "Загрузка демо..." : "Начать демо-кампанию"}
                    </button>

                    <button type="button" onClick={handleImportClick}>
                        Импортировать кампанию из JSON
                    </button>

                    <button type="button" onClick={onExportCampaign}>
                        Экспортировать текущую кампанию
                    </button>
                </div>

                <p className="campaign-start-menu-warning">
                    Загрузка демо или импорт JSON заменят текущее состояние кампании. Перед
                    этим можно экспортировать текущую кампанию.
                </p>

                <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={handleImportChange}
                />
            </div>
        </section>
    );
}