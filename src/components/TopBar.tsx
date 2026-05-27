import type { UserMode } from "../types/campaign";

type TopBarProps = {
  userMode: UserMode;
  isPlayerScreen: boolean;
  isCleanMapMode: boolean;
  onChangeMode: (mode: UserMode) => void;
  onOpenPlayerScreen: () => void;
  onEnableCleanMapMode: () => void;
  onRestoreInterface: () => void;
};

export function TopBar({
  userMode,
  isPlayerScreen,
  isCleanMapMode,
  onChangeMode,
  onOpenPlayerScreen,
  onEnableCleanMapMode,
  onRestoreInterface,
}: TopBarProps) {
  return (
    <>
      <header
        className={`floating-topbar ${isCleanMapMode ? "hidden-ui" : ""}`}
      >
        <div className="topbar-title">
          <p className="topbar-world">Могила Человечества</p>
          <h1>Вольный Клинок</h1>
        </div>

        <div className="topbar-actions">
          {isPlayerScreen ? (
            <div className="player-screen-badge">Экран игроков</div>
          ) : (
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

              {userMode === "developer" && (
                <button
                  className="mode-toggle mode-toggle-echo active"
                  onClick={() => onChangeMode("master")}
                  title="Выйти из режима Эха"
                >
                  Эхо
                </button>
              )}
            </div>
          )}

          <div className="topbar-presentation-actions">
            {!isPlayerScreen && userMode !== "player" && (
              <button
                className="presentation-toggle"
                type="button"
                onClick={onOpenPlayerScreen}
              >
                Показ игрокам ↗
              </button>
            )}

            <button className="sidebar-toggle" onClick={onEnableCleanMapMode}>
              Чистая карта
            </button>
          </div>
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