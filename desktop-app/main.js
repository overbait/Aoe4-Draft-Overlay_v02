const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let technicalWindow;
let overlayWindow;

const createTechnicalWindow = () => {
  technicalWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0d0f12',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  technicalWindow.loadFile(path.join(__dirname, 'renderer', 'technical.html'));
  technicalWindow.on('closed', () => {
    technicalWindow = null;
    if (overlayWindow) {
      overlayWindow.close();
    }
  });
};

const createOverlayWindow = () => {
  overlayWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
};

app.whenReady().then(() => {
  createTechnicalWindow();
  createOverlayWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createTechnicalWindow();
      createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('overlay:set-ignoremouse', (_, shouldIgnore) => {
  if (!overlayWindow) return;
  overlayWindow.setIgnoreMouseEvents(Boolean(shouldIgnore), { forward: true });
});
