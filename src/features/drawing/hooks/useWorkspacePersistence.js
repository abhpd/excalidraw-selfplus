import { useCallback, useEffect, useMemo, useState } from "react";
import { createBoardStorageKey } from "../constants/persistence";
import { removeSceneFromStorage } from "../services/drawingStorage";
import {
  createDefaultWorkspace,
  createNodeId,
  isBoardItem,
  loadWorkspaceFromStorage,
  saveWorkspaceToStorage,
} from "../services/workspaceStorage";
import {
  addBoardToWorkspace,
  addFolderToWorkspace,
  deleteWorkspaceItem,
  renameWorkspaceItem,
  replaceFolderChildren,
} from "../services/workspace/workspaceMutations";
import { normalizeExpandedFolderIds } from "../services/workspace/workspaceModel";

const areStringArraysEqual = (left, right) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

/**
 * Keeps `expandedFolderIds` valid whenever workspace nodes change.
 */
const normalizeWorkspaceExpansion = (workspace) => {
  const currentExpandedFolderIds = Array.isArray(workspace.expandedFolderIds)
    ? workspace.expandedFolderIds
    : [];

  const normalizedExpandedFolderIds = normalizeExpandedFolderIds(
    workspace.itemsById,
    workspace.rootId,
    currentExpandedFolderIds,
  );

  if (areStringArraysEqual(normalizedExpandedFolderIds, currentExpandedFolderIds)) {
    return workspace;
  }

  return {
    ...workspace,
    expandedFolderIds: normalizedExpandedFolderIds,
  };
};

/**
 * Central orchestrator for board/folder metadata.
 *
 * Responsibilities:
 * - load and save workspace metadata
 * - expose high-level mutations for UI components
 * - keep the active board valid after deletes/moves
 */
export const useWorkspacePersistence = () => {
  const [workspace, setWorkspace] = useState(() => createDefaultWorkspace());
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  /** Hydrates workspace state from IndexedDB once on mount. */
  useEffect(() => {
    let isCancelled = false;

    const hydrateWorkspace = async () => {
      const persistedWorkspace = await loadWorkspaceFromStorage();
      if (isCancelled) {
        return;
      }

      setWorkspace(persistedWorkspace);
      setIsWorkspaceReady(true);
    };

    // Fire-and-forget initial hydration; cancellation guard prevents updates after unmount.
    void hydrateWorkspace();

    return () => {
      isCancelled = true;
    };
  }, []);

  /** Persist every workspace update. */
  useEffect(() => {
    if (!isWorkspaceReady) {
      return;
    }

    // Fire-and-forget persistence write on state changes; storage layer handles failures internally.
    void saveWorkspaceToStorage(workspace);
  }, [isWorkspaceReady, workspace]);

  /** Switches the active board if the target id points to a valid board node. */
  const setActiveBoardId = useCallback((boardId) => {
    if (!isWorkspaceReady) {
      return;
    }

    setWorkspace((previousWorkspace) => {
      if (!isBoardItem(previousWorkspace.itemsById[boardId])) {
        return previousWorkspace;
      }

      if (previousWorkspace.activeBoardId === boardId) {
        return previousWorkspace;
      }

      return normalizeWorkspaceExpansion({
        ...previousWorkspace,
        activeBoardId: boardId,
      });
    });
  }, [isWorkspaceReady]);

  /** Renames a board or folder (whitespace-only names are ignored). */
  const renameItem = useCallback((itemId, nextNameRaw) => {
    if (!isWorkspaceReady) {
      return;
    }

    setWorkspace((previousWorkspace) =>
      normalizeWorkspaceExpansion(
        renameWorkspaceItem(previousWorkspace, itemId, nextNameRaw),
      ),
    );
  }, [isWorkspaceReady]);

  /** Creates a board in the selected folder and makes it the active board. */
  const createBoard = useCallback((parentFolderId) => {
    if (!isWorkspaceReady) {
      return undefined;
    }

    const boardId = createNodeId("board");

    setWorkspace((previousWorkspace) =>
      normalizeWorkspaceExpansion(
        addBoardToWorkspace(previousWorkspace, parentFolderId, boardId).nextWorkspace,
      ),
    );

    return boardId;
  }, [isWorkspaceReady]);

  /** Creates a folder in the selected folder. */
  const createFolder = useCallback((parentFolderId) => {
    if (!isWorkspaceReady) {
      return undefined;
    }

    const folderId = createNodeId("folder");

    setWorkspace((previousWorkspace) =>
      normalizeWorkspaceExpansion(
        addFolderToWorkspace(previousWorkspace, parentFolderId, folderId).nextWorkspace,
      ),
    );

    return folderId;
  }, [isWorkspaceReady]);

  /**
   * Deletes a node recursively.
   * We also delete local board scenes for removed boards.
   */
  const deleteItem = useCallback((itemId) => {
    if (!isWorkspaceReady) {
      return;
    }

    setWorkspace((previousWorkspace) => {
      const { nextWorkspace, deletedBoardIds } = deleteWorkspaceItem(
        previousWorkspace,
        itemId,
      );

      // Safe/idempotent side effect: removeItem can run multiple times.
      for (const boardId of deletedBoardIds) {
        // Fire-and-forget cleanup of deleted board scenes; UI state update does not depend on completion.
        void removeSceneFromStorage(createBoardStorageKey(boardId));
      }

      return normalizeWorkspaceExpansion(nextWorkspace);
    });
  }, [isWorkspaceReady]);

  /** Applies drag-and-drop child order updates for one folder. */
  const updateFolderChildren = useCallback((folderId, nextChildrenIds) => {
    if (!isWorkspaceReady) {
      return;
    }

    setWorkspace((previousWorkspace) =>
      normalizeWorkspaceExpansion(
        replaceFolderChildren(previousWorkspace, folderId, nextChildrenIds),
      ),
    );
  }, [isWorkspaceReady]);

  /**
   * Receives the tree library's expanded folder list and persists it.
   * We sanitize before writing so stale/duplicate ids are never stored.
   */
  const setExpandedFolderIds = useCallback((nextExpandedFolderIds) => {
    if (!isWorkspaceReady) {
      return;
    }

    setWorkspace((previousWorkspace) =>
      normalizeWorkspaceExpansion({
        ...previousWorkspace,
        expandedFolderIds: nextExpandedFolderIds,
      }),
    );
  }, [isWorkspaceReady]);

  /** Convenience pointer to the active board node used by the drawing canvas. */
  const activeBoard = useMemo(
    () => workspace.itemsById[workspace.activeBoardId],
    [workspace],
  );

  return {
    workspace,
    isWorkspaceReady,
    activeBoard,
    activeBoardId: workspace.activeBoardId,
    rootId: workspace.rootId,
    itemsById: workspace.itemsById,
    expandedFolderIds: workspace.expandedFolderIds,
    setActiveBoardId,
    renameItem,
    createBoard,
    createFolder,
    deleteItem,
    updateFolderChildren,
    setExpandedFolderIds,
  };
};
