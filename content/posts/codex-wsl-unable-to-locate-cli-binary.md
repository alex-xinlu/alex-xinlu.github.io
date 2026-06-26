---
title: "Codex 切换到 WSL 后启动失败：Unable to locate the Codex CLI binary"
description: "记录一次 Windows 版 Codex 切换到 WSL 运行环境后无法启动的问题，以及通过修改 config.toml 恢复的解决方法。"
date: 2026-06-15T03:36:11.414Z
slug: "codex-wsl-unable-to-locate-cli-binary"
tags:
  - codex
  - wsl
  - windows
  - troubleshooting
---

这篇文章记录一次 Codex Desktop 在 Windows 上切换 WSL 配置后无法启动的问题。问题本身不复杂，但因为 Codex 已经打不开了，所以如果不知道去哪里改配置，会比较容易卡住。

我的环境是：

- Windows 11
- Microsoft Store 安装的 Codex
- 本机已安装 WSL

## 问题背景

一开始我修改 Codex 设置，是因为平时开发很多时候都在 Linux 环境里完成。我以为让 Codex Agent 直接跑在 WSL 里，可能会比在 PowerShell 里更顺手一些，尤其是执行脚本、使用 Linux 命令和处理项目依赖时。

所以我在 Codex 设置里做了两处修改。

第一处，把 **Agent environment** 从 `Windows native` 改成了 `Windows Subsystem for Linux`。

![Codex Agent environment 切换到 WSL](/assets/images/2026-06/codex-agent-environment-wsl.png)

第二处，把 **Integrated terminal shell** 改成了 `WSL`。

![Codex Integrated terminal shell 切换到 WSL](/assets/images/2026-06/codex-integrated-terminal-wsl.png)

改完之后重新打开 Codex，就出现了启动失败。

## 报错现象

重新打开 Codex 后，窗口里提示：

```text
Codex failed to start.

Unable to locate the Codex CLI binary. Set CODEX_CLI_PATH or ensure the Electron resources include bin/codex.
```

![Codex failed to start 报错](/assets/images/2026-06/codex-failed-to-start-cli-binary.png)

我一开始尝试过卸载 Codex 再重新安装，但没有解决，打开后还是同样的报错。

## 解决方法

后来在 GitHub issue 里看到一个解决方案：手动修改 Codex 的本地配置文件。

配置文件路径在：

```text
C:\Users\<你的用户名>\.codex\config.toml
```

打开这个文件后，删除下面两行配置：

```toml
runCodexInWindowsSubsystemForLinux = true
integratedTerminalShell = "wsl"
```

保存后重新启动 Codex，就可以正常打开了。

![GitHub issue 中提到的解决方案](/assets/images/2026-06/codex-github-issue-config-fix.png)

## 注意事项

修改前建议先备份一下 `config.toml`，比如复制一份到桌面。这样如果后面还想恢复原来的设置，也比较方便。

这个方法的核心不是重装 Codex，而是把导致启动失败的 WSL 相关配置删掉，让 Codex 回到默认的 Windows native 运行方式。

也就是说，如果 Codex 已经打不开了，可以绕过图形界面，直接从配置文件里恢复。

## 小结

这次问题的原因大概是：我把 Codex 的 Agent environment 和 integrated terminal 都切到了 WSL，但当前 Microsoft Store 版 Codex 在这个配置下启动时找不到对应的 Codex CLI binary，于是直接启动失败。

最终处理方式很简单：

1. 打开 `C:\Users\<你的用户名>\.codex\config.toml`
2. 删除 WSL 相关的两行配置
3. 保存后重新启动 Codex

参考链接：

- [GitHub issue comment: openai/codex#22423](https://github.com/openai/codex/issues/22423#issuecomment-4523360801)
