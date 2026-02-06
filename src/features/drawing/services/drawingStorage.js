import { restore, serializeAsJSON } from "@excalidraw/excalidraw";
import { DRAWING_STORAGE_KEY } from "../constants/persistence";

/**
 * Reads and restores an Excalidraw scene from localStorage.
 * Returns `undefined` when no valid scene is available.
 */
export const loadSceneFromStorage = (storageKey = DRAWING_STORAGE_KEY) => {
  try {
    // Raw payload was written by `saveSceneToStorage`.
    const rawScene = localStorage.getItem(storageKey);
    if (!rawScene) {
      return undefined;
    }

    // Parse, then normalize via Excalidraw's `restore` helper.
    const parsedScene = JSON.parse(rawScene);
    const restoredScene = restore(parsedScene, null, null);

    return {
      elements: restoredScene.elements,
      appState: restoredScene.appState,
      files: restoredScene.files,
      // Prevent Excalidraw from recentering the viewport on load.
      scrollToContent: false,
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
    // Serialize through Excalidraw so schema details stay aligned with upstream.
    const serializedScene = serializeAsJSON(elements, appState, files, "local");
    const parsedScene = JSON.parse(serializedScene);

    // Excalidraw excludes viewport fields from "local" export, so keep them explicitly.
    parsedScene.appState = {
      ...parsedScene.appState,
      scrollX: appState?.scrollX,
      scrollY: appState?.scrollY,
      zoom: appState?.zoom,
    };

    localStorage.setItem(storageKey, JSON.stringify(parsedScene));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc).
  }
};

export const removeSceneFromStorage = (storageKey = DRAWING_STORAGE_KEY) => {
  try {
    // Used when deleting boards so orphaned scene blobs do not accumulate.
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc).
  }
};
