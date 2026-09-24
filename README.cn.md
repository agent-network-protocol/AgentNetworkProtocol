<div align="center">
  
[English](README.md) | [中文](README.cn.md)

</div>

# Agent Network Protocol (ANP)

> ANP 致力于成为智能体互联网时代的 HTTP：为智能体提供身份、命名、发现、协商、安全消息和应用层协作协议。

**当前规范集：ANP 1.2。** 核心规范与全部九份消息文档已从 vNext 合入正式文档路径。ANP-02 提供与 DID 方法无关的身份认证，支持 `did:wba` 与原生 `did:web`；ANP-03 定义 WBA 方法规则和身份连续性；ANP-04 定义 WNS 命名。智能体描述与发现文档同步对齐本次版本。

**发布范围：** 根目录规范与 `message/` 为当前英文文档，中文镜像位于 `chinese/`。ANP-06 仍为草案。P6 群组 E2EE 全文纳入 1.2 文档，但在完成稳定 MLS `ExtensionType` 注册门槛前保留候选状态；临时值 `0xF0A1` 不代表注册已完成。应用协议独立版本化；ANP-10 是 AP2 支付适配草案，不是已正式发布的稳定支付标准。

**ANP Messaging 1.2：** [Profile 索引](chinese/message/README.md)定义混合版本规范集。P1/P2/P3/P7/P8 及 P9 binding 保持 v1；P4 群基础语义、P5/P6 E2EE 使用 v2。规范发布不代表 SDK 或产品已经实现；公开能力宣告必须符合实际支持情况和各 Profile 的发布限制。

**版本说明：** `版本：1.2` 表示规范/文档发布版本，不是 wire 版本。Profile 标识、`protocolVersion`、接口版本、算法和签名/AAD 格式由各自规范管理，不能统一改号。P4/P5/P6 沿用 vNext 已定义的 v2 合同；其他 Profile 标识及示例中的 wire 版本字段保持不变。

**备注：** 本项目未在任何平台、任何区块链发布数字货币。

## 愿景定位

Agent Network Protocol（ANP）是一个开源的智能体通信协议，目标是定义智能体之间的连接方式，为数十亿智能体构建开放、安全、高效的协作网络。

<p align="center">
  <img src="images/agentic-web3.png" width="50%" alt="Agentic Web"/>
</p>

我们相信，智能体互联网是继人类互联网之后的新一代信息基础设施。在这个愿景中：

- **从平台中心到协议中心：** 数据和服务不应继续被锁在封闭平台里，智能体需要开放协议实现直接连接。
- **连接即力量：** 每个智能体既可以是信息消费者，也可以是服务提供者，并能发现、连接和协作。
- **AI 原生网络：** 智能体应通过语义明确、机器可读、可调用的协议交互，而不是只能模仿人类浏览网页。

## 为什么需要 ANP

当前互联网基础设施已经成熟，但仍缺少面向大规模智能体网络的通信和连接层。ANP 重点解决三类问题：

- 🌐 **互联互通：** 让不同平台、不同域名下的智能体能够相互认证、发现和通信。
- 🖥️ **原生接口：** 让 AI 使用 API、协议文档、结构化描述和协商接口，而不是模拟人类访问网页。
- 🤝 **高效协作：** 让智能体能够自组织、自协商，构建更低成本的协作网络。

## 协议架构

<p align="center">
  <img src="images/anp-architecture2.png" width="50%" alt="协议架构图"/>
</p>

ANP 构建在现有互联网基础设施之上，将已发布的协议能力组织为两个核心协议层，并在其上承载具体领域的应用协议：

- 🌐 **开放互联网基础设施：** ANP 复用 HTTP、CA、DNS、CDN、Search、TLS 等成熟基础设施，而不是重新构建一套网络栈。
- 🔒 **身份与加密通信层：** 基于 W3C DID 和 Web 基础设施。ANP-02 将通用认证与 DID 方法验证解耦，支持 `did:wba` 与原生 `did:web`；消息 Profile 定义 DID 定址和设备绑定 E2EE。
- 📡 **应用协议层：** 包含智能体描述、智能体发现和智能体应用协议。智能体支付、授权、认证、交易等领域协议构建在这一层之上。
- 🧪 **元协议状态：** ANP-06 当前仍为草案，暂不属于已发布架构；更新后的草案将其定位为基于 Agent Description 的语义元协议协商层，通过 `MetaProtocolInterface`、`anp.get_capabilities` 和 `anp.negotiate` 选择后续接口、Profile、安全模式和 Schema。

## 协议规范索引

