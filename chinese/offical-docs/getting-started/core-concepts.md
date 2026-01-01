# ANP 核心概念

本页面介绍 ANP 协议的核心概念，帮助你快速理解协议的设计理念和关键组件。

## 去中心化身份 (Decentralized Identity)

### DID (Decentralized Identifier)

ANP 使用 `did:wba` 方法提供去中心化身份：

```
did:wba:{domain}:{path}
```

**示例**:
```
did:wba:example.com:service:hotel-assistant
```

### 核心特性

- **自主控制**: 智能体拥有并控制自己的身份
- **无需中心化**: 不依赖中心化认证机构
- **可验证**: 基于公钥密码学验证身份

### DID 文档

DID 文档包含智能体的公钥和认证信息：

```json
{
  "id": "did:wba:example.com:service:hotel-assistant",
  "verificationMethod": [{
    "id": "did:wba:example.com:service:hotel-assistant#key-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "controller": "did:wba:example.com:service:hotel-assistant",
    "publicKeyJwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  }],
  "authentication": ["did:wba:example.com:service:hotel-assistant#key-1"]
}
```

## 智能体描述 (Agent Description)

### AD 文档

智能体描述文档 (AD) 是访问智能体的入口，包含：

- **基本信息**: 名称、描述、所有者
- **接口定义**: 支持的协议和方法
- **安全配置**: 认证要求和权限

### 最小 AD 示例

```json
{
  "type": "AgentDescription",
  "protocolType": "ANP",
  "did": "did:wba:example.com:service:hotel-assistant",
  "name": "Hotel Assistant",
  "interfaces": [{
    "type": "StructuredInterface",
    "protocol": "json-rpc",
    "url": "https://example.com/api"
  }],
  "securityDefinitions": {
    "didwba_auth": {"scheme": "didwba"}
  },
  "security": [{"didwba_auth": []}]
}
```

### 接口类型

ANP 支持两种接口类型：

1. **结构化接口 (StructuredInterface)**
   - 基于 OpenRPC、JSON-RPC 等标准协议
   - 适合明确定义的 API 操作
   - 易于验证和测试

2. **自然语言接口 (NaturalLanguageInterface)**
   - 支持自然语言交互
   - 适合灵活的对话场景
   - 基于 LLM 理解和生成

## 身份认证 (Authentication)

### 请求签名流程

1. **构造签名输入**:
```json
{
  "nonce": "unique-random-string",
  "timestamp": "2024-12-27T09:00:00Z",
  "did": "did:wba:client.com:user:alice",
  "service": "https://example.com/api"
}
```

2. **JCS 规范化** → **SHA-256 哈希** → **私钥签名** → **Base64URL 编码**

3. **添加到请求头**:
```
Authorization: DIDWba did="did:wba:client.com:user:alice",
  nonce="unique-random-string",
  timestamp="2024-12-27T09:00:00Z",
  verification_method="key-1",
  signature="..."
```

### 服务端验证

服务端**必须 (MUST)** 验证：

1. **时间戳**: 在合理时间窗口内（建议60秒）
2. **Nonce**: 唯一且未被使用
3. **签名**: 使用公钥验证签名有效性
4. **权限**: DID 具备访问权限

## 智能体发现 (Agent Discovery)

### .well-known 机制

智能体通过标准化的 `.well-known` 端点被发现：

```
https://example.com/.well-known/agent-descriptions
```

**响应格式** (JSON-LD CollectionPage):

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [{
    "@type": "ad:AgentDescription",
    "name": "Hotel Assistant",
    "@id": "https://example.com/agents/hotel/ad.json"
  }]
}
```

### 发现流程

```
1. 客户端请求 /.well-known/agent-descriptions
   ↓
2. 获取 AD URL 列表
   ↓
3. 拉取每个 AD 文档
   ↓
4. 解析接口和安全配置
   ↓
5. 建立认证连接
```

## 支付协议 (Payment Protocol)

### 凭证链

AP2 支付协议基于凭证链确保完整性：

```
CartMandate (商户签名)
   ↓
PaymentMandate (用户签名, 引用 cart_hash)
   ↓
PaymentReceipt (商户签名, 引用 pmt_hash)
```

### 凭证类型

1. **CartMandate (购物车凭证)**
   - 商户创建并签名
   - 包含商品信息和金额
   - 通过二维码提供给用户

2. **PaymentMandate (支付凭证)**
   - 用户确认并签名
   - 引用 CartMandate 哈希
   - 提交给商户

3. **PaymentReceipt (支付凭据)**
   - 支付成功后商户签名
   - 引用 PaymentMandate 哈希
   - 通过 Webhook 发送给用户

## 安全模型

### 零信任架构 (Zero Trust)

ANP 假设所有通信都可能被攻击：

- **必须认证**: 所有敏感接口必须经过身份认证
- **必须加密**: 所有数据通过 HTTPS 传输
- **必须验签**: 所有凭证必须验证签名

### 重放防护

通过三重机制防止重放攻击：

1. **Nonce**: 每个请求包含唯一随机值
2. **Timestamp**: 请求在时间窗口内有效
3. **JTI**: JWT 凭证包含唯一标识

### 最小披露原则

- AD 文档仅公开必要信息
- 敏感操作需要人类授权 (`humanAuthorization`)
- 用户数据受访问控制保护

## 协议层次

ANP 采用三层架构设计：

### 1. 身份与加密通信层

- `did:wba` 身份认证
- 请求签名与验证
- 端到端加密通信

### 2. 元协议层

- 协议协商机制
- 自组织与自适配
- 动态协议选择

### 3. 应用协议层

- 智能体描述协议 (ADP)
- 智能体发现协议
- 智能体支付协议 (AP2)

## 术语表

| 术语 | 英文 | 说明 |
| --- | --- | --- |
| DID | Decentralized Identifier | 去中心化标识符 |
| AD | Agent Description | 智能体描述文档 |
| ADP | Agent Description Protocol | 智能体描述协议 |
| AP2 | Agent Payment Protocol v2 | 智能体支付协议第2版 |
| JCS | JSON Canonicalization Scheme | JSON 规范化方案 |
| JWS | JSON Web Signature | JSON Web 签名 |
| Nonce | Number used once | 一次性随机数 |
| JTI | JWT ID | JWT 唯一标识符 |

## RFC 2119 关键词

ANP 规范使用 RFC 2119 标准关键词：

- **必须 (MUST)**: 绝对要求，违反将导致协议不兼容
- **应该 (SHOULD)**: 强烈建议，除非有充分理由否则应遵循
- **可以 (MAY)**: 完全可选，实现者可自行决定
- **不得 (MUST NOT)**: 绝对禁止
- **不应 (SHOULD NOT)**: 强烈不建议

## 下一步

理解了核心概念后，你可以：

1. [**开始开发**](../develop-with-anp/) - 使用 SDK 构建 ANP 智能体
2. [**深入架构**](../about-anp/architecture.md) - 了解协议的详细设计
3. [**查看示例**](../examples/) - 学习最佳实践

## 参考资源

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [RFC 2119: Key words for RFCs](https://www.rfc-editor.org/rfc/rfc2119)
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [OpenRPC Specification](https://open-rpc.org/)
