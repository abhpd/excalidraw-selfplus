import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useState } from "react";
import { useWorkspacePersistence } from "../hooks/useWorkspacePersistence";
import { useBoardSceneController } from "../hooks/excalidraw/useBoardSceneController";
import { useBoardsTree } from "../hooks/tree/useBoardsTree";
import { BoardsSidebar } from "./sidebar/BoardsSidebar";
import styles from "./DrawingCanvas.module.css";

/**
 * Mounted only after workspace hydration.
 * This guarantees tree/excalidraw hooks bootstrap from persisted state.
 */
const DrawingCanvasContent = ({
  activeBoard,
  activeBoardId,
  rootId,
  itemsById,
  expandedFolderIds,
  setExpandedFolderIds,
  setActiveBoardId,
  renameItem,
  createBoard,
  createFolder,
  deleteItem,
  updateFolderChildren,
}) => {
  /** Tree instance encapsulates sidebar keyboard + drag/drop + rename behavior. */
  const tree = useBoardsTree({
    rootId,
    itemsById,
    expandedFolderIds,
    setExpandedFolderIds,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((previousState) => !previousState);
  };

  return (
    <div className={styles.layout}>
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

      <div
        className={[
          styles.sidebarShell,
          isSidebarCollapsed ? styles.sidebarShellCollapsed : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <BoardsSidebar
          tree={tree}
          rootId={rootId}
          activeBoardId={activeBoardId}
          onDeleteItem={deleteItem}
          onCreateBoard={createBoard}
          onCreateFolder={createFolder}
        />
      </div>

      <Tooltip
        title={isSidebarCollapsed ? "Expand files" : "Collapse files"}
        placement="right"
        mouseEnterDelay={0.5}
        mouseLeaveDelay={0}
      >
        <Button
          type="default"
          size="large"
          className={[
            styles.sidebarToggleButton,
            !isSidebarCollapsed ? styles.sidebarToggleButtonExpanded : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={toggleSidebar}
          icon={
            isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
          }
          aria-label={isSidebarCollapsed ? "Expand files" : "Collapse files"}
        />
      </Tooltip>
    </div>
  );
};

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
    isWorkspaceReady,
    activeBoard,
    activeBoardId,
    rootId,
    itemsById,
    expandedFolderIds,
    setExpandedFolderIds,
    setActiveBoardId,
    renameItem,
    createBoard,
    createFolder,
    deleteItem,
    updateFolderChildren,
  } = useWorkspacePersistence();

  if (!isWorkspaceReady) {
    return (
      <div className={styles.layout}>
        <div className={styles.canvasPane}>
          <div className={styles.emptyCanvas}>Loading boards...</div>
        </div>
      </div>
    );
  }

  return (
    <DrawingCanvasContent
      activeBoard={activeBoard}
      activeBoardId={activeBoardId}
      rootId={rootId}
      itemsById={itemsById}
      expandedFolderIds={expandedFolderIds}
      setExpandedFolderIds={setExpandedFolderIds}
      setActiveBoardId={setActiveBoardId}
      renameItem={renameItem}
      createBoard={createBoard}
      createFolder={createFolder}
      deleteItem={deleteItem}
      updateFolderChildren={updateFolderChildren}
    />
  );
};
