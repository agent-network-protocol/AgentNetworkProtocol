# ANP 常见问题 (FAQ)

## 基础问题

### ANP 是什么?

ANP (Agent Network Protocol) 是面向智能体互联的开放通信协议。它为智能体之间的通信提供标准化的身份认证、能力描述、服务发现和交易机制。

### ANP 与传统 API 有什么区别?

| 特性 | 传统 API | ANP |
| --- | --- | --- |
| 设计目标 | 人机交互 | 智能体间通信 |
| 身份认证 | OAuth/API Key | 去中心化 DID |
| 能力发现 | 手动查阅文档 | 自描述 + 自发现 |
| 接口类型 | 仅结构化接口 | 结构化 + 自然语言 |

### ANP 需要区块链吗?

不需要。ANP 基于现有的 Web 基础设施（HTTPS、DNS、Webhook），不依赖区块链。`did:wba` 身份方法使用域名和公钥密码学，无需区块链。

### ANP 有代币吗?

**没有**。ANP 是一个开源协议，**不发行任何代币或数字货币**。任何声称 ANP 官方代币的都是诈骗。

## 技术问题

### 如何开始使用 ANP?

1. 阅读[快速上手指南](../getting-started/quickstart.md)
2. 使用[TypeScript SDK](../develop-with-anp/sdk/typescript-sdk.md)
3. 运行[基础示例](../examples/basic-agent/)
4. 参考[完整文档](../README.md)

### did:wba 与 did:web 有什么区别?

| 特性 | did:wba | did:web |
| --- | --- | --- |
| 设计目标 | 智能体身份 | Web 服务身份 |
| DID 格式 | `did:wba:domain:path` | `did:web:domain:path` |
| 文档位置 | `.well-known/did.json` | `.well-known/did.json` |
| 特殊功能 | 智能体发现集成 | 通用 Web 服务 |

两者非常相似，`did:wba` 是针对智能体场景的优化版本。

### ANP 支持哪些编程语言?

