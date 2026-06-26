---
title: "Windows 上用 GitHub Pages + Jekyll 搭建个人博客完整教程"
description: "在 Windows 上安装 Ruby 与 Jekyll，创建本地博客并推送到 GitHub Pages 发布的完整步骤教程。"
date: 2026-05-15T08:00:00Z
lastmod: 2026-05-21T14:23:58.368Z
slug: "windows-github-pages-jekyll-blog-tutorial"
tags:
  - windows
  - blog
  - jekyll
  - github-pages
cover:
  image: "/assets/images/2026-05/cover-github_pages.png"
  alt: "GitHub Pages 与 Jekyll 搭建博客教程封面"
---

本文介绍在 Windows 上使用 GitHub Pages 与 Jekyll 搭建并发布个人博客的完整流程。

## 前提条件

- 拥有 GitHub 账号
- 已安装 **Git for Windows**：[下载地址](https://git-scm.com/download/win)

## 安装 Ruby

Jekyll 基于 Ruby 运行，因此第一步是安装 Ruby。

1. 下载 RubyInstaller：[https://rubyinstaller.org/downloads/](https://rubyinstaller.org/downloads/)
   - 选择 **Ruby+Devkit** 最新版本，例如 `Ruby 3.x.x (x64)`。
2. 安装时勾选 **“Add Ruby executables to your PATH”**
3. 安装完成后打开 PowerShell，输入：

```powershell
ruby -v
```

如果显示版本号，说明 Ruby 安装成功。

## 安装 Jekyll 与 Bundler

在 PowerShell 中执行：

```powershell
gem install bundler jekyll
```

验证安装：

```powershell
jekyll -v
```

如果显示版本号，说明 Jekyll 安装成功。

## 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 **“+” → New repository**
3. 仓库名称：
   - **个人博客**：`username.github.io`（`username` 换成你的 GitHub 名）
   - **项目博客**：自定义名称，例如 `myblog`
4. 初始化仓库（可选勾选 **Add a README file**）
5. 点击 **Create repository**

> 这样就有了一个空的 GitHub 仓库，为后续本地博客推送做准备。

## 创建本地博客

1. 选择存放博客的目录，例如 `D:\MyBlog`，进入目录：

```powershell
cd D:\MyBlog
```

2. 使用 Jekyll 创建新博客：

```powershell
jekyll new myblog
cd myblog
```

3. 启动本地服务器预览博客：

```powershell
bundle exec jekyll serve
```

浏览器访问 [http://localhost:4000](http://localhost:4000)
如果看到默认页面，说明本地运行成功。

> 本地修改文件后刷新浏览器即可预览效果。

## 推送博客到 GitHub

在博客目录 `D:\MyBlog\myblog` 初始化 Git 并推送：

```powershell
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/username/username.github.io.git
git push -u origin main
```

## 启用 GitHub Pages

1. 打开仓库 `https://github.com/username/username.github.io` → **Settings → Pages**
2. **Branch** 选择 `main` 分支及 `/ (root)` 目录
3. 保存后，GitHub 会生成博客网址：
   - 个人博客：`https://username.github.io`
   - 项目博客：`https://username.github.io/repo-name`

> 地址可能需要几分钟生效。

## 写博客文章

1. 在 `_posts` 文件夹下新建 Markdown 文件，命名规则：

```
YYYY-MM-DD-文章标题.md
```

示例：

```markdown
2026-05-15-hello-world.md
```

2. 文件内容示例：

```markdown
---
layout: post
title: "Hello World"
date: 2026-05-15
categories: jekyll update
---

这是我第一篇博客！
```

3. 提交文章到 GitHub：

```powershell
git add .
git commit -m "add new post"
git push
```

几分钟后刷新 GitHub Pages 页面即可看到文章。

## 小技巧

- 推荐使用 **VSCode** 编辑博客，支持 Markdown 预览
- `_config.yml` 可修改主题、博客标题、描述等
- 后续写文章只需在 `_posts` 下新增文件并提交 Git
- 自定义样式可修改 `_layouts`、`_includes` 和 `_sass` 文件夹内容

通过以上步骤，你就可以在 **Windows 系统**上成功搭建一个个人静态博客，并通过 GitHub Pages 免费发布，让全世界访问你的内容。
