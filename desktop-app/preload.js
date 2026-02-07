const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayControls', {
  setIgnoreMouseEvents: (shouldIgnore) => ipcRenderer.send('overlay:set-ignoremouse', shouldIgnore),
});
