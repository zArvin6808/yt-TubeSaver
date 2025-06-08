const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  downloadVideo: (params) => ipcRenderer.invoke('download-video', params),
  selectCookies: () => ipcRenderer.invoke('select-cookies'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  validateCookies: (cookiesPath) => ipcRenderer.invoke('validate-cookies', cookiesPath),
  analyzeUrl: (params) => ipcRenderer.invoke('analyze-url', params)
});
