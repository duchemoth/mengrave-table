import type { CharacterSkillKey, PlayerCharacter } from "../types/campaign";

const SKILL_LABELS: Record<CharacterSkillKey, string> = {
  melee: "Ближний бой",
  shooting: "Стрельба",
  specialWeapons: "Особое оружие",
  athletics: "Атлетика",
  endurance: "Выносливость",
  stealth: "Скрытность",
  observation: "Наблюдательность",
  tracking: "Следопытство",
  navigation: "Навигация",
  survival: "Выживание",
  firstAid: "Первая помощь",
  medicine: "Медицина",
  repair: "Ремонт",
  devices: "Работа с устройствами",
  crowns: "Венцы",
  driving: "Вождение",
  tactics: "Тактика",
  intimidation: "Запугивание",
  negotiation: "Переговоры",
  insight: "Проницательность",
  criminal: "Криминальная среда",
  factions: "Фракции",
  neurography: "Нейрогравюра",
  echoInfophone: "Эхо и инфофон",
};

const MASS_LABELS = {
  deficit: "Дефицит",
  normal: "Норма",
  excess: "Избыток",
};

const EMPATHY_LABELS = {
  low: "Низкая",
  normal: "Норма",
  high: "Высокая",
};

type CharacterPreviewProps = {
  character: PlayerCharacter;
  onClose: () => void;
};

export function CharacterPreview({ character, onClose }: CharacterPreviewProps) {
  const skillEntries = Object.entries(character.skills) as [
    CharacterSkillKey,
    number,
  ][];

  const filledSkills = skillEntries.filter(([, value]) => value > 0);

  function printCharacter() {
    window.print();
  }

  return (
    <section className="character-preview-backdrop">
      <article className="character-preview-window">
        <header className="character-preview-toolbar no-print">
          <div>
            <p className="eyebrow">Предпросмотр</p>
            <h2>Лист персонажа</h2>
          </div>

          <div className="character-preview-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={printCharacter}
            >
              Печать
            </button>

            <button className="drawer-tab compact" type="button" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

        <div className="character-print-sheet">
          <header className="character-print-header">
            <p className="character-print-kicker">Могила Человечества</p>
            <h1>{character.characterName || "Безымянный Вольный Клинок"}</h1>
            <p>
              {character.playerName
                ? `Игрок: ${character.playerName}`
                : "Игрок не указан"}
            </p>
          </header>

          <section className="character-print-section">
            <h2>Досье</h2>

            <div className="character-print-grid">
              <PrintField label="Кличка" value={character.nickname} />
              <PrintField label="Возраст" value={character.age} />
              <PrintField label="Старое имя" value={character.oldName} />
              <PrintField label="Происхождение" value={character.origin} />
              <PrintField
                label="Бывшая деятельность"
                value={character.formerActivity}
              />
              <PrintField label="Масса" value={MASS_LABELS[character.mass]} />
              <PrintField
                label="Эмпатия"
                value={EMPATHY_LABELS[character.empathy]}
              />
            </div>

            <PrintTextBlock
              label="Причина стать вольником"
              value={character.reasonToBecomeFreeblade}
            />

            <PrintTextBlock label="Личная цель" value={character.personalGoal} />

            <PrintTextBlock
              label="Связь с отрядом"
              value={character.squadConnection}
            />
          </section>

          <section className="character-print-section">
            <h2>Ресурсы и состояние</h2>

            <div className="character-print-resources">
              <PrintResource
                label="ФЗ"
                value={character.physicalReserve}
                maxValue={character.maxPhysicalReserve}
              />

              <PrintResource
                label="Психика"
                value={character.psyche}
                maxValue={character.maxPsyche}
              />

              <PrintResource
                label="Дух"
                value={character.spirit}
                maxValue={character.maxSpirit}
              />

              <PrintResource
                label="Судьба"
                value={character.fate}
                maxValue={character.maxFate}
              />
            </div>

            <PrintTextBlock
              label="Раны и состояния"
              value={character.woundsAndConditions}
            />

            <PrintTextBlock
              label="Отражение / инфофонные последствия"
              value={character.reflectionNotes}
            />
          </section>

          <section className="character-print-section">
            <h2>Навыки</h2>

            {filledSkills.length === 0 ? (
              <p className="character-print-muted">Навыки пока не заполнены.</p>
            ) : (
              <div className="character-print-skills">
                {filledSkills.map(([skillKey, value]) => (
                  <div key={skillKey} className="character-print-skill">
                    <span>{SKILL_LABELS[skillKey]}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            <PrintTextBlock
              label="Специализации"
              value={character.specializations}
            />

            <PrintTextBlock label="Черты" value={character.traits} />
          </section>

          <section className="character-print-section">
            <h2>Снаряжение</h2>

            <PrintTextBlock label="Оружие" value={character.weapons} />
            <PrintTextBlock label="Броня" value={character.armor} />
            <PrintTextBlock
              label="Быстрый доступ"
              value={character.quickAccess}
            />
            <PrintTextBlock
              label="Рюкзак и груз"
              value={character.backpackAndLoad}
            />
            <PrintTextBlock label="Криптожетон" value={character.cryptotoken} />
          </section>

          <section className="character-print-section">
            <h2>Связи</h2>

            <PrintTextBlock label="Контакты" value={character.contacts} />
            <PrintTextBlock label="Долги" value={character.debts} />
            <PrintTextBlock label="Враги" value={character.enemies} />
            <PrintTextBlock label="Покровители" value={character.patrons} />
            <PrintTextBlock
              label="Кто знает старое имя"
              value={character.oldNameKnownBy}
            />
          </section>

          <section className="character-print-section master-only-print">
            <h2>Мастерская часть</h2>

            <PrintTextBlock label="Заметки мастера" value={character.masterNotes} />

            <PrintTextBlock
              label="Секреты и крючки"
              value={character.secretHooks}
            />

            <PrintTextBlock
              label="Прогресс и развитие"
              value={character.progressionNotes}
            />
          </section>
        </div>
      </article>
    </section>
  );
}

type PrintFieldProps = {
  label: string;
  value: string;
};

function PrintField({ label, value }: PrintFieldProps) {
  return (
    <div className="character-print-field">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

type PrintTextBlockProps = {
  label: string;
  value: string;
};

function PrintTextBlock({ label, value }: PrintTextBlockProps) {
  return (
    <div className="character-print-text-block">
      <span>{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

type PrintResourceProps = {
  label: string;
  value: number;
  maxValue: number;
};

function PrintResource({ label, value, maxValue }: PrintResourceProps) {
  return (
    <div className="character-print-resource">
      <span>{label}</span>
      <strong>
        {value}/{maxValue}
      </strong>
    </div>
  );
}