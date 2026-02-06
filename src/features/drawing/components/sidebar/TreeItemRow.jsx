import {
  CaretDownFilled,
  CaretRightFilled,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  FolderFilled,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import styles from "./BoardsSidebar.module.css";

/**
 * Lightweight className builder so state-to-style mapping stays readable.
 */
const getRowClassName = ({
  isActiveBoard,
  isRenaming,
  isDragged,
  isDraggingOver,
  isDropTarget,
  isDropTargetAbove,
  isDropTargetBelow,
}) =>
  [
    styles.treeItem,
    isActiveBoard ? styles.treeItemActive : "",
    isRenaming ? styles.treeItemRenaming : "",
    isDragged ? styles.treeItemDragged : "",
    isDraggingOver ? styles.treeItemDragOver : "",
    isDropTarget ? styles.treeItemDropTarget : "",
    isDropTargetAbove ? styles.treeItemDropAbove : "",
    isDropTargetBelow ? styles.treeItemDropBelow : "",
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Renders one tree row and keeps all row-level interactions encapsulated:
 * - expand/collapse indicator
 * - rename input/action
 * - delete action
 * - drag/drop visual states
 */
export const TreeItemRow = ({
  item,
  rootId,
  activeBoardId,
  draggedItemIds,
  onDeleteItem,
}) => {
  const itemId = item.getId();
  const itemMeta = item.getItemMeta();
  const isRoot = itemId === rootId;
  const isBoard = item.getItemData().type === "board";
  const isActiveBoard = isBoard && itemId === activeBoardId;
  const isRenaming = item.isRenaming();

  const isDragged = draggedItemIds.has(itemId);
  const isDropTarget = item.isDragTarget();
  const isDropTargetAbove = item.isDragTargetAbove();
  const isDropTargetBelow = item.isDragTargetBelow();
  const isDraggingOver = item.isDraggingOver();

  return (
    <div
      {...item.getProps()}
      key={item.getKey()}
      className={getRowClassName({
        isActiveBoard,
        isRenaming,
        isDragged,
        isDraggingOver,
        isDropTarget,
        isDropTargetAbove,
        isDropTargetBelow,
      })}
      style={{ paddingLeft: `${itemMeta.level * 14 + 8}px` }}
    >
      <div className={styles.treeItemMain}>
        <span className={styles.treeItemChevron} aria-hidden="true">
          {item.isFolder() ? (
            item.isExpanded() ? (
              <CaretDownFilled />
            ) : (
              <CaretRightFilled />
            )
          ) : null}
        </span>

        {item.isFolder() ? (
          <FolderFilled className={styles.treeItemTypeIcon} />
        ) : (
          <FileOutlined className={styles.treeItemTypeIcon} />
        )}

        {isRenaming ? (
          <input
            {...item.getRenameInputProps()}
            className={styles.renameInput}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <span className={styles.treeItemName}>{item.getItemName()}</span>
        )}
      </div>

      {!isRoot && (
        <div
          className={styles.treeItemActions}
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip title="Rename" placement="top">
            <Button
              type="text"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                item.startRenaming();
              }}
              aria-label={`Rename ${item.getItemName()}`}
              className={styles.treeItemActionButton}
              icon={<EditOutlined />}
            />
          </Tooltip>

          <Tooltip title="Delete" placement="top">
            <Button
              type="text"
              size="small"
              className={`${styles.treeItemActionButton} ${styles.deleteActionButton}`}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteItem(itemId);
              }}
              aria-label={`Delete ${item.getItemName()}`}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};
