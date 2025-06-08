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
    
    // URL分析按钮点击事件
    document.getElementById('analyzeButton').addEventListener('click', () => {
        const url = document.getElementById('urlInput').value;
        // TODO: 实现URL分析逻辑
        console.log('分析URL:', url);
    });

    // 下载按钮点击事件
    document.getElementById('downloadButton').addEventListener('click', () => {
        // TODO: 实现下载逻辑
        console.log('开始下载');
    });

    // 选择保存路径按钮点击事件
    document.getElementById('selectPathButton').addEventListener('click', () => {
        // TODO: 实现选择保存路径逻辑
        console.log('选择保存路径');
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