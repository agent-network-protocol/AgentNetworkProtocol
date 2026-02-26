# ANP-端到端即时消息协议规范 (Draft)

备注：当前此规范仍是草案版本，会有进一步的优化与迭代。

## 摘要

本规范定义了 ANP 端到端即时消息协议，这是一个基于 HTTP 和 JSON-RPC 2.0 的即时消息协议，支持私聊、群聊和端到端加密（E2EE）通信。协议使用 `did:wba` 作为身份标识，采用 DID WBA 认证机制进行身份验证。

本规范替代原有的 [04-基于DID的端到端加密通信技术协议](chinese/message/04-基于did的端到端加密通信技术协议.md) 和 [05-基于DID的消息服务协议](chinese/message/05-基于did的消息服务协议.md) 中基于 WebSocket 的方案，在保留 E2EE 核心加密逻辑的基础上，将传输层协议统一为 HTTP + JSON-RPC 2.0。

## 1. 背景

### 1.1 现有协议回顾

ANP 项目在早期阶段设计了两个消息相关的协议规范：

- **04-基于DID的端到端加密通信技术协议**：定义了基于 WebSocket 的 E2EE 加密通信方案，包括 SourceHello、DestinationHello、Finished 握手消息以及基于 ECDHE 的短期密钥协商机制。
- **05-基于DID的消息服务协议**：定义了基于 WebSocket 的消息路由和转发机制，包括 Message Proxy 连接、router 注册、心跳保活等。

原有的实现过于复杂，现在实现一个简单的方案。

### 1.2 设计动机

HTTP + JSON-RPC 2.0 方案具有以下优势：

1. **简单可靠**：HTTP 是最广泛支持的应用层协议，任何编程语言和平台都有成熟的 HTTP 客户端库。
2. **标准化**：JSON-RPC 2.0 是成熟的远程过程调用协议，定义了统一的请求/响应格式和错误码体系。
3. **无状态**：HTTP 请求-响应模型天然无状态，不需要维护长连接，简化了服务端的实现。
4. **易于扩展**：基于 HTTP 的方案更容易集成 RESTful 生态系统中的认证、限流、监控等基础设施。
5. **防火墙友好**：HTTP/HTTPS 流量在绝大多数网络环境中畅通无阻。

### 1.3 与已有协议的关系

本规范（09）替代原有的 04 和 05 协议：

- **替代 04（E2EE 协议）**：E2EE 核心加密逻辑不变（ECDHE 密钥协商、AES-GCM 加密、签名验证），但将传输方式从 WebSocket 独立消息改为通过 JSON-RPC `send` 方法的 `content` 字段承载 E2EE 协议数据。
- **替代 05（消息服务协议）**：消息发送和接收从 WebSocket 长连接改为 HTTP JSON-RPC 调用，去除了 Message Proxy、router 注册等机制。

## 2. 方案概述

### 2.1 架构设计

整体架构采用消息服务器中转模型：

```plaintext
+-------+          +----------------+          +----------------+          +-------+
|       |  HTTP    |                |   HTTP   |                |  HTTP    |       |
| Agent | <------> | Message Server | <------> | Message Server | <------> | Agent |
|  (A)  | JSON-RPC |     (A's)      |          |     (B's)      | JSON-RPC |  (B)  |
+-------+          +----------------+          +----------------+          +-------+
```

- **Agent**：消息的发送者和接收者，通过 `did:wba` 进行身份标识。
- **Message Server**：为 Agent 提供消息收发服务，包括消息存储、收件箱管理和群组管理。
- Agent 与其所属的 Message Server 之间通过 HTTP JSON-RPC 2.0 协议通信。
- Message Server 之间的通信协议不在本规范的范围内。

### 2.2 核心特性

| 特性 | 说明 |
|------|------|
| **传输协议** | HTTP + JSON-RPC 2.0 |
| **内容格式** | `application/json` |
| **身份标识** | `did:wba` (Decentralized Identifier) |
| **认证方式** | DID WBA 认证（详见 [DID:WBA 方法设计规范](03-did-wba-method-design-specification.md)） |
| **消息类型** | 私聊、群聊 |
| **E2EE 支持** | 基于 ECDHE 的端到端加密（仅私聊） |

### 2.3 设计原则

1. **简单性**：使用成熟、广泛支持的标准协议（HTTP、JSON-RPC 2.0、JSON）。
2. **安全性**：支持端到端加密，服务端透明转发加密消息，无法读取密文。
3. **开放性**：基于 DID 标准的身份标识，支持跨平台、跨域的消息互通。
4. **实用性**：API 设计面向实际应用场景，包含完整的消息管理功能。

## 3. 身份标识与认证

### 3.1 DID 标识格式

本协议使用 `did:wba` 方法进行身份标识（详见 [DID WBA 方法设计规范](03-did-wba-method-design-specification.md)）。

**用户 DID 格式：**

```
did:wba:{domain}:user:{username}
```

示例：`did:wba:example.com:user:alice`

**群组 DID 格式：**

```
did:wba:{domain}:group:{group_id}
```

示例：`did:wba:example.com:group:group_dev`

当 DID 不存在时，服务端返回错误码 `-32002`（资源不存在）。

