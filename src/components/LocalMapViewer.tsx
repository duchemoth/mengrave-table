import { useEffect, useState } from "react";

export type LocalMapDraft = {
  imageUrl: string;
  notes: string;
};

type LocalMapViewerProps = {
  title: string;
  storageKey: string | null;
  isPlayerMode: boolean;
  canShowToPlayers: boolean;
  onShowToPlayers: () => void;
  onBackToOverview: () => void;
  onClose: () => void;
};

function loadLocalMapDraft(storageKey: string): LocalMapDraft {
  try {
    const savedLocalMap = localStorage.getItem(storageKey);

    if (!savedLocalMap) {
      return {
        imageUrl: "",
        notes: "",
      };
    }

    const parsedLocalMap = JSON.parse(savedLocalMap) as Partial<LocalMapDraft>;

    return {
      imageUrl: parsedLocalMap.imageUrl ?? "",
      notes: parsedLocalMap.notes ?? "",
    };
  } catch {
    return {
      imageUrl: "",
      notes: "",
    };
  }
}

function saveLocalMapDraft(storageKey: string, draft: LocalMapDraft) {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function LocalMapViewer({
  title,
  storageKey,
  isPlayerMode,
  canShowToPlayers,
  onShowToPlayers,
  onBackToOverview,
  onClose,
}: LocalMapViewerProps) {
  const [localMapImageUrl, setLocalMapImageUrl] = useState("");
  const [localMapNotes, setLocalMapNotes] = useState("");

  useEffect(() => {
    if (!storageKey) {
      setLocalMapImageUrl("");
      setLocalMapNotes("");
      return;
    }

    const savedLocalMap = loadLocalMapDraft(storageKey);

    setLocalMapImageUrl(savedLocalMap.imageUrl);
    setLocalMapNotes(savedLocalMap.notes);
  }, [storageKey]);

  function updateLocalMapImageUrl(nextImageUrl: string) {
    setLocalMapImageUrl(nextImageUrl);

    if (!storageKey) {
      return;
    }

    saveLocalMapDraft(storageKey, {
      imageUrl: nextImageUrl,
      notes: localMapNotes,
    });
  }

  function updateLocalMapNotes(nextNotes: string) {
    setLocalMapNotes(nextNotes);

    if (!storageKey) {
      return;
    }

    saveLocalMapDraft(storageKey, {
      imageUrl: localMapImageUrl,
      notes: nextNotes,
    });
  }

  function removeLocalMapImage() {
    updateLocalMapImageUrl("");
  }

  return (
    <>
      <div className="local-map-layout">
        <section className="local-map-main">
          <div className="local-map-frame">
            {localMapImageUrl.trim().length > 0 ? (
              <img
                className="local-map-image"
                src={localMapImageUrl.trim()}
                alt={`Локальная карта: ${title}`}
              />
            ) : (
              <div className="local-map-empty">
                <p className="eyebrow">1920 × 1080 · 16:9</p>
                <h3>Локальная карта не назначена</h3>
                <p>
                  Позже здесь будет горизонтальная карта сцены: тракт, руины,
                  форт, двор, зал, переправа или другой участок.
                </p>
              </div>
            )}
          </div>
        </section>

        {!isPlayerMode && (
          <aside className="local-map-sidebar">
            <section className="local-map-card">
              <p className="eyebrow">Фон карты</p>
              <h3>Изображение</h3>

              <label className="local-map-field">
                Путь или ссылка на картинку
                <input
                  value={localMapImageUrl}
                  onChange={(event) =>
                    updateLocalMapImageUrl(event.target.value)
                  }
                  placeholder="/local-maps/old-harbor.webp"
                />
              </label>

              <p className="local-map-help">
                Рекомендуемый стандарт: 1920×1080, WebP или JPEG. Для локальных
                файлов положи изображение в папку public/local-maps и укажи путь
                от корня сайта.
              </p>

              {localMapImageUrl.trim().length > 0 && (
                <button
                  className="danger-button"
                  type="button"
                  onClick={removeLocalMapImage}
                >
                  Убрать карту
                </button>
              )}
            </section>

            <section className="local-map-card">
              <p className="eyebrow">Для мастера</p>
              <h3>Заметки к карте</h3>

              <textarea
                className="local-map-notes"
                value={localMapNotes}
                onChange={(event) => updateLocalMapNotes(event.target.value)}
                placeholder="Входы, укрытия, опасные зоны, засады, запертые двери, шумы, маршруты отхода."
              />
            </section>
          </aside>
        )}
      </div>

      <footer className="encounter-actions">
        {canShowToPlayers && (
          <button
            className="secondary-button"
            type="button"
            onClick={onShowToPlayers}
          >
            Показать карту игрокам
          </button>
        )}

        <button
          className="secondary-button"
          type="button"
          onClick={onBackToOverview}
        >
          Вернуться к обзору
        </button>

        <button className="secondary-button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </footer>
    </>
  );
}