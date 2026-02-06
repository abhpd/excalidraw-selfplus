import { FileAddOutlined, FolderAddOutlined } from "@ant-design/icons";
import { Button } from "antd";
import styles from "./BoardsSidebar.module.css";

/**
 * Small inline controls rendered directly under the visible tree items.
 */
export const AddTreeActions = ({ onCreateBoard, onCreateFolder }) => {
  return (
    <div className={styles.inlineAddActions}>
      <Button
        type="text"
        size="small"
        className={styles.inlineAddButton}
        onClick={onCreateBoard}
        aria-label="Add board"
        title="Add board"
        icon={<FileAddOutlined />}
      />

      <Button
        type="text"
        size="small"
        className={styles.inlineAddButton}
        onClick={onCreateFolder}
        aria-label="Add folder"
        title="Add folder"
        icon={<FolderAddOutlined />}
      />
    </div>
  );
};
