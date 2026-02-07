const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let technicalWindow;
let overlayWindow;
let appState = {
  hostName: 'TIGER',
  guestName: 'SAS',
  hostScore: 1,
  guestScore: 0,
  civPicks: ['French', 'Ottomans', 'Japanese'],
  mapPool: ['Dry Arabia', 'Mountain Pass', 'Golden Pit'],
};

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
  technicalWindow.webContents.on('did-finish-load', () => {
    technicalWindow.webContents.send('state:changed', appState);
  });
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
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.setFocusable(false);
  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow.webContents.send('state:changed', appState);
  });
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
  overlayWindow.setIgnoreMouseEvents(Boolean(shouldIgnore));
});

ipcMain.on('state:update', (_, partialState) => {
  appState = { ...appState, ...partialState };
  if (technicalWindow) {
    technicalWindow.webContents.send('state:changed', appState);
  }
  if (overlayWindow) {
    overlayWindow.webContents.send('state:changed', appState);
  }
});
