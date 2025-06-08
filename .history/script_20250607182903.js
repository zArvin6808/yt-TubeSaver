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

    // 辅助函数
    function isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
        return pattern.test(url);
    }

    // Toast通知，限制最大数量
    function showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        // 限制最大toast数量
        const maxToasts = 3;
        while (container.children.length >= maxToasts) {
            container.removeChild(container.firstChild);
        }
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = icons[type] || icons.info;
        toast.appendChild(icon);
        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        toast.appendChild(messageEl);
        const closeBtn = document.createElement('span');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
        toast.appendChild(closeBtn);
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        const timeout = setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

    // 填充格式选项，健壮性
    function updateFormatOptions(formats) {
        videoSelect.innerHTML = '<option>请选择</option>';
        audioSelect.innerHTML = '<option>请选择</option>';
        if (formats && Array.isArray(formats.video)) {
            formats.video.forEach(format => {
                const option = document.createElement('option');
                option.value = format;
                option.textContent = format;
                videoSelect.appendChild(option);
            });
        }
        if (formats && Array.isArray(formats.audio)) {
            formats.audio.forEach(format => {
                const option = document.createElement('option');
                option.value = format;
                option.textContent = format;
                audioSelect.appendChild(option);
            });
        }
    }

    // 模拟下载
    async function downloadVideo(options) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('下载完成:', options);
                resolve();
            }, 3000);
        });
    }
});