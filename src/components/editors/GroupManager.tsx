import { useState } from "react";
import type { MapGroup, MapGroupFaction } from "../../types/campaign";

const FACTION_OPTIONS: { value: MapGroupFaction; label: string }[] = [
  { value: "players", label: "Отряд игроков" },
  { value: "fief", label: "Феодальные силы" },
  { value: "euler", label: "Эйлеры" },
  { value: "voyager", label: "Купеческие вояджеры" },
  { value: "evergal", label: "Эвергальский конклав" },
  { value: "brigand", label: "Бриганты" },
  { value: "infiltrator", label: "Наймиты" },
  { value: "freeblade", label: "Вольники" },
  { value: "valour", label: "Валор Обскурия" },
  { value: "echomorph", label: "Эхоморфы" },
];

type GroupManagerProps = {
  groups: MapGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreateGroup: (group: Omit<MapGroup, "id">) => MapGroup;
  onUpdateGroup: (group: MapGroup) => void;
  onDeleteGroup: (groupId: string) => void;
};

export function GroupManager({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: GroupManagerProps) {
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? null;

  const [draftName, setDraftName] = useState("Новая группа");
  const [draftFaction, setDraftFaction] = useState<MapGroupFaction>("brigand");

  function createNewGroup() {
    const newGroup = onCreateGroup({
      name: draftName.trim() || "Новая группа",
      faction: draftFaction,
      description: "",
      x: 50,
      y: 50,
      isSecret: true,
      members: [],
    });

    onSelectGroup(newGroup.id);
  }

  return (
    <article className="panel developer-panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Глобальная карта</p>
          <h2>Группы</h2>
        </div>

        {selectedGroup && (
          <button
            className="danger-button"
            onClick={() => {
              const shouldDelete = window.confirm(
                `Удалить группу «${selectedGroup.name}»?`,
              );

              if (!shouldDelete) return;

              onDeleteGroup(selectedGroup.id);
              onSelectGroup(null);
            }}
          >
            Удалить
          </button>
        )}
      </div>

      <form className="editor-form">
        <label>
          Выбрать группу
          <select
            value={selectedGroupId ?? ""}
            onChange={(event) => onSelectGroup(event.target.value || null)}
          >
            <option value="">Не выбрана</option>

            {groups.map((group) => (
              <option value={group.id} key={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        {selectedGroup && (
          <>
            <label>
              Название
              <input
                value={selectedGroup.name}
                onChange={(event) =>
                  onUpdateGroup({
                    ...selectedGroup,
                    name: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Фракция / тип
              <select
                value={selectedGroup.faction}
                onChange={(event) =>
                  onUpdateGroup({
                    ...selectedGroup,
                    faction: event.target.value as MapGroupFaction,
                  })
                }
              >
                {FACTION_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Описание
              <textarea
                rows={3}
                value={selectedGroup.description}
                onChange={(event) =>
                  onUpdateGroup({
                    ...selectedGroup,
                    description: event.target.value,
                  })
                }
              />
            </label>

            <div className="editor-grid">
              <label>
                X
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={selectedGroup.x}
                  onChange={(event) =>
                    onUpdateGroup({
                      ...selectedGroup,
                      x: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Y
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={selectedGroup.y}
                  onChange={(event) =>
                    onUpdateGroup({
                      ...selectedGroup,
                      y: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedGroup.isSecret}
                onChange={(event) =>
                  onUpdateGroup({
                    ...selectedGroup,
                    isSecret: event.target.checked,
                  })
                }
              />
              Скрыть от игроков
            </label>
          </>
        )}

        <hr />

        <label>
          Название новой группы
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>

        <label>
          Тип новой группы
          <select
            value={draftFaction}
            onChange={(event) =>
              setDraftFaction(event.target.value as MapGroupFaction)
            }
          >
            {FACTION_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="editor-actions">
          <button className="secondary-button" type="button" onClick={createNewGroup}>
            Создать группу
          </button>
        </div>
      </form>
    </article>
  );
}