type CampaignArchiveProps = {
  globalMapImageUrl: string;
  onChangeGlobalMapImageUrl: (imageUrl: string) => void;
  onExportCampaign: () => void;
  onImportCampaign: (file: File) => void;
};

export function CampaignArchive({
  globalMapImageUrl,
  onChangeGlobalMapImageUrl,
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

      <div className="editor-form">
        <label>
          Глобальная карта
          <input
            value={globalMapImageUrl}
            onChange={(event) => onChangeGlobalMapImageUrl(event.target.value)}
            placeholder="/maps/intro-region.webp"
          />
        </label>

        <p className="editor-empty-text">
          Положи карту в public/maps и укажи путь от корня сайта. Например:
          /maps/intro-region.webp. Для старой карты можно оставить /map.jpg.
        </p>
      </div>

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