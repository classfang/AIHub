<h1 align="center">AIHub</h1>
<h3 align="center">
A collection of large model capabilities, AI capabilities Electron client, with a minimalist interface, will support more AI capabilities in the future ✨✨
</h3>

<h4 align="center">

[中文简介](README-zh.md) | [English README](README.md)

</h4>

<h4 align="center">

🎉🎉🎉 Now supported: OpenAI, Google Gemini, iFLYTEK Spark, ERNIE Bot, Tongyi Qianwen

</h4>

![demo](/demo/demo.png)

## Application  🚀

`Application package is not signed and notarized, in case of failure to install, you can clone the code local packaging`

### 1. Download the application package in release

[Download the latest version](https://github.com/classfang/AIHub/releases)

### 2. The App under macOS indicates that it is damaged and cannot open the solution

Open the terminal, enter the following command, and execute:

```shell
sudo xattr -d com.apple.quarantine /Applications/xxxx.app
```

Note: Replace /Applications/xxxx.app with your App path.

## Development  ⚒️

### 1. Install

```bash
$ yarn
```

### 2. Dev

```bash
$ yarn dev
```

### 3. Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```
