# ANP入门指南

- 规范集：ANP 1.2

## 概述

### 什么是 ANP

ANP（Agent Network Protocol）是面向 Agentic Web 的开放协议栈。它的目标是让开放互联网上的智能体能够互相识别身份、发布能力、发现服务、协商可用接口、交换安全消息，并在应用层完成协作。

本指南对应当前工作区的 ANP 1.2 文档集，核心与消息规范覆盖：

- [ANP-02 通用 DID 请求认证](../../chinese/02-ANP-基于DID的身份认证协议.md)，支持 `did:wba` 与原生 `did:web`
- ANP-03 的 WBA 方法规则与身份连续性
- WNS（WBA Name Space）人类可读 Handle
- 智能体描述文档
- 智能体发现文档与搜索注册
- 端到端即时消息 Profile

元协议 ANP-06 仍为草案；P6 群组 E2EE 全文纳入目录，但仍为候选，临时 MLS ExtensionType `0xF0A1` 的稳定注册门槛未被取消。AP2 支付适配文档独立版本化，仍为草案／未发布。

规范文档状态不代表 SDK 或产品已经实现、通过符合性验证、开放公开能力发现或完成 tag / GitHub Release。

> 版本说明：`Version: 1.2` 表示规范/文档版本，不是 wire 版本。P1/P2/P3/P7/P8 保留 `.v1`，P4/P5/P6 采用既有 vNext 定义的 `.v2`；P9 保留 v1 binding 扩展，不定义独立 `meta.profile`。示例中的 `protocolVersion` 等字段按所属规范解释，不统一改号。

### 为什么需要 ANP

今天，大多数 AI 智能体与网络服务交互仍然依赖三种受限方式：模拟人类浏览器、使用平台专用 API，或停留在单一应用生态内。ANP 提供一种协议优先的替代路径：

- **互联互通**：不同域、不同平台的智能体可以互相认证、发现和通信。
- **原生接口**：智能体可以使用机器可读的描述、接口文档、JSON-RPC / OpenRPC 风格调用，而不是只能阅读面向人的网页。
- **稳定身份与命名**：DID 提供可验证的密码学身份，WNS Handle 提供适合人类使用的名称。
- **安全消息**：私聊、群聊、附件、联邦和端到端加密通过分层 Profile 进行定义。
- **开放实现路径**：ANP 复用 HTTP、DNS、TLS、JSON、JSON-LD、DID 和现有 Web 部署方式。

### 示例：跨平台酒店预订

假设一个个人智能助手需要预订酒店。没有 ANP 时，它可能需要爬取网页、通过平台账号登录，或接入某个供应商的专用 API。

使用 ANP 后：

1. 个人助手拥有自己的 DID，也可以拥有一个人类可读的 WNS Handle。
2. 它可以通过搜索、`.well-known/agent-descriptions` 或 Handle 发现酒店智能体。
3. 它读取酒店智能体的 Agent Description 文档，了解产品、服务和接口。
4. 它使用 ANP-02 对请求进行认证，按实际支持的方法验证 `did:wba` 或原生 `did:web` 身份；是否允许具体业务操作另由服务授权策略判断。
5. 它可以使用结构化接口完成预订，也可以使用自然语言接口处理特殊需求。
6. 如果需要支付或人工授权，接口描述会明确说明，并由对应应用协议处理。

### ANP 与 MCP、A2A 的关系

ANP 与其他智能体协议是互补关系：

- **MCP（Model Context Protocol）**：连接模型或 Agent Host 与工具、资源。
- **A2A 风格协议**：通常聚焦受控环境内的任务协作流程。
- **ANP**：聚焦开放互联网中的身份、命名、发现、安全通信和应用层协作。

一个简单判断方法是：连接工具用 MCP；受控工作流用企业协作协议；跨域发现和通信智能体用 ANP。

## 当前 ANP 架构

最新 README 中的架构将 ANP 已发布能力组织为现有互联网基础设施、两个核心协议层，以及具体领域的应用协议。

![ANP 协议架构](../../images/anp-architecture2.png)

### 开放互联网基础设施

ANP 不重建互联网协议栈，而是复用：

- HTTP / HTTPS 作为传输基础
- DNS 与域名作为可达性基础
- CA / TLS 作为 Web 安全根
- CDN 与托管基础设施承载静态文档
- 搜索引擎与爬虫进行公开发现

### 身份与加密通信层

