import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useWorkspacePersistence } from "../hooks/useWorkspacePersistence";
import { useBoardSceneController } from "../hooks/excalidraw/useBoardSceneController";
import { useBoardsTree } from "../hooks/tree/useBoardsTree";
import { BoardsSidebar } from "./sidebar/BoardsSidebar";
import styles from "./DrawingCanvas.module.css";

/**
 * Root drawing surface for the feature.
 *
 * High-level flow:
 * 1) Sidebar state is driven by workspace metadata (folders/boards)
 * 2) The selected board id picks a board-specific storage key
 * 3) Excalidraw reads/writes only that board scene
 */
export const DrawingCanvas = () => {
  const {
    activeBoard,
    activeBoardId,
    rootId,
    itemsById,
    setActiveBoardId,
    renameItem,
    createBoard,
    createFolder,
    deleteItem,
    updateFolderChildren,
  } = useWorkspacePersistence();

  /** Tree instance encapsulates sidebar keyboard + drag/drop + rename behavior. */
  const tree = useBoardsTree({
    rootId,
    itemsById,
    setActiveBoardId,
    renameItem,
    updateFolderChildren,
  });

  /**
   * Dedicated Excalidraw lifecycle hook:
   * - board-scoped persistence
   * - no-remount scene switching
   * - theme stabilization
   */
  const { theme, initialData, onChange, registerExcalidrawApi } =
    useBoardSceneController({
      activeBoardId,
      hasActiveBoard: Boolean(activeBoard),
    });

  return (
    <div className={styles.layout}>
      <BoardsSidebar
        tree={tree}
        rootId={rootId}
        activeBoardId={activeBoardId}
        onDeleteItem={deleteItem}
        onCreateBoard={createBoard}
        onCreateFolder={createFolder}
      />

      <div className={styles.canvasPane}>
        {activeBoard ? (
          <Excalidraw
            theme={theme}
            initialData={initialData}
            onChange={onChange}
            excalidrawAPI={registerExcalidrawApi}
          />
        ) : (
          <div className={styles.emptyCanvas}>No board selected</div>
        )}
      </div>
    </div>
  );
};
