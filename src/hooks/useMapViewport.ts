import { useState } from "react";

const MIN_SCALE = 0.75;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.12;

type DragState = {
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
} | null;

export function useMapViewport() {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragState, setDragState] = useState<DragState>(null);

  const isDraggingMap = dragState !== null;

  function clampScale(nextScale: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1;

    setScale((currentScale) => {
      return clampScale(currentScale + direction * ZOOM_STEP);
    });
  }

  function startMapDrag(event: React.MouseEvent<HTMLDivElement>) {
    const isMiddleMouseButton = event.button === 1;
    const isRightMouseButton = event.button === 2;

    if (!isMiddleMouseButton && !isRightMouseButton) {
      return;
    }

    event.preventDefault();

    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    });
  }

  function moveMap(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragState) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setOffsetX(dragState.startOffsetX + deltaX);
    setOffsetY(dragState.startOffsetY + deltaY);
  }

  function stopMapDrag() {
    setDragState(null);
  }

  function resetMapView() {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setDragState(null);
  }

  return {
    scale,
    offsetX,
    offsetY,
    isDraggingMap,

    handleWheel,
    startMapDrag,
    moveMap,
    stopMapDrag,
    resetMapView,
  };
}