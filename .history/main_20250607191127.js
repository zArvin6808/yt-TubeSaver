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

// 验证 cookies 文件可用性
ipcMain.handle('validate-cookies', async (event, cookiesPath) => {
  return new Promise((resolve) => {
    // 选择一个 YouTube 受限视频（如 age-restricted 或会员专属）作为测试
    const testUrl = 'https://www.youtube.com/watch?v=SkRSXFQerZs'; // 可替换为更合适的视频
    const args = ['--cookies', cookiesPath, '--get-title', testUrl];
    const ytdlp = spawn(path.join(__dirname, 'yt-dlp.exe'), args, { windowsHide: true });
    let output = '';
    let error = '';
    ytdlp.stdout.on('data', data => { output += data.toString(); });
    ytdlp.stderr.on('data', data => { error += data.toString(); });
    ytdlp.on('close', code => {
      if (code === 0 && output.trim()) {
        resolve({ valid: true, message: 'Cookies 可用', title: output.trim() });
      } else {
        resolve({ valid: false, message: 'Cookies 无效或无权限', error: error.trim() });
      }
    });
    ytdlp.on('error', () => {
      resolve({ valid: false, message: 'yt-dlp 执行失败' });
    });
  });
});

// 分析视频地址，返回所有可用格式
ipcMain.handle('analyze-url', async (event, { url, cookiesPath }) => {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('无效的视频地址'));
    const args = ['-J', url];
    if (cookiesPath) args.push('--cookies', cookiesPath);
    const ytdlp = spawn(path.join(__dirname, 'yt-dlp.exe'), args, { windowsHide: true });
    let output = '';
    let error = '';
    ytdlp.stdout.on('data', data => { output += data.toString(); });
    ytdlp.stderr.on('data', data => { error += data.toString(); });
    ytdlp.on('close', code => {
      if (code === 0 && output) {
        try {
          const info = JSON.parse(output);
          resolve(info);
        } catch (e) {
          reject(new Error('解析视频信息失败'));
        }
      } else {
        reject(new Error(error || '分析失败'));
      }
    });
    ytdlp.on('error', err => reject(err));
  });
});
