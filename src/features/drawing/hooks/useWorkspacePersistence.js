import { useCallback, useEffect, useMemo, useState } from "react";
import { createBoardStorageKey } from "../constants/persistence";
import { removeSceneFromStorage } from "../services/drawingStorage";
import {
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

/**
 * Central orchestrator for board/folder metadata.
 *
 * Responsibilities:
 * - load and save workspace metadata
 * - expose high-level mutations for UI components
 * - keep the active board valid after deletes/moves
 */
export const useWorkspacePersistence = () => {
  const [workspace, setWorkspace] = useState(() => loadWorkspaceFromStorage());

  /** Persist every workspace update. */
  useEffect(() => {
    saveWorkspaceToStorage(workspace);
  }, [workspace]);

  /** Switches the active board if the target id points to a valid board node. */
  const setActiveBoardId = useCallback((boardId) => {
    setWorkspace((previousWorkspace) => {
      if (!isBoardItem(previousWorkspace.itemsById[boardId])) {
        return previousWorkspace;
      }

      if (previousWorkspace.activeBoardId === boardId) {
        return previousWorkspace;
      }

      return {
        ...previousWorkspace,
        activeBoardId: boardId,
      };
    });
  }, []);

  /** Renames a board or folder (whitespace-only names are ignored). */
  const renameItem = useCallback((itemId, nextNameRaw) => {
    setWorkspace((previousWorkspace) =>
      renameWorkspaceItem(previousWorkspace, itemId, nextNameRaw),
    );
  }, []);

  /** Creates a board in the selected folder and makes it the active board. */
  const createBoard = useCallback((parentFolderId) => {
    const boardId = createNodeId("board");

    setWorkspace((previousWorkspace) =>
      addBoardToWorkspace(previousWorkspace, parentFolderId, boardId).nextWorkspace,
    );

    return boardId;
  }, []);

  /** Creates a folder in the selected folder. */
  const createFolder = useCallback((parentFolderId) => {
    const folderId = createNodeId("folder");

    setWorkspace((previousWorkspace) =>
      addFolderToWorkspace(previousWorkspace, parentFolderId, folderId).nextWorkspace,
    );

    return folderId;
  }, []);

  /**
   * Deletes a node recursively.
   * We also delete local board scenes for removed boards.
   */
  const deleteItem = useCallback((itemId) => {
    setWorkspace((previousWorkspace) => {
      const { nextWorkspace, deletedBoardIds } = deleteWorkspaceItem(
        previousWorkspace,
        itemId,
      );

      // Safe/idempotent side effect: removeItem can run multiple times.
      for (const boardId of deletedBoardIds) {
        removeSceneFromStorage(createBoardStorageKey(boardId));
      }

      return nextWorkspace;
    });
  }, []);

  /** Applies drag-and-drop child order updates for one folder. */
  const updateFolderChildren = useCallback((folderId, nextChildrenIds) => {
    setWorkspace((previousWorkspace) =>
      replaceFolderChildren(previousWorkspace, folderId, nextChildrenIds),
    );
  }, []);

  /** Convenience pointer to the active board node used by the drawing canvas. */
  const activeBoard = useMemo(
    () => workspace.itemsById[workspace.activeBoardId],
    [workspace],
  );

  return {
    workspace,
    activeBoard,
    activeBoardId: workspace.activeBoardId,
    rootId: workspace.rootId,
    itemsById: workspace.itemsById,
    setActiveBoardId,
    renameItem,
    createBoard,
    createFolder,
    deleteItem,
    updateFolderChildren,
  };
};
