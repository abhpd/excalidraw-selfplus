import { ROOT_FOLDER_ID } from "../../constants/persistence";

/**
 * Returns true when `value` is a non-empty user-facing string.
 * We normalize all persisted names through this guard so rendering stays predictable.
 */
export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Creates a random id segment.
 * `crypto.randomUUID()` is preferred, but we keep a deterministic fallback
 * for environments where it is not available.
 */
const createRandomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Creates a namespaced id for a workspace node.
 * Example outputs: `board-...`, `folder-...`.
 */
export const createNodeId = (prefix) => `${prefix}-${createRandomId()}`;

/**
 * Canonical board item shape stored in workspace state.
 */
export const createBoardItem = (id, name) => ({
  id,
  type: "board",
  name,
});

/**
 * Canonical folder item shape stored in workspace state.
 */
export const createFolderItem = (id, name) => ({
  id,
  type: "folder",
  name,
  childrenIds: [],
});

/** Type guard for folder nodes. */
export const isFolderItem = (item) => item?.type === "folder";

/** Type guard for board nodes. */
export const isBoardItem = (item) => item?.type === "board";

/**
 * Returns all board ids currently present in the workspace map.
 */
export const getBoardIds = (itemsById) =>
  Object.values(itemsById)
    .filter(isBoardItem)
    .map((item) => item.id);

/**
 * Builds a user-friendly non-colliding item name.
 * If `baseName` is taken, it yields `baseName 2`, `baseName 3`, and so on.
 */
export const getNextName = (itemsById, baseName) => {
  const existingNames = new Set(
    Object.values(itemsById).map((item) => item.name.trim().toLowerCase()),
  );

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.has(`${baseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${baseName} ${suffix}`;
};

/**
 * Resolves the folder that should receive newly created items.
 * When the requested parent is invalid, we gracefully fall back to root.
 */
export const resolveParentFolderId = (itemsById, rootId, maybeParentId) =>
  isFolderItem(itemsById[maybeParentId]) ? maybeParentId : rootId;

/**
 * Cleans a children list before persisting it:
 * - removes unknown ids
 * - removes root id recursion
 * - removes duplicates while preserving order
 */
export const normalizeChildrenIds = (childrenIds, itemsById, rootId) => {
  const seen = new Set();
  const nextChildrenIds = [];

  for (const childId of childrenIds) {
    if (!itemsById[childId] || childId === rootId || seen.has(childId)) {
      continue;
    }

    seen.add(childId);
    nextChildrenIds.push(childId);
  }

  return nextChildrenIds;
};

/**
 * Returns the subtree node ids below `rootItemId` using breadth-first traversal.
 * This is used for recursive folder deletion.
 */
export const collectDescendantIds = (itemsById, rootItemId) => {
  const descendants = [];
  const queue = [rootItemId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentItem = itemsById[currentId];
    if (!isFolderItem(currentItem)) {
      continue;
    }

    for (const childId of currentItem.childrenIds) {
      descendants.push(childId);
      queue.push(childId);
    }
  }

  return descendants;
};

/**
 * Ensures we never allow root to appear as a regular child node.
 */
export const isRootFolderId = (itemId) => itemId === ROOT_FOLDER_ID;
