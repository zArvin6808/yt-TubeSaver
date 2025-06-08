<<<<<<< HEAD
# yt-dlp-gui - YouTube视频下载工具

![项目截图](https://via.placeholder.com/800x500?text=yt-dlp-gui+界面截图)

一个基于Web的YouTube视频下载工具GUI前端，使用HTML/CSS/JavaScript构建，配合yt-dlp和ffmpeg实现视频下载功能。

## ✨ 功能特性

- 🎥 支持YouTube视频URL解析和下载
- 🔉 支持音频提取和格式转换
- 📋 剪贴板URL粘贴功能
- 🗂️ 自定义下载路径设置
- 🖼️ 视频缩略图下载选项
- 🎚️ 视频/音频格式选择

## 📦 文件结构

```
yt-dlp-gui/
├── ffmpeg.exe        # 视频处理工具(必需)
├── yt-dlp.exe        # YouTube下载工具(必需)
├── index.html        # 主界面文件
├── script.js         # 主要JavaScript逻辑
└── style.css         # 样式表
```

## 🚀 快速开始

### 基本使用

1. 下载项目文件(确保包含ffmpeg.exe和yt-dlp.exe)
2. 双击打开`index.html`文件
3. 在输入框中粘贴或输入YouTube视频URL
4. 选择视频或音频格式
5. (可选)点击"选择路径"设置下载位置
6. 点击"下载"按钮开始下载

### 高级选项

- 视频格式: 支持mp4/webm等格式
- 音频格式: 支持mp3/aac等格式
- 下载路径: 默认为`D:\下载\yt-dlp-gui\`

## ⚠️ 注意事项

1. 必须保留`ffmpeg.exe`和`yt-dlp.exe`在项目目录中
2. 首次使用可能需要允许运行.exe文件
3. 某些视频可能受版权保护无法下载
4. 下载速度取决于网络状况

## 🔧 开发状态

✅ 已完成:
- 基础UI界面
- URL输入和解析框架
- 格式选择功能
- 路径设置界面

🛠️ 待实现:
- 实际下载功能集成
- 下载进度显示
- 批量下载功能
- 字幕下载选项

## 🌟 未来计划

- 添加更多视频平台支持
- 实现下载队列功能
- 增加下载历史记录
- 支持代理设置
- 多语言界面支持

## 🤝 贡献指南

欢迎提交Pull Request或Issue报告问题。

1. Fork本项目
2. 创建新分支(`git checkout -b feature/新功能`)
3. 提交更改(`git commit -am '添加新功能'`)
4. 推送到分支(`git push origin feature/新功能`)
5. 创建Pull Request

