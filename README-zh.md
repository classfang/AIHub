<p align="center">
  <img src="/resources/icon.png" alt="logo" width="120">
</p>
<p align="center">
  <h1 align="center">AIHub</h1>
  <h3 align="center">
    一款集合众多大模型能力、AI能力的Electron客户端，具有极简的界面，将在未来支持更多AI能力 ✨✨
  </h3>
</p>

<h4 align="center">
  <a href="/README-zh.md">中文简介</a> | <a href="/README.md">English README</a>
</h4>

<h4 align="center">
  🎉🎉🎉 现已支持：OpenAI，谷歌 Gemini，讯飞星火大模型，文心一言大模型，通义千问大模型
</h4>

## 🖥️ 功能介绍

### 1. 支持多个厂商的大模型API

### 2. 支持多语言、多主题配置

### 3. 自定义你的AI助手

### 4. 创建你的个人知识库

### 5. 收藏与AI对话的灵感

## 🚀 使用应用

`应用包未签名和公证，如遇无法正常安装，可克隆代码本地打包。`

### 1. 在 release 中下载对于的应用包即可

[下载最新版本](https://github.com/classfang/AIHub/releases)

### 2. App 在 macOS 下提示已损坏无法打开解决办法

打开终端，输入以下命令，并执行：

```shell
sudo xattr -d com.apple.quarantine /Applications/xxxx.app
```

注意：/Applications/xxxx.app 换成你的App路径。

## ⚒️ 项目开发

### 1. 安装

```bash
$ yarn
```

### 2. 开发

```bash
$ yarn dev
```

### 3. 构建

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```
