import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { useCallback, useEffect, useRef } from "react";
import { createBoardStorageKey } from "../../constants/persistence";
import { useDrawingPersistence } from "../useDrawingPersistence";
import { loadSceneFromStorage } from "../../services/drawingStorage";

/**
 * Product decision: keep the drawing experience in dark mode for every board.
 * Board scenes can still contain a persisted `appState.theme`, but we override
 * it on load to avoid unexpected theme flips while switching boards.
 */
export const EXCALIDRAW_FORCED_THEME = "dark";

/**
 * Pushes a persisted board scene into the currently mounted Excalidraw instance.
 *
 * Notes:
 * - files must be added before `updateScene` so image/file references resolve.
 * - `captureUpdate: NEVER` keeps board-switch operations out of undo history.
 */
const applySceneToMountedCanvas = (excalidrawApi, scene) => {
  const sceneFiles = Object.values(scene?.files ?? {});
  if (sceneFiles.length > 0) {
    excalidrawApi.addFiles(sceneFiles);
  }

  excalidrawApi.updateScene({
    elements: scene?.elements ?? [],
    appState: {
      ...(scene?.appState ?? {}),
      theme: EXCALIDRAW_FORCED_THEME,
    },
    captureUpdate: CaptureUpdateAction.NEVER,
  });
};

/**
 * Owns Excalidraw board scene lifecycle.
 *
 * Responsibilities:
 * - provide board-scoped persistence (`initialData`, `onChange`)
 * - keep one Excalidraw instance mounted across board switches
 * - swap scene data imperatively to prevent full-page flash/re-mount
 */
export const useBoardSceneController = ({ activeBoardId, hasActiveBoard }) => {
  const excalidrawApiRef = useRef(null);
  const storageKey = createBoardStorageKey(activeBoardId);

  const { initialData, onChange } = useDrawingPersistence({
    storageKey,
  });

  /**
   * Registers the imperative Excalidraw API when component mounts.
   * This callback is stable so React does not rewire it unnecessarily.
   */
  const registerExcalidrawApi = useCallback((api) => {
    excalidrawApiRef.current = api;
  }, []);

  /**
   * On board change, load scene from storage and apply into mounted canvas.
   */
  useEffect(() => {
    const excalidrawApi = excalidrawApiRef.current;
    if (!excalidrawApi || !hasActiveBoard) {
      return;
    }

    const nextScene = loadSceneFromStorage(storageKey);
    applySceneToMountedCanvas(excalidrawApi, nextScene);
  }, [hasActiveBoard, storageKey]);

  return {
    theme: EXCALIDRAW_FORCED_THEME,
    initialData,
    onChange,
    registerExcalidrawApi,
  };
};
