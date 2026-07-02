---
title: "Dify HTTP 节点调用内网后端接口偶发 12 秒延迟排查"
description: "记录一次 Dify 正式环境通过 SSRF Proxy 调用内网后端接口时偶发 12 秒延迟的问题定位和修复。"
date: 2026-07-02T14:30:00+08:00
lastmod: 2026-07-02T17:20:00+08:00
slug: "dify-ssrf-proxy-squid-internal-api-delay"
aliases:
  - "/posts/dify-ssrf-proxy-squid-internal-api-delay/"
tags:
  - dify
  - squid
  - ssrf-proxy
  - troubleshooting
---

这次排查的是一个 Dify 正式环境里的偶发慢请求问题：同样的输入参数，HTTP 节点调用一个内网后端接口时，有时几百毫秒返回，有时却要 10 多秒。

最后定位下来，慢点不在内网后端接口，也不在 Dify 工作流调度，而是在 Dify HTTP 节点经过 SSRF Proxy，也就是 Squid 代理转发内网 IP 时，偶发触发了 DNS 反查等待。

## 问题现象

Dify 子应用里有一个 HTTP 节点，请求类似这样的内网后端接口：

```text
POST /api/internal/query
```

Dify 的运行日志显示，这个 HTTP 节点偶发耗时 12 秒左右。但后端服务自己的日志里，请求真正到达以后只处理了几百毫秒。

两边日志放在一起看，现象很明显：

- Dify 侧：HTTP 节点耗时约 12 秒
- 后端侧：接口处理耗时约 0.2 秒

这说明慢点不在业务代码里，而是在请求到达后端服务之前。

## 分层验证

为了确认耗时卡在哪一层，我把请求链路拆开测了一遍。

从 Dify 所在服务器直接请求内网后端接口，耗时正常：

```text
connect=0.004s starttransfer=0.197s total=0.197s
```

进入 Dify 的 API 容器、worker 容器后直接请求，也都是几百毫秒。问题只在通过 SSRF Proxy 访问时复现：

```bash
curl -x http://ssrf_proxy:3128 -s -o /dev/null \
  -w "connect=%{time_connect}s starttransfer=%{time_starttransfer}s total=%{time_total}s\n" \
  -H "Content-Type: application/json" \
  -d '{"type":"xxx","user":"xxx","client":"xxx"}' \
  http://<internal-api-host>:<port>/api/internal/query
```

这次结果变成了：

```text
connect=0.026s starttransfer=12.234s total=12.234s
```

再看 Squid access log，也能看到代理层的耗时：

```text
1782972765.483  12208 <client-ip> TCP_MISS/200 POST http://<internal-api-host>:<port>/api/internal/query
```

Squid access log 的第二列是耗时，单位是毫秒。这里的 `12208` 就是 12.208 秒。

到这里，问题已经收敛到 SSRF Proxy/Squid 转发层。

## 根因

Dify 的 HTTP 节点会通过 SSRF Proxy 访问目标地址，用来降低服务端请求伪造风险。这个设计本身是合理的，但 Squid 配置里如果存在域名 ACL，例如：

```text
acl allowed_domains dstdomain .marketplace.dify.ai
```

当请求目标是内网 IP 时，Squid 在做 `dstdomain` 判断的过程中，可能会尝试对这个 IP 做反向 DNS/PTR 查询。

在这次环境里，Docker DNS 到宿主机 DNS 的解析链路偶发等待超时，于是 Dify 侧就表现成 10 到 12 秒的 HTTP 节点延迟。

## 为什么是偶发的

这个问题看起来随机，是因为 DNS 和 Squid 都有缓存和状态复用。

有时第一次请求触发反向查询并等到超时，日志里就会出现 `12xxx ms`。随后一段时间内，同一个目标地址可能命中缓存或复用连接，耗时就回到几十到几百毫秒。

所以同一类请求会出现这种日志形态：

```text
12592  ... http://<internal-api-host>:<port>/api/internal/query
442    ... http://<internal-api-host>:<port>/api/internal/query
78     ... http://<internal-api-host>:<port>/api/internal/query
```

这不是后端接口性能忽快忽慢，而是代理层的前置判断偶发卡住。

## 为什么另一个接口看起来没问题

同一条流程里还有另一个 HTTP 节点，看起来一直比较快。

这里的原因大概率是调用顺序：慢请求节点通常先执行，它可能先把 Squid/DNS 这层状态预热了；后面的节点请求同一个内网后端接口时，更容易命中缓存，所以看起来没有遇到问题。

也就是说，差异不一定来自接口本身，而可能来自谁先经过代理层。

## 修复方案

因为这些内网后端地址是固定的，最直接的修复方式是在 Squid 配置里加 `dst + port` 白名单，并且放在域名 ACL 前面。

示例配置如下，真实地址需要替换成自己的内网 IP 和端口：

```text
# Allow fixed internal services before domain ACL to avoid reverse-DNS delays.
acl internal_service dst <internal-api-host>
acl internal_service_ports port <port>
http_access allow internal_service internal_service_ports

acl allowed_domains dstdomain .marketplace.dify.ai
```

改完模板配置后，不需要重新构建镜像，只需要重启 SSRF Proxy 容器，让它重新生成运行时配置：

```bash
docker restart <ssrf_proxy_container>
```

然后检查运行中的 Squid 配置，确认新增 ACL 在域名 ACL 前面：

```bash
docker exec <ssrf_proxy_container> sh -c "grep -n -E 'internal_service|allowed_domains' /etc/squid/squid.conf"
```

配置生效后，再观察 Squid access log，第二列应该从 `12xxx` 稳定回到几十到几百毫秒。

## 小结

这类问题最容易误判成后端接口慢，但只要把链路拆开测，结论会清楚很多：直连快、走代理慢，问题就应该优先看 SSRF Proxy/Squid。

最终的修复点也很小：对固定内网 IP 和端口加 `dst + port` 白名单，让请求在进入域名 ACL 判断前直接放行，避开偶发的反向 DNS 等待。
