# ANP 快速上手指南

本指南将帮助你在 5 分钟内搭建一个最小可用的 ANP 智能体。

## 前置要求

- Node.js 16+ 或 Python 3.8+
- 基本的 HTTP 服务器知识
- 了解 JSON 格式

## 步骤 1: 生成 DID 身份

### 使用 TypeScript SDK

```bash
npm install @agent-network-protocol/anp
```

```typescript
import { generateDID, createDIDDocument } from '@agent-network-protocol/anp';

// 生成密钥对和 DID
const { did, keyPair } = await generateDID('example.com', 'service', 'my-agent');
// 输出: did:wba:example.com:service:my-agent

// 创建 DID 文档
const didDocument = createDIDDocument(did, keyPair.publicKey);
console.log(didDocument);
```

### 手动生成（Python 示例）

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import json

# 生成 ES256 密钥对
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# 导出公钥为 JWK 格式
public_jwk = {
    "kty": "EC",
    "crv": "P-256",
    "x": "...",  # Base64URL 编码的 x 坐标
    "y": "..."   # Base64URL 编码的 y 坐标
}

# 构造 DID 文档
did = "did:wba:example.com:service:my-agent"
did_document = {
    "id": did,
    "verificationMethod": [{
        "id": f"{did}#key-1",
        "type": "EcdsaSecp256r1VerificationKey2019",
        "controller": did,
        "publicKeyJwk": public_jwk
    }],
    "authentication": [f"{did}#key-1"]
}

# 保存到文件
with open("did.json", "w") as f:
    json.dump(did_document, f, indent=2)
```

## 步骤 2: 创建智能体描述文档 (AD)

在你的域名下创建 `ad.json` 文件：

```json
{
  "type": "AgentDescription",
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "did": "did:wba:example.com:service:my-agent",
  "name": "My First Agent",
  "description": "A simple ANP agent for demonstration",
  "owner": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "securityDefinitions": {
    "didwba_auth": {
      "scheme": "didwba",
      "description": "DID-based authentication using did:wba method"
    }
  },
  "security": [{"didwba_auth": []}],
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "json-rpc",
      "url": "https://example.com/api/rpc",
      "methods": ["greeting.hello"]
    }
  ]
}
```

将此文件托管在 `https://example.com/agents/my-agent/ad.json`

## 步骤 3: 实现认证接口

### TypeScript + Express 示例

```typescript
import express from 'express';
import { verifyDIDWbaAuth } from '@agent-network-protocol/anp';

const app = express();

app.post('/api/rpc', async (req, res) => {
  // 验证 Authorization 头
  const authHeader = req.headers.authorization;

  try {
    const verified = await verifyDIDWbaAuth(authHeader, {
      expectedService: 'https://example.com/api/rpc',
      timeWindow: 60 // 60秒时间窗口
    });

    // 处理 JSON-RPC 请求
    const { method, params } = req.body;

    if (method === 'greeting.hello') {
      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: { message: `Hello, ${verified.did}!` }
      });
    }
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.listen(3000);
```

## 步骤 4: 提供发现入口

在 `/.well-known/agent-descriptions` 提供发现入口：

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "My First Agent",
      "@id": "https://example.com/agents/my-agent/ad.json"
    }
  ]
}
```

## 步骤 5: 测试你的智能体

### 发送认证请求

使用 SDK 测试：

```typescript
import { createAuthHeader, callAgent } from '@agent-network-protocol/anp';

// 创建认证头
const authHeader = await createAuthHeader({
  did: 'did:wba:client.com:user:alice',
  service: 'https://example.com/api/rpc',
  keyPair: clientKeyPair
});

// 调用智能体
const response = await callAgent({
  url: 'https://example.com/api/rpc',
  method: 'greeting.hello',
  params: {},
  authHeader
});

console.log(response.result); // { message: "Hello, did:wba:client.com:user:alice!" }
```

### 验证发现入口

```bash
curl https://example.com/.well-known/agent-descriptions
```

应该返回包含你的智能体的 `CollectionPage` 响应。

## 最小实现清单

确保你的实现满足以下要求：

- [x] **DID 文档**：可通过 HTTPS 访问
- [x] **AD 文档**：包含必需字段（type, protocolType, did, interfaces）
- [x] **身份认证**：验证 `Authorization: DIDWba ...` 请求头
- [x] **签名验证**：验证请求签名的有效性
- [x] **时间戳校验**：验证 timestamp 在合理时间窗口内
- [x] **Nonce 去重**：缓存并拒绝重复的 nonce
- [x] **发现入口**：提供 `.well-known/agent-descriptions` 端点
- [x] **HTTPS**：所有端点使用 HTTPS

## 常见问题

### Q: 如何调试签名验证失败?

**A**: 检查以下步骤：
1. 确认使用 JCS 规范化 JSON
2. 验证 SHA-256 哈希结果
3. 确认公钥从正确的 `verificationMethod` 获取
4. 检查签名是否 Base64URL 编码

### Q: 时间戳总是验证失败怎么办?

**A**:
1. 使用 NTP 同步服务器时钟
2. 检查时间窗口设置（建议60秒）
3. 确认使用 ISO 8601 UTC 格式

### Q: 如何处理 nonce 缓存?

**A**:
- 使用 Redis 或内存缓存存储已用 nonce
- 缓存时长应大于时间窗口（建议120秒）
- 定期清理过期 nonce

## 下一步

恭喜! 你已经创建了第一个 ANP 智能体。接下来可以：

1. [**理解核心概念**](./core-concepts.md) - 深入了解 ANP 的设计理念
2. [**探索 SDK 文档**](../develop-with-anp/sdk/typescript-sdk.md) - 使用更多高级功能
3. [**实现支付协议**](../develop-with-anp/payment/overview.md) - 添加支付能力
4. [**查看完整示例**](../examples/basic-agent/) - 学习最佳实践

## 获取帮助

- **文档问题**: [GitHub Issues](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues)
- **SDK 问题**: [SDK Repository](https://github.com/agent-network-protocol/anp/issues)
- **社区讨论**: [Discord 社区](https://discord.gg/agent-network-protocol)

## 参考资源

- [身份认证详细说明](../develop-with-anp/identity/authentication.md)
- [智能体描述协议规范](../develop-with-anp/agent-description/ad-document.md)
- [安全最佳实践](../security/best-practices.md)
