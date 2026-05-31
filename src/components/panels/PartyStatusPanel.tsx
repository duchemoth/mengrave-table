import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ATTACHMENT_KIND_OPTIONS,
    getAttachmentKindConfig,
    getAttachmentStatusLabel,
    getAttachmentTagLabel,
} from "../../data/attachments";
import type {
    ArsenalItem,
    MapAttachment,
    MapAttachmentKind,
    MapGroup,
    PlayerCharacter,
} from "../../types/campaign";

type PartyStatusPanelProps = {
    characters: PlayerCharacter[];
    arsenalItems: ArsenalItem[];
    groups: MapGroup[];
    attachments: MapAttachment[];
    canEdit: boolean;
    requestedAttachmentEditorId: string | null;
    onAttachmentEditorRequestHandled: () => void;
    onOpenCharacter: (characterId: string) => void;
    onCreateAttachment: (attachment: Omit<MapAttachment, "id">) => void;
    onUpdateAttachment: (attachment: MapAttachment) => void;
    onDeleteAttachment: (attachmentId: string) => void;
};

function getCriticalClass(character: PlayerCharacter) {
    if (
        character.physicalReserve <= 0 ||
        character.psyche <= 0 ||
        character.spirit <= 0
    ) {
        return "critical";
    }

    if (
        character.physicalReserve <= Math.ceil(character.maxPhysicalReserve / 2) ||
        character.psyche <= Math.ceil(character.maxPsyche / 2)
    ) {
        return "warning";
    }

    return "";
}

function clampScaleValue(value: number) {
    return Math.max(0, Math.min(5, Math.floor(value)));
}

function getDefaultAttachedGroupId(groups: MapGroup[]) {
    return (
        groups.find((group) => group.faction === "players")?.id ??
        groups[0]?.id ??
        null
    );
}

function createAttachmentDraft(
    kind: MapAttachmentKind,
    groups: MapGroup[],
): MapAttachment {
    const config = getAttachmentKindConfig(kind);
    const attachedToGroupId = getDefaultAttachedGroupId(groups);
    const attachedGroup = groups.find((group) => group.id === attachedToGroupId);

    return {
        id: "",
        title: config.defaultTitle,
        kind,
        status: config.defaultStatus,
        tagIds: [...config.defaultTagIds],
        description: "",
        masterNotes: "",
        imageUrl: "",
        x: attachedGroup?.x ?? 50,
        y: attachedGroup?.y ?? 50,
        isSecret: false,
        isVisibleToPlayers: true,
        attachedToGroupId,
        offsetX: 1.35,
        offsetY: 1.15,
        burden: config.defaultBurden,
        risk: config.defaultRisk,
    };
}

