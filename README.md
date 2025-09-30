# CodeFortress Extension

This project is a combination of a Chrome extension and a VS Code extension that allows you to scrape a problem from Codeforces and view it directly in your VS Code editor.

## Features

* Scrapes the entire problem statement from any Codeforces problem page.
* Displays the problem in a VS Code webview.
* Real-time communication between the Chrome extension, a local server, and the VS Code extension using WebSockets.

## How it Works

1.  The **Chrome Extension** scrapes the problem statement from the active Codeforces problem page.
2.  The scraped HTML content is sent to a **local WebSocket server**.
3.  The **VS Code Extension** connects to the WebSocket server, receives the problem data, and displays it in a webview.

## Installation

### Chrome Extension

1.  Clone the repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode".
4.  Click on "Load unpacked" and select the `chrome-extension` directory.

### Local Server

1.  Navigate to the `codefortress-chrome-server` directory.
2.  Run `npm install` to install the dependencies.
3.  Run `npm start` to start the server.

### VS Code Extension

1.  Navigate to the `vscode-extension` directory.
2.  Run `npm install`.
3.  Open the `vscode-extension` directory in VS Code.
4.  Press `F5` to start a new VS Code instance with the extension loaded.

## Usage

1.  Make sure the local server is running.
2.  Open a Codeforces problem page in Chrome.
3.  Click on the CodeFortress extension icon in the Chrome toolbar.
4.  Open VS Code and run the "Show Codeforces Problem" command from the command palette.

## Dependencies

### Chrome Extension
* `dotenv`

### Local Server
* `ws`
* `nodemon` (devDependencies)

### VS Code Extension
* `@headlessui/react`
* `@tailwindcss/vite`
* `dotenv`
* `react`
* `react-dom`
* `tailwindcss`
* `ws`
* `@eslint/js` (devDependencies)
* `@types/react` (devDependencies)
* `@types/react-dom` (devDependencies)
* `@vitejs/plugin-react` (devDependencies)
* `eslint` (devDependencies)
* `eslint-plugin-react-hooks` (devDependencies)
* `eslint-plugin-react-refresh` (devDependencies)
* `globals` (devDependencies)
* `vite` (devDependencies)
* `webpack` (devDependencies)
* `webpack-cli` (devDependencies)