这一层回答：**智能体是谁、对端如何验证它、消息如何被保护？**

它包括：

- 基于 W3C DID 的身份
- ANP-03 的 `did:wba` 方法规则，以及原生 `did:web` 方法绑定
- ANP-02 的 HTTP Message Signatures / JSON 认证信息承载
- DID Document 服务发现
- 签名密钥与密钥协商密钥分离
- 私聊和群聊端到端加密基础能力

### 应用协议层

这一层回答：**智能体能做什么、如何被发现、应该使用哪个应用协议？**

它包括：

- 智能体描述协议
- 智能体发现协议
- 即时消息 Profile
- 支付、授权、认证、交易等应用协议

### 元协议状态

ANP-06 仍是草案。更新后的方向是由 Agent Description 驱动的语义协商：

```text
Agent Description -> MetaProtocolInterface -> anp.get_capabilities -> anp.negotiate
```

在已发布路径中，智能体已经可以通过 DID 服务发现、Agent Description 文档、声明的接口和消息 Profile 互操作。除非实现明确支持，否则应把 `MetaProtocolInterface` 与 `anp.negotiate` 视为可选草案能力。

## 智能体如何连接

典型 ANP 连接路径如下：

```text
WNS Handle 或搜索结果
  -> DID
  -> DID Document
  -> AgentDescription / ANPMessageService
  -> 运行时能力
  -> 业务接口或消息 Profile
```

需要区分几个层次：

- **WNS Handle** 是人类可读名称。
- **DID** 是密码学身份锚点。
- **DID Document** 是验证方法和服务端点的权威来源。
- **Agent Description** 说明智能体公开信息和可用接口。
- **ANPMessageService** 是即时消息 Profile 使用的统一消息与交互端点。
- **运行时能力协商** 确认端点当前真正支持的能力。

## 身份：`did:wba`

<a id="authentication-model"></a>
### 先区分认证与 DID 方法

[ANP-02](../../chinese/02-ANP-基于DID的身份认证协议.md) 定义通用请求认证；[ANP-03](../../chinese/03-did-wba方法规范.md) 定义 WBA 的标识符、DID Document、解析、密钥绑定和迁移规则。[原生 did:web 集成附录](../../chinese/附录B：与原生did-web-的兼容.md) 说明 Web 身份如何直接使用同一认证与消息合同，无需转换为 WBA，也不承受 WBA 特有的根 proof 要求。

普通 API 认证不要求 WNS、消息 Profile 或 `deviceManifest`。下文的 WBA 示例不是对其他 DID 方法的额外限制；`did:webvh` 等方法须有相应方法绑定与实现支持，不能从 DID Core 兼容性推定。

### `did:wba` 提供什么

`did:wba` 是 ANP 的 Web-based DID 方法。它让智能体拥有去中心化身份，同时继续使用普通 Web 基础设施。

裸域名 DID：

```text
did:wba:example.com
```

解析到：

```text
https://example.com/.well-known/did.json
```

使用默认 `e1_` Profile 的路径型 DID：

```text
did:wba:example.com:user:alice:e1_<fingerprint>
```

解析到：

```text
https://example.com/user/alice/e1_<fingerprint>/did.json
```

如果域名包含端口，DID 中的冒号需要百分号编码：

```text
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
```

### 裸域名 DID 与路径型 DID

- **裸域名 DID**（如 `did:wba:example.com`）通常表示域名级主体或服务身份。
- **路径型 DID**（如 `did:wba:example.com:user:alice:e1_<fingerprint>`）表示域名下的具体主体。
- 新建路径型 DID 应使用默认的 `e1_` Ed25519 绑定指纹 Profile。
- 当绑定密钥变化时，路径型 DID 可能轮换；WNS Handle 可提供稳定的人类可读引用。稳定主体路径相同或 Handle 解析到新 DID，都不能独立证明权限连续性；须从此前可信的 DID 验证 ANP-03 迁移链，再按业务策略处理。

### 最小 DID Document 形态

DID Document 发布密钥和服务。在 ANP 中常见服务类型包括：

- `AgentDescription`：指向智能体 `ad.json` 文档。
- `ANPHandleService`：支持 WNS 双向绑定验证。
- `ANPMessageService`：暴露统一 ANP 消息 / 交互端点。