### 3.2 认证方式

本协议采用 ANP 统一的 DID WBA 认证机制进行身份验证。完整的认证流程和技术细节详见 [DID:WBA 方法设计规范](03-did-wba-method-design-specification.md)。

## 4. JSON-RPC 2.0 传输协议

### 4.1 请求/响应格式

所有 API 采用 JSON-RPC 2.0 协议，通过 HTTP POST 方法调用。

**请求格式：**

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

**成功响应格式：**

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": 1
}
```

**错误响应格式：**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "错误描述",
    "data": null
  },
  "id": 1
}
```

### 4.2 错误码定义

本协议使用 JSON-RPC 2.0 标准错误码，并扩展了业务错误码：

| 错误码 | 含义 | 说明 |
|--------|------|------|
| -32700 | JSON 解析错误 | 请求体不是合法的 JSON |
| -32600 | 无效请求 | 请求不符合 JSON-RPC 2.0 格式 |
| -32601 | 方法不存在 | 请求的方法名未定义 |
| -32602 | 参数校验失败 | 请求参数不合法（包括 E2EE 约束校验） |
| -32603 | 内部错误 | 服务端内部错误 |
| -32000 | 未认证 | 需要认证但未提供有效凭证 |
| -32001 | 无权限 | 已认证但无权执行该操作 |
| -32002 | 资源不存在 | 请求的资源（DID、消息等）不存在 |
| -32003 | 资源冲突 | 资源已存在或状态冲突 |
| -32004 | 业务校验错误 | 业务规则校验未通过 |
| -32005 | 限流 | 请求过于频繁，被服务端限流 |

### 4.3 传输方式

- **协议**：HTTP/HTTPS POST
- **内容类型**：`Content-Type: application/json`
- **字符编码**：UTF-8

所有接口均通过 HTTP POST 方法调用，请求体为 JSON-RPC 2.0 格式的 JSON 对象。

## 5. 智能体描述协议集成

本节描述如何在智能体描述（Agent Description, AD）文档中声明 E2EE 即时消息能力，使其他智能体能够自动发现并与 E2EE IM 服务进行交互。ANP E2EE IM 协议作为内置协议类型纳入智能体描述协议框架（完整的 AD 规范详见[智能体描述协议规范](chinese/07-ANP-智能体描述协议规范.md)）。

### 5.1 在 AD 文档中声明 E2EE IM 支持

支持 ANP E2EE IM 协议的智能体应在其 AD 文档的 `interfaces` 数组中包含相应条目。由于 E2EE IM 协议是 ANP 内置协议，接口描述使用 `content` 字段进行内联端点和能力声明，而非通过 `url` 引用外部文件。

