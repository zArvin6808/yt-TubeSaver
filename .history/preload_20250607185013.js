const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  downloadVideo: (params) => ipcRenderer.invoke('download-video', params),
  selectCookies: () => ipcRenderer.invoke('select-cookies'),
  selectFolder: () => ipcRenderer.invoke('select-folder')
});