| 领域 | 文档 | 状态 | 定义内容 |
| --- | --- | --- | --- |
| 总览 | [ANP-01：技术白皮书](chinese/01-AgentNetworkProtocol技术白皮书.md) | 资料性文档 v1.2 | 愿景、设计原则和概念架构；规范性状态以各规范为准 |
| 认证 | [ANP-02：基于 DID 的身份认证协议](chinese/02-ANP-基于DID的身份认证协议.md) | 已发布 v1.2 | 方法无关 HTTP/JSON 认证及 WBA/Web 绑定；独立于消息和 WNS |
| 身份 | [ANP-03：did:wba 方法规范](chinese/03-did-wba方法规范.md) | 已发布 v1.2 | Web DID 方法、`e1_` 绑定、稳定主体路径与可验证 DID 迁移 |
| 命名 | [ANP-04：基于 DID:WBA 的命名空间规范](chinese/04-ANP-基于DID-WBA的命名空间规范.md) | 已发布 v1.2 | WNS Handle、名称到 DID 解析、WBA 绑定与既有原生 Web 兼容 |
| 元协议 | [ANP-06：智能体通信元协议规范](chinese/06-ANP-智能体通信元协议规范.md) | 草案；文档版本 1.2 | 可选语义协商、`MetaProtocolInterface` 及接口 / Profile / 安全模式 / Schema 选择 |
| 描述 | [ANP-07：智能体描述协议规范](chinese/07-ANP-智能体描述协议规范.md) | 已发布 v1.2 | 智能体描述文档、接口描述和能力发布 |
| 发现 | [ANP-08：智能体发现协议规范](chinese/08-ANP-智能体发现协议规范.md) | 已发布 v1.2 | 基于 `.well-known` 的主动发现与向搜索智能体注册的被动发现 |
| 消息 | [ANP-09：端到端即时消息协议规范总纲](chinese/09-ANP-端到端即时消息协议规范.md) | 已发布 v1.2 目录；P6 为候选 | 私聊、群聊、设备绑定 E2EE、附件、联邦和 Mention |
| 支付 | [ANP-10：AP2 支付适配草案](chinese/application/10-ANP-智能体支付协议规范.md) | 草案 / 未发布；英文文档 v1.1、中文文档 v0.1 | 拟议的 ANP 支付适配、授权凭证、收据和交易流程；不是稳定支付互操作标准 |

[统一的 vNext 工作入口](vnext/README.md)收录中英文核心及消息协议，作为下一轮修订的起点。目前内容仍是 1.2 发布前草案快照，尚无 1.2 之后的新协议变更；当前规范引用使用上方正式路径。已废弃的历史 did:all 文档保留原有身份；当前 ANP-02 编号表示基于 DID 的身份认证协议。

### 即时消息 Profile

[ANP Messaging 1.2 中文索引](chinese/message/README.md)及其[英文镜像](message/README.md)包含全部九份文档：

| Profile | Wire 标识 | 文档 |
| --- | --- | --- |
| P1 | `anp.core.binding.v1` | [核心绑定](chinese/message/01-核心绑定.md) |
| P2 | `anp.identity.discovery.v1` | [身份与发现](chinese/message/02-身份与发现.md) |
| P3 | `anp.direct.base.v1` | [私聊基础语义](chinese/message/03-私聊基础语义.md) |
| P4 | `anp.group.base.v2` | [群组基础语义](chinese/message/04-群组基础语义.md) |
| P5 | `anp.direct.e2ee.v2` | [私聊端到端加密](chinese/message/05-私聊端到端加密.md) |
| P6 | `anp.group.e2ee.v2`，候选状态，待稳定 code point | [群组端到端加密](chinese/message/06-群组端到端加密.md) |
| P7 | `anp.attachment.v1` | [附件与对象传输](chinese/message/07-附件与对象传输.md) |
| P8 | `anp.federation.relay.v1` | [联邦与跨域](chinese/message/08-联邦与跨域.md) |
| P9 | v1 binding 扩展；不定义独立 `meta.profile` | [消息 Mention 扩展](chinese/message/09-消息Mention扩展.md) |

普通私聊、群聊、Mention 和附件操作仍使用业务 DID 或 Group DID 定址，设备 fan-out 留在接收域内部。P4 v2 引入 DID-only 成员关系和由 Host 协调的成员 DID 更新。P5/P6 v2 使用独立密码学设备端点，包括设备对 Direct Session 和同 DID 多个 MLS Leaf。实现不得把 E2EE v1 状态重新解释为 v2，也不得静默降级 E2EE v2 操作。P6 的候选状态及稳定注册 code point 发布门槛仍然有效。

### DID 兼容性附录

- [附录 A：did:wba `k1_` 兼容扩展](chinese/附录A：did-wba-k1_兼容扩展.md)
- [附录 B：原生 `did:web` 集成](chinese/附录B：与原生did-web-的兼容.md)：ANP-02 认证、既有 WNS/Web 兼容和消息组合，无需转为 WBA。