**AD 文档示例：**

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "name": "示例聊天智能体",
  "did": "did:wba:example.com:user:alice",
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "ANP-E2EE-IM",
      "version": "1.0",
      "description": "ANP E2EE 即时消息协议，支持私聊、群聊和端到端加密通信。",
      "content": {
        "endpoints": [
          {
            "path": "/api/v1/messages/rpc",
            "description": "消息服务端点，用于发送、接收和管理消息，包括 E2EE 加密消息"
          },
          {
            "path": "/api/v1/groups/rpc",
            "description": "群组服务端点，用于群组管理和群组消息"
          }
        ],
        "e2ee": {
          "supported_versions": ["1.0"],
          "cipher_suites": ["TLS_AES_128_GCM_SHA256"],
          "supported_groups": ["secp256r1"],
          "description": "E2EE 能力：ECDHE 密钥交换、AES-GCM 加密，仅支持私聊"
        }
      }
    }
  ]
}
```

### 5.2 字段说明

**接口级别字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定为 `"StructuredInterface"` |
| protocol | string | 是 | 固定为 `"ANP-E2EE-IM"`，标识本协议 |
| version | string | 是 | 协议版本号（如 `"1.0"`） |
| description | string | 否 | 接口的可读描述 |
| content | object | 是 | 内联描述端点和 E2EE 能力 |

**content.endpoints 元素：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | API 端点路径（如 `/api/v1/messages/rpc`） |
| description | string | 否 | 端点功能描述 |

**content.e2ee 字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| supported_versions | array | 是 | 支持的 E2EE 协议版本列表 |
| cipher_suites | array | 是 | 支持的加密套件列表（如 `["TLS_AES_128_GCM_SHA256"]`） |
| supported_groups | array | 是 | 支持的椭圆曲线组列表（如 `["secp256r1"]`） |
| description | string | 否 | E2EE 能力的可读描述 |

## 6. 消息服务 API 定义

本协议定义了 10 个 JSON-RPC 方法，分布在两个服务端点上。

### 6.1 消息接口

**端点：** `POST /api/v1/messages/rpc`

#### 6.1.1 send — 发送消息

发送消息（私聊或群聊），同时也是 E2EE 握手和加密消息的统一传输方法。

**认证：** optional（已认证用户会校验 sender 身份一致性）

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sender_did | string | 是 | 发送者 DID |
| sender_name | string | 否 | 发送者名称 |
| receiver_did | string | 条件 | 接收者 DID（私聊，与 group_did 互斥） |
| group_did | string | 条件 | 群组 DID（群发，与 receiver_did 互斥） |
| content | string | 是 | 消息内容（普通消息为明文，E2EE 消息为 JSON 序列化字符串） |
| type | string | 否 | 消息类型，默认 `text` |
| timestamp | datetime | 否 | 客户端发送时间戳 |

**type 可选值：**

| type | 类别 | 说明 |
|------|------|------|
| `text` | 普通 | 文本消息 |
| `image` | 普通 | 图片消息 |
| `file` | 普通 | 文件消息 |
| `e2ee_hello` | E2EE | 握手消息（SourceHello 或 DestinationHello） |
| `e2ee_finished` | E2EE | 握手完成确认 |
| `e2ee` | E2EE | 加密消息 |
| `e2ee_error` | E2EE | E2EE 错误通知 |

**E2EE 约束：**
- E2EE 消息（type 为 `e2ee_hello`、`e2ee_finished`、`e2ee`、`e2ee_error`）**仅支持私聊**
- 必须指定 `receiver_did`，不能指定 `group_did`
- 违反此约束将返回 `-32602` 参数校验失败

**请求示例（私聊）：**

```json
{
  "jsonrpc": "2.0",
  "method": "send",
  "params": {
    "sender_did": "did:wba:example.com:user:alice",
    "receiver_did": "did:wba:example.com:user:bob",
    "content": "你好",
    "type": "text"
  },
  "id": 1
}
```

**请求示例（群聊）：**

```json
{
  "jsonrpc": "2.0",
  "method": "send",
  "params": {
    "sender_did": "did:wba:example.com:user:alice",
    "group_did": "did:wba:example.com:group:group_dev",
    "content": "大家好"
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "msg_001",
    "sender_did": "did:wba:example.com:user:alice",
    "sender_name": null,
    "receiver_did": "did:wba:example.com:user:bob",
    "group_did": null,
    "content": "你好",
    "type": "text",
    "sent_at": null,
    "created_at": "2024-01-15T10:30:01"
  },
  "id": 1
}
```

E2EE 消息的请求示例详见第 8 节。

#### 6.1.2 get_detail — 获取消息详情

获取指定消息的详细信息。

**认证：** none

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message_id | string | 是 | 消息 ID |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_detail",
  "params": {
    "message_id": "msg_001"
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "msg_001",
    "sender_did": "did:wba:example.com:user:alice",
    "sender_name": null,
    "receiver_did": "did:wba:example.com:user:bob",
    "group_did": null,
    "content": "你好",
    "type": "text",
    "sent_at": null,
    "created_at": "2024-01-15T10:30:01"
  },
  "id": 1
}
```

#### 6.1.3 get_inbox — 查询收件箱

查询当前用户的收件箱消息。

**认证：** optional

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_did | string | 是 | 当前用户 DID |
| since | datetime | 否 | 只返回此时间之后的消息 |
| skip | int | 否 | 跳过条数，默认 0 |
| limit | int | 否 | 返回条数，默认 50，最大 100 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_inbox",
  "params": {
    "user_did": "did:wba:example.com:user:bob"
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "messages": [
      {
        "id": "msg_001",
        "sender_did": "did:wba:example.com:user:alice",
        "sender_name": "Alice",
        "sender_avatar": "https://example.com/avatar/alice.png",
        "receiver_did": "did:wba:example.com:user:bob",
        "group_did": null,
        "group_name": null,
        "content": "你好",
        "type": "text",
        "sent_at": null,
        "created_at": "2024-01-15T10:30:00",
        "is_read": false
      }
    ],
    "total": 1,
    "has_more": false
  },
  "id": 1
}
```

#### 6.1.4 mark_read — 标记已读

标记指定消息为已读。

**认证：** optional

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_did | string | 是 | 当前用户 DID |
| message_ids | array | 是 | 要标记为已读的消息 ID 列表 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "mark_read",
  "params": {
    "user_did": "did:wba:example.com:user:bob",
    "message_ids": ["msg_001", "msg_002"]
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "updated_count": 2
  },
  "id": 1
}
```

#### 6.1.5 get_history — 获取会话历史

获取私聊或群聊的消息历史记录。

**认证：** optional

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_did | string | 是 | 当前用户 DID |
| peer_did | string | 条件 | 对方用户 DID（私聊，与 group_did 互斥） |
| group_did | string | 条件 | 群组 DID（群聊，与 peer_did 互斥） |
| since | datetime | 否 | 增量查询起始时间 |
| skip | int | 否 | 跳过条数，默认 0 |
| limit | int | 否 | 返回条数，默认 50 |

**请求示例（私聊历史）：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_history",
  "params": {
    "user_did": "did:wba:example.com:user:alice",
    "peer_did": "did:wba:example.com:user:bob"
  },
  "id": 1
}
```

**请求示例（群聊历史）：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_history",
  "params": {
    "user_did": "did:wba:example.com:user:alice",
    "group_did": "did:wba:example.com:group:group_dev"
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "messages": [
      {
        "id": "msg_001",
        "sender_did": "did:wba:example.com:user:alice",
        "sender_name": "Alice",
        "receiver_did": "did:wba:example.com:user:bob",
        "group_did": null,
        "content": "你好",
        "type": "text",
        "sent_at": null,
        "created_at": "2024-01-15T10:30:00"
      }
    ],
    "total": 1
  },
  "id": 1
}
```

