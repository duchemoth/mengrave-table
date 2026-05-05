type BottomDrawerProps = {
  isOpen: boolean;
  onToggleOpen: () => void;
  children: React.ReactNode;
};

export function BottomDrawer({
  isOpen,
  onToggleOpen,
  children,
}: BottomDrawerProps) {
  return (
    <aside className={`bottom-drawer ${isOpen ? "open" : "closed"}`}>
      <button className="bottom-drawer-tab" onClick={onToggleOpen}>
        {isOpen ? "↓" : "↑"}
      </button>

      <div className="bottom-drawer-content">{children}</div>
    </aside>
  );
}