const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('download-video', async (event, { url, savePath, format, cookiesPath }) => {
  return new Promise((resolve, reject) => {
    const args = ['-o', path.join(savePath, '%(title)s.%(ext)s')];
    if (format && format !== '请选择') args.push('-f', format);
    if (cookiesPath) args.push('--cookies', cookiesPath);
    args.push(url);
    const ytdlp = spawn(path.join(__dirname, 'yt-dlp.exe'), args, { windowsHide: true });
    ytdlp.on('close', code => {
      if (code === 0) resolve('下载完成');
      else reject(new Error('yt-dlp 运行失败'));
    });
    ytdlp.on('error', err => reject(err));
  });
});

ipcMain.handle('select-cookies', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Cookies', extensions: ['txt', 'cookies', 'json'] }] });
  return result.filePaths[0] || '';
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0] || '';
});
