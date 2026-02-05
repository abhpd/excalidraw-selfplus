import { restore, serializeAsJSON } from "@excalidraw/excalidraw";
import { DRAWING_STORAGE_KEY } from "../constants/persistence";

/**
 * Reads and restores an Excalidraw scene from localStorage.
 * Returns `undefined` when no valid scene is available.
 */
export const loadSceneFromStorage = (storageKey = DRAWING_STORAGE_KEY) => {
  try {
    const rawScene = localStorage.getItem(storageKey);
    if (!rawScene) {
      return undefined;
    }

    const parsedScene = JSON.parse(rawScene);
    const restoredScene = restore(parsedScene, null, null);

    return {
      elements: restoredScene.elements,
      appState: restoredScene.appState,
      files: restoredScene.files,
    };
  } catch {
    return undefined;
  }
};

/**
 * Serializes and stores the current Excalidraw scene.
 * Fails silently to keep the drawing experience uninterrupted.
 */
export const saveSceneToStorage = (
  { elements, appState, files },
  storageKey = DRAWING_STORAGE_KEY,
) => {
  try {
    const serializedScene = serializeAsJSON(elements, appState, files, "local");
    localStorage.setItem(storageKey, serializedScene);
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc).
  }
};
