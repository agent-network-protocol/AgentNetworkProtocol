# did:wba 身份系统概述

`did:wba` (Decentralized Identifier for Web-Based Agents) 是 ANP 采用的去中心化身份方法，基于 W3C DID 标准设计。

## 核心特性

### 1. 去中心化身份

- **自主控制**: 智能体完全拥有并控制自己的身份
- **无需中心化机构**: 不依赖第三方认证服务
- **基于域名**: 利用现有的 DNS 基础设施

### 2. 公钥密码学

- 使用 ES256 (ECDSA + P-256 + SHA-256) 签名算法
- 公钥存储在 DID 文档中
- 私钥由智能体安全保管

### 3. 可验证性

- 任何人都可以验证签名的真实性
- 通过 HTTPS 获取 DID 文档
- 支持密钥轮换和撤销

## DID 格式

```
did:wba:{domain}:{path}
```

### 组成部分

- **did**: 固定前缀，表示这是一个 DID
- **wba**: 方法名称，表示 Web-Based Agent
- **domain**: 智能体所在的域名
- **path**: 智能体的路径标识（可多层）

### 示例

```
did:wba:example.com:service:hotel-assistant
did:wba:api.company.com:agents:booking:v1
did:wba:myagent.ai:user:alice
```

## DID 文档

DID 文档包含智能体的公钥和认证信息，托管在智能体的域名下。

### 文档位置

DID 文档**必须 (MUST)** 可通过以下 URL 访问：

```
https://{domain}/.well-known/did.json
```

或者：

```
https://{domain}/{path}/did.json
```

### 最小文档结构

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
      "x": "WKn-ZIGevcwGIyyrzFoZNBdaq9_TsqzGl96oc0CWuis",
      "y": "y77t-RvAHRKTsSGdIYUfweuOvwrvDD-Q3Hv5J0fSKbE"
    }
  }],
  "authentication": [
    "did:wba:example.com:service:hotel-assistant#key-1"
  ]
}
```

### 字段说明

| 字段 | 要求级别 | 说明 |
| --- | --- | --- |
| id | **必须 MUST** | DID 标识符 |
| verificationMethod | **必须 MUST** | 验证方法列表，包含公钥 |
| verificationMethod[].id | **必须 MUST** | 验证方法的唯一标识（含 fragment） |
| verificationMethod[].type | **必须 MUST** | 公钥类型 |
| verificationMethod[].controller | **必须 MUST** | 控制者 DID |
| verificationMethod[].publicKeyJwk | **必须 MUST** | JWK 格式的公钥 |
| authentication | **必须 MUST** | 用于认证的验证方法列表 |

## 身份认证流程

### 1. 客户端生成签名

```
1. 构造签名输入（nonce, timestamp, did, service）
   ↓
2. JCS 规范化
   ↓
3. SHA-256 哈希
   ↓
4. ES256 签名
   ↓
5. Base64URL 编码
```

### 2. 添加到请求头

```
Authorization: DIDWba did="did:wba:client.com:user:alice",
  nonce="abc123",
  timestamp="2024-12-27T09:00:00Z",
  verification_method="key-1",
  signature="..."
```

### 3. 服务端验证

```
1. 解析 Authorization 头
   ↓
2. 验证 timestamp（时间窗口内）
   ↓
3. 验证 nonce（唯一且未使用）
   ↓
4. 获取 DID 文档
   ↓
5. 提取公钥
   ↓
6. 验证签名
   ↓
7. 检查访问权限
```

## 安全考虑

### 重放攻击防护

- **Nonce**: 每个请求包含唯一的随机值
- **Timestamp**: 请求在时间窗口内有效（建议60秒）
- **缓存**: 服务端缓存已用 nonce

### DID 文档安全

- **HTTPS**: DID 文档**必须 (MUST)** 通过 HTTPS 提供
- **签名**: **应该 (SHOULD)** 对 DID 文档进行签名
- **缓存验证**: **可以 (MAY)** 缓存 DID 文档并验证版本

### 私钥管理

- **安全存储**: 使用 KMS 或硬件安全模块
- **密钥轮换**: **应该 (SHOULD)** 支持定期轮换
- **泄露响应**: 检测到异常时立即撤销

## 与其他 DID 方法的比较

| 特性 | did:wba | did:web | did:key |
| --- | --- | --- | --- |
| 基础设施 | DNS + HTTPS | DNS + HTTPS | 无需基础设施 |
| 可解析性 | 通过域名解析 | 通过域名解析 | 公钥即 DID |
| 密钥轮换 | 支持 | 支持 | 不支持 |
| 适用场景 | 智能体身份 | Web 服务 | 临时身份 |

## 实现参考

- [身份认证详细说明](./authentication.md) - 完整的认证实现指南
- [DID 文档规范](./did-document.md) - DID 文档的详细规范
- [TypeScript SDK](../sdk/typescript-sdk.md) - 使用 SDK 实现 did:wba

## 参考规范

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [RFC 7515: JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515)
- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785)
- [完整 did:wba 规范](../../../03-did-wba方法规范.md)
