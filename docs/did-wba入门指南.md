# DID:WBA 入门指南

- 规范集：ANP 1.2

本指南介绍 WBA 身份的创建、解析和请求认证。通用认证以 [ANP-02](../chinese/02-ANP-基于DID的身份认证协议.md) 为准，WBA 方法规则以 [ANP-03](../chinese/03-did-wba方法规范.md) 为准；本指南不是另一份规范。

## 什么是 DID？

DID（去中心化标识符，Decentralized Identifier）用于标识主体。DID Document 可以公开用于验证主体的公钥、验证方法和服务入口。具体身份材料的可信依据、解析与生命周期规则由 DID 方法定义，不能仅凭 DID 字符串推定控制权或业务权限。

## DID:WBA 简介

`did:wba`（Web-Based Agent）使用域名、HTTPS 和 DID Document 提供 Web 身份解析，并为默认路径型 DID 定义公钥指纹绑定、文档证明与身份连续性规则。部署可以自己托管身份文档，也可以使用身份服务商；私钥不应交给公开文档服务器保存。

ANP 1.2 将两类职责分开：**ANP-03 管 WBA 方法，ANP-02 管通用 HTTP/JSON 请求认证**。原生 `did:web` 可按 [Web 方法绑定与集成附录](../chinese/附录B：与原生did-web-的兼容.md) 使用同一套认证机制，无需转换为 WBA，也不能被要求满足 WBA 特有的根 proof 规则。

普通 API 认证不要求 WNS、消息 Profile 或 `deviceManifest`。消息和设备资格由各自 Profile 定义；规范存在不等于 SDK、服务或产品已经支持。

## DID:WBA 的格式

裸域名形式与默认路径型形式分别为：

```text
did:wba:example.com
did:wba:example.com:user:alice:e1_<fingerprint>
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
```

`<fingerprint>` 是占位符，真实值按 ANP-03 从 Ed25519 绑定公钥计算。`%3A3000` 表示端口；新建默认路径型 DID 的最后一段必须为 `e1_` 绑定指纹。`k1_` 属于[附录 A 的非默认兼容扩展](../chinese/附录A：did-wba-k1_兼容扩展.md)，不应与默认 E1 规则混用。

对应的文档地址为：

```text
https://example.com/.well-known/did.json
https://example.com/user/alice/e1_<fingerprint>/did.json
https://example.com:3000/user/alice/e1_<fingerprint>/did.json
```

## 如何创建 DID:WBA

1. 确定托管域名与主体路径，并在客户端安全生成和保存密钥。公开 DID Document 只含公钥，不含私钥或完整密钥对。
2. 对默认路径型 DID，按 ANP-03 计算 Ed25519 公钥指纹并构造完整 DID。为需要持续标识的主体分配不可回收、不可重新分配的稳定主体路径。
3. 构造 DID Document，声明验证方法及其 `authentication` 等用途；活动 E1 文档按 ANP-03 生成必需的 `DataIntegrityProof`。
4. 通过 HTTPS 发布到该 DID 对应地址，再验证解析、指纹、文档 proof 和密钥用途。

### DID Document 结构

