---
title: "Harness Engineering 和 Loop Engineering：从引擎到自动驾驶"
description: "一点关于 Harness Engineering 与 Loop Engineering 区别的随想：前者是可控性，后者是自主性。"
date: 2026-07-01T00:00:00+08:00
slug: "harness-engineering-vs-loop-engineering"
aliases:
  - "/posts/harness-engineering-vs-loop-engineering/"
tags:
  - ai
  - agent
  - thoughts
  - harness-engineering
  - loop-engineering
---

今天聊 Harness Engineering 和 Loop Engineering 的时候，我觉得汽车这个类比很顺。它刚好能帮我搞清楚两者的区别。

**LLM 是汽车引擎，Harness Engineering 是让引擎变成一辆可用汽车的整套车身、方向盘、刹车、仪表盘、安全带和控制系统；以前需要人来开车，现在 Loop Engineering 像自动驾驶系统，替人完成持续驾驶和路线决策。**

单独看 LLM，它有动力，能输出能力，但裸引擎还不是车。Harness Engineering 做的是把这个能力包进一套可控的工程结构里：prompt 模板、tool calling、sandbox、权限控制、memory、eval、日志、测试、retry、guardrails、context 管理等。它关心的不是车要去哪，而是车能不能被安全、稳定、可靠地驾驶。

Loop Engineering 则是在这辆车之上加自动驾驶。它关心的是：当前在哪、下一步去哪、遇到问题怎么调整、什么时候继续、什么时候停。对应到 Agent，就是观察任务状态、规划下一步、调用 LLM 或工具、检查结果、失败后修正，直到到达目标或触发停止条件。

所以我现在会把两者的区别压缩成一句话：

> **Harness Engineering 是可控性，Loop Engineering 是自主性。**

或者换成汽车类比：

> **Harness Engineering 让“引擎”变成“车”；Loop Engineering 让“车”能自动开。**

不过，有了自动驾驶，并不意味着人就消失了。Loop Engineering 替代的是人持续握方向盘、反复 prompt、反复判断下一步的那部分工作。人仍然要设定目的地、划定边界、给资源、设置停止条件，并在关键节点验收或接管。

这也提醒我，AI 工程的重点不只是换更强的引擎。引擎当然重要，但 Harness Engineering 决定它能不能可靠上路，Loop Engineering 决定它能不能根据工具返回、日志、测试结果和环境状态，自己判断下一步该怎么开。

## 参考

- [Addy Osmani: Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- [Addy Osmani: Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/)
- [LangChain: The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)
- [Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses](https://arxiv.org/abs/2604.25850)
