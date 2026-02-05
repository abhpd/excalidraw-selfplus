import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useExcalidrawPersistence } from "./hooks/useExcalidrawPersistence";

const App = () => {
  const { initialData, onChange } = useExcalidrawPersistence();

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw
        theme={"dark"}
        initialData={initialData}
        onChange={onChange}
      />
    </div>
  );
};

export default App;
