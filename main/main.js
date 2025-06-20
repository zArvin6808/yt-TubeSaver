const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    icon: path.join(__dirname, '../ico/logo.ico'), // 添加窗口图标
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a1a',         // 标题栏背景色
      symbolColor: '#fff',   // 按钮颜色
      height: 30
    },
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 隐藏菜单栏
  win.setMenuBarVisibility(false);

  win.loadFile(path.join(__dirname, '../index.html')); // 推荐用绝对路径
}

app.whenReady().then(createWindow);

ipcMain.handle('download-video', async (event, { url, savePath, format, cookiesPath, downloadThumbnail }) => {
  return new Promise((resolve, reject) => {
    const isPackaged = app.isPackaged;
    const exeDir = isPackaged
      ? path.dirname(app.getPath('exe')) // 打包后
      : path.resolve(__dirname, '../');  // 开发环境，指向项目根目录
    const ytdlpPath = path.join(exeDir, 'yt-dlp.exe'); // 修改路径
    // === 兜底：如果savePath为空或全是空格，使用当前工作目录 ===
    let outputPath = savePath && savePath.trim() ? savePath.trim() : process.cwd();

    if (outputPath.endsWith('\\') || outputPath.endsWith('/')) {
      outputPath = outputPath.slice(0, -1);
    }
    const outTemplate = path.join(outputPath, '%(title)s.%(ext)s');
    const args = ['-o', outTemplate];
    if (cookiesPath) args.push('--cookies', cookiesPath);
    if (format && format !== '请选择') args.push('-f', format);
    if (downloadThumbnail) args.push('--write-thumbnail'); // 新增，勾选时下载缩略图
    args.push(url);

    const ytdlp = spawn(ytdlpPath, args, { windowsHide: true }); // 使用动态路径
    ytdlp.stdout.on('data', data => {
      const lines = data.toString().split(/\r?\n/);
      lines.forEach(line => {
        const match = line.match(/\[download\]\s+(\d{1,3}\.\d+)%/);
        if (match) {
          const percent = parseFloat(match[1]);
          event.sender.send('download-progress', { percent, text: line.trim() });
        }
      });
    });
    ytdlp.on('close', code => {
      event.sender.send('download-progress', { percent: 100, text: '下载完成' });
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
    const isPackaged = app.isPackaged;
    const exeDir = isPackaged
      ? path.dirname(app.getPath('exe')) // 打包后
      : path.resolve(__dirname, '../');  // 开发环境，指向项目根目录
    const ytdlpPath = path.join(exeDir, 'yt-dlp.exe');// 修改路径
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const args = ['--cookies', cookiesPath, '--get-title', testUrl];
    const ytdlp = spawn(ytdlpPath, args, { windowsHide: true }); // 使用动态路径
    let output = '';
    let error = '';
    ytdlp.stdout.on('data', data => { output += data.toString(); });
    ytdlp.stderr.on('data', data => { error += data.toString(); });
    ytdlp.on('close', code => {
      if (code === 0 && output.trim()) {
        resolve({ valid: true, message: 'Cookies 可用', title: output.trim() });
      } else {
        resolve({ valid: false, message: 'Cookies 无效或不可用', error: error.trim() });
      }
    });
    ytdlp.on('error', (err) => {
      resolve({ valid: false, message: 'yt-dlp 执行失败', error: err.message });
    });
  });
});

// 分析视频地址，返回所有可用格式
ipcMain.handle('analyze-url', async (event, { url, cookiesPath }) => {
  return new Promise((resolve, reject) => {
    const isPackaged = app.isPackaged;
    const exeDir = isPackaged
      ? path.dirname(app.getPath('exe')) // 打包后
      : path.resolve(__dirname, '../');  // 开发环境，指向项目根目录
    const ytdlpPath = path.join(exeDir, 'yt-dlp.exe');// 修改路径
    if (!url) return reject(new Error('无效的视频地址'));
    const args = ['-J', url];
    if (cookiesPath) args.push('--cookies', cookiesPath);
    const ytdlp = spawn(ytdlpPath, args, { windowsHide: true }); // 使用动态路径
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
