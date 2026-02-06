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

/**
 * Keeps Excalidraw scene data in localStorage with debounced writes.
 *
 * Why this hook exists:
 * - Excalidraw emits `onChange` very frequently while users draw.
 * - Writing every event to localStorage is wasteful and can feel laggy.
 * - Debouncing keeps the UI smooth while still persisting often enough.
 */
export const useDrawingPersistence = ({
  storageKey = DRAWING_STORAGE_KEY,
  saveDebounceMs = DEFAULT_SAVE_DEBOUNCE_MS,
} = {}) => {
  /**
   * Load once per board key so Excalidraw can initialize from persisted data.
   * `useMemo` avoids re-parsing JSON during unrelated rerenders.
   */
  const initialData = useMemo(
    () => loadSceneFromStorage(storageKey),
    [storageKey],
  );

  /**
   * Keep one debounced writer per key/debounce combination.
   * Lodash keeps only the latest invocation arguments in the wait window.
   */
  const debouncedSave = useMemo(
    () =>
      _.debounce((scene) => {
        saveSceneToStorage(scene, storageKey);
      }, saveDebounceMs),
    [storageKey, saveDebounceMs],
  );

  const onChange = (elements, appState, files) => {
    /**
     * No refs needed here:
     * lodash handles latest-argument semantics for us.
     */
    debouncedSave({ elements, appState, files });
  };

  useEffect(() => {
    return () => {
      /**
       * `flush()` commits the most recent pending update (important when
       * switching boards quickly). `cancel()` then clears timers.
       */
      debouncedSave.flush();
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
