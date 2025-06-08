document.addEventListener('DOMContentLoaded', function() {
    // 原有功能代码
    // ...

    // 新增页面切换功能
    function switchPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.app-page').forEach(page => {
            page.classList.remove('app-page--active');
        });
        
        // 显示选中页面
        document.getElementById(pageId).classList.add('app-page--active');
        
        // 更新导航项状态
        document.querySelectorAll('.app-nav__item').forEach(item => {
            item.classList.remove('app-nav__item--active');
        });
        document.querySelector(`.app-nav__item[data-page="${pageId}"]`).classList.add('app-nav__item--active');
    }

    // 绑定导航项点击事件
    document.querySelectorAll('.app-nav__item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            switchPage(pageId);
        });
    });
});

// 原有其他代码
// ...