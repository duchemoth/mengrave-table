type TextListEditorProps = {
  title: string;
  items: string[];
  placeholder: string;
  onChangeItems: (items: string[]) => void;
};

export function TextListEditor({
  title,
  items,
  placeholder,
  onChangeItems,
}: TextListEditorProps) {
  function updateItem(index: number, value: string) {
    onChangeItems(
      items.map((item, currentIndex) =>
        currentIndex === index ? value : item,
      ),
    );
  }

  function addItem() {
    onChangeItems([...items, placeholder]);
  }

  function deleteItem(index: number) {
    if (items.length <= 1) {
      window.alert("Нельзя удалить последний пункт.");
      return;
    }

    onChangeItems(items.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <article className="panel developer-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Эхо</p>
          <h2>{title}</h2>
        </div>

        <button className="secondary-button" onClick={addItem}>
          Добавить
        </button>
      </div>

      <div className="text-list-editor">
        {items.map((item, index) => (
          <div className="text-list-row" key={`${title}-${index}`}>
            <input
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
            />

            <button
              className="danger-button"
              onClick={() => deleteItem(index)}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}