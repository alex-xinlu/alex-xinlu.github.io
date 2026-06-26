---
title: "用 Git Patch 管理本地调试改动，避免误提交"
description: "记录一种简单实用的本地改动管理方式：把调试专用修改保存成 patch，再用 Git hook 防止误提交到线上仓库。"
date: 2026-06-05T07:24:23.406Z
slug: "git-patch-local-debug-changes"
tags:
  - git
  - patch
  - workflow
  - local-dev
---

最近在本地调试项目时，遇到一个挺容易被忽略的问题：有些文件必须为了本地环境临时改一下，但这些改动又不能提交到线上仓库。

比如：

- 为了本地构建通过，临时改了 `Dockerfile`
- 为了适配本地网络，临时改了构建脚本里的下载源或镜像源

这些改动本身没问题，在某段本地调试期间可能还会反复用到。麻烦的是，哪天开发新功能时顺手 `git add .`，就可能把它们一起提交出去。

这篇文章记录一个我觉得还算顺手的办法：**用 patch 保存本地调试改动，再用本地 Git hook 阻止误提交**。

## 为什么不用 gitignore

第一反应可能是：把这些文件加到 `.gitignore` 不就行了吗？

但这通常不生效。

`.gitignore` 主要用于忽略还没有被 Git 跟踪的新文件。如果某个文件已经在仓库里，比如：

```text
Dockerfile
scripts/build-image.sh
```

那它已经是 tracked file。即使后面写进 `.gitignore`，Git 还是会继续跟踪它的修改。

所以这个场景靠 `.gitignore` 解决不了。

## 先把本地改动保存成 patch

假设当前有 2 个文件是本地调试专用：

```text
Dockerfile
scripts/build-image.sh
```

可以先把它们保存成一个 patch 文件。为了避免误提交，patch 文件建议放在仓库外面：

```bash
mkdir -p ~/.local-dev-patches
git diff -- Dockerfile scripts/build-image.sh > ~/.local-dev-patches/my-project-local.patch
```

这样会得到一份本地补丁：

```text
~/.local-dev-patches/my-project-local.patch
```

这份文件记录的就是当前这几个文件的本地修改。

如果提交前想把这些本地调试改动先撤掉，可以执行：

```bash
git restore Dockerfile scripts/build-image.sh
```

这样本地调试改动不会混进这次提交里。patch 还在，后面需要本地调试环境时，可以再把这份改动加回来。

把这份本地调试改动加回来，可以执行：

```bash
git apply ~/.local-dev-patches/my-project-local.patch
```

## 用本地 hook 防止误提交

只保存 patch 还不够。因为日常开发时，最怕的是不小心执行：

```bash
git add .
git commit -m "some feature"
```

然后把本地调试文件也一起提交了。

可以在当前仓库加一个本地 `pre-commit` hook。这个 hook 不会提交到远程仓库，只存在于本机的 `.git/hooks` 目录下。

创建前先看一下 `.git/hooks/pre-commit` 是否已经存在：

```bash
ls .git/hooks/pre-commit
```

如果文件已经存在，不要直接覆盖。可以打开它，把下面这段保护逻辑手动合进去，避免把原来有用的 hook 误删掉。

如果原来没有这个文件，再新建：

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh

protected_files="Dockerfile scripts/build-image.sh"

blocked=$(git diff --cached --name-only -- $protected_files)

if [ -n "$blocked" ]; then
  echo "ERROR: local-only files are staged:"
  echo "$blocked"
  echo
  echo "These files are for local debugging only."
  echo "Please unstage them before committing."
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

之后如果这些文件被暂存了，提交会直接失败，并提示哪些文件被拦住了。

取消暂存可以用：

```bash
git restore --staged Dockerfile scripts/build-image.sh
```

然后再提交真正的业务代码。

## 日常怎么用

我现在一般按这个流程来。

第一次整理本地调试改动：

```bash
git diff -- Dockerfile scripts/build-image.sh > ~/.local-dev-patches/my-project-local.patch
```

开始开发新功能前，如果想避免本地调试改动干扰判断，可以先把它们撤掉：

```bash
git restore Dockerfile scripts/build-image.sh
```

需要本地调试环境时，再把这份改动加回来：

```bash
git apply ~/.local-dev-patches/my-project-local.patch
```

开发完成后正常查看状态：

```bash
git status
```

如果不小心把本地调试文件加进暂存区，`pre-commit` hook 会拦住提交。

## 不用了怎么撤销

如果这份本地调试 patch 后面不需要了，可以把相关文件恢复成仓库里的正常版本：

```bash
git restore Dockerfile scripts/build-image.sh
```

然后删除保存的 patch 文件：

```bash
rm ~/.local-dev-patches/my-project-local.patch
```

如果 `.git/hooks/pre-commit` 这个 hook 只是为了这次本地调试加的，也可以一起删掉：

```bash
rm .git/hooks/pre-commit
```

这样以后这些文件就不会再被本地 hook 拦住，可以按正常流程修改、暂存和提交。

## 适用范围

patch 适合管理短期、本地、相对固定的调试改动。

比如：

- 临时换一个本地可用的镜像源
- 临时跳过某个本地不需要的构建步骤
- 临时加一点只在自己电脑上使用的调试配置

它不适合长期承载正式功能。如果你发现同一个文件里经常同时出现两类改动：

- 本地调试改动
- 需要提交的正式业务改动

那就说明这个方案已经不太适合了。

更好的做法是把本地差异拆出去，例如：

- 用 `.env.local` 保存本地环境变量
- 用 `docker-compose.override.yml` 做本地覆盖
- 让构建脚本支持环境变量或命令参数
- 单独写一个不提交的本地脚本，比如 `scripts/build-image.local.sh`

这样正式文件照常提交，本地差异也不会混在里面。

## 这种方式的好处

这种做法的好处主要有几个：

- 本地调试改动可以保留，不用每次靠记忆恢复
- 不污染线上提交
- 不依赖 `.gitignore`
- 不需要改仓库配置
- patch 文件可以随时应用、随时撤销
- 本地 hook 能兜底，减少手滑提交的概率

它特别适合这种情况：

> 某些改动只服务于自己的本地环境，但后续还要继续在同一个仓库里开发正式功能。

## 不太推荐 skip-worktree

Git 里还有一个命令：

```bash
git update-index --skip-worktree <file>
```

它可以让 Git 暂时忽略某个 tracked file 的本地修改。

但我不太推荐把它作为长期方案。它会让 Git 状态变得不直观：文件明明改了，`git status` 却可能看不到。后面如果线上也改了同一个文件，就容易把自己绕进去。

相比之下，patch 更直白：

- 要用时 `git apply`
- 不要时 `git restore`
- 担心误提交就用 hook 拦住

状态看得见，处理起来也更踏实。

## 小结

本地调试改动和正式业务改动最好分开管理。

我的习惯是：

1. 本地专用修改保存成 patch
2. patch 放在仓库外
3. 用 `.git/hooks/pre-commit` 阻止误提交
4. 需要时把改动加回来，不需要时撤掉

这套方法适合处理那些临时存在、只服务本地环境的改动。等本地环境补丁不需要了，撤掉 patch 和 hook 就行，不会影响正常开发流程。
