import { CampaignArchive } from "./editors/CampaignArchive";
import { LocationEditor } from "./editors/LocationEditor";
import { QuestEditor } from "./editors/QuestEditor";
import { TextListEditor } from "./editors/TextListEditor";
import { LocationInfoPanel } from "./panels/LocationInfoPanel";
import { QuestListPanel } from "./panels/QuestListPanel";
import type { Location, Quest } from "../types/campaign";

type SideDrawerProps = {
  isOpen: boolean;
  isPlayerMode: boolean;
  isDeveloperMode: boolean;
  selectedLocation: Location;
  locations: Location[];
  quests: Quest[];
  npcs: string[];
  items: string[];
  onToggleOpen: () => void;
  onUpdateLocation: (location: Location) => void;
  onCreateLocation: () => void;
  onDeleteLocation: () => void;
  onResetLocations: () => void;
  onSelectLocation: (locationId: string) => void;
  onExportCampaign: () => void;
  onImportCampaign: (file: File) => void;
  onChangeQuests: (quests: Quest[]) => void;
  onChangeNpcs: (items: string[]) => void;
  onChangeItems: (items: string[]) => void;
};

export function SideDrawer({
  isOpen,
  isPlayerMode,
  isDeveloperMode,
  selectedLocation,
  locations,
  quests,
  npcs,
  items,
  onToggleOpen,
  onUpdateLocation,
  onCreateLocation,
  onDeleteLocation,
  onResetLocations,
  onSelectLocation,
  onExportCampaign,
  onImportCampaign,
  onChangeQuests,
  onChangeNpcs,
  onChangeItems,
}: SideDrawerProps) {
  return (
    <aside className={`side-drawer ${isOpen ? "open" : "closed"}`}>
      <button className="drawer-tab" onClick={onToggleOpen}>
        {isOpen ? "→" : "←"}
      </button>

      <div className="drawer-content">
        <LocationInfoPanel
          selectedLocation={selectedLocation}
          isPlayerMode={isPlayerMode}
        />

        {isDeveloperMode && (
          <LocationEditor
            selectedLocation={selectedLocation}
            locations={locations}
            onUpdateLocation={onUpdateLocation}
            onCreateLocation={onCreateLocation}
            onDeleteLocation={onDeleteLocation}
            onResetLocations={onResetLocations}
            onSelectLocation={onSelectLocation}
          />
        )}

        {isDeveloperMode && (
          <CampaignArchive
            onExportCampaign={onExportCampaign}
            onImportCampaign={onImportCampaign}
          />
        )}

        {isDeveloperMode && (
          <QuestEditor quests={quests} onChangeQuests={onChangeQuests} />
        )}

        <QuestListPanel quests={quests} isPlayerMode={isPlayerMode} />

        {isDeveloperMode && (
          <TextListEditor
            title="Редактор досье"
            items={npcs}
            placeholder="Новое досье"
            onChangeItems={onChangeNpcs}
          />
        )}

        {isDeveloperMode && (
          <TextListEditor
            title="Редактор снаряжения"
            items={items}
            placeholder="Новое снаряжение"
            onChangeItems={onChangeItems}
          />
        )}

        
      </div>
    </aside>
  );
}