#### 6.1.6 get_batch_history — 批量获取群聊历史

批量获取多个群聊的消息历史。

**认证：** optional

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_did | string | 是 | 当前用户 DID |
| queries | array | 是 | 各群查询参数 `[{group_did, since?}]` |
| limit | int | 否 | 每个群返回条数上限，默认 20 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_batch_history",
  "params": {
    "user_did": "did:wba:example.com:user:alice",
    "queries": [
      {"group_did": "did:wba:example.com:group:group_1"},
      {"group_did": "did:wba:example.com:group:group_2", "since": "2024-01-15T00:00:00"}
    ],
    "limit": 20
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "groups": [
      {
        "group_id": "group_1",
        "messages": [...],
        "total": 5
      },
      {
        "group_id": "group_2",
        "messages": [...],
        "total": 3
      }
    ]
  },
  "id": 1
}
```

#### 6.1.7 delete_inbox — 删除收件箱消息

删除收件箱中的指定消息。

**认证：** optional

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_did | string | 是 | 当前用户 DID |
| message_ids | array | 是 | 要删除的消息 ID 列表 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "delete_inbox",
  "params": {
    "user_did": "did:wba:example.com:user:bob",
    "message_ids": ["msg_001"]
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "deleted_count": 1
  },
  "id": 1
}
```

### 6.2 群组接口

**端点：** `POST /api/v1/groups/rpc`

#### 6.2.1 list — 获取公开群组列表

获取平台上所有公开的群组。

**认证：** none

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | int | 否 | 跳过条数，默认 0 |
| limit | int | 否 | 返回条数，默认 50，最大 100 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "list",
  "params": {},
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "groups": [
      {
        "did": "did:wba:example.com:group:group_dev",
        "name": "开发群",
        "description": "开发者交流群",
        "avatar": null,
        "is_public": true,
        "created_at": "2024-01-15T10:00:00"
      }
    ],
    "total": 1
  },
  "id": 1
}
```

#### 6.2.2 get_detail — 获取群组详情

获取指定群组的详细信息。

**认证：** none

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group_did | string | 是 | 群组 DID |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_detail",
  "params": {
    "group_did": "did:wba:example.com:group:group_dev"
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "did": "did:wba:example.com:group:group_dev",
    "name": "开发群",
    "description": "开发者交流群",
    "avatar": null,
    "is_public": true,
    "created_at": "2024-01-15T10:00:00"
  },
  "id": 1
}
```

#### 6.2.3 get_messages — 获取群组消息

获取指定群组的消息列表。

**认证：** none

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group_did | string | 是 | 群组 DID |
| limit | int | 否 | 返回条数，默认 50，最大 100 |
| since | datetime | 否 | 只返回此时间之后的消息 |

**请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "get_messages",
  "params": {
    "group_did": "did:wba:example.com:group:group_dev",
    "limit": 20
  },
  "id": 1
}
```

**响应示例：**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "messages": [
      {
        "id": "msg_010",
        "sender_did": "did:wba:example.com:user:alice",
        "sender_name": "Alice",
        "receiver_did": null,
        "group_did": "did:wba:example.com:group:group_dev",
        "content": "大家好",
        "type": "text",
        "sent_at": null,
        "created_at": "2024-01-15T10:30:00"
      }
    ],
    "total": 1
  },
  "id": 1
}
```

## 7. 消息类型定义

### 7.1 普通消息类型

| 类型 | 说明 | content 内容 |
|------|------|-------------|
| `text` | 文本消息 | 明文文本 |
| `image` | 图片消息 | 图片 URL 或 Base64 编码 |
| `file` | 文件消息 | 文件 URL 或文件元数据 |

### 7.2 E2EE 消息类型

所有 E2EE 消息通过 `send` 方法的 `content` 字段传输，content 内容为 JSON 序列化后的字符串。服务端**不解析**也**不修改** content 内容，直接透明转发。

| type | 说明 | content 结构 |
|------|------|-------------|
| `e2ee_hello` | 握手消息 | SourceHello 或 DestinationHello（通过 `e2ee_type` 字段区分） |
| `e2ee_finished` | 握手完成确认 | Finished（含 `session_id` 和 `verify_data`） |
| `e2ee` | 加密消息 | 含 `secret_key_id`、`original_type`、`encrypted`（AES-GCM 密文） |
| `e2ee_error` | E2EE 错误通知 | 含 `error_code` 和 `secret_key_id` |

E2EE content 结构的详细定义见第 8.3 节。

## 8. 端到端加密（E2EE）协议

### 8.1 概述

本协议的端到端加密方案基于 ECDHE（Elliptic Curve Diffie-Hellman Ephemeral）密钥交换协议，支持两个 Agent 之间的加密通信。核心加密算法与 [04-基于DID的端到端加密通信技术协议](chinese/message/04-基于did的端到端加密通信技术协议.md) 一致。

**关键特性：**

