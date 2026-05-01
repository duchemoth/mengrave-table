type CampaignArchiveProps = {
  onExportCampaign: () => void;
  onImportCampaign: (file: File) => void;
};

export function CampaignArchive({
  onExportCampaign,
  onImportCampaign,
}: CampaignArchiveProps) {
  return (
    <article className="panel developer-panel">
      <p className="eyebrow">Архив кампании</p>
      <h2>Импорт / экспорт</h2>

      <p>
        Сохраняй кампанию в JSON-файл перед крупными правками. Потом этот файл
        можно будет загрузить обратно.
      </p>

      <div className="archive-actions">
        <button className="secondary-button" onClick={onExportCampaign}>
          Экспорт кампании
        </button>

        <label className="import-button">
          Импорт кампании
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              onImportCampaign(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>
    </article>
  );
}