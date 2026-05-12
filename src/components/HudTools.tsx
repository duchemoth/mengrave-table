type HudToolsProps = {
  isPlayerMode: boolean;
  isNotesOpen: boolean;
  isCharactersOpen: boolean;
  onToggleNotes: () => void;
  onToggleCharacters: () => void;
};

export function HudTools({
  isPlayerMode,
  isNotesOpen,
  isCharactersOpen,
  onToggleNotes,
  onToggleCharacters,
}: HudToolsProps) {
  if (isPlayerMode) {
    return null;
  }

  return (
    <div className="hud-tools">
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
    </div>
  );
}