- **仅支持私聊**：E2EE 消息不支持群聊场景
- **服务端透明转发**：所有 E2EE 数据嵌入 `send` 方法的 `content` 字段，服务端不解析或修改加密数据
- **统一传输**：E2EE 握手消息和加密消息都通过 `send` 方法的 `type` 字段区分类型

### 8.2 E2EE 握手流程

E2EE 握手通过 `send` 方法交换握手消息，完成密钥协商后进入加密通信阶段。

```plaintext
Alice                           Message Server                          Bob
  |                                   |                                   |
  |  send(type=e2ee_hello)            |                                   |
  |  content=SourceHello              |                                   |
  |---------------------------------->|  send(type=e2ee_hello)            |
  |                                   |  content=SourceHello              |
  |                                   |---------------------------------->|
  |                                   |                                   |
  |                                   |  send(type=e2ee_hello)            |
  |                                   |  content=DestinationHello         |
  |  send(type=e2ee_hello)            |<----------------------------------|
  |  content=DestinationHello         |                                   |
  |<----------------------------------|  send(type=e2ee_finished)         |
  |                                   |  content=Finished                 |
  |  send(type=e2ee_finished)         |<----------------------------------|
  |  content=Finished                 |                                   |
  |<----------------------------------|                                   |
  |                                   |                                   |
  |  send(type=e2ee_finished)         |                                   |
  |  content=Finished                 |                                   |
  |---------------------------------->|  send(type=e2ee_finished)         |
  |                                   |  content=Finished                 |
  |                                   |---------------------------------->|
  |                                   |                                   |
  |           [双方会话激活，开始加密通信]                                    |
  |                                   |                                   |
  |  send(type=e2ee)                  |                                   |
  |  content=加密消息                  |                                   |
  |---------------------------------->|  send(type=e2ee)                  |
  |                                   |  content=加密消息                  |
  |                                   |---------------------------------->|
  |                                   |                                   |
```

**握手流程说明：**

1. **Alice 发送 SourceHello**：Alice 发起 E2EE 握手，通过 `send` 方法发送 `type=e2ee_hello` 消息，content 中携带 SourceHello 数据（包含公钥、支持的加密参数、签名等）。
2. **Bob 回复 DestinationHello + Finished**：Bob 收到 SourceHello 后，选择加密参数，通过 `send` 方法回复 DestinationHello（`type=e2ee_hello`）和 Finished（`type=e2ee_finished`）两条消息。
3. **Alice 回复 Finished**：Alice 收到 DestinationHello 后计算共享密钥，发送 Finished 消息。
4. **双方会话激活**：Bob 处理 Alice 的 Finished 消息后，双方密钥协商完成，会话激活。
5. **加密通信**：双方使用 `type=e2ee` 类型的消息互发加密内容。

### 8.3 E2EE content 结构定义

所有 E2EE 数据都通过 `send` 方法的 `content` 字段传输（JSON 序列化字符串）。

#### 8.3.1 SourceHello（e2ee_type=source_hello）

由 E2EE 会话发起方发送，包含身份信息、公钥和支持的加密参数。

**字段定义：**

| 字段 | 类型 | 说明 |
|------|------|------|
| e2ee_type | string | 固定为 `"source_hello"` |
| version | string | 协议版本号 |
| session_id | string | 会话 ID，16 位随机字符串 |
| source_did | string | 发送者 DID |
| destination_did | string | 接收者 DID |
| random | string | 32 位随机字符串，确保握手唯一性，参与密钥交换 |
| supported_versions | array | 支持的协议版本列表 |
| cipher_suites | array | 支持的加密套件列表 |
| supported_groups | array | 支持的椭圆曲线组 |
| key_shares | array | 密钥交换公钥信息列表 |
| verification_method | object | 发送者 DID 对应的公钥 |
| proof | object | 消息签名 |

**key_shares 元素结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| group | string | 椭圆曲线组（如 `secp256r1`） |
| expires | number | 密钥有效期（秒） |
| key_exchange | string | 用于密钥交换的公钥（十六进制） |

**verification_method 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 验证方法 ID |
| type | string | 公钥类型（如 `EcdsaSecp256r1VerificationKey2019`） |
| public_key_hex | string | 公钥十六进制表示 |

**proof 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 签名类型（如 `EcdsaSecp256r1Signature2019`） |
| created | string | 签名创建时间（ISO 8601 UTC） |
| verification_method | string | 签名使用的验证方法 ID |
| proof_value | string | 签名值（Base64URL 编码） |

**content 示例（JSON 序列化前）：**

```json
{
  "e2ee_type": "source_hello",
  "version": "1.0",
  "session_id": "abc123session",
  "source_did": "did:wba:example.com:user:alice",
  "destination_did": "did:wba:example.com:user:bob",
  "random": "b7e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6",
  "supported_versions": ["1.0"],
  "cipher_suites": ["TLS_AES_128_GCM_SHA256"],
  "supported_groups": ["secp256r1"],
  "key_shares": [
    {
      "group": "secp256r1",
      "expires": 86400,
      "key_exchange": "04a34b..."
    }
  ],
  "verification_method": {
    "id": "did:wba:example.com:user:alice#keys-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "public_key_hex": "04a34b..."
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "verification_method": "did:wba:example.com:user:alice#keys-1",
    "proof_value": "eyJhbGci..."
  }
}
```

