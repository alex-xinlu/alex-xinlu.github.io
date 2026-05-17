最近在本地部署的 Dify 上排查了一个比较绕的流式响应问题。

先说结论：这不是 SSE 本身没结束，而是 `/v1/chat-messages` 在新会话首次提问时，默认会触发会话标题生成。这个标题生成任务本身也会调用一次大模型，所以即使主回答已经结束、最后一个流式数据片段里的 `event` 已经是 `message_end`，连接也可能还要再等几秒才真正关闭。

如果回答本身很快，这几秒会特别显眼；如果回答本身已经很慢，这段等待又往往会被主回答耗时盖住。所以它表面上看起来很像“流式连接没结束”，但根因其实不在 SSE。

下面就按排查过程展开说说，我是怎么一步步把这个问题定位出来的。



## 一、问题现象

先看一下这个问题最直观的表现：

![主消息流已经结束，但连接关闭时间明显滞后](/assets/images/2026-05-15/20260515-流式接口延时问题示例-v1-chat-messages.png)

图 1：主消息流已经结束，最后一个流式数据片段的 `event` 也已经是 `message_end`，但连接关闭时间仍然明显滞后。

我有一个 Dify 的 chatflow 应用，通过流式接口调用：

`/v1/chat-messages`

请求参数里：

- `response_mode = streaming`

当提问比较简单、回复很快时，会出现这样一个现象：

1. 大概 1 到 2 秒内，服务端已经把所有流式数据陆续返回完了
2. 最后一个流式数据片段里的 `event` 已经是 `message_end`
3. 按理说这时流式输出应该结束了
4. 但实际 SSE 连接还会多挂 5 到 10 秒才关闭

但把同样的问题放到另一个入口里测试时，现象又不一样：

- 如果直接在 Dify 的 web app 里测试，这个问题并不会出现
- 只有调用 `/v1/chat-messages` 这个流式 API 时会出现

后来又进一步确认了两个规律：

1. 只有新会话的第一次提问会出现
2. 如果回复本身很慢，比如调用大模型跑 20 秒以上，这个问题往往就不明显了



## 二、排查与定位

这次排查里，我一开始就借助了 Coding Agent，但最开始的问法并不对。我只是把 `/v1/chat-messages` 的现象直接发给它，让它分析为什么 `message_end` 之后连接还没断。这样问，视角被限制在单一接口和表面现象里，所以始终没找到根因。

真正让排查推进下去的，是把问题改成接口对比：

- `/v1/chat-messages` 有问题
- Dify 的 web app 正常

顺着这个思路，我先抓包确认了 Dify web app 实际调用的并不是 `/v1/chat-messages`，而是 `/api/chat-messages`。

![/api/chat-messages 是正常的](/assets/images/2026-05-15/20260515-流式接口延时问题示例-api-chat-messages.png)

图 2：Dify 的 web app 实际调用的是 `/api/chat-messages`，这一条链路下没有出现 `message_end` 之后还要额外等待的问题。

这说明表面上同样叫 “chat-messages”，实际上走的是两条不同链路。接着让 Coding Agent 沿着代码去对比 controller、参数处理和默认行为差异，最终很快就定位到了关键点：

- `/v1/chat-messages` 默认开启 `auto_generate_name`
- `/api/chat-messages` 会显式关闭 `auto_generate_name`

`auto_generate_name` 的作用是自动生成会话标题，而会话标题一般只在新建会话时生成一次。这也正好解释了为什么问题只出现在新会话第一次提问。



## 三、根因

根因其实不复杂：`message_end` 代表主消息流结束，但不代表整条请求已经彻底结束。

当 `/v1/chat-messages` 开启 `auto_generate_name` 时，新会话首问除了正常回答，还会额外触发一次“生成会话标题”的大模型调用。我这里默认开启了思考，所以这一步通常还要 5 秒左右，慢的时候接近 10 秒。

这个标题生成任务和主回答是并行的：

- 主回答流式返回内容
- 标题生成单独跑一次模型

如果主回答本身很快，比如 1 到 2 秒就结束了，那么 `message_end` 出现后，标题生成任务往往还没完成，于是连接还要再挂几秒。

但如果主回答本身就要 20 秒以上，那么标题生成大概率已经在主回答结束前跑完了，所以 `message_end` 之后几乎感觉不到额外等待。



## 四、最终修复方案

如果只是为了消除 `/v1/chat-messages` 在首问场景下的额外等待，修复非常直接：

对 `/v1/chat-messages` 调用时，显式传入：

```json
{
  "auto_generate_name": false
}
```

这样就和 Dify 的 web app 走 `/api/chat-messages` 时的行为对齐了，也就不会在这次流式请求里同步等待“生成会话标题”这一步。

不过这样处理也有一个直接结果：

- 会话标题不会自动生成了

如果既想解决这个延时问题，又想保留自动生成标题的能力，可以把“生成标题”从这次聊天请求里拆出去，改成异步触发。

做法是：

1. 调用 `/v1/chat-messages` 时传 `auto_generate_name: false`
2. 拿到 `conversation_id` 之后，再调用会话重命名接口 `/v1/conversations/:conversation_id/name`
3. 在 `/v1/conversations/:conversation_id/name` 接口里把 `auto_generate` 设为 `true`，让系统异步生成会话标题

这样处理之后，主聊天请求就只负责回答本身，而会话标题生成改由单独接口异步完成，两边职责也更清晰。

修复后验证结果：

- 新会话首次提问，简单快速回复，不再出现 `message_end` 后额外等待
- 如果后续需要标题，可以再通过 `/v1/conversations/:conversation_id/name` 异步触发自动生成
- 旧会话提问也正常

![修复后的结果](/assets/images/2026-05-15/20260515-流式接口延时问题示例-v1-chat-messages（修复后）.png)

图 3：关闭 `auto_generate_name` 后，`/v1/chat-messages` 在新会话首问场景下不再出现 `message_end` 之后额外等待的问题。



## 五、几点经验

- 不要默认认为同名接口就是同一条链路。`/v1/chat-messages` 和 `/api/chat-messages` 名字很像，但默认行为并不一样。
- `message_end` 只代表主消息流结束，不代表整条请求已经完全收尾。
- 用 Coding Agent 排查问题时，提问方式很重要。围着单个现象追问，往往只能得到局部解释；改成“对比两条链路的实现差异”，更容易逼近根因。

如果你也遇到类似现象：`message_end` 已经到了，但 SSE 连接还要再拖一段时间，尤其只发生在新会话第一次提问，那可以优先检查一下 `auto_generate_name` 是否被默认开启了。

