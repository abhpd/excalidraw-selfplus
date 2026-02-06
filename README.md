# Excalidraw Selfplus

Excalidraw Selfplus is a multi-board drawing workspace built on top of Excalidraw, with a folder/board sidebar and persistent storage in IndexedDB.

## Features

- Multi-board workspace with folders and nested tree navigation
- Create board and create folder actions in the sidebar header
- Inline rename and delete actions on each item
- Drag-and-drop reordering and moving of boards/folders (with safe drop rules)
- Persisted folder expanded/collapsed state
- Per-board drawing persistence (each board has an isolated scene key)
- Debounced autosave while drawing
- No full-canvas remount when switching boards (reduces flashing)
- Collapsible sidebar with a floating expand/collapse control
- Minimal dark sidebar theme with tooltips and keyboard-aware tree behavior

## Libraries Used and Purpose

### Runtime libraries

- `@excalidraw/excalidraw`: core whiteboard canvas, scene serialization/restoration, and drawing UI
- `@headless-tree/core`: tree engine used for rename, keyboard behavior, and drag-and-drop mechanics
- `@headless-tree/react`: React bindings for the headless-tree instance
- `dexie`: IndexedDB wrapper used as the project persistence layer
- `antd`: UI components (buttons, tooltips) used in the sidebar and controls
- `@ant-design/icons`: icons for tree items and actions (add, rename, delete, expand/collapse)
- `lodash`: debounced scene writes (`_.debounce`) to keep drawing smooth during autosave
- `react` and `react-dom`: application rendering and component model

### Tooling

- `vite` + `@vitejs/plugin-react`: dev server and production build tooling
- `eslint` + React plugins: linting and hook safety rules

## Persistence Model

- Storage backend: IndexedDB (via Dexie)
- Workspace metadata key: `excalidraw:selfplus:workspace`
- Per-board scene key format: `excalidraw:selfplus:board:<boardId>`
- Stored workspace data:
  - tree nodes (`itemsById`)
  - root folder id
  - active board id
  - expanded folder ids
- Stored scene data (per board):
  - elements
  - app state (including viewport values like `scrollX`, `scrollY`, `zoom`)
  - files

## Getting Started

### Prerequisites

- Node.js `20.19+` or `22.12+` (recommended for current Vite version)
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## Project Structure

```text
src/
  app/
    App.jsx
  features/
    drawing/
      components/
        DrawingCanvas.jsx
        DrawingCanvas.module.css
        sidebar/
          BoardsSidebar.jsx
          BoardsSidebar.module.css
          TreeItemRow.jsx
          AddTreeActions.jsx
      constants/
        persistence.js
      hooks/
        useWorkspacePersistence.js
        useDrawingPersistence.js
        excalidraw/
          useBoardSceneController.js
        tree/
          useBoardsTree.js
      services/
        persistenceDb.js
        drawingStorage.js
        workspaceStorage.js
        workspace/
          workspaceModel.js
          workspaceMutations.js
      index.js
  index.css
  main.jsx
```

## Architectural Notes

- Workspace metadata and drawing scene data are separated:
  - workspace state drives sidebar/tree behavior
  - board scene state drives Excalidraw content
- Tree behavior is encapsulated in `useBoardsTree` to keep UI components focused on rendering.
- Board scene switching is handled by `useBoardSceneController` to avoid remount-related flashes.
- Storage writes are intentionally best-effort and non-blocking to keep drawing interactions responsive.
