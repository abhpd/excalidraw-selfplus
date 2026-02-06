/** Default scene key used when a board-specific key is not provided. */
export const DRAWING_STORAGE_KEY = "excalidraw:selfplus:drawing";

/** Default debounce window for Excalidraw scene writes. */
export const DEFAULT_SAVE_DEBOUNCE_MS = 300;

/** Workspace metadata key (folders, boards, active board). */
export const WORKSPACE_STORAGE_KEY = "excalidraw:selfplus:workspace";

/** Prefix used to build per-board scene keys. */
export const BOARD_STORAGE_PREFIX = "excalidraw:selfplus:board:";

/** Stable id for the virtual root folder in the sidebar tree. */
export const ROOT_FOLDER_ID = "root";

/** Produces the persistence key for one board scene payload. */
export const createBoardStorageKey = (boardId) =>
  `${BOARD_STORAGE_PREFIX}${boardId}`;