## 快速上手

- 设计方法无关的普通 API 认证时，阅读 [ANP-02](chinese/02-ANP-基于DID的身份认证协议.md)；它不依赖消息、Handle 或设备 Manifest。

- 如果想快速了解 ANP 概念和使用方式，请阅读 [ANP 入门指南](docs/chinese/ANP入门指南.md)。
- 实现 ANP 1.2 身份时，从 ANP-02 开始；WBA 方法验证阅读 [ANP-03](chinese/03-did-wba方法规范.md)，原生 `did:web` 集成阅读[附录 B](chinese/附录B：与原生did-web-的兼容.md)。
- 如果要发布智能体，请阅读 [ANP-07：智能体描述协议规范](chinese/07-ANP-智能体描述协议规范.md) 和 [ANP-08：智能体发现协议规范](chinese/08-ANP-智能体发现协议规范.md)。
- 如果要构建即时消息，请从 [ANP-09](chinese/09-ANP-端到端即时消息协议规范.md) 开始，再按需选择具体 Profile。
- 如果想运行 ANP 相关 Demo，请查看 [ANP 示例程序](docs/chinese/ANP示例程序.md)。

## 协议 SDK

ANP 的开源实现维护在 AgentConnect 仓库：

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect 重点提供 `did:wba`、身份认证、智能体描述、协议协商、安全通信和应用层协议的 SDK 支持。

## 开源实现：AWiki

AWiki 是基于 ANP 的智能体身份与消息开源实现，包含以下项目：

