---
title: "使用 AstroPaper 和 Cloudflare Pages 搭建个人博客主页"
description: "从 AstroPaper 主题创建 Astro 博客项目，推送到 GitHub，并通过 Cloudflare Pages 自动构建部署个人主页的完整流程。"
date: 2026-05-24T09:23:24.373Z
tags:
  - astro
  - astropaper
  - cloudflare-pages
  - blog
---

这篇文章记录我用 **Astro + AstroPaper + Cloudflare Pages** 搭建个人博客主页的过程。整体方案很轻量：Astro 负责静态站点生成，AstroPaper 提供现成的博客主题，Cloudflare Pages 负责从 GitHub 仓库自动构建和部署。

![我部署后的个人主页截图](/assets/images/2026-05/cloudflare-07-alex-xinlu-dot-pages-dot-dev-screenshot.png)

## 为什么选择这套方案

之前我也尝试过 GitHub Pages + Jekyll。它足够经典，但我更想要一个现代一点、可定制性更高、前端体验更好的博客主页。Astro 的静态构建速度很快，写 Markdown 也舒服；AstroPaper 主题本身已经包含文章列表、标签、归档、搜索、暗色模式、RSS、站点地图等博客常用能力；Cloudflare Pages 则可以直接连接 GitHub 仓库，提交代码后自动部署。

