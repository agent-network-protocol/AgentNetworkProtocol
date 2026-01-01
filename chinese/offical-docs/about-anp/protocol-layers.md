# ANP 协议层次

ANP 采用三层架构设计，每一层都有明确的职责和功能。

## 架构概览

```
┌─────────────────────────────────────────────────┐
│         应用协议层 (Application Layer)            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ ADP (描述)    │ │ 发现协议      │ │ AP2 (支付)││
│  └──────────────┘ └──────────────┘ └──────────┘│
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│          元协议层 (Meta Protocol Layer)          │
│         协议协商 | 自组织 | 自适配                │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│     身份与加密通信层 (Identity & Crypto Layer)    │
│      did:wba | 签名验证 | 端到端加密              │
└─────────────────────────────────────────────────┘
```

## 第一层：身份与加密通信层

### 核心功能

- **去中心化身份**: 基于 `did:wba` 方法
- **身份认证**: 请求签名与验证
- **端到端加密**: 保护通信内容

### 关键组件

#### 1. DID 标识

```
did:wba:{domain}:{path}
```

示例: `did:wba:example.com:service:hotel-assistant`

#### 2. 请求签名

```typescript
// 签名输入
const signInput = {
  nonce: "unique-random-value",
  timestamp: "2024-12-27T10:00:00Z",
  did: "did:wba:client.com:user:alice",
  service: "https://server.com/api"
};

// JCS 规范化 → SHA-256 → ES256 签名
const signature = await sign(signInput, privateKey);
```

#### 3. 认证头格式

```
Authorization: DIDWba did="...", nonce="...",
  timestamp="...", verification_method="key-1",
  signature="..."
```

### 安全保障

- **重放防护**: Nonce + Timestamp
- **完整性**: 数字签名
- **隐私**: 最小披露原则

### 了解更多

- [did:wba 身份系统](./identity-system.md)
- [认证实现](../develop-with-anp/identity/authentication.md)

## 第二层：元协议层

### 核心功能

- **协议协商**: 智能体之间协商使用的协议
- **自组织**: 动态组织和适配
- **自适配**: 根据能力选择最佳协议

### 协议协商机制

```
智能体 A                     智能体 B
   |                            |
   | 1. 发现 (获取 AD)          |
   |--------------------------->|
   |      AD (支持的协议列表)    |
   |<---------------------------|
   |                            |
   | 2. 协议协商                |
   |  - OpenRPC?               |
   |  - JSON-RPC?              |
   |  - 自然语言?               |
   |--------------------------->|
   |      选择: JSON-RPC        |
   |<---------------------------|
   |                            |
   | 3. 使用协商的协议通信       |
   |<=========================>|
```

### 协议选择策略

智能体根据以下因素选择协议：

1. **能力匹配**: 双方都支持的协议
2. **性能要求**: 延迟、吞吐量
3. **复杂度**: 任务复杂度与协议能力匹配
4. **成本**: 计算和网络成本

### 示例

```typescript
// 智能体 A 的能力
const agentA = {
  supports: ['openrpc', 'json-rpc', 'natural-language']
};

// 智能体 B 的能力
const agentB = {
  supports: ['json-rpc', 'rest']
};

// 协商结果：选择共同支持的 json-rpc
const negotiated = negotiate(agentA, agentB);
// → 'json-rpc'
```

### 了解更多

- [元协议规范](../../06-ANP-元协议规范.md) (待完成)

## 第三层：应用协议层

### 核心功能

- **智能体描述 (ADP)**: 描述智能体能力
- **智能体发现**: 发现和连接智能体
- **智能体支付 (AP2)**: 智能体间交易

### 1. 智能体描述协议 (ADP)

**用途**: 智能体自描述其能力和接口

**核心概念**:
- Agent Description (AD) 文档
- 接口类型（结构化 / 自然语言）
- 安全定义

**示例**:
```json
{
  "type": "AgentDescription",
  "protocolType": "ANP",
  "did": "did:wba:example.com:service:hotel",
  "interfaces": [{
    "type": "StructuredInterface",
    "protocol": "openrpc",
    "url": "https://example.com/openrpc.json"
  }]
}
```

**了解更多**: [ADP 概述](../develop-with-anp/agent-description/overview.md)

