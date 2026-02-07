const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayControls', {
  setIgnoreMouseEvents: (shouldIgnore) => ipcRenderer.send('overlay:set-ignoremouse', shouldIgnore),
});

contextBridge.exposeInMainWorld('draftState', {
  update: (partialState) => ipcRenderer.send('state:update', partialState),
  fetchDraft: (draftId) => ipcRenderer.invoke('draft:fetch', draftId),
  onChange: (callback) => {
    ipcRenderer.removeAllListeners('state:changed');
    ipcRenderer.on('state:changed', (_, nextState) => callback(nextState));
  },
});
