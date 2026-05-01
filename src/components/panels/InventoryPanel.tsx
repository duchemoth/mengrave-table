type InventoryPanelProps = {
  npcs: string[];
  items: string[];
};

export function InventoryPanel({ npcs, items }: InventoryPanelProps) {
  return (
    <article className="panel two-columns">
      <div>
        <h2>Досье</h2>
        <ul>
          {npcs.map((npc, index) => (
            <li key={`${npc}-${index}`}>{npc}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Снаряжение</h2>
        <ul>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}