function RatingButtons({
    label,
    value,
    hint,
    onChange,
}: {
    label: string;
    value: number;
    hint: string;
    onChange: (value: number) => void;
}) {
    return (
        <div className="attachment-rating-field">
            <div>
                <strong>{label}</strong>
                <small>{hint}</small>
            </div>

            <div className="attachment-rating-buttons">
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                        key={rating}
                        className={value === rating ? "active" : ""}
                        type="button"
                        onClick={() => onChange(rating)}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function PartyStatusPanel({
    characters,
    arsenalItems,
    groups,
    attachments,
    canEdit,
    requestedAttachmentEditorId,
    onAttachmentEditorRequestHandled,
    onOpenCharacter,
    onCreateAttachment,
    onUpdateAttachment,
    onDeleteAttachment,
}: PartyStatusPanelProps) {
    const partyListRef = useRef<HTMLDivElement | null>(null);
    const [attachmentDraft, setAttachmentDraft] = useState<MapAttachment | null>(
        null,
    );

    const isAttachmentModalOpen = attachmentDraft !== null;

    const groupsById = useMemo(() => {
        return new Map(groups.map((group) => [group.id, group]));
    }, [groups]);

    useEffect(() => {
        if (!requestedAttachmentEditorId) {
            return;
        }

        const requestedAttachment = attachments.find((attachment) => {
            return attachment.id === requestedAttachmentEditorId;
        });

        if (requestedAttachment) {
            openEditAttachmentModal(requestedAttachment);
        }

        onAttachmentEditorRequestHandled();
    }, [
        requestedAttachmentEditorId,
        attachments,
        onAttachmentEditorRequestHandled,
    ]);

    function scrollPartyList(direction: "left" | "right") {
        const listElement = partyListRef.current;

        if (!listElement) {
            return;
        }

        listElement.scrollBy({
            left: direction === "left" ? -340 : 340,
            behavior: "smooth",
        });
    }

    function getItemName(itemId: string | null | undefined) {
        if (!itemId) {
            return "—";
        }

        return (
            arsenalItems.find((item) => item.id === itemId)?.name ??
            "Предмет удалён"
        );
    }

    function openCreateAttachmentModal() {
        setAttachmentDraft(createAttachmentDraft("survivors", groups));
    }

    function openEditAttachmentModal(attachment: MapAttachment) {
        setAttachmentDraft({
            ...attachment,
            tagIds: Array.isArray(attachment.tagIds) ? [...attachment.tagIds] : [],
        });
    }

    function closeAttachmentModal() {
        setAttachmentDraft(null);
    }

    function updateAttachmentDraft(updatedFields: Partial<MapAttachment>) {
        setAttachmentDraft((currentDraft) => {
            if (!currentDraft) {
                return currentDraft;
            }

            return {
                ...currentDraft,
                ...updatedFields,
            };
        });
    }

    function changeAttachmentKind(kind: MapAttachmentKind) {
        const config = getAttachmentKindConfig(kind);

        setAttachmentDraft((currentDraft) => {
            if (!currentDraft) {
                return currentDraft;
            }

            return {
                ...currentDraft,
                kind,
                title:
                    currentDraft.title.trim().length > 0 &&
                        currentDraft.title !== getAttachmentKindConfig(currentDraft.kind).defaultTitle
                        ? currentDraft.title
                        : config.defaultTitle,
                status: config.defaultStatus,
                tagIds: [...config.defaultTagIds],
                burden: config.defaultBurden,
                risk: config.defaultRisk,
            };
        });
    }

    function toggleAttachmentTag(tagId: string) {
        setAttachmentDraft((currentDraft) => {
            if (!currentDraft) {
                return currentDraft;
            }

            const hasTag = currentDraft.tagIds.includes(tagId);

            return {
                ...currentDraft,
                tagIds: hasTag
                    ? currentDraft.tagIds.filter((currentTagId) => currentTagId !== tagId)
                    : [...currentDraft.tagIds, tagId],
            };
        });
    }

    function saveAttachmentDraft() {
        if (!attachmentDraft) {
            return;
        }

        const normalizedDraft: MapAttachment = {
            ...attachmentDraft,
            title:
                attachmentDraft.title.trim().length > 0
                    ? attachmentDraft.title.trim()
                    : getAttachmentKindConfig(attachmentDraft.kind).defaultTitle,
            burden: clampScaleValue(attachmentDraft.burden),
            risk: clampScaleValue(attachmentDraft.risk),
        };

        if (normalizedDraft.id) {
            onUpdateAttachment(normalizedDraft);
        } else {
            const { id: _unusedId, ...newAttachment } = normalizedDraft;
            onCreateAttachment(newAttachment);
        }

        closeAttachmentModal();
    }

    function deleteCurrentAttachment() {
        if (!attachmentDraft?.id) {
            closeAttachmentModal();
            return;
        }

        onDeleteAttachment(attachmentDraft.id);
        closeAttachmentModal();
    }

    function getAttachedGroupName(attachment: MapAttachment) {
        if (!attachment.attachedToGroupId) {
            return "Оставлено на карте";
        }

        return groupsById.get(attachment.attachedToGroupId)?.name ?? "Группа удалена";
    }

    function renderAttachmentModal() {
        if (!attachmentDraft) {
            return null;
        }

        const config = getAttachmentKindConfig(attachmentDraft.kind);

        return (
            <div
                className="attachment-modal-backdrop"
                role="presentation"
                onMouseDown={closeAttachmentModal}
            >
                <section
                    className="attachment-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Редактор сопровождения"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <header className="attachment-modal-header">
                        <div>
                            <p className="eyebrow">Отряд</p>
                            <h3>
                                {attachmentDraft.id
                                    ? "Редактировать сопровождение"
                                    : "Новое сопровождение"}
                            </h3>
                        </div>

                        <button
                            className="attachment-modal-close"
                            type="button"
                            onClick={closeAttachmentModal}
                            aria-label="Закрыть"
                        >
                            ×
                        </button>
                    </header>

                    <div className="attachment-form-grid">
                        <label className="attachment-field">
                            Название
                            <input
                                value={attachmentDraft.title}
                                onChange={(event) =>
                                    updateAttachmentDraft({ title: event.target.value })
                                }
                                placeholder="Например: Выжившие Аписа"
                            />
                        </label>

                        <label className="attachment-field">
                            Тип
                            <select
                                value={attachmentDraft.kind}
                                onChange={(event) =>
                                    changeAttachmentKind(event.target.value as MapAttachmentKind)
                                }
                            >
                                {ATTACHMENT_KIND_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="attachment-field">
                            {config.statusLabel}
                            <select
                                value={attachmentDraft.status}
                                onChange={(event) =>
                                    updateAttachmentDraft({ status: event.target.value })
                                }
                            >
                                {config.statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="attachment-field">
                            Прикрепить к группе
                            <select
                                value={attachmentDraft.attachedToGroupId ?? ""}
                                onChange={(event) =>
                                    updateAttachmentDraft({
                                        attachedToGroupId: event.target.value || null,
                                    })
                                }
                            >
                                <option value="">Оставлено на карте</option>

                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="attachment-toggle-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={attachmentDraft.isVisibleToPlayers}
                                onChange={(event) =>
                                    updateAttachmentDraft({
                                        isVisibleToPlayers: event.target.checked,
                                    })
                                }
                            />
                            Видно игрокам
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={attachmentDraft.isSecret}
                                onChange={(event) =>
                                    updateAttachmentDraft({ isSecret: event.target.checked })
                                }
                            />
                            Секретно
                        </label>
                    </div>

                    <div className="attachment-rating-grid">
                        <RatingButtons
                            label="Нагрузка"
                            value={attachmentDraft.burden}
                            hint={config.burdenHint}
                            onChange={(value) => updateAttachmentDraft({ burden: value })}
                        />

                        <RatingButtons
                            label="Риск"
                            value={attachmentDraft.risk}
                            hint={config.riskHint}
                            onChange={(value) => updateAttachmentDraft({ risk: value })}
                        />
                    </div>

                    <div className="attachment-tags-field">
                        <strong>Быстрые признаки</strong>

                        <div className="attachment-tag-list">
                            {config.tags.map((tag) => {
                                const isActive = attachmentDraft.tagIds.includes(tag.value);

                                return (
                                    <button
                                        key={tag.value}
                                        className={isActive ? "active" : ""}
                                        type="button"
                                        onClick={() => toggleAttachmentTag(tag.value)}
                                    >
                                        {tag.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <label className="attachment-field">
                        Описание
                        <textarea
                            value={attachmentDraft.description}
                            onChange={(event) =>
                                updateAttachmentDraft({ description: event.target.value })
                            }
                            placeholder={config.descriptionPlaceholder}
                        />
                    </label>

                    <label className="attachment-field">
                        Заметки мастера
                        <textarea
                            value={attachmentDraft.masterNotes}
                            onChange={(event) =>
                                updateAttachmentDraft({ masterNotes: event.target.value })
                            }
                            placeholder={config.masterNotesPlaceholder}
                        />
                    </label>

                    <label className="attachment-field">
                        Ссылка на изображение / иконку
                        <input
                            value={attachmentDraft.imageUrl}
                            onChange={(event) =>
                                updateAttachmentDraft({ imageUrl: event.target.value })
                            }
                            placeholder="images/groups/survivors.webp"
                        />
                    </label>

                    <footer className="attachment-modal-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={closeAttachmentModal}
                        >
                            Отмена
                        </button>

                        {attachmentDraft.id && (
                            <button
                                className="danger-button"
                                type="button"
                                onClick={deleteCurrentAttachment}
                            >
                                Удалить
                            </button>
                        )}

                        <button
                            className="party-character-open-button"
                            type="button"
                            onClick={saveAttachmentDraft}
                        >
                            Сохранить
                        </button>
                    </footer>
                </section>
            </div>
        );
    }

    function renderAttachmentCards() {
        if (attachments.length === 0) {
            return canEdit ? (
                <article className="party-attachment-card party-attachment-empty-card">
                    <div className="party-attachment-card-main">
                        <span className="party-attachment-icon">+</span>

                        <div>
                            <h5>Сопровождения нет</h5>
                            <p>Выжившие, груз, транспорт, пленные или опасная ноша.</p>
                        </div>
                    </div>

                    <button
                        className="party-attachment-edit-button"
                        type="button"
                        onClick={openCreateAttachmentModal}
                    >
                        + Сопровождение
                    </button>
                </article>
            ) : null;
        }

        return attachments.map((attachment) => {
            const config = getAttachmentKindConfig(attachment.kind);
            const statusLabel = getAttachmentStatusLabel(
                attachment.kind,
                attachment.status,
            );

            return (
                <article
                    key={attachment.id}
                    className="party-attachment-card"
                >
                    <div className="party-attachment-card-main">
                        <span className="party-attachment-icon">{config.icon}</span>

                        <div>
                            <p className="party-attachment-eyebrow">Сопровождение</p>
                            <h5>{attachment.title || config.defaultTitle}</h5>
                            <p>
                                {config.label} · {statusLabel}
                            </p>
                        </div>
                    </div>

                    <div className="party-attachment-meta">
                        <span>Нагрузка {attachment.burden}</span>
                        <span>Риск {attachment.risk}</span>
                        <span>{getAttachedGroupName(attachment)}</span>
                    </div>

                    {attachment.tagIds.length > 0 && (
                        <div className="party-attachment-tags">
                            {attachment.tagIds.slice(0, 6).map((tagId) => (
                                <span key={tagId}>
                                    {getAttachmentTagLabel(attachment.kind, tagId)}
                                </span>
                            ))}
                        </div>
                    )}

                    {canEdit && (
                        <button
                            className="party-attachment-edit-button"
                            type="button"
                            onClick={() => openEditAttachmentModal(attachment)}
                        >
                            Редактировать
                        </button>
                    )}
                </article>
            );
        });
    }

    if (characters.length === 0) {
        return (
            <div className="party-status-panel empty">
                <div>
                    <p className="eyebrow">Отряд</p>
                    <h3>Персонажей пока нет</h3>
                    <p>Добавь первого Вольного Клинка через раздел “Персонажи”.</p>
                </div>

                <div className="party-status-list">
                    {renderAttachmentCards()}
                </div>
                {isAttachmentModalOpen &&
                    createPortal(renderAttachmentModal(), document.body)}
            </div>
        );
    }

    return (
        <section className="party-status-panel">
            <header className="party-status-header">
                <div>
                    <p className="eyebrow">Оперативная панель</p>
                    <h3>Отряд</h3>
                </div>

                <div className="party-status-controls">
                    <span>
                        {characters.length} персонажей · {attachments.length} сопров.
                    </span>

                    {canEdit && (
                        <button
                            className="party-add-attachment-button"
                            type="button"
                            onClick={openCreateAttachmentModal}
                        >
                            + Сопровождение
                        </button>
                    )}

                    <div className="party-scroll-buttons">
                        <button
                            type="button"
                            onClick={() => scrollPartyList("left")}
                            aria-label="Листать отряд влево"
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollPartyList("right")}
                            aria-label="Листать отряд вправо"
                        >
                            →
                        </button>
                    </div>
                </div>
            </header>

            <div className="party-status-list" ref={partyListRef}>
                {characters.map((character) => {
                    const criticalClass = getCriticalClass(character);
                    const inventory = character.inventory;

                    const shoulder1 = getItemName(
                        inventory?.weaponSlots.shoulder1.itemId,
                    );
                    const shoulder2 = getItemName(
                        inventory?.weaponSlots.shoulder2.itemId,
                    );
                    const smallWeapon = getItemName(
                        inventory?.weaponSlots.small.itemId,
                    );

                    const protection = getItemName(inventory?.protectionSlot.itemId);
                    const backpack = getItemName(inventory?.backpackSlot?.itemId);

                    const backpackCapacity =
                        inventory?.backpackSlot?.itemId
                            ? arsenalItems.find(
                                (item) => item.id === inventory.backpackSlot.itemId,
                            )?.backpackSlotCount ?? 0
                            : 0;

                    const backpackUsedSlots = inventory?.backpack?.length ?? 0;

                    const quickSlots = inventory?.loadBearing.quickSlots ?? [];
                    const visibleQuickSlots = quickSlots.slice(0, 6);

                    return (
                        <article
                            key={character.id}
                            className={`party-character-card ${criticalClass}`}
                        >
                            <div className="party-character-main">
                                <h4>{character.characterName || "Безымянный персонаж"}</h4>
                                <p>{character.playerName || "Игрок не указан"}</p>
                            </div>

                            <div className="party-resource-row">
                                <span>
                                    ФЗ {character.physicalReserve}/{character.maxPhysicalReserve}
                                </span>
                                <span>
                                    Психика {character.psyche}/{character.maxPsyche}
                                </span>
                                <span>
                                    Дух {character.spirit}/{character.maxSpirit}
                                </span>
                                <span>
                                    Судьба {character.fate}/{character.maxFate}
                                </span>
                            </div>

                            <div className="party-loadout-grid">
                                <div>
                                    <strong>Оружие</strong>
                                    <span>{shoulder1}</span>
                                    <span>{shoulder2}</span>
                                    <span>{smallWeapon}</span>
                                </div>

                                <div>
                                    <strong>Защита</strong>
                                    <span>{protection}</span>
                                    <span>
                                        Рюкзак: {backpack} · {backpackUsedSlots}/{backpackCapacity}
                                    </span>
                                    <span>
                                        {character.wallet.amperies} амп.{" "}
                                        {character.wallet.miliamperies} мА
                                    </span>
                                </div>
                            </div>

                            <div className="party-quick-slots">
                                {visibleQuickSlots.length === 0 ? (
                                    <span className="party-quick-empty">
                                        Быстрые слоты не назначены
                                    </span>
                                ) : (
                                    visibleQuickSlots.map((slot, index) => (
                                        <span key={slot.id} className="party-quick-slot">
                                            {index + 1}. {getItemName(slot.itemId)}
                                            {slot.quantity > 1 ? ` ×${slot.quantity}` : ""}
                                        </span>
                                    ))
                                )}
                            </div>

                            <button
                                className="party-character-open-button"
                                type="button"
                                onClick={() => onOpenCharacter(character.id)}
                            >
                                Полная карта
                            </button>
                        </article>
                    );
                })}

                {renderAttachmentCards()}
            </div>

            {isAttachmentModalOpen &&
                createPortal(renderAttachmentModal(), document.body)}
        </section>
    );
}