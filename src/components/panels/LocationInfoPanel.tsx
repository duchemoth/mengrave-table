import type { Location } from "../../types/campaign";

type LocationInfoPanelProps = {
  selectedLocation: Location;
  isPlayerMode: boolean;
};

export function LocationInfoPanel({
  selectedLocation,
  isPlayerMode,
}: LocationInfoPanelProps) {
  return (
    <article className="panel">
      <p className="eyebrow">{selectedLocation.type}</p>
      <h2>{selectedLocation.title}</h2>
      <p>{selectedLocation.description}</p>

      {selectedLocation.isSecret && !isPlayerMode && (
        <div className="secret-note">
          Закрытая архивная пометка. Видна только мастеру и Эху.
        </div>
      )}
    </article>
  );
}