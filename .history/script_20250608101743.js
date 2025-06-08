// 判断是否为有效的YouTube链接
function isValidYouTubeUrl(url) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
}

// 校验 YouTube 视频链接是否合法
function isValidYouTubeUrl(url) {
  // 支持 www.youtube.com/watch?v=xxx、youtu.be/xxx、m.youtube.com/watch?v=xxx 等
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|shorts\/|live\/|playlist\?list=)?[A-Za-z0-9_\-]{11,}/.test(url);
}

// 页面切换逻辑
function switchPage(pageId) {
    // 移除所有页面的active类
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 移除所有导航项的active类
    document.querySelectorAll('.navbar a').forEach(nav => {
        nav.classList.remove('active');
    });
    
    // 激活选中的页面
    document.getElementById(pageId).classList.add('active');
    
    // 激活对应的导航项
    document.querySelector(`.navbar a[data-page="${pageId}"]`).classList.add('active');
}

// 全局 Toast 通知函数
function showToast(message, type = 'info') {
  // cookies 失效兜底拦截
  if (typeof message === 'string') {
    let msg = message.replace(/[\s\u200B-\u200D\uFEFF\u3000]+/g, ' ').toLowerCase();
    const pattern = /sign\s*in|confirm\s*you.*bot|not\s*a\s*bot|robot\s*check|use.*cookies|faq.*cookies|exporting.*cookies|cookies?\s*(无效|失效|invalid|expired|fail|错误|失败)|需要登录|需要验证|人[工机]验证|\u4eba[\u5de5\u673a][\u9a8c\u8bc1]/i;
    if (pattern.test(msg)) {
      message = 'cookies.txt（无效）';
      type = 'error';
      if (typeof setContentTextArea !== 'undefined') setContentTextArea('');
    }
  }
  // 简单实现：页面右上角弹出消息
  let toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '30px';
  toast.style.right = '30px';
  toast.style.zIndex = 9999;
  toast.style.background = type === 'error' ? '#f44336' : (type === 'success' ? '#4caf50' : '#333');
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  toast.style.fontSize = '15px';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// 内容区赋值统一拦截
function setContentTextArea(msg) {
  if (!window.contentTextarea) return;
  // 递归提取所有文本内容
  function extractAllText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      let result = '';
      for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          result += extractAllText(obj[k]) + '\n';
        }
      }
      return result;
    }
    return obj.toString ? obj.toString() : '';
  }
  let clean = extractAllText(msg).replace(/[\s\u200B-\u200D\uFEFF\u3000]+/g, ' ').toLowerCase();
  const pattern = /sign\s*in|confirm\s*you.*bot|not\s*a\s*bot|robot\s*check|use.*cookies|faq.*cookies|exporting.*cookies|cookies?\s*(无效|失效|invalid|expired|fail|错误|失败)|需要登录|需要验证|人[工机]验证|\u4eba[\u5de5\u673a][\u9a8c\u8bc1]/i;
  if (pattern.test(clean)) {
    window.contentTextarea.value = '';
    window.contentTextarea.style.display = 'none';
    // 彻底隐藏内容区，防止任何内容渲染
    window.contentTextarea.classList.add('hide-content-textarea');
    return;
  }
  window.contentTextarea.value = msg;
  window.contentTextarea.style.display = '';
  window.contentTextarea.classList.remove('hide-content-textarea');
}

// 注入CSS，彻底隐藏内容区
(function(){
  if (!document.getElementById('hide-content-textarea-style')) {
    const style = document.createElement('style');
    style.id = 'hide-content-textarea-style';
    style.innerHTML = `.hide-content-textarea { display: none !important; }`;
    document.head.appendChild(style);
  }
})();

// 全局兜底拦截未捕获异常和 Promise 拒绝
window.addEventListener('error', function(e) {
  if (e && e.message) setContentTextArea(e.message);
});
window.addEventListener('unhandledrejection', function(e) {
  if (e && e.reason) setContentTextArea(e.reason);
});

// 初始化页面
// 优化：缓存DOM元素，合并事件绑定，封装loading，缩略图img，toast限制