最终效果可以参考我的站点：[https://alex-xinlu.pages.dev/](https://alex-xinlu.pages.dev/)。

## 准备环境

本地需要先安装：

- Node.js
- pnpm
- Git
- GitHub 账号
- Cloudflare 账号

如果你还没有安装 pnpm，可以执行：

```bash
npm install -g pnpm
```

确认安装成功：

```bash
pnpm -v
```

## 创建 AstroPaper 项目

如果只是创建一个普通 Astro 项目，可以使用 Cloudflare 官方提供的命令：

```bash
pnpm create cloudflare@latest my-astro-app --framework=astro --platform=pages
```

之后再添加 Cloudflare adapter：

```bash
pnpm astro add cloudflare
```

不过我这次的目标是搭建博客，而不是从零开始搭一个普通 Astro 项目，所以直接使用 AstroPaper 主题模板：

```bash
pnpm create astro@latest --template satnaing/astro-paper
```

我希望尽量使用作者的最新版本，所以实际操作时是从 AstroPaper 的 GitHub Release 下载最新版压缩包，然后解压到本地项目目录。本文写作时我使用的是 `v6.0.0`：

[https://github.com/satnaing/astro-paper/releases/tag/v6.0.0](https://github.com/satnaing/astro-paper/releases/tag/v6.0.0)

## 本地运行

进入项目目录后安装依赖：

```bash
pnpm install
```

启动本地开发服务器：

```bash
pnpm dev
```

浏览器打开终端里提示的本地地址，通常是：

```text
http://localhost:4321
```

如果能看到 AstroPaper 默认首页，说明本地项目已经跑起来了。

![AstroPaper 官方示例站点截图](/assets/images/2026-05/cloudflare-09-astro-paper-dot-pages-dot-dev-screenshot.png)

## 创建 GitHub 仓库

Cloudflare Pages 可以直接从 GitHub 仓库拉取代码并自动构建，所以需要先把本地项目推送到 GitHub。

在项目根目录执行：

```bash
git init
git remote add origin https://github.com/<your-gh-username>/<repository-name>
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

把 `<your-gh-username>` 和 `<repository-name>` 替换成你自己的 GitHub 用户名和仓库名。

## 部署到 Cloudflare Pages

进入 Cloudflare Dashboard，打开 **Workers & Pages** 页面，点击 **Create application**。

![在 Cloudflare 中创建应用](/assets/images/2026-05/cloudflare-01-create-application.png)

这里有一个我踩过的坑：创建时要选择 **Pages**，不要沿用默认的 Workers。我一开始一直在 Workers 里折腾，部署不成功后还以为是代码配置问题，最后才发现对于这种静态博客，Cloudflare Pages 才是更直接的入口。

![选择 Pages 选项卡](/assets/images/2026-05/cloudflare-02-select-pages.png)

简单理解一下两者区别：

- **Cloudflare Pages** 更适合静态站点和前端项目，比如 Astro、React、Vue、Svelte 等，可以从 GitHub 仓库自动构建并部署。
- **Cloudflare Workers** 更适合运行边缘函数和后端逻辑，比如 API、鉴权、请求转发、边缘计算等。

AstroPaper 这种博客站点优先选择 Pages 就可以。

接着选择 **Import an existing Git repository**。

![导入已有 Git 仓库](/assets/images/2026-05/cloudflare-03-import-repository.png)

授权 GitHub 后，选择刚才创建并推送的博客仓库。

![选择 GitHub 仓库](/assets/images/2026-05/cloudflare-04-select-repository.png)

进入配置页面后，按下面这样填写：

| Configuration option | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `pnpm run build` |
| Build directory | `dist` |

Project name 可以自定义。它会影响 Cloudflare Pages 默认分配的 `*.pages.dev` 子域名，比如项目名是 `alex-xinlu`，默认访问地址就是 `https://alex-xinlu.pages.dev/`。

![配置 Cloudflare Pages 构建参数](/assets/images/2026-05/cloudflare-05-config.png)

确认无误后点击 **Save and Deploy**。Cloudflare 会开始拉取 GitHub 仓库代码、安装依赖、执行构建，并把 `dist` 目录发布出去。

部署成功后可以看到成功提示和访问地址。

![Cloudflare Pages 部署成功](/assets/images/2026-05/cloudflare-06-deployment-successful.png)

我的部署结果：

[https://alex-xinlu.pages.dev/](https://alex-xinlu.pages.dev/)

![部署后的个人主页](/assets/images/2026-05/cloudflare-07-alex-xinlu-dot-pages-dot-dev-screenshot.png)

## 修改 AstroPaper 首页

AstroPaper 默认首页已经很完整，但我希望个人主页更有自己的风格，所以在主题基础上重新设计了 hero section。

我主要参考了 [mxb.dev](https://mxb.dev/) 的首页气质：页面更像一个个人空间，而不只是文章列表入口。

![mxb.dev 首页参考](/assets/images/2026-05/cloudflare-08-mxb-dot-dev-screenshot.png)

这次 hero section 的改造我只修改了 `src/pages/index.astro`。如果你也只是想调整首页首屏展示，先从这个文件入手就够了。

AstroPaper 的文章写作规范也很清晰：文章标题写在 frontmatter 的 `title` 中，正文里的标题从 `##` 开始；如果需要文章目录，就在正文中添加 `## Table of contents`；图片推荐放在 `src/assets` 目录下，再用 `@/assets/...` 的方式在 Markdown 中引用。

## 后续写文章

在这个项目里，我把文章放在：

```text
src/content/posts/
```

比如这篇文章的位置是：

```text
src/content/posts/coding/_2026-05/astropaper-cloudflare-pages-blog-tutorial.md
```

目录名前面加 `_` 的好处是，它只用于本地内容分类，不会出现在最终文章 URL 中。也就是说，这篇文章的地址会更接近：

```text
/posts/coding/astropaper-cloudflare-pages-blog-tutorial/
```

一篇文章的基础 frontmatter 可以这样写：

```yaml
---
title: 文章标题
description: 文章摘要，会用于列表页和 SEO
pubDatetime: 2026-05-24T09:23:24.373Z
featured: false
draft: false
tags:
  - astro
  - blog
---
```

写完文章后正常提交并推送：

```bash
git add .
git commit -m "docs: add AstroPaper Cloudflare Pages blog tutorial"
git push
```

Cloudflare Pages 会自动触发新一轮部署。构建成功后，线上博客就会更新。

## 参考链接

- [AstroPaper GitHub 仓库](https://github.com/satnaing/astro-paper)
- [AstroPaper 官方示例站点](https://astro-paper.pages.dev/)
- [AstroPaper 新增文章规范](https://astro-paper.pages.dev/posts/adding-new-posts-in-astropaper-theme/)
- [Cloudflare Pages 部署 Astro 官方文档](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [mxb.dev](https://mxb.dev/)
