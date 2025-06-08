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

    // 封装按钮loading状态
    function setButtonLoading(btn, loading, text, loadingText) {
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner"></span>${loadingText || text}`;
        } else {
            btn.disabled = false;
            btn.textContent = text;
        }
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
        setButtonLoading(analyzeButton, true, '分析', '分析中...');
        try {
            const videoInfo = await analyzeYouTubeUrl(url);
            titleInput.value = videoInfo.title;
            contentTextarea.value = videoInfo.description;
            // 缩略图img
            thumbnailPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = videoInfo.thumbnail;
            img.alt = '缩略图';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.onerror = () => { img.remove(); thumbnailPreview.textContent = '缩略图加载失败'; };
            thumbnailPreview.appendChild(img);
            updateFormatOptions(videoInfo.formats);
            showToast('视频信息获取成功', 'success');
        } catch (error) {
            showToast('分析失败: ' + error.message, 'error');
        } finally {
            setButtonLoading(analyzeButton, false, '分析');
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
        if (videoSelect.value === '请选择') {
            showToast('请选择视频格式', 'error');
            return;
        }
        setButtonLoading(downloadVideoButton, true, '⬇', '下载中...');
        try {
            await downloadVideo({
                url: urlInput.value,
                format: videoSelect.value,
                type: 'video'
            });
            showToast(`视频下载完成: ${videoSelect.value}`, 'success');
        } catch (error) {
            showToast('视频下载失败: ' + error.message, 'error');
        } finally {
            setButtonLoading(downloadVideoButton, false, '⬇');
        }
    });

    // 音频下载按钮
    downloadAudioButton.addEventListener('click', async () => {
        if (audioSelect.value === '请选择') {
            showToast('请选择音频格式', 'error');
            return;
        }
        setButtonLoading(downloadAudioButton, true, '⬇', '下载中...');
        try {
            await downloadVideo({
                url: urlInput.value,
                format: audioSelect.value,
                type: 'audio'
            });
            showToast(`音频下载完成: ${audioSelect.value}`, 'success');
        } catch (error) {
            showToast('音频下载失败: ' + error.message, 'error');
        } finally {
            setButtonLoading(downloadAudioButton, false, '⬇');
        }
    });

    // ========== Electron集成功能 ==========
    let selectedCookiesPath = '';

    // 选项页 cookies 文件选择
    if (cookiesFileInput) {
      cookiesFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          cookiesFileName.textContent = file.name;
          selectedCookiesPath = file.path || '';
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
                      showToast('Cookies 可用，已通过验证', 'success');
                    } else {
                      cookiesFileName.textContent = file.name + '（无效）';
                      cookiesFileName.style.color = '#f44336';
                      showToast('Cookies 无效或无权限', 'error');
                    }
                  }).catch(() => {
                    cookiesFileName.textContent = file.name + '（检测失败）';
                    cookiesFileName.style.color = '#f44336';
                    showToast('Cookies 可用性检测失败', 'error');
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
              showToast('无法读取Cookies文件内容', 'error');
            });
          }
        } else {
          cookiesFileName.textContent = '';
          selectedCookiesPath = '';
        }
      });
    }

    // 选择保存路径按钮
    if (selectPathButton && window.electron) {
      selectPathButton.addEventListener('click', async () => {
        const folder = await window.electron.selectFolder();
        if (folder) {
          pathInput.value = folder;
        }
      });
    }

    // 下载按钮（主页面）
    if (downloadButton && window.electron) {
      downloadButton.addEventListener('click', async () => {
        const url = document.getElementById('urlInput').value.trim();
        const savePath = pathInput.value.trim();
        const videoFormat = document.getElementById('video-select').value;
        if (!url || !savePath) {
          showToast('请输入视频地址和保存路径', 'error');
          return;
        }
        setButtonLoading(downloadButton, true, '下载', '下载中...');
        try {
          await window.electron.downloadVideo({
            url,
            savePath,
            format: videoFormat,
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
            if (info.description) contentTextarea.value = info.description;
            if (info.thumbnail && thumbnailPreview) {
              thumbnailPreview.innerHTML = `<img src="${info.thumbnail}" style="max-width:100%;max-height:100%;border-radius:8px;">`;
            }
            showToast('分析成功，已获取所有格式', 'success');
          } catch (e) {
            showToast('分析失败: ' + (e.message || e), 'error');
          } finally {
            setButtonLoading(analyzeButton, false, '🔍');
          }
        }, 600);
      });
    }
});