type HudToolsProps = {
  isPlayerMode: boolean;
  isNotesOpen: boolean;
  isCharactersOpen: boolean;
  isReferenceOpen: boolean;
  onToggleNotes: () => void;
  onToggleCharacters: () => void;
  onToggleReference: () => void;
};

export function HudTools({
  isPlayerMode,
  isNotesOpen,
  isCharactersOpen,
  isReferenceOpen,
  onToggleNotes,
  onToggleCharacters,
  onToggleReference,
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