### 2. 智能体发现协议

**用途**: 发现域名下的所有智能体

**核心机制**:
- `.well-known/agent-descriptions` 标准端点
- JSON-LD CollectionPage 格式
- 分页支持

**流程**:
```
1. 请求 /.well-known/agent-descriptions
   ↓
2. 获取 AD URL 列表
   ↓
3. 拉取每个 AD 文档
   ↓
4. 解析接口定义
   ↓
5. 建立连接
```

**了解更多**: [发现协议概述](../develop-with-anp/discovery/overview.md)

### 3. 智能体支付协议 (AP2)

**用途**: 智能体之间的支付交易

**核心机制**:
- 凭证链: CartMandate → PaymentMandate → PaymentReceipt
- 哈希链完整性验证
- JWS 签名

**流程**:
```
商户 → 创建 CartMandate
       ↓
用户 → 签名 PaymentMandate
       ↓
商户 → 提交到支付提供商
       ↓
用户 → 完成支付
       ↓
商户 → 签名 PaymentReceipt
```

**了解更多**: [AP2 概述](../develop-with-anp/payment/overview.md)

## 层次交互

### 跨层协作

```
应用层发起请求
   ↓
元协议层协商协议
   ↓
身份层进行认证
   ↓
传输层加密通信
```

### 完整请求流程

```
1. [应用层] 客户端构造 JSON-RPC 请求
   ↓
2. [元协议层] 确认使用 JSON-RPC 协议
   ↓
3. [身份层] 生成 did:wba 认证签名
   ↓
4. [传输层] HTTPS 加密发送
   ↓
5. [身份层] 服务端验证签名
   ↓
6. [应用层] 处理业务逻辑
   ↓
7. [传输层] HTTPS 加密返回响应
```

## 设计原则

### 1. 分层独立

每一层可以独立演进和替换：

- 可以替换身份方法（如使用 did:web）
- 可以添加新的应用协议
- 元协议层可以支持新的协商机制

### 2. 向下兼容

上层协议变更不影响下层：

- 新增应用协议不需要修改身份层
- 元协议升级不影响 did:wba 实现

### 3. 协议复用

充分复用现有标准：

- **身份层**: W3C DID、JWS、JCS
- **元协议层**: JSON-LD
- **应用层**: OpenRPC、JSON-RPC、Schema.org

## 与其他协议栈的比较

### TCP/IP 模型

```
ANP 协议栈                 TCP/IP 协议栈
┌────────────────┐         ┌────────────────┐
│  应用协议层     │         │  应用层 (HTTP)  │
├────────────────┤         ├────────────────┤
│  元协议层       │         │  (无直接对应)   │
├────────────────┤         ├────────────────┤
│  身份加密层     │         │  传输层 (TCP)   │
└────────────────┘         ├────────────────┤
                          │  网络层 (IP)    │
                          └────────────────┘
```

### REST API

```
ANP                        REST API
┌────────────────┐         ┌────────────────┐
│  自描述 (AD)    │         │  手动文档       │
├────────────────┤         ├────────────────┤
│  自发现         │         │  手动配置       │
├────────────────┤         ├────────────────┤
│  去中心化身份   │         │  中心化 OAuth   │
└────────────────┘         └────────────────┘
```

## 扩展性

### 添加新的应用协议

1. 定义协议规范
2. 在 AD 文档中声明支持
3. 实现协议处理逻辑
4. 更新文档和示例

### 支持新的身份方法

1. 实现 DID 方法规范
2. 更新认证中间件
3. 保持与现有协议兼容

### 元协议演进

1. 定义新的协商机制
2. 向后兼容现有协议
3. 提供迁移指南

## 了解更多

- [架构总览](./architecture.md) - 完整架构说明
- [身份系统](./identity-system.md) - did:wba 详解
- [开发指南](../develop-with-anp/) - 实现各层协议

## 参考资源

- [ANP 技术白皮书](../../01-agentnetworkprotocol-technical-white-paper.md)
- [OSI 七层模型](https://en.wikipedia.org/wiki/OSI_model)
- [TCP/IP 协议栈](https://en.wikipedia.org/wiki/Internet_protocol_suite)
