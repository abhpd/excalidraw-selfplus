import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  renamingFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { useEffect, useMemo } from "react";

/**
 * Stable fallback object returned when the tree asks for a missing id.
 * This should not happen during normal operation, but keeps rendering resilient.
 */
const getFallbackItem = (itemId) => ({
  id: itemId,
  type: "board",
  name: "Missing item",
});

/**
 * Encapsulates all Headless Tree configuration used by the sidebar.
 *
 * Keeping this logic in a dedicated hook makes `DrawingCanvas` easier to read
 * and prevents feature wiring (rename, drag/drop, keyboard behavior) from
 * leaking into presentation components.
 */
export const useBoardsTree = ({
  rootId,
  itemsById,
  setActiveBoardId,
  renameItem,
  updateFolderChildren,
}) => {
  /**
   * Reusable drop handler that updates one folder's ordered children list.
   */
  const onDrop = useMemo(
    () =>
      createOnDropHandler((parentItem, nextChildrenIds) => {
        updateFolderChildren(parentItem.getId(), nextChildrenIds);
      }),
    [updateFolderChildren],
  );

  const tree = useTree({
    rootItemId: rootId,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().type === "folder",

    /** Selecting a board row opens that board in Excalidraw. */
    onPrimaryAction: (item) => {
      if (item.getItemData().type === "board") {
        setActiveBoardId(item.getId());
      }
    },

    /** Root folder label should remain stable and non-editable. */
    canRename: (item) => item.getId() !== rootId,
    onRename: (item, value) => {
      renameItem(item.getId(), value);
    },

    /** Root cannot be dragged. */
    canDrag: (items) => items.every((item) => item.getId() !== rootId),

    /**
     * Drop rules:
     * - target must be a folder
     * - cannot drop on self
     * - cannot drop into own descendants (prevents cycles)
     */
    canDrop: (items, target) => {
      if (!target.item.isFolder()) {
        return false;
      }

      const targetId = target.item.getId();
      return items.every((item) => {
        const itemId = item.getId();
        return (
          itemId !== rootId &&
          targetId !== itemId &&
          !target.item.isDescendentOf(itemId)
        );
      });
    },
    onDrop,

    initialState: { expandedItems: [rootId] },
    dataLoader: {
      getItem: (itemId) => itemsById[itemId] ?? getFallbackItem(itemId),
      getChildren: (itemId) => itemsById[itemId]?.childrenIds ?? [],
    },

    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      renamingFeature,
      dragAndDropFeature,
    ],
  });

  /**
   * Rebuild visible rows whenever children ordering / node map changes.
   */
  useEffect(() => {
    tree.rebuildTree();
  }, [tree, itemsById]);

  return tree;
};