**send 请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "send",
  "params": {
    "sender_did": "did:wba:example.com:user:alice",
    "receiver_did": "did:wba:example.com:user:bob",
    "content": "{\"e2ee_type\":\"source_hello\",\"version\":\"1.0\",\"session_id\":\"abc123\",\"source_did\":\"did:wba:example.com:user:alice\",\"destination_did\":\"did:wba:example.com:user:bob\",\"random\":\"...\",\"supported_versions\":[\"1.0\"],\"cipher_suites\":[\"TLS_AES_128_GCM_SHA256\"],\"supported_groups\":[\"secp256r1\"],\"key_shares\":[{\"group\":\"secp256r1\",\"expires\":86400,\"key_exchange\":\"...\"}],\"verification_method\":{\"id\":\"...\",\"type\":\"EcdsaSecp256r1VerificationKey2019\",\"public_key_hex\":\"...\"},\"proof\":{\"type\":\"EcdsaSecp256r1Signature2019\",\"created\":\"...\",\"verification_method\":\"...\",\"proof_value\":\"...\"}}",
    "type": "e2ee_hello"
  },
  "id": 1
}
```

#### 8.3.2 DestinationHello（e2ee_type=destination_hello）

由 E2EE 会话接收方回复，包含选定的加密参数。

**字段定义：**

与 SourceHello 类似，区别在于：

| 字段 | 类型 | 说明 |
|------|------|------|
| e2ee_type | string | 固定为 `"destination_hello"` |
| version | string | 协议版本号 |
| session_id | string | 使用 SourceHello 中的 session_id |
| source_did | string | 发送者 DID（DestinationHello 的发送者） |
| destination_did | string | 接收者 DID（SourceHello 的发送者） |
| random | string | 32 位随机字符串 |
| selected_version | string | 选定的协议版本（单数） |
| cipher_suite | string | 选定的加密套件（单数） |
| key_share | object | 选定的密钥交换信息（单数） |
| verification_method | object | 发送者 DID 对应的公钥 |
| proof | object | 消息签名 |

**content 示例（JSON 序列化前）：**

```json
{
  "e2ee_type": "destination_hello",
  "version": "1.0",
  "session_id": "abc123session",
  "source_did": "did:wba:example.com:user:bob",
  "destination_did": "did:wba:example.com:user:alice",
  "random": "e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6",
  "selected_version": "1.0",
  "cipher_suite": "TLS_AES_128_GCM_SHA256",
  "key_share": {
    "group": "secp256r1",
    "expires": 86400,
    "key_exchange": "04b56c..."
  },
  "verification_method": {
    "id": "did:wba:example.com:user:bob#keys-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "public_key_hex": "04b56c..."
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:52:00Z",
    "verification_method": "did:wba:example.com:user:bob#keys-1",
    "proof_value": "eyJhbGci..."
  }
}
```

#### 8.3.3 Finished

握手完成确认消息，用于防止重放攻击。

**字段定义：**

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 ID，使用 SourceHello 中的 session_id |
| verify_data | object | 验证数据（AES-GCM 加密） |

**verify_data 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| iv | string | 初始化向量（Base64 编码） |
| tag | string | 认证标签（Base64 编码） |
| ciphertext | string | 加密数据（Base64 编码），明文为 `{"secretKeyId":"..."}` |

**content 示例（JSON 序列化前）：**

```json
{
  "session_id": "abc123session",
  "verify_data": {
    "iv": "dGVzdGl2MTIzNDU2",
    "tag": "dGVzdHRhZzEyMzQ1Njc4",
    "ciphertext": "ZW5jcnlwdGVkZGF0YQ=="
  }
}
```

#### 8.3.4 加密消息

使用协商的短期密钥加密的消息。

**字段定义：**

| 字段 | 类型 | 说明 |
|------|------|------|
| secret_key_id | string | 短期加密密钥 ID（16 个十六进制字符） |
| original_type | string | 原始消息类型（如 `text`、`image`） |
| encrypted | object | AES-GCM 加密数据 |

**encrypted 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| iv | string | 初始化向量（Base64 编码） |
| tag | string | 认证标签（Base64 编码） |
| ciphertext | string | 加密密文（Base64 编码） |

**content 示例（JSON 序列化前）：**

```json
{
  "secret_key_id": "0123456789abcdef",
  "original_type": "text",
  "encrypted": {
    "iv": "dGVzdGl2MTIzNDU2",
    "tag": "dGVzdHRhZzEyMzQ1Njc4",
    "ciphertext": "ZW5jcnlwdGVkbWVzc2FnZQ=="
  }
}
```

**send 请求示例：**

```json
{
  "jsonrpc": "2.0",
  "method": "send",
  "params": {
    "sender_did": "did:wba:example.com:user:alice",
    "receiver_did": "did:wba:example.com:user:bob",
    "content": "{\"secret_key_id\":\"0123456789abcdef\",\"original_type\":\"text\",\"encrypted\":{\"iv\":\"...\",\"tag\":\"...\",\"ciphertext\":\"...\"}}",
    "type": "e2ee"
  },
  "id": 1
}
```

#### 8.3.5 E2EE 错误消息

当密钥过期或未找到时，通知对方重新发起密钥协商。

**字段定义：**

| 字段 | 类型 | 说明 |
|------|------|------|
| error_code | string | 错误类型：`key_expired`（密钥过期）或 `key_not_found`（密钥未找到） |
| secret_key_id | string | 相关的密钥 ID |

**content 示例（JSON 序列化前）：**

```json
{
  "error_code": "key_expired",
  "secret_key_id": "0123456789abcdef"
}
```

### 8.4 密钥协商过程

密钥协商过程基于 ECDHE（Elliptic Curve Diffie-Hellman Ephemeral），与 TLS 1.3 中交换加密密钥的过程基本类似。

**支持的加密参数：**

| 参数 | 当前支持值 |
|------|-----------|
| 密码套件 | `TLS_AES_128_GCM_SHA256` |
| 椭圆曲线 | `secp256r1` |

#### 8.4.1 共享密钥生成

1. **获取对方公钥**：从对方 Hello 消息的 `key_shares`/`key_share` 中的 `key_exchange` 字段提取椭圆曲线公钥（十六进制格式）。
2. **生成共享秘密**：使用本地私钥和对方公钥，通过 ECDH 算法生成共享秘密。
3. **确定密钥长度**：根据密码套件确定密钥长度（`TLS_AES_128_GCM_SHA256` 对应 128 位 / 16 字节）。

#### 8.4.2 短期加密密钥生成

使用 HKDF（HMAC-based Extract-and-Expand Key Derivation Function）从共享秘密派生实际加密密钥：

```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF, HKDFExpand
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

