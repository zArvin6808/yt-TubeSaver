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
document.addEventListener('DOMContentLoaded', () => {
    // 为所有导航链接添加点击事件
    document.querySelectorAll('.navbar a').forEach(link => {
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
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

    async function downloadVideo(options) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('下载完成:', options);
                resolve();
            }, 3000);
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
    document.getElementById('pasteButton')?.addEventListener('click', () => {
        // TODO: 实现粘贴功能
        console.log('粘贴URL');
        navigator.clipboard.readText()
            .then(text => {
                document.getElementById('urlInput').value = text;
            })
            .catch(err => {
                console.error('无法读取剪贴板内容: ', err);
            });
    });
    
    // 视频下载按钮点击事件
    document.getElementById('downloadVideoButton')?.addEventListener('click', () => {
        const videoFormat = document.getElementById('video-select').value;
        console.log('下载视频格式:', videoFormat);
    });
    
    // 音频下载按钮点击事件
    document.getElementById('downloadAudioButton')?.addEventListener('click', () => {
        const audioFormat = document.getElementById('audio-select').value;
        console.log('下载音频格式:', audioFormat);
    });
    
    // 刷新路径按钮点击事件
    document.getElementById('refreshPathButton')?.addEventListener('click', () => {
        // TODO: 实现刷新路径功能
        console.log('刷新路径');
    });
});