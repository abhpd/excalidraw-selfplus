import {
  DRAWING_STORAGE_KEY,
  ROOT_FOLDER_ID,
  WORKSPACE_STORAGE_KEY,
  createBoardStorageKey,
} from "../constants/persistence";
import { loadSceneFromStorage, saveSceneToStorage } from "./drawingStorage";
import {
  createBoardItem,
  createFolderItem,
  createNodeId,
  isBoardItem,
  isFolderItem,
  isNonEmptyString,
} from "./workspace/workspaceModel";

/**
 * Filters a folder's children list so it only references valid, unique nodes.
 */
const ensureUniqueChildren = (childrenIds, itemsById, attachedChildIds) => {
  const nextChildren = [];

  for (const childId of childrenIds) {
    if (
      !isNonEmptyString(childId) ||
      childId === ROOT_FOLDER_ID ||
      !itemsById[childId] ||
      attachedChildIds.has(childId)
    ) {
      continue;
    }

    attachedChildIds.add(childId);
    nextChildren.push(childId);
  }

  return nextChildren;
};

/**
 * Converts unknown persisted JSON into a fully valid workspace structure.
 * Invalid nodes are dropped and missing essentials are recreated.
 */
const sanitizeWorkspace = (rawWorkspace) => {
  const sanitizedItemsById = {};
  const rawItemsById =
    rawWorkspace && typeof rawWorkspace === "object"
      ? rawWorkspace.itemsById
      : undefined;

  if (rawItemsById && typeof rawItemsById === "object") {
    for (const [id, item] of Object.entries(rawItemsById)) {
      if (!isNonEmptyString(id) || !item || typeof item !== "object") {
        continue;
      }

      if (item.type === "board") {
        sanitizedItemsById[id] = createBoardItem(
          id,
          isNonEmptyString(item.name) ? item.name : "Untitled",
        );
        continue;
      }

      if (item.type === "folder") {
        sanitizedItemsById[id] = {
          ...createFolderItem(id, isNonEmptyString(item.name) ? item.name : "Folder"),
          childrenIds: Array.isArray(item.childrenIds) ? item.childrenIds : [],
        };
      }
    }
  }

  // Guarantee a root folder so tree rendering always has an anchor.
  if (!isFolderItem(sanitizedItemsById[ROOT_FOLDER_ID])) {
    sanitizedItemsById[ROOT_FOLDER_ID] = createFolderItem(ROOT_FOLDER_ID, "Boards");
  }

  // Keep child links consistent and prevent duplicate references.
  const attachedChildIds = new Set();
  for (const item of Object.values(sanitizedItemsById)) {
    if (!isFolderItem(item)) {
      continue;
    }

    item.childrenIds = ensureUniqueChildren(
      item.childrenIds,
      sanitizedItemsById,
      attachedChildIds,
    );
  }

  // Attach orphaned nodes to root so they stay reachable.
  const rootFolder = sanitizedItemsById[ROOT_FOLDER_ID];
  for (const [id, item] of Object.entries(sanitizedItemsById)) {
    if (id === ROOT_FOLDER_ID || !item || attachedChildIds.has(id)) {
      continue;
    }

    rootFolder.childrenIds.push(id);
    attachedChildIds.add(id);
  }

  const boardIds = Object.values(sanitizedItemsById)
    .filter(isBoardItem)
    .map((item) => item.id);

  // Guarantee one board at minimum.
  if (boardIds.length === 0) {
    const defaultBoardId = createNodeId("board");
    sanitizedItemsById[defaultBoardId] = createBoardItem(defaultBoardId, "Untitled");
    sanitizedItemsById[ROOT_FOLDER_ID].childrenIds.push(defaultBoardId);
    boardIds.push(defaultBoardId);
  }

  const activeBoardId = isNonEmptyString(rawWorkspace?.activeBoardId)
    ? rawWorkspace.activeBoardId
    : boardIds[0];

  return {
    rootId: ROOT_FOLDER_ID,
    itemsById: sanitizedItemsById,
    activeBoardId: boardIds.includes(activeBoardId) ? activeBoardId : boardIds[0],
  };
};

/**
 * One-time migration: if legacy single-scene storage exists, copy it into
 * the default board storage key.
 */
const migrateLegacyScene = (workspace) => {
  const targetBoardKey = createBoardStorageKey(workspace.activeBoardId);
  try {
    if (localStorage.getItem(targetBoardKey)) {
      return;
    }
  } catch {
    return;
  }

  const legacyScene = loadSceneFromStorage(DRAWING_STORAGE_KEY);
  if (!legacyScene) {
    return;
  }

  saveSceneToStorage(legacyScene, targetBoardKey);
};

/**
 * Creates a brand-new workspace with one root folder and one board.
 */
export const createDefaultWorkspace = () => {
  const defaultBoardId = createNodeId("board");

  return {
    rootId: ROOT_FOLDER_ID,
    activeBoardId: defaultBoardId,
    itemsById: {
      [ROOT_FOLDER_ID]: {
        ...createFolderItem(ROOT_FOLDER_ID, "Boards"),
        childrenIds: [defaultBoardId],
      },
      [defaultBoardId]: createBoardItem(defaultBoardId, "Untitled"),
    },
  };
};

/**
 * Reads and sanitizes workspace metadata from localStorage.
 */
export const loadWorkspaceFromStorage = (
  storageKey = WORKSPACE_STORAGE_KEY,
) => {
  try {
    const rawWorkspace = localStorage.getItem(storageKey);
    if (!rawWorkspace) {
      const nextWorkspace = createDefaultWorkspace();
      migrateLegacyScene(nextWorkspace);
      return nextWorkspace;
    }

    return sanitizeWorkspace(JSON.parse(rawWorkspace));
  } catch {
    const nextWorkspace = createDefaultWorkspace();
    migrateLegacyScene(nextWorkspace);
    return nextWorkspace;
  }
};

/**
 * Persists workspace metadata; failures are intentionally non-fatal.
 */
export const saveWorkspaceToStorage = (
  workspace,
  storageKey = WORKSPACE_STORAGE_KEY,
) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(workspace));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc).
  }
};

// Re-export model helpers to keep import paths stable during refactors.
export {
  createBoardItem,
  createFolderItem,
  createNodeId,
  isBoardItem,
  isFolderItem,
} from "./workspace/workspaceModel";