目前官方提供：
- **TypeScript SDK**: [agent-network-protocol/anp](https://github.com/agent-network-protocol/anp)
- **Python SDK**: 开发中

社区贡献的 SDK：
- 欢迎贡献其他语言的实现！

### 如何实现认证?

ANP 使用 `did:wba` 进行身份认证：

1. 客户端生成签名：
```typescript
const authHeader = await createAuthorizationHeader({
  did: 'did:wba:client.com:user:alice',
  service: 'https://server.com/api',
  keyPair: clientKeyPair
});
```

2. 服务端验证签名：
```typescript
const isValid = await verifyDIDWbaAuth(authHeader, {
  expectedService: 'https://server.com/api'
});
```

详见[身份认证文档](../develop-with-anp/identity/authentication.md)。

### 如何防止重放攻击?

ANP 使用三重机制：

1. **Nonce**: 每个请求包含唯一随机值
2. **Timestamp**: 请求在时间窗口内有效（建议60秒）
3. **JTI**: JWT 凭证包含唯一标识

服务端**必须 (MUST)** 缓存 nonce/jti 并拒绝重复请求。

### 支持哪些支付方式?

AP2 支付协议支持多种支付方式：

- **二维码支付**: 支付宝、微信（M1 最小实现）
- **银行卡支付**: 通过支付网关（M2）
- **数字货币**: BTC、ETH 等（M3，可选）

详见[支付协议文档](../develop-with-anp/payment/overview.md)。

## 部署问题

### 需要 HTTPS 吗?

**是的**。所有 ANP 端点**必须 (MUST)** 使用 HTTPS：

- DID 文档
- Agent Description
- 发现入口 (`.well-known/agent-descriptions`)
- 所有 API 端点

这是确保安全的基本要求。

### 如何部署到生产环境?

基本步骤：

1. 配置 HTTPS 证书
2. 设置反向代理（Nginx/Caddy）
3. 使用进程管理器（PM2/systemd）
4. 配置日志和监控
5. 实施速率限制

详见[部署指南](../implementation/deployment.md)。

### 如何处理 nonce 缓存?

开发环境可使用内存缓存：

```typescript
const nonceCache = new Set<string>();
```

生产环境**应该 (SHOULD)** 使用 Redis：

```typescript
import Redis from 'ioredis';
const redis = new Redis();

// 缓存 nonce，120秒过期
await redis.set(`nonce:${nonce}`, '1', 'EX', 120);

// 检查是否已存在
const exists = await redis.exists(`nonce:${nonce}`);
```

### 时间戳验证总是失败怎么办?

可能的原因：

1. **服务器时钟不同步**
   - 解决：使用 NTP 同步时钟
   ```bash
   sudo ntpdate pool.ntp.org
   ```

2. **时间窗口设置过小**
   - 解决：增大时间窗口（建议60秒）

3. **时区错误**
   - 解决：使用 ISO 8601 UTC 格式

```typescript
const timestamp = new Date().toISOString(); // 正确
// const timestamp = new Date().toString();  // 错误
```

## 安全问题

### 私钥如何安全存储?

**不要** 直接存储私钥到文件！

生产环境**必须 (MUST)** 使用：

- **KMS** (Key Management Service): AWS KMS、Google Cloud KMS
- **HSM** (Hardware Security Module): 硬件安全模块
- **Vault**: HashiCorp Vault

开发环境可以使用加密文件存储：

```typescript
import { encrypt, decrypt } from 'some-encryption-lib';

// 加密存储
const encryptedKey = encrypt(privateKey, password);
fs.writeFileSync('key.enc', encryptedKey);

// 解密使用
const privateKey = decrypt(encryptedData, password);
```

### 如何防止 DID 文档被篡改?

1. **HTTPS**: DID 文档**必须 (MUST)** 通过 HTTPS 提供
2. **签名**: **应该 (SHOULD)** 对 DID 文档进行签名
3. **缓存验证**: **可以 (MAY)** 缓存 DID 文档并验证版本

```typescript
// 验证 DID 文档签名
const isValid = await verifyDIDDocumentSignature(didDocument);
if (!isValid) {
  throw new Error('DID document signature invalid');
}
```

### 如何防止金额篡改?

AP2 支付协议使用凭证链确保完整性：

1. 所有金额字段**必须 (MUST)** 包含在签名范围内
2. 商户**必须 (MUST)** 验证 PaymentMandate 中的金额与 CartMandate 一致
3. **不应 (SHOULD NOT)** 信任客户端提供的金额

```typescript
// 服务端验证金额
if (paymentMandate.amount !== cartMandate.total_amount) {
  throw new Error('Amount mismatch');
}
```

## 协议问题

### ANP 与 MCP (Model Context Protocol) 有什么关系?

ANP 和 MCP 是独立的协议：

- **MCP**: 模型上下文协议，用于 LLM 应用的工具调用
- **ANP**: 智能体网络协议，用于智能体之间的通信

ANP 可以与 MCP 配合使用，但不依赖 MCP。

### 是否必须实现所有协议?

不是。ANP 采用模块化设计：

**必须实现** (MUST):
- `did:wba` 身份认证
- Agent Description

**建议实现** (SHOULD):
- 发现协议 (`.well-known`)

**可选实现** (MAY):
- AP2 支付协议

### 可以使用其他 DID 方法吗?

可以，但**建议 (SHOULD)** 使用 `did:wba`：

- `did:wba` 是专为智能体设计的
- 与 ANP 其他组件集成良好
- 实现简单，无需额外基础设施

如果使用其他 DID 方法（如 `did:web`、`did:key`），需确保与 ANP 兼容。

### 支持 WebSocket 吗?

ANP 目前基于 HTTP/HTTPS，**可以 (MAY)** 扩展支持 WebSocket：

```json
{
  "interfaces": [{
    "type": "StructuredInterface",
    "protocol": "websocket",
    "url": "wss://example.com/ws"
  }]
}
```

但这不是 MVP 的一部分。

## 社区问题

### 如何贡献代码?

1. Fork 仓库
2. 创建特性分支
3. 提交更改
4. 开启 Pull Request

详见[贡献指南](./contributing.md)。

### 如何报告 bug?

在 [GitHub Issues](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues) 创建 Issue，提供：

- 清晰的问题描述
- 复现步骤
- 预期 vs 实际行为
- 环境信息

### 如何提出新功能?

1. 在 GitHub Issues 创建功能请求
2. 参与社区讨论
3. 如果被接受，可提交 Pull Request

### 在哪里讨论技术问题?

- **实时聊天**: [Discord 社区](https://discord.gg/agent-network-protocol)
- **深度讨论**: [GitHub Discussions](https://github.com/agent-network-protocol/AgentNetworkProtocol/discussions)
- **问题跟踪**: [GitHub Issues](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues)

## 许可证问题

### ANP 使用什么许可证?

[MIT 许可证](../../LICENSE)

### 可以在商业项目中使用吗?

**可以**。MIT 许可证允许：

- 商业使用
- 修改
- 分发
- 私有使用

但必须保留版权声明。

### 需要付费吗?

**不需要**。ANP 完全免费开源，没有任何费用。

## 其他问题

### 有官方培训或认证吗?

目前没有官方培训或认证计划。所有资源都在文档中免费提供。

### 有商业支持吗?

目前没有官方商业支持。可通过社区渠道获取帮助：

- [Discord 社区](https://discord.gg/agent-network-protocol)
- [GitHub Discussions](https://github.com/agent-network-protocol/AgentNetworkProtocol/discussions)

### 性能如何?

ANP 基于 HTTP/HTTPS，性能取决于：

- 网络延迟
- 服务器性能
- 签名验证开销

典型场景下：
- 签名验证: < 10ms
- DID 解析: < 100ms（带缓存）
- API 调用: 取决于网络

优化建议：
- 缓存 DID 文档
- 使用 CDN
- 实施速率限制

### 与 OAuth 2.0 相比如何?

| 特性 | OAuth 2.0 | ANP (did:wba) |
| --- | --- | --- |
| 身份模型 | 中心化 | 去中心化 |
| 适用场景 | 用户授权 | 智能体认证 |
| 复杂度 | 高（多种流程） | 低（单一流程） |
| 基础设施 | 需要授权服务器 | 仅需 DID 文档 |

---

**没有找到你的问题？**

- [查看完整文档](../README.md)
- [加入 Discord](https://discord.gg/agent-network-protocol)
- [提问 Issue](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues/new)