示例：

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/data-integrity/v2",
    "https://w3id.org/security/multikey/v1"
  ],
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "verificationMethod": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
      "type": "Multikey",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z6Mk..."
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z9h..."
    }
  ],
  "authentication": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "assertionMethod": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "keyAgreement": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1"
  ],
  "service": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#ad",
      "type": "AgentDescription",
      "serviceEndpoint": "https://example.com/agents/alice/ad.json"
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
      "type": "ANPHandleService",
      "serviceEndpoint": "https://example.com/.well-known/handle/alice"
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#anp",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://example.com/anp",
      "serviceDid": "did:wba:example.com"
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2025-01-01T00:00:00Z",
    "verificationMethod": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z..."
  }
}
```

### 身份认证流程

通用流程以 [ANP-02 HTTP 请求认证](../../chinese/02-ANP-基于DID的身份认证协议.md#http-binding) 为准：

1. 智能体 A 使用 `authentication` 授权的验证方法对应私钥签名，通过 `Signature-Input` 和 `Signature` 承载；有消息体时计算并签名覆盖 `Content-Digest`。
2. 智能体 B 按适用 DID 方法解析和验证 A 的 DID Document，检查 `keyid` 和认证密钥用途。
3. B 按实际 HTTP 请求重建签名基串，校验签名、摘要、签名覆盖范围、时间窗口和重放保护。
4. B 独立判断业务权限；认证成功不等于操作授权，也不证明已取得人类授权。
5. 如采用可选 Token 流程，后续请求按 ANP-02 和服务策略使用 Token；消息原发者证明仍另按 P1 及所属 Profile 验证。

## Name Service：WNS Handle

### 为什么需要 WNS

DID 是可靠的机器标识符，但不方便人类输入、记忆和传播。WNS（WBA Name Space）在 `did:wba` 之上提供稳定的人类可读命名层。

Handle 示例：

```text
alice.example.com
```

可选传播形式：

```text
wba://alice.example.com
```

Handle 解析为 DID，DID 再解析到 DID Document：

```text
Handle -> Handle Resolution Endpoint -> DID -> DID Document -> service
```

### Handle 解析端点

对于 `alice.example.com`，标准端点是：

```text
https://example.com/.well-known/handle/alice
```

响应示例：

```json
{
  "handle": "alice.example.com",
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "status": "active",
  "updated": "2025-01-01T00:00:00Z",
  "versionId": "42",
  "ttl": 300,
  "profile": {
    "type": "DIDSubjectProfile",
    "subject_did": "did:wba:example.com:user:alice:e1_<fingerprint>",
    "subject_type": "agent",
    "handle": "alice.example.com",
    "display_name": "Alice Agent",
    "description": "一个旅行规划智能体",
    "avatar_uri": "https://example.com/avatars/alice.png",
    "discoverability": "listed"
  }
}
```

以下规则描述 WBA 主线 WNS。原生 Web 使用[附录 B](../../chinese/附录B：与原生did-web-的兼容.md#legacy-web-handle)中的较弱域声明兼容模型，不能据此认定 `exact-handle`：

- 外层 `did` 是权威身份结果。
- `profile` 只是公开展示元数据。
- `profile` 不得用于身份认证、授权、路由、E2EE 绑定或服务端点选择。
- 安全敏感操作若使用 WBA Handle，必须通过 DID Document 中的 `ANPHandleService` 验证 Handle 到 DID 的绑定；普通 DID API 认证不要求 Handle。
- 需要信任具体 Handle 时必须获得 `exact-handle` 验证；仅 `provider-confirmed` 不足以满足高保证绑定。

## 智能体描述

### Agent Description 的作用

Agent Description 文档是智能体的公开入口页。其他智能体读取它以了解：

- 智能体名称、DID、所有者和描述
- 产品、服务、文档、媒体等公开信息资源
- 支持的自然语言接口和结构化接口
- 安全要求
- 可选的文档完整性 proof

ANP 的信息交互模式类似爬虫：智能体发布数据、描述和接口文档的 URL；其他智能体拉取这些资源，在本地推理，并仅在需要时调用合适接口。

### 信息与接口

Agent Description 使用两个核心概念：

- **Information**：对外可用资源，例如产品描述、服务描述、文档、视频或其他数据。
- **Interface**：与智能体交互的方式。
  - `NaturalLanguageInterface`：灵活的对话接口。
  - `StructuredInterface`：结构化 API 接口，例如 YAML 描述的 API、OpenRPC、JSON-RPC、MCP 兼容接口或 WebRTC。
  - `MetaProtocolInterface`：用于语义协商的可选草案扩展。

如果结构化接口能满足任务，智能体应优先使用结构化接口以提高精确性和效率。自然语言接口仍适用于开放式请求。

### Agent Description 示例

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "url": "https://grand-hotel.com/agents/hotel-assistant/ad.json",
  "name": "Grand Hotel Assistant",
  "did": "did:wba:grand-hotel.com:service:hotel-assistant:e1_<fingerprint>",
  "owner": {
    "type": "Organization",
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  },
  "description": "面向房间预订、礼宾服务、住客协助和消息通信的智能酒店助手。",
  "created": "2024-12-31T12:00:00Z",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "Infomations": [
    {
      "type": "Product",
      "description": "提供高级设施和个性化服务的豪华酒店客房。",
      "url": "https://grand-hotel.com/products/luxury-rooms.json"
    },
    {
      "type": "Information",
      "description": "酒店设施、便利设施、位置和政策信息。",
      "url": "https://grand-hotel.com/info/hotel-basic-info.json"
    }
  ],
  "interfaces": [
    {
      "type": "NaturalLanguageInterface",
      "protocol": "YAML",
      "version": "1.2.2",
      "url": "https://grand-hotel.com/api/nl-interface.yaml",
      "description": "用于酒店服务对话的自然语言接口。"
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://grand-hotel.com/api/booking-openrpc.json",
      "humanAuthorization": true,
      "description": "用于预订和预约管理的结构化接口。"
    },
    {
      "type": "MetaProtocolInterface",
      "profile": "anp.meta.negotiation.v1",
      "binding": "jsonrpc-2.0",
      "url": "https://grand-hotel.com/anp",
      "methods": ["anp.get_capabilities", "anp.negotiate"],
      "description": "可选的草案协商接口。"
    }
  ]
}
```

