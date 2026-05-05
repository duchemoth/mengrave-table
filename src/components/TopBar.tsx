import type { UserMode } from "../types/campaign";

type TopBarProps = {
  userMode: UserMode;
  isCleanMapMode: boolean;
  onChangeMode: (mode: UserMode) => void;
  onEnableCleanMapMode: () => void;
  onRestoreInterface: () => void;
};

export function TopBar({
  userMode,
  isCleanMapMode,
  onChangeMode,
  onEnableCleanMapMode,
  onRestoreInterface,
}: TopBarProps) {
  return (
    <>
      <header
        className={`floating-topbar ${isCleanMapMode ? "hidden-ui" : ""}`}
      >
        <div>
          <p className="eyebrow">Вольный Клинок</p>
          <h1>Могила Человечества</h1>
        </div>

        <div className="topbar-actions">
          <div className="mode-group">
            <button
              className={`mode-toggle ${userMode === "player" ? "active" : ""}`}
              onClick={() => onChangeMode("player")}
            >
              Игрок
            </button>

            <button
              className={`mode-toggle ${userMode === "master" ? "active" : ""}`}
              onClick={() => onChangeMode("master")}
            >
              Мастер
            </button>

            <button
              className={`mode-toggle ${
                userMode === "developer" ? "active" : ""
              }`}
              onClick={() => onChangeMode("developer")}
            >
              Эхо
            </button>
          </div>

          <button className="sidebar-toggle" onClick={onEnableCleanMapMode}>
            Чистая карта
          </button>
        </div>
      </header>

      {isCleanMapMode && (
        <button className="restore-ui-button" onClick={onRestoreInterface}>
          Интерфейс
        </button>
      )}
    </>
  );
}