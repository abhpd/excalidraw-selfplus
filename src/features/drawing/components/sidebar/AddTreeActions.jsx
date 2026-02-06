import { FileAddOutlined, FolderAddOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import styles from "./BoardsSidebar.module.css";

/**
 * Reusable create controls used in the sidebar header.
 */
export const AddTreeActions = ({
  onCreateBoard,
  onCreateFolder,
  className = "",
  buttonClassName = "",
}) => {
  const containerClassName = [styles.inlineAddActions, className]
    .filter(Boolean)
    .join(" ");
  const actionButtonClassName = [styles.inlineAddButton, buttonClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <Tooltip title="New board" placement="top">
        <Button
          type="text"
          size="small"
          className={actionButtonClassName}
          onClick={onCreateBoard}
          aria-label="Add board"
          icon={<FileAddOutlined />}
        />
      </Tooltip>

      <Tooltip title="New folder" placement="top">
        <Button
          type="text"
          size="small"
          className={actionButtonClassName}
          onClick={onCreateFolder}
          aria-label="Add folder"
          icon={<FolderAddOutlined />}
        />
      </Tooltip>
    </div>
  );
};