document.addEventListener('DOMContentLoaded', () => {
    // 缓存常用DOM
    const urlInput = document.getElementById('urlInput');
    const pasteButton = document.getElementById('pasteButton');
    const analyzeButton = document.getElementById('analyzeButton');
    const downloadButton = document.getElementById('downloadButton');
    const selectPathButton = document.getElementById('selectPathButton');
    const refreshPathButton = document.getElementById('refreshPathButton');
    const downloadVideoButton = document.getElementById('downloadVideoButton');
    const downloadAudioButton = document.getElementById('downloadAudioButton');
    const pathInput = document.getElementById('pathInput');
    const titleInput = document.getElementById('titleInput');
    const contentTextarea = document.getElementById('contentTextarea');
    const videoSelect = document.getElementById('video-select');
    const audioSelect = document.getElementById('audio-select');
    const downloadThumb = document.getElementById('download-thumb');
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const cookiesFileInput = document.getElementById('cookiesFileInput');
    const cookiesFileName = document.getElementById('cookiesFileName');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // 记录所有按钮的默认内容
    const buttonDefaults = new Map();
    [pasteButton, analyzeButton, downloadButton, downloadVideoButton, downloadAudioButton].forEach(btn => {
      if (btn) buttonDefaults.set(btn, btn.innerHTML);
    });

    // 封装按钮loading状态，恢复时用默认内容
    function setButtonLoading(btn, loading, text, loadingText) {
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<span class=\"spinner\"></span>${loadingText || text}`;
        } else {
            btn.disabled = false;
            // 恢复为按钮初始内容
            if (buttonDefaults.has(btn)) {
              btn.innerHTML = buttonDefaults.get(btn);
            } else {
              btn.innerHTML = text;
            }
        }
    }

    // 进度条显示/隐藏与更新（保持一直显示，初始为0）
    function showProgressBar(percent, text) {
      if (progressBarContainer) progressBarContainer.style.display = '';
      if (progressBar) progressBar.style.width = percent + '%';
      if (progressText) progressText.textContent = text || '';
    }
    function hideProgressBar() {
      // 不再隐藏进度条，只重置为0
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = '';
    }

    // 页面切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            document.querySelectorAll('.nav-link').forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.page').forEach(pageElement => pageElement.classList.remove('active'));
            document.getElementById(page).classList.add('active');
        });
    });
    switchPage('main');

    // 粘贴按钮
    pasteButton.addEventListener('click', async () => {
        setButtonLoading(pasteButton, true, '⌨', '粘贴中...');
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            showToast('已粘贴剪贴板内容', 'success');
        } catch (error) {
            showToast('粘贴失败: ' + error.message, 'error');
        } finally {
            setButtonLoading(pasteButton, false, '⌨');
        }
    });

    // URL分析按钮
    analyzeButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showToast('请输入有效的YouTube URL', 'error');
            urlInput.focus();
            return;
        }
        if (!isValidYouTubeUrl(url)) {
            showToast('请输入有效的YouTube视频链接', 'error');
            return;
        }
        setButtonLoading(analyzeButton, true, '🔍', '分析中...');
        try {
            const videoInfo = await window.electron.analyzeUrl({ url, cookiesPath: selectedCookiesPath });
            titleInput.value = videoInfo.title;
            setContentTextArea(videoInfo.description);
            // 缩略图img
            thumbnailPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = videoInfo.thumbnail;
            img.alt = '缩略图';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.onerror = () => { img.remove(); thumbnailPreview.textContent = '缩略图加载失败'; };
            thumbnailPreview.appendChild(img);
            showToast('视频信息获取成功', 'success');
        } catch (error) {
            // cookies 失效兜底拦截
            let msg = (error && error.message) ? error.message : (typeof error === 'string' ? error : '');
            msg = msg.replace(/[\s\u200B-\u200D\uFEFF\u3000]+/g, ' ').toLowerCase();
            const pattern = /sign\s*in|confirm\s*you.*bot|not\s*a\s*bot|robot\s*check|use.*cookies|faq.*cookies|exporting.*cookies|cookies?\s*(无效|失效|invalid|expired|fail|错误|失败)|需要登录|需要验证|人[工机]验证|\u4eba[\u5de5\u673a][\u9a8c\u8bc1]/i;
            if (pattern.test(msg)) {
                showToast('cookies.txt（无效）', 'error');
                setContentTextArea('');
                return;
            }
            showToast('分析失败: ' + (error.message || error), 'error');
            setContentTextArea('分析失败：' + (error.message || error));
        } finally {
            setButtonLoading(analyzeButton, false, '🔍');
        }
    });

    // 下载按钮
    downloadButton.addEventListener('click', async () => {
        const path = pathInput.value.trim();
        if (!path) {
            showToast('请选择保存路径', 'error');
            return;
        }
        setButtonLoading(downloadButton, true, '下载', '下载中...');
        try {
            await downloadVideo({
                url: urlInput.value,
                path: path,
                downloadThumbnail: downloadThumb.checked
            });
            showToast('下载完成', 'success');
        } catch (error) {
            showToast('下载失败: ' + error.message, 'error');
        } finally {
            setButtonLoading(downloadButton, false, '下载');
        }
    });

    // 选择保存路径
    selectPathButton.addEventListener('click', async () => {
        try {
            const path = await window.electron.showOpenDialog({ properties: ['openDirectory'] });
            if (path && path.length > 0) {
                pathInput.value = path[0];
                showToast('路径设置成功', 'success');
            }
        } catch (error) {
            showToast('选择路径失败', 'error');
        }
    });

    // 刷新路径
    refreshPathButton.addEventListener('click', () => {
        pathInput.value = 'D:\\下载\\yt-dlp-gui\\';
        showToast('已重置默认路径', 'info');
    });

    // 视频下载按钮
    downloadVideoButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        let savePath = pathInput.value.trim();
        const videoFormat = videoSelect.value;
        if (!url) {
          showToast('请输入视频地址', 'error');
          return;
        }
        if (!videoFormat || videoFormat === '请选择') {
          showToast('请选择视频格式', 'error');
          return;
        }
        if (!savePath) savePath = '';
        setButtonLoading(downloadVideoButton, true, '⬇', '下载中...');
        showProgressBar(0, '准备下载...');
        try {
          await window.electron.downloadVideo({
            url,
            savePath,
            format: videoFormat,
            cookiesPath: selectedCookiesPath
          });
          showToast('视频流下载完成', 'success');
        } catch (e) {
          showToast('视频流下载失败: ' + (e.message || e), 'error');
        } finally {
          setButtonLoading(downloadVideoButton, false, '⬇');
        }
      });

    // 音频下载按钮（仅下载音频流）
    if (downloadAudioButton && window.electron) {
      downloadAudioButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        let savePath = pathInput.value.trim();
        const audioFormat = audioSelect.value;
        if (!url) {
          showToast('请输入视频地址', 'error');
          return;
        }
        if (!audioFormat || audioFormat === '请选择') {
          showToast('请选择音频格式', 'error');
          return;
        }
        if (!savePath) savePath = '';
        setButtonLoading(downloadAudioButton, true, '⬇', '下载中...');
        showProgressBar(0, '准备下载...');
        try {
          await window.electron.downloadVideo({
            url,
            savePath,
            format: audioFormat,
            cookiesPath: selectedCookiesPath
          });
          showToast('音频流下载完成', 'success');
        } catch (e) {
          showToast('音频流下载失败: ' + (e.message || e), 'error');
        } finally {
          setButtonLoading(downloadAudioButton, false, '⬇');
        }
      });
    }

    // ========== Electron集成功能 ========== 
    let selectedCookiesPath = '';

    // 选项页 cookies 文件选择
    if (cookiesFileInput) {
      cookiesFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const errorDetail = document.getElementById('cookiesErrorDetail');
        function hideCookiesErrorDetailIfInvalid(msg) {
          if (!errorDetail) return;
          let clean = (msg || '').replace(/[\s\u200B-\u200D\uFEFF\u3000]+/g, ' ').toLowerCase();
          const pattern = /sign\s*in|confirm\s*you.*bot|not\s*a\s*bot|robot\s*check|use.*cookies|faq.*cookies|exporting.*cookies|cookies?\s*(无效|失效|invalid|expired|fail|错误|失败)|需要登录|需要验证|人[工机]验证|\u4eba[\u5de5\u673a][\u9a8c\u8bc1]/i;
          if (pattern.test(clean)) {
            errorDetail.textContent = '';
            errorDetail.classList.add('hide-cookies-error-detail');
            return true;
          } else {
            errorDetail.classList.remove('hide-cookies-error-detail');
            return false;
          }
        }
        if (file) {
          cookiesFileName.textContent = file.name;
          selectedCookiesPath = file.path || '';
          cookiesFileName.style.color = '';
          // 允许重新选择文件时恢复输入状态
          if (errorDetail) errorDetail.textContent = '';
          if (errorDetail) errorDetail.classList.remove('hide-cookies-error-detail');
          // 验证cookies文件内容
          if (file.text) {
            file.text().then(text => {
              let valid = false;
              // 常见cookies关键字
              if (/NID=|SESSDATA=|yt-/.test(text) || /# Netscape HTTP Cookie File/.test(text)) {
                valid = true;
              }
              if (valid) {
                // 格式初步通过，进一步检测可用性
                cookiesFileName.textContent = file.name + '（检测中...）';
                cookiesFileName.style.color = '#ffa726';
                if (window.electron && window.electron.validateCookies) {
                  window.electron.validateCookies(selectedCookiesPath).then(res => {
                    if (res.valid) {
                      cookiesFileName.textContent = file.name + '（可用）';
                      cookiesFileName.style.color = '#4caf50';
                      if (errorDetail) errorDetail.textContent = '';
                      if (errorDetail) errorDetail.classList.remove('hide-cookies-error-detail');
                      showToast('Cookies 可用，已通过验证', 'success');
                    } else {
                      cookiesFileName.textContent = file.name + '（无效）';
                      cookiesFileName.style.color = '#f44336';
                      let errMsg = 'Cookies 无效或无权限';
                      if (res.error) errMsg += `\n详细信息：${res.error}`;
                      if (errorDetail) {
                        if (!hideCookiesErrorDetailIfInvalid(res.error)) errorDetail.textContent = res.error || '';
                      }
                      showToast(errMsg, 'error');
                    }
                  }).catch((err) => {
                    cookiesFileName.textContent = file.name + '（检测失败）';
                    cookiesFileName.style.color = '#f44336';
                    if (errorDetail) {
                      if (!hideCookiesErrorDetailIfInvalid(err && err.message)) errorDetail.textContent = err && err.message ? err.message : '';
                    }
                    showToast('Cookies 可用性检测失败' + (err && err.message ? ('：' + err.message) : ''), 'error');
                  });
                } else {
                  cookiesFileName.textContent = file.name + '（可用）';
                  cookiesFileName.style.color = '#4caf50';
                }
              } else {
                cookiesFileName.textContent = file.name + '（格式异常）';
                cookiesFileName.style.color = '#f44336';
                showToast('Cookies文件格式异常，可能无法用于登录', 'warning');
              }
            }).catch(() => {
              cookiesFileName.textContent = file.name + '（读取失败）';
              cookiesFileName.style.color = '#f44336';
              if (errorDetail) errorDetail.textContent = '';
              if (errorDetail) errorDetail.classList.remove('hide-cookies-error-detail');
              showToast('无法读取Cookies文件内容', 'error');
            });
          }
        } else {
          cookiesFileName.textContent = '';
          selectedCookiesPath = '';
          if (errorDetail) errorDetail.textContent = '';
          if (errorDetail) errorDetail.classList.remove('hide-cookies-error-detail');
        }
      });
    }

    // 注入CSS，彻底隐藏 cookies 错误详情
    (function(){
      if (!document.getElementById('hide-cookies-error-detail-style')) {
        const style = document.createElement('style');
        style.id = 'hide-cookies-error-detail-style';
        style.innerHTML = `.hide-cookies-error-detail { display: none !important; }`;
        document.head.appendChild(style);
      }
    })();

    // 选择保存路径按钮
    if (selectPathButton && window.electron) {
      selectPathButton.addEventListener('click', async () => {
        const folder = await window.electron.selectFolder();
        if (folder) {
          pathInput.value = folder;
        }
      });
    }

    // 监听主进程下载进度事件
    if (window.electron && window.electron.onDownloadProgress) {
      window.electron.onDownloadProgress(({ percent, text }) => {
        showProgressBar(percent, text);
        // 保持进度条一直显示，不自动隐藏
      });
    }

    // 下载按钮（主页面）
    if (downloadButton && window.electron) {
      downloadButton.addEventListener('click', async () => {
        const url = document.getElementById('urlInput').value.trim();
        let savePath = pathInput.value.trim();
        const videoFormat = document.getElementById('video-select').value;
        const audioFormat = document.getElementById('audio-select').value;
        if (!url) {
          showToast('请输入视频地址', 'error');
          return;
        }
        // 允许未填写保存路径，主进程自动用当前目录
        if (!savePath) savePath = '';
        // 自动拼合音视频逻辑
        let finalFormat = videoFormat;
        if (videoFormat && videoFormat !== '请选择' && (!audioFormat || audioFormat === '请选择')) {
          // 查找最佳音频格式
          if (window.lastAnalyzeFormats && Array.isArray(window.lastAnalyzeFormats)) {
            const bestAudio = window.lastAnalyzeFormats.find(f => f.vcodec === 'none' && f.acodec !== 'none');
            if (bestAudio) {
              finalFormat = videoFormat + "+" + bestAudio.format_id;
              showToast('已自动拼合最佳音频轨道', 'info');
            }
          }
        } else if (videoFormat && videoFormat !== '请选择' && audioFormat && audioFormat !== '请选择') {
          finalFormat = videoFormat + "+" + audioFormat;
        }
        // 检查目标文件是否已存在
        let fileName = '';
        if (titleInput && titleInput.value) {
          fileName = titleInput.value.replace(/[\\/:*?"<>|]/g, '_');
        } else {
          fileName = '下载文件';
        }
        let ext = 'mp4';
        if (videoFormat && videoFormat !== '请选择') {
          // 简单推断扩展名
          if (videoFormat.includes('webm')) ext = 'webm';
          if (videoFormat.includes('mkv')) ext = 'mkv';
        }
        const targetFile = savePath.replace(/[\\/]$/, '') + '\\' + fileName + '.' + ext;
        // 检查文件是否存在
        if (window.require) {
          const fs = window.require('fs');
          if (fs.existsSync(targetFile)) {
            showToast('文件已存在，禁止重复下载', 'error');
            return;
          }
        }
        setButtonLoading(downloadButton, true, '下载', '下载中...');
        showProgressBar(0, '准备下载...');
        try {
          await window.electron.downloadVideo({
            url,
            savePath,
            format: finalFormat,
            cookiesPath: selectedCookiesPath
          });
          showToast('下载完成', 'success');
        } catch (e) {
          showToast('下载失败: ' + (e.message || e), 'error');
        } finally {
          setButtonLoading(downloadButton, false, '下载');
        }
      });
    }

    // 分析按钮点击，显示所有可用格式
    if (analyzeButton && urlInput && window.electron && window.electron.analyzeUrl) {
      analyzeButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        console.log('[分析按钮] 被点击，url:', url, 'cookiesPath:', selectedCookiesPath);
        if (!isValidYouTubeUrl(url)) {
          showToast('请输入有效的YouTube视频地址', 'error');
          return;
        }
        // 检查 cookies 是否可用（绿色）
        if (cookiesFileName && cookiesFileName.style.color !== 'rgb(76, 175, 80)' && cookiesFileName.textContent.includes('Cookies')) {
          showToast('请先选择并验证可用的Cookies文件', 'error');
          return;
        }
        setButtonLoading(analyzeButton, true, '🔍', '分析中...');
        try {
          // 只用 window.electron.analyzeUrl，不再调用 analyzeYouTubeUrl
          const info = await window.electron.analyzeUrl({ url, cookiesPath: selectedCookiesPath });
          console.log('[analyzeUrl] 返回 info:', info);
          // 解析格式
          const videoFormats = [];
          const audioFormats = [];
          if (info.formats && Array.isArray(info.formats)) {
            window.lastAnalyzeFormats = info.formats;
            info.formats.forEach(f => {
              if (f.vcodec !== 'none' && f.acodec !== 'none') {
                videoFormats.push({ id: f.format_id, desc: `${f.format_note || ''} ${f.ext} ${f.resolution || ''} ${f.fps ? f.fps + 'fps' : ''}`.trim() });
              } else if (f.vcodec !== 'none') {
                videoFormats.push({ id: f.format_id, desc: `${f.format_note || ''} ${f.ext} ${f.resolution || ''} ${f.fps ? f.fps + 'fps' : ''}`.trim() });
              } else if (f.acodec !== 'none') {
                audioFormats.push({ id: f.format_id, desc: `${f.ext} ${f.abr ? f.abr + 'kbps' : ''}`.trim() });
              }
            });
          }
          // 填充下拉框
          videoSelect.innerHTML = '<option>请选择</option>';
          videoFormats.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.desc || f.id;
            videoSelect.appendChild(option);
          });
          audioSelect.innerHTML = '<option>请选择</option>';
          audioFormats.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.desc || f.id;
            audioSelect.appendChild(option);
          });
          // 标题、描述、缩略图
          if (info.title) titleInput.value = info.title;
          if (info.thumbnail && thumbnailPreview) {
            thumbnailPreview.innerHTML = `<img src="${info.thumbnail}" style="max-width:100%;max-height:100%;border-radius:8px;">`;
          }
          // 详细内容区域显示所有可用流的编码参数
          if (info.formats && Array.isArray(info.formats)) {
            let table = 'ID\t类型\t容器\t分辨率\t帧率\t视频编码\t音频编码\t视频码率\t音频码率\t备注\n';
            info.formats.forEach(f => {
              const type = (f.vcodec !== 'none' && f.acodec !== 'none') ? '音视频' : (f.vcodec !== 'none' ? '视频' : '音频');
              const resolution = f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : '');
              const fps = f.fps ? f.fps + 'fps' : '';
              const vbr = f.vbr ? f.vbr + 'kbps' : (f.tbr ? f.tbr + 'kbps' : (f.vbitrate ? Math.round(f.vbitrate/1000) + 'kbps' : ''));
              const abr = f.abr ? f.abr + 'kbps' : (f.abr === 0 ? '' : (f.abr ? f.abr + 'kbps' : (f.abr === undefined && f.asr ? f.asr + 'Hz' : '')));
              const note = f.format_note || (f.ext === 'm4a' ? '音频' : '') || '';
              table += `${f.format_id}\t${type}\t${f.ext}\t${resolution}\t${fps}\t${f.vcodec}\t${f.acodec}\t${vbr}\t${abr}\t${note}`.replace(/undefined/g, '') + '\n';
            });
            setContentTextArea(table);
          } else {
            setContentTextArea('未获取到格式信息');
          }
          showToast('分析成功，已获取所有流编码信息', 'success');
        } catch (e) {
          showToast('分析失败: ' + e.message, 'error');
          setContentTextArea('分析失败：' + e.message);
        } finally {
          setButtonLoading(analyzeButton, false, '🔍');
        }
      });
    }

    // 监听视频地址输入，自动分析格式
    if (urlInput && window.electron && window.electron.analyzeUrl) {
      let analyzeTimer = null;
      urlInput.addEventListener('input', () => {
        clearTimeout(analyzeTimer);
        const url = urlInput.value.trim();
        if (!isValidYouTubeUrl(url)) return;
        analyzeTimer = setTimeout(async () => {
          setButtonLoading(analyzeButton, true, '🔍', '分析中...');
          try {
            const info = await window.electron.analyzeUrl({ url, cookiesPath: selectedCookiesPath });
            // 解析格式
            const videoFormats = [];
            const audioFormats = [];
            if (info.formats && Array.isArray(info.formats)) {
              info.formats.forEach(f => {
                if (f.vcodec !== 'none' && f.acodec !== 'none') {
                  // 有画有声
                  videoFormats.push({ id: f.format_id, desc: `${f.format_note || ''} ${f.ext} ${f.resolution || ''} ${f.fps ? f.fps + 'fps' : ''}`.trim() });
                } else if (f.vcodec !== 'none') {
                  // 纯视频
                  videoFormats.push({ id: f.format_id, desc: `${f.format_note || ''} ${f.ext} ${f.resolution || ''} ${f.fps ? f.fps + 'fps' : ''}`.trim() });
                } else if (f.acodec !== 'none') {
                  // 纯音频
                  audioFormats.push({ id: f.format_id, desc: `${f.ext} ${f.abr ? f.abr + 'kbps' : ''}`.trim() });
                }
              });
            }
            // 填充下拉框
            videoSelect.innerHTML = '<option>请选择</option>';
            videoFormats.forEach(f => {
              const option = document.createElement('option');
              option.value = f.id;
              option.textContent = f.desc || f.id;
              videoSelect.appendChild(option);
            });
            audioSelect.innerHTML = '<option>请选择</option>';
            audioFormats.forEach(f => {
              const option = document.createElement('option');
              option.value = f.id;
              option.textContent = f.desc || f.id;
              audioSelect.appendChild(option);
            });
            // 标题、描述、缩略图
            if (info.title) titleInput.value = info.title;
            if (info.thumbnail && thumbnailPreview) {
              thumbnailPreview.innerHTML = `<img src="${info.thumbnail}" style="max-width:100%;max-height:100%;border-radius:8px;">`;
            }
            // 详细内容区域显示所有可用流的编码参数
            if (info.formats && Array.isArray(info.formats)) {
              let table = 'ID\t类型\t容器\t分辨率\t帧率\t视频编码\t音频编码\t视频码率\t音频码率\t备注\n';
              info.formats.forEach(f => {
                const type = (f.vcodec !== 'none' && f.acodec !== 'none') ? '音视频' : (f.vcodec !== 'none' ? '视频' : '音频');
                const resolution = f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : '');
                const fps = f.fps ? f.fps + 'fps' : '';
                const vbr = f.vbr ? f.vbr + 'kbps' : (f.tbr ? f.tbr + 'kbps' : (f.vbitrate ? Math.round(f.vbitrate/1000) + 'kbps' : ''));
                const abr = f.abr ? f.abr + 'kbps' : (f.abr === 0 ? '' : (f.abr ? f.abr + 'kbps' : (f.abr === undefined && f.asr ? f.asr + 'Hz' : '')));
                const note = f.format_note || (f.ext === 'm4a' ? '音频' : '') || '';
                table += `${f.format_id}\t${type}\t${f.ext}\t${resolution}\t${fps}\t${f.vcodec}\t${f.acodec}\t${vbr}\t${abr}\t${note}`.replace(/undefined/g, '') + '\n';
              });
              setContentTextArea(table);
            } else {
              setContentTextArea('未获取到格式信息');
            }
            showToast('分析成功，已获取所有流编码信息', 'success');
          } catch (e) {
            // 递归提取所有可能的错误文本
            function extractAllText(obj) {
              if (!obj) return '';
              if (typeof obj === 'string') return obj;
              if (typeof obj === 'object') {
                let result = '';
                for (const k in obj) {
                  if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    result += extractAllText(obj[k]) + '\n';
                  }
                }
                return result;
              }
              return obj.toString ? obj.toString() : '';
            }
            let msg = extractAllText(e);
            // 判断是否为 cookies 失效相关报错
            msg = msg.replace(/[\s\u200B-\u200D\uFEFF\u3000]+/g, ' ').toLowerCase();
            const pattern = /sign\s*in|confirm\s*you.*bot|not\s*a\s*bot|robot\s*check|use.*cookies|faq.*cookies|exporting.*cookies|cookies?\s*(无效|失效|invalid|expired|fail|错误|失败)|需要登录|需要验证|人[工机]验证|\u4eba[\u5de5\u673a][\u9a8c\u8bc1]/i;
            if (pattern.test(msg)) {
              showToast('cookies.txt（无效）', 'error');
              setContentTextArea('');
              return;
            }
            showToast('分析失败: ' + msg, 'error');
            setContentTextArea('分析失败：' + msg);
          } finally {
            setButtonLoading(analyzeButton, false, '🔍');
          }
        }, 600);
      });
    }
});