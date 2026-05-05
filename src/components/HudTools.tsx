type HudToolsProps = {
  isPlayerMode: boolean;
  isNotesOpen: boolean;
  onToggleNotes: () => void;
};

export function HudTools({
  isPlayerMode,
  isNotesOpen,
  onToggleNotes,
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
        title="Заметки мастера"
      >
        📓
      </button>
    </div>
  );
}