# Visual Code Editor

Scratch-style visual code editor built with React. Users can drag blocks into the workspace, run scripts, replay selected blocks, and save/load projects as `.json` files from disk.

## Features

- Drag-and-drop block workspace
- Motion, looks, sound, event, control, operator, variable, and list blocks
- Custom sprite color, size, position, and rotation
- Built-in and uploaded backdrops
- File-based project save/load

## Setup

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Project Files

Use `Save File` and `Load File` in the workspace toolbar. Project files are saved as `.json` files on disk. The app does not require a backend, MongoDB, browser local storage, or IndexedDB for project save/load.

## Asset Library

For many built-in sprites/backdrops, keep static files in `public/assets/` and store only lightweight metadata in `src`. This avoids adding large assets to the JavaScript bundle.

Example:

```txt
public/assets/
  sprites/
  backdrops/
  sounds/
```

## Available Scripts

```bash
npm start
npm run build
npm test
```

## Deployment

Netlify uses `netlify.toml`:

```txt
Build command: npm run build
Publish directory: build
```