> 认证说明：示例保留 ANP-07 的 `didwba` 声明及其中历史的 `Authorization` 字段标签，不替代 ANP-02 的请求头规则。新签名请求使用 `Signature-Input`、`Signature` 和适用的 `Content-Digest`，不要从该声明推导旧 DIDWba Authorization 签名方案。

> 注意：当前智能体描述规范示例使用字段名 `Infomations`。实现时应遵循当前有效规范，同时为未来版本可能修正拼写做好兼容处理。

## 智能体发现

智能体发现定义智能体和搜索服务如何找到公开 Agent Description 文档。

### 主动发现

一个域名可以在以下路径发布所有公开 Agent Description URL：

```text
https://{domain}/.well-known/agent-descriptions
```

示例：

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "did": "https://w3id.org/did#",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Hotel Assistant",
      "@id": "https://example.com/agents/hotel-assistant/ad.json"
    },
    {
      "@type": "ad:AgentDescription",
      "name": "Customer Support Agent",
      "@id": "https://example.com/agents/support/ad.json"
    }
  ],
  "next": "https://example.com/.well-known/agent-descriptions?page=2"
}
```

客户端和搜索爬虫应沿 `next` 继续获取，直到没有下一页。

### 被动发现

在被动发现中，智能体主动把自己的 Agent Description URL 提交给搜索服务智能体。搜索服务的注册 API 由该搜索服务智能体自己的 Agent Description 文档描述。

典型流程：

1. 读取搜索服务智能体的 Agent Description。
2. 找到其注册接口。
3. 提交自己的 Agent Description URL。
4. 搜索服务验证、抓取并索引该描述。

### 基于 Handle 的入口

WNS Handle 解析也可以作为发现入口：

```text
alice.example.com -> DID -> DID Document -> AgentDescription service
```

但客户端不得直接从 Handle 推断服务端点；DID Document 仍是权威来源。

## 即时消息协议

ANP 端到端即时消息是一组用于跨域智能体消息通信的 Profile。它不是单一中心化聊天产品协议，而是定义智能体如何发现消息服务、发送私聊和群聊消息、保护内容、传输附件并跨域联邦。

### 核心思想

- **联邦而非中心化**：不同域托管自己的智能体和服务。
- **身份优先**：`agent_did` 和 `group_did` 是第一标识符。
- **服务发现优先**：消息端点通过 DID Document 中的 `ANPMessageService` 发现。
- **JSON-RPC 2.0 外层绑定**：请求使用 `jsonrpc`、`method`、`id` 和对象形式的 `params`。
- **通用 params 形态**：大多数方法使用 `params.meta`、可选 `params.auth` 和 `params.body`。
- **基础语义与 E2EE Overlay 分离**：仅传输保护的明文模式和端到端加密模式可以并存。
- **控制平面与数据平面分离**：附件使用 Manifest 和独立 HTTPS 对象传输。

### 统一 `ANPMessageService`

当前消息 Profile 期望 DID Document 对外暴露一个用于跨域交互的公共 `ANPMessageService`。实现内部可以拆分私聊、群组、密钥、对象和联邦组件，但对外这些能力收敛在统一服务端点之后。

以下示例只声明普通 DID 定址消息与附件能力，不声明 E2EE，因而不要求设备 Manifest：

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#message",
  "type": "ANPMessageService",
  "serviceEndpoint": "https://example.com/anp",
  "serviceDid": "did:wba:example.com",
  "profiles": [
    "anp.core.binding.v1",
    "anp.identity.discovery.v1",
    "anp.direct.base.v1",
    "anp.attachment.v1"
  ],
  "securityProfiles": [
    "transport-protected"
  ]
}
```

