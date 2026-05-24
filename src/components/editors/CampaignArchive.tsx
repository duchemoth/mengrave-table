import type {
  CampaignStart,
  Location,
  MapEvent,
  MapGroup,
} from "../../types/campaign";

type CampaignArchiveProps = {
  globalMapImageUrl: string;
  onChangeGlobalMapImageUrl: (imageUrl: string) => void;

  campaignStart: CampaignStart;
  locations: Location[];
  groups: MapGroup[];
  events: MapEvent[];
  onChangeCampaignStart: (start: CampaignStart) => void;
  onTestCampaignStart: (start: CampaignStart) => void;

  onExportCampaign: () => void;
  onImportCampaign: (file: File) => void;
};

const START_MODE_LABELS: Record<CampaignStart["kind"], string> = {
  globalMap: "Глобальная карта",
  encounter: "Объект / сцена",
};

const ENCOUNTER_MODE_LABELS: Record<
  Extract<CampaignStart, { kind: "encounter" }>["mode"],
  string
> = {
  overview: "Обзор объекта",
  scene: "Сцена",
  localMap: "Локальная карта",
};

const TARGET_KIND_LABELS: Record<
  Extract<CampaignStart, { kind: "encounter" }>["targetKind"],
  string
> = {
  location: "Локация",
  group: "Группа",
  event: "Событие",
};

function getTargetTitle(
  targetKind: Extract<CampaignStart, { kind: "encounter" }>["targetKind"],
  targetId: string,
  locations: Location[],
  groups: MapGroup[],
  events: MapEvent[],
) {
  if (targetKind === "location") {
    return locations.find((location) => location.id === targetId)?.title ?? targetId;
  }

  if (targetKind === "group") {
    return groups.find((group) => group.id === targetId)?.name ?? targetId;
  }

  return events.find((event) => event.id === targetId)?.title ?? targetId;
}

function getFirstTargetId(
  targetKind: Extract<CampaignStart, { kind: "encounter" }>["targetKind"],
  locations: Location[],
  groups: MapGroup[],
  events: MapEvent[],
) {
  if (targetKind === "location") {
    return locations[0]?.id ?? "";
  }

  if (targetKind === "group") {
    return groups[0]?.id ?? "";
  }

  return events[0]?.id ?? "";
}

export function CampaignArchive({
  globalMapImageUrl,
  onChangeGlobalMapImageUrl,

  campaignStart,
  locations,
  groups,
  events,
  onChangeCampaignStart,
  onTestCampaignStart,

  onExportCampaign,
  onImportCampaign,
}: CampaignArchiveProps) {
  const encounterStart: Extract<CampaignStart, { kind: "encounter" }> =
    campaignStart.kind === "encounter"
      ? campaignStart
      : {
        kind: "encounter",
        targetKind: "location",
        targetId: locations[0]?.id ?? "",
        mode: "overview",
      };

  const targetOptions =
    encounterStart.targetKind === "location"
      ? locations.map((location) => ({
        id: location.id,
        title: location.title,
        isSecret: Boolean(location.isSecret),
      }))
      : encounterStart.targetKind === "group"
        ? groups.map((group) => ({
          id: group.id,
          title: group.name,
          isSecret: Boolean(group.isSecret),
        }))
        : events.map((event) => ({
          id: event.id,
          title: event.title,
          isSecret: Boolean(event.isSecret),
        }));

  const selectedTargetTitle =
    campaignStart.kind === "encounter"
      ? getTargetTitle(
        campaignStart.targetKind,
        campaignStart.targetId,
        locations,
        groups,
        events,
      )
      : "";

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

      <section className="campaign-start-card">
        <div>
          <p className="eyebrow">Старт кампании</p>
          <h3>Точка входа</h3>
        </div>

        <p className="campaign-start-status">
          {campaignStart.kind === "globalMap"
            ? "Кампания начинается с глобальной карты."
            : `Кампания начинается с объекта: ${TARGET_KIND_LABELS[campaignStart.targetKind]} — ${selectedTargetTitle}. Режим: ${ENCOUNTER_MODE_LABELS[campaignStart.mode]}.`}
        </p>

        <div className="campaign-start-grid editor-form">
          <label>
            Тип старта
            <select
              value={campaignStart.kind}
              onChange={(event) => {
                if (event.target.value === "globalMap") {
                  onChangeCampaignStart({
                    kind: "globalMap",
                  });
                  return;
                }

                onChangeCampaignStart({
                  kind: "encounter",
                  targetKind: "location",
                  targetId: locations[0]?.id ?? "",
                  mode: "overview",
                });
              }}
            >
              <option value="globalMap">{START_MODE_LABELS.globalMap}</option>
              <option value="encounter">{START_MODE_LABELS.encounter}</option>
            </select>
          </label>

          {campaignStart.kind === "encounter" && (
            <>
              <label>
                Тип объекта
                <select
                  value={encounterStart.targetKind}
                  onChange={(event) => {
                    const nextTargetKind = event.target
                      .value as Extract<
                        CampaignStart,
                        { kind: "encounter" }
                      >["targetKind"];

                    onChangeCampaignStart({
                      ...encounterStart,
                      targetKind: nextTargetKind,
                      targetId: getFirstTargetId(
                        nextTargetKind,
                        locations,
                        groups,
                        events,
                      ),
                    });
                  }}
                >
                  <option value="location">{TARGET_KIND_LABELS.location}</option>
                  <option value="group">{TARGET_KIND_LABELS.group}</option>
                  <option value="event">{TARGET_KIND_LABELS.event}</option>
                </select>
              </label>

              <label>
                Объект
                <select
                  value={encounterStart.targetId}
                  onChange={(event) =>
                    onChangeCampaignStart({
                      ...encounterStart,
                      targetId: event.target.value,
                    })
                  }
                >
                  {targetOptions.length === 0 ? (
                    <option value="">Нет доступных объектов</option>
                  ) : (
                    targetOptions.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.title}
                        {target.isSecret ? " · скрыто" : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                Открыть как
                <select
                  value={encounterStart.mode}
                  onChange={(event) =>
                    onChangeCampaignStart({
                      ...encounterStart,
                      mode: event.target
                        .value as Extract<
                          CampaignStart,
                          { kind: "encounter" }
                        >["mode"],
                    })
                  }
                >
                  <option value="overview">{ENCOUNTER_MODE_LABELS.overview}</option>
                  <option value="scene">{ENCOUNTER_MODE_LABELS.scene}</option>
                  <option value="localMap">
                    {ENCOUNTER_MODE_LABELS.localMap}
                  </option>
                </select>
              </label>
            </>
          )}
        </div>

        <div className="campaign-start-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onTestCampaignStart(campaignStart)}
          >
            Проверить старт
          </button>

          <button
            className="danger-button"
            type="button"
            onClick={() =>
              onChangeCampaignStart({
                kind: "globalMap",
              })
            }
          >
            Сбросить на глобальную карту
          </button>
        </div>
      </section>

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