hash_algorithm = hashes.SHA256()
backend = default_backend()

# 1. HKDF 提取阶段：从共享秘密提取伪随机密钥
hkdf_extract = HKDF(
    algorithm=hash_algorithm,
    length=hash_algorithm.digest_size,
    salt=b'\x00' * hash_algorithm.digest_size,
    info=b'',
    backend=backend
)
extracted_key = hkdf_extract.derive(shared_secret)

# 2. 生成握手流量密钥
def derive_secret(secret: bytes, label: bytes, messages: bytes) -> bytes:
    hkdf_expand = HKDFExpand(
        algorithm=hash_algorithm,
        length=hash_algorithm.digest_size,
        info=hkdf_label(hash_algorithm.digest_size, label, messages),
        backend=backend
    )
    return hkdf_expand.derive(secret)

source_hello_random = source_hello["random"].encode('utf-8')
destination_hello_random = destination_hello["random"].encode('utf-8')

source_data_traffic_secret = derive_secret(
    extracted_key, b"s ap traffic",
    source_hello_random + destination_hello_random
)
destination_data_traffic_secret = derive_secret(
    extracted_key, b"d ap traffic",
    source_hello_random + destination_hello_random
)

# 3. 扩展生成实际加密密钥
source_data_key = HKDF(
    algorithm=hash_algorithm,
    length=key_length,  # 16 字节 (AES-128)
    salt=None,
    info=hkdf_label(32, b"key", source_data_traffic_secret),
    backend=backend
).derive(source_data_traffic_secret)

destination_data_key = HKDF(
    algorithm=hash_algorithm,
    length=key_length,
    salt=None,
    info=hkdf_label(32, b"key", destination_data_traffic_secret),
    backend=backend
).derive(destination_data_traffic_secret)
```

其中 `source_data_key` 为发起方加密密钥，`destination_data_key` 为接收方加密密钥。Source 发送消息时使用 `source_data_key` 加密，Destination 使用 `source_data_key` 解密；反之亦然。

#### 8.4.3 secretKeyId 生成方法

`secret_key_id` 是 Source 和 Destination 之间的短期加密密钥 ID，用于标识消息使用哪个密钥加密。密钥 ID 仅在密钥有效期内有效。

生成步骤：

1. 将 SourceHello 和 DestinationHello 中的 `random` 字段拼接（SourceHello 在前，DestinationHello 在后，无连接符）
2. 将拼接字符串使用 UTF-8 编码转换为字节序列
3. 使用 HKDF 派生 8 字节
4. 将 8 字节编码为 16 个十六进制字符

```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

def generate_secret_key_id(source_random: str, destination_random: str) -> str:
    content = source_random + destination_random
    random_bytes = content.encode('utf-8')

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=8,  # 生成 8 字节
        salt=None,
        info=b'',
        backend=default_backend()
    )

    derived_key = hkdf.derive(random_bytes)
    return derived_key.hex()  # 16 个十六进制字符
```

#### 8.4.4 AES-GCM 加密/解密

使用 `TLS_AES_128_GCM_SHA256` 进行消息加密：

```python
import os
import base64
from typing import Dict
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def encrypt_aes_gcm(data: bytes, key: bytes) -> Dict[str, str]:
    """AES-128-GCM 加密"""
    if len(key) != 16:
        raise ValueError("Key must be 128 bits (16 bytes).")

    iv = os.urandom(12)  # GCM 推荐 12 字节 IV

    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()

    ciphertext = encryptor.update(data) + encryptor.finalize()
    tag = encryptor.tag

    return {
        "iv": base64.b64encode(iv).decode('utf-8'),
        "tag": base64.b64encode(tag).decode('utf-8'),
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8')
    }
