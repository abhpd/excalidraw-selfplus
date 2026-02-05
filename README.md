# Excalidraw Selfplus

A minimal Excalidraw app with local persistence.

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## Project Structure

```text
src/
  app/
    App.jsx                  # app composition root
  features/
    drawing/
      components/
        DrawingCanvas.jsx    # Excalidraw UI wiring
      constants/
        persistence.js       # feature configuration
      hooks/
        useDrawingPersistence.js  # persistence orchestration
      services/
        drawingStorage.js    # localStorage read/write adapter
      index.js               # feature public API
  index.css
  main.jsx
```

## Design Rules

- Keep feature logic under `src/features/<feature-name>`.
- Import features through their `index.js` public API when possible.
- Put side-effect boundaries (localStorage, network, file IO) in `services/`.
- Keep React composition in `app/` and avoid business logic there.

## Next Refactor Steps

- Add tests for `drawingStorage` and `useDrawingPersistence`.
- Move feature constants to environment-backed configuration when needed.
- Add more features as sibling folders under `src/features`.
