type HudToolsProps = {
  isPlayerMode: boolean;
  isNotesOpen: boolean;
  isCharactersOpen: boolean;
  isReferenceOpen: boolean;
  isFindingsOpen: boolean;
  findingsCount: number;
  onToggleNotes: () => void;
  onToggleCharacters: () => void;
  onToggleReference: () => void;
  onToggleFindings: () => void;
};

export function HudTools({
  isPlayerMode,
  isNotesOpen,
  isCharactersOpen,
  isReferenceOpen,
  isFindingsOpen,
  findingsCount,
  onToggleNotes,
  onToggleCharacters,
  onToggleReference,
  onToggleFindings,
}: HudToolsProps) {
  return (
    <div className="hud-tools">
      {!isPlayerMode && (
        <>
          <button
            className={`hud-tool-button ${isNotesOpen ? "active" : ""}`}
            type="button"
            onClick={onToggleNotes}
          >
            Заметки
          </button>

          <button
            className={`hud-tool-button ${isCharactersOpen ? "active" : ""}`}
            type="button"
            onClick={onToggleCharacters}
          >
            Персонажи
          </button>

          <button
            className={`hud-tool-button with-badge ${isFindingsOpen ? "active" : ""}`}
            type="button"
            onClick={onToggleFindings}
          >
            Находки

            {findingsCount > 0 && (
              <span className="hud-tool-badge">{findingsCount}</span>
            )}
          </button>
        </>
      )}

      <button
        className={`hud-tool-button ${isReferenceOpen ? "active" : ""}`}
        type="button"
        onClick={onToggleReference}
      >
        Справка
      </button>
    </div>
  );
}