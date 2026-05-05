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
  function exportNotes() {
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "master-notes.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  function importNotes(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result ?? "");
      onChangeNotes(text);
    };

    reader.readAsText(file);
  }

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

      <div className="master-notes-actions">
        <button className="secondary-button" type="button" onClick={exportNotes}>
          Скачать TXT
        </button>

        <label className="secondary-button master-notes-import">
          Загрузить TXT
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              importNotes(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <textarea
        className="master-notes-textarea"
        value={notes}
        onChange={(event) => onChangeNotes(event.target.value)}
        placeholder="Быстрые заметки мастера..."
        autoFocus
      />
    </section>
  );
}