```

### 8.5 签名与验证

#### 8.5.1 proofValue 生成过程

SourceHello 和 DestinationHello 消息都需要签名以确保消息完整性和身份验证。

**生成步骤：**

1. 构造消息的所有字段，`proof` 中的 `proof_value` 字段除外
2. 将待签名的 JSON 转换为 JSON 字符串，使用逗号和冒号作为分隔符，并**按键排序**
3. 将 JSON 字符串编码为 UTF-8 字节
4. 使用 ECDSA + SHA-256 算法签名
5. 将签名值 Base64URL 编码后写入 `proof_value` 字段

```python
import json
import base64

# 1. 构造消息，排除 proof_value 字段
msg = {
    "e2ee_type": "source_hello",
    # ... 其他字段
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verification_method": "did:wba:example.com:user:alice#keys-1"
        # proof_value 除外
    }
}

# 2. 转换为排序的 JSON 字符串
msg_str = json.dumps(msg, separators=(',', ':'), sort_keys=True)

# 3. 编码为 UTF-8 字节
msg_bytes = msg_str.encode('utf-8')

# 4. 使用 ECDSA + SHA-256 签名
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec

signature = private_key.sign(msg_bytes, ec.ECDSA(hashes.SHA256()))

# 5. Base64URL 编码
msg["proof"]["proof_value"] = base64.urlsafe_b64encode(signature).decode('utf-8')
```

#### 8.5.2 验证 SourceHello/DestinationHello 消息

1. **解析消息**：提取各个字段。
2. **验证 DID 与公钥**：读取 `source_did` 和 `verification_method` 中的公钥，使用 DID 方法规范中的 DID 生成方法，用公钥生成 DID，确认是否与 `source_did` 一致。
3. **验证签名**：使用 `source_did` 对应的公钥，验证 `proof` 字段的签名是否正确。
4. **验证其他字段**：检查 `random` 字段的随机性，防止重放攻击；检查 `proof` 的 `created` 字段，确保签名时间未过期。

## 9. 安全性考虑

### 9.1 传输安全

所有 API 端点应使用 HTTPS 协议，确保通信过程中数据的加密传输和完整性。

### 9.2 身份认证安全

身份认证遵循 ANP DID WBA 认证机制。有关基于 DID 的身份认证安全详细说明，请参见 [DID:WBA 方法设计规范](03-did-wba-method-design-specification.md)。已认证用户发送消息时，服务端校验 `sender_did` 与认证身份的一致性。

### 9.3 E2EE 安全

- **服务端透明转发**：E2EE 消息的 `content` 字段对服务端不透明，服务端无法读取加密内容。
- **前向安全性**：使用 ECDHE 临时密钥交换，每次会话生成新的密钥对，即使长期密钥泄露，过去的通信也无法被解密。
- **密钥有效期**：短期密钥有明确的有效期，过期后必须重新协商。

### 9.4 防重放攻击

- **random 字段**：SourceHello 和 DestinationHello 中的 `random` 字段确保每次握手的唯一性。
- **secretKeyId 校验**：Finished 消息中包含 `secret_key_id`，用于验证密钥协商的完整性。
- **时间戳校验**：`proof` 中的 `created` 字段用于检查签名时间是否在合理范围内。

## 10. 局限性

### 10.1 E2EE 仅限私聊

当前 E2EE 方案仅支持两个 Agent 之间的一对一加密通信，不支持群聊场景下的端到端加密。群聊消息通过服务端明文转发。未来可能引入群组 E2EE 方案（如 MLS 协议）。

### 10.2 大文件传输效率

消息内容通过 JSON 的 `content` 字段传输，对于大文件（如视频）的传输效率不高。建议在 `content` 中传递文件的 URL 和解密密钥，接收者通过 HTTPS 等协议单独下载文件。

## 11. 总结与展望

本规范定义了基于 HTTP + JSON-RPC 2.0 的即时消息协议，以 `did:wba` 为身份标识，支持私聊、群聊和端到端加密通信。通过与智能体描述协议的集成，智能体可以以标准化方式声明其 E2EE IM 能力，实现自动发现和互操作。相比原有的 WebSocket 方案，本协议具有更好的简单性、兼容性和可扩展性。

未来的工作方向包括：

1. **群组 E2EE**：探索群聊场景下的端到端加密方案
2. **离线消息**：完善离线消息的推送和同步机制
3. **消息类型扩展**：支持更丰富的消息类型（如音视频通话信令）
4. **跨服务器互通**：定义 Message Server 之间的联邦协议

## 参考文献

- [RFC 7159] The JavaScript Object Notation (JSON) Data Interchange Format
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [ANP 技术白皮书](01-agentnetworkprotocol-technical-white-paper.md)
- [DID:WBA 方法设计规范](03-did-wba-method-design-specification.md)
- [04-基于DID的端到端加密通信技术协议](chinese/message/04-基于did的端到端加密通信技术协议.md)
- [05-基于DID的消息服务协议](chinese/message/05-基于did的消息服务协议.md)

## 版权声明

Copyright (c) 2024 GaoWei Chang
本文件依据 [MIT 许可证](LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
