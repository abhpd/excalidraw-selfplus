import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useDrawingPersistence } from "../hooks/useDrawingPersistence";
import styles from "./DrawingCanvas.module.css";

export const DrawingCanvas = () => {
  const { initialData, onChange } = useDrawingPersistence();

  return (
    <div className={styles.shell}>
      <Excalidraw theme="dark" initialData={initialData} onChange={onChange} />
    </div>
  );
};