以下只是默认 E1 文档的结构示意，指纹、公钥、时间和签名值均需替换为实际计算结果，不能作为密码学测试向量：

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
      "publicKeyMultibase": "z<ed25519-public-key>"
    }
  ],
  "authentication": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "assertionMethod": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2026-09-18T00:00:00Z",
    "verificationMethod": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z<signature>"
  }
}
```

`id` 必须与请求解析的 DID 匹配；`verificationMethod` 提供公开验证材料；`authentication` 授权请求认证密钥。`@context` 的有无与处理遵循 ANP-03 的 JSON/JSON-LD 规则，不是所有表示形式都强制带有它。活动 E1 文档必须满足其方法规定的 proof 和路径指纹验证。

`keyAgreement`、`service` 以及 `deviceManifest` 按所采用能力的规范要求声明，不能从上面的普通认证示例推定消息或 E2EE 支持。

`humanAuthorization` 不是 DID 验证关系。[ANP-07](../chinese/07-ANP-智能体描述协议规范.md) 的同名字段仅声明接口级人类授权要求；请求仍按 ANP-02 使用 `authentication` 授权的密钥。认证签名本身不证明人类已经批准该操作。

## 如何解析和验证

按 [ANP-03 方法规则](../chinese/03-did-wba方法规范.md#wba-method-rules) 从完整 DID 构造 HTTPS URL，正确处理路径和编码端口。除获取 JSON 之外，还应验证 TLS 服务身份、文档 `id`、密钥关系及适用的方法证明。

活动 E1 文档须验证 `eddsa-jcs-2022` proof，并用 `proof.verificationMethod` 对应公钥重算指纹，与 DID 末段比较。裸域名形式不要求 E1 路径指纹，但仍须满足方法及请求认证要求。

### 稳定主体路径与迁移

更换绑定密钥可以产生新 DID。相同稳定主体路径、`alsoKnownAs` 或 Handle 指向新 DID 都不能独立证明连续性。验证必须从此前可信的 DID 开始，按 ANP-03 校验迁移链与证明，再由业务策略决定权限、成员关系等是否延续。

停用 DID 不得继续用于新的认证；WBA 特定的 [HTTP 409 DID 已被替代响应](../chinese/03-did-wba方法规范.md#http-superseded) 及重试流程以 ANP-03 为准。

## 基于 ANP-02 的跨平台身份认证

当前 HTTP 请求认证使用 [ANP-02 HTTP 绑定](../chinese/02-ANP-基于DID的身份认证协议.md#http-binding)。签名由 `Signature-Input` 和 `Signature` 承载；存在消息体时，还要计算 `Content-Digest` 并将其纳入签名覆盖范围。

下面沿用规范的占位符风格说明请求形态，不是可直接发送的有效请求；时间须按实际请求生成，digest 和 signature 须根据真实请求计算：

```text
POST /orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Digest: sha-256=:BASE64_SHA256_DIGEST:
Signature-Input: sig1=("@method" "@target-uri" "@authority" "content-digest");created=1733402096;expires=1733402156;nonce="abc123";keyid="did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
Signature: sig1=:BASE64_SIGNATURE:
```

服务端验证步骤：

1. 检查请求头、签名覆盖范围及消息体摘要；从完整 DID URL `keyid` 得到主体 DID 与验证方法。
2. 按 WBA 方法解析、验证 DID Document，并确认所选密钥由 `authentication` 授权。
3. 按实际 HTTP 请求重建 RFC 9421 签名基串，使用对应算法验签。不能用旧的自定义 JCS 请求字符串替代此签名基串。
4. 执行时间窗口、挑战和重放保护，再独立检查业务权限。
5. 服务可按 [ANP-02 可选 Token 流程](../chinese/02-ANP-基于DID的身份认证协议.md#access-tokens) 返回 Access Token；JWT 是建议格式，不是所有实现的强制要求。

JSON 认证信息承载见 [ANP-02 第 4 章](../chinese/02-ANP-基于DID的身份认证协议.md#json-carriage)。消息原发者证明与 E2EE 对象证明仍由 P1 及所属消息 Profile 定义，不与普通 HTTP 签名混为一谈。

## 后续学习

1. 先读 [ANP-02：基于 DID 的身份认证](../chinese/02-ANP-基于DID的身份认证协议.md)。
2. 再读 [ANP-03：did:wba 方法规范](../chinese/03-did-wba方法规范.md)或[原生 did:web 集成附录](../chinese/附录B：与原生did-web-的兼容.md)。
3. 需要命名时阅读 [ANP-04：WNS](../chinese/04-ANP-基于DID-WBA的命名空间规范.md)；发布能力时阅读 [ANP-07](../chinese/07-ANP-智能体描述协议规范.md)。
4. 需要消息时从 [Messaging 1.2 索引](../chinese/message/README.md) 开始；完整概览见 [ANP 入门指南](chinese/ANP入门指南.md)。

## 小结

WBA 方法验证、通用请求认证和业务授权是不同层次。以 ANP-03 验证身份材料，以 ANP-02 验证请求，再以相应业务策略决定操作权限；不要从文档路径、名称或一次认证成功推定额外授权。
