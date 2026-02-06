import styles from "./BoardsSidebar.module.css";
import { AddTreeActions } from "./AddTreeActions";
import { TreeItemRow } from "./TreeItemRow";

/**
 * Chooses where new nodes should be inserted.
 *
 * Rules:
 * - if focused node is a folder, insert into that folder
 * - if focused node is a board, insert into its parent folder
 * - if nothing is focused, insert into root
 */
const resolveCreateParentId = (tree, rootId) => {
  const focusedItem = tree.getFocusedItem?.();
  if (!focusedItem) {
    return rootId;
  }

  if (focusedItem.isFolder()) {
    return focusedItem.getId();
  }

  return focusedItem.getParent()?.getId() ?? rootId;
};

/**
 * Sidebar that renders the Headless Tree rows and header creation controls.
 */
export const BoardsSidebar = ({
  tree,
  rootId,
  activeBoardId,
  onDeleteItem,
  onCreateBoard,
  onCreateFolder,
}) => {
  const items = tree.getItems();

  // Used only for visual feedback while dragging.
  const draggedItemIds = new Set(
    tree
      .getState()
      .dnd?.draggedItems?.map((draggedItem) => draggedItem.getId()) ?? [],
  );

  const handleCreateBoard = () => {
    const parentId = resolveCreateParentId(tree, rootId);
    tree.getItemInstance(parentId)?.expand();
    onCreateBoard(parentId);
  };

  const handleCreateFolder = () => {
    const parentId = resolveCreateParentId(tree, rootId);
    tree.getItemInstance(parentId)?.expand();
    onCreateFolder(parentId);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarHeaderTitle}>draw.abhpd.in</span>
        <AddTreeActions
          onCreateBoard={handleCreateBoard}
          onCreateFolder={handleCreateFolder}
          className={styles.headerAddActions}
          buttonClassName={styles.headerAddButton}
        />
      </div>

      <div
        {...tree.getContainerProps("Board navigation")}
        className={styles.tree}
      >
        {items.map((item) => (
          <TreeItemRow
            key={item.getKey()}
            item={item}
            rootId={rootId}
            activeBoardId={activeBoardId}
            draggedItemIds={draggedItemIds}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </aside>
  );
};
