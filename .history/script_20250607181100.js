// 页面切换逻辑
function switchPage(pageId) {
    // 移除所有页面的active类
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('app-page--active');
    });
    
    // 移除所有导航项的active类
    document.querySelectorAll('.app-nav__item').forEach(nav => {
        nav.classList.remove('app-nav__item--active');
    });
    
    // 激活选中的页面
    document.getElementById(pageId).classList.add('app-page--active');
    
    // 激活对应的导航项
    document.querySelector(`.app-nav__item[data-page="${pageId}"]`).classList.add('app-nav__item--active');
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 为所有导航链接添加点击事件
    document.querySelectorAll('.app-nav__item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    // 默认显示main页面
    switchPage('main');
    
    // 绑定按钮事件
    
    // 粘贴按钮点击事件
    document.getElementById('pasteButton').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('urlInput').value = text;
            showToast('已粘贴剪贴板内容', 'success');
        } catch (error) {
            console.error('粘贴失败:', error);
            showToast('粘贴失败: ' + error.message, 'error');
        }
    });

    // URL分析按钮点击事件
    document.getElementById('analyzeButton').addEventListener('click', async () => {
        const urlInput = document.getElementById('urlInput');
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

        const button = document.getElementById('analyzeButton');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>分析中...';
        
        try {
            // 模拟API请求
            const videoInfo = await analyzeYouTubeUrl(url);
            
            // 更新UI
            document.getElementById('titleInput').value = videoInfo.title;
            document.getElementById('contentTextarea').value = videoInfo.description;
            document.getElementById('thumbnailPreview').style.backgroundImage = `url(${videoInfo.thumbnail})`;
            document.getElementById('thumbnailPreview').textContent = '';
            
            // 填充格式选项
            updateFormatOptions(videoInfo.formats);
            
            showToast('视频信息获取成功', 'success');
        } catch (error) {
            console.error('分析URL失败:', error);
            showToast('分析失败: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });

    // 下载按钮点击事件
    document.getElementById('downloadButton').addEventListener('click', async () => {
        const path = document.getElementById('pathInput').value.trim();
        if (!path) {
            showToast('请选择保存路径', 'error');
            return;
        }

        const button = document.getElementById('downloadButton');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>下载中...';
        
        try {
            // 模拟下载过程
            await downloadVideo({
                url: document.getElementById('urlInput').value,
                path: path,
                downloadThumbnail: document.getElementById('download-thumb').checked
            });
            
            showToast('下载完成', 'success');
        } catch (error) {
            console.error('下载失败:', error);
            showToast('下载失败: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });

    // 选择保存路径按钮点击事件
    document.getElementById('selectPathButton').addEventListener('click', async () => {
        try {
            // 使用Electron的dialog API选择路径
            const path = await window.electron.showOpenDialog({
                properties: ['openDirectory']
            });
            
            if (path && path.length > 0) {
                document.getElementById('pathInput').value = path[0];
                showToast('路径设置成功', 'success');
            }
        } catch (error) {
            console.error('选择路径失败:', error);
            showToast('选择路径失败', 'error');
        }
    });

    // 刷新路径按钮点击事件
    document.getElementById('refreshPathButton').addEventListener('click', () => {
        document.getElementById('pathInput').value = 'D:\\下载\\yt-dlp-gui\\';
        showToast('已重置默认路径', 'info');
    });

    // 视频下载按钮点击事件
    document.getElementById('downloadVideoButton').addEventListener('click', () => {
        const select = document.getElementById('video-select');
        if (select.value === '请选择') {
            showToast('请选择视频格式', 'error');
            return;
        }
        showToast(`开始下载视频: ${select.value}`, 'info');
    });

    // 音频下载按钮点击事件
    document.getElementById('downloadAudioButton').addEventListener('click', () => {
        const select = document.getElementById('audio-select');
        if (select.value === '请选择') {
            showToast('请选择音频格式', 'error');
            return;
        }
        showToast(`开始下载音频: ${select.value}`, 'info');
    });

    // 辅助函数
    function isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
        return pattern.test(url);
    }

    function showToast(message, type = 'info') {
      // 确保容器存在
      let container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      // 添加图标
      const icon = document.createElement('span');
      icon.className = 'toast-icon';
      icon.textContent = icons[type] || icons.info;
      toast.appendChild(icon);
      
      // 添加消息
      const messageEl = document.createElement('span');
      messageEl.textContent = message;
      toast.appendChild(messageEl);
      
      // 添加关闭按钮
      const closeBtn = document.createElement('span');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      });
      toast.appendChild(closeBtn);
      
      container.appendChild(toast);
      
      // 显示toast
      setTimeout(() => toast.classList.add('show'), 10);
      
      // 自动隐藏
      const timeout = setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
      
      // 鼠标悬停时暂停自动隐藏
      toast.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
        toast.style.setProperty('--progress', 'paused');
      });
      
      toast.addEventListener('mouseleave', () => {
        const newTimeout = setTimeout(() => {
          toast.classList.add('hide');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
        toast.dataset.timeout = newTimeout;
      });
    }

    // 模拟API函数
    async function analyzeYouTubeUrl(url) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    title: '示例视频标题',
                    description: '这是视频的详细描述信息...',
                    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                    formats: {
                        video: ['1080p', '720p', '480p'],
                        audio: ['mp3', 'aac', 'opus']
                    }
                });
            }, 1500);
        });
    }

    function updateFormatOptions(formats) {
        const videoSelect = document.getElementById('video-select');
        const audioSelect = document.getElementById('audio-select');
        
        // 清空现有选项
        videoSelect.innerHTML = '<option>请选择</option>';
        audioSelect.innerHTML = '<option>请选择</option>';
        
        // 添加视频格式
        formats.video.forEach(format => {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format;
            videoSelect.appendChild(option);
        });
        
        // 添加音频格式
        formats.audio.forEach(format => {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = format;
            audioSelect.appendChild(option);
        });
    }

    // 进度条控制函数
    function updateProgressBar(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.querySelector('.progress-bar__fill');
        
        if (percent > 0) {
            progressBar.style.display = 'block';
            progressFill.style.width = `${percent}%`;
        } else {
            progressBar.style.display = 'none';
        }
    }

    async function downloadVideo(options) {
        return new Promise((resolve) => {
            updateProgressBar(0);
            
            // 模拟下载进度
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                updateProgressBar(progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        console.log('下载完成:', options);
                        updateProgressBar(0);
                        resolve();
                    }, 500);
                }
            }, 300);
        });
    }

    // 页面切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // 更新导航栏状态
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
            
            // 切换页面
            document.querySelectorAll('.page').forEach(pageElement => {
                pageElement.classList.remove('active');
            });
            document.getElementById(page).classList.add('active');
        });
    });
    
    // 粘贴按钮点击事件
    document.getElementById('pasteButton')?.addEventListener('click', async () => {
        try {
            const button = document.getElementById('pasteButton');
            const originalText = button.textContent;
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span>粘贴中...';
            
            const text = await navigator.clipboard.readText();
            document.getElementById('urlInput').value = text;
            showToast('已粘贴剪贴板内容', 'success');
        } catch (error) {
            console.error('粘贴失败:', error);
            showToast('粘贴失败: ' + error.message, 'error');
        } finally {
            const button = document.getElementById('pasteButton');
            button.disabled = false;
            button.textContent = '粘贴';
        }
    });
    
    // 视频下载按钮点击事件
    document.getElementById('downloadVideoButton')?.addEventListener('click', async () => {
        const select = document.getElementById('video-select');
        if (select.value === '请选择') {
            showToast('请选择视频格式', 'error');
            return;
        }

        const button = document.getElementById('downloadVideoButton');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>下载中...';
        
        try {
            // 模拟下载过程
            await downloadVideo({
                url: document.getElementById('urlInput').value,
                format: select.value,
                type: 'video'
            });
            
            showToast(`视频下载完成: ${select.value}`, 'success');
        } catch (error) {
            console.error('视频下载失败:', error);
            showToast('视频下载失败: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
    
    // 音频下载按钮点击事件
    document.getElementById('downloadAudioButton')?.addEventListener('click', async () => {
        const select = document.getElementById('audio-select');
        if (select.value === '请选择') {
            showToast('请选择音频格式', 'error');
            return;
        }

        const button = document.getElementById('downloadAudioButton');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span>下载中...';
        
        try {
            // 模拟下载过程
            await downloadVideo({
                url: document.getElementById('urlInput').value,
                format: select.value,
                type: 'audio'
            });
            
            showToast(`音频下载完成: ${select.value}`, 'success');
        } catch (error) {
            console.error('音频下载失败:', error);
            showToast('音频下载失败: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
    
    // 刷新路径按钮点击事件
    document.getElementById('refreshPathButton')?.addEventListener('click', () => {
        document.getElementById('pathInput').value = 'D:\\下载\\yt-dlp-gui\\';
        showToast('已重置默认路径', 'info');
    });
});