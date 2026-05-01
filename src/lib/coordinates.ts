export function clampCoordinate(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getRelativeMapCoordinate(
  clientPosition: number,
  mapStartPosition: number,
  mapSize: number,
) {
  return ((clientPosition - mapStartPosition) / mapSize) * 100;
}