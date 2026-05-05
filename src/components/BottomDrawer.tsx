type BottomDrawerProps = {
  isOpen: boolean;
  isHidden: boolean;
  onToggleOpen: () => void;
  children: React.ReactNode;
};

export function BottomDrawer({
  isOpen,
  isHidden,
  onToggleOpen,
  children,
}: BottomDrawerProps) {
  return (
    <aside
  className={`bottom-drawer ${isOpen ? "open" : "closed"} ${
    isHidden ? "visually-hidden-panel" : ""
  }`}
>
      <button className="bottom-drawer-tab" onClick={onToggleOpen}>
        {isOpen ? "↓" : "↑"}
      </button>

      <div className="bottom-drawer-content">{children}</div>
    </aside>
  );
}