- [awiki-cli-rs2](https://github.com/AgentConnect/awiki-cli-rs2)：提供智能体身份与消息能力的 Rust SDK 和命令行客户端。
- [awiki-me](https://github.com/AgentConnect/awiki-me)：用于身份管理和消息通信的跨平台 Flutter 应用。
- [awiki-open-server](https://github.com/AgentConnect/awiki-open-server)：提供智能体身份与消息能力的开源服务端实现。

## 仓库结构

- `01-*.md`、`02-*.md`、`03-*.md`、`04-*.md`、`06-*.md`、`07-*.md`、`08-*.md`、`09-*.md`：英文核心文档，文档版本为 1.2，各自保留明确状态。
- `message/`：ANP Messaging 1.2 Profile 规范集与索引；P6 保留候选状态。
- `chinese/`：核心及消息规范的中文镜像，以及相关研究笔记。
- `vnext/`：统一的下一版协议工作目录，含 `vnext/chinese/`、`vnext/message/` 和 `vnext/chinese/message/`；初始内容是历史草案快照。原先分散的路径保留为兼容旧链接的冻结副本。
- `application/`：AP2 等独立版本化应用协议。
- `docs/`：指南、扩展阅读和社区运营文档。
- `blogs/`：技术文章与历史协议分析。
- `examples/`：ADP 资产、API 接口、[Messaging 1.2 示例](examples/message-vnext/README.cn.md)和 [ANP-02 向量](examples/did-authentication-vnext/README.cn.md)；示例目录保留 `-vnext` 名称以兼容既有路径。
- `images/`、`standard/`：共享图和标准化参考资料。

## 深入阅读

- [扩展阅读](docs/chinese/links.md)
- [ANP 技术白皮书](chinese/01-AgentNetworkProtocol技术白皮书.md)
- [AgentConnect 示例](https://github.com/agent-network-protocol/AgentConnect)

## 里程碑

- [x] 定义并实现身份认证与安全通信基础。
- [x] 发布 `did:wba` v1.1，默认支持 `e1_` Ed25519 路径绑定，并提供 `k1_` 与原生 `did:web` 兼容说明。
- [x] 定义 WNS Handle，作为 DID 智能体的人类可读命名层。
- [x] 发布智能体描述协议和智能体发现协议。
- [ ] 元协议仍为草案，待稳定后发布。
- [x] 将端到端即时消息拆分为总纲和九个可互操作 Profile。
- [x] 将 ANP-02 认证、ANP-03 身份连续性、ANP-04 命名及原生 Web 集成合入 ANP 1.2 文档。
- [x] 将全部九份消息文档及混合版本 Profile 目录合入 ANP 1.2。
- [ ] 完成 P6 v2 稳定版的 MLS ExtensionType 注册发布门槛。
- [x] 在应用层加入 AP2 支付适配草案。
- [ ] 持续推进 SDK 实现与示例对齐 ANP 1.2 规范集，并验证实际互操作。
- [ ] 持续推进标准化工作，并扩展更多领域应用协议。

## 联系我们

我们已经成立 ANP 开源技术社区，以开源社区方式推进 ANP 建设。诚挚邀请你加入社区。

- 邮箱：chgaowei@gmail.com
- 其他联系邮箱：zynetzy1@aliyun.com、2764433097@qq.com
- Discord：[https://discord.gg/sFjBKTY7sB](https://discord.gg/sFjBKTY7sB)
- 官网：[https://agent-network-protocol.com/](https://agent-network-protocol.com/)
- GitHub：[https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
- 微信：flow10240

## 贡献

我们欢迎任何形式的贡献，请参考 [CONTRIBUTING.cn.md](CONTRIBUTING.cn.md)。

### 贡献者

感谢所有为 Agent Network Protocol 项目做出贡献的人。

<!-- contributors:start -->
<a href="https://github.com/chgaowei"><img src="https://avatars.githubusercontent.com/u/1315207?v=4" width="64" height="64" alt="@chgaowei" /></a>
<a href="https://github.com/yagi2018"><img src="https://avatars.githubusercontent.com/u/45328391?v=4" width="64" height="64" alt="@yagi2018" /></a>
<a href="https://github.com/Julian-Zhu-STD"><img src="https://avatars.githubusercontent.com/u/238634316?v=4" width="64" height="64" alt="@Julian-Zhu-STD" /></a>
<a href="https://github.com/amdoi7"><img src="https://avatars.githubusercontent.com/u/91404105?v=4" width="64" height="64" alt="@amdoi7" /></a>
<a href="https://github.com/claude"><img src="https://avatars.githubusercontent.com/u/81847?v=4" width="64" height="64" alt="@claude" /></a>
<a href="https://github.com/han188"><img src="https://avatars.githubusercontent.com/u/15783771?v=4" width="64" height="64" alt="@han188" /></a>
<a href="https://github.com/khyao78"><img src="https://avatars.githubusercontent.com/u/59645954?v=4" width="64" height="64" alt="@khyao78" /></a>
<a href="https://github.com/yumh1"><img src="https://avatars.githubusercontent.com/u/238633659?v=4" width="64" height="64" alt="@yumh1" /></a>
<a href="https://github.com/AlfredZuo"><img src="https://avatars.githubusercontent.com/u/22234543?v=4" width="64" height="64" alt="@AlfredZuo" /></a>
<a href="https://github.com/dreamsea656"><img src="https://avatars.githubusercontent.com/u/11325618?v=4" width="64" height="64" alt="@dreamsea656" /></a>
<a href="https://github.com/dzpzp"><img src="https://avatars.githubusercontent.com/u/116531432?v=4" width="64" height="64" alt="@dzpzp" /></a>
<a href="https://github.com/SeaOceanO"><img src="https://avatars.githubusercontent.com/u/287401010?v=4" width="64" height="64" alt="@SeaOceanO" /></a>
<a href="https://github.com/Aas-ee"><img src="https://avatars.githubusercontent.com/u/81606643?v=4" width="64" height="64" alt="@Aas-ee" /></a>
<a href="https://github.com/cocolin2016"><img src="https://avatars.githubusercontent.com/u/70193777?v=4" width="64" height="64" alt="@cocolin2016" /></a>
<a href="https://github.com/kylezhang"><img src="https://avatars.githubusercontent.com/u/3679798?v=4" width="64" height="64" alt="@kylezhang" /></a>
<a href="https://github.com/Pentiumtime"><img src="https://avatars.githubusercontent.com/u/129046354?v=4" width="64" height="64" alt="@Pentiumtime" /></a>
<a href="https://github.com/PreciousNwakama"><img src="https://avatars.githubusercontent.com/u/65106738?v=4" width="64" height="64" alt="@PreciousNwakama" /></a>
<a href="https://github.com/seanzhang9999"><img src="https://avatars.githubusercontent.com/u/25133739?v=4" width="64" height="64" alt="@seanzhang9999" /></a>
<a href="https://github.com/SunZhao2468"><img src="https://avatars.githubusercontent.com/u/238628622?v=4" width="64" height="64" alt="@SunZhao2468" /></a>
<a href="https://github.com/xfq"><img src="https://avatars.githubusercontent.com/u/2863444?v=4" width="64" height="64" alt="@xfq" /></a>
<!-- contributors:end -->

- [查看完整贡献者名单](CONTRIBUTORS.cn.md)

## 许可证

本项目根目录许可证为 [Apache License 2.0（Apache-2.0）](LICENSE)。请保留适用的许可证、版权和署名声明。仓库版权声明现统一署名 ANP Community；作者和贡献者记录仍保留原有署名。

此项目级说明不替代历史草案、归档文档或第三方参考材料中的独立声明。再分发或项目捐赠前，应逐项核对这些材料；修改许可标签或版权声明不代表完成权利归属确认或第三方权利清理。

## 版权声明

Copyright (c) 2024 ANP Community
本文件依据 [Apache License 2.0](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
