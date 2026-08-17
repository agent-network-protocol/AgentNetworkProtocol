# DID:WBA 入门指南

## 什么是 DID？

DID（去中心化标识符，Decentralized Identifier）是一种新型的标识符，用于可验证的"自我主权"数字身份。与传统的中心化标识符不同，DID 完全由标识符的主体控制，独立于任何中心化注册表、身份提供商或证书颁发机构。

DID 具有以下关键特性：

- **持久性**：只要底层系统存在，标识符就可以持久存在
- **加密可验证**：使用密码学证明控制权
- **可解析**：通过 DID 可以发现更多信息
- **自我主权**：由标识符主体自行控制

## DID:WBA 简介

did:wba（Web-Based Agent）是一种基于 Web 的去中心化标识符方法，特别为满足跨平台身份认证和智能体通信的需求而设计。它在 did:web 基础上进行了扩展和优化，保留了兼容性的同时增强了针对智能体场景的适配性。

did:wba 的设计原则是既充分利用现有的成熟技术和完善的 Web 基础设施，又实现去中心化。它实现了类似 email 的特点，各个平台可以以中心化的方式实现自己的账户体系，同时各平台之间可以互联互通。

## DID:WBA 的格式

did:wba 的格式如下：

```
did:wba:<domain-name>[:<path>]
```

其中：
- `did:wba` 是固定前缀
- `<domain-name>` 是域名，需由 TLS/SSL 证书保护
- `[:<path>]` 是可选的路径部分，使用冒号（:）作为分隔符

示例：
- `did:wba:example.com` - 基本形式
- `did:wba:example.com:user:alice` - 带路径
- `did:wba:example.com%3A3000:user:alice` - 带端口（注意端口冒号需编码为 %3A）

## 如何使用 DID:WBA

### 创建 DID:WBA

创建 did:wba 标识符需要以下步骤：

1. **获取域名**：向域名注册商申请使用域名
2. **配置 DNS**：在 DNS 查询服务中存储托管服务的位置和 IP 地址
3. **创建 DID 文档**：创建符合规范的 DID 文档 JSON-LD 文件，包含验证方法和必要的密钥对
4. **发布 DID 文档**：将 DID 文档放置在正确的位置

DID 文档的存放位置取决于 DID 的形式：
- 对于 `did:wba:example.com`，DID 文档应位于 `https://example.com/.well-known/did.json`
- 对于 `did:wba:example.com:user:alice`，DID 文档应位于 `https://example.com/user/alice/did.json`
- 对于 `did:wba:example.com%3A3000:user:alice`，DID 文档应位于 `https://example.com:3000/user/alice/did.json`

### DID 文档结构

一个基本的 did:wba 文档应包含以下核心元素：

```json
{
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
      "https://w3id.org/security/suites/secp256k1-2019/v1"
    ],
    "id": "did:wba:example.com:user:alice",
    "verificationMethod": [
      {
        "id": "did:wba:example.com:user:alice#key-1",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:wba:example.com:user:alice",
        "publicKeyJwk": {
          "crv": "secp256k1",
          "x": "..."
          "y": "...",
          "kty": "EC",
          "kid": "..."
        }
      }
    ],
    "authentication": [
      "did:wba:example.com:user:alice#key-1"
    ]
}
```

重要字段说明：
- **@context**：必须字段，定义 DID 文档的语义
- **id**：必须字段，DID 标识符
- **verificationMethod**：必须字段，包含验证方法的数组
- **authentication**：必须字段，用于身份验证的验证方法列表

可选字段：
- **keyAgreement**：用于密钥协商的公钥信息
- **service**：与 DID 关联的服务列表，如智能体描述服务

> 注意：根据 [ANP-03 v1.1](/chinese/03-did-wba方法规范.md)，`did:wba` DID 文档不定义 `humanAuthorization` 验证关系。接口级的人类授权要求由 [ANP-07](/chinese/07-ANP-智能体描述协议规范.md) 中的 `humanAuthorization` 字段声明；基于 DID 的请求认证仍使用由 `authentication` 引用的验证方法。具体操作如何取得或证明人类授权，由适用的业务协议和授权策略定义。

### 解析 DID:WBA

解析 did:wba 文档的步骤：

1. 将方法特定标识符中的 ":" 替换为 "/" 获得域名和路径
2. 如果包含端口，对冒号进行百分比解码
3. 添加 "https://" 前缀
4. 如果未指定路径，附加 "/.well-known"
5. 附加 "/did.json" 完成 URL
6. 执行 HTTP GET 请求获取 DID 文档
7. 验证文档中的 ID 是否与请求的 DID 匹配

## 基于 DID:WBA 的跨平台身份认证

did:wba 提供了一个基于 HTTP 协议的流程，使服务端能够快速验证来自其他平台客户端的身份。

认证流程：

1. **初始请求**：客户端在 HTTP 请求头中携带 DID 和签名
   ```
   Authorization: DIDWba did="did:wba:example.com:user:alice", nonce="abc123", timestamp="2024-12-05T12:34:56Z", verification_method="key-1", signature="..."
   ```

2. **服务端验证**：
   - 验证时间戳是否在合理范围内
   - 验证 nonce 是否已被使用
   - 验证 DID 权限
   - 获取 DID 文档并验证签名

3. **签名验证过程**：
   - 服务端根据请求信息构建验证字符串
   - 使用 JCS 规范化字符串
   - 使用 SHA-256 算法生成哈希值
   - 根据 DID 文档获取公钥
   - 验证签名是否有效

4. **认证成功返回 access_token**：
   - 验证成功后返回 JWT 格式的 access_token
   - 客户端后续请求使用此 token

## 后续学习

要深入了解 did:wba，建议查阅以下资源：

1. [ANP 项目主页](https://github.com/agent-network-protocol/AgentNetworkProtocol)
2. [did:wba 方法规范](https://agent-network-protocol.com/chinese/03-did:wba方法规范.html)
3. [W3C DID 核心规范](https://www.w3.org/TR/did-core/)
4. [ANP 智能体描述协议规范](https://agent-network-protocol.com/chinese/07-ANP-智能体描述协议规范.html)

## 小结

did:wba 提供了一种基于 Web 的去中心化标识方案，特别适合智能体通信场景。它结合了中心化系统的便捷性和去中心化系统的互操作性，为智能体网络提供了可靠的身份标识和验证机制。通过 did:wba，不同平台的智能体可以安全地建立互信，实现跨平台通信和协作。
