import _ from "lodash";
import { useEffect, useMemo } from "react";
import {
  DEFAULT_SAVE_DEBOUNCE_MS,
  DRAWING_STORAGE_KEY,
} from "../constants/persistence";
import {
  loadSceneFromStorage,
  saveSceneToStorage,
} from "../services/drawingStorage";

/** Simple local persistence with debounced saves. */
export const useDrawingPersistence = ({
  storageKey = DRAWING_STORAGE_KEY,
  saveDebounceMs = DEFAULT_SAVE_DEBOUNCE_MS,
} = {}) => {
  // Load once per storage key change so Excalidraw does not re-initialize on every render.
  const initialData = useMemo(
    () => loadSceneFromStorage(storageKey),
    [storageKey],
  );

  // Keep one debounced function instance until key/debounce settings change.
  // This allows lodash to coalesce rapid onChange calls correctly.
  const debouncedSave = useMemo(
    () =>
      _.debounce((scene) => {
        saveSceneToStorage(scene, storageKey);
      }, saveDebounceMs),
    [storageKey, saveDebounceMs],
  );

  const onChange = (elements, appState, files) => {
    // No refs needed in this simplified version:
    // lodash debounce keeps the latest call arguments and writes them after the wait window.
    debouncedSave({ elements, appState, files });
  };

  useEffect(() => {
    return () => {
      debouncedSave.cancel();

      // Ignored for now: tab-close before debounce may lose latest edits.
      // Ignored for now: storage write errors are not surfaced in UI.
    };
  }, [debouncedSave]);

  return {
    initialData,
    onChange,
  };
};