重要交互前，调用方应通过以下方法确认运行时能力：

```text
anp.get_capabilities
```

当 DID 静态提示与运行时能力结果不一致时，以运行时结果为准。

启用 `anp.direct.e2ee.v2` 或候选 `anp.group.e2ee.v2` 时，必须满足完整依赖与 P2 的当前 `deviceManifest` 资格规则；不能只给上述 Base 示例加一个 Profile 字符串，也不能把 v1 会话静默当作 v2。见[完整消息索引](../../chinese/message/README.md)及其多设备示例。

### 即时消息 Profile 索引

[ANP Messaging 1.2 索引](../../chinese/message/README.md) 包含九份文档。普通 Base 操作保持 DID/Group DID 定址；P4 v2 定义 DID-only 成员及 Host 协调的 DID 更新，P5/P6 v2 才引入密码学设备端点。P6 仍为候选，稳定发布须满足 MLS ExtensionType 注册门槛。

| Profile | 标识 / 状态 | 作用 |
| --- | --- | --- |
| [P1 核心绑定](../../chinese/message/01-核心绑定.md) | `anp.core.binding.v1` | JSON-RPC 2.0 绑定、`params` 结构、能力协商、幂等和错误模型 |
| [P2 身份与发现](../../chinese/message/02-身份与发现.md) | `anp.identity.discovery.v1` | Agent DID / Group DID、DID Document 解释规则和 `ANPMessageService` 发现 |
| [P3 私聊基础语义](../../chinese/message/03-私聊基础语义.md) | `anp.direct.base.v1` | `direct.send`、内容模型、回执、排序和发送方证明边界 |
| [P4 群组基础语义](../../chinese/message/04-群组基础语义.md) | `anp.group.base.v2` | 群生命周期、成员关系、群消息、群状态版本和 Host 排序 |
| [P5 私聊端到端加密](../../chinese/message/05-私聊端到端加密.md) | `anp.direct.e2ee.v2` | 使用 DID 绑定密钥材料和 Ratchet 思路的私聊 E2EE |
| [P6 群组端到端加密](../../chinese/message/06-群组端到端加密.md) | `anp.group.e2ee.v2`；候选 | 基于 MLS 的群组 E2EE 和群密码学状态 |
| [P7 附件与对象传输](../../chinese/message/07-附件与对象传输.md) | `anp.attachment.v1` | 附件 Manifest、对象服务、上传 / 下载 ticket 和对象级加密 |
| [P8 联邦与跨域](../../chinese/message/08-联邦与跨域.md) | `anp.federation.relay.v1` | 跨域服务调用、路由、中继和结果见证 |
| [P9 消息 Mention 扩展](../../chinese/message/09-消息Mention扩展.md) | v1 binding；无独立 Profile | 结构化群消息 mention 和 selector 语义 |

推荐阅读顺序：先读 ANP-02 及适用方法绑定，再读 P1/P2、P3/P4、P5/P6，最后按需阅读 P7/P8/P9。

## 协议 SDK：AgentConnect

ANP 的开源 SDK 和参考实现维护在 AgentConnect：

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect 提供身份、认证、proof、WNS、Agent Description、OpenRPC / JSON-RPC、爬取、AP2、E2EE 和示例支持。

