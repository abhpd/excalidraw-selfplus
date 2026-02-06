import {
  createBoardItem,
  createFolderItem,
  createNodeId,
  getBoardIds,
  getNextName,
  isBoardItem,
  isFolderItem,
  isRootFolderId,
  normalizeChildrenIds,
  collectDescendantIds,
  resolveParentFolderId,
} from "./workspaceModel";

/**
 * Renames an item and keeps state immutable.
 * Returns the original workspace when the request is invalid/no-op.
 */
export const renameWorkspaceItem = (workspace, itemId, nextNameRaw) => {
  const nextName = nextNameRaw.trim();
  if (!nextName) {
    return workspace;
  }

  const currentItem = workspace.itemsById[itemId];
  if (!currentItem || currentItem.name === nextName) {
    return workspace;
  }

  return {
    ...workspace,
    itemsById: {
      ...workspace.itemsById,
      [itemId]: {
        ...currentItem,
        name: nextName,
      },
    },
  };
};

/**
 * Inserts a new board under the selected parent folder.
 * The board id can be injected to keep callers deterministic.
 */
export const addBoardToWorkspace = (
  workspace,
  parentFolderId,
  boardId = createNodeId("board"),
) => {
  const resolvedParentId = resolveParentFolderId(
    workspace.itemsById,
    workspace.rootId,
    parentFolderId,
  );
  const parentFolder = workspace.itemsById[resolvedParentId];
  const nextBoardName = getNextName(workspace.itemsById, "Untitled");

  return {
    nextWorkspace: {
      ...workspace,
      activeBoardId: boardId,
      itemsById: {
        ...workspace.itemsById,
        [boardId]: createBoardItem(boardId, nextBoardName),
        [resolvedParentId]: {
          ...parentFolder,
          childrenIds: [...parentFolder.childrenIds, boardId],
        },
      },
    },
    createdId: boardId,
  };
};

/**
 * Inserts a new folder under the selected parent folder.
 */
export const addFolderToWorkspace = (
  workspace,
  parentFolderId,
  folderId = createNodeId("folder"),
) => {
  const resolvedParentId = resolveParentFolderId(
    workspace.itemsById,
    workspace.rootId,
    parentFolderId,
  );
  const parentFolder = workspace.itemsById[resolvedParentId];
  const nextFolderName = getNextName(workspace.itemsById, "Folder");

  return {
    nextWorkspace: {
      ...workspace,
      itemsById: {
        ...workspace.itemsById,
        [folderId]: createFolderItem(folderId, nextFolderName),
        [resolvedParentId]: {
          ...parentFolder,
          childrenIds: [...parentFolder.childrenIds, folderId],
        },
      },
    },
    createdId: folderId,
  };
};

/**
 * Applies a drag/drop children order update to one folder.
 * The function sanitizes the final list to keep tree integrity.
 */
export const replaceFolderChildren = (workspace, folderId, nextChildrenIds) => {
  const targetFolder = workspace.itemsById[folderId];
  if (!isFolderItem(targetFolder)) {
    return workspace;
  }

  const sanitizedChildrenIds = normalizeChildrenIds(
    nextChildrenIds,
    workspace.itemsById,
    workspace.rootId,
  );

  return {
    ...workspace,
    itemsById: {
      ...workspace.itemsById,
      [folderId]: {
        ...targetFolder,
        childrenIds: sanitizedChildrenIds,
      },
    },
  };
};

/**
 * Deletes one item (and folder descendants when needed).
 * Returns both the next workspace and the board ids that need scene cleanup.
 */
export const deleteWorkspaceItem = (workspace, itemId) => {
  if (isRootFolderId(itemId)) {
    return {
      nextWorkspace: workspace,
      deletedBoardIds: [],
    };
  }

  const targetItem = workspace.itemsById[itemId];
  if (!targetItem) {
    return {
      nextWorkspace: workspace,
      deletedBoardIds: [],
    };
  }

  const descendantIds = collectDescendantIds(workspace.itemsById, itemId);
  const idsToDelete = new Set([itemId, ...descendantIds]);
  const deletedBoardIds = [...idsToDelete].filter((id) =>
    isBoardItem(workspace.itemsById[id]),
  );

  const nextItemsById = { ...workspace.itemsById };
  for (const id of idsToDelete) {
    delete nextItemsById[id];
  }

  // Remove all deleted ids from every surviving folder.
  for (const [id, item] of Object.entries(nextItemsById)) {
    if (!isFolderItem(item)) {
      continue;
    }

    nextItemsById[id] = {
      ...item,
      childrenIds: item.childrenIds.filter((childId) => !idsToDelete.has(childId)),
    };
  }

  let nextActiveBoardId = workspace.activeBoardId;
  if (!isBoardItem(nextItemsById[nextActiveBoardId])) {
    const remainingBoardIds = getBoardIds(nextItemsById);
    nextActiveBoardId = remainingBoardIds[0];
  }

  // Keep workspace usable by guaranteeing at least one board.
  if (!isBoardItem(nextItemsById[nextActiveBoardId])) {
    const fallbackBoardId = createNodeId("board");
    nextItemsById[fallbackBoardId] = createBoardItem(fallbackBoardId, "Untitled");

    const rootFolder = nextItemsById[workspace.rootId];
    nextItemsById[workspace.rootId] = {
      ...rootFolder,
      childrenIds: [...rootFolder.childrenIds, fallbackBoardId],
    };
    nextActiveBoardId = fallbackBoardId;
  }

  return {
    nextWorkspace: {
      ...workspace,
      activeBoardId: nextActiveBoardId,
      itemsById: nextItemsById,
    },
    deletedBoardIds,
  };
};
