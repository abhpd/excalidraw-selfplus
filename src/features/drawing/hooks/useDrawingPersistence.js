import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SAVE_DEBOUNCE_MS,
  DRAWING_STORAGE_KEY,
} from "../constants/persistence";
import {
  loadSceneFromStorage,
  saveSceneToStorage,
} from "../services/drawingStorage";

/**
 * Keeps Excalidraw scene data in IndexedDB with debounced writes.
 *
 * Why this hook exists:
 * - Excalidraw emits `onChange` very frequently while users draw.
 * - Writing every event to storage is wasteful and can feel laggy.
 * - Debouncing keeps the UI smooth while still persisting often enough.
 */
export const useDrawingPersistence = ({
  storageKey = DRAWING_STORAGE_KEY,
  saveDebounceMs = DEFAULT_SAVE_DEBOUNCE_MS,
} = {}) => {
  const [initialData, setInitialData] = useState(undefined);

  /**
   * Load once per board key so Excalidraw can initialize from persisted data.
   */
  useEffect(() => {
    let isCancelled = false;

    const loadInitialScene = async () => {
      const loadedScene = await loadSceneFromStorage(storageKey);
      if (!isCancelled) {
        setInitialData(loadedScene);
      }
    };

    // Fire-and-forget async load inside this effect; cancellation guard prevents stale setState.
    void loadInitialScene();

    return () => {
      isCancelled = true;
    };
  }, [storageKey]);

  /**
   * Keep one debounced writer per key/debounce combination.
   * Lodash keeps only the latest invocation arguments in the wait window.
   */
  const debouncedSave = useMemo(
    () =>
      _.debounce((scene) => {
        // Fire-and-forget write from debounced callback; storage service handles errors internally.
        void saveSceneToStorage(scene, storageKey);
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
