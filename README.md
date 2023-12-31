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
  <a href="/README.md">中文简介</a> | <a href="/README_en.md">English README</a>
</h4>

<h4 align="center">
  🎉🎉🎉 现已支持：OpenAI，谷歌 Gemini，讯飞星火大模型，文心一言大模型，通义千问大模型
</h4>

## ▶ 演示视频

https://github.com/classfang/AIHub/assets/27616248/d95a1fcb-01e8-4296-8b5b-154eba4d567b

## 🖥️ 功能介绍

### 1. 强大的AI能力支撑

轻松接入多个厂商的大模型API。

### 2. 丰富的配置

多语言、多主题配置。

### 3. 自定义你的AI助手

支持：文本对话、图片对话；AI绘画。

### 4. 搭建个人知识库

基于 LangChain 开发。简单的操作即可完成个人知识库搭建。

### 5. AI日历

一键生成周报、月报、年报。

### 6. 更多功能开发中

如果你有好的想法，欢迎提交 issues。

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
