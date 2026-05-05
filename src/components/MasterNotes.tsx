type MasterNotesProps = {
  notes: string;
  onChangeNotes: (notes: string) => void;
  onClose: () => void;
};

export function MasterNotes({
  notes,
  onChangeNotes,
  onClose,
}: MasterNotesProps) {
  return (
    <section className="master-notes-window">
      <header className="master-notes-header">
        <div>
          <p className="eyebrow">Мастерская</p>
          <h2>Заметки</h2>
        </div>

        <button className="drawer-tab compact" type="button" onClick={onClose}>
          ×
        </button>
      </header>

      <textarea
        className="master-notes-textarea"
         autoFocus
        value={notes}
        onChange={(event) => onChangeNotes(event.target.value)}
        placeholder="Быстрые заметки мастера..."
      />
    </section>
  );
}