下表仅保留 2026-06-27 的 SDK 包导航快照，不是当前注册表状态或 ANP 1.2 符合性清单。实际包名、版本、Profile 支持和启用状态须以 SDK 仓库及对应实现验证为准：

| 语言 | 包 / 模块 | 如何开始 | 状态 |
| --- | --- | --- | --- |
| Python | `anp` | `pip install anp` 或 `pip install "anp[api]"` | 稳定发布 SDK |
| Go | `github.com/agent-network-protocol/anp/golang` | `go get github.com/agent-network-protocol/anp/golang@latest` | 稳定发布 SDK |
| Rust | `anp` | `cargo add anp` | 稳定发布 SDK |
| Dart | `anp` | `dart pub add anp` | 已发布 SDK |
| TypeScript | `@anp/typescript-sdk` workspace | 从 `typescript/ts_sdk` 源码构建 | 预览 / 本地源码 |
| Java | `com.agentconnect:anp4j` 和 Spring Boot starter | 从 `java` 源码构建 | 本地 SDK |

### 使用 OpenANP 创建最小 Python 智能体

```bash
pip install "anp[api]"
```

```python
from fastapi import FastAPI
from anp.openanp import AgentConfig, anp_agent, interface

@anp_agent(AgentConfig(
    name="Calculator",
    did="did:wba:example.com:calculator:e1_<fingerprint>",
    prefix="/agent",
    description="A simple calculator agent",
))
class CalculatorAgent:
    @interface
    async def add(self, a: int, b: int) -> int:
        return a + b

app = FastAPI(title="Calculator Agent")
app.include_router(CalculatorAgent.router())
```

常见自动生成端点：

| 端点 | 用途 |
| --- | --- |
| `GET /agent/ad.json` | Agent Description 文档 |
| `GET /agent/interface.json` | OpenRPC 接口文档 |
| `POST /agent/rpc` | JSON-RPC 2.0 方法调用 |

## 推荐阅读路径

1. 阅读 [README.cn](../../README.cn.md) 了解当前规范索引和架构。
2. 先阅读 [ANP-02：基于 DID 的身份认证](../../chinese/02-ANP-基于DID的身份认证协议.md)，再按方法阅读 [ANP-03：did:wba](../../chinese/03-did-wba方法规范.md) 或[原生 did:web 集成附录](../../chinese/附录B：与原生did-web-的兼容.md)；需要人类可读命名时再阅读 [ANP-04：WNS](../../chinese/04-ANP-基于DID-WBA的命名空间规范.md)。
3. 阅读 [ANP-07：智能体描述](../../chinese/07-ANP-智能体描述协议规范.md) 和 [ANP-08：智能体发现](../../chinese/08-ANP-智能体发现协议规范.md) 发布和发现智能体。
4. 构建消息能力时阅读 [ANP-09](../../chinese/09-ANP-端到端即时消息协议规范.md) 和各消息 Profile。
5. 使用 [AgentConnect](https://github.com/agent-network-protocol/AgentConnect) 构建或测试可运行实现。

### ANP流程详解

ANP整体流程如下：

![](/images/anp-flow.png)

ANP流程主要包括以下几个步骤：

1. **智能体发现**：搜索引擎通过智能体发现机制（`.well-known/agent-descriptions`）爬取智能体B的信息，包括其描述文档URL、名称等基本信息。

2. **智能体搜索**：智能体A通过搜索引擎找到智能体B的描述文档URL。这一步使得智能体能够在不知道对方具体域名的情况下，通过语义搜索找到合适的服务提供者。

3. **身份验证请求**：智能体A使用自己的私钥对请求进行签名，并携带自己的DID标识符，向智能体B请求描述文档或服务。签名确保了请求的真实性和完整性。

4. **身份验证**：智能体B接收到请求后，根据请求中的DID标识符获取智能体A的DID文档，从中提取公钥，并验证请求签名的有效性，确认智能体A的身份。

5. **服务交互**：身份验证及独立的业务授权检查通过后，智能体B返回请求的数据或服务响应。智能体A根据返回的数据完成任务，如预订酒店、查询信息等。整个过程基于标准化的接口和数据格式，确保了跨平台互操作性。

这种基于DID的身份验证和标准化描述文档的方式，使得智能体能够在互联网上安全、高效地相互发现和交互，无需依赖中心化平台。
